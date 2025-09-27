"""
Tax Declaration models for TaxasGE Backend
Pydantic v2 models for tax declaration management
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from enum import Enum
from decimal import Decimal


class DeclarationStatus(str, Enum):
    """Tax declaration status"""
    draft = "draft"
    submitted = "submitted"
    processing = "processing"
    approved = "approved"
    rejected = "rejected"
    paid = "paid"
    completed = "completed"
    cancelled = "cancelled"


class DeclarationType(str, Enum):
    """Tax declaration type"""
    individual = "individual"
    business = "business"
    enterprise = "enterprise"
    renewal = "renewal"
    amendment = "amendment"


class Priority(str, Enum):
    """Declaration priority level"""
    normal = "normal"
    urgent = "urgent"
    express = "express"


class PaymentStatus(str, Enum):
    """Payment status for declaration"""
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


class DocumentAttachment(BaseModel):
    """Document attachment model"""
    id: str = Field(..., description="Document ID")
    filename: str = Field(..., description="Original filename")
    content_type: str = Field(..., description="MIME type")
    file_size: int = Field(..., ge=0, description="File size in bytes")
    file_url: str = Field(..., description="File storage URL")
    document_type: str = Field(..., description="Document type/category")
    is_required: bool = Field(default=True, description="Required document")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow, description="Upload timestamp")


class DeclarationFormData(BaseModel):
    """Tax declaration form data"""
    personal_info: Optional[Dict[str, Any]] = Field(None, description="Personal information")
    business_info: Optional[Dict[str, Any]] = Field(None, description="Business information")
    tax_period: Optional[Dict[str, Any]] = Field(None, description="Tax period details")
    financial_data: Optional[Dict[str, Any]] = Field(None, description="Financial information")
    additional_data: Optional[Dict[str, Any]] = Field(None, description="Additional form data")


class PaymentInfo(BaseModel):
    """Payment information for declaration"""
    calculated_amount: Decimal = Field(..., ge=0, description="Calculated tax amount")
    processing_fee: Optional[Decimal] = Field(None, ge=0, description="Processing fee")
    urgency_fee: Optional[Decimal] = Field(None, ge=0, description="Urgency fee")
    total_amount: Decimal = Field(..., ge=0, description="Total amount to pay")
    currency: str = Field(default="XAF", description="Currency code")
    payment_method: Optional[str] = Field(None, description="Preferred payment method")
    payment_reference: Optional[str] = Field(None, description="Payment reference")
    payment_date: Optional[datetime] = Field(None, description="Payment completion date")


class DeclarationCreate(BaseModel):
    """Model for creating tax declaration"""
    service_id: str = Field(..., description="Tax service ID")
    declaration_type: DeclarationType = Field(default=DeclarationType.individual, description="Declaration type")
    priority: Priority = Field(default=Priority.normal, description="Processing priority")
    form_data: DeclarationFormData = Field(..., description="Declaration form data")
    requested_documents: List[str] = Field(default_factory=list, description="Required document types")
    notes: Optional[str] = Field(None, max_length=1000, description="Additional notes")
    language: str = Field(default="es", pattern="^(es|fr|en)$", description="Preferred language")


class DeclarationUpdate(BaseModel):
    """Model for updating tax declaration"""
    form_data: Optional[DeclarationFormData] = None
    priority: Optional[Priority] = None
    status: Optional[DeclarationStatus] = None
    notes: Optional[str] = None
    language: Optional[str] = Field(None, pattern="^(es|fr|en)$")
    payment_info: Optional[PaymentInfo] = None


class DeclarationResponse(BaseModel):
    """Model for tax declaration response"""
    id: str = Field(..., description="Declaration ID")
    reference_number: str = Field(..., description="Unique reference number")
    user_id: str = Field(..., description="User ID")
    service_id: str = Field(..., description="Tax service ID")
    service_name: str = Field(..., description="Tax service name")

    # Declaration details
    declaration_type: DeclarationType = Field(..., description="Declaration type")
    status: DeclarationStatus = Field(..., description="Current status")
    priority: Priority = Field(..., description="Processing priority")

    # Form and documents
    form_data: DeclarationFormData = Field(..., description="Declaration form data")
    attachments: List[DocumentAttachment] = Field(default_factory=list, description="Attached documents")
    required_documents: List[str] = Field(default_factory=list, description="Required document types")

    # Payment information
    payment_info: Optional[PaymentInfo] = Field(None, description="Payment details")
    payment_status: PaymentStatus = Field(default=PaymentStatus.pending, description="Payment status")

    # Processing information
    submitted_at: Optional[datetime] = Field(None, description="Submission timestamp")
    processed_at: Optional[datetime] = Field(None, description="Processing completion timestamp")
    approved_at: Optional[datetime] = Field(None, description="Approval timestamp")

    # Administrative
    assigned_to: Optional[str] = Field(None, description="Assigned operator ID")
    processing_notes: Optional[str] = Field(None, description="Internal processing notes")
    rejection_reason: Optional[str] = Field(None, description="Rejection reason if applicable")

    # Metadata
    notes: Optional[str] = Field(None, description="User notes")
    language: str = Field(default="es", description="Preferred language")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Tracking
    estimated_completion: Optional[datetime] = Field(None, description="Estimated completion date")
    workflow_stage: Optional[str] = Field(None, description="Current workflow stage")


class DeclarationListResponse(BaseModel):
    """Model for paginated declaration list response"""
    declarations: List[DeclarationResponse] = Field(..., description="List of declarations")
    total: int = Field(..., description="Total number of declarations")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Page size")
    pages: int = Field(..., description="Total number of pages")


class DeclarationSearchFilter(BaseModel):
    """Model for declaration search and filtering"""
    user_id: Optional[str] = Field(None, description="Filter by user ID")
    service_id: Optional[str] = Field(None, description="Filter by service ID")
    status: Optional[DeclarationStatus] = Field(None, description="Filter by status")
    declaration_type: Optional[DeclarationType] = Field(None, description="Filter by type")
    priority: Optional[Priority] = Field(None, description="Filter by priority")
    payment_status: Optional[PaymentStatus] = Field(None, description="Filter by payment status")

    # Date filters
    created_after: Optional[datetime] = Field(None, description="Created after date")
    created_before: Optional[datetime] = Field(None, description="Created before date")
    submitted_after: Optional[datetime] = Field(None, description="Submitted after date")
    submitted_before: Optional[datetime] = Field(None, description="Submitted before date")

    # Search
    reference_number: Optional[str] = Field(None, description="Search by reference number")
    search_query: Optional[str] = Field(None, description="Full-text search query")

    # Administrative filters
    assigned_to: Optional[str] = Field(None, description="Filter by assigned operator")
    language: str = Field(default="es", description="Response language")


class DeclarationStats(BaseModel):
    """Model for declaration statistics"""
    total_declarations: int = Field(..., description="Total number of declarations")
    by_status: Dict[str, int] = Field(..., description="Count by status")
    by_type: Dict[str, int] = Field(..., description="Count by type")
    by_payment_status: Dict[str, int] = Field(..., description="Count by payment status")

    # Performance metrics
    average_processing_time: float = Field(..., description="Average processing time in hours")
    completion_rate: float = Field(..., description="Completion rate percentage")

    # Financial metrics
    total_revenue: Decimal = Field(..., description="Total revenue from declarations")
    pending_payments: Decimal = Field(..., description="Pending payment amount")

    # Time-based metrics
    declarations_this_month: int = Field(..., description="Declarations this month")
    declarations_this_week: int = Field(..., description="Declarations this week")

    # Service popularity
    popular_services: List[Dict[str, Any]] = Field(..., description="Most used services")


class DeclarationWorkflow(BaseModel):
    """Model for declaration workflow status"""
    declaration_id: str = Field(..., description="Declaration ID")
    current_stage: str = Field(..., description="Current workflow stage")
    stages: List[Dict[str, Any]] = Field(..., description="Workflow stages")
    next_actions: List[str] = Field(..., description="Available next actions")
    estimated_completion: Optional[datetime] = Field(None, description="Estimated completion")


class BulkDeclarationOperation(BaseModel):
    """Model for bulk declaration operations"""
    declaration_ids: List[str] = Field(..., min_items=1, max_items=50, description="Declaration IDs")
    operation: str = Field(..., description="Operation to perform")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Operation parameters")
    notes: Optional[str] = Field(None, description="Operation notes")


class DeclarationActivity(BaseModel):
    """Model for declaration activity tracking"""
    declaration_id: str = Field(..., description="Declaration ID")
    user_id: str = Field(..., description="User performing action")
    action: str = Field(..., description="Action performed")
    details: Optional[Dict[str, Any]] = Field(None, description="Action details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Activity timestamp")
    ip_address: Optional[str] = Field(None, description="User IP address")
    user_agent: Optional[str] = Field(None, description="User agent")


class DeclarationNotification(BaseModel):
    """Model for declaration notifications"""
    declaration_id: str = Field(..., description="Declaration ID")
    recipient_id: str = Field(..., description="Recipient user ID")
    notification_type: str = Field(..., description="Notification type")
    title: str = Field(..., description="Notification title")
    message: str = Field(..., description="Notification message")
    channels: List[str] = Field(..., description="Notification channels (email, sms, push)")
    sent_at: Optional[datetime] = Field(None, description="Send timestamp")
    read_at: Optional[datetime] = Field(None, description="Read timestamp")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")