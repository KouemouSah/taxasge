"""
Assignment Module - Gestion des Assignations
Module pour l'assignation automatique et manuelle des déclarations aux agents
"""

from .permissions import register_assignment_permissions

__version__ = "1.0.0"

# NOTE: Permission registration is called in main.py during startup (lifespan)
# DO NOT call register_assignment_permissions() here to avoid circular imports
