"""
CarnetFuncionarioWorkflow - Civil servant ID card workflow.

The Carnet de Funcionario is the official document that identifies a civil servant
and proves their registration in the Ministry of Public Function registry.

Legal basis: Article 47, paragraph c) of Ley de Funcionarios Civiles del Estado
(Ley Num. 2/2014)

Types:
- expedicion: First issuance
- renovacion: Renewal (expired card)
- duplicado: Duplicate (lost card)

Entity: MINFP (Ministerio de la Funcion Publica y Reforma Administrativa)
Biometric capture: CNEDOGE

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


class CarnetFuncionarioWorkflow(BaseWorkflow):
    """
    Civil servant ID card workflow (MINFP + CNEDOGE).

    Sub-types:
    - expedicion: First issuance (requires Nombramiento + Oficio + Toma Posesion)
    - renovacion: Renewal (requires expired Carnet)
    - duplicado: Duplicate (requires loss certificate)

    Process:
    1. Upload documents
    2. Gemini extraction (personal + administrative data)
    3. Pre-filled form verification
    4. Payment (3,500 XAF)
    5. Agent verification in internal ministry system
    6. Approval generates QR authorization
    7. Biometric capture at CNEDOGE
    8. Card issuance
    """

    # Class attributes
    workflow_code = WorkflowCode.FP_CARNET_FUNCIONARIO
    category = WorkflowCategory.FUNCION_PUBLICA
    entity_code = EntityCode.MINFP

    service_name_es = "Carnet de Funcionario"

    requires_nota_ingreso = False
    requires_appointment = True  # Biometric capture at CNEDOGE
    requires_agent_review = True

    allowed_sub_types = ["expedicion", "renovacion", "duplicado"]

    # Fixed tariff
    TARIFF = 3500  # XAF

    def _setup_specific_steps(self) -> None:
        """Setup carnet-specific workflow steps."""

        # Step 5: Additional Documents (conditional)
        self.add_step(WorkflowStep(
            step_number=5,
            step_id="additional_documents",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Documentos Adicionales",
            description_es="Documentos según el tipo de solicitud",
            is_inherited=False,
            config={
                "conditional": True,
                "by_type": {
                    "expedicion": ["nombramiento", "oficio_destino", "toma_posesion"],
                    "renovacion": ["carnet_expirado"],
                    "duplicado": ["certificado_perdida"]
                }
            }
        ))

        # Step 6: Additional Personal Data
        self.add_step(WorkflowStep(
            step_number=6,
            step_id="additional_data",
            step_type=StepType.CUSTOM,
            title_es="Datos Adicionales",
            description_es="Complete los datos que no se pueden extraer automáticamente",
            is_inherited=False,
            config={
                "fields": [
                    {"id": "familiar_nombre", "label_es": "Nombre del familiar cercano", "required": True},
                    {"id": "familiar_telefono", "label_es": "Teléfono del familiar", "required": True},
                    {"id": "telefono_personal", "label_es": "Su teléfono personal", "required": True},
                    {"id": "email", "label_es": "Correo electrónico", "required": True},
                    {"id": "cnedoge_preferido", "label_es": "CNEDOGE de preferencia", "type": "select", "required": True}
                ]
            }
        ))

        # Step 7: Payment
        self.add_step(WorkflowStep(
            step_number=7,
            step_id="payment",
            step_type=StepType.PAYMENT,
            title_es="Pago de Tasas",
            description_es="Tasa de emisión de Carnet de Funcionario: 3,500 XAF",
            is_inherited=False,
            config={
                "payment_methods": ["MTN_MOBILE_MONEY", "ORANGE_MONEY", "BANGE_WALLET"],
                "currency": "XAF",
                "amount": self.TARIFF
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
            config={
                "show_summary": True,
                "consent_text_es": "Confirmo que todos los datos proporcionados son correctos y autorizo su tratamiento informático para la gestión de la solicitud del carnet."
            }
        ))

    def _setup_tariffs(self) -> None:
        """Setup fixed tariff for carnet."""
        self._tariff_config = TariffConfig(
            tariff_type=TariffType.FIXED,
            fixed_amounts={
                "expedicion": self.TARIFF,
                "renovacion": self.TARIFF,
                "duplicado": self.TARIFF
            },
            currency="XAF"
        )

    def get_document_requirements(self, sub_type: str) -> List[DocumentRequirement]:
        """Get document requirements for carnet request."""
        requirements = []

        # Identity document - always required
        requirements.append(DocumentRequirement(
            document_code="documento_identidad",
            document_name_es="Documento de Identidad (DIP/Pasaporte/Residencia)",
            schema_key="DIP_GQ_V2",
            is_required=True,
            display_order=1,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="DIP, Pasaporte o Permiso de Residencia en vigor",
            faces_required=["recto", "verso"]
        ))

        # Nombramiento/Contrato - always required
        requirements.append(DocumentRequirement(
            document_code="nombramiento",
            document_name_es="Acto de Nombramiento o Contrato",
            is_required=True,
            display_order=2,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Documento oficial de nombramiento o contrato de funcionario"
        ))

        # Documents specific to expedicion
        if sub_type == "expedicion":
            requirements.append(DocumentRequirement(
                document_code="oficio_destino",
                document_name_es="Oficio de Destino",
                is_required=True,
                display_order=3,
                condition_type=DocumentConditionType.IS_NEW,
                instructions_es="Avis d'affectation au poste"
            ))

            requirements.append(DocumentRequirement(
                document_code="toma_posesion",
                document_name_es="Acta de Toma de Posesión",
                is_required=True,
                display_order=4,
                condition_type=DocumentConditionType.IS_NEW,
                instructions_es="Certificat de prise de fonction"
            ))

        # Documents specific to renovacion
        if sub_type == "renovacion":
            requirements.append(DocumentRequirement(
                document_code="carnet_expirado",
                document_name_es="Carnet de Funcionario Expirado",
                is_required=True,
                display_order=3,
                condition_type=DocumentConditionType.IS_RENEWAL,
                instructions_es="Copia del carnet de funcionario expirado"
            ))

        # Documents specific to duplicado
        if sub_type == "duplicado":
            requirements.append(DocumentRequirement(
                document_code="certificado_perdida",
                document_name_es="Certificado de Pérdida",
                is_required=True,
                display_order=3,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["duplicado"]},
                instructions_es="Declaración oficial de pérdida del carnet (menos de 30 días)"
            ))

        return requirements

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """Get cross-document validation rules for carnet."""
        return [
            # Identity coherence between DIP and Nombramiento
            {
                "id": "coherencia_identidad",
                "rule": "normalize(DIP.titular.apellidos + ' ' + DIP.titular.nombres) SIMILAR_TO normalize(NOMBRAMIENTO.funcionario.nombre_completo)",
                "error_es": "El nombre en el DIP no coincide con el del Nombramiento.",
                "severity": "blocking"
            },
            # Appointment date in the past
            {
                "id": "fecha_nombramiento_valida",
                "document": "nombramiento",
                "rule": "documento.fecha_nombramiento < TODAY",
                "error_es": "La fecha del nombramiento debe ser anterior a hoy.",
                "severity": "blocking"
            },
            # Identity document not expired
            {
                "id": "documento_vigente",
                "document": "documento_identidad",
                "rule": "documento.fecha_expiracion > TODAY",
                "error_es": "El documento de identidad está expirado.",
                "severity": "blocking"
            },
            # Category is valid
            {
                "id": "categoria_valida",
                "document": "nombramiento",
                "rule": "datos_administrativos.categoria IN ['A', 'B', 'C']",
                "error_es": "La categoría debe ser A, B o C.",
                "severity": "warning"
            },
            # For expedicion: Toma de posesion after nombramiento
            {
                "id": "toma_posesion_posterior",
                "condition": "tipo == 'expedicion'",
                "rule": "TOMA_POSESION.fecha >= NOMBRAMIENTO.fecha_nombramiento",
                "error_es": "La toma de posesión debe ser posterior al nombramiento.",
                "severity": "blocking"
            },
            # For renovacion: Carnet expired or expiring
            {
                "id": "carnet_expirado_o_proximo",
                "condition": "tipo == 'renovacion'",
                "document": "carnet_expirado",
                "rule": "documento.fecha_caducidad < TODAY + 90 DAYS",
                "error_es": "Solo puede renovar si el carnet expira en menos de 3 meses o ya ha expirado.",
                "severity": "warning"
            },
            # For duplicado: Loss certificate is recent
            {
                "id": "certificado_perdida_reciente",
                "condition": "tipo == 'duplicado'",
                "document": "certificado_perdida",
                "rule": "documento.fecha_emision > TODAY - 30 DAYS",
                "error_es": "El certificado de pérdida debe tener menos de 30 días.",
                "severity": "blocking"
            }
        ]

    def get_form_mapping(self) -> Dict[str, str]:
        """Get mapping from extracted data to form fields."""
        return {
            # From DIP
            "numero_dip": "documento_identidad.documento.numero_dip",
            "apellidos": "documento_identidad.titular.apellidos",
            "nombre": "documento_identidad.titular.nombres",
            "sexo": "documento_identidad.titular.sexo",
            "fecha_nacimiento": "documento_identidad.titular.fecha_nacimiento",
            "lugar_nacimiento_provincia": "documento_identidad.titular.lugar_nacimiento.provincia",
            "lugar_nacimiento_distrito": "documento_identidad.titular.lugar_nacimiento.distrito",
            "lugar_nacimiento_localidad": "documento_identidad.titular.lugar_nacimiento.localidad",
            "grupo_sanguineo": "documento_identidad.titular.grupo_sanguineo",
            "tribu": "documento_identidad.titular.tribu",
            "profesion": "documento_identidad.titular.profesion",
            "estado_civil": "documento_identidad.titular.estado_civil",
            "nombre_padre": "documento_identidad.datos_familiares.nombre_padre",
            "nombre_madre": "documento_identidad.datos_familiares.nombre_madre",
            "domicilio_pais": "documento_identidad.domicilio.pais",
            "domicilio_provincia": "documento_identidad.domicilio.provincia",
            "domicilio_distrito": "documento_identidad.domicilio.distrito",
            "domicilio_localidad": "documento_identidad.domicilio.localidad",

            # From Nombramiento
            "numero_nombramiento": "nombramiento.datos_administrativos.numero_nombramiento",
            "fecha_nombramiento": "nombramiento.datos_administrativos.fecha_nombramiento",
            "cargo": "nombramiento.datos_administrativos.cargo",
            "categoria": "nombramiento.datos_administrativos.categoria",
            "nivel": "nombramiento.datos_administrativos.nivel",
            "ministerio_destino": "nombramiento.datos_administrativos.ministerio_destino",
            "unidad_organica": "nombramiento.datos_administrativos.unidad_organica",
            "tipo_vinculacion": "nombramiento.datos_administrativos.tipo_vinculacion",

            # From existing Carnet (renovacion/duplicado)
            "numero_carnet_anterior": "carnet_expirado.datos_carnet.numero_carnet",
            "fecha_emision_anterior": "carnet_expirado.datos_carnet.fecha_emision"
        }

    def get_workflow_code_for_subtype(self, sub_type: str) -> WorkflowCode:
        """Get the specific workflow code."""
        return WorkflowCode.FP_CARNET_FUNCIONARIO

    def get_workflow_states(self) -> List[Dict[str, Any]]:
        """Get workflow states for carnet."""
        return [
            {"code": "borrador", "label_es": "Borrador", "actions": ["edit", "delete"]},
            {"code": "presentado", "label_es": "Presentado", "actions": ["cancel"]},
            {"code": "en_revision", "label_es": "En Revisión", "actions": []},
            {"code": "documentos_requeridos", "label_es": "Documentos Requeridos", "actions": ["add_documents"]},
            {"code": "aprobado", "label_es": "Aprobado", "actions": ["download_authorization"]},
            {"code": "rechazado", "label_es": "Rechazado", "actions": ["new_request"]},
            {"code": "cita_programada", "label_es": "Cita Programada", "actions": ["reschedule"]},
            {"code": "biometria_capturada", "label_es": "Biometría Capturada", "actions": []},
            {"code": "en_fabricacion", "label_es": "En Fabricación", "actions": []},
            {"code": "listo_entrega", "label_es": "Listo para Entrega", "actions": []},
            {"code": "entregado", "label_es": "Entregado", "actions": []}
        ]
