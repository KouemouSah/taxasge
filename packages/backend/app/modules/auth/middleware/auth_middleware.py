"""
Authentication Core - JWT-based authentication for TaxasGE Backend
Provides get_current_user dependency for route protection
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from loguru import logger

from app.modules.users.models.user import UserResponse
from app.repositories.user_repository import UserRepository
from app.modules.auth.services.auth_service import AuthService, get_auth_service

security = HTTPBearer()
user_repository = UserRepository()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserResponse:
    """
    Dependency to get current authenticated user from JWT token

    This replaces the mock authentication - uses real JWT validation

    Args:
        credentials: Bearer token from Authorization header

    Returns:
        UserResponse: Current authenticated user

    Raises:
        HTTPException 401: If token is invalid or user not found
        HTTPException 403: If user account is suspended
    """
    try:
        # Validate access token and get user data
        auth_service = get_auth_service()
        token_data = await auth_service.validate_access_token(credentials.credentials)

        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get user_id from token
        user_id = token_data.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Fetch full user from database
        user = await user_repository.find_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if user is suspended
        if user.status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account suspended. Contact administrator."
            )

        # Check if user is active
        if user.status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account status: {user.status}. Please verify your email or contact support."
            )

        return user

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """
    Dependency to get current active user (not suspended)

    Args:
        current_user: Current authenticated user

    Returns:
        UserResponse: Current active user

    Raises:
        HTTPException 403: If user is not active
    """
    if current_user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {current_user.status}"
        )
    return current_user


async def get_current_admin_user(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """
    Dependency to require admin role

    **IMPORTANT:** Admins have FULL ACCESS to ALL modules automatically.
    See .github/docs-internal/ADMIN_PERMISSIONS.md for details.

    Args:
        current_user: Current authenticated user

    Returns:
        UserResponse: Current admin user

    Raises:
        HTTPException 403: If user is not an admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_admin(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """
    Alias for get_current_admin_user (for backward compatibility)

    Admins have FULL ACCESS to ALL modules automatically.

    Args:
        current_user: Current authenticated user

    Returns:
        UserResponse: Current admin user

    Raises:
        HTTPException 403: If user is not an admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def is_admin(user: UserResponse) -> bool:
    """
    Helper function to check if a user is admin

    Args:
        user: User object

    Returns:
        True if user is admin
    """
    return user.role == "admin"
