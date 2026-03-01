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
    Verify cron job authentication via shared secret.

    Secret is loaded from:
    - Production: Google Cloud Secret Manager ('cron-secret')
    - Local dev: .env CRON_SECRET

    If CRON_SECRET is configured, all requests MUST provide matching header.
    If NOT configured (local dev without .env entry), requests are allowed
    with a warning log to avoid blocking development.
    """
    from app.core.secrets import get_cron_secret

    # Priority: Secret Manager > config.py > .env
    expected_secret = get_cron_secret() or settings.CRON_SECRET
    if expected_secret:
        if not x_cron_secret:
            logger.warning("Cron request rejected: missing X-Cron-Secret header")
            raise HTTPException(status_code=403, detail="Missing cron authentication")
        if x_cron_secret != expected_secret:
            logger.warning("Cron request rejected: invalid X-Cron-Secret")
            raise HTTPException(status_code=403, detail="Invalid cron authentication")
    else:
        logger.warning(
            "CRON_SECRET not configured — cron endpoints are UNPROTECTED. "
            "Set CRON_SECRET in .env or Secret Manager for production."
        )
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


# ============================================================
# Queue Priority Management
# ============================================================


@router.post(
    "/queue-priority-recalculate",
    summary="Recalculate queue priorities based on item age",
    description="""
    Called every 6 hours by Cloud Scheduler.

    Applies age-based priority boosts to pending queue items:
    - Items >24h: +QUEUE_AGE_BOOST_24H (default 10)
    - Items >48h: +QUEUE_AGE_BOOST_48H (default 15)
    - Items >72h: +QUEUE_AGE_BOOST_72H (default 25)

    Prevents items from languishing in the queue when static
    priority alone (from workflows.priority_weight) is equal.
    """,
)
async def queue_priority_recalculate(
    db: asyncpg.Connection = Depends(get_database),
    _auth: bool = Depends(verify_cron_auth),
):
    """Recalculate priorities for aging queue items."""
    from app.modules.service_requests.services.agent_queue_service import agent_queue_service

    updated_count = await agent_queue_service.recalculate_pending_priorities(db)

    if updated_count > 0:
        logger.info(f"Queue priority recalculation: {updated_count} items boosted")

    return {
        "message": "Queue priority recalculation completed",
        "items_updated": updated_count,
    }


# ============================================================
# Assignment Outbox Cron Jobs
# ============================================================


@router.post(
    "/process-assignment-outbox",
    summary="Process pending assignment outbox items",
    description="""
    Called every 1 minute by Cloud Scheduler.

    Processes pending outbox items using FOR UPDATE SKIP LOCKED:
    - Multiple Cloud Run instances can run simultaneously (no overlap)
    - Each item triggers: add_to_queue + auto_assign + PAID→SUBMITTED
    - Failed items retry with exponential backoff (30s→10min)
    - Dead letter after 5 retries
    """,
)
async def process_assignment_outbox(
    db: asyncpg.Connection = Depends(get_database),
    _auth: bool = Depends(verify_cron_auth),
):
    """Process pending assignment outbox items."""
    from app.modules.service_requests.services.assignment_outbox_service import (
        assignment_outbox_service,
    )

    results = await assignment_outbox_service.process_pending_items(db)

    total_work = results["processed"] + results["failed"] + results["dead_letter"]
    if total_work > 0:
        logger.info(
            f"Assignment outbox: {results['processed']} processed, "
            f"{results['failed']} retrying, {results['dead_letter']} dead-lettered"
        )

    return {"message": "Assignment outbox processed", **results}


@router.post(
    "/assignment-health-check",
    summary="Assignment pipeline health check",
    description="""
    Called every 5 minutes by Cloud Scheduler.

    Detects:
    - PAID requests >10 min without assignment or outbox entry (orphans)
    - Dead letter outbox items (>5 retries, need supervisor attention)
    - Stale 'processing' items from crashed instances

    Actions:
    - Re-enqueue orphans into outbox
    - Reset stale processing items to pending
    - Report dead letters for supervisor attention
    """,
)
async def assignment_health_check(
    db: asyncpg.Connection = Depends(get_database),
    _auth: bool = Depends(verify_cron_auth),
):
    """Run assignment pipeline health check."""
    from app.modules.service_requests.services.assignment_outbox_service import (
        assignment_outbox_service,
    )

    results = await assignment_outbox_service.run_health_check(db)

    if results["orphans_found"] > 0 or results["dead_letters"] > 0:
        logger.warning(
            f"Assignment health: {results['orphans_found']} orphans "
            f"({results['orphans_requeued']} requeued), "
            f"{results['dead_letters']} dead letters, "
            f"{results['stale_processing_reset']} stale resets"
        )

    return {"message": "Assignment health check completed", **results}


# ============================================================
# Treasury Materialized Views Refresh
# ============================================================


@router.post(
    "/treasury-refresh-views",
    summary="Refresh treasury materialized views",
    description="""
    Called every 4 hours by Cloud Scheduler.

    Refreshes materialized views used by treasury dashboard:
    - mv_treasury_daily_kpis: daily payment KPIs (365 days window)
    - mv_reconciliation_stats: bank reconciliation stats (90 days window)

    Uses CONCURRENTLY to avoid locking reads during refresh.
    Requires unique indexes on the views (already created).
    """,
)
async def treasury_refresh_views(
    db: asyncpg.Connection = Depends(get_database),
    _auth: bool = Depends(verify_cron_auth),
):
    """Refresh treasury materialized views concurrently."""
    refreshed = []
    errors = []

    views = ["mv_treasury_daily_kpis", "mv_reconciliation_stats"]

    for view in views:
        try:
            await db.execute(f"REFRESH MATERIALIZED VIEW CONCURRENTLY {view}")
            refreshed.append(view)
            logger.info(f"Refreshed materialized view: {view}")
        except Exception as e:
            logger.error(f"Failed to refresh {view}: {e}")
            errors.append({"view": view, "error": str(e)})

    return {
        "message": "Treasury views refresh completed",
        "refreshed": refreshed,
        "errors": errors,
    }


# ============================================================================
# LOCK HEALTH CHECK (every 15 min)
# ============================================================================

@router.post(
    "/lock-health-check",
    summary="Monitor PostgreSQL locks and stuck transactions",
    description="""
    Called by Cloud Scheduler every 15 minutes.
    Checks for: waiting locks, long-running transactions (>60s),
    stale payment locks (>4h in locked_by_agent status).
    """
)
async def lock_health_check(
    db: asyncpg.Connection = Depends(get_database),
    _auth: bool = Depends(verify_cron_auth)
):
    """Monitor database locks and stuck transactions for alerting."""

    # 1. Waiting locks (blocked queries)
    waiting_locks = await db.fetch("""
        SELECT blocked.pid AS blocked_pid,
               LEFT(blocked_activity.query, 200) AS blocked_query,
               blocking.pid AS blocking_pid,
               LEFT(blocking_activity.query, 200) AS blocking_query,
               ROUND(EXTRACT(EPOCH FROM (NOW() - blocked_activity.query_start))::numeric, 1) AS wait_seconds
        FROM pg_locks blocked
        JOIN pg_stat_activity blocked_activity ON blocked.pid = blocked_activity.pid
        JOIN pg_locks blocking
            ON blocked.transactionid = blocking.transactionid
            AND blocked.pid != blocking.pid
        JOIN pg_stat_activity blocking_activity ON blocking.pid = blocking_activity.pid
        WHERE NOT blocked.granted
    """)

    # 2. Long-running transactions (>60s)
    long_txns = await db.fetch("""
        SELECT pid,
               LEFT(query, 200) AS query,
               state,
               ROUND(EXTRACT(EPOCH FROM (NOW() - xact_start))::numeric, 1) AS txn_seconds
        FROM pg_stat_activity
        WHERE state != 'idle'
          AND xact_start < NOW() - INTERVAL '60 seconds'
          AND query NOT LIKE '%pg_stat%'
          AND query NOT LIKE '%cron%'
    """)

    # 3. Stale payment locks (agent_reviewing > 4h)
    stale_payment_locks = await db.fetch("""
        SELECT sp.id AS payment_id,
               sp.payment_reference,
               sp.assigned_agent_id,
               u.full_name AS agent_name,
               sp.assigned_at AS locked_at,
               ROUND(EXTRACT(EPOCH FROM (NOW() - sp.assigned_at))::numeric / 3600, 1) AS locked_hours
        FROM service_payments sp
        LEFT JOIN agent_profiles ap ON ap.id = sp.assigned_agent_id
        LEFT JOIN users u ON u.id = ap.user_id
        WHERE sp.assigned_agent_id IS NOT NULL
          AND sp.assigned_at < NOW() - INTERVAL '4 hours'
          AND sp.workflow_status = 'agent_reviewing'
    """)

    # Log warnings for alerting via Cloud Logging
    if waiting_locks:
        logger.warning(f"LOCK_HEALTH: {len(waiting_locks)} waiting locks detected")
    if long_txns:
        logger.warning(f"LOCK_HEALTH: {len(long_txns)} long-running transactions (>60s)")
    if stale_payment_locks:
        logger.warning(f"LOCK_HEALTH: {len(stale_payment_locks)} stale payment locks (>4h)")

    return {
        "waiting_locks": len(waiting_locks),
        "long_transactions": len(long_txns),
        "stale_payment_locks": len(stale_payment_locks),
        "details": {
            "waiting": [dict(r) for r in waiting_locks],
            "long_txns": [dict(r) for r in long_txns],
            "stale_payments": [dict(r) for r in stale_payment_locks],
        }
    }


# ============================================================================
# SLOW QUERY SNAPSHOT (every 6h)
# ============================================================================

@router.post(
    "/slow-query-snapshot",
    summary="Capture periodic snapshot of slow queries",
    description="""
    Called by Cloud Scheduler every 6 hours.
    Captures top 10 slowest queries from pg_stat_statements for trend analysis.
    Logs to structured logging for Cloud Logging indexing.
    """
)
async def slow_query_snapshot(
    db: asyncpg.Connection = Depends(get_database),
    _auth: bool = Depends(verify_cron_auth)
):
    """Capture slow query snapshot from pg_stat_statements."""
    try:
        slow_queries = await db.fetch("""
            SELECT queryid,
                   LEFT(query, 300) AS query_preview,
                   calls,
                   ROUND(mean_exec_time::numeric, 2) AS mean_ms,
                   ROUND(max_exec_time::numeric, 2) AS max_ms,
                   ROUND(total_exec_time::numeric, 2) AS total_ms,
                   rows AS total_rows
            FROM pg_stat_statements
            WHERE calls >= 10
              AND mean_exec_time > 100
              AND query NOT LIKE '%pg_stat%'
            ORDER BY mean_exec_time DESC
            LIMIT 10
        """)

        for row in slow_queries:
            logger.warning(
                f"SLOW_QUERY_SNAPSHOT queryid={row['queryid']} "
                f"calls={row['calls']} mean_ms={row['mean_ms']} "
                f"max_ms={row['max_ms']} query={row['query_preview'][:100]}"
            )

        return {
            "snapshot_count": len(slow_queries),
            "queries": [dict(r) for r in slow_queries],
        }
    except Exception as e:
        logger.error(f"Failed to capture slow query snapshot: {e}")
        return {"snapshot_count": 0, "error": str(e)}
