"""
Fiscal Services Models - Based on DATABASE_SCHEMA_REFERENCE.md

Tables implemented:
- fiscal_services: Catalog of all fiscal services (taxes, fees, permits)
- categories: Service categorization by sector/ministry

Note: fiscal_service_data table belongs to DECLARATIONS module (user declarations)
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


# ═══════════════════════════════════════════════════════════════════════════
# ENUMS - From DATABASE_SCHEMA_REFERENCE.md
# ═══════════════════════════════════════════════════════════════════════════


class ServiceTypeEnum(str, Enum):
    """Service type categorization"""
    DOCUMENT_PROCESSING = "document_processing"
    LICENSE_PERMIT = "license_permit"
    RESIDENCE_PERMIT = "residence_permit"
    REGISTRATION_FEE = "registration_fee"
    INSPECTION_FEE = "inspection_fee"
    ADMINISTRATIVE_TAX = "administrative_tax"
    CUSTOMS_DUTY = "customs_duty"
    DECLARATION_TAX = "declaration_tax"


class CalculationMethodEnum(str, Enum):
    """Calculation method for fiscal service amounts"""
    FIXED_EXPEDITION = "fixed_expedition"          # Fixed fee for first issuance
    FIXED_RENEWAL = "fixed_renewal"                # Fixed fee for renewal only
    FIXED_BOTH = "fixed_both"                      # Same fixed fee for both
    PERCENTAGE_BASED = "percentage_based"          # Percentage of a value
    UNIT_BASED = "unit_based"                      # Price per unit
    TIERED_RATES = "tiered_rates"                  # Progressive brackets
    FORMULA_BASED = "formula_based"                # Custom formula
    FIXED_PLUS_UNIT = "fixed_plus_unit"            # Base + per-unit charge


class ServiceStatusEnum(str, Enum):
    """Service status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"
    DEPRECATED = "deprecated"


# ═══════════════════════════════════════════════════════════════════════════
# CATEGORIES Models
# ═══════════════════════════════════════════════════════════════════════════


class CategoryBase(BaseModel):
    """Base category model"""
    category_code: str = Field(..., max_length=10, description="Unique category code")
    sector_id: Optional[int] = Field(None, description="Sector this category belongs to")
    ministry_id: Optional[int] = Field(None, description="Ministry managing this category")
    service_type: Optional[ServiceTypeEnum] = Field(None, description="Type of services in this category")
    name_es: str = Field(..., max_length=255, description="Category name (Spanish)")
    description_es: Optional[str] = Field(None, description="Category description (Spanish)")
    is_active: bool = Field(True, description="Whether category is active")


class CategoryCreate(CategoryBase):
    """Create category request"""
    pass


class CategoryUpdate(BaseModel):
    """Update category request - all fields optional"""
    sector_id: Optional[int] = None
    ministry_id: Optional[int] = None
    service_type: Optional[ServiceTypeEnum] = None
    name_es: Optional[str] = Field(None, max_length=255)
    description_es: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    """Category response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════════════════
# FISCAL_SERVICES Models
# ═══════════════════════════════════════════════════════════════════════════


class FiscalServiceBase(BaseModel):
    """Base fiscal service model - matches database schema exactly"""

    # Core identification
    service_code: str = Field(..., max_length=20, description="Unique service code")
    category_id: int = Field(..., description="Category ID (references categories.id)")

    # Naming and description (Spanish)
    name_es: str = Field(..., max_length=255, description="Service name (Spanish)")
    description_es: Optional[str] = Field(None, description="Service description (Spanish)")

    # Service classification
    service_type: ServiceTypeEnum = Field(..., description="Type of service")
    calculation_method: CalculationMethodEnum = Field(..., description="How to calculate the amount")

    # Fixed amounts for expedition and renewal
    tasa_expedicion: Optional[float] = Field(None, ge=0, description="Fixed fee for first issuance (GNF)")
    tasa_renovacion: Optional[float] = Field(None, ge=0, description="Fixed fee for renewal (GNF)")

    # Variable calculation parameters
    percentage_rate: Optional[float] = Field(None, ge=0, le=100, description="Percentage rate if percentage_based")
    unit_price: Optional[float] = Field(None, ge=0, description="Price per unit if unit_based")

    # Advanced calculation configuration
    calculation_config: Optional[Dict[str, Any]] = Field(
        None,
        description="JSON config for complex calculations (formulas, variables, conditions)"
    )
    rate_tiers: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Progressive rate brackets for tiered_rates method"
    )

    # Validity and renewal
    validity_period_months: Optional[int] = Field(None, ge=0, description="How long the service is valid (months)")
    renewal_frequency_months: Optional[int] = Field(None, ge=0, description="How often renewal is required")

    # Hierarchical services
    parent_service_id: Optional[int] = Field(None, description="Parent service for sub-services")

    # Additional metadata
    required_documents: Optional[List[str]] = Field(None, description="List of required document types")
    processing_time_days: Optional[int] = Field(None, ge=0, description="Estimated processing time")
    legal_reference: Optional[str] = Field(None, max_length=500, description="Legal basis for this service")
    notes: Optional[str] = Field(None, description="Additional notes or instructions")

    # Status
    status: ServiceStatusEnum = Field(ServiceStatusEnum.ACTIVE, description="Service status")


class FiscalServiceCreate(FiscalServiceBase):
    """Create fiscal service request"""
    pass


class FiscalServiceUpdate(BaseModel):
    """Update fiscal service request - all fields optional"""
    category_id: Optional[int] = None
    name_es: Optional[str] = Field(None, max_length=255)
    description_es: Optional[str] = None
    service_type: Optional[ServiceTypeEnum] = None
    calculation_method: Optional[CalculationMethodEnum] = None
    tasa_expedicion: Optional[float] = Field(None, ge=0)
    tasa_renovacion: Optional[float] = Field(None, ge=0)
    percentage_rate: Optional[float] = Field(None, ge=0, le=100)
    unit_price: Optional[float] = Field(None, ge=0)
    calculation_config: Optional[Dict[str, Any]] = None
    rate_tiers: Optional[List[Dict[str, Any]]] = None
    validity_period_months: Optional[int] = Field(None, ge=0)
    renewal_frequency_months: Optional[int] = Field(None, ge=0)
    parent_service_id: Optional[int] = None
    required_documents: Optional[List[str]] = None
    processing_time_days: Optional[int] = Field(None, ge=0)
    legal_reference: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None
    status: Optional[ServiceStatusEnum] = None


class FiscalServiceResponse(FiscalServiceBase):
    """Fiscal service response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FiscalServiceWithCategory(FiscalServiceResponse):
    """Fiscal service with category information"""
    category: Optional[CategoryResponse] = None


# ═══════════════════════════════════════════════════════════════════════════
# Calculation Models
# ═══════════════════════════════════════════════════════════════════════════


class CalculationInput(BaseModel):
    """Input for fiscal service calculation"""
    fiscal_service_id: int = Field(..., description="Service to calculate")
    is_renewal: bool = Field(False, description="Is this a renewal (vs first expedition)")

    # For percentage_based
    base_value: Optional[float] = Field(None, description="Base value for percentage calculation")

    # For unit_based
    quantity: Optional[int] = Field(None, ge=1, description="Number of units")

    # For tiered_rates
    total_amount: Optional[float] = Field(None, ge=0, description="Amount to apply tiered rates to")

    # For formula_based or custom
    variables: Optional[Dict[str, Any]] = Field(None, description="Variables for formula calculation")


class RateTier(BaseModel):
    """Rate tier for progressive calculations"""
    min_value: float = Field(..., ge=0)
    max_value: Optional[float] = Field(None, ge=0)  # None = unlimited
    rate: float = Field(..., ge=0)  # Can be percentage or fixed amount
    fixed_amount: Optional[float] = Field(None, ge=0)  # Fixed amount for this tier


class CalculationBreakdown(BaseModel):
    """Detailed breakdown of calculation"""
    method: CalculationMethodEnum
    is_renewal: bool
    base_fee: Optional[float] = None
    variable_amount: Optional[float] = None
    tiers_applied: Optional[List[Dict[str, Any]]] = None
    formula_used: Optional[str] = None
    subtotal: float
    additional_fees: Optional[Dict[str, float]] = None
    total: float


class CalculationResult(BaseModel):
    """Result of fiscal service calculation"""
    fiscal_service_id: int
    service_code: str
    service_name: str
    calculation_method: CalculationMethodEnum
    breakdown: CalculationBreakdown
    amount_gnf: float = Field(..., description="Final amount in GNF")
    currency: str = Field("GNF", description="Currency code")
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


# ═══════════════════════════════════════════════════════════════════════════
# Search and Filtering Models
# ═══════════════════════════════════════════════════════════════════════════


class FiscalServiceFilter(BaseModel):
    """Filters for searching fiscal services"""
    category_id: Optional[int] = None
    sector_id: Optional[int] = None
    ministry_id: Optional[int] = None
    service_type: Optional[ServiceTypeEnum] = None
    calculation_method: Optional[CalculationMethodEnum] = None
    status: Optional[ServiceStatusEnum] = None
    search_term: Optional[str] = Field(None, description="Full-text search in name/description")
    min_amount: Optional[float] = Field(None, ge=0)
    max_amount: Optional[float] = Field(None, ge=0)


class FiscalServiceListResponse(BaseModel):
    """Paginated list of fiscal services"""
    services: List[FiscalServiceResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ═══════════════════════════════════════════════════════════════════════════
# Complete Service Creation Models
# ═══════════════════════════════════════════════════════════════════════════


class FiscalServiceCreateComplete(BaseModel):
    """
    Complete fiscal service creation with all related entities

    Use this for creating a fiscal service with:
    - Basic service info
    - Document assignments
    - Procedure assignments
    - Keywords
    - Translations (optional)
    """
    # Main service data
    service: FiscalServiceCreate

    # Related entities
    document_assignments: Optional[List[Dict[str, Any]]] = Field(
        default=[],
        description="Documents required for this service"
    )
    procedure_assignments: Optional[List[Dict[str, Any]]] = Field(
        default=[],
        description="Procedures required for this service"
    )
    keywords: Optional[List[Dict[str, Any]]] = Field(
        default=[],
        description="Search keywords (multilingual)"
    )
    translations: Optional[List[Dict[str, Any]]] = Field(
        default=[],
        description="Translations for other languages"
    )


class FiscalServiceUpdateComplete(BaseModel):
    """
    Complete fiscal service update with cascading updates
    """
    # Main service updates
    service: FiscalServiceUpdate

    # Document assignments
    add_document_assignments: Optional[List[Dict[str, Any]]] = None
    remove_document_ids: Optional[List[int]] = None

    # Procedure assignments
    add_procedure_assignments: Optional[List[Dict[str, Any]]] = None
    remove_procedure_ids: Optional[List[int]] = None

    # Keywords
    add_keywords: Optional[List[Dict[str, Any]]] = None
    remove_keyword_ids: Optional[List[int]] = None


class FiscalServiceCompleteResponse(FiscalServiceResponse):
    """
    Complete fiscal service response with all related data
    """
    document_assignments: List[Dict[str, Any]] = []
    procedure_assignments: List[Dict[str, Any]] = []
    keywords: List[Dict[str, Any]] = []
    translations: List[Dict[str, Any]] = []
