"""
Gemini Document Processor for Service Requests.

Production-ready document classification and extraction using:
1. Google Vertex AI Gemini 2.0 (primary) - Confidence threshold: 70%
2. Tesseract OCR fallback - Confidence threshold: 60%

This processor is STANDALONE and only imports:
- Vertex AI SDK (Gemini)
- ocr_service from documents module (utility service)
- schema_loader from this module

Author: Claude Code
Date: 2025-12-27
"""

import asyncio
import json
import re
import time
import base64
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from loguru import logger

# Vertex AI imports
try:
    from vertexai.generative_models import (
        GenerativeModel,
        GenerationConfig,
        HarmCategory,
        HarmBlockThreshold,
        Part
    )
    import vertexai
    VERTEX_AI_AVAILABLE = True
except ImportError:
    VERTEX_AI_AVAILABLE = False
    logger.warning("Vertex AI SDK not installed - Gemini extraction disabled")

from app.config import settings
from .schema_loader import schema_loader

# Import OCR service for Tesseract fallback
try:
    from app.modules.documents.services.ocr_service import ocr_service
    OCR_SERVICE_AVAILABLE = True
except ImportError:
    OCR_SERVICE_AVAILABLE = False
    logger.warning("OCR service not available - Tesseract fallback disabled")


# Confidence thresholds
GEMINI_CONFIDENCE_THRESHOLD = 0.70  # 70% - Accept Gemini extraction
TESSERACT_CONFIDENCE_THRESHOLD = 0.60  # 60% - Accept Tesseract extraction


class GeminiDocumentProcessor:
    """
    Production document processor using Gemini AI + Tesseract fallback.

    Flow:
    1. Try Gemini extraction with multimodal vision
    2. If confidence < 70% or error, fallback to Tesseract OCR
    3. If Tesseract confidence < 60%, mark for manual review

    Usage:
        processor = GeminiDocumentProcessor()
        result = await processor.process(content, mime_type, document_code)
    """

    def __init__(self):
        """Initialize Gemini processor with Vertex AI"""
        self.enabled = False
        self.model = None

        if not VERTEX_AI_AVAILABLE:
            logger.error("Vertex AI SDK not available - processor disabled")
            return

        try:
            # Initialize Vertex AI
            vertexai.init(
                project=settings.GOOGLE_CLOUD_PROJECT,
                location=settings.GOOGLE_CLOUD_LOCATION
            )

            # Use Gemini Pro for vision/multimodal tasks
            self.model = GenerativeModel(settings.GEMINI_PRO_MODEL)

            # Generation config optimized for extraction
            self.generation_config = GenerationConfig(
                temperature=0.1,  # Low for consistent extraction
                top_p=0.8,
                top_k=20,
                max_output_tokens=4096,
            )

            # Safety settings
            self.safety_settings = {
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            }

            self.enabled = True
            logger.info(f"Gemini Document Processor initialized (model: {settings.GEMINI_PRO_MODEL})")

        except Exception as e:
            logger.error(f"Failed to initialize Gemini Document Processor: {e}")
            self.enabled = False

    async def process(
        self,
        content: bytes,
        mime_type: str,
        document_code: str
    ) -> Dict[str, Any]:
        """
        Process document for classification and extraction.

        Args:
            content: Document file bytes
            mime_type: MIME type (image/*, application/pdf)
            document_code: Expected document type code

        Returns:
            Dict with:
            - extraction: Dict of extracted fields
            - confidence: Float 0-1
            - processor: "gemini", "tesseract", or "hybrid"
            - status: "success", "low_confidence", "manual_review", "error"
            - document_type: Detected document type
            - processing_time_ms: Processing time
            - has_error: Boolean
            - error_message: Optional error message
        """
        start_time = time.time()

        # Get schema for document type
        schema = schema_loader.get_schema_for_document(document_code)
        if not schema:
            logger.warning(f"No schema found for document_code: {document_code}")
            # Continue without schema - will do basic extraction

        # Try Gemini first
        if self.enabled:
            try:
                gemini_result = await self._process_with_gemini(
                    content, mime_type, document_code, schema
                )

                if gemini_result["confidence"] >= GEMINI_CONFIDENCE_THRESHOLD:
                    # Gemini succeeded with good confidence
                    gemini_result["processing_time_ms"] = int((time.time() - start_time) * 1000)
                    gemini_result["status"] = "success"
                    logger.info(
                        f"Gemini extraction successful: {document_code} "
                        f"(confidence: {gemini_result['confidence']:.2%})"
                    )
                    return gemini_result

                else:
                    # Gemini confidence too low - try Tesseract
                    logger.info(
                        f"Gemini confidence too low ({gemini_result['confidence']:.2%}), "
                        f"falling back to Tesseract"
                    )

            except Exception as e:
                logger.error(f"Gemini extraction failed: {e}")
                # Fall through to Tesseract

        # Tesseract fallback
        if OCR_SERVICE_AVAILABLE:
            try:
                tesseract_result = await self._process_with_tesseract(
                    content, mime_type, document_code, schema
                )

                tesseract_result["processing_time_ms"] = int((time.time() - start_time) * 1000)

                if tesseract_result["confidence"] >= TESSERACT_CONFIDENCE_THRESHOLD:
                    tesseract_result["status"] = "success"
                    logger.info(
                        f"Tesseract extraction successful: {document_code} "
                        f"(confidence: {tesseract_result['confidence']:.2%})"
                    )
                    return tesseract_result
                else:
                    tesseract_result["status"] = "low_confidence"
                    logger.warning(
                        f"Tesseract confidence too low ({tesseract_result['confidence']:.2%}), "
                        f"marking for manual review"
                    )
                    return tesseract_result

            except Exception as e:
                logger.error(f"Tesseract extraction failed: {e}")

        # Both failed - return manual review status
        return {
            "extraction": {},
            "confidence": 0.0,
            "processor": "none",
            "status": "manual_review",
            "document_type": document_code,
            "processing_time_ms": int((time.time() - start_time) * 1000),
            "has_error": True,
            "error_message": "Both Gemini and Tesseract extraction failed"
        }

    async def _process_with_gemini(
        self,
        content: bytes,
        mime_type: str,
        document_code: str,
        schema: Optional[Dict]
    ) -> Dict[str, Any]:
        """
        Process document using Gemini multimodal vision.

        Args:
            content: Document bytes
            mime_type: MIME type
            document_code: Document type code
            schema: Extraction schema (optional)

        Returns:
            Extraction result dict
        """
        # Build extraction prompt
        prompt = self._build_gemini_prompt(document_code, schema)

        # Prepare image/document part
        if mime_type == "application/pdf":
            # For PDF, convert to base64 and use inline data
            document_part = Part.from_data(
                data=content,
                mime_type="application/pdf"
            )
        else:
            # For images
            document_part = Part.from_data(
                data=content,
                mime_type=mime_type
            )

        # Build content for Gemini
        contents = [
            document_part,
            Part.from_text(prompt)
        ]

        # Call Gemini
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.model.generate_content(
                contents,
                generation_config=self.generation_config,
                safety_settings=self.safety_settings
            )
        )

        # Parse response
        response_text = response.text if response.text else ""

        # Extract JSON from response
        extraction, confidence = self._parse_gemini_response(response_text, schema)

        # Detect document type from response
        detected_type = extraction.get("_document_type", document_code)
        if "_document_type" in extraction:
            del extraction["_document_type"]

        return {
            "extraction": extraction,
            "confidence": confidence,
            "processor": "gemini",
            "document_type": detected_type,
            "has_error": False,
            "raw_response": response_text[:500]  # Truncate for logging
        }

    def _build_gemini_prompt(
        self,
        document_code: str,
        schema: Optional[Dict]
    ) -> str:
        """
        Build extraction prompt for Gemini.

        Args:
            document_code: Document type code
            schema: Extraction schema

        Returns:
            Formatted prompt string
        """
        if schema:
            # Use schema-based prompt
            hints = schema.get("gemini_hints", {})
            doc_description = hints.get("document_description", document_code)
            language = hints.get("language", "es")
            date_format = hints.get("date_format", "DD/MM/YYYY")

            # Build field list from schema
            fields_description = []
            extraction_schema = schema.get("extraction", {})

            for section_name, section in extraction_schema.items():
                section_fields = section.get("fields", {})
                for field_name, field_config in section_fields.items():
                    required = "OBLIGATORIO" if field_config.get("required") else "opcional"
                    field_type = field_config.get("type", "string")
                    pattern = field_config.get("pattern", "")
                    description = field_config.get("description", "")

                    field_desc = f"- {field_name} ({required}, {field_type})"
                    if pattern:
                        field_desc += f" [formato: {pattern}]"
                    if description:
                        field_desc += f": {description}"
                    fields_description.append(field_desc)

            fields_text = "\n".join(fields_description)

            prompt = f"""Analiza este documento y extrae la informacion solicitada.

TIPO DE DOCUMENTO: {doc_description}
IDIOMA DEL DOCUMENTO: {language}
FORMATO DE FECHAS: {date_format}

CAMPOS A EXTRAER:
{fields_text}

INSTRUCCIONES:
1. Analiza el documento imagen/PDF adjunto
2. Extrae SOLO los campos listados arriba
3. Si un campo no es visible o legible, usa null
4. Para fechas, usa formato ISO (YYYY-MM-DD)
5. Para numeros de documento, elimina espacios

RESPONDE UNICAMENTE con un JSON valido en este formato:
{{
    "_document_type": "tipo_detectado",
    "_confidence": 0.85,
    "campo1": "valor1",
    "campo2": "valor2",
    ...
}}

NO incluyas explicaciones, solo el JSON."""

        else:
            # Generic extraction prompt without schema
            prompt = f"""Analiza este documento y extrae toda la informacion relevante.

TIPO DE DOCUMENTO ESPERADO: {document_code}

INSTRUCCIONES:
1. Identifica el tipo de documento
2. Extrae todos los campos visibles: nombres, numeros, fechas, etc.
3. Para campos no legibles, usa null
4. Usa formato ISO para fechas (YYYY-MM-DD)

RESPONDE UNICAMENTE con un JSON valido:
{{
    "_document_type": "tipo_detectado",
    "_confidence": 0.0-1.0,
    "campo1": "valor1",
    "campo2": "valor2",
    ...
}}

NO incluyas explicaciones, solo el JSON."""

        return prompt

    def _parse_gemini_response(
        self,
        response_text: str,
        schema: Optional[Dict]
    ) -> Tuple[Dict[str, Any], float]:
        """
        Parse Gemini response and extract JSON.

        Args:
            response_text: Raw Gemini response
            schema: Extraction schema for validation

        Returns:
            Tuple of (extraction_dict, confidence)
        """
        try:
            # Try to find JSON in response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if not json_match:
                logger.warning("No JSON found in Gemini response")
                return {}, 0.0

            json_str = json_match.group()
            extraction = json.loads(json_str)

            # Extract confidence
            confidence = extraction.pop("_confidence", 0.5)
            if isinstance(confidence, str):
                confidence = float(confidence)

            # Validate extraction if schema provided
            if schema:
                confidence = self._validate_extraction(extraction, schema, confidence)

            return extraction, confidence

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini JSON response: {e}")
            return {}, 0.0
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {e}")
            return {}, 0.0

    def _validate_extraction(
        self,
        extraction: Dict[str, Any],
        schema: Dict,
        base_confidence: float
    ) -> float:
        """
        Validate extraction against schema and adjust confidence.

        Args:
            extraction: Extracted data
            schema: Validation schema
            base_confidence: Initial confidence

        Returns:
            Adjusted confidence score
        """
        extraction_schema = schema.get("extraction", {})
        required_fields = []
        total_fields = 0

        # Collect required fields
        for section_name, section in extraction_schema.items():
            section_fields = section.get("fields", {})
            for field_name, field_config in section_fields.items():
                total_fields += 1
                if field_config.get("required"):
                    required_fields.append(field_name)

        # Count extracted fields
        extracted_count = sum(
            1 for k, v in extraction.items()
            if v is not None and v != "" and not k.startswith("_")
        )

        # Count required fields extracted
        required_extracted = sum(
            1 for field in required_fields
            if field in extraction and extraction[field]
        )

        # Adjust confidence based on completeness
        if required_fields:
            required_ratio = required_extracted / len(required_fields)
            base_confidence = base_confidence * (0.5 + 0.5 * required_ratio)

        # Validate patterns
        for section_name, section in extraction_schema.items():
            section_fields = section.get("fields", {})
            for field_name, field_config in section_fields.items():
                if field_name in extraction and extraction[field_name]:
                    pattern = field_config.get("pattern")
                    if pattern:
                        if not re.match(pattern, str(extraction[field_name])):
                            # Pattern mismatch - reduce confidence
                            base_confidence *= 0.9

        return min(1.0, max(0.0, base_confidence))

    async def _process_with_tesseract(
        self,
        content: bytes,
        mime_type: str,
        document_code: str,
        schema: Optional[Dict]
    ) -> Dict[str, Any]:
        """
        Process document using Tesseract OCR + regex extraction.

        Args:
            content: Document bytes
            mime_type: MIME type
            document_code: Document type code
            schema: Extraction schema

        Returns:
            Extraction result dict
        """
        # Extract text using OCR service
        ocr_result = await ocr_service.extract_text(
            file_content=content,
            file_type=mime_type,
            provider="tesseract_server",
            language="spa",  # Spanish for Equatorial Guinea documents
            document_type=document_code
        )

        if not ocr_result.success or not ocr_result.text:
            return {
                "extraction": {},
                "confidence": 0.0,
                "processor": "tesseract",
                "document_type": document_code,
                "has_error": True,
                "error_message": "OCR extraction failed"
            }

        # Extract fields using regex patterns from schema
        extraction = {}
        pattern_matches = 0
        total_patterns = 0

        if schema:
            tesseract_patterns = schema.get("tesseract_patterns", {})

            for field_name, patterns in tesseract_patterns.items():
                total_patterns += 1

                for pattern in patterns:
                    try:
                        match = re.search(pattern, ocr_result.text, re.IGNORECASE | re.MULTILINE)
                        if match:
                            # Get first capturing group or full match
                            value = match.group(1) if match.groups() else match.group()
                            extraction[field_name] = value.strip()
                            pattern_matches += 1
                            break
                    except re.error as e:
                        logger.warning(f"Invalid regex pattern for {field_name}: {e}")

        # Calculate confidence
        ocr_confidence = ocr_result.confidence
        pattern_confidence = pattern_matches / total_patterns if total_patterns > 0 else 0.5

        # Combined confidence (weighted average)
        confidence = (ocr_confidence * 0.4) + (pattern_confidence * 0.6)

        return {
            "extraction": extraction,
            "confidence": confidence,
            "processor": "tesseract",
            "document_type": document_code,
            "has_error": False,
            "ocr_confidence": ocr_confidence,
            "pattern_matches": pattern_matches,
            "total_patterns": total_patterns,
            "raw_text_length": len(ocr_result.text)
        }


# Singleton instance
gemini_document_processor = GeminiDocumentProcessor()
