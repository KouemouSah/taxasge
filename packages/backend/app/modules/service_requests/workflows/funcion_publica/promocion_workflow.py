"""
PromocionAdministrativaWorkflow - Administrative promotion workflow.

Handles civil servant promotions including:
- Reconocimiento de Trienios (seniority recognition)
- Corrida de Nivel (level advancement)
- Corrida de Escala (scale advancement)

Entity: MINFP (Ministerio de la Funcion Publica y Reforma Administrativa)

Prerequisite: User must have role 'funcionario' (verified via VerificacionFuncionario)
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


class PromocionAdministrativaWorkflow(BaseWorkflow):
    """
    Administrative promotion workflow (MINFP).

    Sub-types:
    - TRIENIOS: Seniority recognition (every 3 years of service)
    - NIVEL: Level advancement within the same category
    - ESCALA: Scale advancement (change of category)

    Process:
    1. Upload documents proving eligibility
    2. Gemini extraction of service history
    3. Agent verification in SIGEF
    4. Resolution generation
    5. Salary update notification
    """

    # Class attributes
    workflow_code = WorkflowCode.FP_PROMOCION_ADMINISTRATIVA
    category = WorkflowCategory.FUNCION_PUBLICA
    entity_code = EntityCode.MINFP

    service_name_es = "Promoción Administrativa"

    requires_nota_ingreso = False
    requires_appointment = False
    requires_agent_review = True

    allowed_sub_types = ["TRIENIOS", "NIVEL", "ESCALA"]

    # Fixed tariffs
    TARIFFS = {
        "TRIENIOS": 5000,   # XAF
        "NIVEL": 7500,      # XAF
        "ESCALA": 10000     # XAF
    }

    def _setup_specific_steps(self) -> None:
        """Setup promotion-specific workflow steps."""

        # Step 5: Select Promotion Type
        self.add_step(WorkflowStep(
            step_number=5,
            step_id="select_promotion_type",
            step_type=StepType.CUSTOM,
            title_es="Tipo de Promoción",
            description_es="Seleccione el tipo de promoción que solicita",
            is_inherited=False,
            config={
                "type": "selection",
                "options": [
                    {
                        "id": "TRIENIOS",
                        "label_es": "Reconocimiento de Trienios",
                        "description_es": "Reconocimiento de cada 3 años de servicio efectivo"
                    },
                    {
                        "id": "NIVEL",
                        "label_es": "Corrida de Nivel",
                        "description_es": "Avance de nivel dentro de la misma categoría"
                    },
                    {
                        "id": "ESCALA",
                        "label_es": "Corrida de Escala",
                        "description_es": "Cambio de categoría (requiere nuevo título)"
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
            description_es="Cargue los documentos que acreditan su derecho a la promoción",
            is_inherited=False,
            config={"conditional": True}
        ))

        # Step 7: Payment
        self.add_step(WorkflowStep(
            step_number=7,
            step_id="payment",
            step_type=StepType.PAYMENT,
            title_es="Pago de Tasas",
            description_es="Tasa de tramitación de la promoción",
            is_inherited=False,
            config={
                "payment_methods": ["MTN_MOBILE_MONEY", "ORANGE_MONEY", "BANGE_WALLET"],
                "currency": "XAF"
            }
        ))

        # Step 8: Confirmation
        self.add_step(WorkflowStep(
            step_number=8,
            step_id="confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación y Envío",
            description_es="Verifique todos los datos y envíe su solicitud",
            is_inherited=False,
            config={"show_summary": True}
        ))

    def _setup_tariffs(self) -> None:
        """Setup tariffs for different promotion types."""
        self._tariff_config = TariffConfig(
            tariff_type=TariffType.FIXED,
            fixed_amounts=self.TARIFFS,
            currency="XAF"
        )

    def get_document_requirements(self, sub_type: str) -> List[DocumentRequirement]:
        """Get document requirements based on promotion type."""
        requirements = []

        # Identity document - always required
        requirements.append(DocumentRequirement(
            document_code="documento_identidad",
            document_name_es="Documento de Identidad",
            schema_key="DIP_GQ_V2",
            is_required=True,
            display_order=1,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="DIP, Pasaporte o Permiso de Residencia en vigor"
        ))

        # Carnet de Funcionario - always required
        requirements.append(DocumentRequirement(
            document_code="carnet_funcionario",
            document_name_es="Carnet de Funcionario",
            is_required=True,
            display_order=2,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Carnet de funcionario vigente"
        ))

        # Last appointment/resolution
        requirements.append(DocumentRequirement(
            document_code="ultima_resolucion",
            document_name_es="Última Resolución de Nombramiento/Promoción",
            is_required=True,
            display_order=3,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Última resolución de nombramiento o promoción"
        ))

        if sub_type == "TRIENIOS":
            # Service certificate
            requirements.append(DocumentRequirement(
                document_code="certificado_servicios",
                document_name_es="Certificado de Servicios Prestados",
                is_required=True,
                display_order=4,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["TRIENIOS"]},
                instructions_es="Certificado emitido por la unidad de personal"
            ))

        if sub_type == "ESCALA":
            # New academic title
            requirements.append(DocumentRequirement(
                document_code="titulo_academico",
                document_name_es="Nuevo Título Académico",
                is_required=True,
                display_order=4,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["ESCALA"]},
                instructions_es="Título académico que justifica el cambio de escala"
            ))

            # Homologation if foreign title
            requirements.append(DocumentRequirement(
                document_code="homologacion",
                document_name_es="Homologación de Título (si extranjero)",
                is_required=False,
                display_order=5,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["ESCALA"]},
                instructions_es="Si el título es extranjero, debe estar homologado"
            ))

        return requirements

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """Get validation rules for promotion."""
        return [
            # Carnet must be valid
            {
                "id": "carnet_vigente",
                "document": "carnet_funcionario",
                "rule": "documento.fecha_caducidad > TODAY",
                "error_es": "El carnet de funcionario debe estar vigente.",
                "severity": "error"
            },
            # For TRIENIOS: minimum 3 years since last trienio
            {
                "id": "trienio_elegible",
                "condition": "tipo == 'TRIENIOS'",
                "rule": "ultima_fecha_trienio IS NULL OR ultima_fecha_trienio + 3 YEARS <= TODAY",
                "error_es": "Debe haber transcurrido al menos 3 años desde el último trienio reconocido.",
                "severity": "error"
            },
            # For ESCALA: new title must be higher category
            {
                "id": "titulo_superior",
                "condition": "tipo == 'ESCALA'",
                "rule": "titulo_academico.nivel > carnet_funcionario.categoria",
                "error_es": "El nuevo título debe corresponder a una categoría superior.",
                "severity": "warning"
            }
        ]

    def get_form_mapping(self) -> Dict[str, str]:
        """Get mapping from extracted data to form fields."""
        return {
            "matricula": "carnet_funcionario.datos_carnet.numero_carnet",
            "categoria_actual": "carnet_funcionario.datos_carnet.categoria",
            "ministerio": "carnet_funcionario.datos_carnet.ministerio",
            "fecha_ingreso": "carnet_funcionario.datos_carnet.fecha_emision",
            "nivel_actual": "ultima_resolucion.nivel",
            "nuevo_titulo": "titulo_academico.titulo"
        }

    def get_workflow_code_for_subtype(self, sub_type: str) -> WorkflowCode:
        """Get the specific workflow code."""
        return WorkflowCode.FP_PROMOCION_ADMINISTRATIVA
