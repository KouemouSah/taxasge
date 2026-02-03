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
import logging

from app.modules.menu_config.models.menu_config import (
    WorkflowDisplayConfigCreate,
    WorkflowDisplayConfigUpdate,
)
from app.core.cache import get_cache, CacheKeys

logger = logging.getLogger(__name__)

DISPLAY_CONFIG_CACHE_TTL = 300  # 5 minutes


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
        updated = _row_to_dict(result)

        # Invalidate cache for this workflow_code
        if updated and updated.get('workflow_code'):
            await self.invalidate_cache(updated['workflow_code'])

        return updated

    async def delete(self, config_id: int) -> bool:
        """
        Delete a display config

        Args:
            config_id: Config ID

        Returns:
            True if deleted, False if not found
        """
        # Fetch workflow_code before deleting (for cache invalidation)
        existing = await self.db.fetchval(
            "SELECT workflow_code FROM workflow_display_config WHERE id = $1",
            config_id,
        )

        result = await self.db.execute("""
            DELETE FROM workflow_display_config
            WHERE id = $1
        """, config_id)

        deleted = "DELETE 1" in result
        if deleted and existing:
            await self.invalidate_cache(existing)

        return deleted

    async def find_config_for_workflow(
        self,
        workflow_code: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find the display config for an exact workflow code.
        Uses Redis cache (5 min TTL) to avoid repeated DB queries
        when agents navigate multiple requests of the same workflow.

        Args:
            workflow_code: Exact workflow code (e.g., 'PASAPORTE_EXPEDICION_ADULTO')

        Returns:
            Matching config dict or None
        """
        cache = get_cache()
        cache_key = CacheKeys.display_config(workflow_code)

        # Try cache first
        try:
            cached = await cache.get(cache_key)
            if cached is not None:
                # "__none__" marker means we cached a "not found" result
                if isinstance(cached, dict) and cached.get("__none__"):
                    return None
                return cached
        except Exception:
            pass  # Cache miss or error, fall through to DB

        # DB lookup
        result = await self.db.fetchrow("""
            SELECT id, workflow_code, list_columns, preview_sections, labels,
                   is_active, created_at, updated_at
            FROM workflow_display_config
            WHERE is_active = true
              AND workflow_code = $1
              AND deleted_at IS NULL
        """, workflow_code)

        config = _row_to_dict(result)

        # Cache result (even None as empty dict marker)
        try:
            await cache.set(
                cache_key,
                config if config else {"__none__": True},
                ttl=DISPLAY_CONFIG_CACHE_TTL,
            )
        except Exception:
            pass

        return config

    @staticmethod
    async def invalidate_cache(workflow_code: str) -> None:
        """Invalidate cached display config for a workflow code."""
        try:
            cache = get_cache()
            await cache.delete(CacheKeys.display_config(workflow_code))
        except Exception:
            pass

    # Technical fields excluded from column discovery
    TECHNICAL_FIELDS = frozenset({
        'sub_type', 'is_minor', 'solicitud_type', 'motivo',
    })

    # Nested objects with no useful data (always empty or non-relevant)
    EXCLUDED_NESTED_OBJECTS = frozenset({
        'photo_carnet',
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
                f"UPPER(sr.form_data->>'solicitud_type') = UPPER(${param_idx})"
            )
            params.append(solicitud_type)

        if motivo is not None:
            param_idx += 1
            where_clauses.append(
                f"UPPER(sr.form_data->>'motivo') = UPPER(${param_idx})"
            )
            params.append(motivo)

        where_sql = " AND ".join(where_clauses)

        # Count total matching requests
        total = await self.db.fetchval(
            f"SELECT COUNT(*) FROM service_requests sr WHERE {where_sql}",
            *params,
        )

        # Discover columns with flattening of nested objects (2 levels)
        # Uses a sampled subset (latest 200 requests) for performance.
        # DEDUPLICATION: nested keys that already exist at root level are excluded
        # from their nested group (e.g., dip.apellidos is hidden if root apellidos exists).
        # This ensures each piece of data appears only once in the admin UI.
        rows = await self.db.fetch(f"""
            WITH sampled_requests AS (
                SELECT sr.form_data
                FROM service_requests sr
                WHERE {where_sql}
                ORDER BY sr.created_at DESC
                LIMIT 200
            ),
            -- Collect all root-level scalar keys (for deduplication)
            root_keys AS (
                SELECT DISTINCT kv.key AS root_key
                FROM sampled_requests sr,
                     jsonb_each(sr.form_data) AS kv(key, value)
                WHERE jsonb_typeof(kv.value) NOT IN ('object', 'array')
                  AND kv.key NOT IN ('sub_type', 'is_minor', 'solicitud_type', 'motivo')
            ),
            flat_keys AS (
                -- Level 1: root-level scalar fields
                SELECT
                    kv.key AS col_key,
                    kv.value AS col_value
                FROM sampled_requests sr,
                     jsonb_each(sr.form_data) AS kv(key, value)
                WHERE jsonb_typeof(kv.value) NOT IN ('object', 'array')
                  AND kv.key NOT IN ('sub_type', 'is_minor', 'solicitud_type', 'motivo')

                UNION ALL

                -- Level 2: nested object fields, EXCLUDING keys already at root
                SELECT
                    parent.key || '.' || child.key AS col_key,
                    child.value AS col_value
                FROM sampled_requests sr,
                     jsonb_each(sr.form_data) AS parent(key, value),
                     jsonb_each(parent.value) AS child(key, value)
                WHERE jsonb_typeof(parent.value) = 'object'
                  AND jsonb_typeof(child.value) NOT IN ('object', 'array')
                  AND parent.key NOT IN ('sub_type', 'is_minor', 'solicitud_type', 'motivo', 'photo_carnet')
                  -- DEDUP: skip nested keys that duplicate a root-level key
                  AND NOT EXISTS (
                      SELECT 1 FROM root_keys rk WHERE rk.root_key = child.key
                  )
            )
            SELECT
                grouped.col_key,
                grouped.sample_count,
                CASE
                    WHEN jsonb_typeof(grouped.first_val) = 'number' THEN 'number'
                    WHEN jsonb_typeof(grouped.first_val) = 'boolean' THEN 'boolean'
                    WHEN grouped.first_val::text ~ '"[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' THEN 'date'
                    ELSE 'string'
                END AS data_type
            FROM (
                SELECT
                    col_key,
                    COUNT(*) AS sample_count,
                    (array_agg(col_value ORDER BY col_value::text DESC)
                        FILTER (WHERE col_value IS NOT NULL AND jsonb_typeof(col_value) != 'null')
                    )[1] AS first_val
                FROM flat_keys
                GROUP BY col_key
            ) grouped
            ORDER BY grouped.sample_count DESC, grouped.col_key
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

        # Compute suggested columns: extracted columns with >= 50% coverage
        # (present in at least half of sampled requests), limited to top 10
        total_count = total or 0
        sampled_count = min(total_count, 200)  # We sampled at most 200
        threshold = max(sampled_count * 0.5, 1)  # At least 50% coverage
        suggested_columns = [
            col["id"]
            for col in extracted_columns
            if col["sample_count"] >= threshold
        ][:10]  # Cap at 10 suggestions

        return {
            "total_requests": total_count,
            "extracted_columns": extracted_columns,
            "filters_applied": filters_applied if filters_applied else None,
            "available_filters": available_filters,
            "suggested_columns": suggested_columns,
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
        # Use ->> (text extraction) for consistent Python types
        # and array_agg(DISTINCT ...) for deduplication
        row = await self.db.fetchrow("""
            SELECT
                array_agg(DISTINCT form_data->>'is_minor')
                    FILTER (WHERE form_data ? 'is_minor'
                              AND form_data->>'is_minor' IS NOT NULL
                              AND form_data->>'is_minor' != '')
                    AS is_minor_vals,
                array_agg(DISTINCT form_data->>'solicitud_type')
                    FILTER (WHERE form_data ? 'solicitud_type'
                              AND form_data->>'solicitud_type' IS NOT NULL
                              AND form_data->>'solicitud_type' != '')
                    AS solicitud_type_vals,
                array_agg(DISTINCT form_data->>'motivo')
                    FILTER (WHERE form_data ? 'motivo'
                              AND form_data->>'motivo' IS NOT NULL
                              AND form_data->>'motivo' != '')
                    AS motivo_vals
            FROM service_requests
            WHERE workflow_code = $1
              AND form_data IS NOT NULL
              AND form_data != '{}'::jsonb
        """, workflow_code)

        filters: Dict[str, Any] = {}
        if row:
            # is_minor: convert text "true"/"false" to Python booleans
            if row["is_minor_vals"]:
                filters["is_minor"] = sorted(
                    {v.lower() == 'true' for v in row["is_minor_vals"] if v},
                    key=lambda x: str(x),
                )
            # solicitud_type: already text strings
            if row["solicitud_type_vals"]:
                filters["solicitud_type"] = sorted(
                    v for v in row["solicitud_type_vals"] if v
                )
            # motivo: already text strings
            if row["motivo_vals"]:
                filters["motivo"] = sorted(
                    v for v in row["motivo_vals"] if v
                )

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
