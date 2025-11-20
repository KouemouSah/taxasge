"""
BANGE Service - Mobile Money Payment Integration

Intégration API BANGE pour initier paiements mobiles
"""

from typing import Dict, Any, Optional
from loguru import logger
from decimal import Decimal
import httpx
import uuid


class BangeService:
    """Service for BANGE API integration"""

    def __init__(self, api_endpoint: str = None, api_key: str = None):
        """
        Initialize BANGE service

        Args:
            api_endpoint: BANGE API URL (from bank_configurations)
            api_key: BANGE API key (from bank_configurations.api_key_encrypted)
        """
        self.api_endpoint = api_endpoint or "https://api.bange.gn/v1"
        self.api_key = api_key
        self.timeout = 30.0

    async def initiate_payment(
        self,
        payment_id: str,
        amount: Decimal,
        currency: str,
        phone_number: str,
        reference: str,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Initiate BANGE mobile money payment

        Args:
            payment_id: Internal payment UUID
            amount: Amount to charge
            currency: Currency (XAF)
            phone_number: Customer phone number
            reference: Unique reference (payment.bank_reference)
            description: Payment description

        Returns:
            {
                "success": bool,
                "bange_reference": str,
                "status": str,
                "message": str,
                "transaction_id": str
            }
        """
        if not self.api_key:
            logger.error("BANGE API key not configured")
            return {
                "success": False,
                "status": "error",
                "message": "BANGE API key not configured",
            }

        payload = {
            "merchant_reference": reference,
            "amount": float(amount),
            "currency": currency,
            "phone_number": phone_number,
            "description": description or f"Payment {payment_id}",
            "callback_url": f"{self.api_endpoint}/webhooks/bange",
            "metadata": {
                "payment_id": payment_id,
            },
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_endpoint}/payments/initiate",
                    json=payload,
                    headers=headers,
                )

                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"BANGE payment initiated: {reference}, transaction_id: {data.get('transaction_id')}")
                    return {
                        "success": True,
                        "bange_reference": data.get("reference"),
                        "status": data.get("status", "pending"),
                        "message": "Payment initiated successfully",
                        "transaction_id": data.get("transaction_id"),
                    }
                else:
                    logger.error(f"BANGE API error: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "status": "error",
                        "message": f"BANGE API error: {response.status_code}",
                    }

        except httpx.TimeoutException:
            logger.error(f"BANGE API timeout for payment {payment_id}")
            return {
                "success": False,
                "status": "timeout",
                "message": "BANGE API timeout",
            }
        except Exception as e:
            logger.error(f"BANGE API exception: {e}")
            return {
                "success": False,
                "status": "error",
                "message": str(e),
            }

    async def check_payment_status(
        self,
        bange_reference: str
    ) -> Dict[str, Any]:
        """
        Check payment status with BANGE

        Args:
            bange_reference: BANGE transaction reference

        Returns:
            {
                "status": str (pending, success, failed),
                "amount": Decimal,
                "updated_at": datetime
            }
        """
        if not self.api_key:
            logger.error("BANGE API key not configured")
            return {"status": "error", "message": "API key not configured"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.api_endpoint}/payments/{bange_reference}",
                    headers=headers,
                )

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "status": data.get("status"),
                        "amount": Decimal(str(data.get("amount", 0))),
                        "updated_at": data.get("updated_at"),
                    }
                else:
                    logger.error(f"BANGE status check error: {response.status_code}")
                    return {"status": "error", "message": "Failed to check status"}

        except Exception as e:
            logger.error(f"BANGE status check exception: {e}")
            return {"status": "error", "message": str(e)}

    async def cancel_payment(
        self,
        bange_reference: str
    ) -> Dict[str, Any]:
        """
        Cancel pending BANGE payment

        Args:
            bange_reference: BANGE transaction reference

        Returns:
            {"success": bool, "message": str}
        """
        if not self.api_key:
            return {"success": False, "message": "API key not configured"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_endpoint}/payments/{bange_reference}/cancel",
                    headers=headers,
                )

                if response.status_code == 200:
                    logger.info(f"BANGE payment cancelled: {bange_reference}")
                    return {"success": True, "message": "Payment cancelled"}
                else:
                    return {"success": False, "message": "Failed to cancel payment"}

        except Exception as e:
            logger.error(f"BANGE cancel exception: {e}")
            return {"success": False, "message": str(e)}
