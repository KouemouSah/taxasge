"""
Manual Validation Payment Processor.

Handles payments that require agent validation:
- Cash payments
- Check payments

These payments don't call any external API.
Instead, they create a record in 'pending_agent_review' status
and wait for a Treasury agent to validate.
"""

from typing import Optional
from datetime import datetime
from decimal import Decimal
from uuid import uuid4
import json
import asyncpg
from loguru import logger

from app.modules.payments.models.payment import PaymentMethod, PaymentStatus

from .base import (
    PaymentProcessorBase,
    ProcessorType,
    PaymentContext,
    PaymentInitResult,
    PaymentStatusResult,
)


class ManualValidationProcessor(PaymentProcessorBase):
    """
    Payment processor for manual validation (Cash, Check).

    Flow:
    1. User selects Cash/Check
    2. System creates service_payment with status='pending' and workflow_status='pending_agent_review'
    3. Treasury agent sees it in their dashboard
    4. Agent validates (confirms cash received) or rejects
    5. System updates status and generates receipt
    """

    processor_type = ProcessorType.MANUAL_VALIDATION

    def get_supported_methods(self) -> list[PaymentMethod]:
        """Return payment methods that require manual validation."""
        return [
            PaymentMethod.CASH,
            PaymentMethod.CHECK,
        ]

    async def initiate(
        self,
        db: asyncpg.Connection,
        context: PaymentContext
    ) -> PaymentInitResult:
        """
        Initiate a manual validation payment.

        Creates a payment record waiting for agent validation.

        Args:
            db: Database connection
            context: Payment context

        Returns:
            PaymentInitResult indicating payment is awaiting agent validation
        """
        try:
            # 1. Generate payment reference
            payment_reference = self._generate_reference(context)
            payment_id = str(uuid4())

            # 2. Create service_payment record with pending_agent_review status
            await self._create_service_payment(
                db=db,
                payment_id=payment_id,
                context=context,
                payment_reference=payment_reference
            )

            # 3. Get appropriate message based on payment method
            if context.payment_method == PaymentMethod.CASH:
                message = (
                    f"Pago en efectivo registrado. "
                    f"Presente este comprobante en la oficina del Tesoro "
                    f"junto con el monto de {context.amount:,.0f} {context.currency}. "
                    f"Referencia: {payment_reference}"
                )
                action_type = "agent_validation_cash"
            else:  # CHECK
                message = (
                    f"Pago con cheque registrado. "
                    f"Presente el cheque por {context.amount:,.0f} {context.currency} "
                    f"en la oficina del Tesoro. "
                    f"Referencia: {payment_reference}"
                )
                action_type = "agent_validation_check"

            logger.info(
                f"Manual payment initiated: {payment_id} ({context.payment_method.value}) "
                f"for service_request {context.service_request_id}"
            )

            return PaymentInitResult(
                success=True,
                payment_id=payment_id,
                external_reference=payment_reference,
                redirect_url=None,  # No redirect for manual payments
                status=PaymentStatus.PENDING,
                requires_action=True,
                action_type=action_type,
                message_es=message,
                expires_at=None,  # Manual payments don't expire
                metadata={
                    "payment_reference": payment_reference,
                    "payment_method": context.payment_method.value,
                    "requires_agent_validation": True,
                }
            )

        except Exception as e:
            logger.error(f"Error initiating manual payment: {e}")
            return PaymentInitResult(
                success=False,
                payment_id=str(uuid4()),
                status=PaymentStatus.FAILED,
                error=str(e),
                message_es="Error al registrar el pago. Intente nuevamente."
            )

    async def check_status(
        self,
        db: asyncpg.Connection,
        payment_id: str
    ) -> PaymentStatusResult:
        """
        Check manual payment status.

        Checks the local database for current status.
        Manual payments are updated by agents, not by external API.

        Args:
            db: Database connection
            payment_id: Internal payment ID

        Returns:
            PaymentStatusResult with current status
        """
        try:
            payment = await self._get_payment(db, payment_id)
            if not payment:
                return PaymentStatusResult(
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    error="Payment not found"
                )

            status = PaymentStatus(payment["status"])

            return PaymentStatusResult(
                payment_id=payment_id,
                status=status,
                paid=status == PaymentStatus.COMPLETED,
                paid_at=payment.get("paid_at"),
                amount=payment.get("total_amount"),
                currency=payment.get("currency", "XAF"),
                receipt_number=payment.get("receipt_number"),
                receipt_url=payment.get("receipt_url"),
                validated_by=str(payment.get("validated_by_agent_id")) if payment.get("validated_by_agent_id") else None,
            )

        except Exception as e:
            logger.error(f"Error checking manual payment status: {e}")
            return PaymentStatusResult(
                payment_id=payment_id,
                status=PaymentStatus.PENDING,
                error=str(e)
            )

    async def validate_payment(
        self,
        db: asyncpg.Connection,
        payment_id: str,
        agent_profile_id: str,
        validation_comment: Optional[str] = None
    ) -> PaymentStatusResult:
        """
        Validate a manual payment (called by Treasury agent).

        Updates status to completed, generates receipt PDF, and notifies user.

        Args:
            db: Database connection
            payment_id: Internal payment ID
            agent_profile_id: UUID of the agent profile (from agent_profiles table)
            validation_comment: Optional comment from agent

        Returns:
            PaymentStatusResult with updated status
        """
        from app.modules.payments.services.receipt_service import receipt_service
        from app.core.events import EventBus, EventType

        try:
            # 1. Get payment with user and service request data
            payment = await self._get_payment(db, payment_id)
            if not payment:
                return PaymentStatusResult(
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    error="Payment not found"
                )

            # 2. Verify it's pending validation
            if payment["workflow_status"] != "pending_agent_review":
                return PaymentStatusResult(
                    payment_id=payment_id,
                    status=PaymentStatus(payment["status"]),
                    error=f"Payment is not pending validation (status: {payment['workflow_status']})"
                )

            # 3. Get user data for receipt and notifications
            user_query = """
                SELECT id, email, phone_number as phone, first_name, last_name, dni, preferred_language
                FROM users WHERE id = $1
            """
            user_data = await db.fetchrow(user_query, payment["user_id"])
            if not user_data:
                user_data = {"email": "N/A", "first_name": "", "last_name": ""}

            # 4. Get service request data for receipt (workflow_code, entity_code, solicitud_type)
            service_query = """
                SELECT sr.id, sr.reference, sr.workflow_code, sr.solicitud_type, sr.entity_code
                FROM service_requests sr
                WHERE sr.id = $1
            """
            service_data = await db.fetchrow(service_query, payment["service_request_id"])

            # 5. Get agent data for receipt (using agent_profiles table)
            agent_query = """
                SELECT u.first_name, u.last_name
                FROM users u
                JOIN agent_profiles ap ON ap.user_id = u.id
                WHERE ap.id = $1::uuid
            """
            agent_data = await db.fetchrow(agent_query, agent_profile_id)
            agent_name = None
            if agent_data:
                agent_name = f"{agent_data['first_name'] or ''} {agent_data['last_name'] or ''}".strip()

            # 6. Update payment status first (using agent_profile_id UUID)
            paid_at = datetime.utcnow()
            update_query = """
                UPDATE service_payments
                SET status = 'completed',
                    workflow_status = 'completed',
                    paid_at = $2,
                    validated_by_agent_profile_id = $3::uuid,
                    validated_at = NOW(),
                    validation_comment = $4,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
            """
            updated = await db.fetchrow(
                update_query,
                payment_id,
                paid_at,
                agent_profile_id,
                validation_comment
            )

            # 6b. Update service_requests to keep tables in sync
            # This is critical for:
            # - checkPaymentStatus endpoint to return correct status (payment_status)
            # - Overall request workflow status transition (status: PAYMENT_PENDING → PAID)
            await db.execute(
                """
                UPDATE service_requests
                SET payment_status = 'completed',
                    status = 'PAID',
                    paid_at = $2,
                    updated_at = NOW()
                WHERE id = $1
                """,
                payment["service_request_id"],
                paid_at
            )
            logger.info(
                f"Updated service_requests {payment['service_request_id']}: "
                f"payment_status=completed, status=PAID"
            )

            # 7. Generate and store receipt PDF
            receipt_number = None
            receipt_url = None
            try:
                payment_data = dict(updated)
                receipt_result = await receipt_service.generate_and_store_receipt(
                    db=db,
                    payment_id=payment_id,
                    user_id=str(payment["user_id"]),
                    payment_data=payment_data,
                    user_data=dict(user_data) if user_data else {},
                    service_data=dict(service_data) if service_data else None,
                    validated_by=agent_profile_id,
                    validated_by_name=agent_name,
                    validated_at=paid_at,
                    language="es",  # TODO: Get user's preferred language
                )
                receipt_number = receipt_result["receipt_number"]
                receipt_url = receipt_result["receipt_url"]
                logger.info(f"Receipt generated: {receipt_number}")
            except Exception as e:
                # Log but don't fail the validation
                logger.error(f"Failed to generate receipt for payment {payment_id}: {e}")
                # Generate a simple receipt number as fallback
                receipt_number = await self._generate_receipt_number(db)
                # Update payment with fallback receipt number
                await db.execute(
                    "UPDATE service_payments SET receipt_number = $1 WHERE id = $2",
                    receipt_number, payment_id
                )

            # 8. Publish PAYMENT_COMPLETED event to trigger notifications
            try:
                await EventBus.publish(EventType.PAYMENT_COMPLETED, {
                    "payment_id": payment_id,
                    "user_id": str(payment["user_id"]),
                    "service_request_id": str(payment["service_request_id"]),
                    "amount": float(updated["total_amount"]),
                    "currency": updated["currency"],
                    "payment_method": updated["payment_method"],
                    "receipt_number": receipt_number,
                    "receipt_url": receipt_url,
                    "agent_profile_id": agent_profile_id,
                    "user_email": user_data["email"] if user_data else None,
                    "user_phone": user_data["phone"] if user_data else None,
                    "preferred_language": user_data.get("preferred_language", "es") if user_data else "es",
                    "date": paid_at.strftime("%d/%m/%Y"),
                })
                logger.info(f"PAYMENT_COMPLETED event published for {payment_id}")
            except Exception as e:
                # Log but don't fail the validation
                logger.error(f"Failed to publish PAYMENT_COMPLETED event: {e}")

            logger.info(
                f"Manual payment {payment_id} validated by agent_profile {agent_profile_id}. "
                f"Receipt: {receipt_number}"
            )

            return PaymentStatusResult(
                payment_id=payment_id,
                status=PaymentStatus.COMPLETED,
                paid=True,
                paid_at=updated["paid_at"],
                amount=updated["total_amount"],
                currency=updated["currency"],
                receipt_number=receipt_number,
                receipt_url=receipt_url,
                validated_by=agent_profile_id,
            )

        except Exception as e:
            logger.error(f"Error validating manual payment: {e}")
            return PaymentStatusResult(
                payment_id=payment_id,
                status=PaymentStatus.PENDING,
                error=str(e)
            )

    async def reject_payment(
        self,
        db: asyncpg.Connection,
        payment_id: str,
        agent_profile_id: str,
        rejection_reason: str
    ) -> PaymentStatusResult:
        """
        Reject a manual payment (called by Treasury agent).

        Args:
            db: Database connection
            payment_id: Internal payment ID
            agent_profile_id: UUID of the agent profile (from agent_profiles table)
            rejection_reason: Reason for rejection

        Returns:
            PaymentStatusResult with updated status
        """
        try:
            query = """
                UPDATE service_payments
                SET status = 'failed',
                    workflow_status = 'rejected',
                    validated_by_agent_profile_id = $2::uuid,
                    validated_at = NOW(),
                    validation_comment = $3,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
            """
            updated = await db.fetchrow(
                query,
                payment_id,
                agent_profile_id,
                rejection_reason
            )

            if not updated:
                return PaymentStatusResult(
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    error="Payment not found"
                )

            logger.info(
                f"Manual payment {payment_id} rejected by agent_profile {agent_profile_id}. "
                f"Reason: {rejection_reason}"
            )

            return PaymentStatusResult(
                payment_id=payment_id,
                status=PaymentStatus.FAILED,
                paid=False,
                error=rejection_reason,
                validated_by=agent_profile_id,
            )

        except Exception as e:
            logger.error(f"Error rejecting manual payment: {e}")
            return PaymentStatusResult(
                payment_id=payment_id,
                status=PaymentStatus.PENDING,
                error=str(e)
            )

    # === Private Helper Methods ===

    def _generate_reference(self, context: PaymentContext) -> str:
        """Generate unique payment reference for manual payment."""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        short_id = str(uuid4())[:8].upper()
        method_prefix = "CSH" if context.payment_method == PaymentMethod.CASH else "CHK"
        return f"{method_prefix}-{timestamp}-{short_id}"

    async def _create_service_payment(
        self,
        db: asyncpg.Connection,
        payment_id: str,
        context: PaymentContext,
        payment_reference: str
    ) -> None:
        """Create service_payment record for manual validation."""
        # Serialize tariff_breakdown for calculation_details
        calculation_details = None
        if context.tariff_breakdown:
            calculation_details = json.dumps(context.tariff_breakdown)

        # Use total from tariff_breakdown if available
        total_amount = context.get_total_amount()
        base_amount = context.amount  # Original amount before supplements

        if context.tariff_breakdown:
            base_amount = Decimal(str(context.tariff_breakdown.get('base_amount', context.amount)))

        # fiscal_service_code column removed in migration 041
        # All payments now link via service_request_id

        query = """
            INSERT INTO service_payments (
                id, payment_reference, user_id, service_request_id,
                payment_type, payment_method, base_amount, total_amount, currency,
                calculation_details,
                status, workflow_status, requires_agent_validation,
                created_at, updated_at
            ) VALUES (
                $1::uuid, $2, $3::uuid, $4::uuid,
                'full', $5, $6, $7, $8,
                $9::jsonb,
                'pending', 'pending_agent_review', true,
                NOW(), NOW()
            )
        """
        await db.execute(
            query,
            payment_id,
            payment_reference,
            context.user_id,
            context.service_request_id,
            context.payment_method.value,
            base_amount,
            total_amount,
            context.currency,
            calculation_details,
        )

    async def _get_payment(
        self,
        db: asyncpg.Connection,
        payment_id: str
    ) -> Optional[dict]:
        """Get payment record from database."""
        query = """SELECT * FROM service_payments WHERE id = $1"""
        return await db.fetchrow(query, payment_id)

    async def _generate_receipt_number(self, db: asyncpg.Connection) -> str:
        """Generate unique receipt number."""
        # Format: REC-YYYY-NNNNNN
        year = datetime.utcnow().year
        query = """
            SELECT COUNT(*) + 1 as next_num
            FROM service_payments
            WHERE receipt_number IS NOT NULL
            AND EXTRACT(YEAR FROM paid_at) = $1
        """
        result = await db.fetchrow(query, year)
        next_num = result["next_num"] if result else 1
        return f"REC-{year}-{next_num:06d}"


# Singleton instance
manual_processor = ManualValidationProcessor()
