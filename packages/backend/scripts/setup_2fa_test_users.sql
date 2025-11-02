-- ============================================================================
-- Setup Test Users for 2FA Login Integration Tests
-- ============================================================================
-- Purpose: Create test users in Supabase for running real DB integration tests
-- File: packages/backend/tests/integration/test_auth_2fa_login_endpoints.py
-- Task: TASK-M01-013 - 2FA Login Integration
-- ============================================================================

-- ============================================================================
-- Test User 1: WITH 2FA ENABLED
-- ============================================================================
-- Email: test_2fa_user@taxasge.com
-- Password: TestPass2FA123! (bcrypt hash below)
-- TOTP Secret: JBSWY3DPEHPK3PXP (base32 encoded)
-- Backup Codes: 2 codes (SHA256 hashed)

INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    status,
    two_factor_enabled,
    two_factor_secret,
    two_factor_backup_codes,
    two_factor_enabled_at,
    language,
    created_at,
    updated_at
) VALUES (
    'test_2fa_user_id_1234567890',
    'test_2fa_user@taxasge.com',
    -- Password: TestPass2FA123! (bcrypt 12 rounds)
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LdMxeCOgOCbOhq3i2',
    'Test',
    'User2FA',
    'citizen',
    'active',
    TRUE,  -- 2FA ENABLED
    'JBSWY3DPEHPK3PXP',  -- TOTP secret (use with Google Authenticator)
    -- 2 hashed backup codes (SHA256):
    -- Original codes (for testing):
    --   1234-5678 → hash: 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
    --   9876-5432 → hash: 7c222fb2927d828af22f592134e8932480637c0d6e5f8d4a9c51a0b6a0e3e8b6
    '[
        "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
        "7c222fb2927d828af22f592134e8932480637c0d6e5f8d4a9c51a0b6a0e3e8b6"
    ]'::jsonb,
    NOW(),
    'es',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    two_factor_enabled = EXCLUDED.two_factor_enabled,
    two_factor_secret = EXCLUDED.two_factor_secret,
    two_factor_backup_codes = EXCLUDED.two_factor_backup_codes,
    two_factor_enabled_at = EXCLUDED.two_factor_enabled_at,
    updated_at = NOW();

-- ============================================================================
-- Test User 2: WITHOUT 2FA (for comparison tests)
-- ============================================================================
-- Email: test_no2fa_user@taxasge.com
-- Password: TestPassNo2FA456! (bcrypt hash below)

INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    status,
    two_factor_enabled,
    two_factor_secret,
    two_factor_backup_codes,
    two_factor_enabled_at,
    language,
    created_at,
    updated_at
) VALUES (
    'test_no2fa_user_id_0987654321',
    'test_no2fa_user@taxasge.com',
    -- Password: TestPassNo2FA456! (bcrypt 12 rounds)
    '$2b$12$KLv2c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LdMxeCOgOCbOhq3i2',
    'Test',
    'UserNo2FA',
    'citizen',
    'active',
    FALSE,  -- 2FA DISABLED
    NULL,   -- No TOTP secret
    NULL,   -- No backup codes
    NULL,   -- Never enabled 2FA
    'es',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    two_factor_enabled = EXCLUDED.two_factor_enabled,
    two_factor_secret = EXCLUDED.two_factor_secret,
    two_factor_backup_codes = EXCLUDED.two_factor_backup_codes,
    two_factor_enabled_at = EXCLUDED.two_factor_enabled_at,
    updated_at = NOW();

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify test users were created
SELECT
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    two_factor_enabled,
    two_factor_secret,
    CASE
        WHEN two_factor_backup_codes IS NOT NULL
        THEN jsonb_array_length(two_factor_backup_codes) || ' codes'
        ELSE 'NULL'
    END as backup_codes_count,
    two_factor_enabled_at,
    created_at
FROM users
WHERE email IN ('test_2fa_user@taxasge.com', 'test_no2fa_user@taxasge.com')
ORDER BY email;

-- ============================================================================
-- Test Credentials Summary
-- ============================================================================
/*

USER 1 (WITH 2FA):
------------------
Email: test_2fa_user@taxasge.com
Password: TestPass2FA123!
TOTP Secret: JBSWY3DPEHPK3PXP

Generate TOTP code:
```python
import pyotp
totp = pyotp.TOTP('JBSWY3DPEHPK3PXP')
print(f"Current code: {totp.now()}")
```

Backup codes (for testing):
- 1234-5678
- 9876-5432


USER 2 (WITHOUT 2FA):
----------------------
Email: test_no2fa_user@taxasge.com
Password: TestPassNo2FA456!

No 2FA required - standard login flow.


MANUAL TEST (curl):
-------------------

# 1. Test login with 2FA enabled user (should return temp_token)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test_2fa_user@taxasge.com",
    "password": "TestPass2FA123!",
    "remember_me": false
  }'

# Expected response:
# {
#   "requires_2fa": true,
#   "temp_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "message": "2FA verification required. Please provide your 2FA code."
# }


# 2. Generate TOTP code (Python):
python -c "import pyotp; print(pyotp.TOTP('JBSWY3DPEHPK3PXP').now())"


# 3. Verify 2FA with code (replace <TEMP_TOKEN> and <CODE>)
curl -X POST http://localhost:8000/api/v1/auth/login/2fa-verify \
  -H "Content-Type: application/json" \
  -d '{
    "temp_token": "<TEMP_TOKEN>",
    "code": "<CODE>"
  }'

# Expected response:
# {
#   "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "token_type": "bearer",
#   "expires_in": 3600,
#   "user": {...}
# }


# 4. Test login WITHOUT 2FA (should return tokens immediately)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test_no2fa_user@taxasge.com",
    "password": "TestPassNo2FA456!",
    "remember_me": false
  }'

# Expected response (NO temp_token, direct access):
# {
#   "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "token_type": "bearer",
#   "expires_in": 3600,
#   "user": {...}
# }

*/

-- ============================================================================
-- Cleanup (if needed)
-- ============================================================================
-- Uncomment to delete test users:

-- DELETE FROM users WHERE email IN (
--     'test_2fa_user@taxasge.com',
--     'test_no2fa_user@taxasge.com'
-- );
