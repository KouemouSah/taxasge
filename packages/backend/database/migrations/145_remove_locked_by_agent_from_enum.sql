-- ============================================================================
-- MIGRATION 145: Remove deprecated 'locked_by_agent' from payment_workflow_status enum
-- Date: 2026-03-01
-- Context: With auto-assignment architecture (migrations 067-068), agents only
--          see their assigned payments. The explicit locking mechanism is obsolete.
--          Status was replaced by 'agent_reviewing' (agent picks up the payment).
--          Migration 067 already converted all existing locked_by_agent → pending_agent_review.
--          0 payments currently have this status (verified 2026-03-01).
-- ============================================================================

BEGIN;

-- PostgreSQL doesn't support DROP VALUE from enum directly.
-- We must recreate the enum without the deprecated value.

-- Step 1: Verify no payments use the deprecated status
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM service_payments
    WHERE workflow_status = 'locked_by_agent';

    IF v_count > 0 THEN
        RAISE EXCEPTION 'Cannot remove locked_by_agent: % payments still use this status', v_count;
    END IF;

    RAISE NOTICE 'Migration 145: 0 payments with locked_by_agent - safe to proceed';
END $$;

-- Step 2: Create new enum without locked_by_agent
CREATE TYPE payment_workflow_status_new AS ENUM (
    'submitted',
    'auto_processing',
    'auto_approved',
    'pending_agent_review',
    'agent_reviewing',
    'requires_documents',
    'docs_resubmitted',
    'approved_by_agent',
    'rejected_by_agent',
    'escalated_supervisor',
    'supervisor_reviewing',
    'completed',
    'cancelled_by_user',
    'cancelled_by_agent',
    'expired'
);

-- Step 3: Alter column to use new enum
ALTER TABLE service_payments
    ALTER COLUMN workflow_status TYPE payment_workflow_status_new
    USING workflow_status::text::payment_workflow_status_new;

-- Step 4: Drop old enum and rename new one
DROP TYPE payment_workflow_status;
ALTER TYPE payment_workflow_status_new RENAME TO payment_workflow_status;

-- Step 5: Verify
DO $$
DECLARE
    v_values TEXT;
BEGIN
    SELECT string_agg(e::text, ', ' ORDER BY e::text)
    INTO v_values
    FROM unnest(enum_range(NULL::payment_workflow_status)) e;

    RAISE NOTICE 'Migration 145: payment_workflow_status values = %', v_values;

    IF v_values LIKE '%locked_by_agent%' THEN
        RAISE EXCEPTION 'locked_by_agent still present in enum!';
    END IF;

    RAISE NOTICE 'Migration 145: locked_by_agent successfully removed from enum';
END $$;

COMMIT;
