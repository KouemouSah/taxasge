"""
Payment Processor Registry.

Central registry that maps payment methods to their appropriate processors.
Provides a unified interface for payment operations.
"""

from typing import Optional, Dict, List
from decimal import Decimal
import asyncpg
from loguru import logger

from app.modules.payments.models.payment import PaymentMethod, PaymentStatus

from .base import (
    PaymentProcessorBase,
    PaymentContext,
    PaymentInitResult,
    PaymentStatusResult,
)
from .bange_processor import BangeProcessor, bange_processor
from .manual_processor import ManualValidationProcessor, manual_processor


class PaymentProcessorRegistry:
    """
    Registry for payment processors.

    Routes payment operations to the appropriate processor
    based on payment method.

    Usage:
        registry = PaymentProcessorRegistry()
        result = await registry.initiate_payment(db, context)
    """

    def __init__(self):
        # Register all processors
        self._processors: Dict[PaymentMethod, PaymentProcessorBase] = {}
        self._register_default_processors()

    def _register_default_processors(self) -> None:
        """Register default payment processors."""
        # BANGE processor for electronic payments
        for method in bange_processor.get_supported_methods():
            self._processors[method] = bange_processor

        # Manual processor for cash/check
        for method in manual_processor.get_supported_methods():
            self._processors[method] = manual_processor

        logger.info(
            f"PaymentProcessorRegistry initialized with {len(self._processors)} methods: "
            f"{[m.value for m in self._processors.keys()]}"
        )

    def register(self, method: PaymentMethod, processor: PaymentProcessorBase) -> None:
        """
        Register a custom processor for a payment method.

        Args:
            method: Payment method
            processor: Processor instance to handle this method
        """
        self._processors[method] = processor
        logger.info(f"Registered processor {processor.__class__.__name__} for {method.value}")

    def get_processor(self, method: PaymentMethod) -> Optional[PaymentProcessorBase]:
        """
        Get the processor for a specific payment method.

        Args:
            method: Payment method

        Returns:
            Processor instance or None if not found
        """
        return self._processors.get(method)

    def get_available_methods(self) -> List[PaymentMethod]:
        """
        Get all available payment methods.

        Returns:
            List of available PaymentMethod values
        """
        return list(self._processors.keys())

    def get_methods_info(self) -> List[Dict]:
        """
        Get detailed information about available payment methods.

        Returns list with method code, label, and processor type.
        Useful for frontend to display payment options.
        """
        methods_info = []
        for method, processor in self._processors.items():
            methods_info.append({
                "code": method.value,
                "label_es": self._get_method_label_es(method),
                "label_en": self._get_method_label_en(method),
                "label_fr": self._get_method_label_fr(method),
                "processor_type": processor.processor_type.value,
                "requires_phone": method == PaymentMethod.MOBILE_MONEY,
                "requires_redirect": processor.processor_type.value == "bange_api",
                "requires_agent_validation": processor.processor_type.value == "manual",
            })
        return methods_info

    async def initiate_payment(
        self,
        db: asyncpg.Connection,
        context: PaymentContext
    ) -> PaymentInitResult:
        """
        Initiate a payment using the appropriate processor.

        Args:
            db: Database connection
            context: Payment context with all required information

        Returns:
            PaymentInitResult from the appropriate processor
        """
        processor = self.get_processor(context.payment_method)
        if not processor:
            logger.error(f"No processor registered for method: {context.payment_method}")
            return PaymentInitResult(
                success=False,
                payment_id="",
                status=PaymentStatus.FAILED,
                error=f"Payment method not supported: {context.payment_method.value}",
                message_es=f"Método de pago no soportado: {context.payment_method.value}"
            )

        logger.info(
            f"Initiating {context.payment_method.value} payment via {processor.__class__.__name__} "
            f"for service_request {context.service_request_id}"
        )

        return await processor.initiate(db, context)

    async def check_status(
        self,
        db: asyncpg.Connection,
        payment_id: str,
        payment_method: Optional[PaymentMethod] = None
    ) -> PaymentStatusResult:
        """
        Check payment status.

        If payment_method is provided, uses that processor.
        Otherwise, queries DB to find the payment and its method.

        Args:
            db: Database connection
            payment_id: Internal payment ID
            payment_method: Optional payment method (for optimization)

        Returns:
            PaymentStatusResult with current status
        """
        # If method not provided, get it from DB
        if not payment_method:
            payment = await self._get_payment_method(db, payment_id)
            if not payment:
                return PaymentStatusResult(
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    error="Payment not found"
                )
            payment_method = PaymentMethod(payment["payment_method"])

        processor = self.get_processor(payment_method)
        if not processor:
            return PaymentStatusResult(
                payment_id=payment_id,
                status=PaymentStatus.FAILED,
                error=f"No processor for method: {payment_method.value}"
            )

        return await processor.check_status(db, payment_id)

    async def cancel_payment(
        self,
        db: asyncpg.Connection,
        payment_id: str,
        reason: Optional[str] = None
    ) -> bool:
        """
        Cancel a pending payment.

        Args:
            db: Database connection
            payment_id: Internal payment ID
            reason: Cancellation reason

        Returns:
            True if cancelled successfully
        """
        payment = await self._get_payment_method(db, payment_id)
        if not payment:
            return False

        processor = self.get_processor(PaymentMethod(payment["payment_method"]))
        if not processor:
            return False

        return await processor.cancel(db, payment_id, reason)

    # === Agent Validation Methods (for manual payments) ===

    async def validate_manual_payment(
        self,
        db: asyncpg.Connection,
        payment_id: str,
        agent_id: int,
        comment: Optional[str] = None
    ) -> PaymentStatusResult:
        """
        Validate a manual payment (cash/check).

        Called by Treasury agent when they confirm receipt.

        Args:
            db: Database connection
            payment_id: Internal payment ID
            agent_id: ID of the validating agent
            comment: Optional validation comment

        Returns:
            PaymentStatusResult with updated status
        """
        # Verify this is a manual payment
        payment = await self._get_payment_method(db, payment_id)
        if not payment:
            return PaymentStatusResult(
                payment_id=payment_id,
                status=PaymentStatus.FAILED,
                error="Payment not found"
            )

        method = PaymentMethod(payment["payment_method"])
        if method not in [PaymentMethod.CASH, PaymentMethod.CHECK]:
            return PaymentStatusResult(
                payment_id=payment_id,
                status=PaymentStatus.FAILED,
                error="Payment method does not require manual validation"
            )

        return await manual_processor.validate_payment(db, payment_id, agent_id, comment)

    async def reject_manual_payment(
        self,
        db: asyncpg.Connection,
        payment_id: str,
        agent_id: int,
        reason: str
    ) -> PaymentStatusResult:
        """
        Reject a manual payment (cash/check).

        Called by Treasury agent when they reject a payment.

        Args:
            db: Database connection
            payment_id: Internal payment ID
            agent_id: ID of the rejecting agent
            reason: Rejection reason

        Returns:
            PaymentStatusResult with updated status
        """
        return await manual_processor.reject_payment(db, payment_id, agent_id, reason)

    # === Private Helper Methods ===

    async def _get_payment_method(
        self,
        db: asyncpg.Connection,
        payment_id: str
    ) -> Optional[dict]:
        """Get payment record with method from database."""
        query = """
            SELECT id, payment_method, status
            FROM service_payments
            WHERE id = $1
        """
        return await db.fetchrow(query, payment_id)

    def _get_method_label_es(self, method: PaymentMethod) -> str:
        """Get Spanish label for payment method."""
        labels = {
            PaymentMethod.MOBILE_MONEY: "Dinero Móvil",
            PaymentMethod.CARD: "Tarjeta Bancaria",
            PaymentMethod.BANK_TRANSFER: "Transferencia Bancaria",
            PaymentMethod.CASH: "Efectivo",
            PaymentMethod.CHECK: "Cheque",
        }
        return labels.get(method, method.value)

    def _get_method_label_en(self, method: PaymentMethod) -> str:
        """Get English label for payment method."""
        labels = {
            PaymentMethod.MOBILE_MONEY: "Mobile Money",
            PaymentMethod.CARD: "Bank Card",
            PaymentMethod.BANK_TRANSFER: "Bank Transfer",
            PaymentMethod.CASH: "Cash",
            PaymentMethod.CHECK: "Check",
        }
        return labels.get(method, method.value)

    def _get_method_label_fr(self, method: PaymentMethod) -> str:
        """Get French label for payment method."""
        labels = {
            PaymentMethod.MOBILE_MONEY: "Mobile Money",
            PaymentMethod.CARD: "Carte Bancaire",
            PaymentMethod.BANK_TRANSFER: "Virement Bancaire",
            PaymentMethod.CASH: "Espèces",
            PaymentMethod.CHECK: "Chèque",
        }
        return labels.get(method, method.value)


# Singleton instance
payment_processor_registry = PaymentProcessorRegistry()
