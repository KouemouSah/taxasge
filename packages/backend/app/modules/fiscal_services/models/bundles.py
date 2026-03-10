"""Service Bundles Models — Pydantic v2 models for commerce zone-based pricing."""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


# ============================================================
# Commerce Zones
# ============================================================

class CommerceZoneResponse(BaseModel):
    """Zone géographique pour tarification."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    zone_code: str
    zone_tier: str
    zone_rank: int
    name_es: str
    description_es: Optional[str] = None
    display_order: int


# ============================================================
# Service Bundles
# ============================================================

class ServiceBundleBase(BaseModel):
    """Base fields for service bundles."""
    bundle_code: str = Field(..., max_length=50)
    commerce_type: str = Field(..., max_length=100)
    name_es: str = Field(..., max_length=300)
    description_es: Optional[str] = None
    legal_reference: Optional[str] = None
    is_active: bool = True
    installment_eligible: bool = False
    max_installments: int = Field(default=1, ge=1, le=12)
    installment_frequency: str = Field(default="monthly")


class ServiceBundleCreate(ServiceBundleBase):
    """Create a new service bundle."""
    pass


class ServiceBundleUpdate(BaseModel):
    """Update an existing service bundle (all fields optional)."""
    bundle_code: Optional[str] = Field(None, max_length=50)
    commerce_type: Optional[str] = Field(None, max_length=100)
    name_es: Optional[str] = Field(None, max_length=300)
    description_es: Optional[str] = None
    legal_reference: Optional[str] = None
    is_active: Optional[bool] = None
    installment_eligible: Optional[bool] = None
    max_installments: Optional[int] = Field(None, ge=1, le=12)
    installment_frequency: Optional[str] = None


class ServiceBundleResponse(ServiceBundleBase):
    """Service bundle response with metadata."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    # Enriched fields (from queries)
    item_count: int = 0
    zone_count: int = 0


# ============================================================
# Bundle Items
# ============================================================

class BundleItemCreate(BaseModel):
    """Create/upsert a bundle item."""
    fiscal_service_id: int
    zone_id: UUID
    ministry_id: Optional[int] = None
    amount: Decimal = Field(..., ge=0)
    is_fixed_across_zones: bool = False
    display_order: int = 0
    notes: Optional[str] = None
    is_active: bool = True


class BundleItemResponse(BaseModel):
    """Bundle item with enriched service/ministry names."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    bundle_id: UUID
    fiscal_service_id: int
    zone_id: UUID
    ministry_id: Optional[int] = None
    amount: Decimal
    is_fixed_across_zones: bool
    display_order: int
    notes: Optional[str] = None
    is_active: bool
    # Enriched from JOINs
    service_code: Optional[str] = None
    service_name: Optional[str] = None
    ministry_name: Optional[str] = None


# ============================================================
# Bundle with Items (for a specific zone)
# ============================================================

class BundleWithItemsResponse(BaseModel):
    """Bundle detail for a specific zone, with items and total."""
    model_config = ConfigDict(from_attributes=True)

    bundle: ServiceBundleResponse
    zone: CommerceZoneResponse
    items: List[BundleItemResponse]
    total_amount: Decimal
    currency: str = "XAF"
    # Installment info
    installment_eligible: bool = False
    max_installments: int = 1
    installment_preview: Optional[List["InstallmentPreviewItem"]] = None


class InstallmentPreviewItem(BaseModel):
    """Single installment in a preview."""
    installment_number: int
    amount_due: Decimal
    due_date: str  # ISO date string
    cumulative_paid: Decimal


# ============================================================
# Pricing Matrix (all zones for a bundle)
# ============================================================

class ZoneTotalItem(BaseModel):
    """Total for a single zone in the matrix."""
    zone: CommerceZoneResponse
    total_amount: Decimal
    item_count: int


class PricingMatrixResponse(BaseModel):
    """Complete pricing matrix: all zones × all services for a bundle."""
    bundle: ServiceBundleResponse
    zones: List[CommerceZoneResponse]
    items: List[BundleItemResponse]  # All items across all zones
    zone_totals: List[ZoneTotalItem]
    currency: str = "XAF"


# ============================================================
# Bundle Documents (deduced from services)
# ============================================================

class BundleDocumentItem(BaseModel):
    """Document required by a bundle (deduced from service_document_assignments)."""
    document_template_id: int
    document_name_es: str
    template_code: Optional[str] = None
    is_required: bool = True


# ============================================================
# Paginated List
# ============================================================

class BundleListResponse(BaseModel):
    """Paginated list of bundles."""
    items: List[ServiceBundleResponse]
    total: int
    page: int
    page_size: int


# ============================================================
# Copy Zone Prices
# ============================================================

class CopyZonePricesRequest(BaseModel):
    """Copy all item prices from one zone to another."""
    source_zone_id: UUID
    target_zone_id: UUID
    multiplier: Decimal = Field(default=Decimal("1.0"), ge=0)


# Forward ref update
BundleWithItemsResponse.model_rebuild()
