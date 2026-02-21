"""
Supervisor Routes - Dashboard and Management for Supervisors
Handles supervisor operations: dashboard, team management, rules management

Author: Claude Code
Date: 2025-11-16
Version: 1.0 - Initial implementation
"""

from typing import List, Literal, Optional, Dict, Any
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

import json
import logging
from app.core.events import EventBus, EventType
from app.modules.service_requests.models.enums import ServiceRequestStatus

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


async def _get_supervisor_workflow_scope(agent_ctx: Dict[str, Any], db) -> Optional[list]:
    """
    Returns the list of workflow_codes this supervisor can see, or None for admin (no filter).
    Used to scope ALL supervisor queries to their entity.
    """
    entity_id = agent_ctx.get("entity_id")
    if not entity_id:
        return None  # Admin or no entity → see everything

    entity = await db.fetchrow(
        "SELECT workflow_codes FROM entities WHERE id = $1", entity_id
    )
    if not entity or not entity['workflow_codes']:
        return []  # Entity without workflows → see nothing

    wf_codes = entity['workflow_codes']
    if isinstance(wf_codes, str):
        wf_codes = json.loads(wf_codes)
    return [str(c) for c in wf_codes]


# ============================================================================
# REQUEST/RESPONSE SCHEMAS
# ============================================================================

class DashboardTeamStats(BaseModel):
    activeAgents: int = 0
    totalAgents: int = 0
    utilizationRate: float = 0.0

class DashboardEscalationStats(BaseModel):
    pending: int = 0
    resolvedToday: int = 0
    avgResolutionTime: float = 0.0

class DashboardAssignmentStats(BaseModel):
    pending: int = 0
    inProgress: int = 0
    completedToday: int = 0

class DashboardPerformanceStats(BaseModel):
    avgResponseTime: float = 0.0
    slaCompliance: float = 0.0
    qualityScore: float = 0.0

class DashboardResponse(BaseModel):
    """Supervisor dashboard data — aligned with frontend SupervisorDashboardStats"""
    team: DashboardTeamStats
    escalations: DashboardEscalationStats
    assignments: DashboardAssignmentStats
    performance: DashboardPerformanceStats


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

    # Resolve scope: which workflow_codes this supervisor manages
    if current_user.role == "admin":
        agent_ctx = {"entity_type": None, "entity_id": None, "is_supervisor": True}
    else:
        agent_ctx = await get_agent_context(current_user.id, db)

    wf_scope = await _get_supervisor_workflow_scope(agent_ctx, db)
    # wf_scope = None → admin (no filter) | [] → empty entity | [...] → scoped

    try:
        # --- Team stats (scoped to entity) ---
        if wf_scope is not None and agent_ctx.get("entity_id"):
            team_row = await db.fetchrow("""
                SELECT
                    COUNT(*) FILTER (WHERE ap.is_active = true) as total_agents,
                    COUNT(*) FILTER (WHERE ap.is_active = true AND COALESCE(aw.workload_status, 'available') = 'available') as active_agents,
                    COALESCE(AVG(COALESCE(aw.capacity_percentage, 0)) FILTER (WHERE ap.is_active = true), 0) as avg_capacity
                FROM agent_profiles ap
                LEFT JOIN agent_workloads aw ON aw.agent_profile_id = ap.id
                WHERE ap.entity_id = $1
            """, agent_ctx["entity_id"])
        else:
            team_row = await db.fetchrow("""
                SELECT
                    COUNT(*) FILTER (WHERE ap.is_active = true) as total_agents,
                    COUNT(*) FILTER (WHERE ap.is_active = true AND COALESCE(aw.workload_status, 'available') = 'available') as active_agents,
                    COALESCE(AVG(COALESCE(aw.capacity_percentage, 0)) FILTER (WHERE ap.is_active = true), 0) as avg_capacity
                FROM agent_profiles ap
                LEFT JOIN agent_workloads aw ON aw.agent_profile_id = ap.id
            """)

        # --- Escalation stats (scoped to entity's workflow_codes) ---
        if wf_scope is not None:
            esc_row = await db.fetchrow("""
                SELECT
                    COUNT(*) as pending,
                    (SELECT COUNT(*) FROM service_request_history h
                     JOIN service_requests sr2 ON sr2.id = h.service_request_id
                     WHERE h.action = 'escalation_resolved'
                     AND h.performed_at > NOW() - INTERVAL '24 hours'
                     AND sr2.workflow_code = ANY($1)) as resolved_today
                FROM service_requests
                WHERE escalated = true AND workflow_code = ANY($1)
            """, wf_scope)
        else:
            esc_row = await db.fetchrow("""
                SELECT
                    COUNT(*) as pending,
                    (SELECT COUNT(*) FROM service_request_history
                     WHERE action = 'escalation_resolved'
                     AND performed_at > NOW() - INTERVAL '24 hours') as resolved_today
                FROM service_requests
                WHERE escalated = true
            """)

        # --- Assignment stats (scoped via service_requests join) ---
        if wf_scope is not None:
            asgn_row = await db.fetchrow("""
                SELECT
                    COUNT(*) FILTER (WHERE a.status = 'assigned') as pending,
                    COUNT(*) FILTER (WHERE a.status = 'in_progress') as in_progress,
                    COUNT(*) FILTER (WHERE a.status = 'completed' AND a.completed_at > NOW() - INTERVAL '24 hours') as completed_today
                FROM assignments a
                JOIN service_requests sr ON sr.id::text = a.item_id
                WHERE sr.workflow_code = ANY($1)
            """, wf_scope)
        else:
            asgn_row = await db.fetchrow("""
                SELECT
                    COUNT(*) FILTER (WHERE status = 'assigned') as pending,
                    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                    COUNT(*) FILTER (WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '24 hours') as completed_today
                FROM assignments
            """)

        # --- Performance (scoped, last 30 days) ---
        if wf_scope is not None:
            perf_row = await db.fetchrow("""
                SELECT
                    COALESCE(AVG(EXTRACT(EPOCH FROM (a.completed_at - a.assigned_at)) / 3600), 0) as avg_response_hours,
                    COALESCE(
                        COUNT(*) FILTER (WHERE a.completed_at IS NOT NULL AND a.completed_at < a.deadline) * 100.0
                        / NULLIF(COUNT(*) FILTER (WHERE a.completed_at IS NOT NULL), 0),
                        100.0
                    ) as sla_compliance
                FROM assignments a
                JOIN service_requests sr ON sr.id::text = a.item_id
                WHERE a.completed_at > NOW() - INTERVAL '30 days'
                AND sr.workflow_code = ANY($1)
            """, wf_scope)
        else:
            perf_row = await db.fetchrow("""
                SELECT
                    COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - assigned_at)) / 3600), 0) as avg_response_hours,
                    COALESCE(
                        COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND completed_at < deadline) * 100.0
                        / NULLIF(COUNT(*) FILTER (WHERE completed_at IS NOT NULL), 0),
                        100.0
                    ) as sla_compliance
                FROM assignments
                WHERE completed_at > NOW() - INTERVAL '30 days'
            """)

        response = DashboardResponse(
            team=DashboardTeamStats(
                activeAgents=team_row['active_agents'] or 0,
                totalAgents=team_row['total_agents'] or 0,
                utilizationRate=round(float(team_row['avg_capacity'] or 0), 1),
            ),
            escalations=DashboardEscalationStats(
                pending=esc_row['pending'] or 0,
                resolvedToday=esc_row['resolved_today'] or 0,
                avgResolutionTime=0.0,
            ),
            assignments=DashboardAssignmentStats(
                pending=asgn_row['pending'] or 0,
                inProgress=asgn_row['in_progress'] or 0,
                completedToday=asgn_row['completed_today'] or 0,
            ),
            performance=DashboardPerformanceStats(
                avgResponseTime=round(float(perf_row['avg_response_hours'] or 0), 1),
                slaCompliance=round(float(perf_row['sla_compliance'] or 100), 1),
                qualityScore=0.0,  # Not yet computed
            ),
        )

        logger.info(f"Dashboard loaded for supervisor {current_user.email}")
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
    **List all escalated service requests for supervisor review**

    Reads from service_requests WHERE escalated = true.
    Scoped to supervisor's entity workflow_codes.
    """
    # Get agent context for scoping
    if current_user.role == "admin":
        agent_ctx = {"ministry_id": None, "entity_id": None}
    else:
        agent_ctx = await get_agent_context(str(current_user.id), db)

    offset = (page - 1) * page_size

    # Build conditions
    conditions = ["sr.escalated = true"]
    params: list = []
    param_idx = 1

    # Status filter (pending = no assignee, in_review = has assignee)
    if status_filter == "pending":
        conditions.append("sr.assigned_to IS NULL")
    elif status_filter == "in_review":
        conditions.append("sr.assigned_to IS NOT NULL")
    elif status_filter == "resolved":
        # Resolved = no longer escalated but was resolved recently
        conditions[0] = "sr.escalated = false"
        conditions.append("""EXISTS (
            SELECT 1 FROM service_request_history h
            WHERE h.service_request_id = sr.id
            AND h.action = 'escalation_resolved'
            AND h.performed_at > NOW() - INTERVAL '7 days'
        )""")

    # Scope to entity's workflow_codes
    if agent_ctx.get("entity_id"):
        entity = await db.fetchrow(
            "SELECT workflow_codes FROM entities WHERE id = $1",
            agent_ctx["entity_id"]
        )
        if entity and entity['workflow_codes']:
            wf_codes = entity['workflow_codes']
            if isinstance(wf_codes, str):
                wf_codes = json.loads(wf_codes)
            conditions.append(f"sr.workflow_code = ANY(${param_idx})")
            params.append([str(c) for c in wf_codes])
            param_idx += 1

    where_clause = " AND ".join(conditions)
    params.extend([page_size, offset])

    query = f"""
        SELECT
            sr.id,
            sr.reference,
            sr.workflow_code,
            sr.status,
            sr.priority,
            sr.escalation_reason,
            sr.escalated_at,
            sr.escalated_by,
            sr.assigned_to,
            sr.created_at,
            escalator.first_name as esc_first, escalator.last_name as esc_last,
            escalator.email as esc_email,
            assignee.first_name as asgn_first, assignee.last_name as asgn_last,
            CASE
                WHEN sr.escalated = false THEN 'resolved'
                WHEN sr.assigned_to IS NOT NULL THEN 'in_review'
                ELSE 'pending'
            END as escalation_status
        FROM service_requests sr
        LEFT JOIN users escalator ON escalator.id = sr.escalated_by
        LEFT JOIN users assignee ON assignee.id = sr.assigned_to
        WHERE {where_clause}
        ORDER BY sr.escalated_at DESC NULLS LAST
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """

    rows = await db.fetch(query, *params)

    # Map priority enum to numeric score for frontend badge colors
    PRIORITY_SCORES = {'URGENT': 90.0, 'HIGH': 70.0, 'NORMAL': 40.0, 'LOW': 10.0}

    return [
        EscalationListItem(
            id=row['id'],
            queue_id=row['id'],  # Frontend uses queue_id for mutations — map to sr.id
            reason=row['escalation_reason'] or '',
            priority_score=PRIORITY_SCORES.get(str(row['priority']), 40.0),
            status=row['status'],
            escalation_status=row['escalation_status'],
            case_reference=row['reference'] or '',
            case_type=row['workflow_code'] or '',
            escalated_by_name=f"{row['esc_first'] or ''} {row['esc_last'] or ''}".strip() or 'Unknown',
            escalated_by_email=row['esc_email'] or '',
            escalated_at=row['escalated_at'] or row['created_at'],
            created_at=row['created_at'],
            assigned_to_name=(f"{row['asgn_first'] or ''} {row['asgn_last'] or ''}".strip() or None) if row['assigned_to'] else None
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
    **Get escalation statistics from service_requests**

    Returns counts of escalations by status.
    """
    # Scope to entity
    if current_user.role == "admin":
        agent_ctx = {"entity_id": None}
    else:
        agent_ctx = await get_agent_context(str(current_user.id), db)

    wf_scope = await _get_supervisor_workflow_scope(agent_ctx, db)

    if wf_scope is not None:
        row = await db.fetchrow("""
            SELECT
                COUNT(*) FILTER (WHERE escalated = true AND assigned_to IS NULL) as pending,
                COUNT(*) FILTER (WHERE escalated = true AND assigned_to IS NOT NULL) as in_review,
                (SELECT COUNT(*) FROM service_request_history h
                 JOIN service_requests sr2 ON sr2.id = h.service_request_id
                 WHERE h.action = 'escalation_resolved'
                 AND h.performed_at > NOW() - INTERVAL '24 hours'
                 AND sr2.workflow_code = ANY($1)) as resolved_today,
                COUNT(*) FILTER (WHERE escalated = true) as total
            FROM service_requests
            WHERE escalated = true AND workflow_code = ANY($1)
        """, wf_scope)
    else:
        row = await db.fetchrow("""
            SELECT
                COUNT(*) FILTER (WHERE escalated = true AND assigned_to IS NULL) as pending,
                COUNT(*) FILTER (WHERE escalated = true AND assigned_to IS NOT NULL) as in_review,
                (SELECT COUNT(*) FROM service_request_history
                 WHERE action = 'escalation_resolved'
                 AND performed_at > NOW() - INTERVAL '24 hours') as resolved_today,
                COUNT(*) FILTER (WHERE escalated = true) as total
            FROM service_requests
            WHERE escalated = true
        """)

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
    **Assign an escalated service request to an agent (or self)**

    queue_id is actually the service_request.id (frontend compatibility).
    """
    target_agent = agent_id or UUID(current_user.id)

    result = await db.fetchrow("""
        UPDATE service_requests
        SET assigned_to = $2,
            assigned_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
        AND escalated = true
        RETURNING id, reference
    """, queue_id, target_agent)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escalated request not found"
        )

    # Record in history
    await db.execute("""
        INSERT INTO service_request_history
        (service_request_id, action, previous_status, new_status, performed_by, comment)
        VALUES ($1, 'escalation_assigned', (SELECT status FROM service_requests WHERE id = $1),
                (SELECT status FROM service_requests WHERE id = $1), $2,
                'escalation_assigned')
    """, queue_id, UUID(current_user.id))

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
    **Resolve an escalation on a service request**

    queue_id is actually service_request.id (frontend compatibility).
    De-escalates the request and records resolution notes in history.
    """
    # Find the escalated service request
    request = await db.fetchrow("""
        SELECT id, reference, status, escalated
        FROM service_requests WHERE id = $1
    """, queue_id)

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found"
        )
    if not request['escalated']:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Service request is not escalated"
        )

    # De-escalate
    await db.execute("""
        UPDATE service_requests
        SET escalated = false,
            escalated_at = NULL,
            escalated_by = NULL,
            escalation_reason = NULL,
            escalation_sla_warning_sent = false,
            escalation_sla_escalated = false,
            updated_at = NOW()
        WHERE id = $1
    """, queue_id)

    # Record resolution in history with notes
    await db.execute("""
        INSERT INTO service_request_history
        (service_request_id, action, previous_status, new_status, performed_by, comment)
        VALUES ($1, 'escalation_resolved', $2, $2, $3, $4)
    """, queue_id, request['status'], UUID(current_user.id), request_data.resolution_notes)

    logger.info(f"Escalation {queue_id} resolved by {current_user.email}: {request_data.resolution_notes}")

    return {"message": "Escalation resolved", "queue_id": str(queue_id)}


# ============================================================================
# SUPERVISOR DIRECT ACTIONS (approve / reject bypassing agent)
# ============================================================================

class SupervisorApproveRequest(BaseModel):
    """Supervisor approves an escalated request directly"""
    notes: Optional[str] = Field(None, max_length=500)


class SupervisorRejectRequest(BaseModel):
    """Supervisor rejects an escalated request directly"""
    rejection_reason: str = Field(..., min_length=5, max_length=500)


@router.post("/escalations/{queue_id}/approve")
async def supervisor_approve(
    queue_id: UUID,
    request_data: SupervisorApproveRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("escalations.resolve"))
):
    """
    **Supervisor approves an escalated service request directly**

    Bypasses the agent: status → DOSSIER_VALIDE, escalated → false.
    Publishes REQUEST_APPROVED event for citizen notification.
    """
    request = await db.fetchrow("""
        SELECT id, reference, status, escalated, user_id, workflow_code
        FROM service_requests WHERE id = $1
    """, queue_id)

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found"
        )
    if not request['escalated']:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Service request is not escalated"
        )

    previous_status = request['status']
    approved_status = ServiceRequestStatus.DOSSIER_VALIDE.value

    # Approve + de-escalate in one update
    await db.execute("""
        UPDATE service_requests
        SET status = $2,
            escalated = false,
            escalated_at = NULL,
            escalated_by = NULL,
            escalation_reason = NULL,
            escalation_sla_warning_sent = false,
            escalation_sla_escalated = false,
            validated_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
    """, queue_id, approved_status)

    # Record in history — action = supervisor_approve (distinct from agent status_change)
    comment = request_data.notes or "supervisor_approve"
    await db.execute("""
        INSERT INTO service_request_history
        (service_request_id, action, previous_status, new_status, performed_by, comment)
        VALUES ($1, 'supervisor_approve', $2, $3, $4, $5)
    """, queue_id, previous_status, approved_status, UUID(current_user.id), comment)

    # Publish event for citizen notification (email/SMS)
    try:
        user_info = await db.fetchrow(
            "SELECT id, email, first_name, last_name, phone_number, preferred_language FROM users WHERE id = $1",
            request['user_id']
        )
        if user_info:
            EventBus.publish_nowait(EventType.REQUEST_APPROVED, {
                "request_id": str(queue_id),
                "user_id": str(user_info['id']),
                "user_email": user_info['email'],
                "user_name": f"{user_info['first_name']} {user_info['last_name']}",
                "user_phone": user_info['phone_number'],
                "preferred_language": user_info['preferred_language'] or 'es',
                "workflow_code": request['workflow_code'],
                "agent_id": str(current_user.id),
                "timestamp": datetime.now().isoformat(),
            })
    except Exception as e:
        logger.warning(f"Failed to publish REQUEST_APPROVED event for {queue_id}: {e}")

    logger.info(f"Supervisor {current_user.email} approved escalation {queue_id} directly")

    return {
        "message": "Service request approved by supervisor",
        "queue_id": str(queue_id),
        "new_status": approved_status
    }


@router.post("/escalations/{queue_id}/reject")
async def supervisor_reject(
    queue_id: UUID,
    request_data: SupervisorRejectRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection),
    _: None = Depends(permission_required("escalations.resolve"))
):
    """
    **Supervisor rejects an escalated service request directly**

    Bypasses the agent: status → REJECTED, escalated → false.
    Publishes REQUEST_REJECTED event for citizen notification.
    """
    request = await db.fetchrow("""
        SELECT id, reference, status, escalated, user_id, workflow_code
        FROM service_requests WHERE id = $1
    """, queue_id)

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found"
        )
    if not request['escalated']:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Service request is not escalated"
        )

    previous_status = request['status']
    rejected_status = ServiceRequestStatus.REJECTED.value

    # Reject + de-escalate in one update
    await db.execute("""
        UPDATE service_requests
        SET status = $2,
            rejection_reason = $3,
            escalated = false,
            escalated_at = NULL,
            escalated_by = NULL,
            escalation_reason = NULL,
            escalation_sla_warning_sent = false,
            escalation_sla_escalated = false,
            validated_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
    """, queue_id, rejected_status, request_data.rejection_reason)

    # Record in history — action = supervisor_reject
    await db.execute("""
        INSERT INTO service_request_history
        (service_request_id, action, previous_status, new_status, performed_by, comment)
        VALUES ($1, 'supervisor_reject', $2, $3, $4, $5)
    """, queue_id, previous_status, rejected_status, UUID(current_user.id), request_data.rejection_reason)

    # Publish event for citizen notification (email/SMS)
    try:
        user_info = await db.fetchrow(
            "SELECT id, email, first_name, last_name, phone_number, preferred_language FROM users WHERE id = $1",
            request['user_id']
        )
        if user_info:
            EventBus.publish_nowait(EventType.REQUEST_REJECTED, {
                "request_id": str(queue_id),
                "user_id": str(user_info['id']),
                "user_email": user_info['email'],
                "user_name": f"{user_info['first_name']} {user_info['last_name']}",
                "user_phone": user_info['phone_number'],
                "preferred_language": user_info['preferred_language'] or 'es',
                "workflow_code": request['workflow_code'],
                "agent_id": str(current_user.id),
                "reason": request_data.rejection_reason,
                "timestamp": datetime.now().isoformat(),
            })
    except Exception as e:
        logger.warning(f"Failed to publish REQUEST_REJECTED event for {queue_id}: {e}")

    logger.info(f"Supervisor {current_user.email} rejected escalation {queue_id}: {request_data.rejection_reason}")

    return {
        "message": "Service request rejected by supervisor",
        "queue_id": str(queue_id),
        "new_status": rejected_status
    }


# ============================================================================
# BULK ESCALATION ACTIONS
# ============================================================================

class BulkEscalationAction(BaseModel):
    """Request body for bulk escalation operations"""
    request_ids: List[UUID] = Field(..., min_length=1, max_length=50)
    action: Literal['resolve', 'assign', 'approve', 'reject']
    resolution_notes: Optional[str] = Field(None, max_length=500)
    agent_id: Optional[UUID] = None
    notes: Optional[str] = Field(None, max_length=500)
    rejection_reason: Optional[str] = Field(None, max_length=500)


@router.post("/escalations/bulk-action")
async def bulk_escalation_action(
    body: BulkEscalationAction,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_db_connection),
    _: None = Depends(permission_required("escalations.resolve"))
):
    """
    **Bulk action on multiple escalated service requests**

    Supports: resolve, assign, approve, reject.
    All request_ids must be escalated and within the supervisor's entity scope.
    Returns processed count and any individual failures.
    """
    logger = logging.getLogger(__name__)

    # Validate conditional required fields
    if body.action == 'resolve' and (not body.resolution_notes or len(body.resolution_notes.strip()) < 5):
        raise HTTPException(status_code=422, detail="resolution_notes required (min 5 chars) for resolve action")
    if body.action == 'assign' and not body.agent_id:
        raise HTTPException(status_code=422, detail="agent_id required for assign action")
    if body.action == 'reject' and (not body.rejection_reason or len(body.rejection_reason.strip()) < 5):
        raise HTTPException(status_code=422, detail="rejection_reason required (min 5 chars) for reject action")

    # Get supervisor's entity scope (workflow_codes they manage)
    supervisor_entity = await db.fetchrow("""
        SELECT e.id, e.workflow_codes
        FROM agent_profiles ap
        JOIN entities e ON e.code = ap.entity_code
        WHERE ap.user_id = $1
    """, UUID(current_user.id))

    if not supervisor_entity or not supervisor_entity['workflow_codes']:
        raise HTTPException(status_code=403, detail="No entity scope found for supervisor")

    workflow_codes = supervisor_entity['workflow_codes']

    # Verify all IDs are escalated and in scope
    valid_rows = await db.fetch("""
        SELECT id, reference, status
        FROM service_requests
        WHERE id = ANY($1::uuid[])
          AND escalated = true
          AND workflow_code = ANY($2::text[])
    """, body.request_ids, workflow_codes)

    valid_ids = {row['id'] for row in valid_rows}
    failed = [str(rid) for rid in body.request_ids if rid not in valid_ids]

    if not valid_ids:
        raise HTTPException(status_code=404, detail="No valid escalated requests found in scope")

    valid_id_list = list(valid_ids)
    performer_id = UUID(current_user.id)
    processed = 0

    if body.action == 'resolve':
        # Bulk de-escalate
        result = await db.fetch("""
            UPDATE service_requests
            SET escalated = false,
                escalated_at = NULL,
                escalated_by = NULL,
                escalation_reason = NULL,
                escalation_sla_warning_sent = false,
                escalation_sla_escalated = false,
                updated_at = NOW()
            WHERE id = ANY($1::uuid[])
              AND escalated = true
            RETURNING id, reference, status
        """, valid_id_list)
        processed = len(result)

        # Batch history insert
        for row in result:
            await db.execute("""
                INSERT INTO service_request_history
                (service_request_id, action, previous_status, new_status, performed_by, comment)
                VALUES ($1, 'escalation_resolved', $2, $2, $3, $4)
            """, row['id'], row['status'], performer_id, body.resolution_notes)

    elif body.action == 'assign':
        # Bulk assign to agent
        result = await db.fetch("""
            UPDATE service_requests
            SET assigned_to = $2,
                assigned_at = NOW(),
                updated_at = NOW()
            WHERE id = ANY($1::uuid[])
              AND escalated = true
            RETURNING id, reference, status
        """, valid_id_list, body.agent_id)
        processed = len(result)

        for row in result:
            await db.execute("""
                INSERT INTO service_request_history
                (service_request_id, action, previous_status, new_status, performed_by, comment)
                VALUES ($1, 'escalation_assigned', $2, $2, $3, 'bulk_escalation_assigned')
            """, row['id'], row['status'], performer_id)

    elif body.action == 'approve':
        approved_status = ServiceRequestStatus.DOSSIER_VALIDE.value
        result = await db.fetch("""
            UPDATE service_requests
            SET status = $2,
                escalated = false,
                escalated_at = NULL,
                escalated_by = NULL,
                escalation_reason = NULL,
                escalation_sla_warning_sent = false,
                escalation_sla_escalated = false,
                validated_at = NOW(),
                updated_at = NOW()
            WHERE id = ANY($1::uuid[])
              AND escalated = true
            RETURNING id, reference, status
        """, valid_id_list, approved_status)
        processed = len(result)

        for row in result:
            comment = body.notes or "supervisor_approve"
            await db.execute("""
                INSERT INTO service_request_history
                (service_request_id, action, previous_status, new_status, performed_by, comment)
                VALUES ($1, 'supervisor_approve', $2, $3, $4, $5)
            """, row['id'], row['status'], approved_status, performer_id, comment)

    elif body.action == 'reject':
        rejected_status = ServiceRequestStatus.REJECTED.value
        result = await db.fetch("""
            UPDATE service_requests
            SET status = $2,
                rejection_reason = $3,
                escalated = false,
                escalated_at = NULL,
                escalated_by = NULL,
                escalation_reason = NULL,
                escalation_sla_warning_sent = false,
                escalation_sla_escalated = false,
                validated_at = NOW(),
                updated_at = NOW()
            WHERE id = ANY($1::uuid[])
              AND escalated = true
            RETURNING id, reference, status
        """, valid_id_list, rejected_status, body.rejection_reason)
        processed = len(result)

        for row in result:
            await db.execute("""
                INSERT INTO service_request_history
                (service_request_id, action, previous_status, new_status, performed_by, comment)
                VALUES ($1, 'supervisor_reject', $2, $3, $4, $5)
            """, row['id'], row['status'], rejected_status, performer_id, body.rejection_reason)

    logger.info(f"Bulk escalation {body.action}: {processed} processed, {len(failed)} failed by {current_user.email}")

    return {
        "message": f"Bulk {body.action} completed",
        "processed": processed,
        "failed": failed,
        "total_requested": len(body.request_ids)
    }


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


# ============================================================================
# ENDPOINTS - WORKLOAD REBALANCE
# ============================================================================

class RebalanceDetail(BaseModel):
    from_agent_name: str
    to_agent_name: str
    request_id: str
    workflow_code: str

class RebalanceResult(BaseModel):
    reassignments_made: int
    details: List[RebalanceDetail]
    message: str


@router.post("/workload/rebalance", response_model=RebalanceResult)
async def rebalance_workload(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_db_connection),
    _: None = Depends(permission_required("agent.manage_workload"))
):
    """
    Automatically rebalance workload by moving assignments from
    overloaded agents to underloaded agents.
    """
    if current_user.role == "admin":
        agent_ctx = {"entity_type": None, "ministry_id": None, "entity_id": None, "is_supervisor": True}
    else:
        agent_ctx = await get_agent_context(current_user.id, db)

    if not agent_ctx.get("is_supervisor") and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Supervisor access required")

    try:
        # Get current workload distribution
        query = """
            SELECT
                ap.id as agent_profile_id,
                u.full_name as agent_name,
                COUNT(a.id) FILTER (WHERE a.status IN ('assigned', 'in_progress', 'pending_review')) as active_count,
                ap.max_concurrent_assignments
            FROM agent_profiles ap
            JOIN users u ON ap.user_id = u.id
            LEFT JOIN assignments a ON a.agent_profile_id = ap.id
                AND a.status IN ('assigned', 'in_progress', 'pending_review')
            WHERE ap.is_active = true
                AND ap.availability = 'available'
        """
        params = []
        entity_id = agent_ctx.get("entity_id")
        if entity_id:
            query += " AND ap.entity_id = $1"
            params.append(entity_id)

        query += " GROUP BY ap.id, u.full_name, ap.max_concurrent_assignments ORDER BY active_count DESC"
        agents = await db.fetch(query, *params)

        if len(agents) < 2:
            return RebalanceResult(reassignments_made=0, details=[], message="Not enough agents for rebalancing")

        # Find overloaded and underloaded agents
        avg_load = sum(a['active_count'] for a in agents) / len(agents)
        overloaded = [a for a in agents if a['active_count'] > avg_load + 1]
        underloaded = [a for a in agents if a['active_count'] < avg_load - 0.5]

        if not overloaded or not underloaded:
            return RebalanceResult(reassignments_made=0, details=[], message="Workload is already balanced")

        details = []
        for over_agent in overloaded:
            excess = int(over_agent['active_count'] - avg_load)
            if excess <= 0:
                continue

            # Get reassignable assignments (oldest first, only 'assigned' status)
            reassign_query = """
                SELECT a.id, a.item_id, a.item_type,
                       sr.workflow_code
                FROM assignments a
                LEFT JOIN service_requests sr ON a.item_id = sr.id::text
                WHERE a.agent_profile_id = $1
                    AND a.status = 'assigned'
                ORDER BY a.assigned_at ASC
                LIMIT $2
            """
            to_reassign = await db.fetch(reassign_query, over_agent['agent_profile_id'], excess)

            for assignment in to_reassign:
                if not underloaded:
                    break
                target = underloaded[0]

                # Reassign
                await db.execute(
                    """
                    UPDATE assignments
                    SET agent_profile_id = $1, status = 'assigned',
                        updated_at = NOW()
                    WHERE id = $2
                    """,
                    target['agent_profile_id'], assignment['id']
                )

                details.append(RebalanceDetail(
                    from_agent_name=over_agent['agent_name'],
                    to_agent_name=target['agent_name'],
                    request_id=str(assignment['item_id']),
                    workflow_code=assignment.get('workflow_code') or assignment.get('item_type') or 'unknown'
                ))

                # Update target load tracking
                target_count = target['active_count'] + 1
                if target_count >= avg_load:
                    underloaded.pop(0)

        logger.info(
            f"Workload rebalanced: {len(details)} reassignments by supervisor {current_user.email}"
        )

        return RebalanceResult(
            reassignments_made=len(details),
            details=details,
            message=f"{len(details)} assignments rebalanced successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rebalancing workload: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to rebalance workload"
        )


# ============================================================================
# ENDPOINTS - AGENT TRENDS
# ============================================================================

class AgentTrendPoint(BaseModel):
    period: str  # "2026-02-01" or "2026-W07"
    processed: int = 0
    approved: int = 0
    rejected: int = 0
    avg_processing_hours: float = 0.0
    sla_compliance_pct: float = 0.0

class AgentTrendsResponse(BaseModel):
    agent_id: str
    agent_name: str
    period_days: int
    granularity: str  # "daily" | "weekly" | "monthly"
    data_points: List[AgentTrendPoint]


@router.get("/agents/{agent_profile_id}/trends", response_model=AgentTrendsResponse)
async def get_agent_trends(
    agent_profile_id: UUID,
    period_days: int = Query(30, ge=7, le=365),
    granularity: str = Query("weekly", pattern="^(daily|weekly|monthly)$"),
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_db_connection),
    _: None = Depends(permission_required("agent.view_performance"))
):
    """
    Get agent performance trends over time with configurable granularity.
    """
    if current_user.role == "admin":
        agent_ctx = {"is_supervisor": True}
    else:
        agent_ctx = await get_agent_context(current_user.id, db)

    if not agent_ctx.get("is_supervisor") and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Supervisor access required")

    try:
        # Get agent name
        agent_row = await db.fetchrow(
            """
            SELECT u.full_name
            FROM agent_profiles ap
            JOIN users u ON ap.user_id = u.id
            WHERE ap.id = $1
            """,
            agent_profile_id
        )
        if not agent_row:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Build date truncation based on granularity
        if granularity == "daily":
            trunc = "day"
            fmt = "YYYY-MM-DD"
        elif granularity == "weekly":
            trunc = "week"
            fmt = 'IYYY-"W"IW'
        else:  # monthly
            trunc = "month"
            fmt = "YYYY-MM"

        query = f"""
            SELECT
                TO_CHAR(DATE_TRUNC('{trunc}', a.assigned_at), '{fmt}') as period,
                COUNT(*) as processed,
                COUNT(*) FILTER (WHERE a.status = 'completed') as approved,
                COUNT(*) FILTER (WHERE a.status = 'rejected') as rejected,
                COALESCE(AVG(a.processing_duration_hours) FILTER (WHERE a.status = 'completed'), 0) as avg_processing_hours,
                COALESCE(
                    COUNT(*) FILTER (WHERE a.deadline_met = true)::float /
                    NULLIF(COUNT(*) FILTER (WHERE a.deadline IS NOT NULL AND a.status = 'completed'), 0),
                    0
                ) as sla_compliance_pct
            FROM assignments a
            WHERE a.agent_profile_id = $1
                AND a.assigned_at >= NOW() - MAKE_INTERVAL(days => $2)
            GROUP BY DATE_TRUNC('{trunc}', a.assigned_at)
            ORDER BY DATE_TRUNC('{trunc}', a.assigned_at) ASC
        """
        rows = await db.fetch(query, agent_profile_id, period_days)

        data_points = [
            AgentTrendPoint(
                period=row['period'],
                processed=row['processed'],
                approved=row['approved'],
                rejected=row['rejected'],
                avg_processing_hours=float(row['avg_processing_hours']),
                sla_compliance_pct=float(row['sla_compliance_pct']) * 100
            )
            for row in rows
        ]

        return AgentTrendsResponse(
            agent_id=str(agent_profile_id),
            agent_name=agent_row['full_name'],
            period_days=period_days,
            granularity=granularity,
            data_points=data_points
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching agent trends: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch agent trends"
        )


# ============================================================================
# ENDPOINTS - BULK REASSIGN
# ============================================================================

class AgentAssignmentItem(BaseModel):
    """Minimal assignment info for reassign modal"""
    assignment_id: UUID
    request_id: str
    request_reference: Optional[str] = None
    workflow_code: Optional[str] = None
    status: str
    assigned_at: Optional[datetime] = None


class BulkReassignRequest(BaseModel):
    """Request body for bulk reassignment"""
    assignment_ids: List[UUID] = Field(..., min_length=1, max_length=50)
    target_agent_id: UUID
    reason: Optional[str] = Field(None, max_length=500)


class BulkReassignResult(BaseModel):
    """Result of bulk reassignment"""
    reassigned: int
    failed: int
    details: List[Dict[str, Any]]


@router.get("/agents/{agent_profile_id}/assignments", response_model=List[AgentAssignmentItem])
async def get_agent_assignments(
    agent_profile_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_db_connection),
    _: None = Depends(permission_required("agent.view_workload"))
):
    """
    Get active assignments for a specific agent (for reassign modal).
    """
    if current_user.role == "admin":
        agent_ctx = {"entity_type": None, "entity_id": None, "is_supervisor": True}
    else:
        agent_ctx = await get_agent_context(current_user.id, db)

    if not agent_ctx.get("is_supervisor") and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Supervisor access required")

    rows = await db.fetch("""
        SELECT
            a.id as assignment_id,
            a.item_id::text as request_id,
            sr.reference as request_reference,
            sr.workflow_code,
            a.status,
            a.assigned_at
        FROM assignments a
        LEFT JOIN service_requests sr ON a.item_id = sr.id
        WHERE a.agent_profile_id = $1
          AND a.status IN ('assigned', 'in_progress')
        ORDER BY a.assigned_at DESC
    """, agent_profile_id)

    return [dict(row) for row in rows]


@router.post("/bulk/reassign", response_model=BulkReassignResult)
async def bulk_reassign(
    body: BulkReassignRequest,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_db_connection),
    _: None = Depends(permission_required("agent.view_workload"))
):
    """
    Bulk reassign assignments from one agent to another.
    """
    logger = logging.getLogger(__name__)

    if current_user.role == "admin":
        agent_ctx = {"entity_type": None, "entity_id": None, "is_supervisor": True}
    else:
        agent_ctx = await get_agent_context(current_user.id, db)

    if not agent_ctx.get("is_supervisor") and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Supervisor access required")

    # Verify target agent exists
    target = await db.fetchrow("""
        SELECT ap.id, u.full_name
        FROM agent_profiles ap
        JOIN users u ON ap.user_id = u.id
        WHERE ap.id = $1
    """, body.target_agent_id)

    if not target:
        raise HTTPException(status_code=404, detail="Target agent not found")

    performer_id = UUID(current_user.id)
    reassigned = 0
    failed = 0
    details = []

    for assignment_id in body.assignment_ids:
        try:
            row = await db.fetchrow("""
                UPDATE assignments
                SET agent_profile_id = $2,
                    reassigned_at = NOW(),
                    reassignment_reason = 'supervisor_bulk_reassign',
                    reassignment_notes = $3,
                    reassigned_to_profile_id = $2,
                    assigned_by_profile_id = (
                        SELECT id FROM agent_profiles WHERE user_id = $4 LIMIT 1
                    ),
                    updated_at = NOW()
                WHERE id = $1
                  AND status IN ('assigned', 'in_progress')
                RETURNING id, item_id
            """, assignment_id, body.target_agent_id, body.reason or 'Supervisor bulk reassign', performer_id)

            if row:
                # Update service_request assigned_to
                await db.execute("""
                    UPDATE service_requests
                    SET assigned_to = (SELECT user_id FROM agent_profiles WHERE id = $2),
                        updated_at = NOW()
                    WHERE id = $1
                """, row['item_id'], body.target_agent_id)

                # History entry
                await db.execute("""
                    INSERT INTO service_request_history
                    (service_request_id, action, performed_by, comment)
                    VALUES ($1, 'bulk_reassigned', $2, $3)
                """, row['item_id'], performer_id, f"Bulk reassigned to {target['full_name']}")

                reassigned += 1
                details.append({"assignment_id": str(assignment_id), "status": "reassigned"})
            else:
                failed += 1
                details.append({"assignment_id": str(assignment_id), "status": "not_found_or_completed"})
        except Exception as e:
            logger.error(f"Bulk reassign error for {assignment_id}: {e}")
            failed += 1
            details.append({"assignment_id": str(assignment_id), "status": "error"})

    logger.info(f"Bulk reassign by {current_user.email}: {reassigned} reassigned, {failed} failed")

    return BulkReassignResult(
        reassigned=reassigned,
        failed=failed,
        details=details
    )


# ============================================================================
# ENDPOINTS - EXPORT ASSIGNMENTS
# ============================================================================

@router.get("/export/assignments")
async def export_assignments(
    format: str = Query("csv", pattern="^(csv)$"),
    period_days: int = Query(30, ge=1, le=365),
    agent_id: Optional[UUID] = None,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_db_connection),
    _: None = Depends(permission_required("agent.view_workload"))
):
    """
    Export assignment data as CSV.
    """
    from fastapi.responses import StreamingResponse
    import csv
    import io

    if current_user.role == "admin":
        agent_ctx = {"entity_type": None, "entity_id": None, "is_supervisor": True}
    else:
        agent_ctx = await get_agent_context(current_user.id, db)

    if not agent_ctx.get("is_supervisor") and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Supervisor access required")

    try:
        query = """
            SELECT
                a.assigned_at::date as assignment_date,
                u.full_name as agent_name,
                sr.reference as request_reference,
                sr.workflow_code,
                a.status,
                COALESCE(a.processing_duration_hours, 0) as processing_hours,
                CASE WHEN a.deadline_met = true THEN 'Yes'
                     WHEN a.deadline_met = false THEN 'No'
                     ELSE 'N/A' END as sla_met
            FROM assignments a
            JOIN agent_profiles ap ON a.agent_profile_id = ap.id
            JOIN users u ON ap.user_id = u.id
            LEFT JOIN service_requests sr ON a.item_id = sr.id::text
            WHERE a.assigned_at >= NOW() - MAKE_INTERVAL(days => $1)
        """
        params: list = [period_days]
        idx = 2

        entity_id = agent_ctx.get("entity_id")
        if entity_id:
            query += f" AND ap.entity_id = ${idx}"
            params.append(entity_id)
            idx += 1

        if agent_id:
            query += f" AND a.agent_profile_id = ${idx}"
            params.append(agent_id)
            idx += 1

        query += " ORDER BY a.assigned_at DESC"

        rows = await db.fetch(query, *params)

        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Date", "Agent", "Reference", "Workflow", "Status", "Processing Hours", "SLA Met"])
        for row in rows:
            writer.writerow([
                str(row['assignment_date']),
                row['agent_name'],
                row.get('request_reference') or '',
                row.get('workflow_code') or '',
                row['status'],
                f"{row['processing_hours']:.1f}",
                row['sla_met']
            ])

        output.seek(0)
        filename = f"assignments_export_{datetime.now().strftime('%Y%m%d')}.csv"

        logger.info(f"Assignments exported by supervisor {current_user.email}: {len(rows)} rows")

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting assignments: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export assignments"
        )
