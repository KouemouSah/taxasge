-- Migration 007: Add login lockout columns to users table
-- Feature: Account lockout mechanism (brute force protection)
-- Locks account after 5 failed login attempts for 10 minutes

-- Add lockout tracking columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_failed_ip VARCHAR(45);

-- Add index for lockout checking (performance optimization)
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until) WHERE locked_until IS NOT NULL;

-- Comment on columns
COMMENT ON COLUMN users.failed_login_attempts IS 'Number of consecutive failed login attempts (resets to 0 on successful login or IP change)';
COMMENT ON COLUMN users.locked_until IS 'Timestamp when account lockout expires (NULL if not locked)';
COMMENT ON COLUMN users.last_failed_ip IS 'IP address of last failed login attempt (used to reset counter if IP changes)';
