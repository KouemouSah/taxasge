"""
Workload Repository - Data access for agent workload tracking

Based on DATABASE_SCHEMA_REFERENCE.md:
- Agent workload calculations from declaration_assignments
"""

from typing import Optional, List
from uuid import UUID
from datetime import date
from loguru import logger

from app.modules.assignment.models.agent_workload import (
    AgentWorkload,
    AgentWorkloadStats,
    AgentPerformanceMetrics,
)


class WorkloadRepository:
    """Repository for agent workload data operations"""

    def __init__(self):
        logger.info("WorkloadRepository initialized")

    async def get_agent_workload(self, db, agent_id: UUID) -> Optional[AgentWorkload]:
        """Get current workload for an agent"""
        query = """
            SELECT
                u.id as agent_id,
                u.first_name || ' ' || u.last_name as agent_name,
                COUNT(da.id) FILTER (WHERE da.status IN ('assigned', 'in_progress')) as current_assignments,
                20 as max_assignments,
                COUNT(da.id) FILTER (WHERE da.status = 'pending') as pending_count,
                COUNT(da.id) FILTER (WHERE da.status = 'in_progress') as in_progress_count,
                COUNT(da.id) FILTER (WHERE da.status = 'completed' AND da.completed_at::date = CURRENT_DATE) as completed_today,
                MAX(da.assigned_at) as last_assignment_at
            FROM users u
            LEFT JOIN declaration_assignments da ON da.agent_id = u.id
            WHERE u.id = $1
            GROUP BY u.id, u.first_name, u.last_name
        """
        row = await db.fetchrow(query, agent_id)
        if not row:
            return None

        data = dict(row)
        current = data.get('current_assignments', 0) or 0
        max_assign = data.get('max_assignments', 20) or 20
        data['workload_percentage'] = (current / max_assign) * 100 if max_assign > 0 else 0
        data['is_available'] = current < max_assign

        return AgentWorkload(**data)

    async def get_available_agents(self, db, max_workload_pct: float = 80) -> List[AgentWorkload]:
        """Get available agents for assignment"""
        query = """
            SELECT
                u.id as agent_id,
                u.first_name || ' ' || u.last_name as agent_name,
                COUNT(da.id) FILTER (WHERE da.status IN ('assigned', 'in_progress')) as current_assignments,
                20 as max_assignments,
                COUNT(da.id) FILTER (WHERE da.status = 'pending') as pending_count,
                COUNT(da.id) FILTER (WHERE da.status = 'in_progress') as in_progress_count,
                COUNT(da.id) FILTER (WHERE da.status = 'completed' AND da.completed_at::date = CURRENT_DATE) as completed_today,
                MAX(da.assigned_at) as last_assignment_at
            FROM users u
            LEFT JOIN declaration_assignments da ON da.agent_id = u.id
            WHERE u.role IN ('dgi_agent', 'dgi_supervisor')
            AND u.status = 'active'
            GROUP BY u.id, u.first_name, u.last_name
            HAVING (COUNT(da.id) FILTER (WHERE da.status IN ('assigned', 'in_progress'))::float / 20) * 100 < $1
            ORDER BY COUNT(da.id) FILTER (WHERE da.status IN ('assigned', 'in_progress')) ASC
        """
        rows = await db.fetch(query, max_workload_pct)
        agents = []
        for row in rows:
            data = dict(row)
            current = data.get('current_assignments', 0) or 0
            max_assign = data.get('max_assignments', 20) or 20
            data['workload_percentage'] = (current / max_assign) * 100 if max_assign > 0 else 0
            data['is_available'] = True
            agents.append(AgentWorkload(**data))
        return agents

    async def get_workload_stats(
        self,
        db,
        agent_id: UUID,
        start_date: date,
        end_date: date
    ) -> AgentWorkloadStats:
        """Get workload statistics for a period"""
        query = """
            SELECT
                COUNT(id) FILTER (WHERE status = 'completed') as total_completed,
                COUNT(id) as total_assigned,
                AVG(EXTRACT(EPOCH FROM (completed_at - assigned_at)) / 3600)
                    FILTER (WHERE status = 'completed') as avg_time
            FROM declaration_assignments
            WHERE agent_id = $1
            AND assigned_at::date BETWEEN $2 AND $3
        """
        row = await db.fetchrow(query, agent_id, start_date, end_date)
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


async def get_workload_repository() -> WorkloadRepository:
    """Dependency injection for WorkloadRepository"""
    return WorkloadRepository()
