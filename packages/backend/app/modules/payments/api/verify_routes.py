"""
Verification Routes - Public Receipt & Service Request Verification

Public endpoints to verify payment receipts (HMAC-signed) and
service request status (by reference number).
No authentication required.
"""

from fastapi import APIRouter, HTTPException, status, Query, Path
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime
from loguru import logger

from app.database.connection import db_manager
from app.modules.payments.services.receipt_service import receipt_service

router = APIRouter(tags=["Verification"])


class ReceiptVerificationResponse(BaseModel):
    """Response model for receipt verification"""
    valid: bool
    receipt_number: str
    message: str
    verification_type: Literal["receipt"] = "receipt"
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


class ServiceRequestVerificationResponse(BaseModel):
    """Response model for service request verification"""
    valid: bool
    reference: str
    message: str
    verification_type: Literal["service_request"] = "service_request"
    # Only included if valid
    workflow_name: Optional[str] = None
    solicitud_type: Optional[str] = None
    entity_code: Optional[str] = None
    status: Optional[str] = None
    status_label: Optional[str] = None
    created_at: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    appointment_location: Optional[str] = None
    payment_status: Optional[str] = None
    payment_amount: Optional[float] = None
    currency: Optional[str] = None


# ================================================================
# SERVICE REQUEST VERIFICATION (by SRV-... reference)
# ================================================================

@router.get(
    "/request/{reference}",
    response_model=ServiceRequestVerificationResponse,
    summary="Verify service request status (PUBLIC)",
)
async def verify_service_request(
    reference: str = Path(..., description="Service request reference (e.g., SRV-2026-00011)")
):
    """
    Verify service request status by reference number (PUBLIC - no authentication).

    Returns basic request information: workflow, status, appointment, payment.
    Used by QR code on citizen summary PDF.
    """
    async with db_manager.get_connection() as db:
        try:
            query = """
                SELECT
                    sr.reference, sr.workflow_code, sr.solicitud_type,
                    sr.entity_code, sr.status, sr.created_at,
                    sr.cita_date, sr.cita_time, sr.entity_location_id,
                    sr.payment_status
                FROM service_requests sr
                WHERE sr.reference = $1
            """
            request = await db.fetchrow(query, reference)

            if not request:
                return ServiceRequestVerificationResponse(
                    valid=False,
                    reference=reference,
                    message="Solicitud no encontrada / Request not found"
                )

            # Workflow display name
            workflow_labels = {
                "PASAPORTE": "Pasaporte",
                "CONDUCIR": "Permiso de Conducir",
                "CONTRATO": "Contrato ONRC",
                "RESIDENCIA": "Tarjeta de Residencia",
                "MATRICULACION": "Matriculacion de Vehiculo",
                "INSPECCION_TECNICA": "Inspeccion Tecnica (ITVE)",
                "DUPLICADO_VEHICULO": "Duplicado Vehiculo",
                "PROMOCION_ADMINISTRATIVA": "Promocion Administrativa",
                "CARNET_FUNCIONARIO": "Carnet de Funcionario",
                "VERIFICACION_FUNCIONARIO": "Verificacion de Funcionario",
                "PRORROGA_VISADO": "Prorroga de Visado",
                "VISADO_ALTERNATIVO": "Visado Alternativo",
                "PERMISO_PERMANENCIA": "Permiso de Permanencia",
                "SALIDA_VISADO_VENCIDO": "Salida con Visado Vencido",
                "PERMISO_EXTRAORDINARIO": "Permiso Extraordinario",
                "CERTIFICADO_ADMINISTRATIVO": "Certificado Administrativo",
            }
            workflow_name = workflow_labels.get(
                request["workflow_code"], request["workflow_code"]
            )

            # Status display label
            status_labels = {
                "DRAFT": "Borrador",
                "SUBMITTED": "Enviada",
                "UNDER_REVIEW": "En revision",
                "DOSSIER_VALIDE": "Dossier validado",
                "PAYMENT_PENDING": "Pago pendiente",
                "PAID": "Pagado",
                "CITA_SCHEDULED": "Cita programada",
                "IN_PROGRESS": "En proceso",
                "COMPLETED": "Completada",
                "REJECTED": "Rechazada",
                "CANCELLED": "Cancelada",
            }
            req_status = request["status"]
            status_label = status_labels.get(req_status, req_status)

            # Appointment location name
            appointment_location = None
            if request["entity_location_id"]:
                loc_query = """
                    SELECT location_name FROM entity_locations
                    WHERE id = $1
                """
                loc = await db.fetchrow(loc_query, request["entity_location_id"])
                if loc:
                    appointment_location = loc["location_name"]

            # Payment amount from service_payments
            payment_amount = None
            currency = None
            if request["payment_status"]:
                pay_query = """
                    SELECT total_amount, currency
                    FROM service_payments
                    WHERE service_request_id = (
                        SELECT id FROM service_requests WHERE reference = $1
                    )
                    ORDER BY created_at DESC LIMIT 1
                """
                pay = await db.fetchrow(pay_query, reference)
                if pay:
                    payment_amount = float(pay["total_amount"]) if pay["total_amount"] else None
                    currency = pay["currency"]

            # Format dates
            created_str = request["created_at"].strftime("%d/%m/%Y") if request["created_at"] else None
            appt_date_str = request["cita_date"].strftime("%d/%m/%Y") if request["cita_date"] else None
            appt_time_str = request["cita_time"].strftime("%H:%M") if request["cita_time"] else None

            logger.info(f"Service request {reference} verified successfully")

            return ServiceRequestVerificationResponse(
                valid=True,
                reference=reference,
                message="Solicitud verificada / Request verified",
                workflow_name=workflow_name,
                solicitud_type=request["solicitud_type"],
                entity_code=request["entity_code"],
                status=req_status,
                status_label=status_label,
                created_at=created_str,
                appointment_date=appt_date_str,
                appointment_time=appt_time_str,
                appointment_location=appointment_location,
                payment_status=request["payment_status"],
                payment_amount=payment_amount,
                currency=currency,
            )

        except Exception as e:
            logger.error(f"Service request verification error for {reference}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error de verificacion / Verification error"
            )


# ================================================================
# RECEIPT VERIFICATION (by REC-... with HMAC token)
# ================================================================

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
    async with db_manager.get_connection() as db:
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
