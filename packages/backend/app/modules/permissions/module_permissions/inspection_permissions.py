"""
Inspection Module Permissions

Defines all permissions for field inspections, seal management,
reconciliation, and mise en demeure operations.

Note: Uses SINGULAR resource name (inspection) per convention.
"""

MODULE_NAME = "inspection"

# Format: (name, resource, action, description_es, is_critical)
PERMISSIONS = [
    # =========================================================================
    # FIELD INSPECTION CRUD
    # =========================================================================
    (
        "inspection.create",
        "inspection",
        "create",
        "Crear inspección de campo",
        False
    ),
    (
        "inspection.view_own",
        "inspection",
        "view_own",
        "Ver inspecciones propias",
        False
    ),
    (
        "inspection.view_entity",
        "inspection",
        "view_entity",
        "Ver inspecciones de la entidad (supervisor dashboard)",
        False
    ),
    # =========================================================================
    # PAYMENT COLLECTION (Field agents)
    # =========================================================================
    (
        "inspection.collect_payment",
        "inspection",
        "collect_payment",
        "Recaudar pago en campo",
        True
    ),
    # =========================================================================
    # RECONCILIATION (Supervisor validates field payments)
    # =========================================================================
    (
        "inspection.reconcile_validate",
        "inspection",
        "reconcile_validate",
        "Validar reconciliación de pagos de campo",
        True
    ),
    # =========================================================================
    # SEAL MANAGEMENT
    # =========================================================================
    (
        "inspection.seal_propose",
        "inspection",
        "seal_propose",
        "Proponer sellado de establecimiento",
        True
    ),
    (
        "inspection.seal_approve",
        "inspection",
        "seal_approve",
        "Aprobar o rechazar sellado propuesto",
        True
    ),
    # =========================================================================
    # MISE EN DEMEURE (Formal notice)
    # =========================================================================
    (
        "inspection.mise_en_demeure",
        "inspection",
        "mise_en_demeure",
        "Emitir mise en demeure (requerimiento formal)",
        True
    ),
    # =========================================================================
    # PERFORMANCE (view agent stats)
    # =========================================================================
    (
        "inspection.view_performance",
        "inspection",
        "view_performance",
        "Ver rendimiento de agentes de inspección",
        False
    ),
]


# Default role permissions mapping
ROLE_PERMISSIONS = {
    "admin": ["*"],  # All permissions

    # Supervisors see entity dashboard, approve seals, validate reconciliation
    "supervisor": [
        "inspection.view_entity",
        "inspection.view_own",
        "inspection.reconcile_validate",
        "inspection.seal_approve",
        "inspection.view_performance",
    ],

    # Field agents create inspections, collect payments, propose seals
    "agent": [
        "inspection.create",
        "inspection.view_own",
        "inspection.collect_payment",
        "inspection.seal_propose",
        "inspection.mise_en_demeure",
    ],
}
