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
    """Response after uploading a document (legacy - kept for compatibility)"""
    document_id: UUID
    document_code: str
    extraction: Dict[str, Any]
    confidence: float
    processor: str  # "gemini", "tesseract", "manual"
    status: str  # "success", "failed", "manual_review"
    needs_review: bool = False


# === NEW FLOW: Preview + Validate ===

class DocumentExtractionPreview(BaseModel):
    """
    Response after extraction preview (BEFORE user validation).
    Document is NOT yet uploaded to Firebase Storage.
    """
    preview_id: str = Field(..., description="Temporary ID for this preview session")
    document_code: str
    document_name: str
    file_name: str
    file_size: int
    mime_type: str

    # Extraction results for user review
    extraction: Dict[str, Any] = Field(
        default_factory=dict,
        description="Extracted data from Gemini/Tesseract"
    )
    confidence: float = Field(
        ..., ge=0, le=1,
        description="Confidence score (0.0 - 1.0)"
    )
    processor: str = Field(..., description="gemini, tesseract, or hybrid")

    # Status
    extraction_status: str = Field(
        ...,
        description="pending_validation, low_confidence, needs_review"
    )
    needs_correction: bool = Field(
        default=False,
        description="True if confidence < 70% and user should review"
    )

    # Schema info for frontend form generation
    expected_fields: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of expected fields with labels and types"
    )

    # Expiry (preview is temporary)
    expires_at: datetime = Field(..., description="Preview expires after 30 minutes")

    class Config:
        json_schema_extra = {
            "example": {
                "preview_id": "prev_abc123",
                "document_code": "dip_gq",
                "document_name": "Documento de Identidad Personal",
                "file_name": "mi_dip.pdf",
                "file_size": 1024000,
                "mime_type": "application/pdf",
                "extraction": {
                    "numero_documento": "A12345678",
                    "nombres": "JUAN CARLOS",
                    "apellidos": "NGUEMA OBIANG",
                    "fecha_nacimiento": "1985-03-15"
                },
                "confidence": 0.85,
                "processor": "gemini",
                "extraction_status": "pending_validation",
                "needs_correction": False,
                "expires_at": "2025-12-27T19:30:00Z"
            }
        }


class DocumentValidationRequest(BaseModel):
    """
    Request to validate (confirm or correct) extracted data.
    After validation, document is uploaded to Firebase Storage.
    """
    preview_id: str = Field(..., description="Preview ID from extraction preview")

    # User can confirm or provide corrected data
    confirmed_data: Dict[str, Any] = Field(
        ...,
        description="User-confirmed or corrected extraction data"
    )

    # Optional user notes
    user_notes: Optional[str] = Field(
        None, max_length=500,
        description="Optional notes from user about this document"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "preview_id": "prev_abc123",
                "confirmed_data": {
                    "numero_documento": "A12345678",
                    "nombres": "JUAN CARLOS",
                    "apellidos": "NGUEMA OBIANG",
                    "fecha_nacimiento": "1985-03-15"
                }
            }
        }


class DocumentValidationResponse(BaseModel):
    """Response after user validates extraction and document is saved"""
    document_id: UUID
    document_code: str
    document_name: str
    file_path: str = Field(..., description="Firebase Storage path")
    extraction_data: Dict[str, Any]
    extraction_confidence: float
    is_validated: bool = True
    validated_at: datetime


class ServiceRequestListResponse(BaseModel):
    """Paginated list of service requests"""
    items: List[ServiceRequestResponse]
    total: int
    limit: int
    offset: int
