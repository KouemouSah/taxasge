-- Migration 125: Update TESORO dashboard_config
-- Agent: remove in_progress_payments widget (agents don't need it — they see pending in split view)
-- Supervisor: KEEP all widgets (in_progress_payments, completed_payments, team_workload, etc.)

-- ============================================================================
-- AGENT TESORO: Remove in_progress_payments, keep pending_payments + completed_payments
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
-- SUPERVISOR TESORO: Ensure all payment widgets + management widgets are present
-- ============================================================================

UPDATE roles
SET dashboard_config = '{
  "layout": "grid",
  "version": "2.2",
  "widgets": [
    {"id": "pending_payments", "size": "medium", "visible": true, "position": 1},
    {"id": "in_progress_payments", "size": "medium", "visible": true, "position": 2},
    {"id": "completed_payments", "size": "medium", "visible": true, "position": 3},
    {"id": "team_workload", "size": "large", "visible": true, "position": 4},
    {"id": "escalations", "size": "medium", "visible": true, "position": 5},
    {"id": "anomaly_summary", "size": "medium", "visible": true, "position": 6},
    {"id": "alerts", "size": "small", "visible": true, "position": 7}
  ]
}'::jsonb
WHERE code = 'supervisor_tesoro';

-- ============================================================================
-- VERIFY
-- ============================================================================

DO $$
DECLARE
  agent_widgets jsonb;
  super_widgets jsonb;
BEGIN
  SELECT dashboard_config->'widgets' INTO agent_widgets
  FROM roles WHERE code = 'agent_tesoro';
  RAISE NOTICE 'agent_tesoro widgets: %', agent_widgets;

  SELECT dashboard_config->'widgets' INTO super_widgets
  FROM roles WHERE code = 'supervisor_tesoro';
  RAISE NOTICE 'supervisor_tesoro widgets: %', super_widgets;
END $$;
