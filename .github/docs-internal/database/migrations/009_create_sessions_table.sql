-- Migration 009: Create sessions table for authentication
-- Date: 2025-11-01
-- Description: Create sessions table required for user authentication with JWT tokens

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  status character varying NOT NULL DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'expired'::character varying, 'revoked'::character varying]::text[])),
  ip_address character varying,
  user_agent text,
  device_info jsonb,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  revoked_at timestamp with time zone,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_access_token ON public.sessions(access_token);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON public.sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- Enable Row Level Security
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only read their own sessions
CREATE POLICY "Users can view their own sessions"
  ON public.sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own sessions
CREATE POLICY "Users can create their own sessions"
  ON public.sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own sessions
CREATE POLICY "Users can update their own sessions"
  ON public.sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own sessions
CREATE POLICY "Users can delete their own sessions"
  ON public.sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can do everything (for backend API)
CREATE POLICY "Service role has full access"
  ON public.sessions
  FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Add comment
COMMENT ON TABLE public.sessions IS 'User authentication sessions with JWT tokens';
