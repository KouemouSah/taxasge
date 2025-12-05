"""
Rules Repository - Data access for assignment rules

Based on DATABASE_SCHEMA_REFERENCE.md:
- assignment_rules table
"""

from typing import Optional, List
from uuid import UUID
from loguru import logger

from app.modules.assignment.models.assignment_rule import (
    AssignmentRule,
    AssignmentRuleCreate,
    AssignmentRuleUpdate,
)


class RulesRepository:
    """Repository for assignment rules data operations"""

    def __init__(self):
        logger.info("RulesRepository initialized")

    async def create(
        self,
        db,
        data: AssignmentRuleCreate,
        created_by: UUID
    ) -> AssignmentRule:
        """Create a new assignment rule"""
        query = """
            INSERT INTO assignment_rules
            (name, description, rule_type, criteria, priority, is_active, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, name, description, rule_type, criteria, priority,
                      is_active, created_at, updated_at, created_by
        """
        import json
        row = await db.fetchrow(
            query,
            data.name,
            data.description,
            data.rule_type.value,
            json.dumps(data.criteria),
            data.priority,
            data.is_active,
            created_by
        )
        return AssignmentRule(**dict(row)) if row else None

    async def get_by_id(self, db, rule_id: UUID) -> Optional[AssignmentRule]:
        """Get rule by ID"""
        query = """
            SELECT id, name, description, rule_type, criteria, priority,
                   is_active, created_at, updated_at, created_by
            FROM assignment_rules
            WHERE id = $1
        """
        row = await db.fetchrow(query, rule_id)
        return AssignmentRule(**dict(row)) if row else None

    async def get_active_rules(self, db) -> List[AssignmentRule]:
        """Get all active assignment rules"""
        query = """
            SELECT id, name, description, rule_type, criteria, priority,
                   is_active, created_at, updated_at, created_by
            FROM assignment_rules
            WHERE is_active = true
            ORDER BY priority ASC
        """
        rows = await db.fetch(query)
        return [AssignmentRule(**dict(row)) for row in rows]

    async def update(
        self,
        db,
        rule_id: UUID,
        data: AssignmentRuleUpdate
    ) -> Optional[AssignmentRule]:
        """Update an assignment rule"""
        updates = []
        values = []
        param_count = 1

        if data.name is not None:
            updates.append(f"name = ${param_count}")
            values.append(data.name)
            param_count += 1

        if data.description is not None:
            updates.append(f"description = ${param_count}")
            values.append(data.description)
            param_count += 1

        if data.rule_type is not None:
            updates.append(f"rule_type = ${param_count}")
            values.append(data.rule_type.value)
            param_count += 1

        if data.criteria is not None:
            import json
            updates.append(f"criteria = ${param_count}")
            values.append(json.dumps(data.criteria))
            param_count += 1

        if data.priority is not None:
            updates.append(f"priority = ${param_count}")
            values.append(data.priority)
            param_count += 1

        if data.is_active is not None:
            updates.append(f"is_active = ${param_count}")
            values.append(data.is_active)
            param_count += 1

        if not updates:
            return await self.get_by_id(db, rule_id)

        updates.append("updated_at = NOW()")
        values.append(rule_id)

        query = f"""
            UPDATE assignment_rules
            SET {', '.join(updates)}
            WHERE id = ${param_count}
            RETURNING id, name, description, rule_type, criteria, priority,
                      is_active, created_at, updated_at, created_by
        """
        row = await db.fetchrow(query, *values)
        return AssignmentRule(**dict(row)) if row else None

    async def delete(self, db, rule_id: UUID) -> bool:
        """Delete an assignment rule"""
        query = "DELETE FROM assignment_rules WHERE id = $1"
        result = await db.execute(query, rule_id)
        return result == "DELETE 1"


async def get_rules_repository() -> RulesRepository:
    """Dependency injection for RulesRepository"""
    return RulesRepository()
