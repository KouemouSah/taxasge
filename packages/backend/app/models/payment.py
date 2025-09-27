"""
Payment models for TaxasGE Backend
Pydantic v2 models for BANGE payment integration and fiscal payments management
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from enum import Enum
from decimal import Decimal
import uuid


class PaymentMethodEnum(str, Enum):
    """Payment method types"""
    bange_card = "bange_card"
    bange_wallet = "bange_wallet"
    bank_transfer = "bank_transfer"
    mobile_money = "mobile_money"
    cash = "cash"
    check = "check"


class PaymentStatusEnum(str, Enum):
    """Payment status types"""
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"
    refunded = "refunded"
    partially_refunded = "partially_refunded"


class PaymentTypeEnum(str, Enum):
    """Payment type classification"""
    fiscal_service = "fiscal_service"
    declaration_fee = "declaration_fee"
    penalty = "penalty"
    fine = "fine"
    tax = "tax"
    other = "other"


class CurrencyEnum(str, Enum):
    """Supported currencies"""
    XAF = "XAF"  # Central African CFA franc
    EUR = "EUR"
    USD = "USD"


class BANGEPaymentRequest(BaseModel):
    """BANGE payment request model"""
    amount: Decimal = Field(..., ge=0, description="Payment amount")
    currency: CurrencyEnum = Field(default=CurrencyEnum.XAF, description="Payment currency")
    description: str = Field(..., max_length=500, description="Payment description")
    reference: str = Field(..., description="Unique payment reference")
    customer_email: Optional[str] = Field(None, description="Customer email")
    customer_phone: Optional[str] = Field(None, description="Customer phone")
    callback_url: Optional[str] = Field(None, description="Payment callback URL")
    return_url: Optional[str] = Field(None, description="Return URL after payment")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class BANGEPaymentResponse(BaseModel):
    """BANGE payment response model"""
    payment_id: str = Field(..., description="BANGE payment ID")
    payment_url: str = Field(..., description="Payment URL for redirection")
    reference: str = Field(..., description="Payment reference")
    status: str = Field(..., description="Payment status")
    amount: Decimal = Field(..., description="Payment amount")
    currency: CurrencyEnum = Field(..., description="Payment currency")
    expires_at: Optional[datetime] = Field(None, description="Payment expiration time")
    created_at: datetime = Field(..., description="Payment creation time")


class Payment(BaseModel):
    """Main payment model - aligned with payments table"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Payment UUID")
    payment_reference: str = Field(..., description="Unique payment reference")

    # Payer information
    user_id: Optional[uuid.UUID] = Field(None, description="User UUID (if authenticated)")
    payer_name: str = Field(..., description="Payer full name")
    payer_email: Optional[str] = Field(None, description="Payer email")
    payer_phone: Optional[str] = Field(None, description="Payer phone")

    # Payment details
    payment_type: PaymentTypeEnum = Field(..., description="Payment type")
    description: str = Field(..., description="Payment description")
    amount: Decimal = Field(..., ge=0, description="Payment amount")
    currency: CurrencyEnum = Field(default=CurrencyEnum.XAF, description="Currency")

    # Related entities
    declaration_id: Optional[uuid.UUID] = Field(None, description="Related declaration UUID")
    fiscal_service_id: Optional[uuid.UUID] = Field(None, description="Related fiscal service UUID")

    # Payment processing
    payment_method: PaymentMethodEnum = Field(..., description="Payment method")
    payment_status: PaymentStatusEnum = Field(default=PaymentStatusEnum.pending, description="Payment status")

    # BANGE integration
    bange_payment_id: Optional[str] = Field(None, description="BANGE payment ID")
    bange_payment_url: Optional[str] = Field(None, description="BANGE payment URL")

    # Processing details
    processed_at: Optional[datetime] = Field(None, description="Payment processing time")
    confirmed_at: Optional[datetime] = Field(None, description="Payment confirmation time")
    expires_at: Optional[datetime] = Field(None, description="Payment expiration time")

    # Metadata
    callback_url: Optional[str] = Field(None, description="Payment callback URL")
    return_url: Optional[str] = Field(None, description="Return URL")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

    # Audit trail
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")

    # Reconciliation
    reconciled: bool = Field(default=False, description="Payment reconciled status")
    reconciled_at: Optional[datetime] = Field(None, description="Reconciliation timestamp")
    reconciliation_notes: Optional[str] = Field(None, description="Reconciliation notes")


class PaymentCreate(BaseModel):
    """Model for creating new payment"""
    user_id: Optional[uuid.UUID] = Field(None, description="User UUID")
    payer_name: str = Field(..., description="Payer full name")
    payer_email: Optional[str] = Field(None, description="Payer email")
    payer_phone: Optional[str] = Field(None, description="Payer phone")
    payment_type: PaymentTypeEnum = Field(..., description="Payment type")
    description: str = Field(..., description="Payment description")
    amount: Decimal = Field(..., ge=0, description="Payment amount")
    currency: CurrencyEnum = Field(default=CurrencyEnum.XAF, description="Currency")
    declaration_id: Optional[uuid.UUID] = Field(None, description="Related declaration UUID")
    fiscal_service_id: Optional[uuid.UUID] = Field(None, description="Related fiscal service UUID")
    payment_method: PaymentMethodEnum = Field(..., description="Payment method")
    callback_url: Optional[str] = Field(None, description="Payment callback URL")
    return_url: Optional[str] = Field(None, description="Return URL")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v


class PaymentResponse(BaseModel):
    """Model for payment API response"""
    id: uuid.UUID
    payment_reference: str
    user_id: Optional[uuid.UUID]
    payer_name: str
    payer_email: Optional[str]
    payer_phone: Optional[str]
    payment_type: PaymentTypeEnum
    description: str
    amount: Decimal
    currency: CurrencyEnum
    declaration_id: Optional[uuid.UUID]
    fiscal_service_id: Optional[uuid.UUID]
    payment_method: PaymentMethodEnum
    payment_status: PaymentStatusEnum
    bange_payment_id: Optional[str]
    bange_payment_url: Optional[str]
    processed_at: Optional[datetime]
    confirmed_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    reconciled: bool
    reconciled_at: Optional[datetime]

    # Additional fields for API response
    status_display: Optional[str] = Field(None, description="Human-readable status")
    payment_link: Optional[str] = Field(None, description="Payment link for processing")
    can_retry: bool = Field(default=False, description="Whether payment can be retried")
    time_remaining: Optional[int] = Field(None, description="Seconds until expiration")


class PaymentListResponse(BaseModel):
    """Model for paginated payment list response"""
    payments: List[PaymentResponse] = Field(..., description="List of payments")
    total: int = Field(..., description="Total number of payments")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Page size")
    pages: int = Field(..., description="Total number of pages")


class PaymentSearchFilter(BaseModel):
    """Model for payment search and filtering"""
    user_id: Optional[uuid.UUID] = Field(None, description="Filter by user")
    declaration_id: Optional[uuid.UUID] = Field(None, description="Filter by declaration")
    fiscal_service_id: Optional[uuid.UUID] = Field(None, description="Filter by fiscal service")
    payment_type: Optional[PaymentTypeEnum] = Field(None, description="Filter by payment type")
    payment_method: Optional[PaymentMethodEnum] = Field(None, description="Filter by payment method")
    payment_status: Optional[PaymentStatusEnum] = Field(None, description="Filter by status")
    min_amount: Optional[Decimal] = Field(None, description="Minimum amount filter")
    max_amount: Optional[Decimal] = Field(None, description="Maximum amount filter")
    currency: Optional[CurrencyEnum] = Field(None, description="Filter by currency")
    created_after: Optional[datetime] = Field(None, description="Created after date")
    created_before: Optional[datetime] = Field(None, description="Created before date")
    reconciled: Optional[bool] = Field(None, description="Filter by reconciliation status")
    reference_search: Optional[str] = Field(None, description="Search by reference")
    payer_search: Optional[str] = Field(None, description="Search by payer name/email")
    page: int = Field(default=1, ge=1, description="Page number")
    size: int = Field(default=20, ge=1, le=100, description="Page size")


class PaymentStats(BaseModel):
    """Model for payment statistics"""
    total_payments: int = Field(..., description="Total number of payments")
    total_amount: Decimal = Field(..., description="Total payment amount")
    successful_payments: int = Field(..., description="Number of successful payments")
    failed_payments: int = Field(..., description="Number of failed payments")
    pending_payments: int = Field(..., description="Number of pending payments")
    payments_by_method: Dict[str, int] = Field(..., description="Payments count by method")
    amount_by_method: Dict[str, Decimal] = Field(..., description="Amount by payment method")
    payments_by_type: Dict[str, int] = Field(..., description="Payments count by type")
    amount_by_type: Dict[str, Decimal] = Field(..., description="Amount by payment type")
    payments_today: int = Field(..., description="Payments today")
    payments_this_week: int = Field(..., description="Payments this week")
    payments_this_month: int = Field(..., description="Payments this month")
    success_rate: float = Field(..., description="Payment success rate percentage")
    average_amount: Decimal = Field(..., description="Average payment amount")
    bange_payments: int = Field(..., description="Number of BANGE payments")
    bange_success_rate: float = Field(..., description="BANGE payment success rate")
    daily_trend: List[Dict[str, Any]] = Field(..., description="Daily payment trends")
    monthly_revenue: List[Dict[str, Any]] = Field(..., description="Monthly revenue trends")