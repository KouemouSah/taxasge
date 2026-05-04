"""
Dashboards API routes — Looker Studio Community Connector backend.

Phase B.1 skeleton:
- Auth: standard Bearer JWT (the connector posts JWT in X-Facil-Api-Key header,
  we accept it as Bearer token transparently). B.2 will switch to OAUTH2.
- Endpoints:
    GET /api/v1/dashboards/_ping              — connector health check
    GET /api/v1/dashboards/{id}/schema        — Looker schema for dashboard
    GET /api/v1/dashboards/{id}/data          — Looker data rows for dashboard

NO RLS in this phase. B.2 will add `WHERE ministry_id = user.ministry_id`
when the JWT subject is not admin / treasury_supervisor.
"""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from loguru import logger

import json
import time

from app.core.cache import check_rate_limit, get_cache
from app.database.connection import get_db_pool
from app.modules.auth.dependencies import get_current_user

# Sentry — soft import so the module loads even when sentry-sdk is not
# installed (e.g. test environments). All set_tag/set_user calls become
# no-ops.
try:
    import sentry_sdk
    _SENTRY_AVAILABLE = True
except Exception:
    sentry_sdk = None  # type: ignore[assignment]
    _SENTRY_AVAILABLE = False
from app.modules.dashboards.models import (
    DashboardConfigDTO,
    DashboardConfigUpdateRequest,
    DashboardConfigsListResponse,
    DashboardDataResponse,
    DashboardPingResponse,
    DashboardReportEntry,
    DashboardReportsConfigResponse,
    DashboardSchemaResponse,
)
from app.modules.permissions.middleware.permission_middleware import permission_required
from app.modules.dashboards.services import (
    DashboardAccessDenied,
    DashboardConfigService,
    DashboardNotFoundError,
    DashboardsService,
    resolve_user_access,
)

router = APIRouter()

# Server-side TTL for /dashboards/{id}/data responses. Combined with the
# 5-min user-scoped cache in the Apps Script connector (Q5 default), this
# bounds backend load to ~1 query per user per dashboard per minute even
# under aggressive Looker refresh. Cache key includes user_id so two
# distinct ministry agents do NOT share entries.
_DATA_CACHE_TTL_SECONDS = 60

# Rate limit: 60 read requests per minute per user across all dashboard
# endpoints. With the 5-min connector-side cache + 60s server-side cache,
# real traffic should never approach this — but we cap so a misbehaving
# script can't drown the backend. 429 surfaced to the connector with a
# Retry-After header.
_RATE_LIMIT_REQUESTS = 60
_RATE_LIMIT_WINDOW_SECONDS = 60


def _set_sentry_context(user, dashboard_id: Optional[str], access_label: Optional[str]):
    """Tag every Sentry event raised inside a dashboard request with
    enough context to debug RLS / dashboard issues without grepping logs.
    No-op when sentry-sdk is not installed.
    """
    if not _SENTRY_AVAILABLE:
        return
    try:
        sentry_sdk.set_user({
            "id": str(getattr(user, "id", "unknown")),
            "role": getattr(user, "role", None) or "unknown",
        })
        if dashboard_id:
            sentry_sdk.set_tag("dashboard_id", dashboard_id)
        if access_label:
            sentry_sdk.set_tag("dashboard_access", access_label)
    except Exception:
        # Sentry init can be partial in CI / forks — never let a tag call
        # crash the request.
        pass


async def _record_audit(
    pool,
    *,
    user_id: str,
    dashboard_id: str,
    access_describe: str,
    row_count: int,
    filters_applied: list,
    request: Request,
    latency_ms: int,
) -> None:
    """Insert one row into audit_logs for traceability. Best-effort —
    a failure here is logged but does NOT break the response.
    """
    payload = {
        "row_count": row_count,
        "filters_applied": filters_applied,
        "access": access_describe,
        "latency_ms": latency_ms,
    }
    ip = request.client.host if request and request.client else None
    ua = request.headers.get("user-agent") if request else None
    try:
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO audit_logs (
                    user_id, entity_type, entity_id, action,
                    old_values, new_values, ip_address, user_agent,
                    created_at
                )
                VALUES ($1, 'dashboard', $2, 'dashboard.read',
                        NULL, $3::jsonb, $4, $5, NOW())
                """,
                user_id,
                dashboard_id,
                json.dumps(payload),     # asyncpg expects str for JSONB (Memory rule #24)
                ip,
                ua,
            )
    except Exception as exc:
        logger.warning(
            "dashboards.audit_log write failed user={} dashboard={} err={}",
            user_id, dashboard_id, exc,
        )


# ---------------------------------------------------------------------------
# Routes
#
# Auth: standard Bearer JWT via app.modules.auth.dependencies.get_current_user.
# The Apps Script connector posts the JWT as the Bearer token (its USER_PASS
# `password` field is filled with the JWT). B.2 will switch the connector
# to OAUTH2, the backend dependency stays the same.
# ---------------------------------------------------------------------------


# Static metadata for the 3 dashboards we ship in B.3. Looker report IDs
# come from env vars so the same code points at staging vs prod reports
# without redeploying.
_REPORTS_METADATA = {
    "recaudacion": {
        "label": "Recaudación Fiscal",
        "description": "Treasury KPIs — daily revenue by entity, ministry, payment method, workflow.",
        "rls_mode": "entity",
    },
    "agentes": {
        "label": "Performance Agentes",
        "description": "Daily workload per agent — approved, rejected, p50 duration, SLA breaches.",
        "rls_mode": "agent_via_join",
    },
    "services": {
        "label": "Catálogo de Servicios",
        "description": "Reference catalog of fiscal services — multilingual, traffic counters.",
        "rls_mode": "public",
    },
}


@router.get(
    "/reports-config",
    response_model=DashboardReportsConfigResponse,
    summary="List of embeddable Looker reports the caller is authorised to see",
)
async def get_reports_config(
    user=Depends(get_current_user),
    _perm: None = Depends(permission_required("dashboards.view_business")),
):
    """Power the Next.js /admin/dashboards landing page.

    The route gates on the `dashboards.view_business` permission seeded
    by migration 316. Anyone without it gets 403 from the dependency
    BEFORE we touch the BD.

    E1 phase 2 refactor: the report_id / page_id mapping is now read from
    the `dashboard_registrations` table (migration 317) — admins edit it
    via /admin/dashboards/config, no redeploy required. Backwards-compat
    fallback to LOOKER_REPORTS_<id>_REPORT_ID env vars when the BD row is
    missing (e.g. fresh deploy where admins haven't populated the table
    yet). Empty strings are still returned for dashboards with no source.

    Hot path: cached server-side 5 min via DashboardConfigService.
    """
    pool = await get_db_pool()
    svc = DashboardConfigService(pool, _REPORTS_METADATA)
    entries = await svc.get_public_reports_config()
    return DashboardReportsConfigResponse(reports=entries)


@router.get(
    "/admin/configs",
    response_model=DashboardConfigsListResponse,
    summary="Admin-only list of dashboard configs (BD row + provenance)",
)
async def list_admin_dashboard_configs(
    user=Depends(get_current_user),
    _perm: None = Depends(permission_required("dashboards.manage")),
):
    """Power the admin /admin/dashboards/config page (E1 phase 3).

    Returns one entry per dashboard in the registry with its current
    Looker IDs and a `source` label:
      - "db"           → row in dashboard_registrations
      - "env_fallback" → no row, env var is set (legacy mode)
      - "unset"        → no row, no env var (UI shows "configurer")
    """
    pool = await get_db_pool()
    svc = DashboardConfigService(pool, _REPORTS_METADATA)
    configs = await svc.list_admin_configs()
    return DashboardConfigsListResponse(configs=configs)


@router.put(
    "/admin/configs/{dashboard_id}",
    response_model=DashboardConfigDTO,
    summary="Admin-only upsert of one dashboard's Looker config",
)
async def upsert_admin_dashboard_config(
    request: Request,
    dashboard_id: str,
    update: DashboardConfigUpdateRequest,
    user=Depends(get_current_user),
    _perm: None = Depends(permission_required("dashboards.manage")),
):
    """UPSERT a single dashboard's Looker IDs and immediately invalidate
    the public /reports-config cache so the change takes effect right
    away (no redeploy).

    OWASP / 1M+ guards:
    - permission_required('dashboards.manage')      → admin/super_admin only
    - rate limit 10 PUT/min/user                     → vs 60 read/min
    - Pydantic regex on report_id / page_id          → 422 on invalid input
    - dashboard_id validated against registry        → 404 on unknown
    - audit_logs row emitted in the same transaction as the UPSERT
    """
    user_id = str(getattr(user, "id", ""))

    is_allowed, _remaining = await check_rate_limit(
        identifier=user_id,
        endpoint="/dashboards/admin/configs",
        max_requests=10,
        window_seconds=60,
    )
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded: 10 PUT requests / 60s.",
            headers={"Retry-After": "60"},
        )

    pool = await get_db_pool()
    svc = DashboardConfigService(pool, _REPORTS_METADATA)
    try:
        return await svc.upsert_config(
            dashboard_id, update, user_id=user_id, request=request,
        )
    except DashboardNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get(
    "/_ping",
    response_model=DashboardPingResponse,
    summary="Connector health-check — returns the authenticated user identity",
)
async def ping(user=Depends(get_current_user)):
    pool = await get_db_pool()
    ctx = await resolve_user_access(
        pool,
        user_id=str(getattr(user, "id", "")),
        user_role=getattr(user, "role", None),
    )
    _set_sentry_context(user, None, ctx.describe())
    # If the user can read 0 ministries AND isn't staff → connector should
    # surface auth failure, not silent zero-row dashboards.
    if not ctx.has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Your account is authenticated but has no agent profile with "
                "an active ministry assignment. Dashboard access is reserved "
                "to staff (admin) and ministry agents."
            ),
        )
    # Expose the first ministry id as a hint when present; otherwise None.
    # The connector mainly checks the response is 200; the precise scope
    # (entity vs ministry) lives in the audit log (loguru info on get_data).
    primary_ministry = ctx.ministry_ids[0] if ctx.ministry_ids else None
    return DashboardPingResponse(
        user_email=getattr(user, "email", "unknown"),
        user_id=ctx.user_id,
        role=ctx.user_role or None,
        ministry_id=primary_ministry,
    )


@router.get(
    "/{dashboard_id}/schema",
    response_model=DashboardSchemaResponse,
    summary="Looker Studio schema for the requested dashboard",
)
async def get_schema(
    dashboard_id: str,
    user=Depends(get_current_user),
):
    pool = await get_db_pool()
    svc = DashboardsService(pool)
    try:
        return svc.get_schema(dashboard_id)
    except DashboardNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get(
    "/{dashboard_id}/data",
    response_model=DashboardDataResponse,
    summary="Looker Studio data rows for the requested dashboard",
)
async def get_data(
    request: Request,
    dashboard_id: str,
    fields: Optional[str] = Query(
        None,
        description="CSV list of field names to return. Defaults to all schema fields.",
    ),
    start_date: Optional[date] = Query(None, description="Inclusive lower bound on the date column."),
    end_date: Optional[date] = Query(None, description="Inclusive upper bound on the date column."),
    user=Depends(get_current_user),
):
    started_at = time.monotonic()
    pool = await get_db_pool()
    user_id = str(getattr(user, "id", ""))

    # B.3 — rate limit BEFORE any DB call. 60 req/min/user/all-dashboards.
    is_allowed, _remaining = await check_rate_limit(
        identifier=user_id,
        endpoint="/dashboards/data",
        max_requests=_RATE_LIMIT_REQUESTS,
        window_seconds=_RATE_LIMIT_WINDOW_SECONDS,
    )
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {_RATE_LIMIT_REQUESTS} requests / {_RATE_LIMIT_WINDOW_SECONDS}s.",
            headers={"Retry-After": str(_RATE_LIMIT_WINDOW_SECONDS)},
        )

    # B.2a — resolve user → access context BEFORE touching the data MV. Two
    # benefits: (1) 403 on forbidden roles before any SQL load, (2) the WHERE
    # clause built downstream is always anchored to a verified entity list.
    access = await resolve_user_access(
        pool,
        user_id=user_id,
        user_role=getattr(user, "role", None),
    )
    _set_sentry_context(user, dashboard_id, access.describe())

    # Per-dashboard RLS modes (entity / agent_via_join / admin_only / public)
    # are enforced inside svc.get_data via DashboardsService._enforce_rls_gate.
    # We do NOT raise an early 403 here because some dashboards (rls_mode=
    # public) accept any authenticated user — checking has_access too early
    # would reject citizens from a legitimate public catalog read.

    svc = DashboardsService(pool)
    try:
        field_list = [f.strip() for f in fields.split(",") if f.strip()] if fields else None

        # B.2a — server-side cache (60s) keyed by user_id so RLS results never
        # leak across users. Connector also caches 5 min user-scoped (Code.gs).
        # Combined upper bound: 1 backend query / user / dashboard / minute.
        cache = get_cache()
        cache_key = "dashboards:{0}:{1}:{2}:{3}:{4}".format(
            access.user_id,
            dashboard_id,
            start_date.isoformat() if start_date else "_",
            end_date.isoformat() if end_date else "_",
            ",".join(field_list) if field_list else "*",
        )
        cached_payload = await cache.get(cache_key)
        if cached_payload is not None:
            logger.debug(
                "dashboards.get_data cache_hit dashboard={} user={}",
                dashboard_id, access.user_id,
            )
            return DashboardDataResponse.model_validate(cached_payload)

        result = await svc.get_data(
            dashboard_id,
            access=access,
            fields=field_list,
            start_date=start_date,
            end_date=end_date,
        )
        # Cache the dict form (model_dump with by_alias=True so the cached
        # payload reads back identically through model_validate on the next
        # hit). model_dump's exclude_none=False to keep deterministic shape.
        try:
            await cache.set(
                cache_key,
                result.model_dump(by_alias=True, mode="json"),
                ttl=_DATA_CACHE_TTL_SECONDS,
            )
        except Exception as cache_exc:
            logger.warning(
                "dashboards.get_data cache_write_failed key={} err={}",
                cache_key, cache_exc,
            )
        # B.3 — proper audit_logs row (queryable, JSONB metadata) replacing
        # the prior loguru.info breadcrumb. Best-effort: a write failure
        # logs a warning but never breaks the response.
        latency_ms = int((time.monotonic() - started_at) * 1000)
        await _record_audit(
            pool,
            user_id=user_id,
            dashboard_id=dashboard_id,
            access_describe=access.describe(),
            row_count=result.row_count,
            filters_applied=result.filters_applied,
            request=request,
            latency_ms=latency_ms,
        )
        logger.info(
            "dashboards.get_data ok dashboard={} user={} access={} rows={} latency={}ms",
            dashboard_id,
            getattr(user, "email", "unknown"),
            access.describe(),
            result.row_count,
            latency_ms,
        )
        return result
    except DashboardNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except DashboardAccessDenied as exc:
        # Should be caught by the early has_access check above, but if a
        # downstream guard re-raises (e.g. multi-ministry user lost access
        # mid-request), surface as 403 not 500.
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
