"""
PasaporteWorkflow v2 - Autonomous passport request workflow.

This is a PREDEFINED workflow with complete business logic.
Based on pasaporte_workflow.py (v1) with CORRECT tariffs and sub-types.

Sub-types (aligned with v1 - pasaporte_workflow.py):
  NUEVO (First passport):
    - Never had a passport before
    - Requires: DIP + Certificado de Nacimiento + Foto
    - Tariff: 7,500 XAF

  RENOVACION (Renewal):
    - Passport expired or expiring
    - Requires: DIP + Pasaporte antiguo + Foto
    - Tariff: 5,000 XAF

  PERDIDA (Lost):
    - Lost passport
    - Requires: DIP + Denuncia policial + Foto
    - Tariff: 10,000 XAF (includes penalty)

  ROBO (Stolen):
    - Stolen passport
    - Requires: DIP + Denuncia policial + Foto
    - Tariff: 10,000 XAF (includes penalty)

  DETERIORO (Damaged):
    - Passport is damaged
    - Requires: DIP + Pasaporte danado + Foto
    - Tariff: 7,500 XAF

Entity: CNEDOGE (Centro Nacional de Expedicion de Documentos)
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

    Sub-types (from v1):
    - NUEVO: First passport ever (EXPEDICION)
    - RENOVACION: Passport renewal (VENCIMIENTO)
    - PERDIDA: Lost passport
    - ROBO: Stolen passport
    - DETERIORO: Damaged passport

    Note: We use the v1 sub_type names directly (NUEVO, RENOVACION, etc.)
    instead of the generic SolicitudType enum (EXPEDICION, RENOVACION, DUPLICADO).
    """

    # Valid sub-types from v1
    ALLOWED_SUB_TYPES = ["NUEVO", "RENOVACION", "PERDIDA", "ROBO", "DETERIORO"]

    # === Configuration ===

    @property
    def workflow_code(self) -> WorkflowCode:
        return WorkflowCode.PASAPORTE_NUEVO  # Base code, variant determined by sub_type

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
        # We use EXPEDICION and RENOVACION for generic typing
        # but actual sub_type is determined by ALLOWED_SUB_TYPES
        return [SolicitudType.EXPEDICION, SolicitudType.RENOVACION]

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
        1. Select type (NUEVO/RENOVACION/PERDIDA/ROBO/DETERIORO)
        2. Upload required documents (based on sub_type)
        3. Upload passport photo (1 photo, 35x45mm)
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
            description_es="Seleccione el tipo de tramite de pasaporte",
            requires_previous=False,
            config={
                "sub_types": [
                    {
                        "value": "NUEVO",
                        "label_es": "Primera Expedicion",
                        "description_es": "Solicito mi primer pasaporte (requiere certificado de nacimiento)",
                    },
                    {
                        "value": "RENOVACION",
                        "label_es": "Renovacion",
                        "description_es": "Mi pasaporte esta vencido o por vencer",
                    },
                    {
                        "value": "PERDIDA",
                        "label_es": "Perdida",
                        "description_es": "Perdi mi pasaporte (requiere denuncia policial)",
                    },
                    {
                        "value": "ROBO",
                        "label_es": "Robo",
                        "description_es": "Me robaron mi pasaporte (requiere denuncia policial)",
                    },
                    {
                        "value": "DETERIORO",
                        "label_es": "Deterioro",
                        "description_es": "Mi pasaporte esta danado",
                    },
                ]
            }
        ))

        # === Step 2: Document Upload ===
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

        # === Step 3: Passport Photo (1 photo, not 2) ===
        self.add_step(WorkflowStep(
            step_number=3,
            step_id="upload_photos",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Fotografia",
            description_es="Cargue 1 fotografia tipo pasaporte",
            documents=[
                DocumentRequirement(
                    document_code="photo_carnet",
                    document_name_es="Fotografia tipo pasaporte",
                    is_required=True,
                    display_order=1,
                    condition_type=DocumentConditionType.ALWAYS,
                    instructions_es="1 fotografia de 35x45mm, fondo blanco, rostro visible",
                    accepted_formats=["jpg", "jpeg", "png"],
                    config={"quantity": 1}
                )
            ],
            config={"quantity": 1}  # Changed from 2 to 1
        ))

        # === Step 4: Form Review ===
        self.add_step(WorkflowStep(
            step_number=4,
            step_id="review_form",
            step_type=StepType.FORM_REVIEW,
            title_es="Verificar Datos",
            description_es="Verifique y corrija los datos extraidos de sus documentos",
            config={
                "sections": [
                    {
                        "id": "personal",
                        "title_es": "Datos Personales",
                        "fields": [
                            "numero_dip", "apellidos", "nombres", "sexo",
                            "fecha_nacimiento", "lugar_nacimiento", "natural_de",
                            "nacionalidad", "estado_civil", "profesion",
                            "grupo_sanguineo"
                        ]
                    },
                    {
                        "id": "domicilio",
                        "title_es": "Domicilio",
                        "fields": ["domicilio", "ciudad", "distrito_provincia"]
                    },
                    {
                        "id": "filiacion",
                        "title_es": "Filiacion",
                        "fields": [
                            "nombre_padre", "profesion_padre",
                            "nombre_madre", "profesion_madre"
                        ]
                    },
                    {
                        "id": "pasaporte_anterior",
                        "title_es": "Pasaporte Anterior",
                        "condition": "sub_type IN ['RENOVACION', 'DETERIORO']",
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
            title_es="Confirmacion",
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

        CORRECT tariffs from v1 (pasaporte_workflow.py):
        - NUEVO: 7,500 XAF
        - RENOVACION: 5,000 XAF
        - PERDIDA: 10,000 XAF (includes penalty)
        - ROBO: 10,000 XAF (includes penalty)
        - DETERIORO: 7,500 XAF
        """
        self.set_tariff_config(TariffConfig(
            tariff_type=TariffType.FIXED,
            fixed_amounts={
                # Sub-type tariffs from v1
                "NUEVO": 7500,       # 7,500 XAF
                "RENOVACION": 5000,  # 5,000 XAF
                "PERDIDA": 10000,    # 10,000 XAF (penalty)
                "ROBO": 10000,       # 10,000 XAF (penalty)
                "DETERIORO": 7500,   # 7,500 XAF
            },
            currency="XAF"
        ))

    # === Document Requirements ===

    def get_document_requirements(
        self,
        sub_type: str,
        context: Optional[WorkflowContext] = None
    ) -> List[DocumentRequirement]:
        """
        Get document requirements based on sub_type.

        This method aligns with v1 pasaporte_workflow.get_document_requirements().

        Common to all types:
        - DIP (always required)
        - Photos (always required, handled in step 3)

        Type-specific:
        - NUEVO: + Certificado de Nacimiento
        - RENOVACION/DETERIORO: + Pasaporte antiguo
        - PERDIDA/ROBO: + Denuncia policial

        Conditional:
        - Minor (<18): + Autorizacion Parental + DIP del padre/madre/tutor
        - Adult with NUEVO: + Profesion padre/madre from cert. nacimiento
        """
        requirements = []

        # Check if user is minor (from context if available)
        is_minor = False
        if context and context.form_data:
            fecha_nacimiento = context.form_data.get("fecha_nacimiento")
            if fecha_nacimiento:
                is_minor = self._is_minor(fecha_nacimiento)

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

        if sub_type == "NUEVO":
            # First passport: need birth certificate
            requirements.append(DocumentRequirement(
                document_code="certificado_nacimiento",
                document_name_es="Certificado de Nacimiento",
                schema_key="CERTIFICACION_NACIMIENTO_GQ_V1",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.IS_NEW,
                instructions_es="Certificacion literal de inscripcion de nacimiento (original o copia certificada)"
            ))

        elif sub_type in ["RENOVACION", "DETERIORO"]:
            # Need old passport
            doc_name = "Pasaporte Danado" if sub_type == "DETERIORO" else "Pasaporte Antiguo"
            instructions = (
                "Presente el pasaporte danado para verificacion"
                if sub_type == "DETERIORO"
                else "Escanee la pagina de datos de su pasaporte vencido o por vencer"
            )
            requirements.append(DocumentRequirement(
                document_code="pasaporte_antiguo",
                document_name_es=doc_name,
                schema_key="PASAPORTE_GQ_V1",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["RENOVACION", "DETERIORO"]},
                instructions_es=instructions
            ))

        elif sub_type in ["PERDIDA", "ROBO"]:
            # Need police report
            reason = "robo" if sub_type == "ROBO" else "perdida"
            requirements.append(DocumentRequirement(
                document_code="denuncia_policial",
                document_name_es="Denuncia Policial",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["PERDIDA", "ROBO"]},
                instructions_es=f"Denuncia de {reason} emitida por la Policia Nacional (maximo 30 dias)"
            ))

        # === Photo (1 required) ===
        requirements.append(DocumentRequirement(
            document_code="photo_carnet",
            document_name_es="Fotografia tipo pasaporte",
            is_required=True,
            display_order=10,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="1 foto de 35x45mm, fondo blanco, rostro visible"
        ))

        # === Minor-specific requirements ===
        if is_minor:
            # Parental authorization
            requirements.append(DocumentRequirement(
                document_code="autorizacion_parental",
                document_name_es="Autorizacion Parental",
                is_required=True,
                display_order=5,
                condition_type=DocumentConditionType.IS_MINOR,
                instructions_es="Autorizacion firmada por ambos padres o tutor legal"
            ))

            # DIP of parent/tutor
            requirements.append(DocumentRequirement(
                document_code="dip_padre_tutor",
                document_name_es="DIP del Padre, Madre o Tutor Legal",
                schema_key="DIP_GQ_V2",
                is_required=True,
                display_order=6,
                condition_type=DocumentConditionType.IS_MINOR,
                instructions_es="Escanee ambas caras del DIP del padre, madre o tutor legal",
                faces_required=["recto", "verso"]
            ))

        return requirements

    def _is_minor(self, fecha_nacimiento: str) -> bool:
        """Check if person is minor based on birth date."""
        from datetime import datetime, date
        try:
            if isinstance(fecha_nacimiento, str):
                # Parse date string (expecting YYYY-MM-DD or DD/MM/YYYY)
                if "-" in fecha_nacimiento:
                    birth_date = datetime.strptime(fecha_nacimiento, "%Y-%m-%d").date()
                else:
                    birth_date = datetime.strptime(fecha_nacimiento, "%d/%m/%Y").date()
            else:
                birth_date = fecha_nacimiento

            today = date.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            return age < 18
        except Exception:
            return False

    # === Cross-Document Validation Rules ===

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """
        Get cross-document validation rules.

        Based on v1 pasaporte_workflow.get_cross_validation_rules().
        """
        return [
            # DIP not expired
            {
                "id": "dip_not_expired",
                "document": "dip",
                "rule": "documento.fecha_expiracion > TODAY",
                "error_es": "El DIP esta expirado. Debe renovarlo antes de solicitar el pasaporte.",
                "severity": "error"
            },

            # DIP number format (9 digits)
            {
                "id": "dip_numero_format",
                "document": "dip",
                "rule": "documento.numero_dip MATCHES '^[0-9]{9}$'",
                "error_es": "El numero de DIP debe tener 9 digitos.",
                "severity": "error"
            },

            # Passport expiring for RENOVACION
            {
                "id": "pasaporte_expiring",
                "document": "pasaporte_antiguo",
                "condition": "sub_type == 'RENOVACION'",
                "rule": "documento.fecha_expiracion < TODAY + 12 MONTHS",
                "error_es": "Solo puede renovar si el pasaporte expira en menos de 12 meses.",
                "severity": "warning"
            },

            # Names coherent between DIP and old passport
            {
                "id": "nombres_coherentes_dip_pasaporte",
                "condition": "sub_type IN ['RENOVACION', 'DETERIORO']",
                "rule": "normalize(DIP.titular.apellidos) == normalize(PASAPORTE.titular.apellidos)",
                "error_es": "El nombre en el DIP no coincide con el pasaporte antiguo.",
                "severity": "error"
            },

            # Birthdate coherent for NUEVO
            {
                "id": "fecha_nacimiento_coherente",
                "condition": "sub_type == 'NUEVO'",
                "rule": "DIP.titular.fecha_nacimiento == CERTIFICADO_NACIMIENTO.inscrito.fecha_nacimiento",
                "error_es": "La fecha de nacimiento del DIP no coincide con el certificado.",
                "severity": "warning"
            },

            # Police report not too old
            {
                "id": "denuncia_reciente",
                "document": "denuncia_policial",
                "condition": "sub_type IN ['PERDIDA', 'ROBO']",
                "rule": "documento.fecha_emision > TODAY - 30 DAYS",
                "error_es": "La denuncia policial debe tener menos de 30 dias de emitida.",
                "severity": "error"
            },
        ]

    # === Form Field Mapping ===

    def get_form_mapping(self, is_minor: bool = False) -> Dict[str, str]:
        """
        Map extracted data fields to form fields.

        Includes ALL fields from DIP schema (dip_gq.json):
        - natural_de, distrito_provincia, grupo_sanguineo (were missing)

        For minors: Extract ALL data from certificado_nacimiento without exception.
        For adults: Add padre.profesion and madre.profesion from certificado_nacimiento.
        """
        mapping = {
            # === DIP Fields (complete extraction per dip_gq.json) ===
            "numero_dip": "dip.documento.numero_dip",
            "apellidos": "dip.titular.apellidos",
            "nombres": "dip.titular.nombres",
            "sexo": "dip.titular.sexo",
            "fecha_nacimiento": "dip.titular.fecha_nacimiento",
            "lugar_nacimiento": "dip.titular.lugar_nacimiento",
            "natural_de": "dip.titular.natural_de",  # ADDED - was missing
            "distrito_provincia": "dip.titular.distrito_provincia",  # ADDED - was missing
            "nacionalidad": "dip.titular.nacionalidad",
            "estado_civil": "dip.titular.estado_civil",
            "profesion": "dip.titular.profesion",
            "domicilio": "dip.titular.domiciliacion",
            "grupo_sanguineo": "dip.titular.grupo_sanguineo",  # ADDED - was missing

            # === DIP document metadata ===
            "dip_fecha_expedicion": "dip.documento.fecha_expedicion",
            "dip_fecha_expiracion": "dip.documento.fecha_expiracion",

            # === Old passport fields (for RENOVACION/DETERIORO) ===
            "numero_pasaporte_antiguo": "pasaporte_antiguo.documento.numero_pasaporte",
            "fecha_expedicion_antiguo": "pasaporte_antiguo.documento.fecha_expedicion",
            "fecha_expiracion_antiguo": "pasaporte_antiguo.documento.fecha_expiracion",
        }

        if is_minor:
            # === For MINORS: Extract ALL data from certificado_nacimiento ===
            mapping.update({
                # Inscrito data (the minor)
                "registro_civil": "certificado_nacimiento.documento.registro_civil_de",
                "tomo_nacimiento": "certificado_nacimiento.documento.tomo",
                "pagina_nacimiento": "certificado_nacimiento.documento.pagina",
                "acta_nacimiento": "certificado_nacimiento.documento.numero_acta",

                # Inscrito personal data (repeat from cert for verification)
                "cert_apellidos": "certificado_nacimiento.inscrito.apellidos",
                "cert_nombres": "certificado_nacimiento.inscrito.nombres",
                "cert_sexo": "certificado_nacimiento.inscrito.sexo",
                "cert_fecha_nacimiento": "certificado_nacimiento.inscrito.fecha_nacimiento",
                "cert_hora_nacimiento": "certificado_nacimiento.inscrito.hora_nacimiento",
                "cert_lugar_nacimiento": "certificado_nacimiento.inscrito.lugar_nacimiento",

                # Father data (complete)
                "nombre_padre": "certificado_nacimiento.padre.nombre_completo",
                "nacionalidad_padre": "certificado_nacimiento.padre.nacionalidad",
                "natural_de_padre": "certificado_nacimiento.padre.natural_de",
                "profesion_padre": "certificado_nacimiento.padre.profesion",
                "domicilio_padre": "certificado_nacimiento.padre.domicilio",
                "edad_padre": "certificado_nacimiento.padre.edad",

                # Mother data (complete)
                "nombre_madre": "certificado_nacimiento.madre.nombre_completo",
                "nacionalidad_madre": "certificado_nacimiento.madre.nacionalidad",
                "natural_de_madre": "certificado_nacimiento.madre.natural_de",
                "profesion_madre": "certificado_nacimiento.madre.profesion",
                "domicilio_madre": "certificado_nacimiento.madre.domicilio",
                "edad_madre": "certificado_nacimiento.madre.edad",

                # Grandparents (paternal)
                "abuelo_paterno": "certificado_nacimiento.abuelo_paterno.nombre_completo",
                "abuela_paterna": "certificado_nacimiento.abuela_paterna.nombre_completo",

                # Grandparents (maternal)
                "abuelo_materno": "certificado_nacimiento.abuelo_materno.nombre_completo",
                "abuela_materna": "certificado_nacimiento.abuela_materna.nombre_completo",

                # Declarant info
                "declarante_nombre": "certificado_nacimiento.declarante.nombre_completo",
                "declarante_relacion": "certificado_nacimiento.declarante.relacion",
            })
        else:
            # === For ADULTS: Add parent professions from certificado (if NUEVO) ===
            mapping.update({
                "registro_civil": "certificado_nacimiento.documento.registro_civil_de",
                "nombre_padre": "certificado_nacimiento.padre.nombre_completo",
                "profesion_padre": "certificado_nacimiento.padre.profesion",  # ADDED
                "nombre_madre": "certificado_nacimiento.madre.nombre_completo",
                "profesion_madre": "certificado_nacimiento.madre.profesion",  # ADDED
            })

        return mapping

    # === Workflow Code Resolution ===

    def get_workflow_code_for_subtype(self, sub_type: str) -> WorkflowCode:
        """
        Get the specific WorkflowCode for a sub_type.

        Aligned with v1 pasaporte_workflow.get_workflow_code_for_subtype().
        """
        mapping = {
            "NUEVO": WorkflowCode.PASAPORTE_NUEVO,
            "RENOVACION": WorkflowCode.PASAPORTE_RENOVACION,
            "PERDIDA": WorkflowCode.PASAPORTE_PERDIDA,
            "ROBO": WorkflowCode.PASAPORTE_ROBO,
            "DETERIORO": WorkflowCode.PASAPORTE_DETERIORO
        }
        return mapping.get(sub_type, WorkflowCode.PASAPORTE_NUEVO)


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
