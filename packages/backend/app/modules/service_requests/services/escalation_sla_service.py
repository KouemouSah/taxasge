"""
Escalation SLA Service
======================
Monitors service request escalations pending supervisor attention and handles:
1. 4h warning → Email with HTML table to entity supervisors
2. 24h escalation → Email to admins, priority boost to URGENT
3. 72h expiration → Auto-resolve escalation, email citizen

Called by cron endpoint: POST /api/v1/internal/cron/escalation-sla-check

Architecture:
- 3 batch SQL queries (UPDATE...WHERE...RETURNING) - O(1) regardless of row count
- Partial index idx_sr_escalation_sla_pending for fast lookups
- HTML table format emails (1 consolidated email per recipient)
- CommunicationService for email delivery
"""

import asyncio
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from loguru import logger

from app.modules.communications.services.communication_service import CommunicationService
from app.modules.communications.models.communication import CommunicationType


# =============================================================================
# SLA THRESHOLDS
# =============================================================================

ESCALATION_SLA_WARNING_HOURS = 4       # 4h → warning to entity supervisors
ESCALATION_SLA_ESCALATION_HOURS = 24   # 24h → escalate to admins, priority URGENT
ESCALATION_SLA_EXPIRATION_HOURS = 72   # 72h → auto-resolve escalation


# =============================================================================
# WORKFLOW LABELS (for readable emails)
# =============================================================================

WORKFLOW_LABELS = {
    "PASAPORTE": "Pasaporte",
    "CONDUCIR": "Permiso de Conducir",
    "CONTRATO": "Contrato ONRC",
    "RESIDENCIA": "Tarjeta de Residencia",
    "MATRICULACION": "Matriculacion de Vehiculo",
    "INSPECCION_TECNICA": "Inspeccion Tecnica (ITVE)",
    "DUPLICADO_VEHICULO": "Duplicado Vehiculo",
    "PROMOCION_ADMINISTRATIVA": "Promocion Administrativa",
    "CARNET_FUNCIONARIO": "Carnet de Funcionario",
    "VERIFICACION_FUNCIONARIO": "Verificacion de Funcionario",
    "PRORROGA_VISADO": "Prorroga de Visado",
    "VISADO_ALTERNATIVO": "Visado Alternativo",
    "PERMISO_PERMANENCIA": "Permiso de Permanencia",
    "SALIDA_VISADO_VENCIDO": "Salida con Visado Vencido",
    "PERMISO_EXTRAORDINARIO": "Permiso Extraordinario",
    "CERTIFICADO_ADMINISTRATIVO": "Certificado Administrativo",
}


class EscalationSLAService:
    """Monitors escalated service requests and enforces SLA timelines."""

    def __init__(self):
        self.communication_service = CommunicationService()

    async def run_sla_check(self, db) -> Dict[str, Any]:
        """
        Run all 3 SLA checks in sequence.
        Returns summary of actions taken.
        """
        results = {
            "warnings_sent": 0,
            "escalations_sent": 0,
            "expirations_processed": 0,
            "errors": [],
        }

        # 1. 4h warning → entity supervisors
        try:
            warned = await self._process_warnings(db)
            results["warnings_sent"] = warned
        except Exception as e:
            logger.error(f"Escalation SLA warning check failed: {e}")
            results["errors"].append(f"warnings: {str(e)}")

        # 2. 24h escalation → admins
        try:
            escalated = await self._process_escalations(db)
            results["escalations_sent"] = escalated
        except Exception as e:
            logger.error(f"Escalation SLA escalation check failed: {e}")
            results["errors"].append(f"escalations: {str(e)}")

        # 3. 72h auto-resolve
        try:
            expired = await self._process_expirations(db)
            results["expirations_processed"] = expired
        except Exception as e:
            logger.error(f"Escalation SLA expiration check failed: {e}")
            results["errors"].append(f"expirations: {str(e)}")

        return results

    # =========================================================================
    # STEP 1: 4h WARNING → ENTITY SUPERVISORS
    # =========================================================================

    async def _process_warnings(self, db) -> int:
        """
        Find escalated requests pending > 4h that haven't been warned yet.
        Send 1 consolidated email per entity's supervisors with HTML table.
        """
        warning_threshold = datetime.now(timezone.utc) - timedelta(
            hours=ESCALATION_SLA_WARNING_HOURS
        )

        warned_requests = await db.fetch("""
            UPDATE service_requests sr
            SET escalation_sla_warning_sent = true, updated_at = NOW()
            FROM users esc_user
            WHERE esc_user.id = sr.escalated_by
              AND sr.escalated = true
              AND sr.escalation_sla_warning_sent = false
              AND sr.escalated_at < $1
            RETURNING
                sr.id, sr.reference, sr.workflow_code, sr.entity_code,
                sr.escalation_reason, sr.escalated_at,
                esc_user.first_name as esc_first, esc_user.last_name as esc_last
        """, warning_threshold)

        if not warned_requests:
            logger.info("Escalation SLA warning: no requests to warn")
            return 0

        logger.info(
            f"Escalation SLA warning: {len(warned_requests)} requests marked"
        )

        # Group by entity_code for consolidated emails
        by_entity: Dict[str, list] = {}
        for row in warned_requests:
            entity = row["entity_code"] or "UNKNOWN"
            by_entity.setdefault(entity, []).append(row)

        for entity_code, requests in by_entity.items():
            supervisor_emails = await self._get_entity_supervisor_emails(
                db, entity_code
            )
            if not supervisor_emails:
                logger.warning(
                    f"Escalation SLA: no supervisors for entity {entity_code}"
                )
                continue

            html_body = self._build_warning_email_html(requests)
            subject = (
                f"[SLA] {len(requests)} escalacion(es) pendiente(s) > "
                f"{ESCALATION_SLA_WARNING_HOURS}h - TaxasGE"
            )
            for email in supervisor_emails:
                await self._send_email_async(email, subject, html_body)

        return len(warned_requests)

    # =========================================================================
    # STEP 2: 24h ESCALATION → ADMINS
    # =========================================================================

    async def _process_escalations(self, db) -> int:
        """
        Find escalated requests pending > 24h (already warned).
        Boost priority to URGENT, email admins.
        """
        escalation_threshold = datetime.now(timezone.utc) - timedelta(
            hours=ESCALATION_SLA_ESCALATION_HOURS
        )

        escalated_requests = await db.fetch("""
            UPDATE service_requests sr
            SET escalation_sla_escalated = true,
                priority = 'URGENT',
                updated_at = NOW()
            FROM users esc_user
            WHERE esc_user.id = sr.escalated_by
              AND sr.escalated = true
              AND sr.escalation_sla_warning_sent = true
              AND sr.escalation_sla_escalated = false
              AND sr.escalated_at < $1
            RETURNING
                sr.id, sr.reference, sr.workflow_code, sr.entity_code,
                sr.escalation_reason, sr.escalated_at,
                esc_user.first_name as esc_first, esc_user.last_name as esc_last
        """, escalation_threshold)

        if not escalated_requests:
            logger.info("Escalation SLA escalation: no requests to escalate")
            return 0

        logger.info(
            f"Escalation SLA escalation: {len(escalated_requests)} requests"
        )

        # Insert history entries
        for row in escalated_requests:
            try:
                await db.execute("""
                    INSERT INTO service_request_history
                    (service_request_id, action, performed_at, comment, details)
                    VALUES ($1, 'escalation_sla_escalated', NOW(),
                            'Escalation SLA: auto-escalated to admin after 24h',
                            '{"sla_hours": 24}'::jsonb)
                """, row["id"])
            except Exception as e:
                logger.warning(
                    f"Failed to insert SLA history for {row['reference']}: {e}"
                )

        # Email admins
        admin_emails = await self._get_admin_emails(db)
        if not admin_emails:
            logger.warning("Escalation SLA: no admin emails found")
            return len(escalated_requests)

        html_body = self._build_escalation_email_html(escalated_requests)
        subject = (
            f"[URGENTE] {len(escalated_requests)} escalacion(es) sin resolver > "
            f"{ESCALATION_SLA_ESCALATION_HOURS}h - TaxasGE"
        )
        for email in admin_emails:
            await self._send_email_async(email, subject, html_body)

        return len(escalated_requests)

    # =========================================================================
    # STEP 3: 72h AUTO-RESOLVE
    # =========================================================================

    async def _process_expirations(self, db) -> int:
        """
        Find escalated requests pending > 72h (already escalated to admin).
        Auto-resolve: clear escalation fields, log history.
        """
        expiration_threshold = datetime.now(timezone.utc) - timedelta(
            hours=ESCALATION_SLA_EXPIRATION_HOURS
        )

        expired_requests = await db.fetch("""
            UPDATE service_requests sr
            SET escalated = false,
                escalated_at = NULL,
                escalated_by = NULL,
                escalation_reason = NULL,
                escalation_sla_warning_sent = false,
                escalation_sla_escalated = false,
                updated_at = NOW()
            FROM users u
            WHERE u.id = sr.user_id
              AND sr.escalated = true
              AND sr.escalation_sla_escalated = true
              AND sr.escalated_at < $1
            RETURNING
                sr.id, sr.reference, sr.workflow_code, sr.entity_code,
                u.email as citizen_email, u.first_name, u.last_name,
                u.preferred_language
        """, expiration_threshold)

        if not expired_requests:
            logger.info("Escalation SLA expiration: no requests to expire")
            return 0

        logger.info(
            f"Escalation SLA expiration: {len(expired_requests)} requests auto-resolved"
        )

        # Insert history entries
        for row in expired_requests:
            try:
                await db.execute("""
                    INSERT INTO service_request_history
                    (service_request_id, action, performed_at, comment, details)
                    VALUES ($1, 'escalation_sla_expired', NOW(),
                            'Escalation auto-resolved: SLA 72h exceeded',
                            '{"sla_hours": 72}'::jsonb)
                """, row["id"])
            except Exception as e:
                logger.warning(
                    f"Failed to insert SLA expiry history for {row['reference']}: {e}"
                )

        # Email admins about auto-resolved escalations
        admin_emails = await self._get_admin_emails(db)
        if admin_emails:
            html = self._build_expiration_admin_email(expired_requests)
            subject = (
                f"[INFO] {len(expired_requests)} escalacion(es) auto-resuelta(s) "
                f"por SLA {ESCALATION_SLA_EXPIRATION_HOURS}h - TaxasGE"
            )
            for email in admin_emails:
                await self._send_email_async(email, subject, html)

        return len(expired_requests)

    # =========================================================================
    # HELPERS: Get recipient emails
    # =========================================================================

    async def _get_entity_supervisor_emails(
        self, db, entity_code: str
    ) -> List[str]:
        """Get supervisor emails for a specific entity."""
        rows = await db.fetch("""
            SELECT DISTINCT u.email
            FROM agent_profiles ap
            JOIN users u ON u.id = ap.user_id
            JOIN entities e ON e.id = ap.entity_id
            WHERE e.code = $1
              AND ap.is_active = true
              AND ap.is_supervisor = true
              AND u.email IS NOT NULL
        """, entity_code)
        return [r["email"] for r in rows]

    async def _get_admin_emails(self, db) -> List[str]:
        """Get admin user emails via users.role_id → roles.id (direct FK)."""
        rows = await db.fetch("""
            SELECT DISTINCT u.email
            FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE r.code = 'admin'
              AND u.status = 'active'
              AND u.email IS NOT NULL
        """)
        return [r["email"] for r in rows]

    # =========================================================================
    # HELPER: Send email
    # =========================================================================

    async def _send_email_async(
        self, recipient: str, subject: str, html_body: str
    ) -> bool:
        """Send email via CommunicationService (sync → async via executor)."""
        try:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(
                None,
                lambda: self.communication_service.send_communication(
                    channel=CommunicationType.EMAIL,
                    recipient=recipient,
                    subject=subject,
                    content=html_body,
                ),
            )
        except Exception as e:
            logger.error(f"Failed to send escalation SLA email to {recipient}: {e}")
            return False

    # =========================================================================
    # HTML BUILDERS: Warning email (4h)
    # =========================================================================

    def _build_warning_email_html(self, requests: list) -> str:
        """Build HTML table of escalations pending > 4h."""
        rows_html = ""
        for r in requests:
            escalated_at = (
                r["escalated_at"].strftime("%d/%m/%Y %H:%M")
                if r["escalated_at"]
                else "-"
            )
            hours = self._hours_since(r["escalated_at"])
            label = WORKFLOW_LABELS.get(r["workflow_code"], r["workflow_code"])
            agent = f"{r['esc_first'] or ''} {r['esc_last'] or ''}".strip()
            rows_html += f"""
            <tr>
                <td style="padding:8px;border:1px solid #e5e7eb;">{r['reference']}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">{label}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">{agent}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">{r['escalation_reason'][:80] if r['escalation_reason'] else '-'}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">{escalated_at}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;color:#dc2626;font-weight:bold;">{hours}h</td>
            </tr>"""

        return self._wrap_email(
            title="Escalaciones pendientes de revision",
            subtitle=f"{len(requests)} escalacion(es) sin resolver desde hace mas de {ESCALATION_SLA_WARNING_HOURS} horas.",
            intro="Las siguientes escalaciones requieren su atencion:",
            headers=["Referencia", "Servicio", "Agente", "Motivo", "Escalada el", "Espera"],
            rows=rows_html,
            action_text="Por favor, revise y resuelva estas escalaciones lo antes posible.",
            color="#f59e0b",
        )

    # =========================================================================
    # HTML BUILDERS: Escalation email (24h)
    # =========================================================================

    def _build_escalation_email_html(self, requests: list) -> str:
        """Build HTML table of escalations unresolved > 24h."""
        rows_html = ""
        for r in requests:
            escalated_at = (
                r["escalated_at"].strftime("%d/%m/%Y %H:%M")
                if r["escalated_at"]
                else "-"
            )
            hours = self._hours_since(r["escalated_at"])
            label = WORKFLOW_LABELS.get(r["workflow_code"], r["workflow_code"])
            agent = f"{r['esc_first'] or ''} {r['esc_last'] or ''}".strip()
            rows_html += f"""
            <tr>
                <td style="padding:8px;border:1px solid #e5e7eb;">{r['reference']}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">{label}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">{r['entity_code'] or '-'}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">{agent}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">{escalated_at}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;color:#dc2626;font-weight:bold;">{hours}h</td>
            </tr>"""

        return self._wrap_email(
            title="ESCALATION: Escalaciones sin resolver",
            subtitle=f"{len(requests)} escalacion(es) sin resolver desde hace mas de {ESCALATION_SLA_ESCALATION_HOURS} horas. Prioridad establecida a URGENTE.",
            intro="Las siguientes escalaciones han superado el plazo maximo y han sido escaladas al administrador:",
            headers=["Referencia", "Servicio", "Entidad", "Agente", "Escalada el", "Espera"],
            rows=rows_html,
            action_text=f"Si no se resuelven antes de {ESCALATION_SLA_EXPIRATION_HOURS}h, seran auto-resueltas automaticamente.",
            color="#dc2626",
        )

    # =========================================================================
    # HTML BUILDERS: Expiration admin notification
    # =========================================================================

    def _build_expiration_admin_email(self, requests: list) -> str:
        """Build HTML table of auto-resolved escalations."""
        rows_html = ""
        for r in requests:
            label = WORKFLOW_LABELS.get(r["workflow_code"], r["workflow_code"])
            citizen = f"{r['first_name'] or ''} {r['last_name'] or ''}".strip()
            rows_html += f"""
            <tr>
                <td style="padding:8px;border:1px solid #e5e7eb;">{r['reference']}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">{label}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">{r['entity_code'] or '-'}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">{citizen}</td>
            </tr>"""

        return self._wrap_email(
            title="Escalaciones auto-resueltas por SLA",
            subtitle=f"{len(requests)} escalacion(es) han sido auto-resueltas por inactividad ({ESCALATION_SLA_EXPIRATION_HOURS}h).",
            intro="Las siguientes escalaciones no fueron atendidas y han sido cerradas automaticamente:",
            headers=["Referencia", "Servicio", "Entidad", "Ciudadano"],
            rows=rows_html,
            action_text="Estas solicitudes vuelven a la cola de tratamiento normal. Revise si requieren atencion adicional.",
            color="#6b7280",
        )

    # =========================================================================
    # HTML: Common wrapper
    # =========================================================================

    def _wrap_email(
        self,
        title: str,
        subtitle: str,
        intro: str,
        headers: List[str],
        rows: str,
        action_text: str,
        color: str,
    ) -> str:
        """Wrap table content in professional email layout."""
        headers_html = "".join(
            f'<th style="padding:8px;border:1px solid #e5e7eb;background-color:{color};color:#fff;text-align:left;">{h}</th>'
            for h in headers
        )
        now = datetime.utcnow().strftime("%d/%m/%Y %H:%M UTC")

        return f"""
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#f5f5f5;">
            <div style="padding:20px;">
                <div style="max-width:800px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <div style="background:{color};padding:20px 30px;">
                        <h1 style="color:#fff;margin:0;font-size:22px;">{title}</h1>
                        <p style="color:rgba(255,255,255,0.9);margin:5px 0 0;font-size:14px;">{subtitle}</p>
                    </div>
                    <div style="padding:30px;">
                        <p style="font-size:15px;color:#333;">{intro}</p>
                        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:13px;">
                            <thead><tr>{headers_html}</tr></thead>
                            <tbody>{rows}</tbody>
                        </table>
                        <div style="background-color:#fef3cd;border:1px solid #ffc107;border-radius:4px;padding:12px 16px;margin-top:20px;">
                            <strong>Accion requerida:</strong> {action_text}
                        </div>
                    </div>
                    <div style="background:#f9fafb;padding:15px 30px;border-top:1px solid #e5e7eb;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#6b7280;">
                            Mensaje automatico generado el {now} - TaxasGE Platform
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

    # =========================================================================
    # UTILITY
    # =========================================================================

    @staticmethod
    def _hours_since(dt: Optional[datetime]) -> int:
        """Calculate hours since a datetime."""
        if not dt:
            return 0
        now = datetime.now(timezone.utc)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        delta = now - dt
        return int(delta.total_seconds() / 3600)
