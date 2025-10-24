-- Create sessions table for authentication
-- Module 1: Authentication & User Management
-- Created: 2025-10-25

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    ip_address VARCHAR(45),  -- IPv6 max length
    user_agent TEXT,
    device_info JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,

    -- Indexes for performance
    CONSTRAINT sessions_id_key UNIQUE (id)
);

-- Create indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_access_token ON sessions(access_token);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Add comments
COMMENT ON TABLE sessions IS 'User authentication sessions with JWT tokens';
COMMENT ON COLUMN sessions.id IS 'Session unique identifier (UUID)';
COMMENT ON COLUMN sessions.user_id IS 'Reference to users table';
COMMENT ON COLUMN sessions.access_token IS 'JWT access token';
COMMENT ON COLUMN sessions.refresh_token IS 'JWT refresh token';
COMMENT ON COLUMN sessions.status IS 'Session status: active, expired, or revoked';
COMMENT ON COLUMN sessions.ip_address IS 'Client IP address';
COMMENT ON COLUMN sessions.user_agent IS 'Client user agent string';
COMMENT ON COLUMN sessions.device_info IS 'Additional device information (JSON)';
COMMENT ON COLUMN sessions.expires_at IS 'Session expiration timestamp';
COMMENT ON COLUMN sessions.created_at IS 'Session creation timestamp';
COMMENT ON COLUMN sessions.last_activity IS 'Last activity timestamp';
COMMENT ON COLUMN sessions.revoked_at IS 'Session revocation timestamp (if revoked)';
