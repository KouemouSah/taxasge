"""
Assignment Module Permissions - Centralized permission definitions

This file defines all permissions for the Assignment module and registers them
with the PermissionRegistry at startup.

Permissions follow the format: resource.action
"""

from app.modules.permissions.services.permission_registry import PermissionRegistry


# Assignment permissions (name, resource, action, description, is_critical)
ASSIGNMENT_PERMISSIONS = [
    # View permissions
    (
        "assignment.view",
        "assignment",
        "view",
        "Ver detalles de asignación",
        False
    ),
    (
        "assignment.list",
        "assignment",
        "list",
        "Listar asignaciones",
        False
    ),

    # Create permissions
    (
        "assignment.create",
        "assignment",
        "create",
        "Crear asignación manual",
        False
    ),
    (
        "assignment.auto_assign",
        "assignment",
        "auto_assign",
        "Ejecutar asignación automática",
        False
    ),

    # Agent actions
    (
        "assignment.start",
        "assignment",
        "start",
        "Iniciar procesamiento de asignación",
        False
    ),
    (
        "assignment.complete",
        "assignment",
        "complete",
        "Completar asignación",
        False
    ),

    # Management actions (supervisor only)
    (
        "assignment.reassign",
        "assignment",
        "reassign",
        "Reasignar declaración a nuevo agente",
        True  # Critical permission
    ),
    (
        "assignment.reassign_in_progress",
        "assignment",
        "reassign_in_progress",
        "Reasignar tarea EN CURSO (crítico)",
        True  # Critical permission - requires special approval
    ),
    (
        "assignment.cancel",
        "assignment",
        "cancel",
        "Cancelar asignación",
        True  # Critical permission
    ),
    (
        "assignment.update_priority",
        "assignment",
        "update_priority",
        "Actualizar prioridad de asignación",
        False
    ),
    (
        "assignment.extend_deadline",
        "assignment",
        "extend_deadline",
        "Extender fecha límite de asignación",
        False
    ),

    # === RULES MANAGEMENT ===
    (
        "rules.view",
        "rules",
        "view",
        "Ver reglas de asignación",
        False
    ),
    (
        "rules.create",
        "rules",
        "create",
        "Crear reglas de asignación",
        False
    ),
    (
        "rules.edit",
        "rules",
        "edit",
        "Editar reglas de asignación",
        False
    ),
    (
        "rules.activate",
        "rules",
        "activate",
        "Activar/desactivar reglas",
        False
    ),
    (
        "rules.delete",
        "rules",
        "delete",
        "Eliminar reglas de asignación",
        True  # Critical permission
    ),
    (
        "rules.view_effectiveness",
        "rules",
        "view_effectiveness",
        "Ver reporte de eficacia de reglas",
        False
    ),

    # === REPORTS ===
    (
        "reports.view",
        "reports",
        "view",
        "Ver reportes de asignación",
        False
    ),
    (
        "reports.generate",
        "reports",
        "generate",
        "Generar reportes",
        False
    ),
    (
        "reports.edit",
        "reports",
        "edit",
        "Editar reportes generados",
        True  # Critical permission
    ),
    (
        "reports.export_pdf",
        "reports",
        "export_pdf",
        "Exportar reporte en PDF",
        False
    ),
    (
        "reports.export_excel",
        "reports",
        "export_excel",
        "Exportar reporte en Excel",
        False
    ),

    # === DASHBOARD ===
    (
        "dashboard.view",
        "dashboard",
        "view",
        "Ver dashboard de supervisor",
        False
    ),
    (
        "dashboard.team_stats",
        "dashboard",
        "team_stats",
        "Ver estadísticas de equipo",
        False
    ),
    (
        "dashboard.agent_stats",
        "dashboard",
        "agent_stats",
        "Ver estadísticas de agente específico",
        False
    ),

    # === AGENT MANAGEMENT ===
    (
        "agents.view",
        "agents",
        "view",
        "Ver lista de agentes",
        False
    ),
    (
        "agents.view_workload",
        "agents",
        "view_workload",
        "Ver carga de trabajo de agentes",
        False
    ),
    (
        "agents.view_performance",
        "agents",
        "view_performance",
        "Ver rendimiento de agentes",
        False
    ),
]


def register_assignment_permissions():
    """
    Register Assignment module permissions with the PermissionRegistry

    This should be called at application startup (in __init__.py)
    """
    PermissionRegistry.register_module_permissions(
        module_name="assignment",
        permissions=ASSIGNMENT_PERMISSIONS
    )
