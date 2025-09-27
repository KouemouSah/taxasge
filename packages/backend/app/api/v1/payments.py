"""
=³ TaxasGE Payments API
Complete payment processing with BANGE integration for fiscal services
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Path, status, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from uuid import UUID
from loguru import logger
from datetime import datetime

from app.models.payment import (
    Payment, PaymentCreate, PaymentResponse, PaymentListResponse,
    PaymentSearchFilter, PaymentStats, PaymentStatusEnum, PaymentMethodEnum,
    BANGEPaymentRequest, CurrencyEnum
)
from app.models.user import UserResponse
from app.repositories.payment_repository import payment_repository
from app.services.bange_service import bange_service
from app.api.v1.auth import require_admin, require_operator, get_current_user, get_current_user_optional

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/", response_model=Dict[str, Any])
async def get_payments_info():
    """Get Payments API information"""
    return {
        "message": "TaxasGE Payments API",
        "version": "1.0.0",
        "description": "Complete payment processing with BANGE integration",
        "endpoints": {
            "create": "POST /create - Create new payment",
            "list": "GET /list - List user payments",
            "details": "GET /{payment_id} - Get payment details",
            "process": "POST /{payment_id}/process - Process payment with BANGE",
            "cancel": "POST /{payment_id}/cancel - Cancel payment",
            "verify": "POST /{payment_id}/verify - Verify payment status",
            "webhook": "POST /webhook/bange - BANGE webhook handler",
            "methods": "GET /methods - Get available payment methods",
            "stats": "GET /stats - Get payment statistics (admin)",
            "search": "POST /search - Advanced payment search (admin/operator)"
        },
        "features": [
            "BANGE payment gateway integration",
            "Multiple payment methods (card, wallet, mobile money)",
            "Real-time payment verification",
            "Webhook-based status updates",
            "Payment reconciliation",
            "Comprehensive statistics and reporting",
            "Multi-currency support (XAF, EUR, USD)",
            "Secure payment processing"
        ],
        "supported_methods": [method.value for method in PaymentMethodEnum],
        "supported_currencies": [currency.value for currency in CurrencyEnum]
    }


@router.post("/create", response_model=PaymentResponse)
async def create_payment(
    payment_data: PaymentCreate,
    current_user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    """Create new payment for fiscal service or declaration"""
    try:
        # Set user ID if authenticated
        if current_user:
            payment_data.user_id = current_user.id

        # Generate unique payment reference
        payment_reference = f"PAY-{datetime.now().strftime('%Y%m%d')}-{payment_repository.generate_reference()}"

        # Create payment record
        payment = Payment(
            payment_reference=payment_reference,
            user_id=payment_data.user_id,
            payer_name=payment_data.payer_name,
            payer_email=payment_data.payer_email,
            payer_phone=payment_data.payer_phone,
            payment_type=payment_data.payment_type,
            description=payment_data.description,
            amount=payment_data.amount,
            currency=payment_data.currency,
            declaration_id=payment_data.declaration_id,
            fiscal_service_id=payment_data.fiscal_service_id,
            payment_method=payment_data.payment_method,
            callback_url=payment_data.callback_url,
            return_url=payment_data.return_url,
            metadata=payment_data.metadata
        )

        # Save payment to database
        created_payment = await payment_repository.create(payment)
        if not created_payment:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create payment"
            )

        # Convert to response format
        payment_response = PaymentResponse(**created_payment.dict())

        # Set additional response fields
        payment_response.status_display = _get_status_display(created_payment.payment_status)
        payment_response.can_retry = created_payment.payment_status in [PaymentStatusEnum.failed, PaymentStatusEnum.cancelled]

        logger.info(f"Payment created: {payment_reference} for amount {payment_data.amount} {payment_data.currency.value}")
        return payment_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating payment"
        )


@router.get("/methods", response_model=Dict[str, Any])
async def get_payment_methods():
    """Get available payment methods"""
    try:
        # Get BANGE payment methods
        bange_methods = await bange_service.get_payment_methods()

        # Get exchange rates
        exchange_rates = await bange_service.get_exchange_rates()

        return {
            "payment_methods": [
                {
                    "code": method.value,
                    "name": method.value.replace("_", " ").title(),
                    "available": True,
                    "requires_redirect": method in [PaymentMethodEnum.bange_card, PaymentMethodEnum.bange_wallet]
                }
                for method in PaymentMethodEnum
            ],
            "bange_methods": bange_methods,
            "currencies": [
                {
                    "code": currency.value,
                    "name": _get_currency_name(currency),
                    "symbol": _get_currency_symbol(currency)
                }
                for currency in CurrencyEnum
            ],
            "exchange_rates": {k: float(v) for k, v in exchange_rates.items()},
            "bange_available": await bange_service.health_check()
        }

    except Exception as e:
        logger.error(f"Error getting payment methods: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving payment methods"
        )


# Helper functions

def _get_status_display(status: PaymentStatusEnum) -> str:
    """Get human-readable status display"""
    status_displays = {
        PaymentStatusEnum.pending: "En attente",
        PaymentStatusEnum.processing: "En traitement",
        PaymentStatusEnum.completed: "Terminé",
        PaymentStatusEnum.failed: "Échec",
        PaymentStatusEnum.cancelled: "Annulé",
        PaymentStatusEnum.refunded: "Remboursé",
        PaymentStatusEnum.partially_refunded: "Partiellement remboursé"
    }
    return status_displays.get(status, status.value)


def _get_currency_name(currency: CurrencyEnum) -> str:
    """Get currency full name"""
    currency_names = {
        CurrencyEnum.XAF: "Franc CFA Central",
        CurrencyEnum.EUR: "Euro",
        CurrencyEnum.USD: "Dollar Américain"
    }
    return currency_names.get(currency, currency.value)


def _get_currency_symbol(currency: CurrencyEnum) -> str:
    """Get currency symbol"""
    currency_symbols = {
        CurrencyEnum.XAF: "FCFA",
        CurrencyEnum.EUR: "¬",
        CurrencyEnum.USD: "$"
    }
    return currency_symbols.get(currency, currency.value)