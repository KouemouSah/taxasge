"""Inspection Routes — API endpoints for field inspections.

Prefix: /api/v1/inspections

11 endpoints for field agents + supervisor dashboard + cron.
"""

import logging
from typing import Optional
from uuid import UUID
from datetime import date

from fastapi import APIRouter, HTTPException, Depends, Query, Header

from app.database.connection import get_database
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.users.models.user import UserResponse
from app.modules.permissions.middleware.permission_middleware import (
    permission_required,
)
from app.modules.inspections.models.inspection import (
    InspectionCreate,
    InspectionUpdate,
    InspectionCompleteRequest,
    MiseEnDemeureRequest,
    SealProposeRequest,
    SealApproveRequest,
    FieldCollectRequest,
    InspectionResponse,
    InspectionListResponse,
    InspectionListItem,
    InspectionStats,
    SupervisorDashboardResponse,
    ReconciliationResponse,
    ReconciliationItem,
    LicenseVerificationResponse,
)
from app.modules.inspections.services.inspection_service import (
    InspectionService,
)
from app.modules.inspections.repositories.inspection_repository import (
    InspectionRepository,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/inspections", tags=["Field Inspections"])


def verify_cron_auth(x_cron_secret: Optional[str] = Header(None)):
    """Verify cron job authentication."""
    from app.core.secrets import get_cron_secret
    from app.config import get_settings

    settings = get_settings()
    expected = get_cron_secret() or getattr(settings, "CRON_SECRET", None)
    if expected and x_cron_secret != expected:
        raise HTTPException(status_code=403, detail="Invalid cron auth")


# ============================================================
# Static paths BEFORE /{id}
# ============================================================


@router.post("/", response_model=InspectionResponse, status_code=201)
async def create_inspection(
    data: InspectionCreate,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.create")),
):
    """Create a new field inspection for a commercial license."""
    try:
        async with db.transaction():
            result = await InspectionService.create_inspection(
                db, UUID(current_user.id),
                data.license_id, data.company_id,
                notes=data.notes,
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return InspectionResponse(**result)


@router.get("/", response_model=InspectionListResponse)
async def list_inspections(
    inspection_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.view_own")),
):
    """List agent's own inspections. Supervisors see entity-wide."""
    try:
        ctx = await InspectionService.resolve_inspector_context(
            db, UUID(current_user.id)
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    if ctx["is_supervisor"]:
        items, total = await InspectionRepository.list_by_entity(
            db, ctx["entity_id"],
            inspection_date=inspection_date,
            status=status,
            page=page, page_size=page_size,
        )
    else:
        items, total = await InspectionRepository.list_by_agent(
            db, UUID(current_user.id),
            inspection_date=inspection_date,
            status=status,
            page=page, page_size=page_size,
        )

    return InspectionListResponse(
        items=[InspectionListItem(**item) for item in items],
        total=total, page=page, page_size=page_size,
    )


@router.get("/stats", response_model=InspectionStats)
async def get_inspection_stats(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.view_own")),
):
    """Get inspection stats for current agent or entity."""
    try:
        ctx = await InspectionService.resolve_inspector_context(
            db, UUID(current_user.id)
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    if ctx["is_supervisor"]:
        stats = await InspectionRepository.get_stats(
            db, entity_id=ctx["entity_id"],
            date_from=date_from, date_to=date_to,
        )
    else:
        stats = await InspectionRepository.get_stats(
            db, agent_id=UUID(current_user.id),
            date_from=date_from, date_to=date_to,
        )

    return InspectionStats(**stats)


@router.get("/reconcile", response_model=ReconciliationResponse)
async def get_reconciliation(
    target_date: Optional[date] = Query(None),
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.collect_payment")),
):
    """Get agent's cash collections for reconciliation."""
    items, total_amount = await InspectionRepository.get_unreconciled_cash(
        db, UUID(current_user.id), target_date=target_date,
    )
    return ReconciliationResponse(
        items=[ReconciliationItem(**item) for item in items],
        total_amount=total_amount,
        total_count=len(items),
    )


@router.get("/verify")
async def verify_license(
    license_id: Optional[UUID] = Query(None),
    nif: Optional[str] = Query(None, max_length=20, description="NIF (GExxxxx) or registration number (PE-xxxxxx)"),
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.create")),
):
    """Verify a license for field inspection (by license_id, NIF, or registration number)."""
    try:
        result = await InspectionService.verify_license_for_agent(
            db, UUID(current_user.id),
            license_id=license_id, nif=nif,
        )
    except ValueError as e:
        err = str(e)
        if "not found" in err.lower():
            raise HTTPException(status_code=404, detail=err)
        raise HTTPException(status_code=422, detail=err)
    return result


@router.get("/supervisor/dashboard", response_model=SupervisorDashboardResponse)
async def get_supervisor_dashboard(
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.view_entity")),
):
    """Supervisor inspection dashboard with KPIs, alerts, pending seals."""
    try:
        result = await InspectionService.get_supervisor_dashboard(
            db, UUID(current_user.id),
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return SupervisorDashboardResponse(**result)


@router.post("/cron/auto-approve-seals")
async def cron_auto_approve_seals(
    db=Depends(get_database),
    _=Depends(verify_cron_auth),
):
    """Cron: auto-approve seals pending >24h. Run every 6h."""
    async with db.transaction():
        count = await InspectionService.auto_approve_expired_seals(db)
    return {"auto_approved": count}


# ============================================================
# Dynamic paths — /{id}
# ============================================================


@router.get("/{inspection_id}", response_model=InspectionResponse)
async def get_inspection(
    inspection_id: UUID,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.view_own")),
):
    """Get inspection detail — IDOR-protected (agent sees own, supervisor sees entity)."""
    inspection = await InspectionRepository.get_by_id(db, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    try:
        ctx = await InspectionService.resolve_inspector_context(
            db, UUID(current_user.id)
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    # IDOR: agent sees own, supervisor sees entity
    if not ctx["is_supervisor"] and inspection["agent_id"] != UUID(current_user.id):
        raise HTTPException(status_code=403, detail="Cannot view another agent's inspection")
    if ctx["is_supervisor"] and inspection["entity_id"] != ctx["entity_id"]:
        raise HTTPException(status_code=403, detail="Inspection belongs to another entity")

    return InspectionResponse(**inspection)


@router.put("/{inspection_id}", response_model=InspectionResponse)
async def update_inspection(
    inspection_id: UUID,
    data: InspectionUpdate,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.create")),
):
    """Update inspection during field work (photos, GPS, notes, activity)."""
    try:
        async with db.transaction():
            result = await InspectionService.update_inspection(
                db, inspection_id, UUID(current_user.id),
                data.model_dump(exclude_unset=True),
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return InspectionResponse(**result)


@router.post("/{inspection_id}/complete", response_model=InspectionResponse)
async def complete_inspection(
    inspection_id: UUID,
    data: InspectionCompleteRequest,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.create")),
):
    """Complete an inspection (mark as conforme/non_conforme)."""
    try:
        async with db.transaction():
            result = await InspectionService.complete_inspection(
                db, inspection_id, UUID(current_user.id),
                notes=data.notes,
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return InspectionResponse(**result)


@router.post("/{inspection_id}/mise-en-demeure", response_model=InspectionResponse)
async def issue_mise_en_demeure(
    inspection_id: UUID,
    data: MiseEnDemeureRequest,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.mise_en_demeure")),
):
    """Issue a formal notice (mise en demeure) with 72h deadline."""
    try:
        async with db.transaction():
            result = await InspectionService.issue_mise_en_demeure(
                db, inspection_id, UUID(current_user.id),
                obligation_ids=data.obligation_ids,
                deadline_hours=data.deadline_hours,
                notes=data.notes,
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return InspectionResponse(**result)


@router.post("/{inspection_id}/seal", response_model=InspectionResponse)
async def propose_seal(
    inspection_id: UUID,
    data: SealProposeRequest,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.seal_propose")),
):
    """Propose sealing a business (requires supervisor approval)."""
    try:
        async with db.transaction():
            result = await InspectionService.propose_seal(
                db, inspection_id, UUID(current_user.id),
                reason=data.reason.value,
                notes=data.notes,
                photo=data.photo,
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return InspectionResponse(**result)


@router.post("/{inspection_id}/seal/approve", response_model=InspectionResponse)
async def approve_seal(
    inspection_id: UUID,
    data: SealApproveRequest,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.seal_approve")),
):
    """Supervisor approves or rejects a seal proposal."""
    try:
        async with db.transaction():
            result = await InspectionService.approve_seal(
                db, inspection_id, UUID(current_user.id),
                approved=data.approved,
                notes=data.notes,
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return InspectionResponse(**result)


@router.post("/{inspection_id}/collect")
async def collect_payment(
    inspection_id: UUID,
    data: FieldCollectRequest,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.collect_payment")),
):
    """Collect field payment (cash or mobile money)."""
    from app.modules.inspections.services.collection_service import (
        CollectionService,
    )

    try:
        async with db.transaction():
            result = await CollectionService.collect_field_payment(
                db, inspection_id, UUID(current_user.id),
                obligation_ids=data.obligation_ids,
                method=data.method,
                amount=data.amount,
                phone_number=data.phone_number,
                notes=data.notes,
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result


# ============================================================
# PDF Downloads
# ============================================================


@router.get("/{inspection_id}/download-report")
async def download_inspection_report(
    inspection_id: UUID,
    language: str = Query("es", pattern="^(es|fr|en)$"),
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.view_own")),
):
    """Download inspection report as PDF."""
    from fastapi.responses import Response
    from app.modules.inspections.services.inspection_pdf_service import (
        inspection_pdf_service,
    )

    try:
        pdf_bytes = await inspection_pdf_service.generate_inspection_report(
            db, str(inspection_id), language,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="inspection-{inspection_id}.pdf"',
        },
    )


@router.get("/{inspection_id}/download-med")
async def download_med_pdf(
    inspection_id: UUID,
    language: str = Query("es", pattern="^(es|fr|en)$"),
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.mise_en_demeure")),
):
    """Download mise en demeure as PDF."""
    from fastapi.responses import Response
    from app.modules.inspections.services.inspection_pdf_service import (
        inspection_pdf_service,
    )

    try:
        pdf_bytes = await inspection_pdf_service.generate_med_pdf(
            db, str(inspection_id), language,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="med-{inspection_id}.pdf"',
        },
    )


@router.get("/{inspection_id}/download-seal")
async def download_seal_pdf(
    inspection_id: UUID,
    language: str = Query("es", pattern="^(es|fr|en)$"),
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.seal_approve")),
):
    """Download seal report (PV de scellé) as PDF."""
    from fastapi.responses import Response
    from app.modules.inspections.services.inspection_pdf_service import (
        inspection_pdf_service,
    )

    try:
        pdf_bytes = await inspection_pdf_service.generate_seal_pdf(
            db, str(inspection_id), language,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="seal-pv-{inspection_id}.pdf"',
        },
    )
