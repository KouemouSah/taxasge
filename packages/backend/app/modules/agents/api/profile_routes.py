"""
Agent Profile Routes - New unified agent profile management API

Routes for the agent_profiles table (migration 047/048).
Supports both ministry_agent and entity_agent types.

Key endpoints:
- GET /profiles/me - Get current user's agent profile
- GET /profiles - List agent profiles with filters
- POST /profiles - Create agent profile
- PUT /profiles/{id} - Update agent profile
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import Dict, Any, List, Optional
from uuid import UUID
from loguru import logger

from app.modules.agents.models.agent_profile import (
    AgentProfileCreate,
    AgentProfileUpdate,
    AgentProfileResponse,
    AgentProfileWithDetails,
    AgentListFilters,
    AgentCompleteCreate,
    AgentCompleteResponse,
    AdminCreateRequest,
    AdminCreateResponse,
    AgentType,
)
from app.modules.agents.repositories.agent_profile_repository import AgentProfileRepository
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import permission_required
from app.database.connection import get_database

router = APIRouter(prefix="/profiles", tags=["Agent Profiles"])

profile_repository = AgentProfileRepository()


# ============================================================================
# CURRENT USER PROFILE
# ============================================================================

@router.get("/me", response_model=AgentProfileWithDetails)
async def get_my_profile(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """
    Get current user's agent profile.

    Returns the agent profile with entity/ministry details joined.
    Use this to determine which dashboard menu to show.
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    profile = await profile_repository.get_with_details(db, user_id=UUID(user_id))

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No agent profile found for current user"
        )

    return AgentProfileWithDetails(**profile)


# ============================================================================
# CRUD OPERATIONS
# ============================================================================

@router.get("", response_model=List[AgentProfileWithDetails])
async def list_profiles(
    agent_type: Optional[AgentType] = None,
    is_supervisor: Optional[bool] = None,
    ministry_id: Optional[int] = None,
    entity_id: Optional[str] = None,
    is_active: bool = True,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """List agent profiles with optional filters"""
    filters = AgentListFilters(
        agent_type=agent_type,
        is_supervisor=is_supervisor,
        ministry_id=ministry_id,
        entity_id=UUID(entity_id) if entity_id else None,
        is_active=is_active,
        limit=page_size,
        offset=(page - 1) * page_size,
    )

    profiles = await profile_repository.list_with_details(db, filters)
    return [AgentProfileWithDetails(**p) for p in profiles]


@router.get("/{profile_id}", response_model=AgentProfileWithDetails)
async def get_profile(
    profile_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Get agent profile by ID"""
    profile = await profile_repository.get_with_details(db, profile_id=UUID(profile_id))

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found"
        )

    return AgentProfileWithDetails(**profile)


@router.get("/user/{user_id}", response_model=AgentProfileWithDetails)
async def get_profile_by_user(
    user_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Get agent profile by user ID"""
    profile = await profile_repository.get_with_details(db, user_id=UUID(user_id))

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found for user"
        )

    return AgentProfileWithDetails(**profile)


@router.post("", response_model=AgentProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile: AgentProfileCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
    _: None = Depends(permission_required("agents.create"))
):
    """
    Create agent profile for existing user.

    The user must already exist with role='agent'.
    For creating user + profile atomically, use POST /complete.
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    # Set assigned_by if not provided
    if not profile.assigned_by:
        profile.assigned_by = UUID(user_id)

    # Check if profile already exists
    existing = await profile_repository.get_by_user_id(db, profile.user_id, active_only=False)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Agent profile already exists for this user"
        )

    result = await profile_repository.create(db, profile)

    logger.info(f"User {user_id} created agent profile {result['id']} for user {profile.user_id}")
    return AgentProfileResponse(**result)


@router.put("/{profile_id}", response_model=AgentProfileResponse)
async def update_profile(
    profile_id: str,
    update_data: AgentProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
    _: None = Depends(permission_required("agents.update"))
):
    """Update agent profile"""
    updated = await profile_repository.update(db, UUID(profile_id), update_data)

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found"
        )

    logger.info(f"Agent profile {profile_id} updated")
    return AgentProfileResponse(**updated)


@router.post("/{profile_id}/deactivate", status_code=status.HTTP_200_OK)
async def deactivate_profile(
    profile_id: str,
    reason: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
    _: None = Depends(permission_required("agents.deactivate"))
):
    """Deactivate agent profile"""
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    success = await profile_repository.deactivate(db, UUID(profile_id), UUID(user_id), reason)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found"
        )

    logger.info(f"Agent profile {profile_id} deactivated by {user_id}")
    return {"message": "Agent profile deactivated successfully", "profile_id": profile_id}


@router.post("/{profile_id}/reactivate", status_code=status.HTTP_200_OK)
async def reactivate_profile(
    profile_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Reactivate agent profile"""
    success = await profile_repository.reactivate(db, UUID(profile_id))

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found"
        )

    logger.info(f"Agent profile {profile_id} reactivated")
    return {"message": "Agent profile reactivated successfully", "profile_id": profile_id}


# ============================================================================
# COMPLETE CREATION (User + Profile atomically)
# ============================================================================

@router.post("/complete", response_model=AgentCompleteResponse, status_code=status.HTTP_201_CREATED)
async def create_agent_complete(
    data: AgentCompleteCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
    _: None = Depends(permission_required("agents.create"))
):
    """
    Create agent user + profile atomically.

    This endpoint:
    1. Creates a user with role='agent' and email_verified=False
    2. Creates an agent_profile linked to that user

    Use for: Creating new agents from admin panel.
    """
    from app.modules.agents.services.agent_profile_service import AgentProfileService

    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    service = AgentProfileService()
    result = await service.create_agent_complete(db, data, UUID(user_id))

    logger.info(f"User {user_id} created complete agent {result['user_id']}")
    return AgentCompleteResponse(**result)


@router.post("/admin", response_model=AdminCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(
    data: AdminCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
    _: None = Depends(permission_required("admins.create"))
):
    """
    Create admin user (no agent profile needed).

    This endpoint creates a user with role='admin' and email_verified=False.
    """
    from app.modules.agents.services.agent_profile_service import AgentProfileService

    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    service = AgentProfileService()
    result = await service.create_admin(db, data, UUID(user_id))

    logger.info(f"User {user_id} created admin {result['user_id']}")
    return AdminCreateResponse(**result)


# ============================================================================
# STATISTICS & LISTS
# ============================================================================

@router.get("/supervisors/list", response_model=List[AgentProfileWithDetails])
async def list_supervisors(
    ministry_id: Optional[int] = None,
    entity_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """List supervisor agents"""
    filters = AgentListFilters(
        is_supervisor=True,
        ministry_id=ministry_id,
        entity_id=UUID(entity_id) if entity_id else None,
        is_active=True,
        limit=100,
    )

    profiles = await profile_repository.list_with_details(db, filters)
    return [AgentProfileWithDetails(**p) for p in profiles]


@router.get("/ministry/{ministry_id}/available", response_model=List[AgentProfileWithDetails])
async def list_available_by_ministry(
    ministry_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """List available agents for a ministry"""
    profiles = await profile_repository.list_available_by_ministry(db, ministry_id)
    return [AgentProfileWithDetails(**p) for p in profiles]


@router.get("/entity/{entity_id}/available", response_model=List[AgentProfileWithDetails])
async def list_available_by_entity(
    entity_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """List available agents for an entity"""
    profiles = await profile_repository.list_available_by_entity(db, UUID(entity_id))
    return [AgentProfileWithDetails(**p) for p in profiles]
