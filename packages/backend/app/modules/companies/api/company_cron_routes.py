"""Company Cron Routes — Scheduled task endpoints.

Internal endpoints called by Cloud Scheduler (GCP).
Security: X-Cron-Secret header authentication.

Endpoints:
  POST /cron/annual-reclassification  — Re-classify all active companies
  POST /cron/data-quality-check       — Detect anomalies in company data
  POST /cron/compliance-reminders     — Check obligation deadlines + escalations
"""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from loguru import logger

from app.database.connection import get_database

router = APIRouter(prefix="/cron", tags=["Company Cron Jobs (Internal)"])


def verify_cron_auth(x_cron_secret: Optional[str] = Header(None)):
    """Verify cron job authentication via shared secret.

    Reuses the same CRON_SECRET as other cron endpoints in the project.
    """
    from app.core.secrets import get_cron_secret
    from app.config import get_settings

    settings = get_settings()
    expected_secret = get_cron_secret() or getattr(settings, 'CRON_SECRET', None)

    if not expected_secret:
        logger.error(
            "CRON_SECRET not configured — company cron endpoints BLOCKED (fail-closed). "
            "Set CRON_SECRET in .env or Secret Manager."
        )
        raise HTTPException(
            status_code=503,
            detail="Cron authentication not configured. Set CRON_SECRET."
        )
    if not x_cron_secret:
        logger.warning("Company cron rejected: missing X-Cron-Secret header")
        raise HTTPException(status_code=403, detail="Missing cron authentication")
    if x_cron_secret != expected_secret:
        logger.warning("Company cron rejected: invalid X-Cron-Secret")
        raise HTTPException(status_code=403, detail="Invalid cron authentication")


@router.post("/annual-reclassification")
async def annual_reclassification(
    db=Depends(get_database),
    _=Depends(verify_cron_auth),
):
    """Re-classify all active companies using the 3-layer classification agent.

    Processes in batches of 100. Logs changes in company_classification_history.
    Triggered annually (or on-demand by admin).
    """
    from app.modules.companies.services.company_cron_service import reclassification_service

    logger.info("Cron: annual reclassification started")
    result = await reclassification_service.run(db)
    logger.info(f"Cron: annual reclassification completed: {result}")
    return result


@router.post("/data-quality-check")
async def data_quality_check(
    db=Depends(get_database),
    _=Depends(verify_cron_auth),
):
    """Run data quality check across all companies.

    Detects: missing identifiers, format violations, cross-check errors,
    missing zones, unclassified companies.
    Returns report for admin dashboard.
    """
    from app.modules.companies.services.company_cron_service import data_quality_service

    logger.info("Cron: data quality check started")
    result = await data_quality_service.run(db)
    logger.info(f"Cron: data quality check completed: {result['total_anomalies']} anomalies")
    return result


@router.post("/compliance-reminders")
async def compliance_reminders(
    db=Depends(get_database),
    _=Depends(verify_cron_auth),
):
    """Check obligation deadlines and send reminders/escalations.

    J-30: Warning to company owners
    J-0: Notification to ministry agents
    J+15: Critical overdue → update status + escalate to supervisors
    """
    from app.modules.companies.services.company_cron_service import compliance_service

    logger.info("Cron: compliance reminders started")
    result = await compliance_service.run(db)
    logger.info(f"Cron: compliance reminders completed: {result}")
    return result
