"""Collection Service — Direct field payment (no BundleWorkflow dependency).

ARCHITECTURE:
Field collection creates a service_payment DIRECTLY — no service_request needed.
The agent collects cash/mobile_money against specific obligations.

Flow:
  1. Validate obligations (pending/overdue, amount matches)
  2. INSERT service_payment (status=field_collected, collection_type=field)
  3. Mark inspection as payment_collected
  4. Supervisor validates later → on_payment_completed → obligation routing

Key differences from citizen flow:
  - No service_request (no wizard, no workflow — inspection IS the proof)
  - Status starts as 'field_collected' (not 'submitted')
  - Supervisor double-validates before cash is considered received
"""

import json
import logging
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional
from uuid import UUID, uuid4

from app.modules.inspections.repositories.inspection_repository import (
    InspectionRepository,
)

logger = logging.getLogger(__name__)


def _normalize_amount(val: Decimal) -> Decimal:
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class CollectionService:
    """Field payment collection — direct INSERT into service_payments."""

    @staticmethod
    async def collect_field_payment(
        conn, inspection_id: UUID, user_id: UUID,
        obligation_ids: List[UUID],
        method: str,
        amount: Decimal,
        phone_number: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> dict:
        """Collect payment directly without BundleWorkflowService."""
        inspection = await InspectionRepository.get_by_id(conn, inspection_id)
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        if inspection["agent_id"] != user_id:
            raise ValueError("Cannot collect payment on another agent's inspection")

        if not obligation_ids:
            raise ValueError("At least one obligation ID is required")

        if inspection.get("payment_collected"):
            raise ValueError("Payment already collected for this inspection")

        # Fetch and validate obligations
        obls = await conn.fetch("""
            SELECT id, status, amount, penalty_amount, fee_type, license_id
            FROM license_obligations
            WHERE id = ANY($1::uuid[])
              AND license_id = $2
            ORDER BY fee_type
        """, obligation_ids, inspection["license_id"])

        if len(obls) != len(obligation_ids):
            found_ids = {o["id"] for o in obls}
            missing = [oid for oid in obligation_ids if oid not in found_ids]
            raise ValueError(f"Obligations not found: {missing}")

        uncollectable = [o for o in obls if o["status"] not in ("pending", "overdue")]
        if uncollectable:
            raise ValueError(
                f"Obligations must be pending/overdue. "
                f"Invalid: {[str(o['id']) for o in uncollectable]}"
            )

        expected = _normalize_amount(sum(
            _normalize_amount(o["amount"] or Decimal("0"))
            + _normalize_amount(o["penalty_amount"] or Decimal("0"))
            for o in obls
        ))
        received = _normalize_amount(amount)
        if received != expected:
            raise ValueError(
                f"Amount mismatch: expected {expected} XAF, received {received} XAF"
            )

        if method == "mobile_money" and not phone_number:
            raise ValueError("Phone number required for mobile money")

        # Generate payment reference
        seq = await conn.fetchval("SELECT nextval('field_receipt_seq')")
        payment_ref = f"FLD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{seq:05d}"
        payment_id = uuid4()

        # Get license + company info
        license_row = await conn.fetchrow(
            "SELECT company_id, processing_mode FROM commercial_licenses WHERE id = $1",
            inspection["license_id"],
        )
        company_id = license_row["company_id"] if license_row else None

        # Get company owner (for user_id on payment)
        owner = await conn.fetchrow("""
            SELECT u.id AS user_id FROM user_company_roles ucr
            JOIN users u ON u.id = ucr.user_id
            WHERE ucr.company_id = $1 AND ucr.role = 'company_owner' AND ucr.is_active = true
            LIMIT 1
        """, company_id)
        payment_user_id = owner["user_id"] if owner else user_id

        # Get entity_code for treasury routing
        entity_code = inspection.get("entity_code")
        if not entity_code:
            profile = await conn.fetchrow(
                "SELECT e.code FROM agent_profiles ap JOIN entities e ON e.id = ap.entity_id WHERE ap.user_id = $1",
                user_id,
            )
            entity_code = profile["code"] if profile else None

        # Get ministry_id + fee_type from first obligation
        ministry_id = None
        fee_type = None
        if obls:
            obl_detail = await conn.fetchrow(
                "SELECT ministry_id, fee_type FROM license_obligations WHERE id = $1",
                obls[0]["id"],
            )
            if obl_detail:
                ministry_id = obl_detail["ministry_id"]
                fee_type = obl_detail["fee_type"]

        # INSERT service_payment directly (no service_request needed)
        await conn.execute("""
            INSERT INTO service_payments (
                id, payment_reference, user_id, company_id,
                payment_type, base_amount, penalties, discounts, total_amount,
                payment_method, currency, status, workflow_status,
                entity_code, ministry_id, fee_type,
                collection_type, collected_by, field_inspection_id,
                metadata,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4,
                'full', $5, $6, 0, $7,
                $8, 'XAF', 'pending', 'field_collected',
                $9, $10, $11,
                'field', $12, $13,
                $14,
                NOW(), NOW()
            )
        """,
            payment_id,                     # $1
            payment_ref,                    # $2
            payment_user_id,                # $3 user_id (company owner or agent)
            company_id,                     # $4
            sum(o["amount"] or Decimal("0") for o in obls),  # $5 base_amount
            sum(o["penalty_amount"] or Decimal("0") for o in obls),  # $6 penalties
            received,                       # $7 total_amount
            method,                         # $8 payment_method
            entity_code,                    # $9
            ministry_id,                    # $10
            fee_type,                       # $11
            user_id,                        # $12 collected_by (agent)
            inspection_id,                  # $13 field_inspection_id
            json.dumps({                    # $14 metadata
                "inspection_id": str(inspection_id),
                "obligation_ids": [str(oid) for oid in obligation_ids],
                "phone_number": phone_number,
                "notes": notes,
                "fee_types": list({o["fee_type"] for o in obls}),
            }),
        )

        # Mark inspection as payment collected
        await InspectionRepository.update(conn, inspection_id, {
            "payment_collected": True,
            "payment_amount": amount,
            "payment_id": payment_id,
            "payment_receipt_number": payment_ref,
        })

        logger.info(
            f"Field collection: {payment_ref} — "
            f"{amount} XAF ({method}), {len(obligation_ids)} obligations, "
            f"inspection={inspection_id}, agent={user_id}"
        )

        return {
            "method": method,
            "payment_id": str(payment_id),
            "payment_reference": payment_ref,
            "amount": float(amount),
            "obligation_count": len(obligation_ids),
            "status": "field_collected",
        }
