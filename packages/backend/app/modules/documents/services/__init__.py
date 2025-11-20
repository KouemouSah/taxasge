"""
Document Services for TaxasGE Backend
Business logic for document processing (OCR, extraction, validation)

Services:
- OCRService: Tesseract and Google Cloud Vision OCR processing
- DocumentService: Document processing orchestration (upload → OCR → extraction → validation)
- StorageService: Supabase Storage integration (upload, download, delete files)
"""

from app.modules.documents.services.ocr_service import OCRService
from app.modules.documents.services.document_service import DocumentService
from app.modules.documents.services.storage_service import StorageService

__all__ = ["OCRService", "DocumentService", "StorageService"]
