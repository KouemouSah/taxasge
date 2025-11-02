-- ============================================================================
-- Migration: Add 2FA (Two-Factor Authentication) fields to users table
-- Task: TASK-M01-011
-- Date: 2025-11-02
-- Source: RAPPORT_MODULE_01_AUTHENTICATION.md lines 436-440
-- ============================================================================

-- Add 2FA fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(32),
  ADD COLUMN IF NOT EXISTS two_factor_backup_codes JSONB,
  ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMPTZ;

-- Create index for 2FA enabled users (optimization for 2FA login flow)
CREATE INDEX IF NOT EXISTS idx_users_two_factor_enabled
  ON users(two_factor_enabled)
  WHERE two_factor_enabled = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN users.two_factor_enabled IS 'Boolean flag indicating if 2FA is active for this user';
COMMENT ON COLUMN users.two_factor_secret IS 'TOTP secret (base32 encoded) for 2FA - ENCRYPTED';
COMMENT ON COLUMN users.two_factor_backup_codes IS 'Array of backup codes for 2FA recovery (hashed)';
COMMENT ON COLUMN users.two_factor_enabled_at IS 'Timestamp when 2FA was enabled';
