-- ============================================================================
-- Migration 091: Add VISADO workflow menu mapping + cleanup phantom references
-- ============================================================================
-- Purpose:
--   1. Add VISADO_% and PRORROGA_% patterns to workflow_menu_mapping
--      so EXTRANJERIA agents see Visado workflows in dynamic menus
--   2. Clean up phantom workflow codes from menu_templates
--      (RESIDENCIA_DUPLICADO, RESIDENCIA_CAMBIO_DATOS, RESIDENCIA_REAGRUPACION
--       do not exist in backend WorkflowCode enum)
--
-- Context:
--   - Backend has 4 VISADO workflows: PRORROGA_VISADO, VISADO_ALTERNATIVO,
--     PERMANENCIA_EXTRANJERIA, SALIDA_VISADO_VENCIDO
--   - These had NO workflow_menu_mapping pattern → invisible in dynamic menus
--   - Frontend entity-menus.ts cleanup done in same commit (separate file)
--
-- Author: Claude Code Expert
-- Date: 2026-02-09
-- ============================================================================

BEGIN;

-- =============================================================================
-- 1. ADD VISADO WORKFLOW MENU MAPPING PATTERNS
-- =============================================================================

-- Pattern for PRORROGA_% workflows (e.g., PRORROGA_VISADO)
INSERT INTO workflow_menu_mapping (
    workflow_pattern, menu_group_id, menu_title_key, menu_icon,
    display_order, include_pending, include_validation,
    include_appointments, include_history, permission_prefix, is_active
)
VALUES (
    'PRORROGA_%', 'visados', 'agent.nav.visas', 'Globe',
    6, true, true, false, true, 'service_requests', true
)
ON CONFLICT (workflow_pattern) DO UPDATE SET
    menu_group_id = EXCLUDED.menu_group_id,
    menu_title_key = EXCLUDED.menu_title_key,
    menu_icon = EXCLUDED.menu_icon,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Pattern for VISADO_% workflows (e.g., VISADO_ALTERNATIVO)
INSERT INTO workflow_menu_mapping (
    workflow_pattern, menu_group_id, menu_title_key, menu_icon,
    display_order, include_pending, include_validation,
    include_appointments, include_history, permission_prefix, is_active
)
VALUES (
    'VISADO_%', 'visados', 'agent.nav.visas', 'Globe',
    7, true, true, false, true, 'service_requests', true
)
ON CONFLICT (workflow_pattern) DO UPDATE SET
    menu_group_id = EXCLUDED.menu_group_id,
    menu_title_key = EXCLUDED.menu_title_key,
    menu_icon = EXCLUDED.menu_icon,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Pattern for PERMANENCIA_% workflows (e.g., PERMANENCIA_EXTRANJERIA)
INSERT INTO workflow_menu_mapping (
    workflow_pattern, menu_group_id, menu_title_key, menu_icon,
    display_order, include_pending, include_validation,
    include_appointments, include_history, permission_prefix, is_active
)
VALUES (
    'PERMANENCIA_%', 'visados', 'agent.nav.visas', 'Globe',
    8, true, true, false, true, 'service_requests', true
)
ON CONFLICT (workflow_pattern) DO UPDATE SET
    menu_group_id = EXCLUDED.menu_group_id,
    menu_title_key = EXCLUDED.menu_title_key,
    menu_icon = EXCLUDED.menu_icon,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Pattern for SALIDA_% workflows (e.g., SALIDA_VISADO_VENCIDO)
INSERT INTO workflow_menu_mapping (
    workflow_pattern, menu_group_id, menu_title_key, menu_icon,
    display_order, include_pending, include_validation,
    include_appointments, include_history, permission_prefix, is_active
)
VALUES (
    'SALIDA_%', 'visados', 'agent.nav.visas', 'Globe',
    9, true, true, false, true, 'service_requests', true
)
ON CONFLICT (workflow_pattern) DO UPDATE SET
    menu_group_id = EXCLUDED.menu_group_id,
    menu_title_key = EXCLUDED.menu_title_key,
    menu_icon = EXCLUDED.menu_icon,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- =============================================================================
-- 2. CLEANUP PHANTOM WORKFLOW CODES FROM MENU TEMPLATES
-- =============================================================================
-- The cnedoge_residencia_default template references 3 phantom codes that
-- don't exist in backend. Update to match actual backend workflows.

UPDATE menu_templates
SET menu_structure = jsonb_set(
    menu_structure,
    '{workflows}',
    '["RESIDENCIA_PRIMERA_VEZ", "RESIDENCIA_RENOVACION"]'::jsonb
),
updated_at = NOW()
WHERE code = 'cnedoge_residencia_default';

COMMIT;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT
    'Migration 091 completed' AS status,
    (SELECT COUNT(*) FROM workflow_menu_mapping) AS total_mappings,
    (SELECT COUNT(*) FROM workflow_menu_mapping WHERE is_active = true) AS active_mappings;

SELECT
    id,
    workflow_pattern,
    menu_group_id,
    menu_icon,
    is_active
FROM workflow_menu_mapping
ORDER BY display_order;

-- Verify phantom cleanup
SELECT
    code,
    menu_structure->'workflows' AS workflows
FROM menu_templates
WHERE code = 'cnedoge_residencia_default';

-- ============================================================================
-- END OF MIGRATION 091
-- ============================================================================
