"""
Company Models - Pydantic schemas for companies and user_company_roles

ALIGNED WITH DATABASE_SCHEMA_REFERENCE.md
Tables: companies, user_company_roles
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CompanyMemberRole(str, Enum):
    """
    Company member roles (STRICTLY for user_company_roles table)

    ALIGNED WITH: company_role_enum in DATABASE_SCHEMA_REFERENCE.md

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
    """
    Base company model

    ALIGNED WITH DATABASE_SCHEMA_REFERENCE.md
    Table: companies
    """

    # Required fields - ALIGNED WITH DB
    legal_name: str = Field(..., min_length=2, max_length=255, description="Legal company name (NOT NULL) - DB: legal_name")
    tax_id: str = Field(..., min_length=5, max_length=100, description="Tax identification number (unique, NOT NULL) - DB: tax_id")

    # Optional fields - ALIGNED WITH DB
    trade_name: Optional[str] = Field(None, max_length=255, description="Trade name (nullable) - DB: trade_name")
    primary_sector_id: Optional[int] = Field(None, description="FK to sectors.id (nullable) - DB: primary_sector_id")

    address: Optional[str] = Field(None, description="Company address (text, nullable) - DB: address")
    city: Optional[str] = Field(None, max_length=100, description="City (varchar 100, nullable) - DB: city")
    phone: Optional[str] = Field(None, max_length=20, pattern="^(222|555|551|333)\\d{6}$", description="Phone number (varchar 20, nullable) - DB: phone")
    email: Optional[EmailStr] = Field(None, description="Email (varchar 255, nullable) - DB: email")

    # Status fields - ALIGNED WITH DB
    is_active: Optional[bool] = Field(True, description="Active status (default true) - DB: is_active")
    is_verified: Optional[bool] = Field(False, description="Verification status (default false) - DB: is_verified")


class CompanyCreate(CompanyBase):
    """Create company schema"""
    pass


class CompanyUpdate(BaseModel):
    """
    Update company schema

    ALIGNED WITH DB - All fields optional for partial updates
    """
    legal_name: Optional[str] = Field(None, min_length=2, max_length=255)
    trade_name: Optional[str] = Field(None, max_length=255)
    primary_sector_id: Optional[int] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class CompanyResponse(CompanyBase):
    """
    Company response schema

    ALIGNED WITH DATABASE_SCHEMA_REFERENCE.md
    Table: companies
    """
    # Database fields - ALIGNED WITH DB
    id: str = Field(..., description="Company UUID - DB: id")
    created_at: datetime = Field(..., description="Creation timestamp - DB: created_at")
    updated_at: datetime = Field(..., description="Last update timestamp - DB: updated_at")

    # Related data (populated by joins or business logic)
    owner_user_id: Optional[str] = Field(None, description="Owner user ID (from user_company_roles JOIN where role=company_owner)")
    primary_sector_name: Optional[str] = Field(None, description="Sector name (from sectors JOIN)")
    member_count: Optional[int] = Field(0, description="Total members count (from user_company_roles COUNT)")

    class Config:
        from_attributes = True


class CompanyMember(BaseModel):
    """
    Company member schema

    ALIGNED WITH DATABASE_SCHEMA_REFERENCE.md
    Table: user_company_roles
    """
    # Database fields - ALIGNED WITH DB
    user_id: str = Field(..., description="User UUID (composite PK) - DB: user_id")
    company_id: str = Field(..., description="Company UUID (composite PK) - DB: company_id")
    role: CompanyMemberRole = Field(..., description="Company role (company_role_enum) - DB: role")
    is_active: Optional[bool] = Field(True, description="Active status (default true) - DB: is_active")
    assigned_at: Optional[datetime] = Field(None, description="Assignment timestamp (default now()) - DB: assigned_at")

    # Related data (populated by joins)
    user_email: Optional[str] = Field(None, description="User email (from users JOIN)")
    user_name: Optional[str] = Field(None, description="User name (from users JOIN)")

    class Config:
        from_attributes = True


class CompanyListResponse(BaseModel):
    """Paginated company list"""
    companies: List[CompanyResponse]
    total: int
    page: int
    page_size: int
