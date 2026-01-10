-- ============================================================================
-- Migration 041: Make fiscal_service_code nullable in service_payments
-- ============================================================================
-- Purpose: Fix migration 032 oversight - the XOR constraint allows NULL but
-- the column was still NOT NULL.
--
-- Background:
-- Migration 032 added the check constraint chk_payment_target_xor which allows:
--   (fiscal_service_code IS NOT NULL AND service_request_id IS NULL)
--   OR (fiscal_service_code IS NULL AND service_request_id IS NOT NULL)
--   OR (fiscal_service_code IS NULL AND service_request_id IS NULL)
--
-- However, the column fiscal_service_code was never altered to allow NULLs,
-- causing INSERT failures for service request payments.
--
-- This migration fixes that by making fiscal_service_code nullable.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Make fiscal_service_code nullable
-- ============================================================================

-- Drop NOT NULL constraint on fiscal_service_code
ALTER TABLE service_payments
ALTER COLUMN fiscal_service_code DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN service_payments.fiscal_service_code IS
    'FK to fiscal_services.service_code. NULLABLE per XOR constraint with service_request_id. For service request payments, this is NULL and service_request_id is set.';

-- ============================================================================
-- 2. Verify the XOR constraint still exists (from migration 032)
-- ============================================================================

-- The constraint chk_payment_target_xor should already exist from migration 032
-- If it doesn't exist, add it (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_payment_target_xor'
        AND table_name = 'service_payments'
    ) THEN
        ALTER TABLE service_payments
        ADD CONSTRAINT chk_payment_target_xor
        CHECK (
            (fiscal_service_code IS NOT NULL AND service_request_id IS NULL)
            OR (fiscal_service_code IS NULL AND service_request_id IS NOT NULL)
            OR (fiscal_service_code IS NULL AND service_request_id IS NULL)
        );
    END IF;
END $$;

COMMIT;
