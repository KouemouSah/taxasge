"""
Declarations Module Permissions - Centralized permission definitions

This file defines all permissions for the Declarations module and registers them
with the PermissionRegistry at startup.

Permissions follow the format: resource.action
"""

from app.modules.permissions.services.permission_registry import PermissionRegistry


# Declarations permissions (name, resource, action, description, is_critical)
DECLARATIONS_PERMISSIONS = [
    # View/Read permissions
    (
        "declarations.view",
        "declarations",
        "view",
        "Ver detalles de declaración fiscal",
        False
    ),
    (
        "declarations.list",
        "declarations",
        "list",
        "Listar declaraciones fiscales",
        False
    ),
    (
        "declarations.search",
        "declarations",
        "search",
        "Buscar declaraciones (búsqueda avanzada)",
        False
    ),

    # Create/Edit permissions
    (
        "declarations.create",
        "declarations",
        "create",
        "Crear nueva declaración fiscal",
        False
    ),
    (
        "declarations.update",
        "declarations",
        "update",
        "Actualizar declaración fiscal (borrador)",
        False
    ),
    (
        "declarations.delete",
        "declarations",
        "delete",
        "Eliminar declaración (solo borradores)",
        False
    ),

    # Workflow permissions
    (
        "declarations.submit",
        "declarations",
        "submit",
        "Enviar declaración para procesamiento",
        False
    ),
    (
        "declarations.withdraw",
        "declarations",
        "withdraw",
        "Retirar declaración enviada (antes de revisión)",
        False
    ),

    # Document management
    (
        "declarations.upload_documents",
        "declarations",
        "upload_documents",
        "Subir documentos adjuntos",
        False
    ),
    (
        "declarations.view_documents",
        "declarations",
        "view_documents",
        "Ver documentos adjuntos",
        False
    ),
    (
        "declarations.delete_documents",
        "declarations",
        "delete_documents",
        "Eliminar documentos adjuntos",
        False
    ),

    # Processing permissions (operators/admin)
    (
        "declarations.assign",
        "declarations",
        "assign",
        "Asignar declaración a operador",
        False
    ),
    (
        "declarations.review",
        "declarations",
        "review",
        "Revisar declaración (cambiar a 'processing')",
        False
    ),
    (
        "declarations.approve",
        "declarations",
        "approve",
        "Aprobar declaración fiscal",
        True  # Critical permission
    ),
    (
        "declarations.reject",
        "declarations",
        "reject",
        "Rechazar declaración fiscal",
        True  # Critical permission
    ),
    (
        "declarations.request_clarification",
        "declarations",
        "request_clarification",
        "Solicitar aclaración/corrección",
        False
    ),

    # Administrative permissions
    (
        "declarations.bulk_operations",
        "declarations",
        "bulk_operations",
        "Operaciones en masa",
        True  # Critical permission
    ),
    (
        "declarations.view_all",
        "declarations",
        "view_all",
        "Ver todas las declaraciones (admin)",
        False
    ),
    (
        "declarations.export",
        "declarations",
        "export",
        "Exportar datos de declaraciones",
        False
    ),
    (
        "declarations.statistics",
        "declarations",
        "statistics",
        "Ver estadísticas de declaraciones",
        False
    ),

    # Payment-related permissions
    (
        "declarations.mark_paid",
        "declarations",
        "mark_paid",
        "Marcar como pagada",
        True  # Critical permission
    ),
    (
        "declarations.update_payment_info",
        "declarations",
        "update_payment_info",
        "Actualizar información de pago",
        False
    ),

    # Workflow tracking
    (
        "declarations.view_workflow",
        "declarations",
        "view_workflow",
        "Ver estado del flujo de trabajo",
        False
    ),
    (
        "declarations.view_activity_log",
        "declarations",
        "view_activity_log",
        "Ver registro de actividades",
        False
    ),
]


def register_declarations_permissions():
    """
    Register Declarations module permissions with the PermissionRegistry

    This should be called at application startup
    """
    PermissionRegistry.register_module_permissions(
        module_name="declarations",
        permissions=DECLARATIONS_PERMISSIONS
    )
