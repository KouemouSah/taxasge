"""
Permission Service - Business logic for permission checking and management
"""
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status

from app.modules.permissions.repositories.permission_repository import PermissionRepository
from app.modules.permissions.repositories.role_repository import RoleRepository
from app.modules.permissions.repositories.user_permission_repository import UserPermissionRepository
from app.modules.permissions.models.permission import (
    PermissionCreate,
    PermissionUpdate,
    PermissionResponse,
)


class PermissionService:
    """Service for permission operations"""

    def __init__(
        self,
        permission_repo: PermissionRepository,
        role_repo: RoleRepository,
        user_permission_repo: UserPermissionRepository
    ):
        """
        Initialize service with repositories

        Args:
            permission_repo: Permission repository
            role_repo: Role repository
            user_permission_repo: User permission repository
        """
        self.permission_repo = permission_repo
        self.role_repo = role_repo
        self.user_permission_repo = user_permission_repo

    async def has_permission(
        self,
        user_id: str,
        permission_name: str
    ) -> bool:
        """
        Check if a user has a specific permission

        This checks:
        1. User-specific permission overrides (highest priority)
        2. Role-based permissions (if no override)

        Args:
            user_id: User UUID
            permission_name: Permission name (e.g., "assignment.reassign_in_progress")

        Returns:
            True if user has permission, False otherwise
        """
        return await self.user_permission_repo.has_permission(user_id, permission_name)

    async def check_permission(
        self,
        user_id: str,
        permission_name: str,
        raise_exception: bool = True
    ) -> bool:
        """
        Check if user has permission and optionally raise exception if not

        Args:
            user_id: User UUID
            permission_name: Permission name
            raise_exception: If True, raises HTTPException on permission denied

        Returns:
            True if has permission

        Raises:
            HTTPException: 403 Forbidden if no permission and raise_exception=True
        """
        has_perm = await self.has_permission(user_id, permission_name)

        if not has_perm and raise_exception:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission_name} required"
            )

        return has_perm

    async def get_user_permissions(
        self,
        user_id: str,
        include_role_permissions: bool = True
    ) -> List[str]:
        """
        Get all permission names for a user

        Args:
            user_id: User UUID
            include_role_permissions: Include permissions from role

        Returns:
            List of permission names
        """
        permission_names = set()

        # Get user-specific permissions (overrides)
        user_perms = await self.user_permission_repo.get_by_user(user_id)
        for perm in user_perms:
            if perm['granted']:
                # Get permission name
                permission = await self.permission_repo.get_by_id(perm['permission_id'])
                if permission:
                    permission_names.add(permission['name'])

        if include_role_permissions:
            # Get role permissions
            # First, get user's role
            # (This would need access to user repository - simplified here)
            pass

        return list(permission_names)

    async def get_permission_by_id(self, permission_id: str) -> Optional[Dict[str, Any]]:
        """
        Get permission by ID

        Args:
            permission_id: Permission UUID

        Returns:
            Permission dict or None
        """
        return await self.permission_repo.get_by_id(permission_id)

    async def get_permission_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Get permission by name

        Args:
            name: Permission name

        Returns:
            Permission dict or None
        """
        return await self.permission_repo.get_by_name(name)

    async def get_all_permissions(
        self,
        module_name: Optional[str] = None,
        resource: Optional[str] = None,
        is_critical: Optional[bool] = None,
        page: int = 1,
        page_size: int = 100
    ) -> Dict[str, Any]:
        """
        Get all permissions with pagination

        Args:
            module_name: Filter by module
            resource: Filter by resource
            is_critical: Filter by critical flag
            page: Page number (1-indexed)
            page_size: Results per page

        Returns:
            Dict with permissions list and pagination info
        """
        offset = (page - 1) * page_size

        permissions = await self.permission_repo.get_all(
            module_name=module_name,
            resource=resource,
            is_critical=is_critical,
            limit=page_size,
            offset=offset
        )

        total = await self.permission_repo.count(
            module_name=module_name,
            resource=resource,
            is_critical=is_critical
        )

        total_pages = (total + page_size - 1) // page_size

        return {
            "permissions": permissions,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }

    async def get_permissions_by_module(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get all permissions grouped by module

        Returns:
            Dict with module names as keys
        """
        return await self.permission_repo.get_grouped_by_module()

    async def create_permission(self, permission: PermissionCreate) -> Dict[str, Any]:
        """
        Create a new permission

        Args:
            permission: Permission data

        Returns:
            Created permission dict

        Raises:
            HTTPException: 409 Conflict if permission name already exists
        """
        # Check if permission already exists
        existing = await self.permission_repo.get_by_name(permission.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Permission '{permission.name}' already exists"
            )

        return await self.permission_repo.create(permission)

    async def bulk_create_permissions(
        self,
        permissions: List[PermissionCreate]
    ) -> List[Dict[str, Any]]:
        """
        Create multiple permissions at once

        Args:
            permissions: List of permission data

        Returns:
            List of created permissions (duplicates are skipped)
        """
        return await self.permission_repo.bulk_create(permissions)

    async def update_permission(
        self,
        permission_id: str,
        permission: PermissionUpdate
    ) -> Dict[str, Any]:
        """
        Update a permission

        Args:
            permission_id: Permission UUID
            permission: Updated permission data

        Returns:
            Updated permission dict

        Raises:
            HTTPException: 404 Not Found if permission doesn't exist
        """
        updated = await self.permission_repo.update(permission_id, permission)

        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Permission with id '{permission_id}' not found"
            )

        return updated

    async def delete_permission(self, permission_id: str) -> bool:
        """
        Delete a permission

        Args:
            permission_id: Permission UUID

        Returns:
            True if deleted

        Raises:
            HTTPException: 404 Not Found if permission doesn't exist
        """
        deleted = await self.permission_repo.delete(permission_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Permission with id '{permission_id}' not found"
            )

        return True

    async def get_critical_permissions(self) -> List[Dict[str, Any]]:
        """
        Get all critical permissions

        Returns:
            List of critical permissions
        """
        return await self.permission_repo.get_critical_permissions()

    async def get_user_permissions_summary(self, user_id: str) -> Dict[str, Any]:
        """
        Get summary of user's permissions

        Args:
            user_id: User UUID

        Returns:
            Summary dict with counts
        """
        return await self.user_permission_repo.get_user_permissions_summary(user_id)


# Helper function for use in dependencies
async def get_permission_service(db_connection) -> PermissionService:
    """
    Create permission service with repositories

    Args:
        db_connection: Database connection

    Returns:
        PermissionService instance
    """
    permission_repo = PermissionRepository(db_connection)
    role_repo = RoleRepository(db_connection)
    user_permission_repo = UserPermissionRepository(db_connection)

    return PermissionService(permission_repo, role_repo, user_permission_repo)
