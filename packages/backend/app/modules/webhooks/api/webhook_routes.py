"""
Webhook Routes - BANGE Callback & Reconciliation API

Endpoints pour webhooks BANGE et réconciliation transactions
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query, Request, Header
from fastapi.security import HTTPBearer
from typing import Dict, Any, Optional, List
from loguru import logger
import json

from app.modules.webhooks.models import (
    BankConfigurationCreate,
    BankConfigurationUpdate,
    BankConfigurationResponse,
    BankTransactionCreate,
    BankTransactionResponse,
    BankTransactionListResponse,
    ReconcileRequest,
    BangeWebhookPayload,
    BankCode,
)
from app.modules.webhooks.repositories import WebhookRepository
from app.modules.webhooks.services import HMACService
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import permission_required
from app.database.connection import get_database

# Import appointment service for post-payment confirmation
from app.modules.service_requests.services.appointment_service import appointment_service

router = APIRouter(tags=["Webhooks"])
security = HTTPBearer()
repository = WebhookRepository()
hmac_service = HMACService()


# ========== WEBHOOK CALLBACK (PUBLIC - NO AUTH) ==========

@router.post("/bange", status_code=status.HTTP_200_OK)
async def bange_webhook_callback(
    request: Request,
    x_bange_signature: Optional[str] = Header(None, description="BANGE HMAC signature"),
    db=Depends(get_database),
):
    """
    BANGE webhook callback endpoint (PUBLIC - no authentication)

    Headers:
        X-Bange-Signature: HMAC-SHA256 signature

    Body: BangeWebhookPayload (JSON)

    Idempotency: bank_code + bank_reference UNIQUE constraint
    """
    # Get raw body for HMAC validation
    body_bytes = await request.body()

    # Get BANGE bank configuration
    bank_config = await repository.get_bank_config_by_code(db, BankCode.BANGE.value)
    if not bank_config:
        logger.error("BANGE bank configuration not found")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Bank not configured")

    # Validate HMAC signature
    is_valid, error_msg = await hmac_service.validate_webhook(
        body_bytes,
        x_bange_signature,
        bank_config.get("webhook_secret")
    )

    if not is_valid:
        logger.warning(f"Invalid BANGE webhook signature: {error_msg}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error_msg)

    # Parse payload
    try:
        payload_dict = json.loads(body_bytes.decode('utf-8'))
        payload = BangeWebhookPayload(**payload_dict)
    except Exception as e:
        logger.error(f"Failed to parse BANGE webhook payload: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid payload: {e}")

    # Check idempotency (prevent duplicates)
    existing = await repository.get_by_bank_reference(db, BankCode.BANGE.value, payload.bank_reference)
    if existing:
        logger.info(f"BANGE webhook duplicate: {payload.bank_reference}, returning existing transaction")
        return {"message": "Transaction already processed", "transaction_id": existing["id"]}

    # Create bank transaction
    bank_transaction = BankTransactionCreate(
        bank_code=BankCode.BANGE,
        bank_reference=payload.bank_reference,
        bank_transaction_date=payload.transaction_date,
        amount=payload.amount,
        currency=payload.currency,
        account_number=payload.account_number,
        account_holder_name=payload.account_holder,
        raw_data=payload_dict,
    )

    result = await repository.create_bank_transaction(db, bank_transaction)
    transaction_id = result["id"]

    logger.info(f"BANGE webhook received: {payload.bank_reference}, transaction_id: {transaction_id}")

    # Try auto-reconciliation (match by merchant_reference)
    if payload.merchant_reference:
        try:
            # First try service_payments (service requests - passport, residence, etc.)
            service_reconciled = await reconcile_service_payment(
                db,
                payload.merchant_reference,
                payload.bank_reference
            )
            if service_reconciled:
                logger.info(f"Auto-reconciled transaction {transaction_id} with service_payment")
                return {"message": "Transaction processed and reconciled (service_payment)", "transaction_id": transaction_id}

            # Then try payments table (tax declarations)
            reconciled = await repository.auto_reconcile_by_reference(db, payload.merchant_reference)
            if reconciled:
                logger.info(f"Auto-reconciled transaction {transaction_id} with payment")

                # Confirm appointment hold if this payment is for a service_request
                if reconciled.get("payment_id"):
                    await confirm_appointment_for_payment(db, str(reconciled["payment_id"]))

                return {"message": "Transaction processed and reconciled", "transaction_id": transaction_id}
        except Exception as e:
            logger.warning(f"Auto-reconciliation failed: {e}, will require manual reconciliation")

    return {"message": "Transaction processed, awaiting reconciliation", "transaction_id": transaction_id}


# ========== BANK TRANSACTIONS (AUTHENTICATED) ==========

# ========== HELPER: Confirm appointment after payment ==========

async def confirm_appointment_for_payment(db, payment_id: str):
    """
    After successful payment reconciliation, confirm any held appointment.
    
    Flow:
    1. Find service_request with this payment_id
    2. If found, confirm the appointment hold
    """
    try:
        # Find service_request linked to this payment
        query = "SELECT id FROM service_requests WHERE payment_id = $1"
        result = await db.fetchrow(query, payment_id)
        
        if result:
            service_request_id = result["id"]
            confirm_result = await appointment_service.confirm_hold(db, service_request_id)
            if confirm_result.success:
                logger.info(f"Appointment confirmed for service_request {service_request_id} after payment {payment_id}")
            else:
                logger.warning(f"Failed to confirm appointment for service_request {service_request_id}: {confirm_result.error}")
        else:
            logger.debug(f"No service_request linked to payment {payment_id}")
    except Exception as e:
        logger.error(f"Error confirming appointment for payment {payment_id}: {e}")




async def reconcile_service_payment(db, merchant_reference: str, bange_transaction_id: str) -> bool:
    """
    Reconcile a service_payment based on merchant_reference (our payment_reference).
    Called by BANGE webhook to mark payments as completed.

    Flow:
    1. Find pending payment by reference
    2. Update status to completed
    3. Generate receipt PDF and store in Firebase
    4. Publish PAYMENT_COMPLETED event for notifications
    5. Confirm appointment if applicable
    """
    from app.modules.payments.services.receipt_service import receipt_service
    from app.core.events import EventBus, EventType
    from datetime import datetime

    try:
        # 1. Get payment with all necessary data
        query = """
            SELECT sp.id, sp.service_request_id, sp.status, sp.user_id,
                   sp.payment_method, sp.total_amount, sp.currency,
                   sp.calculation_details
            FROM service_payments sp
            WHERE sp.payment_reference = $1
            AND sp.status IN ('pending', 'processing')
        """
        payment = await db.fetchrow(query, merchant_reference)

        if not payment:
            # Fallback: check if this is a batch payment
            # Try matching by BANGE's transaction ID first, then by our merchant reference
            batch = await db.fetchrow(
                """
                SELECT id FROM batch_requests
                WHERE (bange_transaction_id = $1 OR bange_transaction_id = $2)
                AND status = 'PAYMENT_PENDING'
                """,
                bange_transaction_id,
                merchant_reference,
            )
            if batch:
                from app.modules.batch_requests.services.batch_persist_service import (
                    BatchPersistService,
                )
                await BatchPersistService.fan_out_batch_completion(
                    db=db,
                    batch_id=batch["id"],
                    paid_at=datetime.utcnow(),
                )
                logger.info(
                    f"Batch payment reconciled: batch={batch['id']}, "
                    f"bange_txn={bange_transaction_id}"
                )
                return True
            logger.debug(f"No pending service_payment found with reference {merchant_reference}")
            return False

        payment_id = str(payment["id"])
        service_request_id = payment["service_request_id"]
        user_id = payment["user_id"]

        # 2. Get user data for receipt and notifications
        user_query = """
            SELECT id, email, phone_number as phone, first_name, last_name, dni, preferred_language
            FROM users WHERE id = $1
        """
        user_data = await db.fetchrow(user_query, user_id)

        # 3. Get service request data for receipt (workflow_code, entity_code, solicitud_type)
        service_data = None
        if service_request_id:
            service_query = """
                SELECT sr.id, sr.reference, sr.workflow_code, sr.solicitud_type, sr.entity_code
                FROM service_requests sr
                WHERE sr.id = $1
            """
            service_data = await db.fetchrow(service_query, service_request_id)

        # 4. Update payment status
        paid_at = datetime.utcnow()
        update_query = """
            UPDATE service_payments
            SET status = 'completed',
                workflow_status = 'completed',
                paid_at = $2,
                bange_transaction_id = $3,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        """
        updated = await db.fetchrow(update_query, payment_id, paid_at, bange_transaction_id)

        # 5. Generate and store receipt PDF
        receipt_number = None
        receipt_url = None
        try:
            payment_data = dict(updated)
            receipt_result = await receipt_service.generate_and_store_receipt(
                db=db,
                payment_id=payment_id,
                user_id=str(user_id),
                payment_data=payment_data,
                user_data=dict(user_data) if user_data else {},
                service_data=dict(service_data) if service_data else None,
                language="es",
            )
            receipt_number = receipt_result["receipt_number"]
            receipt_url = receipt_result["receipt_url"]
            logger.info(f"BANGE payment receipt generated: {receipt_number}")
        except Exception as e:
            logger.error(f"Failed to generate receipt for BANGE payment {payment_id}: {e}")
            # Generate fallback receipt number
            year = datetime.utcnow().year
            count_query = "SELECT COUNT(*) + 1 as n FROM service_payments WHERE receipt_number IS NOT NULL AND EXTRACT(YEAR FROM paid_at) = $1"
            result = await db.fetchrow(count_query, year)
            receipt_number = f"REC-{year}-{result['n']:06d}" if result else f"REC-{year}-000001"
            await db.execute("UPDATE service_payments SET receipt_number = $1 WHERE id = $2::uuid", receipt_number, payment_id)

        # 6. Update service_request payment status + INSERT assignment outbox
        # Both must succeed atomically (outbox = guaranteed entity agent assignment)
        if service_request_id:
            await db.execute(
                "UPDATE service_requests SET payment_status = 'completed', paid_at = NOW(), updated_at = NOW() WHERE id = $1",
                service_request_id
            )
            logger.info(f"Updated service_request {service_request_id} payment_status to completed")
            await confirm_appointment_for_payment(db, payment_id)

            # INSERT into assignment outbox (guaranteed entity agent assignment)
            try:
                from app.modules.service_requests.services.assignment_outbox_service import (
                    assignment_outbox_service,
                )
                sr_data = await db.fetchrow(
                    "SELECT workflow_code, entity_code, entity_location_id "
                    "FROM service_requests WHERE id = $1",
                    service_request_id,
                )
                if sr_data and sr_data["entity_code"]:
                    await assignment_outbox_service.enqueue(
                        db=db,
                        service_request_id=service_request_id,
                        workflow_code=sr_data["workflow_code"],
                        entity_code=sr_data["entity_code"],
                        entity_location_id=sr_data["entity_location_id"],
                        payment_id=payment_id,
                        payment_method=payment["payment_method"],
                    )
                    logger.info(
                        f"Outbox item created for BANGE webhook payment {payment_id} "
                        f"(entity={sr_data['entity_code']})"
                    )
                else:
                    logger.warning(
                        f"Cannot enqueue outbox for BANGE webhook: "
                        f"SR {service_request_id} missing entity_code"
                    )
            except Exception as e:
                logger.error(
                    f"Failed to enqueue outbox for BANGE webhook payment {payment_id}: {e}",
                    exc_info=True,
                )

        # 7. Publish PAYMENT_COMPLETED event (fallback + notifications)
        try:
            paid_at = datetime.utcnow()
            await EventBus.publish(EventType.PAYMENT_COMPLETED, {
                "payment_id": payment_id,
                "user_id": str(user_id),
                "service_request_id": str(service_request_id) if service_request_id else None,
                "amount": float(payment["total_amount"]),
                "currency": payment["currency"],
                "payment_method": payment["payment_method"],
                "receipt_number": receipt_number,
                "receipt_url": receipt_url,
                "bange_transaction_id": bange_transaction_id,
                "user_email": user_data["email"] if user_data else None,
                "user_phone": user_data["phone"] if user_data else None,
                "preferred_language": user_data.get("preferred_language", "es") if user_data else "es",
                "date": paid_at.strftime("%d/%m/%Y"),
            })
            logger.info(f"PAYMENT_COMPLETED event published for BANGE payment {payment_id}")
        except Exception as e:
            logger.error(f"Failed to publish PAYMENT_COMPLETED event for BANGE payment: {e}")

        logger.info(f"Service payment {payment_id} reconciled with BANGE transaction {bange_transaction_id}")
        return True

    except Exception as e:
        logger.error(f"Error reconciling service_payment with reference {merchant_reference}: {e}")
        return False

@router.get("/transactions/unreconciled", response_model=BankTransactionListResponse)
async def list_unreconciled_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(permission_required("webhook.view"))
):
    """List unreconciled bank transactions - Requires webhook.view permission"""

    offset = (page - 1) * page_size
    transactions, total = await repository.list_unreconciled(db, page_size, offset)

    return BankTransactionListResponse(
        transactions=[BankTransactionResponse(**t) for t in transactions],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/transactions/{transaction_id}", response_model=BankTransactionResponse)
async def get_bank_transaction(
    transaction_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(permission_required("webhook.view"))
):
    """Get bank transaction by ID - Requires webhook.view permission"""

    transaction = await repository.get_transaction_by_id(db, transaction_id)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    return BankTransactionResponse(**transaction)


@router.post("/transactions/reconcile", response_model=BankTransactionResponse)
async def manual_reconcile(
    reconcile: ReconcileRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(permission_required("webhook.update"))
):
    """
    Manual reconciliation - Requires webhook.update permission

    Liens bidirectionnels:
    - bank_transactions.payment_id → payments.id
    - payments.bank_transaction_id → bank_transactions.id
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")

    try:
        result = await repository.reconcile(
            db,
            reconcile.bank_transaction_id,
            reconcile.payment_id,
            user_id
        )
        logger.info(f"Admin {user_id} reconciled transaction {reconcile.bank_transaction_id}")
        
        # Confirm appointment hold if this payment is for a service_request
        await confirm_appointment_for_payment(db, reconcile.payment_id)
        
        return BankTransactionResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Reconciliation failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ========== BANK CONFIGURATIONS (ADMIN) ==========

@router.get("/bank-configurations", response_model=List[BankConfigurationResponse])
async def list_bank_configurations(
    active_only: bool = Query(True, description="Show only active banks"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """List bank configurations"""
    configs = await repository.list_bank_configs(db, active_only)
    return [BankConfigurationResponse(**c) for c in configs]


@router.post("/bank-configurations", response_model=BankConfigurationResponse, status_code=status.HTTP_201_CREATED)
async def create_bank_configuration(
    config: BankConfigurationCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(permission_required("webhook.create"))
):
    """Create bank configuration - Requires webhook.create permission"""

    result = await repository.create_bank_config(db, config)
    admin_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")
    logger.info(f"Super admin {admin_id} created bank config {config.bank_code}")
    return BankConfigurationResponse(**result)


@router.put("/bank-configurations/{config_id}", response_model=BankConfigurationResponse)
async def update_bank_configuration(
    config_id: int,
    update_data: BankConfigurationUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(permission_required("webhook.update"))
):
    """Update bank configuration - Requires webhook.update permission"""

    updated = await repository.update_bank_config(db, config_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank configuration not found")

    admin_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")
    logger.info(f"Super admin {admin_id} updated bank config {config_id}")
    return BankConfigurationResponse(**updated)
