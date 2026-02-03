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

    # Technical fields excluded from column discovery
    TECHNICAL_FIELDS = frozenset({
        'sub_type', 'is_minor', 'solicitud_type', 'motivo'
    })

    async def get_available_columns_for_workflow(
        self,
        workflow_code: str,
        is_minor: Optional[bool] = None,
        solicitud_type: Optional[str] = None,
        motivo: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Discover available columns for a workflow by introspecting
        the actual data in service_requests.form_data.

        Flattens nested JSONB objects (e.g., dip.natural_de, cert.nombre)
        and supports sub-workflow filtering.

        Args:
            workflow_code: Exact workflow code (e.g., 'PASAPORTE_NUEVO')
            is_minor: Filter by minor status (True/False/None=all)
            solicitud_type: Filter by solicitud_type (e.g., 'expedicion', 'renovacion')
            motivo: Filter by motivo (e.g., 'vencimiento', 'perdida')

        Returns:
            Dict with total_requests, extracted_columns, and available_filters
        """
        # Build WHERE clause with optional filters
        where_clauses = [
            "sr.workflow_code = $1",
            "sr.form_data IS NOT NULL",
            "sr.form_data != '{}'::jsonb",
        ]
        params: list = [workflow_code]
        param_idx = 1

        if is_minor is not None:
            param_idx += 1
            where_clauses.append(
                f"(sr.form_data->>'is_minor')::boolean = ${param_idx}"
            )
            params.append(is_minor)

        if solicitud_type is not None:
            param_idx += 1
            where_clauses.append(
                f"sr.form_data->>'solicitud_type' = ${param_idx}"
            )
            params.append(solicitud_type)

        if motivo is not None:
            param_idx += 1
            where_clauses.append(f"sr.form_data->>'motivo' = ${param_idx}")
            params.append(motivo)

        where_sql = " AND ".join(where_clauses)

        # Count total matching requests
        total = await self.db.fetchval(
            f"SELECT COUNT(*) FROM service_requests sr WHERE {where_sql}",
            *params,
        )

        # Discover columns with flattening of nested objects (2 levels)
        # Level 1: scalar keys at root level
        # Level 2: scalar keys inside nested objects (dip.*, cert.*, etc.)
        rows = await self.db.fetch(f"""
            WITH flat_keys AS (
                -- Level 1: root-level scalar fields
                SELECT
                    kv.key AS col_key,
                    kv.value AS col_value
                FROM service_requests sr,
                     jsonb_each(sr.form_data) AS kv(key, value)
                WHERE {where_sql}
                  AND jsonb_typeof(kv.value) NOT IN ('object', 'array')
                  AND kv.key NOT IN ('sub_type', 'is_minor', 'solicitud_type', 'motivo')

                UNION ALL

                -- Level 2: nested object fields (dip.*, pasaporte_antiguo.*, cert.*, etc.)
                SELECT
                    parent.key || '.' || child.key AS col_key,
                    child.value AS col_value
                FROM service_requests sr,
                     jsonb_each(sr.form_data) AS parent(key, value),
                     jsonb_each(parent.value) AS child(key, value)
                WHERE {where_sql}
                  AND jsonb_typeof(parent.value) = 'object'
                  AND jsonb_typeof(child.value) NOT IN ('object', 'array')
                  AND parent.key NOT IN ('sub_type', 'is_minor', 'solicitud_type', 'motivo')
            )
            SELECT
                col_key,
                COUNT(*) AS sample_count,
                CASE
                    WHEN jsonb_typeof(first_val) = 'number' THEN 'number'
                    WHEN jsonb_typeof(first_val) = 'boolean' THEN 'boolean'
                    WHEN first_val::text ~ '"[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' THEN 'date'
                    ELSE 'string'
                END AS data_type
            FROM (
                SELECT
                    col_key,
                    (array_agg(col_value ORDER BY col_value::text DESC)
                        FILTER (WHERE col_value IS NOT NULL AND jsonb_typeof(col_value) != 'null')
                    )[1] AS first_val
                FROM flat_keys
                GROUP BY col_key
            ) grouped
            ORDER BY sample_count DESC, col_key
        """, *params)

        extracted_columns = []
        for row in rows:
            col_key = row["col_key"]
            extracted_columns.append({
                "id": col_key,
                "label_key": f"columns.{col_key}",
                "source": "extracted",
                "data_type": row["data_type"],
                "sample_count": row["sample_count"],
            })

        # Discover available filter values for this workflow
        available_filters = await self._get_available_filters(
            workflow_code
        )

        # Build filters_applied dict
        filters_applied = {}
        if is_minor is not None:
            filters_applied["is_minor"] = is_minor
        if solicitud_type is not None:
            filters_applied["solicitud_type"] = solicitud_type
        if motivo is not None:
            filters_applied["motivo"] = motivo

        return {
            "total_requests": total or 0,
            "extracted_columns": extracted_columns,
            "filters_applied": filters_applied if filters_applied else None,
            "available_filters": available_filters,
        }

    async def _get_available_filters(
        self, workflow_code: str
    ) -> Dict[str, Any]:
        """
        Discover available filter values for a workflow code.
        Inspects form_data for is_minor, solicitud_type, motivo fields.

        Returns:
            Dict with available filter values, e.g.:
            {
                "is_minor": [true, false],
                "solicitud_type": ["expedicion", "renovacion"],
                "motivo": ["vencimiento", "perdida"]
            }
        """
        rows = await self.db.fetch("""
            SELECT
                jsonb_agg(DISTINCT form_data->'is_minor')
                    FILTER (WHERE form_data ? 'is_minor'
                              AND form_data->'is_minor' IS NOT NULL
                              AND jsonb_typeof(form_data->'is_minor') != 'null')
                    AS is_minor_vals,
                jsonb_agg(DISTINCT form_data->'solicitud_type')
                    FILTER (WHERE form_data ? 'solicitud_type'
                              AND form_data->'solicitud_type' IS NOT NULL
                              AND jsonb_typeof(form_data->'solicitud_type') != 'null')
                    AS solicitud_type_vals,
                jsonb_agg(DISTINCT form_data->'motivo')
                    FILTER (WHERE form_data ? 'motivo'
                              AND form_data->'motivo' IS NOT NULL
                              AND jsonb_typeof(form_data->'motivo') != 'null')
                    AS motivo_vals
            FROM service_requests
            WHERE workflow_code = $1
              AND form_data IS NOT NULL
              AND form_data != '{}'::jsonb
        """, workflow_code)

        filters: Dict[str, Any] = {}
        if rows:
            row = rows[0]
            if row["is_minor_vals"]:
                vals = json.loads(row["is_minor_vals"]) if isinstance(
                    row["is_minor_vals"], str
                ) else row["is_minor_vals"]
                if vals:
                    filters["is_minor"] = sorted(
                        set(vals), key=lambda x: str(x)
                    )
            if row["solicitud_type_vals"]:
                vals = json.loads(row["solicitud_type_vals"]) if isinstance(
                    row["solicitud_type_vals"], str
                ) else row["solicitud_type_vals"]
                if vals:
                    filters["solicitud_type"] = sorted(set(vals))
            if row["motivo_vals"]:
                vals = json.loads(row["motivo_vals"]) if isinstance(
                    row["motivo_vals"], str
                ) else row["motivo_vals"]
                if vals:
                    filters["motivo"] = sorted(set(vals))

        return filters

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
