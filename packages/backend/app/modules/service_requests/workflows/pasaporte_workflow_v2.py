"""
PasaporteWorkflow v2 - Autonomous passport request workflow.

This is a PREDEFINED workflow with complete business logic.
ALIGNED WITH workflow_interface.py using SolicitudType + RenovacionMotivo.

Types (aligned with workflow_interface.py):

SolicitudType.EXPEDICION (First passport):
    - Never had a passport before
    - Requires: DIP + Certificado de Nacimiento + Foto
    - Tariff: 7,500 XAF

SolicitudType.RENOVACION with RenovacionMotivo:
    - VENCIMIENTO: Passport expired/expiring
      Requires: DIP + Pasaporte antiguo + Foto
      Tariff: 5,000 XAF

    - PERDIDA: Lost passport
      Requires: DIP + Denuncia policial + Foto
      Tariff: 10,000 XAF (includes penalty)

    - ROBO: Stolen passport
      Requires: DIP + Denuncia policial + Foto
      Tariff: 10,000 XAF (includes penalty)

    - DETERIORO: Damaged passport
      Requires: DIP + Pasaporte danado + Foto
      Tariff: 7,500 XAF

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
    SupplementDefinition,
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

# Import PaymentMethod from payments module
from ...payments.models.payment import PaymentMethod


class PasaporteWorkflow(PredefinedWorkflow):
    """
    Passport request workflow.

    AUTONOMOUS: Defines ALL logic internally, no BaseWorkflow inheritance.

    ALIGNED WITH workflow_interface.py:
    - SolicitudType.EXPEDICION: First passport ever
    - SolicitudType.RENOVACION with RenovacionMotivo:
      - VENCIMIENTO: Passport expired/expiring
      - PERDIDA: Lost passport
      - ROBO: Stolen passport
      - DETERIORO: Damaged passport
    """

    # Allowed motivos for RENOVACION
    ALLOWED_MOTIVOS = [
        RenovacionMotivo.VENCIMIENTO,
        RenovacionMotivo.PERDIDA,
        RenovacionMotivo.ROBO,
        RenovacionMotivo.DETERIORO,
    ]

    # Legacy sub_type mapping for backwards compatibility
    SUBTYPE_TO_SOLICITUD_MOTIVO = {
        "NUEVO": (SolicitudType.EXPEDICION, None),
        "RENOVACION": (SolicitudType.RENOVACION, RenovacionMotivo.VENCIMIENTO),
        "PERDIDA": (SolicitudType.RENOVACION, RenovacionMotivo.PERDIDA),
        "ROBO": (SolicitudType.RENOVACION, RenovacionMotivo.ROBO),
        "DETERIORO": (SolicitudType.RENOVACION, RenovacionMotivo.DETERIORO),
    }

    # Reverse mapping
    SOLICITUD_MOTIVO_TO_SUBTYPE = {
        (SolicitudType.EXPEDICION, None): "NUEVO",
        (SolicitudType.RENOVACION, RenovacionMotivo.VENCIMIENTO): "RENOVACION",
        (SolicitudType.RENOVACION, RenovacionMotivo.PERDIDA): "PERDIDA",
        (SolicitudType.RENOVACION, RenovacionMotivo.ROBO): "ROBO",
        (SolicitudType.RENOVACION, RenovacionMotivo.DETERIORO): "DETERIORO",
    }

    # For backwards compatibility with existing code
    @property
    def allowed_sub_types(self) -> List[str]:
        """Legacy: list of sub_type strings."""
        return list(self.SUBTYPE_TO_SOLICITUD_MOTIVO.keys())

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

        ALIGNED WITH PLAN (passport-workflow-frontend-migration.md):

        Steps:
        0. is_minor - Selection mineur/adulte (demandé en premier)
        1. select_type - EXPEDICION ou RENOVACION
        1b. select_motivo - Si RENOVACION: choix motivo (dynamique, même step_number)
        2. upload_documents - Tous documents (photo incluse) sur une seule page
        3. form_review_1 - Datos Personales + Domicilio (max 2 sections)
        4. form_review_2 - Filiacion + Pasaporte Anterior (max 2 sections)
        5. validation - Resultats validation croisée
        6. payment - Mobile Money (AVANT RDV)
        7. appointment - Selection RDV (APRES paiement, hold 15min)
        8. confirmation - Resume final
        """

        # === Step 0: Minor Selection (FIRST) ===
        self.add_step(WorkflowStep(
            step_number=0,
            step_id="is_minor",
            step_type=StepType.SELECTION,
            title_es="Tipo de Solicitante",
            description_es="Indique si la solicitud es para un adulto o un menor de edad",
            requires_previous=False,
            config={
                "selection_type": "is_minor",
                "options": [
                    {
                        "value": False,
                        "label_es": "Mayor de Edad",
                        "description_es": "Persona de 18 anos o mas",
                        "icon": "user"
                    },
                    {
                        "value": True,
                        "label_es": "Menor de Edad",
                        "description_es": "Persona menor de 18 anos (requiere autorizacion parental)",
                        "icon": "user-child"
                    }
                ]
            }
        ))

        # === Step 1: Type Selection (EXPEDICION/RENOVACION) ===
        self.add_step(WorkflowStep(
            step_number=1,
            step_id="select_type",
            step_type=StepType.SELECTION,
            title_es="Tipo de Solicitud",
            description_es="Seleccione el tipo de tramite de pasaporte",
            config={
                "selection_type": "solicitud_type",
                "options": [
                    {
                        "value": SolicitudType.EXPEDICION.value,
                        "label_es": "Primera Expedicion",
                        "description_es": "Solicito mi primer pasaporte",
                        "tariff": 7500,
                        "icon": "passport-new"
                    },
                    {
                        "value": SolicitudType.RENOVACION.value,
                        "label_es": "Renovacion",
                        "description_es": "Ya tengo un pasaporte (vencido, perdido, robado o danado)",
                        "has_sub_options": True,  # Indicates motivo selection follows
                        "icon": "passport-renew"
                    }
                ]
            }
        ))

        # === Step 1b: Motivo Selection (only for RENOVACION) ===
        # Note: Same logical step as 1, but separate UI page
        self.add_step(WorkflowStep(
            step_number=1,  # Same step number, handled by frontend as sub-step
            step_id="select_motivo",
            step_type=StepType.SELECTION,
            title_es="Motivo de Renovacion",
            description_es="Seleccione el motivo de la renovacion",
            config={
                "selection_type": "motivo",
                "condition": {"solicitud_type": SolicitudType.RENOVACION.value},
                "options": [
                    {
                        "value": RenovacionMotivo.VENCIMIENTO.value,
                        "label_es": "Vencimiento",
                        "description_es": "Mi pasaporte esta vencido o por vencer",
                        "tariff": 5000,
                        "icon": "calendar-expired"
                    },
                    {
                        "value": RenovacionMotivo.PERDIDA.value,
                        "label_es": "Perdida",
                        "description_es": "Perdi mi pasaporte (requiere denuncia policial)",
                        "tariff": 10000,
                        "icon": "document-lost"
                    },
                    {
                        "value": RenovacionMotivo.ROBO.value,
                        "label_es": "Robo",
                        "description_es": "Me robaron mi pasaporte (requiere denuncia policial)",
                        "tariff": 10000,
                        "icon": "shield-alert"
                    },
                    {
                        "value": RenovacionMotivo.DETERIORO.value,
                        "label_es": "Deterioro",
                        "description_es": "Mi pasaporte esta danado",
                        "tariff": 7500,
                        "icon": "document-damaged"
                    }
                ]
            }
        ))

        # === Step 2: Document Upload (ALL documents on ONE page) ===
        self.add_step(WorkflowStep(
            step_number=2,
            step_id="upload_documents",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Documentos Requeridos",
            description_es="Cargue todos los documentos necesarios para su solicitud",
            config={
                "dynamic_documents": True,  # Frontend calls get_document_requirements
                "single_page": True,  # All documents on one page
                "includes_photo": True  # Photo is part of this step
            }
        ))

        # === Step 3: Form Review 1 - Datos Personales + Domicilio ===
        self.add_step(WorkflowStep(
            step_number=3,
            step_id="form_review_1",
            step_type=StepType.FORM_REVIEW,
            title_es="Verificar Datos (1/2)",
            description_es="Verifique sus datos personales y domicilio",
            config={
                "form_page": 1,
                "max_sections": 2,
                "sections": [
                    {
                        "id": "personal",
                        "title_es": "Datos Personales",
                        "fields": [
                            {"key": "numero_dip", "label_es": "Numero DIP", "required": True},
                            {"key": "apellidos", "label_es": "Apellidos", "required": True},
                            {"key": "nombres", "label_es": "Nombres", "required": True},
                            {"key": "sexo", "label_es": "Sexo", "required": True, "type": "select", "options": ["M", "F"]},
                            {"key": "fecha_nacimiento", "label_es": "Fecha de Nacimiento", "required": True, "type": "date"},
                            {"key": "lugar_nacimiento", "label_es": "Lugar de Nacimiento", "required": True},
                            {"key": "natural_de", "label_es": "Natural de", "required": False},
                            {"key": "nacionalidad", "label_es": "Nacionalidad", "required": True},
                            {"key": "estado_civil", "label_es": "Estado Civil", "required": True},
                            {"key": "profesion", "label_es": "Profesion", "required": True},
                            {"key": "grupo_sanguineo", "label_es": "Grupo Sanguineo", "required": False}
                        ]
                    },
                    {
                        "id": "domicilio",
                        "title_es": "Domicilio",
                        "fields": [
                            {"key": "domicilio", "label_es": "Direccion", "required": True},
                            {"key": "ciudad", "label_es": "Ciudad", "required": True},
                            {"key": "distrito_provincia", "label_es": "Distrito/Provincia", "required": True}
                        ]
                    }
                ]
            }
        ))

        # === Step 4: Form Review 2 - Filiacion + Pasaporte Anterior ===
        self.add_step(WorkflowStep(
            step_number=4,
            step_id="form_review_2",
            step_type=StepType.FORM_REVIEW,
            title_es="Verificar Datos (2/2)",
            description_es="Verifique los datos de filiacion y pasaporte anterior",
            config={
                "form_page": 2,
                "max_sections": 2,
                "sections": [
                    {
                        "id": "filiacion",
                        "title_es": "Filiacion",
                        "fields": [
                            {"key": "nombre_padre", "label_es": "Nombre del Padre", "required": True},
                            {"key": "profesion_padre", "label_es": "Profesion del Padre", "required": False},
                            {"key": "nombre_madre", "label_es": "Nombre de la Madre", "required": True},
                            {"key": "profesion_madre", "label_es": "Profesion de la Madre", "required": False}
                        ]
                    },
                    {
                        "id": "pasaporte_anterior",
                        "title_es": "Pasaporte Anterior",
                        "condition": {
                            "solicitud_type": SolicitudType.RENOVACION.value,
                            "motivo_in": [RenovacionMotivo.VENCIMIENTO.value, RenovacionMotivo.DETERIORO.value]
                        },
                        "fields": [
                            {"key": "numero_pasaporte_antiguo", "label_es": "Numero Pasaporte Antiguo", "required": True},
                            {"key": "fecha_expedicion_antiguo", "label_es": "Fecha de Expedicion", "required": True, "type": "date"},
                            {"key": "fecha_expiracion_antiguo", "label_es": "Fecha de Expiracion", "required": True, "type": "date"}
                        ]
                    }
                ]
            }
        ))

        # === Step 5: Payment (BEFORE Appointment) ===
        # NOTE: Cross-document validation is now done during extraction (Step 3)
        # by Gemini processor with identity mismatch blocking. No separate validation step needed.
        # Payment methods loaded dynamically via GET /payment/methods endpoint
        self.add_step(WorkflowStep(
            step_number=5,
            step_id="payment",
            step_type=StepType.PAYMENT,
            title_es="Pago de Tasas",
            description_es="Realice el pago mediante Mobile Money o en efectivo",
            config={
                "currency": "XAF",
                "show_breakdown": True,
                "dynamic_tariff": True  # Tariff based on solicitud_type/motivo
            }
        ))

        # === Step 6: Appointment (AFTER Payment, with 15min hold) ===
        self.add_step(WorkflowStep(
            step_number=6,
            step_id="appointment",
            step_type=StepType.APPOINTMENT,
            title_es="Programar Cita",
            description_es="Seleccione una cita en la oficina CNEDOGE",
            config={
                "entity_code": EntityCode.CNEDOGE.value,
                "entity_via_request": True,  # Get entity_code from service_request
                "hold_duration_minutes": 15,
                "show_payment_confirmation": True,  # Show "Pago confirmado" banner
                "use_appointment_module": True  # Use appointments module
            }
        ))

        # === Step 7: Confirmation ===
        self.add_step(WorkflowStep(
            step_number=7,
            step_id="confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmacion",
            description_es="Su solicitud ha sido completada",
            config={
                "show_summary": True,
                "show_appointment": True,
                "show_payment": True,
                "allow_download_receipt": True,
                "next_steps_es": [
                    "Presentese en la oficina CNEDOGE en la fecha y hora indicadas",
                    "Lleve los documentos originales para verificacion",
                    "El tiempo estimado de entrega es de 5 dias habiles"
                ]
            }
        ))

        # === Setup Tariffs ===
        self._setup_tariffs()

    def _setup_tariffs(self) -> None:
        """
        Setup tariff configuration.

        Base Tariffs (ALIGNED WITH SolicitudType + RenovacionMotivo):
        - SolicitudType.EXPEDICION: 7,500 XAF
        - RenovacionMotivo.VENCIMIENTO: 5,000 XAF
        - RenovacionMotivo.PERDIDA: 10,000 XAF (includes penalty)
        - RenovacionMotivo.ROBO: 10,000 XAF (includes penalty)
        - RenovacionMotivo.DETERIORO: 7,500 XAF

        Supplements: None for pasaporte (quantity=0)
        """
        self.set_tariff_config(TariffConfig(
            tariff_type=TariffType.FIXED,
            fixed_amounts={
                # SolicitudType enum values
                SolicitudType.EXPEDICION.value: 7500,      # 7,500 XAF
                # RenovacionMotivo enum values
                RenovacionMotivo.VENCIMIENTO.value: 5000,  # 5,000 XAF
                RenovacionMotivo.PERDIDA.value: 10000,     # 10,000 XAF (penalty)
                RenovacionMotivo.ROBO.value: 10000,        # 10,000 XAF (penalty)
                RenovacionMotivo.DETERIORO.value: 7500,    # 7,500 XAF
            },
            currency="XAF",
            # No supplements for pasaporte (quantity=0 in DB config)
            supplements=[]
        ))

    # === Document Requirements ===

    def get_document_requirements(
        self,
        solicitud_type: SolicitudType,
        motivo: Optional[RenovacionMotivo] = None,
        context: Optional[WorkflowContext] = None
    ) -> List[DocumentRequirement]:
        """
        Get document requirements based on SolicitudType and RenovacionMotivo.

        ALIGNED WITH workflow_interface.py signature.

        Common to all types:
        - DIP (always required)
        - Photos (always required)

        Type-specific:
        - EXPEDICION: + Certificado de Nacimiento
        - RENOVACION/VENCIMIENTO: + Pasaporte antiguo
        - RENOVACION/DETERIORO: + Pasaporte danado
        - RENOVACION/PERDIDA: + Denuncia policial
        - RENOVACION/ROBO: + Denuncia policial

        Conditional (for minors):
        - Minor (<18): + Autorizacion Parental + DIP del padre/madre/tutor
        """
        requirements = []

        # Check if user is minor (from context if available)
        is_minor = False
        if context and context.form_data:
            fecha_nacimiento = context.form_data.get("fecha_nacimiento")
            if fecha_nacimiento:
                is_minor = self._is_minor(fecha_nacimiento)
            # Also check explicit is_minor flag in form_data
            if context.form_data.get("is_minor") is True:
                is_minor = True

        # === DIP - Always required (single file with recto+verso) ===
        requirements.append(DocumentRequirement(
            document_code="dip",
            document_name_es="Documento de Identidad Personal (DIP)",
            schema_key="DIP_GQ_V2",
            is_required=True,
            display_order=1,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Escanee ambas caras de su DIP vigente (recto y verso en un solo archivo)",
            faces_required=["recto", "verso"],
            config={"single_file": True}  # Both sides in one file
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
                instructions_es="Certificacion literal de inscripcion de nacimiento (original o copia certificada)"
            ))

        elif solicitud_type == SolicitudType.RENOVACION and motivo:
            if motivo in [RenovacionMotivo.VENCIMIENTO, RenovacionMotivo.DETERIORO]:
                # Need old passport
                doc_name = "Pasaporte Danado" if motivo == RenovacionMotivo.DETERIORO else "Pasaporte Antiguo"
                instructions = (
                    "Presente el pasaporte danado para verificacion"
                    if motivo == RenovacionMotivo.DETERIORO
                    else "Escanee la pagina de datos de su pasaporte vencido o por vencer"
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
                # Need police report
                reason = "robo" if motivo == RenovacionMotivo.ROBO else "perdida"
                requirements.append(DocumentRequirement(
                    document_code="denuncia_policial",
                    document_name_es="Denuncia Policial",
                    is_required=True,
                    display_order=2,
                    condition_type=DocumentConditionType.CUSTOM,
                    condition_value={"motivos": ["PERDIDA", "ROBO"]},
                    instructions_es=f"Denuncia de {reason} emitida por la Policia Nacional (maximo 30 dias)"
                ))

        # === Photo (1 required) ===
        requirements.append(DocumentRequirement(
            document_code="photo_carnet",
            document_name_es="Fotografia tipo pasaporte",
            is_required=True,
            display_order=10,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="1 foto de 35x45mm, fondo blanco, rostro visible",
            accepted_formats=["jpg", "jpeg", "png"],  # Only image formats for photos
            config={
                "quantity": 1,
                "max_size_mb": 2,  # Photos should be small
                "min_dimensions": {"width": 350, "height": 450}  # 35x45mm at ~254dpi
            }
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

            # DIP of parent/tutor (single file with recto+verso)
            requirements.append(DocumentRequirement(
                document_code="dip_padre_tutor",
                document_name_es="DIP del Padre, Madre o Tutor Legal",
                schema_key="DIP_GQ_V2",
                is_required=True,
                display_order=6,
                condition_type=DocumentConditionType.IS_MINOR,
                instructions_es="Escanee ambas caras del DIP del padre, madre o tutor legal (recto y verso en un solo archivo)",
                faces_required=["recto", "verso"],
                config={"single_file": True}
            ))

        return requirements

    def get_document_requirements_legacy(
        self,
        sub_type: str,
        context: Optional[WorkflowContext] = None
    ) -> List[DocumentRequirement]:
        """
        Legacy method for backwards compatibility.
        Converts sub_type string to SolicitudType + RenovacionMotivo.
        """
        solicitud_motivo = self.SUBTYPE_TO_SOLICITUD_MOTIVO.get(sub_type)
        if solicitud_motivo:
            solicitud_type, motivo = solicitud_motivo
            return self.get_document_requirements(solicitud_type, motivo, context)
        # Default to EXPEDICION if unknown sub_type
        return self.get_document_requirements(SolicitudType.EXPEDICION, None, context)

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

        ALIGNED WITH SolicitudType + RenovacionMotivo.
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

            # Passport expiring for RENOVACION/VENCIMIENTO
            {
                "id": "pasaporte_expiring",
                "document": "pasaporte_antiguo",
                "condition": f"motivo == '{RenovacionMotivo.VENCIMIENTO.value}'",
                "rule": "documento.fecha_expiracion < TODAY + 12 MONTHS",
                "error_es": "Solo puede renovar si el pasaporte expira en menos de 12 meses.",
                "severity": "warning"
            },

            # Names coherent between DIP and old passport (for VENCIMIENTO and DETERIORO)
            {
                "id": "nombres_coherentes_dip_pasaporte",
                "condition": f"motivo IN ['{RenovacionMotivo.VENCIMIENTO.value}', '{RenovacionMotivo.DETERIORO.value}']",
                "rule": "normalize(DIP.titular.apellidos) == normalize(PASAPORTE.titular.apellidos)",
                "error_es": "El nombre en el DIP no coincide con el pasaporte antiguo.",
                "severity": "error"
            },

            # Birthdate coherent between DIP and old passport (for VENCIMIENTO and DETERIORO)
            {
                "id": "fecha_nacimiento_dip_pasaporte",
                "condition": f"motivo IN ['{RenovacionMotivo.VENCIMIENTO.value}', '{RenovacionMotivo.DETERIORO.value}']",
                "rule": "DIP.titular.fecha_nacimiento == PASAPORTE.titular.fecha_nacimiento",
                "error_es": "La fecha de nacimiento del DIP no coincide con el pasaporte antiguo.",
                "severity": "error"
            },

            # Birthdate coherent for EXPEDICION
            {
                "id": "fecha_nacimiento_coherente",
                "condition": f"solicitud_type == '{SolicitudType.EXPEDICION.value}'",
                "rule": "DIP.titular.fecha_nacimiento == CERTIFICADO_NACIMIENTO.inscrito.fecha_nacimiento",
                "error_es": "La fecha de nacimiento del DIP no coincide con el certificado.",
                "severity": "warning"
            },

            # Police report not too old (for PERDIDA and ROBO)
            {
                "id": "denuncia_reciente",
                "document": "denuncia_policial",
                "condition": f"motivo IN ['{RenovacionMotivo.PERDIDA.value}', '{RenovacionMotivo.ROBO.value}']",
                "rule": "documento.fecha_emision > TODAY - 30 DAYS",
                "error_es": "La denuncia policial debe tener menos de 30 dias de emitida.",
                "severity": "error"
            },
        ]

    # === Form Field Mapping ===

    def get_form_mapping(self, context: Optional[WorkflowContext] = None) -> Dict[str, str]:
        """
        Map extracted data fields to form fields.

        ALIGNED WITH JSON SCHEMAS (source of truth):
        - dip_gq.json: documento.fecha_emision (NOT fecha_expedicion)
        - certificacion_nacimiento_gq.json:
          - inscrito.nombre (NOT nombres), inscrito.primer_apellido + segundo_apellido
          - padre.hijo_de, madre.hija_de (NOT natural_de)
          - declarante.calidad (NOT relacion), declarante.nombre (NOT nombre_completo)
          - NO hora_nacimiento, NO numero_acta, NO edad, NO domicilio_padre

        For minors: Extract ALL available data from certificado_nacimiento.
        For adults: Add padre.profesion and madre.profesion from certificado_nacimiento.
        """
        # Determine if user is minor from context
        is_minor = False
        if context and context.form_data:
            fecha_nacimiento = context.form_data.get("fecha_nacimiento")
            if fecha_nacimiento:
                is_minor = self._is_minor(fecha_nacimiento)

        mapping = {
            # === DIP Fields (per dip_gq.json schema) ===
            "numero_dip": "dip.documento.numero_dip",
            "apellidos": "dip.titular.apellidos",
            "nombres": "dip.titular.nombres",
            "sexo": "dip.titular.sexo",
            "fecha_nacimiento": "dip.titular.fecha_nacimiento",
            "lugar_nacimiento": "dip.titular.lugar_nacimiento",
            "natural_de": "dip.titular.natural_de",
            "distrito_provincia": "dip.titular.distrito_provincia",
            "nacionalidad": "dip.titular.nacionalidad",
            "estado_civil": "dip.titular.estado_civil",
            "profesion": "dip.titular.profesion",
            "domicilio": "dip.titular.domiciliacion",
            "grupo_sanguineo": "dip.titular.grupo_sanguineo",

            # === DIP document metadata (fecha_EMISION per schema) ===
            "dip_fecha_emision": "dip.documento.fecha_emision",
            "dip_fecha_expiracion": "dip.documento.fecha_expiracion",
            "dip_lugar_emision": "dip.documento.lugar_emision",

            # === Old passport fields (for RENOVACION/DETERIORO) ===
            "numero_pasaporte_antiguo": "pasaporte_antiguo.documento.numero_pasaporte",
            "fecha_expedicion_antiguo": "pasaporte_antiguo.documento.fecha_expedicion",
            "fecha_expiracion_antiguo": "pasaporte_antiguo.documento.fecha_expiracion",
        }

        if is_minor:
            # === For MINORS: Extract ALL data from certificado_nacimiento ===
            # ALIGNED with certificacion_nacimiento_gq.json schema
            mapping.update({
                # Document metadata
                "registro_civil": "certificado_nacimiento.documento.registro_civil_de",
                "provincia_registro": "certificado_nacimiento.documento.provincia",
                "seccion_registro": "certificado_nacimiento.documento.seccion",
                "tomo_nacimiento": "certificado_nacimiento.documento.tomo",
                "pagina_nacimiento": "certificado_nacimiento.documento.pagina",
                "folio_nacimiento": "certificado_nacimiento.documento.folio",

                # Inscrito data - CORRECT field names per schema
                "cert_nombre": "certificado_nacimiento.inscrito.nombre",
                "cert_primer_apellido": "certificado_nacimiento.inscrito.primer_apellido",
                "cert_segundo_apellido": "certificado_nacimiento.inscrito.segundo_apellido",
                "cert_sexo": "certificado_nacimiento.inscrito.sexo",
                "cert_fecha_nacimiento": "certificado_nacimiento.inscrito.fecha_nacimiento",
                "cert_lugar_nacimiento": "certificado_nacimiento.inscrito.lugar_nacimiento",

                # Father data - CORRECT field names per schema
                "nombre_padre": "certificado_nacimiento.padre.nombre_completo",
                "nacionalidad_padre": "certificado_nacimiento.padre.nacionalidad",
                "lugar_nacimiento_padre": "certificado_nacimiento.padre.lugar_nacimiento",
                "estado_civil_padre": "certificado_nacimiento.padre.estado_civil",
                "profesion_padre": "certificado_nacimiento.padre.profesion",
                # Grandparents (paternal) - in padre.hijo_de and padre.y_de
                "abuelo_paterno": "certificado_nacimiento.padre.hijo_de",
                "abuela_paterna": "certificado_nacimiento.padre.y_de",

                # Mother data - CORRECT field names per schema
                "nombre_madre": "certificado_nacimiento.madre.nombre_completo",
                "nacionalidad_madre": "certificado_nacimiento.madre.nacionalidad",
                "lugar_nacimiento_madre": "certificado_nacimiento.madre.lugar_nacimiento",
                "estado_civil_madre": "certificado_nacimiento.madre.estado_civil",
                "profesion_madre": "certificado_nacimiento.madre.profesion",
                "domicilio_madre": "certificado_nacimiento.madre.domicilio",
                # Grandparents (maternal) - in madre.hija_de and madre.y_de
                "abuelo_materno": "certificado_nacimiento.madre.hija_de",
                "abuela_materna": "certificado_nacimiento.madre.y_de",

                # Marriage info
                "matrimonio_padres": "certificado_nacimiento.matrimonio_padres.informacion",

                # Declarant info - CORRECT field names per schema
                "declarante_nombre": "certificado_nacimiento.declarante.nombre",
                "declarante_calidad": "certificado_nacimiento.declarante.calidad",
                "declarante_domicilio": "certificado_nacimiento.declarante.domicilio",
            })
        else:
            # === For ADULTS: Add parent info from certificado (if NUEVO) ===
            mapping.update({
                "registro_civil": "certificado_nacimiento.documento.registro_civil_de",
                "nombre_padre": "certificado_nacimiento.padre.nombre_completo",
                "profesion_padre": "certificado_nacimiento.padre.profesion",
                "nombre_madre": "certificado_nacimiento.madre.nombre_completo",
                "profesion_madre": "certificado_nacimiento.madre.profesion",
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
