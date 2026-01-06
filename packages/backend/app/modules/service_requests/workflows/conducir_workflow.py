"""
ConducirWorkflow - Workflow for driving certificate requests.

Implements the driving certificate workflow based on WORKFLOW_CONDUCIR_CITOYEN.md.

Types:
- NUEVO: First request (includes exam)
- CANJE: Foreign license conversion
- RENOVACION: Certificate renewal
- DUPLICADO: Duplicate (loss, theft, damage)
- EXTENSION: Class extension

Entity: DGT (Direccion General de Trafico Rodado y Seguridad Vial)

License Classes:
- A: Motorcycles (18+)
- B: Light vehicles (18+)
- B+: Light vehicles + trailer (18+)
- C: Heavy vehicles (21+)
- D: Passenger transport (21+)
- E: Articulated vehicles (21+)
- F: Special vehicles (18+)
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


class LicenseClass(str, Enum):
    """Driving license classes."""
    A = "A"       # Motorcycles
    B = "B"       # Light vehicles up to 3.5T
    B_PLUS = "B+"  # Light vehicles with trailer
    C = "C"       # Heavy vehicles > 3.5T
    D = "D"       # Buses > 9 seats
    E = "E"       # Articulated vehicles
    F = "F"       # Special/agricultural vehicles


class ApplicantType(str, Enum):
    """Type of applicant."""
    CITIZEN_GQ = "CITIZEN_GQ"    # Citizen with DIP
    RESIDENT = "RESIDENT"        # Foreigner with NIE


class ConducirWorkflow(BaseWorkflow):
    """
    Driving certificate request workflow (DGT).

    Sub-types:
    - NUEVO: First certificate (requires exam)
    - CANJE: Foreign license conversion
    - RENOVACION: Certificate renewal
    - DUPLICADO: Duplicate request
    - EXTENSION: Add new license class

    Key features:
    - For NUEVO: Theoretical + practical exam required
    - Medical certificate required for NUEVO, CANJE, RENOVACION
    - Age validation based on license class
    - Citizens use DIP, foreigners use Permiso de Residencia
    """

    # Class attributes
    workflow_code = WorkflowCode.CONDUCIR_NUEVO  # Default
    category = WorkflowCategory.CONDUCCION
    entity_code = EntityCode.DGT

    service_name_es = "Solicitud de Certificado para Conducir"

    requires_nota_ingreso = False
    requires_appointment = True  # For exam (NUEVO)
    requires_agent_review = True

    allowed_sub_types = [
        "NUEVO",
        "CANJE",
        "RENOVACION",
        "DUPLICADO",
        "EXTENSION"
    ]

    # Fixed tariffs (XAF)
    TARIFFS = {
        "NUEVO": 30000,       # Includes exam fees
        "CANJE": 35000,       # Foreign license conversion
        "RENOVACION": 25000,  # Standard renewal
        "DUPLICADO": 20000,   # Replacement
        "EXTENSION": 15000    # Per additional class
    }

    # Age requirements by license class
    MIN_AGE = {
        "A": 18,
        "B": 18,
        "B+": 18,
        "C": 21,
        "D": 21,
        "E": 21,
        "F": 18
    }

    def _setup_specific_steps(self) -> None:
        """Setup driving certificate-specific workflow steps."""

        # Step 5: License Class Selection
        self.add_step(WorkflowStep(
            step_number=5,
            step_id="select_classes",
            step_type=StepType.CUSTOM,
            title_es="Clase(s) de Permiso",
            description_es="Seleccione las clases de permiso que desea obtener",
            is_inherited=False,
            config={
                "type": "multi_selection",
                "max_selection": 3,
                "options": [
                    {"id": "A", "label_es": "A - Motocicletas", "min_age": 18},
                    {"id": "B", "label_es": "B - Vehículos ligeros", "min_age": 18},
                    {"id": "B+", "label_es": "B+ - Vehículos ligeros con remolque", "min_age": 18},
                    {"id": "C", "label_es": "C - Camiones", "min_age": 21},
                    {"id": "D", "label_es": "D - Autobuses", "min_age": 21},
                    {"id": "E", "label_es": "E - Vehículos articulados", "min_age": 21},
                    {"id": "F", "label_es": "F - Vehículos especiales", "min_age": 18}
                ]
            }
        ))

        # Step 6: Specific Documents (conditional)
        self.add_step(WorkflowStep(
            step_number=6,
            step_id="specific_documents",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Documentos Específicos",
            description_es="Documentos adicionales según su tipo de solicitud",
            is_inherited=False,
            config={
                "conditional": True,
                "show_if": {
                    "CANJE": ["permiso_extranjero"],
                    "RENOVACION": ["certificado_actual"],
                    "EXTENSION": ["certificado_actual"],
                    "DUPLICADO": ["denuncia"]
                }
            }
        ))

        # Step 7: Medical Certificate
        self.add_step(WorkflowStep(
            step_number=7,
            step_id="certificado_medico",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Certificado Médico",
            description_es="Certificado médico de aptitud para conducir (menos de 3 meses)",
            is_inherited=False,
            documents=[
                DocumentRequirement(
                    document_code="certificado_medico",
                    document_name_es="Certificado Médico de Aptitud",
                    is_required=True,
                    display_order=1,
                    condition_type=DocumentConditionType.CUSTOM,
                    condition_value={"types": ["NUEVO", "CANJE", "RENOVACION"]},
                    instructions_es="Certificado médico que acredite aptitud visual, auditiva, física y psicomotriz. Máximo 3 meses de antigüedad."
                )
            ],
            config={
                "max_age_days": 90,
                "required_aptitudes": ["visual", "auditiva", "fisica", "psicomotriz"]
            }
        ))

        # Step 8: Photos
        self.add_step(WorkflowStep(
            step_number=8,
            step_id="photos",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Fotografías tipo carnet",
            description_es="2 fotografías tipo carnet con fondo blanco",
            is_inherited=False,
            documents=[
                DocumentRequirement(
                    document_code="photo_carnet",
                    document_name_es="Fotografías tipo carnet (x2)",
                    is_required=True,
                    display_order=1,
                    condition_type=DocumentConditionType.ALWAYS,
                    instructions_es="2 fotos de 35x45mm, fondo blanco, rostro visible, menos de 6 meses",
                    accepted_formats=["jpg", "jpeg", "png"]
                )
            ],
            config={"quantity": 2}
        ))

        # Step 9: Payment
        self.add_step(WorkflowStep(
            step_number=9,
            step_id="payment",
            step_type=StepType.PAYMENT,
            title_es="Pago de Tasas",
            description_es="Realice el pago mediante Mobile Money",
            is_inherited=False,
            config={
                "currency": "XAF"
            }
        ))

        # Step 10: Confirmation
        self.add_step(WorkflowStep(
            step_number=10,
            step_id="confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación",
            description_es="Verifique sus datos y envíe su solicitud",
            is_inherited=False,
            config={
                "show_summary": True,
                "show_appointment_info": True,  # For NUEVO exam
                "exam_scheduling": {
                    "applies_to": ["NUEVO"],
                    "delay_min_days": 7,
                    "notification_before_days": 3,
                    "locations": ["DGT Malabo", "DGT Bata"]
                }
            }
        ))

    def _setup_tariffs(self) -> None:
        """Setup tariff configuration for driving certificate."""
        self._tariff_config = TariffConfig(
            tariff_type=TariffType.FIXED,
            fixed_amounts=self.TARIFFS,
            currency="XAF"
        )

    def calculate_tariff(self, context: WorkflowContext, value: float = None) -> int:
        """
        Calculate tariff based on request type.

        For EXTENSION: 15,000 XAF per new class.
        """
        sub_type = context.sub_type
        base = self.TARIFFS.get(sub_type, 30000)

        if sub_type == "EXTENSION":
            # Calculate based on number of new classes
            clases_solicitadas = context.form_data.get("clases_solicitadas", [])
            clases_actuales = context.form_data.get("clases_actuales", [])
            nuevas_clases = set(clases_solicitadas) - set(clases_actuales)
            return len(nuevas_clases) * self.TARIFFS["EXTENSION"]

        return base

    def get_document_requirements(self, sub_type: str) -> List[DocumentRequirement]:
        """Get document requirements for driving certificate request."""
        requirements = []

        # Identity document - based on applicant type
        requirements.append(DocumentRequirement(
            document_code="dip",
            document_name_es="DIP (Ciudadanos GQ)",
            schema_key="DIP_GQ_V2",
            is_required=True,
            display_order=1,
            condition_type=DocumentConditionType.CUSTOM,
            condition_value={"applicant_type": "CITIZEN_GQ"},
            instructions_es="Escanee ambas caras de su DIP vigente",
            faces_required=["recto", "verso"]
        ))

        requirements.append(DocumentRequirement(
            document_code="permiso_residencia",
            document_name_es="Permiso de Residencia (Extranjeros)",
            schema_key="PERMISO_RESIDENCIA_GQ_V1",
            is_required=True,
            display_order=1,
            condition_type=DocumentConditionType.CUSTOM,
            condition_value={"applicant_type": "RESIDENT"},
            instructions_es="Escanee su Permiso de Residencia vigente",
            faces_required=["recto", "verso"]
        ))

        # Current certificate for RENOVACION/EXTENSION
        if sub_type in ["RENOVACION", "EXTENSION"]:
            requirements.append(DocumentRequirement(
                document_code="certificado_actual",
                document_name_es="Certificado para Conducir Actual",
                schema_key="CERTIFICADO_CONDUCIR_GQ_V1",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.IS_RENEWAL,
                instructions_es="Escanee su certificado para conducir actual"
            ))

        # Foreign license for CANJE
        if sub_type == "CANJE":
            requirements.append(DocumentRequirement(
                document_code="permiso_extranjero",
                document_name_es="Permiso de Conducir Extranjero",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["CANJE"]},
                instructions_es="Escanee ambas caras de su permiso de conducir extranjero vigente",
                faces_required=["recto", "verso"],
                config={"extraction": False}  # Variable format
            ))

        # Police report for DUPLICADO (loss/theft)
        if sub_type == "DUPLICADO":
            requirements.append(DocumentRequirement(
                document_code="denuncia",
                document_name_es="Denuncia Policial (si pérdida o robo)",
                is_required=True,
                display_order=3,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"motivo": ["PERDIDA", "ROBO"]},
                instructions_es="Denuncia de pérdida o robo ante la Policía Nacional"
            ))

        # Medical certificate for NUEVO, CANJE, RENOVACION
        if sub_type in ["NUEVO", "CANJE", "RENOVACION"]:
            requirements.append(DocumentRequirement(
                document_code="certificado_medico",
                document_name_es="Certificado Médico de Aptitud",
                is_required=True,
                display_order=4,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["NUEVO", "CANJE", "RENOVACION"]},
                instructions_es="Certificado médico reciente (menos de 3 meses) que acredite aptitud para conducir"
            ))

        # Photos always required
        requirements.append(DocumentRequirement(
            document_code="photo_carnet",
            document_name_es="Fotografías tipo carnet (x2)",
            is_required=True,
            display_order=10,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="2 fotos de 35x45mm, fondo blanco, rostro visible",
            accepted_formats=["jpg", "jpeg", "png"]
        ))

        return requirements

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """Get cross-document validation rules for driving certificate."""
        return [
            # Identity document not expired
            {
                "id": "identidad_no_expirada",
                "document": "dip | permiso_residencia",
                "rule": "documento.fecha_expiracion > TODAY",
                "error_es": "Su documento de identidad está expirado.",
                "severity": "error"
            },
            # Certificate expiring for RENOVACION
            {
                "id": "certificado_renovable",
                "condition": "tipo == 'RENOVACION'",
                "document": "certificado_actual",
                "rule": "documento.valido_hasta < TODAY + 90 DAYS",
                "error_es": "Solo puede renovar si el certificado vence en menos de 90 días o ya ha vencido.",
                "severity": "warning"
            },
            # Certificate must be authentic
            {
                "id": "certificado_autentico",
                "document": "certificado_actual",
                "rule": """
                    autenticacion.tiene_qr_code == true AND
                    autenticacion.tiene_sello_dgt == true AND
                    autenticacion.tiene_firma == true
                """,
                "error_es": "El certificado actual no parece auténtico (falta QR, sello o firma).",
                "severity": "error"
            },
            # Identity matches between documents
            {
                "id": "identidad_coherente_certificado",
                "condition": "tipo IN ['RENOVACION', 'EXTENSION']",
                "rule": """
                    normalize(DIP.titular.apellidos) == normalize(CERTIFICADO.titular.apellidos)
                    AND normalize(DIP.titular.nombres) == normalize(CERTIFICADO.titular.nombre)
                """,
                "error_es": "El nombre en su DIP no coincide con el certificado actual.",
                "severity": "error"
            },
            # DIP number matches certificate
            {
                "id": "numero_identificacion_coherente",
                "condition": "tipo IN ['RENOVACION', 'EXTENSION']",
                "rule": "DIP.documento.numero_dip == CERTIFICADO.titular.numero_identificacion",
                "error_es": "El número de DIP no coincide con el del certificado actual.",
                "severity": "error"
            },
            # Age requirement for classes C, D, E (21+)
            {
                "id": "edad_minima_clase_c_d_e",
                "rule": """
                    IF clases_solicitadas CONTAINS ['C', 'D', 'E']
                    THEN calculate_age(titular.fecha_nacimiento) >= 21
                """,
                "error_es": "Debe tener al menos 21 años para las clases C, D o E.",
                "severity": "error"
            },
            # Age requirement for classes A, B, F (18+)
            {
                "id": "edad_minima_clase_a_b_f",
                "rule": """
                    IF clases_solicitadas CONTAINS ['A', 'B', 'B+', 'F']
                    THEN calculate_age(titular.fecha_nacimiento) >= 18
                """,
                "error_es": "Debe tener al menos 18 años para obtener un certificado de conducir.",
                "severity": "error"
            },
            # Extension: new class must not already exist
            {
                "id": "extension_clase_nueva",
                "condition": "tipo == 'EXTENSION'",
                "rule": "clases_solicitadas NOT IN CERTIFICADO.permiso.clases_permiso",
                "error_es": "Ya tiene esta(s) clase(s) en su certificado actual.",
                "severity": "error"
            },
            # Medical certificate is recent
            {
                "id": "certificado_medico_reciente",
                "condition": "tipo IN ['NUEVO', 'CANJE', 'RENOVACION']",
                "document": "certificado_medico",
                "rule": "documento.fecha_emision > TODAY - 90 DAYS",
                "error_es": "El certificado médico debe tener menos de 3 meses.",
                "severity": "error"
            }
        ]

    def get_form_mapping(self) -> Dict[str, str]:
        """Get mapping from extracted data to form fields."""
        return {
            # From DIP (citizens)
            "tipo_identificacion": "DIP.documento.tipo",  # "DIP"
            "numero_identificacion": "dip.documento.numero_dip",
            "apellidos": "dip.titular.apellidos",
            "nombres": "dip.titular.nombres",
            "fecha_nacimiento": "dip.titular.fecha_nacimiento",
            "nacionalidad": "dip.titular.nacionalidad",
            "domicilio": "dip.titular.domiciliacion",

            # From Permiso Residencia (foreigners)
            "nie": "permiso_residencia.documento.nie",

            # From current certificate (RENOVACION/EXTENSION)
            "reg_numero": "certificado_actual.documento.reg_numero",
            "clases_actuales": "certificado_actual.permiso.clases_permiso",
            "fecha_expedicion_actual": "certificado_actual.documento.fecha_expedicion",
            "valido_hasta_actual": "certificado_actual.documento.valido_hasta",
            "antiguedad_desde": "certificado_actual.permiso.antiguedad_desde"
        }

    def get_workflow_code_for_subtype(self, sub_type: str) -> WorkflowCode:
        """Get the specific workflow code for a sub-type."""
        mapping = {
            "NUEVO": WorkflowCode.CONDUCIR_NUEVO,
            "CANJE": WorkflowCode.CONDUCIR_CANJE,
            "RENOVACION": WorkflowCode.CONDUCIR_RENOVACION,
            "DUPLICADO": WorkflowCode.CONDUCIR_DUPLICADO,
            "EXTENSION": WorkflowCode.CONDUCIR_EXTENSION
        }
        return mapping.get(sub_type, WorkflowCode.CONDUCIR_NUEVO)

    def requires_exam(self, sub_type: str) -> bool:
        """Check if this request type requires an exam."""
        return sub_type == "NUEVO"

    def get_exam_config(self) -> Dict[str, Any]:
        """Get exam configuration for NUEVO requests."""
        return {
            "required": True,
            "types": {
                "teorico": {
                    "duration_minutes": 45,
                    "questions": 40,
                    "score_minimum_percent": 80,
                    "languages": ["es", "fr"]
                },
                "practico": {
                    "duration_minutes": 30,
                    "location": "Circuito DGT",
                    "prerequisite": "Examen teórico aprobado"
                }
            },
            "scheduling": {
                "delay_min_days": 7,
                "notification_days_before": 3,
                "locations": ["DGT Malabo", "DGT Bata"]
            }
        }

    def validate_class_eligibility(
        self,
        requested_classes: List[str],
        birth_date: str
    ) -> List[Dict[str, Any]]:
        """
        Validate if applicant is eligible for requested license classes.

        Returns list of validation errors (empty if all valid).
        """
        from datetime import datetime, date

        errors = []

        # Calculate age
        try:
            if isinstance(birth_date, str):
                birth = datetime.strptime(birth_date, "%Y-%m-%d").date()
            else:
                birth = birth_date

            today = date.today()
            age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        except (ValueError, TypeError):
            return [{"error": "Invalid birth date", "classes": requested_classes}]

        # Check each class
        for cls in requested_classes:
            min_age = self.MIN_AGE.get(cls, 18)
            if age < min_age:
                errors.append({
                    "class": cls,
                    "min_age": min_age,
                    "current_age": age,
                    "error_es": f"Debe tener al menos {min_age} años para la clase {cls}."
                })

        return errors
