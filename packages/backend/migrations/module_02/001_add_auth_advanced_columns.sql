-- =============================================================================
-- MODULE_02: Authentication Advanced Features - Migration SQL
-- =============================================================================
-- Created: 2025-11-01
-- Purpose: Add columns for email verification, password reset, and 2FA
-- Tables: users
-- =============================================================================

-- =============================================================================
-- EMAIL VERIFICATION (Priority 1)
-- =============================================================================

-- ✅ email_verified ALREADY EXISTS (verified by check_database.py 2025-11-01)
-- Column: email_verified | Type: boolean | Nullable: YES | Default: false

-- Verification code (6 digits)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(6);

-- Verification code expiration
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- PASSWORD RESET (Priority 1)
-- =============================================================================

-- Reset token (32 characters random)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);

-- Reset token expiration (1 hour validity)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- TWO-FACTOR AUTHENTICATION - 2FA (Priority 2 - Optional)
-- =============================================================================

-- 2FA enabled flag
ALTER TABLE users
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

-- 2FA secret (TOTP secret - 32 characters)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(64);

-- 2FA backup codes (JSON array of 10 backup codes)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS two_factor_backup_codes JSONB;

-- =============================================================================
-- INDEXES (Performance optimization)
-- =============================================================================

-- Index for email verification lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verification_code
ON users(email_verification_code)
WHERE email_verification_code IS NOT NULL;

-- Index for password reset lookups
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token
ON users(password_reset_token)
WHERE password_reset_token IS NOT NULL;

-- ✅ email_verified index - column already exists, creating index only
CREATE INDEX IF NOT EXISTS idx_users_email_verified
ON users(email_verified)
WHERE email_verified = TRUE;

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================

COMMENT ON COLUMN users.email_verified IS 'Flag indicating if user email has been verified';
COMMENT ON COLUMN users.email_verification_code IS '6-digit code sent by email for verification (expires in 15 min)';
COMMENT ON COLUMN users.email_verification_expires_at IS 'Expiration timestamp for email verification code';

COMMENT ON COLUMN users.password_reset_token IS 'Random token (32 chars) for password reset (expires in 1 hour)';
COMMENT ON COLUMN users.password_reset_expires_at IS 'Expiration timestamp for password reset token';

COMMENT ON COLUMN users.two_factor_enabled IS 'Flag indicating if 2FA is enabled for this user';
COMMENT ON COLUMN users.two_factor_secret IS 'TOTP secret for 2FA authentication';
COMMENT ON COLUMN users.two_factor_backup_codes IS 'Array of 10 backup codes for 2FA recovery (hashed)';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Verify columns were added successfully (email_verified already existed)
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN (
    'email_verified',  -- ✅ Already existed (verified 2025-11-01)
    'email_verification_code',  -- ➕ Added by this migration
    'email_verification_expires_at',  -- ➕ Added by this migration
    'password_reset_token',  -- ➕ Added by this migration
    'password_reset_expires_at',  -- ➕ Added by this migration
    'two_factor_enabled',  -- ➕ Added by this migration
    'two_factor_secret',  -- ➕ Added by this migration
    'two_factor_backup_codes'  -- ➕ Added by this migration
)
ORDER BY ordinal_position;

-- =============================================================================
-- ROLLBACK SCRIPT (in case of issues)
-- =============================================================================

/*
-- Uncomment to rollback migration

-- Drop indexes
DROP INDEX IF EXISTS idx_users_email_verification_code;
DROP INDEX IF EXISTS idx_users_password_reset_token;
DROP INDEX IF EXISTS idx_users_email_verified;

-- Drop columns (DO NOT drop email_verified - it already existed before migration!)
-- ALTER TABLE users DROP COLUMN IF EXISTS email_verified;  -- ❌ DO NOT DROP - existed before migration
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_code;
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_expires_at;
ALTER TABLE users DROP COLUMN IF EXISTS password_reset_token;
ALTER TABLE users DROP COLUMN IF EXISTS password_reset_expires_at;
ALTER TABLE users DROP COLUMN IF EXISTS two_factor_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS two_factor_secret;
ALTER TABLE users DROP COLUMN IF EXISTS two_factor_backup_codes;
*/

-- =============================================================================
-- END MIGRATION
-- =============================================================================
