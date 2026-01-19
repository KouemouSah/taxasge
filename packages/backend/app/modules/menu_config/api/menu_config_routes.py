"""
Menu Configuration API Routes

Provides endpoints for:
- GET /me: Get current agent's menu config (auto-generated or role-based)
- CRUD for menu templates (admin only)
- CRUD for workflow mappings (admin only)

Author: Claude Code Expert
Date: 2026-01-19
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger
import asyncpg

from app.database.connection import get_database
from app.modules.auth.dependencies import get_current_user
from app.modules.users.models.user import UserResponse
from app.modules.permissions.services.permission_service import (
    get_permission_service,
    PermissionService,
)
from app.modules.menu_config.services.menu_config_service import (
    get_menu_config_service,
    MenuConfigService,
)
from app.modules.menu_config.repositories.menu_template_repository import (
    MenuTemplateRepository,
)
from app.modules.menu_config.repositories.workflow_mapping_repository import (
    WorkflowMappingRepository,
)
from app.modules.menu_config.models.menu_config import (
    AgentMenuConfigResponse,
    MenuTemplateCreate,
    MenuTemplateUpdate,
    MenuTemplateResponse,
    MenuTemplateListResponse,
    WorkflowMenuMappingCreate,
    WorkflowMenuMappingUpdate,
    WorkflowMenuMappingResponse,
    WorkflowMenuMappingListResponse,
)


router = APIRouter(prefix="/menu-config", tags=["Menu Configuration"])


# =============================================================================
# AGENT MENU CONFIG ENDPOINT
# =============================================================================

@router.get(
    "/me",
    response_model=AgentMenuConfigResponse,
    summary="Get current agent's menu configuration",
    description="""
    Returns the complete menu and dashboard configuration for the current agent.

    For workflow-based entities (CNEDOGE, DGT, etc.):
    - Menus are auto-generated from entity.workflow_codes using mapping rules

    For module-based entities (TESORO):
    - Menus come from the role's menu_config
    """
)
async def get_my_menu_config(
    current_user: UserResponse = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_database),
    menu_service: MenuConfigService = Depends(get_menu_config_service),
):
    """Get current agent's menu configuration"""

    # Get agent profile for current user
    agent_profile = await db.fetchrow("""
        SELECT id, user_id, entity_id
        FROM agent_profiles
        WHERE user_id = $1 AND is_active = true
    """, current_user.id)

    if not agent_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found for current user"
        )

    try:
        menu_config = await menu_service.get_agent_menu_config(
            agent_profile_id=agent_profile['id'],
            user_id=UUID(current_user.id),
            db_connection=db
        )
        return menu_config
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error getting menu config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get menu configuration"
        )


# =============================================================================
# MENU TEMPLATES CRUD ENDPOINTS (Admin only)
# =============================================================================

@router.get(
    "/templates",
    response_model=MenuTemplateListResponse,
    summary="List menu templates",
    description="Get all menu templates with pagination and filters. Requires admin.menu.read permission."
)
async def list_menu_templates(
    template_type: Optional[str] = Query(None, description="Filter by type (workflow, module, custom)"),
    entity_code: Optional[str] = Query(None, description="Filter by entity code"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: UserResponse = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_database),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """List all menu templates with pagination"""

    # Check permission
    await permission_service.check_permission(
        current_user.id, "admin.menu.read", raise_exception=True
    )

    repo = MenuTemplateRepository(db)

    offset = (page - 1) * page_size
    templates = await repo.get_all(
        template_type=template_type,
        entity_code=entity_code,
        is_active=is_active,
        limit=page_size,
        offset=offset
    )

    total = await repo.count(
        template_type=template_type,
        entity_code=entity_code,
        is_active=is_active
    )

    pages = (total + page_size - 1) // page_size

    return MenuTemplateListResponse(
        items=[MenuTemplateResponse(**t) for t in templates],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.post(
    "/templates",
    response_model=MenuTemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create menu template",
    description="Create a new menu template. Requires admin.menu.create permission."
)
async def create_menu_template(
    template: MenuTemplateCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_database),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """Create a new menu template"""

    # Check permission
    await permission_service.check_permission(
        current_user.id, "admin.menu.create", raise_exception=True
    )

    repo = MenuTemplateRepository(db)

    # Check if code already exists
    existing = await repo.get_by_code(template.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Template with code '{template.code}' already exists"
        )

    created = await repo.create(template, created_by=UUID(current_user.id))
    return MenuTemplateResponse(**created)


@router.get(
    "/templates/{template_id}",
    response_model=MenuTemplateResponse,
    summary="Get menu template",
    description="Get a menu template by ID. Requires admin.menu.read permission."
)
async def get_menu_template(
    template_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_database),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """Get a menu template by ID"""

    # Check permission
    await permission_service.check_permission(
        current_user.id, "admin.menu.read", raise_exception=True
    )

    repo = MenuTemplateRepository(db)
    template = await repo.get_by_id(template_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with id '{template_id}' not found"
        )

    return MenuTemplateResponse(**template)


@router.put(
    "/templates/{template_id}",
    response_model=MenuTemplateResponse,
    summary="Update menu template",
    description="Update a menu template. Requires admin.menu.update permission."
)
async def update_menu_template(
    template_id: UUID,
    template: MenuTemplateUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_database),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """Update a menu template"""

    # Check permission
    await permission_service.check_permission(
        current_user.id, "admin.menu.update", raise_exception=True
    )

    repo = MenuTemplateRepository(db)
    updated = await repo.update(template_id, template)

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with id '{template_id}' not found"
        )

    return MenuTemplateResponse(**updated)


@router.delete(
    "/templates/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete menu template",
    description="Delete a menu template. Requires admin.menu.delete permission."
)
async def delete_menu_template(
    template_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_database),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """Delete a menu template"""

    # Check permission
    await permission_service.check_permission(
        current_user.id, "admin.menu.delete", raise_exception=True
    )

    repo = MenuTemplateRepository(db)
    deleted = await repo.delete(template_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with id '{template_id}' not found"
        )


# =============================================================================
# WORKFLOW MAPPINGS CRUD ENDPOINTS (Admin only)
# =============================================================================

@router.get(
    "/workflow-mappings",
    response_model=WorkflowMenuMappingListResponse,
    summary="List workflow menu mappings",
    description="Get all workflow menu mappings with pagination. Requires admin.menu.read permission."
)
async def list_workflow_mappings(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: UserResponse = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_database),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """List all workflow menu mappings with pagination"""

    # Check permission
    await permission_service.check_permission(
        current_user.id, "admin.menu.read", raise_exception=True
    )

    repo = WorkflowMappingRepository(db)

    offset = (page - 1) * page_size
    mappings = await repo.get_all(
        is_active=is_active,
        limit=page_size,
        offset=offset
    )

    total = await repo.count(is_active=is_active)
    pages = (total + page_size - 1) // page_size

    return WorkflowMenuMappingListResponse(
        items=[WorkflowMenuMappingResponse(**m) for m in mappings],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.post(
    "/workflow-mappings",
    response_model=WorkflowMenuMappingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create workflow mapping",
    description="Create a new workflow menu mapping. Requires admin.menu.create permission."
)
async def create_workflow_mapping(
    mapping: WorkflowMenuMappingCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_database),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """Create a new workflow menu mapping"""

    # Check permission
    await permission_service.check_permission(
        current_user.id, "admin.menu.create", raise_exception=True
    )

    repo = WorkflowMappingRepository(db)

    # Check if pattern already exists
    existing = await repo.get_by_pattern(mapping.workflow_pattern)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Mapping with pattern '{mapping.workflow_pattern}' already exists"
        )

    created = await repo.create(mapping)
    return WorkflowMenuMappingResponse(**created)


@router.get(
    "/workflow-mappings/{mapping_id}",
    response_model=WorkflowMenuMappingResponse,
    summary="Get workflow mapping",
    description="Get a workflow mapping by ID. Requires admin.menu.read permission."
)
async def get_workflow_mapping(
    mapping_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_database),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """Get a workflow mapping by ID"""

    # Check permission
    await permission_service.check_permission(
        current_user.id, "admin.menu.read", raise_exception=True
    )

    repo = WorkflowMappingRepository(db)
    mapping = await repo.get_by_id(mapping_id)

    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mapping with id '{mapping_id}' not found"
        )

    return WorkflowMenuMappingResponse(**mapping)


@router.put(
    "/workflow-mappings/{mapping_id}",
    response_model=WorkflowMenuMappingResponse,
    summary="Update workflow mapping",
    description="Update a workflow mapping. Requires admin.menu.update permission."
)
async def update_workflow_mapping(
    mapping_id: int,
    mapping: WorkflowMenuMappingUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_database),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """Update a workflow mapping"""

    # Check permission
    await permission_service.check_permission(
        current_user.id, "admin.menu.update", raise_exception=True
    )

    repo = WorkflowMappingRepository(db)
    updated = await repo.update(mapping_id, mapping)

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mapping with id '{mapping_id}' not found"
        )

    return WorkflowMenuMappingResponse(**updated)


@router.delete(
    "/workflow-mappings/{mapping_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete workflow mapping",
    description="Delete a workflow mapping. Requires admin.menu.delete permission."
)
async def delete_workflow_mapping(
    mapping_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_database),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """Delete a workflow mapping"""

    # Check permission
    await permission_service.check_permission(
        current_user.id, "admin.menu.delete", raise_exception=True
    )

    repo = WorkflowMappingRepository(db)
    deleted = await repo.delete(mapping_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mapping with id '{mapping_id}' not found"
        )
