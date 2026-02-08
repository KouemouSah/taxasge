# Extranjeria workflows (v2 - PredefinedWorkflow)
# Aligned with Orden Ministerial 01/2021

from .residencia_workflow import ResidenciaWorkflow, get_residencia_workflow
from .prorroga_workflow import ProrrogaVisadoWorkflow, get_prorroga_visado_workflow

__all__ = [
    "ResidenciaWorkflow",
    "get_residencia_workflow",
    "ProrrogaVisadoWorkflow",
    "get_prorroga_visado_workflow",
]
