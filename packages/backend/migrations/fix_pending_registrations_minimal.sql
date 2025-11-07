-- Migration: Fix pending_registrations table (minimal version)
-- Drop bloated 25-column table, create clean 6-column table
-- Author: Claude Code (after user challenge)
-- Date: 2025-11-07

-- Drop existing bloated table
DROP TABLE IF EXISTS pending_registrations CASCADE;

-- Create minimal table (ONLY what's needed for email verification)
CREATE TABLE pending_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    verification_code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verification_attempts INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_pending_registrations_email ON pending_registrations(email);
CREATE INDEX idx_pending_registrations_expires_at ON pending_registrations(expires_at);

-- Comments
COMMENT ON TABLE pending_registrations IS 'Stores email verification codes. Expires after 15 minutes. Minimal by design.';
COMMENT ON COLUMN pending_registrations.verification_code IS '6-digit code sent to user email';
COMMENT ON COLUMN pending_registrations.expires_at IS 'Expires 15 minutes after creation';
COMMENT ON COLUMN pending_registrations.verification_attempts IS 'Max 5 attempts before deletion';
