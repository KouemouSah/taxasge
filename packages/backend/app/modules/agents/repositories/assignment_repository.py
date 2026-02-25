"""Assignment Repository - Data access for assignments and work queue"""

from typing import Optional, List, Dict, Any
from loguru import logger
import asyncpg
from datetime import datetime, timedelta

from app.modules.agents.models import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentStatus,
)


class AssignmentRepository:
    """Repository for assignments and agent work queue"""

    # ========================================================================
    # ASSIGNMENTS
    # ========================================================================

    async def create_assignment(
        self,
        conn: asyncpg.Connection,
        assignment: AssignmentCreate,
    ) -> Dict[str, Any]:
        """Create new assignment"""
        query = """
            INSERT INTO assignments (
                declaration_id, declaration_type, agent_id, assigned_by,
                assignment_method, status, notes, auto_assignment_score,
                score_breakdown, rule_applied_id, deadline, priority_level,
                assigned_at, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW(), NOW())
            RETURNING *
        """
        result = await conn.fetchrow(
            query,
            assignment.declaration_id,
            assignment.declaration_type,
            assignment.agent_id,
            assignment.assigned_by,
            assignment.assignment_method.value,
            assignment.status.value,
            assignment.notes,
            assignment.auto_assignment_score,
            assignment.score_breakdown,
            assignment.rule_applied_id,
            assignment.deadline,
            assignment.priority_level,
        )
        return dict(result)

    async def get_assignment_by_id(
        self,
        conn: asyncpg.Connection,
        assignment_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Get assignment by ID"""
        query = """
            SELECT * FROM assignments WHERE id = $1
        """
        result = await conn.fetchrow(query, assignment_id)
        return dict(result) if result else None

    async def get_assignments_by_declaration(
        self,
        conn: asyncpg.Connection,
        declaration_id: str,
    ) -> List[Dict[str, Any]]:
        """Get all assignments for a declaration"""
        query = """
            SELECT * FROM assignments
            WHERE declaration_id = $1
            ORDER BY assigned_at DESC
        """
        results = await conn.fetch(query, declaration_id)
        return [dict(r) for r in results]

    async def get_assignments_by_agent(
        self,
        conn: asyncpg.Connection,
        agent_id: str,
        status: Optional[AssignmentStatus] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[List[Dict[str, Any]], int]:
        """Get assignments for an agent"""
        where_clause = "WHERE agent_id = $1"
        params = [agent_id]

        if status:
            where_clause += " AND status = $2"
            params.append(status.value)

        count_query = f"SELECT COUNT(*) FROM assignments {where_clause}"
        total = await conn.fetchval(count_query, *params)

        data_query = f"""
            SELECT * FROM assignments
            {where_clause}
            ORDER BY assigned_at DESC
            LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
        """
        params.extend([limit, offset])
        results = await conn.fetch(data_query, *params)
        return [dict(r) for r in results], total

    async def update_assignment(
        self,
        conn: asyncpg.Connection,
        assignment_id: str,
        update_data: AssignmentUpdate,
    ) -> Optional[Dict[str, Any]]:
        """Update assignment"""
        updates = []
        params = [assignment_id]
        param_idx = 2

        for field, value in update_data.dict(exclude_unset=True).items():
            if value is not None:
                if field == "status" or field == "reassignment_reason":
                    value = value.value if hasattr(value, "value") else value
                updates.append(f"{field} = ${param_idx}")
                params.append(value)
                param_idx += 1

        if not updates:
            return await self.get_assignment_by_id(conn, assignment_id)

        updates.append(f"updated_at = ${param_idx}")
        params.append(datetime.utcnow())

        query = f"""
            UPDATE assignments
            SET {', '.join(updates)}
            WHERE id = $1
            RETURNING *
        """
        result = await conn.fetchrow(query, *params)
        return dict(result) if result else None

    async def reassign(
        self,
        conn: asyncpg.Connection,
        assignment_id: str,
        new_agent_id: str,
        reason: str,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Reassign to another agent"""
        query = """
            UPDATE assignments
            SET status = 'reassigned',
                reassigned_to = $2,
                reassigned_at = NOW(),
                reassignment_reason = $3,
                reassignment_notes = $4,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        """
        result = await conn.fetchrow(query, assignment_id, new_agent_id, reason, notes)
        return dict(result)

    async def complete_assignment(
        self,
        conn: asyncpg.Connection,
        assignment_id: str,
        quality_score: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Mark assignment as completed"""
        query = """
            UPDATE assignments
            SET status = 'completed',
                completed_at = NOW(),
                processing_duration_hours = EXTRACT(EPOCH FROM (NOW() - started_at)) / 3600,
                deadline_met = (NOW() <= deadline),
                quality_score = $2,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        """
        result = await conn.fetchrow(query, assignment_id, quality_score)
        return dict(result)

    # ========================================================================
    # AGENT WORK QUEUE — REMOVED (migration to entity_code routing)
    # ========================================================================
    # Queue methods deleted: add_to_queue, get_queue_item, get_next_queue_items,
    # assign_queue_item, complete_queue_item, escalate_queue_item, get_sla_violations.
    # Replaced by:
    #   - service_requests: agent_queue_service.py (entity_code routing)
    #   - assignments: assignment/ module (entity_id routing)
    # See migrations 131-133.
