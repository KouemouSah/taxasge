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

# Permission middleware
from app.modules.permissions.middleware import require_permission

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/supervisor", tags=["supervisor"])


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
    """Agent item in list"""
    agent_id: UUID
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
# Legacy check_supervisor_permission function has been removed (replaced by RBAC system)

def get_entity_context(current_user: UserResponse) -> tuple[str, Optional[str]]:
    """Get entity type and ID based on supervisor role"""
    if current_user.role == "supervisor_dgi":
        return ("DGI", current_user.department_id)
    elif current_user.role == "supervisor_ministry":
        return ("Ministry", current_user.ministry_id)
    else:  # admin
        return ("DGI", None)  # Admin sees all by default


# ============================================================================
# ENDPOINTS - DASHBOARD
# ============================================================================

@router.get("/dashboard", response_model=DashboardResponse)
@require_permission("dashboard.view")
async def get_dashboard(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
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
    """

    entity_type, entity_id = get_entity_context(current_user)

    assignment_repo = get_assignment_repository(db)
    workload_repo = get_workload_repository(db)

    try:
        # Get summary stats
        all_assignments = await assignment_repo.get_active_assignments(None)
        pending = [a for a in all_assignments if a.status == AssignmentStatus.assigned]
        in_progress = [a for a in all_assignments if a.status == AssignmentStatus.in_progress]
        overdue = await assignment_repo.get_overdue_assignments()

        # Get agent workloads
        # TODO: Filter by entity (need to join with users table)
        # For now, get all available agents
        role = "dgi_agent" if entity_type == "DGI" else "ministry_agent"
        available_agents = await workload_repo.get_available_agents(
            role=role,
            department_id=entity_id if entity_type == "DGI" else None,
            ministry_id=entity_id if entity_type == "Ministry" else None,
            max_capacity_percentage=100.0,
            limit=100
        )

        # Get recent assignments (last 20)
        recent_assignments = all_assignments[:20]

        # Generate performance alerts
        performance_alerts = []
        for agent_data in available_agents:
            workload = await workload_repo.get_by_agent_id(agent_data["agent_id"])
            if workload:
                # Alert if overloaded
                if workload.workload_status == "overloaded":
                    performance_alerts.append({
                        "type": "overloaded",
                        "agent_id": str(workload.agent_id),
                        "message": f"Agent at {workload.capacity_percentage:.0f}% capacity",
                        "severity": "high"
                    })

                # Alert if low success rate
                if workload.success_rate < 0.70:
                    performance_alerts.append({
                        "type": "low_success_rate",
                        "agent_id": str(workload.agent_id),
                        "message": f"Success rate: {workload.success_rate*100:.0f}%",
                        "severity": "medium"
                    })

                # Alert if deadline compliance issues
                if workload.deadline_compliance_rate < 0.80:
                    performance_alerts.append({
                        "type": "deadline_issues",
                        "agent_id": str(workload.agent_id),
                        "message": f"Deadline compliance: {workload.deadline_compliance_rate*100:.0f}%",
                        "severity": "medium"
                    })

        # Build summary
        summary = {
            "total_agents": len(available_agents),
            "total_assignments": len(all_assignments),
            "pending_count": len(pending),
            "in_progress_count": len(in_progress),
            "overdue_count": len(overdue),
            "avg_capacity": sum(a.get("capacity_percentage", 0) for a in available_agents) / max(len(available_agents), 1),
            "alerts_count": len(performance_alerts),
            "entity_type": entity_type,
            "entity_id": entity_id
        }

        # Build agent workload list
        agent_workloads = []
        for agent_data in available_agents:
            workload = await workload_repo.get_by_agent_id(agent_data["agent_id"])
            if workload:
                agent_workloads.append(workload)

        response = DashboardResponse(
            summary=summary,
            pending_assignments=pending[:10],
            overdue_assignments=overdue,
            agent_workloads=agent_workloads,
            recent_assignments=recent_assignments,
            performance_alerts=performance_alerts
        )

        logger.info(
            f"Dashboard loaded for supervisor {current_user.email} - "
            f"Entity: {entity_type}/{entity_id}"
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
@require_permission("agents.view")
async def list_agents(
    include_unavailable: bool = Query(False, description="Include unavailable agents"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **List all agents under supervision**

    Permissions:
    - supervisor_dgi, supervisor_ministry, admin

    Returns:
    - List of agents with workload metrics
    - Sorted by capacity (most loaded first)
    - Includes specializations and performance metrics

    Query Parameters:
    - include_unavailable: Include unavailable agents (default: false)
    """
    entity_type, entity_id = get_entity_context(current_user)
    workload_repo = get_workload_repository(db)

    try:
        role = "dgi_agent" if entity_type == "DGI" else "ministry_agent"

        # Get agents
        max_capacity = 100.0 if include_unavailable else 100.0
        agents_data = await workload_repo.get_available_agents(
            role=role,
            department_id=entity_id if entity_type == "DGI" else None,
            ministry_id=entity_id if entity_type == "Ministry" else None,
            max_capacity_percentage=max_capacity,
            limit=100
        )

        # Build response
        agents_list = []
        for agent_data in agents_data:
            # TODO: Get agent name and email from users table
            # For now, use placeholder
            agents_list.append(AgentListItem(
                agent_id=agent_data["agent_id"],
                agent_name=agent_data.get("full_name", "Unknown"),
                agent_email=agent_data.get("email", "unknown@example.com"),
                current_assignments=agent_data.get("current_assignments", 0),
                capacity_percentage=agent_data.get("capacity_percentage", 0.0),
                workload_status=agent_data.get("workload_status", "available"),
                availability=agent_data.get("availability", "available"),
                specializations=agent_data.get("specializations"),
                avg_processing_time_hours=agent_data.get("avg_processing_time_hours"),
                success_rate=agent_data.get("success_rate", 0.0)
            ))

        logger.info(f"Agents list loaded for supervisor {current_user.email}")

        return agents_list

    except Exception as e:
        logger.error(f"Error listing agents: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list agents"
        )


@router.get("/agents/{agent_id}/stats", response_model=AgentAssignmentStats)
@require_permission("agents.view_performance")
async def get_agent_stats(
    agent_id: UUID,
    period_days: int = Query(30, ge=1, le=365, description="Statistics period in days"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **Get detailed statistics for an agent**

    Permissions:
    - supervisor_dgi, supervisor_ministry, admin

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
    """
    assignment_repo = get_assignment_repository(db)

    try:
        stats = await assignment_repo.get_agent_stats(agent_id, period_days)

        logger.info(
            f"Agent stats loaded for {agent_id} by supervisor {current_user.email}"
        )

        return stats

    except Exception as e:
        logger.error(f"Error getting agent stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get agent statistics"
        )


@router.get("/agents/{agent_id}/forecast", response_model=AgentCapacityForecast)
@require_permission("agents.view_workload")
async def get_agent_forecast(
    agent_id: UUID,
    horizon_days: int = Query(7, ge=1, le=30, description="Forecast horizon in days"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **Get capacity forecast for an agent**

    Permissions:
    - supervisor_dgi, supervisor_ministry, admin

    Returns:
    - Current capacity
    - Forecasted capacity (based on historical trends)
    - Estimated completions next period
    - Estimated new assignments
    - Can accept new assignments?
    - Max recommended new assignments

    Query Parameters:
    - horizon_days: Forecast horizon (default: 7, max: 30)
    """
    workload_repo = get_workload_repository(db)

    try:
        forecast = await workload_repo.get_capacity_forecast(agent_id, horizon_days)

        logger.info(
            f"Capacity forecast generated for agent {agent_id} "
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
@require_permission("agents.view_workload")
async def get_workload_balance(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **Get workload balance report for team**

    Permissions:
    - supervisor_dgi, supervisor_ministry, admin

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
    """
    entity_type, entity_id = get_entity_context(current_user)
    workload_repo = get_workload_repository(db)

    try:
        # Get balance report
        report = await workload_repo.get_workload_balance_report(
            entity_type,
            entity_id
        )

        # Get agent list
        role = "dgi_agent" if entity_type == "DGI" else "ministry_agent"
        agents_data = await workload_repo.get_available_agents(
            role=role,
            department_id=entity_id if entity_type == "DGI" else None,
            ministry_id=entity_id if entity_type == "Ministry" else None,
            max_capacity_percentage=100.0,
            limit=100
        )

        agents_list = []
        for agent_data in agents_data:
            agents_list.append(AgentListItem(
                agent_id=agent_data["agent_id"],
                agent_name=agent_data.get("full_name", "Unknown"),
                agent_email=agent_data.get("email", "unknown@example.com"),
                current_assignments=agent_data.get("current_assignments", 0),
                capacity_percentage=agent_data.get("capacity_percentage", 0.0),
                workload_status=agent_data.get("workload_status", "available"),
                availability=agent_data.get("availability", "available"),
                specializations=agent_data.get("specializations"),
                avg_processing_time_hours=agent_data.get("avg_processing_time_hours"),
                success_rate=agent_data.get("success_rate", 0.0)
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
            f"Workload balance report generated for {entity_type}/{entity_id} "
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
@require_permission("rules.create")
async def create_rule(
    rule_data: AssignmentRuleCreate,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **Create a new assignment rule (Supervisor only)**

    Permissions:
    - supervisor_dgi, supervisor_ministry, admin

    Request Body:
    - name: Rule name (required)
    - description: Rule description
    - priority: Priority 1-100 (lower = higher priority)
    - entity_type: DGI or Ministry
    - entity_id: Department ID or Ministry ID (optional for global rules)
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

        # Validate entity context
        entity_type, entity_id = get_entity_context(current_user)
        if rule_data.entity_type != entity_type and current_user.role != "admin":
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
@require_permission("rules.view")
async def list_rules(
    status_filter: Optional[RuleStatus] = Query(None, description="Filter by status"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **List assignment rules**

    Permissions:
    - supervisor_dgi, supervisor_ministry, admin

    Returns:
    - All rules for supervisor's entity
    - Sorted by priority (ASC)

    Query Parameters:
    - status: Filter by status (active, inactive, draft, archived)
    """
    entity_type, entity_id = get_entity_context(current_user)
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
@require_permission("rules.view")
async def get_rule(
    rule_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
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
@require_permission("rules.edit")
async def update_rule(
    rule_id: UUID,
    update_data: AssignmentRuleUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
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
@require_permission("rules.activate")
async def activate_rule(
    rule_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
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
@require_permission("rules.activate")
async def deactivate_rule(
    rule_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
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
@require_permission("rules.delete")
async def archive_rule(
    rule_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
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


@router.get("/rules/effectiveness/report", response_model=List[RuleEffectivenessItem])
@require_permission("rules.view_effectiveness")
async def get_rules_effectiveness(
    min_applications: int = Query(10, ge=1, description="Minimum applications to include"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
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
    """
    entity_type, _ = get_entity_context(current_user)
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
