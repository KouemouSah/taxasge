-- ============================================================================
-- Migration 078: Add appointments menu to workflow-based agent roles
-- ============================================================================
-- Purpose: Add direct "Rendez-vous" menu item to agent roles with appointments
--
-- Phase 5.4 of Dashboard Config + Appointments Management
--
-- Affected roles:
--   - agent_cnedoge_pasaporte (pasaportes with appointments)
--   - agent_cnedoge_residencia (residencias with appointments)
--   - agent_dgt (licencias with appointments)
--
-- NOTE: These roles use workflow-based menu generation (menu_config = NULL).
-- This migration adds explicit menu_config to include the appointments menu
-- at entity level: /dashboard/agent/{entity}/appointments
--
-- Author: Claude Code
-- Date: 2026-01-26
-- ============================================================================

BEGIN;

-- =============================================================================
-- 1. UPDATE AGENT_CNEDOGE_PASAPORTE - Add appointments menu
-- =============================================================================

UPDATE roles SET
    menu_config = '{
        "version": "1.0",
        "source": "role",
        "menus": [
            {
                "id": "dashboard",
                "titleKey": "agent.nav.dashboard",
                "href": "/dashboard/agent/cnedoge-pasaporte",
                "icon": "LayoutDashboard"
            },
            {
                "id": "pasaportes",
                "titleKey": "agent.nav.passports",
                "icon": "Plane",
                "items": [
                    {"id": "pending", "titleKey": "agent.nav.pending", "href": "/dashboard/agent/cnedoge-pasaporte/pasaportes/pending", "icon": "Clock", "permission": "service_request.view_queue"},
                    {"id": "validation", "titleKey": "agent.nav.validation", "href": "/dashboard/agent/cnedoge-pasaporte/pasaportes/validation", "icon": "CheckCircle", "permission": "service_request.process"},
                    {"id": "history", "titleKey": "agent.nav.history", "href": "/dashboard/agent/cnedoge-pasaporte/pasaportes/history", "icon": "History", "permission": "service_request.view"}
                ]
            },
            {
                "id": "appointments",
                "titleKey": "agent.nav.appointments",
                "href": "/dashboard/agent/cnedoge-pasaporte/appointments",
                "icon": "Calendar",
                "permission": "service_request.view_appointments"
            }
        ]
    }'::jsonb,
    dashboard_config = '{
        "version": "1.0",
        "layout": "grid",
        "widgets": [
            {"id": "urgent_requests", "visible": true, "position": 1, "size": "medium"},
            {"id": "calendar_slots", "visible": true, "position": 2, "size": "large"},
            {"id": "today_appointments", "visible": true, "position": 3, "size": "medium"},
            {"id": "workflow_distribution", "visible": true, "position": 4, "size": "medium"},
            {"id": "personal_stats", "visible": true, "position": 5, "size": "medium"},
            {"id": "alerts", "visible": true, "position": 6, "size": "small"}
        ]
    }'::jsonb
WHERE code = 'agent_cnedoge_pasaporte';

-- =============================================================================
-- 2. UPDATE AGENT_CNEDOGE_RESIDENCIA - Add appointments menu
-- =============================================================================

UPDATE roles SET
    menu_config = '{
        "version": "1.0",
        "source": "role",
        "menus": [
            {
                "id": "dashboard",
                "titleKey": "agent.nav.dashboard",
                "href": "/dashboard/agent/cnedoge-residencia",
                "icon": "LayoutDashboard"
            },
            {
                "id": "residencias",
                "titleKey": "agent.nav.residences",
                "icon": "Globe",
                "items": [
                    {"id": "pending", "titleKey": "agent.nav.pending", "href": "/dashboard/agent/cnedoge-residencia/residencias/pending", "icon": "Clock", "permission": "service_request.view_queue"},
                    {"id": "validation", "titleKey": "agent.nav.validation", "href": "/dashboard/agent/cnedoge-residencia/residencias/validation", "icon": "CheckCircle", "permission": "service_request.process"},
                    {"id": "history", "titleKey": "agent.nav.history", "href": "/dashboard/agent/cnedoge-residencia/residencias/history", "icon": "History", "permission": "service_request.view"}
                ]
            },
            {
                "id": "appointments",
                "titleKey": "agent.nav.appointments",
                "href": "/dashboard/agent/cnedoge-residencia/appointments",
                "icon": "Calendar",
                "permission": "service_request.view_appointments"
            }
        ]
    }'::jsonb,
    dashboard_config = '{
        "version": "1.0",
        "layout": "grid",
        "widgets": [
            {"id": "urgent_requests", "visible": true, "position": 1, "size": "medium"},
            {"id": "calendar_slots", "visible": true, "position": 2, "size": "large"},
            {"id": "today_appointments", "visible": true, "position": 3, "size": "medium"},
            {"id": "workflow_distribution", "visible": true, "position": 4, "size": "medium"},
            {"id": "personal_stats", "visible": true, "position": 5, "size": "medium"},
            {"id": "alerts", "visible": true, "position": 6, "size": "small"}
        ]
    }'::jsonb
WHERE code = 'agent_cnedoge_residencia';

-- =============================================================================
-- 3. UPDATE AGENT_DGT - Add appointments menu
-- =============================================================================

UPDATE roles SET
    menu_config = '{
        "version": "1.0",
        "source": "role",
        "menus": [
            {
                "id": "dashboard",
                "titleKey": "agent.nav.dashboard",
                "href": "/dashboard/agent/dgt",
                "icon": "LayoutDashboard"
            },
            {
                "id": "licencias",
                "titleKey": "agent.nav.licenses",
                "icon": "Car",
                "items": [
                    {"id": "pending", "titleKey": "agent.nav.pending", "href": "/dashboard/agent/dgt/licencias/pending", "icon": "Clock", "permission": "service_request.view_queue"},
                    {"id": "validation", "titleKey": "agent.nav.validation", "href": "/dashboard/agent/dgt/licencias/validation", "icon": "CheckCircle", "permission": "service_request.process"},
                    {"id": "history", "titleKey": "agent.nav.history", "href": "/dashboard/agent/dgt/licencias/history", "icon": "History", "permission": "service_request.view"}
                ]
            },
            {
                "id": "appointments",
                "titleKey": "agent.nav.appointments",
                "href": "/dashboard/agent/dgt/appointments",
                "icon": "Calendar",
                "permission": "service_request.view_appointments"
            }
        ]
    }'::jsonb,
    dashboard_config = '{
        "version": "1.0",
        "layout": "grid",
        "widgets": [
            {"id": "urgent_requests", "visible": true, "position": 1, "size": "medium"},
            {"id": "calendar_slots", "visible": true, "position": 2, "size": "large"},
            {"id": "today_appointments", "visible": true, "position": 3, "size": "medium"},
            {"id": "workflow_distribution", "visible": true, "position": 4, "size": "medium"},
            {"id": "personal_stats", "visible": true, "position": 5, "size": "medium"},
            {"id": "alerts", "visible": true, "position": 6, "size": "small"}
        ]
    }'::jsonb
WHERE code = 'agent_dgt';

-- =============================================================================
-- 4. UPDATE AGENT_ONRC - No appointments (contracts)
-- =============================================================================

UPDATE roles SET
    menu_config = '{
        "version": "1.0",
        "source": "role",
        "menus": [
            {
                "id": "dashboard",
                "titleKey": "agent.nav.dashboard",
                "href": "/dashboard/agent/onrc",
                "icon": "LayoutDashboard"
            },
            {
                "id": "contratos",
                "titleKey": "agent.nav.contracts",
                "icon": "FileSignature",
                "items": [
                    {"id": "pending", "titleKey": "agent.nav.pending", "href": "/dashboard/agent/onrc/contratos/pending", "icon": "Clock", "permission": "service_request.view_queue"},
                    {"id": "validation", "titleKey": "agent.nav.validation", "href": "/dashboard/agent/onrc/contratos/validation", "icon": "CheckCircle", "permission": "service_request.process"},
                    {"id": "history", "titleKey": "agent.nav.history", "href": "/dashboard/agent/onrc/contratos/history", "icon": "History", "permission": "service_request.view"}
                ]
            }
        ]
    }'::jsonb,
    dashboard_config = '{
        "version": "1.0",
        "layout": "grid",
        "widgets": [
            {"id": "urgent_requests", "visible": true, "position": 1, "size": "medium"},
            {"id": "workflow_distribution", "visible": true, "position": 2, "size": "medium"},
            {"id": "personal_stats", "visible": true, "position": 3, "size": "medium"},
            {"id": "alerts", "visible": true, "position": 4, "size": "small"}
        ]
    }'::jsonb
WHERE code = 'agent_onrc';

-- =============================================================================
-- 5. UPDATE AGENT_OFIVE - No appointments (vehicles)
-- =============================================================================

UPDATE roles SET
    menu_config = '{
        "version": "1.0",
        "source": "role",
        "menus": [
            {
                "id": "dashboard",
                "titleKey": "agent.nav.dashboard",
                "href": "/dashboard/agent/ofive",
                "icon": "LayoutDashboard"
            },
            {
                "id": "vehiculos",
                "titleKey": "agent.nav.vehicles",
                "icon": "Truck",
                "items": [
                    {"id": "pending", "titleKey": "agent.nav.pending", "href": "/dashboard/agent/ofive/vehiculos/pending", "icon": "Clock", "permission": "service_request.view_queue"},
                    {"id": "validation", "titleKey": "agent.nav.validation", "href": "/dashboard/agent/ofive/vehiculos/validation", "icon": "CheckCircle", "permission": "service_request.process"},
                    {"id": "history", "titleKey": "agent.nav.history", "href": "/dashboard/agent/ofive/vehiculos/history", "icon": "History", "permission": "service_request.view"}
                ]
            }
        ]
    }'::jsonb,
    dashboard_config = '{
        "version": "1.0",
        "layout": "grid",
        "widgets": [
            {"id": "urgent_requests", "visible": true, "position": 1, "size": "medium"},
            {"id": "workflow_distribution", "visible": true, "position": 2, "size": "medium"},
            {"id": "personal_stats", "visible": true, "position": 3, "size": "medium"},
            {"id": "alerts", "visible": true, "position": 4, "size": "small"}
        ]
    }'::jsonb
WHERE code = 'agent_ofive';

COMMIT;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT 'Migration 078 completed' AS status;

-- Check updated roles
SELECT
    code,
    name,
    menu_config IS NOT NULL as has_menu_config,
    dashboard_config IS NOT NULL as has_dashboard_config,
    jsonb_array_length(menu_config->'menus') as menu_count
FROM roles
WHERE code LIKE 'agent_%'
ORDER BY code;

-- Check appointments menu presence
SELECT
    code,
    menu_config->'menus' @> '[{"id": "appointments"}]'::jsonb as has_appointments_menu
FROM roles
WHERE code IN ('agent_cnedoge_pasaporte', 'agent_cnedoge_residencia', 'agent_dgt', 'agent_onrc', 'agent_ofive');

-- ============================================================================
-- END OF MIGRATION 078
-- ============================================================================
