"""Agent Routes - Ministry Agent Management API"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer
from typing import Dict, Any, List, Optional
from loguru import logger

from app.modules.agents.models import (
    MinistryAgentCreate,
    MinistryAgentUpdate,
    MinistryAgentResponse,
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    AssignmentStatus,
    AgentWorkQueueCreate,
    AgentWorkQueueResponse,
    AgentWorkload,
    AgentWorkloadUpdate,
    AgentPerformanceStats,
)
from app.modules.agents.repositories import (
    AgentRepository,
    AssignmentRepository,
    WorkloadRepository,
)
from app.modules.agents.services import (
    AgentService,
    AssignmentService,
    WorkloadService,
)
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import require_permission
from app.database.connection import get_database

router = APIRouter(tags=["Agents"])
security = HTTPBearer()

agent_repository = AgentRepository()
assignment_repository = AssignmentRepository()
workload_repository = WorkloadRepository()

agent_service = AgentService()
assignment_service = AssignmentService()
workload_service = WorkloadService()


# ============================================================================
# MINISTRY AGENTS
# ============================================================================

@router.post("/agents", response_model=MinistryAgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    agent: MinistryAgentCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
    _: None = Depends(require_permission("agents.create"))
):
    """Create new ministry agent - Requires agents.create permission"""
    user_id = current_user["sub"]

    # Set assigned_by if not provided
    if not agent.assigned_by:
        agent.assigned_by = user_id

    result = await agent_repository.create(db, agent)

    # Initialize workload for agent
    await workload_repository.create_workload(db, result["id"])

    logger.info(f"User {user_id} created agent {result['id']} for ministry {agent.ministry_id}")
    return MinistryAgentResponse(**result)


@router.get("/agents/{agent_id}", response_model=MinistryAgentResponse)
async def get_agent(
    agent_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Get agent by ID"""
    agent = await agent_repository.get_by_id(db, agent_id)
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    return MinistryAgentResponse(**agent)


@router.get("/ministries/{ministry_id}/agents", response_model=List[MinistryAgentResponse])
async def list_ministry_agents(
    ministry_id: int,
    active_only: bool = Query(True),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """List agents for ministry"""
    offset = (page - 1) * page_size
    agents, total = await agent_repository.list_by_ministry(
        db, ministry_id, active_only, page_size, offset
    )
    return [MinistryAgentResponse(**a) for a in agents]


@router.put("/agents/{agent_id}", response_model=MinistryAgentResponse)
async def update_agent(
    agent_id: str,
    update_data: MinistryAgentUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
    _: None = Depends(require_permission("agents.update"))
):
    """Update agent configuration - Requires agents.update permission"""
    updated = await agent_repository.update(db, agent_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    logger.info(f"Agent {agent_id} updated")
    return MinistryAgentResponse(**updated)


@router.post("/agents/{agent_id}/deactivate", status_code=status.HTTP_200_OK)
async def deactivate_agent(
    agent_id: str,
    reason: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
    _: None = Depends(require_permission("agents.deactivate"))
):
    """Deactivate agent - Requires agents.deactivate permission"""
    user_id = current_user["sub"]

    success = await agent_repository.deactivate(db, agent_id, user_id, reason)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    logger.info(f"Agent {agent_id} deactivated by {user_id}")
    return {"message": "Agent deactivated successfully", "agent_id": agent_id}


@router.post("/agents/{agent_id}/reactivate", status_code=status.HTTP_200_OK)
async def reactivate_agent(
    agent_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Reactivate agent"""
    success = await agent_repository.reactivate(db, agent_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    logger.info(f"Agent {agent_id} reactivated")
    return {"message": "Agent reactivated successfully", "agent_id": agent_id}


# ============================================================================
# ASSIGNMENTS
# ============================================================================

@router.post("/assignments", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    assignment: AssignmentCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
    _: None = Depends(require_permission("assignments.create"))
):
    """Create new assignment - Requires assignments.create permission"""
    user_id = current_user["sub"]

    # Set assigned_by if not provided
    if not assignment.assigned_by:
        assignment.assigned_by = user_id

    # Create assignment
    result = await assignment_repository.create_assignment(db, assignment)

    # Update agent workload
    await workload_repository.increment_assignments(db, assignment.agent_id)

    logger.info(f"Assignment {result['id']} created for agent {assignment.agent_id}")
    return AssignmentResponse(**result)


@router.get("/assignments/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Get assignment by ID"""
    assignment = await assignment_repository.get_assignment_by_id(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    return AssignmentResponse(**assignment)


@router.get("/agents/{agent_id}/assignments", response_model=List[AssignmentResponse])
async def list_agent_assignments(
    agent_id: str,
    status: Optional[AssignmentStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """List assignments for agent"""
    offset = (page - 1) * page_size
    assignments, total = await assignment_repository.get_assignments_by_agent(
        db, agent_id, status, page_size, offset
    )
    return [AssignmentResponse(**a) for a in assignments]


@router.get("/declarations/{declaration_id}/assignments", response_model=List[AssignmentResponse])
async def list_declaration_assignments(
    declaration_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """List all assignments for declaration"""
    assignments = await assignment_repository.get_assignments_by_declaration(db, declaration_id)
    return [AssignmentResponse(**a) for a in assignments]


@router.put("/assignments/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: str,
    update_data: AssignmentUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
    _: None = Depends(require_permission("assignments.update"))
):
    """Update assignment - Requires assignments.update permission"""
    updated = await assignment_repository.update_assignment(db, assignment_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    # Update workload if status changed to in_progress
    if update_data.status == AssignmentStatus.IN_PROGRESS and update_data.started_at:
        await workload_repository.start_assignment(db, updated["agent_id"])

    logger.info(f"Assignment {assignment_id} updated")
    return AssignmentResponse(**updated)


@router.post("/assignments/{assignment_id}/complete", response_model=AssignmentResponse)
async def complete_assignment(
    assignment_id: str,
    quality_score: Optional[float] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Mark assignment as completed"""
    assignment = await assignment_repository.get_assignment_by_id(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    completed = await assignment_repository.complete_assignment(db, assignment_id, quality_score)

    # Update workload
    await workload_repository.complete_assignment(db, assignment["agent_id"])

    logger.info(f"Assignment {assignment_id} completed")
    return AssignmentResponse(**completed)


@router.post("/assignments/{assignment_id}/reassign", response_model=AssignmentResponse)
async def reassign_assignment(
    assignment_id: str,
    new_agent_id: str,
    reason: str,
    notes: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
    _: None = Depends(require_permission("assignments.reassign"))
):
    """Reassign to another agent - Requires assignments.reassign permission"""
    assignment = await assignment_repository.get_assignment_by_id(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    # Validate reassignment
    validation = assignment_service.validate_reassignment(assignment, new_agent_id, reason)
    if not validation["is_valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": validation["errors"]}
        )

    # Reassign
    reassigned = await assignment_repository.reassign(db, assignment_id, new_agent_id, reason, notes)

    # Update workloads
    old_agent_id = assignment["agent_id"]
    await workload_repository.decrement_assignments(db, old_agent_id)
    await workload_repository.increment_assignments(db, new_agent_id)

    logger.info(f"Assignment {assignment_id} reassigned from {old_agent_id} to {new_agent_id}")
    return AssignmentResponse(**reassigned)


# ============================================================================
# WORK QUEUE
# ============================================================================

@router.post("/work-queue", response_model=AgentWorkQueueResponse, status_code=status.HTTP_201_CREATED)
async def add_to_queue(
    queue_item: AgentWorkQueueCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Add item to work queue"""
    result = await assignment_repository.add_to_queue(db, queue_item)
    logger.info(f"Added item {result['id']} to work queue for ministry {queue_item.ministry_id}")
    return AgentWorkQueueResponse(**result)


@router.get("/ministries/{ministry_id}/work-queue", response_model=List[AgentWorkQueueResponse])
async def get_ministry_queue(
    ministry_id: int,
    limit: int = Query(10, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Get next items from work queue"""
    items = await assignment_repository.get_next_queue_items(db, ministry_id, limit)
    return [AgentWorkQueueResponse(**item) for item in items]


@router.post("/work-queue/{queue_id}/assign", response_model=AgentWorkQueueResponse)
async def assign_queue_item(
    queue_id: str,
    agent_id: str,
    lock_duration_minutes: int = 30,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Assign queue item to agent"""
    assigned = await assignment_repository.assign_queue_item(
        db, queue_id, agent_id, lock_duration_minutes
    )
    logger.info(f"Queue item {queue_id} assigned to agent {agent_id}")
    return AgentWorkQueueResponse(**assigned)


@router.post("/work-queue/{queue_id}/complete", status_code=status.HTTP_200_OK)
async def complete_queue_item(
    queue_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Mark queue item as completed"""
    user_id = current_user["sub"]
    completed = await assignment_repository.complete_queue_item(db, queue_id, user_id)
    logger.info(f"Queue item {queue_id} completed by {user_id}")
    return {"message": "Queue item completed", "item": AgentWorkQueueResponse(**completed)}


@router.post("/work-queue/{queue_id}/escalate", response_model=AgentWorkQueueResponse)
async def escalate_queue_item(
    queue_id: str,
    reason: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Escalate queue item"""
    user_id = current_user["sub"]
    escalated = await assignment_repository.escalate_queue_item(db, queue_id, user_id, reason)
    logger.info(f"Queue item {queue_id} escalated by {user_id}")
    return AgentWorkQueueResponse(**escalated)


# ============================================================================
# WORKLOAD & PERFORMANCE
# ============================================================================

@router.get("/agents/{agent_id}/workload", response_model=AgentWorkload)
async def get_agent_workload(
    agent_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Get agent workload"""
    workload = await workload_repository.get_workload(db, agent_id)
    if not workload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workload not found")

    return AgentWorkload(**workload)


@router.put("/agents/{agent_id}/workload", response_model=AgentWorkload)
async def update_agent_workload(
    agent_id: str,
    update_data: AgentWorkloadUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
    _: None = Depends(require_permission("agents.manage_workload"))
):
    """Update agent workload - Requires agents.manage_workload permission"""
    updated = await workload_repository.update_workload(db, agent_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workload not found")

    logger.info(f"Workload updated for agent {agent_id}")
    return AgentWorkload(**updated)


@router.get("/agents/{agent_id}/performance", response_model=AgentPerformanceStats)
async def get_agent_performance(
    agent_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Get agent performance statistics"""
    stats = await workload_repository.get_performance_stats(db, agent_id)
    if not stats:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Performance stats not found")

    return AgentPerformanceStats(**stats)


@router.get("/ministries/{ministry_id}/available-agents", response_model=List[AgentWorkload])
async def get_available_agents(
    ministry_id: int,
    max_capacity_percentage: float = Query(80.0, ge=0, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Get agents with available capacity"""
    agents = await workload_repository.get_available_agents(db, ministry_id, max_capacity_percentage)
    return [AgentWorkload(**a) for a in agents]


@router.get("/ministries/{ministry_id}/workload-rebalancing")
async def check_workload_rebalancing(
    ministry_id: int,
    threshold_percentage: float = Query(80.0, ge=0, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Check if workload rebalancing is needed"""
    # Get all agent workloads for ministry
    query = """
        SELECT aw.* FROM agent_workloads aw
        JOIN ministry_agents ma ON aw.agent_id = ma.id
        WHERE ma.ministry_id = $1 AND ma.is_active = true
    """
    workloads = await db.fetch(query, ministry_id)
    workload_dicts = [dict(w) for w in workloads]

    # Get rebalancing recommendations
    from decimal import Decimal
    result = workload_service.recommend_workload_rebalancing(
        workload_dicts,
        Decimal(str(threshold_percentage))
    )

    logger.info(f"Workload rebalancing check for ministry {ministry_id}: {result['needs_rebalancing']}")
    return result


@router.get("/ministries/{ministry_id}/capacity-prediction")
async def predict_capacity(
    ministry_id: int,
    forecast_days: int = Query(7, ge=1, le=30),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database),
):
    """Predict capacity needs"""
    # Get all agent workloads for ministry
    query = """
        SELECT aw.* FROM agent_workloads aw
        JOIN ministry_agents ma ON aw.agent_id = ma.id
        WHERE ma.ministry_id = $1 AND ma.is_active = true
    """
    workloads = await db.fetch(query, ministry_id)
    workload_dicts = [dict(w) for w in workloads]

    prediction = workload_service.predict_capacity_needs(workload_dicts, forecast_days)

    logger.info(f"Capacity prediction for ministry {ministry_id}: {prediction}")
    return prediction
