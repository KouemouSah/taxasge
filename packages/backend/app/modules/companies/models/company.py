"""Company models - Pydantic schemas"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CompanyMemberRole(str, Enum):
    """
    Company member roles (STRICTLY for user_company_roles table)

    IMPORTANT: These are DISTINCT from system user roles (citizen, business, accountant, admin)
    Prefixed with 'company_' to avoid confusion.

    Hierarchy: company_owner > company_admin > company_accountant > company_member

    Roles:
    - company_owner: Full permissions (transfer ownership, delete company, manage all)
    - company_admin: Manage members, declarations, payments (except ownership transfer/deletion)
    - company_accountant: Financial focus (declarations, payments, approval)
    - company_member: Basic access (own declarations only)
    """
    COMPANY_OWNER = "company_owner"
    COMPANY_ADMIN = "company_admin"
    COMPANY_ACCOUNTANT = "company_accountant"
    COMPANY_MEMBER = "company_member"


class CompanyBase(BaseModel):
    """Base company model"""
    name: str = Field(..., min_length=2, max_length=200)
    tax_id: str = Field(..., min_length=5, max_length=50, description="Tax identification number")
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, pattern="^(222|555|551|333)\\d{6}$")
    address: Optional[str] = Field(None, max_length=300)
    city: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)


class CompanyCreate(CompanyBase):
    """Create company schema"""
    pass


class CompanyUpdate(BaseModel):
    """Update company schema"""
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    industry: Optional[str] = None


class CompanyResponse(CompanyBase):
    """Company response schema"""
    id: str
    owner_user_id: str
    created_at: datetime
    updated_at: datetime
    member_count: Optional[int] = 0

    class Config:
        from_attributes = True


class CompanyMember(BaseModel):
    """Company member schema"""
    user_id: str
    company_id: str
    role: CompanyMemberRole
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    added_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CompanyListResponse(BaseModel):
    """Paginated company list"""
    companies: List[CompanyResponse]
    total: int
    page: int
    page_size: int
