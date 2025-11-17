"""
Assignment Module - Gestion des Assignations
Module pour l'assignation automatique et manuelle des déclarations aux agents
"""

from .permissions import register_assignment_permissions

__version__ = "1.0.0"

# Register permissions at module import
register_assignment_permissions()
