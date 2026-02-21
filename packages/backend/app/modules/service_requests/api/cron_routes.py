"""
Cron Routes for Scheduled Tasks.

Internal endpoints called by Cloud Scheduler (GCP) for:
- Appointment reminders (J-1)
- Expired hold cleanup
- SLA monitoring

Security: These endpoints should be protected by internal authentication
or called only from Cloud Scheduler with proper IAM.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from datetime import date, timedelta
import asyncpg
from loguru import logger

from app.database.connection import get_database
from app.core.events import EventBus, EventType
from app.config import get_settings
from app.modules.payments.services.payment_sla_service import PaymentSLAService
from app.modules.service_requests.services.escalation_sla_service import EscalationSLAService

router = APIRouter(prefix="/cron", tags=["Cron Jobs (Internal)"])

settings = get_settings()


def verify_cron_auth(x_cron_secret: Optional[str] = Header(None)):
    """
    Verify cron job authentication.

    In production, this should validate:
    - Cloud Scheduler service account
    - Or a shared secret from environment
    """
    # For development, allow if CRON_SECRET matches or is not set
    expected_secret = getattr(settings, 'CRON_SECRET', None)
    if expected_secret and x_cron_secret != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid cron authentication")
    return True


@router.post(
    "/appointment-reminders",
    summary="Send appointment reminders",
    description="""
    Called daily by Cloud Scheduler to send appointment reminders.

    Sends reminders for appointments scheduled for tomorrow (J-1).
    Publishes APPOINTMENT_REMINDER events for each appointment.
    """
)
async def send_appointment_reminders(
    db: asyncpg.Connection = Depends(get_database),
    _auth: bool = Depends(verify_cron_auth)
):
    """Send reminder notifications for tomorrow's appointments."""
    tomorrow = date.today() + timedelta(days=1)

    # Get all confirmed appointments for tomorrow
    appointments = await db.fetch("""
        SELECT
            sr.id as request_id,
            sr.user_id,
            sr.workflow_code,
            sr.reference,
            sr.cita_date as appointment_date,
            sr.cita_time as appointment_time,
            sr.cita_location as location,
            u.email,
            u.phone_number as phone,
            u.first_name,
            u.last_name,
            u.preferred_language
        FROM service_requests sr
        JOIN users u ON u.id = sr.user_id
        WHERE sr.cita_date = $1
        AND sr.status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PAID')
        AND sr.appointment_status IS NULL  -- Not yet arrived or no-show
        AND sr.reminder_sent_at IS NULL    -- Reminder not already sent
    """, tomorrow)

    sent_count = 0
    failed_count = 0

    for appt in appointments:
        try:
            # Publish APPOINTMENT_REMINDER event
            EventBus.publish_nowait(
                EventType.APPOINTMENT_REMINDER,
                {
                    "request_id": str(appt["request_id"]),
                    "user_id": str(appt["user_id"]),
                    "user_email": appt["email"],
                    "user_phone": appt["phone"],
                    "user_name": f"{appt['first_name'] or ''} {appt['last_name'] or ''}".strip(),
                    "preferred_language": appt.get("preferred_language", "es"),
                    "workflow_code": appt["workflow_code"],
                    "service": appt["workflow_code"],  # For SMS template compatibility
                    "reference": appt["reference"],
                    "appointment_date": str(appt["appointment_date"]) if appt.get("appointment_date") else None,
                    "date": str(appt["appointment_date"]) if appt.get("appointment_date") else None,  # SMS template
                    "appointment_time": str(appt["appointment_time"]) if appt.get("appointment_time") else None,
                    "time": str(appt["appointment_time"]) if appt.get("appointment_time") else None,  # SMS template
                    "location": appt.get("location"),
                }
            )

            # Mark reminder as sent
            await db.execute("""
                UPDATE service_requests
                SET reminder_sent_at = NOW()
                WHERE id = $1
            """, appt["request_id"])

            sent_count += 1

        except Exception as e:
            logger.error(f"Failed to send reminder for request {appt['request_id']}: {e}")
            failed_count += 1

    logger.info(f"Appointment reminders: {sent_count} sent, {failed_count} failed")

    return {
        "message": "Appointment reminders processed",
        "date": str(tomorrow),
        "total_appointments": len(appointments),
        "sent": sent_count,
        "failed": failed_count
    }


@router.post(
    "/cleanup-expired-holds",
    summary="Cleanup expired appointment holds",
    description="""
    Called periodically to release expired appointment holds.

    Holds that have expired (past 15 min without payment) are released
    to make slots available for other users.
    """
)
async def cleanup_expired_holds(
    db: asyncpg.Connection = Depends(get_database),
    _auth: bool = Depends(verify_cron_auth)
):
    """Release expired appointment holds."""
    result = await db.execute("""
        UPDATE appointment_holds
        SET status = 'expired',
            released_at = NOW()
        WHERE status = 'held'
        AND expires_at < NOW()
    """)

    # Extract count from result string
    count = 0
    if result:
        try:
            count = int(result.split()[-1])
        except (ValueError, IndexError):
            pass

    logger.info(f"Expired appointment holds released: {count}")

    return {
        "message": "Expired holds cleaned up",
        "released_count": count
    }


@router.post(
    "/payment-sla-check",
    summary="Check payment SLA and send notifications",
    description="""
    Called daily by Cloud Scheduler to monitor cash/check payments
    pending treasury agent validation.

    Three actions:
    1. 48h warning: Email treasury agents with table of pending payments
    2. 5-day escalation: Email supervisors with table of overdue payments
    3. 15-day expiration: Expire payment + request, email citizen
    """
)
async def payment_sla_check(
    db: asyncpg.Connection = Depends(get_database),
    _auth: bool = Depends(verify_cron_auth)
):
    """Run payment SLA checks: warning, escalation, expiration."""
    sla_service = PaymentSLAService()
    results = await sla_service.run_sla_check(db)

    logger.info(
        f"Payment SLA check: {results['warnings_sent']} warnings, "
        f"{results['escalations_sent']} escalations, "
        f"{results['expirations_processed']} expirations"
    )

    return {
        "message": "Payment SLA check completed",
        **results
    }


@router.post(
    "/escalation-sla-check",
    summary="Check escalation SLA and send notifications",
    description="""
    Called every 2 hours by Cloud Scheduler to monitor open escalations
    pending supervisor resolution.

    Three tiers:
    1. 4h warning: Email entity supervisors with table of pending escalations
    2. 24h escalation: Email admins, boost priority to URGENT
    3. 72h expiration: Auto-resolve escalation, email admin notification
    """
)
async def escalation_sla_check(
    db: asyncpg.Connection = Depends(get_database),
    _auth: bool = Depends(verify_cron_auth)
):
    """Run escalation SLA checks: warning, escalation, expiration."""
    sla_service = EscalationSLAService()
    results = await sla_service.run_sla_check(db)

    logger.info(
        f"Escalation SLA check: {results['warnings_sent']} warnings, "
        f"{results['escalations_sent']} escalations, "
        f"{results['expirations_processed']} expirations"
    )

    return {
        "message": "Escalation SLA check completed",
        **results
    }
