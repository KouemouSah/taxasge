-- =============================================================================
-- MODULE_02: Set email_verified=TRUE for existing users
-- =============================================================================
-- Created: 2025-11-03
-- Purpose: Grandfathering existing users (created before email verification)
-- Reason: Users created before email verification implementation should not
--         be blocked on verify-email page. They can use the platform normally.
-- =============================================================================

-- Update existing users with NULL or FALSE email_verified to TRUE
-- Only for users created before 2025-11-03 (before email verification was enforced)
UPDATE users
SET email_verified = TRUE,
    updated_at = NOW()
WHERE email_verified IS NULL OR email_verified = FALSE
  AND created_at < '2025-11-03 00:00:00+00'::timestamptz;

-- Log the number of users updated
-- (This will appear in migration output)
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO updated_count
    FROM users
    WHERE email_verified = TRUE
      AND created_at < '2025-11-03 00:00:00+00'::timestamptz;

    RAISE NOTICE 'Updated % existing users to email_verified=TRUE', updated_count;
END $$;
