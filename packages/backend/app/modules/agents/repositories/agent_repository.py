"""Agent Repository - Data access for ministry_agents"""

from typing import Optional, List, Dict, Any
from loguru import logger
import asyncpg

from app.modules.agents.models import (
    MinistryAgentCreate,
    MinistryAgentUpdate,
)


class AgentRepository:
    """Repository for ministry agents"""

    async def create(
        self,
        conn: asyncpg.Connection,
        agent: MinistryAgentCreate,
    ) -> Dict[str, Any]:
        """Create new ministry agent"""
        query = """
            INSERT INTO ministry_agents (
                user_id, ministry_id, agent_role, can_approve_unlimited,
                max_approval_amount, can_escalate, can_assign_tasks, is_active,
                is_backup_agent, backup_for_agent_id, working_hours_start,
                working_hours_end, working_days, assigned_by, assigned_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
            RETURNING *
        """
        result = await conn.fetchrow(
            query,
            agent.user_id,
            agent.ministry_id,
            agent.agent_role,
            agent.can_approve_unlimited,
            agent.max_approval_amount,
            agent.can_escalate,
            agent.can_assign_tasks,
            agent.is_active,
            agent.is_backup_agent,
            agent.backup_for_agent_id,
            agent.working_hours_start,
            agent.working_hours_end,
            agent.working_days,
            agent.assigned_by,
        )
        return dict(result)

    async def get_by_id(
        self,
        conn: asyncpg.Connection,
        agent_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Get agent by ID"""
        query = """
            SELECT * FROM ministry_agents WHERE id = $1
        """
        result = await conn.fetchrow(query, agent_id)
        return dict(result) if result else None

    async def get_by_user_id(
        self,
        conn: asyncpg.Connection,
        user_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Get agent by user ID"""
        query = """
            SELECT * FROM ministry_agents WHERE user_id = $1 AND is_active = true
        """
        result = await conn.fetchrow(query, user_id)
        return dict(result) if result else None

    async def list_by_ministry(
        self,
        conn: asyncpg.Connection,
        ministry_id: int,
        active_only: bool = True,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[List[Dict[str, Any]], int]:
        """List agents by ministry"""
        where_clause = "WHERE ministry_id = $1"
        if active_only:
            where_clause += " AND is_active = true"

        count_query = f"SELECT COUNT(*) FROM ministry_agents {where_clause}"
        total = await conn.fetchval(count_query, ministry_id)

        data_query = f"""
            SELECT * FROM ministry_agents
            {where_clause}
            ORDER BY assigned_at DESC
            LIMIT $2 OFFSET $3
        """
        results = await conn.fetch(data_query, ministry_id, limit, offset)
        return [dict(r) for r in results], total

    async def update(
        self,
        conn: asyncpg.Connection,
        agent_id: str,
        update_data: MinistryAgentUpdate,
    ) -> Optional[Dict[str, Any]]:
        """Update agent"""
        updates = []
        params = [agent_id]
        param_idx = 2

        for field, value in update_data.dict(exclude_unset=True).items():
            if value is not None:
                updates.append(f"{field} = ${param_idx}")
                params.append(value)
                param_idx += 1

        if not updates:
            return await self.get_by_id(conn, agent_id)

        query = f"""
            UPDATE ministry_agents
            SET {', '.join(updates)}
            WHERE id = $1
            RETURNING *
        """
        result = await conn.fetchrow(query, *params)
        return dict(result) if result else None

    async def deactivate(
        self,
        conn: asyncpg.Connection,
        agent_id: str,
        deactivated_by: str,
        reason: Optional[str] = None,
    ) -> bool:
        """Deactivate agent"""
        query = """
            UPDATE ministry_agents
            SET is_active = false,
                deactivated_at = NOW(),
                deactivated_by = $2,
                deactivation_reason = $3
            WHERE id = $1
        """
        result = await conn.execute(query, agent_id, deactivated_by, reason)
        return result == "UPDATE 1"

    async def reactivate(
        self,
        conn: asyncpg.Connection,
        agent_id: str,
    ) -> bool:
        """Reactivate agent"""
        query = """
            UPDATE ministry_agents
            SET is_active = true,
                deactivated_at = NULL,
                deactivated_by = NULL,
                deactivation_reason = NULL
            WHERE id = $1
        """
        result = await conn.execute(query, agent_id)
        return result == "UPDATE 1"

    async def get_available_agents(
        self,
        conn: asyncpg.Connection,
        ministry_id: int,
        declaration_type: Optional[str] = None,
        min_approval_amount: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """Get available agents for assignment"""
        query = """
            SELECT ma.*,
                   aw.current_assignments,
                   aw.capacity_percentage,
                   aw.workload_status,
                   aw.availability
            FROM ministry_agents ma
            LEFT JOIN agent_workloads aw ON ma.id = aw.agent_id
            WHERE ma.ministry_id = $1
              AND ma.is_active = true
              AND (aw.availability = 'available' OR aw.availability IS NULL)
              AND (aw.workload_status != 'overloaded' OR aw.workload_status IS NULL)
        """
        params = [ministry_id]

        if min_approval_amount is not None:
            query += " AND (ma.can_approve_unlimited = true OR ma.max_approval_amount >= $2)"
            params.append(min_approval_amount)

        query += " ORDER BY aw.capacity_percentage ASC NULLS FIRST, ma.assigned_at"

        results = await conn.fetch(query, *params)
        return [dict(r) for r in results]

    async def get_backup_agents(
        self,
        conn: asyncpg.Connection,
        primary_agent_id: str,
    ) -> List[Dict[str, Any]]:
        """Get backup agents for a primary agent"""
        query = """
            SELECT * FROM ministry_agents
            WHERE backup_for_agent_id = $1
              AND is_active = true
            ORDER BY assigned_at
        """
        results = await conn.fetch(query, primary_agent_id)
        return [dict(r) for r in results]

    async def check_working_hours(
        self,
        conn: asyncpg.Connection,
        agent_id: str,
        check_time: str,
    ) -> bool:
        """Check if agent is within working hours"""
        query = """
            SELECT working_hours_start, working_hours_end, working_days
            FROM ministry_agents
            WHERE id = $1
        """
        result = await conn.fetchrow(query, agent_id)
        if not result:
            return False

        # TODO: Implement time and day checking logic
        # For now, return True if working hours are set
        return result["working_hours_start"] is not None
