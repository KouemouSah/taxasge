"""
CertificadoAdministrativoWorkflow - Administrative certificate workflow.

Handles issuance of various administrative certificates for civil servants:
- Service record
- Administrative status
- Salary certificate
- Time of service
- Good conduct certificate

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


class CertificadoTipo(str, Enum):
    """Types of administrative certificates."""
    SERVICIOS_PRESTADOS = "SERVICIOS_PRESTADOS"     # Service record
    SITUACION_ADMINISTRATIVA = "SITUACION_ADMINISTRATIVA"  # Administrative status
    HABERES = "HABERES"                              # Salary certificate
    TIEMPO_SERVICIO = "TIEMPO_SERVICIO"              # Time of service
    BUENA_CONDUCTA = "BUENA_CONDUCTA"                # Good conduct


class CertificadoAdministrativoWorkflow(BaseWorkflow):
    """
    Administrative certificate workflow (MINFP).

    Sub-types:
    - SERVICIOS_PRESTADOS: Complete service record history
    - SITUACION_ADMINISTRATIVA: Current administrative status
    - HABERES: Salary and benefits certificate
    - TIEMPO_SERVICIO: Time of service calculation
    - BUENA_CONDUCTA: Disciplinary record (clean)

    Process:
    1. Select certificate type
    2. Upload supporting documents
    3. Specify purpose (optional)
    4. Payment
    5. Agent verification in SIGEF
    6. Certificate generation
    7. Digital signature and delivery
    """

    # Class attributes
    workflow_code = WorkflowCode.FP_CERTIFICADO_ADMINISTRATIVO
    category = WorkflowCategory.FUNCION_PUBLICA
    entity_code = EntityCode.MINFP

    service_name_es = "Certificado Administrativo"
    service_name_fr = "Certificat Administratif"

    requires_nota_ingreso = False
    requires_appointment = False
    requires_agent_review = True

    allowed_sub_types = [
        "SERVICIOS_PRESTADOS",
        "SITUACION_ADMINISTRATIVA",
        "HABERES",
        "TIEMPO_SERVICIO",
        "BUENA_CONDUCTA"
    ]

    # Fixed tariffs per certificate type (XAF)
    TARIFFS = {
        "SERVICIOS_PRESTADOS": 3000,
        "SITUACION_ADMINISTRATIVA": 2500,
        "HABERES": 3500,
        "TIEMPO_SERVICIO": 2500,
        "BUENA_CONDUCTA": 2000
    }

    # Processing time in business days
    PROCESSING_DAYS = {
        "SERVICIOS_PRESTADOS": 5,
        "SITUACION_ADMINISTRATIVA": 3,
        "HABERES": 3,
        "TIEMPO_SERVICIO": 3,
        "BUENA_CONDUCTA": 5  # Requires disciplinary records check
    }

    def _setup_specific_steps(self) -> None:
        """Setup certificate-specific workflow steps."""

        # Step 5: Select Certificate Type
        self.add_step(WorkflowStep(
            step_number=5,
            step_id="select_certificate_type",
            step_type=StepType.CUSTOM,
            title_es="Tipo de Certificado",
            title_fr="Type de Certificat",
            description_es="Seleccione el tipo de certificado que necesita",
            is_inherited=False,
            config={
                "type": "selection",
                "options": [
                    {
                        "id": "SERVICIOS_PRESTADOS",
                        "label_es": "Certificado de Servicios Prestados",
                        "description_es": "Historial completo de servicios en la Administración"
                    },
                    {
                        "id": "SITUACION_ADMINISTRATIVA",
                        "label_es": "Certificado de Situación Administrativa",
                        "description_es": "Estado actual: activo, excedencia, comisión de servicio, etc."
                    },
                    {
                        "id": "HABERES",
                        "label_es": "Certificado de Haberes",
                        "description_es": "Certificado de salario y complementos"
                    },
                    {
                        "id": "TIEMPO_SERVICIO",
                        "label_es": "Certificado de Tiempo de Servicio",
                        "description_es": "Cálculo de años, meses y días de servicio efectivo"
                    },
                    {
                        "id": "BUENA_CONDUCTA",
                        "label_es": "Certificado de Buena Conducta",
                        "description_es": "Certificado de ausencia de sanciones disciplinarias"
                    }
                ]
            }
        ))

        # Step 6: Certificate Purpose
        self.add_step(WorkflowStep(
            step_number=6,
            step_id="certificate_purpose",
            step_type=StepType.CUSTOM,
            title_es="Finalidad del Certificado",
            title_fr="Finalité du Certificat",
            description_es="Indique para qué necesita este certificado",
            is_inherited=False,
            config={
                "fields": [
                    {
                        "id": "finalidad",
                        "label_es": "Finalidad",
                        "type": "select",
                        "options": [
                            {"id": "JUBILACION", "label_es": "Trámites de Jubilación"},
                            {"id": "PROMOCION", "label_es": "Promoción Interna"},
                            {"id": "CONCURSO", "label_es": "Concurso/Oposición"},
                            {"id": "BANCARIO", "label_es": "Trámites Bancarios"},
                            {"id": "VIVIENDA", "label_es": "Solicitud de Vivienda"},
                            {"id": "BECA", "label_es": "Solicitud de Beca"},
                            {"id": "OTRO", "label_es": "Otro"}
                        ],
                        "required": True
                    },
                    {
                        "id": "finalidad_detalle",
                        "label_es": "Especifique (si seleccionó 'Otro')",
                        "type": "textarea",
                        "required": False,
                        "visible_if": {"finalidad": "OTRO"}
                    },
                    {
                        "id": "num_copias",
                        "label_es": "Número de Copias",
                        "type": "number",
                        "min": 1,
                        "max": 5,
                        "default": 1,
                        "required": True
                    },
                    {
                        "id": "urgente",
                        "label_es": "Trámite Urgente (Recargo del 50%)",
                        "type": "checkbox",
                        "required": False,
                        "info_es": "El certificado se emitirá en 24-48 horas laborables"
                    }
                ]
            }
        ))

        # Step 7: Upload Documents
        self.add_step(WorkflowStep(
            step_number=7,
            step_id="documents",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Documentos",
            title_fr="Documents",
            description_es="Cargue los documentos requeridos",
            is_inherited=False,
            config={"conditional": True}
        ))

        # Step 8: Payment
        self.add_step(WorkflowStep(
            step_number=8,
            step_id="payment",
            step_type=StepType.PAYMENT,
            title_es="Pago de Tasas",
            title_fr="Paiement des Frais",
            description_es="Tasa de emisión del certificado",
            is_inherited=False,
            config={
                "payment_methods": ["MTN_MOBILE_MONEY", "ORANGE_MONEY", "BANGE_WALLET"],
                "currency": "XAF",
                "dynamic_amount": True  # Calculated based on type, copies, urgency
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
            config={
                "show_summary": True,
                "show_estimated_time": True
            }
        ))

    def _setup_tariffs(self) -> None:
        """Setup tariffs for different certificate types."""
        self._tariff_config = TariffConfig(
            tariff_type=TariffType.FIXED,
            fixed_amounts=self.TARIFFS,
            currency="XAF"
        )

    def calculate_total_tariff(
        self,
        certificate_type: str,
        num_copies: int = 1,
        urgente: bool = False
    ) -> int:
        """
        Calculate total tariff including copies and urgency.

        Args:
            certificate_type: Type of certificate
            num_copies: Number of copies (1-5)
            urgente: Whether urgent processing is requested

        Returns:
            Total amount in XAF
        """
        base_tariff = self.TARIFFS.get(certificate_type, 2500)

        # Additional copies cost 50% of base
        additional_copies_cost = (num_copies - 1) * (base_tariff * 0.5)

        total = base_tariff + additional_copies_cost

        # Urgent processing adds 50%
        if urgente:
            total *= 1.5

        return int(total)

    def get_document_requirements(self, sub_type: str) -> List[DocumentRequirement]:
        """Get document requirements for certificate request."""
        requirements = []

        # Carnet de Funcionario - always required
        requirements.append(DocumentRequirement(
            document_code="carnet_funcionario",
            document_name_es="Carnet de Funcionario",
            is_required=True,
            display_order=1,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Carnet de funcionario vigente (recto y verso)"
        ))

        # Identity document - always required
        requirements.append(DocumentRequirement(
            document_code="documento_identidad",
            document_name_es="Documento de Identidad",
            schema_key="DIP_GQ_V2",
            is_required=True,
            display_order=2,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="DIP en vigor"
        ))

        # Additional documents for specific certificate types
        if sub_type == "SERVICIOS_PRESTADOS":
            requirements.append(DocumentRequirement(
                document_code="nombramiento",
                document_name_es="Acto de Nombramiento",
                is_required=True,
                display_order=3,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["SERVICIOS_PRESTADOS"]},
                instructions_es="Primer nombramiento o contrato"
            ))

        if sub_type == "HABERES":
            requirements.append(DocumentRequirement(
                document_code="nomina_reciente",
                document_name_es="Última Nómina",
                is_required=False,
                display_order=3,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["HABERES"]},
                instructions_es="Nómina del último mes (opcional, para verificación)"
            ))

        if sub_type == "BUENA_CONDUCTA":
            requirements.append(DocumentRequirement(
                document_code="declaracion_jurada",
                document_name_es="Declaración Jurada",
                is_required=True,
                display_order=3,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["BUENA_CONDUCTA"]},
                instructions_es="Declaración de no tener procedimientos disciplinarios pendientes"
            ))

        return requirements

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """Get validation rules for certificate request."""
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
            # Identity document must match carnet
            {
                "id": "identidad_coherente",
                "rule": "normalize(documento_identidad.titular.apellidos) SIMILAR_TO normalize(carnet_funcionario.datos_carnet.apellidos)",
                "error_es": "El nombre en el DIP no coincide con el del carnet de funcionario.",
                "error_fr": "Le nom sur le DIP ne correspond pas à celui de la carte de fonctionnaire.",
                "severity": "error"
            },
            # Number of copies within limit
            {
                "id": "copias_limite",
                "rule": "num_copias >= 1 AND num_copias <= 5",
                "error_es": "El número de copias debe estar entre 1 y 5.",
                "error_fr": "Le nombre de copies doit être entre 1 et 5.",
                "severity": "error"
            }
        ]

    def get_form_mapping(self) -> Dict[str, str]:
        """Get mapping from extracted data to form fields."""
        return {
            "matricula": "carnet_funcionario.datos_carnet.numero_carnet",
            "apellidos": "carnet_funcionario.datos_carnet.apellidos",
            "nombre": "carnet_funcionario.datos_carnet.nombre",
            "categoria": "carnet_funcionario.datos_carnet.categoria",
            "nivel": "carnet_funcionario.datos_carnet.nivel",
            "ministerio": "carnet_funcionario.datos_carnet.ministerio",
            "unidad": "carnet_funcionario.datos_carnet.unidad_organica",
            "numero_dip": "documento_identidad.documento.numero_dip"
        }

    def get_workflow_code_for_subtype(self, sub_type: str) -> WorkflowCode:
        """Get the specific workflow code."""
        return WorkflowCode.FP_CERTIFICADO_ADMINISTRATIVO

    def get_estimated_processing_days(self, sub_type: str, urgente: bool = False) -> int:
        """
        Get estimated processing time in business days.

        Args:
            sub_type: Type of certificate
            urgente: Whether urgent processing is requested

        Returns:
            Estimated days for processing
        """
        base_days = self.PROCESSING_DAYS.get(sub_type, 3)
        if urgente:
            return 1  # 24-48 hours = 1 business day
        return base_days

    def get_agent_verification_items(self, sub_type: str) -> List[Dict[str, str]]:
        """Get verification checklist items for agent."""
        items = [
            {
                "id": "matricula_verified",
                "label_es": "He verificado la matrícula en SIGEF",
                "required": True
            },
            {
                "id": "datos_actualizados",
                "label_es": "He verificado que los datos están actualizados en el sistema",
                "required": True
            }
        ]

        if sub_type == "SERVICIOS_PRESTADOS":
            items.append({
                "id": "historial_completo",
                "label_es": "He generado el historial completo de servicios",
                "required": True
            })

        if sub_type == "HABERES":
            items.append({
                "id": "nomina_verificada",
                "label_es": "He verificado la nómina vigente en el sistema de haberes",
                "required": True
            })

        if sub_type == "BUENA_CONDUCTA":
            items.append({
                "id": "expedientes_revisados",
                "label_es": "He revisado la existencia de expedientes disciplinarios",
                "required": True
            })
            items.append({
                "id": "sin_sanciones",
                "label_es": "Confirmo ausencia de sanciones no canceladas",
                "required": True
            })

        return items

    def get_certificate_template(self, sub_type: str) -> str:
        """Get template identifier for certificate generation."""
        templates = {
            "SERVICIOS_PRESTADOS": "CERT_FP_SERVICIOS_V1",
            "SITUACION_ADMINISTRATIVA": "CERT_FP_SITUACION_V1",
            "HABERES": "CERT_FP_HABERES_V1",
            "TIEMPO_SERVICIO": "CERT_FP_TIEMPO_V1",
            "BUENA_CONDUCTA": "CERT_FP_CONDUCTA_V1"
        }
        return templates.get(sub_type, "CERT_FP_GENERICO_V1")
