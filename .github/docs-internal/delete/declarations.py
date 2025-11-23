"""
Tax Declarations API for TaxasGE Backend
Complete workflow for tax declaration management and processing
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Path, status, Body, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from loguru import logger
from datetime import datetime

from app.models.declaration import (
    DeclarationResponse, DeclarationCreate, DeclarationUpdate, DeclarationListResponse,
    DeclarationSearchFilter, DeclarationStats, DeclarationWorkflow, BulkDeclarationOperation,
    DocumentAttachment, DeclarationStatus, Priority, PaymentStatus, PaymentInfo
)
from app.models.user import UserResponse
from app.repositories.declaration_repository import declaration_repository
from app.api.v1.auth import require_admin, require_operator, get_current_user

router = APIRouter(prefix="/declarations", tags=["Tax Declarations"])


@router.get("/", response_model=Dict[str, Any])
async def get_declarations_info():
    """Get Tax Declarations API information"""
    return {
        "message": "TaxasGE Tax Declarations API",
        "version": "1.0.0",
        "description": "Complete workflow for tax declaration management",
        "endpoints": {
            "create": "POST /create - Create new tax declaration",
            "list": "GET /list - List user declarations",
            "details": "GET /{declaration_id} - Get declaration details",
            "update": "PUT /{declaration_id} - Update declaration",
            "submit": "POST /{declaration_id}/submit - Submit for processing",
            "search": "POST /search - Advanced search (admin/operator)",
            "workflow": "GET /{declaration_id}/workflow - Get workflow status",
            "upload": "POST /{declaration_id}/upload - Upload documents",
            "admin": "Admin operations - assign, approve, reject"
        },
        "workflow_stages": [
            "draft - Initial creation",
            "submitted - Submitted for review",
            "processing - Under review by operator",
            "approved - Approved by operator",
            "paid - Payment completed",
            "completed - Process finished"
        ],
        "features": [
            "Complete declaration lifecycle management",
            "Document upload and management",
            "Real-time workflow tracking",
            "Multi-priority processing",
            "Payment integration",
            "Activity logging",
            "Bulk operations",
            "Comprehensive statistics"
        ]
    }


@router.post("/create", response_model=DeclarationResponse)
async def create_declaration(
    declaration_data: DeclarationCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create new tax declaration"""
    try:
        # Create declaration
        new_declaration = await declaration_repository.create_declaration(current_user.id, declaration_data)
        if not new_declaration:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create declaration"
            )

        # Log activity
        await declaration_repository.log_activity(
            user_id=current_user.id,
            action="create_declaration",
            declaration_id=new_declaration.id,
            details={
                "service_id": declaration_data.service_id,
                "declaration_type": declaration_data.declaration_type.value,
                "priority": declaration_data.priority.value
            }
        )

        logger.info(f" Declaration created: {new_declaration.id} by user {current_user.id}")
        return new_declaration

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error creating declaration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating declaration"
        )


@router.get("/list", response_model=DeclarationListResponse)
async def list_user_declarations(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    current_user: UserResponse = Depends(get_current_user)
):
    """List current user's declarations"""
    try:
        # Build filters
        status_enum = None
        if status_filter:
            try:
                status_enum = DeclarationStatus(status_filter)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status: {status_filter}"
                )

        # Get user declarations
        declarations = await declaration_repository.find_by_user(current_user.id, status_enum)

        # Apply pagination
        total = len(declarations)
        start_idx = (page - 1) * size
        end_idx = start_idx + size
        page_declarations = declarations[start_idx:end_idx]

        # Calculate pagination info
        pages = (total + size - 1) // size

        # Log activity
        await declaration_repository.log_activity(
            user_id=current_user.id,
            action="list_declarations",
            details={
                "page": page,
                "size": size,
                "status_filter": status_filter,
                "total_results": total
            }
        )

        return DeclarationListResponse(
            declarations=page_declarations,
            total=total,
            page=page,
            size=size,
            pages=pages
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error listing declarations for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving declarations"
        )


@router.get("/{declaration_id}", response_model=DeclarationResponse)
async def get_declaration(
    declaration_id: str = Path(..., description="Declaration ID"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get declaration details"""
    try:
        declaration = await declaration_repository.find_by_id(declaration_id)
        if not declaration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Declaration '{declaration_id}' not found"
            )

        # Check access permissions
        if declaration.user_id != current_user.id and current_user.role.value not in ["admin", "operator", "auditor"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this declaration"
            )

        # Log activity
        await declaration_repository.log_activity(
            user_id=current_user.id,
            action="view_declaration",
            declaration_id=declaration_id
        )

        return declaration

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error getting declaration {declaration_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving declaration"
        )


@router.post("/{declaration_id}/submit", response_model=DeclarationResponse)
async def submit_declaration(
    declaration_id: str = Path(..., description="Declaration ID"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Submit declaration for processing"""
    try:
        # Get existing declaration
        existing_declaration = await declaration_repository.find_by_id(declaration_id)
        if not existing_declaration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Declaration '{declaration_id}' not found"
            )

        # Check ownership
        if existing_declaration.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this declaration"
            )

        # Check if submittable
        if existing_declaration.status != DeclarationStatus.draft:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only submit declarations in draft status"
            )

        # Submit declaration
        submitted_declaration = await declaration_repository.submit_declaration(declaration_id)
        if not submitted_declaration:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit declaration"
            )

        # Log activity
        await declaration_repository.log_activity(
            user_id=current_user.id,
            action="submit_declaration",
            declaration_id=declaration_id,
            details={
                "priority": existing_declaration.priority.value,
                "service_id": existing_declaration.service_id
            }
        )

        logger.info(f" Declaration submitted: {declaration_id} by user {current_user.id}")
        return submitted_declaration

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error submitting declaration {declaration_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error submitting declaration"
        )


@router.get("/{declaration_id}/workflow", response_model=DeclarationWorkflow)
async def get_declaration_workflow(
    declaration_id: str = Path(..., description="Declaration ID"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get declaration workflow status"""
    try:
        # Check if declaration exists and user has access
        declaration = await declaration_repository.find_by_id(declaration_id)
        if not declaration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Declaration '{declaration_id}' not found"
            )

        if declaration.user_id != current_user.id and current_user.role.value not in ["admin", "operator", "auditor"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this declaration"
            )

        # Get workflow status
        workflow = await declaration_repository.get_workflow_status(declaration_id)
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get workflow status"
            )

        # Log activity
        await declaration_repository.log_activity(
            user_id=current_user.id,
            action="view_workflow",
            declaration_id=declaration_id
        )

        return workflow

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error getting workflow for declaration {declaration_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving workflow status"
        )


# Admin/Operator endpoints

@router.post("/search", response_model=DeclarationListResponse)
async def search_declarations(
    search_filter: DeclarationSearchFilter,
    operator_user: UserResponse = Depends(require_operator)
):
    """Advanced search for declarations (admin/operator)"""
    try:
        # Perform search
        declarations = await declaration_repository.search_declarations(search_filter)

        # Log activity
        await declaration_repository.log_activity(
            user_id=operator_user.id,
            action="search_declarations",
            details={
                "filters": search_filter.dict(exclude_unset=True),
                "results_count": len(declarations)
            }
        )

        return DeclarationListResponse(
            declarations=declarations,
            total=len(declarations),
            page=1,
            size=len(declarations),
            pages=1
        )

    except Exception as e:
        logger.error(f"L Error searching declarations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error searching declarations"
        )


@router.post("/{declaration_id}/approve")
async def approve_declaration(
    declaration_id: str = Path(..., description="Declaration ID"),
    notes: Optional[str] = Body(None, description="Approval notes"),
    operator_user: UserResponse = Depends(require_operator)
):
    """Approve declaration (admin/operator)"""
    try:
        # Approve declaration
        success = await declaration_repository.approve_declaration(declaration_id, operator_user.id, notes)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to approve declaration"
            )

        # Log activity
        await declaration_repository.log_activity(
            user_id=operator_user.id,
            action="approve_declaration",
            declaration_id=declaration_id,
            details={"notes": notes}
        )

        logger.info(f" Declaration approved: {declaration_id} by {operator_user.role.value} {operator_user.id}")
        return {
            "success": True,
            "message": "Declaration approved successfully",
            "approved_at": datetime.utcnow().isoformat(),
            "approved_by": operator_user.id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error approving declaration {declaration_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error approving declaration"
        )


@router.get("/stats/overview", response_model=DeclarationStats)
async def get_declaration_stats(
    admin_user: UserResponse = Depends(require_admin)
):
    """Get comprehensive declaration statistics (admin only)"""
    try:
        stats = await declaration_repository.get_declaration_stats()

        # Log activity
        await declaration_repository.log_activity(
            user_id=admin_user.id,
            action="view_declaration_stats",
            details={"total_declarations": stats.total_declarations}
        )

        return stats

    except Exception as e:
        logger.error(f"L Error getting declaration stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving declaration statistics"
        )