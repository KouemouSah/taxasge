"""
User models for TaxasGE Backend
Pydantic v2 models for user management and authentication
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr, validator
from enum import Enum

# Import existing UserRole from auth.py to maintain consistency
from app.api.v1.auth import UserRole, UserStatus


class UserProfile(BaseModel):
    """Base user profile information"""
    first_name: str = Field(..., min_length=2, max_length=50, description="User first name")
    last_name: str = Field(..., min_length=2, max_length=50, description="User last name")
    phone: Optional[str] = Field(None, pattern=r"^\+[1-9]\d{1,14}$", description="International phone number")
    address: Optional[str] = Field(None, max_length=200, description="User address")
    city: Optional[str] = Field(None, max_length=50, description="City")
    country: str = Field(default="GQ", description="Country code (ISO 3166-1 alpha-2)")
    language: str = Field(default="es", pattern="^(es|fr|en)$", description="Preferred language")
    avatar_url: Optional[str] = Field(None, description="Profile picture URL")


class CitizenProfile(UserProfile):
    """Citizen-specific profile information"""
    national_id: Optional[str] = Field(None, max_length=20, description="National ID number")
    birth_date: Optional[datetime] = Field(None, description="Date of birth")
    gender: Optional[str] = Field(None, pattern="^(M|F|O)$", description="Gender (M/F/O)")
    marital_status: Optional[str] = Field(
        None,
        pattern="^(single|married|divorced|widowed)$",
        description="Marital status"
    )
    occupation: Optional[str] = Field(None, max_length=100, description="Professional occupation")


class BusinessProfile(UserProfile):
    """Business-specific profile information"""
    business_name: str = Field(..., min_length=2, max_length=100, description="Business name")
    business_type: str = Field(
        ...,
        pattern="^(sole_proprietor|corporation|partnership|cooperative|ngo)$",
        description="Type of business entity"
    )
    tax_id: Optional[str] = Field(None, max_length=20, description="Business tax ID")
    registration_number: Optional[str] = Field(None, max_length=30, description="Business registration number")
    industry: Optional[str] = Field(None, max_length=100, description="Industry sector")
    employee_count: Optional[int] = Field(None, ge=0, le=10000, description="Number of employees")
    annual_revenue: Optional[float] = Field(None, ge=0, description="Annual revenue in XAF")
    website: Optional[str] = Field(None, description="Business website URL")


class UserCreate(BaseModel):
    """Model for user creation"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=100, description="User password")
    role: UserRole = Field(default=UserRole.citizen, description="User role")
    profile: UserProfile = Field(..., description="User profile information")

    # Additional fields for specific roles
    citizen_profile: Optional[CitizenProfile] = Field(None, description="Citizen-specific profile")
    business_profile: Optional[BusinessProfile] = Field(None, description="Business-specific profile")

    @validator('citizen_profile')
    def validate_citizen_profile(cls, v, values):
        """Validate citizen profile based on role"""
        if values.get('role') == UserRole.citizen and not v:
            raise ValueError("Citizen profile is required for citizen role")
        return v

    @validator('business_profile')
    def validate_business_profile(cls, v, values):
        """Validate business profile based on role"""
        if values.get('role') == UserRole.business and not v:
            raise ValueError("Business profile is required for business role")
        return v


class UserUpdate(BaseModel):
    """Model for user updates"""
    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    phone: Optional[str] = Field(None, pattern=r"^\+[1-9]\d{1,14}$")
    address: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field(None, pattern="^(es|fr|en)$")
    avatar_url: Optional[str] = None

    # Allow status updates for admins
    status: Optional[UserStatus] = None


class PasswordChange(BaseModel):
    """Model for password change"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=100, description="New password")
    confirm_password: str = Field(..., description="Confirm new password")

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        """Validate password confirmation"""
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class UserResponse(BaseModel):
    """Model for user response (public data)"""
    id: str = Field(..., description="User ID")
    email: EmailStr = Field(..., description="User email")
    role: UserRole = Field(..., description="User role")
    status: UserStatus = Field(..., description="User status")
    first_name: str = Field(..., description="User first name")
    last_name: str = Field(..., description="User last name")
    phone: Optional[str] = Field(None, description="Phone number")
    address: Optional[str] = Field(None, description="Address")
    city: Optional[str] = Field(None, description="City")
    country: str = Field(..., description="Country code")
    language: str = Field(..., description="Preferred language")
    avatar_url: Optional[str] = Field(None, description="Profile picture URL")
    created_at: datetime = Field(..., description="Account creation date")
    updated_at: datetime = Field(..., description="Last update date")
    last_login: Optional[datetime] = Field(None, description="Last login date")

    # Extended profile data based on role
    citizen_profile: Optional[CitizenProfile] = None
    business_profile: Optional[BusinessProfile] = None


class UserListResponse(BaseModel):
    """Model for paginated user list response"""
    users: List[UserResponse] = Field(..., description="List of users")
    total: int = Field(..., description="Total number of users")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Page size")
    pages: int = Field(..., description="Total number of pages")


class UserSearchFilter(BaseModel):
    """Model for user search and filtering"""
    email: Optional[str] = Field(None, description="Filter by email (partial match)")
    role: Optional[UserRole] = Field(None, description="Filter by user role")
    status: Optional[UserStatus] = Field(None, description="Filter by user status")
    country: Optional[str] = Field(None, description="Filter by country")
    city: Optional[str] = Field(None, description="Filter by city")
    language: Optional[str] = Field(None, description="Filter by language")
    created_after: Optional[datetime] = Field(None, description="Filter by creation date (after)")
    created_before: Optional[datetime] = Field(None, description="Filter by creation date (before)")
    search_query: Optional[str] = Field(None, description="Full-text search query")


class UserStats(BaseModel):
    """Model for user statistics"""
    total_users: int = Field(..., description="Total number of users")
    active_users: int = Field(..., description="Number of active users")
    new_users_this_month: int = Field(..., description="New users this month")
    users_by_role: Dict[str, int] = Field(..., description="User count by role")
    users_by_status: Dict[str, int] = Field(..., description="User count by status")
    users_by_country: Dict[str, int] = Field(..., description="User count by country")


class UserActivity(BaseModel):
    """Model for user activity tracking"""
    user_id: str = Field(..., description="User ID")
    action: str = Field(..., description="Action performed")
    resource: Optional[str] = Field(None, description="Resource affected")
    ip_address: Optional[str] = Field(None, description="IP address")
    user_agent: Optional[str] = Field(None, description="User agent")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Activity timestamp")


class UserNotificationPreferences(BaseModel):
    """Model for user notification preferences"""
    email_notifications: bool = Field(default=True, description="Enable email notifications")
    sms_notifications: bool = Field(default=False, description="Enable SMS notifications")
    push_notifications: bool = Field(default=True, description="Enable push notifications")
    declaration_reminders: bool = Field(default=True, description="Declaration deadline reminders")
    payment_confirmations: bool = Field(default=True, description="Payment confirmations")
    system_updates: bool = Field(default=False, description="System update notifications")
    marketing_communications: bool = Field(default=False, description="Marketing communications")