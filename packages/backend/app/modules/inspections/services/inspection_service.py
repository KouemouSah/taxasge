"""Inspection Service — Business logic for field inspections."""

import logging
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from app.modules.inspections.repositories.inspection_repository import (
    InspectionRepository,
)

logger = logging.getLogger(__name__)

# Roles allowed to create inspections (field-facing only, NOT tesoro)
INSPECTION_AGENT_ROLES = {
    "agent_ayuntamiento", "agent_camara",
    "agent_min_comercio", "agent_min_hacienda",
    "agent_min_informacion", "agent_min_turismo",
    "agent_min_agricultura", "agent_min_electricidad",
    "agent_oms_polyvalent",
}

INSPECTION_SUPERVISOR_ROLES = {
    "supervisor_ayuntamiento", "supervisor_camara",
    "supervisor_min_comercio", "supervisor_min_hacienda",
    "supervisor_min_informacion", "supervisor_min_turismo",
    "supervisor_min_agricultura", "supervisor_min_electricidad",
    "supervisor_tesoro",
}


class InspectionService:
    """Business logic for field inspections."""

    @staticmethod
    async def resolve_inspector_context(conn, user_id: UUID) -> Dict:
        """Resolve agent's context for inspections (same as OMS but validated for inspection roles)."""
        row = await conn.fetchrow("""
            SELECT
                ap.id AS agent_profile_id,
                ap.entity_id, ap.entity_location_id,
                ap.is_supervisor,
                e.code AS entity_code,
                el.region, el.city_id,
                r.code AS role_code
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
        is_supervisor = (
            role_code in INSPECTION_SUPERVISOR_ROLES or row["is_supervisor"]
        )

        if role_code not in INSPECTION_AGENT_ROLES and not is_supervisor:
            raise ValueError(
                f"Role '{role_code}' cannot perform field inspections"
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

        # Determine result based on activity + payment
        result = "conforme"
        if inspection.get("activity_conforme") is False:
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

        # Emit event
        try:
            from app.core.events import EventBus, EventType
            EventBus.publish_nowait(EventType.INSPECTION_COMPLETED, {
                "inspection_id": str(inspection_id),
                "company_name": inspection.get("company_name"),
                "company_nif": inspection.get("company_nif"),
                "result": result,
                "inspection_date": str(inspection["inspection_date"]),
                "agent_name": inspection.get("agent_name"),
                "user_id": str(user_id),
            })
        except Exception as e:
            logger.warning(f"INSPECTION_COMPLETED event emission failed: {e}")

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

        # Get company owner for notification
        owner = await conn.fetchrow("""
            SELECT u.email, u.full_name, u.phone_number, u.preferred_language
            FROM companies c
            JOIN users u ON u.id = c.owner_id
            WHERE c.id = $1
        """, inspection["company_id"])

        total_unpaid = sum(
            (o["amount"] or 0) + (o["penalty_amount"] or 0) for o in obls
        )

        # Emit event
        try:
            from app.core.events import EventBus, EventType
            EventBus.publish_nowait(EventType.MISE_EN_DEMEURE_ISSUED, {
                "inspection_id": str(inspection_id),
                "company_name": inspection.get("company_name"),
                "company_nif": inspection.get("company_nif"),
                "unpaid_amount": float(total_unpaid),
                "deadline": deadline.isoformat(),
                "user_email": owner["email"] if owner else None,
                "user_phone": owner["phone_number"] if owner else None,
                "user_name": owner["full_name"] if owner else None,
                "preferred_language": (
                    owner["preferred_language"] if owner else "es"
                ),
            })
        except Exception as e:
            logger.warning(f"MISE_EN_DEMEURE event emission failed: {e}")

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

        # Notify supervisors
        try:
            from app.core.events import EventBus, EventType
            EventBus.publish_nowait(EventType.SEAL_PROPOSED, {
                "inspection_id": str(inspection_id),
                "company_name": inspection.get("company_name"),
                "company_nif": inspection.get("company_nif"),
                "seal_reason": reason,
                "agent_name": inspection.get("agent_name"),
                "entity_id": str(inspection["entity_id"]),
                "user_id": str(user_id),
            })
        except Exception as e:
            logger.warning(f"SEAL_PROPOSED event emission failed: {e}")

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

            # Emit event
            try:
                from app.core.events import EventBus, EventType
                EventBus.publish_nowait(EventType.SEAL_APPROVED, {
                    "inspection_id": str(inspection_id),
                    "company_name": inspection.get("company_name"),
                    "company_nif": inspection.get("company_nif"),
                    "seal_reason": inspection.get("seal_reason"),
                    "user_id": str(supervisor_id),
                })
            except Exception as e:
                logger.warning(f"SEAL_APPROVED event emission failed: {e}")

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
            logger.info(
                f"Seal REJECTED on inspection {inspection_id} "
                f"by supervisor {supervisor_id}: {notes}"
            )

        if notes:
            update_data["seal_notes"] = (
                (inspection.get("seal_notes") or "") + f"\n[Supervisor] {notes}"
            ).strip()

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
        today = date.today()
        week_start = today - timedelta(days=7)

        today_stats = await InspectionRepository.get_stats(
            conn, entity_id=entity_id,
            date_from=today, date_to=today,
        )
        week_stats = await InspectionRepository.get_stats(
            conn, entity_id=entity_id,
            date_from=week_start, date_to=today,
        )

        pending_seals = await InspectionRepository.get_pending_seals(
            conn, entity_id
        )
        overdue_med = await InspectionRepository.get_overdue_med_count(
            conn, entity_id
        )
        unreconciled = await InspectionRepository.get_unreconciled_cash_by_entity(
            conn, entity_id
        )

        # Recent inspections
        recent, _ = await InspectionRepository.list_by_entity(
            conn, entity_id, page=1, page_size=10,
        )

        return {
            "today": today_stats,
            "week": week_stats,
            "pending_seals": pending_seals,
            "overdue_med": overdue_med,
            "unreconciled_cash_amount": unreconciled["amount"],
            "unreconciled_cash_count": unreconciled["count"],
            "recent_inspections": recent,
        }

    # ============================================================
    # CRON: Auto-approve seals after 24h
    # ============================================================

    @staticmethod
    async def auto_approve_expired_seals(conn) -> int:
        """Auto-approve seals that exceeded 24h deadline."""
        expired = await InspectionRepository.get_auto_approve_seals(
            conn, hours=24
        )

        count = 0
        for seal in expired:
            try:
                await conn.execute("""
                    UPDATE field_inspections
                    SET status = 'seal_approved',
                        seal_approved_at = NOW(),
                        seal_notes = COALESCE(seal_notes, '') ||
                            E'\n[AUTO] Aprobado automáticamente tras 24h sin respuesta',
                        updated_at = NOW()
                    WHERE id = $1 AND status = 'seal_proposed'
                """, seal["id"])

                # Deactivate company + suspend license
                await conn.execute("""
                    UPDATE companies SET is_active = false, updated_at = NOW()
                    WHERE id = $1
                """, seal["company_id"])

                await conn.execute("""
                    UPDATE commercial_licenses
                    SET status = 'suspended', updated_at = NOW()
                    WHERE id = $1 AND status != 'closed'
                """, seal["license_id"])

                count += 1
                logger.info(
                    f"Auto-approved seal on inspection {seal['id']}"
                )
            except Exception as e:
                logger.error(
                    f"Failed to auto-approve seal {seal['id']}: {e}"
                )

        if count > 0:
            logger.info(f"Auto-approved {count} expired seals")
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
            found = await InspectionRepository.find_license_by_company_nif(
                conn, nif
            )
            if not found:
                raise ValueError(f"No current license found for NIF: {nif}")
            license_id = found["license_id"]

        if not license_id:
            raise ValueError("Either license_id or nif is required")

        result = await InspectionRepository.get_license_for_verification(
            conn, license_id, ctx["entity_id"]
        )

        if not result:
            raise ValueError(f"License {license_id} not found")

        return result
