"""
IVA (Impuesto sobre el Valor Añadido) Extractor
Extracts structured data from IVA declaration documents

Author: Claude Code
Date: 2025-11-13
Version: 2.0 - Specialized fiscal declaration extractor
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from loguru import logger

from app.modules.documents.extractors.base import BaseExtractor, ExtractionResult


class IVAExtractor(BaseExtractor):
    """
    Extractor for IVA (VAT) declaration documents

    Supports 3 regimes:
    - Régimen General (01-03): Base Imponible, Tipo %, Cuota
    - Régimen Reducido 1 (04-06): Base Imponible, Tipo %, Cuota
    - Régimen Reducido 2 (07-09): Base Imponible, Tipo %, Cuota
    - Otros datos: NIF, Empresa, Ejercicio, Periodo, Fecha

    Total: 14 critical fields
    """

    def _initialize_patterns(self) -> Dict[str, List[str]]:
        """Initialize IVA-specific extraction patterns"""
        return {
            # Identificación
            "nif": [
                r"N\.?I\.?F\.?\s*:?\s*(\d{8}[A-Z])",
                r"NIF\s+(\d{8}[A-Z])",
                r"identificaci[oó]n\s+fiscal\s*:?\s*(\d{8}[A-Z])"
            ],
            "empresa": [
                r"(?:representaci[oó]n de la empresa|empresa)\s*:?\s*([A-Z][A-Za-z\s&,.]+)",
                r"Don/D[ñn]a\s+(.+?)\s+en nombre",
                r"empresa\s*:?\s*([A-Z][A-Za-z\s&,.]{3,})"
            ],
            "ejercicio": [
                r"Ejercicio\s*:?\s*(20\d{2})",
                r"A[ñn]o\s*:?\s*(20\d{2})",
                r"ejercicio\s+fiscal\s*:?\s*(20\d{2})"
            ],
            "periodo": [
                r"Periodo\s*:?\s*([0-9]{1,2}T?|[0-9]{1,2}|T[1-4]|[1-4]T)",
                r"Per[ií]odo\s*:?\s*([0-9]{1,2}T?|T[1-4])",
                r"trimestre\s*:?\s*([1-4]|[1-4]T|T[1-4])"
            ],
            "fecha": [
                r"Fecha\s*:?\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})",
                r"fecha\s+de\s+presentaci[oó]n\s*:?\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})"
            ],
            "auto_liquidacion_num": [
                r"Auto-liquidaci[oó]n\s+N[°º]\s*:?\s*([A-Z0-9\-]+)",
                r"Autoliquidaci[oó]n\s*:?\s*([A-Z0-9\-]+)",
                r"N[°º]\s+autoliquidaci[oó]n\s*:?\s*([A-Z0-9\-]+)"
            ],

            # Régimen General (01-03)
            "base_imponible_general": [
                r"01\s+Base\s+Imponible[^:]*:?\s*([0-9.,]+)",
                r"R[eé]gimen\s+General\s+Base[^:]*:?\s*([0-9.,]+)",
                r"Base\s+Imponible\s+General[^:]*:?\s*([0-9.,]+)"
            ],
            "tipo_general": [
                r"02\s+Tipo\s+\(%\)[^:]*:?\s*([0-9.,]+)%?",
                r"R[eé]gimen\s+General\s+Tipo[^:]*:?\s*([0-9.,]+)%?",
                r"Tipo\s+General[^:]*:?\s*([0-9.,]+)%?"
            ],
            "cuota_general": [
                r"03\s+Cuota[^:]*:?\s*([0-9.,]+)",
                r"R[eé]gimen\s+General\s+Cuota[^:]*:?\s*([0-9.,]+)",
                r"Cuota\s+General[^:]*:?\s*([0-9.,]+)"
            ],

            # Régimen Reducido 1 (04-06)
            "base_imponible_reducido1": [
                r"04\s+Base\s+Imponible[^:]*:?\s*([0-9.,]+)",
                r"R[eé]gimen\s+Reducido\s+1\s+Base[^:]*:?\s*([0-9.,]+)",
                r"Base\s+Reducido\s+1[^:]*:?\s*([0-9.,]+)"
            ],
            "tipo_reducido1": [
                r"05\s+Tipo\s+\(%\)[^:]*:?\s*([0-9.,]+)%?",
                r"R[eé]gimen\s+Reducido\s+1\s+Tipo[^:]*:?\s*([0-9.,]+)%?",
                r"Tipo\s+Reducido\s+1[^:]*:?\s*([0-9.,]+)%?"
            ],
            "cuota_reducido1": [
                r"06\s+Cuota[^:]*:?\s*([0-9.,]+)",
                r"R[eé]gimen\s+Reducido\s+1\s+Cuota[^:]*:?\s*([0-9.,]+)",
                r"Cuota\s+Reducido\s+1[^:]*:?\s*([0-9.,]+)"
            ],

            # Régimen Reducido 2 (07-09)
            "base_imponible_reducido2": [
                r"07\s+Base\s+Imponible[^:]*:?\s*([0-9.,]+)",
                r"R[eé]gimen\s+Reducido\s+2\s+Base[^:]*:?\s*([0-9.,]+)",
                r"Base\s+Reducido\s+2[^:]*:?\s*([0-9.,]+)"
            ],
            "tipo_reducido2": [
                r"08\s+Tipo\s+\(%\)[^:]*:?\s*([0-9.,]+)%?",
                r"R[eé]gimen\s+Reducido\s+2\s+Tipo[^:]*:?\s*([0-9.,]+)%?",
                r"Tipo\s+Reducido\s+2[^:]*:?\s*([0-9.,]+)%?"
            ],
            "cuota_reducido2": [
                r"09\s+Cuota[^:]*:?\s*([0-9.,]+)",
                r"R[eé]gimen\s+Reducido\s+2\s+Cuota[^:]*:?\s*([0-9.,]+)",
                r"Cuota\s+Reducido\s+2[^:]*:?\s*([0-9.,]+)"
            ],

            # Total a ingresar
            "total_ingresar": [
                r"Total\s+a\s+ingresar[^:]*:?\s*([0-9.,]+)",
                r"cantidad\s+ingresada[^:]*:?\s*([0-9.,]+)",
                r"importe\s+total[^:]*:?\s*([0-9.,]+)"
            ]
        }

    async def extract(self, ocr_text: str, metadata: Optional[Dict[str, Any]] = None) -> ExtractionResult:
        """
        Extract structured data from IVA declaration OCR text

        Args:
            ocr_text: OCR extracted text
            metadata: Optional metadata (OCR confidence, provider)

        Returns:
            ExtractionResult with IVA fields and confidence scores
        """
        start_time = datetime.now()

        try:
            logger.info("Starting IVA declaration extraction")

            # Preprocess text
            processed_text = self._preprocess_text(ocr_text)

            # Extract all fields
            extracted_data = {}
            field_confidences = {}
            errors = []
            warnings = []

            # Required fields for IVA
            required_fields = [
                "nif", "empresa", "ejercicio", "periodo",
                "base_imponible_general", "tipo_general", "cuota_general"
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
            validation_errors = self._validate_iva_data(extracted_data)
            errors.extend(validation_errors)

            # Calculate derived fields
            if "base_imponible_general" in extracted_data and "tipo_general" in extracted_data:
                # Verify cuota calculation
                base = self._normalize_currency(str(extracted_data["base_imponible_general"]))
                tipo = self._normalize_percentage(str(extracted_data["tipo_general"]))

                if base and tipo:
                    calculated_cuota = base * (tipo / 100)
                    extracted_cuota = self._normalize_currency(str(extracted_data.get("cuota_general", "0")))

                    if extracted_cuota and abs(calculated_cuota - extracted_cuota) > 0.01:
                        warnings.append(
                            f"Cuota general mismatch: calculated {calculated_cuota:.2f} vs extracted {extracted_cuota:.2f}"
                        )

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
                    "document_type": "declaration_iva",
                    "extractor": "IVAExtractor",
                    "text_length": len(ocr_text),
                    "fields_extracted": len(extracted_data),
                    "required_fields_found": sum(1 for f in required_fields if f in extracted_data),
                    "total_required": len(required_fields)
                }
            )

            logger.info(f"IVA extraction completed in {processing_time:.2f}ms with confidence {overall_confidence:.3f}")
            return result

        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.error(f"IVA extraction failed: {e}")
            return ExtractionResult(
                success=False,
                processing_time_ms=int(processing_time),
                errors=[f"Extraction error: {str(e)}"]
            )

    def _post_process_field(self, field_name: str, value: str) -> Any:
        """Post-process extracted field value based on type"""

        # Currency fields
        if any(keyword in field_name for keyword in ["base", "cuota", "total", "importe"]):
            normalized = self._normalize_currency(value)
            return normalized if normalized is not None else value

        # Percentage fields
        if "tipo" in field_name:
            normalized = self._normalize_percentage(value)
            return normalized if normalized is not None else value

        # Date fields
        if "fecha" in field_name:
            # Keep as string, but could parse to datetime if needed
            return value.strip()

        # Periodo normalization
        if field_name == "periodo":
            # Normalize to format: "1T", "2T", "3T", "4T" or "01", "02", ..., "12"
            periodo = value.strip().upper()
            if periodo.isdigit():
                return periodo.zfill(2) if int(periodo) <= 12 else periodo
            return periodo

        # Default: return trimmed string
        return value.strip()

    def _validate_iva_data(self, data: Dict[str, Any]) -> List[str]:
        """Validate IVA-specific business rules"""
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
                if year < 2000 or year > current_year + 1:
                    errors.append(f"Invalid ejercicio year: {year}")
            except:
                errors.append(f"Invalid ejercicio format: {ejercicio}")

        # Periodo validation
        if "periodo" in data:
            periodo = str(data["periodo"]).upper()
            valid_periodos = ["1T", "2T", "3T", "4T"] + [f"{i:02d}" for i in range(1, 13)]
            if periodo not in valid_periodos:
                errors.append(f"Invalid periodo: {periodo}")

        # Validate tipo percentages (should be between 0 and 100)
        for field in ["tipo_general", "tipo_reducido1", "tipo_reducido2"]:
            if field in data:
                tipo = data[field]
                try:
                    tipo_float = float(tipo)
                    if tipo_float < 0 or tipo_float > 100:
                        errors.append(f"Invalid {field}: {tipo}% (must be 0-100)")
                except:
                    errors.append(f"Invalid {field} format: {tipo}")

        return errors

    def _validate_nif_format(self, nif: str) -> bool:
        """Validate Spanish NIF format (8 digits + letter)"""
        import re
        return bool(re.match(r'^\d{8}[A-Z]$', nif))


# Singleton instance
iva_extractor = IVAExtractor()
