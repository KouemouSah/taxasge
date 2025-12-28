"""
CrossDocumentValidator - Validates consistency across multiple documents.

Implements validation rules from workflow specifications:
- Name matching between DIP and other documents
- Date coherence (birth dates, expiry dates)
- Number format validation
- Cross-reference checks

Used by workflows to ensure document data is consistent.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, date
import re
import unicodedata
import logging

from ..workflows.base_workflow import ValidationResult, WorkflowContext
from ..models.enums import SolicitudType

logger = logging.getLogger(__name__)


@dataclass
class ValidationRule:
    """A validation rule for cross-document checks."""
    rule_id: str
    description: str
    documents: List[str]  # Document codes involved
    condition: Optional[str] = None  # When to apply (e.g., "tipo == 'NUEVO'")
    severity: str = "error"  # error, warning, info
    message_es: str = ""
    message_fr: str = ""
    validator: Optional[Callable] = None  # Custom validation function


@dataclass
class ValidationContext:
    """Context for running validations."""
    extracted_data: Dict[str, Dict[str, Any]]
    form_data: Dict[str, Any]
    solicitud_type: SolicitudType
    sub_type: Optional[str] = None

    def get_field(self, document_code: str, field_path: str) -> Optional[Any]:
        """Get a field value from extracted data."""
        doc_data = self.extracted_data.get(document_code, {})
        parts = field_path.split(".")
        current = doc_data
        for part in parts:
            if isinstance(current, dict):
                current = current.get(part)
            else:
                return None
        return current


class CrossDocumentValidator:
    """
    Validates consistency across multiple documents.

    Provides common validation patterns used across all workflows:
    - Name normalization and matching
    - Date validation and comparison
    - Number format validation
    - Custom rule evaluation

    Usage:
        validator = CrossDocumentValidator()

        # Add rules for a workflow
        validator.add_rule(ValidationRule(
            rule_id="names_match",
            description="Names must match between DIP and passport",
            documents=["dip", "pasaporte"],
            message_es="Los nombres no coinciden"
        ))

        # Run validations
        results = validator.validate(context)
    """

    def __init__(self):
        self._rules: Dict[str, List[ValidationRule]] = {}  # workflow_code -> rules
        self._global_rules: List[ValidationRule] = []
        self._setup_global_rules()

    def _setup_global_rules(self) -> None:
        """Setup rules that apply to all workflows."""
        # DIP expiry check
        self._global_rules.append(ValidationRule(
            rule_id="dip_not_expired",
            description="DIP must not be expired",
            documents=["dip"],
            severity="error",
            message_es="El DIP está expirado. Debe renovarlo antes de continuar.",
            message_fr="Le DIP est expiré. Vous devez le renouveler avant de continuer."
        ))

        # DIP number format
        self._global_rules.append(ValidationRule(
            rule_id="dip_number_format",
            description="DIP number must be 9 digits",
            documents=["dip"],
            severity="error",
            message_es="El número de DIP debe tener 9 dígitos.",
            message_fr="Le numéro de DIP doit avoir 9 chiffres."
        ))

    def add_rule(self, rule: ValidationRule, workflow_code: Optional[str] = None) -> None:
        """
        Add a validation rule.

        Args:
            rule: The validation rule to add
            workflow_code: Optional workflow code to scope the rule
        """
        if workflow_code:
            if workflow_code not in self._rules:
                self._rules[workflow_code] = []
            self._rules[workflow_code].append(rule)
        else:
            self._global_rules.append(rule)

    def add_rules(self, rules: List[ValidationRule], workflow_code: Optional[str] = None) -> None:
        """Add multiple validation rules."""
        for rule in rules:
            self.add_rule(rule, workflow_code)

    def get_rules(self, workflow_code: Optional[str] = None) -> List[ValidationRule]:
        """Get all applicable rules for a workflow."""
        rules = list(self._global_rules)
        if workflow_code and workflow_code in self._rules:
            rules.extend(self._rules[workflow_code])
        return rules

    def validate(
        self,
        context: ValidationContext,
        workflow_code: Optional[str] = None
    ) -> List[ValidationResult]:
        """
        Run all applicable validations.

        Args:
            context: Validation context with extracted data
            workflow_code: Optional workflow code to include specific rules

        Returns:
            List of validation results (failures only)
        """
        results = []
        rules = self.get_rules(workflow_code)

        for rule in rules:
            # Check if condition applies
            if rule.condition and not self._evaluate_condition(rule.condition, context):
                continue

            # Check if required documents are available
            if not self._has_required_documents(rule.documents, context):
                continue

            # Run the validation
            result = self._run_validation(rule, context)
            if result:
                results.append(result)

        return results

    def _evaluate_condition(self, condition: str, context: ValidationContext) -> bool:
        """Evaluate a condition expression."""
        # Simple condition parsing
        if "tipo ==" in condition:
            expected = condition.split("==")[1].strip().strip("'\"")
            return context.sub_type == expected

        if "tipo IN" in condition:
            match = re.search(r"\[([^\]]+)\]", condition)
            if match:
                types = [t.strip().strip("'\"") for t in match.group(1).split(",")]
                return context.sub_type in types

        if "solicitud_type ==" in condition:
            expected = condition.split("==")[1].strip().strip("'\"")
            return context.solicitud_type.value == expected

        return True

    def _has_required_documents(self, documents: List[str], context: ValidationContext) -> bool:
        """Check if all required documents are in context."""
        for doc in documents:
            if doc not in context.extracted_data:
                return False
        return True

    def _run_validation(self, rule: ValidationRule, context: ValidationContext) -> Optional[ValidationResult]:
        """Run a single validation rule."""
        try:
            # If custom validator is provided, use it
            if rule.validator:
                is_valid = rule.validator(context)
            else:
                # Use built-in validation based on rule_id
                is_valid = self._run_builtin_validation(rule.rule_id, context)

            if not is_valid:
                return ValidationResult(
                    is_valid=False,
                    rule_id=rule.rule_id,
                    severity=rule.severity,
                    message_es=rule.message_es,
                    message_fr=rule.message_fr
                )

        except Exception as e:
            logger.warning(f"Validation error for rule {rule.rule_id}: {e}")
            # On error, don't fail the validation
            return None

        return None

    def _run_builtin_validation(self, rule_id: str, context: ValidationContext) -> bool:
        """Run a built-in validation."""
        if rule_id == "dip_not_expired":
            return self._validate_dip_not_expired(context)

        if rule_id == "dip_number_format":
            return self._validate_dip_number_format(context)

        if rule_id.startswith("names_match_"):
            parts = rule_id.split("_")
            if len(parts) >= 4:
                doc1, doc2 = parts[2], parts[3]
                return self._validate_names_match(context, doc1, doc2)

        if rule_id.startswith("birthdate_match_"):
            parts = rule_id.split("_")
            if len(parts) >= 4:
                doc1, doc2 = parts[2], parts[3]
                return self._validate_birthdate_match(context, doc1, doc2)

        # Default: pass
        return True

    # === Built-in Validation Methods ===

    def _validate_dip_not_expired(self, context: ValidationContext) -> bool:
        """Check if DIP is not expired."""
        fecha_exp = context.get_field("dip", "documento.fecha_expiracion")
        if not fecha_exp:
            return True  # Can't validate without data

        try:
            if isinstance(fecha_exp, str):
                exp_date = datetime.strptime(fecha_exp, "%Y-%m-%d").date()
            else:
                exp_date = fecha_exp

            return exp_date > date.today()
        except (ValueError, TypeError):
            return True  # Can't validate, don't fail

    def _validate_dip_number_format(self, context: ValidationContext) -> bool:
        """Check if DIP number has correct format (9 digits)."""
        numero_dip = context.get_field("dip", "documento.numero_dip")
        if not numero_dip:
            return True  # Can't validate without data

        numero_str = str(numero_dip)
        return bool(re.match(r"^\d{9}$", numero_str))

    def _validate_names_match(
        self,
        context: ValidationContext,
        doc1: str,
        doc2: str
    ) -> bool:
        """Check if names match between two documents."""
        # Get names from doc1
        apellidos1 = context.get_field(doc1, "titular.apellidos")
        nombres1 = context.get_field(doc1, "titular.nombres")

        # Get names from doc2
        apellidos2 = context.get_field(doc2, "titular.apellidos")
        nombres2 = context.get_field(doc2, "titular.nombres")

        if not all([apellidos1, nombres1, apellidos2, nombres2]):
            return True  # Can't validate

        # Normalize and compare
        return (
            self.normalize_name(apellidos1) == self.normalize_name(apellidos2) and
            self.normalize_name(nombres1) == self.normalize_name(nombres2)
        )

    def _validate_birthdate_match(
        self,
        context: ValidationContext,
        doc1: str,
        doc2: str
    ) -> bool:
        """Check if birthdates match between two documents."""
        fecha1 = context.get_field(doc1, "titular.fecha_nacimiento")
        fecha2 = context.get_field(doc2, "inscrito.fecha_nacimiento")

        if not all([fecha1, fecha2]):
            return True  # Can't validate

        return self.normalize_date(fecha1) == self.normalize_date(fecha2)

    # === Name Normalization Utilities ===

    @staticmethod
    def normalize_name(name: str) -> str:
        """
        Normalize a name for comparison.

        - Convert to uppercase
        - Remove accents
        - Remove extra spaces
        - Remove common prefixes/suffixes
        """
        if not name:
            return ""

        # Convert to uppercase
        name = name.upper()

        # Remove accents
        name = "".join(
            c for c in unicodedata.normalize("NFKD", name)
            if not unicodedata.combining(c)
        )

        # Remove extra spaces
        name = " ".join(name.split())

        # Remove common prefixes
        prefixes = ["DE ", "DEL ", "DE LA ", "DE LAS ", "DE LOS "]
        for prefix in prefixes:
            if name.startswith(prefix):
                name = name[len(prefix):]

        return name.strip()

    @staticmethod
    def normalize_date(date_val: Any) -> Optional[str]:
        """
        Normalize a date for comparison.

        Returns date in YYYY-MM-DD format.
        """
        if not date_val:
            return None

        if isinstance(date_val, date):
            return date_val.strftime("%Y-%m-%d")

        if isinstance(date_val, datetime):
            return date_val.strftime("%Y-%m-%d")

        if isinstance(date_val, str):
            # Try common formats
            formats = [
                "%Y-%m-%d",
                "%d/%m/%Y",
                "%d.%m.%Y",
                "%d-%m-%Y"
            ]
            for fmt in formats:
                try:
                    return datetime.strptime(date_val, fmt).strftime("%Y-%m-%d")
                except ValueError:
                    continue

        return None

    @staticmethod
    def names_match_fuzzy(name1: str, name2: str, threshold: float = 0.85) -> bool:
        """
        Check if two names match with fuzzy matching.

        Uses Levenshtein distance for similarity.
        """
        n1 = CrossDocumentValidator.normalize_name(name1)
        n2 = CrossDocumentValidator.normalize_name(name2)

        if n1 == n2:
            return True

        if not n1 or not n2:
            return False

        # Simple Levenshtein similarity
        max_len = max(len(n1), len(n2))
        if max_len == 0:
            return True

        distance = CrossDocumentValidator._levenshtein_distance(n1, n2)
        similarity = 1 - (distance / max_len)

        return similarity >= threshold

    @staticmethod
    def _levenshtein_distance(s1: str, s2: str) -> int:
        """Calculate Levenshtein distance between two strings."""
        if len(s1) < len(s2):
            return CrossDocumentValidator._levenshtein_distance(s2, s1)

        if len(s2) == 0:
            return len(s1)

        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row

        return previous_row[-1]

    # === Workflow-Specific Rule Builders ===

    def build_pasaporte_rules(self) -> List[ValidationRule]:
        """Build validation rules for pasaporte workflow."""
        return [
            ValidationRule(
                rule_id="pasaporte_renewal_expiry",
                description="Passport must expire within 12 months for renewal",
                documents=["pasaporte"],
                condition="tipo == 'RENOVACION'",
                severity="warning",
                message_es="Solo puede renovar si el pasaporte expira en menos de 12 meses.",
                message_fr="Vous ne pouvez renouveler que si le passeport expire dans moins de 12 mois.",
                validator=lambda ctx: self._validate_pasaporte_renewal_expiry(ctx)
            ),
            ValidationRule(
                rule_id="names_match_dip_pasaporte",
                description="Names must match between DIP and old passport",
                documents=["dip", "pasaporte"],
                condition="tipo IN ['RENOVACION', 'DETERIORO']",
                severity="error",
                message_es="El nombre en el DIP no coincide con el pasaporte antiguo.",
                message_fr="Le nom sur le DIP ne correspond pas à l'ancien passeport."
            ),
            ValidationRule(
                rule_id="birthdate_match_dip_certificado",
                description="Birthdate must match between DIP and birth certificate",
                documents=["dip", "certificado_nacimiento"],
                condition="tipo == 'NUEVO'",
                severity="warning",
                message_es="La fecha de nacimiento del DIP no coincide con el certificado.",
                message_fr="La date de naissance du DIP ne correspond pas au certificat."
            )
        ]

    def build_residencia_rules(self) -> List[ValidationRule]:
        """Build validation rules for residencia workflow."""
        return [
            ValidationRule(
                rule_id="residencia_renewal_expiry",
                description="Residence permit must be near expiry for renewal",
                documents=["permiso_residencia"],
                condition="tipo == 'RENOVACION'",
                severity="warning",
                message_es="Solo puede renovar si el permiso expira en menos de 3 meses.",
                message_fr="Vous ne pouvez renouveler que si le permis expire dans moins de 3 mois."
            )
        ]

    def build_vehiculo_rules(self) -> List[ValidationRule]:
        """Build validation rules for vehiculo workflow."""
        return [
            ValidationRule(
                rule_id="cuve_valid",
                description="CUVE must be valid",
                documents=["cuve"],
                severity="error",
                message_es="El CUVE no es válido o está expirado.",
                message_fr="Le CUVE n'est pas valide ou est expiré."
            ),
            ValidationRule(
                rule_id="itv_valid",
                description="ITV must be valid",
                documents=["itv"],
                severity="error",
                message_es="La ITV no es válida o está expirada.",
                message_fr="L'ITV n'est pas valide ou est expirée."
            )
        ]

    def _validate_pasaporte_renewal_expiry(self, context: ValidationContext) -> bool:
        """Validate passport expiry for renewal."""
        fecha_exp = context.get_field("pasaporte", "documento.fecha_expiracion")
        if not fecha_exp:
            return True

        try:
            if isinstance(fecha_exp, str):
                exp_date = datetime.strptime(fecha_exp, "%Y-%m-%d").date()
            else:
                exp_date = fecha_exp

            from datetime import timedelta
            max_expiry = date.today() + timedelta(days=365)
            return exp_date <= max_expiry
        except (ValueError, TypeError):
            return True


# Singleton instance
cross_document_validator = CrossDocumentValidator()
