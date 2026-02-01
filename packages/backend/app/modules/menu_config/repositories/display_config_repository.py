"""
Workflow Display Config Repository - Database operations for workflow display configurations (asyncpg version)

Manages the workflow_display_config table which controls how PendingPage
displays columns and sections per workflow pattern.

Author: Claude Code Expert
Date: 2026-02-01
"""
from typing import List, Optional, Dict, Any
import json
import asyncpg

from app.modules.menu_config.models.menu_config import (
    WorkflowDisplayConfigCreate,
    WorkflowDisplayConfigUpdate,
)


def _row_to_dict(record: asyncpg.Record) -> Optional[Dict[str, Any]]:
    """Convert asyncpg Record to dict, handling JSONB fields."""
    if record is None:
        return None
    result = dict(record)
    # Parse JSONB fields if they're strings
    for key in ['list_columns', 'preview_sections', 'labels']:
        if key in result and isinstance(result[key], str):
            result[key] = json.loads(result[key])
    return result


class DisplayConfigRepository:
    """Repository for workflow display config CRUD operations using asyncpg"""

    def __init__(self, db_connection: asyncpg.Connection):
        """
        Initialize repository with database connection

        Args:
            db_connection: asyncpg connection object
        """
        self.db = db_connection

    async def get_by_id(self, config_id: int) -> Optional[Dict[str, Any]]:
        """
        Get display config by ID

        Args:
            config_id: Config ID

        Returns:
            Config dict or None if not found
        """
        result = await self.db.fetchrow("""
            SELECT id, workflow_pattern, list_columns, preview_sections, labels,
                   is_active, created_at, updated_at
            FROM workflow_display_config
            WHERE id = $1
        """, config_id)

        return _row_to_dict(result)

    async def get_by_pattern(self, workflow_pattern: str) -> Optional[Dict[str, Any]]:
        """
        Get display config by exact workflow pattern

        Args:
            workflow_pattern: Workflow pattern (e.g., 'PASAPORTE_%')

        Returns:
            Config dict or None if not found
        """
        result = await self.db.fetchrow("""
            SELECT id, workflow_pattern, list_columns, preview_sections, labels,
                   is_active, created_at, updated_at
            FROM workflow_display_config
            WHERE workflow_pattern = $1
        """, workflow_pattern)

        return _row_to_dict(result)

    async def get_all(
        self,
        is_active: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get all display configs with optional filters

        Args:
            is_active: Filter by active status
            limit: Maximum results
            offset: Pagination offset

        Returns:
            List of config dicts
        """
        if is_active is not None:
            query = """
                SELECT id, workflow_pattern, list_columns, preview_sections, labels,
                       is_active, created_at, updated_at
                FROM workflow_display_config
                WHERE is_active = $1
                ORDER BY workflow_pattern
                LIMIT $2 OFFSET $3
            """
            results = await self.db.fetch(query, is_active, limit, offset)
        else:
            query = """
                SELECT id, workflow_pattern, list_columns, preview_sections, labels,
                       is_active, created_at, updated_at
                FROM workflow_display_config
                ORDER BY workflow_pattern
                LIMIT $1 OFFSET $2
            """
            results = await self.db.fetch(query, limit, offset)

        return [_row_to_dict(row) for row in results]

    async def get_active_configs(self) -> List[Dict[str, Any]]:
        """
        Get all active display configs

        Returns:
            List of active config dicts
        """
        results = await self.db.fetch("""
            SELECT id, workflow_pattern, list_columns, preview_sections, labels,
                   is_active, created_at, updated_at
            FROM workflow_display_config
            WHERE is_active = true
            ORDER BY workflow_pattern
        """)

        return [_row_to_dict(row) for row in results]

    async def count(self, is_active: Optional[bool] = None) -> int:
        """
        Count display configs

        Args:
            is_active: Filter by active status

        Returns:
            Count of configs
        """
        if is_active is not None:
            result = await self.db.fetchval(
                "SELECT COUNT(*) FROM workflow_display_config WHERE is_active = $1",
                is_active
            )
        else:
            result = await self.db.fetchval(
                "SELECT COUNT(*) FROM workflow_display_config"
            )

        return result or 0

    async def create(self, config: WorkflowDisplayConfigCreate) -> Dict[str, Any]:
        """
        Create a new display config

        Args:
            config: Config data

        Returns:
            Created config dict
        """
        result = await self.db.fetchrow("""
            INSERT INTO workflow_display_config (
                workflow_pattern, list_columns, preview_sections, labels
            )
            VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb)
            RETURNING id, workflow_pattern, list_columns, preview_sections, labels,
                      is_active, created_at, updated_at
        """,
            config.workflow_pattern,
            json.dumps(config.list_columns),
            json.dumps(config.preview_sections),
            json.dumps(config.labels or {})
        )

        return _row_to_dict(result)

    async def update(
        self,
        config_id: int,
        config: WorkflowDisplayConfigUpdate
    ) -> Optional[Dict[str, Any]]:
        """
        Update an existing display config

        Args:
            config_id: Config ID
            config: Updated config data

        Returns:
            Updated config dict or None if not found
        """
        # Build dynamic update query
        update_fields = []
        params = []
        param_count = 0

        if config.list_columns is not None:
            param_count += 1
            update_fields.append(f"list_columns = ${param_count}::jsonb")
            params.append(json.dumps(config.list_columns))

        if config.preview_sections is not None:
            param_count += 1
            update_fields.append(f"preview_sections = ${param_count}::jsonb")
            params.append(json.dumps(config.preview_sections))

        if config.labels is not None:
            param_count += 1
            update_fields.append(f"labels = ${param_count}::jsonb")
            params.append(json.dumps(config.labels))

        if config.is_active is not None:
            param_count += 1
            update_fields.append(f"is_active = ${param_count}")
            params.append(config.is_active)

        if not update_fields:
            return await self.get_by_id(config_id)

        param_count += 1
        params.append(config_id)

        query = f"""
            UPDATE workflow_display_config
            SET {', '.join(update_fields)}, updated_at = NOW()
            WHERE id = ${param_count}
            RETURNING id, workflow_pattern, list_columns, preview_sections, labels,
                      is_active, created_at, updated_at
        """

        result = await self.db.fetchrow(query, *params)
        return _row_to_dict(result)

    async def delete(self, config_id: int) -> bool:
        """
        Delete a display config

        Args:
            config_id: Config ID

        Returns:
            True if deleted, False if not found
        """
        result = await self.db.execute("""
            DELETE FROM workflow_display_config
            WHERE id = $1
        """, config_id)

        return "DELETE 1" in result

    async def find_config_for_workflow(
        self,
        workflow_code: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find the matching display config for a workflow code using SQL LIKE pattern matching

        Args:
            workflow_code: Workflow code (e.g., 'PASAPORTE_NUEVO')

        Returns:
            Matching config dict or None
        """
        # Use SQL LIKE pattern matching
        result = await self.db.fetchrow("""
            SELECT id, workflow_pattern, list_columns, preview_sections, labels,
                   is_active, created_at, updated_at
            FROM workflow_display_config
            WHERE is_active = true
              AND $1 LIKE workflow_pattern
            ORDER BY LENGTH(workflow_pattern) DESC
            LIMIT 1
        """, workflow_code)

        return _row_to_dict(result)

    async def get_available_columns_for_workflow(
        self,
        workflow_pattern: str
    ) -> Dict[str, Any]:
        """
        Discover available columns for a workflow pattern by introspecting
        the actual data in service_requests.form_data.

        Args:
            workflow_pattern: SQL LIKE pattern (e.g., 'PASAPORTE_%')

        Returns:
            Dict with total_requests and extracted_columns list
        """
        # Count total requests matching pattern
        total = await self.db.fetchval("""
            SELECT COUNT(*)
            FROM service_requests
            WHERE workflow_code LIKE $1
              AND form_data IS NOT NULL
              AND form_data != '{}'::jsonb
        """, workflow_pattern)

        # Get distinct keys from form_data (excluding nested objects)
        # and count how many requests have each key
        rows = await self.db.fetch("""
            SELECT
                key,
                COUNT(*) as sample_count,
                -- Try to infer data type from first non-null value
                CASE
                    WHEN jsonb_typeof(first_value) = 'number' THEN 'number'
                    WHEN jsonb_typeof(first_value) = 'boolean' THEN 'boolean'
                    WHEN first_value::text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN 'date'
                    ELSE 'string'
                END as data_type
            FROM (
                SELECT
                    key,
                    (array_agg(value ORDER BY value::text DESC))[1] as first_value
                FROM service_requests sr,
                     jsonb_each(sr.form_data) AS kv(key, value)
                WHERE sr.workflow_code LIKE $1
                  AND sr.form_data IS NOT NULL
                  AND sr.form_data != '{}'::jsonb
                  -- Exclude nested objects (like 'dip', 'pasaporte_antiguo')
                  AND jsonb_typeof(value) != 'object'
                  -- Exclude arrays
                  AND jsonb_typeof(value) != 'array'
                  -- Exclude internal/technical fields
                  AND key NOT IN ('sub_type', 'is_minor', 'solicitud_type', 'motivo')
                GROUP BY key
            ) subq
            GROUP BY key, first_value
            ORDER BY sample_count DESC, key
        """, workflow_pattern)

        extracted_columns = []
        for row in rows:
            extracted_columns.append({
                "id": row["key"],
                "label_key": f"columns.{row['key']}",
                "source": "extracted",
                "data_type": row["data_type"],
                "sample_count": row["sample_count"]
            })

        return {
            "total_requests": total or 0,
            "extracted_columns": extracted_columns
        }
