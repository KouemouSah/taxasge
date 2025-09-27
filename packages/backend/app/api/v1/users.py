"""
Users management API for TaxasGE Backend
CRUD operations and profile management for citizens and businesses
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query, Path
from fastapi.security import HTTPAuthorizationCredentials
from typing import Optional, List
from datetime import datetime
import hashlib
from loguru import logger

from app.api.v1.auth import security, UserRole, UserStatus
from app.models.user import (
    UserCreate, UserUpdate, UserResponse, UserListResponse,
    UserSearchFilter, UserStats, PasswordChange, UserActivity
)
from app.repositories.user_repository import user_repository
from app.database.connection import get_database

# Create router
router = APIRouter()


# Dependency to get current user from token
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserResponse:
    """Get current authenticated user"""
    try:
        # For now, use mock admin user - will be enhanced with JWT decoding
        mock_user = await user_repository.find_by_email("libressai@gmail.com")
        if not mock_user:
            # Create mock admin user if not exists
            from app.models.user import UserProfile
            from uuid import uuid4

            mock_data = {
                "id": str(uuid4()),
                "email": "libressai@gmail.com",
                "role": UserRole.admin,
                "status": UserStatus.active,
                "first_name": "System",
                "last_name": "Administrator",
                "phone": None,
                "address": None,
                "city": None,
                "country": "GQ",
                "language": "es",
                "avatar_url": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None,
                "citizen_profile": None,
                "business_profile": None
            }
            mock_user = UserResponse(**mock_data)

        return mock_user
    except Exception as e:
        logger.error(f"L Error getting current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )


# Dependency for admin access
async def require_admin(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    """Require admin role"""
    if current_user.role not in [UserRole.admin, UserRole.operator]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/")
async def get_users_info():
    """Get users API information"""
    return {
        "message": "TaxasGE Users Management API",
        "version": "1.0.0",
        "endpoints": {
            "list": "GET /users - List all users (admin)",
            "profile": "GET /profile - Get current user profile",
            "create": "POST /users - Create new user (admin)",
            "update": "PUT /users/{user_id} - Update user",
            "delete": "DELETE /users/{user_id} - Delete user (admin)",
            "search": "GET /users/search - Search users",
            "stats": "GET /users/stats - User statistics (admin)",
            "activities": "GET /users/{user_id}/activities - User activities"
        },
        "roles": [role.value for role in UserRole],
        "status": [status.value for status in UserStatus]
    }


@router.get("/profile", response_model=UserResponse)
async def get_user_profile(current_user: UserResponse = Depends(get_current_user)):
    """Get current user profile"""
    try:
        # Log activity
        activity = UserActivity(
            user_id=current_user.id,
            action="view_profile",
            resource="user_profile",
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return current_user
    except Exception as e:
        logger.error(f"L Error getting user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user profile"
        )


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update current user profile"""
    try:
        # Convert update model to dict, excluding None values
        update_data = {
            k: v for k, v in user_update.dict(exclude_unset=True).items()
            if v is not None
        }

        # Non-admin users cannot update status
        if current_user.role not in [UserRole.admin, UserRole.operator] and "status" in update_data:
            del update_data["status"]

        if not update_data:
            return current_user

        updated_user = await user_repository.update(current_user.id, update_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Log activity
        activity = UserActivity(
            user_id=current_user.id,
            action="update_profile",
            resource="user_profile",
            metadata={"updated_fields": list(update_data.keys())},
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return updated_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error updating user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user profile"
        )


@router.post("/password", status_code=status.HTTP_200_OK)
async def change_password(
    password_change: PasswordChange,
    current_user: UserResponse = Depends(get_current_user)
):
    """Change user password"""
    try:
        # For now, we'll use a simple hash - in production, use proper password hashing
        new_password_hash = hashlib.sha256(password_change.new_password.encode()).hexdigest()

        success = await user_repository.update_password(current_user.id, new_password_hash)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update password"
            )

        # Log activity
        activity = UserActivity(
            user_id=current_user.id,
            action="change_password",
            resource="user_password",
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return {"message": "Password updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error changing password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error changing password"
        )


@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    status: Optional[UserStatus] = Query(None, description="Filter by status"),
    admin_user: UserResponse = Depends(require_admin)
):
    """List all users with pagination (admin only)"""
    try:
        # Build filters
        filters = {}
        if role:
            filters["role"] = role.value
        if status:
            filters["status"] = status.value

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
            metadata={"page": page, "size": size, "filters": filters},
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return UserListResponse(
            users=users,
            total=total,
            page=page,
            size=size,
            pages=pages
        )

    except Exception as e:
        logger.error(f"L Error listing users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving users"
        )


@router.post("/users", response_model=UserResponse)
async def create_user(
    user_create: UserCreate,
    admin_user: UserResponse = Depends(require_admin)
):
    """Create new user (admin only)"""
    try:
        # Check if user already exists
        existing_user = await user_repository.find_by_email(user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )

        # Hash password
        password_hash = hashlib.sha256(user_create.password.encode()).hexdigest()

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


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str = Path(..., description="User ID"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user by ID"""
    try:
        # Users can only view their own profile unless they're admin
        if current_user.id != user_id and current_user.role not in [UserRole.admin, UserRole.operator]:
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


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str = Path(..., description="User ID"),
    user_update: UserUpdate = ...,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update user by ID"""
    try:
        # Users can only update their own profile unless they're admin
        if current_user.id != user_id and current_user.role not in [UserRole.admin, UserRole.operator]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Non-admin users cannot update status
        update_data = {
            k: v for k, v in user_update.dict(exclude_unset=True).items()
            if v is not None
        }

        if current_user.role not in [UserRole.admin, UserRole.operator] and "status" in update_data:
            del update_data["status"]

        if not update_data:
            user = await user_repository.find_by_id(user_id)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            return user

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


@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: str = Path(..., description="User ID"),
    admin_user: UserResponse = Depends(require_admin)
):
    """Delete user by ID (admin only)"""
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


@router.get("/users/search", response_model=List[UserResponse])
async def search_users(
    q: Optional[str] = Query(None, description="Search query"),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    status: Optional[UserStatus] = Query(None, description="Filter by status"),
    country: Optional[str] = Query(None, description="Filter by country"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Search users"""
    try:
        # Only admin and operators can search all users
        if current_user.role not in [UserRole.admin, UserRole.operator]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )

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


@router.get("/users/stats", response_model=UserStats)
async def get_user_stats(admin_user: UserResponse = Depends(require_admin)):
    """Get user statistics (admin only)"""
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


@router.get("/users/{user_id}/activities", response_model=List[UserActivity])
async def get_user_activities(
    user_id: str = Path(..., description="User ID"),
    limit: int = Query(50, ge=1, le=200, description="Maximum activities"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user activity history"""
    try:
        # Users can only view their own activities unless they're admin
        if current_user.id != user_id and current_user.role not in [UserRole.admin, UserRole.operator]:
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