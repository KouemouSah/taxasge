-- Migration: Create pending_registrations table
-- Purpose: Store temporary registration data before email verification
-- Author: Claude Code
-- Date: 2025-11-07

-- Table to store pending registrations awaiting email verification
CREATE TABLE IF NOT EXISTS pending_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    verification_code VARCHAR(6) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('citizen', 'business')),

    -- Citizen profile fields (optional)
    national_id VARCHAR(50),
    birth_date DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(50),
    occupation VARCHAR(100),

    -- Business profile fields (optional)
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    tax_id VARCHAR(100),
    registration_number VARCHAR(100),
    industry VARCHAR(100),
    employee_count INTEGER,
    annual_revenue DECIMAL(15, 2),
    website VARCHAR(255),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verification_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_pending_registrations_email ON pending_registrations(email);

-- Index for expiration cleanup (cron job)
CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires_at ON pending_registrations(expires_at);

-- Index for verification code lookups
CREATE INDEX IF NOT EXISTS idx_pending_registrations_verification_code ON pending_registrations(verification_code);

-- Comments
COMMENT ON TABLE pending_registrations IS 'Stores temporary registration data awaiting email verification. Records expire after 15 minutes.';
COMMENT ON COLUMN pending_registrations.verification_code IS '6-digit verification code sent to user email';
COMMENT ON COLUMN pending_registrations.expires_at IS 'Timestamp when this pending registration expires (15 minutes from creation)';
COMMENT ON COLUMN pending_registrations.verification_attempts IS 'Number of times user attempted to verify with wrong code (max 5)';
