"""
Menu Template Repository - Database operations for menu templates (asyncpg version)
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import asyncpg
import json

from app.modules.menu_config.models.menu_config import (
    MenuTemplateCreate,
    MenuTemplateUpdate,
)


def _row_to_dict(record: asyncpg.Record) -> Optional[Dict[str, Any]]:
    """Convert asyncpg Record to dict."""
    if record is None:
        return None
    data = dict(record)
    # Parse JSONB fields if they're strings
    for field in ['menu_structure', 'dashboard_widgets']:
        if field in data and data[field] and isinstance(data[field], str):
            data[field] = json.loads(data[field])
    return data


class MenuTemplateRepository:
    """Repository for menu template CRUD operations using asyncpg"""

    def __init__(self, db_connection: asyncpg.Connection):
        """
        Initialize repository with database connection

        Args:
            db_connection: asyncpg connection object
        """
        self.db = db_connection

    async def get_by_id(self, template_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Get menu template by ID

        Args:
            template_id: Template UUID

        Returns:
            Template dict or None if not found
        """
        result = await self.db.fetchrow("""
            SELECT id, code, name, description, template_type, entity_code,
                   menu_structure, dashboard_widgets, is_active,
                   created_at, updated_at, created_by
            FROM menu_templates
            WHERE id = $1
        """, template_id)

        return _row_to_dict(result)

    async def get_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Get menu template by code

        Args:
            code: Template code

        Returns:
            Template dict or None if not found
        """
        result = await self.db.fetchrow("""
            SELECT id, code, name, description, template_type, entity_code,
                   menu_structure, dashboard_widgets, is_active,
                   created_at, updated_at, created_by
            FROM menu_templates
            WHERE code = $1
        """, code)

        return _row_to_dict(result)

    async def get_all(
        self,
        template_type: Optional[str] = None,
        entity_code: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get all menu templates with optional filters

        Args:
            template_type: Filter by type (workflow, module, custom)
            entity_code: Filter by entity code
            is_active: Filter by active status
            limit: Maximum results
            offset: Pagination offset

        Returns:
            List of template dicts
        """
        conditions = []
        params = []
        param_count = 0

        if template_type:
            param_count += 1
            conditions.append(f"template_type = ${param_count}")
            params.append(template_type)

        if entity_code:
            param_count += 1
            conditions.append(f"entity_code = ${param_count}")
            params.append(entity_code)

        if is_active is not None:
            param_count += 1
            conditions.append(f"is_active = ${param_count}")
            params.append(is_active)

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        param_count += 1
        limit_param = param_count
        param_count += 1
        offset_param = param_count

        query = f"""
            SELECT id, code, name, description, template_type, entity_code,
                   menu_structure, dashboard_widgets, is_active,
                   created_at, updated_at, created_by
            FROM menu_templates
            WHERE {where_clause}
            ORDER BY name
            LIMIT ${limit_param} OFFSET ${offset_param}
        """

        params.extend([limit, offset])
        results = await self.db.fetch(query, *params)

        return [_row_to_dict(row) for row in results]

    async def count(
        self,
        template_type: Optional[str] = None,
        entity_code: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> int:
        """
        Count menu templates with optional filters

        Args:
            template_type: Filter by type
            entity_code: Filter by entity code
            is_active: Filter by active status

        Returns:
            Count of templates
        """
        conditions = []
        params = []
        param_count = 0

        if template_type:
            param_count += 1
            conditions.append(f"template_type = ${param_count}")
            params.append(template_type)

        if entity_code:
            param_count += 1
            conditions.append(f"entity_code = ${param_count}")
            params.append(entity_code)

        if is_active is not None:
            param_count += 1
            conditions.append(f"is_active = ${param_count}")
            params.append(is_active)

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        query = f"SELECT COUNT(*) FROM menu_templates WHERE {where_clause}"

        result = await self.db.fetchval(query, *params)
        return result or 0

    async def create(
        self,
        template: MenuTemplateCreate,
        created_by: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        Create a new menu template

        Args:
            template: Template data
            created_by: User UUID who created the template

        Returns:
            Created template dict
        """
        result = await self.db.fetchrow("""
            INSERT INTO menu_templates (
                code, name, description, template_type, entity_code,
                menu_structure, dashboard_widgets, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, code, name, description, template_type, entity_code,
                      menu_structure, dashboard_widgets, is_active,
                      created_at, updated_at, created_by
        """,
            template.code,
            template.name,
            template.description,
            template.template_type,
            template.entity_code,
            json.dumps(template.menu_structure),
            json.dumps(template.dashboard_widgets) if template.dashboard_widgets else None,
            created_by
        )

        return _row_to_dict(result)

    async def update(
        self,
        template_id: UUID,
        template: MenuTemplateUpdate
    ) -> Optional[Dict[str, Any]]:
        """
        Update an existing menu template

        Args:
            template_id: Template UUID
            template: Updated template data

        Returns:
            Updated template dict or None if not found
        """
        # Build dynamic update query
        update_fields = []
        params = []
        param_count = 0

        if template.name is not None:
            param_count += 1
            update_fields.append(f"name = ${param_count}")
            params.append(template.name)

        if template.description is not None:
            param_count += 1
            update_fields.append(f"description = ${param_count}")
            params.append(template.description)

        if template.menu_structure is not None:
            param_count += 1
            update_fields.append(f"menu_structure = ${param_count}")
            params.append(json.dumps(template.menu_structure))

        if template.dashboard_widgets is not None:
            param_count += 1
            update_fields.append(f"dashboard_widgets = ${param_count}")
            params.append(json.dumps(template.dashboard_widgets))

        if template.is_active is not None:
            param_count += 1
            update_fields.append(f"is_active = ${param_count}")
            params.append(template.is_active)

        if not update_fields:
            return await self.get_by_id(template_id)

        param_count += 1
        params.append(template_id)

        query = f"""
            UPDATE menu_templates
            SET {', '.join(update_fields)}, updated_at = NOW()
            WHERE id = ${param_count}
            RETURNING id, code, name, description, template_type, entity_code,
                      menu_structure, dashboard_widgets, is_active,
                      created_at, updated_at, created_by
        """

        result = await self.db.fetchrow(query, *params)
        return _row_to_dict(result)

    async def delete(self, template_id: UUID) -> bool:
        """
        Delete a menu template

        Args:
            template_id: Template UUID

        Returns:
            True if deleted, False if not found
        """
        result = await self.db.execute("""
            DELETE FROM menu_templates
            WHERE id = $1
        """, template_id)

        return "DELETE 1" in result

    async def get_distinct_entity_codes(self) -> List[str]:
        """
        Get all distinct entity codes from menu_templates

        Returns:
            List of distinct entity codes (excluding NULL)
        """
        results = await self.db.fetch("""
            SELECT DISTINCT entity_code
            FROM menu_templates
            WHERE entity_code IS NOT NULL
            ORDER BY entity_code
        """)
        return [row['entity_code'] for row in results]

    async def get_by_entity(
        self,
        entity_code: str,
        include_global: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get menu templates for a specific entity

        Args:
            entity_code: Entity code
            include_global: Include global templates (entity_code IS NULL)

        Returns:
            List of template dicts
        """
        if include_global:
            query = """
                SELECT id, code, name, description, template_type, entity_code,
                       menu_structure, dashboard_widgets, is_active,
                       created_at, updated_at, created_by
                FROM menu_templates
                WHERE (entity_code = $1 OR entity_code IS NULL)
                  AND is_active = true
                ORDER BY entity_code NULLS LAST, name
            """
        else:
            query = """
                SELECT id, code, name, description, template_type, entity_code,
                       menu_structure, dashboard_widgets, is_active,
                       created_at, updated_at, created_by
                FROM menu_templates
                WHERE entity_code = $1 AND is_active = true
                ORDER BY name
            """

        results = await self.db.fetch(query, entity_code)
        return [_row_to_dict(row) for row in results]
