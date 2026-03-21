"""Collection Service — Field payment collection (cash / mobile money).

Handles cash receipts and mobile money payments collected in the field.
"""

import logging
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from app.modules.inspections.repositories.inspection_repository import (
    InspectionRepository,
)
from app.modules.inspections.services.inspection_service import (
    InspectionService,
)

logger = logging.getLogger(__name__)


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
        """Collect payment in the field (cash or mobile money).

        Cash flow:
        1. Verify inspection + obligations
        2. Create service_payment with collection_type='field'
        3. Generate receipt number (advisory lock)
        4. Link to inspection
        5. EventBus → PAYMENT_MANUAL_PENDING (enters treasury flow)
        6. Return receipt for download

        Mobile money flow:
        1. Create BANGE transaction → redirect_url
        2. Webhook auto-confirms → obligation status updates
        """
        inspection = await InspectionRepository.get_by_id(conn, inspection_id)
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        if inspection["agent_id"] != user_id:
            raise ValueError("Cannot collect payment on another agent's inspection")

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

        # Verify amount matches
        expected_total = sum(
            (o["amount"] or Decimal("0")) + (o["penalty_amount"] or Decimal("0"))
            for o in obls
        )
        if amount != expected_total:
            raise ValueError(
                f"Amount mismatch: expected {expected_total} XAF, "
                f"received {amount} XAF"
            )

        if method == "cash":
            return await CollectionService._collect_cash(
                conn, inspection, user_id, obligation_ids, amount, notes,
            )
        elif method == "mobile_money":
            return await CollectionService._collect_mobile_money(
                conn, inspection, user_id, obligation_ids, amount,
                phone_number, notes,
            )
        else:
            raise ValueError(f"Unsupported payment method: {method}")

    @staticmethod
    async def _collect_cash(
        conn, inspection: dict, user_id: UUID,
        obligation_ids: List[UUID], amount: Decimal,
        notes: Optional[str],
    ) -> dict:
        """Process cash collection → receipt + treasury pipeline."""
        # Generate receipt number with advisory lock (same pattern as receipt_service)
        await conn.execute(
            "SELECT pg_advisory_xact_lock(hashtext('field_receipt_seq'))"
        )

        receipt_row = await conn.fetchrow("""
            SELECT COALESCE(MAX(
                CAST(SUBSTRING(payment_receipt_number FROM 'FR-[0-9]+-([0-9]+)')
                AS INTEGER)
            ), 0) + 1 AS next_seq
            FROM field_inspections
            WHERE payment_receipt_number IS NOT NULL
        """)
        seq = receipt_row["next_seq"]
        from datetime import date
        receipt_number = f"FR-{date.today().strftime('%Y%m%d')}-{seq:06d}"

        # Create service_payment linked to field inspection
        payment_row = await conn.fetchrow("""
            INSERT INTO service_payments (
                amount, payment_method, workflow_status,
                fee_type, notes,
                created_at, updated_at
            )
            VALUES ($1, 'cash', 'pending_agent_review', 'tesoro', $2, NOW(), NOW())
            RETURNING id
        """, amount, notes or f"Field collection #{receipt_number}")

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
        conn, inspection: dict, user_id: UUID,
        obligation_ids: List[UUID], amount: Decimal,
        phone_number: Optional[str],
        notes: Optional[str],
    ) -> dict:
        """Process mobile money collection → BANGE redirect."""
        if not phone_number:
            raise ValueError("Phone number required for mobile money")

        # Create service_payment
        payment_row = await conn.fetchrow("""
            INSERT INTO service_payments (
                amount, payment_method, workflow_status,
                fee_type, notes,
                created_at, updated_at
            )
            VALUES ($1, 'mobile_money', 'submitted', 'tesoro', $2, NOW(), NOW())
            RETURNING id
        """, amount, notes or f"Field mobile money collection")

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

        # TODO: Integrate with BangeProcessor for actual mobile money
        # For now, return a placeholder. In production, this would call:
        # from app.modules.payments.services.bange_processor import BangeProcessor
        # redirect_url = await BangeProcessor.initiate(...)

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
            "redirect_url": None,  # Will be populated by BangeProcessor
        }
