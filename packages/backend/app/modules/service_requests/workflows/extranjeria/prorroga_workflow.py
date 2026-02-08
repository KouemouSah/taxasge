"""
ProrrogaVisadoWorkflow v2 - Visa extension workflow for foreigners.

Migrated to PredefinedWorkflow architecture (v2).
ALIGNED WITH Orden Ministerial 01/2021, Art. 3 Section B.

This is a DISTINCT process from Residencia. It handles:
- PRORROGA_VISADO: Extension of existing visa for foreigners already in GQ.

Art. 3 Section B requirements (4 conditions):
  a) Instancia de solicitud
  b) Pasaporte con visado y sello de entrada
  c) Pasaporte válido (validated by validate_step, not a document)
  d) Visado de larga duración (validated by validate_step, not a document)

Entity: EXTRANJERIA (Dirección General de Extranjería y Fronteras)
Tariff: Fixed (amount TBD - set to 0 as multiplier with documented reason)
No Nota de Ingreso, No appointment.

@version 2.0
@date 2026-02-07
@legal Orden Ministerial 01/2021 de fecha 02 de diciembre, Art. 3 Section B
"""
from typing import List, Dict, Any, Optional
from datetime import datetime

from ..workflow_interface import (
    PredefinedWorkflow,
    WorkflowStep,
    WorkflowContext,
    DocumentRequirement,
    TariffConfig,
    ValidationResult,
    StepType,
    RenovacionMotivo,
)
from ...models.enums import (
    WorkflowCode,
    WorkflowCategory,
    EntityCode,
    TariffType,
    SolicitudType,
    DocumentConditionType,
)


class ProrrogaVisadoWorkflow(PredefinedWorkflow):
    """
    Visa extension workflow for foreigners in Equatorial Guinea.

    AUTONOMOUS: Defines ALL logic internally, aligned with Orden Ministerial 01/2021 Art. 3.B.

    Single workflow code: PRORROGA_VISADO

    Steps (4):
    0. upload_documents: Passport with valid visa and entry stamp
    1. form_review_1: Passport data + visa details (manual input)
    2. payment: Fixed tariff (amount TBD)
    3. confirmation: Summary

    Validate_step rules (3):
    1. pasaporte_valido: Passport not expired (Art. 3.B.c)
    2. visado_en_vigor: Visa not expired
    3. visado_larga_duracion: Must be long-duration visa (Art. 3.B.d)
    """

    # === Properties ===

    @property
    def workflow_code(self) -> WorkflowCode:
        return WorkflowCode.PRORROGA_VISADO

    @property
    def category(self) -> WorkflowCategory:
        return WorkflowCategory.EXTRANJERIA

    @property
    def entity_code(self) -> EntityCode:
        return EntityCode.EXTRANJERIA

    @property
    def service_name_es(self) -> str:
        return "Prórroga de Visado"

    @property
    def allowed_solicitud_types(self) -> List[SolicitudType]:
        return [SolicitudType.EXPEDICION]

    @property
    def allowed_sub_types(self) -> List[str]:
        return []

    @property
    def requires_appointment(self) -> bool:
        return False

    @property
    def requires_agent_review(self) -> bool:
        return True

    @property
    def requires_nota_ingreso(self) -> bool:
        return False

    # === Setup ===

    def _setup_workflow(self) -> None:
        self._setup_steps()
        self._setup_tariffs()

    def _setup_steps(self) -> None:
        # Step 0: Upload documents
        self.add_step(WorkflowStep(
            step_number=0,
            step_id="upload_documents",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Documentos Requeridos",
            description_es="Cargue su pasaporte con el visado y sello de entrada",
            config={
                "dynamic_documents": True,
                "max_file_size_mb": 10,
            }
        ))

        # Step 1: Form Review 1 - Passport + Visa data
        self.add_step(WorkflowStep(
            step_number=1,
            step_id="form_review_1",
            step_type=StepType.FORM_REVIEW,
            title_es="Datos del Pasaporte y Visado",
            description_es="Verifique los datos extraídos del pasaporte e indique los datos del visado",
            config={
                "sections": [
                    {
                        "id": "datos_pasaporte",
                        "title_es": "Datos del Pasaporte",
                        "source_document": "pasaporte",
                        "fields": [
                            {"key": "numero_pasaporte", "label_es": "N° Pasaporte", "type": "text",
                             "required": True, "readonly": True},
                            {"key": "apellidos", "label_es": "Apellidos", "type": "text",
                             "required": True, "readonly": True},
                            {"key": "nombres", "label_es": "Nombres", "type": "text",
                             "required": True, "readonly": True},
                            {"key": "nacionalidad", "label_es": "Nacionalidad", "type": "text",
                             "required": True, "readonly": True},
                            {"key": "fecha_nacimiento", "label_es": "Fecha de Nacimiento", "type": "date",
                             "required": True, "readonly": True},
                            {"key": "fecha_expiracion_pasaporte", "label_es": "Fecha de Expiración Pasaporte",
                             "type": "date", "required": True, "readonly": True},
                        ]
                    },
                    {
                        "id": "datos_visado",
                        "title_es": "Datos del Visado",
                        "description_es": "Información sobre el visado de entrada a Guinea Ecuatorial",
                        "fields": [
                            {"key": "tipo_visado", "label_es": "Tipo de Visado", "type": "select",
                             "required": True,
                             "options": [
                                 {"value": "LARGA_DURACION", "label_es": "Larga duración (> 90 días)"},
                                 {"value": "CORTA_DURACION", "label_es": "Corta duración (≤ 90 días)"},
                             ]},
                            {"key": "fecha_entrada", "label_es": "Fecha de Entrada al País", "type": "date",
                             "required": True},
                            {"key": "fecha_expiracion_visado", "label_es": "Fecha de Expiración del Visado",
                             "type": "date", "required": True},
                            {"key": "duracion_prorroga_solicitada",
                             "label_es": "Duración de Prórroga Solicitada (días)",
                             "type": "number", "required": True,
                             "help_text_es": "Indique el número de días adicionales que solicita"},
                        ]
                    },
                ]
            }
        ))

        # Step 2: Payment (fixed tariff)
        self.add_step(WorkflowStep(
            step_number=2,
            step_id="payment",
            step_type=StepType.PAYMENT,
            title_es="Pago del Trámite",
            description_es="Pago de la tasa de prórroga de visado",
            config={
                "currency": "XAF",
                "payment_type": "fixed",
            }
        ))

        # Step 3: Confirmation
        self.add_step(WorkflowStep(
            step_number=3,
            step_id="confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación y Envío",
            description_es="Verifique todos los datos antes de enviar su solicitud",
            config={
                "show_summary": True,
                "agent_checklist": [
                    {"id": "pasaporte_vigente", "label_es":
                     "He verificado que el pasaporte está vigente con sello de entrada legal",
                     "required": True},
                    {"id": "visado_valido", "label_es":
                     "He verificado que el visado es de larga duración y está en vigor",
                     "required": True},
                    {"id": "no_ecuatoguineano", "label_es":
                     "He comprobado que el solicitante NO es ciudadano ecuatoguineano",
                     "required": True},
                    {"id": "justificacion_prorroga", "label_es":
                     "He verificado la justificación de la prórroga solicitada",
                     "required": True},
                ],
                "rejection_reasons": [
                    {"id": "pasaporte_expirado", "label_es":
                     "Pasaporte expirado o sin sello de entrada legal"},
                    {"id": "visado_expirado", "label_es":
                     "Visado expirado o no en vigor"},
                    {"id": "visado_corta_duracion", "label_es":
                     "Visado de corta duración - no elegible para prórroga (Art. 3.B.d)"},
                    {"id": "ciudadano_ecuatoguineano", "label_es":
                     "Ciudadano ecuatoguineano - no requiere visado"},
                    {"id": "documentos_ilegibles", "label_es":
                     "Documentos ilegibles o incompletos"},
                    {"id": "otro", "label_es": "Otro (especificar)"},
                ],
            }
        ))

    def _setup_tariffs(self) -> None:
        """
        Tariff configuration: Fixed amount.

        Amount set to 0 — official tariff for prórroga de visado
        not yet confirmed in available legal sources. The 0 value
        acts as a multiplier control: workflow is functional but
        amount must be configured by admin before going live.
        """
        self.set_tariff_config(TariffConfig(
            tariff_type=TariffType.FIXED,
            fixed_amounts={
                SolicitudType.EXPEDICION.value.upper(): 0,
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
        Get document requirements aligned with Orden Ministerial 01/2021 Art. 3 Section B.

        Only 2 documents:
        a) Instancia de solicitud (generated form)
        b) Pasaporte con visado y sello de entrada

        Art. 3.B.c (pasaporte válido) and .d (visado larga duración) are conditions
        validated by validate_step(), not separate documents.
        """
        return [
            # Art. 3.B.a - Instancia de Solicitud
            DocumentRequirement(
                document_code="instancia_solicitud",
                document_name_es="Instancia de Solicitud",
                is_required=True,
                display_order=1,
                condition_type=DocumentConditionType.ALWAYS,
                instructions_es=(
                    "Instancia de solicitud de prórroga de visado dirigida al "
                    "Director General de Extranjería y Fronteras"
                ),
            ),
            # Art. 3.B.b - Pasaporte con visado y sello de entrada
            DocumentRequirement(
                document_code="pasaporte",
                document_name_es="Pasaporte con Visado y Sello de Entrada",
                schema_key="PASAPORTE_INTERNATIONAL_V1",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.ALWAYS,
                instructions_es=(
                    "Pasaporte en vigor con visado de entrada válido y sello "
                    "del puesto fronterizo oficial de Guinea Ecuatorial (Art. 3.B.b)"
                ),
                faces_required=["recto", "verso"],
            ),
        ]

    # === Form Mapping ===

    def get_form_mapping(
        self,
        context: Optional[WorkflowContext] = None,
    ) -> Dict[str, str]:
        """Map extracted OCR data to form fields."""
        return {
            # Passport (OCR readonly) - form_review_1
            "numero_pasaporte": "pasaporte.documento.numero_pasaporte",
            "apellidos": "pasaporte.titular.apellidos",
            "nombres": "pasaporte.titular.nombres",
            "nacionalidad": "pasaporte.titular.nacionalidad",
            "fecha_nacimiento": "pasaporte.titular.fecha_nacimiento",
            "fecha_expiracion_pasaporte": "pasaporte.documento.fecha_expiracion",
        }

    # === Step Validation ===

    def validate_step(
        self,
        step_number: int,
        context: WorkflowContext,
    ) -> List[ValidationResult]:
        """
        Validate form review step with business rules from Orden Ministerial 01/2021 Art. 3.B.

        3 rules:
        1. pasaporte_valido: Passport not expired (Art. 3.B.c)
        2. visado_en_vigor: Visa not expired
        3. visado_larga_duracion: Must be long-duration visa (Art. 3.B.d)
        """
        results = super().validate_step(step_number, context)

        step = self.get_step(step_number)
        if not step:
            return results

        if step.step_id == "form_review_1":
            results.extend(self._validate_prorroga(context))

        return results

    def _validate_prorroga(self, context: WorkflowContext) -> List[ValidationResult]:
        """Validate passport and visa conditions for prórroga."""
        results: List[ValidationResult] = []

        # Rule 1: Passport must be valid (Art. 3.B.c)
        fecha_exp_str = context.get_extracted_field("pasaporte", "documento.fecha_expiracion")
        if fecha_exp_str:
            fecha_exp = self._parse_date(str(fecha_exp_str))
            if fecha_exp and fecha_exp < datetime.today():
                results.append(ValidationResult(
                    is_valid=False,
                    rule_id="pasaporte_valido",
                    severity="error",
                    message_es=(
                        "El pasaporte está expirado. Se requiere un pasaporte en vigor "
                        "para solicitar la prórroga de visado (Art. 3.B.c)."
                    ),
                    field_name="fecha_expiracion_pasaporte",
                ))

        # Must NOT be Ecuatoguinean
        nacionalidad = context.get_extracted_field("pasaporte", "titular.nacionalidad")
        if nacionalidad:
            nac_upper = str(nacionalidad).strip().upper()
            if nac_upper in ("GNQ", "GUINEA ECUATORIAL", "ECUATOGUINEANO", "ECUATOGUINEANA"):
                results.append(ValidationResult(
                    is_valid=False,
                    rule_id="nacionalidad_extranjero",
                    severity="error",
                    message_es=(
                        "El solicitante es ciudadano ecuatoguineano. "
                        "Los ciudadanos de GQ no requieren visado."
                    ),
                    field_name="nacionalidad",
                ))

        # Rule 2: Visa must be in vigor (from form_data — manual input)
        fecha_exp_visado_str = context.form_data.get("fecha_expiracion_visado")
        if fecha_exp_visado_str:
            fecha_exp_visado = self._parse_date(str(fecha_exp_visado_str))
            if fecha_exp_visado and fecha_exp_visado < datetime.today():
                results.append(ValidationResult(
                    is_valid=False,
                    rule_id="visado_en_vigor",
                    severity="error",
                    message_es=(
                        "El visado ya ha expirado. Solo se puede solicitar la prórroga "
                        "mientras el visado esté en vigor."
                    ),
                    field_name="fecha_expiracion_visado",
                ))

        # Rule 3: Must be long-duration visa (Art. 3.B.d)
        tipo_visado = context.form_data.get("tipo_visado")
        if tipo_visado and str(tipo_visado) != "LARGA_DURACION":
            results.append(ValidationResult(
                is_valid=False,
                rule_id="visado_larga_duracion",
                severity="error",
                message_es=(
                    "Solo se puede solicitar la prórroga para visados de larga duración "
                    "(más de 90 días). Los visados de corta duración no son elegibles "
                    "(Art. 3.B.d)."
                ),
                field_name="tipo_visado",
            ))

        return results

    # === Utility Methods ===

    @staticmethod
    def _parse_date(date_str: str) -> Optional[datetime]:
        """Parse date string in multiple formats."""
        date_str = date_str.strip()
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d.%m.%Y", "%d-%m-%Y"):
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        return None


# =============================================================================
# Singleton & Registration
# =============================================================================

_workflow: Optional[ProrrogaVisadoWorkflow] = None


def get_prorroga_visado_workflow() -> ProrrogaVisadoWorkflow:
    """Get or create the singleton workflow instance."""
    global _workflow
    if _workflow is None:
        _workflow = ProrrogaVisadoWorkflow()
    return _workflow
