"""
Service layer for the dashboard_registrations admin API (E1 phase 2).

Centralises:
- Cache strategy (Redis 5 min TTL, single key, invalidated on write)
- Backwards-compat env-var fallback (when the BD row is missing)
- Audit log emission for every write (in the same transaction as the UPSERT)

Memory rule #24: asyncpg expects a string for JSONB columns, not a dict —
hence `json.dumps(...)` before INSERTs into audit_logs.
Memory rule #14: cache invalidation goes through delete(), not TTL=0.
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any, Mapping, Optional

import asyncpg
from fastapi import Request
from loguru import logger

from app.core.cache import get_cache
from app.modules.dashboards.models import (
    DashboardConfigDTO,
    DashboardConfigUpdateRequest,
    DashboardReportEntry,
)
from app.modules.dashboards.repositories import DashboardConfigRepository
from app.modules.dashboards.services.dashboards_service import DashboardNotFoundError


def _row_to_audit_dict(row: Optional[asyncpg.Record]) -> Optional[dict[str, Any]]:
    """Serialise an asyncpg Record into a dict suitable for audit_logs.JSONB.

    Datetimes -> ISO strings, UUIDs -> str. Returns None if row is None
    (e.g. there was no previous row for an INSERT).
    """
    if row is None:
        return None
    out: dict[str, Any] = {}
    for k, v in row.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        elif v is None:
            out[k] = None
        else:
            out[k] = str(v) if not isinstance(v, (str, int, float, bool)) else v
    return out


def _env_fallback(dashboard_id: str) -> tuple[Optional[str], Optional[str]]:
    """Read the legacy LOOKER_REPORTS_<id>_REPORT_ID/_PAGE_ID env vars.

    Returns (report_id, page_id), each as None when the env var is unset
    or empty. Used as backward-compat when the BD row is missing.
    """
    env_prefix = f"LOOKER_REPORTS_{dashboard_id.upper()}"
    report_id = os.environ.get(f"{env_prefix}_REPORT_ID") or None
    page_id = os.environ.get(f"{env_prefix}_PAGE_ID") or None
    return report_id, page_id


class DashboardConfigService:
    """Coordinates BD reads/writes + Redis cache + audit log for dashboard_registrations."""

    CACHE_KEY = "dashboard_configs:reports_v1"
    CACHE_TTL_SECONDS = 300  # 5 min — configs change at most monthly

    def __init__(self, pool: asyncpg.Pool, registry: Mapping[str, Mapping[str, str]]):
        """
        Args:
            pool: shared asyncpg pool from app.database.connection.
            registry: in-code metadata per dashboard_id (label, description,
                rls_mode). Owned by routes._REPORTS_METADATA.
        """
        self._pool = pool
        self._registry = registry

    # -- Public API --------------------------------------------------------

    async def get_public_reports_config(self) -> list[DashboardReportEntry]:
        """Power GET /reports-config — DB-first with env-var fallback.

        Caches the *list of dicts* (not the Pydantic models) under a single
        key for cross-process compatibility. The payload is small (<2 KB
        for 3 entries) so a single key is fine — no risk of stampede at
        5 min TTL.
        """
        cache = get_cache()
        cached = await cache.get(self.CACHE_KEY)
        if cached is not None:
            try:
                return [DashboardReportEntry(**r) for r in cached]
            except Exception as exc:  # pragma: no cover — defensive
                logger.warning(
                    "dashboard_config: stale cache shape, refilling — err={}", exc
                )

        async with self._pool.acquire() as conn:
            rows = await DashboardConfigRepository.list_active(conn)
        by_id = {r["dashboard_id"]: r for r in rows}

        entries: list[DashboardReportEntry] = []
        for dashboard_id, meta in self._registry.items():
            row = by_id.get(dashboard_id)
            if row is not None:
                report_id = row["looker_report_id"]
                page_id = row["looker_page_id"]
            else:
                report_id, page_id = _env_fallback(dashboard_id)
                if report_id is not None:
                    logger.warning(
                        "dashboard_config: env-var fallback used for {} — "
                        "consider populating dashboard_registrations row",
                        dashboard_id,
                    )
            entries.append(
                DashboardReportEntry(
                    dashboard_id=dashboard_id,
                    label=meta["label"],
                    description=meta["description"],
                    rls_mode=meta["rls_mode"],
                    looker_report_id=report_id,
                    looker_page_id=page_id,
                )
            )

        try:
            await cache.set(
                self.CACHE_KEY,
                [e.model_dump() for e in entries],
                ttl=self.CACHE_TTL_SECONDS,
            )
        except Exception as cache_exc:  # pragma: no cover — defensive
            logger.warning(
                "dashboard_config: cache write failed key={} err={}",
                self.CACHE_KEY,
                cache_exc,
            )
        return entries

    async def list_admin_configs(self) -> list[DashboardConfigDTO]:
        """Power GET /admin/configs — full row + provenance label.

        No cache here: admin page is low-traffic and admins want fresh
        state right after a PUT. The /reports-config cache is the hot path.
        """
        async with self._pool.acquire() as conn:
            rows = await DashboardConfigRepository.list_all(conn)
        by_id = {r["dashboard_id"]: r for r in rows}

        configs: list[DashboardConfigDTO] = []
        for dashboard_id, meta in self._registry.items():
            row = by_id.get(dashboard_id)
            if row is not None:
                configs.append(
                    DashboardConfigDTO(
                        dashboard_id=dashboard_id,
                        label=meta["label"],
                        description=meta["description"],
                        rls_mode=meta["rls_mode"],
                        looker_report_id=row["looker_report_id"],
                        looker_page_id=row["looker_page_id"],
                        is_active=row["is_active"],
                        source="db",
                        updated_by=str(row["updated_by"]) if row["updated_by"] else None,
                        updated_at=row["updated_at"],
                        created_at=row["created_at"],
                    )
                )
            else:
                report_id, page_id = _env_fallback(dashboard_id)
                source = "env_fallback" if report_id else "unset"
                configs.append(
                    DashboardConfigDTO(
                        dashboard_id=dashboard_id,
                        label=meta["label"],
                        description=meta["description"],
                        rls_mode=meta["rls_mode"],
                        looker_report_id=report_id,
                        looker_page_id=page_id,
                        is_active=True,
                        source=source,
                    )
                )
        return configs

    async def upsert_config(
        self,
        dashboard_id: str,
        update: DashboardConfigUpdateRequest,
        *,
        user_id: str,
        request: Optional[Request] = None,
    ) -> DashboardConfigDTO:
        """Insert or update a row, emit an audit log, invalidate the cache.

        UPSERT and audit_log are wrapped in a single transaction so a
        failure on either rolls back the other. Cache invalidation
        happens *after* commit (otherwise a concurrent reader could
        re-fill the cache with the old payload before we delete it).

        Raises:
            DashboardNotFoundError: dashboard_id is not in the registry.
            asyncpg.CheckViolationError: regex CHECK rejected the input
                (should be unreachable because Pydantic validates first,
                but we keep defense in depth).
        """
        if dashboard_id not in self._registry:
            raise DashboardNotFoundError(
                f"Unknown dashboard_id '{dashboard_id}'. "
                f"Registered: {list(self._registry.keys())}."
            )

        ip = request.client.host if request and request.client else None
        ua = request.headers.get("user-agent") if request else None

        async with self._pool.acquire() as conn:
            async with conn.transaction():
                old_row = await DashboardConfigRepository.get_by_id(conn, dashboard_id)
                new_row = await DashboardConfigRepository.upsert(
                    conn,
                    dashboard_id=dashboard_id,
                    looker_report_id=update.looker_report_id,
                    looker_page_id=update.looker_page_id,
                    is_active=update.is_active,
                    updated_by=user_id,
                )
                old_dict = _row_to_audit_dict(old_row)
                new_dict = _row_to_audit_dict(new_row)
                await conn.execute(
                    """
                    INSERT INTO audit_logs (
                        user_id, entity_type, entity_id, action,
                        old_values, new_values, ip_address, user_agent,
                        created_at
                    )
                    VALUES (
                        $1::uuid, 'dashboard_config', $2,
                        'dashboard.config_update',
                        $3::jsonb, $4::jsonb, $5, $6, NOW()
                    )
                    """,
                    user_id,
                    dashboard_id,
                    json.dumps(old_dict) if old_dict is not None else None,
                    json.dumps(new_dict),
                    ip,
                    ua,
                )

        # Invalidate AFTER commit to avoid races where a reader refills
        # the cache with the old state between our delete and the commit.
        try:
            await get_cache().delete(self.CACHE_KEY)
        except Exception as cache_exc:  # pragma: no cover — defensive
            logger.warning(
                "dashboard_config: cache invalidate failed key={} err={}",
                self.CACHE_KEY,
                cache_exc,
            )

        meta = self._registry[dashboard_id]
        return DashboardConfigDTO(
            dashboard_id=dashboard_id,
            label=meta["label"],
            description=meta["description"],
            rls_mode=meta["rls_mode"],
            looker_report_id=new_row["looker_report_id"],
            looker_page_id=new_row["looker_page_id"],
            is_active=new_row["is_active"],
            source="db",
            updated_by=str(new_row["updated_by"]),
            updated_at=new_row["updated_at"],
            created_at=new_row["created_at"],
        )
