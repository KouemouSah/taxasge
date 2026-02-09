"""
API Routes for Wizard Sessions (Cache-First Architecture).

These endpoints manage wizard sessions entirely in Redis cache until payment.
No database writes occur until payment is initiated.

@since v2.0 - Cache-first wizard migration
@see .claude/plans/CACHE_FIRST_WIZARD_MIGRATION_PLAN.md
"""
from fastapi import APIRouter, Depends, File, UploadFile, Query, Path, Body, Request
from fastapi import HTTPException, status
from typing import Optional
from uuid import UUID
import asyncpg
from loguru import logger

from app.database.connection import get_database
from app.modules.auth.middleware.auth_middleware import get_current_user

from ..models.wizard_session import (
    WizardSessionCreate,
    WizardSessionResponse,
    WizardDocumentPreviewResponse,
    WizardDocumentConfirmRequest,
    WizardFormDataSaveRequest,
    WizardPreparePaymentResponse,
    WizardPersistResult,
)
from ..models.form_config import FormConfigResponse
from ..services.wizard_session_service import (
    wizard_session_service,
    WizardSessionError,
    WizardSessionExpiredError,
    WizardSessionNotFoundError,
    WizardDocumentValidationError,
    WizardPersistError,
)


router = APIRouter(prefix="/wizard-sessions", tags=["Wizard Sessions (Cache-First)"])


# =============================================================================
# HELPER: Extract client info for audit
# =============================================================================

def _get_client_info(request: Request) -> tuple:
    """Extract IP address and user agent from request."""
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return ip_address, user_agent


# =============================================================================
# HELPER: Handle service exceptions
# =============================================================================

def _handle_session_error(e: WizardSessionError):
    """Convert service exceptions to HTTP exceptions."""
    if isinstance(e, WizardSessionNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": e.message, "code": e.code}
        )
    elif isinstance(e, WizardSessionExpiredError):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail={"message": e.message, "code": e.code}
        )
    elif isinstance(e, WizardDocumentValidationError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code}
        )
    elif isinstance(e, WizardPersistError):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": e.message, "code": e.code, "details": e.details}
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code}
        )


# =============================================================================
# START SESSION
# =============================================================================

@router.post(
    "",
    response_model=WizardSessionResponse,
    status_code=201,
    summary="Start a new wizard session",
    description="""
    Start a new wizard session in cache.

    **Cache-First Architecture:**
    - NO database record is created
    - All data stays in Redis cache with 30-minute TTL
    - Session expires after 30 minutes of inactivity
    - Data is persisted to DB only when payment is initiated

    **Required fields:**
    - `workflow_code`: The workflow code (e.g., "PASAPORTE", "RESIDENCIA")

    **Optional fields:**
    - `solicitud_type`: expedicion (default), renovacion, or duplicado
    - `sub_type`: Workflow-specific sub-type
    - `motivo`: Reason for renovacion (VENCIMIENTO, PERDIDA, ROBO, DETERIORO)
    - `is_minor`: True if applicant is a minor
    """,
)
async def start_wizard_session(
    data: WizardSessionCreate,
    request: Request,
    current_user=Depends(get_current_user),
):
    """Start a new wizard session."""
    ip_address, user_agent = _get_client_info(request)

    try:
        result = await wizard_session_service.start_session(
            user_id=current_user.id,
            workflow_code=data.workflow_code,
            solicitud_type=data.solicitud_type,
            sub_type=data.sub_type,
            motivo=data.motivo,
            is_minor=data.is_minor,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        logger.info(
            f"[WizardAPI] Session started: {result.session_id} "
            f"for user {current_user.id}, workflow={data.workflow_code}"
        )

        return result

    except WizardSessionError as e:
        _handle_session_error(e)


# =============================================================================
# GET SESSION
# =============================================================================

@router.get(
    "/{session_id}",
    response_model=WizardSessionResponse,
    summary="Get wizard session",
    description="""
    Get the current state of a wizard session.

    Returns:
    - Session status and metadata
    - List of uploaded documents
    - Current form data
    - Tariff (if calculated)
    - Time remaining before expiration

    **Note:** Each call does NOT renew the TTL. Only actions
    (document upload, form save) renew the session.
    """,
)
async def get_wizard_session(
    session_id: str = Path(..., description="The wizard session ID"),
    current_user=Depends(get_current_user),
):
    """Get wizard session details."""
    try:
        return await wizard_session_service.get_session(
            session_id=session_id,
            user_id=current_user.id,
        )
    except WizardSessionError as e:
        _handle_session_error(e)


# =============================================================================
# PREVIEW DOCUMENT
# =============================================================================

@router.post(
    "/{session_id}/documents/preview",
    response_model=WizardDocumentPreviewResponse,
    summary="Preview document extraction",
    description="""
    Upload a document for extraction preview.

    **What happens:**
    1. File is validated (size, type)
    2. Document is extracted using Gemini AI
    3. Extraction results are stored in session cache
    4. File content (base64) is stored in session for later Firebase upload
    5. Session TTL is renewed

    **Response includes:**
    - Extracted data fields
    - Confidence score
    - Risk analysis (if applicable)
    - Cross-document validation results

    **Supported formats:** PDF, JPG, PNG, WebP
    **Max file size:** 10MB
    """,
)
async def preview_document(
    session_id: str = Path(..., description="The wizard session ID"),
    document_code: str = Query(..., description="Document code (e.g., dip, pasaporte_antiguo)"),
    file: UploadFile = File(..., description="The document file"),
    current_user=Depends(get_current_user),
):
    """Preview document extraction and store in session."""
    try:
        # Read file content
        file_content = await file.read()

        result = await wizard_session_service.preview_document(
            session_id=session_id,
            user_id=current_user.id,
            document_code=document_code,
            file_content=file_content,
            file_name=file.filename or "document",
            mime_type=file.content_type or "application/octet-stream",
        )

        logger.info(
            f"[WizardAPI] Document preview: session={session_id}, "
            f"doc={document_code}, confidence={result.confidence}"
        )

        return result

    except WizardSessionError as e:
        _handle_session_error(e)


# =============================================================================
# CONFIRM DOCUMENT
# =============================================================================

@router.post(
    "/{session_id}/documents/confirm",
    response_model=WizardSessionResponse,
    summary="Confirm document extraction",
    description="""
    Confirm document extraction data (with optional corrections).

    After previewing a document, the user can:
    - Confirm the extracted data as-is
    - Provide corrections for any fields

    **Required fields:**
    - `document_code`: The document to confirm
    - `confirmed_data`: The user-confirmed (or corrected) extraction data

    **Effect:**
    - Document is marked as confirmed in session
    - Extracted data is updated with user corrections
    - Session TTL is renewed
    """,
)
async def confirm_document(
    session_id: str = Path(..., description="The wizard session ID"),
    data: WizardDocumentConfirmRequest = Body(...),
    current_user=Depends(get_current_user),
):
    """Confirm document extraction with optional corrections."""
    try:
        result = await wizard_session_service.confirm_document(
            session_id=session_id,
            user_id=current_user.id,
            document_code=data.document_code,
            confirmed_data=data.confirmed_data,
            user_notes=data.user_notes,
        )

        logger.info(
            f"[WizardAPI] Document confirmed: session={session_id}, "
            f"doc={data.document_code}"
        )

        return result

    except WizardSessionError as e:
        _handle_session_error(e)


# =============================================================================
# DELETE DOCUMENT
# =============================================================================

@router.delete(
    "/{session_id}/documents/{document_code}",
    response_model=WizardSessionResponse,
    summary="Delete a document from wizard session",
    description="""
    Delete a specific document from the wizard session.

    **Effect:**
    - Document data (content, extraction) is removed from session
    - Extracted data for that document is cleared
    - User can re-upload a replacement document
    - Session TTL is renewed

    **Use case:** User wants to replace a document they already uploaded.
    """,
)
async def delete_wizard_document(
    session_id: str = Path(..., description="The wizard session ID"),
    document_code: str = Path(..., description="Document code to delete (e.g., dip, pasaporte_antiguo)"),
    current_user=Depends(get_current_user),
):
    """Delete a document from wizard session."""
    try:
        result = await wizard_session_service.delete_document(
            session_id=session_id,
            user_id=current_user.id,
            document_code=document_code,
        )

        logger.info(
            f"[WizardAPI] Document deleted: session={session_id}, "
            f"doc={document_code}"
        )

        return result

    except WizardSessionError as e:
        _handle_session_error(e)


# =============================================================================
# SAVE FORM DATA
# =============================================================================

@router.put(
    "/{session_id}/form-data",
    response_model=WizardSessionResponse,
    summary="Save form data",
    description="""
    Save form data to the wizard session.

    Form data is merged with existing data (user edits take precedence).
    This is called when the user edits fields in the form review step.

    **Effect:**
    - Form data is merged into session
    - Current step is updated (if provided)
    - Session TTL is renewed
    """,
)
async def save_form_data(
    session_id: str = Path(..., description="The wizard session ID"),
    data: WizardFormDataSaveRequest = Body(...),
    current_user=Depends(get_current_user),
):
    """Save form data to session."""
    try:
        result = await wizard_session_service.save_form_data(
            session_id=session_id,
            user_id=current_user.id,
            form_data=data.form_data,
            step_id=data.step_id,
        )

        logger.info(
            f"[WizardAPI] Form data saved: session={session_id}, "
            f"step={data.step_id}"
        )

        return result

    except WizardSessionError as e:
        _handle_session_error(e)


# =============================================================================
# FORM CONFIG (Dynamic form rendering)
# =============================================================================

@router.get(
    "/{session_id}/form-config/{step_id}",
    response_model=FormConfigResponse,
    summary="Get dynamic form configuration for a session step",
    description="""
    Returns the form configuration for a specific workflow step.

    The configuration includes:
    - Sections filtered by conditions (solicitud_type, motivo, is_minor, etc.)
    - Fields with pre-filled values from document extraction + form edits
    - Validation rules and field metadata

    This enables the frontend to render forms dynamically using DynamicFormRenderer.

    **Condition evaluation**: Sections with conditions are evaluated
    against the session context. Only matching sections are returned.

    **Value pre-filling**: Field values are resolved using:
    1. form_data (user edits) - highest priority
    2. extracted_data (OCR results via form_mapping) - fallback
    """,
)
async def get_session_form_config(
    session_id: str = Path(..., description="The wizard session ID"),
    step_id: str = Path(..., description="The workflow step ID (e.g., 'form_review_1')"),
    current_user=Depends(get_current_user),
) -> FormConfigResponse:
    """Get dynamic form configuration with pre-filled values for a session."""
    try:
        result = await wizard_session_service.get_form_config(
            session_id=session_id,
            user_id=current_user.id,
            step_id=step_id,
        )

        logger.info(
            f"[WizardAPI] Form config: session={session_id}, "
            f"step={step_id}, sections={len(result.sections)}"
        )

        return result

    except WizardSessionError as e:
        _handle_session_error(e)


# =============================================================================
# PREPARE FOR PAYMENT
# =============================================================================

@router.post(
    "/{session_id}/prepare-payment",
    response_model=WizardPreparePaymentResponse,
    summary="Prepare session for payment",
    description="""
    Validate session and calculate tariff for payment.

    **What happens:**
    1. Verify all required documents are uploaded
    2. Run cross-document validation
    3. Calculate tariff based on workflow and options
    4. Update session status to READY_FOR_PAYMENT (if valid)

    **Response includes:**
    - `ready_for_payment`: True if session can proceed to payment
    - `tariff`: Complete tariff breakdown
    - `errors`: Blocking validation errors
    - `warnings`: Non-blocking warnings
    - `missing_documents`: Documents still required

    **Note:** This does NOT persist to database. That happens when
    payment is initiated.
    """,
)
async def prepare_for_payment(
    session_id: str = Path(..., description="The wizard session ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Prepare session for payment."""
    try:
        result = await wizard_session_service.prepare_for_payment(
            session_id=session_id,
            user_id=current_user.id,
            db=db,
        )

        logger.info(
            f"[WizardAPI] Prepare payment: session={session_id}, "
            f"ready={result.ready_for_payment}, amount={result.total_amount}"
        )

        return result

    except WizardSessionError as e:
        _handle_session_error(e)


# =============================================================================
# PERSIST TO DB (Called by payment processor)
# =============================================================================

@router.post(
    "/{session_id}/persist",
    response_model=WizardPersistResult,
    summary="Persist session to database",
    description="""
    Persist wizard session to database (atomic transaction).

    **IMPORTANT:** This endpoint is typically called by the payment processor
    when payment is initiated, not directly by the frontend.

    **What happens (atomic):**
    1. Create service_request record in database
    2. Upload all documents to Firebase Storage
    3. Create service_request_documents records
    4. Delete session from cache

    **If any step fails:**
    - All Firebase uploads are rolled back
    - Session remains in cache
    - Error is returned

    **Response includes:**
    - `service_request_id`: The created service request ID
    - `reference`: The reference number (e.g., PAS-2026-00001)
    """,
)
async def persist_session(
    session_id: str = Path(..., description="The wizard session ID"),
    payment_id: Optional[str] = Query(None, description="Payment ID if already created"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Persist session to database."""
    try:
        result = await wizard_session_service.persist_to_db(
            session_id=session_id,
            user_id=current_user.id,
            db=db,
            payment_id=payment_id,
        )

        logger.info(
            f"[WizardAPI] Session persisted: session={session_id}, "
            f"request_id={result.service_request_id}, ref={result.reference}"
        )

        return result

    except WizardSessionError as e:
        _handle_session_error(e)


# =============================================================================
# CANCEL SESSION
# =============================================================================

@router.delete(
    "/{session_id}",
    status_code=204,
    summary="Cancel wizard session",
    description="""
    Cancel and delete a wizard session.

    **Effect:**
    - Session is deleted from cache
    - All uploaded documents (in cache) are discarded
    - No database cleanup needed (nothing was persisted)

    **Note:** This is a clean operation since no database records exist.
    """,
)
async def cancel_wizard_session(
    session_id: str = Path(..., description="The wizard session ID"),
    reason: Optional[str] = Query(None, description="Cancellation reason (for logging)"),
    current_user=Depends(get_current_user),
):
    """Cancel and delete wizard session."""
    try:
        await wizard_session_service.cancel_session(
            session_id=session_id,
            user_id=current_user.id,
            reason=reason,
        )

        logger.info(
            f"[WizardAPI] Session cancelled: session={session_id}, "
            f"reason={reason}"
        )

        return None

    except WizardSessionError as e:
        _handle_session_error(e)
