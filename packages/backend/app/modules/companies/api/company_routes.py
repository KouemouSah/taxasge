"""Company Routes - Business Company Management API"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer
from typing import Dict, Any, List
from loguru import logger

from app.modules.companies.models import (
    CompanyCreate, CompanyUpdate, CompanyResponse,
    CompanyListResponse, CompanyMember, CompanyMemberRole
)
from app.modules.companies.repositories import CompanyRepository
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import permission_required
from app.database.connection import get_database

router = APIRouter(tags=["Companies"])
security = HTTPBearer()
company_repository = CompanyRepository()


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    company: CompanyCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Create new company"""
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")
    result = await company_repository.create(db, company, user_id)
    logger.info(f"User {user_id} created company {result['id']}")
    return CompanyResponse(**result)


@router.get("", response_model=CompanyListResponse)
async def list_companies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """List user's companies"""
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")
    offset = (page - 1) * page_size
    companies, total = await company_repository.list_by_user(db, user_id, page_size, offset)
    return CompanyListResponse(
        companies=[CompanyResponse(**c) for c in companies],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Get company by ID"""
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    # Check membership
    role = await company_repository.check_membership(db, company_id, user_id)
    if not role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member")

    company = await company_repository.get_by_id(db, company_id)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    return CompanyResponse(**company)


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    update_data: CompanyUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Update company (owner/admin only)"""
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    role = await company_repository.check_membership(db, company_id, user_id)
    if role not in ["company_owner", "company_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires company_owner or company_admin role")

    updated = await company_repository.update(db, company_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    logger.info(f"User {user_id} updated company {company_id}")
    return CompanyResponse(**updated)


@router.delete("/{company_id}", status_code=status.HTTP_200_OK)
async def delete_company(
    company_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """
    Delete company

    Requires either:
    - company_owner role in the company, OR
    - companies.delete permission (admin override)
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    # Check if user has admin permission to delete any company
    from app.modules.permissions.services.permission_service import get_permission_service
    perm_service = get_permission_service()
    has_admin_perm = await perm_service.has_permission(user_id, "companies.delete")

    if not has_admin_perm:
        # Non-admins must be company owner
        role = await company_repository.check_membership(db, company_id, user_id)
        if role != "company_owner":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires company_owner role or companies.delete permission")

    deleted = await company_repository.delete(db, company_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    logger.info(f"User {user_id} deleted company {company_id}")
    return {"message": "Company deleted successfully"}


@router.get("/{company_id}/members", response_model=List[CompanyMember])
async def get_company_members(
    company_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Get company members"""
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    role = await company_repository.check_membership(db, company_id, user_id)
    if not role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member")

    members = await company_repository.get_members(db, company_id)
    return [CompanyMember(**m) for m in members]


@router.post("/{company_id}/members", response_model=CompanyMember)
async def add_company_member(
    company_id: str,
    member_user_id: str,
    role: CompanyMemberRole,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """
    Add member to company

    Requires either:
    - company_owner or company_admin role in the company, OR
    - companies.manage_members permission (admin override)
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    # Check if user has admin permission to manage any company's members
    from app.modules.permissions.services.permission_service import get_permission_service
    perm_service = get_permission_service()
    has_admin_perm = await perm_service.has_permission(user_id, "companies.manage_members")

    if not has_admin_perm:
        # Non-admins must be company owner or admin
        user_role = await company_repository.check_membership(db, company_id, user_id)
        if user_role not in ["company_owner", "company_admin"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires company_owner/company_admin role or companies.manage_members permission")

    result = await company_repository.add_member(db, company_id, member_user_id, role)
    logger.info(f"User {user_id} added member {member_user_id} to company {company_id}")
    return CompanyMember(**result)


@router.delete("/{company_id}/members/{member_user_id}", status_code=status.HTTP_200_OK)
async def remove_company_member(
    company_id: str,
    member_user_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Remove member from company (owner/admin only)"""
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    user_role = await company_repository.check_membership(db, company_id, user_id)
    if user_role not in ["company_owner", "company_admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires company_owner or company_admin role")

    if member_user_id == user_id and user_role == "company_owner":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner cannot remove self")

    removed = await company_repository.remove_member(db, company_id, member_user_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    logger.info(f"User {user_id} removed member {member_user_id} from company {company_id}")
    return {"message": "Member removed successfully"}
