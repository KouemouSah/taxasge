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

    PAYMENT_MANUAL_PENDING = "payment.manual.pending"
    """Manual payment (Cash or Check) pending Treasury agent validation"""

    # Alias for backward compatibility
    PAYMENT_CASH_PENDING = "payment.manual.pending"
    """@deprecated Use PAYMENT_MANUAL_PENDING - Cash/Check payment pending agent validation"""

    PAYMENT_MANUAL_VALIDATED = "payment.manual.validated"
    """Manual payment validated by Treasury agent"""

    # Alias for backward compatibility
    PAYMENT_CASH_VALIDATED = "payment.manual.validated"
    """@deprecated Use PAYMENT_MANUAL_VALIDATED - Cash/Check payment validated by agent"""

    PAYMENT_MANUAL_REJECTED = "payment.manual.rejected"
    """Manual payment rejected by Treasury agent"""

    # Alias for backward compatibility
    PAYMENT_CASH_REJECTED = "payment.manual.rejected"
    """@deprecated Use PAYMENT_MANUAL_REJECTED - Cash/Check payment rejected by agent"""

    PAYMENT_MANUAL_ESCALATED = "payment.manual.escalated"
    """Manual payment escalated to supervisor by Treasury agent"""

    PAYMENT_REFUNDED = "payment.refunded"
    """Payment refunded"""

    # Note: PAYMENT_LOCKED and PAYMENT_UNLOCKED removed - lock mechanism obsolete with auto-assignment

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

    REQUEST_DOCUMENTS_REQUIRED = "request.documents_required"
    """Agent requested additional/corrected documents from citizen"""

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
    # FUNCIONARIO VERIFICATION EVENTS
    # ==========================================================================

    FUNCIONARIO_VERIFICATION_SUBMITTED = "funcionario.verification.submitted"
    """New funcionario verification request submitted"""

    FUNCIONARIO_VERIFICATION_PRE_VERIFIED = "funcionario.verification.pre_verified"
    """Funcionario verification request pre-verified (matricula found in verified_identifiers)"""

    FUNCIONARIO_VERIFICATION_APPROVED = "funcionario.verification.approved"
    """Funcionario verification request approved by agent"""

    FUNCIONARIO_VERIFICATION_REJECTED = "funcionario.verification.rejected"
    """Funcionario verification request rejected by agent"""

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

    APPOINTMENT_RESCHEDULED = "appointment.rescheduled"
    """Appointment rescheduled to new date/time"""

    APPOINTMENT_REMINDER = "appointment.reminder"
    """Appointment reminder (scheduled)"""

    APPOINTMENT_COMPLETED = "appointment.completed"
    """Appointment completed (citizen showed up)"""

    APPOINTMENT_NO_SHOW = "appointment.no_show"
    """Citizen didn't show up for appointment"""

    # ==========================================================================
    # USER EVENTS
    # ==========================================================================

    # ==========================================================================
    # RBAC EVENTS
    # ==========================================================================

    RBAC_PERMISSION_GRANTED = "rbac.permission.granted"
    """Permission granted to a role or user"""

    RBAC_PERMISSION_REVOKED = "rbac.permission.revoked"
    """Permission revoked from a role or user"""

    RBAC_ROLE_UPDATED = "rbac.role.updated"
    """Role updated (name, code, entity_type, parent_role_id)"""

    RBAC_ROLE_CREATED = "rbac.role.created"
    """New role created"""

    RBAC_ROLE_DELETED = "rbac.role.deleted"
    """Role deleted"""

    RBAC_USER_ROLE_CHANGED = "rbac.user.role_changed"
    """User's role_id changed (role promotion/demotion)"""

    RBAC_AGENT_DEACTIVATED = "rbac.agent.deactivated"
    """Agent deactivated"""

    # ==========================================================================
    # USER EVENTS
    # ==========================================================================

    USER_REGISTERED = "user.registered"
    """New user registered"""

    USER_VERIFIED = "user.verified"
    """User email/phone verified"""

    USER_PASSWORD_RESET = "user.password.reset"
    """Password reset requested"""

    USER_PASSWORD_CHANGED = "user.password.changed"
    """Password successfully changed (security notification)"""

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
    # BATCH EVENTS
    # ==========================================================================

    BATCH_SUBMITTED = "batch.submitted"
    """Batch of service requests submitted and paid"""

    BATCH_COMPLETED = "batch.completed"
    """All items in batch have been processed (approved/rejected)"""

    # ==========================================================================
    # SLA EVENTS
    # ==========================================================================

    SLA_WARNING = "sla.warning"
    """SLA approaching breach threshold (warning)"""

    SLA_BREACH = "sla.breach"
    """SLA breached"""

    # ==========================================================================
    # LICENSE EVENTS
    # ==========================================================================

    LICENSE_ISSUED = "license.issued"
    """Commercial license issued (PDF generated, ready for notification)"""

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
