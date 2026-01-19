-- ============================================================================
-- Migration 064: Seed menu configs for workflow-based roles
-- ============================================================================
-- Purpose: Set menu_config to NULL for workflow-based roles to trigger
--          auto-generation from entity.workflow_codes
--
-- This migration ensures that:
-- - Module-based roles (TESORO) have explicit menu_config (already done in 063)
-- - Workflow-based roles have NULL menu_config (auto-generated)
-- - Ministry validator/approver roles have appropriate configs
--
-- Author: Claude Code Expert
-- Date: 2026-01-19
-- ============================================================================

BEGIN;

-- =============================================================================
-- 1. SET NULL menu_config FOR WORKFLOW-BASED ROLES
-- =============================================================================
-- These roles use entities with workflow_codes and should auto-generate menus

-- Ministry Validator: Uses service_requests workflows
UPDATE roles SET
    menu_config = NULL,
    dashboard_config = '{
        "version": "1.0",
        "layout": "grid",
        "widgets": [
            {"id": "pending_requests", "visible": true, "position": 1, "size": "small"},
            {"id": "in_progress", "visible": true, "position": 2, "size": "small"},
            {"id": "completed_today", "visible": true, "position": 3, "size": "small"},
            {"id": "recent_activity", "visible": true, "position": 4, "size": "large"}
        ]
    }'
WHERE code = 'ministry_validator';

-- Ministry Approver: Uses service_requests workflows with extra permissions
UPDATE roles SET
    menu_config = NULL,
    dashboard_config = '{
        "version": "1.0",
        "layout": "grid",
        "widgets": [
            {"id": "pending_requests", "visible": true, "position": 1, "size": "small"},
            {"id": "in_progress", "visible": true, "position": 2, "size": "small"},
            {"id": "completed_today", "visible": true, "position": 3, "size": "small"},
            {"id": "team_stats", "visible": true, "position": 4, "size": "medium"},
            {"id": "recent_activity", "visible": true, "position": 5, "size": "large"}
        ]
    }'
WHERE code = 'ministry_approver';

-- DGI Validator: Uses tax declarations module
UPDATE roles SET
    menu_config = '{
        "version": "1.0",
        "source": "role",
        "menus": [
            {
                "id": "dashboard",
                "titleKey": "agent.nav.dashboard",
                "href": "/dashboard/agent/dgi",
                "icon": "LayoutDashboard"
            },
            {
                "id": "declarations",
                "titleKey": "agent.nav.declarations",
                "icon": "FileText",
                "permission": "declarations.view_assigned",
                "items": [
                    {"id": "pending", "titleKey": "agent.nav.pending", "href": "/dashboard/agent/dgi/pending", "icon": "Clock", "permission": "declarations.view_assigned"},
                    {"id": "validation", "titleKey": "agent.nav.validation", "href": "/dashboard/agent/dgi/validation", "icon": "CheckCircle", "permission": "declarations.validate"}
                ]
            }
        ]
    }',
    dashboard_config = '{
        "version": "1.0",
        "layout": "grid",
        "widgets": [
            {"id": "pending_declarations", "visible": true, "position": 1, "size": "small"},
            {"id": "in_review", "visible": true, "position": 2, "size": "small"},
            {"id": "approved_today", "visible": true, "position": 3, "size": "small"},
            {"id": "recent_activity", "visible": true, "position": 4, "size": "large"}
        ]
    }'
WHERE code = 'dgi_validator';

-- DGI Approver: Full declarations access
UPDATE roles SET
    menu_config = '{
        "version": "1.0",
        "source": "role",
        "menus": [
            {
                "id": "dashboard",
                "titleKey": "agent.nav.dashboard",
                "href": "/dashboard/agent/dgi",
                "icon": "LayoutDashboard"
            },
            {
                "id": "declarations",
                "titleKey": "agent.nav.declarations",
                "icon": "FileText",
                "items": [
                    {"id": "pending", "titleKey": "agent.nav.pending", "href": "/dashboard/agent/dgi/pending", "icon": "Clock"},
                    {"id": "validation", "titleKey": "agent.nav.validation", "href": "/dashboard/agent/dgi/validation", "icon": "CheckCircle"},
                    {"id": "history", "titleKey": "agent.nav.history", "href": "/dashboard/agent/dgi/history", "icon": "History"}
                ]
            },
            {
                "id": "reports",
                "titleKey": "agent.nav.reports",
                "icon": "BarChart3",
                "items": [
                    {"id": "stats", "titleKey": "agent.nav.stats", "href": "/dashboard/agent/dgi/stats", "icon": "TrendingUp"}
                ]
            }
        ]
    }',
    dashboard_config = '{
        "version": "1.0",
        "layout": "grid",
        "widgets": [
            {"id": "pending_declarations", "visible": true, "position": 1, "size": "small"},
            {"id": "in_review", "visible": true, "position": 2, "size": "small"},
            {"id": "approved_today", "visible": true, "position": 3, "size": "small"},
            {"id": "team_performance", "visible": true, "position": 4, "size": "medium"},
            {"id": "recent_activity", "visible": true, "position": 5, "size": "large"}
        ]
    }'
WHERE code = 'dgi_approver';

-- Auditor: Read-only access across modules
UPDATE roles SET
    menu_config = '{
        "version": "1.0",
        "source": "role",
        "menus": [
            {
                "id": "dashboard",
                "titleKey": "agent.nav.dashboard",
                "href": "/dashboard/agent/audit",
                "icon": "LayoutDashboard"
            },
            {
                "id": "audit",
                "titleKey": "agent.nav.auditLogs",
                "icon": "FileSearch",
                "items": [
                    {"id": "treasury", "titleKey": "agent.nav.treasuryAudit", "href": "/dashboard/agent/audit/treasury", "icon": "Wallet"},
                    {"id": "declarations", "titleKey": "agent.nav.declarationsAudit", "href": "/dashboard/agent/audit/declarations", "icon": "FileText"},
                    {"id": "requests", "titleKey": "agent.nav.requestsAudit", "href": "/dashboard/agent/audit/requests", "icon": "ClipboardList"}
                ]
            }
        ]
    }',
    dashboard_config = '{
        "version": "1.0",
        "layout": "grid",
        "widgets": [
            {"id": "total_audited", "visible": true, "position": 1, "size": "small"},
            {"id": "anomalies_found", "visible": true, "position": 2, "size": "small"},
            {"id": "recent_audits", "visible": true, "position": 3, "size": "large"}
        ]
    }'
WHERE code = 'auditor';

-- Supervisor Agent: Full access (uses auto-generation if entity has workflows)
UPDATE roles SET
    menu_config = NULL,
    dashboard_config = '{
        "version": "1.0",
        "layout": "grid",
        "widgets": [
            {"id": "team_pending", "visible": true, "position": 1, "size": "small"},
            {"id": "team_in_progress", "visible": true, "position": 2, "size": "small"},
            {"id": "team_completed", "visible": true, "position": 3, "size": "small"},
            {"id": "team_performance", "visible": true, "position": 4, "size": "medium"},
            {"id": "workload_distribution", "visible": true, "position": 5, "size": "medium"},
            {"id": "recent_activity", "visible": true, "position": 6, "size": "large"}
        ]
    }'
WHERE code = 'supervisor_agent';

-- =============================================================================
-- 2. ADD DEFAULT MENU TEMPLATE FOR CNEDOGE WORKFLOWS
-- =============================================================================

INSERT INTO menu_templates (code, name, description, template_type, entity_code, menu_structure, dashboard_widgets)
VALUES (
    'cnedoge_default',
    'CNEDOGE Default Template',
    'Template par défaut pour les agents CNEDOGE (passeports, cédulas)',
    'workflow',
    'CNEDOGE',
    '{
        "version": "1.0",
        "source": "template",
        "default_menus": ["dashboard", "pending", "validation", "appointments", "history"],
        "permission_prefix": "service_requests"
    }',
    '{
        "version": "1.0",
        "layout": "grid",
        "widgets": [
            {"id": "pending_requests", "visible": true, "position": 1, "size": "small"},
            {"id": "appointments_today", "visible": true, "position": 2, "size": "small"},
            {"id": "completed_today", "visible": true, "position": 3, "size": "small"},
            {"id": "recent_activity", "visible": true, "position": 4, "size": "large"}
        ]
    }'
)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- 3. ADD DEFAULT MENU TEMPLATE FOR DGT WORKFLOWS
-- =============================================================================

INSERT INTO menu_templates (code, name, description, template_type, entity_code, menu_structure, dashboard_widgets)
VALUES (
    'dgt_default',
    'DGT Default Template',
    'Template par défaut pour les agents DGT (licencias, vehículos)',
    'workflow',
    'DGT',
    '{
        "version": "1.0",
        "source": "template",
        "default_menus": ["dashboard", "pending", "validation", "appointments", "history"],
        "permission_prefix": "service_requests"
    }',
    '{
        "version": "1.0",
        "layout": "grid",
        "widgets": [
            {"id": "pending_licenses", "visible": true, "position": 1, "size": "small"},
            {"id": "pending_vehicles", "visible": true, "position": 2, "size": "small"},
            {"id": "appointments_today", "visible": true, "position": 3, "size": "small"},
            {"id": "recent_activity", "visible": true, "position": 4, "size": "large"}
        ]
    }'
)
ON CONFLICT (code) DO NOTHING;

COMMIT;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT
    'Migration 064 completed' AS status,
    COUNT(*) FILTER (WHERE menu_config IS NOT NULL) AS roles_with_menu_config,
    COUNT(*) FILTER (WHERE menu_config IS NULL) AS roles_auto_generate,
    COUNT(*) FILTER (WHERE dashboard_config IS NOT NULL) AS roles_with_dashboard_config
FROM roles
WHERE entity_type = 'agent';

SELECT
    code,
    name,
    CASE WHEN menu_config IS NOT NULL THEN 'Explicit' ELSE 'Auto-generate' END as menu_source
FROM roles
WHERE entity_type = 'agent'
ORDER BY code;

-- ============================================================================
-- END OF MIGRATION 064
-- ============================================================================
