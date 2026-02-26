"""
Internal cron scheduler for TaxasGE backend.

Replaces Cloud Scheduler by running periodic tasks inside the FastAPI process.
Uses asyncio tasks with configurable intervals.

Safe for multi-instance: outbox uses FOR UPDATE SKIP LOCKED,
other jobs are idempotent.

HTTP cron endpoints remain available as manual triggers.
"""

import asyncio
from datetime import date, timedelta, datetime
from html import escape as html_escape
from loguru import logger


class InternalScheduler:
    """Lightweight asyncio-based cron scheduler."""

    def __init__(self):
        self._tasks: list[asyncio.Task] = []
        self._running = False

    async def start(self):
        """Start all scheduled jobs after app initialization."""
        if self._running:
            return

        from app.config import get_settings
        settings = get_settings()

        if not settings.SCHEDULER_ENABLED:
            logger.info("Internal scheduler DISABLED (SCHEDULER_ENABLED=false)")
            return

        self._running = True

        jobs = [
            # (name, handler, interval_seconds)
            (
                "process-assignment-outbox",
                self._process_assignment_outbox,
                settings.SCHEDULER_OUTBOX_INTERVAL,
            ),
            (
                "assignment-health-check",
                self._assignment_health_check,
                settings.SCHEDULER_HEALTH_CHECK_INTERVAL,
            ),
            (
                "cleanup-expired-holds",
                self._cleanup_expired_holds,
                settings.SCHEDULER_EXPIRED_HOLDS_INTERVAL,
            ),
            (
                "escalation-sla-check",
                self._escalation_sla_check,
                settings.SCHEDULER_ESCALATION_SLA_INTERVAL,
            ),
            (
                "queue-priority-recalculate",
                self._queue_priority_recalculate,
                settings.SCHEDULER_QUEUE_PRIORITY_INTERVAL,
            ),
            (
                "appointment-reminders",
                self._appointment_reminders,
                settings.SCHEDULER_DAILY_INTERVAL,
            ),
            (
                "payment-sla-check",
                self._payment_sla_check,
                settings.SCHEDULER_DAILY_INTERVAL,
            ),
            (
                "workload-rebalance",
                self._workload_rebalance,
                settings.SCHEDULER_DAILY_INTERVAL,
            ),
        ]

        for name, handler, interval in jobs:
            task = asyncio.create_task(
                self._run_periodic(name, handler, interval)
            )
            self._tasks.append(task)

        logger.info(
            f"Internal scheduler started: {len(self._tasks)} jobs "
            f"(outbox={settings.SCHEDULER_OUTBOX_INTERVAL}s, "
            f"health={settings.SCHEDULER_HEALTH_CHECK_INTERVAL}s)"
        )

    async def stop(self):
        """Cancel all running tasks."""
        self._running = False
        for task in self._tasks:
            task.cancel()
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info("Internal scheduler stopped")

    async def _run_periodic(self, name: str, handler, interval_seconds: int):
        """Execute handler on a fixed interval with error isolation."""
        # Initial delay: let the app fully start before first run
        await asyncio.sleep(15)

        while self._running:
            try:
                result = await handler()
                if result:
                    logger.debug(f"Scheduler [{name}]: {result}")
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Scheduler [{name}] failed: {e}")

            try:
                await asyncio.sleep(interval_seconds)
            except asyncio.CancelledError:
                break

    # ------------------------------------------------------------------
    # Job handlers — each acquires its own DB connection from the pool
    # ------------------------------------------------------------------

    async def _process_assignment_outbox(self):
        from app.database.connection import db_manager
        from app.modules.service_requests.services.assignment_outbox_service import (
            assignment_outbox_service,
        )

        async with db_manager.get_connection() as db:
            results = await assignment_outbox_service.process_pending_items(db)
            total = results["processed"] + results["failed"] + results["dead_letter"]
            if total > 0:
                logger.info(
                    f"Outbox cron: {results['processed']} processed, "
                    f"{results['failed']} retrying, "
                    f"{results['dead_letter']} dead-lettered"
                )
                return results
        return None

    async def _assignment_health_check(self):
        from app.database.connection import db_manager
        from app.modules.service_requests.services.assignment_outbox_service import (
            assignment_outbox_service,
        )

        async with db_manager.get_connection() as db:
            results = await assignment_outbox_service.run_health_check(db)
            if results["orphans_found"] > 0 or results["dead_letters"] > 0:
                logger.warning(
                    f"Health check: {results['orphans_found']} orphans "
                    f"({results['orphans_requeued']} requeued), "
                    f"{results['dead_letters']} dead letters, "
                    f"{results['stale_processing_reset']} stale resets"
                )
                return results
        return None

    async def _cleanup_expired_holds(self):
        from app.database.connection import db_manager

        async with db_manager.get_connection() as db:
            result = await db.execute("""
                UPDATE appointment_holds
                SET status = 'expired', released_at = NOW()
                WHERE status = 'held' AND expires_at < NOW()
            """)
            count = 0
            if result:
                try:
                    count = int(result.split()[-1])
                except (ValueError, IndexError):
                    pass
            if count > 0:
                logger.info(f"Expired appointment holds released: {count}")
                return {"released_count": count}
        return None

    async def _escalation_sla_check(self):
        from app.database.connection import db_manager
        from app.modules.service_requests.services.escalation_sla_service import (
            EscalationSLAService,
        )

        async with db_manager.get_connection() as db:
            sla_service = EscalationSLAService()
            results = await sla_service.run_sla_check(db)
            total = (
                results["warnings_sent"]
                + results["escalations_sent"]
                + results["expirations_processed"]
            )
            if total > 0:
                logger.info(
                    f"Escalation SLA: {results['warnings_sent']} warnings, "
                    f"{results['escalations_sent']} escalations, "
                    f"{results['expirations_processed']} expirations"
                )
                return results
        return None

    async def _queue_priority_recalculate(self):
        from app.database.connection import db_manager
        from app.modules.service_requests.services.agent_queue_service import (
            agent_queue_service,
        )

        async with db_manager.get_connection() as db:
            updated = await agent_queue_service.recalculate_pending_priorities(db)
            if updated > 0:
                logger.info(f"Queue priority recalculation: {updated} items boosted")
                return {"items_updated": updated}
        return None

    async def _appointment_reminders(self):
        from app.database.connection import db_manager
        from app.core.events import EventBus, EventType

        tomorrow = date.today() + timedelta(days=1)

        async with db_manager.get_connection() as db:
            appointments = await db.fetch("""
                SELECT
                    sr.id as request_id, sr.user_id, sr.workflow_code,
                    sr.reference, sr.cita_date as appointment_date,
                    sr.cita_time as appointment_time,
                    sr.cita_location as location,
                    u.email, u.phone_number as phone,
                    u.first_name, u.last_name, u.preferred_language
                FROM service_requests sr
                JOIN users u ON u.id = sr.user_id
                WHERE sr.cita_date = $1
                AND sr.status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PAID')
                AND sr.appointment_status IS NULL
                AND sr.reminder_sent_at IS NULL
            """, tomorrow)

            if not appointments:
                return None

            sent = 0
            failed = 0
            for appt in appointments:
                try:
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
                            "service": appt["workflow_code"],
                            "reference": appt["reference"],
                            "appointment_date": str(appt["appointment_date"]) if appt.get("appointment_date") else None,
                            "date": str(appt["appointment_date"]) if appt.get("appointment_date") else None,
                            "appointment_time": str(appt["appointment_time"]) if appt.get("appointment_time") else None,
                            "time": str(appt["appointment_time"]) if appt.get("appointment_time") else None,
                            "location": appt.get("location"),
                        },
                    )
                    await db.execute(
                        "UPDATE service_requests SET reminder_sent_at = NOW() WHERE id = $1",
                        appt["request_id"],
                    )
                    sent += 1
                except Exception as e:
                    logger.error(f"Reminder failed for {appt['request_id']}: {e}")
                    failed += 1

            logger.info(f"Appointment reminders: {sent} sent, {failed} failed")
            return {"sent": sent, "failed": failed}

    async def _payment_sla_check(self):
        from app.database.connection import db_manager
        from app.modules.payments.services.payment_sla_service import PaymentSLAService

        async with db_manager.get_connection() as db:
            sla_service = PaymentSLAService()
            results = await sla_service.run_sla_check(db)
            total = (
                results["warnings_sent"]
                + results["escalations_sent"]
                + results["expirations_processed"]
            )
            if total > 0:
                logger.info(
                    f"Payment SLA: {results['warnings_sent']} warnings, "
                    f"{results['escalations_sent']} escalations, "
                    f"{results['expirations_processed']} expirations"
                )
                return results
        return None

    async def _workload_rebalance(self):
        from app.database.connection import db_manager
        from app.modules.assignment.services.workload_rebalance_service import (
            rebalance_entity_workload,
        )

        async with db_manager.get_connection() as db:
            entities = await db.fetch("""
                SELECT DISTINCT e.id, e.code
                FROM entities e
                JOIN agent_profiles ap ON ap.entity_id = e.id
                WHERE ap.is_active = true AND ap.is_supervisor = false
                AND e.is_active = true
            """)

            if not entities:
                return None

            total = 0
            for entity in entities:
                try:
                    result = await rebalance_entity_workload(
                        entity_id=entity["id"],
                        db=db,
                        performed_by=None,
                    )
                    total += result["reassignments_made"]
                except Exception as e:
                    logger.error(f"Rebalance failed for {entity['code']}: {e}")

            if total > 0:
                logger.info(
                    f"Workload rebalance: {total} reassignments "
                    f"across {len(entities)} entities"
                )
                return {"total_reassigned": total}
        return None


# Singleton
internal_scheduler = InternalScheduler()
