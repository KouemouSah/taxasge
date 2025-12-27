"""
Gemini Document Processor for Service Requests.

Production-ready document classification, extraction, and RISK ANALYSIS using:
1. Google Vertex AI Gemini 2.0 (primary) - Confidence threshold: 70%
2. Tesseract OCR fallback - Confidence threshold: 60%

RISK ANALYSIS CAPABILITIES:
- Document duplication detection (hash-based)
- Document type mismatch detection
- Identity consistency across documents
- Amount range validation
- Coherence and fraud detection
- Document expiry checks
- Data quality assessment

This processor is STANDALONE and only imports:
- Vertex AI SDK (Gemini)
- ocr_service from documents module (utility service)
- schema_loader from this module

Author: Claude Code
Date: 2025-12-27
"""

import asyncio
import hashlib
import json
import re
import time
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, date
from enum import Enum
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


# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTS & ENUMS
# ═══════════════════════════════════════════════════════════════════════════════

# Confidence thresholds
GEMINI_CONFIDENCE_THRESHOLD = 0.70  # 70% - Accept Gemini extraction
TESSERACT_CONFIDENCE_THRESHOLD = 0.60  # 60% - Accept Tesseract extraction

# Risk thresholds
RISK_SCORE_LOW = 30
RISK_SCORE_MEDIUM = 60
RISK_SCORE_HIGH = 80


class RiskLevel(str, Enum):
    """Risk level enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskFactorCode(str, Enum):
    """Standardized risk factor codes"""
    # Document Validity
    DOC_EXPIRED = "DOC_EXPIRED"
    DOC_NEAR_EXPIRY = "DOC_NEAR_EXPIRY"
    DOC_NOT_YET_VALID = "DOC_NOT_YET_VALID"

    # Document Quality
    LOW_IMAGE_QUALITY = "LOW_IMAGE_QUALITY"
    UNREADABLE_FIELDS = "UNREADABLE_FIELDS"
    INCOMPLETE_DOCUMENT = "INCOMPLETE_DOCUMENT"

    # Document Type
    DOC_TYPE_MISMATCH = "DOC_TYPE_MISMATCH"
    UNEXPECTED_FORMAT = "UNEXPECTED_FORMAT"

    # Duplication
    DUPLICATE_DOCUMENT = "DUPLICATE_DOCUMENT"
    SIMILAR_DOCUMENT = "SIMILAR_DOCUMENT"
    REUSED_ACROSS_REQUESTS = "REUSED_ACROSS_REQUESTS"

    # Identity Consistency
    NAME_MISMATCH = "NAME_MISMATCH"
    ID_NUMBER_MISMATCH = "ID_NUMBER_MISMATCH"
    BIRTHDATE_MISMATCH = "BIRTHDATE_MISMATCH"
    NATIONALITY_MISMATCH = "NATIONALITY_MISMATCH"
    PHOTO_MISMATCH = "PHOTO_MISMATCH"

    # Data Validation
    INVALID_DATE_FORMAT = "INVALID_DATE_FORMAT"
    FUTURE_BIRTHDATE = "FUTURE_BIRTHDATE"
    IMPOSSIBLE_AGE = "IMPOSSIBLE_AGE"
    INVALID_ID_FORMAT = "INVALID_ID_FORMAT"

    # Amount Validation
    AMOUNT_OUT_OF_RANGE = "AMOUNT_OUT_OF_RANGE"
    SUSPICIOUS_AMOUNT = "SUSPICIOUS_AMOUNT"
    CURRENCY_MISMATCH = "CURRENCY_MISMATCH"

    # Fraud Indicators
    DIGITAL_MANIPULATION = "DIGITAL_MANIPULATION"
    INCONSISTENT_FONTS = "INCONSISTENT_FONTS"
    ALTERED_DATES = "ALTERED_DATES"
    SUSPICIOUS_PATTERNS = "SUSPICIOUS_PATTERNS"
    KNOWN_FRAUD_TEMPLATE = "KNOWN_FRAUD_TEMPLATE"

    # Coherence
    LOGICAL_INCONSISTENCY = "LOGICAL_INCONSISTENCY"
    CROSS_FIELD_MISMATCH = "CROSS_FIELD_MISMATCH"
    TEMPORAL_ANOMALY = "TEMPORAL_ANOMALY"

    # Missing Data
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    MISSING_SIGNATURE = "MISSING_SIGNATURE"
    MISSING_STAMP = "MISSING_STAMP"


# Risk factor severity mapping
RISK_FACTOR_SEVERITY: Dict[RiskFactorCode, str] = {
    # Critical (immediate rejection)
    RiskFactorCode.DOC_TYPE_MISMATCH: "critical",
    RiskFactorCode.DUPLICATE_DOCUMENT: "critical",
    RiskFactorCode.DIGITAL_MANIPULATION: "critical",
    RiskFactorCode.KNOWN_FRAUD_TEMPLATE: "critical",

    # High (requires manual review)
    RiskFactorCode.DOC_EXPIRED: "high",
    RiskFactorCode.NAME_MISMATCH: "high",
    RiskFactorCode.ID_NUMBER_MISMATCH: "high",
    RiskFactorCode.ALTERED_DATES: "high",
    RiskFactorCode.SUSPICIOUS_PATTERNS: "high",
    RiskFactorCode.FUTURE_BIRTHDATE: "high",
    RiskFactorCode.IMPOSSIBLE_AGE: "high",
    RiskFactorCode.REUSED_ACROSS_REQUESTS: "high",

    # Medium (warning)
    RiskFactorCode.DOC_NEAR_EXPIRY: "medium",
    RiskFactorCode.LOW_IMAGE_QUALITY: "medium",
    RiskFactorCode.UNREADABLE_FIELDS: "medium",
    RiskFactorCode.BIRTHDATE_MISMATCH: "medium",
    RiskFactorCode.AMOUNT_OUT_OF_RANGE: "medium",
    RiskFactorCode.SUSPICIOUS_AMOUNT: "medium",
    RiskFactorCode.INCONSISTENT_FONTS: "medium",
    RiskFactorCode.LOGICAL_INCONSISTENCY: "medium",
    RiskFactorCode.CROSS_FIELD_MISMATCH: "medium",
    RiskFactorCode.SIMILAR_DOCUMENT: "medium",

    # Low (informational)
    RiskFactorCode.DOC_NOT_YET_VALID: "low",
    RiskFactorCode.INCOMPLETE_DOCUMENT: "low",
    RiskFactorCode.UNEXPECTED_FORMAT: "low",
    RiskFactorCode.NATIONALITY_MISMATCH: "low",
    RiskFactorCode.INVALID_DATE_FORMAT: "low",
    RiskFactorCode.CURRENCY_MISMATCH: "low",
    RiskFactorCode.TEMPORAL_ANOMALY: "low",
    RiskFactorCode.MISSING_REQUIRED_FIELD: "low",
    RiskFactorCode.MISSING_SIGNATURE: "low",
    RiskFactorCode.MISSING_STAMP: "low",
    RiskFactorCode.INVALID_ID_FORMAT: "low",
    RiskFactorCode.PHOTO_MISMATCH: "low",
}

# Document type mapping (expected document code -> acceptable detected types)
DOCUMENT_TYPE_MAPPING: Dict[str, List[str]] = {
    "dip_gq": ["dni", "dip", "documento_identidad", "carnet_identidad", "cedula"],
    "pasaporte_gq": ["pasaporte", "passport"],
    "pasaporte_extranjero": ["pasaporte", "passport", "travel_document"],
    "certificado_nacimiento": ["acta_nacimiento", "partida_nacimiento", "certificado_nacimiento", "birth_certificate"],
    "certificado_matrimonio": ["acta_matrimonio", "certificado_matrimonio", "marriage_certificate"],
    "certificado_medico": ["certificado_medico", "medical_certificate", "informe_medico"],
    "justificante_pago": ["recibo", "comprobante_pago", "justificante", "receipt"],
    "foto_carnet": ["foto", "fotografia", "photo"],
    "certificado_residencia": ["certificado_residencia", "residence_certificate"],
    "contrato_trabajo": ["contrato", "contract", "contrato_trabajo"],
    "declaracion_renta": ["declaracion", "tax_declaration", "irpf"],
    "extracto_bancario": ["extracto", "bank_statement", "estado_cuenta"],
}

# Amount ranges by document/service type (in XAF)
AMOUNT_RANGES: Dict[str, Tuple[float, float]] = {
    "justificante_pago": (1000, 50_000_000),  # 1K - 50M XAF
    "extracto_bancario": (0, 1_000_000_000),  # 0 - 1B XAF
    "declaracion_renta": (0, 500_000_000),  # 0 - 500M XAF
    "default": (0, 100_000_000),  # Default range
}


# ═══════════════════════════════════════════════════════════════════════════════
# DOCUMENT HASH REGISTRY (In-Memory for now, can be moved to Redis/DB)
# ═══════════════════════════════════════════════════════════════════════════════

class DocumentHashRegistry:
    """
    Registry for tracking document hashes to detect duplicates.

    In production, this should be backed by Redis or PostgreSQL for persistence
    and scalability across multiple instances.
    """

    def __init__(self):
        # Structure: {hash: {"request_id": uuid, "document_code": str, "timestamp": datetime}}
        self._hashes: Dict[str, Dict[str, Any]] = {}
        # Structure: {request_id: {document_code: hash}}
        self._request_documents: Dict[str, Dict[str, str]] = {}

    def compute_hash(self, content: bytes) -> str:
        """Compute SHA-256 hash of document content"""
        return hashlib.sha256(content).hexdigest()

    def register_document(
        self,
        content: bytes,
        request_id: str,
        document_code: str,
        user_id: str
    ) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Register a document hash and check for duplicates.

        Returns:
            Tuple of (is_duplicate, duplicate_info)
        """
        doc_hash = self.compute_hash(content)

        # Check for exact duplicate
        if doc_hash in self._hashes:
            existing = self._hashes[doc_hash]
            return True, {
                "original_request_id": existing["request_id"],
                "original_document_code": existing["document_code"],
                "original_timestamp": existing["timestamp"],
                "original_user_id": existing.get("user_id"),
                "is_same_request": existing["request_id"] == request_id,
                "is_same_user": existing.get("user_id") == user_id
            }

        # Register new hash
        self._hashes[doc_hash] = {
            "request_id": request_id,
            "document_code": document_code,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Track by request
        if request_id not in self._request_documents:
            self._request_documents[request_id] = {}
        self._request_documents[request_id][document_code] = doc_hash

        return False, None

    def get_request_documents(self, request_id: str) -> Dict[str, str]:
        """Get all document hashes for a request"""
        return self._request_documents.get(request_id, {})

    def clear_request(self, request_id: str):
        """Clear all documents for a request (e.g., on rejection)"""
        if request_id in self._request_documents:
            for doc_hash in self._request_documents[request_id].values():
                if doc_hash in self._hashes:
                    del self._hashes[doc_hash]
            del self._request_documents[request_id]


# Global registry instance
_document_hash_registry = DocumentHashRegistry()


# ═══════════════════════════════════════════════════════════════════════════════
# RISK ANALYZER
# ═══════════════════════════════════════════════════════════════════════════════

class RiskAnalyzer:
    """
    Comprehensive risk analysis for documents.

    Analyzes:
    - Document validity (expiry, format)
    - Identity consistency across documents
    - Data coherence and logical checks
    - Fraud indicators
    - Amount validation
    - Duplication detection
    """

    def __init__(self):
        self.hash_registry = _document_hash_registry

    def analyze(
        self,
        extraction: Dict[str, Any],
        document_code: str,
        detected_type: str,
        content: bytes,
        request_id: str,
        user_id: str,
        existing_documents: Optional[Dict[str, Dict[str, Any]]] = None,
        form_data: Optional[Dict[str, Any]] = None,
        gemini_risk_hints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Perform comprehensive risk analysis.

        Args:
            extraction: Extracted document data
            document_code: Expected document type code
            detected_type: AI-detected document type
            content: Raw document bytes
            request_id: Service request ID
            user_id: User ID
            existing_documents: Previously uploaded documents for this request
            form_data: User-submitted form data
            gemini_risk_hints: Risk hints from Gemini analysis

        Returns:
            Complete risk analysis result
        """
        risk_factors: List[Dict[str, Any]] = []

        # 1. Document Type Mismatch Detection
        type_risk = self._check_document_type_mismatch(document_code, detected_type)
        if type_risk:
            risk_factors.append(type_risk)

        # 2. Duplication Detection
        dup_risk = self._check_duplication(content, request_id, document_code, user_id)
        if dup_risk:
            risk_factors.append(dup_risk)

        # 3. Document Validity (Expiry)
        validity_risks = self._check_document_validity(extraction)
        risk_factors.extend(validity_risks)

        # 4. Identity Consistency
        if existing_documents:
            identity_risks = self._check_identity_consistency(extraction, existing_documents)
            risk_factors.extend(identity_risks)

        # 5. Form Data Consistency
        if form_data:
            form_risks = self._check_form_consistency(extraction, form_data)
            risk_factors.extend(form_risks)

        # 6. Data Validation
        data_risks = self._check_data_validation(extraction, document_code)
        risk_factors.extend(data_risks)

        # 7. Amount Validation
        amount_risks = self._check_amount_validation(extraction, document_code)
        risk_factors.extend(amount_risks)

        # 8. Coherence Checks
        coherence_risks = self._check_coherence(extraction)
        risk_factors.extend(coherence_risks)

        # 9. Gemini-detected fraud indicators
        if gemini_risk_hints:
            fraud_risks = self._process_gemini_risk_hints(gemini_risk_hints)
            risk_factors.extend(fraud_risks)

        # Calculate overall risk score and level
        risk_score, risk_level = self._calculate_risk_score(risk_factors)

        # Generate recommendations
        recommendations = self._generate_recommendations(risk_factors, risk_level)

        # Determine if document should be rejected or needs review
        requires_rejection = any(
            rf["severity"] == "critical" for rf in risk_factors
        )
        requires_review = risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL] or any(
            rf["severity"] == "high" for rf in risk_factors
        )

        return {
            "risk_level": risk_level.value,
            "risk_score": risk_score,
            "risk_factors": risk_factors,
            "recommendations": recommendations,
            "requires_rejection": requires_rejection,
            "requires_review": requires_review,
            "analysis_timestamp": datetime.utcnow().isoformat(),
            "factors_count": {
                "critical": sum(1 for rf in risk_factors if rf["severity"] == "critical"),
                "high": sum(1 for rf in risk_factors if rf["severity"] == "high"),
                "medium": sum(1 for rf in risk_factors if rf["severity"] == "medium"),
                "low": sum(1 for rf in risk_factors if rf["severity"] == "low")
            }
        }

    def _check_document_type_mismatch(
        self,
        expected_code: str,
        detected_type: str
    ) -> Optional[Dict[str, Any]]:
        """Check if detected document type matches expected type"""
        if not detected_type:
            return None

        detected_lower = detected_type.lower().strip()
        expected_lower = expected_code.lower().strip()

        # Get acceptable types for expected document
        acceptable_types = DOCUMENT_TYPE_MAPPING.get(expected_lower, [expected_lower])

        # Check if detected type is acceptable
        is_match = any(
            acc_type in detected_lower or detected_lower in acc_type
            for acc_type in acceptable_types
        )

        if not is_match:
            return {
                "code": RiskFactorCode.DOC_TYPE_MISMATCH.value,
                "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.DOC_TYPE_MISMATCH],
                "message": f"Document type mismatch: expected '{expected_code}', detected '{detected_type}'",
                "detail": {
                    "expected": expected_code,
                    "detected": detected_type,
                    "acceptable_types": acceptable_types
                },
                "action": "reject"
            }

        return None

    def _check_duplication(
        self,
        content: bytes,
        request_id: str,
        document_code: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Check for document duplication"""
        is_duplicate, dup_info = self.hash_registry.register_document(
            content, request_id, document_code, user_id
        )

        if is_duplicate:
            if dup_info["is_same_request"]:
                # Same document uploaded twice for same requirement
                return {
                    "code": RiskFactorCode.DUPLICATE_DOCUMENT.value,
                    "severity": "medium",
                    "message": "Same document uploaded again for this requirement",
                    "detail": dup_info,
                    "action": "warn"
                }
            elif dup_info["is_same_user"]:
                # Same document used in different request by same user
                return {
                    "code": RiskFactorCode.REUSED_ACROSS_REQUESTS.value,
                    "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.REUSED_ACROSS_REQUESTS],
                    "message": "Same document was used in a different service request",
                    "detail": dup_info,
                    "action": "review"
                }
            else:
                # Document used by different user - potential fraud
                return {
                    "code": RiskFactorCode.DUPLICATE_DOCUMENT.value,
                    "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.DUPLICATE_DOCUMENT],
                    "message": "This document was previously submitted by another user",
                    "detail": {
                        "original_request": dup_info["original_request_id"],
                        "original_date": dup_info["original_timestamp"]
                    },
                    "action": "reject"
                }

        return None

    def _check_document_validity(
        self,
        extraction: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Check document validity dates"""
        risks = []
        today = date.today()

        # Check expiry date
        expiry_fields = ["fecha_caducidad", "fecha_expiracion", "expiry_date", "valid_until", "vigencia_hasta"]
        for field in expiry_fields:
            if field in extraction and extraction[field]:
                try:
                    expiry = self._parse_date(extraction[field])
                    if expiry:
                        if expiry < today:
                            risks.append({
                                "code": RiskFactorCode.DOC_EXPIRED.value,
                                "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.DOC_EXPIRED],
                                "message": f"Document expired on {expiry.isoformat()}",
                                "detail": {"expiry_date": expiry.isoformat(), "days_expired": (today - expiry).days},
                                "action": "reject"
                            })
                        elif (expiry - today).days < 90:
                            risks.append({
                                "code": RiskFactorCode.DOC_NEAR_EXPIRY.value,
                                "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.DOC_NEAR_EXPIRY],
                                "message": f"Document expires soon: {expiry.isoformat()}",
                                "detail": {"expiry_date": expiry.isoformat(), "days_remaining": (expiry - today).days},
                                "action": "warn"
                            })
                except Exception as e:
                    logger.warning(f"Error parsing expiry date: {e}")

        # Check issue date (not in future)
        issue_fields = ["fecha_expedicion", "fecha_emision", "issue_date", "date_issued"]
        for field in issue_fields:
            if field in extraction and extraction[field]:
                try:
                    issue_date = self._parse_date(extraction[field])
                    if issue_date and issue_date > today:
                        risks.append({
                            "code": RiskFactorCode.DOC_NOT_YET_VALID.value,
                            "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.DOC_NOT_YET_VALID],
                            "message": f"Document has future issue date: {issue_date.isoformat()}",
                            "detail": {"issue_date": issue_date.isoformat()},
                            "action": "review"
                        })
                except Exception as e:
                    logger.warning(f"Error parsing issue date: {e}")

        return risks

    def _check_identity_consistency(
        self,
        extraction: Dict[str, Any],
        existing_documents: Dict[str, Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Check identity consistency across documents"""
        risks = []

        # Fields to compare
        identity_fields = {
            "name": ["nombres", "nombre", "first_name", "given_name"],
            "surname": ["apellidos", "apellido", "last_name", "surname"],
            "full_name": ["nombre_completo", "full_name"],
            "id_number": ["numero_documento", "dni", "nif", "id_number", "document_number"],
            "birthdate": ["fecha_nacimiento", "birthdate", "date_of_birth"],
            "nationality": ["nacionalidad", "nationality"]
        }

        for doc_code, doc_data in existing_documents.items():
            existing_extraction = doc_data.get("extraction", {})

            for field_type, field_names in identity_fields.items():
                current_value = None
                existing_value = None

                # Find current value
                for fname in field_names:
                    if fname in extraction and extraction[fname]:
                        current_value = str(extraction[fname]).strip().upper()
                        break

                # Find existing value
                for fname in field_names:
                    if fname in existing_extraction and existing_extraction[fname]:
                        existing_value = str(existing_extraction[fname]).strip().upper()
                        break

                # Compare if both exist
                if current_value and existing_value and current_value != existing_value:
                    risk_code = {
                        "name": RiskFactorCode.NAME_MISMATCH,
                        "surname": RiskFactorCode.NAME_MISMATCH,
                        "full_name": RiskFactorCode.NAME_MISMATCH,
                        "id_number": RiskFactorCode.ID_NUMBER_MISMATCH,
                        "birthdate": RiskFactorCode.BIRTHDATE_MISMATCH,
                        "nationality": RiskFactorCode.NATIONALITY_MISMATCH
                    }.get(field_type, RiskFactorCode.CROSS_FIELD_MISMATCH)

                    risks.append({
                        "code": risk_code.value,
                        "severity": RISK_FACTOR_SEVERITY[risk_code],
                        "message": f"{field_type.title()} mismatch with {doc_code}",
                        "detail": {
                            "field": field_type,
                            "current_value": current_value,
                            "existing_value": existing_value,
                            "compared_with": doc_code
                        },
                        "action": "review"
                    })

        return risks

    def _check_form_consistency(
        self,
        extraction: Dict[str, Any],
        form_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Check consistency between extracted data and form data"""
        risks = []

        # Mapping of form fields to extraction fields
        field_mapping = {
            "nombre": ["nombres", "nombre", "first_name"],
            "apellido": ["apellidos", "apellido", "last_name"],
            "dni": ["numero_documento", "dni", "id_number"],
            "fecha_nacimiento": ["fecha_nacimiento", "birthdate"]
        }

        for form_field, extraction_fields in field_mapping.items():
            if form_field in form_data and form_data[form_field]:
                form_value = str(form_data[form_field]).strip().upper()

                for ext_field in extraction_fields:
                    if ext_field in extraction and extraction[ext_field]:
                        ext_value = str(extraction[ext_field]).strip().upper()

                        # Allow partial match for names
                        if form_field in ["nombre", "apellido"]:
                            if form_value not in ext_value and ext_value not in form_value:
                                risks.append({
                                    "code": RiskFactorCode.CROSS_FIELD_MISMATCH.value,
                                    "severity": "medium",
                                    "message": f"Form {form_field} doesn't match document",
                                    "detail": {
                                        "form_value": form_value,
                                        "document_value": ext_value
                                    },
                                    "action": "review"
                                })
                        else:
                            if form_value != ext_value:
                                risks.append({
                                    "code": RiskFactorCode.CROSS_FIELD_MISMATCH.value,
                                    "severity": "medium",
                                    "message": f"Form {form_field} doesn't match document",
                                    "detail": {
                                        "form_value": form_value,
                                        "document_value": ext_value
                                    },
                                    "action": "review"
                                })
                        break

        return risks

    def _check_data_validation(
        self,
        extraction: Dict[str, Any],
        document_code: str
    ) -> List[Dict[str, Any]]:
        """Validate extracted data formats and logical constraints"""
        risks = []
        today = date.today()

        # Birthdate validation
        birthdate_fields = ["fecha_nacimiento", "birthdate", "date_of_birth"]
        for field in birthdate_fields:
            if field in extraction and extraction[field]:
                try:
                    birthdate = self._parse_date(extraction[field])
                    if birthdate:
                        if birthdate > today:
                            risks.append({
                                "code": RiskFactorCode.FUTURE_BIRTHDATE.value,
                                "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.FUTURE_BIRTHDATE],
                                "message": "Birthdate is in the future",
                                "detail": {"birthdate": birthdate.isoformat()},
                                "action": "reject"
                            })
                        else:
                            age = (today - birthdate).days // 365
                            if age < 0 or age > 150:
                                risks.append({
                                    "code": RiskFactorCode.IMPOSSIBLE_AGE.value,
                                    "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.IMPOSSIBLE_AGE],
                                    "message": f"Impossible age calculated: {age} years",
                                    "detail": {"birthdate": birthdate.isoformat(), "calculated_age": age},
                                    "action": "review"
                                })
                            elif age < 16 and document_code in ["contrato_trabajo", "declaracion_renta"]:
                                risks.append({
                                    "code": RiskFactorCode.LOGICAL_INCONSISTENCY.value,
                                    "severity": "high",
                                    "message": f"Person is {age} years old - too young for this document type",
                                    "detail": {"age": age, "document_type": document_code},
                                    "action": "review"
                                })
                except Exception as e:
                    logger.warning(f"Error validating birthdate: {e}")

        # ID number format validation (GQ DNI format)
        id_fields = ["numero_documento", "dni", "id_number"]
        for field in id_fields:
            if field in extraction and extraction[field]:
                id_value = str(extraction[field]).strip()
                # GQ DNI typically follows patterns like "12345678A" or similar
                if document_code == "dip_gq":
                    if not re.match(r'^[A-Z0-9]{6,12}$', id_value.upper()):
                        risks.append({
                            "code": RiskFactorCode.INVALID_ID_FORMAT.value,
                            "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.INVALID_ID_FORMAT],
                            "message": "ID number format appears invalid",
                            "detail": {"id_value": id_value, "expected_pattern": "6-12 alphanumeric characters"},
                            "action": "review"
                        })

        return risks

    def _check_amount_validation(
        self,
        extraction: Dict[str, Any],
        document_code: str
    ) -> List[Dict[str, Any]]:
        """Validate monetary amounts"""
        risks = []

        amount_fields = ["monto", "importe", "cantidad", "total", "amount", "valor"]
        min_amount, max_amount = AMOUNT_RANGES.get(document_code, AMOUNT_RANGES["default"])

        for field in amount_fields:
            if field in extraction and extraction[field]:
                try:
                    # Parse amount (handle different formats)
                    amount_str = str(extraction[field])
                    amount_str = re.sub(r'[^\d.,]', '', amount_str)
                    amount_str = amount_str.replace(',', '.')
                    amount = float(amount_str)

                    if amount < min_amount or amount > max_amount:
                        risks.append({
                            "code": RiskFactorCode.AMOUNT_OUT_OF_RANGE.value,
                            "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.AMOUNT_OUT_OF_RANGE],
                            "message": f"Amount {amount:,.0f} XAF is outside expected range",
                            "detail": {
                                "amount": amount,
                                "min_expected": min_amount,
                                "max_expected": max_amount,
                                "currency": "XAF"
                            },
                            "action": "review"
                        })

                    # Check for suspicious round numbers (potential fabrication)
                    if amount >= 1_000_000 and amount % 1_000_000 == 0:
                        risks.append({
                            "code": RiskFactorCode.SUSPICIOUS_AMOUNT.value,
                            "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.SUSPICIOUS_AMOUNT],
                            "message": "Suspiciously round amount detected",
                            "detail": {"amount": amount},
                            "action": "review"
                        })

                except (ValueError, TypeError) as e:
                    logger.warning(f"Error parsing amount: {e}")

        return risks

    def _check_coherence(
        self,
        extraction: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Check logical coherence of extracted data"""
        risks = []

        # Check issue date < expiry date
        issue_date = None
        expiry_date = None

        for field in ["fecha_expedicion", "fecha_emision", "issue_date"]:
            if field in extraction and extraction[field]:
                issue_date = self._parse_date(extraction[field])
                break

        for field in ["fecha_caducidad", "fecha_expiracion", "expiry_date"]:
            if field in extraction and extraction[field]:
                expiry_date = self._parse_date(extraction[field])
                break

        if issue_date and expiry_date and issue_date >= expiry_date:
            risks.append({
                "code": RiskFactorCode.TEMPORAL_ANOMALY.value,
                "severity": "high",
                "message": "Issue date is not before expiry date",
                "detail": {
                    "issue_date": issue_date.isoformat(),
                    "expiry_date": expiry_date.isoformat()
                },
                "action": "review"
            })

        # Check birthdate < issue date
        birthdate = None
        for field in ["fecha_nacimiento", "birthdate"]:
            if field in extraction and extraction[field]:
                birthdate = self._parse_date(extraction[field])
                break

        if birthdate and issue_date and birthdate >= issue_date:
            risks.append({
                "code": RiskFactorCode.TEMPORAL_ANOMALY.value,
                "severity": "high",
                "message": "Birthdate is not before document issue date",
                "detail": {
                    "birthdate": birthdate.isoformat(),
                    "issue_date": issue_date.isoformat()
                },
                "action": "review"
            })

        return risks

    def _process_gemini_risk_hints(
        self,
        gemini_hints: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Process fraud/risk indicators detected by Gemini"""
        risks = []

        # Digital manipulation detection
        if gemini_hints.get("digital_manipulation_detected"):
            risks.append({
                "code": RiskFactorCode.DIGITAL_MANIPULATION.value,
                "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.DIGITAL_MANIPULATION],
                "message": "AI detected signs of digital manipulation",
                "detail": gemini_hints.get("manipulation_details", {}),
                "action": "reject"
            })

        # Font inconsistencies
        if gemini_hints.get("inconsistent_fonts"):
            risks.append({
                "code": RiskFactorCode.INCONSISTENT_FONTS.value,
                "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.INCONSISTENT_FONTS],
                "message": "Document shows inconsistent fonts/typography",
                "detail": gemini_hints.get("font_details", {}),
                "action": "review"
            })

        # Suspicious patterns
        if gemini_hints.get("suspicious_patterns"):
            for pattern in gemini_hints["suspicious_patterns"]:
                risks.append({
                    "code": RiskFactorCode.SUSPICIOUS_PATTERNS.value,
                    "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.SUSPICIOUS_PATTERNS],
                    "message": f"Suspicious pattern detected: {pattern.get('description', 'Unknown')}",
                    "detail": pattern,
                    "action": "review"
                })

        # Low quality indicators
        if gemini_hints.get("low_quality"):
            risks.append({
                "code": RiskFactorCode.LOW_IMAGE_QUALITY.value,
                "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.LOW_IMAGE_QUALITY],
                "message": "Document image quality is poor",
                "detail": gemini_hints.get("quality_details", {}),
                "action": "warn"
            })

        # Missing elements
        if gemini_hints.get("missing_signature"):
            risks.append({
                "code": RiskFactorCode.MISSING_SIGNATURE.value,
                "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.MISSING_SIGNATURE],
                "message": "Document appears to be missing a signature",
                "detail": {},
                "action": "review"
            })

        if gemini_hints.get("missing_stamp"):
            risks.append({
                "code": RiskFactorCode.MISSING_STAMP.value,
                "severity": RISK_FACTOR_SEVERITY[RiskFactorCode.MISSING_STAMP],
                "message": "Document appears to be missing an official stamp",
                "detail": {},
                "action": "review"
            })

        return risks

    def _calculate_risk_score(
        self,
        risk_factors: List[Dict[str, Any]]
    ) -> Tuple[int, RiskLevel]:
        """Calculate overall risk score and level"""
        if not risk_factors:
            return 0, RiskLevel.LOW

        # Severity weights
        severity_weights = {
            "critical": 40,
            "high": 25,
            "medium": 10,
            "low": 3
        }

        total_score = sum(
            severity_weights.get(rf["severity"], 5)
            for rf in risk_factors
        )

        # Cap at 100
        total_score = min(100, total_score)

        # Determine level
        if any(rf["severity"] == "critical" for rf in risk_factors):
            level = RiskLevel.CRITICAL
        elif total_score >= RISK_SCORE_HIGH:
            level = RiskLevel.HIGH
        elif total_score >= RISK_SCORE_MEDIUM:
            level = RiskLevel.MEDIUM
        else:
            level = RiskLevel.LOW

        return total_score, level

    def _generate_recommendations(
        self,
        risk_factors: List[Dict[str, Any]],
        risk_level: RiskLevel
    ) -> List[str]:
        """Generate actionable recommendations based on risk factors"""
        recommendations = []

        # Critical issues
        critical_factors = [rf for rf in risk_factors if rf["severity"] == "critical"]
        if critical_factors:
            recommendations.append("URGENT: Document requires immediate rejection or escalation")
            for cf in critical_factors:
                if cf["code"] == RiskFactorCode.DOC_TYPE_MISMATCH.value:
                    recommendations.append(f"Request correct document type: {cf['detail'].get('expected', 'unknown')}")
                elif cf["code"] == RiskFactorCode.DUPLICATE_DOCUMENT.value:
                    recommendations.append("Investigate potential document fraud - same document used by another user")
                elif cf["code"] == RiskFactorCode.DIGITAL_MANIPULATION.value:
                    recommendations.append("Escalate to fraud investigation team")

        # High severity
        high_factors = [rf for rf in risk_factors if rf["severity"] == "high"]
        if high_factors:
            recommendations.append("Manual verification required by agent")
            for hf in high_factors:
                if hf["code"] == RiskFactorCode.DOC_EXPIRED.value:
                    recommendations.append("Request a valid, non-expired document")
                elif hf["code"] == RiskFactorCode.NAME_MISMATCH.value:
                    recommendations.append("Verify identity across all submitted documents")
                elif hf["code"] == RiskFactorCode.ID_NUMBER_MISMATCH.value:
                    recommendations.append("Cross-check ID numbers with official records")

        # Medium severity
        medium_factors = [rf for rf in risk_factors if rf["severity"] == "medium"]
        if medium_factors and not high_factors and not critical_factors:
            recommendations.append("Review flagged items before approval")

        # Expiry warning
        if any(rf["code"] == RiskFactorCode.DOC_NEAR_EXPIRY.value for rf in risk_factors):
            recommendations.append("Document expires soon - consider requesting renewal")

        # Quality issues
        if any(rf["code"] == RiskFactorCode.LOW_IMAGE_QUALITY.value for rf in risk_factors):
            recommendations.append("Request higher quality document scan")

        if not recommendations:
            recommendations.append("No significant risks detected - proceed with standard processing")

        return recommendations

    def _parse_date(self, date_value: Any) -> Optional[date]:
        """Parse various date formats into date object"""
        if isinstance(date_value, date):
            return date_value

        if not date_value:
            return None

        date_str = str(date_value).strip()

        # Common formats
        formats = [
            "%Y-%m-%d",      # ISO format
            "%d/%m/%Y",      # European format
            "%d-%m-%Y",
            "%Y/%m/%d",
            "%d.%m.%Y",
            "%Y%m%d",        # Compact format
        ]

        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue

        return None


# Global risk analyzer instance
_risk_analyzer = RiskAnalyzer()


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN PROCESSOR CLASS
# ═══════════════════════════════════════════════════════════════════════════════

class GeminiDocumentProcessor:
    """
    Production document processor using Gemini AI + Tesseract fallback + Risk Analysis.

    Flow:
    1. Try Gemini extraction with multimodal vision (includes fraud detection)
    2. If confidence < 70% or error, fallback to Tesseract OCR
    3. If Tesseract confidence < 60%, mark for manual review
    4. Perform comprehensive risk analysis on extracted data
    5. Return complete result with extraction, confidence, and risk assessment

    Usage:
        processor = GeminiDocumentProcessor()
        result = await processor.process(
            content=file_bytes,
            mime_type="application/pdf",
            document_code="dip_gq",
            request_id="uuid",
            user_id="uuid",
            existing_documents={...},
            form_data={...}
        )
    """

    def __init__(self):
        """Initialize Gemini processor with Vertex AI"""
        self.enabled = False
        self.model = None
        self.risk_analyzer = _risk_analyzer

        if not VERTEX_AI_AVAILABLE:
            logger.error("Vertex AI SDK not available - processor disabled")
            return

        try:
            # Initialize Vertex AI
            vertexai.init(
                project=settings.GOOGLE_CLOUD_PROJECT,
                location=settings.GOOGLE_CLOUD_LOCATION
            )

            # Use Gemini for vision/multimodal tasks
            self.model = GenerativeModel(settings.GEMINI_PRO_MODEL)

            # Generation config optimized for extraction + risk analysis
            self.generation_config = GenerationConfig(
                temperature=0.1,  # Low for consistent extraction
                top_p=0.8,
                top_k=20,
                max_output_tokens=8192,  # Increased for risk analysis
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
        document_code: str,
        request_id: str = "",
        user_id: str = "",
        existing_documents: Optional[Dict[str, Dict[str, Any]]] = None,
        form_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process document for classification, extraction, and RISK ANALYSIS.

        Args:
            content: Document file bytes
            mime_type: MIME type (image/*, application/pdf)
            document_code: Expected document type code
            request_id: Service request ID for duplication tracking
            user_id: User ID for duplication tracking
            existing_documents: Previously uploaded documents for identity consistency
            form_data: User form data for consistency checks

        Returns:
            Dict with:
            - extraction: Dict of extracted fields
            - confidence: Float 0-1
            - processor: "gemini", "tesseract", or "hybrid"
            - status: "success", "low_confidence", "manual_review", "rejected", "error"
            - document_type: Detected document type
            - processing_time_ms: Processing time
            - has_error: Boolean
            - error_message: Optional error message
            - risk_analysis: Complete risk assessment
        """
        start_time = time.time()

        # Get schema for document type
        schema = schema_loader.get_schema_for_document(document_code)
        if not schema:
            logger.warning(f"No schema found for document_code: {document_code}")

        extraction_result = None
        gemini_risk_hints = None

        # Try Gemini first
        if self.enabled:
            try:
                gemini_result = await self._process_with_gemini(
                    content, mime_type, document_code, schema
                )

                gemini_risk_hints = gemini_result.get("risk_hints", {})

                if gemini_result["confidence"] >= GEMINI_CONFIDENCE_THRESHOLD:
                    extraction_result = gemini_result
                    extraction_result["status"] = "success"
                    logger.info(
                        f"Gemini extraction successful: {document_code} "
                        f"(confidence: {gemini_result['confidence']:.2%})"
                    )
                else:
                    logger.info(
                        f"Gemini confidence too low ({gemini_result['confidence']:.2%}), "
                        f"falling back to Tesseract"
                    )

            except Exception as e:
                logger.error(f"Gemini extraction failed: {e}")

        # Tesseract fallback
        if not extraction_result and OCR_SERVICE_AVAILABLE:
            try:
                tesseract_result = await self._process_with_tesseract(
                    content, mime_type, document_code, schema
                )

                if tesseract_result["confidence"] >= TESSERACT_CONFIDENCE_THRESHOLD:
                    tesseract_result["status"] = "success"
                    logger.info(
                        f"Tesseract extraction successful: {document_code} "
                        f"(confidence: {tesseract_result['confidence']:.2%})"
                    )
                else:
                    tesseract_result["status"] = "low_confidence"
                    logger.warning(
                        f"Tesseract confidence too low ({tesseract_result['confidence']:.2%}), "
                        f"marking for manual review"
                    )

                extraction_result = tesseract_result

            except Exception as e:
                logger.error(f"Tesseract extraction failed: {e}")

        # If both failed
        if not extraction_result:
            extraction_result = {
                "extraction": {},
                "confidence": 0.0,
                "processor": "none",
                "status": "manual_review",
                "document_type": document_code,
                "has_error": True,
                "error_message": "Both Gemini and Tesseract extraction failed"
            }

        # ═══════════════════════════════════════════════════════════════════
        # RISK ANALYSIS
        # ═══════════════════════════════════════════════════════════════════
        risk_analysis = self.risk_analyzer.analyze(
            extraction=extraction_result.get("extraction", {}),
            document_code=document_code,
            detected_type=extraction_result.get("document_type", document_code),
            content=content,
            request_id=request_id,
            user_id=user_id,
            existing_documents=existing_documents,
            form_data=form_data,
            gemini_risk_hints=gemini_risk_hints
        )

        # Update status based on risk analysis
        if risk_analysis["requires_rejection"]:
            extraction_result["status"] = "rejected"
        elif risk_analysis["requires_review"]:
            extraction_result["status"] = "requires_review"

        # Add processing time and risk analysis
        extraction_result["processing_time_ms"] = int((time.time() - start_time) * 1000)
        extraction_result["risk_analysis"] = risk_analysis

        return extraction_result

    async def _process_with_gemini(
        self,
        content: bytes,
        mime_type: str,
        document_code: str,
        schema: Optional[Dict]
    ) -> Dict[str, Any]:
        """
        Process document using Gemini multimodal vision.
        Includes fraud detection and risk indicator extraction.
        """
        # Build extraction + risk analysis prompt
        prompt = self._build_gemini_prompt(document_code, schema)

        # Prepare image/document part
        document_part = Part.from_data(data=content, mime_type=mime_type)

        # Build content for Gemini
        contents = [document_part, Part.from_text(prompt)]

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
        extraction, confidence, risk_hints = self._parse_gemini_response(response_text, schema)

        # Detect document type from response
        detected_type = extraction.pop("_document_type", document_code)

        return {
            "extraction": extraction,
            "confidence": confidence,
            "processor": "gemini",
            "document_type": detected_type,
            "has_error": False,
            "risk_hints": risk_hints,
            "raw_response": response_text[:500]
        }

    def _build_gemini_prompt(
        self,
        document_code: str,
        schema: Optional[Dict]
    ) -> str:
        """
        Build extraction + risk analysis prompt for Gemini.
        """
        if schema:
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
        else:
            doc_description = document_code
            language = "es"
            fields_text = "- Extrae todos los campos visibles del documento"

        prompt = f"""Eres un experto en análisis de documentos oficiales. Analiza este documento para:
1. EXTRACCIÓN de datos
2. CLASIFICACIÓN del tipo de documento
3. DETECCIÓN DE FRAUDE y anomalías

═══════════════════════════════════════════════════════════════════════════════
TIPO DE DOCUMENTO ESPERADO: {doc_description}
IDIOMA DEL DOCUMENTO: {language}
═══════════════════════════════════════════════════════════════════════════════

CAMPOS A EXTRAER:
{fields_text}

═══════════════════════════════════════════════════════════════════════════════
ANÁLISIS DE RIESGO Y FRAUDE - DETECTAR:
═══════════════════════════════════════════════════════════════════════════════

1. MANIPULACIÓN DIGITAL:
   - Signos de edición con Photoshop/software
   - Píxeles irregulares o artefactos
   - Inconsistencias en la resolución

2. TIPOGRAFÍA:
   - Fuentes inconsistentes
   - Caracteres mal alineados
   - Texto añadido posteriormente

3. ELEMENTOS OFICIALES:
   - ¿Tiene firma? ¿Parece auténtica?
   - ¿Tiene sello oficial? ¿Es legible?
   - ¿Tiene holograma o elementos de seguridad?

4. CALIDAD DEL DOCUMENTO:
   - ¿Es legible?
   - ¿Hay zonas borrosas o cortadas?
   - ¿Se ve completo?

5. PATRONES SOSPECHOSOS:
   - Fechas ilógicas
   - Números de documento con formato inválido
   - Información que no corresponde al tipo de documento

═══════════════════════════════════════════════════════════════════════════════
RESPONDE ÚNICAMENTE con JSON válido (sin explicaciones):
═══════════════════════════════════════════════════════════════════════════════

{{
    "_document_type": "tipo_detectado_real",
    "_confidence": 0.85,
    "_risk_hints": {{
        "digital_manipulation_detected": false,
        "manipulation_details": {{}},
        "inconsistent_fonts": false,
        "font_details": {{}},
        "low_quality": false,
        "quality_details": {{}},
        "missing_signature": false,
        "missing_stamp": false,
        "suspicious_patterns": [],
        "overall_authenticity": "high|medium|low",
        "notes": ""
    }},
    "campo1": "valor1",
    "campo2": "valor2"
}}

INSTRUCCIONES ADICIONALES:
- Si un campo no es visible o legible, usa null
- Para fechas, usa formato ISO (YYYY-MM-DD)
- Para números de documento, elimina espacios
- Sé conservador con _confidence: baja si hay dudas
- Si detectas CUALQUIER indicio de fraude, marca los campos correspondientes en _risk_hints
"""

        return prompt

    def _parse_gemini_response(
        self,
        response_text: str,
        schema: Optional[Dict]
    ) -> Tuple[Dict[str, Any], float, Dict[str, Any]]:
        """
        Parse Gemini response and extract JSON including risk hints.

        Returns:
            Tuple of (extraction_dict, confidence, risk_hints)
        """
        risk_hints = {}

        try:
            # Try to find JSON in response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if not json_match:
                logger.warning("No JSON found in Gemini response")
                return {}, 0.0, {}

            json_str = json_match.group()
            extraction = json.loads(json_str)

            # Extract confidence
            confidence = extraction.pop("_confidence", 0.5)
            if isinstance(confidence, str):
                confidence = float(confidence)

            # Extract risk hints
            risk_hints = extraction.pop("_risk_hints", {})

            # Validate extraction if schema provided
            if schema:
                confidence = self._validate_extraction(extraction, schema, confidence)

            return extraction, confidence, risk_hints

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini JSON response: {e}")
            return {}, 0.0, {}
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {e}")
            return {}, 0.0, {}

    def _validate_extraction(
        self,
        extraction: Dict[str, Any],
        schema: Dict,
        base_confidence: float
    ) -> float:
        """Validate extraction against schema and adjust confidence."""
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
                            base_confidence *= 0.9

        return min(1.0, max(0.0, base_confidence))

    async def _process_with_tesseract(
        self,
        content: bytes,
        mime_type: str,
        document_code: str,
        schema: Optional[Dict]
    ) -> Dict[str, Any]:
        """Process document using Tesseract OCR + regex extraction."""
        # Extract text using OCR service
        ocr_result = await ocr_service.extract_text(
            file_content=content,
            file_type=mime_type,
            provider="tesseract_server",
            language="spa",
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
                            value = match.group(1) if match.groups() else match.group()
                            extraction[field_name] = value.strip()
                            pattern_matches += 1
                            break
                    except re.error as e:
                        logger.warning(f"Invalid regex pattern for {field_name}: {e}")

        # Calculate confidence
        ocr_confidence = ocr_result.confidence
        pattern_confidence = pattern_matches / total_patterns if total_patterns > 0 else 0.5
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


# ═══════════════════════════════════════════════════════════════════════════════
# SINGLETON INSTANCE
# ═══════════════════════════════════════════════════════════════════════════════

gemini_document_processor = GeminiDocumentProcessor()
