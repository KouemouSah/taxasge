"""
Fiscal Services models for TaxasGE Backend
Pydantic v2 models aligned with PostgreSQL schema (taxasge_database_schema.sql)
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from enum import Enum
from decimal import Decimal
import uuid


# Enums aligned with PostgreSQL schema
class ServiceTypeEnum(str, Enum):
    """Service type enum from PostgreSQL schema"""
    permit = "permit"
    license = "license"
    certificate = "certificate"
    registration = "registration"
    authorization = "authorization"
    validation = "validation"
    inspection = "inspection"
    consultation = "consultation"
    other = "other"


class CalculationMethodEnum(str, Enum):
    """Calculation method enum from PostgreSQL schema"""
    fixed = "fixed"
    percentage = "percentage"
    per_unit = "per_unit"
    tiered = "tiered"
    custom = "custom"


class ServiceStatusEnum(str, Enum):
    """Service status enum"""
    active = "active"
    inactive = "inactive"
    suspended = "suspended"
    deprecated = "deprecated"


# Core Models aligned with PostgreSQL schema

class Ministry(BaseModel):
    """Ministry model - aligned with ministries table"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Ministry UUID")
    ministry_code: str = Field(..., description="Ministry code (e.g., M-001)")
    name_translation_id: Optional[uuid.UUID] = Field(None, description="Name translation UUID")
    description_translation_id: Optional[uuid.UUID] = Field(None, description="Description translation UUID")
    is_active: bool = Field(default=True, description="Ministry active status")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Sector(BaseModel):
    """Sector model - aligned with sectors table"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Sector UUID")
    sector_code: str = Field(..., description="Sector code (e.g., S-001)")
    ministry_id: uuid.UUID = Field(..., description="Parent ministry UUID")
    name_translation_id: Optional[uuid.UUID] = Field(None, description="Name translation UUID")
    description_translation_id: Optional[uuid.UUID] = Field(None, description="Description translation UUID")
    is_active: bool = Field(default=True, description="Sector active status")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Category(BaseModel):
    """Category model - aligned with categories table"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Category UUID")
    category_code: str = Field(..., description="Category code (e.g., C-001)")
    sector_id: uuid.UUID = Field(..., description="Parent sector UUID")
    name_translation_id: Optional[uuid.UUID] = Field(None, description="Name translation UUID")
    description_translation_id: Optional[uuid.UUID] = Field(None, description="Description translation UUID")
    icon: Optional[str] = Field(None, description="Category icon")
    display_order: int = Field(default=0, description="Display order")
    is_active: bool = Field(default=True, description="Category active status")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Subcategory(BaseModel):
    """Subcategory model - aligned with subcategories table"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Subcategory UUID")
    subcategory_code: str = Field(..., description="Subcategory code (e.g., SC-001)")
    category_id: uuid.UUID = Field(..., description="Parent category UUID")
    name_translation_id: Optional[uuid.UUID] = Field(None, description="Name translation UUID")
    description_translation_id: Optional[uuid.UUID] = Field(None, description="Description translation UUID")
    display_order: int = Field(default=0, description="Display order")
    is_active: bool = Field(default=True, description="Subcategory active status")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Translation(BaseModel):
    """Translation model - aligned with translations table"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Translation UUID")
    entity_type: str = Field(..., description="Entity type (ministry, sector, category, etc.)")
    entity_id: uuid.UUID = Field(..., description="Entity UUID")
    field_name: str = Field(..., description="Field name (name, description)")
    language_code: str = Field(..., description="Language code (es, fr, en)")
    content: str = Field(..., description="Translated content")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FiscalService(BaseModel):
    """Fiscal service model - aligned with fiscal_services table"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Service UUID")
    service_code: str = Field(..., description="Service code (e.g., T-001)")
    subcategory_id: Optional[uuid.UUID] = Field(None, description="Subcategory UUID")

    # Service details
    name_translation_id: Optional[uuid.UUID] = Field(None, description="Name translation UUID")
    description_translation_id: Optional[uuid.UUID] = Field(None, description="Description translation UUID")
    service_type: ServiceTypeEnum = Field(default=ServiceTypeEnum.other, description="Service type")

    # Pricing aligned with schema
    expedition_amount: Decimal = Field(..., ge=0, description="Expedition/issuance fee")
    renewal_amount: Decimal = Field(default=Decimal("0"), ge=0, description="Renewal fee")
    calculation_method: CalculationMethodEnum = Field(default=CalculationMethodEnum.fixed, description="Calculation method")

    # Processing details
    processing_time_days: Optional[int] = Field(None, ge=0, description="Standard processing time")
    urgent_processing_days: Optional[int] = Field(None, ge=0, description="Urgent processing time")

    # Metadata
    is_online_available: bool = Field(default=True, description="Available online")
    is_urgent_available: bool = Field(default=False, description="Urgent processing available")
    is_active: bool = Field(default=True, description="Service active status")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    effective_from: Optional[datetime] = Field(None, description="Effective start date")
    effective_until: Optional[datetime] = Field(None, description="Effective end date")

    # Statistics
    usage_count: int = Field(default=0, description="Usage count")
    average_rating: Optional[float] = Field(None, ge=0, le=5, description="Average rating")
    last_used_at: Optional[datetime] = Field(None, description="Last usage timestamp")



class RequiredDocument(BaseModel):
    """Required document model - aligned with required_documents table"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Document UUID")
    fiscal_service_id: uuid.UUID = Field(..., description="Fiscal service UUID")
    name_translation_id: Optional[uuid.UUID] = Field(None, description="Name translation UUID")
    description_translation_id: Optional[uuid.UUID] = Field(None, description="Description translation UUID")
    is_required: bool = Field(default=True, description="Document is mandatory")
    document_format: Optional[str] = Field(None, description="Required format")
    max_size_mb: Optional[int] = Field(None, description="Maximum file size in MB")
    display_order: int = Field(default=0, description="Display order")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Procedure(BaseModel):
    """Procedure model - aligned with procedures table"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Procedure UUID")
    fiscal_service_id: uuid.UUID = Field(..., description="Fiscal service UUID")
    step_number: int = Field(..., description="Step number")
    description_translation_id: Optional[uuid.UUID] = Field(None, description="Description translation UUID")
    estimated_duration_minutes: Optional[int] = Field(None, description="Estimated duration")
    is_required: bool = Field(default=True, description="Step is required")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Keyword(BaseModel):
    """Keyword model for search functionality"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Keyword UUID")
    fiscal_service_id: uuid.UUID = Field(..., description="Fiscal service UUID")
    language_code: str = Field(..., description="Language code (es, fr, en)")
    keyword: str = Field(..., description="Search keyword")
    created_at: datetime = Field(default_factory=datetime.utcnow)


# API DTOs aligned with PostgreSQL schema

class FiscalServiceCreate(BaseModel):
    """Model for creating fiscal service"""
    service_code: str = Field(..., description="Service code")
    subcategory_id: Optional[uuid.UUID] = Field(None, description="Subcategory UUID")
    service_type: ServiceTypeEnum = Field(default=ServiceTypeEnum.other)
    expedition_amount: Decimal = Field(..., ge=0, description="Expedition fee")
    renewal_amount: Decimal = Field(default=Decimal("0"), ge=0, description="Renewal fee")
    calculation_method: CalculationMethodEnum = Field(default=CalculationMethodEnum.fixed)
    processing_time_days: Optional[int] = None
    urgent_processing_days: Optional[int] = None
    is_online_available: bool = Field(default=True)
    is_urgent_available: bool = Field(default=False)
    effective_from: Optional[datetime] = None
    effective_until: Optional[datetime] = None


class FiscalServiceUpdate(BaseModel):
    """Model for updating fiscal service"""
    subcategory_id: Optional[uuid.UUID] = None
    service_type: Optional[ServiceTypeEnum] = None
    expedition_amount: Optional[Decimal] = None
    renewal_amount: Optional[Decimal] = None
    calculation_method: Optional[CalculationMethodEnum] = None
    processing_time_days: Optional[int] = None
    urgent_processing_days: Optional[int] = None
    is_online_available: Optional[bool] = None
    is_urgent_available: Optional[bool] = None
    is_active: Optional[bool] = None
    effective_from: Optional[datetime] = None
    effective_until: Optional[datetime] = None


class FiscalServiceResponse(BaseModel):
    """Model for fiscal service API response with translations"""
    id: uuid.UUID
    service_code: str
    subcategory_id: Optional[uuid.UUID]
    service_type: ServiceTypeEnum
    expedition_amount: Decimal
    renewal_amount: Decimal
    calculation_method: CalculationMethodEnum
    processing_time_days: Optional[int]
    urgent_processing_days: Optional[int]
    is_online_available: bool
    is_urgent_available: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    effective_from: Optional[datetime]
    effective_until: Optional[datetime]
    usage_count: int
    average_rating: Optional[float]
    last_used_at: Optional[datetime]

    # Localized fields (populated from translations)
    name: Optional[str] = Field(None, description="Localized name")
    description: Optional[str] = Field(None, description="Localized description")
    subcategory_name: Optional[str] = Field(None, description="Localized subcategory name")
    category_name: Optional[str] = Field(None, description="Localized category name")
    sector_name: Optional[str] = Field(None, description="Localized sector name")
    ministry_name: Optional[str] = Field(None, description="Localized ministry name")


class FiscalServiceListResponse(BaseModel):
    """Model for paginated fiscal service list response"""
    services: List[FiscalServiceResponse] = Field(..., description="List of fiscal services")
    total: int = Field(..., description="Total number of services")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Page size")
    pages: int = Field(..., description="Total number of pages")
    filters: Optional[Dict[str, Any]] = Field(None, description="Applied filters")


class FiscalServiceSearchFilter(BaseModel):
    """Model for fiscal service search and filtering"""
    query: Optional[str] = Field(None, description="Search query")
    subcategory_id: Optional[uuid.UUID] = Field(None, description="Filter by subcategory")
    category_id: Optional[uuid.UUID] = Field(None, description="Filter by category")
    sector_id: Optional[uuid.UUID] = Field(None, description="Filter by sector")
    ministry_id: Optional[uuid.UUID] = Field(None, description="Filter by ministry")
    service_type: Optional[ServiceTypeEnum] = Field(None, description="Filter by service type")
    calculation_method: Optional[CalculationMethodEnum] = Field(None, description="Filter by calculation method")
    is_online_available: Optional[bool] = Field(None, description="Filter by online availability")
    is_urgent_available: Optional[bool] = Field(None, description="Filter by urgent availability")
    is_active: Optional[bool] = Field(None, description="Filter by active status")
    min_expedition_amount: Optional[Decimal] = Field(None, description="Minimum expedition fee")
    max_expedition_amount: Optional[Decimal] = Field(None, description="Maximum expedition fee")
    min_renewal_amount: Optional[Decimal] = Field(None, description="Minimum renewal fee")
    max_renewal_amount: Optional[Decimal] = Field(None, description="Maximum renewal fee")
    max_processing_days: Optional[int] = Field(None, description="Maximum processing time")
    language: str = Field(default="es", pattern="^(es|fr|en)$", description="Response language")
    page: int = Field(default=1, ge=1, description="Page number")
    size: int = Field(default=20, ge=1, le=100, description="Page size")


class PriceCalculationRequest(BaseModel):
    """Model for price calculation request"""
    service_id: uuid.UUID = Field(..., description="Fiscal service UUID")
    base_amount: Optional[Decimal] = Field(None, description="Base amount for percentage calculations")
    quantity: Optional[int] = Field(None, description="Quantity for unit-based pricing")
    is_urgent: bool = Field(default=False, description="Request urgent processing")
    additional_parameters: Optional[Dict[str, Any]] = Field(None, description="Additional parameters")


class PriceCalculationResponse(BaseModel):
    """Model for price calculation response"""
    service_id: uuid.UUID = Field(..., description="Fiscal service UUID")
    expedition_amount: Decimal = Field(..., description="Expedition amount")
    renewal_amount: Decimal = Field(..., description="Renewal amount")
    processing_fee: Optional[Decimal] = Field(None, description="Processing fee")
    urgency_fee: Optional[Decimal] = Field(None, description="Urgency fee")
    total_amount: Decimal = Field(..., description="Total calculated amount")
    currency: str = Field(default="XAF", description="Currency code")
    calculation_method: CalculationMethodEnum = Field(..., description="Calculation method used")
    breakdown: Dict[str, Any] = Field(..., description="Price breakdown details")
    processing_time_days: int = Field(..., description="Expected processing time")


class FiscalServiceStats(BaseModel):
    """Model for fiscal service statistics"""
    total_services: int = Field(..., description="Total number of services")
    active_services: int = Field(..., description="Number of active services")
    online_services: int = Field(..., description="Number of online services")
    urgent_services: int = Field(..., description="Number of services with urgent processing")
    services_by_type: Dict[str, int] = Field(..., description="Services count by type")
    services_by_category: Dict[str, int] = Field(..., description="Services count by category")
    services_by_ministry: Dict[str, int] = Field(..., description="Services count by ministry")
    average_processing_time: float = Field(..., description="Average processing time in days")
    average_expedition_amount: Decimal = Field(..., description="Average expedition amount")
    most_used_services: List[Dict[str, Any]] = Field(..., description="Most frequently used services")
    revenue_by_category: Dict[str, Decimal] = Field(..., description="Revenue by category")
    monthly_usage_trend: List[Dict[str, Any]] = Field(..., description="Monthly usage statistics")