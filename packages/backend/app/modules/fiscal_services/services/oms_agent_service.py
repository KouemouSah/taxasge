"""OMS Agent Service — Post-payment processing for commercial license obligations.

Handles Mode A (per-line ministry routing) and Mode B (consolidated polyvalent).
Payment validation is handled by the existing treasury pipeline — NOT by this service.
"""

import logging
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from app.modules.fiscal_services.repositories.license_repository import (
    LicenseRepository,
)
from app.modules.fiscal_services.services.license_service import LicenseService

logger = logging.getLogger(__name__)

# Roles that can access OMS processing queue
OMS_PROCESSOR_ROLES = {
    # Treasury / Tesoro agents (existing, pre-OMS)
    "agent_tesoro",
    # Municipal agents (independent, Addendum 3)
    "agent_ayuntamiento",
    # Chamber agents (independent, Addendum 3)
    "agent_camara",
    # Ministry agents (Mode A per-line)
    "agent_min_comercio", "agent_min_hacienda", "agent_min_informacion",
    "agent_min_turismo", "agent_min_agricultura", "agent_min_electricidad",
    # Municipal & Chamber supervisors
    "supervisor_ayuntamiento", "supervisor_camara",
    # Ministry supervisors (Mode A per-line)
    "supervisor_min_comercio", "supervisor_min_hacienda", "supervisor_min_informacion",
    "supervisor_min_turismo", "supervisor_min_agricultura", "supervisor_min_electricidad",
    # Polyvalent (Mode B consolidated)
    "agent_oms_polyvalent",
    # TESORO supervisor (supervises polyvalent + tesoro agents)
    "supervisor_tesoro",
}

POLYVALENT_ROLES = {"agent_oms_polyvalent", "supervisor_tesoro"}

# Roles that see ALL obligations in their scope (no assignment filter)
SUPERVISOR_ROLES = {
    "supervisor_tesoro", "supervisor_ayuntamiento", "supervisor_camara",
    "supervisor_min_comercio", "supervisor_min_hacienda", "supervisor_min_informacion",
    "supervisor_min_turismo", "supervisor_min_agricultura", "supervisor_min_electricidad",
}

# Roles that process obligations independent of Mode A/B (Addendum 3).
# Municipal and chamber obligations exist on BOTH per_line and consolidated
# licenses. These agents must NOT filter by processing_mode — only by fee_type.
INDEPENDENT_FEE_ROLES = {
    "agent_ayuntamiento": "municipal",
    "supervisor_ayuntamiento": "municipal",
    "agent_camara": "chamber",
    "supervisor_camara": "chamber",
}


class OmsAgentService:
    """Service for OMS post-payment agent operations."""

    @staticmethod
    async def resolve_agent_context(conn, user_id: UUID) -> Dict:
        """Resolve agent's entity, role, and queue scope.

        Returns:
            {
                agent_profile_id, entity_id, entity_code, entity_location_id,
                region, role_code, ministry_id, is_supervisor,
                is_polyvalent: bool,
                queue_processing_mode: 'per_line' | 'consolidated',
                queue_ministry_id: int | None,
            }

        Raises ValueError if user is not an OMS processor agent.
        """
        row = await conn.fetchrow("""
            SELECT
                ap.id AS agent_profile_id,
                ap.entity_id, ap.ministry_id, ap.entity_location_id,
                ap.is_supervisor,
                e.code AS entity_code,
                el.region,
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
            raise ValueError("No active OMS agent profile found")

        role_code = row["role_code"]
        if role_code not in OMS_PROCESSOR_ROLES:
            raise ValueError(
                f"Role '{role_code}' cannot access OMS processing queue"
            )

        is_polyvalent = role_code in POLYVALENT_ROLES
        is_supervisor = role_code in SUPERVISOR_ROLES or row["is_supervisor"]
        is_independent = role_code in INDEPENDENT_FEE_ROLES

        # Determine queue scope:
        # - Polyvalent: processing_mode='consolidated', no ministry filter
        # - Independent (ayuntamiento/camara): NO processing_mode filter, fee_type filter
        # - Ministry (Mode A): processing_mode='per_line', ministry filter
        if is_polyvalent:
            queue_mode = "consolidated"
            queue_ministry = None
            queue_fee_type = None
        elif is_independent:
            queue_mode = None  # No processing_mode filter (Addendum 3)
            queue_ministry = None  # No ministry filter (independent entity)
            queue_fee_type = INDEPENDENT_FEE_ROLES[role_code]
        else:
            queue_mode = "per_line"
            queue_ministry = row["ministry_id"]
            queue_fee_type = None

        return {
            "agent_profile_id": row["agent_profile_id"],
            "entity_id": row["entity_id"],
            "entity_code": row["entity_code"],
            "entity_location_id": row["entity_location_id"],
            "region": row["region"],
            "role_code": role_code,
            "ministry_id": row["ministry_id"],
            "is_supervisor": is_supervisor,
            "is_polyvalent": is_polyvalent,
            "is_independent": is_independent,
            "queue_processing_mode": queue_mode,
            "queue_ministry_id": queue_ministry,
            "queue_fee_type": queue_fee_type,
        }

    # ==================================================================
    # Queue — Read
    # ==================================================================

    @staticmethod
    async def get_queue(
        conn, user_id: UUID,
        status: Optional[str] = None,
        fee_type: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1, page_size: int = 50,
    ) -> Tuple[List[Dict], int]:
        """Get agent's obligation queue, auto-filtered by entity scope + assignment.

        Regular agents: see only obligations assigned to them via AutoAssignmentService.
        Supervisors: see all obligations in their ministry/mode scope.
        """
        ctx = await OmsAgentService.resolve_agent_context(conn, user_id)

        status_filter = [status] if status else ["processing"]

        # Supervisors see all; agents see only their assigned obligations
        agent_profile_id = None if ctx["is_supervisor"] else ctx["agent_profile_id"]

        # Role-scoped fee_type takes priority over user-requested fee_type.
        # Independent agents (ayuntamiento=municipal, camara=chamber) are locked
        # to their fee_type — user dropdown cannot override.
        effective_fee_type = ctx["queue_fee_type"] or fee_type

        return await LicenseRepository.get_agent_queue(
            conn,
            ministry_id=ctx["queue_ministry_id"],
            processing_mode=ctx["queue_processing_mode"],
            status_filter=status_filter,
            fee_type=effective_fee_type,
            search=search,
            agent_profile_id=agent_profile_id,
            page=page, page_size=page_size,
        )

    @staticmethod
    async def get_queue_stats(conn, user_id: UUID) -> Dict:
        """Queue stats for agent OMS dashboard."""
        ctx = await OmsAgentService.resolve_agent_context(conn, user_id)

        agent_profile_id = None if ctx["is_supervisor"] else ctx["agent_profile_id"]

        return await LicenseRepository.get_agent_queue_stats(
            conn,
            ministry_id=ctx["queue_ministry_id"],
            processing_mode=ctx["queue_processing_mode"],
            fee_type=ctx["queue_fee_type"],
            agent_profile_id=agent_profile_id,
        )

    # ==================================================================
    # Queue — Processing
    # ==================================================================

    @staticmethod
    async def _validate_obligation_scope(
        conn, obligation_id: UUID, user_id: UUID,
        require_processing: bool = True,
    ) -> Tuple[Dict, Dict]:
        """Validate that an obligation is in the agent's scope (IDOR protection).

        Uses a single atomic JOIN query (obligation + license) to prevent
        TOCTOU race conditions between separate reads.

        Args:
            require_processing: If True (default), obligation must be in
                'processing' status. Set to False for read-only operations
                that need scope validation without status gating.

        Returns: (obligation, agent_context)
        Raises ValueError if obligation is not in agent's scope.
        """
        ctx = await OmsAgentService.resolve_agent_context(conn, user_id)

        # Atomic fetch: obligation + license in 1 query (no TOCTOU gap)
        row = await conn.fetchrow("""
            SELECT lo.id, lo.license_id, lo.bundle_item_id,
                   lo.fiscal_service_id, lo.ministry_id, lo.fee_type,
                   lo.amount, lo.penalty_amount, lo.status,
                   lo.payment_id, lo.issued_document_id,
                   lo.created_at, lo.updated_at,
                   fs.name_es as service_name,
                   fs.service_code,
                   m.name_es as ministry_name,
                   cl.processing_mode as license_processing_mode
            FROM license_obligations lo
            JOIN commercial_licenses cl ON cl.id = lo.license_id
            LEFT JOIN fiscal_services fs ON lo.fiscal_service_id = fs.id
            LEFT JOIN ministries m ON lo.ministry_id = m.id
            WHERE lo.id = $1
        """, obligation_id)

        if not row:
            raise ValueError(f"Obligation {obligation_id} not found")

        obligation = dict(row)
        processing_mode = obligation.pop("license_processing_mode")

        if require_processing and obligation["status"] != "processing":
            raise ValueError(
                f"Obligation {obligation_id} is not in 'processing' status "
                f"(current: {obligation['status']})"
            )

        # IDOR: verify obligation matches agent's scope
        if ctx["is_polyvalent"]:
            if processing_mode != "consolidated":
                raise ValueError(
                    f"Obligation {obligation_id} belongs to a per_line license "
                    f"— polyvalent agents can only process consolidated obligations"
                )
        else:
            if processing_mode != "per_line":
                raise ValueError(
                    f"Obligation {obligation_id} belongs to a consolidated license "
                    f"— ministry agents can only process per_line obligations"
                )
            if obligation["ministry_id"] != ctx["queue_ministry_id"]:
                raise ValueError(
                    f"Obligation {obligation_id} belongs to ministry "
                    f"{obligation['ministry_id']}, not {ctx['queue_ministry_id']}"
                )

        return obligation, ctx

    @staticmethod
    async def process_obligation(
        conn, obligation_id: UUID, user_id: UUID,
        issued_document_id: Optional[UUID] = None,
        notes: Optional[str] = None,
    ) -> Dict:
        """Process obligation: processing -> completed.

        Validates IDOR scope, updates status, logs events, refreshes counters.
        """
        obligation, ctx = await OmsAgentService._validate_obligation_scope(
            conn, obligation_id, user_id
        )

        # Update status to completed
        update_data = {"status": "completed"}
        if issued_document_id:
            update_data["issued_document_id"] = issued_document_id

        result = await LicenseService.update_obligation_status(
            conn, obligation_id, update_data,
            user_id=user_id,
            expected_license_id=obligation["license_id"],
        )

        # Log agent_approved event
        await LicenseRepository.log_event(
            conn, obligation["license_id"], "agent_approved",
            event_data={
                "agent_role": ctx["role_code"],
                "entity_code": ctx["entity_code"],
                "notes": notes,
                "issued_document_id": (
                    str(issued_document_id) if issued_document_id else None
                ),
            },
            obligation_id=obligation_id,
            triggered_by=user_id,
        )

        if issued_document_id:
            await LicenseRepository.log_event(
                conn, obligation["license_id"], "document_issued",
                event_data={
                    "document_id": str(issued_document_id),
                    "agent_role": ctx["role_code"],
                },
                obligation_id=obligation_id,
                triggered_by=user_id,
            )

        logger.info(
            f"OMS: Obligation {obligation_id} processed by {ctx['role_code']} "
            f"({ctx['entity_code']})"
        )

        return result

    @staticmethod
    async def reject_obligation(
        conn, obligation_id: UUID, user_id: UUID,
        reason: str,
    ) -> Dict:
        """Reject obligation: processing -> paid (re-routable).

        The obligation returns to 'paid' status and can be re-routed.
        """
        obligation, ctx = await OmsAgentService._validate_obligation_scope(
            conn, obligation_id, user_id
        )

        result = await LicenseService.update_obligation_status(
            conn, obligation_id, {"status": "paid"},
            user_id=user_id,
            expected_license_id=obligation["license_id"],
        )

        await LicenseRepository.log_event(
            conn, obligation["license_id"], "agent_rejected",
            event_data={
                "agent_role": ctx["role_code"],
                "entity_code": ctx["entity_code"],
                "reason": reason,
            },
            obligation_id=obligation_id,
            triggered_by=user_id,
        )

        logger.info(
            f"OMS: Obligation {obligation_id} rejected by {ctx['role_code']} "
            f"({ctx['entity_code']}): {reason}"
        )

        return result

    @staticmethod
    async def batch_process(
        conn, obligation_ids: List[UUID], user_id: UUID,
        issued_document_id: Optional[UUID] = None,
    ) -> Dict:
        """Batch process obligations. All must be in agent's scope.

        Optimized: 1 query for all obligations+licenses, 1 bulk UPDATE,
        batch event logging, single counter refresh per license.
        """
        if not obligation_ids:
            raise ValueError("No obligation IDs provided")
        if len(obligation_ids) > 500:
            raise ValueError("Batch size exceeds maximum of 500")

        ctx = await OmsAgentService.resolve_agent_context(conn, user_id)

        # 1. Batch-fetch all obligations + licenses in 1 query (no N+1)
        rows = await conn.fetch("""
            SELECT lo.id, lo.license_id, lo.ministry_id, lo.fee_type,
                   lo.amount, lo.status,
                   cl.processing_mode
            FROM license_obligations lo
            JOIN commercial_licenses cl ON cl.id = lo.license_id
            WHERE lo.id = ANY($1::uuid[])
        """, obligation_ids)

        if len(rows) != len(obligation_ids):
            found = {r["id"] for r in rows}
            missing = [oid for oid in obligation_ids if oid not in found]
            raise ValueError(f"Obligations not found: {missing}")

        # 2. Validate ALL obligations before any mutation (fail-fast)
        license_ids = set()
        for row in rows:
            if row["status"] != "processing":
                raise ValueError(
                    f"Obligation {row['id']} is not in 'processing' status"
                )

            if ctx["is_polyvalent"]:
                if row["processing_mode"] != "consolidated":
                    raise ValueError(
                        f"Obligation {row['id']} not in polyvalent scope"
                    )
            else:
                if row["processing_mode"] != "per_line":
                    raise ValueError(
                        f"Obligation {row['id']} not in ministry scope"
                    )
                if row["ministry_id"] != ctx["queue_ministry_id"]:
                    raise ValueError(
                        f"Obligation {row['id']} not in ministry scope"
                    )
            license_ids.add(row["license_id"])

        # 3. Bulk UPDATE (single statement, no N+1)
        update_fields = "status = 'completed', updated_at = NOW()"
        update_params = [obligation_ids]
        if issued_document_id:
            update_fields += ", issued_document_id = $2"
            update_params.append(issued_document_id)

        results = await conn.fetch(f"""
            UPDATE license_obligations
            SET {update_fields}
            WHERE id = ANY($1::uuid[])
              AND status = 'processing'
            RETURNING *
        """, *update_params)
        results = [dict(r) for r in results]

        # 4. Batch event logging (single INSERT)
        if results:
            event_items = [
                {
                    "obligation_id": r["id"],
                    "event_data": {
                        "agent_role": ctx["role_code"],
                        "entity_code": ctx["entity_code"],
                        "batch": True,
                        "fee_type": r["fee_type"],
                        "amount": str(r["amount"]),
                    },
                }
                for r in results
            ]
            # Group by license for batch logging
            by_license = {}
            for r in results:
                by_license.setdefault(r["license_id"], []).append({
                    "obligation_id": r["id"],
                    "event_data": {
                        "agent_role": ctx["role_code"],
                        "entity_code": ctx["entity_code"],
                        "batch": True,
                    },
                })
            for lic_id, items in by_license.items():
                await LicenseRepository.log_events_batch(
                    conn, lic_id, "agent_approved", items,
                    triggered_by=user_id,
                )

        # 5. Single counter refresh per affected license
        for lic_id in license_ids:
            await LicenseService.update_license_counters(conn, lic_id, user_id)

        logger.info(
            f"OMS: Batch processed {len(results)}/{len(obligation_ids)} "
            f"by {ctx['role_code']} ({ctx['entity_code']})"
        )

        return {"updated": len(results), "items": results}
