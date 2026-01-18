"""
Agent Queue Event Handler
=========================
Handles events related to payment completion and adds service requests
to the agent work queue for processing.

Business Logic:
- When a payment is COMPLETED (either via electronic payment or Treasury validation),
  the corresponding service_request should be added to agent_work_queue
- This ensures agents only see requests that have been PAID
- The agent can then process the dossier (validate documents, schedule appointments, etc.)

@module service_requests/handlers/agent_queue_handler
"""

import logging
from typing import Optional
from uuid import UUID

from app.core.events import EventBus, EventType, EventPayload
from app.database.connection import get_db_connection, release_db_connection

logger = logging.getLogger(__name__)


class AgentQueueEventHandler:
    """
    Event handler that adds service requests to agent work queue
    after payment is completed.

    This handler listens to:
    - PAYMENT_COMPLETED: Triggered when any payment (BANGE, cash, check) is completed

    When triggered:
    - Fetches the service_request details
    - Adds it to agent_work_queue with appropriate priority
    - Logs the action for audit purposes
    """

    def __init__(self):
        """Initialize the agent queue event handler."""
        self._registered = False
        logger.info("AgentQueueEventHandler initialized")

    def register(self) -> None:
        """
        Register event handlers with the EventBus.
        Should be called once at application startup.
        """
        if self._registered:
            logger.warning("AgentQueueEventHandler already registered")
            return

        # Subscribe to payment completion event
        EventBus.subscribe(EventType.PAYMENT_COMPLETED, self.handle_payment_completed)
        logger.info("AgentQueueEventHandler: registered for PAYMENT_COMPLETED")

        self._registered = True

    async def handle_payment_completed(self, payload: EventPayload) -> None:
        """
        Handle PAYMENT_COMPLETED event.

        When payment is completed:
        1. Get service_request details from database
        2. Add to agent_work_queue with appropriate entity/workflow
        3. Update service_request status if needed

        Args:
            payload: Event payload containing:
                - service_request_id: UUID of the service request
                - payment_id: UUID of the payment
                - user_id: User who made the payment
                - amount: Payment amount
                - payment_method: 'bange_wallet', 'cash', 'check', etc.
        """
        service_request_id = payload.get("service_request_id")
        payment_id = payload.get("payment_id")
        payment_method = payload.get("payment_method", "unknown")

        if not service_request_id:
            logger.warning(
                f"PAYMENT_COMPLETED event missing service_request_id: {payload}"
            )
            return

        logger.info(
            f"Processing PAYMENT_COMPLETED for service_request={service_request_id}, "
            f"payment={payment_id}, method={payment_method}"
        )

        conn = None
        try:
            # Get database connection
            conn = await get_db_connection()

            # Import here to avoid circular imports
            from app.modules.service_requests.services.agent_queue_service import (
                agent_queue_service
            )

            # Fetch service request details
            sr = await conn.fetchrow("""
                SELECT
                    id,
                    reference_number,
                    workflow_code,
                    entity_code,
                    status,
                    payment_status
                FROM service_requests
                WHERE id = $1
            """, UUID(service_request_id))

            if not sr:
                logger.error(
                    f"Service request not found: {service_request_id}"
                )
                return

            # Check if payment is actually completed
            if sr["payment_status"] != "completed":
                logger.warning(
                    f"Service request {sr['reference_number']} payment_status is "
                    f"'{sr['payment_status']}', expected 'completed'. Skipping queue addition."
                )
                return

            workflow_code = sr["workflow_code"]
            entity_code = sr["entity_code"]

            if not workflow_code or not entity_code:
                logger.error(
                    f"Service request {sr['reference_number']} missing workflow_code "
                    f"or entity_code. workflow_code={workflow_code}, entity_code={entity_code}"
                )
                return

            # Add to agent work queue
            queue_item = await agent_queue_service.add_to_queue(
                db=conn,
                service_request_id=UUID(service_request_id),
                workflow_code=workflow_code,
                entity_code=entity_code,
                priority_boost=0  # Standard priority, can be adjusted based on payment method
            )

            logger.info(
                f"Service request {sr['reference_number']} added to agent queue. "
                f"Queue item ID: {queue_item.get('id')}, "
                f"Priority: {queue_item.get('priority_score')}, "
                f"Entity: {entity_code}"
            )

            # Optionally update service_request status to indicate it's queued
            # This is informational - the main status is still 'PAID'
            await conn.execute("""
                UPDATE service_requests
                SET
                    agent_notes = COALESCE(agent_notes, '') ||
                        E'\n[' || NOW()::text || '] Ajouté à la file d''attente agent après paiement ' || $2,
                    updated_at = NOW()
                WHERE id = $1
            """, UUID(service_request_id), payment_method)

        except Exception as e:
            logger.error(
                f"Failed to add service request {service_request_id} to agent queue: {e}",
                exc_info=True
            )
        finally:
            if conn:
                await release_db_connection(conn)


# Global handler instance
_handler: Optional[AgentQueueEventHandler] = None


def register_agent_queue_handlers() -> AgentQueueEventHandler:
    """
    Register agent queue handlers with the EventBus.
    Should be called once at application startup.

    Returns:
        The registered AgentQueueEventHandler instance
    """
    global _handler
    if _handler is None:
        _handler = AgentQueueEventHandler()
        _handler.register()
    return _handler
