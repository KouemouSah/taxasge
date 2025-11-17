"""
Assignment Routes - FastAPI Endpoints for Assignment Operations
Handles manual and automatic assignment of declarations to agents

Author: Claude Code
Date: 2025-11-16
Version: 1.0 - Initial implementation
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.models.user import UserResponse
from app.modules.assignment.models.assignment_history import (
    Assignment,
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentStatus,
    ReassignmentCreate,
    ReassignmentReason
)
from app.modules.assignment.services.assignment_service import (
    AssignmentService,
    get_assignment_service
)
from app.modules.assignment.services.auto_assignment_service import (
    AutoAssignmentService,
    get_auto_assignment_service
)
from app.modules.assignment.repositories.assignment_repository import (
    AssignmentRepository,
    get_assignment_repository
)
from app.modules.assignment.repositories.workload_repository import (
    WorkloadRepository,
    get_workload_repository
)
from app.modules.assignment.repositories.rules_repository import (
    RulesRepository,
    get_rules_repository
)
from app.modules.assignment.services.rules_engine import get_rules_engine
from app.core.database import get_db_connection

# Permission middleware
from app.modules.permissions.middleware import require_permission
from app.modules.permissions.services.permission_service import (
    PermissionService,
    get_permission_service,
)

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/assignments", tags=["assignments"])


# ============================================================================
# REQUEST/RESPONSE SCHEMAS
# ============================================================================

class ManualAssignmentRequest(BaseModel):
    """Request to manually assign declaration to agent"""
    declaration_id: UUID
    declaration_type: str = Field(..., description="tax_declaration or fiscal_service")
    agent_id: UUID
    notes: Optional[str] = None
    priority_level: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    deadline_days: Optional[int] = Field(None, ge=1, le=90)


class AutoAssignmentRequest(BaseModel):
    """Request for automatic assignment"""
    declaration_id: UUID
    declaration_type: str = Field(..., description="tax_declaration or fiscal_service")
    declaration_data: dict = Field(..., description="Declaration data for rule evaluation")
    entity_type: str = Field(default="DGI", pattern="^(DGI|Ministry)$")
    entity_id: Optional[str] = None


class StartProcessingRequest(BaseModel):
    """Request to start processing an assignment"""
    pass  # No additional fields needed


class CompleteAssignmentRequest(BaseModel):
    """Request to complete an assignment"""
    validation_status: str = Field(..., pattern="^(approved|rejected)$")
    quality_score: Optional[float] = Field(None, ge=0.0, le=10.0)


class ReassignmentRequest(BaseModel):
    """Request to reassign declaration to new agent"""
    new_agent_id: UUID
    reason: ReassignmentReason
    notes: Optional[str] = None


class UpdatePriorityRequest(BaseModel):
    """Request to update assignment priority"""
    priority_level: str = Field(..., pattern="^(low|medium|high|urgent)$")


class ExtendDeadlineRequest(BaseModel):
    """Request to extend assignment deadline"""
    additional_days: int = Field(..., ge=1, le=90)


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

async def get_assignment_service_dep(
    db = Depends(get_db_connection)
) -> AssignmentService:
    """Dependency for AssignmentService"""
    assignment_repo = get_assignment_repository(db)
    workload_repo = get_workload_repository(db)
    return get_assignment_service(assignment_repo, workload_repo)


async def get_auto_assignment_service_dep(
    db = Depends(get_db_connection)
) -> AutoAssignmentService:
    """Dependency for AutoAssignmentService"""
    assignment_repo = get_assignment_repository(db)
    workload_repo = get_workload_repository(db)
    rules_repo = get_rules_repository(db)
    rules_engine = get_rules_engine()
    return get_auto_assignment_service(
        assignment_repo,
        workload_repo,
        rules_repo,
        rules_engine
    )


# ============================================================================
# ENDPOINTS - ASSIGNMENT OPERATIONS
# ============================================================================
# Note: Authorization is handled via @require_permission decorators
# Legacy check_*_permission functions have been removed (replaced by RBAC system)

@router.post("/manual", response_model=Assignment, status_code=status.HTTP_201_CREATED)
@require_permission("assignment.create")
async def create_manual_assignment(
    request: ManualAssignmentRequest,
    current_user: UserResponse = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service),
    service: AssignmentService = Depends(get_assignment_service_dep)
):
    """
    **Manually assign a declaration to an agent (Supervisor only)**

    Permissions:
    - Requires: assignment.create

    Validates:
    - Agent availability
    - Agent capacity
    - Agent role matches declaration type

    Returns:
    - Created assignment with status 'assigned'
    """

    try:
        assignment = await service.assign_to_agent(
            declaration_id=request.declaration_id,
            declaration_type=request.declaration_type,
            agent_id=request.agent_id,
            supervisor_id=UUID(current_user.id),
            notes=request.notes,
            priority_level=request.priority_level,
            deadline_days=request.deadline_days
        )

        logger.info(
            f"Manual assignment created by {current_user.email} - "
            f"Assignment {assignment.id}"
        )

        return assignment

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating manual assignment: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create manual assignment"
        )


@router.post("/auto", response_model=Assignment, status_code=status.HTTP_201_CREATED)
@require_permission("assignment.auto_assign")
async def create_auto_assignment(
    request: AutoAssignmentRequest,
    current_user: UserResponse = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service),
    service: AutoAssignmentService = Depends(get_auto_assignment_service_dep)
):
    """
    **Automatically assign declaration to best agent using intelligent algorithm**

    Permissions:
    - Requires: assignment.auto_assign

    Algorithm:
    1. Apply assignment rules to find filters
    2. Get eligible agents based on filters
    3. Score agents using multi-criteria algorithm (6 criteria)
    4. Select best agent (highest score)
    5. Create assignment and update workload

    Scoring Criteria:
    - Workload (30%): Current assignments
    - Speed (20%): Avg processing time
    - Success Rate (25%): Validation success rate
    - Specialization (15%): Type match
    - Pending Duration (10%): Age of pending assignments

    Returns:
    - Created assignment with auto_assignment_score
    """

    try:
        assignment = await service.auto_assign_declaration(
            declaration_id=request.declaration_id,
            declaration_type=request.declaration_type,
            declaration_data=request.declaration_data,
            entity_type=request.entity_type,
            entity_id=request.entity_id
        )

        logger.info(
            f"Auto-assignment created - Assignment {assignment.id} - "
            f"Score: {assignment.auto_assignment_score:.2f}"
        )

        return assignment

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating auto assignment: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create auto assignment"
        )


@router.get("/{assignment_id}", response_model=Assignment)
@require_permission("assignment.view")
async def get_assignment(
    assignment_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service),
    db = Depends(get_db_connection)
):
    """
    **Get assignment details by ID**

    Permissions:
    - Requires: assignment.view
    - Assigned agent can view own assignments
    - Supervisors can view all assignments under supervision
    - Admin can view all
    """

    repo = get_assignment_repository(db)
    assignment = await repo.get_by_id(assignment_id)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment {assignment_id} not found"
        )

    # Authorization check
    is_assigned_agent = str(assignment.agent_id) == current_user.id
    is_supervisor = current_user.role in ["supervisor_dgi", "supervisor_ministry", "admin"]

    if not (is_assigned_agent or is_supervisor):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own assignments"
        )

    return assignment


@router.get("/", response_model=List[Assignment])
@require_permission("assignment.list")
async def list_assignments(
    agent_id: Optional[UUID] = Query(None, description="Filter by agent"),
    status_filter: Optional[AssignmentStatus] = Query(None, description="Filter by status"),
    declaration_id: Optional[UUID] = Query(None, description="Filter by declaration"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service),
    db = Depends(get_db_connection)
):
    """
    **List assignments with filters**

    Permissions:
    - Requires: assignment.list
    - Agents can only list their own assignments
    - Supervisors can list all assignments under supervision
    - Admin can list all

    Query Parameters:
    - agent_id: Filter by specific agent
    - status: Filter by status (assigned, in_progress, completed, etc.)
    - declaration_id: Get assignment for specific declaration
    - limit: Max results (default 50, max 200)
    - offset: Pagination offset
    """

    repo = get_assignment_repository(db)

    # If agent, force filter to own assignments
    if current_user.role in ["dgi_agent", "ministry_agent"]:
        agent_id = UUID(current_user.id)

    try:
        if declaration_id:
            # Get by declaration
            assignment = await repo.get_by_declaration(declaration_id)
            return [assignment] if assignment else []

        elif agent_id:
            # Get by agent
            assignments = await repo.get_by_agent(agent_id, status_filter)
            return assignments[offset:offset + limit]

        elif status_filter:
            # Get by status (supervisor/admin only)
            if current_user.role not in ["supervisor_dgi", "supervisor_ministry", "admin"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only supervisors can list all assignments by status"
                )
            # TODO: Add get_by_status method to repository
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Status filtering not yet implemented"
            )

        else:
            # Get all (supervisor/admin only)
            if current_user.role not in ["supervisor_dgi", "supervisor_ministry", "admin"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only supervisors can list all assignments"
                )
            assignments = await repo.get_active_assignments(None)
            return assignments[offset:offset + limit]

    except Exception as e:
        logger.error(f"Error listing assignments: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list assignments"
        )


@router.put("/{assignment_id}/start", response_model=Assignment)
@require_permission("assignment.start")
async def start_processing(
    assignment_id: UUID,
    request: StartProcessingRequest,
    current_user: UserResponse = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service),
    service: AssignmentService = Depends(get_assignment_service_dep)
):
    """
    **Start processing an assignment (Agent action)**

    Permissions:
    - Requires: assignment.start
    - Assigned agent only

    State Transition:
    - assigned → in_progress
    - Sets started_at timestamp
    - Moves from pending_declarations to in_progress_declarations in workload
    """

    # Verify agent is assigned to this assignment
    db = service.assignment_repo.db
    repo = get_assignment_repository(db)
    assignment = await repo.get_by_id(assignment_id)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment {assignment_id} not found"
        )

    if str(assignment.agent_id) != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only start your own assignments"
        )

    try:
        updated = await service.start_processing(assignment_id)

        logger.info(
            f"Assignment {assignment_id} started by agent {current_user.email}"
        )

        return updated

    except Exception as e:
        logger.error(f"Error starting assignment: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start assignment"
        )


@router.put("/{assignment_id}/complete", response_model=Assignment)
@require_permission("assignment.complete")
async def complete_assignment(
    assignment_id: UUID,
    request: CompleteAssignmentRequest,
    current_user: UserResponse = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service),
    service: AssignmentService = Depends(get_assignment_service_dep)
):
    """
    **Complete an assignment (Agent action)**

    Permissions:
    - Requires: assignment.complete
    - Assigned agent only

    State Transition:
    - in_progress → completed
    - Sets completed_at timestamp
    - Auto-calculates processing_duration_hours (trigger)
    - Decrements agent workload
    - Updates agent performance metrics

    Request Body:
    - validation_status: "approved" or "rejected"
    - quality_score: 0-10 (optional)
    """

    # Verify agent is assigned
    db = service.assignment_repo.db
    repo = get_assignment_repository(db)
    assignment = await repo.get_by_id(assignment_id)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment {assignment_id} not found"
        )

    if str(assignment.agent_id) != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only complete your own assignments"
        )

    try:
        updated = await service.complete_assignment(
            assignment_id,
            request.validation_status,
            request.quality_score
        )

        logger.info(
            f"Assignment {assignment_id} completed by agent {current_user.email} - "
            f"Status: {request.validation_status}"
        )

        return updated

    except Exception as e:
        logger.error(f"Error completing assignment: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete assignment"
        )


@router.put("/{assignment_id}/reassign", response_model=Assignment)
@require_permission("assignment.reassign")
async def reassign_assignment(
    assignment_id: UUID,
    request: ReassignmentRequest,
    current_user: UserResponse = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service),
    service: AssignmentService = Depends(get_assignment_service_dep)
):
    """
    **Reassign declaration to a new agent (Supervisor only)**

    Permissions:
    - Requires: assignment.reassign (critical permission)
    - For in-progress assignments: requires assignment.reassign_in_progress

    Workflow:
    1. Mark current assignment as 'reassigned'
    2. Validate new agent eligibility
    3. Create new assignment for new agent
    4. Update workloads (decrement old, increment new)
    5. Record reassignment reason

    Allowed Reasons:
    - workload_rebalance
    - agent_unavailable
    - specialization_mismatch
    - performance_issues
    - agent_request
    - deadline_risk
    - quality_concerns
    - other
    """

    # Additional permission check for in-progress assignments
    db = service.assignment_repo.db
    repo = get_assignment_repository(db)
    assignment = await repo.get_by_id(assignment_id)

    if assignment and assignment.status == "in_progress":
        # Requires critical permission for in-progress reassignment
        has_critical_perm = await permission_service.has_permission(
            current_user.id,
            "assignment.reassign_in_progress"
        )

        if not has_critical_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Reasignar una tarea EN CURSO requiere permiso crítico: "
                    "'assignment.reassign_in_progress'. Contacte a su administrador."
                )
            )

    try:
        new_assignment = await service.reassign_to_new_agent(
            assignment_id=assignment_id,
            new_agent_id=request.new_agent_id,
            reason=request.reason,
            supervisor_id=UUID(current_user.id),
            notes=request.notes
        )

        logger.info(
            f"Assignment {assignment_id} reassigned by {current_user.email} - "
            f"New assignment: {new_assignment.id} - Reason: {request.reason}"
        )

        return new_assignment

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error reassigning assignment: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reassign assignment"
        )


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission("assignment.cancel")
async def cancel_assignment(
    assignment_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service),
    service: AssignmentService = Depends(get_assignment_service_dep)
):
    """
    **Cancel an assignment (Supervisor only)**

    Permissions:
    - Requires: assignment.cancel (critical permission)

    State Transition:
    - any → cancelled
    - Decrements agent workload
    - Declaration becomes unassigned (can be reassigned)
    """

    try:
        await service.cancel_assignment(assignment_id)

        logger.info(
            f"Assignment {assignment_id} cancelled by {current_user.email}"
        )

        return None

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error cancelling assignment: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel assignment"
        )


@router.patch("/{assignment_id}/priority", response_model=Assignment)
@require_permission("assignment.update_priority")
async def update_priority(
    assignment_id: UUID,
    request: UpdatePriorityRequest,
    current_user: UserResponse = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service),
    service: AssignmentService = Depends(get_assignment_service_dep)
):
    """
    **Update assignment priority (Supervisor only)**

    Permissions:
    - Requires: assignment.update_priority

    Priority Levels:
    - low
    - medium (default)
    - high
    - urgent
    """

    try:
        updated = await service.update_priority(
            assignment_id,
            request.priority_level
        )

        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assignment {assignment_id} not found"
            )

        logger.info(
            f"Assignment {assignment_id} priority updated to {request.priority_level} "
            f"by {current_user.email}"
        )

        return updated

    except Exception as e:
        logger.error(f"Error updating priority: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update priority"
        )


@router.patch("/{assignment_id}/deadline", response_model=Assignment)
@require_permission("assignment.extend_deadline")
async def extend_deadline(
    assignment_id: UUID,
    request: ExtendDeadlineRequest,
    current_user: UserResponse = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service),
    service: AssignmentService = Depends(get_assignment_service_dep)
):
    """
    **Extend assignment deadline (Supervisor only)**

    Permissions:
    - Requires: assignment.extend_deadline

    Parameters:
    - additional_days: Number of days to add (1-90)
    """

    try:
        updated = await service.extend_deadline(
            assignment_id,
            request.additional_days
        )

        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assignment {assignment_id} not found"
            )

        logger.info(
            f"Assignment {assignment_id} deadline extended by {request.additional_days} days "
            f"by {current_user.email}"
        )

        return updated

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error extending deadline: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extend deadline"
        )
