"""
Workload Repository - Data access for agent workload tracking

Based on DATABASE_SCHEMA_REFERENCE.md (2026-01-18):
- Migration 053: `assignments` table (unified) with `agent_profile_id`
- Migration 054: `agent_workloads` uses `agent_profile_id` (agent_id deprecated)
- Table `declaration_assignments` no longer exists
"""

from typing import Optional, List
from uuid import UUID
from datetime import date
from loguru import logger

from app.modules.assignment.models.agent_workload import (
    AgentWorkload,
    AgentWorkloadStats,
    AgentPerformanceMetrics,
    AgentCapacityForecast,
)


class WorkloadRepository:
    """Repository for agent workload data operations"""

    def __init__(self):
        logger.info("WorkloadRepository initialized")

    async def get_agent_workload(self, db, agent_profile_id: UUID) -> Optional[AgentWorkload]:
        """Get current workload for an agent profile

        Args:
            db: Database connection
            agent_profile_id: UUID of the agent_profile (not user_id)
        """
        query = """
            SELECT
                ap.id as agent_profile_id,
                ap.user_id,
                COALESCE(u.full_name, u.first_name || ' ' || u.last_name) as agent_name,
                u.email as agent_email,
                COUNT(a.id) FILTER (WHERE a.status IN ('assigned', 'in_progress')) as current_assignments,
                COALESCE(aw.max_concurrent_assignments, 20) as max_concurrent_assignments,
                COUNT(a.id) FILTER (WHERE a.status = 'assigned') as pending_declarations,
                COUNT(a.id) FILTER (WHERE a.status = 'in_progress') as in_progress_declarations,
                COUNT(a.id) FILTER (WHERE a.status = 'completed' AND a.completed_at::date = CURRENT_DATE) as completed_today,
                MAX(a.assigned_at) as last_assignment_at,
                COALESCE(aw.workload_status::text, 'available') as workload_status,
                COALESCE(aw.availability::text, 'available') as availability,
                COALESCE(aw.success_rate, 0) as success_rate,
                aw.avg_processing_time_hours,
                ap.specializations
            FROM agent_profiles ap
            INNER JOIN users u ON u.id = ap.user_id
            LEFT JOIN agent_workloads aw ON aw.agent_profile_id = ap.id
            LEFT JOIN assignments a ON a.agent_profile_id = ap.id
            WHERE ap.id = $1
            GROUP BY ap.id, ap.user_id, u.id, u.full_name, u.first_name, u.last_name, u.email,
                     aw.max_concurrent_assignments, aw.workload_status, aw.availability,
                     aw.success_rate, aw.avg_processing_time_hours, ap.specializations
        """
        row = await db.fetchrow(query, agent_profile_id)
        if not row:
            return None

        data = dict(row)
        current = data.get('current_assignments', 0) or 0
        max_assign = data.get('max_concurrent_assignments', 20) or 20
        data['capacity_percentage'] = (current / max_assign) * 100 if max_assign > 0 else 0
        data['is_available'] = current < max_assign

        return AgentWorkload(**data)

    async def get_available_agents(self, db, max_workload_pct: float = 80) -> List[AgentWorkload]:
        """Get available agents for assignment

        Migration 048: Uses unified 'agent' role with agent_profiles table
        Migration 053/054: Uses assignments table with agent_profile_id
        """
        query = """
            SELECT
                ap.id as agent_profile_id,
                ap.user_id,
                COALESCE(u.full_name, u.first_name || ' ' || u.last_name) as agent_name,
                u.email as agent_email,
                COUNT(a.id) FILTER (WHERE a.status IN ('assigned', 'in_progress')) as current_assignments,
                COALESCE(aw.max_concurrent_assignments, 20) as max_concurrent_assignments,
                COUNT(a.id) FILTER (WHERE a.status = 'assigned') as pending_declarations,
                COUNT(a.id) FILTER (WHERE a.status = 'in_progress') as in_progress_declarations,
                COUNT(a.id) FILTER (WHERE a.status = 'completed' AND a.completed_at::date = CURRENT_DATE) as completed_today,
                MAX(a.assigned_at) as last_assignment_at,
                COALESCE(aw.workload_status::text, 'available') as workload_status,
                COALESCE(aw.availability::text, 'available') as availability,
                COALESCE(aw.success_rate, 0) as success_rate,
                aw.avg_processing_time_hours,
                ap.specializations
            FROM agent_profiles ap
            INNER JOIN users u ON u.id = ap.user_id
            LEFT JOIN agent_workloads aw ON aw.agent_profile_id = ap.id
            LEFT JOIN assignments a ON a.agent_profile_id = ap.id
            WHERE ap.is_active = true
            AND u.role = 'agent'
            AND u.status = 'active'
            AND COALESCE(aw.availability::text, 'available') = 'available'
            GROUP BY ap.id, ap.user_id, u.id, u.full_name, u.first_name, u.last_name, u.email,
                     aw.max_concurrent_assignments, aw.workload_status, aw.availability,
                     aw.success_rate, aw.avg_processing_time_hours, ap.specializations
            HAVING (COUNT(a.id) FILTER (WHERE a.status IN ('assigned', 'in_progress'))::float /
                    COALESCE(aw.max_concurrent_assignments, 20)) * 100 < $1
            ORDER BY COUNT(a.id) FILTER (WHERE a.status IN ('assigned', 'in_progress')) ASC
        """
        rows = await db.fetch(query, max_workload_pct)
        agents = []
        for row in rows:
            data = dict(row)
            current = data.get('current_assignments', 0) or 0
            max_assign = data.get('max_concurrent_assignments', 20) or 20
            data['capacity_percentage'] = (current / max_assign) * 100 if max_assign > 0 else 0
            data['is_available'] = True
            agents.append(AgentWorkload(**data))
        return agents

    async def get_workload_stats(
        self,
        db,
        agent_profile_id: UUID,
        start_date: date,
        end_date: date
    ) -> AgentWorkloadStats:
        """Get workload statistics for a period

        Args:
            db: Database connection
            agent_profile_id: UUID of the agent_profile (not user_id)
            start_date: Period start date
            end_date: Period end date
        """
        query = """
            SELECT
                COUNT(id) FILTER (WHERE status = 'completed') as total_completed,
                COUNT(id) as total_assigned,
                AVG(EXTRACT(EPOCH FROM (completed_at - assigned_at)) / 3600)
                    FILTER (WHERE status = 'completed') as avg_time
            FROM assignments
            WHERE agent_profile_id = $1
            AND assigned_at::date BETWEEN $2 AND $3
        """
        row = await db.fetchrow(query, agent_profile_id, start_date, end_date)
        data = dict(row) if row else {}

        return AgentWorkloadStats(
            period_start=start_date,
            period_end=end_date,
            total_assigned=data.get('total_assigned', 0) or 0,
            total_completed=data.get('total_completed', 0) or 0,
            average_processing_time_hours=data.get('avg_time', 0) or 0,
            completion_rate=(
                (data.get('total_completed', 0) or 0) /
                (data.get('total_assigned', 1) or 1)
            ) * 100
        )


    async def get_capacity_forecast(
        self,
        db,
        agent_profile_id: UUID,
        horizon_days: int = 7
    ) -> AgentCapacityForecast:
        """Get capacity forecast for an agent

        Args:
            db: Database connection
            agent_profile_id: UUID of the agent_profile
            horizon_days: Number of days to forecast

        Returns:
            AgentCapacityForecast with predictions
        """
        # Get current workload
        workload = await self.get_agent_workload(db, agent_profile_id)
        if not workload:
            raise ValueError(f"Agent profile {agent_profile_id} not found")

        # Calculate historical averages
        query = """
            SELECT
                COUNT(*) FILTER (WHERE status = 'completed')::float / NULLIF($2, 0) as avg_completions_per_day,
                COUNT(*) FILTER (WHERE status = 'assigned')::float / NULLIF($2, 0) as avg_new_per_day
            FROM assignments
            WHERE agent_profile_id = $1
            AND assigned_at >= NOW() - ($2 || ' days')::interval
        """
        row = await db.fetchrow(query, agent_profile_id, horizon_days)

        avg_completions = float(row['avg_completions_per_day'] or 0) if row else 0
        avg_new = float(row['avg_new_per_day'] or 0) if row else 0

        # Calculate forecast
        forecasted_completions = int(avg_completions * horizon_days)
        forecasted_new = int(avg_new * horizon_days)
        current_assignments = workload.current_assignments
        max_assignments = workload.max_concurrent_assignments

        forecasted_assignments = max(0, current_assignments - forecasted_completions + forecasted_new)
        forecasted_capacity_pct = (forecasted_assignments / max_assignments) * 100 if max_assignments > 0 else 0

        # Calculate recommendations
        available_capacity = max_assignments - forecasted_assignments
        can_accept = forecasted_capacity_pct < 80
        max_recommended = max(0, int(available_capacity * 0.8))  # 80% of available

        # Confidence based on data availability
        confidence = min(1.0, horizon_days / 30.0)  # Higher confidence with more history

        return AgentCapacityForecast(
            agent_profile_id=agent_profile_id,
            agent_name=workload.agent_name,
            horizon_days=horizon_days,
            current_assignments=current_assignments,
            current_capacity_pct=workload.capacity_percentage,
            max_concurrent_assignments=max_assignments,
            forecasted_completions=forecasted_completions,
            forecasted_new_assignments=forecasted_new,
            forecasted_capacity_pct=forecasted_capacity_pct,
            can_accept_new=can_accept,
            max_recommended_new=max_recommended,
            forecast_confidence=confidence
        )


async def get_workload_repository() -> WorkloadRepository:
    """Dependency injection for WorkloadRepository"""
    return WorkloadRepository()
