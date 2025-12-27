"""
Pydantic models for service_requests.
Aligned with database schema from migration 020.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time
from uuid import UUID

from .enums import ServiceRequestStatus, ServiceRequestPriority, SolicitudType


# === Request Models ===

class ServiceRequestCreate(BaseModel):
    """Create a new service request"""
    workflow_code: str = Field(..., min_length=1, max_length=100)
    solicitud_type: SolicitudType = SolicitudType.EXPEDICION
    fiscal_service_id: Optional[int] = None
    priority: ServiceRequestPriority = ServiceRequestPriority.NORMAL
    form_data: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        json_schema_extra = {
            "example": {
                "workflow_code": "residencia",
                "solicitud_type": "expedicion",
                "priority": "NORMAL"
            }
        }


class ServiceRequestUpdate(BaseModel):
    """Update service request fields"""
    status: Optional[ServiceRequestStatus] = None
    priority: Optional[ServiceRequestPriority] = None
    form_data: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    assigned_to: Optional[UUID] = None
    entity_code: Optional[str] = None
    cita_date: Optional[date] = None
    cita_time: Optional[time] = None
    cita_location: Optional[str] = None


# === Document Models ===

class RequiredDocument(BaseModel):
    """Document required for a workflow"""
    document_code: str
    document_name: str
    is_required: bool = True
    display_order: int = 0
    accepted_formats: List[str] = Field(default_factory=lambda: ["pdf", "jpg", "png"])
    max_size_mb: int = 10


class ProvidedDocument(BaseModel):
    """Document provided by user"""
    id: UUID
    document_code: str
    document_name: str
    file_path: str
    file_name: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    extraction_data: Dict[str, Any] = Field(default_factory=dict)
    extraction_confidence: Optional[float] = None
    extraction_status: str = "pending"
    is_valid: Optional[bool] = None
    validation_errors: List[str] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True


# === Tariff Models ===

class TariffBreakdown(BaseModel):
    """Tariff calculation breakdown"""
    base_amount: float
    supplements: List[Dict[str, Any]] = Field(default_factory=list)
    supplements_total: float = 0
    penalties_amount: float = 0
    total_amount: float
    currency: str = "XAF"


# === Response Models ===

class ServiceRequestResponse(BaseModel):
    """Complete response for a service request"""
    id: UUID
    reference: str
    workflow_code: str
    solicitud_type: SolicitudType
    status: ServiceRequestStatus
    priority: ServiceRequestPriority

    # Documents
    required_documents: List[RequiredDocument] = Field(default_factory=list)
    provided_documents: List[ProvidedDocument] = Field(default_factory=list)
    missing_documents: List[RequiredDocument] = Field(default_factory=list)
    documents_progress: str = "0/0"

    # Form data
    form_data: Dict[str, Any] = Field(default_factory=dict)
    extracted_data: Dict[str, Any] = Field(default_factory=dict)
    extraction_confidence: Optional[float] = None

    # Tariff
    tariff: Optional[TariffBreakdown] = None

    # Assignment
    assigned_to: Optional[UUID] = None
    entity_code: Optional[str] = None

    # Cita (appointment)
    cita_date: Optional[date] = None
    cita_time: Optional[time] = None
    cita_location: Optional[str] = None

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    validated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Rejection
    rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    """Response after uploading a document"""
    document_id: UUID
    document_code: str
    extraction: Dict[str, Any]
    confidence: float
    processor: str  # "gemini", "tesseract", "manual"
    status: str  # "success", "failed", "manual_review"
    needs_review: bool = False


class ServiceRequestListResponse(BaseModel):
    """Paginated list of service requests"""
    items: List[ServiceRequestResponse]
    total: int
    limit: int
    offset: int
