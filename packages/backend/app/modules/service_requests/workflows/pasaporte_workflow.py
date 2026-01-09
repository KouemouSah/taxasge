"""
PasaporteWorkflow - Workflow for passport requests.

Implements the passport workflow based on WORKFLOW_PASAPORTE_CITOYEN.md.

Types:
- NUEVO: First passport request
- RENOVACION: Passport renewal
- PERDIDA: Lost passport
- ROBO: Stolen passport
- DETERIORO: Damaged passport

Entity: CNEDOGE (Centro Nacional de Expedición de Documentos)
"""
from typing import List, Dict, Any

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
from ..validations.cross_document_validator import cross_document_validator


class PasaporteWorkflow(BaseWorkflow):
    """
    Passport request workflow.

    Sub-types:
    - NUEVO: First passport (requires birth certificate)
    - RENOVACION: Renewal (requires old passport)
    - PERDIDA: Lost (requires police report)
    - ROBO: Stolen (requires police report)
    - DETERIORO: Damaged (requires damaged passport)
    """

    # Class attributes
    workflow_code = WorkflowCode.PASAPORTE_NUEVO  # Will be overridden based on sub_type
    category = WorkflowCategory.IDENTIDAD
    entity_code = EntityCode.CNEDOGE

    service_name_es = "Solicitud de Pasaporte"

    requires_nota_ingreso = False
    requires_appointment = True
    requires_agent_review = True

    allowed_sub_types = ["NUEVO", "RENOVACION", "PERDIDA", "ROBO", "DETERIORO"]

    def _setup_specific_steps(self) -> None:
        """Setup passport-specific workflow steps."""

        # Step 3: Upload Photos (specific to pasaporte)
        # This step comes BEFORE form review per WORKFLOW_PASAPORTE_CITOYEN.md
        self.add_step(WorkflowStep(
            step_number=3,
            step_id="upload_photos",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Fotografías",
            description_es="Cargue 2 fotografías tipo pasaporte",
            is_inherited=False,
            documents=[
                DocumentRequirement(
                    document_code="photo_carnet",
                    document_name_es="Fotografía tipo pasaporte",
                    is_required=True,
                    display_order=0,
                    condition_type=DocumentConditionType.ALWAYS,
                    instructions_es="2 fotografías de 35x45mm, fondo blanco, rostro visible",
                    accepted_formats=["jpg", "jpeg", "png"]
                )
            ],
            config={"quantity": 2}
        ))

        # Step 6: Payment
        self.add_step(WorkflowStep(
            step_number=6,
            step_id="payment",
            step_type=StepType.PAYMENT,
            title_es="Pago de Tasas",
            description_es="Realice el pago mediante Mobile Money",
            is_inherited=False,
            config={
                                "currency": "XAF"
            }
        ))

        # Step 7: Confirmation
        self.add_step(WorkflowStep(
            step_number=7,
            step_id="confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación",
            description_es="Verifique sus datos y envíe su solicitud",
            is_inherited=False,
            config={"show_summary": True}
        ))

    def _setup_tariffs(self) -> None:
        """Setup tariff configuration for passport."""
        self._tariff_config = TariffConfig(
            tariff_type=TariffType.FIXED,
            fixed_amounts={
                "NUEVO": 7500,       # 7500 XAF
                "RENOVACION": 5000,  # 5000 XAF
                "PERDIDA": 10000,    # 10000 XAF (includes penalty)
                "ROBO": 10000,       # 10000 XAF (includes penalty)
                "DETERIORO": 7500    # 7500 XAF
            },
            currency="XAF"
        )

    def get_document_requirements(self, sub_type: str) -> List[DocumentRequirement]:
        """Get document requirements based on passport request type."""
        requirements = []

        # DIP is always required
        requirements.append(DocumentRequirement(
            document_code="dip",
            document_name_es="Documento de Identidad Personal (DIP)",
            schema_key="DIP_GQ_V2",
            is_required=True,
            display_order=1,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Escanee ambas caras de su DIP",
            faces_required=["recto", "verso"]
        ))

        # Type-specific documents
        if sub_type == "NUEVO":
            requirements.append(DocumentRequirement(
                document_code="certificado_nacimiento",
                document_name_es="Certificado de Nacimiento",
                schema_key="CERTIFICACION_NACIMIENTO_GQ_V1",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.IS_NEW,
                instructions_es="Certificación literal de inscripción de nacimiento"
            ))

        elif sub_type in ["RENOVACION", "DETERIORO"]:
            requirements.append(DocumentRequirement(
                document_code="pasaporte_antiguo",
                document_name_es="Pasaporte Antiguo",
                schema_key="PASAPORTE_GQ_V1",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["RENOVACION", "DETERIORO"]},
                instructions_es="Escanee la página de datos de su pasaporte actual"
            ))

        elif sub_type in ["PERDIDA", "ROBO"]:
            requirements.append(DocumentRequirement(
                document_code="denuncia_policial",
                document_name_es="Denuncia Policial",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["PERDIDA", "ROBO"]},
                instructions_es="Denuncia de pérdida/robo de la Policía Nacional"
            ))

        # Photos always required
        requirements.append(DocumentRequirement(
            document_code="photo_carnet",
            document_name_es="Fotografías tipo pasaporte (x2)",
            is_required=True,
            display_order=10,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="2 fotos de 35x45mm, fondo blanco, rostro visible"
        ))

        # Minor authorization if applicable
        requirements.append(DocumentRequirement(
            document_code="autorizacion_parental",
            document_name_es="Autorización Parental",
            is_required=True,
            display_order=5,
            condition_type=DocumentConditionType.IS_MINOR,
            instructions_es="Autorización firmada por ambos padres o tutor legal"
        ))

        return requirements

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """Get cross-document validation rules for passport."""
        return [
            # DIP must not be expired
            {
                "id": "dip_not_expired",
                "document": "dip",
                "rule": "documento.fecha_expiracion > TODAY",
                "error_es": "El DIP está expirado. Debe renovarlo antes de solicitar el pasaporte.",
                "severity": "error"
            },
            # DIP number format
            {
                "id": "dip_numero_format",
                "document": "dip",
                "rule": "documento.numero_dip MATCHES '^[0-9]{9}$'",
                "error_es": "El número de DIP debe tener 9 dígitos.",
                "severity": "error"
            },
            # Passport expiry for renewal
            {
                "id": "pasaporte_expiring",
                "document": "pasaporte_antiguo",
                "condition": "tipo IN ['RENOVACION']",
                "rule": "documento.fecha_expiracion < TODAY + 12 MONTHS",
                "error_es": "Solo puede renovar si el pasaporte expira en menos de 12 meses.",
                "severity": "warning"
            },
            # Names must match between DIP and old passport
            {
                "id": "nombres_coherentes_dip_pasaporte",
                "condition": "tipo IN ['RENOVACION', 'DETERIORO']",
                "rule": "normalize(DIP.titular.apellidos) == normalize(PASAPORTE.titular.apellidos)",
                "error_es": "El nombre en el DIP no coincide con el pasaporte antiguo.",
                "severity": "error"
            },
            # Birthdate coherence for new passport
            {
                "id": "fecha_nacimiento_coherente",
                "condition": "tipo == 'NUEVO'",
                "rule": "DIP.titular.fecha_nacimiento == CERTIFICADO_NACIMIENTO.inscrito.fecha_nacimiento",
                "error_es": "La fecha de nacimiento del DIP no coincide con el certificado.",
                "severity": "warning"
            }
        ]

    def get_form_mapping(self) -> Dict[str, str]:
        """
        Get mapping from extracted data to form fields.

        Maps schema field paths to form field names.
        """
        return {
            # Personal information from DIP
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

            # Old passport info (for renewal)
            "numero_pasaporte_antiguo": "pasaporte_antiguo.documento.numero_pasaporte",
            "fecha_expedicion_antiguo": "pasaporte_antiguo.documento.fecha_expedicion",
            "fecha_expiracion_antiguo": "pasaporte_antiguo.documento.fecha_expiracion",

            # Birth certificate info (for new)
            "registro_civil": "certificado_nacimiento.documento.registro_civil_de",
            "nombre_padre": "certificado_nacimiento.padre.nombre_completo",
            "nombre_madre": "certificado_nacimiento.madre.nombre_completo"
        }

    def get_workflow_code_for_subtype(self, sub_type: str) -> WorkflowCode:
        """Get the specific workflow code for a sub-type."""
        mapping = {
            "NUEVO": WorkflowCode.PASAPORTE_NUEVO,
            "RENOVACION": WorkflowCode.PASAPORTE_RENOVACION,
            "PERDIDA": WorkflowCode.PASAPORTE_PERDIDA,
            "ROBO": WorkflowCode.PASAPORTE_ROBO,
            "DETERIORO": WorkflowCode.PASAPORTE_DETERIORO
        }
        return mapping.get(sub_type, WorkflowCode.PASAPORTE_NUEVO)


# Register with workflow engine on import
def register_pasaporte_workflows():
    """Register all pasaporte workflow variants."""
    from ..services.workflow_engine import workflow_engine

    # Register the main workflow
    workflow_engine.register(PasaporteWorkflow)

    # Note: All sub-types use the same workflow class,
    # but with different sub_type in context
