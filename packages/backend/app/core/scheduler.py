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
            (
                "proficiency-30d-rollup",
                self._proficiency_30d_rollup,
                settings.SCHEDULER_DAILY_INTERVAL,
            ),
            (
                "anomaly-detection",
                self._anomaly_detection,
                settings.SCHEDULER_DAILY_INTERVAL,
            ),
            (
                "refresh-treasury-views",
                self._refresh_treasury_views,
                settings.SCHEDULER_DAILY_INTERVAL,
            ),
            (
                "supervisor-weekly-report",
                self._supervisor_weekly_report,
                settings.SCHEDULER_WEEKLY_INTERVAL,
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

    async def _proficiency_30d_rollup(self):
        """Recalculate 30-day rolling counters in agent_workflow_proficiency."""
        from app.database.connection import db_manager

        async with db_manager.get_connection() as db:
            # Step 1: Reset ALL 30d counters to 0 first (avoids stale data bug)
            await db.execute("""
                UPDATE agent_workflow_proficiency
                SET completions_30d = 0, escalations_30d = 0
                WHERE completions_30d > 0 OR escalations_30d > 0
            """)

            # Step 2: Set actual 30d completions from agent_work_queue
            await db.execute("""
                UPDATE agent_workflow_proficiency awp SET
                    completions_30d = sub.cnt
                FROM (
                    SELECT ap.id AS agent_profile_id, q.declaration_type AS workflow_code,
                           COUNT(*) AS cnt
                    FROM agent_work_queue q
                    JOIN agent_profiles ap ON ap.user_id = q.completed_by
                    WHERE q.status = 'completed'
                      AND q.completed_at >= NOW() - INTERVAL '30 days'
                    GROUP BY ap.id, q.declaration_type
                ) sub
                WHERE awp.agent_profile_id = sub.agent_profile_id
                  AND awp.workflow_code = sub.workflow_code
            """)

            # Step 3: Set actual 30d escalations from agent_work_queue
            await db.execute("""
                UPDATE agent_workflow_proficiency awp SET
                    escalations_30d = sub.cnt
                FROM (
                    SELECT ap.id AS agent_profile_id, q.declaration_type AS workflow_code,
                           COUNT(*) AS cnt
                    FROM agent_work_queue q
                    JOIN agent_profiles ap ON ap.user_id = q.escalated_by
                    WHERE q.escalated = true
                      AND q.escalated_at >= NOW() - INTERVAL '30 days'
                    GROUP BY ap.id, q.declaration_type
                ) sub
                WHERE awp.agent_profile_id = sub.agent_profile_id
                  AND awp.workflow_code = sub.workflow_code
            """)

            logger.info("Proficiency 30d rollup completed")
            return {"status": "ok"}

    async def _refresh_treasury_views(self):
        """Refresh materialized views used by treasury analytics dashboard."""
        from app.database.connection import db_manager

        async with db_manager.get_connection() as db:
            # Override statement_timeout: REFRESH can exceed 60s at 1M+ rows
            await db.execute("SET LOCAL statement_timeout = '300000'")
            refreshed = []
            for view in ("mv_treasury_daily_kpis", "mv_reconciliation_stats"):
                try:
                    await db.execute(
                        f"REFRESH MATERIALIZED VIEW CONCURRENTLY {view}"
                    )
                    refreshed.append(view)
                except Exception as e:
                    # CONCURRENTLY requires a unique index; fall back to blocking refresh
                    try:
                        await db.execute(f"REFRESH MATERIALIZED VIEW {view}")
                        refreshed.append(view)
                    except Exception as e2:
                        logger.error(f"Failed to refresh {view}: {e2}")

            if refreshed:
                logger.info(f"Treasury views refreshed: {', '.join(refreshed)}")
                return {"refreshed": refreshed}
        return None

    async def _anomaly_detection(self):
        """Detect assignment anomalies: queue spikes, underperformers, imbalances."""
        from app.database.connection import db_manager
        from app.config import get_settings

        settings = get_settings()
        anomalies = []
        actions_taken = []

        async with db_manager.get_connection() as db:
            # 1. Queue spike detection: pending items much higher than normal
            daily_avg = 1.0  # Default for corrective actions
            queue_stats = await db.fetchrow("""
                SELECT
                    COUNT(*) FILTER (WHERE status = 'pending') AS pending,
                    COUNT(*) FILTER (WHERE status = 'assigned') AS assigned,
                    COUNT(*) FILTER (WHERE status = 'completed'
                        AND completed_at >= NOW() - INTERVAL '7 days') AS completed_7d
                FROM agent_work_queue
            """)
            if queue_stats:
                pending = queue_stats["pending"] or 0
                completed_7d = queue_stats["completed_7d"] or 0
                daily_avg = completed_7d / 7.0 if completed_7d > 0 else 1.0
                if pending > daily_avg * settings.ANOMALY_QUEUE_SPIKE_MULTIPLIER:
                    anomalies.append(
                        f"QUEUE_SPIKE: {pending} pending vs "
                        f"{daily_avg:.0f}/day avg (>{settings.ANOMALY_QUEUE_SPIKE_MULTIPLIER}x)"
                    )

            # 2. Underperforming agents: success_rate below threshold with enough data
            underperformers = await db.fetch("""
                SELECT awp.agent_profile_id, awp.workflow_code,
                       awp.success_rate, awp.completions_total, awp.escalations_total
                FROM agent_workflow_proficiency awp
                WHERE awp.completions_total + awp.escalations_total >= $1
                  AND awp.success_rate < $2
            """, settings.ESCALATION_PREDICTIVE_MIN_COMPLETIONS,
                settings.ANOMALY_UNDERPERFORMER_THRESHOLD)
            for row in underperformers:
                anomalies.append(
                    f"UNDERPERFORMER: agent {row['agent_profile_id']} "
                    f"workflow={row['workflow_code']} "
                    f"success_rate={row['success_rate']}% "
                    f"({row['completions_total']}C/{row['escalations_total']}E)"
                )

            # 3. Processing time spike: avg much higher than expected
            slow_workflows = await db.fetch("""
                SELECT workflow_code,
                       AVG(avg_processing_hours) AS avg_hours,
                       COUNT(*) AS agent_count
                FROM agent_workflow_proficiency
                WHERE completions_total > 0
                GROUP BY workflow_code
                HAVING AVG(avg_processing_hours) > $1
            """, settings.ANOMALY_PROCESSING_TIME_SPIKE_HOURS)
            for row in slow_workflows:
                anomalies.append(
                    f"SLOW_WORKFLOW: {row['workflow_code']} "
                    f"avg={row['avg_hours']:.1f}h across {row['agent_count']} agents"
                )

            # 4. Rejection patterns: agents with high rejection rate
            rejection_patterns = await db.fetch("""
                SELECT
                    a.agent_profile_id,
                    u.full_name AS agent_name,
                    COUNT(*) FILTER (
                        WHERE srh.new_status::text IN ('REJECTED', 'rejected')
                    ) AS rejections,
                    COUNT(*) AS total_actions
                FROM service_request_history srh
                JOIN assignments a ON a.item_id = srh.service_request_id
                    AND a.agent_profile_id IS NOT NULL
                JOIN agent_profiles ap ON ap.id = a.agent_profile_id
                JOIN users u ON u.id = ap.user_id
                WHERE srh.action = 'status_change'
                  AND srh.created_at >= NOW() - MAKE_INTERVAL(days => $1)
                GROUP BY a.agent_profile_id, u.full_name
                HAVING COUNT(*) >= $2
                   AND COUNT(*) FILTER (
                       WHERE srh.new_status::text IN ('REJECTED', 'rejected')
                   ) * 1.0 / COUNT(*) > $3
            """, settings.ANOMALY_REJECTION_LOOKBACK_DAYS,
                settings.ANOMALY_REJECTION_MIN_ACTIONS,
                settings.ANOMALY_REJECTION_RATE_THRESHOLD)
            for row in rejection_patterns:
                anomalies.append(
                    f"REJECTION_PATTERN: {row['agent_name']} "
                    f"{row['rejections']}/{row['total_actions']} rejections in 7 days"
                )

            # 5. Site imbalance: some entities have much more pending than others
            site_imbalance = await db.fetch("""
                SELECT entity_code, COUNT(*) AS pending_count
                FROM agent_work_queue
                WHERE status = 'pending' AND entity_code IS NOT NULL
                GROUP BY entity_code
                ORDER BY pending_count DESC
            """)
            if len(site_imbalance) >= 2:
                max_pending = site_imbalance[0]["pending_count"]
                min_pending = site_imbalance[-1]["pending_count"]
                if max_pending > 0 and min_pending >= 0 and max_pending > min_pending * settings.ANOMALY_SITE_IMBALANCE_MULTIPLIER:
                    anomalies.append(
                        f"SITE_IMBALANCE: {site_imbalance[0]['entity_code']}="
                        f"{max_pending} vs {site_imbalance[-1]['entity_code']}="
                        f"{min_pending}"
                    )

            # 6. Dead-letter items: failed all retries, need manual attention
            dead_count = await db.fetchval(
                "SELECT COUNT(*) FROM assignment_outbox WHERE status = 'dead_letter'"
            )
            if dead_count and dead_count > 0:
                anomalies.append(
                    f"DEAD_LETTER: {dead_count} items failed all retries "
                    f"and need manual attention"
                )

            # === CORRECTIVE ACTIONS ===
            actions_taken = []

            # Action 1: SITE_IMBALANCE → trigger rebalance for overloaded entities
            from app.modules.assignment.services.workload_rebalance_service import (
                rebalance_entity_workload,
            )
            for row in site_imbalance:
                if row["pending_count"] > daily_avg * settings.ANOMALY_QUEUE_SPIKE_MULTIPLIER:
                    try:
                        entity = await db.fetchrow(
                            "SELECT id FROM entities WHERE code = $1",
                            row["entity_code"],
                        )
                        if entity:
                            result = await rebalance_entity_workload(
                                entity_id=entity["id"], db=db, performed_by=None,
                            )
                            if result["reassignments_made"] > 0:
                                actions_taken.append(
                                    f"REBALANCE: {row['entity_code']} "
                                    f"→ {result['reassignments_made']} moved"
                                )
                    except Exception as e:
                        logger.error(
                            f"Auto-rebalance failed for {row['entity_code']}: {e}"
                        )

            # Action 2: UNDERPERFORMER → reduce max_concurrent_assignments
            for row in underperformers:
                try:
                    current_max = await db.fetchval(
                        "SELECT max_concurrent_assignments FROM agent_workloads "
                        "WHERE agent_profile_id = $1",
                        row["agent_profile_id"],
                    )
                    if current_max and current_max > settings.ANOMALY_CAPACITY_MIN_FLOOR:
                        new_max = max(settings.ANOMALY_CAPACITY_MIN_FLOOR, current_max - settings.ANOMALY_CAPACITY_REDUCTION_STEP)
                        await db.execute(
                            "UPDATE agent_workloads "
                            "SET max_concurrent_assignments = $2, updated_at = NOW() "
                            "WHERE agent_profile_id = $1",
                            row["agent_profile_id"], new_max,
                        )
                        actions_taken.append(
                            f"CAPACITY_REDUCED: agent {row['agent_profile_id']} "
                            f"max_assignments {current_max} → {new_max}"
                        )
                except Exception as e:
                    logger.error(f"Capacity reduction failed: {e}")

            if actions_taken:
                for act in actions_taken:
                    logger.info(f"Anomaly action: {act}")

        # Store results in Redis cache for supervisor dashboard consumption
        try:
            from app.core.cache import get_cache
            cache = get_cache()
            anomaly_data = {
                "detected_at": datetime.now().isoformat(),
                "anomalies": [
                    {
                        "type": a.split(":")[0].strip(),
                        "message": a,
                        "severity": "critical" if "UNDERPERFORMER" in a or "QUEUE_SPIKE" in a else "warning",
                    }
                    for a in anomalies
                ],
                "count": len(anomalies),
                "actions_taken": actions_taken,
            }
            await cache.set("supervisor:anomalies:latest", anomaly_data, ttl=86400)
        except Exception as e:
            logger.warning(f"Failed to cache anomaly results: {e}")

        if anomalies:
            for a in anomalies:
                logger.warning(f"Anomaly detected: {a}")
            return {"anomalies": anomalies, "count": len(anomalies)}

        # Clear cache when no anomalies
        try:
            from app.core.cache import get_cache
            cache = get_cache()
            await cache.set("supervisor:anomalies:latest", {
                "detected_at": datetime.now().isoformat(),
                "anomalies": [],
                "count": 0,
            }, ttl=86400)
        except Exception:
            pass

        return None

    async def _supervisor_weekly_report(self):
        """Send weekly performance report email to all active supervisors."""
        import asyncio
        import json as json_mod
        from app.database.connection import db_manager
        from app.config import get_settings

        settings = get_settings()

        async with db_manager.get_connection() as db:
            supervisors = await db.fetch("""
                SELECT ap.user_id, u.email, u.full_name, ap.entity_id,
                       e.code as entity_code, e.name as entity_name
                FROM agent_profiles ap
                JOIN users u ON u.id = ap.user_id
                JOIN entities e ON e.id = ap.entity_id
                WHERE ap.is_supervisor = true AND ap.is_active = true
                AND u.status = 'active'
            """)

            if not supervisors:
                return None

            from app.modules.communications.services.communication_service import CommunicationService
            from app.modules.communications.models.communication import CommunicationType

            comm_service = CommunicationService()
            emails_sent = 0
            emails_failed = 0

            for sup in supervisors:
                try:
                    wf_codes = await db.fetchval(
                        "SELECT workflow_codes FROM entities WHERE id = $1", sup['entity_id']
                    )
                    if isinstance(wf_codes, str):
                        wf_codes = json_mod.loads(wf_codes)
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

                    entity_name = html_escape(sup['entity_name'] or sup['entity_code'] or '')
                    sup_name = html_escape(sup['full_name'] or 'Supervisor')
                    avg_hours = round(float(stats['avg_processing_hours'] or 0), 1)
                    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://taxasge.web.app')
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
                                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Tiempo promedio</td>
                                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">{avg_hours}h</td>
                            </tr>
                        </table>
                        <p style="font-size: 12px; color: #6b7280;">
                            Este reporte se genera automáticamente cada lunes.
                            <a href="{frontend_url}/dashboard/supervisor">Panel de supervisión</a>
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

            if emails_sent > 0 or emails_failed > 0:
                logger.info(f"Supervisor weekly reports: {emails_sent} sent, {emails_failed} failed")
                return {"emails_sent": emails_sent, "emails_failed": emails_failed}
        return None


# Singleton
internal_scheduler = InternalScheduler()
