"""
Payment Assignment Event Handler
================================
Handles auto-assignment of manual payments (Cash/Check) to Treasury agents.

Business Logic:
- When a manual payment is created (PAYMENT_MANUAL_PENDING event),
  auto-assign it to an available Treasury agent
- Treasury agents have entity_id pointing to TESORO entity
- Uses load-balanced assignment based on current workload

@module payments/handlers/payment_assignment_handler
"""

import logging
from typing import Optional
from uuid import UUID

from app.core.events import EventBus, EventType, EventPayload
from app.database.connection import get_db_connection, release_db_connection

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
            # Get database connection
            conn = await get_db_connection()

            # 1. Get TESORO entity ID
            tesoro_entity = await conn.fetchrow("""
                SELECT id FROM entities
                WHERE code = $1 AND is_active = true
            """, self.TREASURY_ENTITY_CODE)

            if not tesoro_entity:
                logger.error(f"TESORO entity not found or inactive")
                return

            tesoro_entity_id = tesoro_entity["id"]

            # 2. Find available Treasury agents (lowest workload first)
            available_agents = await conn.fetch("""
                SELECT
                    ap.id as agent_profile_id,
                    ap.user_id,
                    COALESCE(u.full_name, u.first_name || ' ' || u.last_name) as agent_name,
                    COUNT(a.id) FILTER (WHERE a.status IN ('assigned', 'in_progress')) as current_assignments,
                    COALESCE(aw.max_concurrent_assignments, 20) as max_concurrent_assignments
                FROM agent_profiles ap
                INNER JOIN users u ON u.id = ap.user_id
                LEFT JOIN agent_workloads aw ON aw.agent_profile_id = ap.id
                LEFT JOIN assignments a ON a.agent_profile_id = ap.id
                WHERE ap.is_active = true
                AND ap.entity_id = $1
                AND u.role = 'agent'
                AND u.status = 'active'
                AND COALESCE(aw.availability::text, 'available') = 'available'
                GROUP BY ap.id, ap.user_id, u.id, u.full_name, u.first_name, u.last_name,
                         aw.max_concurrent_assignments
                HAVING (COUNT(a.id) FILTER (WHERE a.status IN ('assigned', 'in_progress'))::float /
                        COALESCE(aw.max_concurrent_assignments, 20)) * 100 < 80
                ORDER BY COUNT(a.id) FILTER (WHERE a.status IN ('assigned', 'in_progress')) ASC
                LIMIT 1
            """, tesoro_entity_id)

            if not available_agents:
                logger.warning(
                    f"No available Treasury agents for payment {payment_id}. "
                    f"Payment will remain unassigned in the queue."
                )
                return

            selected_agent = available_agents[0]
            agent_profile_id = selected_agent["agent_profile_id"]
            agent_name = selected_agent["agent_name"]

            # 3. Check if assignment already exists
            existing = await conn.fetchval("""
                SELECT id FROM assignments
                WHERE item_id = $1::uuid AND item_type = 'payment_validation'
            """, payment_id)

            if existing:
                logger.info(f"Payment {payment_id} already assigned, skipping")
                return

            # 4. Create assignment record
            assignment = await conn.fetchrow("""
                INSERT INTO assignments (
                    item_id,
                    item_type,
                    agent_profile_id,
                    status,
                    assignment_method,
                    priority_level,
                    assigned_at,
                    created_at,
                    updated_at
                ) VALUES (
                    $1::uuid,
                    'payment_validation',
                    $2,
                    'assigned',
                    'auto',
                    5,
                    NOW(),
                    NOW(),
                    NOW()
                )
                RETURNING id
            """, payment_id, agent_profile_id)

            # 5. Update service_payments with assigned agent
            # Note: Column was renamed from assigned_agent_profile_id to assigned_agent_id
            # in migration 049, but still references agent_profiles(id) UUID
            await conn.execute("""
                UPDATE service_payments
                SET assigned_agent_id = $1,
                    updated_at = NOW()
                WHERE id = $2::uuid
            """, agent_profile_id, payment_id)

            logger.info(
                f"Payment {payment_id} auto-assigned to Treasury agent {agent_name} "
                f"(agent_profile_id: {agent_profile_id}). Assignment ID: {assignment['id']}"
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
