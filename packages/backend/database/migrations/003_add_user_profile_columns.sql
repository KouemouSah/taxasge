-- Migration: 003_add_user_profile_columns.sql
-- Description: Add profile columns (address, city, avatar_url) to users table
-- Date: 2025-10-30
-- Author: Claude Code

-- Add profile columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city) WHERE city IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.address IS 'User street address';
COMMENT ON COLUMN users.city IS 'User city';
COMMENT ON COLUMN users.avatar_url IS 'User profile picture URL';

-- Verification query (for manual checking)
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- AND column_name IN ('address', 'city', 'avatar_url')
-- ORDER BY column_name;
