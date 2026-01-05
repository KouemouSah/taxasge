"""
API Routes for Service Requests.
RESTful endpoints following FastAPI conventions.
"""
from fastapi import APIRouter, Depends, File, UploadFile, Query, Form, Path, Body
from typing import List, Optional
from uuid import UUID
import asyncpg

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
)
from fastapi import HTTPException, status
from ..services.service_request_service import service_request_service
from app.database.connection import get_database
from app.modules.auth.middleware.auth_middleware import get_current_user
from ..services.workflow_engine import workflow_engine

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
        from ..workflows.base_workflow import WorkflowCategory
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
    return await service_request_service.create_request(
        db=db,
        user_id=current_user.id,
        data=data
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
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    """Extract document data and return preview for user validation"""
    return await service_request_service.preview_document_extraction(
        db=db,
        request_id=request_id,
        user_id=current_user.id,
        document_code=document_code,
        file=file
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
async def cancel_service_request(
    request_id: UUID = Path(..., description="The service request ID"),
    reason: Optional[str] = Body(None, embed=True, description="Cancellation reason"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user)
):
    return await service_request_service.cancel_request(
        db=db,
        request_id=request_id,
        user_id=current_user.id,
        reason=reason
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

    # Run validation
    try:
        validation_results = await workflow.validate_documents(context)

        # Convert to response models
        response = []
        for result in validation_results:
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
        import logging
        logging.error(f"Validation error: {e}")
        # Return empty list on error (no validation failures detected)
        return []


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

    # Documents summary
    docs_summary = []
    for doc in request.provided_documents:
        docs_summary.append({
            "code": doc.document_code,
            "name": doc.document_name,
            "status": "validated" if doc.is_valid else ("pending" if doc.extraction_status == "pending" else "uploaded")
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

    # Build personal data from form_data
    personal_data = {
        "nombres": request.form_data.get("nombres", ""),
        "apellidos": request.form_data.get("apellidos", ""),
        "fecha_nacimiento": request.form_data.get("fecha_nacimiento", ""),
        "lugar_nacimiento": request.form_data.get("lugar_nacimiento", ""),
        "numero_dip": request.form_data.get("numero_dip", ""),
        "nacionalidad": request.form_data.get("nacionalidad", ""),
        "domicilio": request.form_data.get("domicilio", ""),
        "profesion": request.form_data.get("profesion", ""),
        "estado_civil": request.form_data.get("estado_civil", ""),
    }

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
    if request.appointment_date:
        appointment = {
            "date": request.appointment_date.strftime("%d/%m/%Y") if request.appointment_date else None,
            "time": request.appointment_time.strftime("%H:%M") if request.appointment_time else None,
            "location": request.form_data.get("appointment_location", "Oficina Central")
        }

    # Get sub_type
    solicitud_type = request.form_data.get("sub_type") or request.solicitud_type.value

    # Generate PDF
    pdf_bytes = await summary_pdf_service.generate_summary_pdf(
        request_number=request.reference,
        workflow_name=workflow_name,
        solicitud_type=solicitud_type,
        personal_data=personal_data,
        documents=documents,
        tariff=tariff,
        appointment=appointment,
        language=language
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

