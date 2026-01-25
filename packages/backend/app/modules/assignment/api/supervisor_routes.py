"""
Supervisor Routes - Dashboard and Management for Supervisors
Handles supervisor operations: dashboard, team management, rules management

Author: Claude Code
Date: 2025-11-16
Version: 1.0 - Initial implementation
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.users.models.user import UserResponse
from app.modules.assignment.models.assignment_history import (
    Assignment,
    AgentAssignmentStats,
    AssignmentStatus
)
from app.modules.assignment.models.assignment_rule import (
    AssignmentRule,
    AssignmentRuleCreate,
    AssignmentRuleUpdate,
    RuleStatus
)
from app.modules.assignment.models.agent_workload import (
    AgentWorkload,
    WorkloadBalanceReport,
    AgentCapacityForecast
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
from app.core.database import get_db_connection

# Permission middleware - use permission_required dependency instead of decorator
from app.modules.permissions.middleware import permission_required

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/supervisor", tags=["supervisor"])


# ============================================================================
# AGENT CONTEXT HELPER (Migration 048 - Unified agent role)
# ============================================================================

async def get_agent_context(user_id: str, db) -> Dict[str, Any]:
    """
    Get agent context from agent_profiles table.

    Returns:
        dict with keys:
        - is_supervisor: bool
        - agent_type: 'ministry_agent' or 'entity_agent'
        - ministry_id: int or None (for ministry_agent)
        - entity_id: UUID or None (for entity_agent)
        - entity_type: 'ministry' or 'entity' (derived from agent_type)
        - ministry_code: str or None (from ministries table)
    """
    query = """
        SELECT
            ap.is_supervisor,
            ap.agent_type,
            ap.ministry_id,
            ap.entity_id,
            m.ministry_code
        FROM agent_profiles ap
        LEFT JOIN ministries m ON ap.ministry_id = m.id
        WHERE ap.user_id = $1 AND ap.is_active = true
    """
    result = await db.fetchrow(query, user_id)

    if not result:
        return {
            "is_supervisor": False,
            "agent_type": None,
            "ministry_id": None,
            "entity_id": None,
            "entity_type": None,
            "ministry_code": None,
        }

    # entity_type is derived directly from agent_type
    agent_type = result.get("agent_type")
    entity_type = "ministry" if agent_type == "ministry_agent" else "entity"

    return {
        "is_supervisor": result.get("is_supervisor", False),
        "agent_type": agent_type,
        "ministry_id": result.get("ministry_id"),
        "entity_id": result.get("entity_id"),
        "entity_type": entity_type,
        "ministry_code": result.get("ministry_code"),
    }


# ============================================================================
# REQUEST/RESPONSE SCHEMAS
# ============================================================================

class DashboardResponse(BaseModel):
    """Supervisor dashboard data"""
    summary: Dict[str, Any]
    pending_assignments: List[Assignment]
    overdue_assignments: List[Assignment]
    agent_workloads: List[AgentWorkload]
    recent_assignments: List[Assignment]
    performance_alerts: List[Dict[str, Any]]


class AgentListItem(BaseModel):
    """Agent item in list - aligned with agent_profiles table (Migration 054)"""
    agent_profile_id: UUID  # Primary identifier from agent_profiles
    agent_id: Optional[UUID] = None  # DEPRECATED: user_id, kept for backward compatibility
    agent_name: str
    agent_email: str
    current_assignments: int
    capacity_percentage: float
    workload_status: str
    availability: str
    specializations: Optional[List[str]]
    avg_processing_time_hours: Optional[float]
    success_rate: float


class RuleEffectivenessItem(BaseModel):
    """Rule effectiveness metrics"""
    rule_id: UUID
    rule_name: str
    priority: int
    times_applied: int
    times_matched: int
    success_rate: float
    effectiveness_score: float
    application_rate: float
    last_applied_at: Optional[datetime]


class WorkloadBalanceResponse(BaseModel):
    """Workload balance report"""
    report: WorkloadBalanceReport
    agents: List[AgentListItem]
    recommendations: List[Dict[str, str]]


# ============================================================================
# AUTHORIZATION HELPERS
# ============================================================================
# Note: Authorization is now handled via @require_permission decorators
# and agent context from agent_profiles table


# ============================================================================
# ENDPOINTS - DASHBOARD
# ============================================================================

@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("dashboard.view"))
):
    """
    **Get supervisor dashboard with real-time metrics**

    Permissions:
    - Requires: dashboard.view

    Returns:
    - Summary statistics (total agents, assignments, pending, overdue)
    - Pending assignments (top 10)
    - Overdue assignments
    - Agent workloads (all agents under supervision)
    - Recent assignments (last 20)
    - Performance alerts (agents at risk)

    Dashboard Data:
    - Scoped to supervisor's entity (department or ministry)
    - Real-time from PostgreSQL views
    - Cached for 30 seconds for performance

    Migration 048: Uses agent_profiles for context instead of deprecated roles
    """

    # Get agent context from agent_profiles
    # Admin sees all (no filtering by ministry/entity)
    if current_user.role == "admin":
        agent_ctx = {"entity_type": None, "ministry_id": None, "entity_id": None, "is_supervisor": True}
    else:
        agent_ctx = await get_agent_context(current_user.id, db)

    assignment_repo = get_assignment_repository(db)
    workload_repo = get_workload_repository(db)

    try:
        # Get summary stats
        all_assignments = await assignment_repo.get_active_assignments(None)
        pending = [a for a in all_assignments if a.status == AssignmentStatus.assigned]
        in_progress = [a for a in all_assignments if a.status == AssignmentStatus.in_progress]
        overdue = await assignment_repo.get_overdue_assignments()

        # Get agent workloads - now uses unified 'agent' role
        # Agents are filtered by ministry_id in the workload repository
        available_agents = await workload_repo.get_available_agents(
            db=db,
            max_workload_pct=100.0
        )

        # Get recent assignments (last 20)
        recent_assignments = all_assignments[:20]

        # Generate performance alerts
        # Note: available_agents returns AgentWorkload objects now (Migration 054)
        performance_alerts = []
        for agent_workload in available_agents:
            # AgentWorkload object has capacity_percentage computed
            if agent_workload.capacity_percentage > 80:
                performance_alerts.append({
                    "type": "overloaded",
                    "agent_profile_id": str(agent_workload.agent_profile_id),
                    "message": f"Agent at {agent_workload.capacity_percentage:.0f}% capacity",
                    "severity": "high"
                })

        # Build summary - available_agents is List[AgentWorkload]
        summary = {
            "total_agents": len(available_agents),
            "total_assignments": len(all_assignments),
            "pending_count": len(pending),
            "in_progress_count": len(in_progress),
            "overdue_count": len(overdue),
            "avg_capacity": sum(a.capacity_percentage for a in available_agents) / max(len(available_agents), 1),
            "alerts_count": len(performance_alerts),
            "entity_type": agent_ctx.get("entity_type"),
            "entity_id": str(agent_ctx.get("ministry_id") or agent_ctx.get("entity_id") or "")
        }

        # available_agents is already List[AgentWorkload] - no need to fetch again
        response = DashboardResponse(
            summary=summary,
            pending_assignments=pending[:10],
            overdue_assignments=overdue,
            agent_workloads=available_agents,
            recent_assignments=recent_assignments,
            performance_alerts=performance_alerts
        )

        logger.info(
            f"Dashboard loaded for supervisor {current_user.email} - "
            f"Entity: {agent_ctx.get('entity_type')}/{agent_ctx.get('ministry_id') or agent_ctx.get('entity_id')}"
        )

        return response

    except Exception as e:
        logger.error(f"Error loading dashboard: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load dashboard"
        )


# ============================================================================
# ENDPOINTS - AGENT MANAGEMENT
# ============================================================================

@router.get("/agents", response_model=List[AgentListItem])
async def list_agents(
    include_unavailable: bool = Query(False, description="Include unavailable agents"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("agent.view"))
):
    """
    **List all agents under supervision**

    Permissions:
    - Requires appropriate RBAC permission (see @require_permission decorator)

    Returns:
    - List of agents with workload metrics
    - Sorted by capacity (most loaded first)
    - Includes specializations and performance metrics

    Query Parameters:
    - include_unavailable: Include unavailable agents (default: false)

    Migration 048: Uses unified 'agent' role with agent_profiles for filtering
    """
    # Get agent context from agent_profiles
    # Admin sees all (no filtering by ministry/entity)
    if current_user.role == "admin":
        agent_ctx = {"entity_type": None, "ministry_id": None, "entity_id": None, "is_supervisor": True}
    else:
        agent_ctx = await get_agent_context(current_user.id, db)

    workload_repo = get_workload_repository(db)

    try:
        # Get agents - uses unified 'agent' role with agent_profiles (Migration 054)
        max_capacity = 100.0 if include_unavailable else 80.0
        agents_workloads = await workload_repo.get_available_agents(
            db=db,
            max_workload_pct=max_capacity
        )

        # Build response - agents_workloads is List[AgentWorkload]
        agents_list = []
        for agent in agents_workloads:
            agents_list.append(AgentListItem(
                agent_profile_id=agent.agent_profile_id,
                agent_id=agent.user_id,  # For backward compatibility
                agent_name=agent.agent_name,
                agent_email=agent.agent_email or "",
                current_assignments=agent.current_assignments,
                capacity_percentage=agent.capacity_percentage,
                workload_status=agent.workload_status,
                availability=agent.availability,
                specializations=agent.specializations,
                avg_processing_time_hours=agent.avg_processing_time_hours,
                success_rate=agent.success_rate
            ))

        logger.info(f"Agents list loaded for supervisor {current_user.email}")

        return agents_list

    except Exception as e:
        logger.error(f"Error listing agents: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list agents"
        )


@router.get("/agents/{agent_profile_id}/stats", response_model=AgentAssignmentStats)
async def get_agent_stats(
    agent_profile_id: UUID,
    period_days: int = Query(30, ge=1, le=365, description="Statistics period in days"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("agent.view_performance"))
):
    """
    **Get detailed statistics for an agent**

    Permissions:
    - Requires appropriate RBAC permission (see @require_permission decorator)

    Returns:
    - Total assignments (period)
    - Completed assignments
    - Avg processing time
    - Success rate
    - Quality score avg
    - Deadline compliance rate
    - By status breakdown
    - By type breakdown

    Query Parameters:
    - period_days: Statistics period (default: 30, max: 365)

    Migration 054: Uses agent_profile_id instead of agent_id
    """
    assignment_repo = get_assignment_repository(db)

    try:
        stats = await assignment_repo.get_agent_stats(db, agent_profile_id, period_days)

        logger.info(
            f"Agent stats loaded for agent_profile {agent_profile_id} by supervisor {current_user.email}"
        )

        return stats

    except Exception as e:
        logger.error(f"Error getting agent stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get agent statistics"
        )


@router.get("/agents/{agent_profile_id}/forecast", response_model=AgentCapacityForecast)
async def get_agent_forecast(
    agent_profile_id: UUID,
    horizon_days: int = Query(7, ge=1, le=30, description="Forecast horizon in days"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("agent.view_workload"))
):
    """
    **Get capacity forecast for an agent**

    Permissions:
    - Requires appropriate RBAC permission (see @require_permission decorator)

    Returns:
    - Current capacity
    - Forecasted capacity (based on historical trends)
    - Estimated completions next period
    - Estimated new assignments
    - Can accept new assignments?
    - Max recommended new assignments

    Query Parameters:
    - horizon_days: Forecast horizon (default: 7, max: 30)

    Migration 054: Uses agent_profile_id instead of agent_id
    """
    workload_repo = get_workload_repository(db)

    try:
        forecast = await workload_repo.get_capacity_forecast(db, agent_profile_id, horizon_days)

        logger.info(
            f"Capacity forecast generated for agent_profile {agent_profile_id} "
            f"by supervisor {current_user.email}"
        )

        return forecast

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating forecast: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate forecast"
        )


# ============================================================================
# ENDPOINTS - WORKLOAD MANAGEMENT
# ============================================================================

@router.get("/workload/balance", response_model=WorkloadBalanceResponse)
async def get_workload_balance(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("agent.view_workload"))
):
    """
    **Get workload balance report for team**

    Permissions:
    - Requires appropriate RBAC permission (see @require_permission decorator)

    Returns:
    - Balance report (balance score, statistics)
    - List of agents with workload details
    - Recommendations for rebalancing

    Balance Score:
    - 100 = Perfect balance (all agents have same workload)
    - 70-99 = Good balance
    - 50-69 = Moderate imbalance
    - <50 = High imbalance (rebalancing recommended)

    Recommendations:
    - Auto-generated based on balance score
    - Suggests specific reassignments

    Migration 048: Uses unified 'agent' role with agent_profiles for filtering
    """
    # Get agent context from agent_profiles
    # Admin sees all (no filtering by ministry/entity)
    if current_user.role == "admin":
        agent_ctx = {"entity_type": None, "ministry_id": None, "entity_id": None, "is_supervisor": True}
    else:
        agent_ctx = await get_agent_context(current_user.id, db)

    entity_type = agent_ctx.get("entity_type")
    workload_repo = get_workload_repository(db)

    try:
        # Get balance report
        report = await workload_repo.get_workload_balance_report(
            entity_type,
            agent_ctx.get("ministry_id") or agent_ctx.get("entity_id")
        )

        # Get agent list - uses unified 'agent' role with agent_profiles (Migration 054)
        agents_workloads = await workload_repo.get_available_agents(
            db=db,
            max_workload_pct=100.0
        )

        # Build response - agents_workloads is List[AgentWorkload]
        agents_list = []
        for agent in agents_workloads:
            agents_list.append(AgentListItem(
                agent_profile_id=agent.agent_profile_id,
                agent_id=agent.user_id,  # For backward compatibility
                agent_name=agent.agent_name,
                agent_email=agent.agent_email or "",
                current_assignments=agent.current_assignments,
                capacity_percentage=agent.capacity_percentage,
                workload_status=agent.workload_status,
                availability=agent.availability,
                specializations=agent.specializations,
                avg_processing_time_hours=agent.avg_processing_time_hours,
                success_rate=agent.success_rate
            ))

        # Generate recommendations
        recommendations = []

        if report.rebalancing_needed:
            recommendations.append({
                "type": "rebalance",
                "priority": "high",
                "message": f"Workload imbalance detected (balance score: {report.balance_score:.0f}/100)"
            })

        if report.overloaded_agents > 0:
            recommendations.append({
                "type": "overload",
                "priority": "urgent",
                "message": f"{report.overloaded_agents} agent(s) overloaded - consider reassignment"
            })

        if report.balance_score < 50:
            recommendations.append({
                "type": "urgent_rebalance",
                "priority": "urgent",
                "message": "Critical workload imbalance - immediate action recommended"
            })

        response = WorkloadBalanceResponse(
            report=report,
            agents=agents_list,
            recommendations=recommendations
        )

        logger.info(
            f"Workload balance report generated for {entity_type}/{agent_ctx.get('ministry_id') or agent_ctx.get('entity_id')} "
            f"by supervisor {current_user.email}"
        )

        return response

    except Exception as e:
        logger.error(f"Error generating balance report: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate balance report"
        )


# ============================================================================
# ENDPOINTS - ASSIGNMENT RULES MANAGEMENT
# ============================================================================

@router.post("/rules", response_model=AssignmentRule, status_code=status.HTTP_201_CREATED)
async def create_rule(
    rule_data: AssignmentRuleCreate,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("rules.create"))
):
    """
    **Create a new assignment rule (Supervisor only)**

    Permissions:
    - Requires appropriate RBAC permission (see @require_permission decorator)

    Request Body:
    - name: Rule name (required)
    - description: Rule description
    - priority: Priority 1-100 (lower = higher priority)
    - entity_type: 'ministry' or 'entity'
    - entity_id: Ministry ID or Entity ID (optional for global rules)
    - conditions: List of conditions (AND logic)
    - actions: List of actions to apply

    Conditions:
    - document_type, document_subtype, sector_id, category_id, amount_range, etc.
    - Operators: equals, not_equals, greater_than, less_than, in_list, etc.

    Actions:
    - require_specialization, require_experience_level, require_department
    - assign_to_specific_agent, set_priority_level, set_deadline, etc.

    Created rules start in 'draft' status - must be activated
    """
    rules_repo = get_rules_repository(db)

    try:
        # Set created_by
        rule_data.created_by = UUID(current_user.id)

        # Validate entity context (Migration 048: uses agent_profiles)
        # Admin can create rules for any entity_type
        if current_user.role == "admin":
            agent_ctx = {"entity_type": None, "ministry_id": None, "entity_id": None, "is_supervisor": True}
        else:
            agent_ctx = await get_agent_context(current_user.id, db)

        entity_type = agent_ctx.get("entity_type")
        # Non-admin agents can only create rules for their own entity_type
        if entity_type and rule_data.entity_type != entity_type:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Can only create rules for {entity_type}"
            )

        rule = await rules_repo.create(rule_data)

        logger.info(
            f"Assignment rule created by {current_user.email} - "
            f"Rule {rule.id} ({rule.name})"
        )

        return rule

    except Exception as e:
        logger.error(f"Error creating rule: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create rule"
        )


@router.get("/rules", response_model=List[AssignmentRule])
async def list_rules(
    status_filter: Optional[RuleStatus] = Query(None, description="Filter by status"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("rules.view"))
):
    """
    **List assignment rules**

    Permissions:
    - Requires appropriate RBAC permission (see @require_permission decorator)

    Returns:
    - All rules for supervisor's entity
    - Sorted by priority (ASC)

    Query Parameters:
    - status: Filter by status (active, inactive, draft, archived)

    Migration 048: Uses unified 'agent' role with agent_profiles for filtering
    """
    # Get agent context from agent_profiles
    # Admin sees all rules (no filtering by ministry/entity)
    if current_user.role == "admin":
        agent_ctx = {"entity_type": None, "ministry_id": None, "entity_id": None, "is_supervisor": True}
    else:
        agent_ctx = await get_agent_context(current_user.id, db)

    entity_type = agent_ctx.get("entity_type")
    entity_id = agent_ctx.get("ministry_id") or agent_ctx.get("entity_id")
    rules_repo = get_rules_repository(db)

    try:
        rules = await rules_repo.get_all(
            entity_type=entity_type,
            entity_id=entity_id,
            status=status_filter,
            order_by_priority=True
        )

        logger.info(f"Rules list loaded for supervisor {current_user.email}")

        return rules

    except Exception as e:
        logger.error(f"Error listing rules: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list rules"
        )


@router.get("/rules/{rule_id}", response_model=AssignmentRule)
async def get_rule(
    rule_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("rules.view"))
):
    """**Get assignment rule by ID**"""
    rules_repo = get_rules_repository(db)

    try:
        rule = await rules_repo.get_by_id(rule_id)

        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rule {rule_id} not found"
            )

        return rule

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting rule: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get rule"
        )


@router.put("/rules/{rule_id}", response_model=AssignmentRule)
async def update_rule(
    rule_id: UUID,
    update_data: AssignmentRuleUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("rules.edit"))
):
    """**Update assignment rule**"""
    rules_repo = get_rules_repository(db)

    try:
        updated = await rules_repo.update(
            rule_id,
            update_data,
            updated_by=UUID(current_user.id)
        )

        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rule {rule_id} not found"
            )

        logger.info(f"Rule {rule_id} updated by {current_user.email}")

        return updated

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating rule: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update rule"
        )


@router.post("/rules/{rule_id}/activate", response_model=AssignmentRule)
async def activate_rule(
    rule_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("rules.activate"))
):
    """**Activate a rule (draft/inactive → active)**"""
    rules_repo = get_rules_repository(db)

    try:
        activated = await rules_repo.activate(rule_id)

        if not activated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rule {rule_id} not found"
            )

        logger.info(f"Rule {rule_id} activated by {current_user.email}")

        return activated

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error activating rule: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate rule"
        )


@router.post("/rules/{rule_id}/deactivate", response_model=AssignmentRule)
async def deactivate_rule(
    rule_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("rules.activate"))
):
    """**Deactivate a rule (active → inactive)**"""
    rules_repo = get_rules_repository(db)

    try:
        deactivated = await rules_repo.deactivate(rule_id)

        if not deactivated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rule {rule_id} not found"
            )

        logger.info(f"Rule {rule_id} deactivated by {current_user.email}")

        return deactivated

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deactivating rule: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate rule"
        )


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_rule(
    rule_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("rules.delete"))
):
    """**Archive a rule (soft delete)**"""
    rules_repo = get_rules_repository(db)

    try:
        archived = await rules_repo.archive(rule_id)

        if not archived:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rule {rule_id} not found"
            )

        logger.info(f"Rule {rule_id} archived by {current_user.email}")

        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving rule: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to archive rule"
        )


# ============================================================================
# ENDPOINTS - ESCALATIONS MANAGEMENT
# ============================================================================

class EscalationListItem(BaseModel):
    """Escalation item for supervisor list"""
    id: UUID
    queue_id: UUID
    reason: str
    priority_score: float
    status: str
    escalation_status: str
    case_reference: str
    case_type: str
    escalated_by_name: str
    escalated_by_email: str
    escalated_at: datetime
    created_at: datetime
    assigned_to_name: Optional[str] = None


class EscalationStatsResponse(BaseModel):
    """Escalation statistics"""
    pending: int
    in_review: int
    resolved_today: int
    total: int


@router.get("/escalations", response_model=List[EscalationListItem])
async def list_escalations(
    status_filter: Optional[str] = Query(None, description="Filter by status: pending, in_review, resolved"),
    include_resolved: bool = Query(False, description="Include resolved escalations"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("escalations.view"))
):
    """
    **List all escalated items for supervisor review**

    Permissions:
    - Requires: escalations.view

    Returns:
    - Escalated queue items with agent info
    - Sorted by escalation time (most recent first)
    - Filters by ministry/entity for non-admin users

    Query Parameters:
    - status_filter: Filter by escalation_status
    - include_resolved: Include completed items
    - page, page_size: Pagination
    """
    # Get agent context
    if current_user.role == "admin":
        agent_ctx = {"ministry_id": None, "entity_id": None}
    else:
        agent_ctx = await get_agent_context(str(current_user.id), db)

    offset = (page - 1) * page_size

    # Build status filter
    status_where = ""
    if status_filter == "pending":
        status_where = "AND q.assigned_to IS NULL AND q.status != 'completed'"
    elif status_filter == "in_review":
        status_where = "AND q.assigned_to IS NOT NULL AND q.status != 'completed'"
    elif status_filter == "resolved":
        status_where = "AND q.status = 'completed'"
    elif not include_resolved:
        status_where = "AND q.status != 'completed'"

    # Ministry filter for non-admin
    ministry_filter = ""
    params = [page_size, offset]
    param_idx = 3

    if agent_ctx.get("ministry_id"):
        ministry_filter = f"AND q.ministry_id = ${param_idx}"
        params.insert(0, agent_ctx["ministry_id"])
        param_idx += 1

    query = f"""
        SELECT
            q.id as queue_id,
            q.item_id,
            q.escalation_reason,
            q.priority_score,
            q.status,
            q.escalated_at,
            q.created_at,
            q.assigned_to,
            sr.reference as case_reference,
            sr.workflow_code as case_type,
            escalator.full_name as escalated_by_name,
            escalator.email as escalated_by_email,
            assignee.full_name as assigned_to_name,
            CASE
                WHEN q.status = 'completed' THEN 'resolved'
                WHEN q.assigned_to IS NOT NULL THEN 'in_review'
                ELSE 'pending'
            END as escalation_status
        FROM agent_work_queue q
        JOIN service_requests sr ON sr.id = q.item_id
        LEFT JOIN users escalator ON escalator.id = q.escalated_by
        LEFT JOIN users assignee ON assignee.id = q.assigned_to
        WHERE q.item_type = 'service_request'
        AND q.escalated = true
        {ministry_filter}
        {status_where}
        ORDER BY q.escalated_at DESC
        LIMIT ${param_idx - 1} OFFSET ${param_idx}
    """

    rows = await db.fetch(query, *params)

    return [
        EscalationListItem(
            id=row['item_id'],
            queue_id=row['queue_id'],
            reason=row['escalation_reason'] or '',
            priority_score=float(row['priority_score']),
            status=row['status'],
            escalation_status=row['escalation_status'],
            case_reference=row['case_reference'] or '',
            case_type=row['case_type'] or '',
            escalated_by_name=row['escalated_by_name'] or 'Unknown',
            escalated_by_email=row['escalated_by_email'] or '',
            escalated_at=row['escalated_at'] or row['created_at'],
            created_at=row['created_at'],
            assigned_to_name=row['assigned_to_name']
        )
        for row in rows
    ]


@router.get("/escalations/stats", response_model=EscalationStatsResponse)
async def get_escalation_stats(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("escalations.view"))
):
    """
    **Get escalation statistics**

    Returns counts of escalations by status.
    """
    # Get agent context
    if current_user.role == "admin":
        agent_ctx = {"ministry_id": None}
    else:
        agent_ctx = await get_agent_context(str(current_user.id), db)

    ministry_filter = ""
    params = []

    if agent_ctx.get("ministry_id"):
        ministry_filter = "AND ministry_id = $1"
        params.append(agent_ctx["ministry_id"])

    query = f"""
        SELECT
            COUNT(*) FILTER (WHERE assigned_to IS NULL AND status != 'completed') as pending,
            COUNT(*) FILTER (WHERE assigned_to IS NOT NULL AND status != 'completed') as in_review,
            COUNT(*) FILTER (WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '24 hours') as resolved_today,
            COUNT(*) as total
        FROM agent_work_queue
        WHERE item_type = 'service_request'
        AND escalated = true
        {ministry_filter}
    """

    row = await db.fetchrow(query, *params)

    return EscalationStatsResponse(
        pending=row['pending'] or 0,
        in_review=row['in_review'] or 0,
        resolved_today=row['resolved_today'] or 0,
        total=row['total'] or 0
    )


@router.post("/escalations/{queue_id}/assign")
async def assign_escalation(
    queue_id: UUID,
    agent_id: Optional[UUID] = None,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("escalations.assign"))
):
    """
    **Assign an escalated item to an agent (or self)**

    If agent_id is not provided, assigns to current user.
    """
    target_agent = agent_id or UUID(current_user.id)

    result = await db.fetchrow("""
        UPDATE agent_work_queue
        SET assigned_to = $2,
            assigned_at = NOW(),
            status = 'assigned',
            updated_at = NOW()
        WHERE id = $1
        AND escalated = true
        AND status = 'pending'
        RETURNING id
    """, str(queue_id), str(target_agent))

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escalation not found or already assigned"
        )

    logger.info(f"Escalation {queue_id} assigned to {target_agent} by {current_user.email}")

    return {"message": "Escalation assigned", "queue_id": str(queue_id), "assigned_to": str(target_agent)}


class ResolveEscalationRequest(BaseModel):
    """Request to resolve an escalation"""
    resolution_notes: str = Field(..., min_length=5, max_length=500)


@router.post("/escalations/{queue_id}/resolve")
async def resolve_escalation(
    queue_id: UUID,
    request_data: ResolveEscalationRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("escalations.resolve"))
):
    """
    **Resolve an escalation**

    Marks the queue item as completed and adds resolution note to service_request.
    """
    # Get the queue item first to find the service request
    queue_item = await db.fetchrow("""
        SELECT item_id FROM agent_work_queue
        WHERE id = $1 AND escalated = true
    """, str(queue_id))

    if not queue_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escalation not found"
        )

    # Update queue item as completed
    result = await db.fetchrow("""
        UPDATE agent_work_queue
        SET status = 'completed',
            completed_at = NOW(),
            completed_by = $2,
            updated_at = NOW()
        WHERE id = $1
        AND escalated = true
        RETURNING id, item_id
    """, str(queue_id), str(current_user.id))

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Failed to update escalation"
        )

    # Add resolution notes to service_request
    await db.execute("""
        UPDATE service_requests
        SET notes = COALESCE(notes, '') || E'\n[ESCALATION RESOLVED] ' || $2,
            updated_at = NOW()
        WHERE id = $1
    """, result['item_id'], request_data.resolution_notes)

    logger.info(f"Escalation {queue_id} resolved by {current_user.email}")

    return {"message": "Escalation resolved", "queue_id": str(queue_id)}


@router.get("/rules/effectiveness/report", response_model=List[RuleEffectivenessItem])
async def get_rules_effectiveness(
    min_applications: int = Query(10, ge=1, description="Minimum applications to include"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("rules.view_effectiveness"))
):
    """
    **Get rule effectiveness report**

    Permissions:
    - Requires: rules.view_effectiveness

    Returns:
    - Rules with effectiveness metrics
    - Sorted by effectiveness score (DESC)
    - Filters rules with minimum applications

    Metrics:
    - times_matched: How many times conditions matched
    - times_applied: How many times actions were applied
    - success_rate: Percentage of successful assignments
    - effectiveness_score: success_rate * 100
    - application_rate: (applied / matched) * 100

    Query Parameters:
    - min_applications: Minimum times_applied (default: 10)

    Migration 048: Uses unified 'agent' role with agent_profiles for filtering
    """
    # Get agent context from agent_profiles
    # Admin sees all rules (no filtering by ministry/entity)
    if current_user.role == "admin":
        agent_ctx = {"entity_type": None, "ministry_id": None, "entity_id": None, "is_supervisor": True}
    else:
        agent_ctx = await get_agent_context(current_user.id, db)

    entity_type = agent_ctx.get("entity_type")
    rules_repo = get_rules_repository(db)

    try:
        report_data = await rules_repo.get_effectiveness_report(
            entity_type=entity_type,
            min_times_applied=min_applications
        )

        # Convert to response model
        report = [
            RuleEffectivenessItem(
                rule_id=row["id"],
                rule_name=row["name"],
                priority=row["priority"],
                times_applied=row["times_applied"],
                times_matched=row["times_matched"],
                success_rate=float(row["success_rate"]),
                effectiveness_score=float(row["effectiveness_score"]),
                application_rate=float(row["application_rate"]),
                last_applied_at=row.get("last_applied_at")
            )
            for row in report_data
        ]

        logger.info(
            f"Rule effectiveness report generated for {entity_type} "
            f"by supervisor {current_user.email}"
        )

        return report

    except Exception as e:
        logger.error(f"Error generating effectiveness report: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate effectiveness report"
        )
