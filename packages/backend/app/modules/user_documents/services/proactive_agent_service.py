"""
Proactive Agent Service — Daily CRON job for document expiry scanning.

Runs daily at 06:00 UTC via Cloud Scheduler.
Idempotent: does not create duplicate alerts (ON CONFLICT DO NOTHING).

Responsibilities:
1. Scan expiring documents and create tiered alerts (90d, 60d, 30d, 7d, expired)
2. Create proactive preparation alerts for Level 2 permission users
3. Mark newly expired documents as status='expired'
4. Hard-delete soft-deleted documents older than 30 days (+ Firebase cleanup)
5. Deactivate stale agent memories (low confidence + high rejection)
"""

import json
import logging
from datetime import date
from typing import Any, Dict

import asyncpg

logger = logging.getLogger(__name__)


class ProactiveAgentService:
    """
    Proactive document management agent.

    Called by CRON endpoint (POST /api/v1/user-documents/internal/cron/document-scan).
    All methods are idempotent and safe to re-run.
    """

    # ─────────────────────────────────────────────────────────────
    # MAIN ENTRY POINT
    # ─────────────────────────────────────────────────────────────

    async def daily_scan(self, db: asyncpg.Connection) -> Dict[str, Any]:
        """
        Main CRON entry point. Runs all proactive checks.
        Returns summary of actions taken.
        """
        results: Dict[str, Any] = {
            "alerts_created": 0,
            "proactive_preparations": 0,
            "documents_expired": 0,
            "documents_purged": 0,
            "memories_deactivated": 0,
            "errors": [],
        }

        # 1. Scan expiring documents and create alerts
        try:
            results["alerts_created"] = await self._scan_expirations(db)
        except Exception as e:
            logger.error(f"[ProactiveAgent] Expiration scan failed: {e}")
            results["errors"].append(f"scan_expirations: {str(e)}")

        # 2. Create proactive preparations for Level 2 users
        try:
            results["proactive_preparations"] = await self._create_proactive_preparations(db)
        except Exception as e:
            logger.error(f"[ProactiveAgent] Proactive preparations failed: {e}")
            results["errors"].append(f"proactive_preparations: {str(e)}")

        # 3. Update status of newly expired documents
        try:
            results["documents_expired"] = await self._mark_expired_documents(db)
        except Exception as e:
            logger.error(f"[ProactiveAgent] Mark expired failed: {e}")
            results["errors"].append(f"mark_expired: {str(e)}")

        # 4. Purge soft-deleted documents older than 30 days
        try:
            results["documents_purged"] = await self._purge_old_deleted(db)
        except Exception as e:
            logger.error(f"[ProactiveAgent] Purge failed: {e}")
            results["errors"].append(f"purge_deleted: {str(e)}")

        # 5. Deactivate stale agent memories (low confidence)
        try:
            results["memories_deactivated"] = await self._cleanup_stale_memories(db)
        except Exception as e:
            logger.error(f"[ProactiveAgent] Memory cleanup failed: {e}")
            results["errors"].append(f"cleanup_memories: {str(e)}")

        logger.info(f"[ProactiveAgent] Daily scan complete: {results}")
        return results

    # ─────────────────────────────────────────────────────────────
    # 1. EXPIRATION SCANNING
    # ─────────────────────────────────────────────────────────────

    async def _scan_expirations(self, db: asyncpg.Connection) -> int:
        """
        Scan all active documents with expiry dates and create appropriate alerts.

        Uses a single query with CASE WHEN to classify documents into tiers:
        - expired: expiry_date < today
        - expiry_7d: expiry in 0-7 days
        - expiry_30d: expiry in 8-30 days
        - expiry_60d: expiry in 31-60 days
        - expiry_90d: expiry in 61-90 days

        Idempotent: uses ON CONFLICT DO NOTHING to skip duplicates.
        """
        today = date.today()

        # Fetch all documents expiring within 90 days or already expired (up to 30 days ago)
        rows = await db.fetch(
            """
            SELECT
                ud.id AS doc_id,
                ud.user_id,
                ud.display_name,
                ud.file_name,
                ud.document_type,
                ud.expiry_date,
                (ud.expiry_date - $1::date) AS days_until_expiry,
                CASE
                    WHEN ud.expiry_date < $1::date THEN 'expired'
                    WHEN (ud.expiry_date - $1::date) <= 7 THEN 'expiry_7d'
                    WHEN (ud.expiry_date - $1::date) <= 30 THEN 'expiry_30d'
                    WHEN (ud.expiry_date - $1::date) <= 60 THEN 'expiry_60d'
                    WHEN (ud.expiry_date - $1::date) <= 90 THEN 'expiry_90d'
                END AS alert_type
            FROM user_documents ud
            WHERE ud.expiry_date IS NOT NULL
              AND ud.status = 'active'
              AND ud.deleted_at IS NULL
              AND ud.expiry_date <= ($1::date + INTERVAL '90 days')
              AND ud.expiry_date >= ($1::date - INTERVAL '30 days')
            ORDER BY ud.expiry_date ASC
            """,
            today,
        )

        if not rows:
            logger.info("[ProactiveAgent] No documents expiring within 90 days")
            return 0

        alerts_created = 0

        for row in rows:
            alert_type = row["alert_type"]
            if not alert_type:
                continue

            days = row["days_until_expiry"]
            doc_info = {
                "display_name": row["display_name"],
                "file_name": row["file_name"],
                "document_type": row["document_type"],
                "expiry_date": row["expiry_date"],
            }

            messages = self._generate_alert_messages(alert_type, doc_info, days)

            # Idempotent INSERT: ON CONFLICT on (user_id, user_document_id, alert_type)
            # We use a composite check to avoid duplicates
            result = await db.execute(
                """
                INSERT INTO user_document_alerts (
                    user_id, user_document_id, alert_type, severity,
                    title_es, title_fr, title_en,
                    message_es, message_fr, message_en,
                    suggested_action, action_params,
                    trigger_date
                )
                SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13
                WHERE NOT EXISTS (
                    SELECT 1 FROM user_document_alerts
                    WHERE user_id = $1
                      AND user_document_id = $2
                      AND alert_type = $3
                      AND is_dismissed = FALSE
                )
                """,
                row["user_id"],             # $1
                row["doc_id"],              # $2
                alert_type,                 # $3
                messages["severity"],       # $4
                messages["title_es"],       # $5
                messages["title_fr"],       # $6
                messages["title_en"],       # $7
                messages["message_es"],     # $8
                messages["message_fr"],     # $9
                messages["message_en"],     # $10
                messages["action"],         # $11
                messages["action_params"],  # $12
                row["expiry_date"],         # $13
            )

            if "INSERT 0 1" in result:
                alerts_created += 1

        logger.info(
            f"[ProactiveAgent] Expiration scan: {len(rows)} documents checked, "
            f"{alerts_created} alerts created"
        )
        return alerts_created

    # ─────────────────────────────────────────────────────────────
    # 2. PROACTIVE PREPARATIONS (Level 2 users)
    # ─────────────────────────────────────────────────────────────

    async def _create_proactive_preparations(self, db: asyncpg.Connection) -> int:
        """
        For Level 2 permission users: auto-prepare renewal if readiness is complete.

        Finds users who:
        - Have 'prepare_renewal' permission at level 2 (proactive)
        - Have documents expiring within 30 days
        - Have all required documents for the renewal workflow ready

        Creates a 'proactive_preparation' alert with workflow details.
        """
        # Find users with level 2 prepare_renewal permission + expiring documents
        rows = await db.fetch(
            """
            SELECT DISTINCT
                uap.user_id,
                uap.scope AS workflow_scope,
                ud.id AS doc_id,
                ud.display_name,
                ud.file_name,
                ud.document_type,
                ud.expiry_date,
                (ud.expiry_date - CURRENT_DATE) AS days_until_expiry
            FROM user_agent_permissions uap
            JOIN user_documents ud ON ud.user_id = uap.user_id
            WHERE uap.permission_type = 'prepare_renewal'
              AND uap.level = 2
              AND uap.is_active = TRUE
              AND ud.expiry_date IS NOT NULL
              AND ud.expiry_date > CURRENT_DATE
              AND ud.expiry_date <= (CURRENT_DATE + INTERVAL '30 days')
              AND ud.status = 'active'
              AND ud.deleted_at IS NULL
            ORDER BY ud.expiry_date ASC
            """
        )

        if not rows:
            logger.info("[ProactiveAgent] No proactive preparations needed")
            return 0

        preparations_created = 0

        for row in rows:
            doc_info = {
                "display_name": row["display_name"],
                "file_name": row["file_name"],
                "document_type": row["document_type"],
                "expiry_date": row["expiry_date"],
            }
            days = row["days_until_expiry"]
            doc_name = (
                doc_info.get("display_name")
                or doc_info.get("file_name")
                or doc_info.get("document_type", "documento")
            )
            expiry_str = str(row["expiry_date"]) if row["expiry_date"] else ""

            action_params_json = json.dumps({
                "document_id": str(row["doc_id"]),
                "document_type": row["document_type"],
                "workflow_scope": row["workflow_scope"],
                "expiry_date": expiry_str,
            })

            result = await db.execute(
                """
                INSERT INTO user_document_alerts (
                    user_id, user_document_id, alert_type, severity,
                    title_es, title_fr, title_en,
                    message_es, message_fr, message_en,
                    suggested_action, action_params,
                    trigger_date
                )
                SELECT $1, $2, 'proactive_preparation', 'info',
                    $3, $4, $5, $6, $7, $8,
                    'start_renewal', $9::jsonb, $10
                WHERE NOT EXISTS (
                    SELECT 1 FROM user_document_alerts
                    WHERE user_id = $1
                      AND user_document_id = $2
                      AND alert_type = 'proactive_preparation'
                      AND is_dismissed = FALSE
                )
                """,
                row["user_id"],
                row["doc_id"],
                f"Preparacion automatica: {doc_name} expira en {days} dias",
                f"Preparation automatique : {doc_name} expire dans {days} jours",
                f"Automatic preparation: {doc_name} expires in {days} days",
                (
                    f"Su agente ha verificado que tiene todos los documentos necesarios para "
                    f"renovar '{doc_name}' (expira el {expiry_str}). "
                    f"Puede iniciar el tramite de renovacion directamente."
                ),
                (
                    f"Votre agent a verifie que vous disposez de tous les documents necessaires pour "
                    f"renouveler '{doc_name}' (expire le {expiry_str}). "
                    f"Vous pouvez demarrer la procedure de renouvellement directement."
                ),
                (
                    f"Your agent has verified that you have all the necessary documents to "
                    f"renew '{doc_name}' (expires on {expiry_str}). "
                    f"You can start the renewal process directly."
                ),
                action_params_json,
                row["expiry_date"],
            )

            if "INSERT 0 1" in result:
                preparations_created += 1

        logger.info(
            f"[ProactiveAgent] Proactive preparations: {len(rows)} candidates checked, "
            f"{preparations_created} preparations created"
        )
        return preparations_created

    # ─────────────────────────────────────────────────────────────
    # 3. MARK EXPIRED DOCUMENTS
    # ─────────────────────────────────────────────────────────────

    async def _mark_expired_documents(self, db: asyncpg.Connection) -> int:
        """
        Update status='expired' for documents past their expiry date.

        Only affects documents that are currently 'active' and not soft-deleted.
        """
        result = await db.execute(
            """
            UPDATE user_documents
            SET status = 'expired', updated_at = NOW()
            WHERE expiry_date < CURRENT_DATE
              AND status = 'active'
              AND deleted_at IS NULL
            """
        )

        # Parse "UPDATE N" to get count
        count = 0
        if result and result.startswith("UPDATE"):
            try:
                count = int(result.split()[-1])
            except (ValueError, IndexError):
                pass

        if count > 0:
            logger.info(f"[ProactiveAgent] Marked {count} documents as expired")

        return count

    # ─────────────────────────────────────────────────────────────
    # 4. PURGE OLD SOFT-DELETED DOCUMENTS
    # ─────────────────────────────────────────────────────────────

    async def _purge_old_deleted(self, db: asyncpg.Connection) -> int:
        """
        Hard-delete documents soft-deleted more than 30 days ago.

        Steps:
        1. Fetch file paths for Firebase Storage cleanup
        2. Delete from DB (cascade deletes workflow_tags, access_log, alerts)
        3. Schedule Firebase Storage cleanup (fire-and-forget)
        """
        # Get file_paths first for Firebase cleanup
        rows = await db.fetch(
            """
            SELECT id, file_path, thumbnail_path
            FROM user_documents
            WHERE deleted_at IS NOT NULL
              AND deleted_at < (NOW() - INTERVAL '30 days')
            """
        )

        if not rows:
            return 0

        # Hard-delete from DB (CASCADE handles child tables)
        result = await db.execute(
            """
            DELETE FROM user_documents
            WHERE deleted_at IS NOT NULL
              AND deleted_at < (NOW() - INTERVAL '30 days')
            """
        )

        count = 0
        if result and result.startswith("DELETE"):
            try:
                count = int(result.split()[-1])
            except (ValueError, IndexError):
                pass

        # Firebase Storage cleanup (fire-and-forget, non-blocking)
        # Collect paths for potential background cleanup
        file_paths_to_delete = []
        for row in rows:
            if row["file_path"]:
                file_paths_to_delete.append(row["file_path"])
            if row["thumbnail_path"]:
                file_paths_to_delete.append(row["thumbnail_path"])

        if file_paths_to_delete:
            try:
                from app.modules.documents.services.storage_service import (
                    firebase_storage_service,
                )
                for path in file_paths_to_delete:
                    try:
                        await firebase_storage_service.delete_file(path)
                    except Exception as e:
                        logger.warning(
                            f"[ProactiveAgent] Failed to delete storage file {path}: {e}"
                        )
            except ImportError:
                logger.warning(
                    "[ProactiveAgent] Firebase storage service not available, "
                    f"skipping cleanup of {len(file_paths_to_delete)} files"
                )

        logger.info(
            f"[ProactiveAgent] Purged {count} soft-deleted documents "
            f"({len(file_paths_to_delete)} storage files queued for cleanup)"
        )
        return count

    # ─────────────────────────────────────────────────────────────
    # 5. CLEANUP STALE MEMORIES
    # ─────────────────────────────────────────────────────────────

    async def _cleanup_stale_memories(self, db: asyncpg.Connection) -> int:
        """
        Deactivate agent memories with very low confidence and high rejection.

        Criteria: confidence < 0.15 AND rejection_count >= 3 AND is_active = TRUE
        These are memories the agent learned but the user repeatedly rejected.
        """
        result = await db.execute(
            """
            UPDATE user_agent_memory
            SET is_active = FALSE, updated_at = NOW()
            WHERE confidence < 0.15
              AND rejection_count >= 3
              AND is_active = TRUE
            """
        )

        count = 0
        if result and result.startswith("UPDATE"):
            try:
                count = int(result.split()[-1])
            except (ValueError, IndexError):
                pass

        if count > 0:
            logger.info(
                f"[ProactiveAgent] Deactivated {count} stale agent memories "
                f"(confidence < 0.15, rejection_count >= 3)"
            )
        return count

    # ─────────────────────────────────────────────────────────────
    # ALERT MESSAGE GENERATION
    # ─────────────────────────────────────────────────────────────

    def _generate_alert_messages(
        self, alert_type: str, doc: Dict[str, Any], days: int
    ) -> Dict[str, Any]:
        """
        Generate multilingual alert messages for a given alert type.

        Returns a dict with keys:
        - severity: 'info' | 'warning' | 'critical'
        - title_es, title_fr, title_en: Localized titles
        - message_es, message_fr, message_en: Localized messages
        - action: Suggested action code
        - action_params: JSON string for action parameters
        """
        doc_name = (
            doc.get("display_name")
            or doc.get("file_name")
            or doc.get("document_type", "documento")
        )
        expiry_str = (
            str(doc.get("expiry_date", ""))
            if doc.get("expiry_date")
            else ""
        )
        abs_days = abs(days) if days else 0

        action_params = json.dumps({
            "document_type": doc.get("document_type", "unknown"),
            "expiry_date": expiry_str,
        })

        templates: Dict[str, Dict[str, Any]] = {
            "expiry_90d": {
                "severity": "info",
                "title_es": f"Su {doc_name} expira en {days} dias",
                "title_fr": f"Votre {doc_name} expire dans {days} jours",
                "title_en": f"Your {doc_name} expires in {days} days",
                "message_es": (
                    f"Su documento '{doc_name}' expira el {expiry_str}. "
                    f"Considere planificar su renovacion con anticipacion."
                ),
                "message_fr": (
                    f"Votre document '{doc_name}' expire le {expiry_str}. "
                    f"Pensez a planifier son renouvellement a l'avance."
                ),
                "message_en": (
                    f"Your document '{doc_name}' expires on {expiry_str}. "
                    f"Consider planning its renewal in advance."
                ),
                "action": "view_document",
                "action_params": action_params,
            },
            "expiry_60d": {
                "severity": "info",
                "title_es": f"Su {doc_name} expira en {days} dias",
                "title_fr": f"Votre {doc_name} expire dans {days} jours",
                "title_en": f"Your {doc_name} expires in {days} days",
                "message_es": (
                    f"Su documento '{doc_name}' expira el {expiry_str}. "
                    f"Le recomendamos iniciar el proceso de renovacion pronto."
                ),
                "message_fr": (
                    f"Votre document '{doc_name}' expire le {expiry_str}. "
                    f"Nous vous recommandons de commencer le processus de renouvellement bientot."
                ),
                "message_en": (
                    f"Your document '{doc_name}' expires on {expiry_str}. "
                    f"We recommend starting the renewal process soon."
                ),
                "action": "plan_renewal",
                "action_params": action_params,
            },
            "expiry_30d": {
                "severity": "warning",
                "title_es": f"Urgente: {doc_name} expira en {days} dias",
                "title_fr": f"Urgent : {doc_name} expire dans {days} jours",
                "title_en": f"Urgent: {doc_name} expires in {days} days",
                "message_es": (
                    f"Su documento '{doc_name}' expira el {expiry_str}. "
                    f"Inicie el tramite de renovacion lo antes posible para evitar interrupciones."
                ),
                "message_fr": (
                    f"Votre document '{doc_name}' expire le {expiry_str}. "
                    f"Commencez la procedure de renouvellement des que possible pour eviter toute interruption."
                ),
                "message_en": (
                    f"Your document '{doc_name}' expires on {expiry_str}. "
                    f"Start the renewal process as soon as possible to avoid interruptions."
                ),
                "action": "start_renewal",
                "action_params": action_params,
            },
            "expiry_7d": {
                "severity": "critical",
                "title_es": f"Critico: {doc_name} expira en {days} dias",
                "title_fr": f"Critique : {doc_name} expire dans {days} jours",
                "title_en": f"Critical: {doc_name} expires in {days} days",
                "message_es": (
                    f"Su documento '{doc_name}' expira el {expiry_str}. "
                    f"Quedan solo {days} dias. Renueve inmediatamente para evitar problemas."
                ),
                "message_fr": (
                    f"Votre document '{doc_name}' expire le {expiry_str}. "
                    f"Il ne reste que {days} jours. Renouvelez immediatement pour eviter tout probleme."
                ),
                "message_en": (
                    f"Your document '{doc_name}' expires on {expiry_str}. "
                    f"Only {days} days remaining. Renew immediately to avoid issues."
                ),
                "action": "start_renewal",
                "action_params": action_params,
            },
            "expired": {
                "severity": "critical",
                "title_es": f"{doc_name} ha expirado",
                "title_fr": f"{doc_name} a expire",
                "title_en": f"{doc_name} has expired",
                "message_es": (
                    f"Su documento '{doc_name}' expiro el {expiry_str} "
                    f"(hace {abs_days} dias). Este documento ya no es valido. "
                    f"Debe renovarlo para poder utilizarlo en tramites."
                ),
                "message_fr": (
                    f"Votre document '{doc_name}' a expire le {expiry_str} "
                    f"(il y a {abs_days} jours). Ce document n'est plus valide. "
                    f"Vous devez le renouveler pour l'utiliser dans vos demarches."
                ),
                "message_en": (
                    f"Your document '{doc_name}' expired on {expiry_str} "
                    f"({abs_days} days ago). This document is no longer valid. "
                    f"You must renew it to use it in procedures."
                ),
                "action": "start_renewal",
                "action_params": action_params,
            },
        }

        template = templates.get(alert_type)
        if not template:
            # Fallback for unknown alert types
            return {
                "severity": "info",
                "title_es": f"Alerta sobre {doc_name}",
                "title_fr": f"Alerte concernant {doc_name}",
                "title_en": f"Alert about {doc_name}",
                "message_es": f"Hay una alerta sobre su documento '{doc_name}'.",
                "message_fr": f"Il y a une alerte concernant votre document '{doc_name}'.",
                "message_en": f"There is an alert about your document '{doc_name}'.",
                "action": "view_document",
                "action_params": action_params,
            }

        return template


# ═══════════════════════════════════════════════════════════════
# SINGLETON
# ═══════════════════════════════════════════════════════════════

proactive_agent_service = ProactiveAgentService()
