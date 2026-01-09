"""
Event Types
===========
Centralized event type definitions for the event bus system.

@module core/events/event_types
"""

from enum import Enum
from typing import TypedDict, Optional, Dict, Any
from datetime import datetime


class EventType(str, Enum):
    """
    Event types for the event bus system.

    Naming convention: {DOMAIN}_{ACTION}
    - DOMAIN: payment, request, document, appointment, user, etc.
    - ACTION: completed, pending, validated, rejected, etc.
    """

    # ==========================================================================
    # PAYMENT EVENTS
    # ==========================================================================

    PAYMENT_COMPLETED = "payment.completed"
    """Payment successfully completed (any method)"""

    PAYMENT_FAILED = "payment.failed"
    """Payment failed"""

    PAYMENT_CASH_PENDING = "payment.cash.pending"
    """Cash payment pending agent validation"""

    PAYMENT_CASH_VALIDATED = "payment.cash.validated"
    """Cash payment validated by treasury agent"""

    PAYMENT_CASH_REJECTED = "payment.cash.rejected"
    """Cash payment rejected by treasury agent"""

    PAYMENT_REFUNDED = "payment.refunded"
    """Payment refunded"""

    PAYMENT_LOCKED = "payment.locked"
    """Payment locked by agent for review"""

    PAYMENT_UNLOCKED = "payment.unlocked"
    """Payment unlocked/released"""

    # ==========================================================================
    # SERVICE REQUEST EVENTS
    # ==========================================================================

    REQUEST_SUBMITTED = "request.submitted"
    """New service request submitted"""

    REQUEST_APPROVED = "request.approved"
    """Service request approved"""

    REQUEST_REJECTED = "request.rejected"
    """Service request rejected"""

    REQUEST_COMPLETED = "request.completed"
    """Service request completed (all steps done)"""

    REQUEST_CANCELLED = "request.cancelled"
    """Service request cancelled by user"""

    REQUEST_ESCALATED = "request.escalated"
    """Service request escalated to supervisor"""

    REQUEST_ASSIGNED = "request.assigned"
    """Service request assigned to agent"""

    # ==========================================================================
    # VERIFICATION EVENTS
    # ==========================================================================

    VERIFICATION_REQUIRED = "verification.required"
    """Document identifiers need manual verification (not found in external DB)"""

    VERIFICATION_COMPLETED = "verification.completed"
    """Verification process completed for a service request"""

    VERIFICATION_MANUAL = "verification.manual"
    """Agent manually verified a service request"""

    # ==========================================================================
    # DOCUMENT EVENTS
    # ==========================================================================

    DOCUMENT_UPLOADED = "document.uploaded"
    """Document uploaded by user"""

    DOCUMENT_VALIDATED = "document.validated"
    """Document validated by agent/system"""

    DOCUMENT_REJECTED = "document.rejected"
    """Document rejected - needs re-upload"""

    DOCUMENT_EXPIRED = "document.expired"
    """Document expired (validity check)"""

    # ==========================================================================
    # APPOINTMENT EVENTS
    # ==========================================================================

    APPOINTMENT_BOOKED = "appointment.booked"
    """Appointment booked successfully"""

    APPOINTMENT_CONFIRMED = "appointment.confirmed"
    """Appointment confirmed"""

    APPOINTMENT_CANCELLED = "appointment.cancelled"
    """Appointment cancelled"""

    APPOINTMENT_REMINDER = "appointment.reminder"
    """Appointment reminder (scheduled)"""

    APPOINTMENT_COMPLETED = "appointment.completed"
    """Appointment completed (citizen showed up)"""

    APPOINTMENT_NO_SHOW = "appointment.no_show"
    """Citizen didn't show up for appointment"""

    # ==========================================================================
    # USER EVENTS
    # ==========================================================================

    USER_REGISTERED = "user.registered"
    """New user registered"""

    USER_VERIFIED = "user.verified"
    """User email/phone verified"""

    USER_PASSWORD_RESET = "user.password.reset"
    """Password reset requested"""

    USER_2FA_ENABLED = "user.2fa.enabled"
    """Two-factor authentication enabled"""

    # ==========================================================================
    # DECLARATION EVENTS
    # ==========================================================================

    DECLARATION_SUBMITTED = "declaration.submitted"
    """Tax declaration submitted"""

    DECLARATION_VALIDATED = "declaration.validated"
    """Tax declaration validated by DGI"""

    DECLARATION_REJECTED = "declaration.rejected"
    """Tax declaration rejected"""

    DECLARATION_PAYMENT_DUE = "declaration.payment.due"
    """Declaration payment is due"""

    # ==========================================================================
    # SLA EVENTS
    # ==========================================================================

    SLA_WARNING = "sla.warning"
    """SLA approaching breach threshold (warning)"""

    SLA_BREACH = "sla.breach"
    """SLA breached"""

    # ==========================================================================
    # SYSTEM EVENTS
    # ==========================================================================

    SYSTEM_ERROR = "system.error"
    """System error occurred"""

    SYSTEM_MAINTENANCE = "system.maintenance"
    """System maintenance scheduled"""


class EventPayload(TypedDict, total=False):
    """
    Standard event payload structure.
    All events should include at minimum: event_type, timestamp, and relevant IDs.
    """

    # Required fields
    event_type: str
    timestamp: str  # ISO format

    # Common identifiers
    user_id: Optional[str]
    request_id: Optional[str]
    payment_id: Optional[str]
    declaration_id: Optional[str]
    document_id: Optional[str]
    appointment_id: Optional[str]
    agent_id: Optional[str]

    # Payment-specific
    amount: Optional[float]
    currency: Optional[str]
    payment_method: Optional[str]
    receipt_number: Optional[str]

    # Request-specific
    service_code: Optional[str]
    workflow_code: Optional[str]
    current_step: Optional[int]

    # Document-specific
    document_type: Optional[str]
    file_name: Optional[str]

    # Appointment-specific
    appointment_date: Optional[str]
    appointment_time: Optional[str]
    location: Optional[str]

    # User info for notifications
    user_email: Optional[str]
    user_phone: Optional[str]
    user_name: Optional[str]
    preferred_language: Optional[str]

    # Additional context
    reason: Optional[str]
    notes: Optional[str]
    metadata: Optional[Dict[str, Any]]


def create_event_payload(
    event_type: EventType,
    **kwargs: Any
) -> EventPayload:
    """
    Helper function to create a standardized event payload.

    Args:
        event_type: The type of event
        **kwargs: Additional payload fields

    Returns:
        EventPayload with timestamp and event type set
    """
    payload: EventPayload = {
        "event_type": event_type.value,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        **kwargs
    }
    return payload
