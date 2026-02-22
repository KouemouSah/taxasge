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
from html import escape as html_escape
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


@router.post(
    "/workload-rebalance",
    summary="Auto-rebalance agent workload",
    description="""
    Called daily by Cloud Scheduler to automatically rebalance workload
    across all entities. Moves assignments from overloaded agents to
    underloaded agents using mobility scoring (priority/SLA weighting).
    """
)
async def workload_rebalance(
    db: asyncpg.Connection = Depends(get_database),
    _auth: bool = Depends(verify_cron_auth)
):
    """Auto-rebalance workload across all active entities."""
    from app.modules.assignment.services.workload_rebalance_service import rebalance_entity_workload

    # Get all entities with active non-supervisor agents
    entities = await db.fetch("""
        SELECT DISTINCT e.id, e.code
        FROM entities e
        JOIN agent_profiles ap ON ap.entity_id = e.id
        WHERE ap.is_active = true AND ap.is_supervisor = false
        AND e.is_active = true
    """)

    total_reassigned = 0
    entity_results = []

    for entity in entities:
        try:
            result = await rebalance_entity_workload(
                entity_id=entity['id'],
                db=db,
                performed_by=None,
            )
            total_reassigned += result['reassignments_made']
            entity_results.append({
                "entity": entity['code'],
                "reassignments": result['reassignments_made'],
            })
        except Exception as e:
            logger.error(f"Rebalance failed for entity {entity['code']}: {e}")
            entity_results.append({
                "entity": entity['code'],
                "error": str(e),
            })

    logger.info(f"Workload rebalance: {total_reassigned} total reassignments across {len(entities)} entities")

    return {
        "message": "Workload rebalance completed",
        "total_reassigned": total_reassigned,
        "entities_processed": len(entities),
        "details": entity_results,
    }


@router.post(
    "/supervisor-weekly-report",
    summary="Send weekly performance report to supervisors",
    description="""
    Called weekly (Monday 8:00 AM) by Cloud Scheduler.
    Sends HTML email report with key metrics to all active supervisors.
    """
)
async def supervisor_weekly_report(
    db: asyncpg.Connection = Depends(get_database),
    _auth: bool = Depends(verify_cron_auth)
):
    """Send weekly performance report email to all active supervisors."""
    import asyncio
    from app.modules.communications.services.communication_service import CommunicationService
    from app.modules.communications.models.communication import CommunicationType

    comm_service = CommunicationService()

    supervisors = await db.fetch("""
        SELECT ap.user_id, u.email, u.full_name, ap.entity_id,
               e.code as entity_code, e.name as entity_name
        FROM agent_profiles ap
        JOIN users u ON u.id = ap.user_id
        JOIN entities e ON e.id = ap.entity_id
        WHERE ap.is_supervisor = true AND ap.is_active = true
        AND u.status = 'active'
    """)

    emails_sent = 0
    emails_failed = 0

    for sup in supervisors:
        try:
            # Gather weekly stats scoped to entity
            wf_codes = await db.fetchval(
                "SELECT workflow_codes FROM entities WHERE id = $1", sup['entity_id']
            )
            if isinstance(wf_codes, str):
                import json
                wf_codes = json.loads(wf_codes)

            if not wf_codes:
                continue

            stats = await db.fetchrow("""
                SELECT
                    COUNT(*) FILTER (WHERE sr.created_at >= NOW() - INTERVAL '7 days') as new_requests,
                    COUNT(*) FILTER (
                        WHERE sr.status IN ('completed', 'approved')
                        AND sr.updated_at >= NOW() - INTERVAL '7 days'
                    ) as completed,
                    COUNT(*) FILTER (WHERE sr.escalated = true) as pending_escalations,
                    COALESCE(AVG(
                        CASE WHEN sr.status IN ('completed', 'approved')
                        THEN EXTRACT(EPOCH FROM (sr.updated_at - sr.created_at)) / 3600.0
                        ELSE NULL END
                    ), 0) as avg_processing_hours,
                    COUNT(*) FILTER (
                        WHERE sr.status NOT IN ('completed', 'approved', 'rejected', 'cancelled', 'expired')
                    ) as active_requests
                FROM service_requests sr
                WHERE sr.workflow_code = ANY($1)
            """, wf_codes)

            # Build HTML email (escape user-provided strings to prevent XSS)
            entity_name = html_escape(sup['entity_name'] or sup['entity_code'] or '')
            sup_name = html_escape(sup['full_name'] or 'Supervisor')
            avg_hours = round(float(stats['avg_processing_hours'] or 0), 1)
            html_body = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a56db;">Reporte Semanal — {entity_name}</h2>
                <p>Hola {sup_name},</p>
                <p>Resumen de la actividad de tu equipo esta semana:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Nuevas solicitudes</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">{stats['new_requests'] or 0}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Completadas</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">{stats['completed'] or 0}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Solicitudes activas</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">{stats['active_requests'] or 0}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Escalaciones pendientes</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; color: {'#dc2626' if (stats['pending_escalations'] or 0) > 0 else '#059669'};">{stats['pending_escalations'] or 0}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Tiempo promedio de tramitación</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">{avg_hours}h</td>
                    </tr>
                </table>
                <p style="font-size: 12px; color: #6b7280;">
                    Este reporte se genera automáticamente cada lunes.
                    Accede al <a href="{getattr(settings, 'FRONTEND_URL', 'https://taxasge.web.app')}/dashboard/supervisor">panel de supervisión</a> para más detalles.
                </p>
            </div>
            """

            subject = f"Reporte Semanal — {entity_name}"

            loop = asyncio.get_running_loop()
            sent = await loop.run_in_executor(
                None,
                lambda: comm_service.send_communication(
                    channel=CommunicationType.EMAIL,
                    recipient=sup['email'],
                    subject=subject,
                    content=html_body,
                )
            )

            if sent:
                emails_sent += 1
            else:
                emails_failed += 1

        except Exception as e:
            logger.error(f"Failed to send weekly report to {sup.get('email')}: {e}")
            emails_failed += 1

    logger.info(f"Supervisor weekly reports: {emails_sent} sent, {emails_failed} failed")

    return {
        "message": "Supervisor weekly reports sent",
        "emails_sent": emails_sent,
        "emails_failed": emails_failed,
        "total_supervisors": len(supervisors),
    }
