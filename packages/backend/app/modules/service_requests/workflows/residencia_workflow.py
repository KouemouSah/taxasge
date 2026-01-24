"""
ResidenciaWorkflow - Workflow for residence permit requests.

Implements the residence permit workflow based on WORKFLOW_RESIDENCIA_CITOYEN.md.

IMPORTANT: This is a THREE-PHASE workflow with Nota de Ingreso:
- Phase 0: Stamp payment (Cedula Personal + Poliza) BEFORE submission
- Phase 1: Initial request → Extranjeria validates → CNEDOGE generates/validates Solicitud → Nota issued
- Phase 2: Upload Nota + Identity + Payment → CNEDOGE generates Certificate + Receipt → Appointment

Types:
- PRIMERA_VEZ: First request (13 documents)
- RENOVACION: Renewal (12 documents)
- DUPLICADO: Duplicate (12 documents)
- CAMBIO_DATOS: Data modification (12 documents)
- REAGRUPACION: Family reunification (13 documents)

Entities:
- EXTRANJERIA (Direccion General de Extranjeria y Fronteras) - Validator
- CNEDOGE (Centro Nacional de Emision de Documentos Oficiales) - Issuer
"""
from typing import List, Dict, Any, Optional
from enum import Enum

from .base_workflow import (
    BaseWorkflow,
    WorkflowStep,
    WorkflowContext,
    DocumentRequirement,
    TariffConfig,
    StepType
)
from ..models.enums import (
    WorkflowCode,
    WorkflowCategory,
    EntityCode,
    TariffType,
    DocumentConditionType
)


class ResidenciaPhase(str, Enum):
    """Phases of the residence permit workflow."""
    PHASE_0_STAMPS = "PHASE_0_STAMPS"
    PHASE_1_INITIAL = "PHASE_1_INITIAL"
    PHASE_2_NOTA_INGRESO = "PHASE_2_NOTA_INGRESO"


class ResidenciaCategory(str, Enum):
    """Categories of residence permits."""
    TRAB_SALARIADO = "TRAB_SALARIADO"      # Salaried worker
    TRAB_INDEPENDIENTE = "TRAB_INDEPENDIENTE"  # Independent worker
    INVERSOR = "INVERSOR"                   # Investor
    FAMILIA = "FAMILIA"                     # Family
    ESTUDIANTE = "ESTUDIANTE"               # Student
    JUBILADO = "JUBILADO"                   # Retiree


class ResidenciaWorkflow(BaseWorkflow):
    """
    Residence permit request workflow (EXTRANJERIA + CNEDOGE).

    This is a THREE-PHASE workflow:
    - Phase 0: Stamp payment (Cedula Personal + Poliza)
    - Phase 1: Initial submission and validation
    - Phase 2: After Nota de Ingreso

    Sub-types:
    - PRIMERA_VEZ: First request (13 documents required)
    - RENOVACION: Renewal (12 documents required)
    - DUPLICADO: Duplicate request
    - CAMBIO_DATOS: Data modification
    - REAGRUPACION: Family reunification

    IMPORTANT: Only foreigners can request residence permits.
    DIP (Documento de Identidad Personal) is NOT accepted.
    Only Passport is valid for identity verification.
    """

    # Class attributes
    workflow_code = WorkflowCode.RESIDENCIA_PRIMERA_VEZ  # Default
    category = WorkflowCategory.EXTRANJERIA
    entity_code = EntityCode.EXTRANJERIA

    service_name_es = "Solicitud de Permiso de Residencia"

    requires_nota_ingreso = True  # Key difference from other workflows
    requires_appointment = True
    requires_agent_review = True

    allowed_sub_types = [
        "PRIMERA_VEZ",
        "RENOVACION",
        "DUPLICADO",
        "CAMBIO_DATOS",
        "REAGRUPACION"
    ]

    # Multi-entity workflow
    entities_involved = [
        EntityCode.EXTRANJERIA,  # Validator
        EntityCode.CNEDOGE       # Issuer
    ]

    # Stamp pricing
    CEDULA_PERSONAL_XAF = 1500
    POLIZA_XAF = 1000
    TOTAL_PER_INSTANCE = 2500

    def __init__(self, sub_type: str = "PRIMERA_VEZ"):
        """Initialize with default phase."""
        super().__init__(sub_type)
        self._current_phase = ResidenciaPhase.PHASE_0_STAMPS

    def _setup_specific_steps(self) -> None:
        """Setup residence-specific workflow steps."""

        # === PHASE 0: Stamp Payment ===
        self.add_step(WorkflowStep(
            step_number=5,
            step_id="stamp_payment",
            step_type=StepType.PAYMENT,
            title_es="Pago de Timbres (Cédula y Póliza)",
            description_es="Pago obligatorio de timbres antes de la presentación: Cédula Personal (1,500 XAF) + Póliza (1,000 XAF) por instancia",
            is_inherited=False,
            config={
                "phase": "PHASE_0_STAMPS",
                "currency": "XAF",
                "stamp_prices": {
                    "cedula_personal": self.CEDULA_PERSONAL_XAF,
                    "poliza": self.POLIZA_XAF
                },
                "receipt_auto_attached": True,
                "payment_timing": "BEFORE_SUBMISSION"
            }
        ))

        # === PHASE 1: Document Upload ===
        self.add_step(WorkflowStep(
            step_number=6,
            step_id="additional_documents",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Documentos Adicionales",
            description_es="Cargue los documentos requeridos según su tipo de solicitud",
            is_inherited=False,
            config={
                "phase": "PHASE_1_INITIAL",
                "document_count": {
                    "PRIMERA_VEZ": 13,
                    "RENOVACION": 12,
                    "DUPLICADO": 12,
                    "CAMBIO_DATOS": 12,
                    "REAGRUPACION": 13
                }
            }
        ))

        # === PHASE 1: Confirmation and Submission ===
        self.add_step(WorkflowStep(
            step_number=7,
            step_id="phase1_confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación Fase 1",
            description_es="Verifique sus datos y envíe su solicitud a Extranjería",
            is_inherited=False,
            config={
                "phase": "PHASE_1_INITIAL",
                "show_summary": True,
                "next_steps_info": "Después de la validación, recibirá una notificación para recoger su Nota de Ingreso"
            }
        ))

        # === PHASE 2: Nota de Ingreso Upload ===
        self.add_step(WorkflowStep(
            step_number=8,
            step_id="nota_ingreso_upload",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Cargar Nota de Ingreso",
            description_es="Después de obtener su Nota de Ingreso en el mostrador, súbala aquí",
            is_inherited=False,
            documents=[
                DocumentRequirement(
                    document_code="nota_ingreso",
                    document_name_es="Nota de Ingreso",
                    schema_key="NOTA_INGRESO_GQ_V1",
                    is_required=True,
                    display_order=1,
                    condition_type=DocumentConditionType.ALWAYS,
                    instructions_es="Escanee la Nota de Ingreso emitida por Extranjería"
                )
            ],
            config={
                "phase": "PHASE_2_NOTA_INGRESO",
                "extract_payment_amount": True
            }
        ))

        # === PHASE 2: Final Payment (from Nota de Ingreso) ===
        self.add_step(WorkflowStep(
            step_number=9,
            step_id="nota_payment",
            step_type=StepType.PAYMENT,
            title_es="Pago de la Nota de Ingreso",
            description_es="El monto a pagar se extrae automáticamente de su Nota de Ingreso",
            is_inherited=False,
            config={
                "phase": "PHASE_2_NOTA_INGRESO",
                "currency": "XAF",
                "amount_source": "nota_ingreso.monto_total"
            }
        ))

        # === PHASE 2: Final Confirmation ===
        self.add_step(WorkflowStep(
            step_number=10,
            step_id="final_confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación Final",
            description_es="Después del pago, se programará automáticamente una cita (20-30 días)",
            is_inherited=False,
            config={
                "phase": "PHASE_2_NOTA_INGRESO",
                "show_summary": True,
                "auto_schedule_appointment": True,
                "appointment_delay_days": {"min": 20, "max": 30},
                "fabrication_days": 30
            }
        ))

    def _setup_tariffs(self) -> None:
        """Setup tariff configuration for residence permit.

        NOTE: Residence permits use Nota de Ingreso for final tariff.
        The stamp payment (Phase 0) is fixed.
        """
        self._tariff_config = TariffConfig(
            tariff_type=TariffType.NOTA_INGRESO,
            currency="XAF",
            extra={
                "stamp_cedula": self.CEDULA_PERSONAL_XAF,
                "stamp_poliza": self.POLIZA_XAF,
                "stamp_total_per_instance": self.TOTAL_PER_INSTANCE
            }
        )

    def calculate_stamp_tariff(self, instances: int = 1) -> int:
        """Calculate stamp payment for Phase 0."""
        return self.TOTAL_PER_INSTANCE * instances

    def get_document_requirements(self, sub_type: str) -> List[DocumentRequirement]:
        """Get document requirements for residence permit request.

        IMPORTANT: Only Passport is accepted for foreigners.
        DIP is NOT valid for residence permit requests.
        """
        requirements = []

        # 1. Instance/Solicitud (generated form)
        requirements.append(DocumentRequirement(
            document_code="instancia_solicitud",
            document_name_es="Instancia dirigida al Excmo. Señor Ministro",
            is_required=True,
            display_order=1,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Este formulario será generado automáticamente por el sistema",
            config={"type": "generated_form"}
        ))

        # 2. Photos (3 required)
        requirements.append(DocumentRequirement(
            document_code="fotografias",
            document_name_es="Tres Fotografías tamaño carnet (fondo blanco)",
            is_required=True,
            display_order=2,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="3 fotos tamaño carnet con fondo blanco",
            accepted_formats=["jpg", "jpeg", "png"],
            config={"quantity": 3}
        ))

        # 3. Passport with legal entry stamp
        requirements.append(DocumentRequirement(
            document_code="pasaporte_entrada_legal",
            document_name_es="Pasaporte con entrada legal",
            schema_key="PASAPORTE_GQ_V1",
            is_required=True,
            display_order=3,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Pasaporte válido con sello de entrada legal a Guinea Ecuatorial",
            faces_required=["data_page", "entry_stamp_page"]
        ))

        # 4. Declaración Jurada (generated form)
        if sub_type == "PRIMERA_VEZ":
            requirements.append(DocumentRequirement(
                document_code="declaracion_jurada",
                document_name_es="Declaración Jurada de no injerencia",
                is_required=True,
                display_order=4,
                condition_type=DocumentConditionType.IS_NEW,
                instructions_es="Declaración de no injerencia en asuntos internos del país",
                config={"type": "generated_form"}
            ))

        # 5. Autorización de Reclutamiento (if worker)
        requirements.append(DocumentRequirement(
            document_code="autorizacion_reclutamiento",
            document_name_es="Autorización de Reclutamiento (Min. Trabajo)",
            is_required=True,
            display_order=5,
            condition_type=DocumentConditionType.CUSTOM,
            condition_value={"categories": ["TRAB_SALARIADO", "TRAB_INDEPENDIENTE"]},
            instructions_es="Autorización expedida por el Ministerio de Trabajo y Seguridad Social"
        ))

        # 6. Contrato de Trabajo (if worker)
        requirements.append(DocumentRequirement(
            document_code="contrato_trabajo",
            document_name_es="Contrato de Trabajo",
            is_required=True,
            display_order=6,
            condition_type=DocumentConditionType.CUSTOM,
            condition_value={"categories": ["TRAB_SALARIADO", "TRAB_INDEPENDIENTE", "INVERSOR"]},
            instructions_es="Contrato de trabajo con empresa o persona física"
        ))

        # 7. NIF o Autorización Gubernativa
        requirements.append(DocumentRequirement(
            document_code="nif_autorizacion",
            document_name_es="NIF o Autorización Gubernativa",
            schema_key="CERTIFICADO_NIF_GQ_V1",
            is_required=True,
            display_order=7,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Resolución de la Presidencia o NIF de la empresa"
        ))

        # 8. Solvencia Tributaria
        requirements.append(DocumentRequirement(
            document_code="solvencia_tributaria",
            document_name_es="Solvencia Tributaria",
            is_required=True,
            display_order=8,
            condition_type=DocumentConditionType.CUSTOM,
            condition_value={"categories": ["TRAB_SALARIADO", "TRAB_INDEPENDIENTE", "INVERSOR"]},
            instructions_es="Certificado de no deber al Tesoro Público"
        ))

        # 9. Extracto Bancario
        requirements.append(DocumentRequirement(
            document_code="extracto_bancario",
            document_name_es="Extracto y Atestación Bancaria",
            is_required=True,
            display_order=9,
            condition_type=DocumentConditionType.CUSTOM,
            condition_value={"categories": ["TRAB_SALARIADO", "TRAB_INDEPENDIENTE", "INVERSOR"]},
            instructions_es="Extracto bancario de la empresa"
        ))

        # 10. Certificado de Buena Conducta (Policía)
        requirements.append(DocumentRequirement(
            document_code="certificado_conducta_policia",
            document_name_es="Certificado de Buena Conducta (Policía Judicial)",
            is_required=True,
            display_order=10,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Expedido por la Policía Judicial"
        ))

        # 11. Certificado de Buena Conducta (Empresa)
        requirements.append(DocumentRequirement(
            document_code="certificado_conducta_empresa",
            document_name_es="Certificado de Buena Conducta (Empresa)",
            is_required=True,
            display_order=11,
            condition_type=DocumentConditionType.CUSTOM,
            condition_value={"categories": ["TRAB_SALARIADO", "TRAB_INDEPENDIENTE", "INVERSOR"]},
            instructions_es="Certificado de buena conducta emitido por la empresa"
        ))

        # 12. Certificado Médico
        requirements.append(DocumentRequirement(
            document_code="certificado_medico",
            document_name_es="Certificado Médico (VIH, Hepatitis C, Tuberculosis)",
            is_required=True,
            display_order=12,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Certificado de no padecer enfermedades infectocontagiosas. Solo: Clínica Virgen de Guadalupe o Centro Médico La Paz",
            config={
                "valid_clinics": ["Clínica Virgen de Guadalupe", "Centro Médico La Paz"],
                "required_tests": ["VIH", "Hepatitis C", "Tuberculosis"]
            }
        ))

        # 13. Cédula y Póliza (auto-attached after stamp payment)
        requirements.append(DocumentRequirement(
            document_code="cedula_poliza",
            document_name_es="Recibo de Cédula Personal y Póliza",
            is_required=True,
            display_order=13,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Se adjunta automáticamente después del pago de timbres",
            config={"auto_attached": True, "from_step": "stamp_payment"}
        ))

        # Additional for RENOVACION
        if sub_type in ["RENOVACION", "DUPLICADO", "CAMBIO_DATOS"]:
            requirements.append(DocumentRequirement(
                document_code="residencia_anterior",
                document_name_es="Permiso de Residencia Anterior",
                schema_key="PERMISO_RESIDENCIA_GQ_V1",
                is_required=True,
                display_order=14,
                condition_type=DocumentConditionType.IS_RENEWAL,
                instructions_es="Copia y original del permiso de residencia anterior",
                faces_required=["recto", "verso"]
            ))

            requirements.append(DocumentRequirement(
                document_code="certificado_autenticidad",
                document_name_es="Certificado de Autenticidad CNEDOGE",
                is_required=True,
                display_order=15,
                condition_type=DocumentConditionType.IS_RENEWAL,
                instructions_es="Certificado de autenticidad expedido por CNEDOGE"
            ))

        # Police report for DUPLICADO (loss/theft)
        if sub_type == "DUPLICADO":
            requirements.append(DocumentRequirement(
                document_code="denuncia_policial",
                document_name_es="Denuncia Policial (si pérdida o robo)",
                is_required=True,
                display_order=16,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"motivo": ["PERDIDA", "ROBO"]},
                instructions_es="Denuncia de pérdida o robo ante la Policía Nacional"
            ))

        return requirements

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """Get cross-document validation rules for residence permit."""
        return [
            # Passport must be valid
            {
                "id": "pasaporte_valido",
                "document": "pasaporte_entrada_legal",
                "rule": "documento.fecha_expiracion > TODAY",
                "error_es": "El pasaporte está expirado. Debe renovarlo antes de solicitar el permiso de residencia.",
                "severity": "error"
            },
            # Must have legal entry stamp
            {
                "id": "entrada_legal",
                "document": "pasaporte_entrada_legal",
                "rule": "documento.tiene_sello_entrada == true",
                "error_es": "El pasaporte debe tener sello de entrada legal a Guinea Ecuatorial.",
                "severity": "error"
            },
            # Nationality must NOT be Equatorial Guinean
            {
                "id": "nacionalidad_extranjero",
                "document": "pasaporte_entrada_legal",
                "rule": "titular.nacionalidad != 'GNQ' AND titular.nacionalidad != 'GUINEA ECUATORIAL'",
                "error_es": "Solo los extranjeros pueden solicitar permiso de residencia. Los ciudadanos de Guinea Ecuatorial deben usar su DIP.",
                "severity": "error"
            },
            # Medical certificate from approved clinic
            {
                "id": "clinica_autorizada",
                "document": "certificado_medico",
                "rule": "clinica_nombre IN ['Clínica Virgen de Guadalupe', 'Centro Médico La Paz']",
                "error_es": "El certificado médico debe ser de la Clínica Virgen de Guadalupe o Centro Médico La Paz.",
                "severity": "error"
            },
            # Medical tests must be negative
            {
                "id": "resultados_medicos_negativos",
                "document": "certificado_medico",
                "rule": "resultado_vih == 'NEGATIVO' AND resultado_hepatitis_c == 'NEGATIVO' AND resultado_tuberculosis == 'NEGATIVO'",
                "error_es": "Todos los resultados médicos deben ser negativos (VIH, Hepatitis C, Tuberculosis).",
                "severity": "error"
            },
            # NIF must have definitive authorization
            {
                "id": "nif_definitivo",
                "document": "nif_autorizacion",
                "rule": "empresa.autorizacion == 'DEFINITIVA'",
                "error_es": "El NIF debe tener autorización DEFINITIVA, no provisional.",
                "severity": "error"
            },
            # For RENOVACION: Previous permit must be near expiry
            {
                "id": "residencia_renovable",
                "condition": "tipo IN ['RENOVACION']",
                "document": "residencia_anterior",
                "rule": "documento.fecha_expiracion < TODAY + 90 DAYS OR documento.fecha_expiracion < TODAY",
                "error_es": "Solo puede renovar si el permiso expira en menos de 90 días o ya ha expirado.",
                "severity": "warning"
            },
            # Names must match between passport and previous permit
            {
                "id": "nombres_coherentes",
                "condition": "tipo IN ['RENOVACION', 'DUPLICADO', 'CAMBIO_DATOS']",
                "rule": "normalize(pasaporte_entrada_legal.titular.apellidos) == normalize(residencia_anterior.titular.apellidos)",
                "error_es": "El nombre en el pasaporte no coincide con el permiso de residencia anterior.",
                "severity": "error"
            },
            # Nota de Ingreso must match request
            {
                "id": "nota_ingreso_valida",
                "condition": "phase == 'PHASE_2_NOTA_INGRESO'",
                "document": "nota_ingreso",
                "rule": "nota.numero_expediente == solicitud.numero_expediente",
                "error_es": "La Nota de Ingreso no corresponde a esta solicitud.",
                "severity": "error"
            }
        ]

    def get_form_mapping(self) -> Dict[str, str]:
        """Get mapping from extracted data to form fields."""
        return {
            # From Passport
            "numero_pasaporte": "pasaporte_entrada_legal.documento.numero_pasaporte",
            "apellido_1": "pasaporte_entrada_legal.titular.apellidos[0]",
            "apellido_2": "pasaporte_entrada_legal.titular.apellidos[1]",
            "nombres": "pasaporte_entrada_legal.titular.nombres",
            "nacionalidad": "pasaporte_entrada_legal.titular.nacionalidad",
            "sexo": "pasaporte_entrada_legal.titular.sexo",
            "fecha_nacimiento": "pasaporte_entrada_legal.titular.fecha_nacimiento",
            "lugar_nacimiento": "pasaporte_entrada_legal.titular.lugar_nacimiento",
            "fecha_entrada": "pasaporte_entrada_legal.sellos.entrada.fecha",

            # From Previous Residence (if RENOVACION)
            "numero_nie": "residencia_anterior.documento.nie",
            "fecha_emision_primera": "residencia_anterior.documento.fecha_emision",

            # From NIF/Authorization
            "empresa_nif": "nif_autorizacion.empresa.nif",
            "empresa_razon_social": "nif_autorizacion.empresa.razon_social",
            "tipo_autorizacion": "nif_autorizacion.empresa.autorizacion",

            # From Work Contract
            "lugar_trabajo": "contrato_trabajo.empresa",
            "profesion": "contrato_trabajo.puesto",

            # From Nota de Ingreso (Phase 2)
            "numero_nota_ingreso": "nota_ingreso.documento.numero_nota",
            "monto_nota_ingreso": "nota_ingreso.documento.monto_total"
        }

    def get_workflow_code_for_subtype(self, sub_type: str) -> WorkflowCode:
        """Get the specific workflow code for a sub-type."""
        mapping = {
            "PRIMERA_VEZ": WorkflowCode.RESIDENCIA_PRIMERA_VEZ,
            "RENOVACION": WorkflowCode.RESIDENCIA_RENOVACION,
            "DUPLICADO": WorkflowCode.RESIDENCIA_DUPLICADO,
            "CAMBIO_DATOS": WorkflowCode.RESIDENCIA_CAMBIO_DATOS,
            "REAGRUPACION": WorkflowCode.RESIDENCIA_REAGRUPACION
        }
        return mapping.get(sub_type, WorkflowCode.RESIDENCIA_PRIMERA_VEZ)

    def get_current_phase(self) -> ResidenciaPhase:
        """Get current workflow phase."""
        return self._current_phase

    def advance_to_phase(self, phase: ResidenciaPhase) -> None:
        """Advance workflow to a new phase."""
        self._current_phase = phase

    def get_steps_for_phase(self, phase: ResidenciaPhase) -> List[WorkflowStep]:
        """Get steps applicable to a specific phase."""
        return [
            step for step in self.steps.values()
            if step.config and step.config.get("phase") == phase.value
        ]
