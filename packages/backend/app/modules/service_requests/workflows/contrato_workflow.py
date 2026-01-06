"""
ContratoWorkflow - Workflow for contract registration (ONRC).

Implements the contract registration workflow based on WORKFLOW_CONTRATO_CITOYEN.md.

Types:
- OBRA: Construction/Infrastructure contracts
- SERVICIO: Service contracts
- SUMINISTRO: Supply contracts
- CONCESION: Concession contracts
- JOINT_VENTURE: Partnership contracts
- ARRENDAMIENTO: Lease contracts
- OTRO: Other contracts

Entity: ONRC (Oficina Nacional de Registro de Contratos)
Tariff: 0.5% of contract value
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


class ContratoWorkflow(BaseWorkflow):
    """
    Contract registration workflow (ONRC).

    Sub-types:
    - OBRA: Construction contracts
    - SERVICIO: Service contracts
    - SUMINISTRO: Supply contracts
    - CONCESION: Concession contracts
    - JOINT_VENTURE: Partnership contracts
    - ARRENDAMIENTO: Lease contracts
    - OTRO: Other contract types
    """

    # Class attributes
    workflow_code = WorkflowCode.CONTRATO_OBRA  # Default, varies by sub_type
    category = WorkflowCategory.CONTRATOS
    entity_code = EntityCode.ONRC

    service_name_es = "Registro de Contrato Comercial"

    requires_nota_ingreso = False
    requires_appointment = False  # No appointment needed
    requires_agent_review = True

    allowed_sub_types = [
        "OBRA",
        "SERVICIO",
        "SUMINISTRO",
        "CONCESION",
        "JOINT_VENTURE",
        "ARRENDAMIENTO",
        "OTRO"
    ]

    def _setup_specific_steps(self) -> None:
        """Setup contract-specific workflow steps.

        IMPORTANT: Le paiement est BLOQUÉ jusqu'à l'approbation par l'agent ONRC.
        Flux: Submit → Agent valide → Payment → Certificat
        """

        # Step 5: Contract Value Declaration + Tariff Preview
        self.add_step(WorkflowStep(
            step_number=5,
            step_id="contract_value",
            step_type=StepType.CUSTOM,
            title_es="Valor del Contrato",
            description_es="Confirme el valor del contrato para el cálculo de tasas",
            is_inherited=False,
            config={
                "requires_value_confirmation": True,
                "currency_options": ["XAF", "EUR", "USD"],
                "exchange_rates": {
                    "EUR": 655.957,  # 1 EUR = 655.957 XAF (official rate)
                    "USD": 600       # 1 USD = ~600 XAF (approximate)
                },
                "show_tariff_preview": True,
                "tariff_note": "0.5% del valor del contrato"
            }
        ))

        # Step 6: Confirmation and Submit for Validation
        # NOTE: Citizen submits, then waits for ONRC agent approval
        self.add_step(WorkflowStep(
            step_number=6,
            step_id="confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación y Envío para Validación",
            description_es="Verifique todos los datos y envíe su solicitud para validación por ONRC",
            is_inherited=False,
            config={
                "show_summary": True,
                "show_tariff_calculation": True,
                "submit_for_validation": True,
                "info_message_es": "Su dossier será examinado por un agente de la ONRC. El pago será posible ÚNICAMENTE después de la aprobación.",
                "next_status": "SUBMITTED"
            }
        ))

        # Step 7: Payment (BLOCKED until ONRC agent approval)
        # This step is only accessible after agent sets status to DOSSIER_VALIDE
        self.add_step(WorkflowStep(
            step_number=7,
            step_id="payment",
            step_type=StepType.PAYMENT,
            title_es="Pago de Tasas de Registro",
            description_es="Tasa de registro: 0.5% del valor del contrato (validado por ONRC)",
            is_inherited=False,
            config={
                                "currency": "XAF",
                "calculation_note": "0.5% del valor del contrato",
                "requires_status": "DOSSIER_VALIDE",  # CRITICAL: Payment blocked until validated
                "blocked_message_es": "El pago está bloqueado hasta que un agente ONRC valide su dossier."
            }
        ))

    def _setup_tariffs(self) -> None:
        """Setup tariff configuration for contract registration."""
        self._tariff_config = TariffConfig(
            tariff_type=TariffType.PERCENTAGE,
            percentage=0.5,  # 0.5% of contract value
            currency="XAF"
        )

    def calculate_tariff(self, context: WorkflowContext, value: float = None) -> int:
        """
        Calculate tariff based on contract value.

        Tariff = 0.5% of contract value in XAF
        No minimum - pure percentage calculation.
        """
        if not value:
            # Try to get from form_data
            value = context.form_data.get("monto_total", 0)
            currency = context.form_data.get("moneda", "XAF")

            # Convert to XAF if needed
            if currency == "EUR":
                value = value * 655.957  # EUR to XAF (official rate)
            elif currency == "USD":
                value = value * 600  # USD to XAF (approximate)

        # Calculate 0.5% - no minimum, pure percentage
        return int(value * 0.005)

    def get_document_requirements(self, sub_type: str) -> List[DocumentRequirement]:
        """Get document requirements for contract registration."""
        requirements = []

        # Contract document - always required
        requirements.append(DocumentRequirement(
            document_code="contrato",
            document_name_es="Contrato Comercial",
            schema_key="CONTRATO_ONRC_GQ_V1",
            is_required=True,
            display_order=1,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Escanee todas las páginas del contrato firmado",
            accepted_formats=["pdf"]
        ))

        # NIF Certificate of contractor - always required
        requirements.append(DocumentRequirement(
            document_code="certificado_nif",
            document_name_es="Certificado NIF del Contratista",
            schema_key="CERTIFICADO_NIF_GQ_V1",
            is_required=True,
            display_order=2,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Certificado NIF vigente con autorización DEFINITIVA"
        ))

        # DIP of legal representative - always required
        requirements.append(DocumentRequirement(
            document_code="dip_representante",
            document_name_es="DIP del Representante Legal",
            schema_key="DIP_GQ_V2",
            is_required=True,
            display_order=3,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="DIP del representante legal de la empresa contratista",
            faces_required=["recto", "verso"]
        ))

        # Additional documents for specific contract types
        if sub_type == "CONCESION":
            requirements.append(DocumentRequirement(
                document_code="acta_autorizacion",
                document_name_es="Acta de Autorización Gubernamental",
                is_required=True,
                display_order=4,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["CONCESION"]},
                instructions_es="Resolución o decreto autorizando la concesión"
            ))

        if sub_type == "JOINT_VENTURE":
            requirements.append(DocumentRequirement(
                document_code="acuerdo_jv",
                document_name_es="Acuerdo de Joint-Venture",
                is_required=True,
                display_order=4,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["JOINT_VENTURE"]},
                instructions_es="Acuerdo constitutivo del joint-venture"
            ))

        return requirements

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """Get cross-document validation rules for contract registration."""
        return [
            # Contract must have both signatures
            {
                "id": "contract_signatures",
                "document": "contrato",
                "rule": "firmas.firma_contratante_presente AND firmas.firma_contratista_presente",
                "error_es": "El contrato debe estar firmado por ambas partes.",
                "severity": "error"
            },
            # NIF must be definitive
            {
                "id": "nif_definitive",
                "document": "certificado_nif",
                "rule": "empresa.autorizacion == 'DEFINITIVA'",
                "error_es": "El NIF debe tener autorización DEFINITIVA, no provisional.",
                "severity": "error"
            },
            # NIF must match contractor NIF in contract
            {
                "id": "nif_matches_contract",
                "rule": "certificado_nif.empresa.nif == contrato.parte_contratista.nif_contratista",
                "error_es": "El NIF del certificado no coincide con el NIF del contratista en el contrato.",
                "severity": "error"
            },
            # DIP must not be expired
            {
                "id": "dip_not_expired",
                "document": "dip_representante",
                "rule": "documento.fecha_expiracion > TODAY",
                "error_es": "El DIP del representante legal está expirado.",
                "severity": "error"
            },
            # Representative name should match
            {
                "id": "representative_matches",
                "rule": "normalize(contrato.parte_contratista.representante_legal) CONTAINS normalize(dip_representante.titular.apellidos)",
                "error_es": "El nombre del representante legal no coincide con el DIP.",
                "severity": "warning"
            },
            # Contract value must be positive
            {
                "id": "contract_value_positive",
                "document": "contrato",
                "rule": "valor_contrato.monto_total > 0",
                "error_es": "El valor del contrato debe ser mayor que cero.",
                "severity": "error"
            },
            # NIF format validation
            {
                "id": "nif_format",
                "document": "certificado_nif",
                "rule": "empresa.nif MATCHES '^[0-9]{5}[A-Z]{2}-[0-9]{2}$'",
                "error_es": "El formato del NIF es incorrecto. Debe ser: 12345AB-01",
                "severity": "error"
            },
            # NIF certificate must have all required stamps/signatures
            {
                "id": "nif_authenticated",
                "document": "certificado_nif",
                "rule": """
                    autenticacion.tiene_firma_jefe_hacienda AND
                    autenticacion.tiene_firma_coordinador AND
                    autenticacion.tiene_sello_hacienda AND
                    autenticacion.tiene_sello_vue
                """,
                "error_es": "El certificado NIF no tiene todas las firmas y sellos requeridos.",
                "severity": "error"
            }
        ]

    def get_form_mapping(self) -> Dict[str, str]:
        """Get mapping from extracted data to form fields."""
        return {
            # Contract info
            "tipo_contrato": "contrato.documento.tipo_contrato",
            "fecha_firma": "contrato.documento.fecha_firma",
            "numero_contrato": "contrato.documento.numero_contrato",
            "titulo_contrato": "contrato.documento.titulo_contrato",

            # Value
            "monto_total": "contrato.valor_contrato.monto_total",
            "moneda": "contrato.valor_contrato.moneda",

            # Validity
            "fecha_inicio": "contrato.vigencia.fecha_inicio",
            "fecha_fin": "contrato.vigencia.fecha_fin",
            "duracion_meses": "contrato.vigencia.duracion_meses",

            # Contracting party
            "tipo_contratante": "contrato.parte_contratante.tipo_entidad",
            "nombre_contratante": "contrato.parte_contratante.nombre_entidad",
            "representante_contratante": "contrato.parte_contratante.representante",

            # Contractor
            "tipo_contratista": "contrato.parte_contratista.tipo_entidad",
            "nombre_contratista": "contrato.parte_contratista.nombre_empresa",
            "nif_contratista": "contrato.parte_contratista.nif_contratista",
            "representante_contratista": "contrato.parte_contratista.representante_legal",

            # From NIF certificate
            "nif_certificado": "certificado_nif.empresa.nif",
            "denominacion_social": "certificado_nif.empresa.denominacion_social",
            "autorizacion_tipo": "certificado_nif.empresa.autorizacion",

            # From representative DIP
            "dip_representante": "dip_representante.documento.numero_dip",
            "apellidos_representante": "dip_representante.titular.apellidos",
            "nombres_representante": "dip_representante.titular.nombres"
        }

    def get_workflow_code_for_subtype(self, sub_type: str) -> WorkflowCode:
        """Get the specific workflow code for a sub-type."""
        mapping = {
            "OBRA": WorkflowCode.CONTRATO_OBRA,
            "SERVICIO": WorkflowCode.CONTRATO_SERVICIO,
            "SUMINISTRO": WorkflowCode.CONTRATO_SUMINISTRO,
            "CONCESION": WorkflowCode.CONTRATO_CONCESION,
            "JOINT_VENTURE": WorkflowCode.CONTRATO_JOINT_VENTURE,
            "ARRENDAMIENTO": WorkflowCode.CONTRATO_ARRENDAMIENTO,
            "OTRO": WorkflowCode.CONTRATO_OTRO
        }
        return mapping.get(sub_type, WorkflowCode.CONTRATO_OTRO)
