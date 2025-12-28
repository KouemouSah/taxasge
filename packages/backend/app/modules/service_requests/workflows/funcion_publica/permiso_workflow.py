"""
PermisoExtraordinarioWorkflow - Extraordinary leave request workflow.

Handles civil servant extraordinary leave requests including:
- Personal matters
- Medical reasons
- Family matters
- Studies/Training
- Other authorized reasons

Entity: MINFP (Ministerio de la Funcion Publica y Reforma Administrativa)

Prerequisite: User must have role 'funcionario' (verified via VerificacionFuncionario)
"""
from typing import List, Dict, Any
from enum import Enum

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


class PermisoMotivo(str, Enum):
    """Reasons for extraordinary leave."""
    ASUNTOS_PROPIOS = "ASUNTOS_PROPIOS"   # Personal matters
    MEDICO = "MEDICO"                      # Medical reasons
    FAMILIAR = "FAMILIAR"                  # Family matters
    ESTUDIOS = "ESTUDIOS"                  # Studies/Training
    OTRO = "OTRO"                          # Other


class PermisoExtraordinarioWorkflow(BaseWorkflow):
    """
    Extraordinary leave request workflow (MINFP).

    Sub-types based on leave reason:
    - ASUNTOS_PROPIOS: Personal matters (up to 5 days)
    - MEDICO: Medical reasons (requires medical certificate)
    - FAMILIAR: Family matters (death, illness, birth)
    - ESTUDIOS: Studies/Training (requires enrollment proof)
    - OTRO: Other authorized reasons

    Process:
    1. Select leave type and dates
    2. Upload supporting documents
    3. Supervisor pre-approval
    4. HR agent final approval
    5. Resolution generation
    """

    # Class attributes
    workflow_code = WorkflowCode.FP_PERMISO_EXTRAORDINARIO
    category = WorkflowCategory.FUNCION_PUBLICA
    entity_code = EntityCode.MINFP

    service_name_es = "Permiso Extraordinario"
    service_name_fr = "Congé Extraordinaire"

    requires_nota_ingreso = False
    requires_appointment = False
    requires_agent_review = True

    allowed_sub_types = [
        "ASUNTOS_PROPIOS",
        "MEDICO",
        "FAMILIAR",
        "ESTUDIOS",
        "OTRO"
    ]

    # Maximum days by leave type
    MAX_DAYS = {
        "ASUNTOS_PROPIOS": 5,
        "MEDICO": 30,  # Extendable with medical board
        "FAMILIAR": 10,
        "ESTUDIOS": 15,
        "OTRO": 3
    }

    # Fixed processing fee
    TARIFF = 2500  # XAF

    def _setup_specific_steps(self) -> None:
        """Setup leave request-specific workflow steps."""

        # Step 5: Select Leave Details
        self.add_step(WorkflowStep(
            step_number=5,
            step_id="leave_details",
            step_type=StepType.CUSTOM,
            title_es="Detalles del Permiso",
            title_fr="Détails du Congé",
            description_es="Indique el motivo y las fechas del permiso",
            is_inherited=False,
            config={
                "fields": [
                    {
                        "id": "motivo",
                        "label_es": "Motivo del Permiso",
                        "type": "select",
                        "options": [
                            {"id": "ASUNTOS_PROPIOS", "label_es": "Asuntos Propios (máx. 5 días)"},
                            {"id": "MEDICO", "label_es": "Motivos Médicos"},
                            {"id": "FAMILIAR", "label_es": "Asuntos Familiares"},
                            {"id": "ESTUDIOS", "label_es": "Estudios/Formación"},
                            {"id": "OTRO", "label_es": "Otro Motivo"}
                        ],
                        "required": True
                    },
                    {
                        "id": "fecha_inicio",
                        "label_es": "Fecha de Inicio",
                        "type": "date",
                        "required": True
                    },
                    {
                        "id": "fecha_fin",
                        "label_es": "Fecha de Fin",
                        "type": "date",
                        "required": True
                    },
                    {
                        "id": "justificacion",
                        "label_es": "Justificación",
                        "type": "textarea",
                        "required": True,
                        "placeholder": "Explique brevemente el motivo de su solicitud"
                    }
                ]
            }
        ))

        # Step 6: Upload Documents
        self.add_step(WorkflowStep(
            step_number=6,
            step_id="documents",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Documentos Justificativos",
            title_fr="Documents Justificatifs",
            description_es="Cargue los documentos que justifican el permiso",
            is_inherited=False,
            config={"conditional": True}
        ))

        # Step 7: Supervisor Pre-approval (if available in system)
        self.add_step(WorkflowStep(
            step_number=7,
            step_id="supervisor_approval",
            step_type=StepType.CUSTOM,
            title_es="Aprobación del Supervisor",
            title_fr="Approbation du Superviseur",
            description_es="Su solicitud será enviada a su supervisor directo para pre-aprobación",
            is_inherited=False,
            config={
                "requires_supervisor": True,
                "auto_route": True
            }
        ))

        # Step 8: Payment
        self.add_step(WorkflowStep(
            step_number=8,
            step_id="payment",
            step_type=StepType.PAYMENT,
            title_es="Pago de Tasas",
            title_fr="Paiement des Frais",
            description_es=f"Tasa de tramitación: {self.TARIFF} XAF",
            is_inherited=False,
            config={
                "payment_methods": ["MTN_MOBILE_MONEY", "ORANGE_MONEY", "BANGE_WALLET"],
                "currency": "XAF",
                "amount": self.TARIFF
            }
        ))

        # Step 9: Confirmation
        self.add_step(WorkflowStep(
            step_number=9,
            step_id="confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación y Envío",
            title_fr="Confirmation et Envoi",
            description_es="Verifique todos los datos y envíe su solicitud",
            is_inherited=False,
            config={"show_summary": True}
        ))

    def _setup_tariffs(self) -> None:
        """Setup fixed tariff for leave request."""
        self._tariff_config = TariffConfig(
            tariff_type=TariffType.FIXED,
            fixed_amounts={motivo: self.TARIFF for motivo in self.allowed_sub_types},
            currency="XAF"
        )

    def get_document_requirements(self, sub_type: str) -> List[DocumentRequirement]:
        """Get document requirements based on leave type."""
        requirements = []

        # Carnet de Funcionario - always required
        requirements.append(DocumentRequirement(
            document_code="carnet_funcionario",
            document_name_es="Carnet de Funcionario",
            is_required=True,
            display_order=1,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Carnet de funcionario vigente"
        ))

        # Medical certificate for MEDICO
        if sub_type == "MEDICO":
            requirements.append(DocumentRequirement(
                document_code="certificado_medico",
                document_name_es="Certificado Médico",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"motivo": ["MEDICO"]},
                instructions_es="Certificado médico que justifique la necesidad del permiso"
            ))

        # Family document for FAMILIAR
        if sub_type == "FAMILIAR":
            requirements.append(DocumentRequirement(
                document_code="documento_familiar",
                document_name_es="Documento Justificativo Familiar",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"motivo": ["FAMILIAR"]},
                instructions_es="Acta de defunción, certificado médico familiar, acta de nacimiento, etc."
            ))

        # Enrollment proof for ESTUDIOS
        if sub_type == "ESTUDIOS":
            requirements.append(DocumentRequirement(
                document_code="matricula_estudios",
                document_name_es="Comprobante de Matrícula",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"motivo": ["ESTUDIOS"]},
                instructions_es="Certificado de matrícula o inscripción en el curso/formación"
            ))

            requirements.append(DocumentRequirement(
                document_code="calendario_estudios",
                document_name_es="Calendario del Curso",
                is_required=True,
                display_order=3,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"motivo": ["ESTUDIOS"]},
                instructions_es="Horario o calendario que muestre las fechas del curso"
            ))

        # Other documentation for OTRO
        if sub_type == "OTRO":
            requirements.append(DocumentRequirement(
                document_code="documento_justificativo",
                document_name_es="Documento Justificativo",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"motivo": ["OTRO"]},
                instructions_es="Cualquier documento que justifique la solicitud"
            ))

        return requirements

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """Get validation rules for leave request."""
        return [
            # Carnet must be valid
            {
                "id": "carnet_vigente",
                "document": "carnet_funcionario",
                "rule": "documento.fecha_caducidad > TODAY",
                "error_es": "El carnet de funcionario debe estar vigente.",
                "error_fr": "La carte de fonctionnaire doit être valide.",
                "severity": "error"
            },
            # Start date must be in the future
            {
                "id": "fecha_inicio_futura",
                "rule": "fecha_inicio >= TODAY",
                "error_es": "La fecha de inicio debe ser hoy o posterior.",
                "error_fr": "La date de début doit être aujourd'hui ou ultérieure.",
                "severity": "error"
            },
            # End date must be after start date
            {
                "id": "fechas_coherentes",
                "rule": "fecha_fin >= fecha_inicio",
                "error_es": "La fecha de fin debe ser igual o posterior a la fecha de inicio.",
                "error_fr": "La date de fin doit être égale ou postérieure à la date de début.",
                "severity": "error"
            },
            # Duration within allowed limits
            {
                "id": "duracion_permitida",
                "rule": "(fecha_fin - fecha_inicio).days + 1 <= MAX_DAYS[motivo]",
                "error_es": "La duración del permiso excede el máximo permitido para este motivo.",
                "error_fr": "La durée du congé dépasse le maximum autorisé pour ce motif.",
                "severity": "error"
            },
            # Request must be made at least 3 days in advance (except MEDICO)
            {
                "id": "solicitud_anticipada",
                "condition": "motivo != 'MEDICO'",
                "rule": "fecha_inicio >= TODAY + 3 DAYS",
                "error_es": "Debe solicitar el permiso con al menos 3 días de antelación.",
                "error_fr": "Vous devez demander le congé au moins 3 jours à l'avance.",
                "severity": "warning"
            }
        ]

    def get_form_mapping(self) -> Dict[str, str]:
        """Get mapping from extracted data to form fields."""
        return {
            "matricula": "carnet_funcionario.datos_carnet.numero_carnet",
            "nombre_completo": "carnet_funcionario.datos_carnet.nombre",
            "ministerio": "carnet_funcionario.datos_carnet.ministerio",
            "unidad": "carnet_funcionario.datos_carnet.unidad_organica"
        }

    def get_workflow_code_for_subtype(self, sub_type: str) -> WorkflowCode:
        """Get the specific workflow code."""
        return WorkflowCode.FP_PERMISO_EXTRAORDINARIO

    def get_max_days(self, motivo: str) -> int:
        """Get maximum allowed days for a leave type."""
        return self.MAX_DAYS.get(motivo, 3)
