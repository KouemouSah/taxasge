"""
Statistics Routes - Analytics and Reporting for Assignment Module
Provides statistical insights and performance metrics

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
from app.models.user import UserResponse
from app.modules.assignment.models.assignment_history import (
    Assignment,
    SupervisorAssignmentStats,
    AgentAssignmentStats
)
from app.modules.assignment.models.agent_workload import (
    AgentPerformanceMetrics,
    WorkloadBalanceReport
)
from app.modules.assignment.repositories.assignment_repository import (
    AssignmentRepository,
    get_assignment_repository
)
from app.modules.assignment.repositories.workload_repository import (
    WorkloadRepository,
    get_workload_repository
)
from app.core.database import get_db_connection

# Permission middleware
from app.modules.permissions.middleware import require_permission

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/statistics", tags=["statistics"])


# ============================================================================
# REQUEST/RESPONSE SCHEMAS
# ============================================================================

class TeamPerformanceResponse(BaseModel):
    """Team performance metrics"""
    entity_type: str
    entity_id: Optional[str]
    period_days: int
    total_assignments: int
    completed_assignments: int
    pending_assignments: int
    in_progress_assignments: int
    avg_completion_time_hours: float
    avg_quality_score: float
    success_rate: float
    deadline_compliance_rate: float
    auto_assignment_rate: float
    top_performers: List[Dict[str, Any]]
    performance_trends: Dict[str, Any]


class ComparisonMetrics(BaseModel):
    """Comparison between periods or entities"""
    metric_name: str
    current_value: float
    previous_value: float
    change_percentage: float
    trend: str  # "up", "down", "stable"


class PerformanceTrendsResponse(BaseModel):
    """Performance trends over time"""
    period_start: datetime
    period_end: datetime
    granularity: str  # "daily", "weekly", "monthly"
    data_points: List[Dict[str, Any]]


class ExportRequest(BaseModel):
    """Request to export statistics"""
    format: str = Field(..., pattern="^(pdf|excel|json)$")
    period_days: int = Field(30, ge=1, le=365)
    include_charts: bool = True
    include_raw_data: bool = False


# ============================================================================
# AUTHORIZATION HELPERS
# ============================================================================
# Note: Authorization is now handled via @require_permission decorators
# Legacy check_*_permission functions have been removed (replaced by RBAC system)

def get_entity_context(current_user: UserResponse) -> tuple[str, Optional[str]]:
    """Get entity type and ID based on supervisor role"""
    if current_user.role == "supervisor_dgi":
        return ("DGI", current_user.department_id)
    elif current_user.role == "supervisor_ministry":
        return ("Ministry", current_user.ministry_id)
    else:  # admin
        return ("DGI", None)  # Admin sees all by default


# ============================================================================
# ENDPOINTS - AGENT STATISTICS
# ============================================================================

@router.get("/agent/{agent_id}", response_model=AgentAssignmentStats)
@require_permission("agents.view_performance")
async def get_agent_statistics(
    agent_id: UUID,
    period_days: int = Query(30, ge=1, le=365, description="Statistics period in days"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **Get comprehensive statistics for an agent**

    Permissions:
    - Requires: agents.view_performance

    Returns:
    - Total assignments (period)
    - Completed assignments
    - Avg processing time (hours)
    - Avg quality score (0-10)
    - Success rate (0-1)
    - Deadline compliance rate (0-1)
    - Breakdown by status
    - Breakdown by declaration type

    Query Parameters:
    - period_days: Statistics period (default: 30, max: 365)
    """

    # Authorization check
    is_own_stats = str(agent_id) == current_user.id
    is_supervisor = current_user.role in ["supervisor_dgi", "supervisor_ministry", "admin"]

    if not (is_own_stats or is_supervisor):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own statistics"
        )

    assignment_repo = get_assignment_repository(db)

    try:
        stats = await assignment_repo.get_agent_stats(agent_id, period_days)

        logger.info(
            f"Agent statistics loaded for {agent_id} (period: {period_days} days) "
            f"by {current_user.email}"
        )

        return stats

    except Exception as e:
        logger.error(f"Error getting agent statistics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get agent statistics"
        )


@router.get("/agent/{agent_id}/performance", response_model=AgentPerformanceMetrics)
@require_permission("agents.view_performance")
async def get_agent_performance(
    agent_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **Get real-time performance metrics for an agent**

    Permissions:
    - Requires: agents.view_performance

    Returns:
    - Current workload metrics
    - Avg processing time
    - Avg daily completions
    - 7-day completion rate
    - Quality score average
    - Success rate
    - Deadline compliance rate

    Note: This data comes from agent_workloads table (real-time)
    """

    # Authorization check
    is_own_metrics = str(agent_id) == current_user.id
    is_supervisor = current_user.role in ["supervisor_dgi", "supervisor_ministry", "admin"]

    if not (is_own_metrics or is_supervisor):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own performance metrics"
        )

    workload_repo = get_workload_repository(db)

    try:
        workload = await workload_repo.get_by_agent_id(agent_id)

        if not workload:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No workload data found for agent {agent_id}"
            )

        # Convert to AgentPerformanceMetrics
        metrics = AgentPerformanceMetrics(
            agent_id=workload.agent_id,
            avg_processing_time_hours=workload.avg_processing_time_hours,
            avg_daily_completions=workload.avg_daily_completions,
            completion_rate_7d=workload.completion_rate_7d,
            quality_score_avg=workload.quality_score_avg,
            success_rate=workload.success_rate,
            deadline_compliance_rate=workload.deadline_compliance_rate,
            last_updated_at=workload.last_updated_at
        )

        logger.info(
            f"Agent performance metrics loaded for {agent_id} by {current_user.email}"
        )

        return metrics

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent performance: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get agent performance metrics"
        )


@router.get("/agent/{agent_id}/trends", response_model=PerformanceTrendsResponse)
@require_permission("agents.view_performance")
async def get_agent_trends(
    agent_id: UUID,
    period_days: int = Query(30, ge=7, le=180, description="Trend period in days"),
    granularity: str = Query("daily", pattern="^(daily|weekly)$"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **Get performance trends for an agent over time**

    Permissions:
    - Requires: agents.view_performance

    Returns:
    - Time-series data of performance metrics
    - Granularity: daily or weekly
    - Includes: completions, quality, processing time

    Query Parameters:
    - period_days: Trend period (default: 30, min: 7, max: 180)
    - granularity: "daily" or "weekly" (default: daily)
    """

    # Authorization check
    is_own_trends = str(agent_id) == current_user.id
    is_supervisor = current_user.role in ["supervisor_dgi", "supervisor_ministry", "admin"]

    if not (is_own_trends or is_supervisor):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own trends"
        )

    # TODO: Implement time-series query
    # For now, return placeholder
    period_start = datetime.utcnow() - timedelta(days=period_days)
    period_end = datetime.utcnow()

    response = PerformanceTrendsResponse(
        period_start=period_start,
        period_end=period_end,
        granularity=granularity,
        data_points=[]  # TODO: Implement
    )

    logger.info(
        f"Agent trends loaded for {agent_id} (period: {period_days} days, granularity: {granularity}) "
        f"by {current_user.email}"
    )

    return response


# ============================================================================
# ENDPOINTS - TEAM STATISTICS
# ============================================================================

@router.get("/team/performance", response_model=TeamPerformanceResponse)
@require_permission("dashboard.team_stats")
async def get_team_performance(
    period_days: int = Query(30, ge=1, le=365, description="Statistics period in days"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **Get team performance metrics**

    Permissions:
    - Requires: dashboard.team_stats

    Returns:
    - Aggregate statistics for all agents in team
    - Top performers (top 5)
    - Performance trends
    - Auto-assignment rate

    Query Parameters:
    - period_days: Statistics period (default: 30, max: 365)
    """

    entity_type, entity_id = get_entity_context(current_user)
    assignment_repo = get_assignment_repository(db)
    workload_repo = get_workload_repository(db)

    try:
        # TODO: Implement team aggregation query
        # For now, aggregate from individual agent stats

        # Get all agents in team
        role = "dgi_agent" if entity_type == "DGI" else "ministry_agent"
        agents_data = await workload_repo.get_available_agents(
            role=role,
            department_id=entity_id if entity_type == "DGI" else None,
            ministry_id=entity_id if entity_type == "Ministry" else None,
            max_capacity_percentage=100.0,
            limit=100
        )

        # Aggregate stats
        total_assignments = 0
        completed_assignments = 0
        pending_assignments = 0
        in_progress_assignments = 0
        total_quality = 0.0
        total_processing_time = 0.0
        total_success = 0.0
        total_deadline_compliance = 0.0
        auto_assignments = 0
        manual_assignments = 0

        agent_performances = []

        for agent_data in agents_data:
            agent_id = agent_data["agent_id"]
            stats = await assignment_repo.get_agent_stats(agent_id, period_days)

            total_assignments += stats.total_assignments
            completed_assignments += stats.completed_assignments
            pending_assignments += stats.by_status.get("assigned", 0)
            in_progress_assignments += stats.by_status.get("in_progress", 0)

            if stats.completed_assignments > 0:
                total_quality += stats.avg_quality_score * stats.completed_assignments
                total_processing_time += stats.avg_processing_time_hours * stats.completed_assignments
                total_success += stats.success_rate * stats.completed_assignments
                total_deadline_compliance += stats.deadline_compliance_rate * stats.completed_assignments

            # Track auto vs manual
            # TODO: Get from assignment method field

            agent_performances.append({
                "agent_id": str(agent_id),
                "agent_name": agent_data.get("full_name", "Unknown"),
                "total_assignments": stats.total_assignments,
                "completed_assignments": stats.completed_assignments,
                "avg_quality_score": stats.avg_quality_score,
                "success_rate": stats.success_rate,
                "performance_score": (
                    stats.success_rate * 0.5 +
                    (stats.avg_quality_score / 10.0) * 0.3 +
                    stats.deadline_compliance_rate * 0.2
                )
            })

        # Calculate averages
        avg_quality = total_quality / max(completed_assignments, 1)
        avg_processing_time = total_processing_time / max(completed_assignments, 1)
        success_rate = total_success / max(completed_assignments, 1)
        deadline_compliance = total_deadline_compliance / max(completed_assignments, 1)

        # Sort top performers
        top_performers = sorted(
            agent_performances,
            key=lambda x: x["performance_score"],
            reverse=True
        )[:5]

        response = TeamPerformanceResponse(
            entity_type=entity_type,
            entity_id=entity_id,
            period_days=period_days,
            total_assignments=total_assignments,
            completed_assignments=completed_assignments,
            pending_assignments=pending_assignments,
            in_progress_assignments=in_progress_assignments,
            avg_completion_time_hours=avg_processing_time,
            avg_quality_score=avg_quality,
            success_rate=success_rate,
            deadline_compliance_rate=deadline_compliance,
            auto_assignment_rate=0.0,  # TODO: Calculate
            top_performers=top_performers,
            performance_trends={}  # TODO: Implement
        )

        logger.info(
            f"Team performance loaded for {entity_type}/{entity_id} (period: {period_days} days) "
            f"by supervisor {current_user.email}"
        )

        return response

    except Exception as e:
        logger.error(f"Error getting team performance: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get team performance"
        )


@router.get("/team/workload", response_model=WorkloadBalanceReport)
@require_permission("agents.view_workload")
async def get_team_workload(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **Get team workload balance report**

    Permissions:
    - Requires: agents.view_workload

    Returns:
    - Total agents
    - Available/busy/overloaded/unavailable counts
    - Total assignments
    - Avg assignments per agent
    - Min/max assignments
    - Workload std deviation
    - Balance score (0-100)
    - Rebalancing needed flag

    Balance Score:
    - 100 = Perfect balance (all agents have same workload)
    - 70-99 = Good balance
    - 50-69 = Moderate imbalance
    - <50 = High imbalance (rebalancing recommended)
    """

    entity_type, entity_id = get_entity_context(current_user)
    workload_repo = get_workload_repository(db)

    try:
        report = await workload_repo.get_workload_balance_report(
            entity_type,
            entity_id
        )

        logger.info(
            f"Team workload balance loaded for {entity_type}/{entity_id} "
            f"by supervisor {current_user.email}"
        )

        return report

    except Exception as e:
        logger.error(f"Error getting team workload: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get team workload balance"
        )


# ============================================================================
# ENDPOINTS - SUPERVISOR STATISTICS
# ============================================================================

@router.get("/supervisor/{supervisor_id}", response_model=SupervisorAssignmentStats)
@require_permission("dashboard.view")
async def get_supervisor_statistics(
    supervisor_id: UUID,
    period_days: int = Query(30, ge=1, le=365, description="Statistics period in days"),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **Get statistics for a supervisor**

    Permissions:
    - Requires: dashboard.view

    Returns:
    - Total assignments created (manual)
    - Total auto-assignments triggered
    - Total reassignments
    - Avg agent workload managed
    - Team performance score
    - Active rules count

    Query Parameters:
    - period_days: Statistics period (default: 30, max: 365)
    """

    # Authorization check
    is_own_stats = str(supervisor_id) == current_user.id
    is_admin = current_user.role == "admin"

    if not (is_own_stats or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own statistics"
        )

    assignment_repo = get_assignment_repository(db)

    try:
        stats = await assignment_repo.get_supervisor_stats(supervisor_id, period_days)

        logger.info(
            f"Supervisor statistics loaded for {supervisor_id} (period: {period_days} days) "
            f"by {current_user.email}"
        )

        return stats

    except Exception as e:
        logger.error(f"Error getting supervisor statistics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get supervisor statistics"
        )


# ============================================================================
# ENDPOINTS - COMPARISON & TRENDS
# ============================================================================

@router.get("/comparison", response_model=List[ComparisonMetrics])
@require_permission("reports.view")
async def get_comparison_metrics(
    metric_type: str = Query(..., pattern="^(performance|workload|quality|speed)$"),
    current_period_days: int = Query(30, ge=7, le=90),
    previous_period_days: int = Query(30, ge=7, le=90),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **Compare metrics between two periods**

    Permissions:
    - Requires: reports.view

    Returns:
    - List of metric comparisons
    - Current vs previous period
    - Change percentage
    - Trend direction (up/down/stable)

    Query Parameters:
    - metric_type: Type of metrics to compare
      - performance: Success rate, quality
      - workload: Assignments, capacity
      - quality: Quality scores, validation rates
      - speed: Processing times, completion rates
    - current_period_days: Current period length (default: 30)
    - previous_period_days: Previous period length (default: 30)
    """

    # TODO: Implement comparison logic
    # For now, return placeholder

    comparisons = []

    logger.info(
        f"Comparison metrics loaded (type: {metric_type}) by supervisor {current_user.email}"
    )

    return comparisons


# ============================================================================
# ENDPOINTS - EXPORT
# ============================================================================

@router.post("/export")
@require_permission("reports.generate")
async def export_statistics(
    request: ExportRequest,
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **Export statistics in various formats**

    Permissions:
    - Requires: reports.generate

    Request Body:
    - format: "pdf", "excel", or "json"
    - period_days: Statistics period (1-365)
    - include_charts: Include visualizations (PDF/Excel only)
    - include_raw_data: Include raw data (all formats)

    Returns:
    - File download URL or file content

    Note: This is a placeholder - actual implementation requires
    PDF/Excel generation libraries
    """

    # TODO: Implement export logic
    # - PDF: Use reportlab or weasyprint
    # - Excel: Use openpyxl or xlsxwriter
    # - JSON: Direct serialization

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Export functionality not yet implemented"
    )


# ============================================================================
# ENDPOINTS - REAL-TIME DASHBOARD DATA
# ============================================================================

@router.get("/realtime/summary")
@require_permission("dashboard.view")
async def get_realtime_summary(
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db_connection)
):
    """
    **Get real-time summary for dashboard**

    Permissions:
    - Requires: dashboard.view

    Returns:
    - Current active assignments
    - Current pending assignments
    - Agents available vs busy
    - Overdue count
    - Alerts count

    Note: Optimized for frequent polling (every 30-60 seconds)
    Uses materialized views for performance
    """

    entity_type, entity_id = get_entity_context(current_user)
    assignment_repo = get_assignment_repository(db)
    workload_repo = get_workload_repository(db)

    try:
        # Get active assignments
        active_assignments = await assignment_repo.get_active_assignments(None)
        pending = [a for a in active_assignments if a.status == "assigned"]
        in_progress = [a for a in active_assignments if a.status == "in_progress"]
        overdue = await assignment_repo.get_overdue_assignments()

        # Get agent availability
        role = "dgi_agent" if entity_type == "DGI" else "ministry_agent"
        agents_data = await workload_repo.get_available_agents(
            role=role,
            department_id=entity_id if entity_type == "DGI" else None,
            ministry_id=entity_id if entity_type == "Ministry" else None,
            max_capacity_percentage=100.0,
            limit=100
        )

        available_count = sum(1 for a in agents_data if a.get("workload_status") == "available")
        busy_count = sum(1 for a in agents_data if a.get("workload_status") in ["normal", "busy"])
        overloaded_count = sum(1 for a in agents_data if a.get("workload_status") == "overloaded")

        summary = {
            "timestamp": datetime.utcnow().isoformat(),
            "active_assignments": len(active_assignments),
            "pending_assignments": len(pending),
            "in_progress_assignments": len(in_progress),
            "overdue_assignments": len(overdue),
            "total_agents": len(agents_data),
            "available_agents": available_count,
            "busy_agents": busy_count,
            "overloaded_agents": overloaded_count,
            "alerts": overloaded_count + len(overdue)
        }

        logger.debug(f"Real-time summary loaded for {entity_type}/{entity_id}")

        return summary

    except Exception as e:
        logger.error(f"Error getting real-time summary: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get real-time summary"
        )
