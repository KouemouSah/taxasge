-- Migration 125: Update TESORO dashboard_config
-- Remove in_progress_payments widget, keep pending_payments + completed_payments
-- Also applies to supervisor_tesoro role

-- ============================================================================
-- AGENT TESORO: Remove in_progress_payments, reposition completed_payments
-- ============================================================================

UPDATE roles
SET dashboard_config = '{
  "layout": "grid",
  "version": "2.2",
  "widgets": [
    {"id": "pending_payments", "size": "medium", "visible": true, "position": 1},
    {"id": "completed_payments", "size": "medium", "visible": true, "position": 2}
  ]
}'::jsonb
WHERE code = 'agent_tesoro';

-- ============================================================================
-- SUPERVISOR TESORO: Same — remove in_progress_payments
-- ============================================================================

UPDATE roles
SET dashboard_config = jsonb_set(
  dashboard_config,
  '{widgets}',
  (
    SELECT jsonb_agg(w ORDER BY (w->>'position')::int)
    FROM jsonb_array_elements(dashboard_config->'widgets') AS w
    WHERE w->>'id' != 'in_progress_payments'
  )
)
WHERE code = 'supervisor_tesoro'
  AND dashboard_config IS NOT NULL
  AND dashboard_config->'widgets' IS NOT NULL;

-- ============================================================================
-- VERIFY
-- ============================================================================

DO $$
DECLARE
  agent_widgets jsonb;
BEGIN
  SELECT dashboard_config->'widgets' INTO agent_widgets
  FROM roles WHERE code = 'agent_tesoro';

  IF agent_widgets IS NULL THEN
    RAISE WARNING 'agent_tesoro dashboard_config not found';
  ELSE
    RAISE NOTICE 'agent_tesoro widgets: %', agent_widgets;
    -- Verify no in_progress_payments
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(agent_widgets) w
      WHERE w->>'id' = 'in_progress_payments'
    ) THEN
      RAISE WARNING 'in_progress_payments still present in agent_tesoro!';
    ELSE
      RAISE NOTICE 'OK: in_progress_payments removed from agent_tesoro';
    END IF;
  END IF;
END $$;
