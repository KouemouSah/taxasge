"""
Permission Middleware - Decorator for route permission checking
"""
from functools import wraps
from typing import Callable, Optional
from fastapi import HTTPException, status, Depends

from app.modules.auth.middleware.auth_middleware import get_current_user
from app.models.user import UserResponse
from app.modules.permissions.services.permission_service import PermissionService, get_permission_service


def require_permission(permission_name: str, raise_on_deny: bool = True):
    """
    Decorator to require a specific permission for a route

    Usage:
        ```python
        @router.post("/manual", response_model=Assignment)
        @require_permission("assignment.create")
        async def create_manual_assignment(
            request: ManualAssignmentRequest,
            current_user: UserResponse = Depends(get_current_user),
            permission_service: PermissionService = Depends(get_permission_service)
        ):
            # Route handler code
            ...
        ```

    Args:
        permission_name: Permission name required (e.g., "assignment.reassign_in_progress")
        raise_on_deny: If True, raises 403 exception on permission denied

    Returns:
        Decorator function

    Raises:
        HTTPException: 403 Forbidden if user doesn't have permission
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current_user from kwargs (injected by Depends(get_current_user))
            current_user: Optional[UserResponse] = kwargs.get('current_user')

            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            # Extract permission_service from kwargs (injected by Depends(get_permission_service))
            permission_service: Optional[PermissionService] = kwargs.get('permission_service')

            if not permission_service:
                # Fallback: try to get from function parameters
                # This shouldn't happen if used correctly
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Permission service not available"
                )

            # Check permission
            has_perm = await permission_service.has_permission(
                current_user.id,
                permission_name
            )

            if not has_perm:
                if raise_on_deny:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=(
                            f"Permission denied: '{permission_name}' required. "
                            f"Contact your administrator to request this permission."
                        )
                    )
                else:
                    # If not raising, set a flag in kwargs for the handler
                    kwargs['_permission_denied'] = True

            # Call original function
            return await func(*args, **kwargs)

        return wrapper
    return decorator


def require_any_permission(*permission_names: str, raise_on_deny: bool = True):
    """
    Decorator to require ANY of the specified permissions

    User needs at least ONE of the permissions to access the route.

    Usage:
        ```python
        @router.get("/dashboard")
        @require_any_permission("dashboard.view", "reports.view_all")
        async def view_dashboard(
            current_user: UserResponse = Depends(get_current_user),
            permission_service: PermissionService = Depends(get_permission_service)
        ):
            # Route handler code
            ...
        ```

    Args:
        *permission_names: Permission names (at least one required)
        raise_on_deny: If True, raises 403 exception on permission denied

    Returns:
        Decorator function

    Raises:
        HTTPException: 403 Forbidden if user doesn't have any of the permissions
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user: Optional[UserResponse] = kwargs.get('current_user')

            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            permission_service: Optional[PermissionService] = kwargs.get('permission_service')

            if not permission_service:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Permission service not available"
                )

            # Check if user has ANY of the permissions
            has_any = False
            for perm_name in permission_names:
                if await permission_service.has_permission(current_user.id, perm_name):
                    has_any = True
                    break

            if not has_any:
                if raise_on_deny:
                    perms_list = "', '".join(permission_names)
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=(
                            f"Permission denied: At least one of these permissions required: '{perms_list}'. "
                            f"Contact your administrator."
                        )
                    )
                else:
                    kwargs['_permission_denied'] = True

            return await func(*args, **kwargs)

        return wrapper
    return decorator


def require_all_permissions(*permission_names: str, raise_on_deny: bool = True):
    """
    Decorator to require ALL of the specified permissions

    User needs ALL permissions to access the route.

    Usage:
        ```python
        @router.delete("/sensitive-data/{id}")
        @require_all_permissions("data.delete", "data.admin", "audit.create")
        async def delete_sensitive_data(
            id: str,
            current_user: UserResponse = Depends(get_current_user),
            permission_service: PermissionService = Depends(get_permission_service)
        ):
            # Route handler code
            ...
        ```

    Args:
        *permission_names: Permission names (all required)
        raise_on_deny: If True, raises 403 exception on permission denied

    Returns:
        Decorator function

    Raises:
        HTTPException: 403 Forbidden if user doesn't have all permissions
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user: Optional[UserResponse] = kwargs.get('current_user')

            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            permission_service: Optional[PermissionService] = kwargs.get('permission_service')

            if not permission_service:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Permission service not available"
                )

            # Check if user has ALL permissions
            missing_permissions = []
            for perm_name in permission_names:
                if not await permission_service.has_permission(current_user.id, perm_name):
                    missing_permissions.append(perm_name)

            if missing_permissions:
                if raise_on_deny:
                    perms_list = "', '".join(missing_permissions)
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=(
                            f"Permission denied: Missing required permissions: '{perms_list}'. "
                            f"Contact your administrator."
                        )
                    )
                else:
                    kwargs['_permission_denied'] = True
                    kwargs['_missing_permissions'] = missing_permissions

            return await func(*args, **kwargs)

        return wrapper
    return decorator


# Helper function for checking permissions in route handlers
async def check_permission(
    user_id: str,
    permission_name: str,
    permission_service: PermissionService,
    raise_on_deny: bool = True
) -> bool:
    """
    Helper function to check permission inside a route handler

    Useful for dynamic permission checking (e.g., conditional logic).

    Usage:
        ```python
        @router.put("/{id}/reassign")
        async def reassign_assignment(
            id: str,
            current_user: UserResponse = Depends(get_current_user),
            permission_service: PermissionService = Depends(get_permission_service)
        ):
            # Get assignment
            assignment = await get_assignment(id)

            # Dynamic permission check based on status
            if assignment.status == "in_progress":
                # Requires critical permission
                await check_permission(
                    current_user.id,
                    "assignment.reassign_in_progress",
                    permission_service
                )
            else:
                # Regular permission
                await check_permission(
                    current_user.id,
                    "assignment.reassign",
                    permission_service
                )

            # Proceed with reassignment
            ...
        ```

    Args:
        user_id: User UUID
        permission_name: Permission name
        permission_service: PermissionService instance
        raise_on_deny: If True, raises 403 on deny

    Returns:
        True if has permission

    Raises:
        HTTPException: 403 Forbidden if no permission and raise_on_deny=True
    """
    return await permission_service.check_permission(
        user_id,
        permission_name,
        raise_exception=raise_on_deny
    )
