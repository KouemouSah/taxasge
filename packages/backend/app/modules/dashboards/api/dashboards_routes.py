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

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger

from app.core.cache import get_cache
from app.database.connection import get_db_pool
from app.modules.auth.dependencies import get_current_user
from app.modules.dashboards.models import (
    DashboardDataResponse,
    DashboardPingResponse,
    DashboardSchemaResponse,
)
from app.modules.dashboards.services import (
    DashboardAccessDenied,
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


# ---------------------------------------------------------------------------
# Routes
#
# Auth: standard Bearer JWT via app.modules.auth.dependencies.get_current_user.
# The Apps Script connector posts the JWT as the Bearer token (its USER_PASS
# `password` field is filled with the JWT). B.2 will switch the connector
# to OAUTH2, the backend dependency stays the same.
# ---------------------------------------------------------------------------


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
    dashboard_id: str,
    fields: Optional[str] = Query(
        None,
        description="CSV list of field names to return. Defaults to all schema fields.",
    ),
    start_date: Optional[date] = Query(None, description="Inclusive lower bound on the date column."),
    end_date: Optional[date] = Query(None, description="Inclusive upper bound on the date column."),
    user=Depends(get_current_user),
):
    pool = await get_db_pool()
    # B.2a — resolve user → access context BEFORE touching the data MV. Two
    # benefits: (1) 403 on forbidden roles before any SQL load, (2) the WHERE
    # clause built downstream is always anchored to a verified ministry list.
    access = await resolve_user_access(
        pool,
        user_id=str(getattr(user, "id", "")),
        user_role=getattr(user, "role", None),
    )
    if not access.has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "No active agent profile with a ministry assignment. "
                "Contact an admin to provision your dashboard access."
            ),
        )

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
        # Audit log (Sentry breadcrumb-friendly) — B.3 will replace with a
        # row in audit_logs table (proper queryable trail).
        logger.info(
            "dashboards.get_data ok dashboard={} user={} access={} rows={} filters={}",
            dashboard_id,
            getattr(user, "email", "unknown"),
            access.describe(),
            result.row_count,
            result.filters_applied,
        )
        return result
    except DashboardNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except DashboardAccessDenied as exc:
        # Should be caught by the early has_access check above, but if a
        # downstream guard re-raises (e.g. multi-ministry user lost access
        # mid-request), surface as 403 not 500.
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
