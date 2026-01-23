-- Migration 066: Remove deprecated lock columns from agent_work_queue
-- =====================================================================
--
-- Context:
-- With the implementation of auto-assignment (commit 647a7c11), the lock
-- mechanism in agent_work_queue is no longer needed:
-- - Items are automatically assigned to agents on submission
-- - Agents only see their assigned items (no concurrent access)
-- - The lock was for "pull" architecture, we now use "push" architecture
--
-- Changes:
-- 1. Drop locked_until column from agent_work_queue
-- 2. Update any views that reference locked_until
--
-- Date: 2026-01-23
-- Author: Claude Code

-- =====================================================================
-- STEP 1: Drop the locked_until column
-- =====================================================================

ALTER TABLE agent_work_queue DROP COLUMN IF EXISTS locked_until;

-- =====================================================================
-- STEP 2: Update comments to reflect new architecture
-- =====================================================================

COMMENT ON TABLE agent_work_queue IS
'Queue for agent work items (service_requests, declarations).
With auto-assignment architecture, items are automatically assigned to agents
on submission. This table is used for:
- SLA tracking (sla_deadline)
- Priority scoring (priority_score)
- Escalation management (escalated, escalated_at)
- Performance metrics';

COMMENT ON COLUMN agent_work_queue.assigned_to IS
'Agent user_id assigned to this item (set by auto-assignment on submission)';

COMMENT ON COLUMN agent_work_queue.assigned_at IS
'Timestamp when item was assigned (set by auto-assignment)';

-- =====================================================================
-- STEP 3: Verify migration
-- =====================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agent_work_queue'
        AND column_name = 'locked_until'
    ) THEN
        RAISE EXCEPTION 'Migration failed: locked_until column still exists';
    END IF;

    RAISE NOTICE 'Migration 066 completed: locked_until column removed from agent_work_queue';
END $$;
