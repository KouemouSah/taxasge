"""
Payment Processors Module.

Provides a unified interface for handling different payment methods
using the Strategy pattern.

Processors:
- BangeProcessor: For BANGE API payments (Mobile Money, Card, Bank Transfer)
- ManualValidationProcessor: For manual validation (Cash, Check)
"""

from .base import PaymentProcessorBase, PaymentInitResult, PaymentStatusResult, PaymentContext
from .bange_processor import BangeProcessor, bange_processor
from .manual_processor import ManualValidationProcessor, manual_processor
from .registry import PaymentProcessorRegistry, payment_processor_registry

__all__ = [
    "PaymentProcessorBase",
    "PaymentInitResult",
    "PaymentStatusResult",
    "PaymentContext",
    "BangeProcessor",
    "bange_processor",
    "ManualValidationProcessor",
    "manual_processor",
    "PaymentProcessorRegistry",
    "payment_processor_registry",
]
