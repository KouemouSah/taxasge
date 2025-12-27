"""
Enums for service_requests module.
Must match database enums from migration 020.
"""
from enum import Enum


class ServiceRequestStatus(str, Enum):
    """
    Status enum matching database service_request_status_enum.
    See migration 020_service_requests_base.sql
    """
    # Phase initiale
    DRAFT = "DRAFT"
    TIMBRES_PENDING = "TIMBRES_PENDING"
    TIMBRES_PAID = "TIMBRES_PAID"

    # Phase soumission
    SUBMITTED = "SUBMITTED"
    DOCUMENTS_REQUIRED = "DOCUMENTS_REQUIRED"

    # Phase validation
    UNDER_REVIEW = "UNDER_REVIEW"
    DOSSIER_VALIDE = "DOSSIER_VALIDE"
    REJECTED = "REJECTED"

    # Phase Nota de Ingreso
    PENDING_NOTA_INGRESO = "PENDING_NOTA_INGRESO"
    NOTA_UPLOADED = "NOTA_UPLOADED"

    # Phase paiement principal
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAYMENT_PROCESSING = "PAYMENT_PROCESSING"
    PAID = "PAID"
    PAYMENT_FAILED = "PAYMENT_FAILED"

    # Phase finale
    CITA_SCHEDULED = "CITA_SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class ServiceRequestPriority(str, Enum):
    """Priority enum matching database service_request_priority_enum"""
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"


class SolicitudType(str, Enum):
    """Type of request: new, renewal, or duplicate"""
    EXPEDICION = "expedicion"
    RENOVACION = "renovacion"
    DUPLICADO = "duplicado"


class ExtractionStatus(str, Enum):
    """Document extraction status"""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    MANUAL_REVIEW = "manual_review"
