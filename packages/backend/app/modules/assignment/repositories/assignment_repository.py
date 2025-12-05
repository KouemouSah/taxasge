"""
Assignment Repository - Data access for assignment operations

Based on DATABASE_SCHEMA_REFERENCE.md:
- declaration_assignments table
- assignment_history table
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime
from loguru import logger

from app.modules.assignment.models.assignment_history import (
    Assignment,
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentStatus,
    ReassignmentCreate,
)


class AssignmentRepository:
    """Repository for assignment data operations"""

    def __init__(self):
        logger.info("AssignmentRepository initialized")

    async def create(
        self,
        db,
        data: AssignmentCreate,
        assigned_by: Optional[UUID]
    ) -> Assignment:
        """Create a new assignment"""
        query = """
            INSERT INTO declaration_assignments
            (declaration_id, agent_id, assigned_by, status, priority, assigned_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id, declaration_id, agent_id, assigned_by, status,
                      priority, assigned_at, started_at, completed_at, notes
        """
        row = await db.fetchrow(
            query,
            data.declaration_id,
            data.agent_id,
            assigned_by,
            AssignmentStatus.ASSIGNED.value,
            data.priority
        )
        return Assignment(**dict(row)) if row else None

    async def get_by_id(self, db, assignment_id: UUID) -> Optional[Assignment]:
        """Get assignment by ID"""
        query = """
            SELECT id, declaration_id, agent_id, assigned_by, status,
                   priority, assigned_at, started_at, completed_at, notes
            FROM declaration_assignments
            WHERE id = $1
        """
        row = await db.fetchrow(query, assignment_id)
        return Assignment(**dict(row)) if row else None

    async def update(
        self,
        db,
        assignment_id: UUID,
        data: AssignmentUpdate
    ) -> Optional[Assignment]:
        """Update assignment"""
        updates = []
        values = []
        param_count = 1

        if data.status:
            updates.append(f"status = ${param_count}")
            values.append(data.status.value)
            param_count += 1

        if data.priority is not None:
            updates.append(f"priority = ${param_count}")
            values.append(data.priority)
            param_count += 1

        if data.notes is not None:
            updates.append(f"notes = ${param_count}")
            values.append(data.notes)
            param_count += 1

        if not updates:
            return await self.get_by_id(db, assignment_id)

        updates.append(f"updated_at = NOW()")
        values.append(assignment_id)

        query = f"""
            UPDATE declaration_assignments
            SET {', '.join(updates)}
            WHERE id = ${param_count}
            RETURNING id, declaration_id, agent_id, assigned_by, status,
                      priority, assigned_at, started_at, completed_at, notes
        """
        row = await db.fetchrow(query, *values)
        return Assignment(**dict(row)) if row else None

    async def reassign(
        self,
        db,
        data: ReassignmentCreate,
        reassigned_by: UUID
    ) -> Optional[Assignment]:
        """Reassign to another agent"""
        query = """
            UPDATE declaration_assignments
            SET agent_id = $1,
                status = $2,
                notes = COALESCE(notes || E'\\n', '') || $3,
                updated_at = NOW()
            WHERE id = $4
            RETURNING id, declaration_id, agent_id, assigned_by, status,
                      priority, assigned_at, started_at, completed_at, notes
        """
        note = f"Reassigned by {reassigned_by}: {data.reason.value}"
        if data.notes:
            note += f" - {data.notes}"

        row = await db.fetchrow(
            query,
            data.new_agent_id,
            AssignmentStatus.REASSIGNED.value,
            note,
            data.assignment_id
        )
        return Assignment(**dict(row)) if row else None

    async def list_all(
        self,
        db,
        agent_id: Optional[UUID] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Assignment]:
        """List assignments with optional filters"""
        conditions = []
        values = []
        param_count = 1

        if agent_id:
            conditions.append(f"agent_id = ${param_count}")
            values.append(agent_id)
            param_count += 1

        if status:
            conditions.append(f"status = ${param_count}")
            values.append(status)
            param_count += 1

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        values.extend([limit, offset])
        query = f"""
            SELECT id, declaration_id, agent_id, assigned_by, status,
                   priority, assigned_at, started_at, completed_at, notes
            FROM declaration_assignments
            {where_clause}
            ORDER BY assigned_at DESC
            LIMIT ${param_count} OFFSET ${param_count + 1}
        """
        rows = await db.fetch(query, *values)
        return [Assignment(**dict(row)) for row in rows]


async def get_assignment_repository() -> AssignmentRepository:
    """Dependency injection for AssignmentRepository"""
    return AssignmentRepository()
