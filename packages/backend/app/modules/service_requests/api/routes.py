"""
API Routes for Service Requests.
RESTful endpoints following FastAPI conventions.
"""
from fastapi import APIRouter, Depends, File, UploadFile, Query, Form, Path, Body
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime
import asyncpg
from loguru import logger

from ..models.service_request import (
    ServiceRequestCreate,
    ServiceRequestUpdate,
    ServiceRequestResponse,
    DocumentUploadResponse,
    ServiceRequestListResponse,
    DocumentExtractionPreview,
    DocumentValidationRequest,
    DocumentValidationResponse,
    StepExecutionRequest,
    StepExecutionResponse,
    FormDataResponse,
    CitizenSummaryResponse,
    ValidationResultResponse,
    PaymentStatusResponse,
    PaymentMethodInfo,
    PaymentMethodsResponse,
    PaymentInitiateRequest,
    PaymentInitiateResponse,
    DetailViewResponse,
    StepperPhase,
    DataSection,
    DataSectionField,
)
from ..models.form_config import FormConfigResponse
from ..models.enums import ServiceRequestStatus
from fastapi import HTTPException, status
from ..services.service_request_service import service_request_service
from app.database.connection import get_database
from app.modules.auth.middleware.auth_middleware import get_current_user
from ..services.workflow_engine import workflow_engine
from app.core.events import EventBus, EventType

router = APIRouter(prefix="/service-requests", tags=["Service Requests"])


# ═══════════════════════════════════════════════════════════════
# WORKFLOW CATALOG (Public for authenticated users)
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/workflows",
    summary="List available workflows",
    description="""
    Get list of available service request workflows.
    Returns workflows that can be started by the current user.

    Optional category filter to get workflows for specific category.
    """,
)
async def list_available_workflows(
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user=Depends(get_current_user)
) -> List[dict]:
    """Return list of available workflows for citizens"""
    if category:
        from ..models.enums import WorkflowCategory
        try:
            cat = WorkflowCategory(category)
            workflows = workflow_engine.get_workflows_by_category(cat)
            return [w.get_info() for w in workflows]
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category: {category}"
            )
    return workflow_engine.get_available_workflows()


@router.get(
    "/workflows/{workflow_code}",
    summary="Get workflow details",
    description="Get configuration details for a specific workflow",
)
async def get_workflow_details(
    workflow_code: str = Path(..., description="The workflow code"),
    current_user=Depends(get_current_user)
) -> dict:
    """Return workflow configuration details"""
    workflow = workflow_engine.get_workflow_by_string(workflow_code)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow not found: {workflow_code}"
        )
    return workflow.get_info()


# ═══════════════════════════════════════════════════════════════
# CREATE
# ═══════════════════════════════════════════════════════════════

@router.post(
    "/",
    response_model=ServiceRequestResponse,
    status_code=201,
    summary="Create a new service request",
    description="""
    Create a new service request for a fiscal workflow.

    The request will be created in DRAFT status with the list of required
    documents to upload. Use the documents endpoint to upload each document.

    **Workflow codes examples:**
    - `residencia` - Residence permit
    - `pasaporte_nuevo` - New passport
    - `carnet_funcionario` - Civil servant card
    - `certificado_conducir` - Driver's license
    """
)
async def create_service_request(
    data: ServiceRequestCreate,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    result = await service_request_service.create_request(
        db=db,
        user_id=current_user.id,
        data=data
    )

    # Publish REQUEST_SUBMITTED event
    try:
        EventBus.publish_nowait(
            EventType.REQUEST_SUBMITTED,
            {
                "request_id": str(result.id),
                "user_id": current_user.id,
                "user_email": current_user.email,
                "user_name": f"{current_user.first_name} {current_user.last_name}",
                "user_phone": getattr(current_user, 'phone_number', None),
                "preferred_language": getattr(current_user, 'preferred_language', 'es'),
                "workflow_code": data.workflow_code,
                "service_code": data.service_code,
                "timestamp": result.created_at.isoformat() if hasattr(result, 'created_at') and result.created_at else None,
            }
        )
    except Exception:
        pass  # Non-blocking

    return result


# ═══════════════════════════════════════════════════════════════
# CANCEL REQUEST
# ═══════════════════════════════════════════════════════════════

@router.post(
    "/{request_id}/cancel",
    response_model=ServiceRequestResponse,
    summary="Cancel a service request",
    description="""
    Cancel a service request.

    **Allowed from:**
    - DRAFT
    - SUBMITTED
    - DOCUMENTS_REQUIRED
    - PAYMENT_PENDING

    **Not allowed from:**
    - UNDER_REVIEW (contact support)
    - COMPLETED
    - REJECTED
    - CANCELLED
    """
)
async def cancel_request(
    request_id: UUID = Path(..., description="The service request ID"),
    reason: Optional[str] = Body(None, embed=True, description="Cancellation reason"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Cancel a service request owned by the user."""
    return await service_request_service.cancel_request(
        db=db,
        request_id=request_id,
        user_id=current_user.id,
        reason=reason
    )


# ═══════════════════════════════════════════════════════════════
# DOCUMENTS
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/{request_id}/documents",
    summary="List documents for a service request",
    description="Get all uploaded documents for a service request",
)
async def get_request_documents(
    request_id: UUID = Path(..., description="The service request ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
) -> List[dict]:
    """Return list of documents for a service request"""
    # Verify request belongs to user and get documents
    request = await service_request_service.get_request(
        db=db,
        request_id=request_id,
        user_id=current_user.id
    )
    # Documents are included in the response
    return [doc.model_dump() for doc in request.provided_documents]


@router.post(
    "/{request_id}/documents",
    response_model=DocumentUploadResponse,
    summary="Upload a document (legacy - direct upload)",
    description="""
    **LEGACY ENDPOINT** - Direct upload without user validation.

    For the recommended flow with user validation, use:
    1. `POST /{request_id}/documents/preview` - Extract and preview
    2. `POST /{request_id}/documents/validate` - Validate and finalize

    This endpoint uploads directly to Firebase without user review.
    """
)
async def upload_document(
    request_id: UUID = Path(..., description="The service request ID"),
    document_code: str = Form(..., description="The document type code"),
    file: UploadFile = File(..., description="The document file (PDF, JPG, PNG)"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    return await service_request_service.upload_document(
        db=db,
        request_id=request_id,
        user_id=current_user.id,
        document_code=document_code,
        file=file
    )


# ═══════════════════════════════════════════════════════════════
# NEW FLOW: PREVIEW + VALIDATE (Recommended)
# ═══════════════════════════════════════════════════════════════

@router.post(
    "/{request_id}/documents/preview",
    response_model=DocumentExtractionPreview,
    summary="Preview document extraction (Step 1)",
    description="""
    **STEP 1 of 2**: Upload document and extract data for user validation.

    This endpoint:
    1. Reads the document file
    2. Processes it with Gemini AI (or Tesseract fallback)
    3. Returns extracted data for user review
    4. Does **NOT** upload to Firebase Storage yet

    The user must review the extracted data and call the `/validate` endpoint
    to confirm and finalize the upload.

    **Preview expires after 30 minutes.**

    **Response includes:**
    - `preview_id` - Required for validation step
    - `extraction` - Extracted data fields
    - `confidence` - AI confidence score (0.0 - 1.0)
    - `needs_correction` - True if confidence < 70%
    - `expected_fields` - Schema fields for form generation
    """
)
async def preview_document_extraction(
    request_id: UUID = Path(..., description="The service request ID"),
    document_code: str = Form(..., description="The document type code (e.g., dip_gq, pasaporte_gq)"),
    file: UploadFile = File(..., description="The document file (PDF, JPG, PNG)"),
    existing_extractions: Optional[str] = Form(None, description="JSON string of existing document extractions from frontend cache for cross-document validation"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Extract document data and return preview for user validation"""
    # Parse existing extractions from frontend cache (for cross-document risk analysis)
    frontend_extractions = None
    if existing_extractions:
        try:
            import json
            frontend_extractions = json.loads(existing_extractions)
        except json.JSONDecodeError:
            pass  # Ignore invalid JSON, will use DB documents only

    return await service_request_service.preview_document_extraction(
        db=db,
        request_id=request_id,
        user_id=current_user.id,
        document_code=document_code,
        file=file,
        frontend_extractions=frontend_extractions
    )


@router.post(
    "/{request_id}/documents/validate",
    response_model=DocumentValidationResponse,
    summary="Validate extraction and upload (Step 2)",
    description="""
    **STEP 2 of 2**: User validates extracted data and document is uploaded.

    This endpoint:
    1. Receives user-confirmed (or corrected) extraction data
    2. Uploads the document to Firebase Storage
    3. Saves the document record with validated data
    4. Checks if all required documents are now provided

    **Required fields:**
    - `preview_id` - From the preview step response
    - `confirmed_data` - User-validated extraction data

    **Note:** Preview expires after 30 minutes. If expired, user must
    upload and preview again.
    """
)
async def validate_document(
    request_id: UUID = Path(..., description="The service request ID"),
    validation: DocumentValidationRequest = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Validate user-confirmed extraction and upload to Firebase"""
    return await service_request_service.validate_document(
        db=db,
        request_id=request_id,
        user_id=current_user.id,
        validation=validation
    )


@router.delete(
    "/{request_id}/documents/{document_code}",
    status_code=204,
    summary="Delete a document from service request",
    description="""
    Delete a specific document from a service request.

    **IMPORTANT:** Once a document is validated and uploaded to Firebase Storage,
    it CANNOT be deleted. You must re-upload a new document to replace it.

    **Requirements:**
    - Request must be in DRAFT status
    - Document must NOT be validated (not yet uploaded to storage)
    - User must own the service request

    **To replace a validated document:**
    Use the upload/preview/validate flow again with the same document_code.
    The system will automatically replace the old document (UPSERT behavior).
    """
)
async def delete_document(
    request_id: UUID = Path(..., description="The service request ID"),
    document_code: str = Path(..., description="The document code to delete (e.g., dip, pasaporte_antiguo)"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Delete a specific document from a service request (only unvalidated documents)"""
    from ..repositories.service_request_repository import service_request_repository
    from ..repositories.document_repository import document_repository

    # Verify request exists and user owns it
    request = await service_request_repository.find_by_id(db, request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service request not found: {request_id}"
        )

    if str(request["user_id"]) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Only allow deletion in DRAFT status
    if request["status"] != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete documents in status: {request['status']}"
        )

    # Find the document
    docs = await document_repository.find_by_request(db, request_id)
    target_doc = next((d for d in docs if d["document_code"] == document_code), None)

    if not target_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document not found: {document_code}"
        )

    # CRITICAL: Block deletion of validated documents
    # Once uploaded to Firebase Storage, documents can only be REPLACED, not deleted
    if target_doc.get("validated_at") or target_doc.get("is_valid"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "Cannot delete validated document",
                "message": "Ce document a déjà été validé et uploadé. Pour le modifier, veuillez télécharger un nouveau fichier qui remplacera l'ancien.",
                "suggestion": "re-upload",
                "document_code": document_code
            }
        )

    # Only delete unvalidated documents (edge case: document in DB but not validated)
    # This should rarely happen in normal flow
    if target_doc.get("file_path"):
        try:
            from app.modules.documents.services.storage_service import firebase_storage_service
            await firebase_storage_service.delete_file(target_doc["file_path"])
        except Exception as e:
            logger.warning(f"Failed to delete file from storage: {e}")

    # Delete from database
    await document_repository.delete_document(db, target_doc["id"])

    logger.info(f"Deleted unvalidated document {document_code} from request {request['reference']}")
    return None


@router.get(
    "/{request_id}/documents/{document_code}/url",
    summary="Get document download URL",
    description="""
    Get a signed download URL for a specific document.

    The URL is valid for 24 hours and can be used to view/download the document.

    **Access:**
    - Document owner (citizen who uploaded)
    - Agents with requests.view permission
    - Admins
    """
)
async def get_document_url(
    request_id: UUID = Path(..., description="The service request ID"),
    document_code: str = Path(..., description="The document code (e.g., dip, pasaporte_antiguo)"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Get signed download URL for a service request document"""
    from ..repositories.service_request_repository import service_request_repository
    from ..repositories.document_repository import document_repository
    from app.modules.documents.services.storage_service import firebase_storage_service
    from app.modules.permissions.services.permission_service import permission_service

    # Get the request
    request = await service_request_repository.find_by_id(db, request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service request not found: {request_id}"
        )

    # Check access: owner OR agent with permission
    is_owner = str(request["user_id"]) == str(current_user.id)
    has_view_permission = await permission_service.has_permission(
        str(current_user.id), "service_request.view"
    )

    if not is_owner and not has_view_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Find the document
    doc = await document_repository.find_by_code(db, request_id, document_code)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document not found: {document_code}"
        )

    # Check if document has a file path
    file_path = doc.get("file_path")
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file not yet uploaded to storage"
        )

    # Generate signed URL (24h validity)
    try:
        signed_url = await firebase_storage_service.get_signed_url(
            file_path=file_path,
            expiration_hours=24
        )

        return {
            "document_code": document_code,
            "document_name": doc.get("document_name"),
            "file_name": doc.get("file_name"),
            "mime_type": doc.get("mime_type"),
            "download_url": signed_url,
            "expires_in_hours": 24
        }
    except Exception as e:
        logger.error(f"Failed to generate signed URL for {document_code}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate download URL"
        )


# ═══════════════════════════════════════════════════════════════
# READ
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/{request_id}",
    response_model=ServiceRequestResponse,
    summary="Get service request details",
    description="""
    Get complete details of a service request including:
    - Required documents list
    - Provided documents with extraction data
    - Missing documents
    - Tariff breakdown (if calculated)
    - Status and timestamps
    """
)
async def get_service_request(
    request_id: UUID = Path(..., description="The service request ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    return await service_request_service.get_request(
        db=db,
        request_id=request_id,
        user_id=current_user.id
    )


@router.get(
    "/",
    response_model=List[ServiceRequestResponse],
    summary="List my service requests",
    description="""
    List all service requests for the current user.

    Can be filtered by status:
    - `DRAFT` - Initial state
    - `SUBMITTED` - All documents provided
    - `UNDER_REVIEW` - Being reviewed by agent
    - `PAYMENT_PENDING` - Waiting for payment
    - `COMPLETED` - Finished
    """
)
async def list_service_requests(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(20, ge=1, le=100, description="Number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    return await service_request_service.list_requests(
        db=db,
        user_id=current_user.id,
        status_filter=status,
        limit=limit,
        offset=offset
    )


# ═══════════════════════════════════════════════════════════════
# REFERENCE LOOKUP
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/by-reference/{reference}",
    response_model=ServiceRequestResponse,
    summary="Get by reference number",
    description="Look up a service request by its reference number (e.g., RES-2025-00001)"
)
async def get_by_reference(
    reference: str = Path(..., description="The reference number"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    from ..repositories.service_request_repository import service_request_repository

    request = await service_request_repository.find_by_reference(db, reference)
    if not request:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service request not found: {reference}"
        )

    if str(request["user_id"]) != str(current_user.id):
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return await service_request_service.get_request(
        db=db,
        request_id=request["id"],
        user_id=current_user.id
    )


# ═══════════════════════════════════════════════════════════════
# UPDATE / DELETE / SUBMIT / CANCEL
# ═══════════════════════════════════════════════════════════════

@router.put(
    "/{request_id}",
    response_model=ServiceRequestResponse,
    summary="Update a service request",
    description="""
    Update a service request (only allowed in DRAFT status).

    **Updatable fields:**
    - `form_data` - User-submitted form data
    - `notes` - Additional notes
    """
)
async def update_service_request(
    request_id: UUID = Path(..., description="The service request ID"),
    data: ServiceRequestUpdate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    return await service_request_service.update_request(
        db=db,
        request_id=request_id,
        user_id=current_user.id,
        form_data=data.form_data,
        notes=data.notes
    )


@router.delete(
    "/{request_id}",
    status_code=204,
    summary="Delete a service request",
    description="""
    Delete a service request (only allowed in DRAFT status).

    This action is permanent and cannot be undone.
    All associated documents will also be deleted.
    """
)
async def delete_service_request(
    request_id: UUID = Path(..., description="The service request ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    await service_request_service.delete_request(
        db=db,
        request_id=request_id,
        user_id=current_user.id
    )
    return None


@router.post(
    "/{request_id}/submit",
    response_model=ServiceRequestResponse,
    summary="Submit a service request",
    description="""
    Submit a service request for processing.

    **Requirements:**
    - All required documents must be uploaded
    - Request must be in DRAFT or DOCUMENTS_REQUIRED status

    **Effects:**
    - Calculates tariff based on workflow
    - Changes status to SUBMITTED
    - Request enters the processing queue
    """
)
async def submit_service_request(
    request_id: UUID = Path(..., description="The service request ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    return await service_request_service.submit_request(
        db=db,
        request_id=request_id,
        user_id=current_user.id
    )


@router.post(
    "/{request_id}/prepare-payment",
    response_model=ServiceRequestResponse,
    summary="Prepare service request for payment",
    description="""
    Prepare a service request for payment.

    This validates documents and calculates tariff, but does NOT change status.
    Status changes to PAYMENT_PENDING only when payment is actually initiated
    via the /payment/initiate endpoint and recorded in service_payments table.

    **Flow:** DRAFT (prepare) → DRAFT (initiate) → PAYMENT_PENDING → PAID

    **Requirements:**
    - Request must be in DRAFT status
    - All required documents must be uploaded and validated
    - Tariff will be calculated if not already done

    **Effects:**
    - Validates all documents are uploaded
    - Calculates tariff if needed
    - Status remains DRAFT (changes on payment initiation)
    """
)
async def prepare_for_payment(
    request_id: UUID = Path(..., description="The service request ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    return await service_request_service.prepare_for_payment(
        db=db,
        request_id=request_id,
        user_id=current_user.id
    )


# ═══════════════════════════════════════════════════════════════
# WORKFLOW STEPS EXECUTION
# ═══════════════════════════════════════════════════════════════

@router.post(
    "/{request_id}/step/{step_number}",
    response_model=StepExecutionResponse,
    summary="Execute a workflow step",
    description="""
    Execute a specific step in the service request workflow.

    **Step Types:**
    - `SELECTION`: Choose sub-type (NUEVO, RENOVACION, PERDIDA, etc.)
    - `DOCUMENT_UPLOAD`: Upload required documents
    - `FORM_REVIEW`: Review and confirm extracted data
    - `VALIDATION`: Cross-document validation
    - `PAYMENT`: Process payment
    - `CONFIRMATION`: Final submission

    **Usage:**
    1. Call without step_data to get step requirements
    2. Call with step_data to complete the step
    """
)
async def execute_workflow_step(
    request_id: UUID = Path(..., description="The service request ID"),
    step_number: int = Path(..., ge=1, le=10, description="The step number to execute"),
    body: StepExecutionRequest = Body(default=StepExecutionRequest()),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Execute a workflow step and return result"""
    # Load context from database
    context = await workflow_engine.load_context_from_db(db, request_id)
    if not context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service request not found: {request_id}"
        )

    # Verify ownership
    if str(context.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Execute the step
    result = await workflow_engine.execute_step(
        db=db,
        context=context,
        step_number=step_number,
        step_data=body.step_data
    )

    # Save context if step was successful
    if result.get("success", False):
        await workflow_engine.save_context_to_db(db, context)

    return StepExecutionResponse(**result)


# ═══════════════════════════════════════════════════════════════
# FORM DATA (Pre-filled from extraction)
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/{request_id}/form-data",
    response_model=FormDataResponse,
    summary="Get pre-filled form data",
    description="""
    Get form data pre-filled from document extraction.

    This endpoint applies the workflow's form_mapping to transform
    extracted document data into form fields.

    **Returns:**
    - `form_data`: Flat dict of form field -> value
    - `extracted_data`: Raw extraction by document
    - `completion_percentage`: How much of the form is filled
    - `missing_fields`: Required fields that are still empty
    """
)
async def get_form_data(
    request_id: UUID = Path(..., description="The service request ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Get pre-filled form data from document extraction"""
    try:
        # Load context
        logger.debug(f"Loading context for request {request_id}")
        context = await workflow_engine.load_context_from_db(db, request_id)
        if not context:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service request not found: {request_id}"
            )

        # Verify ownership
        if str(context.user_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Get workflow
        logger.debug(f"Getting workflow for code: {context.workflow_code}")
        workflow = workflow_engine.get_workflow(context.workflow_code)
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown workflow: {context.workflow_code}"
            )

        # Get form mapping and apply it
        form_mapping = {}
        final_form_data = {}
        try:
            extracted_data = context.extracted_data or {}
            logger.debug(f"Applying form mapping, extracted_data keys: {list(extracted_data.keys())}")
            form_mapping = workflow.get_form_mapping(context) or {}
            mapped_data = workflow_engine._apply_form_mapping(
                extracted_data,
                form_mapping
            ) or {}
            # Merge with existing form_data (preserves user edits)
            final_form_data = {**mapped_data, **(context.form_data or {})}
            logger.debug(f"Form mapping applied, {len(mapped_data)} fields mapped")
        except Exception as e:
            logger.warning(f"Error applying form mapping: {e}", exc_info=True)
            final_form_data = context.form_data or {}

        # Calculate completion
        required_fields = list(form_mapping.keys()) if form_mapping else []
        filled_fields = [f for f in required_fields if f in final_form_data and final_form_data[f]]
        missing = [f for f in required_fields if f not in final_form_data or not final_form_data[f]]
        completion = (len(filled_fields) / len(required_fields) * 100) if required_fields else 100

        # Ensure extracted_data is JSON-serializable
        extracted_data_safe = {}
        for doc_code, doc_data in (context.extracted_data or {}).items():
            if isinstance(doc_data, dict):
                extracted_data_safe[doc_code] = doc_data
            else:
                logger.warning(f"Non-dict extracted_data for {doc_code}: {type(doc_data)}")
                extracted_data_safe[doc_code] = {}

        return FormDataResponse(
            form_data=final_form_data,
            extracted_data=extracted_data_safe,
            requires_review=True,
            completion_percentage=round(completion, 1),
            missing_fields=missing
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_form_data for {request_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error loading form data: {str(e)}"
        )


# ═══════════════════════════════════════════════════════════════
# CROSS-DOCUMENT VALIDATION
# ═══════════════════════════════════════════════════════════════

@router.post(
    "/{request_id}/validate-documents",
    response_model=List[ValidationResultResponse],
    summary="Validate all documents cross-checking",
    description="""
    Run cross-document validation for a service request.

    This validates:
    - Consistency between documents (same name, dates, etc.)
    - Required fields presence
    - Business rules for the workflow

    **Returns:**
    - List of validation results with severity (error, warning, info)
    - `is_valid: false` indicates a validation failure
    """
)
async def validate_documents(
    request_id: UUID = Path(..., description="The service request ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
) -> List[ValidationResultResponse]:
    """Run cross-document validation"""
    # Load context
    context = await workflow_engine.load_context_from_db(db, request_id)
    if not context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service request not found: {request_id}"
        )

    # Verify ownership
    if str(context.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Get workflow
    workflow = workflow_engine.get_workflow(context.workflow_code)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown workflow: {context.workflow_code}"
        )

    # Run validation - both document presence AND cross-document validation
    try:
        all_results = []

        # 1. Validate document presence (required docs uploaded)
        presence_results = workflow.validate_documents(context)
        all_results.extend(presence_results)

        # 2. Validate cross-document consistency (extracted data matching)
        # _validate_cross_documents checks consistency across documents
        if hasattr(workflow, '_validate_cross_documents'):
            cross_results = workflow._validate_cross_documents(context)
            all_results.extend(cross_results)

        # Convert to response models
        response = []
        for result in all_results:
            # Handle both ValidationResult objects and dicts
            if hasattr(result, 'rule_id'):
                # ValidationResult object
                response.append(ValidationResultResponse(
                    rule_id=result.rule_id,
                    is_valid=result.is_valid,
                    severity=result.severity,
                    message_es=result.message_es or "",
                    field=result.field,
                    document_code=result.document_code,
                ))
            else:
                # Dict format (legacy)
                response.append(ValidationResultResponse(
                    rule_id=result.get("rule_id", "unknown"),
                    is_valid=result.get("is_valid", True),
                    severity=result.get("severity", "error"),
                    message_es=result.get("message_es", result.get("message", "")),
                    field=result.get("field"),
                    document_code=result.get("document_code"),
                ))

        return response
    except Exception as e:
        logger.error(f"Validation error for request {request_id}: {e}", exc_info=True)
        # Return a validation error result instead of swallowing the exception
        return [
            ValidationResultResponse(
                rule_id="validation_error",
                is_valid=False,
                severity="error",
                message_es=f"Error durante la validación: {str(e)}. Verifique que todos los documentos estén correctamente cargados.",
                field=None,
                document_code=None,
            )
        ]


# ═══════════════════════════════════════════════════════════════
# PAYMENT STATUS
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/{request_id}/payment/status",
    response_model=PaymentStatusResponse,
    summary="Check payment status",
    description="""
    Check the current payment status for a service request.

    Use this endpoint to poll for payment completion after initiating
    a Mobile Money payment.

    **Status values:**
    - `pending` - Payment not yet initiated
    - `processing` - Payment in progress
    - `completed` - Payment successful
    - `failed` - Payment failed
    """
)
async def get_payment_status(
    request_id: UUID = Path(..., description="The service request ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
) -> PaymentStatusResponse:
    """Get payment status for a service request"""
    # Get service request
    request = await service_request_service.get_request(
        db=db,
        request_id=request_id,
        user_id=current_user.id
    )

    # Check payment status from request
    payment_status = request.payment_status or "pending"
    paid = payment_status == "completed" or request.paid_at is not None

    # Get payment details if exists
    payment_id = str(request.payment_id) if request.payment_id else None
    amount = request.tariff.total_amount if request.tariff else None
    currency = request.tariff.currency if request.tariff else "XAF"

    return PaymentStatusResponse(
        status=payment_status,
        paid=paid,
        payment_id=payment_id,
        amount=amount,
        currency=currency,
        payment_method=request.form_data.get("payment_method") if request.form_data else None,
        completed_at=request.paid_at,
    )


# ═══════════════════════════════════════════════════════════════
# PAYMENT METHODS & INITIATION
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/{request_id}/payment/methods",
    response_model=PaymentMethodsResponse,
    summary="Get available payment methods",
    description="""
    Get the list of available payment methods for this service request.

    Returns all payment methods that can be used to pay for this request,
    with labels in multiple languages and processor information.
    """
)
async def get_payment_methods(
    request_id: UUID = Path(..., description="The service request ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
) -> PaymentMethodsResponse:
    """Get available payment methods for this service request"""
    from app.modules.payments.services.processors import payment_processor_registry

    # Verify request exists and belongs to user
    request = await service_request_service.get_request(
        db=db,
        request_id=request_id,
        user_id=current_user.id
    )

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service request not found: {request_id}"
        )

    # Get available methods from registry
    methods_info = payment_processor_registry.get_methods_info()

    # Convert to response models
    methods = [
        PaymentMethodInfo(
            code=m["code"],
            label_es=m["label_es"],
            label_en=m["label_en"],
            label_fr=m["label_fr"],
            processor_type=m["processor_type"],
            requires_phone=m["requires_phone"],
            requires_redirect=m["requires_redirect"],
            requires_agent_validation=m["requires_agent_validation"],
        )
        for m in methods_info
    ]

    # Default to mobile_money if available
    default_method = "mobile_money" if any(m.code == "mobile_money" for m in methods) else None

    return PaymentMethodsResponse(
        methods=methods,
        default_method=default_method
    )


@router.post(
    "/{request_id}/payment/initiate",
    response_model=PaymentInitiateResponse,
    summary="Initiate payment",
    description="""
    Initiate payment for a service request.

    **Payment Methods:**
    - `mobile_money`: MTN/Orange Mobile Money via BANGE API (requires phone_number)
    - `card`: Bank card via BANGE Gateway (returns redirect_url)
    - `bank_transfer`: Bank transfer via BANGE
    - `cash`: Cash payment (requires agent validation)
    - `check`: Check payment (requires agent validation)

    **Response:**
    - For BANGE payments: `redirect_url` to complete payment
    - For cash/check: `action_type='agent_validation'`, wait for agent confirmation
    """
)
async def initiate_payment(
    request_id: UUID = Path(..., description="The service request ID"),
    body: PaymentInitiateRequest = ...,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
) -> PaymentInitiateResponse:
    """Initiate payment for a service request"""
    from app.modules.payments.services.processors import payment_processor_registry
    from app.modules.payments.services.processors.base import PaymentContext
    from app.modules.payments.models.payment import PaymentMethod

    # === DETAILED LOGGING FOR DEBUGGING ===
    logger.info(f"[PAYMENT] === initiate_payment START ===")
    logger.info(f"[PAYMENT] request_id={request_id}, method={body.payment_method}, phone={body.phone_number}")
    logger.info(f"[PAYMENT] user_id={current_user.id}, email={current_user.email}")

    try:
        # Load context
        context = await workflow_engine.load_context_from_db(db, request_id)
        if not context:
            logger.error(f"[PAYMENT] Service request not found: {request_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service request not found: {request_id}"
            )

        logger.info(f"[PAYMENT] Context loaded: status={context.status.value}, workflow={context.workflow_code.value}")

        # Verify ownership
        if str(context.user_id) != str(current_user.id):
            logger.error(f"[PAYMENT] Access denied: context.user_id={context.user_id} != current_user.id={current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Verify request is in correct status for payment
        # Accept DRAFT (normal flow) or PAYMENT_PENDING (retry after failed payment)
        allowed_statuses = [ServiceRequestStatus.DRAFT, ServiceRequestStatus.PAYMENT_PENDING]
        if context.status not in allowed_statuses:
            logger.error(f"[PAYMENT] Wrong status: {context.status.value}, expected DRAFT or PAYMENT_PENDING")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot initiate payment in status: {context.status.value}"
            )

        # Validate payment method
        try:
            payment_method = PaymentMethod(body.payment_method)
            logger.info(f"[PAYMENT] Payment method validated: {payment_method.value}")
        except ValueError:
            logger.error(f"[PAYMENT] Invalid payment method: {body.payment_method}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid payment method: {body.payment_method}"
            )

        # Validate phone for mobile money
        if payment_method == PaymentMethod.MOBILE_MONEY and not body.phone_number:
            logger.error(f"[PAYMENT] Mobile Money requires phone number")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number is required for Mobile Money payments"
            )

        # Get tariff amount from context
        from ..services.tariff_calculator import tariff_calculator
        workflow = workflow_engine.get_workflow(context.workflow_code)
        tariff_breakdown = await tariff_calculator.calculate(db, workflow, context)
        total_amount = tariff_breakdown.get("total_amount", 0)
        logger.info(f"[PAYMENT] Tariff calculated: total_amount={total_amount}")

        if total_amount <= 0:
            logger.error(f"[PAYMENT] No payment required: total_amount={total_amount}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No payment required for this request"
            )

        # Create payment context
        from decimal import Decimal
        payment_context = PaymentContext(
            service_request_id=str(request_id),
            user_id=str(current_user.id),
            amount=Decimal(str(total_amount)),
            currency=tariff_breakdown.get("currency", "XAF"),
            payment_method=payment_method,
            tariff_breakdown=tariff_breakdown,
            user_email=current_user.email,
            user_phone=body.phone_number or current_user.phone_number,
            user_name=f"{current_user.first_name} {current_user.last_name}".strip(),
            workflow_code=context.workflow_code.value,
            service_name=workflow.service_name_es if workflow else None,
            reference_number=context.reference_number,
        )
        logger.info(f"[PAYMENT] PaymentContext created, calling processor...")

        # Initiate payment via registry
        result = await payment_processor_registry.initiate_payment(db, payment_context)
        logger.info(f"[PAYMENT] Processor result: success={result.success}, payment_id={result.payment_id}, status={result.status}")

        # Only update service_request status if payment was successfully created
        if result.success:
            # Import repository for status update
            from ..repositories.service_request_repository import service_request_repository

            # Update service_request status to PAYMENT_PENDING only after successful INSERT
            # This ensures consistency: PAYMENT_PENDING = payment record exists in DB
            if context.status == ServiceRequestStatus.DRAFT:
                await service_request_repository.update_status(
                    db=db,
                    request_id=request_id,
                    new_status=ServiceRequestStatus.PAYMENT_PENDING.value,
                    performed_by=current_user.id,
                    comment=f"Payment initiated: {result.payment_id} ({payment_method.value})"
                )
                logger.info(f"[PAYMENT] Service request status updated: DRAFT → PAYMENT_PENDING")

        response = PaymentInitiateResponse(
            success=result.success,
            payment_id=result.payment_id,
            payment_reference=result.external_reference,
            status=result.status.value if hasattr(result.status, "value") else str(result.status),
            redirect_url=result.redirect_url,
            requires_action=result.requires_action,
            action_type=result.action_type,
            message_es=result.message_es,
            expires_at=result.expires_at,
            error=result.error,
        )
        logger.info(f"[PAYMENT] === initiate_payment SUCCESS ===")
        return response

    except HTTPException:
        # Re-raise HTTP exceptions as-is (they're already logged above)
        raise
    except Exception as e:
        logger.exception(f"[PAYMENT] === UNEXPECTED ERROR === {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment initiation failed: {str(e)}"
        )


# ═══════════════════════════════════════════════════════════════
# DETAIL VIEW (Mi Solicitud dynamic page)
# ═══════════════════════════════════════════════════════════════

# Mapping request status → workflow phase type for stepper positioning
_STATUS_PHASE_MAP = {
    "DRAFT": "selection",
    "TIMBRES_PENDING": "upload",
    "TIMBRES_PAID": "upload",
    "DOCUMENTS_REQUIRED": "upload",
    "PENDING_NOTA_INGRESO": "upload",
    "NOTA_UPLOADED": "upload",
    "SUBMITTED": "confirmation",
    "UNDER_REVIEW": "confirmation",
    "DOSSIER_VALIDE": "payment",
    "PAYMENT_PENDING": "payment",
    "PAYMENT_PROCESSING": "payment",
    "PAYMENT_FAILED": "payment",
    "PAID": "confirmation",
    "CITA_SCHEDULED": "confirmation",
    "IN_PROGRESS": "confirmation",
    "COMPLETED": "confirmation",
    "REJECTED": "confirmation",
    "CANCELLED": "confirmation",
    "EXPIRED": "confirmation",
}


@router.get(
    "/{request_id}/detail-view",
    response_model=DetailViewResponse,
    summary="Get complete detail view for citizen page",
    description="""
    Single endpoint providing all data needed for the citizen 'Mi Solicitud' detail page.

    **Includes:**
    - Request core data
    - Dynamic stepper phases (from workflow definition)
    - Data sections (same as PDF, from form review configs)
    - Photo URL
    - Tariff, payment status, appointment info
    - Citizen notifications (from service_request_history, Phase 2)
    """,
)
async def get_request_detail_view(
    request_id: UUID = Path(..., description="The service request ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Get complete detail view for citizen Mi Solicitud page."""
    from ..repositories.service_request_repository import service_request_repository

    # 1. Get full request (reuse existing service)
    request = await service_request_service.get_request(
        db=db, request_id=request_id, user_id=current_user.id
    )

    # 2. Get workflow
    workflow = workflow_engine.get_workflow_by_string(request.workflow_code)
    workflow_name = workflow.service_name_es if workflow else request.workflow_code

    # 3. Build stepper phases from workflow steps
    stepper_phases: list[StepperPhase] = []
    if workflow:
        from ..workflows.workflow_interface import PredefinedWorkflow
        if isinstance(workflow, PredefinedWorkflow):
            for s in workflow.get_steps():
                stepper_phases.append(StepperPhase(
                    id=s.step_id,
                    title_es=s.title_es,
                    step_type=s.step_type.value,
                    number=s.step_number,
                    is_optional=s.is_optional,
                ))

    # 4. Calculate current phase index from status
    current_phase_index = 0
    status_str = request.status.value if hasattr(request.status, 'value') else str(request.status)

    # For DOSSIER_VALIDE, check if workflow requires appointment (appointment before payment)
    target_phase_type = _STATUS_PHASE_MAP.get(status_str, "confirmation")
    if status_str == "DOSSIER_VALIDE" and workflow and hasattr(workflow, 'requires_appointment') and workflow.requires_appointment:
        target_phase_type = "appointment"

    for i, phase in enumerate(stepper_phases):
        if phase.step_type == target_phase_type:
            current_phase_index = i
            # For confirmation/payment, take the LAST matching phase
            if target_phase_type not in ("confirmation", "payment", "appointment"):
                break

    # 5. Build data sections (reuse same logic as PDF route)
    data_sections: list[DataSection] = []
    if workflow:
        from ..workflows.workflow_interface import PredefinedWorkflow, WorkflowContext, RenovacionMotivo
        from ..models.enums import WorkflowCode

        if isinstance(workflow, PredefinedWorkflow):
            motivo = None
            motivo_value = request.form_data.get("motivo")
            if motivo_value:
                try:
                    motivo = RenovacionMotivo(motivo_value)
                except ValueError:
                    pass

            is_minor_raw = request.form_data.get("is_minor", False)
            is_minor = is_minor_raw is True or is_minor_raw == "true"

            pdf_context = WorkflowContext(
                service_request_id=request_id,
                user_id=current_user.id,
                workflow_code=WorkflowCode(request.workflow_code),
                solicitud_type=request.solicitud_type,
                sub_type=request.form_data.get("sub_type") or request.form_data.get("tipo"),
                motivo=motivo,
                is_minor=is_minor,
                form_data=request.form_data,
            )
            raw_sections = workflow.get_pdf_data_sections(pdf_context)
            for sec in raw_sections:
                data_sections.append(DataSection(
                    title=sec.get("title", ""),
                    fields=[
                        DataSectionField(label=f.get("label", ""), value=f.get("value"))
                        for f in sec.get("fields", [])
                    ]
                ))

    # 6. Get photo URL
    photo_url = None
    photo_codes = ("photo_carnet", "fotografias", "foto_carnet")
    for doc in request.provided_documents:
        if doc.document_code in photo_codes and doc.file_path:
            try:
                from app.modules.documents.services.storage_service import firebase_storage_service
                photo_url = await firebase_storage_service.get_signed_url(
                    doc.file_path, expiration_hours=1
                )
            except Exception as photo_err:
                logger.warning(f"Could not get photo URL: {photo_err}")
            break

    # 7. Build tariff dict
    tariff = None
    if request.tariff:
        tariff = {
            "base_amount": request.tariff.base_amount,
            "supplements": request.tariff.supplements,
            "supplements_total": request.tariff.supplements_total,
            "total_amount": request.tariff.total_amount,
            "currency": request.tariff.currency,
        }

    # 8. Build appointment dict
    appointment = None
    if request.cita_date:
        appointment = {
            "date": request.cita_date.strftime("%d/%m/%Y") if request.cita_date else None,
            "time": request.cita_time.strftime("%H:%M") if request.cita_time else None,
            "location": request.cita_location or request.form_data.get("appointment_location", ""),
        }

    # 9. Sub-type display
    solicitud_type_display = request.form_data.get("sub_type") or request.solicitud_type.value

    # 10. Get citizen notifications from history
    citizen_last_viewed_at = None
    try:
        row = await db.fetchrow(
            "SELECT citizen_last_viewed_at FROM service_requests WHERE id = $1",
            request_id,
        )
        if row:
            citizen_last_viewed_at = row["citizen_last_viewed_at"]
    except Exception:
        pass  # Column may not exist yet (pre-migration)

    notifications = []
    unread_count = 0
    try:
        notifications, unread_count = await service_request_repository.get_citizen_notifications(
            db, request_id, citizen_last_viewed_at
        )
    except Exception as e:
        logger.warning(f"Could not fetch citizen notifications: {e}")

    # 11. Update citizen_last_viewed_at (mark as read)
    try:
        await service_request_repository.update_citizen_last_viewed(
            db, request_id, current_user.id
        )
    except Exception:
        pass  # Column may not exist yet (pre-migration)

    return DetailViewResponse(
        request=request,
        stepper_phases=stepper_phases,
        current_phase_index=current_phase_index,
        data_sections=data_sections,
        citizen_notifications=notifications,
        unread_notification_count=unread_count,
        photo_url=photo_url,
        tariff=tariff,
        payment_status=request.payment_status,
        appointment=appointment,
        workflow_name_es=workflow_name,
        solicitud_type_display=solicitud_type_display,
    )


# ═══════════════════════════════════════════════════════════════
# CITIZEN SUMMARY (Formulaire Récapitulatif)
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/{request_id}/summary",
    response_model=CitizenSummaryResponse,
    summary="Get request summary for citizen",
    description="""
    Get a complete summary of the service request for citizen confirmation.

    This is the 'formulaire récapitulatif' shown before final submission.

    **Includes:**
    - Personal data extracted from documents
    - Documents upload status
    - Tariff breakdown
    - Validation status
    - Whether request can be submitted
    """
)
async def get_citizen_summary(
    request_id: UUID = Path(..., description="The service request ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Get complete summary for citizen confirmation"""
    # Get full request details
    request = await service_request_service.get_request(
        db=db,
        request_id=request_id,
        user_id=current_user.id
    )

    # Get workflow for name
    workflow = workflow_engine.get_workflow_by_string(request.workflow_code)
    workflow_name = workflow.service_name_es if workflow else request.workflow_code

    # Build personal data from form_data (mapped from extraction)
    personal_fields = [
        "nombres", "apellidos", "fecha_nacimiento", "lugar_nacimiento",
        "numero_dip", "sexo", "nacionalidad", "estado_civil", "profesion"
    ]
    personal_data = {k: v for k, v in request.form_data.items() if k in personal_fields}

    # Documents summary — field names must match BackendCitizenSummaryResponse
    docs_summary = []
    for doc in request.provided_documents:
        docs_summary.append({
            "document_code": doc.document_code,
            "document_name": doc.document_name or doc.document_code,
            "file_name": doc.file_path or "",
            "extraction_confidence": doc.extraction_confidence or 0,
            "is_validated": doc.is_valid,
        })

    # Check if all required documents are provided
    docs_complete = len(request.missing_documents) == 0

    # Tariff summary
    tariff_summary = None
    if request.tariff:
        tariff_summary = {
            "base_amount": request.tariff.base_amount,
            "supplements_total": request.tariff.supplements_total,
            "total_amount": request.tariff.total_amount,
            "currency": request.tariff.currency
        }

    # Check blockers
    blockers = []
    if not docs_complete:
        blockers.append(f"Faltan {len(request.missing_documents)} documentos por subir")
    if request.validations and request.validations.get("errors"):
        blockers.append("Hay errores de validacion pendientes")

    # Get sub_type from form_data
    sub_type = request.form_data.get("sub_type") or request.form_data.get("tipo")

    return CitizenSummaryResponse(
        request_id=request.id,
        reference=request.reference,
        workflow_code=request.workflow_code,
        workflow_name_es=workflow_name,
        solicitud_type=request.solicitud_type.value,
        sub_type=sub_type,
        personal_data=personal_data,
        documents_uploaded=docs_summary,
        documents_complete=docs_complete,
        tariff_summary=tariff_summary,
        validation_passed=not request.validations.get("errors") if request.validations else True,
        validation_warnings=request.validations.get("warnings", []) if request.validations else [],
        can_submit=docs_complete and len(blockers) == 0,
        blockers=blockers
    )

# ═══════════════════════════════════════════════════════════════
# CITIZEN SUMMARY PDF DOWNLOAD
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/{request_id}/summary/pdf",
    summary="Download summary PDF",
    description="""
    Download the service request summary as a PDF document.

    This is the 'formulaire récapitulatif' in PDF format for printing
    or saving.

    **Query parameters:**
    - language: Language for the PDF (es, fr, en). Default: es
    """,
    responses={
        200: {
            "description": "PDF file",
            "content": {"application/pdf": {}}
        }
    }
)
async def download_citizen_summary_pdf(
    request_id: UUID = Path(..., description="The service request ID"),
    language: str = Query("es", description="Language for PDF (es, fr, en)"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Download service request summary as PDF"""
    from fastapi.responses import Response
    from ..services.summary_pdf_service import summary_pdf_service

    # Get full request details
    request = await service_request_service.get_request(
        db=db,
        request_id=request_id,
        user_id=current_user.id
    )

    # Get workflow for name
    workflow = workflow_engine.get_workflow_by_string(request.workflow_code)
    workflow_name = workflow.service_name_es if workflow else request.workflow_code

    # Build dynamic data sections from workflow form_review configs
    # Context is built from the already-loaded request (no extra DB query)
    from ..workflows.workflow_interface import PredefinedWorkflow, WorkflowContext, RenovacionMotivo
    from ..models.enums import WorkflowCode

    data_sections = []
    if workflow and isinstance(workflow, PredefinedWorkflow):
        motivo = None
        motivo_value = request.form_data.get("motivo")
        if motivo_value:
            try:
                motivo = RenovacionMotivo(motivo_value)
            except ValueError:
                pass

        is_minor_raw = request.form_data.get("is_minor", False)
        is_minor = is_minor_raw is True or is_minor_raw == "true"

        pdf_context = WorkflowContext(
            service_request_id=request_id,
            user_id=current_user.id,
            workflow_code=WorkflowCode(request.workflow_code),
            solicitud_type=request.solicitud_type,
            sub_type=request.form_data.get("sub_type") or request.form_data.get("tipo"),
            motivo=motivo,
            is_minor=is_minor,
            form_data=request.form_data,
        )
        data_sections = workflow.get_pdf_data_sections(pdf_context)

    # Documents list
    documents = [
        {
            "name": doc.document_name or doc.document_code,
            "confidence": doc.extraction_confidence or 0,
            "validation_status": "verified" if doc.is_valid else "pending"
        }
        for doc in request.provided_documents
    ]

    # Tariff
    tariff = {
        "base_amount": request.tariff.base_amount if request.tariff else 0,
        "additional_fees": [],
        "total_amount": request.tariff.total_amount if request.tariff else 0
    }
    if request.tariff and request.tariff.supplements_total:
        tariff["additional_fees"].append({
            "name": "Suplementos",
            "amount": request.tariff.supplements_total
        })

    # Appointment (if scheduled)
    appointment = None
    if request.cita_date:
        appointment = {
            "date": request.cita_date.strftime("%d/%m/%Y") if request.cita_date else None,
            "time": request.cita_time.strftime("%H:%M") if request.cita_time else None,
            "location": request.cita_location or request.form_data.get("appointment_location", "Oficina Central")
        }

    # Get sub_type
    solicitud_type = request.form_data.get("sub_type") or request.solicitud_type.value

    # Get citizen photo URL (photo_carnet, fotografias, etc.)
    photo_url = None
    photo_codes = ("photo_carnet", "fotografias", "foto_carnet")
    for doc in request.provided_documents:
        if doc.document_code in photo_codes and doc.file_path:
            try:
                from app.modules.documents.services.storage_service import firebase_storage_service
                photo_url = await firebase_storage_service.get_signed_url(
                    doc.file_path, expiration_hours=1
                )
            except Exception as photo_err:
                logger.warning(f"Could not get photo URL: {photo_err}")
            break

    # Generate PDF
    pdf_bytes = await summary_pdf_service.generate_summary_pdf(
        request_number=request.reference,
        workflow_name=workflow_name,
        solicitud_type=solicitud_type,
        documents=documents,
        tariff=tariff,
        data_sections=data_sections,
        appointment=appointment,
        language=language,
        photo_url=photo_url,
        payment_status=request.payment_status,
    )

    # Return PDF response
    filename = f"solicitud_{request.reference}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


# ═══════════════════════════════════════════════════════════════
# DYNAMIC FORM CONFIG (Generic Wizard)
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/{request_id}/form-config/{step_id}",
    response_model=FormConfigResponse,
    summary="Get dynamic form configuration for a step",
    description="""
    Returns the form configuration for a specific workflow step.

    The configuration includes:
    - Sections filtered by conditions (solicitud_type, motivo, is_minor, etc.)
    - Fields with pre-filled values from document extraction
    - Validation rules and field metadata

    This endpoint enables the frontend to render forms dynamically
    instead of hardcoding field definitions.

    **Condition evaluation**: Sections with conditions are evaluated
    against the current request context. Only matching sections are returned.

    **Value pre-filling**: Field values are resolved using:
    1. form_data (user edits) - highest priority
    2. extracted_data (OCR results) - fallback
    """,
)
async def get_form_config(
    request_id: UUID = Path(..., description="The service request ID"),
    step_id: str = Path(..., description="The workflow step ID (e.g., 'form_review_1', 'form_review_2')"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
) -> FormConfigResponse:
    """Get dynamic form configuration with pre-filled values."""
    from ..repositories.service_request_repository import service_request_repository
    from ..services.workflow_engine import workflow_engine
    from ..models.form_config import FormConfigResponse, FormFieldResponse, FormSectionResponse

    # 1. Load request from DB
    request = await service_request_repository.find_by_id(db, request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service request not found: {request_id}"
        )

    # 2. Authorization check: owner or assigned agent
    is_owner = str(request["user_id"]) == str(current_user.id)
    is_assigned = request.get("assigned_to") and str(request["assigned_to"]) == str(current_user.id)

    if not is_owner and not is_assigned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you are not the owner or assigned agent"
        )

    # 3. Load full context (includes extracted_data, form_data, etc.)
    context = await workflow_engine.load_context_from_db(db, request_id)
    if not context:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load workflow context"
        )

    # 4. Get the workflow
    workflow = workflow_engine.get_workflow(context.workflow_code)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow not found: {context.workflow_code}"
        )

    # 5. Get form configuration (sections filtered by conditions)
    # Only PredefinedWorkflow (v2) supports dynamic form config
    if not hasattr(workflow, 'get_form_config'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Workflow {context.workflow_code} does not support dynamic form configuration"
        )
    try:
        form_config = workflow.get_form_config(step_id, context)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # 6. Get form mapping to resolve values
    form_mapping = workflow.get_form_mapping(context)

    # 7. Build response with pre-filled values
    sections_response = []
    for section in form_config.sections:
        fields_response = []
        for field in section.fields:
            # Resolve current value from form_data or extracted_data
            current_value = _resolve_field_value(
                field.key,
                form_mapping,
                context.form_data,
                context.extracted_data
            )

            fields_response.append(FormFieldResponse(
                key=field.key,
                label_es=field.label_es,
                type=field.type,
                required=field.required,
                options=field.options,
                readonly=field.readonly,
                placeholder_es=field.placeholder_es,
                validation=field.validation,
                help_text_es=field.help_text_es,
                show_when=field.show_when,
                current_value=current_value
            ))

        sections_response.append(FormSectionResponse(
            id=section.id,
            title_es=section.title_es,
            fields=fields_response,
            source_document=section.source_document,
            description_es=section.description_es
        ))

    return FormConfigResponse(
        step_id=form_config.step_id,
        title_es=form_config.title_es,
        description_es=form_config.description_es,
        sections=sections_response
    )


def _resolve_field_value(
    field_key: str,
    form_mapping: dict,
    form_data: dict,
    extracted_data: dict
) -> Optional[Any]:
    """
    Resolve a field value from form_data or extracted_data.

    Priority:
    1. form_data[field_key] - user edits (highest priority)
    2. extracted_data via form_mapping path

    Args:
        field_key: The field key (e.g., "apellidos")
        form_mapping: Mapping from field keys to extraction paths
        form_data: User-edited form data
        extracted_data: Extracted data by document code

    Returns:
        The resolved value or None
    """
    # Priority 1: Check form_data for user edits
    if field_key in form_data:
        return form_data[field_key]

    # Priority 2: Resolve from extracted_data using mapping
    extraction_path = form_mapping.get(field_key)
    if not extraction_path:
        return None

    # Parse path like "dip.titular.apellidos"
    parts = extraction_path.split(".")
    if len(parts) < 2:
        return None

    # First part is document code
    doc_code = parts[0]
    if doc_code not in extracted_data:
        return None

    # Navigate the rest of the path
    value = extracted_data[doc_code]
    for part in parts[1:]:
        if isinstance(value, dict) and part in value:
            value = value[part]
        else:
            return None

    return value

