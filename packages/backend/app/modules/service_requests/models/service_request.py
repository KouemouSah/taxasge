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

class FieldIndicator(BaseModel):
    """Per-field confidence and risk indicator for UI display"""
    field_name: str
    value: Optional[Any] = None
    confidence: float = Field(ge=0, le=1, description="Field extraction confidence")
    status: str = Field(
        default="ok",
        description="ok, warning, error, missing"
    )
    risk_level: Optional[str] = Field(
        default=None,
        description="low, medium, high, critical - if risk detected"
    )
    risk_message: Optional[str] = Field(
        default=None,
        description="Risk message to display to user"
    )
    requires_attention: bool = Field(
        default=False,
        description="True if field needs user attention"
    )
    suggestion: Optional[str] = Field(
        default=None,
        description="Suggested action for user"
    )


class RiskAnalysisResult(BaseModel):
    """Complete risk analysis result"""
    risk_level: str = Field(..., description="low, medium, high, critical")
    risk_score: int = Field(ge=0, le=100, description="Overall risk score 0-100")
    risk_factors: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of detected risk factors"
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Actionable recommendations"
    )
    requires_rejection: bool = Field(
        default=False,
        description="Document should be rejected"
    )
    requires_review: bool = Field(
        default=False,
        description="Document needs manual review"
    )
    factors_count: Dict[str, int] = Field(
        default_factory=dict,
        description="Count of factors by severity"
    )


class DocumentExtractionPreview(BaseModel):
    """
    Response after extraction preview (BEFORE user validation).
    Document is NOT yet uploaded to Firebase Storage.

    Includes:
    - Extracted data with per-field confidence indicators
    - Complete risk analysis
    - Visual indicators for problematic fields
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
        description="Overall confidence score (0.0 - 1.0)"
    )
    processor: str = Field(..., description="gemini, tesseract, or hybrid")

    # Per-field indicators for UI
    field_indicators: List[FieldIndicator] = Field(
        default_factory=list,
        description="Per-field confidence and risk indicators for visual display"
    )

    # Risk Analysis
    risk_analysis: Optional[RiskAnalysisResult] = Field(
        default=None,
        description="Complete risk analysis result"
    )

    # Status
    extraction_status: str = Field(
        ...,
        description="success, pending_validation, low_confidence, requires_review, rejected"
    )
    needs_correction: bool = Field(
        default=False,
        description="True if confidence < 70% and user should review"
    )

    # Document type detection
    detected_document_type: Optional[str] = Field(
        default=None,
        description="AI-detected document type (may differ from expected)"
    )
    document_type_match: bool = Field(
        default=True,
        description="True if detected type matches expected type"
    )

    # Schema info for frontend form generation
    expected_fields: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of expected fields with labels and types"
    )

    # Expiry (preview is temporary)
    expires_at: datetime = Field(..., description="Preview expires after 30 minutes")

    # Processing info
    processing_time_ms: Optional[int] = Field(
        default=None,
        description="Time taken to process document in milliseconds"
    )

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
                "field_indicators": [
                    {
                        "field_name": "numero_documento",
                        "value": "A12345678",
                        "confidence": 0.95,
                        "status": "ok",
                        "requires_attention": False
                    },
                    {
                        "field_name": "fecha_nacimiento",
                        "value": "1985-03-15",
                        "confidence": 0.60,
                        "status": "warning",
                        "risk_level": "medium",
                        "risk_message": "Low confidence - please verify",
                        "requires_attention": True,
                        "suggestion": "Check date format DD/MM/YYYY"
                    }
                ],
                "risk_analysis": {
                    "risk_level": "low",
                    "risk_score": 15,
                    "risk_factors": [],
                    "recommendations": ["No significant risks detected"],
                    "requires_rejection": False,
                    "requires_review": False,
                    "factors_count": {"critical": 0, "high": 0, "medium": 0, "low": 1}
                },
                "extraction_status": "pending_validation",
                "needs_correction": False,
                "detected_document_type": "dni",
                "document_type_match": True,
                "expires_at": "2025-12-27T19:30:00Z",
                "processing_time_ms": 1250
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
