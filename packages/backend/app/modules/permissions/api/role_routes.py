"""
Role API Routes - REST endpoints for role management
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from uuid import UUID

from app.modules.auth.middleware.auth_middleware import get_current_user
from app.core.database import get_db_connection
from app.modules.users.models.user import UserResponse
from app.modules.permissions.models.role import (
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    RoleWithPermissionsResponse,
    AssignPermissionsToRoleRequest,
    RemovePermissionsFromRoleRequest,
)
from app.modules.permissions.services.role_service import (
    RoleService,
    get_role_service,
)
from app.modules.permissions.services.permission_service import (
    PermissionService,
    get_permission_service,
)
from app.modules.permissions.middleware.permission_middleware import require_permission


router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("", response_model=dict)
@require_permission("roles.view")
async def get_all_roles(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    is_system: Optional[bool] = Query(None, description="Filter system/custom roles"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Results per page"),
    current_user: UserResponse = Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """
    Get all roles with pagination and filtering

    Requires: roles.view

    Args:
        entity_type: Filter by entity type (e.g., "taxpayer", "professional")
        is_system: True for system roles, False for custom roles, None for all
        page: Page number
        page_size: Results per page

    Returns:
        Paginated list of roles
    """
    result = await role_service.get_all_roles(
        entity_type=entity_type,
        is_system=is_system,
        page=page,
        page_size=page_size
    )

    return result


@router.get("/system", response_model=List[RoleResponse])
@require_permission("roles.view")
async def get_system_roles(
    current_user: UserResponse = Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """
    Get all system (built-in) roles

    Requires: roles.view

    Returns:
        List of system roles (cannot be modified or deleted)
    """
    system_roles = await role_service.get_system_roles()
    return system_roles


@router.get("/custom", response_model=List[RoleResponse])
@require_permission("roles.view")
async def get_custom_roles(
    current_user: UserResponse = Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """
    Get all custom (user-created) roles

    Requires: roles.view

    Returns:
        List of custom roles (can be modified and deleted)
    """
    custom_roles = await role_service.get_custom_roles()
    return custom_roles


@router.get("/agent-roles", response_model=List[RoleResponse])
@require_permission("roles.view")
async def get_agent_rbac_roles(
    current_user: UserResponse = Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """
    Get all predefined RBAC roles for agents

    Requires: roles.view

    Returns:
        List of agent RBAC roles (dgi_validator, dgi_approver, ministry_validator, etc.)

    These roles should be assigned to agents during creation to define their permissions.
    """
    agent_roles = await role_service.get_agent_rbac_roles()
    return agent_roles


@router.get("/{role_id}", response_model=RoleResponse)
@require_permission("roles.view")
async def get_role_by_id(
    role_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """
    Get role by ID

    Requires: roles.view

    Args:
        role_id: Role UUID

    Returns:
        Role details

    Raises:
        404: Role not found
    """
    role = await role_service.get_role_by_id(str(role_id))

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id '{role_id}' not found"
        )

    return role


@router.get("/{role_id}/with-permissions", response_model=RoleWithPermissionsResponse)
@require_permission("roles.view")
async def get_role_with_permissions(
    role_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """
    Get role with all associated permissions

    Requires: roles.view

    Args:
        role_id: Role UUID

    Returns:
        Role with complete list of permissions

    Raises:
        404: Role not found
    """
    role_with_perms = await role_service.get_role_with_permissions(str(role_id))

    if not role_with_perms:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id '{role_id}' not found"
        )

    return role_with_perms


@router.get("/code/{code}", response_model=RoleResponse)
@require_permission("roles.view")
async def get_role_by_code(
    code: str,
    current_user: UserResponse = Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """
    Get role by code

    Requires: roles.view

    Args:
        code: Role code (e.g., "admin", "tax_manager")

    Returns:
        Role details

    Raises:
        404: Role not found
    """
    role = await role_service.get_role_by_code(code)

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with code '{code}' not found"
        )

    return role


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
@require_permission("roles.create")
async def create_role(
    role: RoleCreate,
    current_user: UserResponse = Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """
    Create a new custom role

    Requires: roles.create (critical permission)

    Args:
        role: Role data

    Returns:
        Created role

    Raises:
        409: Role with same code already exists
    """
    created = await role_service.create_role(role, current_user.id)
    return created


@router.put("/{role_id}", response_model=RoleResponse)
@require_permission("roles.update")
async def update_role(
    role_id: UUID,
    role: RoleUpdate,
    current_user: UserResponse = Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """
    Update a role

    Requires: roles.update (critical permission)

    Args:
        role_id: Role UUID
        role: Updated role data

    Returns:
        Updated role

    Raises:
        404: Role not found
        403: Cannot update system roles
    """
    updated = await role_service.update_role(str(role_id), role)
    return updated


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission("roles.delete")
async def delete_role(
    role_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """
    Delete a role

    Requires: roles.delete (critical permission)

    Args:
        role_id: Role UUID

    Raises:
        404: Role not found
        403: Cannot delete system roles
        409: Role is in use (has assigned users)
    """
    await role_service.delete_role(str(role_id))
    return None


@router.post("/{role_id}/permissions", response_model=dict)
@require_permission("roles.assign_permissions")
async def assign_permissions_to_role(
    role_id: UUID,
    request: AssignPermissionsToRoleRequest,
    current_user: UserResponse = Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """
    Assign multiple permissions to a role

    Requires: roles.assign_permissions (critical permission)

    Args:
        role_id: Role UUID
        request: List of permission IDs and grant/deny flag

    Returns:
        Assignment result summary

    Raises:
        404: Role or permissions not found
    """
    result = await role_service.assign_permissions_to_role(
        role_id=str(role_id),
        permission_ids=[str(pid) for pid in request.permission_ids],
        granted=request.granted,
        assigned_by=current_user.id
    )

    return result


@router.delete("/{role_id}/permissions", response_model=dict)
@require_permission("roles.assign_permissions")
async def remove_permissions_from_role(
    role_id: UUID,
    request: RemovePermissionsFromRoleRequest,
    current_user: UserResponse = Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """
    Remove permissions from a role

    Requires: roles.assign_permissions (critical permission)

    Args:
        role_id: Role UUID
        request: List of permission IDs to remove

    Returns:
        Removal result summary

    Raises:
        404: Role not found
    """
    result = await role_service.remove_permissions_from_role(
        role_id=str(role_id),
        permission_ids=[str(pid) for pid in request.permission_ids]
    )

    return result


@router.get("/{role_id}/permissions", response_model=List[str])
@require_permission("roles.view")
async def get_role_permissions(
    role_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    role_service: RoleService = Depends(get_role_service),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """
    Get list of permission IDs for a role

    Requires: roles.view

    Args:
        role_id: Role UUID

    Returns:
        List of permission UUIDs

    Raises:
        404: Role not found
    """
    permission_ids = await role_service.get_role_permissions(str(role_id))
    return permission_ids
