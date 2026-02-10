"""
Receipt Verification Routes - Public Receipt Authenticity Verification

Public endpoint to verify payment receipts using HMAC-signed tokens.
No authentication required - anyone with receipt can verify.
"""

from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from loguru import logger

from app.database.connection import get_database
from app.modules.payments.services.receipt_service import receipt_service

router = APIRouter(tags=["Receipt Verification"])


class ReceiptVerificationResponse(BaseModel):
    """Response model for receipt verification"""
    valid: bool
    receipt_number: str
    message: str
    # Only included if valid
    payment_date: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    payment_method: Optional[str] = None
    payer_name: Optional[str] = None
    workflow_code: Optional[str] = None
    entity_code: Optional[str] = None
    solicitud_type: Optional[str] = None
    service_request_reference: Optional[str] = None
    validated_by: Optional[str] = None
    validated_at: Optional[str] = None


@router.get("/{receipt_number}", response_model=ReceiptVerificationResponse)
async def verify_receipt(
    receipt_number: str,
    t: str = Query(..., description="Verification token (from QR code)")
):
    """
    Verify payment receipt authenticity (PUBLIC - no authentication)

    This endpoint validates the HMAC token in the QR code and returns
    receipt details if valid. Used for anti-fraud verification.

    Args:
        receipt_number: The receipt number (e.g., REC-2025-000001)
        t: The HMAC verification token (16 hex characters)

    Returns:
        ReceiptVerificationResponse with validity status and receipt details
    """
    async with get_database() as db:
        try:
            # 1. Look up the payment by receipt number
            query = """
                SELECT
                    sp.id, sp.receipt_number, sp.payment_reference,
                    sp.total_amount, sp.currency, sp.payment_method,
                    sp.paid_at, sp.validated_by_agent_id, sp.validated_at,
                    sp.service_request_id, sp.user_id
                FROM service_payments sp
                WHERE sp.receipt_number = $1
            """
            payment = await db.fetchrow(query, receipt_number)

            if not payment:
                logger.warning(f"Receipt verification failed: {receipt_number} not found")
                return ReceiptVerificationResponse(
                    valid=False,
                    receipt_number=receipt_number,
                    message="Recibo no encontrado / Receipt not found"
                )

            # 2. Verify the HMAC token
            paid_at = payment["paid_at"]
            amount = float(payment["total_amount"]) if payment["total_amount"] else 0

            is_valid = receipt_service.verify_receipt_token(
                receipt_number=receipt_number,
                amount=amount,
                paid_at=paid_at,
                provided_token=t
            )

            if not is_valid:
                logger.warning(f"Receipt verification failed: invalid token for {receipt_number}")
                return ReceiptVerificationResponse(
                    valid=False,
                    receipt_number=receipt_number,
                    message="Token de verificacion invalido / Invalid verification token"
                )

            # 3. Get additional data for valid receipt
            # User data
            user_query = "SELECT first_name, last_name FROM users WHERE id = $1"
            user_data = await db.fetchrow(user_query, payment["user_id"])
            payer_name = None
            if user_data:
                payer_name = f"{user_data['first_name'] or ''} {user_data['last_name'] or ''}".strip()

            # Service request data
            workflow_code = None
            entity_code = None
            solicitud_type = None
            service_request_reference = None

            if payment["service_request_id"]:
                sr_query = """
                    SELECT reference, workflow_code, entity_code, solicitud_type
                    FROM service_requests WHERE id = $1
                """
                sr_data = await db.fetchrow(sr_query, payment["service_request_id"])
                if sr_data:
                    workflow_code = sr_data["workflow_code"]
                    entity_code = sr_data["entity_code"]
                    solicitud_type = sr_data["solicitud_type"]
                    service_request_reference = sr_data["reference"]

            # Agent data (if manually validated)
            validated_by_name = None
            if payment["validated_by_agent_id"]:
                agent_query = """
                    SELECT u.first_name, u.last_name
                    FROM users u
                    JOIN agent_profiles ap ON ap.user_id = u.id
                    WHERE ap.id = $1
                """
                agent_data = await db.fetchrow(agent_query, payment["validated_by_agent_id"])
                if agent_data:
                    validated_by_name = f"{agent_data['first_name'] or ''} {agent_data['last_name'] or ''}".strip()

            # Format dates
            payment_date_str = paid_at.strftime("%d/%m/%Y %H:%M") if paid_at else None
            validated_at_str = None
            if payment["validated_at"]:
                validated_at_str = payment["validated_at"].strftime("%d/%m/%Y %H:%M")

            logger.info(f"Receipt {receipt_number} verified successfully")

            return ReceiptVerificationResponse(
                valid=True,
                receipt_number=receipt_number,
                message="Recibo valido / Valid receipt",
                payment_date=payment_date_str,
                amount=amount,
                currency=payment["currency"],
                payment_method=payment["payment_method"],
                payer_name=payer_name,
                workflow_code=workflow_code,
                entity_code=entity_code,
                solicitud_type=solicitud_type,
                service_request_reference=service_request_reference,
                validated_by=validated_by_name,
                validated_at=validated_at_str
            )

        except Exception as e:
            logger.error(f"Receipt verification error for {receipt_number}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error de verificacion / Verification error"
            )
