# Workflows exports
from .base_workflow import (
    BaseWorkflow,
    WorkflowStep,
    WorkflowContext,
    ValidationResult,
    DocumentRequirement,
    TariffConfig,
    StepType
)
from .pasaporte_workflow import PasaporteWorkflow
from .contrato_workflow import ContratoWorkflow
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
from .conducir_workflow import (
    ConducirWorkflow,
    LicenseClass,
    ApplicantType
)
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

__all__ = [
    # Base classes
    "BaseWorkflow",
    "WorkflowStep",
    "WorkflowContext",
    "ValidationResult",
    "DocumentRequirement",
    "TariffConfig",
    "StepType",
    # Pasaporte workflow
    "PasaporteWorkflow",
    # Contrato workflow
    "ContratoWorkflow",
    # Residencia workflow (3 phases)
    "ResidenciaWorkflow",
    "ResidenciaPhase",
    "ResidenciaCategory",
    # Vehiculo workflow (RBC)
    "VehiculoWorkflow",
    "VehicleType",
    "VehicleService",
    # Conducir workflow (exam)
    "ConducirWorkflow",
    "LicenseClass",
    "ApplicantType",
    # FuncionPublica workflows (MINFP)
    "VerificacionFuncionarioWorkflow",
    "CarnetFuncionarioWorkflow",
    "PromocionAdministrativaWorkflow",
    "PermisoExtraordinarioWorkflow",
    "CertificadoAdministrativoWorkflow",
    "PermisoMotivo",
    "CertificadoTipo"
]
