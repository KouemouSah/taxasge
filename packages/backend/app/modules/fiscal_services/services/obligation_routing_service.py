"""Obligation Routing Service — Post-payment routing for license obligations.

Determines where an obligation goes after payment validation:
- TESORO (Mode A per_line): paid → processing (routed to specific ministry agent)
- TESORO (Mode B consolidated): paid → processing (routed to polyvalent agent)
- MUNICIPAL / CHAMBER: paid → completed (no post-payment processing needed)
"""

import logging
from typing import Dict, List, Optional
from uuid import UUID

from app.modules.fiscal_services.repositories.license_repository import (
    LicenseRepository,
)

logger = logging.getLogger(__name__)


class ObligationRoutingService:
    """Determines where an obligation goes after payment validation."""

    @staticmethod
    def resolve_target_status(fee_type: str) -> str:
        """Return the target status after payment validation.

        Args:
            fee_type: 'tesoro', 'municipal', or 'chamber'

        Returns:
            'processing' — routed to post-payment agent (Mode A or B)
            'completed'  — no post-payment needed (municipal/chamber)
        """
        if fee_type == "tesoro":
            return "processing"
        # Municipal and chamber payments are self-contained
        return "completed"

    @staticmethod
    async def resolve_target_entity(
        conn, obligation: Dict, license_row: Dict
    ) -> Optional[Dict]:
        """Resolve which entity processes this obligation post-payment.

        Mode A (per_line): route by ministry_id → MIN_* entity
        Mode B (consolidated): route to polyvalent at TESORO entity
        Municipal/Chamber: None (no post-payment entity)

        Returns:
            {entity_code, ministry_id} or None
        """
        fee_type = obligation["fee_type"]

        if fee_type in ("municipal", "chamber"):
            return None

        processing_mode = license_row["processing_mode"]

        if processing_mode == "consolidated":
            return {
                "entity_code": "TESORO",
                "ministry_id": None,
                "routing_mode": "consolidated",
            }

        # per_line: route by ministry_id
        ministry_id = obligation.get("ministry_id")
        if not ministry_id:
            logger.warning(
                f"Obligation {obligation['id']} has fee_type=tesoro "
                f"but no ministry_id — cannot route"
            )
            return None

        # Resolve entity_code from ministry_id
        entity_row = await conn.fetchrow(
            "SELECT code FROM entities WHERE ministry_id = $1 LIMIT 1",
            ministry_id,
        )
        entity_code = entity_row["code"] if entity_row else f"MIN_{ministry_id}"

        return {
            "entity_code": entity_code,
            "ministry_id": ministry_id,
            "routing_mode": "per_line",
        }

    @staticmethod
    async def route_paid_obligations(
        conn,
        obligations: List[Dict],
        license_row: Dict,
        user_id: Optional[UUID] = None,
    ) -> List[Dict]:
        """Route a batch of paid obligations to their target status.

        For each obligation:
        1. Determine target status (processing or completed)
        2. Update obligation status
        3. Log routing event
        4. Accumulate affected license_ids for counter refresh

        Returns list of updated obligation dicts.
        """
        from app.modules.fiscal_services.services.license_service import LicenseService

        updated = []
        license_ids = set()

        for obl in obligations:
            target_status = ObligationRoutingService.resolve_target_status(
                obl["fee_type"]
            )
            target_entity = await ObligationRoutingService.resolve_target_entity(
                conn, obl, license_row
            )

            # Update obligation status: paid → processing or paid → completed
            update_data = {"status": target_status}
            result = await LicenseService.update_obligation_status(
                conn,
                obl["id"],
                update_data,
                user_id=user_id,
                expected_license_id=obl["license_id"],
                _skip_counter_refresh=True,
            )

            if result:
                updated.append(result)
                license_ids.add(obl["license_id"])

            # Log payment_validated event
            await LicenseRepository.log_event(
                conn,
                obl["license_id"],
                "payment_validated",
                event_data={
                    "fee_type": obl["fee_type"],
                    "amount": str(obl["amount"]),
                    "payment_id": str(obl.get("payment_id")),
                },
                obligation_id=obl["id"],
                triggered_by=user_id,
            )

            # Log routing event for tesoro obligations
            if target_status == "processing" and target_entity:
                await LicenseRepository.log_event(
                    conn,
                    obl["license_id"],
                    "obligation_routed",
                    event_data={
                        "target_entity": target_entity["entity_code"],
                        "routing_mode": target_entity["routing_mode"],
                        "ministry_id": target_entity.get("ministry_id"),
                    },
                    obligation_id=obl["id"],
                    triggered_by=user_id,
                )
            elif target_status == "completed":
                await LicenseRepository.log_event(
                    conn,
                    obl["license_id"],
                    "obligation_completed",
                    event_data={
                        "fee_type": obl["fee_type"],
                        "auto_completed": True,
                    },
                    obligation_id=obl["id"],
                    triggered_by=user_id,
                )

            logger.info(
                f"OMS routing: obligation {obl['id']} → {target_status} "
                f"(fee_type={obl['fee_type']}, mode={license_row['processing_mode']})"
            )

        # Single counter refresh per affected license
        for lic_id in license_ids:
            await LicenseService.update_license_counters(conn, lic_id, user_id)

        return updated
