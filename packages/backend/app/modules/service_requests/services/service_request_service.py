"""
Main Service Request Service.
Orchestrates the complete workflow for service requests.

NEW FLOW (User validation before Firebase upload):
1. preview_document_extraction() - Extract data, return to user for validation
2. validate_document() - User confirms, then upload to Firebase
"""
import asyncpg
from typing import Dict, List, Optional
from uuid import UUID, uuid4
from fastapi import HTTPException, UploadFile, status
from datetime import datetime, timedelta
import logging
import base64
import hashlib

from ..repositories.service_request_repository import service_request_repository
from ..repositories.document_repository import document_repository
from ..models.service_request import (
    ServiceRequestCreate,
    ServiceRequestResponse,
    RequiredDocument,
    ProvidedDocument,
    TariffBreakdown,
    DocumentUploadResponse,
    DocumentExtractionPreview,
    DocumentValidationRequest,
    DocumentValidationResponse
)
from ..models.enums import ServiceRequestStatus
from .tariff_service import tariff_service
from .schema_loader import schema_loader
from .gemini_document_processor import gemini_document_processor

logger = logging.getLogger(__name__)

# File upload constraints
ALLOWED_MIME_TYPES = {
    "image/png", "image/jpeg", "image/jpg",
    "image/webp", "application/pdf"
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Preview expiry time (30 minutes)
PREVIEW_EXPIRY_MINUTES = 30

# In-memory cache for pending previews (in production, use Redis)
# Key: preview_id, Value: {content, metadata, extraction, expires_at}
_pending_previews: Dict[str, Dict] = {}


class ServiceRequestService:
    """
    Main orchestration service for service requests.

    Handles:
    - Creation of service requests
    - Document uploads with processing
    - Status transitions
    - Tariff calculations
    """

    # ═══════════════════════════════════════════════════════════════
    # CREATE
    # ═══════════════════════════════════════════════════════════════

    async def create_request(
        self,
        db: asyncpg.Connection,
        user_id: UUID,
        data: ServiceRequestCreate
    ) -> ServiceRequestResponse:
        """
        Create a new service request.

        Args:
            db: Database connection
            user_id: The requesting user's ID
            data: Request creation data

        Returns:
            Complete service request response
        """
        # Get required documents for workflow
        required_docs = await self._get_required_documents(db, data.workflow_code)

        if not required_docs:
            logger.warning(f"No document requirements found for workflow: {data.workflow_code}")

        # Create the request
        request = await service_request_repository.create(
            db=db,
            user_id=user_id,
            workflow_code=data.workflow_code,
            solicitud_type=data.solicitud_type.value,
            fiscal_service_id=data.fiscal_service_id,
            priority=data.priority.value,
            form_data=data.form_data
        )

        logger.info(f"Created service request: {request['reference']}")

        return await self._build_response(db, request, required_docs)

    # ═══════════════════════════════════════════════════════════════
    # DOCUMENT UPLOAD
    # ═══════════════════════════════════════════════════════════════

    async def upload_document(
        self,
        db: asyncpg.Connection,
        request_id: UUID,
        user_id: UUID,
        document_code: str,
        file: UploadFile
    ) -> DocumentUploadResponse:
        """
        Upload and process a document for a service request.

        Args:
            db: Database connection
            request_id: The service request ID
            user_id: The uploading user's ID
            document_code: Code identifying the document type
            file: The uploaded file

        Returns:
            Document upload response with extraction results
        """
        # Verify request exists and belongs to user
        request = await service_request_repository.find_by_id(db, request_id)
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service request not found"
            )

        if request["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Check status allows document upload
        allowed_statuses = [
            ServiceRequestStatus.DRAFT.value,
            ServiceRequestStatus.DOCUMENTS_REQUIRED.value
        ]
        if request["status"] not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot upload documents in status: {request['status']}"
            )

        # Validate file
        self._validate_file(file)

        # Read file content
        content = await file.read()

        # Import storage service (avoid circular import)
        try:
            from app.modules.documents.services.storage_service import storage_service
            # Upload to Firebase Storage
            file_path = await storage_service.upload_user_document(
                file_content=content,
                filename=file.filename,
                content_type=file.content_type,
                user_id=str(user_id),
                folder=f"service-requests/{request_id}"
            )
        except ImportError:
            # Fallback if storage_service not available
            logger.warning("storage_service not available, using placeholder path")
            file_path = f"service-requests/{request_id}/{file.filename}"

        # Get document name from requirements
        required_docs = await self._get_required_documents(db, request["workflow_code"])
        doc_name = document_code
        for req_doc in required_docs:
            if req_doc.document_code == document_code:
                doc_name = req_doc.document_name
                break

        # Save document record
        doc = await document_repository.add_document(
            db=db,
            service_request_id=request_id,
            document_code=document_code,
            document_name=doc_name,
            file_path=file_path,
            file_name=file.filename,
            file_size=len(content),
            mime_type=file.content_type,
            uploaded_by=user_id
        )

        # Process document (extraction)
        processing_result = await self._process_document(
            content=content,
            mime_type=file.content_type,
            document_code=document_code
        )

        # Update extraction results
        await document_repository.update_extraction(
            db=db,
            document_id=doc["id"],
            extraction_data=processing_result["extraction"],
            extraction_confidence=processing_result["confidence"],
            extraction_status=processing_result["status"]
        )

        # Log to gemini_processing_logs
        await self._log_processing(
            db=db,
            service_request_id=request_id,
            document_id=doc["id"],
            user_id=user_id,
            result=processing_result
        )

        # Check if all documents are now provided
        await self._check_completion(db, request_id, user_id)

        logger.info(
            f"Document uploaded: {document_code} for request {request['reference']} "
            f"(confidence: {processing_result['confidence']:.2%})"
        )

        return DocumentUploadResponse(
            document_id=doc["id"],
            document_code=document_code,
            extraction=processing_result["extraction"],
            confidence=processing_result["confidence"],
            processor=processing_result["processor"],
            status=processing_result["status"],
            needs_review=processing_result["status"] == "manual_review"
        )

    # ═══════════════════════════════════════════════════════════════
    # NEW FLOW: PREVIEW + VALIDATE
    # ═══════════════════════════════════════════════════════════════

    async def preview_document_extraction(
        self,
        db: asyncpg.Connection,
        request_id: UUID,
        user_id: UUID,
        document_code: str,
        file: UploadFile
    ) -> DocumentExtractionPreview:
        """
        STEP 1: Extract document data WITHOUT uploading to Firebase.

        The file content is stored temporarily in memory.
        User must call validate_document() to confirm and finalize upload.

        Args:
            db: Database connection
            request_id: The service request ID
            user_id: The user ID
            document_code: Document type code
            file: The uploaded file

        Returns:
            DocumentExtractionPreview with extracted data for user validation
        """
        # Verify request exists and belongs to user
        request = await service_request_repository.find_by_id(db, request_id)
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service request not found"
            )

        if request["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Check status allows document upload
        allowed_statuses = [
            ServiceRequestStatus.DRAFT.value,
            ServiceRequestStatus.DOCUMENTS_REQUIRED.value
        ]
        if request["status"] not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot upload documents in status: {request['status']}"
            )

        # Validate file
        self._validate_file(file)

        # Read file content
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
            )

        # Get document name from requirements
        required_docs = await self._get_required_documents(db, request["workflow_code"])
        doc_name = document_code
        for req_doc in required_docs:
            if req_doc.document_code == document_code:
                doc_name = req_doc.document_name
                break

        # Process document with Gemini/Tesseract (NO Firebase upload yet)
        processing_result = await self._process_document(
            content=content,
            mime_type=file.content_type,
            document_code=document_code
        )

        # Generate preview ID (unique for this extraction session)
        preview_id = f"prev_{hashlib.sha256(f'{request_id}{document_code}{datetime.utcnow().isoformat()}'.encode()).hexdigest()[:16]}"

        # Calculate expiry time
        expires_at = datetime.utcnow() + timedelta(minutes=PREVIEW_EXPIRY_MINUTES)

        # Store in temporary cache (content as base64 for serialization)
        _pending_previews[preview_id] = {
            "request_id": str(request_id),
            "user_id": str(user_id),
            "document_code": document_code,
            "document_name": doc_name,
            "file_name": file.filename,
            "file_size": len(content),
            "mime_type": file.content_type,
            "content_b64": base64.b64encode(content).decode("utf-8"),
            "extraction": processing_result["extraction"],
            "confidence": processing_result["confidence"],
            "processor": processing_result["processor"],
            "expires_at": expires_at.isoformat()
        }

        # Clean up expired previews
        self._cleanup_expired_previews()

        # Get expected fields from schema for frontend form
        expected_fields = self._get_expected_fields(document_code)

        # Determine if user needs to review
        needs_correction = processing_result["confidence"] < 0.7

        logger.info(
            f"Document preview created: {document_code} for request {request['reference']} "
            f"(preview_id: {preview_id}, confidence: {processing_result['confidence']:.2%})"
        )

        return DocumentExtractionPreview(
            preview_id=preview_id,
            document_code=document_code,
            document_name=doc_name,
            file_name=file.filename,
            file_size=len(content),
            mime_type=file.content_type,
            extraction=processing_result["extraction"],
            confidence=processing_result["confidence"],
            processor=processing_result["processor"],
            extraction_status="pending_validation",
            needs_correction=needs_correction,
            expected_fields=expected_fields,
            expires_at=expires_at
        )

    async def validate_document(
        self,
        db: asyncpg.Connection,
        request_id: UUID,
        user_id: UUID,
        validation: DocumentValidationRequest
    ) -> DocumentValidationResponse:
        """
        STEP 2: User validates extraction and document is uploaded to Firebase.

        Args:
            db: Database connection
            request_id: The service request ID
            user_id: The user ID
            validation: User's validation with confirmed/corrected data

        Returns:
            DocumentValidationResponse with final document info
        """
        # Get preview from cache
        preview = _pending_previews.get(validation.preview_id)
        if not preview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preview not found or expired. Please upload the document again."
            )

        # Verify preview belongs to this request and user
        if preview["request_id"] != str(request_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Preview does not match this request"
            )
        if preview["user_id"] != str(user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Check if preview has expired
        expires_at = datetime.fromisoformat(preview["expires_at"])
        if datetime.utcnow() > expires_at:
            del _pending_previews[validation.preview_id]
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Preview has expired. Please upload the document again."
            )

        # Verify request still exists and is in valid state
        request = await service_request_repository.find_by_id(db, request_id)
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service request not found"
            )

        allowed_statuses = [
            ServiceRequestStatus.DRAFT.value,
            ServiceRequestStatus.DOCUMENTS_REQUIRED.value
        ]
        if request["status"] not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot upload documents in status: {request['status']}"
            )

        # Decode file content
        content = base64.b64decode(preview["content_b64"])

        # NOW upload to Firebase Storage
        try:
            from app.modules.documents.services.storage_service import storage_service
            file_path = await storage_service.upload_user_document(
                file_content=content,
                filename=preview["file_name"],
                content_type=preview["mime_type"],
                user_id=str(user_id),
                folder=f"service-requests/{request_id}"
            )
        except ImportError:
            logger.warning("storage_service not available, using placeholder path")
            file_path = f"service-requests/{request_id}/{preview['file_name']}"

        # Save document record with USER-VALIDATED extraction data
        doc = await document_repository.add_document(
            db=db,
            service_request_id=request_id,
            document_code=preview["document_code"],
            document_name=preview["document_name"],
            file_path=file_path,
            file_name=preview["file_name"],
            file_size=preview["file_size"],
            mime_type=preview["mime_type"],
            uploaded_by=user_id
        )

        # Update with user-validated extraction data
        validated_at = datetime.utcnow()
        await document_repository.update_extraction(
            db=db,
            document_id=doc["id"],
            extraction_data=validation.confirmed_data,  # User's confirmed data!
            extraction_confidence=preview["confidence"],
            extraction_status="validated"
        )

        # Mark document as validated by user
        await document_repository.validate_document(
            db=db,
            document_id=doc["id"],
            is_valid=True,
            validation_errors=[],
            validated_by=user_id
        )

        # Log to gemini_processing_logs
        await self._log_processing(
            db=db,
            service_request_id=request_id,
            document_id=doc["id"],
            user_id=user_id,
            result={
                "processor": preview["processor"],
                "confidence": preview["confidence"],
                "extraction": validation.confirmed_data,
                "document_type": preview["document_code"],
                "user_validated": True
            }
        )

        # Remove preview from cache
        del _pending_previews[validation.preview_id]

        # Check if all documents are now provided
        await self._check_completion(db, request_id, user_id)

        logger.info(
            f"Document validated and uploaded: {preview['document_code']} "
            f"for request {request['reference']}"
        )

        return DocumentValidationResponse(
            document_id=doc["id"],
            document_code=preview["document_code"],
            document_name=preview["document_name"],
            file_path=file_path,
            extraction_data=validation.confirmed_data,
            extraction_confidence=preview["confidence"],
            is_validated=True,
            validated_at=validated_at
        )

    def _cleanup_expired_previews(self) -> None:
        """Remove expired previews from cache"""
        now = datetime.utcnow()
        expired_ids = [
            pid for pid, data in _pending_previews.items()
            if datetime.fromisoformat(data["expires_at"]) < now
        ]
        for pid in expired_ids:
            del _pending_previews[pid]
            logger.debug(f"Cleaned up expired preview: {pid}")

    def _get_expected_fields(self, document_code: str) -> List[Dict]:
        """Get expected fields from schema for frontend form generation"""
        schema = schema_loader.get_schema_for_document(document_code)
        if not schema:
            return []

        fields = []
        for bloc_name, bloc in schema.get("blocs", {}).items():
            for field_name, config in bloc.get("fields", {}).items():
                fields.append({
                    "field_name": field_name,
                    "label": config.get("label", field_name),
                    "type": config.get("type", "text"),
                    "required": config.get("required", False),
                    "bloc": bloc_name,
                    "hint": config.get("gemini_hint", "")
                })
        return fields

    # ═══════════════════════════════════════════════════════════════
    # GET / LIST
    # ═══════════════════════════════════════════════════════════════

    async def get_request(
        self,
        db: asyncpg.Connection,
        request_id: UUID,
        user_id: UUID
    ) -> ServiceRequestResponse:
        """Get a service request by ID"""
        request = await service_request_repository.find_by_id(db, request_id)
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service request not found"
            )

        if request["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        required_docs = await self._get_required_documents(db, request["workflow_code"])
        return await self._build_response(db, request, required_docs)

    async def list_requests(
        self,
        db: asyncpg.Connection,
        user_id: UUID,
        status_filter: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[ServiceRequestResponse]:
        """List service requests for a user"""
        requests = await service_request_repository.find_by_user(
            db=db,
            user_id=user_id,
            status=status_filter,
            limit=limit,
            offset=offset
        )

        results = []
        for req in requests:
            required_docs = await self._get_required_documents(db, req["workflow_code"])
            results.append(await self._build_response(db, req, required_docs))

        return results

    # ═══════════════════════════════════════════════════════════════
    # PRIVATE HELPERS
    # ═══════════════════════════════════════════════════════════════

    def _validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file"""
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Accepted: {', '.join(ALLOWED_MIME_TYPES)}"
            )

    async def _get_required_documents(
        self,
        db: asyncpg.Connection,
        workflow_code: str
    ) -> List[RequiredDocument]:
        """Get required documents from workflow_document_requirements table"""
        query = """
            SELECT document_code, document_name, is_required, display_order,
                   accepted_formats, max_size_mb
            FROM workflow_document_requirements
            WHERE workflow_code = $1 AND is_active = TRUE
            ORDER BY display_order
        """
        rows = await db.fetch(query, workflow_code)

        return [
            RequiredDocument(
                document_code=row["document_code"],
                document_name=row["document_name"],
                is_required=row["is_required"],
                display_order=row["display_order"],
                accepted_formats=row["accepted_formats"] or ["pdf", "jpg", "png"],
                max_size_mb=row["max_size_mb"] or 10
            )
            for row in rows
        ]

    async def _process_document(
        self,
        content: bytes,
        mime_type: str,
        document_code: str
    ) -> Dict:
        """
        Process document for extraction using Gemini + Tesseract fallback.

        Pipeline:
        1. Gemini AI (primary) - 70% confidence threshold
        2. Tesseract OCR (fallback) - 60% confidence threshold
        3. Manual review if both fail

        Args:
            content: Document file bytes
            mime_type: MIME type (image/*, application/pdf)
            document_code: Expected document type code

        Returns:
            Dict with extraction, confidence, processor, status
        """
        try:
            # Use the production Gemini document processor
            result = await gemini_document_processor.process(
                content=content,
                mime_type=mime_type,
                document_code=document_code
            )

            logger.info(
                f"Document processed: {document_code} | "
                f"Processor: {result['processor']} | "
                f"Confidence: {result['confidence']:.2%} | "
                f"Status: {result['status']}"
            )

            return result

        except Exception as e:
            logger.error(f"Document processing failed: {e}")
            return {
                "extraction": {},
                "confidence": 0.0,
                "processor": "error",
                "status": "error",
                "document_type": document_code,
                "has_error": True,
                "error_message": str(e)
            }

    async def _log_processing(
        self,
        db: asyncpg.Connection,
        service_request_id: UUID,
        document_id: UUID,
        user_id: UUID,
        result: Dict
    ) -> None:
        """Log to gemini_processing_logs table"""
        try:
            await db.execute(
                """INSERT INTO gemini_processing_logs (
                    service_request_id, document_id, user_id,
                    processor, document_type_detected,
                    classification_confidence, extraction_result,
                    processing_time_ms, has_error
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
                service_request_id,
                document_id,
                user_id,
                result.get("processor", "pending"),
                result.get("document_type"),
                result.get("confidence", 0.0),
                result.get("extraction", {}),
                result.get("processing_time_ms", 0),
                result.get("has_error", False)
            )
        except Exception as e:
            logger.error(f"Failed to log processing: {e}")

    async def _check_completion(
        self,
        db: asyncpg.Connection,
        request_id: UUID,
        user_id: UUID
    ) -> None:
        """Check if all required documents are provided and update status"""
        request = await service_request_repository.find_by_id(db, request_id)
        required = await self._get_required_documents(db, request["workflow_code"])
        provided = await document_repository.find_by_request(db, request_id)

        required_codes = {d.document_code for d in required if d.is_required}
        provided_codes = {d["document_code"] for d in provided}

        if required_codes <= provided_codes:
            # All required documents provided - calculate tariff
            tariff = await tariff_service.calculate(
                db=db,
                workflow_code=request["workflow_code"],
                solicitud_type=request["solicitud_type"]
            )

            await service_request_repository.update_amounts(
                db=db,
                request_id=request_id,
                base_amount=tariff["base_amount"],
                supplements_amount=tariff["supplements_total"],
                penalties_amount=tariff["penalties_amount"],
                total_amount=tariff["total_amount"]
            )

            # Update status to SUBMITTED
            await service_request_repository.update_status(
                db=db,
                request_id=request_id,
                new_status=ServiceRequestStatus.SUBMITTED.value,
                performed_by=user_id,
                comment="All required documents provided"
            )

            logger.info(f"Request {request['reference']} completed documents, status -> SUBMITTED")

    async def _build_response(
        self,
        db: asyncpg.Connection,
        request: Dict,
        required_docs: List[RequiredDocument]
    ) -> ServiceRequestResponse:
        """Build complete response with documents and tariff"""
        provided = await document_repository.find_by_request(db, request["id"])
        provided_codes = {d["document_code"] for d in provided}

        missing = [d for d in required_docs if d.document_code not in provided_codes]

        # Build tariff if amounts exist
        tariff = None
        if request.get("total_amount"):
            tariff = TariffBreakdown(
                base_amount=float(request["base_amount"] or 0),
                supplements=[],
                supplements_total=float(request["supplements_amount"] or 0),
                penalties_amount=float(request["penalties_amount"] or 0),
                total_amount=float(request["total_amount"])
            )

        return ServiceRequestResponse(
            id=request["id"],
            reference=request["reference"],
            workflow_code=request["workflow_code"],
            solicitud_type=request["solicitud_type"],
            status=request["status"],
            priority=request["priority"],
            required_documents=required_docs,
            provided_documents=[
                ProvidedDocument(
                    id=d["id"],
                    document_code=d["document_code"],
                    document_name=d["document_name"],
                    file_path=d["file_path"],
                    file_name=d["file_name"],
                    file_size=d.get("file_size"),
                    mime_type=d.get("mime_type"),
                    extraction_data=d.get("extraction_data", {}),
                    extraction_confidence=d.get("extraction_confidence"),
                    extraction_status=d.get("extraction_status", "pending"),
                    is_valid=d.get("is_valid"),
                    validation_errors=d.get("validation_errors", []),
                    created_at=d["created_at"]
                )
                for d in provided
            ],
            missing_documents=missing,
            documents_progress=f"{len(provided)}/{len(required_docs)}",
            form_data=request.get("form_data", {}),
            extracted_data=request.get("extracted_data", {}),
            extraction_confidence=request.get("extraction_confidence"),
            tariff=tariff,
            assigned_to=request.get("assigned_to"),
            entity_code=request.get("entity_code"),
            cita_date=request.get("cita_date"),
            cita_time=request.get("cita_time"),
            cita_location=request.get("cita_location"),
            created_at=request["created_at"],
            updated_at=request.get("updated_at"),
            submitted_at=request.get("submitted_at"),
            validated_at=request.get("validated_at"),
            completed_at=request.get("completed_at"),
            rejection_reason=request.get("rejection_reason")
        )


# Singleton instance
service_request_service = ServiceRequestService()
