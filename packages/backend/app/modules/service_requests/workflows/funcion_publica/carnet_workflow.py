"""
CarnetFuncionarioWorkflow v2 - Civil servant ID card workflow.

Migrated to PredefinedWorkflow architecture (Option C - Dynamic Form Review).

The Carnet de Funcionario is the official document that identifies a civil servant
and proves their registration in the Ministry of Public Function registry.

Legal basis: Article 47, paragraph c) of Ley de Funcionarios Civiles del Estado
(Ley Num. 2/2014)

Types:
- EXPEDICION: First issuance (requires Nombramiento + Oficio + Toma Posesión)
- RENOVACION: Renewal (requires expired Carnet)
- DUPLICADO: Duplicate (requires loss certificate)

Entity: MINFP (Ministerio de la Función Pública y Reforma Administrativa)
Biometric capture: CNEDOGE

Prerequisite: User must have role 'funcionario' (verified via VerificacionFuncionario).

Payment flow: Standard (citizen pays → agent reviews).
Appointment required: Yes (biometric capture).
No Nota de Ingreso.

Fixed tariff: 3,500 XAF for all types.

OCR schemas available:
- dip_gq.json (DIP_GQ_V2) - Identity document
- carnet_funcionario_gq.json (CARNET_FUNCIONARIO_GQ_V1) - Existing carnet (renovacion)
- nombramiento: best_effort_extraction (no schema)
- oficio_destino: best_effort_extraction (no schema)
- toma_posesion: best_effort_extraction (no schema)
- certificado_perdida: best_effort_extraction (no schema)

@version 2.0
@date 2026-02-07
@migration Option C - Dynamic Form Review Architecture
"""
from typing import List, Dict, Any, Optional

from ..workflow_interface import (
    PredefinedWorkflow,
    WorkflowStep,
    WorkflowContext,
    DocumentRequirement,
    TariffConfig,
    StepType,
    RenovacionMotivo,
)
from ...models.enums import (
    WorkflowCode,
    WorkflowCategory,
    EntityCode,
    SolicitudType,
    TariffType,
    DocumentConditionType,
)


# =============================================================================
# Workflow Configuration
# =============================================================================

# Fixed tariff for all types
TARIFF_CARNET = 3500  # XAF


class CarnetFuncionarioWorkflow(PredefinedWorkflow):
    """
    Civil servant ID card workflow (MINFP + CNEDOGE).

    Process:
    1. Select type (EXPEDICION/RENOVACION/DUPLICADO)
    2. Upload documents (conditional by type)
    3. Gemini extraction (DIP with schema, others best-effort)
    4. Form review 1: Datos Personales (from DIP extraction)
    5. Form review 2: Datos Administrativos + Carnet Anterior + Contacto
    6. Payment (3,500 XAF fixed)
    7. Appointment (biometric capture at CNEDOGE)
    8. Confirmation
    """

    # === Properties (PredefinedWorkflow interface) ===

    @property
    def workflow_code(self) -> WorkflowCode:
        return WorkflowCode.FP_CARNET_FUNCIONARIO

    @property
    def category(self) -> WorkflowCategory:
        return WorkflowCategory.FUNCION_PUBLICA

    @property
    def entity_code(self) -> EntityCode:
        return EntityCode.MINFP

    @property
    def service_name_es(self) -> str:
        return "Carnet de Funcionario"

    @property
    def allowed_solicitud_types(self) -> List[SolicitudType]:
        return [
            SolicitudType.EXPEDICION,
            SolicitudType.RENOVACION,
            SolicitudType.DUPLICADO,
        ]

    @property
    def requires_appointment(self) -> bool:
        return True  # Biometric capture at CNEDOGE

    @property
    def requires_agent_review(self) -> bool:
        return True

    @property
    def requires_nota_ingreso(self) -> bool:
        return False

    # === Setup ===

    def _setup_workflow(self) -> None:
        """Configure all steps and tariffs for carnet workflow."""
        self._setup_steps()
        self._setup_tariffs()

    def _setup_steps(self) -> None:
        """Define workflow steps."""

        # -----------------------------------------------------------------
        # Step 0: Selection type
        # -----------------------------------------------------------------
        self.add_step(WorkflowStep(
            step_number=0,
            step_id="select_type",
            step_type=StepType.SELECTION,
            title_es="Tipo de Solicitud",
            description_es="Seleccione el tipo de solicitud de carnet de funcionario",
            config={
                "selection_type": "solicitud_type",
                "options": [
                    {
                        "value": "EXPEDICION",
                        "label_es": "Primera expedición",
                        "description_es": "Primera solicitud de carnet de funcionario"
                    },
                    {
                        "value": "RENOVACION",
                        "label_es": "Renovación",
                        "description_es": "Renovación de carnet expirado o próximo a expirar"
                    },
                    {
                        "value": "DUPLICADO",
                        "label_es": "Duplicado",
                        "description_es": "Reposición por pérdida, robo o deterioro"
                    },
                ]
            }
        ))

        # -----------------------------------------------------------------
        # Step 1: Upload documents (conditional by type)
        # -----------------------------------------------------------------
        self.add_step(WorkflowStep(
            step_number=1,
            step_id="upload_documents",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Documentos Justificativos",
            description_es="Cargue los documentos requeridos según el tipo de solicitud",
            config={"dynamic_documents": True}
        ))

        # -----------------------------------------------------------------
        # Step 2: Form review 1 - Datos Personales (from DIP)
        # -----------------------------------------------------------------
        self.add_step(WorkflowStep(
            step_number=2,
            step_id="form_review_1",
            step_type=StepType.FORM_REVIEW,
            title_es="Datos Personales",
            description_es="Verifique los datos personales extraídos de su DIP",
            config={
                "sections": [
                    {
                        "id": "identificacion_personal",
                        "title_es": "Datos Personales",
                        "fields": [
                            {
                                "key": "numero_dip",
                                "label_es": "N° DIP",
                                "type": "text",
                                "required": True,
                                "readonly": True,
                            },
                            {
                                "key": "apellidos",
                                "label_es": "Apellidos",
                                "type": "text",
                                "required": True,
                                "readonly": True,
                            },
                            {
                                "key": "nombres",
                                "label_es": "Nombres",
                                "type": "text",
                                "required": True,
                                "readonly": True,
                            },
                            {
                                "key": "sexo",
                                "label_es": "Sexo",
                                "type": "select",
                                "required": True,
                                "readonly": True,
                                "options": [
                                    {"value": "M", "label_es": "Masculino"},
                                    {"value": "F", "label_es": "Femenino"},
                                ],
                            },
                            {
                                "key": "fecha_nacimiento",
                                "label_es": "Fecha de nacimiento",
                                "type": "date",
                                "required": True,
                                "readonly": True,
                            },
                            {
                                "key": "lugar_nacimiento",
                                "label_es": "Lugar de nacimiento",
                                "type": "text",
                                "required": True,
                                "readonly": True,
                            },
                            {
                                "key": "natural_de",
                                "label_es": "Natural de",
                                "type": "text",
                                "required": False,
                                "readonly": True,
                            },
                            {
                                "key": "estado_civil",
                                "label_es": "Estado civil",
                                "type": "select",
                                "required": True,
                                "readonly": True,
                                "options": [
                                    {"value": "SOLTERO/A", "label_es": "Soltero/a"},
                                    {"value": "CASADO/A", "label_es": "Casado/a"},
                                    {"value": "DIVORCIADO/A", "label_es": "Divorciado/a"},
                                    {"value": "VIUDO/A", "label_es": "Viudo/a"},
                                ],
                            },
                            {
                                "key": "profesion",
                                "label_es": "Profesión",
                                "type": "text",
                                "required": True,
                                "readonly": True,
                            },
                            {
                                "key": "domiciliacion",
                                "label_es": "Domiciliación",
                                "type": "text",
                                "required": True,
                                "readonly": True,
                            },
                            {
                                "key": "grupo_sanguineo",
                                "label_es": "Grupo sanguíneo",
                                "type": "select",
                                "required": False,
                                "readonly": True,
                                "options": [
                                    {"value": "A+", "label_es": "A+"},
                                    {"value": "A-", "label_es": "A-"},
                                    {"value": "B+", "label_es": "B+"},
                                    {"value": "B-", "label_es": "B-"},
                                    {"value": "AB+", "label_es": "AB+"},
                                    {"value": "AB-", "label_es": "AB-"},
                                    {"value": "O+", "label_es": "O+"},
                                    {"value": "O-", "label_es": "O-"},
                                ],
                            },
                        ],
                    },
                    {
                        "id": "filiacion",
                        "title_es": "Filiación",
                        "fields": [
                            {
                                "key": "nombre_padre",
                                "label_es": "Nombre del padre",
                                "type": "text",
                                "required": False,
                                "readonly": True,
                            },
                            {
                                "key": "nombre_madre",
                                "label_es": "Nombre de la madre",
                                "type": "text",
                                "required": False,
                                "readonly": True,
                            },
                        ],
                    },
                ]
            }
        ))

        # -----------------------------------------------------------------
        # Step 3: Form review 2 - Datos Administrativos y Contacto
        # -----------------------------------------------------------------
        self.add_step(WorkflowStep(
            step_number=3,
            step_id="form_review_2",
            step_type=StepType.FORM_REVIEW,
            title_es="Datos Administrativos y Contacto",
            description_es="Complete los datos del nombramiento y de contacto",
            config={
                "sections": [
                    # --- Datos del Nombramiento (always) ---
                    {
                        "id": "datos_nombramiento",
                        "title_es": "Datos del Nombramiento",
                        "fields": [
                            {
                                "key": "matricula_funcionario",
                                "label_es": "Matrícula de funcionario",
                                "type": "text",
                                "required": True,
                                "readonly": False,
                                # Auto-filled from carnet_expirado for RENOVACION,
                                # manual for EXPEDICION/DUPLICADO
                            },
                            {
                                "key": "numero_nombramiento",
                                "label_es": "Número del nombramiento",
                                "type": "text",
                                "required": True,
                                "readonly": False,
                            },
                            {
                                "key": "fecha_nombramiento",
                                "label_es": "Fecha del nombramiento",
                                "type": "date",
                                "required": True,
                                "readonly": False,
                            },
                            {
                                "key": "cargo",
                                "label_es": "Cargo",
                                "type": "text",
                                "required": True,
                                "readonly": False,
                            },
                            {
                                "key": "categoria",
                                "label_es": "Categoría",
                                "type": "select",
                                "required": False,
                                "readonly": False,
                                "options": [
                                    {"value": "A1", "label_es": "A1"},
                                    {"value": "A2", "label_es": "A2"},
                                    {"value": "B1", "label_es": "B1"},
                                    {"value": "B2", "label_es": "B2"},
                                    {"value": "C1", "label_es": "C1"},
                                    {"value": "C2", "label_es": "C2"},
                                    {"value": "D", "label_es": "D"},
                                ],
                            },
                            {
                                "key": "nivel",
                                "label_es": "Nivel",
                                "type": "text",
                                "required": False,
                                "readonly": False,
                            },
                            {
                                "key": "escala",
                                "label_es": "Escala",
                                "type": "text",
                                "required": False,
                                "readonly": False,
                            },
                            {
                                "key": "ministerio_destino",
                                "label_es": "Ministerio de destino",
                                "type": "text",
                                "required": True,
                                "readonly": False,
                            },
                            {
                                "key": "unidad_organica",
                                "label_es": "Unidad orgánica",
                                "type": "text",
                                "required": False,
                                "readonly": False,
                            },
                            {
                                "key": "tipo_vinculacion",
                                "label_es": "Tipo de vinculación",
                                "type": "text",
                                "required": False,
                                "readonly": False,
                            },
                        ],
                    },
                    # --- Datos del Carnet Anterior (RENOVACION or DUPLICADO) ---
                    {
                        "id": "datos_carnet_anterior",
                        "title_es": "Datos del Carnet Anterior",
                        "condition": {
                            "OR": [
                                {"solicitud_type": "RENOVACION"},
                                {"solicitud_type": "DUPLICADO"},
                            ]
                        },
                        "fields": [
                            {
                                "key": "numero_carnet_anterior",
                                "label_es": "Número del carnet anterior",
                                "type": "text",
                                "required": True,
                                "readonly": False,
                                # Auto-filled from carnet_expirado schema for RENOVACION,
                                # manual for DUPLICADO (carnet is lost)
                            },
                            {
                                "key": "fecha_emision_anterior",
                                "label_es": "Fecha de emisión del carnet anterior",
                                "type": "date",
                                "required": False,
                                "readonly": False,
                            },
                            {
                                "key": "fecha_expiracion_anterior",
                                "label_es": "Fecha de expiración del carnet anterior",
                                "type": "date",
                                "required": True,
                                "readonly": False,
                            },
                        ],
                    },
                    # --- Datos de Contacto (always, manual) ---
                    {
                        "id": "datos_contacto",
                        "title_es": "Datos de Contacto",
                        "fields": [
                            {
                                "key": "telefono_personal",
                                "label_es": "Teléfono personal",
                                "type": "tel",
                                "required": True,
                                "readonly": False,
                            },
                            {
                                "key": "email",
                                "label_es": "Correo electrónico",
                                "type": "email",
                                "required": True,
                                "readonly": False,
                            },
                            {
                                "key": "familiar_nombre",
                                "label_es": "Nombre del familiar cercano",
                                "type": "text",
                                "required": True,
                                "readonly": False,
                            },
                            {
                                "key": "familiar_telefono",
                                "label_es": "Teléfono del familiar",
                                "type": "tel",
                                "required": True,
                                "readonly": False,
                            },
                        ],
                    },
                ]
            }
        ))

        # -----------------------------------------------------------------
        # Step 4: Payment
        # -----------------------------------------------------------------
        self.add_step(WorkflowStep(
            step_number=4,
            step_id="payment",
            step_type=StepType.PAYMENT,
            title_es="Pago de Tasas",
            description_es="Tasa de emisión de Carnet de Funcionario: 3.500 XAF",
            config={"dynamic_tariff": True}
        ))

        # -----------------------------------------------------------------
        # Step 5: Appointment (biometric capture)
        # -----------------------------------------------------------------
        self.add_step(WorkflowStep(
            step_number=5,
            step_id="appointment",
            step_type=StepType.APPOINTMENT,
            title_es="Cita para Captura Biométrica",
            description_es="Seleccione el centro para la captura biométrica",
            config={
                "locations_from": "entity_locations",
            }
        ))

        # -----------------------------------------------------------------
        # Step 6: Confirmation
        # -----------------------------------------------------------------
        self.add_step(WorkflowStep(
            step_number=6,
            step_id="confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación y Envío",
            description_es="Verifique todos los datos y envíe su solicitud",
            config={
                "show_summary": True,
                "consent_text_es": (
                    "Confirmo que todos los datos proporcionados son correctos "
                    "y autorizo su tratamiento informático para la gestión "
                    "de la solicitud del carnet de funcionario."
                ),
            }
        ))

    def _setup_tariffs(self) -> None:
        """Fixed tariff: 3,500 XAF for all types."""
        self.set_tariff_config(TariffConfig(
            tariff_type=TariffType.FIXED,
            fixed_amounts={
                "EXPEDICION": TARIFF_CARNET,
                "RENOVACION": TARIFF_CARNET,
                "DUPLICADO": TARIFF_CARNET,
            },
            currency="XAF",
        ))

    # === Document Requirements ===

    def get_document_requirements(
        self,
        solicitud_type: SolicitudType,
        motivo: Optional[RenovacionMotivo] = None,
        context: Optional[WorkflowContext] = None,
    ) -> List[DocumentRequirement]:
        """
        Get document requirements for carnet request.

        Documents:
        - DIP (always): Identity verification - has OCR schema DIP_GQ_V2
        - Nombramiento (always): Appointment act - best_effort_extraction
        - Oficio de Destino (EXPEDICION only): best_effort_extraction
        - Toma de Posesión (EXPEDICION only): best_effort_extraction
        - Carnet Expirado (RENOVACION only): has OCR schema CARNET_FUNCIONARIO_GQ_V1
        - Certificado de Pérdida (DUPLICADO only): best_effort_extraction
        """
        requirements = []

        # -----------------------------------------------------------------
        # 1. DIP - Always required (has schema)
        # -----------------------------------------------------------------
        requirements.append(DocumentRequirement(
            document_code="dip",
            document_name_es="Documento de Identidad Personal (DIP)",
            schema_key="DIP_GQ_V2",
            is_required=True,
            display_order=1,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="DIP en vigor (recto y verso)",
            faces_required=["recto", "verso"],
        ))

        # -----------------------------------------------------------------
        # 2. Nombramiento - Always required (best-effort, no schema)
        # -----------------------------------------------------------------
        requirements.append(DocumentRequirement(
            document_code="nombramiento",
            document_name_es="Acto de Nombramiento o Contrato",
            is_required=True,
            display_order=2,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Documento oficial de nombramiento o contrato de funcionario",
            config={"best_effort_extraction": True},
        ))

        # -----------------------------------------------------------------
        # Conditional documents by solicitud_type
        # -----------------------------------------------------------------

        if solicitud_type == SolicitudType.EXPEDICION:
            # 3. Oficio de Destino - EXPEDICION only
            requirements.append(DocumentRequirement(
                document_code="oficio_destino",
                document_name_es="Oficio de Destino",
                is_required=True,
                display_order=3,
                condition_type=DocumentConditionType.IS_NEW,
                instructions_es="Oficio de destino al puesto de trabajo",
                config={"best_effort_extraction": True},
            ))

            # 4. Toma de Posesión - EXPEDICION only
            requirements.append(DocumentRequirement(
                document_code="toma_posesion",
                document_name_es="Acta de Toma de Posesión",
                is_required=True,
                display_order=4,
                condition_type=DocumentConditionType.IS_NEW,
                instructions_es="Acta que acredita la toma de posesión del cargo",
                config={"best_effort_extraction": True},
            ))

        elif solicitud_type == SolicitudType.RENOVACION:
            # 3. Carnet Expirado - RENOVACION only (has schema)
            requirements.append(DocumentRequirement(
                document_code="carnet_expirado",
                document_name_es="Carnet de Funcionario Expirado",
                schema_key="CARNET_FUNCIONARIO_GQ_V1",
                is_required=True,
                display_order=3,
                condition_type=DocumentConditionType.IS_RENEWAL,
                instructions_es="Carnet de funcionario expirado o próximo a expirar (recto y verso)",
                faces_required=["recto", "verso"],
            ))

        elif solicitud_type == SolicitudType.DUPLICADO:
            # 3. Certificado de Pérdida - DUPLICADO only
            requirements.append(DocumentRequirement(
                document_code="certificado_perdida",
                document_name_es="Certificado de Pérdida o Denuncia",
                is_required=True,
                display_order=3,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"solicitud_type": "DUPLICADO"},
                instructions_es="Declaración oficial de pérdida del carnet (menos de 30 días)",
                config={"best_effort_extraction": True},
            ))

        return requirements

    # === Form Mapping ===

    def get_form_mapping(self, context: Optional[WorkflowContext] = None) -> Dict[str, str]:
        """
        Map extracted document data to form fields.

        Sources verified against real OCR schemas:
        - DIP: dip_gq.json (DIP_GQ_V2) - all paths verified
        - Carnet: carnet_funcionario_gq.json (CARNET_FUNCIONARIO_GQ_V1) - all paths verified
        - Nombramiento: best-effort extraction (paths are hints for Gemini)

        v1 bugs fixed:
        - lugar_nacimiento: flat string (was nested .provincia/.distrito/.localidad)
        - domiciliacion: flat string (was nested .domicilio.pais/.provincia/.distrito/.localidad)
        - filiacion: correct section (was datos_familiares)
        - tribu: removed (not in DIP schema)
        - carnet paths: .carnet. section (was .datos_carnet.)
        """
        return {
            # === From DIP (always uploaded, schema DIP_GQ_V2) ===
            "numero_dip": "dip.documento.numero_dip",
            "apellidos": "dip.titular.apellidos",
            "nombres": "dip.titular.nombres",
            "sexo": "dip.titular.sexo",
            "fecha_nacimiento": "dip.titular.fecha_nacimiento",
            "lugar_nacimiento": "dip.titular.lugar_nacimiento",
            "natural_de": "dip.titular.natural_de",
            "estado_civil": "dip.titular.estado_civil",
            "profesion": "dip.titular.profesion",
            "domiciliacion": "dip.titular.domiciliacion",
            "grupo_sanguineo": "dip.titular.grupo_sanguineo",
            "nombre_padre": "dip.filiacion.nombre_padre",
            "nombre_madre": "dip.filiacion.nombre_madre",

            # === From Nombramiento (best-effort, no schema) ===
            "numero_nombramiento": "nombramiento.datos_administrativos.numero_nombramiento",
            "fecha_nombramiento": "nombramiento.datos_administrativos.fecha_nombramiento",
            "cargo": "nombramiento.datos_administrativos.cargo",
            "categoria": "nombramiento.datos_administrativos.categoria",
            "nivel": "nombramiento.datos_administrativos.nivel",
            "escala": "nombramiento.datos_administrativos.escala",
            "ministerio_destino": "nombramiento.datos_administrativos.ministerio_destino",
            "unidad_organica": "nombramiento.datos_administrativos.unidad_organica",
            "tipo_vinculacion": "nombramiento.datos_administrativos.tipo_vinculacion",

            # === From Carnet Expirado (RENOVACION only, schema CARNET_FUNCIONARIO_GQ_V1) ===
            # When carnet_expirado is not uploaded (EXPEDICION/DUPLICADO),
            # these mappings won't match → fields remain empty for manual input.
            "matricula_funcionario": "carnet_expirado.titular.matricula",
            "numero_carnet_anterior": "carnet_expirado.carnet.numero_carnet",
            "fecha_emision_anterior": "carnet_expirado.carnet.fecha_emision",
            "fecha_expiracion_anterior": "carnet_expirado.carnet.fecha_expiracion",
        }

    # === Cross-Document Validation ===

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """
        Get cross-document validation rules for carnet workflow.

        Rules verify:
        1. Identity coherence between DIP and nombramiento
        2. Temporal validity of documents
        3. Type-specific constraints (expedicion/renovacion/duplicado)
        """
        return [
            # --- Always ---
            {
                "id": "coherencia_identidad_dip_nombramiento",
                "rule": (
                    "normalize(dip.titular.apellidos + ' ' + dip.titular.nombres) "
                    "SIMILAR_TO normalize(nombramiento.funcionario.nombre_completo)"
                ),
                "error_es": "El nombre en el DIP no coincide con el del Nombramiento.",
                "severity": "warning",
            },
            {
                "id": "fecha_nombramiento_valida",
                "document": "nombramiento",
                "rule": "nombramiento.datos_administrativos.fecha_nombramiento < TODAY",
                "error_es": "La fecha del nombramiento debe ser anterior a hoy.",
                "severity": "blocking",
            },
            {
                "id": "dip_vigente",
                "document": "dip",
                "rule": "dip.documento.fecha_expiracion > TODAY",
                "error_es": "El DIP está expirado. Debe presentar un DIP en vigor.",
                "severity": "blocking",
            },
            {
                "id": "categoria_administrativa_valida",
                "document": "nombramiento",
                "rule": "nombramiento.datos_administrativos.categoria IN ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D']",
                "error_es": "La categoría administrativa no es válida.",
                "severity": "warning",
            },

            # --- EXPEDICION specific ---
            {
                "id": "toma_posesion_posterior_nombramiento",
                "condition": {"solicitud_type": "EXPEDICION"},
                "rule": "toma_posesion.fecha >= nombramiento.datos_administrativos.fecha_nombramiento",
                "error_es": "La toma de posesión debe ser posterior al nombramiento.",
                "severity": "blocking",
            },

            # --- RENOVACION specific ---
            {
                "id": "carnet_expirado_o_proximo",
                "condition": {"solicitud_type": "RENOVACION"},
                "document": "carnet_expirado",
                "rule": "carnet_expirado.carnet.fecha_expiracion < TODAY + 90 DAYS",
                "error_es": (
                    "Solo puede renovar si el carnet expira en menos de 3 meses "
                    "o ya ha expirado."
                ),
                "severity": "warning",
            },
            {
                "id": "coherencia_carnet_dip",
                "condition": {"solicitud_type": "RENOVACION"},
                "rule": (
                    "normalize(dip.titular.apellidos + ' ' + dip.titular.nombres) "
                    "SIMILAR_TO normalize(carnet_expirado.titular.nombre_completo)"
                ),
                "error_es": "El nombre en el DIP no coincide con el del carnet anterior.",
                "severity": "warning",
            },

            # --- DUPLICADO specific ---
            {
                "id": "certificado_perdida_reciente",
                "condition": {"solicitud_type": "DUPLICADO"},
                "document": "certificado_perdida",
                "rule": "certificado_perdida.fecha_emision > TODAY - 30 DAYS",
                "error_es": "El certificado de pérdida debe tener menos de 30 días.",
                "severity": "blocking",
            },
        ]


# =============================================================================
# Singleton pattern
# =============================================================================

_workflow: Optional[CarnetFuncionarioWorkflow] = None


def get_carnet_funcionario_workflow() -> CarnetFuncionarioWorkflow:
    """Get singleton instance of CarnetFuncionarioWorkflow."""
    global _workflow
    if _workflow is None:
        _workflow = CarnetFuncionarioWorkflow()
    return _workflow


