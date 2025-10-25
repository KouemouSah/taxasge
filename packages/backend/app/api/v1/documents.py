"""
📄 TaxasGE Documents API
Complete document management with OCR, extraction, and validation
Integration with Firebase Storage and advanced processing pipeline

Author: KOUEMOU SAH Jean Emac
Date: 27 septembre 2025
Version: 1.0.0
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Path, status, Request, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List, Optional, Dict, Any, Union
from uuid import UUID
import uuid
from datetime import datetime
from loguru import logger
import json
import io

from app.models.document import (
    Document, DocumentCreate, DocumentResponse, DocumentListResponse,
    DocumentSearchFilter, DocumentProcessingStats, DocumentProcessingMode,
    DocumentOCRStatus, DocumentExtractionStatus, DocumentValidationStatus,
    DocumentAccessLevel, DocumentUpdate, OCRRequest, ExtractionRequest
)
from app.models.user import UserResponse
from app.repositories.document_repository import document_repository
from app.services.firebase_storage_service import (
    firebase_storage_service, upload_document, upload_user_document,
    upload_tax_attachment, upload_app_asset, get_taxasge_folder_info
)
from app.services.ocr_service import ocr_service
from app.services.extraction_service import extraction_service
from app.api.v1.auth import require_admin, require_operator, get_current_user, get_current_user_optional

router = APIRouter(prefix="/documents", tags=["Documents"])


# ============================================================================
# INFORMATION ENDPOINT
# ============================================================================

@router.get("/", response_model=Dict[str, Any])
async def get_documents_info():
    """Get Documents API information and capabilities"""
    return {
        "message": "TaxasGE Documents API",
        "version": "1.0.0",
        "description": "Complete document management with OCR and extraction",
        "endpoints": {
            "upload": "POST /upload - Upload document with auto-processing",
            "list": "GET /list - List user documents",
            "details": "GET /{document_id} - Get document details",
            "download": "GET /{document_id}/download - Download original file",
            "process": "POST /{document_id}/process - Trigger processing pipeline",
            "ocr": "POST /{document_id}/ocr - Run OCR extraction",
            "extract": "POST /{document_id}/extract - Extract structured data",
            "validate": "POST /{document_id}/validate - Validate document data",
            "update": "PUT /{document_id} - Update document metadata",
            "delete": "DELETE /{document_id} - Delete document",
            "search": "POST /search - Advanced document search",
            "stats": "GET /stats - Processing statistics",
            "retry": "POST /{document_id}/retry - Retry failed processing"
        },
        "features": [
            "Multi-format document support (PDF, Images, Office docs)",
            "Automatic OCR processing with Tesseract/Google Vision",
            "Structured data extraction for tax documents",
            "Real-time processing status tracking",
            "Document validation and quality scoring",
            "Firebase Storage integration",
            "Automatic form field mapping",
            "GDPR-compliant retention policies",
            "Row-level security access control"
        ],
        "supported_types": [
            "passport", "nif_card", "residence_permit", "birth_certificate",
            "tax_return", "bank_statement", "invoice", "receipt", "contract"
        ],
        "storage_folders": get_taxasge_folder_info(),
        "processing_modes": [mode.value for mode in DocumentProcessingMode],
        "file_limits": {
            "max_size_mb": 50,
            "max_files_per_upload": 10,
            "supported_formats": ["PDF", "JPG", "PNG", "TIFF", "WEBP", "DOC", "DOCX"]
        }
    }


# ============================================================================
# DOCUMENT UPLOAD & CREATION
# ============================================================================

@router.post("/upload", response_model=DocumentResponse)
async def upload_document_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    document_subtype: Optional[str] = Form(None),
    processing_mode: DocumentProcessingMode = Form(DocumentProcessingMode.server_processing),
    auto_process: bool = Form(True),
    metadata: Optional[str] = Form(None),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload document with automatic processing pipeline

    Args:
        file: Document file to upload
        document_type: Type of document (passport, nif_card, etc.)
        document_subtype: Document subtype for classification
        processing_mode: How to process the document
        auto_process: Start processing immediately
        metadata: Additional metadata as JSON string
        current_user: Authenticated user

    Returns:
        DocumentResponse with processing status
    """
    try:
        # Parse metadata if provided
        parsed_metadata = {}
        if metadata:
            try:
                parsed_metadata = json.loads(metadata)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid metadata JSON format"
                )

        # Upload to Firebase Storage using appropriate folder
        if document_type in ["tax_return", "declaration", "receipt", "invoice"]:
            # Tax-related documents go to tax-attachments/
            upload_result = await upload_tax_attachment(
                file=file,
                user_id=str(current_user.id),
                attachment_type=document_type
            )
        else:
            # Personal documents go to user-documents/
            upload_result = await upload_user_document(
                file=file,
                user_id=str(current_user.id),
                document_type=document_type
            )

        # Create document record
        document_data = DocumentCreate(
            user_id=current_user.id,
            original_filename=file.filename or "unknown",
            file_path=upload_result.file_path,
            file_url=upload_result.file_url,
            file_size_bytes=upload_result.file_size,
            mime_type=upload_result.mime_type,
            file_hash=upload_result.file_hash,
            document_type=document_type,
            document_subtype=document_subtype,
            processing_mode=processing_mode,
            metadata=parsed_metadata
        )

        # Save to database
        document = await document_repository.create(document_data)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create document record"
            )

        # Start automatic processing if requested
        if auto_process:
            background_tasks.add_task(
                _process_document_pipeline,
                document.id,
                processing_mode
            )

        # Convert to response
        response = DocumentResponse(**document.dict())
        response.processing_status = _get_processing_status(document)
        response.can_retry = False

        logger.info(f"Document uploaded: {document.document_number} by user {current_user.id}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


@router.post("/bulk-upload", response_model=List[DocumentResponse])
async def bulk_upload_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    document_type: str = Form(...),
    processing_mode: DocumentProcessingMode = Form(DocumentProcessingMode.server_processing),
    auto_process: bool = Form(True),
    current_user: UserResponse = Depends(get_current_user)
):
    """Bulk upload multiple documents"""
    try:
        if len(files) > 10:  # Limit bulk uploads
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 files per bulk upload"
            )

        results = []
        for file in files:
            try:
                # Upload each file
                upload_result = await upload_document(
                    file=file,
                    user_id=str(current_user.id),
                    document_type=document_type
                )

                # Create document record
                document_data = DocumentCreate(
                    user_id=current_user.id,
                    original_filename=file.filename or "unknown",
                    file_path=upload_result.file_path,
                    file_url=upload_result.file_url,
                    file_size_bytes=upload_result.file_size,
                    mime_type=upload_result.mime_type,
                    file_hash=upload_result.file_hash,
                    document_type=document_type,
                    processing_mode=processing_mode
                )

                document = await document_repository.create(document_data)
                if document:
                    # Start processing
                    if auto_process:
                        background_tasks.add_task(
                            _process_document_pipeline,
                            document.id,
                            processing_mode
                        )

                    response = DocumentResponse(**document.dict())
                    response.processing_status = _get_processing_status(document)
                    results.append(response)

            except Exception as e:
                logger.error(f"Failed to upload {file.filename}: {e}")
                # Continue with other files

        logger.info(f"Bulk upload completed: {len(results)}/{len(files)} files uploaded")
        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk upload failed: {str(e)}"
        )


# ============================================================================
# DOCUMENT RETRIEVAL
# ============================================================================

@router.get("/list", response_model=DocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    processing_status: Optional[str] = Query(None, description="Filter by processing status"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    current_user: UserResponse = Depends(get_current_user)
):
    """List user documents with filtering and pagination"""
    try:
        # Build filter
        filter_params = DocumentSearchFilter(
            user_id=current_user.id,
            document_type=document_type,
            processing_status=processing_status,
            date_from=date_from,
            date_to=date_to,
            page=page,
            size=size
        )

        # Get documents
        documents, total = await document_repository.search(filter_params)

        # Convert to response format
        document_responses = []
        for doc in documents:
            response = DocumentResponse(**doc.dict())
            response.processing_status = _get_processing_status(doc)
            response.can_retry = _can_retry_processing(doc)
            document_responses.append(response)

        return DocumentListResponse(
            documents=document_responses,
            total=total,
            page=page,
            size=size,
            pages=((total - 1) // size) + 1 if total > 0 else 0
        )

    except Exception as e:
        logger.error(f"List documents failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve documents"
        )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID = Path(..., description="Document ID"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get document details by ID"""
    try:
        document = await document_repository.get_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Check access permissions
        if document.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Convert to response
        response = DocumentResponse(**document.dict())
        response.processing_status = _get_processing_status(document)
        response.can_retry = _can_retry_processing(document)

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get document failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve document"
        )


@router.get("/{document_id}/download")
async def download_document(
    document_id: UUID = Path(..., description="Document ID"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Download original document file"""
    try:
        document = await document_repository.get_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Check access permissions
        if document.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Get signed URL from Firebase Storage
        download_url = await firebase_storage_service.get_signed_url(
            file_path=document.file_path,
            user_id=str(current_user.id),
            expiration_hours=1
        )

        # Return redirect to signed URL
        return JSONResponse({
            "download_url": download_url,
            "filename": document.original_filename,
            "mime_type": document.mime_type,
            "expires_in": 3600  # 1 hour
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download document failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate download link"
        )


# ============================================================================
# DOCUMENT PROCESSING
# ============================================================================

@router.post("/{document_id}/process", response_model=DocumentResponse)
async def process_document(
    background_tasks: BackgroundTasks,
    document_id: UUID = Path(..., description="Document ID"),
    processing_mode: Optional[DocumentProcessingMode] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Trigger document processing pipeline"""
    try:
        document = await document_repository.get_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Check access permissions
        if document.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Use provided mode or document's current mode
        mode = processing_mode or document.processing_mode

        # Start processing pipeline
        background_tasks.add_task(
            _process_document_pipeline,
            document_id,
            mode
        )

        # Update document status
        await document_repository.update(document_id, {
            "processing_mode": mode,
            "ocr_status": DocumentOCRStatus.pending,
            "extraction_status": DocumentExtractionStatus.pending,
            "retry_count": 0
        })

        # Get updated document
        updated_document = await document_repository.get_by_id(document_id)
        response = DocumentResponse(**updated_document.dict())
        response.processing_status = _get_processing_status(updated_document)

        logger.info(f"Document processing started: {document.document_number}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Process document failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start processing"
        )


@router.post("/{document_id}/ocr", response_model=Dict[str, Any])
async def run_ocr(
    document_id: UUID = Path(..., description="Document ID"),
    provider: Optional[str] = Query("tesseract_server", description="OCR provider"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Run OCR extraction on document"""
    try:
        document = await document_repository.get_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Check access permissions
        if document.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Download file for processing
        file_content = await firebase_storage_service.download_file(
            file_path=document.file_path,
            user_id=str(current_user.id)
        )

        # Run OCR
        ocr_result = await ocr_service.extract_text(
            file_content=file_content.content,
            file_type=document.mime_type,
            provider=provider
        )

        # Update document with OCR results
        update_data = {
            "ocr_status": DocumentOCRStatus.completed if ocr_result.success else DocumentOCRStatus.failed,
            "ocr_provider": provider,
            "ocr_confidence": ocr_result.confidence,
            "extracted_text": ocr_result.text if ocr_result.success else None,
            "ocr_processing_time_ms": ocr_result.processing_time_ms,
            "processed_at": datetime.utcnow()
        }

        if not ocr_result.success:
            update_data["error_logs"] = ocr_result.errors

        await document_repository.update(document_id, update_data)

        return {
            "success": ocr_result.success,
            "text": ocr_result.text,
            "confidence": ocr_result.confidence,
            "processing_time_ms": ocr_result.processing_time_ms,
            "provider": provider,
            "errors": ocr_result.errors if not ocr_result.success else []
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OCR processing failed"
        )


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def _process_document_pipeline(document_id: UUID, processing_mode: DocumentProcessingMode):
    """Background task for complete document processing pipeline"""
    try:
        logger.info(f"Starting document processing pipeline: {document_id}")

        # Get document
        document = await document_repository.get_by_id(document_id)
        if not document:
            logger.error(f"Document not found: {document_id}")
            return

        # Step 1: OCR Processing
        await _process_ocr_step(document)

        # Step 2: Data Extraction
        await _process_extraction_step(document)

        # Step 3: Validation
        await _process_validation_step(document)

        # Step 4: Form Mapping
        await _process_form_mapping_step(document)

        logger.info(f"Document processing completed: {document.document_number}")

    except Exception as e:
        logger.error(f"Document processing pipeline failed: {e}")
        # Update document with error status
        await document_repository.update(document_id, {
            "ocr_status": DocumentOCRStatus.failed,
            "extraction_status": DocumentExtractionStatus.failed,
            "error_logs": [{"error": str(e), "timestamp": datetime.utcnow().isoformat()}]
        })


async def _process_ocr_step(document: Document):
    """Process OCR step"""
    try:
        # Update status to processing
        await document_repository.update(document.id, {
            "ocr_status": DocumentOCRStatus.processing
        })

        # Download file
        file_content = await firebase_storage_service.download_file(
            file_path=document.file_path,
            user_id=str(document.user_id)
        )

        # Determine OCR provider based on processing mode
        provider = "tesseract_server" if document.processing_mode == DocumentProcessingMode.server_processing else "tesseract_lite"

        # Run OCR
        ocr_result = await ocr_service.extract_text(
            file_content=file_content.content,
            file_type=document.mime_type,
            provider=provider
        )

        # Update document
        update_data = {
            "ocr_status": DocumentOCRStatus.completed if ocr_result.success else DocumentOCRStatus.failed,
            "ocr_provider": provider,
            "ocr_confidence": ocr_result.confidence,
            "extracted_text": ocr_result.text if ocr_result.success else None,
            "ocr_processing_time_ms": ocr_result.processing_time_ms
        }

        if not ocr_result.success:
            update_data["error_logs"] = ocr_result.errors

        await document_repository.update(document.id, update_data)

    except Exception as e:
        logger.error(f"OCR step failed: {e}")
        await document_repository.update(document.id, {
            "ocr_status": DocumentOCRStatus.failed,
            "error_logs": [{"error": f"OCR failed: {str(e)}", "timestamp": datetime.utcnow().isoformat()}]
        })


async def _process_extraction_step(document: Document):
    """Process data extraction step"""
    try:
        # Update status
        await document_repository.update(document.id, {
            "extraction_status": DocumentExtractionStatus.processing
        })

        # Get updated document with OCR results
        updated_doc = await document_repository.get_by_id(document.id)
        if not updated_doc.extracted_text:
            logger.warning(f"No OCR text available for extraction: {document.id}")
            return

        # Run extraction
        extraction_result = await extraction_service.extract_structured_data(
            text=updated_doc.extracted_text,
            document_type=document.document_type,
            document_subtype=document.document_subtype
        )

        # Update document
        update_data = {
            "extraction_status": DocumentExtractionStatus.completed if extraction_result.success else DocumentExtractionStatus.failed,
            "extracted_data": extraction_result.data if extraction_result.success else None,
            "extraction_confidence": extraction_result.confidence,
            "field_confidences": extraction_result.field_confidences
        }

        await document_repository.update(document.id, update_data)

    except Exception as e:
        logger.error(f"Extraction step failed: {e}")
        await document_repository.update(document.id, {
            "extraction_status": DocumentExtractionStatus.failed
        })


async def _process_validation_step(document: Document):
    """Process validation step"""
    try:
        # Get updated document
        updated_doc = await document_repository.get_by_id(document.id)
        if not updated_doc.extracted_data:
            return

        # Simple validation logic (can be extended)
        validation_errors = []
        validation_warnings = []

        # Check required fields based on document type
        required_fields = _get_required_fields(document.document_type)
        for field in required_fields:
            if field not in updated_doc.extracted_data:
                validation_errors.append(f"Missing required field: {field}")

        # Determine validation status
        if validation_errors:
            status = DocumentValidationStatus.invalid
        elif validation_warnings:
            status = DocumentValidationStatus.requires_review
        else:
            status = DocumentValidationStatus.valid

        # Update document
        await document_repository.update(document.id, {
            "validation_status": status,
            "validation_errors": validation_errors,
            "validation_warnings": validation_warnings
        })

    except Exception as e:
        logger.error(f"Validation step failed: {e}")


async def _process_form_mapping_step(document: Document):
    """Process form mapping step"""
    try:
        # Get updated document
        updated_doc = await document_repository.get_by_id(document.id)
        if not updated_doc.extracted_data:
            return

        # Generate form auto-fill data
        form_data = _generate_form_mapping(
            extracted_data=updated_doc.extracted_data,
            document_type=document.document_type
        )

        # Update document
        await document_repository.update(document.id, {
            "form_mapping_status": "completed",
            "form_auto_fill_data": form_data,
            "target_form_type": _get_target_form_type(document.document_type)
        })

    except Exception as e:
        logger.error(f"Form mapping step failed: {e}")


def _get_processing_status(document: Document) -> str:
    """Get human-readable processing status"""
    if document.ocr_status == DocumentOCRStatus.processing:
        return "OCR en cours"
    elif document.extraction_status == DocumentExtractionStatus.processing:
        return "Extraction en cours"
    elif document.validation_status == DocumentValidationStatus.pending:
        return "Validation en cours"
    elif document.ocr_status == DocumentOCRStatus.failed:
        return "Échec OCR"
    elif document.extraction_status == DocumentExtractionStatus.failed:
        return "Échec extraction"
    elif document.validation_status == DocumentValidationStatus.valid:
        return "Traitement terminé"
    elif document.validation_status == DocumentValidationStatus.requires_review:
        return "Révision requise"
    else:
        return "En attente"


def _can_retry_processing(document: Document) -> bool:
    """Check if document processing can be retried"""
    return (
        document.retry_count < 3 and
        (document.ocr_status == DocumentOCRStatus.failed or
         document.extraction_status == DocumentExtractionStatus.failed)
    )


def _get_required_fields(document_type: str) -> List[str]:
    """Get required fields for document type"""
    field_map = {
        "passport": ["passport_number", "full_name", "date_of_birth", "nationality"],
        "nif_card": ["nif_number", "full_name", "date_of_birth"],
        "residence_permit": ["permit_number", "full_name", "expiry_date"]
    }
    return field_map.get(document_type, [])


def _generate_form_mapping(extracted_data: Dict, document_type: str) -> Dict:
    """Generate form auto-fill mapping"""
    # Simple mapping logic - can be extended
    form_mapping = {}

    if document_type == "passport":
        form_mapping = {
            "passport_number": extracted_data.get("passport_number"),
            "first_name": extracted_data.get("first_name"),
            "last_name": extracted_data.get("last_name"),
            "date_of_birth": extracted_data.get("date_of_birth"),
            "nationality": extracted_data.get("nationality")
        }

    # Remove None values
    return {k: v for k, v in form_mapping.items() if v is not None}


def _get_target_form_type(document_type: str) -> str:
    """Get target form type for document"""
    form_map = {
        "passport": "tax_declaration",
        "nif_card": "tax_declaration",
        "residence_permit": "residence_tax_form"
    }
    return form_map.get(document_type, "general_form")


# ============================================================================
# STATISTICS & MONITORING
# ============================================================================

@router.get("/stats", response_model=DocumentProcessingStats)
async def get_processing_stats(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get document processing statistics for current user"""
    try:
        stats = await document_repository.get_user_stats(current_user.id)
        return stats

    except Exception as e:
        logger.error(f"Get stats failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )


@router.get("/stats/admin", response_model=Dict[str, Any])
async def get_admin_stats(
    current_user: UserResponse = Depends(require_admin)
):
    """Get global processing statistics (admin only)"""
    try:
        stats = await document_repository.get_global_stats()
        return stats

    except Exception as e:
        logger.error(f"Get admin stats failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )