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
        agent_id: int,
        validation_comment: Optional[str] = None
    ) -> PaymentStatusResult:
        """
        Validate a manual payment (called by Treasury agent).

        Updates status to completed and generates receipt.

        Args:
            db: Database connection
            payment_id: Internal payment ID
            agent_id: ID of the validating agent
            validation_comment: Optional comment from agent

        Returns:
            PaymentStatusResult with updated status
        """
        try:
            # 1. Get payment
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
                    error="Payment is not pending validation"
                )

            # 3. Generate receipt number
            receipt_number = await self._generate_receipt_number(db)

            # 4. Update payment
            query = """
                UPDATE service_payments
                SET status = 'completed',
                    workflow_status = 'completed',
                    paid_at = NOW(),
                    validated_by_agent_id = $2,
                    validated_at = NOW(),
                    validation_comment = $3,
                    receipt_number = $4,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
            """
            updated = await db.fetchrow(
                query,
                payment_id,
                agent_id,
                validation_comment,
                receipt_number
            )

            # 5. TODO: Generate receipt PDF and store URL
            # receipt_url = await receipt_service.generate_pdf(payment_id)

            logger.info(
                f"Manual payment {payment_id} validated by agent {agent_id}. "
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
                validated_by=str(agent_id),
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
        agent_id: int,
        rejection_reason: str
    ) -> PaymentStatusResult:
        """
        Reject a manual payment (called by Treasury agent).

        Args:
            db: Database connection
            payment_id: Internal payment ID
            agent_id: ID of the rejecting agent
            rejection_reason: Reason for rejection

        Returns:
            PaymentStatusResult with updated status
        """
        try:
            query = """
                UPDATE service_payments
                SET status = 'failed',
                    workflow_status = 'rejected',
                    validated_by_agent_id = $2,
                    validated_at = NOW(),
                    validation_comment = $3,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
            """
            updated = await db.fetchrow(
                query,
                payment_id,
                agent_id,
                rejection_reason
            )

            if not updated:
                return PaymentStatusResult(
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    error="Payment not found"
                )

            logger.info(
                f"Manual payment {payment_id} rejected by agent {agent_id}. "
                f"Reason: {rejection_reason}"
            )

            return PaymentStatusResult(
                payment_id=payment_id,
                status=PaymentStatus.FAILED,
                paid=False,
                error=rejection_reason,
                validated_by=str(agent_id),
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

        query = """
            INSERT INTO service_payments (
                id, payment_reference, user_id, service_request_id,
                payment_method, base_amount, total_amount, currency,
                calculation_details,
                status, workflow_status, requires_agent_validation,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8,
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
