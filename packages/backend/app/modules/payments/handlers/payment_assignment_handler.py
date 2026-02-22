"""
Payment Assignment Event Handler
================================
Handles auto-assignment of manual payments (Cash/Check) to Treasury agents.

Business Logic:
- When a manual payment is created (PAYMENT_MANUAL_PENDING event),
  auto-assign it to an available Treasury agent
- Uses AutoAssignmentService with site-based routing (entity_location_id)
- Fallback: site exact → floating agents → entity-wide

@module payments/handlers/payment_assignment_handler
"""

import logging
from typing import Optional
from uuid import UUID

from app.core.events import EventBus, EventType, EventPayload
from app.database.connection import get_db_connection, release_db_connection
from app.modules.assignment.services.auto_assignment_service import AutoAssignmentService

logger = logging.getLogger(__name__)


class PaymentAssignmentHandler:
    """
    Event handler that auto-assigns manual payments to Treasury agents.

    This handler listens to:
    - PAYMENT_MANUAL_PENDING: Triggered when Cash/Check payment is created

    When triggered:
    - Finds available Treasury agents (entity_code = 'TESORO')
    - Selects the agent with lowest workload
    - Creates assignment with item_type = 'payment_validation'
    """

    TREASURY_ENTITY_CODE = "TESORO"

    def __init__(self):
        """Initialize the payment assignment handler."""
        self._registered = False
        logger.info("PaymentAssignmentHandler initialized")

    def register(self) -> None:
        """
        Register event handlers with the EventBus.
        Should be called once at application startup.
        """
        if self._registered:
            logger.warning("PaymentAssignmentHandler already registered")
            return

        # Subscribe to manual payment pending event
        EventBus.subscribe(EventType.PAYMENT_MANUAL_PENDING, self.handle_manual_payment_pending)
        logger.info("PaymentAssignmentHandler: registered for PAYMENT_MANUAL_PENDING")

        self._registered = True

    async def handle_manual_payment_pending(self, payload: EventPayload) -> None:
        """
        Handle PAYMENT_MANUAL_PENDING event.

        When a manual payment is created:
        1. Find available Treasury agents
        2. Select agent with lowest workload
        3. Create assignment record

        Args:
            payload: Event payload containing:
                - payment_id: UUID of the payment
                - service_request_id: UUID of the service request
                - user_id: User who made the payment
                - amount: Payment amount
                - payment_method: 'cash' or 'check'
        """
        payment_id = payload.get("payment_id")
        service_request_id = payload.get("service_request_id")
        payment_method = payload.get("payment_method", "unknown")
        amount = payload.get("amount", 0)

        if not payment_id:
            logger.warning(
                f"PAYMENT_MANUAL_PENDING event missing payment_id: {payload}"
            )
            return

        logger.info(
            f"Processing PAYMENT_MANUAL_PENDING for payment={payment_id}, "
            f"service_request={service_request_id}, method={payment_method}, amount={amount}"
        )

        conn = None
        try:
            conn = await get_db_connection()

            # 1. Check if assignment already exists (duplicate guard)
            existing = await conn.fetchval("""
                SELECT id FROM assignments
                WHERE item_id = $1::uuid AND item_type = 'payment_validation'
            """, payment_id)

            if existing:
                logger.info(f"Payment {payment_id} already assigned, skipping")
                return

            # 2. Get entity_location_id from service_request for site-based routing
            entity_location_id = None
            if service_request_id:
                entity_location_id = await conn.fetchval("""
                    SELECT entity_location_id FROM service_requests WHERE id = $1::uuid
                """, service_request_id)

            # 3. Auto-assign via AutoAssignmentService (site-based routing with fallback)
            assignment_service = AutoAssignmentService()
            assignment = await assignment_service.auto_assign_item(
                db=conn,
                item_id=UUID(str(payment_id)),
                item_type="payment_validation",
                item_data={"amount": amount, "payment_method": payment_method},
                entity_code=self.TREASURY_ENTITY_CODE,
                entity_location_id=entity_location_id,
                priority_level=5,
            )

            if not assignment:
                logger.warning(
                    f"No available Treasury agents for payment {payment_id}. "
                    f"Payment will remain unassigned in the queue."
                )
                return

            agent_profile_id = assignment.agent_profile_id

            # 4. Update service_payments with assigned agent
            await conn.execute("""
                UPDATE service_payments
                SET assigned_agent_id = $1,
                    updated_at = NOW()
                WHERE id = $2::uuid
            """, agent_profile_id, payment_id)

            logger.info(
                f"Payment {payment_id} auto-assigned to Treasury agent "
                f"(agent_profile_id: {agent_profile_id}). "
                f"Assignment ID: {assignment.id}, location_id: {entity_location_id}"
            )

        except Exception as e:
            logger.error(
                f"Failed to auto-assign payment {payment_id} to Treasury agent: {e}",
                exc_info=True
            )
        finally:
            if conn:
                await release_db_connection(conn)


# Global handler instance
_handler: Optional[PaymentAssignmentHandler] = None


def register_payment_assignment_handlers() -> PaymentAssignmentHandler:
    """
    Register payment assignment handlers with the EventBus.
    Should be called once at application startup.

    Returns:
        The registered PaymentAssignmentHandler instance
    """
    global _handler
    if _handler is None:
        _handler = PaymentAssignmentHandler()
        _handler.register()
    return _handler
