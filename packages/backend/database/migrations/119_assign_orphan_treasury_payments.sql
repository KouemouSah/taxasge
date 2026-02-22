-- Migration 119: Assign orphan treasury payments to existing TESORO agent
-- Problem: 7 cash payments stuck at pending_agent_review with assigned_agent_id = NULL
-- Root cause: Auto-assignment was broken before site-based routing fix (commit f4dc2ebb)
-- Fix: Assign all orphans to the sole active TESORO agent

-- Step 1: Assign orphan payments
UPDATE service_payments sp
SET assigned_agent_id = ap.id,
    updated_at = NOW()
FROM agent_profiles ap
WHERE ap.entity_code = 'TESORO'
  AND ap.is_active = true
  AND sp.workflow_status = 'pending_agent_review'
  AND sp.assigned_agent_id IS NULL
  AND sp.payment_method IN ('cash', 'check');

-- Step 2: Create missing assignments for these payments
INSERT INTO assignments (
    service_request_id,
    agent_id,
    entity_code,
    item_type,
    item_id,
    status,
    assigned_at,
    created_at,
    updated_at
)
SELECT
    sp.service_request_id,
    ap.id,
    'TESORO',
    'payment_validation',
    sp.id,
    'assigned',
    NOW(),
    NOW(),
    NOW()
FROM service_payments sp
CROSS JOIN agent_profiles ap
WHERE ap.entity_code = 'TESORO'
  AND ap.is_active = true
  AND sp.workflow_status = 'pending_agent_review'
  AND sp.payment_method IN ('cash', 'check')
  AND NOT EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.item_id = sp.id
        AND a.item_type = 'payment_validation'
  );

-- Verify
DO $$
DECLARE
    orphan_count INTEGER;
    assignment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_count
    FROM service_payments
    WHERE workflow_status = 'pending_agent_review'
      AND assigned_agent_id IS NULL
      AND payment_method IN ('cash', 'check');

    SELECT COUNT(*) INTO assignment_count
    FROM assignments
    WHERE item_type = 'payment_validation'
      AND entity_code = 'TESORO';

    RAISE NOTICE 'Remaining orphans: %, Total TESORO assignments: %', orphan_count, assignment_count;
END $$;
