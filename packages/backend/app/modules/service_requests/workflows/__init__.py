# Workflows exports

# =============================================================================
# NEW ARCHITECTURE (v2) - Autonomous workflows
# =============================================================================

# Core interfaces and dataclasses
from .workflow_interface import (
    WorkflowInterface,
    PredefinedWorkflow,
    WorkflowStep,
    WorkflowContext,
    ValidationResult,
    DocumentRequirement,
    TariffConfig,
    SupplementDefinition,
    StepType,
    RenovacionMotivo,
)

# Pasaporte workflow v2 (autonomous)
from .pasaporte_workflow_v2 import (
    PasaporteWorkflow,
    get_pasaporte_workflow
)

# Conducir workflow v2 (autonomous) - Migrated 2026-02-05
from .conducir_workflow import (
    ConducirWorkflow,
    LicenseClass,
    ApplicantType,
    DuplicadoMotivo,
    get_conducir_workflow
)

# Contrato workflow v2 (autonomous) - Migrated 2026-02-06
from .contrato_workflow import ContratoWorkflow

# =============================================================================
# LEGACY (v1) - For backward compatibility
# =============================================================================

# Legacy BaseWorkflow (still used by some workflows)
from .base_workflow import BaseWorkflow
from .residencia_workflow import (
    ResidenciaWorkflow,
    ResidenciaPhase,
    ResidenciaCategory
)
from .vehiculo_workflow import (
    VehiculoWorkflow,
    VehicleType,
    VehicleService
)
# Conducir workflow moved to v2 section above

# FuncionPublica workflows
from .funcion_publica import (
    VerificacionFuncionarioWorkflow,
    CarnetFuncionarioWorkflow,
    PromocionAdministrativaWorkflow,
    PermisoExtraordinarioWorkflow,
    CertificadoAdministrativoWorkflow
)
from .funcion_publica.permiso_workflow import PermisoMotivo
from .funcion_publica.certificado_workflow import CertificadoTipo

# Generic workflows (data-driven from database)
from .generic_workflow import (
    GenericWorkflowStandard,
    GenericWorkflowDirectPayment,
    load_generic_workflow
)

__all__ = [
    # === NEW (v2) ===
    # Protocol and base class
    "WorkflowInterface",
    "PredefinedWorkflow",
    # Core dataclasses
    "WorkflowStep",
    "WorkflowContext",
    "ValidationResult",
    "DocumentRequirement",
    "TariffConfig",
    "SupplementDefinition",
    "StepType",
    "RenovacionMotivo",
    # Pasaporte v2
    "PasaporteWorkflow",
    "get_pasaporte_workflow",
    # Conducir v2
    "ConducirWorkflow",
    "LicenseClass",
    "ApplicantType",
    "DuplicadoMotivo",
    "get_conducir_workflow",

    # Contrato v2
    "ContratoWorkflow",

    # === LEGACY (v1) ===
    "BaseWorkflow",
    # Residencia workflow (3 phases)
    "ResidenciaWorkflow",
    "ResidenciaPhase",
    "ResidenciaCategory",
    # Vehiculo workflow (RBC)
    "VehiculoWorkflow",
    "VehicleType",
    "VehicleService",
    # FuncionPublica workflows (MINFP)
    "VerificacionFuncionarioWorkflow",
    "CarnetFuncionarioWorkflow",
    "PromocionAdministrativaWorkflow",
    "PermisoExtraordinarioWorkflow",
    "CertificadoAdministrativoWorkflow",
    "PermisoMotivo",
    "CertificadoTipo",
    # Generic workflows (data-driven)
    "GenericWorkflowStandard",
    "GenericWorkflowDirectPayment",
    "load_generic_workflow"
]
