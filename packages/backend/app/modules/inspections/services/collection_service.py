"""Collection Service — Field payment collection via existing payment pipeline.

ARCHITECTURE:
Field collection uses the EXACT same pipeline as citizen payments:
1. BundleWorkflowService.initiate_payment() for the normal flow
2. OR direct ManualProcessor + ServiceRequestRepository for field-specific
3. Payment enters treasury queue → treasury agent validates
4. on_payment_completed() routes obligations to entity agents

Key difference from citizen flow:
- No wizard session (no documents to upload — inspection report IS the document)
- Agent acts as proxy for the company owner
- collection_type='field' on service_payment for treasury visibility
- Inspection report serves as proof of field collection
"""

import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional
from uuid import UUID

from app.modules.inspections.repositories.inspection_repository import (
    InspectionRepository,
)

logger = logging.getLogger(__name__)


def _normalize_amount(val: Decimal) -> Decimal:
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class CollectionService:
    """Field payment collection using the existing payment pipeline."""

    @staticmethod
    async def collect_field_payment(
        conn, inspection_id: UUID, user_id: UUID,
        obligation_ids: List[UUID],
        method: str,
        amount: Decimal,
        phone_number: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> dict:
        """Collect payment via BundleWorkflowService (same as citizen)."""
        inspection = await InspectionRepository.get_by_id(conn, inspection_id)
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        if inspection["agent_id"] != user_id:
            raise ValueError("Cannot collect payment on another agent's inspection")

        if not obligation_ids:
            raise ValueError("At least one obligation ID is required")

        if inspection.get("payment_collected"):
            raise ValueError("Payment already collected for this inspection")

        # Fetch obligations
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

        # Get license info
        license_row = await conn.fetchrow("""
            SELECT id, company_id, bundle_id, zone_id, city_id,
                   fiscal_year, processing_mode
            FROM commercial_licenses WHERE id = $1
        """, inspection["license_id"])

        if not license_row:
            raise ValueError("License not found")

        # Get company owner
        owner = await conn.fetchrow("""
            SELECT u.id AS user_id, u.email, u.full_name, u.phone_number
            FROM user_company_roles ucr
            JOIN users u ON u.id = ucr.user_id
            WHERE ucr.company_id = $1
              AND ucr.role = 'company_owner' AND ucr.is_active = true
            LIMIT 1
        """, license_row["company_id"])

        # Use BundleWorkflowService.initiate_payment() — EXACT same pipeline
        from app.modules.fiscal_services.services.bundle_workflow_service import (
            BundleWorkflowService,
        )

        payment_result = await BundleWorkflowService.initiate_payment(
            conn,
            license_id=inspection["license_id"],
            processing_mode=license_row["processing_mode"] or "per_line",
            payment_method="cash" if method == "cash" else "mobile_money",
            selected_obligation_ids=obligation_ids,
            user_id=owner["user_id"] if owner else user_id,
            phone_number=phone_number,
            wizard_session_id=None,  # No wizard — inspection IS the document
        )

        # Enrich service_payment with field collection metadata
        if payment_result.get("payment_id"):
            await conn.execute("""
                UPDATE service_payments
                SET collection_type = 'field',
                    collected_by = $1,
                    field_inspection_id = $2
                WHERE id = $3::uuid
            """, user_id, inspection["id"], payment_result["payment_id"])

        # Mark inspection as payment collected
        await InspectionRepository.update(conn, inspection["id"], {
            "payment_collected": True,
            "payment_amount": amount,
            "payment_id": UUID(payment_result["payment_id"]) if payment_result.get("payment_id") else None,
            "payment_receipt_number": payment_result.get("payment_reference") or payment_result.get("external_reference"),
        })

        logger.info(
            f"Field collection via BundleWorkflowService: "
            f"{amount} XAF, {len(obligation_ids)} obligations, "
            f"payment_id={payment_result.get('payment_id')}, "
            f"ref={payment_result.get('payment_reference')}"
        )

        return {
            "method": method,
            "payment_id": payment_result.get("payment_id"),
            "payment_reference": payment_result.get("payment_reference") or payment_result.get("external_reference"),
            "amount": float(amount),
            "obligation_count": len(obligation_ids),
            "status": "pending_agent_review" if method == "cash" else "submitted",
            "message": payment_result.get("message_es", ""),
        }
