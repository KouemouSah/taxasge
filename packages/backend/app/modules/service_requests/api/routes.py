"""
API Routes for Service Requests.
RESTful endpoints following FastAPI conventions.
"""
from fastapi import APIRouter, Depends, File, UploadFile, Query, Form, Path
from typing import List, Optional
from uuid import UUID
import asyncpg

from ..models.service_request import (
    ServiceRequestCreate,
    ServiceRequestResponse,
    DocumentUploadResponse,
    ServiceRequestListResponse
)
from ..services.service_request_service import service_request_service
from app.database.connection import get_database
from app.modules.auth.dependencies import get_current_user

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
    summary="Upload a document",
    description="""
    Upload a document for a service request.

    The document will be processed using AI extraction:
    1. **Gemini** (primary) - Classification + extraction with 70% threshold
    2. **Tesseract** (fallback) - OCR + regex extraction with 60% threshold
    3. **Manual review** - If confidence is too low

    When all required documents are uploaded, the request status will
    automatically change to SUBMITTED.
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
