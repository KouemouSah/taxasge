"""
Company Permissions — RBAC permissions for company management.

Covers:
- User-scoped company CRUD (business users via company roles)
- Admin-scoped company management (fiscal admin)
- Company verification workflow
- Member management
"""

MODULE_NAME = "company"

PERMISSIONS = [
    # --- View ---
    ("company.view",           "company", "view",           "Ver detalles de empresa",               False),
    ("company.view_all",       "company", "view_all",       "Ver todas las empresas (admin)",         False),
    ("company.view_stats",     "company", "view_stats",     "Ver estadisticas de empresas",           False),

    # --- Mutations ---
    ("company.create",         "company", "create",         "Crear nuevas empresas",                 True),
    ("company.update",         "company", "update",         "Modificar datos de empresa",            True),
    ("company.delete",         "company", "delete",         "Eliminar empresa",                      True),

    # --- Verification ---
    ("company.verify",         "company", "verify",         "Verificar/aprobar empresa",             True),

    # --- Members ---
    ("company.manage_members", "company", "manage_members", "Gestionar miembros de empresa",         True),
]

ROLE_PERMISSIONS = {
    # Full access
    "admin": ["*"],
    "super_admin": ["*"],

    # Treasury supervisors — read-only across all companies
    "supervisor_tesoro": [
        "company.view",
        "company.view_all",
        "company.view_stats",
    ],

    # OMS polyvalent agent — view for license workflows
    "agent_oms_polyvalent": [
        "company.view",
        "company.view_all",
    ],

    # ONRC agents — company registration entity
    "agent_onrc": [
        "company.view",
        "company.view_all",
        "company.create",
        "company.update",
        "company.verify",
    ],
    "supervisor_onrc": [
        "company.view",
        "company.view_all",
        "company.view_stats",
        "company.create",
        "company.update",
        "company.verify",
        "company.manage_members",
    ],

    # Commerce ministry agents — need company view for license management
    "agent_min_comercio": [
        "company.view",
        "company.view_all",
    ],
    "supervisor_min_comercio": [
        "company.view",
        "company.view_all",
        "company.view_stats",
    ],
}
