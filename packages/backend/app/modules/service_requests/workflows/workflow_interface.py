"""
WorkflowInterface - Protocol defining the contract for all workflows.

This module provides:
1. WorkflowInterface Protocol - The contract that ALL workflows must implement
2. Core dataclasses - StepType, WorkflowStep, DocumentRequirement, etc.
3. RenovacionMotivo - Enum for renewal reasons

Architecture:
- PredefinedWorkflow: Code-based workflows (pasaporte, residencia, etc.) - AUTONOMOUS
- ConfigurableWorkflow: Admin dashboard created workflows - Uses BaseWorkflow

The key principle: Each workflow is AUTONOMOUS and defines ALL its logic internally.
No more relying on base class for steps that might conflict.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Protocol, runtime_checkable
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

# Import form config dataclasses (lazy import to avoid circular dependency)
# These are imported at runtime in get_form_config()

logger = logging.getLogger(__name__)


# =============================================================================
# ENUMS
# =============================================================================

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


class RenovacionMotivo(str, Enum):
    """
    Reason for RENOVACION (renewal) request.

    Business logic:
    - VENCIMIENTO: Document expired or expiring soon
    - PERDIDA: Document was lost
    - ROBO: Document was stolen
    - DETERIORO: Document is damaged

    Each motivo may require different documents and has different tariffs.
    """
    VENCIMIENTO = "VENCIMIENTO"  # Expired/expiring
    PERDIDA = "PERDIDA"          # Lost
    ROBO = "ROBO"                # Stolen
    DETERIORO = "DETERIORO"      # Damaged


# =============================================================================
# DATACLASSES
# =============================================================================

@dataclass
class ValidationResult:
    """Result of a validation check."""
    is_valid: bool
    rule_id: str
    severity: str = "error"  # error, warning, info
    message_es: Optional[str] = None
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
    Document required for a workflow.

    Attributes:
        document_code: Unique code for the document (e.g., "dip", "certificado_nacimiento")
        document_name_es: Spanish name for display
        schema_key: OCR extraction schema key (e.g., "DIP_GQ_V2")
        is_required: Whether document is mandatory
        display_order: Order in UI
        condition_type: When to show this document
        condition_value: Additional condition parameters
        instructions_es: Spanish instructions for upload
        faces_required: Required faces (e.g., ["recto", "verso"])
        accepted_formats: Allowed file formats
        max_size_mb: Maximum file size in MB
        config: Additional frontend configuration
    """
    document_code: str
    document_name_es: str
    schema_key: Optional[str] = None
    is_required: bool = True
    display_order: int = 0
    condition_type: DocumentConditionType = DocumentConditionType.ALWAYS
    condition_value: Dict[str, Any] = field(default_factory=dict)
    instructions_es: Optional[str] = None
    faces_required: List[str] = field(default_factory=list)
    accepted_formats: List[str] = field(default_factory=lambda: ["pdf", "jpg", "png"])
    max_size_mb: int = 10
    config: Dict[str, Any] = field(default_factory=dict)

    def should_show(self, context: "WorkflowContext") -> bool:
        """Determine if document should be shown based on condition."""
        if self.condition_type == DocumentConditionType.ALWAYS:
            return True

        if self.condition_type == DocumentConditionType.IS_NEW:
            return context.solicitud_type == SolicitudType.EXPEDICION

        if self.condition_type == DocumentConditionType.IS_RENEWAL:
            return context.solicitud_type == SolicitudType.RENOVACION

        if self.condition_type == DocumentConditionType.IS_DUPLICATE:
            return context.solicitud_type == SolicitudType.DUPLICADO

        if self.condition_type == DocumentConditionType.IS_MINOR:
            age = context.get_user_age()
            return age is not None and age < 18

        if self.condition_type == DocumentConditionType.IS_ADULT:
            age = context.get_user_age()
            return age is not None and age >= 18

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
            return self._evaluate_custom_condition(context)

        return True

    def _evaluate_custom_condition(self, context: "WorkflowContext") -> bool:
        """Evaluate custom condition expression."""
        allowed_types = self.condition_value.get("types", [])
        if allowed_types and context.sub_type:
            return context.sub_type in allowed_types

        # Check motivo for RENOVACION
        allowed_motivos = self.condition_value.get("motivos", [])
        if allowed_motivos and context.motivo:
            return context.motivo in allowed_motivos

        return True


@dataclass
class WorkflowStep:
    """
    A step in the workflow.

    Each workflow defines ALL its steps internally.
    No "inherited" steps - everything is explicit.
    """
    step_number: int
    step_id: str
    step_type: StepType
    title_es: str
    description_es: Optional[str] = None
    documents: List[DocumentRequirement] = field(default_factory=list)
    is_optional: bool = False
    requires_previous: bool = True
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
    sub_type: Optional[str] = None  # Legacy: NUEVO, RENOVACION, etc.
    motivo: Optional[RenovacionMotivo] = None  # NEW: For RENOVACION type
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

    # Reference number (for payment descriptions, receipts, etc.)
    reference_number: Optional[str] = None

    def get_user_age(self) -> Optional[int]:
        """Calculate user age from extracted data (DIP fecha_nacimiento)."""
        dip_data = self.extracted_data.get("dip", {})
        fecha_nac = dip_data.get("titular", {}).get("fecha_nacimiento")

        if not fecha_nac:
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
        return False  # Will check verified_identifiers

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
class SupplementDefinition:
    """
    Hardcoded supplement definition for PredefinedWorkflows.

    Structure aligned with DB tables:
    - code: tariff_supplements.code
    - name_es: tariff_supplements.name_es
    - unit_price: tariff_supplements.amount
    - quantity: workflow_supplement_config.quantity_per_request
    - is_required: workflow_supplement_config.is_required
    """
    code: str              # e.g., "TIMBRE_FISCAL", "CEDULA_PERSONAL"
    name_es: str           # Display name in Spanish
    unit_price: int        # Amount in XAF
    quantity: int = 1      # Number per request
    is_required: bool = True

    @property
    def subtotal(self) -> int:
        """Calculate subtotal."""
        return self.unit_price * self.quantity


@dataclass
class TariffConfig:
    """
    Tariff configuration for a workflow.

    For PredefinedWorkflows: Define fixed_amounts AND supplements here.
    For GenericWorkflows: Tariffs/supplements come from DB via TariffService.
    """
    tariff_type: TariffType
    fixed_amounts: Dict[str, int] = field(default_factory=dict)  # key -> amount
    percentage: Optional[float] = None
    rbc_params: Dict[str, Any] = field(default_factory=dict)
    currency: str = "XAF"
    # Supplements for PredefinedWorkflows (hardcoded)
    supplements: List[SupplementDefinition] = field(default_factory=list)
    extra: Dict[str, Any] = field(default_factory=dict)

    def get_amount(self, key: str, value: Optional[float] = None) -> int:
        """Calculate tariff amount based on type and configuration."""
        if self.tariff_type == TariffType.FIXED:
            return self.fixed_amounts.get(key, 0)

        if self.tariff_type == TariffType.PERCENTAGE and value:
            return int(value * (self.percentage or 0) / 100)

        if self.tariff_type == TariffType.RBC:
            return 0  # Calculated by RBC calculator

        if self.tariff_type == TariffType.NOTA_INGRESO:
            return 0  # Determined by Nota

        return 0

    @property
    def supplements_total(self) -> int:
        """Calculate total of all supplements."""
        return sum(s.subtotal for s in self.supplements)

    def get_total(self, key: str, value: Optional[float] = None) -> int:
        """Get total amount including supplements."""
        return self.get_amount(key, value) + self.supplements_total


# =============================================================================
# WORKFLOW INTERFACE (Protocol)
# =============================================================================

@runtime_checkable
class WorkflowInterface(Protocol):
    """
    Protocol defining the contract for all workflows.

    Every workflow (predefined or configurable) must implement this interface.
    This ensures consistency while allowing complete autonomy in implementation.

    Key principle: Each workflow is AUTONOMOUS.
    - Defines ALL its steps internally (no inheritance conflicts)
    - Has its own document requirements logic
    - Has its own tariff calculation logic
    - Has its own validation rules
    """

    # === Required Properties ===

    @property
    def workflow_code(self) -> WorkflowCode:
        """Unique code identifying this workflow."""
        ...

    @property
    def category(self) -> WorkflowCategory:
        """Category for UI grouping."""
        ...

    @property
    def entity_code(self) -> EntityCode:
        """Entity responsible for processing."""
        ...

    @property
    def service_name_es(self) -> str:
        """Spanish service name for display."""
        ...

    @property
    def allowed_solicitud_types(self) -> List[SolicitudType]:
        """Allowed solicitud types (EXPEDICION, RENOVACION, DUPLICADO)."""
        ...

    # === Workflow Configuration ===

    @property
    def requires_appointment(self) -> bool:
        """Whether workflow requires scheduling a cita."""
        ...

    @property
    def requires_agent_review(self) -> bool:
        """Whether workflow requires agent review."""
        ...

    @property
    def requires_nota_ingreso(self) -> bool:
        """Whether workflow requires Nota de Ingreso from Treasury."""
        ...

    # === Step Management ===

    def get_steps(self, context: Optional[WorkflowContext] = None) -> List[WorkflowStep]:
        """
        Get ALL workflow steps in order.

        Each workflow defines its complete step sequence internally.
        Context can be used to customize steps based on solicitud_type/motivo.
        """
        ...

    def get_step(self, step_number: int) -> Optional[WorkflowStep]:
        """Get a specific step by number."""
        ...

    def get_step_by_id(self, step_id: str) -> Optional[WorkflowStep]:
        """Get a specific step by ID."""
        ...

    def get_total_steps(self) -> int:
        """Get total number of steps."""
        ...

    # === Document Requirements ===

    def get_document_requirements(
        self,
        solicitud_type: SolicitudType,
        motivo: Optional[RenovacionMotivo] = None,
        context: Optional[WorkflowContext] = None
    ) -> List[DocumentRequirement]:
        """
        Get document requirements based on solicitud type and motivo.

        Args:
            solicitud_type: EXPEDICION, RENOVACION, or DUPLICADO
            motivo: For RENOVACION: VENCIMIENTO, PERDIDA, ROBO, DETERIORO
            context: Optional runtime context for additional conditions

        Returns:
            List of required documents for this request type
        """
        ...

    # === Tariff Calculation ===

    def get_tariff(
        self,
        solicitud_type: SolicitudType,
        motivo: Optional[RenovacionMotivo] = None,
        context: Optional[WorkflowContext] = None
    ) -> int:
        """
        Get tariff amount for this request.

        Args:
            solicitud_type: EXPEDICION, RENOVACION, or DUPLICADO
            motivo: For RENOVACION: reason (affects pricing)
            context: Optional runtime context

        Returns:
            Amount in XAF (centimes)
        """
        ...

    def get_tariff_config(self) -> TariffConfig:
        """Get the full tariff configuration."""
        ...

    # === Validation ===

    def get_form_mapping(self, context: Optional[WorkflowContext] = None) -> Dict[str, str]:
        """
        Get mapping from extracted document data to form fields.

        Returns:
            Dict mapping form_field_name -> extraction_path
            Example: {"numero_dip": "dip.documento.numero_dip"}

        The extraction_path follows dot notation:
        - "dip.titular.nombres" -> extracted_data["dip"]["titular"]["nombres"]
        """
        ...

    def validate_step(
        self,
        step_number: int,
        context: WorkflowContext
    ) -> List[ValidationResult]:
        """Validate a specific step."""
        ...

    def validate_documents(self, context: WorkflowContext) -> List[ValidationResult]:
        """Validate all documents for completeness."""
        ...

    # === Status Management ===

    def get_next_status(
        self,
        current_status: ServiceRequestStatus
    ) -> Optional[ServiceRequestStatus]:
        """Get the next valid status in the workflow."""
        ...

    def can_transition_to(
        self,
        current_status: ServiceRequestStatus,
        target_status: ServiceRequestStatus
    ) -> bool:
        """Check if a status transition is valid."""
        ...

    # === Workflow Info ===

    def get_info(self) -> Dict[str, Any]:
        """Get workflow information for API responses."""
        ...


# =============================================================================
# BASE PREDEFINED WORKFLOW (Abstract)
# =============================================================================

class PredefinedWorkflow(ABC):
    """
    Abstract base for predefined (code-based) workflows.

    Provides common utilities but does NOT define steps.
    Each workflow is AUTONOMOUS and must define ALL its logic.

    Use this for complex workflows with specific business logic:
    - Pasaporte, Residencia, Vehiculo, Conducir, Contrato, Funcion Publica
    """

    def __init__(self):
        """Initialize the workflow. Subclass must set up steps and tariffs."""
        self._steps: List[WorkflowStep] = []
        self._tariff_config: Optional[TariffConfig] = None
        self._setup_workflow()

    # === Abstract Methods (MUST be implemented) ===

    @property
    @abstractmethod
    def workflow_code(self) -> WorkflowCode:
        """Unique workflow code."""
        ...

    @property
    @abstractmethod
    def category(self) -> WorkflowCategory:
        """Workflow category."""
        ...

    @property
    @abstractmethod
    def entity_code(self) -> EntityCode:
        """Responsible entity."""
        ...

    @property
    @abstractmethod
    def service_name_es(self) -> str:
        """Spanish service name."""
        ...

    @property
    @abstractmethod
    def allowed_solicitud_types(self) -> List[SolicitudType]:
        """Allowed solicitud types."""
        ...

    @property
    def requires_appointment(self) -> bool:
        """Override if workflow requires cita."""
        return False

    @property
    def requires_agent_review(self) -> bool:
        """Override if workflow requires agent review."""
        return True

    @property
    def requires_nota_ingreso(self) -> bool:
        """Override if workflow requires Nota de Ingreso."""
        return False

    @property
    def allowed_sub_types(self) -> List[str]:
        """Override if workflow has sub-types (e.g., certificate types, leave reasons)."""
        return []

    @abstractmethod
    def _setup_workflow(self) -> None:
        """
        Setup the complete workflow.

        MUST define:
        1. All steps via add_step()
        2. Tariff config via set_tariff_config()
        """
        ...

    @abstractmethod
    def get_document_requirements(
        self,
        solicitud_type: SolicitudType,
        motivo: Optional[RenovacionMotivo] = None,
        context: Optional[WorkflowContext] = None
    ) -> List[DocumentRequirement]:
        """Get document requirements."""
        ...

    @abstractmethod
    def get_form_mapping(self, context: Optional[WorkflowContext] = None) -> Dict[str, str]:
        """
        Get mapping from extracted document data to form fields.

        Args:
            context: Workflow context (for conditional mappings like is_minor)

        Returns:
            Dict mapping form_field_name -> extraction_path
            Example: {"numero_dip": "dip.documento.numero_dip"}
        """
        ...

    # === Step Management (final implementation) ===

    def add_step(self, step: WorkflowStep) -> None:
        """Add a step to the workflow."""
        self._steps.append(step)

    def set_tariff_config(self, config: TariffConfig) -> None:
        """Set the tariff configuration."""
        self._tariff_config = config

    def get_steps(self, context: Optional[WorkflowContext] = None) -> List[WorkflowStep]:
        """Get all steps in order."""
        return sorted(self._steps, key=lambda s: s.step_number)

    def get_step(self, step_number: int) -> Optional[WorkflowStep]:
        """Get step by number."""
        for step in self._steps:
            if step.step_number == step_number:
                return step
        return None

    def get_step_by_id(self, step_id: str) -> Optional[WorkflowStep]:
        """Get step by ID."""
        for step in self._steps:
            if step.step_id == step_id:
                return step
        return None

    def get_total_steps(self) -> int:
        """Get total steps."""
        return len(self._steps)

    # === Tariff Management ===

    def get_tariff_config(self) -> TariffConfig:
        """Get tariff config."""
        return self._tariff_config or TariffConfig(tariff_type=TariffType.FIXED)

    def get_tariff(
        self,
        solicitud_type: SolicitudType,
        motivo: Optional[RenovacionMotivo] = None,
        context: Optional[WorkflowContext] = None
    ) -> int:
        """Get tariff amount."""
        if not self._tariff_config:
            return 0

        # Build the key for tariff lookup
        # For RENOVACION with motivo, use motivo as key
        if solicitud_type == SolicitudType.RENOVACION and motivo:
            key = motivo.value
        else:
            key = solicitud_type.value.upper()

        return self._tariff_config.get_amount(key)

    def get_tariff_breakdown(
        self,
        solicitud_type: SolicitudType,
        motivo: Optional[RenovacionMotivo] = None,
        context: Optional[WorkflowContext] = None,
        base_description: str = ""
    ) -> Dict[str, Any]:
        """
        Get complete tariff breakdown including supplements.

        Returns a dict compatible with TariffBreakdown.from_dict():
        {
            "base_amount": int,
            "base_description": str,
            "supplements": [{"code", "name_es", "unit_price", "quantity", "subtotal"}],
            "supplements_total": int,
            "penalties_amount": int,
            "total_amount": int,
            "currency": str,
            "tariff_type": str,
            "workflow_code": str,
            "solicitud_type": str
        }
        """
        config = self.get_tariff_config()
        base_amount = self.get_tariff(solicitud_type, motivo, context)

        # Convert SupplementDefinition list to dict format
        supplements = [
            {
                "code": s.code,
                "name_es": s.name_es,
                "unit_price": s.unit_price,
                "quantity": s.quantity,
                "subtotal": s.subtotal,
                "is_required": s.is_required
            }
            for s in config.supplements
        ]

        supplements_total = sum(s["subtotal"] for s in supplements)
        total_amount = base_amount + supplements_total

        return {
            "base_amount": base_amount,
            "base_description": base_description or self.service_name_es,
            "supplements": supplements,
            "supplements_total": supplements_total,
            "penalties_amount": 0,
            "penalty_reason": None,
            "total_amount": total_amount,
            "currency": config.currency,
            "tariff_type": config.tariff_type.value,
            "workflow_code": self.workflow_code.value,
            "solicitud_type": solicitud_type.value
        }

    # === Validation ===

    def validate_step(
        self,
        step_number: int,
        context: WorkflowContext
    ) -> List[ValidationResult]:
        """Validate a specific step.

        Base implementation handles DOCUMENT_UPLOAD steps (required doc checks).
        Subclasses override to add business logic on FORM_REVIEW steps.

        Validation architecture (2 layers, no overlap):
        - Layer 1 (upload time): SchemaValidationEngine + RiskAnalyzer (Gemini)
        - Layer 2 (form review): validate_step() overrides (this method)
        """
        step = self.get_step(step_number)
        if not step:
            return []

        results = []

        if step.step_type == StepType.DOCUMENT_UPLOAD:
            results.extend(self._validate_documents_for_step(step, context))

        return results

    def validate_documents(self, context: WorkflowContext) -> List[ValidationResult]:
        """Validate all required documents are uploaded."""
        results = []
        requirements = self.get_document_requirements(
            context.solicitud_type,
            context.motivo,
            context
        )

        for doc in requirements:
            if doc.is_required and doc.document_code not in context.documents_uploaded:
                results.append(ValidationResult(
                    is_valid=False,
                    rule_id=f"doc_required_{doc.document_code}",
                    severity="error",
                    message_es=f"El documento {doc.document_name_es} es obligatorio",
                    document_code=doc.document_code
                ))

        return results

    def _validate_documents_for_step(
        self,
        step: WorkflowStep,
        context: WorkflowContext
    ) -> List[ValidationResult]:
        """Validate documents for a step."""
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

    # === Status Transitions ===

    def get_next_status(
        self,
        current_status: ServiceRequestStatus
    ) -> Optional[ServiceRequestStatus]:
        """Get next valid status."""
        transitions = self._get_status_transitions()
        return transitions.get(current_status)

    def _get_status_transitions(self) -> Dict[ServiceRequestStatus, ServiceRequestStatus]:
        """Get valid status transitions."""
        transitions = {
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

        if self.requires_nota_ingreso:
            transitions[ServiceRequestStatus.SUBMITTED] = ServiceRequestStatus.TIMBRES_PENDING
            transitions[ServiceRequestStatus.TIMBRES_PENDING] = ServiceRequestStatus.TIMBRES_PAID
            transitions[ServiceRequestStatus.TIMBRES_PAID] = ServiceRequestStatus.UNDER_REVIEW
            transitions[ServiceRequestStatus.DOSSIER_VALIDE] = ServiceRequestStatus.PENDING_NOTA_INGRESO
            transitions[ServiceRequestStatus.PENDING_NOTA_INGRESO] = ServiceRequestStatus.NOTA_UPLOADED
            transitions[ServiceRequestStatus.NOTA_UPLOADED] = ServiceRequestStatus.PAYMENT_PENDING

        if not self.requires_appointment:
            # Skip CITA_SCHEDULED if no appointment needed
            transitions[ServiceRequestStatus.PAID] = ServiceRequestStatus.IN_PROGRESS

        return transitions

    def can_transition_to(
        self,
        current_status: ServiceRequestStatus,
        target_status: ServiceRequestStatus
    ) -> bool:
        """Check if transition is valid."""
        next_status = self.get_next_status(current_status)
        if next_status == target_status:
            return True

        # Special transitions
        if target_status == ServiceRequestStatus.REJECTED:
            return current_status in [
                ServiceRequestStatus.SUBMITTED,
                ServiceRequestStatus.UNDER_REVIEW,
                ServiceRequestStatus.DOCUMENTS_REQUIRED
            ]

        if target_status == ServiceRequestStatus.DOCUMENTS_REQUIRED:
            return current_status == ServiceRequestStatus.UNDER_REVIEW

        if target_status == ServiceRequestStatus.CANCELLED:
            return current_status not in [
                ServiceRequestStatus.COMPLETED,
                ServiceRequestStatus.CANCELLED
            ]

        return False

    # === Workflow Info ===

    def get_info(self) -> Dict[str, Any]:
        """Get workflow info for API."""
        return {
            "code": self.workflow_code.value,
            "category": self.category.value,
            "entity_code": self.entity_code.value,
            "service_name_es": self.service_name_es,
            "requires_nota_ingreso": self.requires_nota_ingreso,
            "requires_appointment": self.requires_appointment,
            "requires_agent_review": self.requires_agent_review,
            "allowed_solicitud_types": [t.value for t in self.allowed_solicitud_types],
            "total_steps": self.get_total_steps(),
            "steps": [
                {
                    "number": s.step_number,
                    "id": s.step_id,
                    "type": s.step_type.value,
                    "title_es": s.title_es,
                    "description_es": s.description_es,
                }
                for s in self.get_steps()
            ]
        }

    # === Dynamic Form Config ===

    def get_form_config(self, step_id: str, context: "WorkflowContext") -> "FormConfig":
        """
        Get form configuration for a step with sections filtered by conditions.

        This method reads the step's config["sections"] (or sections_adult/sections_minor)
        and returns only the sections that match the current context.

        Args:
            step_id: ID of the step (e.g., "form_review_1", "form_review_2")
            context: Workflow context with solicitud_type, motivo, form_data, etc.

        Returns:
            FormConfig with filtered sections based on context conditions.

        Raises:
            ValueError: If step not found or not a FORM_REVIEW step.

        Example:
            context = WorkflowContext(solicitud_type=SolicitudType.RENOVACION, ...)
            config = workflow.get_form_config("form_review_2", context)
            # Returns: FormConfig with filiacion + pasaporte_anterior sections
        """
        # Lazy imports to avoid circular dependencies
        from .form_config import FormConfig, FormSection, FormField
        from ..services.condition_evaluator import evaluate_condition

        # Get the step
        step = self.get_step_by_id(step_id)
        if not step:
            # Get list of valid form review step IDs for helpful error message
            form_review_steps = [
                s.step_id for s in self.get_steps()
                if s.step_type == StepType.FORM_REVIEW
            ]
            valid_ids = ", ".join(form_review_steps) if form_review_steps else "none"
            raise ValueError(
                f"Step '{step_id}' not found in workflow {self.workflow_code.value}. "
                f"Valid form_review steps: [{valid_ids}]"
            )

        if step.step_type != StepType.FORM_REVIEW:
            # Get list of valid form review step IDs for helpful error message
            form_review_steps = [
                s.step_id for s in self.get_steps()
                if s.step_type == StepType.FORM_REVIEW
            ]
            valid_ids = ", ".join(form_review_steps) if form_review_steps else "none"
            raise ValueError(
                f"Step '{step_id}' is not a FORM_REVIEW step (type: {step.step_type.value}). "
                f"Valid form_review steps: [{valid_ids}]"
            )

        config = step.config or {}

        # Build evaluation context from WorkflowContext
        eval_context = self._build_eval_context(context)

        # Choose sections based on is_minor (if variants exist)
        is_minor = eval_context.get("is_minor", False)

        if is_minor and "sections_minor" in config:
            raw_sections = config["sections_minor"]
        elif not is_minor and "sections_adult" in config:
            raw_sections = config["sections_adult"]
        else:
            raw_sections = config.get("sections", [])

        # Filter sections by evaluating conditions
        filtered_sections = []
        for section_data in raw_sections:
            condition = section_data.get("condition")

            # Evaluate condition (None/empty = always show)
            if evaluate_condition(condition, eval_context):
                # Convert fields, filtering by field-level conditions
                fields = [
                    FormField.from_dict(f)
                    for f in section_data.get("fields", [])
                    if evaluate_condition(f.get("condition"), eval_context)
                ]

                # Skip section if all fields were filtered out
                if not fields:
                    continue

                filtered_sections.append(FormSection(
                    id=section_data["id"],
                    title_es=section_data.get("title_es", section_data["id"]),
                    fields=fields,
                    condition=condition,
                    source_document=section_data.get("source_document"),
                    description_es=section_data.get("description_es")
                ))

        return FormConfig(
            step_id=step_id,
            title_es=step.title_es,
            sections=filtered_sections,
            description_es=step.description_es
        )

    def _build_eval_context(self, context: "WorkflowContext") -> Dict[str, Any]:
        """
        Build a flat dict context for condition evaluation.

        Extracts relevant values from WorkflowContext into a simple dict
        that the ConditionEvaluator can use.

        Args:
            context: WorkflowContext with all request data

        Returns:
            Dict with keys like solicitud_type, motivo, is_minor, etc.
        """
        # Determine is_minor from form_data or calculated age
        is_minor = context.form_data.get("is_minor", False)
        if not is_minor:
            age = context.get_user_age()
            if age is not None:
                is_minor = age < 18

        eval_context = {
            # Core workflow values
            "solicitud_type": context.solicitud_type.value if context.solicitud_type else None,
            "motivo": context.motivo.value if context.motivo else None,
            "sub_type": context.sub_type,

            # Calculated values
            "is_minor": is_minor,

            # User age (for age-based conditions like conducir)
            "age": context.get_user_age(),

            # Common form_data fields (any workflow can use these)
            "representante_unico": context.form_data.get("representante_unico", False),
        }

        # Add all form_data keys to context (for fully dynamic conditions)
        # This allows any workflow to define conditions based on their specific form fields
        for key, value in context.form_data.items():
            if key not in eval_context:  # Don't override core keys
                eval_context[key] = value

        return eval_context
