-- Migration 293: Document Level 3 delegation from user_agent_permissions
--
-- Purpose
-- -------
-- Migration 287 defined `user_agent_permissions` with:
--   CHECK (level IN (1, 2))
--   CHECK (permission_type IN ('prepare_renewal', 'prepare_request',
--                              'suggest_appointments', 'proactive_alerts',
--                              'auto_classify'))
--
-- These constraints are CORRECT and intentional for Level 1-2 (persistent
-- consent). Level 3 executive tools (submit_prepared_request,
-- book_appointment) live in a SEPARATE mechanism:
--
--   - Ephemeral single-use codes in Redis (TTL 5 minutes)
--   - Append-only audit trail in `agent_executive_audit_log` (migration 292)
--   - Per-action consent via modal (OWASP A04 — avoid "always allow" toggles
--     for irreversible government actions)
--
-- This migration only adds COMMENTs to make the cross-reference explicit in
-- the schema so any DBA inspecting the tables understands the delegation.
-- It touches no data.

BEGIN;

COMMENT ON TABLE user_agent_permissions IS
    'Persistent agent autonomy consents (Level 1 informational and '
    'Level 2 preparatory). Level 3 executive tools are handled by the '
    'separate confirmation_code mechanism — see agent_executive_audit_log '
    '(migration 292) and app/modules/chatbot/services/executive_consent.py.';

COMMENT ON COLUMN user_agent_permissions.level IS
    'Autonomy level: 1 = informational consent, 2 = preparatory (agent can '
    'modify state within user scope). Level 3 (executive) is NOT stored '
    'here — it uses per-action consent via Redis codes + audit log '
    '(see agent_executive_audit_log).';

COMMENT ON COLUMN user_agent_permissions.permission_type IS
    'Permission scope for Level 1-2 tools. The five allowed values match '
    'the frontend catalog exposed by GET /user-documents/agent/'
    'permission-catalog. Tools submit_prepared_request and book_appointment '
    'are Level 3 and are NOT listed here — they require confirmation_code '
    'redemption (see agent_executive_audit_log, migration 292).';

COMMIT;
