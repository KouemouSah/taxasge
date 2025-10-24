-- Create refresh_tokens table for token management
-- Module 1: Authentication & User Management
-- Created: 2025-10-25

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL,  -- Hashed refresh token (SHA-256)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT refresh_tokens_id_key UNIQUE (id),
    CONSTRAINT refresh_tokens_token_key UNIQUE (token)
);

-- Create indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_session_id ON refresh_tokens(session_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Add comments
COMMENT ON TABLE refresh_tokens IS 'Refresh tokens for JWT authentication with revocation support';
COMMENT ON COLUMN refresh_tokens.id IS 'Token unique identifier (UUID)';
COMMENT ON COLUMN refresh_tokens.token IS 'Hashed refresh token value (SHA-256)';
COMMENT ON COLUMN refresh_tokens.user_id IS 'Reference to users table';
COMMENT ON COLUMN refresh_tokens.session_id IS 'Reference to sessions table';
COMMENT ON COLUMN refresh_tokens.is_revoked IS 'Whether the token has been revoked';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'Token expiration timestamp';
COMMENT ON COLUMN refresh_tokens.created_at IS 'Token creation timestamp';
COMMENT ON COLUMN refresh_tokens.revoked_at IS 'Token revocation timestamp (if revoked)';
COMMENT ON COLUMN refresh_tokens.last_used_at IS 'Last time token was used for refresh';
