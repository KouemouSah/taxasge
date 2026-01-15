"""
Users management API for TaxasGE Backend
CRUD operations and profile management for citizens and businesses
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query, Path
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List
from datetime import datetime
from loguru import logger

security = HTTPBearer()
from app.modules.users.models.user import (
    UserCreate, UserUpdate, UserResponse, UserListResponse,
    UserSearchFilter, UserStats, PasswordChange, UserActivity,
    UserRole, UserStatus
)
from app.repositories.user_repository import user_repository
from app.database.connection import get_database

# Create router
router = APIRouter(tags=["Admin - User Management"])


# NOTE: Authentication moved to app.core.auth (JWT-based, no mocks)
# Re-export for backward compatibility with tests
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import permission_required

# Make get_current_user available for patching in tests
__all__ = ["router", "get_current_user"]


@router.get("/")
async def get_users_info():
    """
    Get admin users API information

    ADMIN ONLY - User management endpoints
    For self-service user endpoints, see /api/v1/users
    """
    return {
        "message": "TaxasGE Admin - User Management API",
        "version": "1.0.0",
        "note": "ADMIN ONLY - Requires admin role",
        "self_service": "See /api/v1/users for user self-service endpoints",
        "endpoints": {
            "list": "GET /admin/users - List all users (admin)",
            "create": "POST /admin/users - Create new user (admin)",
            "get": "GET /admin/users/{user_id} - Get user by ID (admin)",
            "update": "PUT /admin/users/{user_id} - Update user (admin)",
            "delete": "DELETE /admin/users/{user_id} - Delete user (admin)",
            "search": "GET /admin/users/search - Search users (admin)",
            "stats": "GET /admin/users/stats - User statistics (admin)",
            "activities": "GET /admin/users/{user_id}/activities - User activities (admin)"
        },
        "roles": [role.value for role in UserRole],
        "status": [status.value for status in UserStatus]
    }


@router.get("", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    status: Optional[UserStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search query"),
    admin_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("users.view_all"))
):
    """List all users with pagination - Requires users.view_all permission"""
    try:
        # Build filters
        filters = {}
        if role:
            filters["role"] = role.value
        if status:
            filters["status"] = status.value

        # Add search filter if provided
        if search:
            filters["search"] = search

        # Calculate offset
        offset = (page - 1) * size

        # Get users and total count
        users = await user_repository.find_all(
            filters=filters,
            limit=size,
            offset=offset,
            order_by="created_at DESC"
        )

        total = await user_repository.count(filters)
        pages = (total + size - 1) // size

        # Log activity
        activity = UserActivity(
            user_id=admin_user.id,
            action="list_users",
            resource="users",
            metadata={"page": page, "page_size": size, "filters": filters},
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return UserListResponse(
            items=users,
            total=total,
            page=page,
            page_size=size,
            pages=pages
        )

    except Exception as e:
        logger.error(f"L Error listing users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving users"
        )


@router.post("", response_model=UserResponse)
async def create_user(
    user_create: UserCreate,
    admin_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("users.create"))
):
    """Create new user - Requires users.create permission"""
    try:
        from app.modules.auth.services.password_service import PasswordService
        password_service = PasswordService()

        # Check if user already exists
        existing_user = await user_repository.find_by_email(user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )

        # Hash password using bcrypt
        password_hash = password_service.hash_password(user_create.password)

        # Create user
        new_user = await user_repository.create_user(user_create, password_hash)
        if not new_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )

        # Log activity
        activity = UserActivity(
            user_id=admin_user.id,
            action="create_user",
            resource="users",
            metadata={"created_user_id": new_user.id, "role": user_create.role.value},
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return new_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )


@router.get("/stats", response_model=UserStats)
async def get_user_stats(
    admin_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("users.view_stats"))
):
    """Get user statistics - Requires users.view_stats permission"""
    try:
        stats = await user_repository.get_user_stats()

        # Log activity
        activity = UserActivity(
            user_id=admin_user.id,
            action="view_user_stats",
            resource="user_stats",
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return stats

    except Exception as e:
        logger.error(f"L Error getting user stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user statistics"
        )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str = Path(..., description="User ID", pattern=r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"),
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Get user by ID

    Users can view their own profile, or any profile with users.view permission
    """
    try:
        # Users can view their own profile without special permission
        # For viewing other users, check permission
        if current_user.id != user_id:
            # This will check users.view permission (admins auto-approved)
            from app.modules.permissions.services.permission_service import create_permission_service
            perm_service = create_permission_service(db)
            has_perm = await perm_service.has_permission(current_user.id, "users.view")
            if not has_perm:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )

        user = await user_repository.find_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Log activity
        activity = UserActivity(
            user_id=current_user.id,
            action="view_user",
            resource="user_profile",
            metadata={"viewed_user_id": user_id},
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error getting user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user"
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str = Path(..., description="User ID", pattern=r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"),
    user_update: UserUpdate = ...,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Update user by ID

    **VALIDATION:**
    - Email format: EmailStr (RFC 5322)
    - Email uniqueness: 409 Conflict if duplicate
    - Phone E.164 format: +240XXXXXXXXX
    - Protected fields: status (requires users.update_any permission)

    **Source:** UC-USER-002 (.github/docs-internal/Documentations/Backend/use_cases/02_USERS.md)
    """
    try:
        # Users can update their own profile without special permission
        # For updating other users, check permission
        if current_user.id != user_id:
            from app.modules.permissions.services.permission_service import create_permission_service
            perm_service = create_permission_service(db)
            has_perm = await perm_service.has_permission(current_user.id, "users.update_any")
            if not has_perm:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )

        # Only users with users.update_any can update status
        update_data = {
            k: v for k, v in user_update.dict(exclude_unset=True).items()
            if v is not None
        }

        # Check if user can modify protected fields
        if current_user.id != user_id and "status" in update_data:
            from app.modules.permissions.services.permission_service import create_permission_service
            perm_service = create_permission_service(db)
            has_perm = await perm_service.has_permission(current_user.id, "users.update_any")
            if not has_perm:
                del update_data["status"]

        # Get target user for email comparison
        target_user = await user_repository.find_by_id(user_id)
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Email uniqueness check (UC-USER-002 requirement)
        if "email" in update_data and update_data["email"] != target_user.email:
            existing_user = await user_repository.find_by_email(update_data["email"])
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already in use"
                )

        if not update_data:
            return target_user

        updated_user = await user_repository.update(user_id, update_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Log activity
        activity = UserActivity(
            user_id=current_user.id,
            action="update_user",
            resource="user_profile",
            metadata={"updated_user_id": user_id, "updated_fields": list(update_data.keys())},
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return updated_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error updating user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user"
        )


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: str = Path(..., description="User ID", pattern=r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"),
    admin_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("users.delete"))
):
    """Delete user by ID - Requires users.delete permission"""
    try:
        # Check if user exists
        user = await user_repository.find_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Cannot delete admin users
        if user.role == UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete admin users"
            )

        success = await user_repository.delete(user_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete user"
            )

        # Log activity
        activity = UserActivity(
            user_id=admin_user.id,
            action="delete_user",
            resource="users",
            metadata={"deleted_user_id": user_id, "deleted_user_email": user.email},
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return {"message": "User deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error deleting user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting user"
        )


@router.get("/search", response_model=List[UserResponse])
async def search_users(
    q: Optional[str] = Query(None, description="Search query"),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    status: Optional[UserStatus] = Query(None, description="Filter by status"),
    country: Optional[str] = Query(None, description="Filter by country"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results"),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("users.search"))
):
    """Search users - Requires users.search permission"""
    try:

        search_filter = UserSearchFilter(
            search_query=q,
            role=role,
            status=status,
            country=country
        )

        users = await user_repository.search_users(search_filter)

        # Limit results
        if len(users) > limit:
            users = users[:limit]

        # Log activity
        activity = UserActivity(
            user_id=current_user.id,
            action="search_users",
            resource="users",
            metadata={"query": q, "filters": search_filter.dict(exclude_none=True)},
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return users

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error searching users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error searching users"
        )


@router.get("/{user_id}/activities", response_model=List[UserActivity])
async def get_user_activities(
    user_id: str = Path(..., description="User ID", pattern=r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"),
    limit: int = Query(50, ge=1, le=200, description="Maximum activities"),
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Get user activity history

    Users can view their own activities, or any user's activities with users.view_any_activities permission
    """
    try:
        # Users can view their own activities without special permission
        # For viewing other users' activities, check permission
        if current_user.id != user_id:
            from app.modules.permissions.services.permission_service import create_permission_service
            perm_service = create_permission_service(db)
            has_perm = await perm_service.has_permission(current_user.id, "users.view_any_activities")
            if not has_perm:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )

        activities = await user_repository.get_user_activities(user_id, limit)

        # Log activity (but don't create infinite loop)
        if current_user.id != user_id:
            activity = UserActivity(
                user_id=current_user.id,
                action="view_user_activities",
                resource="user_activities",
                metadata={"viewed_user_id": user_id},
                timestamp=datetime.utcnow()
            )
            await user_repository.log_user_activity(activity)

        return activities

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error getting user activities for {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user activities"
        )