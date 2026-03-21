"""Collection Service — Field payment collection (cash / mobile money).

Handles cash receipts and mobile money payments collected in the field.
Fixes: C1 (INSERT columns), C2 (sequence), M4 (Decimal), m10 (collection_type)
"""

import hashlib
import logging
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
from uuid import UUID

from app.modules.inspections.repositories.inspection_repository import (
    InspectionRepository,
)

logger = logging.getLogger(__name__)


def _generate_payment_reference(method: str) -> str:
    """Generate unique payment reference: FLD-YYYYMMDDHHMMSS-HEX8."""
    now = datetime.now(timezone.utc)
    ts = now.strftime("%Y%m%d%H%M%S")
    raw = f"FLD-{ts}-{method}-{now.microsecond}"
    hex_hash = hashlib.sha256(raw.encode()).hexdigest()[:8].upper()
    return f"FLD-{ts}-{hex_hash}"


def _normalize_amount(val: Decimal) -> Decimal:
    """Normalize Decimal to 2 decimal places for comparison (fix M4)."""
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class CollectionService:
    """Service for field payment collection."""

    @staticmethod
    async def collect_field_payment(
        conn, inspection_id: UUID, user_id: UUID,
        obligation_ids: List[UUID],
        method: str,
        amount: Decimal,
        phone_number: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> dict:
        """Collect payment in the field (cash or mobile money)."""
        inspection = await InspectionRepository.get_by_id(conn, inspection_id)
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        if inspection["agent_id"] != user_id:
            raise ValueError("Cannot collect payment on another agent's inspection")

        if not obligation_ids:
            raise ValueError("At least one obligation ID is required")

        # Verify obligations exist and are collectible
        obls = await conn.fetch("""
            SELECT id, status, amount, penalty_amount
            FROM license_obligations
            WHERE id = ANY($1::uuid[])
              AND license_id = $2
        """, obligation_ids, inspection["license_id"])

        if len(obls) != len(obligation_ids):
            found_ids = {o["id"] for o in obls}
            missing = [oid for oid in obligation_ids if oid not in found_ids]
            raise ValueError(f"Obligations not found: {missing}")

        uncollectable = [
            o for o in obls
            if o["status"] not in ("pending", "overdue")
        ]
        if uncollectable:
            raise ValueError(
                f"Obligations must be pending/overdue for collection. "
                f"Invalid: {[str(o['id']) for o in uncollectable]}"
            )

        # Fix M4: Normalize decimals before comparison
        expected_total = _normalize_amount(sum(
            _normalize_amount(o["amount"] or Decimal("0"))
            + _normalize_amount(o["penalty_amount"] or Decimal("0"))
            for o in obls
        ))
        received = _normalize_amount(amount)

        if received != expected_total:
            raise ValueError(
                f"Amount mismatch: expected {expected_total} XAF, "
                f"received {received} XAF"
            )

        # Resolve agent context for entity_code
        from app.modules.inspections.services.inspection_service import (
            InspectionService,
        )
        ctx = await InspectionService.resolve_inspector_context(conn, user_id)

        if method == "cash":
            return await CollectionService._collect_cash(
                conn, inspection, user_id, ctx, obligation_ids,
                expected_total, notes,
            )
        elif method == "mobile_money":
            return await CollectionService._collect_mobile_money(
                conn, inspection, user_id, ctx, obligation_ids,
                expected_total, phone_number, notes,
            )
        else:
            raise ValueError(f"Unsupported payment method: {method}")

    @staticmethod
    async def _collect_cash(
        conn, inspection: dict, user_id: UUID, ctx: dict,
        obligation_ids: List[UUID], amount: Decimal,
        notes: Optional[str],
    ) -> dict:
        """Process cash collection → receipt + treasury pipeline."""
        # Fix C2: Use PostgreSQL SEQUENCE instead of MAX+1
        seq_row = await conn.fetchrow(
            "SELECT nextval('field_receipt_seq') AS seq"
        )
        seq = seq_row["seq"]
        from datetime import date
        receipt_number = f"FR-{date.today().strftime('%Y%m%d')}-{seq:06d}"

        payment_ref = _generate_payment_reference("cash")

        # Fix C1: Complete INSERT with all NOT NULL columns
        payment_row = await conn.fetchrow("""
            INSERT INTO service_payments (
                payment_reference, user_id, company_id,
                payment_type, base_amount, total_amount,
                payment_method, currency, entity_code,
                workflow_status, fee_type,
                receipt_number,
                collection_type, collected_by, field_inspection_id,
                requires_agent_validation,
                created_at, updated_at
            )
            VALUES (
                $1, $2, $3,
                'full', $4, $4,
                'cash', 'XAF', $5,
                'pending_agent_review', 'tesoro',
                $6,
                'field', $2, $7,
                true,
                NOW(), NOW()
            )
            RETURNING id
        """,
            payment_ref,           # $1
            user_id,               # $2
            inspection["company_id"],  # $3
            amount,                # $4 (base_amount = total_amount)
            ctx["entity_code"],    # $5
            receipt_number,        # $6
            inspection["id"],      # $7
        )

        payment_id = payment_row["id"]

        # Update obligations to payment_pending
        await conn.execute("""
            UPDATE license_obligations
            SET status = 'payment_pending',
                payment_id = $1,
                updated_at = NOW()
            WHERE id = ANY($2::uuid[])
        """, payment_id, obligation_ids)

        # Update inspection with payment info
        await InspectionRepository.update(conn, inspection["id"], {
            "payment_collected": True,
            "payment_id": payment_id,
            "payment_receipt_number": receipt_number,
            "payment_amount": amount,
        })

        # Emit event → enters treasury validation pipeline
        try:
            from app.core.events import EventBus, EventType
            EventBus.publish_nowait(EventType.PAYMENT_MANUAL_PENDING, {
                "payment_id": str(payment_id),
                "amount": float(amount),
                "currency": "XAF",
                "payment_method": "cash",
                "receipt_number": receipt_number,
                "user_id": str(user_id),
                "metadata": {
                    "collection_type": "field",
                    "inspection_id": str(inspection["id"]),
                    "company_name": inspection.get("company_name"),
                    "obligation_count": len(obligation_ids),
                },
            })
        except Exception as e:
            logger.warning(f"PAYMENT_MANUAL_PENDING event failed: {e}")

        logger.info(
            f"Field cash collected: {receipt_number}, "
            f"{amount} XAF, {len(obligation_ids)} obligations"
        )

        return {
            "payment_id": str(payment_id),
            "receipt_number": receipt_number,
            "amount": float(amount),
            "method": "cash",
            "obligation_count": len(obligation_ids),
            "status": "pending_agent_review",
        }

    @staticmethod
    async def _collect_mobile_money(
        conn, inspection: dict, user_id: UUID, ctx: dict,
        obligation_ids: List[UUID], amount: Decimal,
        phone_number: Optional[str],
        notes: Optional[str],
    ) -> dict:
        """Process mobile money collection → BANGE redirect."""
        if not phone_number:
            raise ValueError("Phone number required for mobile money")

        payment_ref = _generate_payment_reference("momo")

        # Fix C1: Complete INSERT with all NOT NULL columns
        payment_row = await conn.fetchrow("""
            INSERT INTO service_payments (
                payment_reference, user_id, company_id,
                payment_type, base_amount, total_amount,
                payment_method, currency, entity_code,
                workflow_status, fee_type,
                collection_type, collected_by, field_inspection_id,
                requires_agent_validation,
                created_at, updated_at
            )
            VALUES (
                $1, $2, $3,
                'full', $4, $4,
                'mobile_money', 'XAF', $5,
                'submitted', 'tesoro',
                'field', $2, $6,
                true,
                NOW(), NOW()
            )
            RETURNING id
        """,
            payment_ref,
            user_id,
            inspection["company_id"],
            amount,
            ctx["entity_code"],
            inspection["id"],
        )

        payment_id = payment_row["id"]

        # Update obligations
        await conn.execute("""
            UPDATE license_obligations
            SET status = 'payment_pending',
                payment_id = $1,
                updated_at = NOW()
            WHERE id = ANY($2::uuid[])
        """, payment_id, obligation_ids)

        # Update inspection
        await InspectionRepository.update(conn, inspection["id"], {
            "payment_collected": True,
            "payment_id": payment_id,
            "payment_amount": amount,
        })

        logger.info(
            f"Field mobile money initiated: {amount} XAF, "
            f"phone: {phone_number}, {len(obligation_ids)} obligations"
        )

        return {
            "payment_id": str(payment_id),
            "amount": float(amount),
            "method": "mobile_money",
            "phone_number": phone_number,
            "obligation_count": len(obligation_ids),
            "status": "submitted",
            "redirect_url": None,
        }
