"""Inspection Service — Business logic for field inspections.

Fixes: D1 (dynamic roles from BD), H6/H7 (configurable deadlines),
       OWASP A08 (signature integrity hash), A09 (audit trail)
"""

import asyncio
import hashlib
import logging
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from app.modules.inspections.repositories.inspection_repository import (
    InspectionRepository,
)

logger = logging.getLogger(__name__)

MAX_SEAL_NOTES_LENGTH = 2000


async def _log_audit(conn, user_id: UUID, action: str, entity_type: str,
                     entity_id: str, details: Optional[Dict] = None):
    """OWASP A09: Persistent audit trail for critical inspection actions."""
    try:
        await conn.execute("""
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id,
                                    new_values, ip_address, created_at)
            VALUES ($1, $2, $3, $4, $5, '0.0.0.0'::inet, NOW())
        """, user_id, action, entity_type, entity_id,
            __import__("json").dumps(details or {}))
    except Exception as e:
        logger.warning(f"Audit log failed for {action}/{entity_id}: {e}")


class InspectionService:
    """Business logic for field inspections."""

    @staticmethod
    async def resolve_inspector_context(conn, user_id: UUID) -> Dict:
        """Resolve agent's context for inspections.

        Fix D1: Roles are checked dynamically via permission 'inspection.create'
        in the BD instead of a hardcoded set. Any role with this permission
        can perform inspections without code changes.
        """
        row = await conn.fetchrow("""
            SELECT
                ap.id AS agent_profile_id,
                ap.entity_id, ap.entity_location_id,
                ap.is_supervisor,
                e.code AS entity_code,
                el.region, el.city_id,
                r.code AS role_code,
                EXISTS(
                    SELECT 1 FROM role_permissions rp2
                    JOIN permissions p2 ON p2.id = rp2.permission_id
                    WHERE rp2.role_id = r.id AND p2.name = 'inspection.create'
                ) AS has_inspection_permission,
                EXISTS(
                    SELECT 1 FROM role_permissions rp3
                    JOIN permissions p3 ON p3.id = rp3.permission_id
                    WHERE rp3.role_id = r.id AND p3.name = 'inspection.seal_approve'
                ) AS has_seal_approve
            FROM agent_profiles ap
            JOIN entities e ON e.id = ap.entity_id
            JOIN entity_locations el ON el.id = ap.entity_location_id
            JOIN users u ON u.id = ap.user_id
            JOIN roles r ON r.id = u.role_id
            WHERE ap.user_id = $1
              AND ap.is_active = true
        """, user_id)

        if not row:
            raise ValueError("No active agent profile found")

        role_code = row["role_code"]
        has_permission = row["has_inspection_permission"]
        is_supervisor = row["is_supervisor"] or row["has_seal_approve"]

        if not has_permission and not is_supervisor:
            raise ValueError(
                f"Role '{role_code}' does not have inspection permissions"
            )

        return {
            "agent_profile_id": row["agent_profile_id"],
            "entity_id": row["entity_id"],
            "entity_location_id": row["entity_location_id"],
            "entity_code": row["entity_code"],
            "region": row["region"],
            "city_id": row["city_id"],
            "role_code": role_code,
            "is_supervisor": is_supervisor,
        }

    # ============================================================
    # CREATE
    # ============================================================

    @staticmethod
    async def create_inspection(
        conn, user_id: UUID,
        license_id: UUID, company_id: UUID,
        notes: Optional[str] = None,
    ) -> Dict:
        """Create a new field inspection."""
        ctx = await InspectionService.resolve_inspector_context(conn, user_id)

        # Verify license exists and belongs to the company
        license_row = await conn.fetchrow("""
            SELECT id, company_id, status, fiscal_year
            FROM commercial_licenses
            WHERE id = $1
        """, license_id)

        if not license_row:
            raise ValueError(f"License {license_id} not found")

        if license_row["company_id"] != company_id:
            raise ValueError("License does not belong to this company")

        # Snapshot obligations at inspection time
        obl_stats = await conn.fetchrow("""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status IN ('pending', 'overdue')) AS unpaid,
                COALESCE(SUM(amount + penalty_amount) FILTER (
                    WHERE status IN ('pending', 'overdue')
                ), 0) AS unpaid_amount
            FROM license_obligations
            WHERE license_id = $1
        """, license_id)

        inspection = await InspectionRepository.create(conn, {
            "agent_id": user_id,
            "agent_profile_id": ctx["agent_profile_id"],
            "entity_id": ctx["entity_id"],
            "entity_location_id": ctx["entity_location_id"],
            "license_id": license_id,
            "company_id": company_id,
            "notes": notes,
            "unpaid_obligations_count": obl_stats["unpaid"],
            "unpaid_obligations_amount": obl_stats["unpaid_amount"],
            "total_obligations_count": obl_stats["total"],
        })

        return await InspectionRepository.get_by_id(conn, inspection["id"])

    # ============================================================
    # UPDATE
    # ============================================================

    @staticmethod
    async def update_inspection(
        conn, inspection_id: UUID, user_id: UUID, data: Dict,
    ) -> Dict:
        """Update inspection (photos, GPS, notes, activity check)."""
        inspection = await InspectionRepository.get_by_id(conn, inspection_id)
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        if inspection["agent_id"] != user_id:
            raise ValueError("Cannot update another agent's inspection")

        if inspection["status"] != "in_progress":
            raise ValueError(
                f"Cannot update inspection in status '{inspection['status']}'"
            )

        # OWASP A08: If signature is being set, hash it for tamper detection
        if "agent_signature" in data and data["agent_signature"]:
            sig_data = data["agent_signature"]
            ts = datetime.now(timezone.utc).isoformat()
            sig_hash = hashlib.sha256(
                f"{sig_data}|{user_id}|{ts}".encode()
            ).hexdigest()[:32]
            # Store hash alongside signature for later verification
            data["notes"] = (
                (data.get("notes") or inspection.get("notes") or "")
                + f"\n[SIG_HASH:{sig_hash}:{ts}]"
            ).strip()

        return await InspectionRepository.update(conn, inspection_id, data)

    # ============================================================
    # COMPLETE (conforme)
    # ============================================================

    @staticmethod
    async def complete_inspection(
        conn, inspection_id: UUID, user_id: UUID,
        notes: Optional[str] = None,
    ) -> Dict:
        """Complete an inspection as conforme."""
        inspection = await InspectionRepository.get_by_id(conn, inspection_id)
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        if inspection["agent_id"] != user_id:
            raise ValueError("Cannot complete another agent's inspection")

        if inspection["status"] != "in_progress":
            raise ValueError(
                f"Cannot complete inspection in status '{inspection['status']}'"
            )

        # Fix M2: Require activity_conforme to be set before completing
        if inspection.get("activity_conforme") is None:
            raise ValueError(
                "Cannot complete inspection: activity conformity check "
                "has not been performed. Set activity_conforme first."
            )

        # Determine result based on activity + payment
        result = "conforme"
        if inspection["activity_conforme"] is False:
            result = "non_conforme"
        elif inspection["unpaid_obligations_count"] > 0:
            result = "non_conforme"

        update_data = {
            "status": "completed",
            "result": result,
        }
        if notes:
            update_data["notes"] = notes

        updated = await InspectionRepository.update(
            conn, inspection_id, update_data
        )

        # Generate PDF + emit event with attachment
        try:
            from app.core.events import EventBus, EventType
            from app.modules.inspections.services.inspection_pdf_service import (
                inspection_pdf_service,
            )

            # Get company owner for notification
            owner = await conn.fetchrow("""
                SELECT u.email, u.full_name, u.phone_number, u.preferred_language
                FROM user_company_roles ucr
                JOIN users u ON u.id = ucr.user_id
                WHERE ucr.company_id = $1
                  AND ucr.role = 'company_owner' AND ucr.is_active = true
                LIMIT 1
            """, inspection["company_id"])

            # Generate PDF report as attachment
            attachments = []
            try:
                lang = owner["preferred_language"] if owner else "es"
                pdf_bytes = await inspection_pdf_service.generate_inspection_report(
                    conn, str(inspection_id), lang,
                )
                attachments.append((
                    f"inspection-{str(inspection_id)[:8]}.pdf",
                    pdf_bytes,
                    "application/pdf",
                ))
            except Exception as pdf_err:
                logger.warning(f"Inspection PDF generation failed: {pdf_err}")

            EventBus.publish_nowait(EventType.INSPECTION_COMPLETED, {
                "inspection_id": str(inspection_id),
                "company_name": inspection.get("company_name"),
                "company_nif": inspection.get("company_nif"),
                "result": result,
                "inspection_date": str(inspection["inspection_date"]),
                "agent_name": inspection.get("agent_name"),
                "user_id": str(user_id),
                "user_email": owner["email"] if owner else None,
                "user_phone": owner["phone_number"] if owner else None,
                "user_name": owner["full_name"] if owner else None,
                "preferred_language": owner["preferred_language"] if owner else "es",
                "attachments": attachments if attachments else None,
            })
        except Exception as e:
            logger.warning(f"INSPECTION_COMPLETED event emission failed: {e}")

        # OWASP A09: Audit trail
        await _log_audit(conn, user_id, "INSPECTION_COMPLETED", "field_inspection",
                         str(inspection_id), {"result": result,
                         "company": inspection.get("company_name")})

        logger.info(
            f"Inspection {inspection_id} completed: {result} "
            f"by agent {user_id}"
        )
        return updated

    # ============================================================
    # MISE EN DEMEURE
    # ============================================================

    @staticmethod
    async def issue_mise_en_demeure(
        conn, inspection_id: UUID, user_id: UUID,
        obligation_ids: List[UUID],
        deadline_hours: int = 72,
        notes: Optional[str] = None,
    ) -> Dict:
        """Issue a mise en demeure (formal notice)."""
        inspection = await InspectionRepository.get_by_id(conn, inspection_id)
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        if inspection["agent_id"] != user_id:
            raise ValueError("Cannot issue MED on another agent's inspection")

        if inspection["status"] != "in_progress":
            raise ValueError(
                f"Cannot issue MED on inspection in status '{inspection['status']}'"
            )

        # Verify obligations exist and are unpaid
        obls = await conn.fetch("""
            SELECT id, status, amount, penalty_amount
            FROM license_obligations
            WHERE id = ANY($1::uuid[])
              AND license_id = $2
        """, obligation_ids, inspection["license_id"])

        if len(obls) != len(obligation_ids):
            raise ValueError("Some obligation IDs are invalid")

        unpayable = [
            o for o in obls
            if o["status"] not in ("pending", "overdue")
        ]
        if unpayable:
            raise ValueError(
                f"Obligations must be pending/overdue, found: "
                f"{[str(o['id']) for o in unpayable]}"
            )

        deadline = datetime.now(timezone.utc) + timedelta(hours=deadline_hours)

        update_data = {
            "status": "mise_en_demeure",
            "result": "non_conforme",
            "mise_en_demeure_issued": True,
            "mise_en_demeure_deadline": deadline,
            "mise_en_demeure_obligations": [str(oid) for oid in obligation_ids],
        }
        if notes:
            update_data["notes"] = notes

        updated = await InspectionRepository.update(
            conn, inspection_id, update_data
        )

        # Fix M6: Get company owner via user_company_roles (no owner_id column)
        owner = await conn.fetchrow("""
            SELECT u.email, u.full_name, u.phone_number, u.preferred_language
            FROM user_company_roles ucr
            JOIN users u ON u.id = ucr.user_id
            WHERE ucr.company_id = $1
              AND ucr.role = 'company_owner'
              AND ucr.is_active = true
            LIMIT 1
        """, inspection["company_id"])

        total_unpaid = sum(
            (o["amount"] or 0) + (o["penalty_amount"] or 0) for o in obls
        )

        # Generate MED PDF + emit event with attachment
        try:
            from app.core.events import EventBus, EventType
            from app.modules.inspections.services.inspection_pdf_service import (
                inspection_pdf_service,
            )

            attachments = []
            try:
                lang = owner["preferred_language"] if owner else "es"
                pdf_bytes = await inspection_pdf_service.generate_med_pdf(
                    conn, str(inspection_id), lang,
                )
                attachments.append((
                    f"mise-en-demeure-{str(inspection_id)[:8]}.pdf",
                    pdf_bytes,
                    "application/pdf",
                ))
            except Exception as pdf_err:
                logger.warning(f"MED PDF generation failed: {pdf_err}")

            EventBus.publish_nowait(EventType.MISE_EN_DEMEURE_ISSUED, {
                "inspection_id": str(inspection_id),
                "company_name": inspection.get("company_name"),
                "company_nif": inspection.get("company_nif"),
                "unpaid_amount": float(total_unpaid),
                "deadline": deadline.isoformat(),
                "obligations_list": ", ".join(
                    f"{o['amount']} XAF" for o in obls
                ),
                "user_email": owner["email"] if owner else None,
                "user_phone": owner["phone_number"] if owner else None,
                "user_name": owner["full_name"] if owner else None,
                "preferred_language": (
                    owner["preferred_language"] if owner else "es"
                ),
                "attachments": attachments if attachments else None,
            })
        except Exception as e:
            logger.warning(f"MISE_EN_DEMEURE event emission failed: {e}")

        await _log_audit(conn, user_id, "MISE_EN_DEMEURE_ISSUED", "field_inspection",
                         str(inspection_id), {"deadline": deadline.isoformat(),
                         "amount": float(total_unpaid),
                         "company": inspection.get("company_name")})

        logger.info(
            f"MED issued on inspection {inspection_id}, deadline: {deadline}"
        )
        return updated

    # ============================================================
    # SEAL
    # ============================================================

    @staticmethod
    async def propose_seal(
        conn, inspection_id: UUID, user_id: UUID,
        reason: str,
        notes: Optional[str] = None,
        photo: Optional[str] = None,
    ) -> Dict:
        """Propose sealing a business (requires supervisor approval)."""
        inspection = await InspectionRepository.get_by_id(conn, inspection_id)
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        if inspection["agent_id"] != user_id:
            raise ValueError("Cannot propose seal on another agent's inspection")

        if inspection["status"] not in ("in_progress", "mise_en_demeure"):
            raise ValueError(
                f"Cannot propose seal on inspection in status "
                f"'{inspection['status']}'"
            )

        # For non_paiement_apres_med, check MED is expired
        if reason == "non_paiement_apres_med":
            # Check if there's an expired MED for this company
            expired_med = await conn.fetchrow("""
                SELECT id FROM field_inspections
                WHERE company_id = $1
                  AND mise_en_demeure_issued = true
                  AND mise_en_demeure_deadline < NOW()
                  AND status = 'mise_en_demeure'
                LIMIT 1
            """, inspection["company_id"])

            if not expired_med:
                raise ValueError(
                    "Cannot seal for non-payment: no expired mise en demeure "
                    "found. Issue a MED first and wait for the deadline."
                )

        update_data = {
            "status": "seal_proposed",
            "result": "non_conforme",
            "seal_applied": True,
            "seal_reason": reason,
            "seal_proposed_at": datetime.now(timezone.utc),
        }
        if notes:
            update_data["seal_notes"] = notes
        if photo:
            update_data["seal_photo"] = photo

        updated = await InspectionRepository.update(
            conn, inspection_id, update_data
        )

        # Fix F1: Notify ALL supervisors of the entity (not single user)
        try:
            from app.core.events import EventBus, EventType

            # Fetch all supervisor emails for this entity
            supervisors = await conn.fetch("""
                SELECT u.id, u.email, u.full_name, u.phone_number, u.preferred_language
                FROM agent_profiles ap
                JOIN users u ON u.id = ap.user_id
                WHERE ap.entity_id = $1
                  AND ap.is_supervisor = true
                  AND ap.is_active = true
                  AND u.email IS NOT NULL
            """, inspection["entity_id"])

            if not supervisors:
                logger.warning(
                    f"SEAL_PROPOSED: No supervisors found for entity "
                    f"{inspection['entity_id']}"
                )

            # Emit one event per supervisor so each gets an email
            for sup in supervisors:
                EventBus.publish_nowait(EventType.SEAL_PROPOSED, {
                    "inspection_id": str(inspection_id),
                    "company_name": inspection.get("company_name"),
                    "company_nif": inspection.get("company_nif"),
                    "seal_reason": reason,
                    "agent_name": inspection.get("agent_name"),
                    "entity_id": str(inspection["entity_id"]),
                    "user_id": str(sup["id"]),
                    "user_email": sup["email"],
                    "user_phone": sup["phone_number"],
                    "user_name": sup["full_name"],
                    "preferred_language": sup["preferred_language"] or "es",
                })

            logger.info(
                f"SEAL_PROPOSED: Notified {len(supervisors)} supervisor(s) "
                f"for entity {inspection['entity_id']}"
            )
        except Exception as e:
            logger.warning(f"SEAL_PROPOSED event emission failed: {e}")

        await _log_audit(conn, user_id, "SEAL_PROPOSED", "field_inspection",
                         str(inspection_id), {"reason": reason,
                         "company": inspection.get("company_name")})

        logger.info(
            f"Seal proposed on inspection {inspection_id}: {reason}"
        )
        return updated

    @staticmethod
    async def approve_seal(
        conn, inspection_id: UUID, supervisor_id: UUID,
        approved: bool,
        notes: Optional[str] = None,
    ) -> Dict:
        """Supervisor approves or rejects a seal proposal."""
        ctx = await InspectionService.resolve_inspector_context(
            conn, supervisor_id
        )

        if not ctx["is_supervisor"]:
            raise ValueError("Only supervisors can approve/reject seals")

        inspection = await InspectionRepository.get_by_id(conn, inspection_id)
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        if inspection["status"] != "seal_proposed":
            raise ValueError(
                f"Inspection is not in 'seal_proposed' status "
                f"(current: {inspection['status']})"
            )

        # IDOR: supervisor must be from same entity
        if inspection["entity_id"] != ctx["entity_id"]:
            raise ValueError("Cannot approve seal for another entity")

        if approved:
            update_data = {
                "status": "seal_approved",
                "seal_approved_by": supervisor_id,
                "seal_approved_at": datetime.now(timezone.utc),
            }

            # Deactivate company + suspend license
            await conn.execute("""
                UPDATE companies SET is_active = false, updated_at = NOW()
                WHERE id = $1
            """, inspection["company_id"])

            await conn.execute("""
                UPDATE commercial_licenses
                SET status = 'suspended', updated_at = NOW()
                WHERE id = $1 AND status != 'closed'
            """, inspection["license_id"])

            # Generate seal PV PDF + emit event with attachment + notify owner
            try:
                from app.core.events import EventBus, EventType
                from app.modules.inspections.services.inspection_pdf_service import (
                    inspection_pdf_service,
                )

                # Get company owner for notification
                owner = await conn.fetchrow("""
                    SELECT u.email, u.full_name, u.phone_number, u.preferred_language
                    FROM user_company_roles ucr
                    JOIN users u ON u.id = ucr.user_id
                    WHERE ucr.company_id = $1
                      AND ucr.role = 'company_owner' AND ucr.is_active = true
                    LIMIT 1
                """, inspection["company_id"])

                attachments = []
                try:
                    lang = owner["preferred_language"] if owner else "es"
                    pdf_bytes = await inspection_pdf_service.generate_seal_pdf(
                        conn, str(inspection_id), lang,
                    )
                    attachments.append((
                        f"pv-scelle-{str(inspection_id)[:8]}.pdf",
                        pdf_bytes,
                        "application/pdf",
                    ))
                except Exception as pdf_err:
                    logger.warning(f"Seal PDF generation failed: {pdf_err}")

                EventBus.publish_nowait(EventType.SEAL_APPROVED, {
                    "inspection_id": str(inspection_id),
                    "company_name": inspection.get("company_name"),
                    "company_nif": inspection.get("company_nif"),
                    "seal_reason": inspection.get("seal_reason"),
                    "unpaid_amount": float(inspection.get("unpaid_obligations_amount", 0)),
                    "user_id": str(supervisor_id),
                    "user_email": owner["email"] if owner else None,
                    "user_phone": owner["phone_number"] if owner else None,
                    "user_name": owner["full_name"] if owner else None,
                    "preferred_language": owner["preferred_language"] if owner else "es",
                    "attachments": attachments if attachments else None,
                })
            except Exception as e:
                logger.warning(f"SEAL_APPROVED event emission failed: {e}")

            await _log_audit(conn, supervisor_id, "SEAL_APPROVED", "field_inspection",
                             str(inspection_id), {"company": inspection.get("company_name"),
                             "reason": inspection.get("seal_reason")})

            logger.info(
                f"Seal APPROVED on inspection {inspection_id} "
                f"by supervisor {supervisor_id}"
            )
        else:
            update_data = {
                "status": "seal_rejected",
                "seal_rejection_reason": notes,
                "seal_approved_by": supervisor_id,
                "seal_approved_at": datetime.now(timezone.utc),
            }

            await _log_audit(conn, supervisor_id, "SEAL_REJECTED", "field_inspection",
                             str(inspection_id), {"reason": notes,
                             "company": inspection.get("company_name")})

            logger.info(
                f"Seal REJECTED on inspection {inspection_id} "
                f"by supervisor {supervisor_id}: {notes}"
            )

        if notes:
            # Fix m6: Truncate seal_notes to prevent unbounded growth
            existing = (inspection.get("seal_notes") or "").strip()
            new_note = f"\n[Supervisor] {notes}"
            combined = (existing + new_note).strip()
            update_data["seal_notes"] = combined[:MAX_SEAL_NOTES_LENGTH]

        return await InspectionRepository.update(
            conn, inspection_id, update_data
        )

    # ============================================================
    # SUPERVISOR DASHBOARD
    # ============================================================

    @staticmethod
    async def get_supervisor_dashboard(
        conn, user_id: UUID,
    ) -> Dict:
        """Get supervisor inspection dashboard data."""
        ctx = await InspectionService.resolve_inspector_context(conn, user_id)

        if not ctx["is_supervisor"]:
            raise ValueError("Dashboard is supervisor-only")

        entity_id = ctx["entity_id"]

        # CTE-based dashboard: 1 query for all stats
        cte_data = await InspectionRepository.get_supervisor_dashboard_cte(
            conn, entity_id
        )

        # These still need separate queries (JOIN-heavy, list data)
        pending_seals, recent = await asyncio.gather(
            InspectionRepository.get_pending_seals(conn, entity_id),
            InspectionRepository.list_by_entity(
                conn, entity_id, page=1, page_size=10,
            ),
        )
        recent_items = recent[0] if isinstance(recent, tuple) else recent

        return {
            "today": cte_data.get("today", {}),
            "week": cte_data.get("week", {}),
            "pending_seals": pending_seals,
            "overdue_med": cte_data.get("overdue_med", 0),
            "unreconciled_cash_amount": cte_data.get("cash_amount", Decimal("0")),
            "unreconciled_cash_count": cte_data.get("cash_count", 0),
            "recent_inspections": recent_items,
        }

    # ============================================================
    # CRON: Auto-approve seals after 24h
    # ============================================================

    @staticmethod
    async def auto_approve_expired_seals(conn) -> int:
        """Fix m8: Batch auto-approve seals in O(1) queries instead of O(N)."""
        count = await InspectionRepository.batch_auto_approve_seals(
            conn, hours=24
        )
        if count > 0:
            logger.info(f"Auto-approved {count} expired seals (batch)")
        return count

    # ============================================================
    # VERIFY LICENSE (Agent Mode)
    # ============================================================

    @staticmethod
    async def verify_license_for_agent(
        conn, user_id: UUID,
        license_id: Optional[UUID] = None,
        nif: Optional[str] = None,
    ) -> Dict:
        """Get enriched license data for agent field verification."""
        ctx = await InspectionService.resolve_inspector_context(conn, user_id)

        if not license_id and nif:
            # Search by NIF (GE-format) or registration_number (PE-format)
            found = await InspectionRepository.find_license_by_identifier(
                conn, nif
            )
            if not found:
                raise ValueError(
                    f"No current license found for identifier: {nif}. "
                    f"Search covers both NIF (GExxxxx) and N° Registro (PE-xxxxxx)."
                )
            license_id = found["license_id"]

        if not license_id:
            raise ValueError("Either license_id or nif/registration_number is required")

        result = await InspectionRepository.get_license_for_verification(
            conn, license_id, ctx["entity_id"]
        )

        if not result:
            raise ValueError(f"License {license_id} not found")

        return result
