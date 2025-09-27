"""
BANGE Payment Service for TaxasGE Backend
Integration with BANGE payment gateway for Equatorial Guinea
"""

import httpx
import hashlib
import hmac
from typing import Dict, Optional, Any
from decimal import Decimal
from datetime import datetime, timedelta
from loguru import logger
from uuid import uuid4

from app.core.config import get_settings
from app.models.payment import (
    BANGEPaymentRequest, BANGEPaymentResponse, BANGEWebhookData,
    Payment, PaymentStatusEnum, CurrencyEnum
)


class BANGEService:
    """BANGE Payment Gateway Service"""

    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.bange_api_url or "https://api.bange.gq"
        self.merchant_id = self.settings.bange_merchant_id
        self.api_key = self.settings.bange_api_key
        self.webhook_secret = self.settings.bange_webhook_secret
        self.timeout = 30  # 30 seconds timeout

    async def create_payment(self, payment_request: BANGEPaymentRequest) -> Optional[BANGEPaymentResponse]:
        """
        Create payment with BANGE gateway

        Args:
            payment_request: Payment request data

        Returns:
            BANGE payment response or None if failed
        """
        try:
            # Prepare request data
            request_data = {
                "merchant_id": self.merchant_id,
                "amount": float(payment_request.amount),
                "currency": payment_request.currency.value,
                "description": payment_request.description,
                "reference": payment_request.reference,
                "callback_url": payment_request.callback_url,
                "return_url": payment_request.return_url,
                "customer": {
                    "email": payment_request.customer_email,
                    "phone": payment_request.customer_phone
                },
                "metadata": payment_request.metadata or {},
                "expires_in": 3600  # 1 hour expiration
            }

            # Add signature for security
            signature = self._generate_signature(request_data)
            request_data["signature"] = signature

            # Make API call
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/payments",
                    json=request_data,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )

                if response.status_code == 201:
                    response_data = response.json()

                    return BANGEPaymentResponse(
                        payment_id=response_data["payment_id"],
                        payment_url=response_data["payment_url"],
                        reference=response_data["reference"],
                        status=response_data["status"],
                        amount=Decimal(str(response_data["amount"])),
                        currency=CurrencyEnum(response_data["currency"]),
                        expires_at=datetime.fromisoformat(response_data["expires_at"]) if response_data.get("expires_at") else None,
                        created_at=datetime.fromisoformat(response_data["created_at"])
                    )
                else:
                    logger.error(f"BANGE payment creation failed: {response.status_code} - {response.text}")
                    return None

        except Exception as e:
            logger.error(f"Error creating BANGE payment: {e}")
            return None

    async def verify_payment(self, payment_id: str) -> Optional[Dict[str, Any]]:
        """
        Verify payment status with BANGE

        Args:
            payment_id: BANGE payment ID

        Returns:
            Payment verification data or None if failed
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/payments/{payment_id}",
                    headers={
                        "Authorization": f"Bearer {self.api_key}"
                    }
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"BANGE payment verification failed: {response.status_code} - {response.text}")
                    return None

        except Exception as e:
            logger.error(f"Error verifying BANGE payment {payment_id}: {e}")
            return None

    async def cancel_payment(self, payment_id: str, reason: str = "Cancelled by user") -> bool:
        """
        Cancel payment with BANGE

        Args:
            payment_id: BANGE payment ID
            reason: Cancellation reason

        Returns:
            True if successful, False otherwise
        """
        try:
            request_data = {
                "reason": reason
            }

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/payments/{payment_id}/cancel",
                    json=request_data,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )

                if response.status_code in [200, 204]:
                    logger.info(f"BANGE payment {payment_id} cancelled successfully")
                    return True
                else:
                    logger.error(f"BANGE payment cancellation failed: {response.status_code} - {response.text}")
                    return False

        except Exception as e:
            logger.error(f"Error cancelling BANGE payment {payment_id}: {e}")
            return False

    async def initiate_refund(self, payment_id: str, amount: Decimal, reason: str) -> Optional[Dict[str, Any]]:
        """
        Initiate refund with BANGE

        Args:
            payment_id: Original payment ID
            amount: Refund amount
            reason: Refund reason

        Returns:
            Refund data or None if failed
        """
        try:
            request_data = {
                "amount": float(amount),
                "reason": reason,
                "refund_reference": f"REF-{uuid4().hex[:8].upper()}"
            }

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/payments/{payment_id}/refund",
                    json=request_data,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )

                if response.status_code == 201:
                    refund_data = response.json()
                    logger.info(f"BANGE refund initiated for payment {payment_id}: {refund_data['refund_id']}")
                    return refund_data
                else:
                    logger.error(f"BANGE refund initiation failed: {response.status_code} - {response.text}")
                    return None

        except Exception as e:
            logger.error(f"Error initiating BANGE refund for payment {payment_id}: {e}")
            return None

    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify BANGE webhook signature

        Args:
            payload: Raw webhook payload
            signature: Webhook signature from headers

        Returns:
            True if signature is valid, False otherwise
        """
        try:
            if not self.webhook_secret:
                logger.warning("BANGE webhook secret not configured")
                return False

            # Calculate expected signature
            expected_signature = hmac.new(
                self.webhook_secret.encode('utf-8'),
                payload,
                hashlib.sha256
            ).hexdigest()

            # Compare signatures (constant-time comparison)
            return hmac.compare_digest(
                f"sha256={expected_signature}",
                signature
            )

        except Exception as e:
            logger.error(f"Error verifying BANGE webhook signature: {e}")
            return False

    def parse_webhook_data(self, payload: Dict[str, Any]) -> Optional[BANGEWebhookData]:
        """
        Parse BANGE webhook payload

        Args:
            payload: Webhook payload data

        Returns:
            Parsed webhook data or None if invalid
        """
        try:
            return BANGEWebhookData(
                payment_id=payload["payment_id"],
                reference=payload["reference"],
                status=payload["status"],
                amount=Decimal(str(payload["amount"])),
                currency=CurrencyEnum(payload["currency"]),
                customer_email=payload.get("customer", {}).get("email"),
                paid_at=datetime.fromisoformat(payload["paid_at"]) if payload.get("paid_at") else None,
                metadata=payload.get("metadata", {})
            )

        except Exception as e:
            logger.error(f"Error parsing BANGE webhook data: {e}")
            return None

    async def get_payment_methods(self) -> List[Dict[str, Any]]:
        """
        Get available payment methods from BANGE

        Returns:
            List of available payment methods
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/payment-methods",
                    headers={
                        "Authorization": f"Bearer {self.api_key}"
                    }
                )

                if response.status_code == 200:
                    return response.json().get("payment_methods", [])
                else:
                    logger.error(f"Failed to get BANGE payment methods: {response.status_code}")
                    return []

        except Exception as e:
            logger.error(f"Error getting BANGE payment methods: {e}")
            return []

    async def get_exchange_rates(self) -> Dict[str, Decimal]:
        """
        Get current exchange rates from BANGE

        Returns:
            Dictionary of exchange rates
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/exchange-rates",
                    headers={
                        "Authorization": f"Bearer {self.api_key}"
                    }
                )

                if response.status_code == 200:
                    rates_data = response.json()
                    return {
                        currency: Decimal(str(rate))
                        for currency, rate in rates_data.get("rates", {}).items()
                    }
                else:
                    logger.error(f"Failed to get BANGE exchange rates: {response.status_code}")
                    return {}

        except Exception as e:
            logger.error(f"Error getting BANGE exchange rates: {e}")
            return {}

    def map_bange_status_to_internal(self, bange_status: str) -> PaymentStatusEnum:
        """
        Map BANGE payment status to internal status enum

        Args:
            bange_status: BANGE payment status

        Returns:
            Internal payment status enum
        """
        status_mapping = {
            "pending": PaymentStatusEnum.pending,
            "processing": PaymentStatusEnum.processing,
            "completed": PaymentStatusEnum.completed,
            "paid": PaymentStatusEnum.completed,
            "success": PaymentStatusEnum.completed,
            "failed": PaymentStatusEnum.failed,
            "error": PaymentStatusEnum.failed,
            "cancelled": PaymentStatusEnum.cancelled,
            "expired": PaymentStatusEnum.failed,
            "refunded": PaymentStatusEnum.refunded
        }

        return status_mapping.get(bange_status.lower(), PaymentStatusEnum.failed)

    def _generate_signature(self, data: Dict[str, Any]) -> str:
        """
        Generate HMAC signature for BANGE API request

        Args:
            data: Request data

        Returns:
            HMAC signature
        """
        try:
            # Create canonical string from request data
            canonical_string = self._create_canonical_string(data)

            # Generate HMAC signature
            signature = hmac.new(
                self.api_key.encode('utf-8'),
                canonical_string.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            return signature

        except Exception as e:
            logger.error(f"Error generating BANGE signature: {e}")
            return ""

    def _create_canonical_string(self, data: Dict[str, Any]) -> str:
        """
        Create canonical string for signature generation

        Args:
            data: Request data

        Returns:
            Canonical string
        """
        # Sort keys and create canonical string
        sorted_keys = sorted(data.keys())
        canonical_parts = []

        for key in sorted_keys:
            if key != "signature":  # Exclude signature field itself
                value = data[key]
                if isinstance(value, dict):
                    # For nested objects, convert to JSON string
                    import json
                    value = json.dumps(value, sort_keys=True, separators=(',', ':'))
                canonical_parts.append(f"{key}={value}")

        return "&".join(canonical_parts)

    async def health_check(self) -> bool:
        """
        Check BANGE API health status

        Returns:
            True if API is healthy, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    f"{self.base_url}/health",
                    headers={
                        "Authorization": f"Bearer {self.api_key}"
                    }
                )

                return response.status_code == 200

        except Exception as e:
            logger.error(f"BANGE health check failed: {e}")
            return False


# Global BANGE service instance
bange_service = BANGEService()