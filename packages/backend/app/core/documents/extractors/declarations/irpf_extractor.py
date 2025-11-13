"""
IRPF (Impuesto sobre la Renta de las Personas Físicas) Extractor
Extracts structured data from IRPF declaration documents

Author: Claude Code
Date: 2025-11-13
Version: 2.0 - Specialized fiscal declaration extractor
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from loguru import logger

from app.core.documents.extractors.base import BaseExtractor, ExtractionResult


class IRPFExtractor(BaseExtractor):
    """
    Extractor for IRPF (Personal Income Tax) declaration documents

    Key fields:
    - Identification: NIF, Full Name, Ejercicio
    - Income: Salaries, Business income, Capital gains
    - Deductions: Familia, Vivienda, Donations
    - Result: Base liquidable, Cuota, Tipo gravamen
    """

    def _initialize_patterns(self) -> Dict[str, List[str]]:
        """Initialize IRPF-specific extraction patterns"""
        return {
            # Identificación
            "nif": [
                r"N\.?I\.?F\.?\s*:?\s*(\d{8}[A-Z])",
                r"NIF\s+(\d{8}[A-Z])",
                r"identificaci[oó]n\s+fiscal\s*:?\s*(\d{8}[A-Z])"
            ],
            "nombre_completo": [
                r"(?:nombre completo|apellidos y nombre)\s*:?\s*([A-Z][A-Za-z\s]+)",
                r"Don/D[ñn]a\s+(.+?)(?:\s+con NIF|\s+NIF)",
                r"contribuyente\s*:?\s*([A-Z][A-Za-z\s]+)"
            ],
            "ejercicio": [
                r"Ejercicio\s*:?\s*(20\d{2})",
                r"A[ñn]o\s+fiscal\s*:?\s*(20\d{2})",
                r"declaraci[oó]n\s+a[ñn]o\s*:?\s*(20\d{2})"
            ],

            # Rendimientos del Trabajo (Salaries)
            "rendimientos_trabajo": [
                r"Rendimientos?\s+del?\s+trabajo\s*:?\s*([0-9.,]+)",
                r"Salarios?\s+y\s+sueldos\s*:?\s*([0-9.,]+)",
                r"Ingresos?\s+laborales\s*:?\s*([0-9.,]+)"
            ],

            # Rendimientos de Actividades Económicas (Business)
            "rendimientos_actividades": [
                r"Rendimientos?\s+actividades\s+econ[oó]micas\s*:?\s*([0-9.,]+)",
                r"Ingresos?\s+empresariales\s*:?\s*([0-9.,]+)",
                r"Actividades?\s+econ[oó]micas\s*:?\s*([0-9.,]+)"
            ],

            # Rendimientos del Capital (Capital gains/income)
            "rendimientos_capital": [
                r"Rendimientos?\s+del?\s+capital\s*:?\s*([0-9.,]+)",
                r"Rentas?\s+del?\s+capital\s*:?\s*([0-9.,]+)",
                r"Dividendos\s+y\s+intereses\s*:?\s*([0-9.,]+)"
            ],

            # Base Imponible General
            "base_imponible": [
                r"Base\s+imponible\s+general\s*:?\s*([0-9.,]+)",
                r"Base\s+liquidable\s*:?\s*([0-9.,]+)",
                r"Renta\s+neta\s*:?\s*([0-9.,]+)"
            ],

            # Deducciones
            "deducciones_familiares": [
                r"Deducci[oó]n\s+por\s+descendientes\s*:?\s*([0-9.,]+)",
                r"Deducci[oó]n\s+familiar\s*:?\s*([0-9.,]+)",
                r"M[ií]nimo\s+familiar\s*:?\s*([0-9.,]+)"
            ],
            "deducciones_vivienda": [
                r"Deducci[oó]n\s+por\s+vivienda\s*:?\s*([0-9.,]+)",
                r"Vivienda\s+habitual\s*:?\s*([0-9.,]+)"
            ],

            # Cuota y Tipo
            "cuota_integra": [
                r"Cuota\s+[ií]ntegra\s*:?\s*([0-9.,]+)",
                r"Cuota\s+resultante\s*:?\s*([0-9.,]+)"
            ],
            "tipo_gravamen": [
                r"Tipo\s+(?:de\s+)?gravamen\s*:?\s*([0-9.,]+)%?",
                r"Tipo\s+impositivo\s*:?\s*([0-9.,]+)%?",
                r"Tasa\s+aplicable\s*:?\s*([0-9.,]+)%?"
            ],

            # Resultado
            "resultado_declaracion": [
                r"Resultado\s+de\s+la\s+declaraci[oó]n\s*:?\s*([0-9.,\-]+)",
                r"(?:A\s+ingresar|A\s+devolver)\s*:?\s*([0-9.,]+)",
                r"Importe\s+final\s*:?\s*([0-9.,\-]+)"
            ]
        }

    async def extract(self, ocr_text: str, metadata: Optional[Dict[str, Any]] = None) -> ExtractionResult:
        """
        Extract structured data from IRPF declaration OCR text

        Args:
            ocr_text: OCR extracted text
            metadata: Optional metadata (OCR confidence, provider)

        Returns:
            ExtractionResult with IRPF fields and confidence scores
        """
        start_time = datetime.now()

        try:
            logger.info("Starting IRPF declaration extraction")

            # Preprocess text
            processed_text = self._preprocess_text(ocr_text)

            # Extract all fields
            extracted_data = {}
            field_confidences = {}
            errors = []
            warnings = []

            # Required fields for IRPF
            required_fields = [
                "nif", "nombre_completo", "ejercicio", "base_imponible", "tipo_gravamen"
            ]

            # Extract each field
            for field_name, patterns in self.patterns.items():
                value, confidence = await self._extract_field(
                    processed_text,
                    field_name,
                    patterns,
                    required=field_name in required_fields
                )

                if value:
                    # Post-process value based on field type
                    processed_value = self._post_process_field(field_name, value)
                    extracted_data[field_name] = processed_value
                    field_confidences[field_name] = confidence

                    logger.debug(f"Extracted {field_name}: {processed_value} (confidence: {confidence:.3f})")
                elif field_name in required_fields:
                    errors.append(f"Required field '{field_name}' not found")

            # Validate extracted data
            validation_errors = self._validate_irpf_data(extracted_data)
            errors.extend(validation_errors)

            # Calculate overall confidence
            overall_confidence = self._calculate_overall_confidence(field_confidences, required_fields)

            # Processing time
            processing_time = (datetime.now() - start_time).total_seconds() * 1000

            result = ExtractionResult(
                success=len(extracted_data) > 0 and len(errors) == 0,
                data=extracted_data,
                confidence=overall_confidence,
                field_confidences=field_confidences,
                processing_time_ms=int(processing_time),
                errors=errors,
                warnings=warnings,
                metadata={
                    "document_type": "declaration_irpf",
                    "extractor": "IRPFExtractor",
                    "text_length": len(ocr_text),
                    "fields_extracted": len(extracted_data),
                    "required_fields_found": sum(1 for f in required_fields if f in extracted_data),
                    "total_required": len(required_fields)
                }
            )

            logger.info(f"IRPF extraction completed in {processing_time:.2f}ms with confidence {overall_confidence:.3f}")
            return result

        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.error(f"IRPF extraction failed: {e}")
            return ExtractionResult(
                success=False,
                processing_time_ms=int(processing_time),
                errors=[f"Extraction error: {str(e)}"]
            )

    def _post_process_field(self, field_name: str, value: str) -> Any:
        """Post-process extracted field value based on type"""

        # Currency fields
        if any(keyword in field_name for keyword in ["rendimientos", "base", "cuota", "deducc", "resultado"]):
            normalized = self._normalize_currency(value)
            return normalized if normalized is not None else value

        # Percentage fields
        if "tipo" in field_name or "gravamen" in field_name:
            normalized = self._normalize_percentage(value)
            return normalized if normalized is not None else value

        # Default: return trimmed string
        return value.strip()

    def _validate_irpf_data(self, data: Dict[str, Any]) -> List[str]:
        """Validate IRPF-specific business rules"""
        errors = []

        # NIF format validation
        if "nif" in data:
            nif = data["nif"]
            if not self._validate_nif_format(nif):
                errors.append(f"Invalid NIF format: {nif}")

        # Ejercicio validation
        if "ejercicio" in data:
            ejercicio = data["ejercicio"]
            try:
                year = int(ejercicio)
                current_year = datetime.now().year
                if year < 2000 or year > current_year:
                    errors.append(f"Invalid ejercicio year: {year}")
            except:
                errors.append(f"Invalid ejercicio format: {ejercicio}")

        # Validate tipo gravamen (should be between 0 and 50%)
        if "tipo_gravamen" in data:
            tipo = data["tipo_gravamen"]
            try:
                tipo_float = float(tipo)
                if tipo_float < 0 or tipo_float > 50:
                    errors.append(f"Invalid tipo gravamen: {tipo}% (must be 0-50)")
            except:
                errors.append(f"Invalid tipo gravamen format: {tipo}")

        # Validate base imponible is positive
        if "base_imponible" in data:
            base = data["base_imponible"]
            try:
                base_float = float(base)
                if base_float < 0:
                    errors.append(f"Invalid base imponible: {base} (cannot be negative)")
            except:
                errors.append(f"Invalid base imponible format: {base}")

        return errors

    def _validate_nif_format(self, nif: str) -> bool:
        """Validate Spanish NIF format (8 digits + letter)"""
        import re
        return bool(re.match(r'^\d{8}[A-Z]$', nif))


# Singleton instance
irpf_extractor = IRPFExtractor()
