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
    DocumentValidationResponse,
    FieldIndicator,
    RiskAnalysisResult
)
from ..models.enums import ServiceRequestStatus, SolicitudType
from .tariff_service import tariff_service
from .schema_loader import schema_loader
from .gemini_document_processor import gemini_document_processor
from .workflow_engine import workflow_engine

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

        # Get document name and extraction_schema_key from requirements
        required_docs = await self._get_required_documents(db, request["workflow_code"])
        doc_name = document_code
        extraction_schema_key = None
        for req_doc in required_docs:
            if req_doc.document_code == document_code:
                doc_name = req_doc.document_name
                extraction_schema_key = req_doc.extraction_schema_key
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

        # Process document (extraction) with schema key
        processing_result = await self._process_document(
            content=content,
            mime_type=file.content_type,
            document_code=document_code,
            extraction_schema_key=extraction_schema_key
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

        # Get document name and extraction_schema_key from requirements
        required_docs = await self._get_required_documents(db, request["workflow_code"])
        doc_name = document_code
        extraction_schema_key = None
        for req_doc in required_docs:
            if req_doc.document_code == document_code:
                doc_name = req_doc.document_name
                extraction_schema_key = req_doc.extraction_schema_key
                break

        # Get existing documents for identity consistency checks
        existing_docs_raw = await document_repository.find_by_request(db, request_id)
        existing_documents = {
            d["document_code"]: {
                "extraction": d.get("extraction_data", {}),
                "confidence": d.get("extraction_confidence", 0)
            }
            for d in existing_docs_raw
        }

        # Get form data from request
        form_data = request.get("form_data", {})

        # Process document with Gemini/Tesseract + Risk Analysis (NO Firebase upload yet)
        # Pass extraction_schema_key for proper schema lookup
        processing_result = await self._process_document(
            content=content,
            mime_type=file.content_type,
            document_code=document_code,
            request_id=str(request_id),
            user_id=str(user_id),
            existing_documents=existing_documents if existing_documents else None,
            form_data=form_data if form_data else None,
            extraction_schema_key=extraction_schema_key
        )

        # Generate preview ID (unique for this extraction session)
        preview_id = f"prev_{hashlib.sha256(f'{request_id}{document_code}{datetime.utcnow().isoformat()}'.encode()).hexdigest()[:16]}"

        # Calculate expiry time
        expires_at = datetime.utcnow() + timedelta(minutes=PREVIEW_EXPIRY_MINUTES)

        # Get risk analysis
        risk_analysis = processing_result.get("risk_analysis", {})

        # Build field-level indicators for UI
        field_indicators = self._build_field_indicators(
            extraction=processing_result["extraction"],
            confidence=processing_result["confidence"],
            risk_analysis=risk_analysis,
            document_code=document_code,
            extraction_schema_key=extraction_schema_key
        )

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
            "risk_analysis": risk_analysis,
            "detected_type": processing_result.get("document_type", document_code),
            "expires_at": expires_at.isoformat(),
            "extraction_schema_key": extraction_schema_key  # Store for later use
        }

        # Clean up expired previews
        self._cleanup_expired_previews()

        # Get expected fields from schema for frontend form
        expected_fields = self._get_expected_fields(document_code, extraction_schema_key)

        # Determine status and if user needs to review
        extraction_status = processing_result.get("status", "pending_validation")
        needs_correction = (
            processing_result["confidence"] < 0.7 or
            risk_analysis.get("requires_review", False)
        )

        # Check document type match
        detected_type = processing_result.get("document_type", document_code)
        doc_type_match = not any(
            f["code"] == "DOC_TYPE_MISMATCH"
            for f in risk_analysis.get("risk_factors", [])
        )

        # Build risk analysis response model
        risk_result = None
        if risk_analysis:
            risk_result = RiskAnalysisResult(
                risk_level=risk_analysis.get("risk_level", "low"),
                risk_score=risk_analysis.get("risk_score", 0),
                risk_factors=risk_analysis.get("risk_factors", []),
                recommendations=risk_analysis.get("recommendations", []),
                requires_rejection=risk_analysis.get("requires_rejection", False),
                requires_review=risk_analysis.get("requires_review", False),
                factors_count=risk_analysis.get("factors_count", {})
            )

        logger.info(
            f"Document preview created: {document_code} for request {request['reference']} "
            f"(preview_id: {preview_id}, confidence: {processing_result['confidence']:.2%}, "
            f"risk: {risk_analysis.get('risk_level', 'unknown')})"
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
            field_indicators=field_indicators,
            risk_analysis=risk_result,
            extraction_status=extraction_status,
            needs_correction=needs_correction,
            detected_document_type=detected_type,
            document_type_match=doc_type_match,
            expected_fields=expected_fields,
            expires_at=expires_at,
            processing_time_ms=processing_result.get("processing_time_ms")
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

    def _get_expected_fields(
        self,
        document_code: str,
        extraction_schema_key: Optional[str] = None
    ) -> List[Dict]:
        """Get expected fields from schema for frontend form generation"""
        schema = schema_loader.get_schema_for_document(document_code, extraction_schema_key)
        if not schema:
            return []

        fields = []
        # Use "extraction" key (not "blocs")
        extraction = schema.get("extraction", {})
        for bloc_name, bloc in extraction.items():
            if not isinstance(bloc, dict) or "fields" not in bloc:
                continue
            for field_name, config in bloc.get("fields", {}).items():
                fields.append({
                    "field_name": field_name,
                    "label": config.get("field_label", config.get("label", field_name)),
                    "type": config.get("type", "text"),
                    "required": config.get("required", False),
                    "bloc": bloc_name,
                    "hint": config.get("description", ""),
                    "pattern": config.get("pattern"),
                    "pii": config.get("pii", False)
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
        workflow_code: str,
        solicitud_type: str = "expedicion",
        sub_type: Optional[str] = None
    ) -> List[RequiredDocument]:
        """
        Get required documents for a workflow.

        Strategy:
        1. First, query workflow_document_requirements table (DB config)
        2. If no DB config, fallback to workflow class definition (code config)

        This allows admin to override document requirements via DB while
        maintaining code-defined defaults for new workflows.

        Table schema (migration 021):
        - document_code: VARCHAR(100)
        - document_name_es: VARCHAR(255)
        - is_required: BOOLEAN
        - display_order: INTEGER
        - extraction_schema_key: VARCHAR(100)
        - instructions_es: TEXT

        Note: accepted_formats and max_size_mb are NOT in DB - use defaults.
        """
        # 1. Try database configuration first
        query = """
            SELECT document_code,
                   document_name_es,
                   is_required,
                   display_order,
                   extraction_schema_key,
                   instructions_es
            FROM workflow_document_requirements
            WHERE workflow_code = $1 AND is_active = TRUE
            ORDER BY display_order
        """
        rows = await db.fetch(query, workflow_code)

        if rows:
            return [
                RequiredDocument(
                    document_code=row["document_code"],
                    document_name=row["document_name_es"],
                    is_required=row["is_required"] if row["is_required"] is not None else True,
                    display_order=row["display_order"] or 0,
                    extraction_schema_key=row["extraction_schema_key"],
                    instructions=row["instructions_es"]
                )
                for row in rows
            ]

        # 2. Fallback to workflow class definition
        workflow = workflow_engine.get_workflow_by_string(workflow_code)
        if workflow:
            logger.info(f"Using workflow class for document requirements: {workflow_code}")
            doc_requirements = workflow.get_document_requirements(sub_type or "")
            return [
                RequiredDocument(
                    document_code=doc.document_code,
                    document_name=doc.document_name_es,
                    is_required=doc.is_required,
                    display_order=doc.display_order,
                    extraction_schema_key=doc.schema_key,
                    instructions=doc.instructions_es,
                    accepted_formats=doc.accepted_formats,
                    max_size_mb=doc.max_size_mb
                )
                for doc in doc_requirements
            ]

        logger.warning(f"No document requirements found for workflow: {workflow_code}")
        return []

    def _get_extraction_schema_key(
        self,
        document_code: str,
        required_docs: List[RequiredDocument]
    ) -> Optional[str]:
        """Get extraction_schema_key for a document from required documents list"""
        for doc in required_docs:
            if doc.document_code == document_code:
                return doc.extraction_schema_key
        return None

    async def _process_document(
        self,
        content: bytes,
        mime_type: str,
        document_code: str,
        request_id: str = "",
        user_id: str = "",
        existing_documents: Optional[Dict[str, Dict]] = None,
        form_data: Optional[Dict] = None,
        extraction_schema_key: Optional[str] = None
    ) -> Dict:
        """
        Process document for extraction + risk analysis using Gemini + Tesseract fallback.

        Pipeline:
        1. Gemini AI (primary) - 70% confidence threshold + fraud detection
        2. Tesseract OCR (fallback) - 60% confidence threshold
        3. Manual review if both fail
        4. Comprehensive risk analysis

        Args:
            content: Document file bytes
            mime_type: MIME type (image/*, application/pdf)
            document_code: Expected document type code
            request_id: Service request ID for duplication tracking
            user_id: User ID for duplication tracking
            existing_documents: Previously uploaded documents for consistency checks
            form_data: User form data for consistency checks
            extraction_schema_key: Database key for schema lookup (e.g., 'DIP_GQ_V1')

        Returns:
            Dict with extraction, confidence, processor, status, risk_analysis
        """
        try:
            # Use the production Gemini document processor with full risk analysis
            result = await gemini_document_processor.process(
                content=content,
                mime_type=mime_type,
                document_code=document_code,
                request_id=request_id,
                user_id=user_id,
                existing_documents=existing_documents,
                form_data=form_data,
                extraction_schema_key=extraction_schema_key
            )

            # Log summary
            risk = result.get("risk_analysis", {})
            logger.info(
                f"Document processed: {document_code} | "
                f"Processor: {result['processor']} | "
                f"Confidence: {result['confidence']:.2%} | "
                f"Status: {result['status']} | "
                f"Risk: {risk.get('risk_level', 'unknown')} ({risk.get('risk_score', 0)})"
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
                "error_message": str(e),
                "risk_analysis": {
                    "risk_level": "critical",
                    "risk_score": 100,
                    "risk_factors": [{
                        "code": "PROCESSING_ERROR",
                        "severity": "critical",
                        "message": f"Processing error: {str(e)}",
                        "action": "review"
                    }],
                    "recommendations": ["Manual review required due to processing error"],
                    "requires_rejection": False,
                    "requires_review": True,
                    "factors_count": {"critical": 1, "high": 0, "medium": 0, "low": 0}
                }
            }

    def _build_field_indicators(
        self,
        extraction: Dict,
        confidence: float,
        risk_analysis: Dict,
        document_code: str,
        extraction_schema_key: Optional[str] = None
    ) -> List[FieldIndicator]:
        """
        Build per-field indicators for UI display.

        Args:
            extraction: Extracted data
            confidence: Overall confidence
            risk_analysis: Risk analysis result
            document_code: Document type code
            extraction_schema_key: Database key for schema lookup

        Returns:
            List of FieldIndicator with status and risk info
        """
        indicators = []

        # Get schema for field metadata (use extraction_schema_key if available)
        schema = schema_loader.get_schema_for_document(document_code, extraction_schema_key)
        expected_fields = set()
        field_metadata = {}

        if schema:
            # Use "extraction" key (not "blocs")
            extraction_section = schema.get("extraction", {})
            for bloc_name, bloc in extraction_section.items():
                if not isinstance(bloc, dict) or "fields" not in bloc:
                    continue
                for field_name, config in bloc.get("fields", {}).items():
                    expected_fields.add(field_name)
                    field_metadata[field_name] = {
                        "label": config.get("field_label", config.get("label", field_name)),
                        "required": config.get("required", False)
                    }

        # Build risk factors by field
        field_risks = {}
        for factor in risk_analysis.get("risk_factors", []):
            detail = factor.get("detail", {})
            related_field = detail.get("field")
            if related_field:
                if related_field not in field_risks:
                    field_risks[related_field] = []
                field_risks[related_field].append(factor)

        # Create indicators for each extracted field
        for field_name, value in extraction.items():
            if field_name.startswith("_"):
                continue

            # Base confidence (use overall if no per-field data)
            field_confidence = confidence

            # Determine status
            if value is None or value == "":
                status = "missing" if field_metadata.get(field_name, {}).get("required") else "ok"
            elif field_name in field_risks:
                # Has risk factors
                highest_severity = max(
                    (r["severity"] for r in field_risks[field_name]),
                    key=lambda s: {"critical": 4, "high": 3, "medium": 2, "low": 1}.get(s, 0)
                )
                status = "error" if highest_severity in ["critical", "high"] else "warning"
            elif field_confidence < 0.5:
                status = "warning"
            else:
                status = "ok"

            # Get risk info if exists
            risk_level = None
            risk_message = None
            suggestion = None
            requires_attention = False

            if field_name in field_risks:
                factors = field_risks[field_name]
                highest_factor = max(
                    factors,
                    key=lambda f: {"critical": 4, "high": 3, "medium": 2, "low": 1}.get(f["severity"], 0)
                )
                risk_level = highest_factor["severity"]
                risk_message = highest_factor["message"]
                requires_attention = True

                # Build suggestion
                action = highest_factor.get("action")
                if action == "reject":
                    suggestion = "This field has critical issues - document may be rejected"
                elif action == "review":
                    suggestion = "Please verify this field carefully"
                elif action == "warn":
                    suggestion = "Consider reviewing this value"

            # Low confidence warning
            if field_confidence < 0.6 and not requires_attention:
                requires_attention = True
                risk_level = risk_level or "low"
                risk_message = risk_message or "Low extraction confidence - please verify"
                suggestion = suggestion or "Double-check this value against the document"

            indicators.append(FieldIndicator(
                field_name=field_name,
                value=value,
                confidence=field_confidence,
                status=status,
                risk_level=risk_level,
                risk_message=risk_message,
                requires_attention=requires_attention,
                suggestion=suggestion
            ))

        # Add indicators for missing required fields
        for field_name in expected_fields:
            if field_name not in extraction:
                meta = field_metadata.get(field_name, {})
                if meta.get("required"):
                    indicators.append(FieldIndicator(
                        field_name=field_name,
                        value=None,
                        confidence=0.0,
                        status="missing",
                        risk_level="medium",
                        risk_message="Required field not found in document",
                        requires_attention=True,
                        suggestion=f"Please enter {meta.get('label', field_name)} manually"
                    ))

        return indicators

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
            user_id=request["user_id"],
            workflow_code=request["workflow_code"],
            solicitud_type=request["solicitud_type"],
            fiscal_service_id=request.get("fiscal_service_id"),
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
                    validated_by=d.get("validated_by"),
                    validated_at=d.get("validated_at"),
                    source=d.get("source", "user_upload"),
                    uploaded_by=d.get("uploaded_by"),
                    created_at=d["created_at"],
                    updated_at=d.get("updated_at")
                )
                for d in provided
            ],
            missing_documents=missing,
            documents_progress=f"{len(provided)}/{len(required_docs)}",
            form_data=request.get("form_data", {}),
            extracted_data=request.get("extracted_data", {}),
            extraction_confidence=request.get("extraction_confidence"),
            validations=request.get("validations", {}),
            tariff=tariff,
            assigned_to=request.get("assigned_to"),
            assigned_at=request.get("assigned_at"),
            entity_code=request.get("entity_code"),
            payment_id=request.get("payment_id"),
            payment_status=request.get("payment_status"),
            paid_at=request.get("paid_at"),
            cita_date=request.get("cita_date"),
            cita_time=request.get("cita_time"),
            cita_location=request.get("cita_location"),
            created_at=request["created_at"],
            updated_at=request.get("updated_at"),
            submitted_at=request.get("submitted_at"),
            validated_at=request.get("validated_at"),
            completed_at=request.get("completed_at"),
            expires_at=request.get("expires_at"),
            notes=request.get("notes"),
            rejection_reason=request.get("rejection_reason"),
            created_by=request.get("created_by")
        )


# Singleton instance
service_request_service = ServiceRequestService()
