"""Workload Repository - Data access for agent workload and performance stats"""

from typing import Optional, List, Dict, Any
from loguru import logger
import asyncpg
from datetime import date

from app.modules.agents.models import AgentWorkloadUpdate


class WorkloadRepository:
    """Repository for agent workloads and performance stats"""

    # ========================================================================
    # AGENT_WORKLOADS
    # ========================================================================

    async def get_workload(
        self,
        conn: asyncpg.Connection,
        agent_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Get agent workload by agent_id (legacy)"""
        query = """
            SELECT * FROM agent_workloads WHERE agent_id = $1
        """
        result = await conn.fetchrow(query, agent_id)
        return dict(result) if result else None

    async def get_workload_by_profile_id(
        self,
        conn: asyncpg.Connection,
        agent_profile_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Get agent workload by agent_profile_id (migration 054+)"""
        query = """
            SELECT * FROM agent_workloads WHERE agent_profile_id = $1
        """
        result = await conn.fetchrow(query, agent_profile_id)
        return dict(result) if result else None

    async def create_workload(
        self,
        conn: asyncpg.Connection,
        agent_id: str,
    ) -> Dict[str, Any]:
        """Create initial workload record for agent (legacy method using agent_id)"""
        query = """
            INSERT INTO agent_workloads (
                agent_id, current_assignments, pending_declarations,
                in_progress_declarations, max_concurrent_assignments,
                capacity_percentage, workload_status, availability,
                last_updated_at
            )
            VALUES ($1, 0, 0, 0, 20, 0.00, 'available', 'available', NOW())
            ON CONFLICT (agent_id) DO NOTHING
            RETURNING *
        """
        result = await conn.fetchrow(query, agent_id)
        return dict(result) if result else None

    async def create_workload_for_profile(
        self,
        conn: asyncpg.Connection,
        agent_profile_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Create initial workload record for agent profile (migration 047+)

        Uses agent_profile_id as the primary identifier per migration 054.
        """
        query = """
            INSERT INTO agent_workloads (
                agent_profile_id, current_assignments, pending_declarations,
                in_progress_declarations, max_concurrent_assignments,
                capacity_percentage, workload_status, availability,
                last_updated_at
            )
            VALUES ($1, 0, 0, 0, 20, 0.00, 'available', 'available', NOW())
            ON CONFLICT (agent_profile_id) DO NOTHING
            RETURNING *
        """
        result = await conn.fetchrow(query, agent_profile_id)
        return dict(result) if result else None

    async def update_workload(
        self,
        conn: asyncpg.Connection,
        agent_id: str,
        update_data: AgentWorkloadUpdate,
    ) -> Optional[Dict[str, Any]]:
        """Update agent workload"""
        updates = []
        params = [agent_id]
        param_idx = 2

        for field, value in update_data.dict(exclude_unset=True).items():
            if value is not None:
                if field in ["workload_status", "availability"]:
                    value = value.value if hasattr(value, "value") else value
                updates.append(f"{field} = ${param_idx}")
                params.append(value)
                param_idx += 1

        if not updates:
            return await self.get_workload(conn, agent_id)

        updates.append(f"last_updated_at = ${param_idx}")
        params.append("NOW()")

        query = f"""
            UPDATE agent_workloads
            SET {', '.join(updates)}
            WHERE agent_id = $1
            RETURNING *
        """
        result = await conn.fetchrow(query, *params)
        return dict(result) if result else None

    async def increment_assignments(
        self,
        conn: asyncpg.Connection,
        agent_id: str,
    ) -> Dict[str, Any]:
        """Increment current assignments and recalculate capacity"""
        query = """
            UPDATE agent_workloads
            SET current_assignments = current_assignments + 1,
                pending_declarations = pending_declarations + 1,
                capacity_percentage = ((current_assignments + 1)::numeric / max_concurrent_assignments::numeric) * 100,
                workload_status = CASE
                    WHEN ((current_assignments + 1)::numeric / max_concurrent_assignments::numeric) >= 1.0 THEN 'overloaded'::workload_status_enum
                    WHEN ((current_assignments + 1)::numeric / max_concurrent_assignments::numeric) >= 0.8 THEN 'busy'::workload_status_enum
                    WHEN ((current_assignments + 1)::numeric / max_concurrent_assignments::numeric) >= 0.5 THEN 'normal'::workload_status_enum
                    ELSE 'available'::workload_status_enum
                END,
                last_assignment_at = NOW(),
                last_updated_at = NOW()
            WHERE agent_id = $1
            RETURNING *
        """
        result = await conn.fetchrow(query, agent_id)
        return dict(result)

    async def decrement_assignments(
        self,
        conn: asyncpg.Connection,
        agent_id: str,
    ) -> Dict[str, Any]:
        """Decrement current assignments and recalculate capacity"""
        query = """
            UPDATE agent_workloads
            SET current_assignments = GREATEST(0, current_assignments - 1),
                pending_declarations = GREATEST(0, pending_declarations - 1),
                capacity_percentage = (GREATEST(0, current_assignments - 1)::numeric / max_concurrent_assignments::numeric) * 100,
                workload_status = CASE
                    WHEN (GREATEST(0, current_assignments - 1)::numeric / max_concurrent_assignments::numeric) >= 1.0 THEN 'overloaded'::workload_status_enum
                    WHEN (GREATEST(0, current_assignments - 1)::numeric / max_concurrent_assignments::numeric) >= 0.8 THEN 'busy'::workload_status_enum
                    WHEN (GREATEST(0, current_assignments - 1)::numeric / max_concurrent_assignments::numeric) >= 0.5 THEN 'normal'::workload_status_enum
                    ELSE 'available'::workload_status_enum
                END,
                last_completion_at = NOW(),
                last_updated_at = NOW()
            WHERE agent_id = $1
            RETURNING *
        """
        result = await conn.fetchrow(query, agent_id)
        return dict(result)

    async def start_assignment(
        self,
        conn: asyncpg.Connection,
        agent_id: str,
    ) -> Dict[str, Any]:
        """Move assignment from pending to in_progress"""
        query = """
            UPDATE agent_workloads
            SET pending_declarations = GREATEST(0, pending_declarations - 1),
                in_progress_declarations = in_progress_declarations + 1,
                last_updated_at = NOW()
            WHERE agent_id = $1
            RETURNING *
        """
        result = await conn.fetchrow(query, agent_id)
        return dict(result)

    async def complete_assignment(
        self,
        conn: asyncpg.Connection,
        agent_id: str,
    ) -> Dict[str, Any]:
        """Complete assignment (decrement in_progress and current)"""
        query = """
            UPDATE agent_workloads
            SET in_progress_declarations = GREATEST(0, in_progress_declarations - 1),
                current_assignments = GREATEST(0, current_assignments - 1),
                capacity_percentage = (GREATEST(0, current_assignments - 1)::numeric / max_concurrent_assignments::numeric) * 100,
                workload_status = CASE
                    WHEN (GREATEST(0, current_assignments - 1)::numeric / max_concurrent_assignments::numeric) >= 1.0 THEN 'overloaded'::workload_status_enum
                    WHEN (GREATEST(0, current_assignments - 1)::numeric / max_concurrent_assignments::numeric) >= 0.8 THEN 'busy'::workload_status_enum
                    WHEN (GREATEST(0, current_assignments - 1)::numeric / max_concurrent_assignments::numeric) >= 0.5 THEN 'normal'::workload_status_enum
                    ELSE 'available'::workload_status_enum
                END,
                avg_daily_completions = avg_daily_completions + 1,
                last_completion_at = NOW(),
                last_updated_at = NOW()
            WHERE agent_id = $1
            RETURNING *
        """
        result = await conn.fetchrow(query, agent_id)
        return dict(result)

    async def get_available_agents(
        self,
        conn: asyncpg.Connection,
        ministry_id: int,
        max_capacity_percentage: float = 80.0,
    ) -> List[Dict[str, Any]]:
        """Get agents with available capacity"""
        query = """
            SELECT aw.*, ma.ministry_id, ma.agent_role
            FROM agent_workloads aw
            JOIN ministry_agents ma ON aw.agent_id = ma.id
            WHERE ma.ministry_id = $1
              AND ma.is_active = true
              AND aw.availability = 'available'
              AND aw.capacity_percentage < $2
              AND aw.workload_status != 'overloaded'
            ORDER BY aw.capacity_percentage ASC, aw.quality_score_avg DESC
        """
        results = await conn.fetch(query, ministry_id, max_capacity_percentage)
        return [dict(r) for r in results]

    async def get_overloaded_agents(
        self,
        conn: asyncpg.Connection,
        ministry_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Get overloaded agents for rebalancing"""
        where_clause = "WHERE aw.workload_status = 'overloaded'"
        params = []

        if ministry_id:
            where_clause += " AND ma.ministry_id = $1"
            params.append(ministry_id)

        query = f"""
            SELECT aw.*, ma.ministry_id, ma.agent_role
            FROM agent_workloads aw
            JOIN ministry_agents ma ON aw.agent_id = ma.id
            {where_clause}
            ORDER BY aw.capacity_percentage DESC
        """
        results = await conn.fetch(query, *params)
        return [dict(r) for r in results]

    # ========================================================================
    # AGENT_PERFORMANCE_STATS
    # ========================================================================

    async def get_performance_stats(
        self,
        conn: asyncpg.Connection,
        agent_id: int,
    ) -> Optional[Dict[str, Any]]:
        """Get agent performance stats"""
        query = """
            SELECT * FROM agent_performance_stats WHERE agent_id = $1
        """
        result = await conn.fetchrow(query, agent_id)
        return dict(result) if result else None

    async def create_performance_stats(
        self,
        conn: asyncpg.Connection,
        agent_id: int,
        ministry_id: int,
    ) -> Dict[str, Any]:
        """Create initial performance stats for agent"""
        query = """
            INSERT INTO agent_performance_stats (
                agent_id, ministry_id, current_month_processed,
                current_month_approved, current_month_rejected,
                current_month_escalated, sla_respected_count,
                sla_missed_count, current_active_locks,
                max_concurrent_locks, stats_period_start, updated_at
            )
            VALUES ($1, $2, 0, 0, 0, 0, 0, 0, 0, 0, CURRENT_DATE, NOW())
            ON CONFLICT (agent_id) DO NOTHING
            RETURNING *
        """
        result = await conn.fetchrow(query, agent_id, ministry_id)
        return dict(result) if result else None

    async def increment_processed(
        self,
        conn: asyncpg.Connection,
        agent_id: int,
    ) -> Dict[str, Any]:
        """Increment processed count"""
        query = """
            UPDATE agent_performance_stats
            SET current_month_processed = current_month_processed + 1,
                updated_at = NOW()
            WHERE agent_id = $1
            RETURNING *
        """
        result = await conn.fetchrow(query, agent_id)
        return dict(result)

    async def increment_approved(
        self,
        conn: asyncpg.Connection,
        agent_id: int,
    ) -> Dict[str, Any]:
        """Increment approved count"""
        query = """
            UPDATE agent_performance_stats
            SET current_month_approved = current_month_approved + 1,
                last_action_at = NOW(),
                updated_at = NOW()
            WHERE agent_id = $1
            RETURNING *
        """
        result = await conn.fetchrow(query, agent_id)
        return dict(result)

    async def increment_rejected(
        self,
        conn: asyncpg.Connection,
        agent_id: int,
    ) -> Dict[str, Any]:
        """Increment rejected count"""
        query = """
            UPDATE agent_performance_stats
            SET current_month_rejected = current_month_rejected + 1,
                last_action_at = NOW(),
                updated_at = NOW()
            WHERE agent_id = $1
            RETURNING *
        """
        result = await conn.fetchrow(query, agent_id)
        return dict(result)

    async def increment_escalated(
        self,
        conn: asyncpg.Connection,
        agent_id: int,
    ) -> Dict[str, Any]:
        """Increment escalated count"""
        query = """
            UPDATE agent_performance_stats
            SET current_month_escalated = current_month_escalated + 1,
                last_action_at = NOW(),
                updated_at = NOW()
            WHERE agent_id = $1
            RETURNING *
        """
        result = await conn.fetchrow(query, agent_id)
        return dict(result)

    async def update_sla_stats(
        self,
        conn: asyncpg.Connection,
        agent_id: int,
        sla_respected: bool,
    ) -> Dict[str, Any]:
        """Update SLA statistics"""
        field = "sla_respected_count" if sla_respected else "sla_missed_count"
        query = f"""
            UPDATE agent_performance_stats
            SET {field} = {field} + 1,
                sla_respect_percentage = (
                    (sla_respected_count + CASE WHEN $2 THEN 1 ELSE 0 END)::numeric /
                    (sla_respected_count + sla_missed_count + 1)::numeric
                ) * 100,
                updated_at = NOW()
            WHERE agent_id = $1
            RETURNING *
        """
        result = await conn.fetchrow(query, agent_id, sla_respected)
        return dict(result)

    async def get_top_performers(
        self,
        conn: asyncpg.Connection,
        ministry_id: int,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Get top performing agents"""
        query = """
            SELECT aps.*, ma.user_id, ma.agent_role
            FROM agent_performance_stats aps
            JOIN ministry_agents ma ON aps.agent_id = ma.id
            WHERE aps.ministry_id = $1
              AND ma.is_active = true
            ORDER BY
                aps.sla_respect_percentage DESC,
                aps.current_month_processed DESC,
                aps.avg_processing_minutes ASC
            LIMIT $2
        """
        results = await conn.fetch(query, ministry_id, limit)
        return [dict(r) for r in results]

    async def reset_monthly_stats(
        self,
        conn: asyncpg.Connection,
    ) -> int:
        """Reset monthly statistics (run at month start)"""
        query = """
            UPDATE agent_performance_stats
            SET current_month_processed = 0,
                current_month_approved = 0,
                current_month_rejected = 0,
                current_month_escalated = 0,
                sla_respected_count = 0,
                sla_missed_count = 0,
                sla_respect_percentage = NULL,
                stats_period_start = CURRENT_DATE,
                stats_period_end = NULL,
                updated_at = NOW()
            WHERE stats_period_start < CURRENT_DATE - INTERVAL '1 month'
            RETURNING agent_id
        """
        results = await conn.fetch(query)
        return len(results)

    # ========================================================================
    # METHODS USING DATABASE VIEWS - Optimized queries with pre-joined data
    # ========================================================================

    async def get_workload_dashboard(
        self,
        conn: asyncpg.Connection,
        agent_id: Optional[str] = None,
        ministry_id: Optional[int] = None,
        load_level: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Get agent workload dashboard using v_agents_workload_dashboard view

        This view includes:
        - Agent info (name, email, ministry)
        - Real-time workload metrics
        - Capacity calculations
        - Performance metrics
        - Availability status

        Args:
            conn: Database connection
            agent_id: Optional filter by specific agent
            ministry_id: Optional filter by ministry
            load_level: Optional filter (LOW, MEDIUM, HIGH, FULL)
            limit: Max results
            offset: Pagination offset

        Returns:
            Tuple of (agents list, total count)
        """
        try:
            where_conditions = []
            params = []

            if agent_id:
                where_conditions.append(f"user_id = ${len(params) + 1}")
                params.append(agent_id)

            if ministry_id:
                where_conditions.append(f"ministry_id = ${len(params) + 1}")
                params.append(ministry_id)

            if load_level:
                where_conditions.append(f"load_level = ${len(params) + 1}")
                params.append(load_level)

            where_clause = f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""

            # Count query
            count_query = f"""
                SELECT COUNT(*) FROM v_agents_workload_dashboard
                {where_clause}
            """
            total = await conn.fetchval(count_query, *params)

            # Data query
            params.extend([limit, offset])
            data_query = f"""
                SELECT * FROM v_agents_workload_dashboard
                {where_clause}
                ORDER BY capacity_percentage ASC, is_active DESC
                LIMIT ${len(params) - 1} OFFSET ${len(params)}
            """

            results = await conn.fetch(data_query, *params)
            agents = [dict(r) for r in results]

            return agents, total

        except Exception as e:
            logger.error(f"Error fetching workload dashboard: {str(e)}")
            raise

    async def list_available_agents_by_ministry(
        self,
        conn: asyncpg.Connection,
    ) -> List[Dict[str, Any]]:
        """
        List available agents grouped by ministry using v_available_agents_by_ministry view

        This view includes:
        - Ministry-level aggregations
        - Total/active/available agent counts
        - Capacity metrics per ministry
        - Average performance metrics

        Returns:
            List of ministry availability data
        """
        try:
            query = """
                SELECT * FROM v_available_agents_by_ministry
                ORDER BY available_capacity DESC
            """

            results = await conn.fetch(query)
            return [dict(r) for r in results]

        except Exception as e:
            logger.error(f"Error fetching available agents by ministry: {str(e)}")
            raise

    async def get_agent_performance_rankings(
        self,
        conn: asyncpg.Connection,
        ministry_id: Optional[int] = None,
        performance_tier: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Get agent performance rankings using v_agent_performance_rankings view

        This view includes:
        - Composite performance scores
        - Overall and ministry-specific rankings
        - Performance tiers (EXCELLENT, GOOD, AVERAGE, NEEDS_IMPROVEMENT)
        - Processing metrics

        Args:
            conn: Database connection
            ministry_id: Optional filter by ministry
            performance_tier: Optional filter by tier
            limit: Max results

        Returns:
            List of ranked agents
        """
        try:
            where_conditions = []
            params = []

            if ministry_id:
                where_conditions.append(f"ministry_id = ${len(params) + 1}")
                params.append(ministry_id)

            if performance_tier:
                where_conditions.append(f"performance_tier = ${len(params) + 1}")
                params.append(performance_tier)

            where_clause = f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""

            params.append(limit)
            query = f"""
                SELECT * FROM v_agent_performance_rankings
                {where_clause}
                ORDER BY performance_score DESC
                LIMIT ${len(params)}
            """

            results = await conn.fetch(query, *params)
            return [dict(r) for r in results]

        except Exception as e:
            logger.error(f"Error fetching agent performance rankings: {str(e)}")
            raise
