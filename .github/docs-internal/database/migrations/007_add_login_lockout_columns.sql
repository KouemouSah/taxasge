-- Migration: Add login lockout columns to users table
-- Date: 2025-01-09
-- Description: Add columns to track failed login attempts and account lockout
-- Related to: Account security - prevent brute force attacks

-- Add columns for login lockout mechanism
ALTER TABLE users
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS last_failed_ip VARCHAR(45) NULL;

-- Add comment to document the columns
COMMENT ON COLUMN users.failed_login_attempts IS 'Counter for consecutive failed login attempts (0-5). Reset on successful login.';
COMMENT ON COLUMN users.locked_until IS 'Timestamp until which the account is locked. NULL if not locked. Auto-unlock after this time.';
COMMENT ON COLUMN users.last_failed_ip IS 'IP address of the last failed login attempt. Used to detect IP changes.';

-- Create index for efficient lockout queries
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until) WHERE locked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_failed_attempts ON users(failed_login_attempts) WHERE failed_login_attempts > 0;

-- Optional: Add constraint to ensure failed_login_attempts is between 0 and 5
ALTER TABLE users ADD CONSTRAINT chk_failed_attempts_range CHECK (failed_login_attempts >= 0 AND failed_login_attempts <= 5);
