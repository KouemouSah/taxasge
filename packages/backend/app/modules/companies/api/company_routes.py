"""Company Routes - Business Company Management API

Includes:
- User-scoped CRUD (membership-based access)
- Admin endpoints (permission-based access)
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer
from typing import Dict, Any, List, Optional
from loguru import logger

from app.modules.companies.models import (
    CompanyCreate, CompanyUpdate, CompanyResponse,
    CompanyListResponse, CompanyMember, CompanyMemberRole,
    AddMemberRequest, UpdateMemberRoleRequest,
    CompanyAdminResponse, CompanyAdminListResponse,
    CompanyStatsResponse, CompanySearchResult, CompanyVerifyRequest,
    CompanyClassifyResponse,
)
from app.modules.companies.repositories import CompanyRepository
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import permission_required
from app.database.connection import get_database

router = APIRouter(tags=["Companies"])
security = HTTPBearer()
company_repository = CompanyRepository()


# =============================================================================
# IMPORTANT: Static/admin paths MUST be declared BEFORE /{company_id}
# to avoid FastAPI matching "admin" as a UUID → 422 error.
# =============================================================================


# =============================================================================
# ADMIN ENDPOINTS (permission-based)
# =============================================================================

@router.get("/admin/all", response_model=CompanyAdminListResponse)
async def admin_list_all_companies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    is_active: Optional[bool] = Query(None),
    is_verified: Optional[bool] = Query(None),
    regimen_fiscal: Optional[str] = Query(None),
    zone_id: Optional[str] = Query(None),
    city_id: Optional[str] = Query(None),
    sort_by: str = Query("created_at", regex="^(created_at|legal_name|is_active|is_verified|member_count|license_count)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _=Depends(permission_required("company.view_all")),
):
    """List all companies with filters — admin view."""
    offset = (page - 1) * page_size

    items = await company_repository.list_all(
        db, limit=page_size, offset=offset,
        search=search, is_active=is_active, is_verified=is_verified,
        regimen_fiscal=regimen_fiscal, zone_id=zone_id, city_id=city_id,
        sort_by=sort_by, sort_order=sort_order,
    )
    total = await company_repository.count_all(
        db, search=search, is_active=is_active, is_verified=is_verified,
        regimen_fiscal=regimen_fiscal, zone_id=zone_id, city_id=city_id,
    )

    return CompanyAdminListResponse(
        items=[CompanyAdminResponse(**c) for c in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/admin/stats", response_model=CompanyStatsResponse)
async def admin_company_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _=Depends(permission_required("company.view_stats")),
):
    """Aggregated company statistics for admin dashboard."""
    stats = await company_repository.get_stats(db)
    return CompanyStatsResponse(**stats)


@router.get("/admin/search", response_model=List[CompanySearchResult])
async def admin_search_companies(
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(10, ge=1, le=50),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _=Depends(permission_required("company.view")),
):
    """Lightweight company search for autocomplete (admin/agent)."""
    results = await company_repository.search(db, q, limit)
    return [CompanySearchResult(**r) for r in results]


@router.put("/admin/{company_id}/verify", response_model=CompanyResponse)
async def admin_verify_company(
    company_id: str,
    body: CompanyVerifyRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _=Depends(permission_required("company.verify")),
):
    """Toggle company verification status (admin only)."""
    result = await company_repository.verify(db, company_id, body.is_verified)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")
    action = "verified" if body.is_verified else "unverified"
    logger.info(f"Admin {user_id} {action} company {company_id}")
    return CompanyResponse(**result)


@router.post("/admin/{company_id}/classify", response_model=CompanyClassifyResponse)
async def admin_classify_company(
    company_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _=Depends(permission_required("company.update")),
):
    """Classify company's fiscal regime using the 3-layer classification agent.

    Uses the same engine as auto-classification (rules + LLM + validation).
    Updates regimen_fiscal + commerce_type. Creates audit trail in
    company_classification_history.
    """
    from app.modules.companies.services.classification_agent import classification_agent

    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")
    result = await classification_agent.classify_and_update(
        db, company_id, triggered_by="manual",
        user_id=user_id,
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    logger.info(
        f"Admin {user_id} classified company {company_id}: "
        f"{result.regimen_fiscal} (confidence={result.confidence:.0%})"
    )
    return CompanyClassifyResponse(
        regimen_fiscal=result.regimen_fiscal,
        confidence=result.confidence,
        reason=result.reason,
    )


# =============================================================================
# SUPERVISOR ENDPOINTS (entity-scoped)
# =============================================================================

async def _get_supervisor_entity_id(user_id: str, db) -> Optional[str]:
    """Get entity_id from agent_profiles for the current user."""
    from uuid import UUID as _UUID
    uid = _UUID(user_id) if isinstance(user_id, str) else user_id
    row = await db.fetchrow(
        "SELECT entity_id, is_supervisor FROM agent_profiles WHERE user_id = $1 AND is_active = true",
        uid,
    )
    if not row:
        return None
    return str(row["entity_id"]) if row["entity_id"] else None


@router.get("/supervisor/my-companies", response_model=CompanyAdminListResponse)
async def supervisor_list_companies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    is_active: Optional[bool] = Query(None),
    is_verified: Optional[bool] = Query(None),
    regimen_fiscal: Optional[str] = Query(None),
    sort_by: str = Query("created_at", regex="^(created_at|legal_name|is_active|is_verified|member_count|license_count)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _=Depends(permission_required("company.view_entity_scoped")),
):
    """List companies scoped to supervisor's entity cities.

    Scoping: entity → entity_locations → city_ids →
    companies (city_id match OR commercial_licenses.city_id match).
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    entity_id = await _get_supervisor_entity_id(user_id, db)
    if not entity_id:
        # No entity = no scope = empty result
        return CompanyAdminListResponse(items=[], total=0, page=page, page_size=page_size)

    city_ids = await company_repository.get_entity_city_ids(db, entity_id)
    if not city_ids:
        return CompanyAdminListResponse(items=[], total=0, page=page, page_size=page_size)

    offset = (page - 1) * page_size
    items = await company_repository.list_all(
        db, limit=page_size, offset=offset,
        search=search, is_active=is_active, is_verified=is_verified,
        regimen_fiscal=regimen_fiscal, city_ids=city_ids,
        sort_by=sort_by, sort_order=sort_order,
    )
    total = await company_repository.count_all(
        db, search=search, is_active=is_active, is_verified=is_verified,
        regimen_fiscal=regimen_fiscal, city_ids=city_ids,
    )

    return CompanyAdminListResponse(
        items=[CompanyAdminResponse(**c) for c in items],
        total=total, page=page, page_size=page_size,
    )


@router.get("/supervisor/stats", response_model=CompanyStatsResponse)
async def supervisor_company_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _=Depends(permission_required("company.view_entity_scoped")),
):
    """Entity-scoped company statistics for supervisor dashboard."""
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    entity_id = await _get_supervisor_entity_id(user_id, db)
    if not entity_id:
        return CompanyStatsResponse()

    city_ids = await company_repository.get_entity_city_ids(db, entity_id)
    if not city_ids:
        return CompanyStatsResponse()

    stats = await company_repository.get_stats_by_cities(db, city_ids)
    return CompanyStatsResponse(**stats)


# =============================================================================
# USER-SCOPED ENDPOINTS (membership-based)
# =============================================================================

@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    company: CompanyCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """Create new company with auto-classification.

    After INSERT, automatically classifies the company's fiscal regime
    using the 3-layer classification agent (rules + LLM + validation).
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")
    result = await company_repository.create(db, company, user_id)
    company_id = result["id"]
    logger.info(f"User {user_id} created company {company_id}")

    # Auto-classify fiscal regime (non-blocking — failure doesn't break create)
    try:
        from app.modules.companies.services.classification_agent import classification_agent
        classification = await classification_agent.classify_company(
            db, result, result.get("zone_id")
        )
        if classification.regimen_fiscal != (result.get("regimen_fiscal") or "pendiente"):
            await db.execute(
                "UPDATE companies SET regimen_fiscal = $2, commerce_type = $3, updated_at = NOW() "
                "WHERE id = $1",
                company_id, classification.regimen_fiscal,
                classification.commerce_type,
            )
            result["regimen_fiscal"] = classification.regimen_fiscal
            result["commerce_type"] = classification.commerce_type
            logger.info(
                f"Auto-classified company {company_id}: {classification.regimen_fiscal} "
                f"(confidence={classification.confidence:.0%})"
            )
    except Exception as e:
        logger.warning(f"Auto-classification failed for company {company_id}: {e}")

    return CompanyResponse(**result)


@router.get("", response_model=CompanyListResponse)
async def list_companies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
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
    db=Depends(get_database),
):
    """Get company by ID"""
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    # Admin with company.view can access any company
    from app.modules.permissions.services.permission_service import get_permission_service
    perm_service = get_permission_service()
    has_view_all = await perm_service.has_permission(user_id, "company.view_all")

    if not has_view_all:
        # Non-admins must be members
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
    db=Depends(get_database),
):
    """Update company (owner/admin only)"""
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    # Admin with company.update can update any company
    from app.modules.permissions.services.permission_service import get_permission_service
    perm_service = get_permission_service()
    has_admin_perm = await perm_service.has_permission(user_id, "company.update")

    if not has_admin_perm:
        role = await company_repository.check_membership(db, company_id, user_id)
        if role not in ["company_owner", "company_admin"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires company_owner or company_admin role")

    updated = await company_repository.update(db, company_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    logger.info(f"User {user_id} updated company {company_id}")

    # Auto-reclassify if classification-relevant fields changed
    CLASSIFICATION_FIELDS = {
        "forma_juridica", "sector_actividad", "subsector_actividad",
        "capital_social", "employee_count", "commerce_type", "zone_id",
    }
    changed_fields = set(update_data.model_dump(exclude_unset=True).keys())
    if changed_fields & CLASSIFICATION_FIELDS:
        try:
            from app.modules.companies.services.classification_agent import classification_agent
            classification = await classification_agent.classify_company(
                db, updated, updated.get("zone_id")
            )
            old_regimen = updated.get("regimen_fiscal", "pendiente")
            if classification.regimen_fiscal != old_regimen:
                await db.execute(
                    "UPDATE companies SET regimen_fiscal = $2, commerce_type = $3, updated_at = NOW() "
                    "WHERE id = $1",
                    company_id, classification.regimen_fiscal,
                    classification.commerce_type,
                )
                updated["regimen_fiscal"] = classification.regimen_fiscal
                updated["commerce_type"] = classification.commerce_type
                logger.info(
                    f"Auto-reclassified company {company_id}: {old_regimen} → "
                    f"{classification.regimen_fiscal} (confidence={classification.confidence:.0%})"
                )
        except Exception as e:
            logger.warning(f"Auto-reclassification failed for company {company_id}: {e}")

    return CompanyResponse(**updated)


@router.delete("/{company_id}", status_code=status.HTTP_200_OK)
async def delete_company(
    company_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Delete company

    Requires either:
    - company_owner role in the company, OR
    - company.delete permission (admin override)
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    from app.modules.permissions.services.permission_service import get_permission_service
    perm_service = get_permission_service()
    has_admin_perm = await perm_service.has_permission(user_id, "company.delete")

    if not has_admin_perm:
        role = await company_repository.check_membership(db, company_id, user_id)
        if role != "company_owner":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires company_owner role or company.delete permission")

    deleted = await company_repository.delete(db, company_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    logger.info(f"User {user_id} deleted company {company_id}")
    return {"message": "Company deleted successfully"}


# =============================================================================
# MEMBER ENDPOINTS
# =============================================================================

@router.get("/{company_id}/members", response_model=List[CompanyMember])
async def get_company_members(
    company_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """Get company members"""
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    # Admin with company.manage_members can view any company's members
    from app.modules.permissions.services.permission_service import get_permission_service
    perm_service = get_permission_service()
    has_admin_perm = await perm_service.has_permission(user_id, "company.manage_members")

    if not has_admin_perm:
        role = await company_repository.check_membership(db, company_id, user_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member")

    members = await company_repository.get_members(db, company_id)
    return [CompanyMember(**m) for m in members]


@router.post("/{company_id}/members", response_model=CompanyMember)
async def add_company_member(
    company_id: str,
    body: AddMemberRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Add member to company

    Requires either:
    - company_owner or company_admin role in the company, OR
    - company.manage_members permission (admin override)
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    from app.modules.permissions.services.permission_service import get_permission_service
    perm_service = get_permission_service()
    has_admin_perm = await perm_service.has_permission(user_id, "company.manage_members")

    if not has_admin_perm:
        user_role = await company_repository.check_membership(db, company_id, user_id)
        if user_role not in ["company_owner", "company_admin"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires company_owner/company_admin role or company.manage_members permission")

    result = await company_repository.add_member(db, company_id, body.member_user_id, body.role)
    logger.info(f"User {user_id} added member {body.member_user_id} to company {company_id}")
    return CompanyMember(**result)


@router.put("/{company_id}/members/{member_user_id}/role", response_model=CompanyMember)
async def update_member_role(
    company_id: str,
    member_user_id: str,
    body: UpdateMemberRoleRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """Update member role within a company."""
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    from app.modules.permissions.services.permission_service import get_permission_service
    perm_service = get_permission_service()
    has_admin_perm = await perm_service.has_permission(user_id, "company.manage_members")

    if not has_admin_perm:
        user_role = await company_repository.check_membership(db, company_id, user_id)
        if user_role not in ["company_owner", "company_admin"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires company_owner/company_admin role or company.manage_members permission")

    result = await company_repository.update_member_role(db, company_id, member_user_id, body.role.value)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    logger.info(f"User {user_id} updated role of {member_user_id} in company {company_id} to {body.role.value}")
    return CompanyMember(**result)


@router.delete("/{company_id}/members/{member_user_id}", status_code=status.HTTP_200_OK)
async def remove_company_member(
    company_id: str,
    member_user_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """Remove member from company (owner/admin only)"""
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    from app.modules.permissions.services.permission_service import get_permission_service
    perm_service = get_permission_service()
    has_admin_perm = await perm_service.has_permission(user_id, "company.manage_members")

    if not has_admin_perm:
        user_role = await company_repository.check_membership(db, company_id, user_id)
        if user_role not in ["company_owner", "company_admin"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires company_owner or company_admin role")

    if member_user_id == user_id:
        user_role = await company_repository.check_membership(db, company_id, user_id)
        if user_role == "company_owner":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner cannot remove self")

    removed = await company_repository.remove_member(db, company_id, member_user_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    logger.info(f"User {user_id} removed member {member_user_id} from company {company_id}")
    return {"message": "Member removed successfully"}
