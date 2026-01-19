"""
Menu Configuration Module Permissions

Defines all permissions for menu and dashboard configuration:
- Menu template management
- Workflow menu mapping management
- Role menu configuration
- Dashboard widget configuration

Note: Uses SINGULAR resource names and DOT notation per convention.
      NEVER use colon format (menu:manage is WRONG, use menu.manage)

Created: 2026-01-19
"""

MODULE_NAME = "menu"

# Format: (name, resource, action, description_es, is_critical)
PERMISSIONS = [
    # =========================================================================
    # MENU TEMPLATE MANAGEMENT
    # =========================================================================
    (
        "menu.view_templates",
        "menu",
        "view_templates",
        "Ver plantillas de menú",
        False
    ),
    (
        "menu.create_template",
        "menu",
        "create_template",
        "Crear plantillas de menú",
        True  # Critical - affects agent UI
    ),
    (
        "menu.update_template",
        "menu",
        "update_template",
        "Actualizar plantillas de menú",
        True  # Critical - affects agent UI
    ),
    (
        "menu.delete_template",
        "menu",
        "delete_template",
        "Eliminar plantillas de menú",
        True  # Critical - affects agent UI
    ),

    # =========================================================================
    # WORKFLOW MENU MAPPING MANAGEMENT
    # =========================================================================
    (
        "menu.view_mappings",
        "menu",
        "view_mappings",
        "Ver mapeos de workflow a menú",
        False
    ),
    (
        "menu.create_mapping",
        "menu",
        "create_mapping",
        "Crear mapeos de workflow a menú",
        True  # Critical - affects menu generation
    ),
    (
        "menu.update_mapping",
        "menu",
        "update_mapping",
        "Actualizar mapeos de workflow a menú",
        True  # Critical - affects menu generation
    ),
    (
        "menu.delete_mapping",
        "menu",
        "delete_mapping",
        "Eliminar mapeos de workflow a menú",
        True  # Critical - affects menu generation
    ),

    # =========================================================================
    # ROLE MENU CONFIGURATION
    # =========================================================================
    (
        "menu.view_role_config",
        "menu",
        "view_role_config",
        "Ver configuración de menú de roles",
        False
    ),
    (
        "menu.update_role_config",
        "menu",
        "update_role_config",
        "Actualizar configuración de menú de roles",
        True  # Critical - affects agent menus
    ),

    # =========================================================================
    # DASHBOARD WIDGET CONFIGURATION
    # =========================================================================
    (
        "menu.view_dashboard_config",
        "menu",
        "view_dashboard_config",
        "Ver configuración de dashboard",
        False
    ),
    (
        "menu.update_dashboard_config",
        "menu",
        "update_dashboard_config",
        "Actualizar configuración de dashboard",
        True  # Critical - affects agent dashboards
    ),

    # =========================================================================
    # ADMIN FULL ACCESS
    # =========================================================================
    (
        "menu.manage",
        "menu",
        "manage",
        "Gestión completa de menús y dashboards",
        True  # Critical - full admin access
    ),
]


def get_permissions():
    """Return all menu configuration permissions."""
    return PERMISSIONS


def get_permission_names():
    """Return list of permission names only."""
    return [p[0] for p in PERMISSIONS]


def get_critical_permissions():
    """Return only critical permissions (is_critical=True)."""
    return [p for p in PERMISSIONS if p[4] is True]
