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

    # Try auto-reconciliation (match by bank_reference)
    if payload.merchant_reference:  # Our payment.bank_reference
        try:
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


@router.get("/transactions/unreconciled", response_model=BankTransactionListResponse)
async def list_unreconciled_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(permission_required("webhooks.view"))
):
    """List unreconciled bank transactions - Requires webhooks.view permission"""

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
    _: None = Depends(permission_required("webhooks.view"))
):
    """Get bank transaction by ID - Requires webhooks.view permission"""

    transaction = await repository.get_transaction_by_id(db, transaction_id)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    return BankTransactionResponse(**transaction)


@router.post("/transactions/reconcile", response_model=BankTransactionResponse)
async def manual_reconcile(
    reconcile: ReconcileRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(permission_required("webhooks.update"))
):
    """
    Manual reconciliation - Requires webhooks.update permission

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
    _: None = Depends(permission_required("webhooks.create"))
):
    """Create bank configuration - Requires webhooks.create permission"""

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
    _: None = Depends(permission_required("webhooks.update"))
):
    """Update bank configuration - Requires webhooks.update permission"""

    updated = await repository.update_bank_config(db, config_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank configuration not found")

    admin_id = current_user.id if hasattr(current_user, 'id') else current_user.get("sub")
    logger.info(f"Super admin {admin_id} updated bank config {config_id}")
    return BankConfigurationResponse(**updated)
