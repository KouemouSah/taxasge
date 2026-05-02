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

from app.database.connection import get_db_pool
from app.modules.auth.dependencies import get_current_user
from app.modules.dashboards.models import (
    DashboardDataResponse,
    DashboardPingResponse,
    DashboardSchemaResponse,
)
from app.modules.dashboards.services import (
    DashboardNotFoundError,
    DashboardsService,
)

router = APIRouter()


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
    return DashboardPingResponse(
        user_email=getattr(user, "email", "unknown"),
        user_id=str(getattr(user, "id", "unknown")),
        role=getattr(user, "role", None),
        ministry_id=None,  # B.2 will resolve from agent_profiles
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
    svc = DashboardsService(pool)
    try:
        field_list = [f.strip() for f in fields.split(",") if f.strip()] if fields else None
        result = await svc.get_data(
            dashboard_id,
            fields=field_list,
            start_date=start_date,
            end_date=end_date,
        )
        # Audit log (Sentry breadcrumb-friendly) — B.2 will replace with proper audit_log row.
        logger.info(
            "dashboards.get_data ok dashboard={} user={} rows={} filters={}",
            dashboard_id,
            getattr(user, "email", "unknown"),
            result.row_count,
            result.filters_applied,
        )
        return result
    except DashboardNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
