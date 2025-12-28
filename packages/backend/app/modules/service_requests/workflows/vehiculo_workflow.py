"""
VehiculoWorkflow - Workflow for vehicle-related requests.

Implements the vehicle workflow based on WORKFLOW_VEHICULO_CITOYEN.md.

Types:
- PRIMERA_MATRICULACION: First registration (new or imported vehicle)
- TRANSFERENCIA: Ownership transfer
- RENOVACION_CUVE: CUVE renewal
- RENOVACION_ITV: ITV renewal
- DUPLICADO_PERMISO: Duplicate Permiso Circulacion
- DUPLICADO_CUVE: Duplicate CUVE
- CAMBIO_CARACTERISTICAS: Vehicle modification

Entities:
- DGT (Direccion General de Trafico Rodado y Seguridad Vial) - Main
- OFIVE (Oficina de Inspeccion de Vehiculos) - CUVE issuance
- ITVE (Inspeccion Tecnica de Vehiculos) - ITV inspections

Tarification: RBC Calculator (dynamic pricing based on vehicle characteristics)
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


class VehicleType(str, Enum):
    """Vehicle types for classification."""
    TURISMO = "TURISMO"           # Passenger car
    CAMION = "CAMION"             # Truck
    MOTOCICLETA = "MOTOCICLETA"   # Motorcycle
    AUTOBUS = "AUTOBUS"           # Bus
    FURGONETA = "FURGONETA"       # Van
    REMOLQUE = "REMOLQUE"         # Trailer


class VehicleService(str, Enum):
    """Vehicle service classification."""
    PRIVADO = "PRIVADO"     # Private use
    PUBLICO = "PUBLICO"     # Public transport
    OFICIAL = "OFICIAL"     # Government use


class VehiculoWorkflow(BaseWorkflow):
    """
    Vehicle-related requests workflow (DGT + OFIVE + ITVE).

    Sub-types:
    - PRIMERA_MATRICULACION: First registration
    - TRANSFERENCIA: Ownership transfer
    - RENOVACION_CUVE: CUVE renewal
    - RENOVACION_ITV: ITV renewal
    - DUPLICADO_PERMISO: Duplicate Permiso
    - DUPLICADO_CUVE: Duplicate CUVE
    - CAMBIO_CARACTERISTICAS: Modification

    Tariff: Dynamic RBC Calculator based on:
    - Vehicle type (TURISMO, CAMION, etc.)
    - Vehicle service (PRIVADO, PUBLICO, OFICIAL)
    - Fiscal power (potencia_fiscal)
    - Request type
    """

    # Class attributes
    workflow_code = WorkflowCode.VEHICULO_PRIMERA_MATRICULACION  # Default
    category = WorkflowCategory.VEHICULOS
    entity_code = EntityCode.DGT

    service_name_es = "Trámites de Vehículos"
    service_name_fr = "Démarches Véhicules"

    requires_nota_ingreso = False  # Direct payment
    requires_appointment = False   # Depends on request type
    requires_agent_review = True

    allowed_sub_types = [
        "PRIMERA_MATRICULACION",
        "TRANSFERENCIA",
        "RENOVACION_CUVE",
        "RENOVACION_ITV",
        "DUPLICADO_PERMISO",
        "DUPLICADO_CUVE",
        "CAMBIO_CARACTERISTICAS"
    ]

    # Multi-entity workflow
    entities_involved = [
        EntityCode.DGT,    # Main - Permiso Circulacion
        EntityCode.OFIVE,  # CUVE issuance
        EntityCode.ITVE    # ITV inspections
    ]

    # Document requirements by request type
    DOCS_BY_TYPE = {
        "PRIMERA_MATRICULACION": ["dip", "itv", "factura_contrato"],
        "TRANSFERENCIA": ["dip_comprador", "dip_vendedor", "permiso_circulacion", "cuve", "contrato_compraventa"],
        "RENOVACION_CUVE": ["dip", "cuve_antigua", "permiso_circulacion", "itv"],
        "RENOVACION_ITV": ["dip", "itv_antigua", "permiso_circulacion"],
        "DUPLICADO_PERMISO": ["dip", "cuve", "denuncia"],
        "DUPLICADO_CUVE": ["dip", "permiso_circulacion", "denuncia"],
        "CAMBIO_CARACTERISTICAS": ["dip", "permiso_circulacion", "cuve", "certificado_reforma"]
    }

    def _setup_specific_steps(self) -> None:
        """Setup vehicle-specific workflow steps."""

        # Step 5: Upload Vehicle Documents
        self.add_step(WorkflowStep(
            step_number=5,
            step_id="vehicle_documents",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Documentos del Vehículo",
            title_fr="Documents du Véhicule",
            description_es="Cargue los documentos del vehículo según el tipo de trámite",
            is_inherited=False,
            config={
                "conditional_documents": True,
                "documents_by_type": self.DOCS_BY_TYPE
            }
        ))

        # Step 6: Specific Documents (conditional)
        self.add_step(WorkflowStep(
            step_number=6,
            step_id="specific_documents",
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Documentos Específicos",
            title_fr="Documents Spécifiques",
            description_es="Documentos adicionales según su trámite",
            is_inherited=False,
            config={
                "conditional": True,
                "show_if": {
                    "TRANSFERENCIA": ["contrato_compraventa", "dip_vendedor"],
                    "DUPLICADO_PERMISO": ["denuncia"],
                    "DUPLICADO_CUVE": ["denuncia"],
                    "CAMBIO_CARACTERISTICAS": ["certificado_reforma"],
                    "PRIMERA_MATRICULACION": ["factura"]
                }
            }
        ))

        # Step 7: Payment (RBC calculated)
        self.add_step(WorkflowStep(
            step_number=7,
            step_id="payment",
            step_type=StepType.PAYMENT,
            title_es="Pago de Tasas",
            title_fr="Paiement des Frais",
            description_es="El monto se calcula automáticamente según el vehículo y tipo de trámite",
            is_inherited=False,
            config={
                "payment_methods": ["MTN_MOBILE_MONEY", "ORANGE_MONEY", "BANGE_WALLET", "BANK_TRANSFER"],
                "currency": "XAF",
                "tariff_source": "rbc-calculator",
                "tariff_params": ["service_category", "request_type", "vehicle_type", "vehicle_service", "vehicle_power"]
            }
        ))

        # Step 8: Confirmation
        self.add_step(WorkflowStep(
            step_number=8,
            step_id="confirmation",
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación y Envío",
            title_fr="Confirmation et Envoi",
            description_es="Verifique todos los datos y envíe su solicitud",
            is_inherited=False,
            config={"show_summary": True}
        ))

    def _setup_tariffs(self) -> None:
        """Setup tariff configuration for vehicle requests.

        Uses RBC Calculator for dynamic pricing based on:
        - Request type
        - Vehicle type (TURISMO, CAMION, etc.)
        - Vehicle service (PRIVADO, PUBLICO, OFICIAL)
        - Fiscal power
        """
        self._tariff_config = TariffConfig(
            tariff_type=TariffType.RBC,
            currency="XAF",
            extra={
                "service_category": "vehiculo",
                "calculator_endpoint": "/api/v1/rbc/calculate"
            }
        )

    def calculate_tariff(self, context: WorkflowContext, value: float = None) -> int:
        """
        Calculate tariff using RBC rules.

        This is a placeholder - actual calculation done by RBC service.
        Returns estimated base amounts for reference.
        """
        sub_type = context.sub_type

        # Base amounts (actual calculation via RBC service)
        base_amounts = {
            "PRIMERA_MATRICULACION": 150000,
            "TRANSFERENCIA": 75000,
            "RENOVACION_CUVE": 35000,
            "RENOVACION_ITV": 25000,
            "DUPLICADO_PERMISO": 50000,
            "DUPLICADO_CUVE": 35000,
            "CAMBIO_CARACTERISTICAS": 50000
        }

        base = base_amounts.get(sub_type, 50000)

        # Vehicle type multiplier
        vehicle_type = context.form_data.get("vehiculo_tipo", "TURISMO")
        type_multipliers = {
            "TURISMO": 1.0,
            "CAMION": 1.5,
            "MOTOCICLETA": 0.7,
            "AUTOBUS": 1.8,
            "FURGONETA": 1.2,
            "REMOLQUE": 0.8
        }
        base *= type_multipliers.get(vehicle_type, 1.0)

        # Service type multiplier
        vehicle_service = context.form_data.get("vehiculo_servicio", "PRIVADO")
        service_multipliers = {
            "PRIVADO": 1.0,
            "PUBLICO": 1.3,
            "OFICIAL": 0.5  # Discount for government
        }
        base *= service_multipliers.get(vehicle_service, 1.0)

        return int(base)

    def get_document_requirements(self, sub_type: str) -> List[DocumentRequirement]:
        """Get document requirements based on request type."""
        requirements = []

        # DIP of owner - always required
        requirements.append(DocumentRequirement(
            document_code="dip",
            document_name_es="DIP del Propietario",
            schema_key="DIP_GQ_V2",
            is_required=True,
            display_order=1,
            condition_type=DocumentConditionType.ALWAYS,
            instructions_es="Escanee ambas caras de su DIP",
            faces_required=["recto", "verso"]
        ))

        # Permiso Circulacion - for most types except PRIMERA_MATRICULACION
        if sub_type in ["TRANSFERENCIA", "RENOVACION_CUVE", "RENOVACION_ITV",
                        "DUPLICADO_CUVE", "CAMBIO_CARACTERISTICAS"]:
            requirements.append(DocumentRequirement(
                document_code="permiso_circulacion",
                document_name_es="Permiso de Circulación",
                schema_key="PERMISO_CIRCULACION_GQ_V1",
                is_required=True,
                display_order=2,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["TRANSFERENCIA", "RENOVACION_CUVE", "RENOVACION_ITV",
                                          "DUPLICADO_CUVE", "CAMBIO_CARACTERISTICAS"]},
                instructions_es="Escanee recto y verso del Permiso de Circulación",
                faces_required=["recto", "verso"]
            ))

        # CUVE - for transfers, renewals, duplicates
        if sub_type in ["TRANSFERENCIA", "RENOVACION_CUVE", "DUPLICADO_PERMISO", "CAMBIO_CARACTERISTICAS"]:
            requirements.append(DocumentRequirement(
                document_code="cuve",
                document_name_es="CUVE (Cartilla Única de Vehículos)",
                schema_key="CUVE_GQ_V1",
                is_required=True,
                display_order=3,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["TRANSFERENCIA", "RENOVACION_CUVE",
                                          "DUPLICADO_PERMISO", "CAMBIO_CARACTERISTICAS"]},
                instructions_es="Escanee recto y verso de la CUVE",
                faces_required=["recto", "verso"]
            ))

        # ITV - for first registration and renewals
        if sub_type in ["PRIMERA_MATRICULACION", "RENOVACION_ITV", "RENOVACION_CUVE"]:
            requirements.append(DocumentRequirement(
                document_code="itv",
                document_name_es="Tarjeta ITV",
                schema_key="ITV_GQ_V1",
                is_required=True,
                display_order=4,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["PRIMERA_MATRICULACION", "RENOVACION_ITV", "RENOVACION_CUVE"]},
                instructions_es="Escanee recto y verso de la Tarjeta ITV",
                faces_required=["recto", "verso"]
            ))

        # Contrato Compraventa - for transfers
        if sub_type == "TRANSFERENCIA":
            requirements.append(DocumentRequirement(
                document_code="contrato_compraventa",
                document_name_es="Contrato de Compraventa",
                schema_key="CONTRATO_COMPRAVENTA_VEHICULO_GQ_V1",
                is_required=True,
                display_order=5,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["TRANSFERENCIA"]},
                instructions_es="Escanee el contrato de compraventa del vehículo"
            ))

            # DIP of seller
            requirements.append(DocumentRequirement(
                document_code="dip_vendedor",
                document_name_es="DIP del Vendedor",
                schema_key="DIP_GQ_V2",
                is_required=True,
                display_order=6,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["TRANSFERENCIA"]},
                instructions_es="Escanee ambas caras del DIP del vendedor",
                faces_required=["recto", "verso"]
            ))

        # Denuncia - for duplicates (loss/theft)
        if sub_type in ["DUPLICADO_PERMISO", "DUPLICADO_CUVE"]:
            requirements.append(DocumentRequirement(
                document_code="denuncia",
                document_name_es="Denuncia Policial",
                is_required=True,
                display_order=7,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"motivo": ["PERDIDA", "ROBO"]},
                instructions_es="Denuncia de pérdida o robo de la Policía Nacional"
            ))

        # Certificado Reforma - for modifications
        if sub_type == "CAMBIO_CARACTERISTICAS":
            requirements.append(DocumentRequirement(
                document_code="certificado_reforma",
                document_name_es="Certificado de Reforma (ITVE)",
                is_required=True,
                display_order=8,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["CAMBIO_CARACTERISTICAS"]},
                instructions_es="Certificado oficial de ITVE autorizando la reforma"
            ))

        # Factura - for first registration
        if sub_type == "PRIMERA_MATRICULACION":
            requirements.append(DocumentRequirement(
                document_code="factura",
                document_name_es="Factura o Contrato de Adquisición",
                is_required=True,
                display_order=9,
                condition_type=DocumentConditionType.CUSTOM,
                condition_value={"types": ["PRIMERA_MATRICULACION"]},
                instructions_es="Factura de compra del vehículo nuevo o importado"
            ))

        return requirements

    def get_cross_validation_rules(self) -> List[Dict[str, Any]]:
        """Get cross-document validation rules for vehicle requests."""
        return [
            # Matricula coherence across documents
            {
                "id": "matricula_coherente_permiso_cuve",
                "condition": "documents_present: [PERMISO, CUVE]",
                "rule": "PERMISO.vehiculo.matricula == CUVE.vehiculo.matricula",
                "error_es": "La matrícula del Permiso no coincide con la CUVE.",
                "error_fr": "L'immatriculation du Permis ne correspond pas au CUVE.",
                "severity": "error"
            },
            {
                "id": "matricula_coherente_permiso_itv",
                "condition": "documents_present: [PERMISO, ITV]",
                "rule": "PERMISO.vehiculo.matricula == ITV.vehiculo.matricula",
                "error_es": "La matrícula del Permiso no coincide con la ITV.",
                "error_fr": "L'immatriculation du Permis ne correspond pas à l'ITV.",
                "severity": "error"
            },
            {
                "id": "matricula_coherente_cuve_itv",
                "condition": "documents_present: [CUVE, ITV]",
                "rule": "CUVE.vehiculo.matricula == ITV.vehiculo.matricula",
                "error_es": "La matrícula de la CUVE no coincide con la ITV.",
                "error_fr": "L'immatriculation du CUVE ne correspond pas à l'ITV.",
                "severity": "error"
            },
            # VIN/Bastidor coherence
            {
                "id": "bastidor_coherente_permiso_cuve",
                "condition": "documents_present: [PERMISO, CUVE]",
                "rule": "PERMISO.vehiculo.numero_bastidor == CUVE.vehiculo.numero_bastidor",
                "error_es": "El número de bastidor no coincide entre Permiso y CUVE.",
                "error_fr": "Le numéro de châssis ne correspond pas entre le Permis et le CUVE.",
                "severity": "error"
            },
            # Matricula format validation
            {
                "id": "matricula_formato",
                "document": "permiso_circulacion",
                "rule": "vehiculo.matricula MATCHES '^[A-Z]{2}-[0-9]{3}-[A-Z0-9]{1,2}$'",
                "error_es": "El formato de la matrícula es incorrecto. Debe ser: XX-NNN-Y",
                "error_fr": "Le format de l'immatriculation est incorrect. Doit être: XX-NNN-Y",
                "severity": "error"
            },
            # VIN format validation
            {
                "id": "bastidor_formato",
                "document": "permiso_circulacion",
                "rule": "vehiculo.numero_bastidor MATCHES '^[A-HJ-NPR-Z0-9]{17}$'",
                "error_es": "El número de bastidor debe tener 17 caracteres alfanuméricos.",
                "error_fr": "Le numéro de châssis doit avoir 17 caractères alphanumériques.",
                "severity": "error"
            },
            # CUVE not expired (except for renewal)
            {
                "id": "cuve_no_expirada",
                "condition": "tipo NOT IN ['RENOVACION_CUVE']",
                "document": "cuve",
                "rule": "validez.fecha_validez > TODAY",
                "error_es": "La CUVE está expirada.",
                "error_fr": "Le CUVE est expiré.",
                "severity": "error"
            },
            # CUVE expiring soon warning
            {
                "id": "cuve_expirando",
                "document": "cuve",
                "rule": "validez.fecha_validez > TODAY + 30 DAYS",
                "error_es": "La CUVE expira en menos de 30 días.",
                "error_fr": "Le CUVE expire dans moins de 30 jours.",
                "severity": "warning"
            },
            # ITV not expired
            {
                "id": "itv_no_expirada",
                "condition": "tipo NOT IN ['RENOVACION_ITV']",
                "document": "itv",
                "rule": "inspeccion_actual.valedero_hasta > TODAY",
                "error_es": "La ITV está expirada.",
                "error_fr": "L'ITV est expiré.",
                "severity": "error"
            },
            # ITV result must be FAVORABLE
            {
                "id": "itv_favorable",
                "document": "itv",
                "rule": "inspeccion_actual.resultado == 'FAVORABLE'",
                "error_es": "El resultado de la ITV debe ser FAVORABLE.",
                "error_fr": "Le résultat de l'ITV doit être FAVORABLE.",
                "severity": "warning"
            },
            # Owner coherence for TRANSFERENCIA
            {
                "id": "propietario_vendedor_coherente",
                "condition": "tipo == 'TRANSFERENCIA'",
                "rule": """
                    normalize(PERMISO.propietario.apellidos) == normalize(DIP_VENDEDOR.titular.apellidos)
                    AND normalize(PERMISO.propietario.nombre) == normalize(DIP_VENDEDOR.titular.nombres)
                """,
                "error_es": "El propietario en el Permiso no coincide con el vendedor.",
                "error_fr": "Le propriétaire sur le Permis ne correspond pas au vendeur.",
                "severity": "error"
            },
            # Transfer deadline (10 days)
            {
                "id": "transferencia_plazo",
                "condition": "tipo == 'TRANSFERENCIA' AND PERMISO.clasificacion_documento.es_documento_transferido == true",
                "rule": "PERMISO.transferencia.fecha_transferencia + 10 DAYS > TODAY",
                "error_es": "El plazo de 10 días para la transferencia ha expirado.",
                "error_fr": "Le délai de 10 jours pour le transfert a expiré.",
                "severity": "error"
            },
            # Renewal conditions
            {
                "id": "cuve_renovable",
                "condition": "tipo == 'RENOVACION_CUVE'",
                "document": "cuve",
                "rule": "validez.fecha_validez < TODAY + 60 DAYS OR validez.fecha_validez < TODAY",
                "error_es": "Solo puede renovar la CUVE si expira en menos de 60 días.",
                "error_fr": "Vous ne pouvez renouveler le CUVE que s'il expire dans moins de 60 jours.",
                "severity": "info"
            },
            {
                "id": "itv_renovable",
                "condition": "tipo == 'RENOVACION_ITV'",
                "document": "itv",
                "rule": "inspeccion_actual.valedero_hasta < TODAY + 60 DAYS OR inspeccion_actual.valedero_hasta < TODAY",
                "error_es": "Solo puede renovar la ITV si expira en menos de 60 días.",
                "error_fr": "Vous ne pouvez renouveler l'ITV que s'elle expire dans moins de 60 jours.",
                "severity": "info"
            },
            # Official seals/stamps required
            {
                "id": "permiso_sello_oficial",
                "document": "permiso_circulacion",
                "rule": "autenticacion.tiene_sello_oficial == true AND autenticacion.tiene_firma == true",
                "error_es": "El Permiso de Circulación debe tener sello y firma oficiales.",
                "error_fr": "Le Permis de Circulation doit avoir le sceau et la signature officiels.",
                "severity": "error"
            },
            {
                "id": "cuve_sello_ofive",
                "document": "cuve",
                "rule": "autenticacion.tiene_sello_ofive == true AND autenticacion.tiene_qr_code == true",
                "error_es": "La CUVE debe tener sello OFIVE y código QR.",
                "error_fr": "Le CUVE doit avoir le sceau OFIVE et le code QR.",
                "severity": "error"
            }
        ]

    def get_form_mapping(self) -> Dict[str, str]:
        """Get mapping from extracted data to form fields."""
        return {
            # Owner info from DIP
            "propietario_dip": "dip.documento.numero_dip",
            "propietario_apellidos": "dip.titular.apellidos",
            "propietario_nombres": "dip.titular.nombres",

            # Vehicle info from Permiso
            "matricula": "permiso_circulacion.vehiculo.matricula",
            "numero_bastidor": "permiso_circulacion.vehiculo.numero_bastidor",
            "marca": "permiso_circulacion.vehiculo.marca",
            "modelo": "permiso_circulacion.vehiculo.modelo",
            "tipo_vehiculo": "permiso_circulacion.vehiculo.tipo",
            "numero_plazas": "permiso_circulacion.vehiculo.numero_plazas",
            "peso_max": "permiso_circulacion.vehiculo.peso_max_autorizado",

            # From CUVE
            "cuve_referencia": "cuve.documento.numero_referencia",
            "cuve_fecha_validez": "cuve.validez.fecha_validez",
            "cuve_color": "cuve.vehiculo.color",
            "potencia_fiscal": "cuve.motor.potencia_fiscal",
            "tipo_combustible": "cuve.motor.tipo_combustible",

            # From ITV
            "itv_numero_serie": "itv.documento.numero_serie",
            "itv_fecha_inspeccion": "itv.inspeccion_actual.fecha_inspeccion",
            "itv_valedero_hasta": "itv.inspeccion_actual.valedero_hasta",
            "itv_resultado": "itv.inspeccion_actual.resultado",

            # From Contrato (TRANSFERENCIA)
            "fecha_compraventa": "contrato_compraventa.documento.fecha_firma",
            "precio_venta": "contrato_compraventa.transaccion.precio",

            # Seller info (TRANSFERENCIA)
            "vendedor_dip": "dip_vendedor.documento.numero_dip",
            "vendedor_apellidos": "dip_vendedor.titular.apellidos",
            "vendedor_nombres": "dip_vendedor.titular.nombres"
        }

    def get_workflow_code_for_subtype(self, sub_type: str) -> WorkflowCode:
        """Get the specific workflow code for a sub-type."""
        mapping = {
            "PRIMERA_MATRICULACION": WorkflowCode.VEHICULO_PRIMERA_MATRICULACION,
            "TRANSFERENCIA": WorkflowCode.VEHICULO_TRANSFERENCIA,
            "RENOVACION_CUVE": WorkflowCode.VEHICULO_RENOVACION_CUVE,
            "RENOVACION_ITV": WorkflowCode.VEHICULO_RENOVACION_ITV,
            "DUPLICADO_PERMISO": WorkflowCode.VEHICULO_DUPLICADO_PERMISO,
            "DUPLICADO_CUVE": WorkflowCode.VEHICULO_DUPLICADO_CUVE,
            "CAMBIO_CARACTERISTICAS": WorkflowCode.VEHICULO_CAMBIO_CARACTERISTICAS
        }
        return mapping.get(sub_type, WorkflowCode.VEHICULO_PRIMERA_MATRICULACION)

    def get_issuing_entity(self, sub_type: str) -> List[EntityCode]:
        """Get the entities that issue documents for this request type."""
        # What documents are issued by whom
        issuers = {
            "PRIMERA_MATRICULACION": [EntityCode.DGT, EntityCode.OFIVE],
            "TRANSFERENCIA": [EntityCode.DGT],
            "RENOVACION_CUVE": [EntityCode.OFIVE],
            "RENOVACION_ITV": [EntityCode.ITVE],
            "DUPLICADO_PERMISO": [EntityCode.DGT],
            "DUPLICADO_CUVE": [EntityCode.OFIVE],
            "CAMBIO_CARACTERISTICAS": [EntityCode.DGT, EntityCode.OFIVE]
        }
        return issuers.get(sub_type, [EntityCode.DGT])
