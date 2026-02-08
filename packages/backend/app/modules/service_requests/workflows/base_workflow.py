"""
BaseWorkflow - Abstract base class for all service request workflows.

Implements common steps from Flux_demande.md:
1. Initier Demande - Selection du type de demande
2. Upload Documents - Chargement des documents requis
3. Extraction Gemini - Classification, extraction, validation
4. Formulaire Pré-rempli - Présentation données extraites
5. Vérification - Correction par citoyen si nécessaire
6+ Workflow Dédié - Validations spécifiques (implémenté par sous-classes)
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Type
from datetime import datetime
from uuid import UUID
from enum import Enum
import logging

from ..models.enums import (
    WorkflowCode,
    WorkflowCategory,
    EntityCode,
    TariffType,
    ServiceRequestStatus,
    SolicitudType,
    DocumentConditionType
)

logger = logging.getLogger(__name__)


class StepType(str, Enum):
    """Types of workflow steps"""
    SELECTION = "selection"           # User selects option
    DOCUMENT_UPLOAD = "document_upload"  # Document upload with extraction
    FORM_REVIEW = "form_review"       # Review pre-filled form
    VALIDATION = "validation"         # Cross-document validation
    PAYMENT = "payment"               # Payment processing
    CONFIRMATION = "confirmation"     # Final confirmation
    AGENT_REVIEW = "agent_review"     # Agent reviews and validates
    APPOINTMENT = "appointment"       # Schedule appointment (cita)
    CUSTOM = "custom"                 # Custom step defined by workflow


@dataclass
class ValidationResult:
    """Result of a validation check. Translations managed via translations module."""
    is_valid: bool
    rule_id: str
    severity: str = "error"  # error, warning, info
    message_es: Optional[str] = None  # Base message in Spanish
    field_name: Optional[str] = None
    document_code: Optional[str] = None

    @property
    def is_error(self) -> bool:
        return not self.is_valid and self.severity == "error"

    @property
    def is_warning(self) -> bool:
        return not self.is_valid and self.severity == "warning"


@dataclass
class DocumentRequirement:
    """
    Document required for a workflow step.
    Maps to workflow_document_requirements table.
    """
    document_code: str
    document_name_es: str
    schema_key: Optional[str] = None  # extraction_schema_key (e.g., DIP_GQ_V2)
    is_required: bool = True
    display_order: int = 0
    condition_type: DocumentConditionType = DocumentConditionType.ALWAYS
    condition_value: Dict[str, Any] = field(default_factory=dict)
    instructions_es: Optional[str] = None
    faces_required: List[str] = field(default_factory=list)  # ["recto", "verso"]
    accepted_formats: List[str] = field(default_factory=lambda: ["pdf", "jpg", "png"])
    max_size_mb: int = 10
    config: Dict[str, Any] = field(default_factory=dict)  # Additional config for frontend

    def should_show(self, context: "WorkflowContext") -> bool:
        """Determine if document should be shown based on condition."""
        if self.condition_type == DocumentConditionType.ALWAYS:
            return True

        # Evaluate condition based on context
        if self.condition_type == DocumentConditionType.IS_NEW:
            return context.solicitud_type == SolicitudType.EXPEDICION

        if self.condition_type == DocumentConditionType.IS_RENEWAL:
            return context.solicitud_type == SolicitudType.RENOVACION

        if self.condition_type == DocumentConditionType.IS_DUPLICATE:
            return context.solicitud_type == SolicitudType.DUPLICADO

        if self.condition_type == DocumentConditionType.IS_MINOR:
            return context.is_minor

        if self.condition_type == DocumentConditionType.IS_ADULT:
            return not context.is_minor

        if self.condition_type == DocumentConditionType.AGE_LESS_THAN:
            threshold = self.condition_value.get("age", 18)
            age = context.get_user_age()
            return age is not None and age < threshold

        if self.condition_type == DocumentConditionType.AGE_GREATER_THAN:
            threshold = self.condition_value.get("age", 18)
            age = context.get_user_age()
            return age is not None and age >= threshold

        if self.condition_type == DocumentConditionType.HAS_PREVIOUS:
            return context.has_previous_document(self.document_code)

        if self.condition_type == DocumentConditionType.IS_FOREIGN:
            return context.is_foreign_national()

        if self.condition_type == DocumentConditionType.IS_NATIONAL:
            return not context.is_foreign_national()

        if self.condition_type == DocumentConditionType.CUSTOM:
            # Custom conditions evaluated via condition_value expression
            return self._evaluate_custom_condition(context)

        return True

    def _evaluate_custom_condition(self, context: "WorkflowContext") -> bool:
        """Evaluate custom condition expression."""
        # For now, just check if there's a "types" list in condition_value
        allowed_types = self.condition_value.get("types", [])
        if allowed_types and context.sub_type:
            return context.sub_type in allowed_types
        return True


@dataclass
class WorkflowStep:
    """
    A step in the workflow.
    Can be common (inherited from Flux_demande) or specific to workflow.
    Translations (fr, en) managed via translations module.
    """
    step_number: int
    step_id: str
    step_type: StepType
    title_es: str  # Base title in Spanish
    description_es: Optional[str] = None  # Base description in Spanish
    is_inherited: bool = False  # True if from Flux_demande.md base
    documents: List[DocumentRequirement] = field(default_factory=list)
    is_optional: bool = False
    requires_previous: bool = True  # Must complete previous step
    config: Dict[str, Any] = field(default_factory=dict)

    def get_applicable_documents(self, context: "WorkflowContext") -> List[DocumentRequirement]:
        """Get documents that should be shown based on context."""
        return [doc for doc in self.documents if doc.should_show(context)]


@dataclass
class WorkflowContext:
    """
    Runtime context for a workflow execution.
    Carries state between steps.
    """
    service_request_id: UUID
    user_id: UUID
    workflow_code: WorkflowCode
    solicitud_type: SolicitudType
    sub_type: Optional[str] = None  # e.g., "NUEVO", "RENOVACION", etc.
    current_step: int = 1
    status: ServiceRequestStatus = ServiceRequestStatus.DRAFT

    # Extracted data from documents
    extracted_data: Dict[str, Dict[str, Any]] = field(default_factory=dict)

    # Form data (user corrections)
    form_data: Dict[str, Any] = field(default_factory=dict)

    # Documents uploaded
    documents_uploaded: Dict[str, UUID] = field(default_factory=dict)

    # Validation results
    validation_results: List[ValidationResult] = field(default_factory=list)

    # Payment info
    payment_id: Optional[UUID] = None
    payment_status: Optional[str] = None

    # Timestamps
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None

    # Entity assignment
    entity_code: Optional[str] = None
    assigned_to: Optional[UUID] = None

    def get_user_age(self) -> Optional[int]:
        """Calculate user age from extracted data (DIP fecha_nacimiento)."""
        # Try to get from DIP extraction
        dip_data = self.extracted_data.get("dip", {})
        fecha_nac = dip_data.get("titular", {}).get("fecha_nacimiento")

        if not fecha_nac:
            # Try form_data
            fecha_nac = self.form_data.get("fecha_nacimiento")

        if fecha_nac:
            try:
                if isinstance(fecha_nac, str):
                    birth_date = datetime.strptime(fecha_nac, "%Y-%m-%d")
                else:
                    birth_date = fecha_nac
                today = datetime.today()
                age = today.year - birth_date.year
                if (today.month, today.day) < (birth_date.month, birth_date.day):
                    age -= 1
                return age
            except (ValueError, TypeError):
                pass
        return None

    def has_previous_document(self, document_code: str) -> bool:
        """Check if user has a previous document of this type."""
        # This would typically check verified_identifiers or previous requests
        return False  # Default implementation

    def is_foreign_national(self) -> bool:
        """Check if user is a foreign national."""
        dip_data = self.extracted_data.get("dip", {})
        nacionalidad = dip_data.get("titular", {}).get("nacionalidad", "")
        return nacionalidad.upper() not in ["GNQ", "GUINEA ECUATORIAL", "ECUATOGUINEANO"]

    def get_extracted_field(self, document_code: str, field_path: str) -> Optional[Any]:
        """Get a field value from extracted data using dot notation."""
        doc_data = self.extracted_data.get(document_code, {})
        parts = field_path.split(".")
        current = doc_data
        for part in parts:
            if isinstance(current, dict):
                current = current.get(part)
            else:
                return None
        return current

    def has_errors(self) -> bool:
        """Check if there are any validation errors."""
        return any(r.is_error for r in self.validation_results)

    def get_errors(self) -> List[ValidationResult]:
        """Get all validation errors."""
        return [r for r in self.validation_results if r.is_error]

    def get_warnings(self) -> List[ValidationResult]:
        """Get all validation warnings."""
        return [r for r in self.validation_results if r.is_warning]


@dataclass
class TariffConfig:
    """Tariff configuration for a workflow."""
    tariff_type: TariffType
    fixed_amounts: Dict[str, int] = field(default_factory=dict)  # sub_type -> amount
    percentage: Optional[float] = None  # For percentage-based
    rbc_params: Dict[str, Any] = field(default_factory=dict)  # For RBC calculation
    currency: str = "XAF"
    extra: Dict[str, Any] = field(default_factory=dict)  # Additional config (stamps, etc.)

    def get_amount(self, sub_type: str, value: Optional[float] = None) -> int:
        """Calculate tariff amount based on type and configuration."""
        if self.tariff_type == TariffType.FIXED:
            return self.fixed_amounts.get(sub_type, 0)

        if self.tariff_type == TariffType.PERCENTAGE and value:
            return int(value * (self.percentage or 0) / 100)

        if self.tariff_type == TariffType.RBC:
            # RBC calculation delegated to TariffService
            return 0  # Will be calculated by RBC calculator

        if self.tariff_type == TariffType.NOTA_INGRESO:
            # Nota de Ingreso amount comes from Treasury
            return 0  # Will be determined by Nota

        return 0


class BaseWorkflow(ABC):
    """
    Abstract base class for all service request workflows.

    Implements the common flow from Flux_demande.md and provides
    hooks for workflow-specific customizations.
    """

    # === Class Attributes (override in subclasses) ===

    workflow_code: WorkflowCode  # Must be set by subclass
    category: WorkflowCategory
    entity_code: EntityCode

    # Service configuration (translations fr/en via translations module)
    service_name_es: str = ""

    # Workflow flags
    requires_nota_ingreso: bool = False
    requires_appointment: bool = False
    requires_agent_review: bool = True

    # Allowed sub-types for this workflow
    allowed_sub_types: List[str] = []

    def __init__(self, sub_type: Optional[str] = None):
        self._steps: List[WorkflowStep] = []
        self._tariff_config: Optional[TariffConfig] = None
        self._default_sub_type = sub_type
        self._setup_common_steps()
        self._setup_specific_steps()
        self._setup_tariffs()

    # === Abstract Methods (must be implemented by subclasses) ===

    @abstractmethod
    def _setup_specific_steps(self) -> None:
        """Setup workflow-specific steps. Override in subclass."""
        pass

    @abstractmethod
    def _setup_tariffs(self) -> None:
        """Setup tariff configuration. Override in subclass."""
        pass

    @abstractmethod
    def get_document_requirements(self, sub_type: str) -> List[DocumentRequirement]:
        """Get document requirements for a specific sub-type."""
        pass

    @abstractmethod
    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """Get cross-document validation rules."""
        pass

    def get_form_mapping(self, context: Optional["WorkflowContext"] = None) -> Dict[str, str]:
        """
        Get mapping from extracted document data to form fields.

        Override this method in subclass to define field mappings.
        Default implementation returns empty dict (no mapping).

        Returns:
            Dict mapping form_field_name -> extraction_path
            Example: {"numero_dip": "dip.documento.numero_dip"}
        """
        return {}

    # === Common Steps Setup (from Flux_demande.md) ===

    def _setup_common_steps(self) -> None:
        """Setup common steps inherited from Flux_demande.md."""

        # Step 1: Initier Demande (selection type)
        self._steps.append(WorkflowStep(
            step_number=1,
            step_id="select_type",
            step_type=StepType.SELECTION,
            title_es="Tipo de Solicitud",
            description_es="Seleccione el tipo de trámite que desea realizar",
            is_inherited=True,
            requires_previous=False
        ))

        # Step 2: Upload Documents
        self._steps.append(WorkflowStep(
            step_number=2,
            step_id="upload_documents",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Documentos Requeridos",
            description_es="Cargue los documentos necesarios para su solicitud",
            is_inherited=True
        ))

        # Step 4: Form Review (pre-filled from extraction)
        # Note: Step 3 reserved for workflow-specific uploads (photos, etc.)
        self._steps.append(WorkflowStep(
            step_number=4,
            step_id="review_form",
            step_type=StepType.FORM_REVIEW,
            title_es="Verificar Datos",
            description_es="Verifique y corrija los datos extraídos de sus documentos",
            is_inherited=True
        ))

        # Step 5: Validation
        self._steps.append(WorkflowStep(
            step_number=5,
            step_id="validation",
            step_type=StepType.VALIDATION,
            title_es="Validaciones",
            description_es="El sistema verifica la coherencia de sus documentos",
            is_inherited=True
        ))

    # === Step Management ===

    def get_steps(self) -> List[WorkflowStep]:
        """Get all workflow steps in order."""
        return sorted(self._steps, key=lambda s: s.step_number)

    def get_step(self, step_number: int) -> Optional[WorkflowStep]:
        """Get a specific step by number."""
        for step in self._steps:
            if step.step_number == step_number:
                return step
        return None

    def get_step_by_id(self, step_id: str) -> Optional[WorkflowStep]:
        """Get a specific step by ID."""
        for step in self._steps:
            if step.step_id == step_id:
                return step
        return None

    def add_step(self, step: WorkflowStep) -> None:
        """Add a step to the workflow."""
        self._steps.append(step)

    def get_total_steps(self) -> int:
        """Get total number of steps."""
        return len(self._steps)

    # === Tariff Management ===

    def get_tariff_config(self) -> Optional[TariffConfig]:
        """Get tariff configuration."""
        return self._tariff_config

    def calculate_tariff(self, context: WorkflowContext, value: Optional[float] = None) -> int:
        """Calculate tariff for the current context."""
        if not self._tariff_config:
            return 0

        sub_type = context.sub_type or "DEFAULT"
        return self._tariff_config.get_amount(sub_type, value)

    # === Validation ===

    def validate_step(self, step_number: int, context: WorkflowContext) -> List[ValidationResult]:
        """Validate a specific step."""
        step = self.get_step(step_number)
        if not step:
            return []

        results = []

        # Step-specific validation
        if step.step_type == StepType.DOCUMENT_UPLOAD:
            results.extend(self._validate_documents(step, context))
        elif step.step_type == StepType.VALIDATION:
            results.extend(self._validate_cross_documents(context))

        return results

    def _validate_documents(self, step: WorkflowStep, context: WorkflowContext) -> List[ValidationResult]:
        """Validate document requirements for a step."""
        results = []

        applicable_docs = step.get_applicable_documents(context)
        for doc in applicable_docs:
            if doc.is_required and doc.document_code not in context.documents_uploaded:
                results.append(ValidationResult(
                    is_valid=False,
                    rule_id=f"doc_required_{doc.document_code}",
                    severity="error",
                    message_es=f"El documento {doc.document_name_es} es obligatorio",
                    document_code=doc.document_code
                ))

        return results

    def _validate_cross_documents(self, context: WorkflowContext) -> List[ValidationResult]:
        """Run cross-document validations."""
        results = []

        for rule in self.get_cross_validation_rules():
            result = self._evaluate_validation_rule(rule, context)
            if result:
                results.append(result)

        return results

    def _evaluate_validation_rule(
        self,
        rule: Dict[str, Any],
        context: WorkflowContext
    ) -> Optional[ValidationResult]:
        """Evaluate a single validation rule against context."""
        rule_id = rule.get("id", "unknown")

        # Check condition
        condition = rule.get("condition")
        if condition and not self._evaluate_condition(condition, context):
            return None  # Rule doesn't apply

        # Evaluate rule
        rule_expr = rule.get("rule", "")
        is_valid = self._evaluate_rule_expression(rule_expr, context)

        if not is_valid:
            return ValidationResult(
                is_valid=False,
                rule_id=rule_id,
                severity=rule.get("severity", "error"),
                message_es=rule.get("error_es"),
                document_code=rule.get("document")
            )

        return None

    def _evaluate_condition(self, condition: str, context: WorkflowContext) -> bool:
        """Evaluate a condition expression."""
        # Simple condition evaluation
        if "tipo ==" in condition:
            # e.g., "tipo == 'NUEVO'"
            expected = condition.split("==")[1].strip().strip("'\"")
            return context.sub_type == expected

        if "tipo IN" in condition:
            # e.g., "tipo IN ['RENOVACION', 'DETERIORO']"
            import re
            match = re.search(r"\[([^\]]+)\]", condition)
            if match:
                types = [t.strip().strip("'\"") for t in match.group(1).split(",")]
                return context.sub_type in types

        return True  # Default: condition applies

    def _evaluate_rule_expression(self, rule: str, context: WorkflowContext) -> bool:
        """
        Evaluate a rule expression.
        This is a simplified implementation - in production, use a proper expression evaluator.
        """
        # For now, return True (validation passes)
        # In production, implement proper expression evaluation
        logger.debug(f"Evaluating rule: {rule}")
        return True

    # === Status Transitions ===

    def get_next_status(self, current_status: ServiceRequestStatus) -> Optional[ServiceRequestStatus]:
        """Get the next valid status in the workflow."""
        transitions = self._get_status_transitions()
        return transitions.get(current_status)

    def _get_status_transitions(self) -> Dict[ServiceRequestStatus, ServiceRequestStatus]:
        """Get valid status transitions. Override for workflow-specific transitions."""
        base_transitions = {
            ServiceRequestStatus.DRAFT: ServiceRequestStatus.SUBMITTED,
            ServiceRequestStatus.SUBMITTED: ServiceRequestStatus.UNDER_REVIEW,
            ServiceRequestStatus.UNDER_REVIEW: ServiceRequestStatus.DOSSIER_VALIDE,
            ServiceRequestStatus.DOSSIER_VALIDE: ServiceRequestStatus.PAYMENT_PENDING,
            ServiceRequestStatus.PAYMENT_PENDING: ServiceRequestStatus.PAYMENT_PROCESSING,
            ServiceRequestStatus.PAYMENT_PROCESSING: ServiceRequestStatus.PAID,
            ServiceRequestStatus.PAID: ServiceRequestStatus.CITA_SCHEDULED,
            ServiceRequestStatus.CITA_SCHEDULED: ServiceRequestStatus.IN_PROGRESS,
            ServiceRequestStatus.IN_PROGRESS: ServiceRequestStatus.COMPLETED,
        }

        # Add Nota de Ingreso flow if required
        if self.requires_nota_ingreso:
            base_transitions[ServiceRequestStatus.SUBMITTED] = ServiceRequestStatus.TIMBRES_PENDING
            base_transitions[ServiceRequestStatus.TIMBRES_PENDING] = ServiceRequestStatus.TIMBRES_PAID
            base_transitions[ServiceRequestStatus.TIMBRES_PAID] = ServiceRequestStatus.UNDER_REVIEW
            base_transitions[ServiceRequestStatus.DOSSIER_VALIDE] = ServiceRequestStatus.PENDING_NOTA_INGRESO
            base_transitions[ServiceRequestStatus.PENDING_NOTA_INGRESO] = ServiceRequestStatus.NOTA_UPLOADED
            base_transitions[ServiceRequestStatus.NOTA_UPLOADED] = ServiceRequestStatus.PAYMENT_PENDING

        return base_transitions

    def can_transition_to(
        self,
        current_status: ServiceRequestStatus,
        target_status: ServiceRequestStatus
    ) -> bool:
        """Check if a status transition is valid."""
        next_status = self.get_next_status(current_status)
        if next_status == target_status:
            return True

        # Special cases
        if target_status == ServiceRequestStatus.REJECTED:
            # Can always reject from review states
            return current_status in [
                ServiceRequestStatus.SUBMITTED,
                ServiceRequestStatus.UNDER_REVIEW,
                ServiceRequestStatus.DOCUMENTS_REQUIRED
            ]

        if target_status == ServiceRequestStatus.DOCUMENTS_REQUIRED:
            # Can request docs during review
            return current_status == ServiceRequestStatus.UNDER_REVIEW

        if target_status == ServiceRequestStatus.CANCELLED:
            # Can cancel from most states
            return current_status not in [
                ServiceRequestStatus.COMPLETED,
                ServiceRequestStatus.CANCELLED
            ]

        return False

    # === Workflow Info ===

    def get_info(self) -> Dict[str, Any]:
        """Get workflow information for API responses. Translations via translations module."""
        return {
            "code": self.workflow_code.value,
            "category": self.category.value,
            "entity_code": self.entity_code.value,
            "service_name_es": self.service_name_es,
            "requires_nota_ingreso": self.requires_nota_ingreso,
            "requires_appointment": self.requires_appointment,
            "requires_agent_review": self.requires_agent_review,
            "allowed_sub_types": self.allowed_sub_types,
            "total_steps": self.get_total_steps(),
            "steps": [
                {
                    "number": s.step_number,
                    "id": s.step_id,
                    "type": s.step_type.value,
                    "title_es": s.title_es,
                    "description_es": s.description_es,
                    "is_inherited": s.is_inherited
                }
                for s in self.get_steps()
            ]
        }
