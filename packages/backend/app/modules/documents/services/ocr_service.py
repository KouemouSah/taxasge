"""
OCR Service - Tesseract and Google Document AI Integration

Service for OCR processing of uploaded documents
Table: ocr_extraction_results

OCR Engines:
- Tesseract: Free, open-source OCR (good for simple documents)
- Google Document AI: Premium AI-powered document processing (structured extraction)
  - Processors: form_parser, invoice_parser, expense_parser, general_processor
  - Better accuracy for tax forms, invoices, receipts
  - Structured data extraction with field detection
"""

from typing import Dict, Any, Optional
from loguru import logger
import uuid


class OCRService:
    """Service for OCR processing with Tesseract and Google Document AI"""

    def __init__(self, project_id: str = "taxasge-dev", location: str = "eu"):
        """
        Initialize OCR service

        Args:
            project_id: GCP project ID (taxasge-dev or taxasge-pro)
            location: Document AI location (eu, us)
        """
        self.project_id = project_id
        self.location = location
        self.tesseract_enabled = True  # TODO: Check Tesseract installation
        self.document_ai_enabled = False  # TODO: Check GCP credentials and processors

    async def process_document(
        self,
        file_id: str,
        file_path: str,
        document_type: str,
        use_document_ai: bool = False,
        processor_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process document with OCR

        Args:
            file_id: uploaded_files.id
            file_path: Path to file (local or Firebase Storage URL)
            document_type: Type of document (iva, irpf, nota_ingreso, invoice, receipt, etc.)
            use_document_ai: Use Google Document AI (fallback to Tesseract if false)
            processor_type: Document AI processor type (form_parser, invoice_parser, expense_parser, general_processor)

        Returns:
            {
                "extraction_id": str,
                "file_id": str,
                "raw_text": str,
                "structured_data": dict,
                "confidence": float,
                "ocr_engine": str,
                "processor_type": str (if Document AI)
            }
        """
        extraction_id = str(uuid.uuid4())

        # Auto-select processor type based on document_type
        if use_document_ai and not processor_type:
            processor_type = self._get_processor_for_document_type(document_type)

        try:
            if use_document_ai and self.document_ai_enabled:
                result = await self._process_with_document_ai(file_path, processor_type)
                ocr_engine = "document_ai"
            else:
                result = await self._process_with_tesseract(file_path)
                ocr_engine = "tesseract"

            logger.info(f"OCR processed file {file_id} with {ocr_engine} (processor: {processor_type})")

            response = {
                "extraction_id": extraction_id,
                "file_id": file_id,
                "raw_text": result.get("raw_text", ""),
                "structured_data": result.get("structured_data", {}),
                "confidence": result.get("confidence", 0.0),
                "ocr_engine": ocr_engine,
                "processing_time_ms": result.get("processing_time_ms", 0),
            }

            if processor_type:
                response["processor_type"] = processor_type

            return response

        except Exception as e:
            logger.error(f"OCR processing failed for file {file_id}: {e}")
            return {
                "extraction_id": extraction_id,
                "file_id": file_id,
                "raw_text": "",
                "structured_data": {},
                "confidence": 0.0,
                "ocr_engine": "none",
                "error": str(e),
            }

    def _get_processor_for_document_type(self, document_type: str) -> str:
        """
        Select appropriate Document AI processor based on document type

        Args:
            document_type: Document type (iva, irpf, nota_ingreso, invoice, receipt)

        Returns:
            Processor type (form_parser, invoice_parser, expense_parser, general_processor)
        """
        processor_mapping = {
            "iva": "form_parser",  # IVA declaration form
            "irpf": "form_parser",  # IRPF tax form
            "nota_ingreso": "invoice_parser",  # Payment receipt/invoice
            "invoice": "invoice_parser",
            "receipt": "expense_parser",
            "factura": "invoice_parser",
            "recibo": "expense_parser",
        }

        return processor_mapping.get(document_type, "general_processor")

    async def _process_with_tesseract(self, file_path: str) -> Dict[str, Any]:
        """
        Process document with Tesseract OCR

        TODO: Implement actual Tesseract integration
        - Install pytesseract
        - Configure Tesseract path
        - Set language (spa for Spanish)
        """
        import time
        start_time = time.time()

        # TODO: Implement Tesseract OCR
        # import pytesseract
        # from PIL import Image
        # image = Image.open(file_path)
        # raw_text = pytesseract.image_to_string(image, lang='spa')

        # Mock result for now
        raw_text = "Mock OCR text from Tesseract"
        structured_data = {}

        processing_time_ms = int((time.time() - start_time) * 1000)

        return {
            "raw_text": raw_text,
            "structured_data": structured_data,
            "confidence": 0.85,
            "processing_time_ms": processing_time_ms,
        }

    async def _process_with_document_ai(
        self,
        file_path: str,
        processor_type: str = "general_processor",
    ) -> Dict[str, Any]:
        """
        Process document with Google Document AI

        Document AI processors:
        - form_parser: Extract form fields (IVA, IRPF tax forms)
        - invoice_parser: Extract invoice data (amount, date, vendor, line items)
        - expense_parser: Extract receipt data (total, date, merchant)
        - general_processor: General OCR with layout understanding

        Args:
            file_path: Path to file (local or Firebase Storage URL)
            processor_type: Processor to use

        Returns:
            {
                "raw_text": str,
                "structured_data": dict,
                "confidence": float,
                "processing_time_ms": int
            }
        """
        import time
        start_time = time.time()

        # TODO: Implement Google Document AI integration
        # from google.cloud import documentai_v1 as documentai
        #
        # # Create processor client
        # client = documentai.DocumentProcessorServiceClient()
        #
        # # Get processor path
        # # Format: projects/{project}/locations/{location}/processors/{processor_id}
        # processor_name = f"projects/{self.project_id}/locations/{self.location}/processors/{processor_id}"
        #
        # # Read document
        # with open(file_path, 'rb') as document_file:
        #     document_content = document_file.read()
        #
        # # Create request
        # raw_document = documentai.RawDocument(
        #     content=document_content,
        #     mime_type="application/pdf"  # or "image/jpeg", "image/png"
        # )
        #
        # request = documentai.ProcessRequest(
        #     name=processor_name,
        #     raw_document=raw_document
        # )
        #
        # # Process document
        # result = client.process_document(request=request)
        # document = result.document
        #
        # # Extract text
        # raw_text = document.text
        #
        # # Extract structured data based on processor type
        # structured_data = {}
        #
        # if processor_type == "invoice_parser":
        #     structured_data = {
        #         "invoice_number": self._extract_entity(document, "invoice_id"),
        #         "invoice_date": self._extract_entity(document, "invoice_date"),
        #         "total_amount": self._extract_entity(document, "total_amount"),
        #         "supplier_name": self._extract_entity(document, "supplier_name"),
        #         "line_items": self._extract_line_items(document),
        #     }
        # elif processor_type == "form_parser":
        #     # Extract form fields (key-value pairs)
        #     structured_data = {
        #         field.field_name.text_anchor.content: field.field_value.text_anchor.content
        #         for page in document.pages
        #         for field in page.form_fields
        #     }
        # elif processor_type == "expense_parser":
        #     structured_data = {
        #         "total": self._extract_entity(document, "total_amount"),
        #         "date": self._extract_entity(document, "receipt_date"),
        #         "merchant": self._extract_entity(document, "supplier_name"),
        #     }
        #
        # # Calculate confidence
        # confidence = document.entities[0].confidence if document.entities else 0.0

        # Mock result for now
        raw_text = f"Mock OCR text from Google Document AI ({processor_type})"
        structured_data = {}

        if processor_type == "invoice_parser":
            structured_data = {
                "invoice_number": "MOCK-INV-123",
                "invoice_date": "2025-01-20",
                "total_amount": "150000 XAF",
                "supplier_name": "Mock Supplier",
            }
        elif processor_type == "form_parser":
            structured_data = {
                "NIF": "MOCK-NIF-123456",
                "Montant": "150000",
                "Date": "2025-01-20",
            }
        elif processor_type == "expense_parser":
            structured_data = {
                "total": "150000 XAF",
                "date": "2025-01-20",
                "merchant": "Mock Merchant",
            }

        processing_time_ms = int((time.time() - start_time) * 1000)

        return {
            "raw_text": raw_text,
            "structured_data": structured_data,
            "confidence": 0.95,  # Document AI typically has higher confidence
            "processing_time_ms": processing_time_ms,
        }

    async def extract_with_template(
        self,
        raw_text: str,
        template_code: str,
    ) -> Dict[str, Any]:
        """
        Extract structured data using form template

        Args:
            raw_text: Raw OCR text
            template_code: form_templates.template_code

        Returns:
            Structured extracted data
        """
        # TODO: Use template_loader and zone_label_extractor
        # from app.modules.documents.extractors.template_loader import TemplateLoader
        # from app.modules.documents.extractors.zone_label_extractor import ZoneLabelExtractor

        # loader = TemplateLoader()
        # template = loader.load_template(template_code)
        # extractor = ZoneLabelExtractor(template)
        # result = extractor.extract(raw_text)

        logger.info(f"Extracting with template {template_code}")

        return {
            "extracted_data": {},
            "confidence": 0.8,
            "template_code": template_code,
        }
