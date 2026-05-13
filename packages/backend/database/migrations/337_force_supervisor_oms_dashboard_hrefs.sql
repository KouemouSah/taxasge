-- ============================================================================
-- MIGRATION 337: Force supervisor OMS dashboard hrefs onto an existing route
-- Date: 2026-05-13
--
-- Re-affirms migration 332 (and extends it) for ALL OMS-style supervisor
-- roles. User report 2026-05-13: `supcomercio` still landing on
-- `/dashboard/supervisor/min-comercio` (blank page) despite mig 332. Root
-- cause is unclear — could be the migration not being replayed on the
-- target environment, or a manual edit, or the dynamic menu generator
-- producing the same slug shape from `entities.workflow_codes`.
--
-- Defense in depth (BD side): this migration walks every role whose
-- top-level dashboard menu item points at `/dashboard/supervisor/<slug>`
-- where <slug> is NOT one of the static Next.js routes that actually ship,
-- and rewrites it to `/dashboard/supervisor/entity-dashboard`. The fix is
-- idempotent and additive — running it twice is a no-op.
--
-- Frontend complement: a catch-all route
-- `/dashboard/supervisor/[entity]/page.tsx` redirects any unknown supervisor
-- entity-slug to `/entity-dashboard` at runtime. Even if a new menu_config
-- row introduces a fresh phantom URL tomorrow, the user no longer sees a
-- blank page.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

BEGIN;

-- Static supervisor sub-routes that DO exist in the Next.js shipped bundle.
-- Any href whose first path segment after `/dashboard/supervisor/` is NOT
-- one of these is treated as phantom and rewritten.
WITH known_subroutes AS (
    SELECT unnest(ARRAY[
        'team',
        'escalations',
        'assignments',
        'oms',
        'reports',
        'inspections',
        'companies',
        'entity-dashboard'
    ]) AS slug
),
broken_roles AS (
    SELECT
        r.id,
        r.code,
        r.menu_config->'menus'->0->>'href' AS current_href,
        -- Extract the first segment after /dashboard/supervisor/
        split_part(
            regexp_replace(
                r.menu_config->'menus'->0->>'href',
                '^/dashboard/supervisor/',
                ''
            ),
            '/',
            1
        ) AS first_segment
    FROM roles r
    WHERE r.menu_config IS NOT NULL
      AND r.menu_config->'menus'->0->>'id' = 'dashboard'
      AND r.menu_config->'menus'->0->>'href' LIKE '/dashboard/supervisor/%'
)
UPDATE roles r
SET menu_config = jsonb_set(
    r.menu_config,
    '{menus,0,href}',
    '"/dashboard/supervisor/entity-dashboard"'::jsonb
)
FROM broken_roles br
WHERE r.id = br.id
  AND br.first_segment NOT IN (SELECT slug FROM known_subroutes)
  AND br.first_segment <> ''  -- safeguard: empty segment = bare /supervisor/, leave as-is
;

-- Verification: report what was rewritten + the residual state
DO $$
DECLARE
    v_total_supervisors INTEGER;
    v_pointing_correct INTEGER;
    v_pointing_phantom INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_supervisors
    FROM roles
    WHERE code LIKE 'supervisor_%'
      AND menu_config IS NOT NULL
      AND menu_config->'menus'->0->>'id' = 'dashboard';

    SELECT COUNT(*) INTO v_pointing_correct
    FROM roles
    WHERE code LIKE 'supervisor_%'
      AND menu_config IS NOT NULL
      AND menu_config->'menus'->0->>'href' = '/dashboard/supervisor/entity-dashboard';

    SELECT COUNT(*) INTO v_pointing_phantom
    FROM roles r
    WHERE r.code LIKE 'supervisor_%'
      AND r.menu_config IS NOT NULL
      AND r.menu_config->'menus'->0->>'href' LIKE '/dashboard/supervisor/%'
      AND split_part(
            regexp_replace(r.menu_config->'menus'->0->>'href', '^/dashboard/supervisor/', ''),
            '/', 1
          ) NOT IN ('team', 'escalations', 'assignments', 'oms', 'reports',
                    'inspections', 'companies', 'entity-dashboard');

    RAISE NOTICE 'Migration 337: % supervisor roles total, % pointing to entity-dashboard, % residual phantom',
        v_total_supervisors, v_pointing_correct, v_pointing_phantom;
END $$;

-- Bust the menu cache so the rewritten config is served immediately
-- (the catch-all route covers the cache window anyway, but this avoids
-- unnecessary front-end redirects for the next 5 min).
-- The menu cache key pattern is `menu_config:role:{role_code}` — Redis
-- TTL is 5 min, so we rely on natural expiry rather than a DELETE here
-- (no PostgreSQL trigger touching Redis).

COMMIT;
