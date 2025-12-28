"""
VerificacionFuncionarioWorkflow - Civil servant verification workflow.

This is a PREREQUISITE workflow that must be completed before accessing
any other FuncionPublica services. It verifies that a user is a registered
civil servant in the Ministry of Public Function (SIGEF system).

Entity: MINFP (Ministerio de la Funcion Publica y Reforma Administrativa)

Security: Matricula alone is NOT sufficient. Identity must be verified
by comparing with an official identity document.
"""
from typing import List, Dict, Any

from ..base_workflow import (
    BaseWorkflow,
    WorkflowStep,
    WorkflowContext,
    DocumentRequirement,
    TariffConfig,
    StepType
)
from ...models.enums import (
    WorkflowCode,
    WorkflowCategory,
    EntityCode,
    TariffType,
    DocumentConditionType
)


class VerificacionFuncionarioWorkflow(BaseWorkflow):
    """
    Civil servant verification workflow.

    This workflow verifies that a user is a registered civil servant
    in the SIGEF system of the Ministry of Public Function.

    Once verified, the user gains access to the "Funcion Publica" menu
    with services like:
    - Carnet de Funcionario
    - Reconocimiento de Trienios
    - Corrida de Nivel/Escala
    - Permisos Extraordinarios
    - Certificados Administrativos

    Process:
    1. User enters matricula (e.g., FP-12345)
    2. User uploads identity document (DIP/Passport/Residence Permit)
    3. System extracts data from document
    4. Agent verifies in SIGEF that matricula exists and name matches
    5. If approved: user.role = 'funcionario', user.matricula = matricula
    """

    # Class attributes
    workflow_code = WorkflowCode.FP_VERIFICACION_FUNCIONARIO
    category = WorkflowCategory.FUNCION_PUBLICA
    entity_code = EntityCode.MINFP

    service_name_es = "Verificación de Funcionario"

    requires_nota_ingreso = False
    requires_appointment = False
    requires_agent_review = True

    allowed_sub_types = ["VERIFICACION"]

    # No payment required for verification
    TARIFF = 0

    def _setup_specific_steps(self) -> None:
        """Setup verification-specific workflow steps."""

        # Step 5: Enter Matricula
        self.add_step(WorkflowStep(
            step_number=5,
            step_id="enter_matricula",
            step_type=StepType.CUSTOM,
            title_es="Matrícula de Funcionario",
            description_es="Introduzca su matrícula de funcionario",
            is_inherited=False,
            config={
                "field_type": "text",
                "pattern": r"^[A-Z]{1,3}-?\d{4,10}$",
                "placeholder": "FP-12345",
                "example": "FP-12345"
            }
        ))

        # Step 6: Upload Identity Document
        self.add_step(WorkflowStep(
            step_number=6,
            step_id="upload_identity",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Documento de Identidad",
            description_es="Suba su DIP, Pasaporte o Permiso de Residencia en vigor",
            is_inherited=False,
            documents=[
                DocumentRequirement(
                    document_code="documento_identidad",
                    document_name_es="Documento de Identidad",
                    schema_key="DIP_GQ_V2",
                    is_required=True,
                    display_order=1,
                    condition_type=DocumentConditionType.ALWAYS,
                    instructions_es="DIP, Pasaporte o Permiso de Residencia en vigor. Máximo 5MB.",
                    accepted_formats=["pdf", "jpg", "jpeg", "png"]
                )
            ],
            config={
                "max_file_size_mb": 5,
                "extraction": True,
                "extraction_fields": ["apellidos", "nombres", "numero_dip", "fecha_nacimiento"]
            }
        ))

        # Step 7: Confirmation
        self.add_step(WorkflowStep(
            step_number=7,
            step_id="confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación",
            description_es="Su solicitud será revisada por un agente del Ministerio de la Función Pública",
            is_inherited=False,
            config={
                "show_summary": True,
                "info_message_es": """
                Su solicitud será revisada por un agente del Ministerio de la Función Pública,
                quien verificará que:
                1. Su matrícula existe en el sistema oficial
                2. Su nombre coincide con el registrado

                Recibirá una notificación por email una vez procesada.
                """
            }
        ))

    def _setup_tariffs(self) -> None:
        """No payment required for verification."""
        self._tariff_config = TariffConfig(
            tariff_type=TariffType.FIXED,
            fixed_amounts={"VERIFICACION": 0},
            currency="XAF"
        )

    def get_document_requirements(self, sub_type: str) -> List[DocumentRequirement]:
        """Get document requirements for verification."""
        return [
            DocumentRequirement(
                document_code="documento_identidad",
                document_name_es="Documento de Identidad",
                schema_key="DIP_GQ_V2",
                is_required=True,
                display_order=1,
                condition_type=DocumentConditionType.ALWAYS,
                instructions_es="DIP, Pasaporte o Permiso de Residencia en vigor",
                accepted_formats=["pdf", "jpg", "jpeg", "png"]
            )
        ]

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """Get validation rules for verification."""
        return [
            # Matricula format validation
            {
                "id": "matricula_formato",
                "rule": "matricula MATCHES '^[A-Z]{1,3}-?[0-9]{4,10}$'",
                "error_es": "El formato de la matrícula es inválido. Ejemplo: FP-12345",
                "severity": "error"
            },
            # Identity document not expired
            {
                "id": "documento_no_expirado",
                "document": "documento_identidad",
                "rule": "documento.fecha_expiracion > TODAY",
                "error_es": "El documento de identidad está expirado.",
                "severity": "error"
            },
            # Extraction confidence
            {
                "id": "extraccion_confiable",
                "rule": "extraction_confidence >= 0.70",
                "error_es": "El documento no es legible. Por favor, suba una imagen más clara.",
                "severity": "error"
            }
        ]

    def get_form_mapping(self) -> Dict[str, str]:
        """Get mapping from extracted data to form fields."""
        return {
            "apellidos": "documento_identidad.titular.apellidos",
            "nombres": "documento_identidad.titular.nombres",
            "numero_dip": "documento_identidad.documento.numero_dip",
            "fecha_nacimiento": "documento_identidad.titular.fecha_nacimiento"
        }

    def get_workflow_code_for_subtype(self, sub_type: str) -> WorkflowCode:
        """Get the specific workflow code."""
        return WorkflowCode.FP_VERIFICACION_FUNCIONARIO

    def get_agent_checklist(self) -> List[Dict[str, str]]:
        """Get the checklist for agent verification."""
        return [
            {
                "id": "matricula_exists",
                "label_es": "He verificado que la matrícula EXISTE en el sistema SIGEF",
                "required": True
            },
            {
                "id": "name_matches",
                "label_es": "He verificado que el NOMBRE del solicitante COINCIDE con el nombre registrado en SIGEF para esta matrícula",
                "required": True
            },
            {
                "id": "dip_verified",
                "label_es": "He verificado el número de DIP (opcional si disponible en SIGEF)",
                "required": False
            }
        ]

    def get_rejection_reasons(self) -> List[Dict[str, str]]:
        """Get predefined rejection reasons."""
        return [
            {"id": "matricula_not_found", "label_es": "Matrícula no existe en SIGEF"},
            {"id": "name_mismatch", "label_es": "Nombre no coincide con el registrado"},
            {"id": "document_illegible", "label_es": "Documento ilegible o inválido"},
            {"id": "other", "label_es": "Otro (especificar)"}
        ]
