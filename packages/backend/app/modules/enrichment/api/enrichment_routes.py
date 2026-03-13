"""
Enrichment API routes — cron processing + admin management.

Cron: POST /enrichment/cron/process (X-Cron-Secret auth)
Admin: POST /enrichment/admin/seed-batch, GET /enrichment/admin/stats
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query
from loguru import logger

from app.core.cache import check_rate_limit, invalidate_services_cache
from app.database.connection import get_database
from app.modules.auth.dependencies import get_current_user, permission_required
from app.modules.enrichment.models.enrichment import (
    EnrichmentProcessResult,
    EnrichmentSeedResult,
    EnrichmentStats,
)
from app.modules.enrichment.repositories.enrichment_repository import (
    EnrichmentRepository,
)
from app.modules.enrichment.services.enrichment_service import (
    get_enrichment_service,
)

# Reuse cron auth from existing cron routes
from app.modules.service_requests.api.cron_routes import verify_cron_auth

router = APIRouter(prefix="/enrichment", tags=["Enrichment"])


# ============================================================================
# CRON ENDPOINT — called by Cloud Scheduler every 5 minutes
# ============================================================================

@router.post(
    "/cron/process",
    response_model=EnrichmentProcessResult,
    summary="Process enrichment queue batch",
    description="Processes up to 20 pending enrichment tasks via Gemini Flash. "
    "Called by Cloud Scheduler every 5 minutes.",
)
async def process_enrichment_batch(
    _auth: bool = Depends(verify_cron_auth),
    db=Depends(get_database),
):
    """Process a batch of pending enrichment tasks."""
    service = get_enrichment_service()

    result = await service.process_batch(db, limit=20)

    # Refresh materialized view if any tasks completed
    if result.get("processed", 0) > 0:
        try:
            async with db.transaction():
                await db.execute("SET LOCAL statement_timeout = '120000'")
                await db.execute(
                    "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_services_translated"
                )
            logger.info("mv_services_translated refreshed after enrichment")
        except Exception as e:
            logger.warning(f"MV refresh CONCURRENTLY failed: {e}")
            try:
                await db.execute("REFRESH MATERIALIZED VIEW mv_services_translated")
                logger.info("mv_services_translated refreshed (non-concurrent fallback)")
            except Exception as e2:
                logger.error(f"MV refresh fallback also failed: {e2}")

        await invalidate_services_cache()

    return EnrichmentProcessResult(**result)


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@router.post(
    "/admin/seed-batch",
    response_model=EnrichmentSeedResult,
    summary="Seed enrichment queue for all services missing descriptions",
)
async def seed_enrichment_batch(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _perm: None = Depends(permission_required("fiscal_service.create")),
):
    """
    Enqueue generate_description for all active services without descriptions.
    Also enqueue translations for services with descriptions but no translations.
    Idempotent — skips already pending/processing tasks.
    """
    user_id = current_user.get("sub", "unknown")

    # Rate limit: 1 call per 60 seconds per user (heavy DB operation)
    is_allowed, remaining = await check_rate_limit(
        identifier=str(user_id),
        endpoint="/enrichment/admin/seed-batch",
        max_requests=1,
        window_seconds=60,
    )
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail="Seed-batch can only be called once per minute. Try again shortly.",
        )

    counts = await EnrichmentRepository.seed_descriptions(db)

    logger.info(
        f"Admin {user_id} triggered enrichment seed: "
        f"{counts['descriptions']} descriptions, {counts['translations']} translations"
    )

    return EnrichmentSeedResult(
        enqueued_descriptions=counts["descriptions"],
        enqueued_translations=counts["translations"],
        enqueued_keywords=counts.get("keywords", 0),
    )


@router.get(
    "/admin/stats",
    response_model=EnrichmentStats,
    summary="Get enrichment queue statistics and service coverage",
)
async def get_enrichment_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _perm: None = Depends(permission_required("fiscal_service.view")),
):
    """Return queue stats + service description/translation coverage."""
    stats = await EnrichmentRepository.get_stats(db)
    return EnrichmentStats(**stats)


@router.get(
    "/admin/recent",
    summary="Get recent completed enrichment tasks",
)
async def get_recent_enrichments(
    limit: int = Query(default=20, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _perm: None = Depends(permission_required("fiscal_service.view")),
):
    """Return recent completed tasks with output preview."""
    rows = await db.fetch(
        """
        SELECT eq.id, eq.fiscal_service_id, eq.task_type, eq.status,
               eq.tokens_used, eq.output_data, eq.processed_at,
               fs.service_code, fs.name_es
        FROM enrichment_queue eq
        JOIN fiscal_services fs ON fs.id = eq.fiscal_service_id
        WHERE eq.status IN ('completed', 'failed')
        ORDER BY eq.processed_at DESC NULLS LAST
        LIMIT $1
        """,
        limit,
    )
    return [dict(r) for r in rows]
