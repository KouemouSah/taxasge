-- =============================================================================
-- Migration 316 — view_business_dashboards permission for /admin/dashboards/*
-- =============================================================================
-- Created: 2026-05-02
-- Plan reference: .claude/plans/LOOKER_STUDIO_BUSINESS_DASHBOARDS_PLAN.md §5
--                 .claude/plans/LOOKER_STUDIO_COMMUNITY_CONNECTOR_PLAN.md §5
--
-- Adds the permission needed to access the Next.js /admin/dashboards/*
-- routes (Phase 5 of the Looker rollout). The Looker connector backend
-- (B.2a) already enforces row-level security via agent_profiles.entity_id
-- — this permission gates the *frontend embed* to staff and ministry
-- supervisors only. Citizens / business / accountant roles get a 403 on
-- the route, never see the iframe.
--
-- Idempotent: re-running the migration is safe (uses ON CONFLICT DO NOTHING).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Insert the permission
-- ---------------------------------------------------------------------------
INSERT INTO permissions (name, description, category, created_at)
VALUES (
    'dashboards.view_business',
    'View business dashboards (Recaudación, Agent Performance, Service Catalog) embedded from Looker Studio',
    'dashboards',
    NOW()
)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Grant to admin role + every supervisor-flagged custom role.
-- We intentionally do NOT grant to citizen/business/accountant — they have
-- no business reading aggregate KPIs of other ministries.
-- The grant uses the canonical role codes from `roles.code`. This list
-- mirrors the pattern in migration 310 (oms_agent_escalation_permissions).
-- ---------------------------------------------------------------------------
INSERT INTO role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE p.name = 'dashboards.view_business'
  AND r.code IN (
      'admin',
      'supervisor',                  -- treasury / ops supervisor (custom role)
      'agent_cnedoge_pasaporte',
      'agent_dgt',
      'agent_extranjeria',
      'agent_aduana',
      'agent_dgi',
      'agent_min_finanzas',
      'agent_min_interior',
      'agent_min_admin',
      'agent_ayuntamiento',
      'agent_camara_comercio'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;

-- ---------------------------------------------------------------------------
-- VERIFICATION (run after the migration applies):
-- ---------------------------------------------------------------------------
-- 1. Permission exists:
--    SELECT name, category FROM permissions WHERE name = 'dashboards.view_business';
--
-- 2. Roles that received it (count should match the IN list above, minus any
--    role codes that don't exist in this DB):
--    SELECT r.code FROM roles r
--    JOIN role_permissions rp ON rp.role_id = r.id
--    JOIN permissions p ON p.id = rp.permission_id
--    WHERE p.name = 'dashboards.view_business'
--    ORDER BY r.code;
--
-- 3. A citizen-role user should NOT have it:
--    SELECT count(*) FROM users u
--    JOIN user_company_roles ucr ON ucr.user_id = u.id
--    WHERE u.role = 'citizen'
--      AND EXISTS (
--          SELECT 1 FROM role_permissions rp
--          JOIN permissions p ON p.id = rp.permission_id
--          WHERE rp.role_id = ucr.role_id
--            AND p.name = 'dashboards.view_business'
--      );
-- ---------------------------------------------------------------------------

-- ROLLBACK (manual):
-- BEGIN;
--   DELETE FROM role_permissions
--   WHERE permission_id = (SELECT id FROM permissions WHERE name = 'dashboards.view_business');
--   DELETE FROM permissions WHERE name = 'dashboards.view_business';
-- COMMIT;
