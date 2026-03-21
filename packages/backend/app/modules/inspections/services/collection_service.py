"""Collection Service — Field payment collection via existing payment pipeline.

ARCHITECTURE: Field collection triggers the SAME payment flow as when a citizen
pays normally. The agent acts as a proxy:
1. Groups obligations by fee_type (tesoro/municipal/chamber)
2. For EACH fee_type group, calls BundleWorkflowService.initiate_payment()
   which creates service_request + service_payment through ManualProcessor
3. Payment enters treasury pipeline → treasury agent validates
4. On validation, on_payment_completed() routes obligations to entity agents
5. Reconciliation = treasury agent validation (same flow)

This ensures field collections are fully integrated into the existing
payment validation, routing, SLA, and audit architecture.
"""

import logging
from decimal import Decimal, ROUND_HALF_UP
from itertools import groupby
from operator import itemgetter
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
        """Collect payment in the field via the existing payment pipeline.

        Groups obligations by fee_type and creates one payment per group,
        each going through the normal BundleWorkflowService → ManualProcessor
        → treasury validation → obligation routing pipeline.
        """
        inspection = await InspectionRepository.get_by_id(conn, inspection_id)
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        if inspection["agent_id"] != user_id:
            raise ValueError("Cannot collect payment on another agent's inspection")

        if not obligation_ids:
            raise ValueError("At least one obligation ID is required")

        # Replay protection
        if inspection.get("payment_collected"):
            raise ValueError("Payment already collected for this inspection")

        # Fetch obligations with fee_type for grouping
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

        # Verify total amount
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

        # Get license info for the bundle workflow
        license_row = await conn.fetchrow("""
            SELECT cl.id, cl.company_id, cl.bundle_id, cl.zone_id, cl.city_id,
                   cl.fiscal_year, cl.service_request_id
            FROM commercial_licenses cl
            WHERE cl.id = $1
        """, inspection["license_id"])

        if not license_row:
            raise ValueError("License not found")

        # Get company owner for payment context
        owner = await conn.fetchrow("""
            SELECT u.id AS user_id, u.email, u.full_name, u.phone_number
            FROM user_company_roles ucr
            JOIN users u ON u.id = ucr.user_id
            WHERE ucr.company_id = $1
              AND ucr.role = 'company_owner' AND ucr.is_active = true
            LIMIT 1
        """, license_row["company_id"])

        # Process via existing payment pipeline
        if method == "cash":
            result = await CollectionService._process_via_pipeline(
                conn, inspection, user_id, obls, license_row,
                owner, "cash", notes,
            )
        elif method == "mobile_money":
            if not phone_number:
                raise ValueError("Phone number required for mobile money")
            result = await CollectionService._process_via_pipeline(
                conn, inspection, user_id, obls, license_row,
                owner, "mobile_money", notes,
            )
        else:
            raise ValueError(f"Unsupported method: {method}")

        # Mark inspection as payment collected
        await InspectionRepository.update(conn, inspection["id"], {
            "payment_collected": True,
            "payment_amount": amount,
        })

        return result

    @staticmethod
    async def _process_via_pipeline(
        conn, inspection: dict, agent_id: UUID,
        obls: list, license_row: dict,
        owner: Optional[dict], payment_method: str,
        notes: Optional[str],
    ) -> dict:
        """Create payments through the existing ManualProcessor pipeline.

        Groups obligations by fee_type and creates one service_request +
        service_payment per group, each entering the normal treasury
        validation pipeline.
        """
        from app.modules.payments.services.processors.manual_processor import (
            ManualValidationProcessor,
        )
        from app.modules.payments.models.service_payment import (
            PaymentMethod, PaymentContext,
        )

        processor = ManualValidationProcessor()

        # Group obligations by fee_type
        sorted_obls = sorted(obls, key=lambda o: o["fee_type"] or "tesoro")
        fee_type_groups = {}
        for ft, group in groupby(sorted_obls, key=lambda o: o["fee_type"] or "tesoro"):
            fee_type_groups[ft] = list(group)

        results = []

        for fee_type, group_obls in fee_type_groups.items():
            group_amount = _normalize_amount(sum(
                _normalize_amount(o["amount"] or Decimal("0"))
                + _normalize_amount(o["penalty_amount"] or Decimal("0"))
                for o in group_obls
            ))

            group_obl_ids = [o["id"] for o in group_obls]

            # Determine entity_code for this fee_type
            entity_code = {
                "tesoro": "TESORO",
                "municipal": "AYUNTAMIENTO",
                "chamber": "CAMARA_COMERCIO",
            }.get(fee_type, "TESORO")

            # Create service_request for this payment group
            sr_row = await conn.fetchrow("""
                INSERT INTO service_requests (
                    user_id, workflow_code, entity_code,
                    status, payment_status,
                    bundle_id, zone_id,
                    created_at, updated_at
                ) VALUES (
                    $1, 'BUNDLE_PAYMENT', $2,
                    'SUBMITTED', 'pending',
                    $3, $4,
                    NOW(), NOW()
                ) RETURNING id
            """,
                owner["user_id"] if owner else agent_id,
                entity_code,
                license_row["bundle_id"],
                license_row["zone_id"],
            )
            sr_id = str(sr_row["id"])

            # Create payment via ManualProcessor (enters treasury pipeline)
            context = PaymentContext(
                service_request_id=sr_id,
                user_id=str(owner["user_id"]) if owner else str(agent_id),
                amount=group_amount,
                currency="XAF",
                payment_method=PaymentMethod.CASH if payment_method == "cash" else PaymentMethod.CASH,
                user_email=owner["email"] if owner else None,
                user_phone=owner["phone_number"] if owner else None,
                metadata={
                    "collection_type": "field",
                    "inspection_id": str(inspection["id"]),
                    "company_name": inspection.get("company_name"),
                    "fee_type": fee_type,
                    "agent_id": str(agent_id),
                },
            )

            payment_result = await processor.initiate(conn, context)

            if not payment_result.success:
                raise ValueError(
                    f"Payment creation failed for {fee_type}: {payment_result.error}"
                )

            # Link obligations to this payment
            await conn.execute("""
                UPDATE license_obligations
                SET status = 'payment_pending',
                    payment_id = $1::uuid,
                    updated_at = NOW()
                WHERE id = ANY($2::uuid[])
            """, payment_result.payment_id, group_obl_ids)

            # Update service_payment with OMS-specific fields
            await conn.execute("""
                UPDATE service_payments
                SET fee_type = $1,
                    company_id = $2,
                    collection_type = 'field',
                    collected_by = $3,
                    field_inspection_id = $4
                WHERE id = $5::uuid
            """,
                fee_type,
                license_row["company_id"],
                agent_id,
                inspection["id"],
                payment_result.payment_id,
            )

            # Link service_request to payment
            await conn.execute("""
                UPDATE service_requests
                SET payment_id = $1::uuid, updated_at = NOW()
                WHERE id = $2::uuid
            """, payment_result.payment_id, sr_id)

            results.append({
                "fee_type": fee_type,
                "payment_id": payment_result.payment_id,
                "payment_reference": payment_result.external_reference,
                "amount": float(group_amount),
                "obligation_count": len(group_obl_ids),
                "entity_code": entity_code,
                "status": "pending_agent_review",
            })

            logger.info(
                f"Field collection: {fee_type} → {entity_code}, "
                f"{group_amount} XAF, {len(group_obl_ids)} obligations, "
                f"ref={payment_result.external_reference}"
            )

        return {
            "method": payment_method,
            "total_amount": float(sum(r["amount"] for r in results)),
            "payments": results,
            "total_obligations": sum(r["obligation_count"] for r in results),
        }
