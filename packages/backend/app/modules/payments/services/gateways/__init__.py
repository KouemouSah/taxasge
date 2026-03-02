"""
Payment Gateway Integrations.

Abstract base + concrete implementations for bank API integrations.
Each gateway handles API communication with a specific bank.

Available gateways:
    BANGEGateway   → https://api.bange.gq
    EcobankGateway → https://developer.ecobank.com (Phase 3)
"""

from .base import (
    GatewayServiceBase,
    GatewayPaymentRequest,
    GatewayPaymentResponse,
    GatewayStatusResponse,
    GatewayWebhookData,
)
from .bange_gateway import BANGEGateway
from .ecobank_gateway import EcobankGateway

__all__ = [
    "GatewayServiceBase",
    "GatewayPaymentRequest",
    "GatewayPaymentResponse",
    "GatewayStatusResponse",
    "GatewayWebhookData",
    "BANGEGateway",
    "EcobankGateway",
]
