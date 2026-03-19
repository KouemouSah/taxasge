"""Public Company Directory — Unauthenticated API

Annuaire public des entreprises enregistrées en Guinée Équatoriale.
Rate-limited (100 req/min par IP). Données publiques uniquement.

Visible: legal_name, nif, registration_number, localidad, sector, objeto_social,
         regimen_fiscal, address (siège social).
Filtré: is_active=true AND is_verified=true uniquement.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, Request
from loguru import logger
import asyncpg

from app.core.cache import check_rate_limit
from app.database.connection import get_database

router = APIRouter(tags=["Public Directory"])

# Rate limit: 100 requests per minute per IP
RATE_LIMIT_MAX = 100
RATE_LIMIT_WINDOW = 60


async def _check_public_rate_limit(request: Request) -> None:
    """Enforce rate limiting on public endpoints by client IP.

    Graceful degradation: if Redis is down, allow the request
    (prefer availability over strict rate limiting).
    """
    client_ip = request.client.host if request.client else "unknown"
    try:
        allowed, remaining = await check_rate_limit(
            f"public_dir:{client_ip}", "/public/companies", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW
        )
        if not allowed:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Try again in {RATE_LIMIT_WINDOW}s."
            )
    except Exception as e:
        # Redis down, connection error, etc. — allow request (graceful degradation)
        if "Rate limit" in str(e) or "429" in str(e):
            raise  # Re-raise our own HTTPException
        logger.debug(f"Rate limit check skipped (Redis unavailable): {e}")


@router.get("/search")
async def search_public_directory(
    request: Request,
    q: str = Query("", max_length=100, description="Search term (legal_name, NIF, activity)"),
    zone_id: Optional[str] = Query(None, description="Filter by commerce zone"),
    sector: Optional[str] = Query(None, description="Filter by sector_actividad"),
    page: int = Query(1, ge=1, le=1000),
    page_size: int = Query(20, ge=1, le=50),
    db: asyncpg.Connection = Depends(get_database),
):
    """Public company directory search.

    Returns only verified active companies with public-safe fields.
    Uses websearch_to_tsquery for proper stemming + ILIKE fallback.
    """
    await _check_public_rate_limit(request)

    conditions = ["c.is_active = true", "c.is_verified = true"]
    params: List[Any] = []
    idx = 1

    # Full-text search via websearch_to_tsquery (proper stemming) + ILIKE fallback
    if q and len(q) >= 2:
        escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        conditions.append(
            f"(c.search_vector @@ websearch_to_tsquery('spanish', ${idx})"
            f" OR c.legal_name ILIKE ${idx + 1}"
            f" OR c.nif ILIKE ${idx + 1}"
            f" OR c.registration_number ILIKE ${idx + 1})"
        )
        params.append(q)
        params.append(f"%{escaped}%")
        idx += 2

    if zone_id:
        conditions.append(f"c.zone_id = ${idx}::uuid")
        params.append(zone_id)
        idx += 1

    if sector:
        conditions.append(f"c.sector_actividad = ${idx}")
        params.append(sector)
        idx += 1

    where = " AND ".join(conditions)
    offset = (page - 1) * page_size

    # Count
    count_q = f"SELECT COUNT(*) FROM companies c WHERE {where}"
    total = await db.fetchval(count_q, *params)

    # Data — public-safe fields only (NO email, NO phone, NO capital)
    data_q = f"""
        SELECT
            c.id, c.legal_name, c.nif, c.registration_number,
            c.forma_juridica, c.sector_actividad, c.subsector_actividad,
            c.objeto_social, c.regimen_fiscal, c.address,
            ct.name AS city_name, ct.provincia,
            cz.zone_code, cz.zone_tier
        FROM companies c
        LEFT JOIN cities ct ON c.city_id = ct.id
        LEFT JOIN commerce_zones cz ON c.zone_id = cz.id
        WHERE {where}
        ORDER BY c.legal_name ASC
        LIMIT ${idx} OFFSET ${idx + 1}
    """
    params.extend([page_size, offset])
    rows = await db.fetch(data_q, *params)

    return {
        "items": [dict(r) for r in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/zones")
async def list_public_zones(
    request: Request,
    db: asyncpg.Connection = Depends(get_database),
):
    """List commerce zones for directory filter dropdown."""
    await _check_public_rate_limit(request)
    rows = await db.fetch(
        "SELECT id, zone_code, zone_tier, name_es "
        "FROM commerce_zones ORDER BY zone_code"
    )
    return [dict(r) for r in rows]


@router.get("/sectors")
async def list_public_sectors(
    request: Request,
    db: asyncpg.Connection = Depends(get_database),
):
    """List distinct sectors for directory filter dropdown."""
    await _check_public_rate_limit(request)
    rows = await db.fetch(
        "SELECT DISTINCT sector_actividad AS sector "
        "FROM companies "
        "WHERE sector_actividad IS NOT NULL AND is_active = true AND is_verified = true "
        "ORDER BY sector_actividad"
    )
    return [r["sector"] for r in rows]
