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
from app.modules.menu_config.constants import (
    NESTED_KEYS_TO_FLATTEN,
    SQL_EXCLUDE_KEYS,
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
            SELECT id, workflow_code, list_columns, preview_sections, labels,
                   is_active, created_at, updated_at
            FROM workflow_display_config
            WHERE id = $1
        """, config_id)

        return _row_to_dict(result)

    async def get_by_code(self, workflow_code: str) -> Optional[Dict[str, Any]]:
        """
        Get display config by exact workflow code

        Args:
            workflow_code: Exact workflow code (e.g., 'PASAPORTE_EXPEDICION_ADULTO')

        Returns:
            Config dict or None if not found
        """
        result = await self.db.fetchrow("""
            SELECT id, workflow_code, list_columns, preview_sections, labels,
                   is_active, created_at, updated_at
            FROM workflow_display_config
            WHERE workflow_code = $1
            AND is_active = true
            AND deleted_at IS NULL
        """, workflow_code)

        return _row_to_dict(result)

    async def get_by_pattern(self, workflow_pattern: str) -> Optional[Dict[str, Any]]:
        """
        DEPRECATED: Use get_by_code instead.
        Kept for backward compatibility during migration.
        """
        return await self.get_by_code(workflow_pattern)

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
                SELECT id, workflow_code, list_columns, preview_sections, labels,
                       is_active, created_at, updated_at
                FROM workflow_display_config
                WHERE is_active = $1
                AND deleted_at IS NULL
                ORDER BY workflow_code
                LIMIT $2 OFFSET $3
            """
            results = await self.db.fetch(query, is_active, limit, offset)
        else:
            query = """
                SELECT id, workflow_code, list_columns, preview_sections, labels,
                       is_active, created_at, updated_at
                FROM workflow_display_config
                WHERE deleted_at IS NULL
                ORDER BY workflow_code
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
            SELECT id, workflow_code, list_columns, preview_sections, labels,
                   is_active, created_at, updated_at
            FROM workflow_display_config
            WHERE is_active = true
            AND deleted_at IS NULL
            ORDER BY workflow_code
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
                "SELECT COUNT(*) FROM workflow_display_config WHERE is_active = $1 AND deleted_at IS NULL",
                is_active
            )
        else:
            result = await self.db.fetchval(
                "SELECT COUNT(*) FROM workflow_display_config WHERE deleted_at IS NULL"
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
                workflow_code, list_columns, preview_sections, labels
            )
            VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb)
            RETURNING id, workflow_code, list_columns, preview_sections, labels,
                      is_active, created_at, updated_at
        """,
            config.workflow_code,
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
            AND deleted_at IS NULL
            RETURNING id, workflow_code, list_columns, preview_sections, labels,
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
        Find the display config for an exact workflow code

        Args:
            workflow_code: Exact workflow code (e.g., 'PASAPORTE_EXPEDICION_ADULTO')

        Returns:
            Matching config dict or None
        """
        # Use exact match (migration 088 changed from pattern to exact code)
        result = await self.db.fetchrow("""
            SELECT id, workflow_code, list_columns, preview_sections, labels,
                   is_active, created_at, updated_at
            FROM workflow_display_config
            WHERE is_active = true
              AND workflow_code = $1
              AND deleted_at IS NULL
        """, workflow_code)

        return _row_to_dict(result)

    async def get_available_columns_for_workflow(
        self,
        workflow_code: str,
        is_minor: Optional[bool] = None,
        motivo: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Discover available columns for a workflow by introspecting
        the actual data in service_requests.form_data.

        This function extracts:
        1. Top-level scalar fields (strings, numbers, booleans, dates)
        2. Flattened nested object fields (dip.*, pasaporte_antiguo.*)
           Flattening: dip.natural_de → dip_natural_de

        This matches the logic in agent_routes._extract_preview_data()

        Args:
            workflow_code: Exact workflow code (e.g., 'PASAPORTE_EXPEDICION_ADULTO')
            is_minor: Optional filter for minor requests (True/False/None=all)
            motivo: Optional filter for renovation reason (perdida/robo/deterioro/None=all)

        Returns:
            Dict with total_requests and extracted_columns list

        @updated 2026-02-02 - Include flattened nested object columns (dip, pasaporte_antiguo)
        @updated 2026-02-02 - Optimized: Single query with CTE + UNION ALL
        @updated 2026-02-02 - Added optional filters: is_minor, motivo
        """
        # Convert constants to lists for SQL array parameters
        exclude_keys_list = list(SQL_EXCLUDE_KEYS)
        nested_keys_list = list(NESTED_KEYS_TO_FLATTEN)

        # OPTIMIZED: Single query with CTE and UNION ALL
        # - CTE filters base data once (avoids double table scan)
        # - UNION ALL combines top-level and nested columns in one result
        # - Optional filters for is_minor and motivo
        rows = await self.db.fetch("""
            WITH base_data AS (
                -- Filter once, reuse in both parts of UNION
                SELECT id, form_data
                FROM service_requests
                WHERE workflow_code = $1
                  AND form_data IS NOT NULL
                  AND form_data != '{}'::jsonb
                  -- Optional filter: is_minor
                  AND ($4::boolean IS NULL OR (form_data->>'is_minor')::boolean = $4)
                  -- Optional filter: motivo
                  AND ($5::text IS NULL OR UPPER(form_data->>'motivo') = UPPER($5))
            ),
            -- Part 1: Top-level scalar fields
            top_level AS (
                SELECT
                    key,
                    'extracted' as source,
                    COUNT(*) as sample_count,
                    CASE
                        WHEN jsonb_typeof((array_agg(value ORDER BY value::text DESC))[1]) = 'number' THEN 'number'
                        WHEN jsonb_typeof((array_agg(value ORDER BY value::text DESC))[1]) = 'boolean' THEN 'boolean'
                        WHEN (array_agg(value ORDER BY value::text DESC))[1]::text ~ '^"?[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN 'date'
                        ELSE 'string'
                    END as data_type
                FROM base_data bd,
                     jsonb_each(bd.form_data) AS kv(key, value)
                WHERE jsonb_typeof(value) NOT IN ('object', 'array')
                  AND key != ALL($2::text[])  -- Exclude internal keys
                GROUP BY key
            ),
            -- Part 2: Flattened nested object fields
            nested_flat AS (
                SELECT
                    parent_key || '_' || nested_key as key,
                    'extracted_nested' as source,
                    COUNT(*) as sample_count,
                    CASE
                        WHEN jsonb_typeof((array_agg(nested_value ORDER BY nested_value::text DESC))[1]) = 'number' THEN 'number'
                        WHEN jsonb_typeof((array_agg(nested_value ORDER BY nested_value::text DESC))[1]) = 'boolean' THEN 'boolean'
                        WHEN (array_agg(nested_value ORDER BY nested_value::text DESC))[1]::text ~ '^"?[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN 'date'
                        ELSE 'string'
                    END as data_type
                FROM base_data bd,
                     jsonb_each(bd.form_data) AS parent(parent_key, parent_value),
                     jsonb_each(parent_value) AS nested(nested_key, nested_value)
                WHERE parent_key = ANY($3::text[])  -- Only flatten specific nested objects
                  AND jsonb_typeof(parent_value) = 'object'
                  AND jsonb_typeof(nested_value) NOT IN ('object', 'array', 'null')
                  AND nested_value::text NOT IN ('""', 'null')
                GROUP BY parent_key, nested_key
            )
            -- Combine results
            SELECT key, source, sample_count, data_type
            FROM top_level
            UNION ALL
            SELECT key, source, sample_count, data_type
            FROM nested_flat
            ORDER BY source, sample_count DESC, key
        """, workflow_code, exclude_keys_list, nested_keys_list, is_minor, motivo)

        # Count total (from base_data CTE result would require another query,
        # but we can count from rows or use a separate fast count)
        total = await self.db.fetchval("""
            SELECT COUNT(*)
            FROM service_requests
            WHERE workflow_code = $1
              AND form_data IS NOT NULL
              AND form_data != '{}'::jsonb
              AND ($2::boolean IS NULL OR (form_data->>'is_minor')::boolean = $2)
              AND ($3::text IS NULL OR UPPER(form_data->>'motivo') = UPPER($3))
        """, workflow_code, is_minor, motivo)

        # Build extracted_columns list from unified results
        extracted_columns = []
        for row in rows:
            extracted_columns.append({
                "id": row["key"],
                "label_key": f"columns.{row['key']}",
                "source": row["source"],
                "data_type": row["data_type"],
                "sample_count": row["sample_count"]
            })

        return {
            "total_requests": total or 0,
            "extracted_columns": extracted_columns
        }

    async def get_sample_request(
        self,
        workflow_code: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get a sample service request for preview purposes.

        Args:
            workflow_code: Exact workflow code

        Returns:
            Sample request dict or None if no requests found
        """
        result = await self.db.fetchrow("""
            SELECT
                sr.id, sr.reference, sr.citizen_name,
                sr.workflow_code, sr.status, sr.priority,
                sr.extracted_data, sr.form_data, sr.created_at
            FROM service_requests sr
            WHERE sr.workflow_code = $1
            AND (sr.extracted_data IS NOT NULL OR sr.form_data IS NOT NULL)
            ORDER BY sr.created_at DESC
            LIMIT 1
        """, workflow_code)

        if result is None:
            return None

        return dict(result)
