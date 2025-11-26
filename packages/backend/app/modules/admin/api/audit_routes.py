"""
Audit Log Routes - Audit Trail API

Provides read-only access to audit logs for administrators
Used by the frontend audit-logs-admin module

Routes:
- /api/v1/audit-logs - List and filter audit logs
- /api/v1/audit-logs/{id} - Get single audit log
- /api/v1/audit-logs/stats - Get audit statistics
- /api/v1/users/{user_id}/audit-logs - Get logs for a specific user
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query, Path
from typing import List, Optional
from datetime import datetime
from loguru import logger

from app.modules.admin.models.admin import (
    AuditLogResponse,
    AuditLogFilter,
)
from app.modules.admin.repositories.audit_repository import AuditRepository
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import require_permission
from app.database.connection import get_database

# =============================================================================
# ROUTER & DEPENDENCIES
# =============================================================================

router = APIRouter(tags=["Audit Logs"])
audit_repository = AuditRepository()


# =============================================================================
# RESPONSE MODELS
# =============================================================================

from pydantic import BaseModel
from typing import Dict, Any


class AuditLogListResponse(BaseModel):
    """Paginated audit logs response"""
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    pages: int


class AuditLogStats(BaseModel):
    """Audit log statistics"""
    total_logs: int
    by_action: Dict[str, int]
    by_entity_type: Dict[str, int]


# =============================================================================
# AUDIT LOG ENDPOINTS
# =============================================================================

@router.get("", response_model=AuditLogListResponse)
async def list_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action (create, update, delete, login, etc.)"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    resource_type: Optional[str] = Query(None, alias="entity_type", description="Filter by resource/entity type"),
    success: Optional[bool] = Query(None, description="Filter by success status (not implemented yet)"),
    start_date: Optional[datetime] = Query(None, description="Filter from date"),
    end_date: Optional[datetime] = Query(None, description="Filter to date"),
    search: Optional[str] = Query(None, description="Search in entity_id or action"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    current_user=Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(require_permission("audit.view")),
):
    """
    List audit logs with filters

    Requires audit.view permission
    """
    try:
        offset = (page - 1) * page_size

        # Use repository method
        logs, total = await audit_repository.list(
            conn=db,
            user_id=user_id,
            entity_type=resource_type,
            entity_id=search,  # Use search as entity_id filter
            action=action,
            start_date=start_date,
            end_date=end_date,
            limit=page_size,
            offset=offset,
        )

        items = [AuditLogResponse(**log) for log in logs]
        pages = (total + page_size - 1) // page_size

        return AuditLogListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    except Exception as e:
        logger.error(f"Error listing audit logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving audit logs"
        )


@router.get("/stats", response_model=AuditLogStats)
async def get_audit_stats(
    start_date: Optional[datetime] = Query(None, description="Stats from date"),
    end_date: Optional[datetime] = Query(None, description="Stats to date"),
    current_user=Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(require_permission("audit.view_stats")),
):
    """
    Get audit log statistics

    Requires audit.view_stats permission
    """
    try:
        stats = await audit_repository.get_stats(
            conn=db,
            start_date=start_date,
            end_date=end_date,
        )

        return AuditLogStats(**stats)

    except Exception as e:
        logger.error(f"Error getting audit stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving audit statistics"
        )


@router.get("/{audit_id}", response_model=AuditLogResponse)
async def get_audit_log(
    audit_id: str = Path(..., description="Audit log ID"),
    current_user=Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(require_permission("audit.view")),
):
    """
    Get a single audit log by ID

    Requires audit.view permission
    """
    try:
        log = await audit_repository.get_by_id(conn=db, audit_id=audit_id)

        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Audit log {audit_id} not found"
            )

        return AuditLogResponse(**log)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting audit log {audit_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving audit log"
        )


@router.get("/entity/{entity_type}/{entity_id}", response_model=List[AuditLogResponse])
async def get_audit_logs_by_entity(
    entity_type: str = Path(..., description="Entity type (user, declaration, etc.)"),
    entity_id: str = Path(..., description="Entity ID"),
    limit: int = Query(50, ge=1, le=200, description="Maximum logs to return"),
    current_user=Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(require_permission("audit.view")),
):
    """
    Get all audit logs for a specific entity

    Requires audit.view permission
    """
    try:
        logs = await audit_repository.get_by_entity(
            conn=db,
            entity_type=entity_type,
            entity_id=entity_id,
            limit=limit,
        )

        return [AuditLogResponse(**log) for log in logs]

    except Exception as e:
        logger.error(f"Error getting audit logs for {entity_type}/{entity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving audit logs"
        )


# =============================================================================
# USER AUDIT LOGS (nested route)
# =============================================================================

user_audit_router = APIRouter(tags=["User Audit Logs"])


@user_audit_router.get("/{user_id}/audit-logs", response_model=List[AuditLogResponse])
async def get_user_audit_logs(
    user_id: str = Path(..., description="User ID"),
    action: Optional[str] = Query(None, description="Filter by action"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    current_user=Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(require_permission("audit.view")),
):
    """
    Get audit logs for a specific user

    Requires audit.view permission

    This endpoint is mounted at /api/v1/users/{user_id}/audit-logs
    """
    try:
        offset = (page - 1) * page_size

        logs, _ = await audit_repository.list(
            conn=db,
            user_id=user_id,
            action=action,
            limit=page_size,
            offset=offset,
        )

        return [AuditLogResponse(**log) for log in logs]

    except Exception as e:
        logger.error(f"Error getting audit logs for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user audit logs"
        )
