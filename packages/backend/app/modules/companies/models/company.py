"""Company models - Pydantic schemas"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CompanyMemberRole(str, Enum):
    """Company member roles"""
    OWNER = "owner"
    ADMIN = "admin"
    ACCOUNTANT = "accountant"
    MEMBER = "member"


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
