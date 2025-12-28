"""
Generic Workflows - Data-driven workflow implementations.

Two types of generic workflows:
1. GenericWorkflowStandard - Agent validation BEFORE payment (default)
2. GenericWorkflowDirectPayment - Direct payment WITHOUT agent validation

These workflows load their configuration from the database (workflows table)
instead of hardcoding it in Python classes.

Usage:
    # Load from database
    workflow = await GenericWorkflowStandard.from_database(db, "WORKFLOW_CODE")

    # Or create with config dict
    workflow = GenericWorkflowStandard(config={
        "code": "MY_WORKFLOW",
        "name_es": "My Workflow",
        "entity_code": "CNEDOGE",
        ...
    })
"""
import asyncpg
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Type
from datetime import datetime
from uuid import UUID
import logging

from .base_workflow import (
    BaseWorkflow,
    WorkflowStep,
    WorkflowContext,
    TariffConfig,
    DocumentRequirement,
    ValidationResult,
    StepType
)
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


@dataclass
class WorkflowConfig:
    """Configuration loaded from workflows table."""
    code: str
    name_es: str
    description_es: Optional[str] = None
    category: str = "general"
    entity_code: str = "GENERAL"
    workflow_type: str = "standard"
    requires_agent_validation: bool = True
    requires_appointment: bool = False
    is_generic: bool = True
    appointment_delay_days: Optional[int] = None
    appointment_entity_code: Optional[str] = None
    sla_hours: int = 48
    max_processing_days: int = 30
    display_order: int = 0
    is_active: bool = True
    config: Dict[str, Any] = field(default_factory=dict)


class GenericWorkflowStandard(BaseWorkflow):
    """
    Generic workflow with agent validation BEFORE payment.

    Flow:
    DRAFT → SUBMITTED → UNDER_REVIEW → DOSSIER_VALIDE → PAYMENT_PENDING → PAID
                              │
                              ├── REJECTED (if agent rejects)
                              └── DOCUMENTS_REQUIRED (if more docs needed)

    If requires_appointment:
        ... → PAID → CITA_SCHEDULED → IN_PROGRESS → COMPLETED

    If NOT requires_appointment:
        ... → PAID → IN_PROGRESS → COMPLETED
    """

    # Override class attributes with defaults
    workflow_code: WorkflowCode = None  # Set from config
    category: WorkflowCategory = WorkflowCategory.GENERAL
    entity_code: EntityCode = EntityCode.GENERAL

    service_name_es: str = "Servicio Genérico"
    requires_nota_ingreso: bool = False
    requires_appointment: bool = False
    requires_agent_review: bool = True
    allowed_sub_types: List[str] = []

    def __init__(
        self,
        config: Optional[Dict[str, Any]] = None,
        workflow_config: Optional[WorkflowConfig] = None,
        sub_type: Optional[str] = None
    ):
        """
        Initialize generic workflow from configuration.

        Args:
            config: Dict configuration (legacy)
            workflow_config: WorkflowConfig dataclass (preferred)
            sub_type: Sub-type for the workflow
        """
        self._config = workflow_config or self._parse_config(config or {})
        self._document_requirements: List[DocumentRequirement] = []
        self._tariff_data: Optional[Dict[str, Any]] = None

        # Apply config to class attributes
        self._apply_config()

        # Call parent init (will call _setup_* methods)
        super().__init__(sub_type=sub_type)

    def _parse_config(self, config: Dict[str, Any]) -> WorkflowConfig:
        """Parse dict config into WorkflowConfig."""
        return WorkflowConfig(
            code=config.get("code", "GENERIC"),
            name_es=config.get("name_es", "Workflow Genérico"),
            description_es=config.get("description_es"),
            category=config.get("category", "general"),
            entity_code=config.get("entity_code", "GENERAL"),
            workflow_type=config.get("workflow_type", "standard"),
            requires_agent_validation=config.get("requires_agent_validation", True),
            requires_appointment=config.get("requires_appointment", False),
            is_generic=config.get("is_generic", True),
            appointment_delay_days=config.get("appointment_delay_days"),
            appointment_entity_code=config.get("appointment_entity_code"),
            sla_hours=config.get("sla_hours", 48),
            max_processing_days=config.get("max_processing_days", 30),
            display_order=config.get("display_order", 0),
            is_active=config.get("is_active", True),
            config=config.get("config", {})
        )

    def _apply_config(self) -> None:
        """Apply configuration to class attributes."""
        # Map workflow code
        try:
            self.workflow_code = WorkflowCode(self._config.code)
        except ValueError:
            # Code not in enum - use as string
            self.workflow_code = self._config.code

        # Map category
        try:
            self.category = WorkflowCategory(self._config.category)
        except ValueError:
            self.category = WorkflowCategory.GENERAL

        # Map entity
        try:
            self.entity_code = EntityCode(self._config.entity_code)
        except ValueError:
            self.entity_code = EntityCode.GENERAL

        # Apply other settings
        self.service_name_es = self._config.name_es
        self.requires_appointment = self._config.requires_appointment
        self.requires_agent_review = self._config.requires_agent_validation

    @classmethod
    async def from_database(
        cls,
        db: asyncpg.Connection,
        workflow_code: str,
        sub_type: Optional[str] = None
    ) -> "GenericWorkflowStandard":
        """
        Load workflow configuration from database.

        Args:
            db: Database connection
            workflow_code: Workflow code to load
            sub_type: Optional sub-type

        Returns:
            Configured GenericWorkflowStandard instance
        """
        # Load workflow config
        row = await db.fetchrow(
            """
            SELECT code, name_es, description_es, category, entity_code,
                   workflow_type, requires_agent_validation, requires_appointment,
                   is_generic, appointment_delay_days, appointment_entity_code,
                   sla_hours, max_processing_days, display_order, is_active, config
            FROM workflows
            WHERE code = $1 AND is_active = TRUE
            """,
            workflow_code
        )

        if not row:
            raise ValueError(f"Workflow not found or inactive: {workflow_code}")

        config = WorkflowConfig(
            code=row["code"],
            name_es=row["name_es"],
            description_es=row["description_es"],
            category=row["category"],
            entity_code=row["entity_code"],
            workflow_type=row["workflow_type"],
            requires_agent_validation=row["requires_agent_validation"],
            requires_appointment=row["requires_appointment"],
            is_generic=row["is_generic"],
            appointment_delay_days=row["appointment_delay_days"],
            appointment_entity_code=row["appointment_entity_code"],
            sla_hours=row["sla_hours"],
            max_processing_days=row["max_processing_days"],
            display_order=row["display_order"],
            is_active=row["is_active"],
            config=row["config"] or {}
        )

        # Create instance
        instance = cls(workflow_config=config, sub_type=sub_type)

        # Load document requirements
        await instance._load_document_requirements(db, workflow_code)

        # Load tariff data
        await instance._load_tariff_data(db, workflow_code)

        return instance

    async def _load_document_requirements(
        self,
        db: asyncpg.Connection,
        workflow_code: str
    ) -> None:
        """Load document requirements from database."""
        rows = await db.fetch(
            """
            SELECT document_code, document_name_es, is_required, display_order,
                   extraction_schema_key, instructions_es, condition_type, condition_value
            FROM workflow_document_requirements
            WHERE workflow_code = $1 AND is_active = TRUE
            ORDER BY display_order
            """,
            workflow_code
        )

        self._document_requirements = []
        for row in rows:
            # Parse condition type
            try:
                condition_type = DocumentConditionType(row["condition_type"])
            except ValueError:
                condition_type = DocumentConditionType.ALWAYS

            self._document_requirements.append(DocumentRequirement(
                document_code=row["document_code"],
                document_name_es=row["document_name_es"],
                schema_key=row["extraction_schema_key"],
                is_required=row["is_required"] if row["is_required"] is not None else True,
                display_order=row["display_order"] or 0,
                condition_type=condition_type,
                condition_value=row["condition_value"] or {},
                instructions_es=row["instructions_es"]
            ))

    async def _load_tariff_data(
        self,
        db: asyncpg.Connection,
        workflow_code: str
    ) -> None:
        """Load tariff configuration from database."""
        row = await db.fetchrow(
            """
            SELECT workflow_code, solicitud_type, amount, currency,
                   tariff_type, percentage_rate, legal_reference
            FROM workflow_tariffs
            WHERE workflow_code = $1 AND is_active = TRUE
            AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
            ORDER BY effective_from DESC
            LIMIT 1
            """,
            workflow_code
        )

        if row:
            self._tariff_data = dict(row)

    # === Abstract Method Implementations ===

    def _setup_specific_steps(self) -> None:
        """
        Setup workflow-specific steps.

        For GenericWorkflowStandard:
        - Step 5: Agent Review (validation by agent)
        - Step 6: Payment
        - Step 7: Appointment (if required)
        - Step 8: Confirmation
        """
        # Step 5: Agent Review
        self._steps.append(WorkflowStep(
            step_number=5,
            step_id="agent_review",
            step_type=StepType.AGENT_REVIEW,
            title_es="Revisión por Agente",
            description_es="Un agente revisará y validará su solicitud",
            is_inherited=False
        ))

        # Step 6: Payment
        self._steps.append(WorkflowStep(
            step_number=6,
            step_id="payment",
            step_type=StepType.PAYMENT,
            title_es="Pago",
            description_es="Realice el pago de las tasas correspondientes",
            is_inherited=False
        ))

        # Step 7: Appointment (if required)
        if self._config.requires_appointment:
            self._steps.append(WorkflowStep(
                step_number=7,
                step_id="appointment",
                step_type=StepType.APPOINTMENT,
                title_es="Cita",
                description_es="Se le asignará una cita para completar el trámite",
                is_inherited=False
            ))

        # Final step: Confirmation
        next_step_num = 8 if self._config.requires_appointment else 7
        self._steps.append(WorkflowStep(
            step_number=next_step_num,
            step_id="confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación",
            description_es="Su solicitud ha sido procesada",
            is_inherited=False
        ))

    def _setup_tariffs(self) -> None:
        """Setup tariff configuration from loaded data."""
        if self._tariff_data:
            tariff_type_str = self._tariff_data.get("tariff_type", "FIXED")
            try:
                tariff_type = TariffType(tariff_type_str)
            except ValueError:
                tariff_type = TariffType.FIXED

            self._tariff_config = TariffConfig(
                tariff_type=tariff_type,
                fixed_amounts={"DEFAULT": int(self._tariff_data.get("amount", 0))},
                percentage=self._tariff_data.get("percentage_rate"),
                currency=self._tariff_data.get("currency", "XAF")
            )
        else:
            # Default tariff
            self._tariff_config = TariffConfig(
                tariff_type=TariffType.FIXED,
                fixed_amounts={"DEFAULT": 0}
            )

    def get_document_requirements(self, sub_type: str) -> List[DocumentRequirement]:
        """Get document requirements, filtered by sub-type context."""
        # Create a minimal context for filtering
        context = WorkflowContext(
            service_request_id=UUID("00000000-0000-0000-0000-000000000000"),
            user_id=UUID("00000000-0000-0000-0000-000000000000"),
            workflow_code=self.workflow_code,
            solicitud_type=SolicitudType.EXPEDICION,
            sub_type=sub_type
        )

        return [
            doc for doc in self._document_requirements
            if doc.should_show(context)
        ]

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """Get cross-document validation rules from config."""
        return self._config.config.get("validation_rules", [])

    def _get_status_transitions(self) -> Dict[ServiceRequestStatus, ServiceRequestStatus]:
        """
        Get status transitions for standard workflow.

        Flow: DRAFT → SUBMITTED → UNDER_REVIEW → DOSSIER_VALIDE → PAYMENT_PENDING → PAID
        """
        transitions = {
            ServiceRequestStatus.DRAFT: ServiceRequestStatus.SUBMITTED,
            ServiceRequestStatus.SUBMITTED: ServiceRequestStatus.UNDER_REVIEW,
            ServiceRequestStatus.UNDER_REVIEW: ServiceRequestStatus.DOSSIER_VALIDE,
            ServiceRequestStatus.DOSSIER_VALIDE: ServiceRequestStatus.PAYMENT_PENDING,
            ServiceRequestStatus.PAYMENT_PENDING: ServiceRequestStatus.PAYMENT_PROCESSING,
            ServiceRequestStatus.PAYMENT_PROCESSING: ServiceRequestStatus.PAID,
        }

        # Add appointment flow if required
        if self._config.requires_appointment:
            transitions[ServiceRequestStatus.PAID] = ServiceRequestStatus.CITA_SCHEDULED
            transitions[ServiceRequestStatus.CITA_SCHEDULED] = ServiceRequestStatus.IN_PROGRESS
        else:
            transitions[ServiceRequestStatus.PAID] = ServiceRequestStatus.IN_PROGRESS

        transitions[ServiceRequestStatus.IN_PROGRESS] = ServiceRequestStatus.COMPLETED

        return transitions


class GenericWorkflowDirectPayment(BaseWorkflow):
    """
    Generic workflow with direct payment WITHOUT agent validation.

    Flow:
    DRAFT → SUBMITTED → PAYMENT_PENDING → PAID → IN_PROGRESS → COMPLETED

    No agent review step - payment happens immediately after submission.

    Use cases:
    - Cedula (ID card)
    - Copies of documents
    - Simple certificates
    - Any workflow where documents are standard and don't need verification
    """

    # Override class attributes
    workflow_code: WorkflowCode = None
    category: WorkflowCategory = WorkflowCategory.GENERAL
    entity_code: EntityCode = EntityCode.GENERAL

    service_name_es: str = "Servicio con Pago Directo"
    requires_nota_ingreso: bool = False
    requires_appointment: bool = False
    requires_agent_review: bool = False  # KEY DIFFERENCE
    allowed_sub_types: List[str] = []

    def __init__(
        self,
        config: Optional[Dict[str, Any]] = None,
        workflow_config: Optional[WorkflowConfig] = None,
        sub_type: Optional[str] = None
    ):
        """Initialize direct payment workflow."""
        self._config = workflow_config or self._parse_config(config or {})
        self._document_requirements: List[DocumentRequirement] = []
        self._tariff_data: Optional[Dict[str, Any]] = None

        # Force no agent validation
        self._config.requires_agent_validation = False

        self._apply_config()
        super().__init__(sub_type=sub_type)

    def _parse_config(self, config: Dict[str, Any]) -> WorkflowConfig:
        """Parse dict config into WorkflowConfig."""
        return WorkflowConfig(
            code=config.get("code", "GENERIC_DIRECT"),
            name_es=config.get("name_es", "Workflow Pago Directo"),
            description_es=config.get("description_es"),
            category=config.get("category", "general"),
            entity_code=config.get("entity_code", "GENERAL"),
            workflow_type="direct_payment",  # Always direct payment
            requires_agent_validation=False,  # Always false
            requires_appointment=config.get("requires_appointment", False),
            is_generic=True,
            appointment_delay_days=config.get("appointment_delay_days"),
            appointment_entity_code=config.get("appointment_entity_code"),
            sla_hours=config.get("sla_hours", 24),  # Faster SLA
            max_processing_days=config.get("max_processing_days", 7),
            display_order=config.get("display_order", 0),
            is_active=config.get("is_active", True),
            config=config.get("config", {})
        )

    def _apply_config(self) -> None:
        """Apply configuration to class attributes."""
        try:
            self.workflow_code = WorkflowCode(self._config.code)
        except ValueError:
            self.workflow_code = self._config.code

        try:
            self.category = WorkflowCategory(self._config.category)
        except ValueError:
            self.category = WorkflowCategory.GENERAL

        try:
            self.entity_code = EntityCode(self._config.entity_code)
        except ValueError:
            self.entity_code = EntityCode.GENERAL

        self.service_name_es = self._config.name_es
        self.requires_appointment = self._config.requires_appointment
        self.requires_agent_review = False  # Always false for direct payment

    @classmethod
    async def from_database(
        cls,
        db: asyncpg.Connection,
        workflow_code: str,
        sub_type: Optional[str] = None
    ) -> "GenericWorkflowDirectPayment":
        """Load workflow configuration from database."""
        row = await db.fetchrow(
            """
            SELECT code, name_es, description_es, category, entity_code,
                   workflow_type, requires_agent_validation, requires_appointment,
                   is_generic, appointment_delay_days, appointment_entity_code,
                   sla_hours, max_processing_days, display_order, is_active, config
            FROM workflows
            WHERE code = $1 AND is_active = TRUE
            """,
            workflow_code
        )

        if not row:
            raise ValueError(f"Workflow not found or inactive: {workflow_code}")

        # Verify it's a direct payment workflow
        if row["workflow_type"] != "direct_payment" and row["requires_agent_validation"]:
            logger.warning(
                f"Workflow {workflow_code} is not configured as direct_payment, "
                f"but loading as GenericWorkflowDirectPayment anyway"
            )

        config = WorkflowConfig(
            code=row["code"],
            name_es=row["name_es"],
            description_es=row["description_es"],
            category=row["category"],
            entity_code=row["entity_code"],
            workflow_type="direct_payment",  # Force direct payment
            requires_agent_validation=False,  # Force no validation
            requires_appointment=row["requires_appointment"],
            is_generic=row["is_generic"],
            appointment_delay_days=row["appointment_delay_days"],
            appointment_entity_code=row["appointment_entity_code"],
            sla_hours=row["sla_hours"],
            max_processing_days=row["max_processing_days"],
            display_order=row["display_order"],
            is_active=row["is_active"],
            config=row["config"] or {}
        )

        instance = cls(workflow_config=config, sub_type=sub_type)
        await instance._load_document_requirements(db, workflow_code)
        await instance._load_tariff_data(db, workflow_code)

        return instance

    async def _load_document_requirements(
        self,
        db: asyncpg.Connection,
        workflow_code: str
    ) -> None:
        """Load document requirements from database."""
        rows = await db.fetch(
            """
            SELECT document_code, document_name_es, is_required, display_order,
                   extraction_schema_key, instructions_es, condition_type, condition_value
            FROM workflow_document_requirements
            WHERE workflow_code = $1 AND is_active = TRUE
            ORDER BY display_order
            """,
            workflow_code
        )

        self._document_requirements = []
        for row in rows:
            try:
                condition_type = DocumentConditionType(row["condition_type"])
            except ValueError:
                condition_type = DocumentConditionType.ALWAYS

            self._document_requirements.append(DocumentRequirement(
                document_code=row["document_code"],
                document_name_es=row["document_name_es"],
                schema_key=row["extraction_schema_key"],
                is_required=row["is_required"] if row["is_required"] is not None else True,
                display_order=row["display_order"] or 0,
                condition_type=condition_type,
                condition_value=row["condition_value"] or {},
                instructions_es=row["instructions_es"]
            ))

    async def _load_tariff_data(
        self,
        db: asyncpg.Connection,
        workflow_code: str
    ) -> None:
        """Load tariff configuration from database."""
        row = await db.fetchrow(
            """
            SELECT workflow_code, solicitud_type, amount, currency,
                   tariff_type, percentage_rate, legal_reference
            FROM workflow_tariffs
            WHERE workflow_code = $1 AND is_active = TRUE
            AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
            ORDER BY effective_from DESC
            LIMIT 1
            """,
            workflow_code
        )

        if row:
            self._tariff_data = dict(row)

    # === Abstract Method Implementations ===

    def _setup_specific_steps(self) -> None:
        """
        Setup workflow-specific steps.

        For GenericWorkflowDirectPayment:
        - NO Agent Review step
        - Step 5: Payment (directly after validation)
        - Step 6: Appointment (if required)
        - Step 7: Confirmation
        """
        # Step 5: Payment (NO agent review!)
        self._steps.append(WorkflowStep(
            step_number=5,
            step_id="payment",
            step_type=StepType.PAYMENT,
            title_es="Pago",
            description_es="Realice el pago de las tasas correspondientes",
            is_inherited=False
        ))

        # Step 6: Appointment (if required)
        if self._config.requires_appointment:
            self._steps.append(WorkflowStep(
                step_number=6,
                step_id="appointment",
                step_type=StepType.APPOINTMENT,
                title_es="Cita",
                description_es="Se le asignará una cita para recoger su documento",
                is_inherited=False
            ))

        # Final step: Confirmation
        next_step_num = 7 if self._config.requires_appointment else 6
        self._steps.append(WorkflowStep(
            step_number=next_step_num,
            step_id="confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación",
            description_es="Su solicitud ha sido procesada",
            is_inherited=False
        ))

    def _setup_tariffs(self) -> None:
        """Setup tariff configuration."""
        if self._tariff_data:
            tariff_type_str = self._tariff_data.get("tariff_type", "FIXED")
            try:
                tariff_type = TariffType(tariff_type_str)
            except ValueError:
                tariff_type = TariffType.FIXED

            self._tariff_config = TariffConfig(
                tariff_type=tariff_type,
                fixed_amounts={"DEFAULT": int(self._tariff_data.get("amount", 0))},
                percentage=self._tariff_data.get("percentage_rate"),
                currency=self._tariff_data.get("currency", "XAF")
            )
        else:
            self._tariff_config = TariffConfig(
                tariff_type=TariffType.FIXED,
                fixed_amounts={"DEFAULT": 0}
            )

    def get_document_requirements(self, sub_type: str) -> List[DocumentRequirement]:
        """Get document requirements."""
        context = WorkflowContext(
            service_request_id=UUID("00000000-0000-0000-0000-000000000000"),
            user_id=UUID("00000000-0000-0000-0000-000000000000"),
            workflow_code=self.workflow_code,
            solicitud_type=SolicitudType.EXPEDICION,
            sub_type=sub_type
        )

        return [
            doc for doc in self._document_requirements
            if doc.should_show(context)
        ]

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """Get cross-document validation rules."""
        return self._config.config.get("validation_rules", [])

    def _get_status_transitions(self) -> Dict[ServiceRequestStatus, ServiceRequestStatus]:
        """
        Get status transitions for direct payment workflow.

        Flow: DRAFT → SUBMITTED → PAYMENT_PENDING → PAID → ...
        NO UNDER_REVIEW or DOSSIER_VALIDE states!
        """
        transitions = {
            ServiceRequestStatus.DRAFT: ServiceRequestStatus.SUBMITTED,
            # Direct to payment - NO agent review!
            ServiceRequestStatus.SUBMITTED: ServiceRequestStatus.PAYMENT_PENDING,
            ServiceRequestStatus.PAYMENT_PENDING: ServiceRequestStatus.PAYMENT_PROCESSING,
            ServiceRequestStatus.PAYMENT_PROCESSING: ServiceRequestStatus.PAID,
        }

        # Add appointment flow if required
        if self._config.requires_appointment:
            transitions[ServiceRequestStatus.PAID] = ServiceRequestStatus.CITA_SCHEDULED
            transitions[ServiceRequestStatus.CITA_SCHEDULED] = ServiceRequestStatus.IN_PROGRESS
        else:
            transitions[ServiceRequestStatus.PAID] = ServiceRequestStatus.IN_PROGRESS

        transitions[ServiceRequestStatus.IN_PROGRESS] = ServiceRequestStatus.COMPLETED

        return transitions


# === Factory Function ===

async def load_generic_workflow(
    db: asyncpg.Connection,
    workflow_code: str,
    sub_type: Optional[str] = None
) -> BaseWorkflow:
    """
    Factory function to load the appropriate generic workflow.

    Automatically selects GenericWorkflowStandard or GenericWorkflowDirectPayment
    based on the workflow_type in the database.

    Args:
        db: Database connection
        workflow_code: Workflow code to load
        sub_type: Optional sub-type

    Returns:
        Appropriate BaseWorkflow subclass instance
    """
    # Check workflow type
    row = await db.fetchrow(
        "SELECT workflow_type, requires_agent_validation FROM workflows WHERE code = $1",
        workflow_code
    )

    if not row:
        raise ValueError(f"Workflow not found: {workflow_code}")

    # Select appropriate class
    if row["workflow_type"] == "direct_payment" or not row["requires_agent_validation"]:
        return await GenericWorkflowDirectPayment.from_database(db, workflow_code, sub_type)
    else:
        return await GenericWorkflowStandard.from_database(db, workflow_code, sub_type)
