"""
Treasury Module Permissions

Defines all permissions for treasury operations:
- Payment validation
- Audit trail viewing
- Statistics and reporting
- Anomaly detection
- Export operations

Note: Uses SINGULAR resource names and DOT notation per convention.
      For compound resources, use underscore: treasury_audit, treasury_export
"""

MODULE_NAME = "treasury"

# Format: (name, resource, action, description_es, is_critical)
PERMISSIONS = [
    # =========================================================================
    # PAYMENT VALIDATION
    # =========================================================================
    (
        "treasury.validate_payment",
        "treasury",
        "validate_payment",
        "Validar pagos manuales (efectivo, cheque)",
        True  # Critical - confirms money received
    ),
    (
        "treasury.reject_payment",
        "treasury",
        "reject_payment",
        "Rechazar pago",
        True
    ),
    (
        "treasury.view_payment",
        "treasury",
        "view_payment",
        "Ver detalles de pagos",
        False
    ),
    (
        "treasury.process_payment",
        "treasury",
        "process_payment",
        "Procesar pagos pendientes",
        True
    ),

    # =========================================================================
    # AUDIT OPERATIONS
    # =========================================================================
    (
        "treasury_audit.view",
        "treasury_audit",
        "view",
        "Ver historial de auditoría de tesorería",
        False
    ),
    (
        "treasury_audit.export",
        "treasury_audit",
        "export",
        "Exportar registros de auditoría",
        False
    ),

    # =========================================================================
    # STATISTICS & REPORTING
    # =========================================================================
    (
        "treasury_stat.view",
        "treasury_stat",
        "view",
        "Ver estadísticas de tesorería",
        False
    ),
    (
        "treasury_stat.export",
        "treasury_stat",
        "export",
        "Exportar estadísticas",
        False
    ),

    # =========================================================================
    # ANOMALY DETECTION
    # =========================================================================
    (
        "treasury_anomaly.view",
        "treasury_anomaly",
        "view",
        "Ver anomalías detectadas",
        False
    ),
    (
        "treasury_anomaly.create",
        "treasury_anomaly",
        "create",
        "Crear reporte de anomalía manual",
        False
    ),
    (
        "treasury_anomaly.update",
        "treasury_anomaly",
        "update",
        "Actualizar estado de anomalía",
        False
    ),
    (
        "treasury_anomaly.resolve",
        "treasury_anomaly",
        "resolve",
        "Marcar anomalía como resuelta",
        True  # Critical - closes investigation
    ),

    # =========================================================================
    # EXPORT OPERATIONS
    # =========================================================================
    (
        "treasury_export.view",
        "treasury_export",
        "view",
        "Ver exportaciones disponibles",
        False
    ),
    (
        "treasury_export.create",
        "treasury_export",
        "create",
        "Crear nueva exportación",
        False
    ),
    (
        "treasury_export.download",
        "treasury_export",
        "download",
        "Descargar archivos exportados",
        False
    ),

    # =========================================================================
    # RECONCILIATION
    # =========================================================================
    (
        "treasury.reconcile",
        "treasury",
        "reconcile",
        "Ejecutar reconciliación bancaria",
        True  # Critical - financial operation
    ),
    (
        "treasury.view_reconciliation",
        "treasury",
        "view_reconciliation",
        "Ver estado de reconciliación",
        False
    ),

    # =========================================================================
    # SETTINGS MANAGEMENT (Supervisor only)
    # =========================================================================
    (
        "treasury.manage_settings",
        "treasury",
        "manage_settings",
        "Gestionar configuración de tesorería (bancos, métodos de pago)",
        True  # Critical - affects payment processing
    ),
]


# Default role permissions mapping
# NOTE: After Migration 051, agent types are determined by agent_profiles
# Treasury-specific permissions are granted to agents with agent_category='treasury'
# This is checked at runtime via agent_profiles.ministry_id → ministries.ministry_code='TESORO'
ROLE_PERMISSIONS = {
    "admin": ["*"],  # All permissions

    # Supervisors (agent_profiles.is_supervisor = true)
    "supervisor": [
        # View and some management
        "treasury.view_payment",
        "treasury.validate_payment",
        "treasury_audit.view",
        "treasury_stat.view",
        "treasury_anomaly.view",
        "treasury_anomaly.update",
        "treasury_export.view",
        "treasury_export.download",
        "treasury.view_reconciliation",
        "treasury.manage_settings",  # Settings management - supervisor only
    ],

    # Generic agent role - treasury-specific permissions are granted
    # to agents with agent_category='treasury' at runtime
    # Base permissions for all agents
    "agent": [
        "treasury.view_payment",
        "treasury_stat.view",
    ],
}
