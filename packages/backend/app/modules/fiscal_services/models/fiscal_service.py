"""Fiscal Service Models - 850 tax services catalog + templates + translations"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class CalculationType(str, Enum):
    """Types of calculations for fiscal services"""
    FIXED = "fixed"  # Fixed amount
    PERCENTAGE = "percentage"  # Percentage of base
    PROGRESSIVE = "progressive"  # Progressive rates
    CUSTOM = "custom"  # Custom calculation


class MinistryResponse(BaseModel):
    """Ministry (Ministère)"""
    id: str
    code: str
    name_fr: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime


class SectorResponse(BaseModel):
    """Sector (Secteur par ministère)"""
    id: str
    ministry_id: str
    code: str
    name_fr: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime


class CategoryResponse(BaseModel):
    """Category (Catégorie par secteur)"""
    id: str
    sector_id: str
    code: str
    name_fr: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime


class FiscalServiceBase(BaseModel):
    """Base fiscal service"""
    category_id: str
    code: str = Field(..., description="Unique service code")
    name_fr: str
    name_en: Optional[str] = None
    description_fr: Optional[str] = None
    description_en: Optional[str] = None
    base_amount: Optional[float] = None
    calculation_type: CalculationType = CalculationType.FIXED
    is_active: bool = True
    requires_documents: bool = False
    requires_procedure: bool = False
    estimated_duration_days: Optional[int] = None


class FiscalServiceCreate(FiscalServiceBase):
    """Create fiscal service"""
    keywords: Optional[List[str]] = Field(default=[], description="Search keywords")


class FiscalServiceUpdate(BaseModel):
    """Update fiscal service"""
    category_id: Optional[str] = None
    name_fr: Optional[str] = None
    name_en: Optional[str] = None
    description_fr: Optional[str] = None
    description_en: Optional[str] = None
    base_amount: Optional[float] = None
    calculation_type: Optional[CalculationType] = None
    is_active: Optional[bool] = None
    requires_documents: Optional[bool] = None
    requires_procedure: Optional[bool] = None
    estimated_duration_days: Optional[int] = None
    keywords: Optional[List[str]] = None


class FiscalServiceDataResponse(BaseModel):
    """Fiscal service calculable data"""
    id: str
    fiscal_service_id: str
    field_name: str
    field_type: str  # number, percentage, boolean
    is_required: bool
    default_value: Optional[str] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    description_fr: Optional[str] = None
    description_en: Optional[str] = None


class FiscalServiceResponse(FiscalServiceBase):
    """Fiscal service response"""
    id: str
    usage_count: int = 0
    last_used_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Hierarchical data
    category_name: Optional[str] = None
    sector_name: Optional[str] = None
    ministry_name: Optional[str] = None

    # Related data
    keywords: List[str] = []
    required_documents: List[str] = []
    calculable_fields: List[FiscalServiceDataResponse] = []


class FiscalServiceListResponse(BaseModel):
    """List of fiscal services"""
    services: List[FiscalServiceResponse]
    total: int
    page: int
    page_size: int


class FiscalServiceSearchRequest(BaseModel):
    """Search fiscal services"""
    query: Optional[str] = Field(None, description="Search in name, description, keywords")
    ministry_id: Optional[str] = None
    sector_id: Optional[str] = None
    category_id: Optional[str] = None
    calculation_type: Optional[CalculationType] = None
    is_active: Optional[bool] = True
    requires_documents: Optional[bool] = None
    requires_procedure: Optional[bool] = None


class CalculateServiceRequest(BaseModel):
    """Calculate service amount"""
    fiscal_service_id: str
    input_data: dict = Field(..., description="Input values for calculation")


class CalculateServiceResponse(BaseModel):
    """Calculation result"""
    fiscal_service_id: str
    service_name: str
    base_amount: float
    calculated_amount: float
    calculation_type: CalculationType
    breakdown: Optional[dict] = Field(None, description="Detailed calculation breakdown")
    created_at: datetime


# ========== DOCUMENT TEMPLATES ==========

class DocumentTemplateBase(BaseModel):
    """Base document template"""
    template_code: str = Field(..., description="Unique template code")
    document_name_es: str
    description_es: Optional[str] = None
    category: Optional[str] = None
    validity_duration_months: Optional[int] = None
    validity_notes: Optional[str] = None
    is_active: bool = True


class DocumentTemplateCreate(DocumentTemplateBase):
    """Create document template"""
    created_by: Optional[int] = None


class DocumentTemplateUpdate(BaseModel):
    """Update document template"""
    document_name_es: Optional[str] = None
    description_es: Optional[str] = None
    category: Optional[str] = None
    validity_duration_months: Optional[int] = None
    validity_notes: Optional[str] = None
    is_active: Optional[bool] = None


class DocumentTemplateResponse(DocumentTemplateBase):
    """Document template response"""
    id: int
    usage_count: int = 0
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None


# ========== PROCEDURE TEMPLATES ==========

class ProcedureStepBase(BaseModel):
    """Base procedure step"""
    step_number: int
    description_es: str
    instructions_es: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None
    location_address: Optional[str] = None
    office_hours: Optional[str] = None
    requires_appointment: bool = False
    is_optional: bool = False


class ProcedureStepCreate(ProcedureStepBase):
    """Create procedure step"""
    pass


class ProcedureStepResponse(ProcedureStepBase):
    """Procedure step response"""
    id: int
    template_id: int
    created_at: datetime
    updated_at: datetime


class ProcedureTemplateBase(BaseModel):
    """Base procedure template"""
    template_code: str = Field(..., description="Unique template code")
    name_es: str
    description_es: Optional[str] = None
    category: Optional[str] = None
    is_active: bool = True


class ProcedureTemplateCreate(ProcedureTemplateBase):
    """Create procedure template"""
    created_by: Optional[int] = None
    steps: List[ProcedureStepCreate] = []


class ProcedureTemplateUpdate(BaseModel):
    """Update procedure template"""
    name_es: Optional[str] = None
    description_es: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class ProcedureTemplateResponse(ProcedureTemplateBase):
    """Procedure template response"""
    id: int
    usage_count: int = 0
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    steps: List[ProcedureStepResponse] = []


# ========== ENTITY TRANSLATIONS ==========

class TranslatableEntityType(str, Enum):
    """Types of translatable entities"""
    MINISTRY = "ministry"
    SECTOR = "sector"
    CATEGORY = "category"
    FISCAL_SERVICE = "fiscal_service"
    DOCUMENT_TEMPLATE = "document_template"
    PROCEDURE_TEMPLATE = "procedure_template"
    PROCEDURE_STEP = "procedure_step"


class EntityTranslationBase(BaseModel):
    """Base entity translation"""
    entity_type: TranslatableEntityType
    entity_code: str
    language_code: str = Field(..., description="ISO 639-1 code (es, fr, en)")
    field_name: str = Field(..., description="Field being translated (name, description, etc)")
    translation_text: str
    translation_source: str = "manual"
    translation_quality: Optional[float] = None


class EntityTranslationCreate(EntityTranslationBase):
    """Create entity translation"""
    pass


class EntityTranslationUpdate(BaseModel):
    """Update entity translation"""
    translation_text: Optional[str] = None
    translation_source: Optional[str] = None
    translation_quality: Optional[float] = None


class EntityTranslationResponse(EntityTranslationBase):
    """Entity translation response"""
    created_at: datetime
    updated_at: datetime
