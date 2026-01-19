-- ============================================================================
-- Migration 063: Add menu_config and dashboard_config to roles table
-- ============================================================================
-- Purpose: Enable dynamic menu and dashboard configuration per role
--
-- Changes:
--   1. ALTER TABLE roles: Add menu_config, dashboard_config, ui_config JSONB columns
--   2. ALTER TABLE agent_profiles: Add menu_overrides, dashboard_overrides JSONB columns
--   3. CREATE TABLE menu_templates: Reusable menu templates
--   4. CREATE TABLE workflow_menu_mapping: Auto-generation rules for workflow-based menus
--   5. SEED DATA: Default workflow mappings and role menu configs
--
-- Author: Claude Code Expert
-- Date: 2026-01-19
-- ============================================================================

BEGIN;

-- =============================================================================
-- 1. ALTER TABLE: roles - Add configuration columns
-- =============================================================================

-- Menu configuration (JSONB)
-- Stores the menu structure for this role
-- NULL = use auto-generation from entity.workflow_codes (for workflow-based agents)
ALTER TABLE roles ADD COLUMN IF NOT EXISTS menu_config JSONB DEFAULT NULL;
COMMENT ON COLUMN roles.menu_config IS 'Configuration des menus pour ce role (JSON). NULL = utiliser generation auto depuis entity.workflow_codes';

-- Dashboard configuration (JSONB)
-- Stores widgets/cards configuration for dashboard
ALTER TABLE roles ADD COLUMN IF NOT EXISTS dashboard_config JSONB DEFAULT NULL;
COMMENT ON COLUMN roles.dashboard_config IS 'Configuration du dashboard pour ce role (widgets, cards, layout). NULL = dashboard par defaut';

-- UI preferences (JSONB)
-- Stores UI customization options
ALTER TABLE roles ADD COLUMN IF NOT EXISTS ui_config JSONB DEFAULT NULL;
COMMENT ON COLUMN roles.ui_config IS 'Preferences UI (theme, raccourcis, options affichage). NULL = valeurs par defaut';

-- =============================================================================
-- 2. ALTER TABLE: agent_profiles - Add per-agent override columns
-- =============================================================================

-- Per-agent menu override (JSONB)
-- Allows individual agent customization beyond role defaults
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS menu_overrides JSONB DEFAULT NULL;
COMMENT ON COLUMN agent_profiles.menu_overrides IS 'Surcharges de menu specifiques a cet agent (override role config)';

-- Per-agent dashboard override (JSONB)
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS dashboard_overrides JSONB DEFAULT NULL;
COMMENT ON COLUMN agent_profiles.dashboard_overrides IS 'Surcharges de dashboard specifiques a cet agent';

-- =============================================================================
-- 3. CREATE TABLE: menu_templates (Optional - for reusable templates)
-- =============================================================================

CREATE TABLE IF NOT EXISTS menu_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Type of menu template
    template_type VARCHAR(30) NOT NULL DEFAULT 'workflow'
        CHECK (template_type IN ('workflow', 'module', 'custom')),

    -- Entity scope (NULL = global/reusable)
    entity_code VARCHAR(50),

    -- Menu structure (JSON)
    menu_structure JSONB NOT NULL,

    -- Dashboard widgets for this template
    dashboard_widgets JSONB,

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

COMMENT ON TABLE menu_templates IS 'Templates de menu reutilisables pour differents types d''agents';

-- Indexes for menu_templates
CREATE INDEX IF NOT EXISTS idx_menu_templates_code ON menu_templates(code);
CREATE INDEX IF NOT EXISTS idx_menu_templates_entity ON menu_templates(entity_code);
CREATE INDEX IF NOT EXISTS idx_menu_templates_type ON menu_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_menu_templates_active ON menu_templates(is_active) WHERE is_active = TRUE;

-- =============================================================================
-- 4. CREATE TABLE: workflow_menu_mapping (Auto-generation rules)
-- =============================================================================

CREATE TABLE IF NOT EXISTS workflow_menu_mapping (
    id SERIAL PRIMARY KEY,

    -- Workflow pattern (e.g., 'PASAPORTE_%', 'RESIDENCIA_%')
    workflow_pattern VARCHAR(100) NOT NULL,

    -- Menu configuration for this pattern
    menu_group_id VARCHAR(50) NOT NULL,  -- e.g., 'pasaportes', 'residencias'
    menu_title_key VARCHAR(100) NOT NULL,  -- e.g., 'agent.nav.passports'
    menu_icon VARCHAR(50) NOT NULL,  -- e.g., 'Plane', 'Globe'
    display_order INT DEFAULT 0,

    -- Standard sub-menus to include
    include_pending BOOLEAN DEFAULT TRUE,
    include_validation BOOLEAN DEFAULT TRUE,
    include_appointments BOOLEAN DEFAULT FALSE,
    include_history BOOLEAN DEFAULT TRUE,

    -- Permissions required
    permission_prefix VARCHAR(50),  -- e.g., 'service_requests'

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE workflow_menu_mapping IS 'Regles de generation automatique de menus depuis les codes workflow';

-- Unique constraint on workflow_pattern
CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_menu_mapping_pattern
    ON workflow_menu_mapping(workflow_pattern);

-- Index for active mappings
CREATE INDEX IF NOT EXISTS idx_workflow_menu_mapping_active
    ON workflow_menu_mapping(is_active) WHERE is_active = TRUE;

-- =============================================================================
-- 5. SEED DATA: Default workflow menu mappings
-- =============================================================================

INSERT INTO workflow_menu_mapping (
    workflow_pattern, menu_group_id, menu_title_key, menu_icon,
    display_order, include_appointments, permission_prefix
) VALUES
    -- Pasaportes (CNEDOGE_PASAPORTE)
    ('PASAPORTE_%', 'pasaportes', 'agent.nav.passports', 'Plane', 1, TRUE, 'service_requests'),

    -- Residencias (CNEDOGE_RESIDENCIA)
    ('RESIDENCIA_%', 'residencias', 'agent.nav.residences', 'Globe', 2, TRUE, 'service_requests'),

    -- Conducir (DGT)
    ('CONDUCIR_%', 'licencias', 'agent.nav.licenses', 'Car', 1, TRUE, 'service_requests'),

    -- Vehiculos (DGT/ITVE)
    ('VEHICULO_%', 'vehiculos', 'agent.nav.vehicles', 'Car', 2, TRUE, 'service_requests'),

    -- Contratos (ONRC)
    ('CONTRATO_%', 'contratos', 'agent.nav.contracts', 'FileSignature', 1, FALSE, 'service_requests'),

    -- Extranjeria
    ('VISADO_%', 'visados', 'agent.nav.visas', 'Globe', 1, TRUE, 'service_requests'),
    ('PERMISO_TRABAJO_%', 'permisos_trabajo', 'agent.nav.workPermits', 'Briefcase', 2, TRUE, 'service_requests'),

    -- Cedula (CNEDOGE)
    ('CEDULA_%', 'cedulas', 'agent.nav.idCards', 'CreditCard', 3, TRUE, 'service_requests'),

    -- Acta (CNEDOGE)
    ('ACTA_%', 'actas', 'agent.nav.certificates', 'FileText', 4, FALSE, 'service_requests')
ON CONFLICT (workflow_pattern) DO NOTHING;

-- =============================================================================
-- 6. SEED DATA: Default role menu configs (Module-Based - TESORO)
-- =============================================================================

-- supervisor_tesoro - Full treasury access
UPDATE roles SET menu_config = '{
    "version": "1.0",
    "source": "role",
    "menus": [
        {
            "id": "dashboard",
            "titleKey": "agent.nav.dashboard",
            "href": "/dashboard/agent/treasury",
            "icon": "LayoutDashboard"
        },
        {
            "id": "payments",
            "titleKey": "agent.nav.payments",
            "icon": "CreditCard",
            "permission": "treasury.view_payment",
            "items": [
                {"id": "validation", "titleKey": "agent.nav.validation", "href": "/dashboard/agent/treasury/validation", "icon": "CheckCircle", "permission": "treasury.validate_payment"},
                {"id": "reconciliation", "titleKey": "agent.nav.reconciliation", "href": "/dashboard/agent/treasury/reconciliation", "icon": "RefreshCw", "permission": "treasury.reconcile"},
                {"id": "transactions", "titleKey": "agent.nav.transactions", "href": "/dashboard/agent/treasury/transactions", "icon": "History", "permission": "treasury.view_payment"}
            ]
        },
        {
            "id": "reports",
            "titleKey": "agent.nav.reports",
            "icon": "BarChart3",
            "permission": "treasury_stat.view",
            "items": [
                {"id": "stats", "titleKey": "agent.nav.stats", "href": "/dashboard/agent/treasury/stats", "icon": "TrendingUp", "permission": "treasury_stat.view"},
                {"id": "analytics", "titleKey": "agent.nav.analytics", "href": "/dashboard/agent/treasury/analytics", "icon": "Activity", "permission": "treasury_stat.view"},
                {"id": "audit", "titleKey": "agent.nav.audit", "href": "/dashboard/agent/treasury/audit", "icon": "FileSearch", "permission": "treasury_audit.view"},
                {"id": "anomalies", "titleKey": "agent.nav.anomalies", "href": "/dashboard/agent/treasury/anomalies", "icon": "ShieldAlert", "permission": "treasury_anomaly.view"},
                {"id": "exports", "titleKey": "agent.nav.exports", "href": "/dashboard/agent/treasury/exports", "icon": "Download", "permission": "treasury_export.view"}
            ]
        }
    ]
}',
dashboard_config = '{
    "version": "1.0",
    "layout": "grid",
    "widgets": [
        {"id": "pending_payments", "visible": true, "position": 1, "size": "small"},
        {"id": "in_progress_payments", "visible": true, "position": 2, "size": "small"},
        {"id": "completed_payments", "visible": true, "position": 3, "size": "small"},
        {"id": "total_amount_today", "visible": true, "position": 4, "size": "small"},
        {"id": "recent_activity", "visible": true, "position": 5, "size": "large"},
        {"id": "performance_chart", "visible": true, "position": 6, "size": "medium"},
        {"id": "anomaly_alerts", "visible": true, "position": 7, "size": "medium"}
    ]
}'
WHERE code = 'supervisor_tesoro';

-- agent_tesoro - Unified treasury agent (validation + reconciliation + transactions)
UPDATE roles SET menu_config = '{
    "version": "1.0",
    "source": "role",
    "menus": [
        {
            "id": "dashboard",
            "titleKey": "agent.nav.dashboard",
            "href": "/dashboard/agent/treasury",
            "icon": "LayoutDashboard"
        },
        {
            "id": "payments",
            "titleKey": "agent.nav.payments",
            "icon": "CreditCard",
            "items": [
                {"id": "validation", "titleKey": "agent.nav.validation", "href": "/dashboard/agent/treasury/validation", "icon": "CheckCircle", "permission": "treasury.validate_payment"},
                {"id": "reconciliation", "titleKey": "agent.nav.reconciliation", "href": "/dashboard/agent/treasury/reconciliation", "icon": "RefreshCw", "permission": "treasury.reconcile"},
                {"id": "transactions", "titleKey": "agent.nav.transactions", "href": "/dashboard/agent/treasury/transactions", "icon": "History", "permission": "treasury.view_payment"}
            ]
        }
    ]
}',
dashboard_config = '{
    "version": "1.0",
    "layout": "grid",
    "widgets": [
        {"id": "pending_payments", "visible": true, "position": 1, "size": "small"},
        {"id": "in_progress_payments", "visible": true, "position": 2, "size": "small"},
        {"id": "completed_payments", "visible": true, "position": 3, "size": "small"},
        {"id": "recent_activity", "visible": true, "position": 4, "size": "large"}
    ]
}'
WHERE code = 'agent_tesoro';

-- agent_tesoro_validation - Validation only
UPDATE roles SET menu_config = '{
    "version": "1.0",
    "source": "role",
    "menus": [
        {
            "id": "dashboard",
            "titleKey": "agent.nav.dashboard",
            "href": "/dashboard/agent/treasury",
            "icon": "LayoutDashboard"
        },
        {
            "id": "payments",
            "titleKey": "agent.nav.payments",
            "icon": "CreditCard",
            "items": [
                {"id": "validation", "titleKey": "agent.nav.validation", "href": "/dashboard/agent/treasury/validation", "icon": "CheckCircle", "permission": "treasury.validate_payment"}
            ]
        }
    ]
}',
dashboard_config = '{
    "version": "1.0",
    "layout": "grid",
    "widgets": [
        {"id": "pending_payments", "visible": true, "position": 1, "size": "small"},
        {"id": "completed_today", "visible": true, "position": 2, "size": "small"}
    ]
}'
WHERE code = 'agent_tesoro_validation';

-- agent_tesoro_reconciliation - Reconciliation only
UPDATE roles SET menu_config = '{
    "version": "1.0",
    "source": "role",
    "menus": [
        {
            "id": "dashboard",
            "titleKey": "agent.nav.dashboard",
            "href": "/dashboard/agent/treasury",
            "icon": "LayoutDashboard"
        },
        {
            "id": "payments",
            "titleKey": "agent.nav.payments",
            "icon": "CreditCard",
            "items": [
                {"id": "reconciliation", "titleKey": "agent.nav.reconciliation", "href": "/dashboard/agent/treasury/reconciliation", "icon": "RefreshCw", "permission": "treasury.reconcile"}
            ]
        }
    ]
}',
dashboard_config = '{
    "version": "1.0",
    "layout": "grid",
    "widgets": [
        {"id": "pending_reconciliation", "visible": true, "position": 1, "size": "small"},
        {"id": "reconciled_today", "visible": true, "position": 2, "size": "small"}
    ]
}'
WHERE code = 'agent_tesoro_reconciliation';

-- =============================================================================
-- 7. INDEXES for JSONB queries
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_roles_menu_config ON roles USING GIN (menu_config);
CREATE INDEX IF NOT EXISTS idx_roles_dashboard_config ON roles USING GIN (dashboard_config);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_menu_overrides ON agent_profiles USING GIN (menu_overrides);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_dashboard_overrides ON agent_profiles USING GIN (dashboard_overrides);

-- =============================================================================
-- 8. UPDATE TRIGGER for updated_at on menu_templates
-- =============================================================================

CREATE OR REPLACE FUNCTION update_menu_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_menu_templates_updated_at ON menu_templates;
CREATE TRIGGER tr_menu_templates_updated_at
    BEFORE UPDATE ON menu_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_templates_updated_at();

-- =============================================================================
-- 9. UPDATE TRIGGER for updated_at on workflow_menu_mapping
-- =============================================================================

CREATE OR REPLACE FUNCTION update_workflow_menu_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_workflow_menu_mapping_updated_at ON workflow_menu_mapping;
CREATE TRIGGER tr_workflow_menu_mapping_updated_at
    BEFORE UPDATE ON workflow_menu_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_menu_mapping_updated_at();

-- =============================================================================
-- 10. VALIDATION FUNCTION for menu_config JSON structure
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_menu_config(config JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check required fields
    IF config IS NULL THEN
        RETURN TRUE;  -- NULL is valid (use auto-generation)
    END IF;

    -- Must have version
    IF NOT (config ? 'version') THEN
        RAISE EXCEPTION 'menu_config must have "version" field';
    END IF;

    -- Must have menus array
    IF NOT (config ? 'menus') THEN
        RAISE EXCEPTION 'menu_config must have "menus" array';
    END IF;

    IF jsonb_typeof(config->'menus') != 'array' THEN
        RAISE EXCEPTION 'menu_config.menus must be an array';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to roles table
ALTER TABLE roles DROP CONSTRAINT IF EXISTS chk_roles_menu_config_valid;
ALTER TABLE roles ADD CONSTRAINT chk_roles_menu_config_valid
    CHECK (validate_menu_config(menu_config));

-- =============================================================================
-- 11. ADD MENU CONFIG PERMISSIONS
-- =============================================================================

INSERT INTO permissions (name, resource, action, description, is_critical, module_name, created_at, updated_at)
VALUES
    ('admin.menu.read', 'menu', 'read', 'Ver configuracion de menus', FALSE, 'admin', NOW(), NOW()),
    ('admin.menu.create', 'menu', 'create', 'Crear templates de menu', TRUE, 'admin', NOW(), NOW()),
    ('admin.menu.update', 'menu', 'update', 'Modificar configuracion de menus', TRUE, 'admin', NOW(), NOW()),
    ('admin.menu.delete', 'menu', 'delete', 'Eliminar templates de menu', TRUE, 'admin', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Grant menu permissions to admin role
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'admin'
  AND p.name IN (
    'admin.menu.read',
    'admin.menu.create',
    'admin.menu.update',
    'admin.menu.delete'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant read permission to supervisor roles
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('supervisor_tesoro', 'supervisor_agent')
  AND p.name = 'admin.menu.read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;

-- =============================================================================
-- 12. VERIFICATION
-- =============================================================================

SELECT
    'Migration 063 completed' AS status,
    (SELECT COUNT(*) FROM workflow_menu_mapping) AS workflow_mappings,
    (SELECT COUNT(*) FROM roles WHERE menu_config IS NOT NULL) AS roles_with_menu_config;

SELECT
    r.code,
    r.name,
    CASE WHEN r.menu_config IS NOT NULL THEN 'Yes' ELSE 'No' END as has_menu_config,
    CASE WHEN r.dashboard_config IS NOT NULL THEN 'Yes' ELSE 'No' END as has_dashboard_config
FROM roles r
WHERE r.code LIKE '%tesoro%'
ORDER BY r.code;

-- ============================================================================
-- END OF MIGRATION 063
-- ============================================================================
