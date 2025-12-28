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
    DocumentValidationResponse
)
from fastapi import HTTPException, status
from ..services.service_request_service import service_request_service
from app.database.connection import get_database
from app.modules.auth.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/service-requests", tags=["Service Requests"])


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

    if request["user_id"] != current_user.id:
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
