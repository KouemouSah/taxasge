"""Collection Service — Field payment with unified dossier per licence/year.

ARCHITECTURE:
1 licence/year = 1 service_request (dossier) = N payments (terrain + citizen + office)

Field collection flow:
  1. Find existing service_request for company+fiscal_year (CTE query)
  2. If found → reuse (citizen/field payments share the same dossier)
  3. If not found → create (source='field_inspection', workflow='FIELD_INSPECTION')
  4. INSERT service_payment linked to the dossier
  5. Emit PAYMENT_CASH_PENDING event for notifications
  6. Log audit trail

OWASP compliance:
  A01: agent_id == inspection.agent_id (access control)
  A03: Decimal amount == sum(obligations) (injection prevention)
  A04: payment_collected check prevents double payment
  A05: service_request_id always set (FK constraint satisfied)
  A08: SHA integrity not applicable (cash, not digital signature)
  A09: audit_logs + EventBus for full traceability
"""

import json
import logging
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional
from uuid import UUID, uuid4

from app.core.events import EventBus, EventType
from app.modules.inspections.repositories.inspection_repository import (
    InspectionRepository,
)

logger = logging.getLogger(__name__)


def _normalize_amount(val) -> Decimal:
    """Normalize to 2 decimal places."""
    if val is None:
        return Decimal("0.00")
    return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class CollectionService:
    """Field payment collection with unified dossier per licence/year."""

    @staticmethod
    async def _find_or_create_service_request(
        conn,
        company_id: UUID,
        user_id: UUID,
        fiscal_year: int,
    ) -> UUID:
        """
        Find existing service_request for this company/year, or create one.

        CTE query searches for any active dossier (citizen or field).
        If none found, creates a new one with source='field_inspection'.

        Returns: service_request UUID
        """
        # Search for existing active dossier for this company + fiscal year
        existing = await conn.fetchval("""
            SELECT sr.id
            FROM service_requests sr
            WHERE sr.company_id = $1
              AND EXTRACT(YEAR FROM sr.created_at) = $2
              AND sr.status NOT IN ('cancelled', 'rejected')
            ORDER BY sr.created_at DESC
            LIMIT 1
        """, company_id, fiscal_year)

        if existing:
            logger.info(f"Reusing existing service_request {existing} for company {company_id}")
            return existing

        # No dossier exists — create one
        new_id = uuid4()
        await conn.execute("""
            INSERT INTO service_requests (
                id, user_id, company_id,
                workflow_code, status, source,
                created_at, updated_at
            ) VALUES ($1, $2, $3, 'FIELD_INSPECTION', 'submitted', 'field_inspection', NOW(), NOW())
        """, new_id, user_id, company_id)

        logger.info(f"Created new service_request {new_id} (FIELD_INSPECTION) for company {company_id}")
        return new_id

    @staticmethod
    async def collect_field_payment(
        conn, inspection_id: UUID, user_id: UUID,
        obligation_ids: List[UUID],
        method: str,
        amount: Decimal,
        phone_number: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> dict:
        """
        Collect field payment and attach to unified dossier.

        Flow:
          1. Validate inspection ownership + obligations
          2. Find or create service_request (unified dossier)
          3. Create service_payment
          4. Update inspection
          5. Emit event + audit log
        """
        # ── Step 1: Validate ──────────────────────────────────────────

        inspection = await InspectionRepository.get_by_id(conn, inspection_id)
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        # OWASP A01: Access control
        if inspection["agent_id"] != user_id:
            raise ValueError("Cannot collect payment on another agent's inspection")

        if not obligation_ids:
            raise ValueError("At least one obligation ID is required")

        # OWASP A04: Prevent double payment
        if inspection.get("payment_collected"):
            raise ValueError("Payment already collected for this inspection")

        # Validate obligations exist and are payable
        obls = await conn.fetch("""
            SELECT lo.id, lo.status, lo.amount, lo.penalty_amount, lo.fee_type,
                   lo.license_id, lo.ministry_id
            FROM license_obligations lo
            WHERE lo.id = ANY($1::uuid[])
              AND lo.license_id = $2
            ORDER BY lo.fee_type
        """, obligation_ids, inspection["license_id"])

        if len(obls) != len(obligation_ids):
            found_ids = {o["id"] for o in obls}
            missing = [str(oid) for oid in obligation_ids if oid not in found_ids]
            raise ValueError(f"Obligations not found: {missing}")

        uncollectable = [o for o in obls if o["status"] not in ("pending", "overdue")]
        if uncollectable:
            raise ValueError(
                f"Obligations must be pending/overdue. "
                f"Invalid: {[str(o['id']) for o in uncollectable]}"
            )

        # OWASP A03: Amount must exactly match obligations
        base_amount = sum(_normalize_amount(o["amount"]) for o in obls)
        penalties = sum(_normalize_amount(o["penalty_amount"]) for o in obls)
        expected = base_amount + penalties
        received = _normalize_amount(amount)

        if received != expected:
            raise ValueError(
                f"Amount mismatch: expected {expected} XAF, received {received} XAF"
            )

        if method == "mobile_money" and not phone_number:
            raise ValueError("Phone number required for mobile money")

        # ── Step 2: Find or create dossier ────────────────────────────

        license_row = await conn.fetchrow(
            "SELECT company_id, fiscal_year FROM commercial_licenses WHERE id = $1",
            inspection["license_id"],
        )
        if not license_row:
            raise ValueError("License not found")

        company_id = license_row["company_id"]
        fiscal_year = license_row["fiscal_year"]

        # Company owner (for service_request user_id + notifications)
        owner = await conn.fetchrow("""
            SELECT u.id AS user_id, u.email, u.full_name, u.phone_number
            FROM user_company_roles ucr
            JOIN users u ON u.id = ucr.user_id
            WHERE ucr.company_id = $1
              AND ucr.role = 'company_owner' AND ucr.is_active = true
            LIMIT 1
        """, company_id)
        payment_user_id = owner["user_id"] if owner else user_id

        service_request_id = await CollectionService._find_or_create_service_request(
            conn, company_id, payment_user_id, fiscal_year,
        )

        # ── Step 3: Create service_payment ────────────────────────────

        payment_id = uuid4()
        seq = await conn.fetchval("SELECT nextval('field_receipt_seq')")
        payment_ref = f"FLD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{seq:05d}"

        # Entity + ministry for treasury routing
        entity_code = inspection.get("entity_code")
        if not entity_code:
            profile = await conn.fetchrow(
                "SELECT e.code FROM agent_profiles ap JOIN entities e ON e.id = ap.entity_id WHERE ap.user_id = $1",
                user_id,
            )
            entity_code = profile["code"] if profile else None

        ministry_id = obls[0]["ministry_id"] if obls else None
        fee_type = obls[0]["fee_type"] if obls else None

        await conn.execute("""
            INSERT INTO service_payments (
                id, payment_reference, user_id, company_id,
                service_request_id,
                payment_type, base_amount, penalties, discounts, total_amount,
                payment_method, currency, status, workflow_status,
                entity_code, ministry_id, fee_type,
                collection_type, collected_by, field_inspection_id,
                supporting_documents,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4,
                $5,
                'full', $6, $7, 0, $8,
                $9, 'XAF', 'pending', 'field_collected',
                $10, $11, $12,
                'field', $13, $14,
                $15,
                NOW(), NOW()
            )
        """,
            payment_id,           # $1
            payment_ref,          # $2
            payment_user_id,      # $3
            company_id,           # $4
            service_request_id,   # $5 ← unified dossier
            base_amount,          # $6
            penalties,            # $7
            received,             # $8
            method,               # $9
            entity_code,          # $10
            ministry_id,          # $11
            fee_type,             # $12
            user_id,              # $13 collected_by
            inspection_id,        # $14 field_inspection_id
            json.dumps({          # $15 supporting_documents
                "inspection_id": str(inspection_id),
                "obligation_ids": [str(oid) for oid in obligation_ids],
                "phone_number": phone_number,
                "notes": notes,
                "fee_types": list({o["fee_type"] for o in obls}),
            }),
        )

        # ── Step 4: Update inspection ─────────────────────────────────

        await InspectionRepository.update(conn, inspection_id, {
            "payment_collected": True,
            "payment_amount": amount,
            "payment_id": payment_id,
            "payment_receipt_number": payment_ref,
        })

        # ── Step 5: Event + Audit ─────────────────────────────────────

        try:
            EventBus.publish_nowait(EventType.PAYMENT_CASH_PENDING, {
                "payment_id": str(payment_id),
                "payment_reference": payment_ref,
                "inspection_id": str(inspection_id),
                "service_request_id": str(service_request_id),
                "company_name": inspection.get("company_name"),
                "amount": float(received),
                "method": method,
                "user_id": str(payment_user_id),
                "user_email": owner["email"] if owner else None,
                "user_name": owner["full_name"] if owner else None,
            })
        except Exception as e:
            logger.warning(f"Field collection event emission failed: {e}")

        # OWASP A09: Audit trail
        try:
            await conn.execute("""
                INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
                VALUES ($1, 'FIELD_COLLECTION', 'service_payment', $2, $3, NOW())
            """, user_id, str(payment_id), json.dumps({
                "inspection_id": str(inspection_id),
                "amount": float(received),
                "method": method,
                "obligation_count": len(obligation_ids),
                "service_request_id": str(service_request_id),
                "payment_reference": payment_ref,
            }))
        except Exception as e:
            logger.warning(f"Audit log failed (non-blocking): {e}")

        logger.info(
            f"Field collection OK: {payment_ref} — "
            f"{received} XAF ({method}), {len(obligation_ids)} obls, "
            f"dossier={service_request_id}, inspection={inspection_id}"
        )

        return {
            "method": method,
            "payment_id": str(payment_id),
            "payment_reference": payment_ref,
            "service_request_id": str(service_request_id),
            "amount": float(received),
            "obligation_count": len(obligation_ids),
            "status": "field_collected",
        }
