"""
Service layer for the dashboard_registrations admin API (E1 phase 2 + Grafana E1).

Centralises:
- Cache strategy (Redis 5 min TTL, single key, invalidated on write)
- Backwards-compat env-var fallback (when the BD row is missing)
- Audit log emission for every write (in the same transaction as the UPSERT)
- Provider switch: Looker Studio vs Grafana iframe URL build

Memory rule #24: asyncpg expects a string for JSONB columns, not a dict —
hence `json.dumps(...)` before INSERTs into audit_logs.
Memory rule #14: cache invalidation goes through delete(), not TTL=0.
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any, Mapping, Optional
from urllib.parse import quote

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


# Grafana embed base URL — comes from env var so staging/prod can point at
# different Grafana workspaces without a code change.
# Default placeholder lets the model load without an env var (frontend
# renders "Grafana not configured" when the URL is None).
def _grafana_base_url() -> Optional[str]:
    return os.environ.get("GRAFANA_BASE_URL") or None


def _build_grafana_embed_url(
    *,
    uid: str,
    org_id: int,
    slug: Optional[str] = None,
    from_range: str = "now-90d",
    to_range: str = "now",
    theme: str = "light",
    kiosk: bool = True,
) -> Optional[str]:
    """Build a /d-solo Grafana embed URL.

    Format:
      https://<base>/d-solo/<uid>/<slug>?orgId=<n>&theme=<theme>&kiosk=tv&from=<x>&to=<y>

    Returns None if GRAFANA_BASE_URL is unset.
    """
    base = _grafana_base_url()
    if not base:
        return None
    base = base.rstrip("/")
    safe_uid = quote(uid, safe="-_")
    safe_slug = quote(slug or uid, safe="-_")
    parts = [
        f"orgId={org_id}",
        f"theme={theme}",
        f"from={from_range}",
        f"to={to_range}",
    ]
    if kiosk:
        parts.append("kiosk=tv")
    qs = "&".join(parts)
    return f"{base}/d-solo/{safe_uid}/{safe_slug}?{qs}"


def _build_looker_embed_url(
    *, report_id: str, page_id: Optional[str] = None
) -> str:
    """Build a Looker Studio /embed/reporting URL."""
    base = "https://lookerstudio.google.com/embed/reporting"
    if page_id:
        return f"{base}/{report_id}/page/{page_id}"
    return f"{base}/{report_id}"


def _row_to_audit_dict(row: Optional[asyncpg.Record]) -> Optional[dict[str, Any]]:
    """Serialise an asyncpg Record into a dict suitable for audit_logs.JSONB."""
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

    Returns (report_id, page_id), each as None when the env var is unset.
    """
    env_prefix = f"LOOKER_REPORTS_{dashboard_id.upper()}"
    report_id = os.environ.get(f"{env_prefix}_REPORT_ID") or None
    page_id = os.environ.get(f"{env_prefix}_PAGE_ID") or None
    return report_id, page_id


class DashboardConfigService:
    """Coordinates BD reads/writes + Redis cache + audit log + provider switch."""

    CACHE_KEY = "dashboard_configs:reports_v2"   # v2 = Grafana-aware payload
    CACHE_TTL_SECONDS = 300

    def __init__(self, pool: asyncpg.Pool, registry: Mapping[str, Mapping[str, str]]):
        self._pool = pool
        self._registry = registry

    # -- Public API --------------------------------------------------------

    async def get_public_reports_config(self) -> list[DashboardReportEntry]:
        """Power GET /reports-config — DB-first with env-var fallback.

        Returns a flat list compatible with the existing frontend shape.
        For dashboards using `provider='grafana'`, looker_report_id is
        omitted; the frontend uses provider+grafana_dashboard_uid to
        build the iframe URL.
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
                provider = row["provider"]
                report_id = row["looker_report_id"]
                page_id = row["looker_page_id"]
                grafana_uid = row["grafana_dashboard_uid"]
                grafana_org = row["grafana_org_id"] or 1
            else:
                provider = "looker_studio"
                report_id, page_id = _env_fallback(dashboard_id)
                grafana_uid = None
                grafana_org = 1
                if report_id is not None:
                    logger.warning(
                        "dashboard_config: env-var fallback used for {} — "
                        "consider populating dashboard_registrations row",
                        dashboard_id,
                    )

            # Backend-computed iframe URL from the active provider's config
            embed_url = self._compute_embed_url(
                provider=provider,
                looker_report_id=report_id,
                looker_page_id=page_id,
                grafana_dashboard_uid=grafana_uid,
                grafana_org_id=grafana_org,
                dashboard_id=dashboard_id,
            )

            entries.append(
                DashboardReportEntry(
                    dashboard_id=dashboard_id,
                    label=meta["label"],
                    description=meta["description"],
                    rls_mode=meta["rls_mode"],
                    provider=provider,
                    looker_report_id=report_id,
                    looker_page_id=page_id,
                    grafana_dashboard_uid=grafana_uid,
                    grafana_org_id=grafana_org,
                    embed_url=embed_url,
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
        """Power GET /admin/configs — full row + provenance label + computed embed URL."""
        async with self._pool.acquire() as conn:
            rows = await DashboardConfigRepository.list_all(conn)
        by_id = {r["dashboard_id"]: r for r in rows}

        configs: list[DashboardConfigDTO] = []
        for dashboard_id, meta in self._registry.items():
            row = by_id.get(dashboard_id)
            if row is not None:
                provider = row["provider"]
                embed_url = self._compute_embed_url(
                    provider=provider,
                    looker_report_id=row["looker_report_id"],
                    looker_page_id=row["looker_page_id"],
                    grafana_dashboard_uid=row["grafana_dashboard_uid"],
                    grafana_org_id=row["grafana_org_id"],
                    dashboard_id=dashboard_id,
                )
                configs.append(
                    DashboardConfigDTO(
                        dashboard_id=dashboard_id,
                        label=meta["label"],
                        description=meta["description"],
                        rls_mode=meta["rls_mode"],
                        provider=provider,
                        looker_report_id=row["looker_report_id"],
                        looker_page_id=row["looker_page_id"],
                        grafana_dashboard_uid=row["grafana_dashboard_uid"],
                        grafana_org_id=row["grafana_org_id"] or 1,
                        is_active=row["is_active"],
                        source="db",
                        embed_url=embed_url,
                        updated_by=str(row["updated_by"]) if row["updated_by"] else None,
                        updated_at=row["updated_at"],
                        created_at=row["created_at"],
                    )
                )
            else:
                report_id, page_id = _env_fallback(dashboard_id)
                source = "env_fallback" if report_id else "unset"
                embed_url = (
                    _build_looker_embed_url(report_id=report_id, page_id=page_id)
                    if report_id
                    else None
                )
                configs.append(
                    DashboardConfigDTO(
                        dashboard_id=dashboard_id,
                        label=meta["label"],
                        description=meta["description"],
                        rls_mode=meta["rls_mode"],
                        provider="looker_studio",  # default fallback
                        looker_report_id=report_id,
                        looker_page_id=page_id,
                        grafana_dashboard_uid=None,
                        grafana_org_id=1,
                        is_active=True,
                        source=source,
                        embed_url=embed_url,
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
        """Insert or update a row, emit an audit log, invalidate the cache."""
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
                    provider=update.provider,
                    looker_report_id=update.looker_report_id,
                    looker_page_id=update.looker_page_id,
                    grafana_dashboard_uid=update.grafana_dashboard_uid,
                    grafana_org_id=update.grafana_org_id,
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

        try:
            await get_cache().delete(self.CACHE_KEY)
        except Exception as cache_exc:  # pragma: no cover — defensive
            logger.warning(
                "dashboard_config: cache invalidate failed key={} err={}",
                self.CACHE_KEY,
                cache_exc,
            )

        meta = self._registry[dashboard_id]
        embed_url = self._compute_embed_url(
            provider=new_row["provider"],
            looker_report_id=new_row["looker_report_id"],
            looker_page_id=new_row["looker_page_id"],
            grafana_dashboard_uid=new_row["grafana_dashboard_uid"],
            grafana_org_id=new_row["grafana_org_id"],
            dashboard_id=dashboard_id,
        )
        return DashboardConfigDTO(
            dashboard_id=dashboard_id,
            label=meta["label"],
            description=meta["description"],
            rls_mode=meta["rls_mode"],
            provider=new_row["provider"],
            looker_report_id=new_row["looker_report_id"],
            looker_page_id=new_row["looker_page_id"],
            grafana_dashboard_uid=new_row["grafana_dashboard_uid"],
            grafana_org_id=new_row["grafana_org_id"] or 1,
            is_active=new_row["is_active"],
            source="db",
            embed_url=embed_url,
            updated_by=str(new_row["updated_by"]),
            updated_at=new_row["updated_at"],
            created_at=new_row["created_at"],
        )

    # -- Internals ---------------------------------------------------------

    def _compute_embed_url(
        self,
        *,
        provider: str,
        looker_report_id: Optional[str],
        looker_page_id: Optional[str],
        grafana_dashboard_uid: Optional[str],
        grafana_org_id: Optional[int],
        dashboard_id: str,
    ) -> Optional[str]:
        """Build the iframe src URL based on the active provider."""
        if provider == "grafana":
            if not grafana_dashboard_uid:
                return None
            return _build_grafana_embed_url(
                uid=grafana_dashboard_uid,
                org_id=grafana_org_id or 1,
                slug=dashboard_id,
            )
        # Default = looker_studio
        if not looker_report_id:
            return None
        return _build_looker_embed_url(
            report_id=looker_report_id, page_id=looker_page_id
        )
