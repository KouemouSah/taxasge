"""
PasaporteWorkflow - Autonomous passport request workflow.

This is a PREDEFINED workflow with complete business logic.
Implements the new SolicitudType + RenovacionMotivo model:

  EXPEDICION (First passport):
    - Never had a passport before
    - Requires: DIP + Certificado de Nacimiento + Fotos
    - Tariff: 75,000 XAF

  RENOVACION (Renewal):
    - Already had passport, needs new one
    - Motivo determines documents and tariff:
      * VENCIMIENTO: Passport expired/expiring → Pasaporte antiguo + Fotos (50,000 XAF)
      * PERDIDA: Lost passport → Denuncia policial + Fotos (100,000 XAF penalty)
      * ROBO: Stolen passport → Denuncia policial + Fotos (100,000 XAF penalty)
      * DETERIORO: Damaged passport → Pasaporte dañado + Fotos (75,000 XAF)

  DUPLICADO (Duplicate):
    - Has valid passport, wants a copy
    - Requires: DIP + Pasaporte actual + Fotos
    - Tariff: 40,000 XAF

Entity: CNEDOGE (Centro Nacional de Expedición de Documentos)
Requires: Appointment (cita) + Agent Review
"""
from typing import List, Dict, Any, Optional

from .workflow_interface import (
    PredefinedWorkflow,
    WorkflowStep,
    WorkflowContext,
    DocumentRequirement,
    TariffConfig,
    ValidationResult,
    StepType,
    RenovacionMotivo,
)
from ..models.enums import (
    WorkflowCode,
    WorkflowCategory,
    EntityCode,
    TariffType,
    SolicitudType,
    DocumentConditionType
)


class PasaporteWorkflow(PredefinedWorkflow):
    """
    Passport request workflow.

    AUTONOMOUS: Defines ALL logic internally, no BaseWorkflow inheritance.

    Business model:
    - EXPEDICION: First passport ever
    - RENOVACION + Motivo: Renewal with specific reason
    - DUPLICADO: Copy of valid passport
    """

    # === Configuration ===

    @property
    def workflow_code(self) -> WorkflowCode:
        return WorkflowCode.PASAPORTE_NUEVO  # Base code, variant determined by type

    @property
    def category(self) -> WorkflowCategory:
        return WorkflowCategory.IDENTIDAD

    @property
    def entity_code(self) -> EntityCode:
        return EntityCode.CNEDOGE

    @property
    def service_name_es(self) -> str:
        return "Solicitud de Pasaporte"

    @property
    def allowed_solicitud_types(self) -> List[SolicitudType]:
        return [SolicitudType.EXPEDICION, SolicitudType.RENOVACION, SolicitudType.DUPLICADO]

    @property
    def requires_appointment(self) -> bool:
        return True  # Passport requires cita at CNEDOGE

    @property
    def requires_agent_review(self) -> bool:
        return True

    @property
    def requires_nota_ingreso(self) -> bool:
        return False  # Direct payment via Mobile Money

    # === Workflow Setup ===

    def _setup_workflow(self) -> None:
        """
        Setup complete passport workflow.

        Steps:
        1. Select type (EXPEDICION/RENOVACION/DUPLICADO) + Motivo for RENOVACION
        2. Upload required documents (based on type/motivo)
        3. Upload passport photos (2 photos, 35x45mm)
        4. Review pre-filled form (from document extraction)
        5. Cross-document validation
        6. Payment (Mobile Money)
        7. Confirmation + Schedule cita
        """

        # === Step 1: Type Selection ===
        self.add_step(WorkflowStep(
            step_number=1,
            step_id="select_type",
            step_type=StepType.SELECTION,
            title_es="Tipo de Solicitud",
            description_es="Seleccione el tipo de trámite de pasaporte",
            requires_previous=False,
            config={
                "solicitud_types": [
                    {
                        "value": "EXPEDICION",
                        "label_es": "Primera Expedición",
                        "description_es": "Solicito mi primer pasaporte",
                    },
                    {
                        "value": "RENOVACION",
                        "label_es": "Renovación",
                        "description_es": "Ya tuve pasaporte y necesito uno nuevo",
                        "motivos": [
                            {
                                "value": "VENCIMIENTO",
                                "label_es": "Vencimiento",
                                "description_es": "Mi pasaporte está vencido o por vencer",
                            },
                            {
                                "value": "PERDIDA",
                                "label_es": "Pérdida",
                                "description_es": "Perdí mi pasaporte",
                            },
                            {
                                "value": "ROBO",
                                "label_es": "Robo",
                                "description_es": "Me robaron mi pasaporte",
                            },
                            {
                                "value": "DETERIORO",
                                "label_es": "Deterioro",
                                "description_es": "Mi pasaporte está dañado",
                            },
                        ]
                    },
                    {
                        "value": "DUPLICADO",
                        "label_es": "Duplicado",
                        "description_es": "Tengo pasaporte válido y necesito una copia",
                    },
                ]
            }
        ))

        # === Step 2: Document Upload ===
        # Documents are dynamic based on type/motivo
        self.add_step(WorkflowStep(
            step_number=2,
            step_id="upload_documents",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Documentos Requeridos",
            description_es="Cargue los documentos necesarios para su solicitud",
            config={
                "dynamic_documents": True,  # Frontend should call get_document_requirements
            }
        ))

        # === Step 3: Passport Photos ===
        self.add_step(WorkflowStep(
            step_number=3,
            step_id="upload_photos",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Fotografías",
            description_es="Cargue 2 fotografías tipo pasaporte",
            documents=[
                DocumentRequirement(
                    document_code="photo_carnet",
                    document_name_es="Fotografías tipo pasaporte (x2)",
                    is_required=True,
                    display_order=1,
                    condition_type=DocumentConditionType.ALWAYS,
                    instructions_es="2 fotografías de 35x45mm, fondo blanco, rostro visible, sin gafas",
                    accepted_formats=["jpg", "jpeg", "png"],
                    config={"quantity": 2}
                )
            ],
            config={"quantity": 2}
        ))

        # === Step 4: Form Review ===
        self.add_step(WorkflowStep(
            step_number=4,
            step_id="review_form",
            step_type=StepType.FORM_REVIEW,
            title_es="Verificar Datos",
            description_es="Verifique y corrija los datos extraídos de sus documentos",
            config={
                "sections": [
                    {
                        "id": "personal",
                        "title_es": "Datos Personales",
                        "fields": [
                            "numero_dip", "apellidos", "nombres", "sexo",
                            "fecha_nacimiento", "lugar_nacimiento",
                            "nacionalidad", "estado_civil", "profesion"
                        ]
                    },
                    {
                        "id": "domicilio",
                        "title_es": "Domicilio",
                        "fields": ["domicilio", "ciudad", "distrito"]
                    },
                    {
                        "id": "filiacion",
                        "title_es": "Filiación",
                        "fields": ["nombre_padre", "nombre_madre"]
                    },
                    {
                        "id": "pasaporte_anterior",
                        "title_es": "Pasaporte Anterior",
                        "condition": "solicitud_type == RENOVACION",
                        "fields": [
                            "numero_pasaporte_antiguo",
                            "fecha_expedicion_antiguo",
                            "fecha_expiracion_antiguo"
                        ]
                    }
                ]
            }
        ))

        # === Step 5: Validation ===
        self.add_step(WorkflowStep(
            step_number=5,
            step_id="validation",
            step_type=StepType.VALIDATION,
            title_es="Validaciones",
            description_es="El sistema verifica la coherencia de sus documentos",
            config={
                "auto_validate": True,
                "show_results": True
            }
        ))

        # === Step 6: Payment ===
        self.add_step(WorkflowStep(
            step_number=6,
            step_id="payment",
            step_type=StepType.PAYMENT,
            title_es="Pago de Tasas",
            description_es="Realice el pago mediante Mobile Money",
            config={
                "payment_methods": ["MTN_MOBILE_MONEY", "ORANGE_MONEY", "BANGE_WALLET"],
                "currency": "XAF",
                "show_breakdown": True
            }
        ))

        # === Step 7: Confirmation ===
        self.add_step(WorkflowStep(
            step_number=7,
            step_id="confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación",
            description_es="Revise el resumen y programe su cita en CNEDOGE",
            config={
                "show_summary": True,
                "schedule_appointment": True,
                "appointment_entity": "CNEDOGE"
            }
        ))

        # === Setup Tariffs ===
        self._setup_tariffs()

    def _setup_tariffs(self) -> None:
        """
        Setup tariff configuration.

        Tariffs by type/motivo (in XAF):
        - EXPEDICION: 75,000
        - RENOVACION:
          - VENCIMIENTO: 50,000
          - PERDIDA: 100,000 (includes penalty)
          - ROBO: 100,000 (includes penalty)
          - DETERIORO: 75,000
        - DUPLICADO: 40,000
        """
        self.set_tariff_config(TariffConfig(
            tariff_type=TariffType.FIXED,
            fixed_amounts={
                # EXPEDICION
                "EXPEDICION": 7500000,  # 75,000 XAF (stored in centimes)

                # RENOVACION by motivo
                "VENCIMIENTO": 5000000,   # 50,000 XAF
                "PERDIDA": 10000000,      # 100,000 XAF (penalty)
                "ROBO": 10000000,         # 100,000 XAF (penalty)
                "DETERIORO": 7500000,     # 75,000 XAF

                # DUPLICADO
                "DUPLICADO": 4000000,     # 40,000 XAF
            },
            currency="XAF"
        ))

    # === Document Requirements ===

    def get_document_requirements(
        self,
        solicitud_type: SolicitudType,
        motivo: Optional[RenovacionMotivo] = None,
        context: Optional[WorkflowContext] = None
    ) -> List[DocumentRequirement]:
        """
        Get document requirements based on solicitud type and motivo.

        Common to all types:
        - DIP (always required)
        - Photos (always required, handled in step 3)

        Type-specific:
        - EXPEDICION: + Certificado de Nacimiento
        - RENOVACION:
          - VENCIMIENTO/DETERIORO: + Pasaporte antiguo
          - PERDIDA/ROBO: + Denuncia policial
        - DUPLICADO: + Pasaporte actual
        """
        requirements = []

        # === DIP - Always required ===
        requirements.append(DocumentRequirement(
            document_code="dip",
            document_name_es="Documento de Identidad Personal (DIP)",
            schema_key="DIP_GQ_V2",
            is_required=True,
            display_order=1,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Escanee ambas caras de su DIP vigente",
            faces_required=["recto", "verso"]
        ))

        # === Type-specific documents ===

        if solicitud_type == SolicitudType.EXPEDICION:
            # First passport: need birth certificate
            requirements.append(DocumentRequirement(
                document_code="certificado_nacimiento",
                document_name_es="Certificado de Nacimiento",
                schema_key="CERTIFICACION_NACIMIENTO_GQ_V1",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.IS_NEW,
                instructions_es="Certificación literal de inscripción de nacimiento (original o copia certificada)"
            ))

        elif solicitud_type == SolicitudType.RENOVACION:
            if motivo in [RenovacionMotivo.VENCIMIENTO, RenovacionMotivo.DETERIORO]:
                # Renewal for expiration or damage: need old passport
                doc_name = "Pasaporte Dañado" if motivo == RenovacionMotivo.DETERIORO else "Pasaporte Antiguo"
                instructions = (
                    "Presente el pasaporte dañado para verificación"
                    if motivo == RenovacionMotivo.DETERIORO
                    else "Escanee la página de datos de su pasaporte vencido o por vencer"
                )
                requirements.append(DocumentRequirement(
                    document_code="pasaporte_antiguo",
                    document_name_es=doc_name,
                    schema_key="PASAPORTE_GQ_V1",
                    is_required=True,
                    display_order=2,
                    condition_type=DocumentConditionType.CUSTOM,
                    condition_value={"motivos": ["VENCIMIENTO", "DETERIORO"]},
                    instructions_es=instructions
                ))

            elif motivo in [RenovacionMotivo.PERDIDA, RenovacionMotivo.ROBO]:
                # Loss or theft: need police report
                reason = "robo" if motivo == RenovacionMotivo.ROBO else "pérdida"
                requirements.append(DocumentRequirement(
                    document_code="denuncia_policial",
                    document_name_es="Denuncia Policial",
                    is_required=True,
                    display_order=2,
                    condition_type=DocumentConditionType.CUSTOM,
                    condition_value={"motivos": ["PERDIDA", "ROBO"]},
                    instructions_es=f"Denuncia de {reason} emitida por la Policía Nacional (máximo 30 días)"
                ))

        elif solicitud_type == SolicitudType.DUPLICADO:
            # Duplicate: need current valid passport
            requirements.append(DocumentRequirement(
                document_code="pasaporte_actual",
                document_name_es="Pasaporte Actual",
                schema_key="PASAPORTE_GQ_V1",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.IS_DUPLICATE,
                instructions_es="Escanee la página de datos de su pasaporte vigente"
            ))

        # === Minor authorization (conditional) ===
        # If user age < 18, require parental authorization
        requirements.append(DocumentRequirement(
            document_code="autorizacion_parental",
            document_name_es="Autorización Parental",
            is_required=True,
            display_order=10,
            condition_type=DocumentConditionType.IS_MINOR,
            instructions_es="Autorización firmada por ambos padres o tutor legal, con copia de sus DIPs"
        ))

        return requirements

    # === Cross-Document Validation Rules ===

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """
        Get cross-document validation rules.

        Rules:
        1. DIP must not be expired
        2. DIP number must be valid format (9 digits)
        3. For RENOVACION with VENCIMIENTO: passport must be expiring within 12 months
        4. Names must match between DIP and old passport
        5. For EXPEDICION: birthdate must match between DIP and birth certificate
        """
        return [
            # DIP not expired
            {
                "id": "dip_not_expired",
                "document": "dip",
                "rule": "documento.fecha_expiracion > TODAY",
                "error_es": "El DIP está expirado. Debe renovarlo antes de solicitar el pasaporte.",
                "severity": "error"
            },

            # DIP number format (9 digits)
            {
                "id": "dip_numero_format",
                "document": "dip",
                "rule": "documento.numero_dip MATCHES '^[0-9]{9}$'",
                "error_es": "El número de DIP debe tener 9 dígitos.",
                "severity": "error"
            },

            # Passport expiring for VENCIMIENTO renewal
            {
                "id": "pasaporte_expiring",
                "document": "pasaporte_antiguo",
                "condition": "motivo == 'VENCIMIENTO'",
                "rule": "documento.fecha_expiracion < TODAY + 12 MONTHS OR documento.fecha_expiracion < TODAY",
                "error_es": "Para renovación por vencimiento, el pasaporte debe estar vencido o por vencer en los próximos 12 meses.",
                "severity": "warning"
            },

            # Names coherent between DIP and old passport
            {
                "id": "nombres_coherentes_dip_pasaporte",
                "condition": "solicitud_type == 'RENOVACION' AND motivo IN ['VENCIMIENTO', 'DETERIORO']",
                "rule": "normalize(DIP.titular.apellidos) == normalize(PASAPORTE.titular.apellidos)",
                "error_es": "Los apellidos en el DIP no coinciden con el pasaporte antiguo.",
                "severity": "error"
            },

            # Birthdate coherent for EXPEDICION
            {
                "id": "fecha_nacimiento_coherente",
                "condition": "solicitud_type == 'EXPEDICION'",
                "rule": "DIP.titular.fecha_nacimiento == CERTIFICADO_NACIMIENTO.inscrito.fecha_nacimiento",
                "error_es": "La fecha de nacimiento del DIP no coincide con el certificado de nacimiento.",
                "severity": "warning"
            },

            # Police report not too old
            {
                "id": "denuncia_reciente",
                "document": "denuncia_policial",
                "condition": "motivo IN ['PERDIDA', 'ROBO']",
                "rule": "documento.fecha_emision > TODAY - 30 DAYS",
                "error_es": "La denuncia policial debe tener menos de 30 días de emitida.",
                "severity": "error"
            },
        ]

    # === Form Field Mapping ===

    def get_form_mapping(self) -> Dict[str, str]:
        """
        Map extracted data fields to form fields.

        Format: form_field -> document.path.to.field
        """
        return {
            # Personal data from DIP
            "numero_dip": "dip.documento.numero_dip",
            "apellidos": "dip.titular.apellidos",
            "nombres": "dip.titular.nombres",
            "sexo": "dip.titular.sexo",
            "fecha_nacimiento": "dip.titular.fecha_nacimiento",
            "lugar_nacimiento": "dip.titular.lugar_nacimiento",
            "nacionalidad": "dip.titular.nacionalidad",
            "estado_civil": "dip.titular.estado_civil",
            "profesion": "dip.titular.profesion",
            "domicilio": "dip.titular.domiciliacion",

            # From old passport (for renewal)
            "numero_pasaporte_antiguo": "pasaporte_antiguo.documento.numero_pasaporte",
            "fecha_expedicion_antiguo": "pasaporte_antiguo.documento.fecha_expedicion",
            "fecha_expiracion_antiguo": "pasaporte_antiguo.documento.fecha_expiracion",

            # From birth certificate (for first passport)
            "registro_civil": "certificado_nacimiento.documento.registro_civil_de",
            "nombre_padre": "certificado_nacimiento.padre.nombre_completo",
            "nombre_madre": "certificado_nacimiento.madre.nombre_completo"
        }

    # === Workflow Code Resolution ===

    def get_workflow_code_for_request(
        self,
        solicitud_type: SolicitudType,
        motivo: Optional[RenovacionMotivo] = None
    ) -> WorkflowCode:
        """
        Get the specific WorkflowCode for a request.

        Maps solicitud_type + motivo to the correct WorkflowCode variant.
        This is used for database storage and tariff lookup.
        """
        if solicitud_type == SolicitudType.EXPEDICION:
            return WorkflowCode.PASAPORTE_NUEVO

        elif solicitud_type == SolicitudType.RENOVACION:
            if motivo == RenovacionMotivo.VENCIMIENTO:
                return WorkflowCode.PASAPORTE_RENOVACION
            elif motivo == RenovacionMotivo.PERDIDA:
                return WorkflowCode.PASAPORTE_PERDIDA
            elif motivo == RenovacionMotivo.ROBO:
                return WorkflowCode.PASAPORTE_ROBO
            elif motivo == RenovacionMotivo.DETERIORO:
                return WorkflowCode.PASAPORTE_DETERIORO
            else:
                return WorkflowCode.PASAPORTE_RENOVACION  # Default

        elif solicitud_type == SolicitudType.DUPLICADO:
            # Note: No specific PASAPORTE_DUPLICADO code exists yet
            # Could add to WorkflowCode enum if needed
            return WorkflowCode.PASAPORTE_NUEVO  # Fallback

        return WorkflowCode.PASAPORTE_NUEVO


# =============================================================================
# REGISTRATION
# =============================================================================

def register_pasaporte_workflow():
    """Register the passport workflow with the workflow engine."""
    from ..services.workflow_engine import workflow_engine

    workflow = PasaporteWorkflow()
    workflow_engine.register_workflow(workflow)


# Singleton instance
_pasaporte_workflow: Optional[PasaporteWorkflow] = None


def get_pasaporte_workflow() -> PasaporteWorkflow:
    """Get the singleton PasaporteWorkflow instance."""
    global _pasaporte_workflow
    if _pasaporte_workflow is None:
        _pasaporte_workflow = PasaporteWorkflow()
    return _pasaporte_workflow
