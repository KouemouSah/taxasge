"""
Service Payment Models.

Models for payments associated with service_requests (passport, residence, etc.).
Uses the service_payments table with agent workflow support.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from enum import Enum

from .payment import PaymentMethod, PaymentStatus


class PaymentWorkflowStatus(str, Enum):
    """Workflow status for payments requiring agent review."""
    SUBMITTED = "submitted"
    AUTO_PROCESSING = "auto_processing"
    PENDING_AGENT_REVIEW = "pending_agent_review"
    LOCKED_BY_AGENT = "locked_by_agent"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ServicePaymentBase(BaseModel):
    """Base model for service payments."""

    # Identifiers - XOR: service_request_id OR fiscal_service_code
    service_request_id: Optional[str] = Field(
        None,
        description="FK to service_requests (XOR with fiscal_service_code)"
    )
    fiscal_service_code: Optional[str] = Field(
        None,
        description="FK to fiscal_services (XOR with service_request_id)"
    )

    user_id: str = Field(..., description="User UUID")
    company_id: Optional[str] = Field(None, description="Company UUID if applicable")

    # Payment details
    payment_method: PaymentMethod = Field(..., description="Payment method")
    payment_type: str = Field(default="full", description="full, partial, installment")
    base_amount: Decimal = Field(..., ge=0, description="Base amount before fees")
    penalties: Decimal = Field(default=Decimal("0"), ge=0)
    discounts: Decimal = Field(default=Decimal("0"), ge=0)
    total_amount: Decimal = Field(..., ge=0, description="Final amount to pay")
    currency: str = Field(default="XAF")

    @validator('service_request_id', 'fiscal_service_code')
    def validate_xor(cls, v, values):
        """Validate XOR constraint."""
        sr_id = values.get('service_request_id')
        fs_code = values.get('fiscal_service_code')

        # Allow both None during construction
        if sr_id and fs_code:
            raise ValueError("Cannot set both service_request_id and fiscal_service_code")

        return v


class ServicePaymentCreate(BaseModel):
    """Model for creating a service payment."""

    service_request_id: str = Field(..., description="Service request UUID")
    user_id: str = Field(..., description="User UUID")
    payment_method: PaymentMethod = Field(..., description="Payment method")
    total_amount: Decimal = Field(..., ge=0, description="Amount to pay")
    currency: str = Field(default="XAF")

    # Optional
    company_id: Optional[str] = None
    payment_type: str = Field(default="full")


class ServicePaymentResponse(BaseModel):
    """Response model for service payments."""

    id: str = Field(..., description="Payment UUID")
    payment_reference: str = Field(..., description="Unique payment reference")

    # Target
    service_request_id: Optional[str] = None
    fiscal_service_code: Optional[str] = None

    # User
    user_id: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    # Amounts
    payment_method: PaymentMethod
    payment_type: str
    base_amount: Decimal
    penalties: Decimal = Decimal("0")
    discounts: Decimal = Decimal("0")
    total_amount: Decimal
    currency: str = "XAF"

    # Tariff breakdown (from TariffBreakdown stored as JSONB)
    calculation_details: Optional[Dict[str, Any]] = Field(
        None,
        description="Itemized tariff breakdown: base_amount, supplements[], penalties, total"
    )

    # Status
    status: PaymentStatus
    workflow_status: PaymentWorkflowStatus

    # BANGE integration
    bange_transaction_id: Optional[str] = None

    # Agent workflow
    requires_agent_validation: bool = False
    locked_by_agent_id: Optional[int] = None
    locked_at: Optional[datetime] = None
    lock_expires_at: Optional[datetime] = None
    validated_by_agent_id: Optional[int] = None
    validated_at: Optional[datetime] = None
    validation_comment: Optional[str] = None

    # Receipt
    receipt_number: Optional[str] = None
    receipt_url: Optional[str] = None

    # Timestamps
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ServicePaymentListResponse(BaseModel):
    """List response for service payments."""

    payments: List[ServicePaymentResponse]
    total: int
    page: int
    page_size: int


class PendingValidationResponse(BaseModel):
    """Response model for Treasury dashboard - pending validations."""

    payment_id: str
    payment_reference: str
    service_request_id: Optional[str] = None
    request_reference: Optional[str] = None
    workflow_code: Optional[str] = None

    # User
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    # Payment
    payment_method: PaymentMethod
    total_amount: Decimal
    currency: str = "XAF"

    # Tariff breakdown for agent review (itemized details)
    calculation_details: Optional[Dict[str, Any]] = Field(
        None,
        description="Itemized tariff breakdown: base_amount, supplements[], penalties, total"
    )

    # Status
    workflow_status: PaymentWorkflowStatus

    # Lock
    locked_by_agent_id: Optional[int] = None
    lock_expires_at: Optional[datetime] = None

    # Timing
    created_at: datetime
    hours_waiting: float = Field(..., description="Hours since payment was created")


class PaymentValidationRequest(BaseModel):
    """Request model for agent validation."""

    comment: Optional[str] = Field(None, max_length=500, description="Validation comment")


class PaymentRejectionRequest(BaseModel):
    """Request model for agent rejection."""

    reason: str = Field(..., min_length=10, max_length=500, description="Rejection reason")


class PaymentLockRequest(BaseModel):
    """Request model for agent lock."""

    duration_minutes: int = Field(
        default=15,
        ge=5,
        le=60,
        description="Lock duration in minutes (5-60)"
    )
