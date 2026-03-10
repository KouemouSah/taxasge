"""Bundle Routes — API endpoints for service bundles and zone-based pricing.

Prefix: /api/v1/service-bundles
"""

from decimal import Decimal
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List, Optional
from uuid import UUID
from loguru import logger
import csv
import io

from app.database.connection import get_database
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import permission_required
from app.modules.fiscal_services.models.bundles import (
    CommerceZoneResponse,
    ServiceBundleCreate,
    ServiceBundleUpdate,
    ServiceBundleResponse,
    BundleItemCreate,
    BundleItemResponse,
    BundleWithItemsResponse,
    BundleListResponse,
    BundleDocumentItem,
    PricingMatrixResponse,
    ZoneTotalItem,
    CopyZonePricesRequest,
)
from app.modules.fiscal_services.services.bundle_service import BundleService

router = APIRouter(prefix="/service-bundles", tags=["Service Bundles"])


# ============================================================
# Public Endpoints (auth required)
# ============================================================

@router.get("/zones", response_model=List[CommerceZoneResponse])
async def list_zones(db=Depends(get_database)):
    """List all commerce zones (12 zones A1→D3)."""
    zones = await BundleService.list_zones(db)
    return [CommerceZoneResponse(**z) for z in zones]


@router.get("/", response_model=BundleListResponse)
async def list_bundles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    commerce_type: Optional[str] = Query(None, max_length=100),
    is_active: Optional[bool] = Query(None),
    db=Depends(get_database),
):
    """List service bundles with pagination and filters."""
    bundles, total = await BundleService.list_bundles(
        db, is_active=is_active, search=search,
        commerce_type=commerce_type, page=page, page_size=page_size,
    )
    return BundleListResponse(
        items=[ServiceBundleResponse(**b) for b in bundles],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{bundle_id}", response_model=ServiceBundleResponse)
async def get_bundle(bundle_id: UUID, db=Depends(get_database)):
    """Get a single bundle by ID."""
    bundle = await BundleService.get_bundle(db, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    return ServiceBundleResponse(**bundle)


@router.get("/{bundle_id}/pricing")
async def get_bundle_pricing(
    bundle_id: UUID,
    zone_id: UUID = Query(..., description="Zone ID for pricing"),
    db=Depends(get_database),
):
    """Get items + total for a bundle in a specific zone."""
    bundle = await BundleService.get_bundle(db, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")

    pricing = await BundleService.get_bundle_pricing(db, bundle_id, zone_id)
    return {
        "bundle": ServiceBundleResponse(**bundle).model_dump(),
        "items": [BundleItemResponse(**i).model_dump() for i in pricing["items"]],
        "total_amount": pricing["total_amount"],
        "currency": pricing["currency"],
        "installment_eligible": bundle.get("installment_eligible", False),
        "max_installments": bundle.get("max_installments", 1),
    }


@router.get("/{bundle_id}/matrix")
async def get_pricing_matrix(bundle_id: UUID, db=Depends(get_database)):
    """Get complete pricing matrix (all zones × all services)."""
    bundle = await BundleService.get_bundle(db, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")

    matrix = await BundleService.get_pricing_matrix(db, bundle_id)
    zones = await BundleService.list_zones(db)

    return {
        "bundle": ServiceBundleResponse(**bundle).model_dump(),
        "zones": [CommerceZoneResponse(**z).model_dump() for z in zones],
        "items": [BundleItemResponse(**i).model_dump() for i in matrix["items"]],
        "zone_totals": [
            {
                "zone": CommerceZoneResponse(**zt).model_dump(),
                "total_amount": str(zt["total_amount"]),
                "item_count": zt["item_count"],
            }
            for zt in matrix["zone_totals"]
        ],
        "currency": "XAF",
    }


@router.get("/{bundle_id}/documents", response_model=List[BundleDocumentItem])
async def get_bundle_documents(bundle_id: UUID, db=Depends(get_database)):
    """Get documents required by all services in the bundle."""
    bundle = await BundleService.get_bundle(db, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")

    docs = await BundleService.get_required_documents(db, bundle_id)
    return [BundleDocumentItem(**d) for d in docs]


@router.get("/{bundle_id}/installment-preview")
async def preview_installments(
    bundle_id: UUID,
    zone_id: UUID = Query(...),
    installments: int = Query(3, ge=1, le=12),
    db=Depends(get_database),
):
    """Preview installment payment plan for a bundle+zone."""
    result = await BundleService.preview_installments(
        db, bundle_id, zone_id, installments
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ============================================================
# Admin Endpoints (permission: fiscal_service.manage_bundles)
# ============================================================

@router.post("/admin/bundles", response_model=ServiceBundleResponse, status_code=201)
async def create_bundle(
    data: ServiceBundleCreate,
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _: None = Depends(permission_required("fiscal_service.manage_bundles")),
):
    """Create a new service bundle."""
    bundle = await BundleService.create_bundle(
        db, data.model_dump(), user_id=UUID(current_user["id"])
    )
    return ServiceBundleResponse(**bundle)


@router.put("/admin/bundles/{bundle_id}", response_model=ServiceBundleResponse)
async def update_bundle(
    bundle_id: UUID,
    data: ServiceBundleUpdate,
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _: None = Depends(permission_required("fiscal_service.manage_bundles")),
):
    """Update bundle metadata and installment config."""
    bundle = await BundleService.update_bundle(
        db, bundle_id, data.model_dump(exclude_unset=True),
        user_id=UUID(current_user["id"]),
    )
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    return ServiceBundleResponse(**bundle)


@router.delete("/admin/bundles/{bundle_id}", status_code=204)
async def delete_bundle(
    bundle_id: UUID,
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _: None = Depends(permission_required("fiscal_service.manage_bundles")),
):
    """Soft delete a bundle (set is_active=false)."""
    success = await BundleService.delete_bundle(db, bundle_id)
    if not success:
        raise HTTPException(status_code=404, detail="Bundle not found")


@router.post("/admin/bundles/{bundle_id}/items", response_model=Dict)
async def upsert_bundle_item(
    bundle_id: UUID,
    data: BundleItemCreate,
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _: None = Depends(permission_required("fiscal_service.manage_bundles")),
):
    """Add or update a bundle item (upsert on bundle+service+zone)."""
    bundle = await BundleService.get_bundle(db, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")

    item = await BundleService.upsert_item(db, bundle_id, data.model_dump())
    return item


@router.delete("/admin/items/{item_id}", status_code=204)
async def delete_bundle_item(
    item_id: UUID,
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _: None = Depends(permission_required("fiscal_service.manage_bundles")),
):
    """Delete a bundle item."""
    success = await BundleService.delete_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")


@router.post("/admin/bundles/{bundle_id}/copy-zone-prices")
async def copy_zone_prices(
    bundle_id: UUID,
    data: CopyZonePricesRequest,
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _: None = Depends(permission_required("fiscal_service.manage_bundles")),
):
    """Copy all item prices from one zone to another with optional multiplier."""
    bundle = await BundleService.get_bundle(db, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")

    count = await BundleService.copy_zone_prices(
        db, bundle_id, data.source_zone_id, data.target_zone_id, data.multiplier
    )
    return {"copied_items": count, "source_zone_id": str(data.source_zone_id),
            "target_zone_id": str(data.target_zone_id)}


@router.get("/admin/export/csv")
async def export_bundle_csv(
    bundle_id: UUID = Query(...),
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _: None = Depends(permission_required("fiscal_service.manage_bundles")),
):
    """Export pricing matrix as CSV for a bundle."""
    bundle = await BundleService.get_bundle(db, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")

    matrix = await BundleService.get_pricing_matrix(db, bundle_id)
    zones = await BundleService.list_zones(db)

    # Build CSV: Service Code | Service Name | Ministry | Zone1 | Zone2 | ...
    output = io.StringIO()
    writer = csv.writer(output)

    zone_codes = [z["zone_code"] for z in zones]
    header = ["Código Servicio", "Servicio", "Ministerio"] + zone_codes + ["Fijo"]
    writer.writerow(header)

    # Group items by service
    services = {}
    for item in matrix["items"]:
        key = item["fiscal_service_id"]
        if key not in services:
            services[key] = {
                "service_code": item.get("service_code", ""),
                "service_name": item.get("service_name", ""),
                "ministry_name": item.get("ministry_name", ""),
                "is_fixed": item.get("is_fixed_across_zones", False),
                "zones": {},
            }
        # Find zone code for this zone_id
        zone_code = next(
            (z["zone_code"] for z in zones if str(z["id"]) == str(item["zone_id"])),
            "?"
        )
        services[key]["zones"][zone_code] = str(item["amount"])

    for svc in services.values():
        row = [svc["service_code"], svc["service_name"], svc["ministry_name"]]
        for zc in zone_codes:
            row.append(svc["zones"].get(zc, "0"))
        row.append("Sí" if svc["is_fixed"] else "No")
        writer.writerow(row)

    # Totals row
    totals_row = ["", "TOTAL TESORO PÚBLICO", ""]
    zone_total_map = {
        str(zt.get("id", zt.get("zone_code", ""))): zt["total_amount"]
        for zt in matrix["zone_totals"]
    }
    for z in zones:
        totals_row.append(str(zone_total_map.get(str(z["id"]), 0)))
    totals_row.append("")
    writer.writerow(totals_row)

    output.seek(0)
    filename = f"bundle_{bundle['bundle_code']}_matrix.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
