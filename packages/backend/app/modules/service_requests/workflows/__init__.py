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

# PromocionAdministrativa workflow v2 (autonomous) - Migrated 2026-02-07
from .funcion_publica.promocion_workflow import (
    PromocionAdministrativaWorkflow,
    PromocionType,
    get_promocion_administrativa_workflow,
)

# CarnetFuncionario workflow v2 (autonomous) - Migrated 2026-02-07
from .funcion_publica.carnet_workflow import (
    CarnetFuncionarioWorkflow,
    get_carnet_funcionario_workflow,
)

# VerificacionFuncionario workflow v2 (autonomous) - Migrated 2026-02-07
from .funcion_publica.verificacion_workflow import (
    VerificacionFuncionarioWorkflow,
    get_verificacion_funcionario_workflow,
)

# PermisoExtraordinario workflow v2 (autonomous) - Migrated 2026-02-07
from .funcion_publica.permiso_workflow import (
    PermisoExtraordinarioWorkflow,
    PermisoMotivo,
    get_permiso_extraordinario_workflow,
)

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

# FuncionPublica workflows (remaining v1)
from .funcion_publica import (
    CertificadoAdministrativoWorkflow
)
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
    # PromocionAdministrativa v2
    "PromocionAdministrativaWorkflow",
    "PromocionType",
    "get_promocion_administrativa_workflow",
    # CarnetFuncionario v2
    "CarnetFuncionarioWorkflow",
    "get_carnet_funcionario_workflow",
    # VerificacionFuncionario v2
    "VerificacionFuncionarioWorkflow",
    "get_verificacion_funcionario_workflow",
    # PermisoExtraordinario v2
    "PermisoExtraordinarioWorkflow",
    "PermisoMotivo",
    "get_permiso_extraordinario_workflow",

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
    # FuncionPublica workflows (MINFP) - remaining v1
    "CertificadoAdministrativoWorkflow",
    "CertificadoTipo",
    # Generic workflows (data-driven)
    "GenericWorkflowStandard",
    "GenericWorkflowDirectPayment",
    "load_generic_workflow"
]
