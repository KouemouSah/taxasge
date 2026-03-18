"""Company Dashboard Routes — Stats endpoints for dashboards.

Endpoints:
  GET /dashboard/zone-stats          — Admin: all zones (choropleth map)
  GET /dashboard/zone-stats/mine     — Supervisor site: my zone only
  GET /dashboard/ministry-stats      — Supervisor ministry: all zones, my items
  GET /dashboard/global-stats        — Admin: single-row overview
  POST /cron/refresh-company-stats   — Cron: refresh materialized views

All dashboard endpoints read from materialized views (O(1) response, refreshed every 15min).
Fallback to live queries if views don't exist yet.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from loguru import logger

from app.database.connection import get_database
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import permission_required
from app.modules.companies.services.agent_context import (
    get_agent_ministry_id,
    get_agent_zone_id,
)

router = APIRouter(prefix="/dashboard", tags=["Company Dashboard"])


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _mv_exists(db: asyncpg.Connection, view_name: str) -> bool:
    """Check if a materialized view exists."""
    return await db.fetchval(
        "SELECT EXISTS(SELECT 1 FROM pg_matviews WHERE matviewname = $1)",
        view_name,
    )


# ── Zone Stats (Choropleth Map) ─────────────────────────────────────────────

@router.get("/zone-stats")
async def get_zone_stats(
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _=Depends(permission_required("company.view_stats")),
):
    """All zones stats — admin choropleth map data.

    Returns 12 zones with company counts, regime breakdown, debt, recovery rate.
    Reads from mv_company_stats_by_zone if available, else live query.
    """
    if await _mv_exists(db, "mv_company_stats_by_zone"):
        rows = await db.fetch(
            "SELECT * FROM mv_company_stats_by_zone ORDER BY zone_code"
        )
    else:
        # Live fallback (slower but works before migration 235)
        rows = await db.fetch("""
            SELECT
                cz.id AS zone_id, cz.zone_code, cz.zone_tier, cz.name_es AS zone_name,
                COUNT(c.id) AS total_companies,
                COUNT(c.id) FILTER (WHERE c.is_active) AS active_companies,
                COUNT(c.id) FILTER (WHERE c.is_active AND NOT c.is_verified) AS pending_verification,
                COUNT(c.id) FILTER (WHERE c.regimen_fiscal = 'bundle') AS bundle_count,
                COUNT(c.id) FILTER (WHERE c.regimen_fiscal = 'declarativo') AS declarativo_count,
                COUNT(c.id) FILTER (WHERE c.regimen_fiscal = 'mixto') AS mixto_count,
                COUNT(c.id) FILTER (WHERE c.regimen_fiscal = 'exento') AS exento_count,
                COUNT(c.id) FILTER (WHERE c.regimen_fiscal = 'pendiente') AS pendiente_count,
                COALESCE(SUM(cl.total_amount), 0) AS total_obligations_amount,
                COALESCE(SUM(cl.amount_paid), 0) AS total_paid_amount,
                COALESCE(SUM(cl.total_amount) - SUM(cl.amount_paid), 0) AS total_debt,
                CASE WHEN COALESCE(SUM(cl.total_amount), 0) > 0
                     THEN ROUND(COALESCE(SUM(cl.amount_paid), 0) * 100.0 / SUM(cl.total_amount), 1)
                     ELSE 0 END AS recovery_rate_pct
            FROM commerce_zones cz
            LEFT JOIN companies c ON c.zone_id = cz.id
            LEFT JOIN commercial_licenses cl ON cl.company_id = c.id
                AND cl.fiscal_year = EXTRACT(YEAR FROM NOW())::int
            GROUP BY cz.id, cz.zone_code, cz.zone_tier, cz.name_es
            ORDER BY cz.zone_code
        """)

    return {"zones": [dict(r) for r in rows]}


@router.get("/zone-stats/mine")
async def get_my_zone_stats(
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _=Depends(permission_required("company.view_entity_scoped")),
):
    """Supervisor's zone stats — filtered to their assigned zone."""
    zone_id = await get_agent_zone_id(db, current_user["user_id"])
    if not zone_id:
        raise HTTPException(status_code=404, detail="No zone assigned to your profile")

    if await _mv_exists(db, "mv_company_stats_by_zone"):
        row = await db.fetchrow(
            "SELECT * FROM mv_company_stats_by_zone WHERE zone_id = $1",
            UUID(zone_id),
        )
    else:
        row = await db.fetchrow("""
            SELECT
                cz.id AS zone_id, cz.zone_code, cz.zone_tier, cz.name_es AS zone_name,
                COUNT(c.id) AS total_companies,
                COUNT(c.id) FILTER (WHERE c.is_active) AS active_companies,
                COUNT(c.id) FILTER (WHERE c.is_active AND NOT c.is_verified) AS pending_verification,
                COUNT(c.id) FILTER (WHERE c.regimen_fiscal = 'bundle') AS bundle_count,
                COUNT(c.id) FILTER (WHERE c.regimen_fiscal = 'declarativo') AS declarativo_count,
                COUNT(c.id) FILTER (WHERE c.regimen_fiscal = 'mixto') AS mixto_count,
                COUNT(c.id) FILTER (WHERE c.regimen_fiscal = 'exento') AS exento_count,
                COUNT(c.id) FILTER (WHERE c.regimen_fiscal = 'pendiente') AS pendiente_count,
                COUNT(DISTINCT cl.id) AS active_licenses,
                COALESCE(SUM(cl.total_amount), 0) AS total_obligations_amount,
                COALESCE(SUM(cl.amount_paid), 0) AS total_paid_amount,
                COALESCE(SUM(cl.total_amount) - SUM(cl.amount_paid), 0) AS total_debt,
                CASE WHEN COALESCE(SUM(cl.total_amount), 0) > 0
                     THEN ROUND(COALESCE(SUM(cl.amount_paid), 0) * 100.0 / SUM(cl.total_amount), 1)
                     ELSE 0 END AS recovery_rate_pct
            FROM commerce_zones cz
            LEFT JOIN companies c ON c.zone_id = cz.id
            LEFT JOIN commercial_licenses cl ON cl.company_id = c.id
                AND cl.fiscal_year = EXTRACT(YEAR FROM NOW())::int
            WHERE cz.id = $1
            GROUP BY cz.id, cz.zone_code, cz.zone_tier, cz.name_es
        """, UUID(zone_id))

    if not row:
        return {"zone": None}
    return {"zone": dict(row)}


# ── Ministry Stats (Supervisor Ministère) ────────────────────────────────────

@router.get("/ministry-stats")
async def get_ministry_stats(
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _=Depends(permission_required("company.view_entity_scoped")),
):
    """Ministry supervisor: all zones, their fee_type items only.

    Returns obligation stats aggregated by zone for the agent's ministry.
    """
    ministry_id = await get_agent_ministry_id(db, current_user["user_id"])
    if not ministry_id:
        raise HTTPException(status_code=404, detail="No ministry assigned to your profile")

    if await _mv_exists(db, "mv_obligation_stats_by_ministry"):
        rows = await db.fetch(
            "SELECT * FROM mv_obligation_stats_by_ministry "
            "WHERE ministry_id = $1 ORDER BY zone_code, fee_type",
            ministry_id,
        )
    else:
        rows = await db.fetch("""
            SELECT
                lo.ministry_id, lo.fee_type,
                cz.id AS zone_id, cz.zone_code,
                COUNT(DISTINCT cl.company_id) AS companies_count,
                COUNT(lo.id) AS obligations_count,
                COUNT(lo.id) FILTER (WHERE lo.status = 'paid') AS paid_count,
                COUNT(lo.id) FILTER (WHERE lo.status = 'overdue') AS overdue_count,
                COALESCE(SUM(lo.amount), 0) AS total_amount,
                COALESCE(SUM(lo.amount) FILTER (WHERE lo.status = 'paid'), 0) AS paid_amount,
                COALESCE(SUM(lo.amount) FILTER (WHERE lo.status = 'overdue'), 0) AS overdue_amount,
                COALESCE(SUM(lo.penalty_amount), 0) AS total_penalties
            FROM license_obligations lo
            JOIN commercial_licenses cl ON lo.license_id = cl.id
            JOIN companies c ON cl.company_id = c.id
            LEFT JOIN commerce_zones cz ON c.zone_id = cz.id
            WHERE cl.fiscal_year = EXTRACT(YEAR FROM NOW())::int
              AND lo.ministry_id = $1
            GROUP BY lo.ministry_id, lo.fee_type, cz.id, cz.zone_code
            ORDER BY cz.zone_code, lo.fee_type
        """, ministry_id)

    # Aggregate totals
    total_amount = sum(float(r["total_amount"]) for r in rows)
    paid_amount = sum(float(r["paid_amount"]) for r in rows)
    overdue_amount = sum(float(r["overdue_amount"]) for r in rows)

    return {
        "ministry_id": ministry_id,
        "zones": [dict(r) for r in rows],
        "totals": {
            "total_amount": total_amount,
            "paid_amount": paid_amount,
            "overdue_amount": overdue_amount,
            "recovery_rate_pct": round(paid_amount * 100 / total_amount, 1) if total_amount > 0 else 0,
        },
    }


# ── Global Stats (Admin Overview) ───────────────────────────────────────────

@router.get("/global-stats")
async def get_global_stats(
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _=Depends(permission_required("company.view_stats")),
):
    """Admin global stats — single-row KPIs from materialized view."""
    if await _mv_exists(db, "mv_company_global_stats"):
        row = await db.fetchrow("SELECT * FROM mv_company_global_stats")
    else:
        row = await db.fetchrow("""
            SELECT
                COUNT(*) AS total_companies,
                COUNT(*) FILTER (WHERE is_active) AS active_companies,
                COUNT(*) FILTER (WHERE is_verified) AS verified_companies,
                COUNT(*) FILTER (WHERE NOT is_active) AS inactive_companies,
                COUNT(*) FILTER (WHERE regimen_fiscal = 'bundle') AS bundle_count,
                COUNT(*) FILTER (WHERE regimen_fiscal = 'declarativo') AS declarativo_count,
                COUNT(*) FILTER (WHERE regimen_fiscal = 'mixto') AS mixto_count,
                COUNT(*) FILTER (WHERE regimen_fiscal = 'exento') AS exento_count,
                COUNT(*) FILTER (WHERE regimen_fiscal = 'pendiente') AS pendiente_count,
                COUNT(*) FILTER (WHERE nif IS NOT NULL) AS with_nif,
                COUNT(*) FILTER (WHERE registration_number IS NOT NULL) AS with_reg_number,
                COUNT(*) FILTER (WHERE zone_id IS NOT NULL) AS with_zone,
                COUNT(*) FILTER (WHERE nif IS NULL AND registration_number IS NULL) AS missing_identifier
            FROM companies
        """)

    return dict(row) if row else {}


# ── Cron: Refresh Materialized Views ────────────────────────────────────────

@router.post("/cron/refresh-company-stats")
async def refresh_company_stats(
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _=Depends(permission_required("company.view_stats")),
):
    """Refresh all company dashboard materialized views.

    Called by Cloud Scheduler every 15 minutes.
    Uses CONCURRENTLY to avoid locking reads.
    """
    # Hardcoded whitelist — NEVER accept dynamic view names
    ALLOWED_VIEWS = frozenset({
        "mv_company_stats_by_zone",
        "mv_obligation_stats_by_ministry",
        "mv_company_global_stats",
    })
    refreshed = []
    for view_name in ALLOWED_VIEWS:
        if await _mv_exists(db, view_name):
            # Safe: view_name is from hardcoded whitelist, not user input
            await db.execute(f"REFRESH MATERIALIZED VIEW CONCURRENTLY {view_name}")
            refreshed.append(view_name)
            logger.info(f"Refreshed materialized view: {view_name}")

    return {"refreshed": refreshed, "count": len(refreshed)}
