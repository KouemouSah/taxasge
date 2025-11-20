"""
Document Service - Document Processing Orchestration

Orchestrates the full document processing pipeline:
1. Upload to storage
2. OCR processing
3. Data extraction with templates
4. Validation
5. Queue management

Tables: uploaded_files, ocr_extraction_results, document_processing_queue
"""

from typing import Dict, Any, Optional
from loguru import logger
from datetime import datetime
import uuid

from app.modules.documents.services.ocr_service import OCRService
from app.modules.documents.services.storage_service import StorageService


class DocumentService:
    """Orchestration service for document processing pipeline"""

    def __init__(self):
        """Initialize document service with dependencies"""
        self.ocr_service = OCRService()
        self.storage_service = StorageService()

    async def process_uploaded_document(
        self,
        user_id: str,
        file_path: str,
        filename: str,
        document_type: str,
        related_declaration_id: Optional[str] = None,
        use_google_vision: bool = False,
    ) -> Dict[str, Any]:
        """
        Process uploaded document through full pipeline

        Args:
            user_id: User who uploaded the document
            file_path: Local file path to upload
            filename: Original filename
            document_type: Type (iva, irpf, nota_ingreso, etc.)
            related_declaration_id: Optional FK to tax_declarations or fiscal_service_data
            use_google_vision: Use Google Vision instead of Tesseract

        Returns:
            {
                "file_id": str,
                "storage_url": str,
                "ocr_result": dict,
                "extraction_result": dict,
                "queue_status": str
            }
        """
        file_id = str(uuid.uuid4())

        try:
            # Step 1: Upload to Supabase Storage
            logger.info(f"Uploading document {filename} for user {user_id}")
            storage_result = await self.storage_service.upload_file(
                file_path=file_path,
                filename=filename,
                user_id=user_id,
                bucket_name="documents",
            )

            # TODO: Save to uploaded_files table
            # INSERT INTO uploaded_files (id, user_id, filename, file_path, file_type, file_size, uploaded_at)

            # Step 2: OCR Processing
            logger.info(f"Processing OCR for document {file_id}")
            ocr_result = await self.ocr_service.process_document(
                file_id=file_id,
                file_path=storage_result["url"],
                document_type=document_type,
                use_google_vision=use_google_vision,
            )

            # TODO: Save to ocr_extraction_results table
            # INSERT INTO ocr_extraction_results (id, file_id, raw_text, structured_data, confidence, ocr_engine)

            # Step 3: Extract with template (if template exists)
            extraction_result = None
            if document_type in ["iva", "irpf", "nota_ingreso"]:
                logger.info(f"Extracting structured data with template {document_type}")
                extraction_result = await self.ocr_service.extract_with_template(
                    raw_text=ocr_result["raw_text"],
                    template_code=document_type,
                )

            # Step 4: Queue for validation/processing
            # TODO: Insert into document_processing_queue
            # INSERT INTO document_processing_queue (file_id, status, priority, queued_at)

            logger.info(f"Document {file_id} processed successfully")

            return {
                "file_id": file_id,
                "filename": filename,
                "storage_url": storage_result["url"],
                "ocr_result": ocr_result,
                "extraction_result": extraction_result,
                "queue_status": "queued",
                "document_type": document_type,
            }

        except Exception as e:
            logger.error(f"Document processing failed for {filename}: {e}")
            # TODO: Update uploaded_files with error status
            raise

    async def validate_document(
        self,
        file_id: str,
        validation_rules: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Validate extracted document data against rules

        Args:
            file_id: Document file ID
            validation_rules: Validation rules from form_templates

        Returns:
            {
                "is_valid": bool,
                "errors": list,
                "warnings": list
            }
        """
        # TODO: Implement validation logic
        # - Check required fields
        # - Validate formats (dates, amounts, NIF)
        # - Business rules (amounts match, dates consistent)

        logger.info(f"Validating document {file_id}")

        return {
            "is_valid": True,
            "errors": [],
            "warnings": [],
        }

    async def get_document_status(
        self,
        file_id: str,
    ) -> Dict[str, Any]:
        """
        Get processing status of document

        Args:
            file_id: Document file ID

        Returns:
            {
                "file_id": str,
                "status": str (queued, processing, completed, failed),
                "ocr_status": str,
                "extraction_status": str,
                "validation_status": str
            }
        """
        # TODO: Query uploaded_files, ocr_extraction_results, document_processing_queue

        logger.info(f"Getting status for document {file_id}")

        return {
            "file_id": file_id,
            "status": "completed",
            "ocr_status": "completed",
            "extraction_status": "completed",
            "validation_status": "pending",
        }

    async def reprocess_document(
        self,
        file_id: str,
        use_google_vision: bool = True,
    ) -> Dict[str, Any]:
        """
        Reprocess document with different OCR engine

        Args:
            file_id: Document file ID
            use_google_vision: Switch to Google Vision

        Returns:
            New OCR result
        """
        # TODO: Get file from uploaded_files
        # TODO: Rerun OCR with different engine
        # TODO: Update ocr_extraction_results

        logger.info(f"Reprocessing document {file_id} with Google Vision: {use_google_vision}")

        return {
            "file_id": file_id,
            "reprocessed": True,
            "ocr_engine": "google_vision" if use_google_vision else "tesseract",
        }

    async def delete_document(
        self,
        file_id: str,
        user_id: str,
    ) -> bool:
        """
        Delete document and all related data

        Args:
            file_id: Document file ID
            user_id: User requesting deletion (authorization check)

        Returns:
            True if deleted successfully
        """
        # TODO: Check authorization (user_id matches or admin)
        # TODO: Delete from Supabase Storage
        # TODO: DELETE from uploaded_files (CASCADE will handle related records)

        logger.info(f"Deleting document {file_id} by user {user_id}")

        await self.storage_service.delete_file(file_id)

        return True
