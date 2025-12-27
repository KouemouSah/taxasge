# Two-Factor Authentication (2FA) TOTP Module Command

Implement or enhance the Two-Factor Authentication system using TOTP (Time-based One-Time Password).

## Context

**2FA/TOTP Module** provides secure two-factor authentication for TaxasGE users:
- **TOTP Implementation** (RFC 6238) using pyotp
- **QR Code Generation** for authenticator apps (Google Authenticator, Authy, etc.)
- **Backup Codes** (10 one-time recovery codes)
- **Multi-step Setup** (generate → verify → enable)
- **Login Verification** (TOTP code or backup code)

## Existing Implementation

**Backend Module:** `packages/backend/app/modules/auth/`

**Key Files:**
- `services/two_factor_service.py` - Core 2FA logic (TOTP, QR codes, backup codes)
- `api/two_factor_routes.py` - API endpoints (/2fa/enable, /2fa/verify, /2fa/disable, /2fa/status)
- `models/two_factor_models.py` - Pydantic models

**Database Schema:**
```sql
users:
  - two_factor_enabled BOOLEAN DEFAULT false
  - two_factor_secret VARCHAR(32) -- Base32-encoded TOTP secret
  - two_factor_backup_codes JSONB -- Array of hashed backup codes
```

## Architecture

### Setup Workflow (2-Step Process)
1. **POST /2fa/enable**
   - Generate TOTP secret (base32)
   - Generate QR code (SVG format)
   - Generate 10 backup codes (8 digits each: XXXX-XXXX)
   - Return to user (NOT saved to DB yet)
   - User scans QR code with authenticator app

2. **POST /2fa/verify**
   - User enters 6-digit code from authenticator app
   - Backend verifies code against secret
   - If valid: Save secret + hashed backup codes to DB
   - If invalid: Return error, user must retry

### Login Workflow
1. User enters email + password (standard login)
2. If 2FA enabled: Prompt for 6-digit code
3. User enters TOTP code OR backup code
4. Backend verifies:
   - TOTP code: Valid for 90 seconds (±1 window)
   - Backup code: One-time use, removed after validation
5. If valid: Issue JWT token
6. If invalid: Return error

### Disable Workflow
1. **POST /2fa/disable**
   - Requires current password confirmation
   - Clear secret and backup codes from DB
   - Set two_factor_enabled = false

## Instructions

### Step 1: Read Existing Implementation
```bash
Read packages/backend/app/modules/auth/services/two_factor_service.py
Read packages/backend/app/modules/auth/api/two_factor_routes.py
Read packages/backend/app/modules/auth/models/two_factor_models.py
```

### Step 2: Understand Current Features

**Implemented:**
- [x] TOTP secret generation (pyotp.random_base32())
- [x] QR code generation (SVG format)
- [x] Backup codes (10 codes, SHA256 hashed)
- [x] 2-step setup (enable → verify)
- [x] Login verification (TOTP + backup codes)
- [x] Password-protected disable
- [x] Status endpoint

**Potential Enhancements:**
- [ ] Rate limiting (prevent brute-force on 2FA codes)
- [ ] Trusted devices (remember device for 30 days)
- [ ] SMS fallback (Phase 2)
- [ ] Email fallback (emergency access)
- [ ] Admin force-disable (for account recovery)
- [ ] 2FA enforcement by role (admins must use 2FA)

### Step 3: Use Subagents for Development

Launch 3 subagents in parallel for enhancements:

#### Subagent 1: Rate Limiting & Security
```markdown
Task: Add rate limiting to 2FA verification endpoints

Implement in packages/backend/app/modules/auth/:

1. Rate Limiting Rules:
   - /2fa/verify: Max 5 attempts per 15 minutes (setup phase)
   - /auth/login (2FA step): Max 10 attempts per 30 minutes
   - Per user IP + user_id combination
   - Exponential backoff after 3 failures

2. Implementation:
   - Use Redis for rate limit tracking
   - Key format: "2fa_attempts:{user_id}:{ip}"
   - Store: attempt_count, first_attempt_at, locked_until
   - Lockout: 30 minutes after 10 failed attempts

3. Response Handling:
   - 429 Too Many Requests when rate limit exceeded
   - Include Retry-After header
   - Clear rate limit on successful verification

4. Admin Override:
   - Admin can reset rate limits for user
   - POST /admin/users/{id}/reset-2fa-rate-limit

Return: Rate limiting implementation, Redis integration
```

#### Subagent 2: Trusted Devices
```markdown
Task: Implement trusted device management (remember device for 30 days)

Create in packages/backend/app/modules/auth/:

1. Database Schema:
   ```sql
   trusted_devices:
     - id UUID PRIMARY KEY
     - user_id UUID FK → users.id
     - device_fingerprint VARCHAR(64) -- Browser + OS + IP hash
     - device_name VARCHAR(100) -- "Chrome on Windows"
     - trusted_at TIMESTAMP
     - expires_at TIMESTAMP -- 30 days from trusted_at
     - last_used_at TIMESTAMP
     - revoked_at TIMESTAMP
   ```

2. Device Fingerprinting:
   - Combine: User-Agent + IP address + Accept-Language
   - Hash with SHA256 for unique device_fingerprint
   - Include device_name extraction (browser + OS)

3. Endpoints:
   - POST /auth/login (2FA step) - Add "trust_device" checkbox
   - GET /2fa/devices - List trusted devices
   - DELETE /2fa/devices/{id} - Revoke trusted device
   - DELETE /2fa/devices - Revoke all devices

4. Workflow:
   - After 2FA verification succeeds
   - If trust_device=true: Create trusted_devices record
   - Issue special JWT claim: device_trusted=true
   - On next login: Check if device_fingerprint exists + not expired
   - If trusted: Skip 2FA prompt

5. Security:
   - Max 5 trusted devices per user
   - Auto-expire after 30 days of inactivity
   - Revoke all on password change
   - Revoke all on 2FA disable

Return: Trusted device system, device fingerprinting logic
```

#### Subagent 3: 2FA Frontend UI
```markdown
Task: Create 2FA setup and verification UI components

Create in packages/web/src/modules/auth/:

1. Components:
   - TwoFactorSetup.tsx (QR code display + verification)
   - BackupCodes.tsx (display backup codes with download/print)
   - TwoFactorVerification.tsx (login 2FA prompt)
   - TrustedDevices.tsx (list/revoke trusted devices)
   - TwoFactorSettings.tsx (enable/disable 2FA)

2. Setup Flow (TwoFactorSetup.tsx):
   - Step 1: Scan QR Code
     - Display QR code (SVG rendered)
     - Show manual entry key (for no-camera devices)
     - "Open in Google Authenticator" link (otpauth:// URL)
   - Step 2: Verify Code
     - Input: 6-digit code
     - Real-time validation (no spaces, only digits)
     - Auto-submit on 6 digits entered
   - Step 3: Save Backup Codes
     - Display 10 backup codes
     - Download as TXT file button
     - Print button
     - "I've saved my backup codes" checkbox (required)

3. Login Flow (TwoFactorVerification.tsx):
   - Input: 6-digit code
   - "Use backup code instead" link
   - "Trust this device for 30 days" checkbox
   - Auto-focus on mount
   - Countdown timer (30 seconds until code expires)

4. Settings (TwoFactorSettings.tsx):
   - Status: Enabled/Disabled
   - Enable button → Launch setup flow
   - Disable button → Password confirmation dialog
   - Regenerate backup codes
   - View trusted devices

5. Hooks:
   - useEnable2FA() - Setup flow
   - useVerify2FASetup() - Verification
   - useDisable2FA() - Disable with password
   - useVerify2FALogin() - Login verification
   - useTrustedDevices() - Manage devices

Return: Complete 2FA UI system, UX flow decisions
```

## Key Features

### 1. TOTP Standard (RFC 6238)
- 6-digit codes
- 30-second validity window (±1 window = 90 seconds total)
- Base32-encoded secret
- SHA1 HMAC algorithm

### 2. Backup Codes
- 10 codes per user
- Format: XXXX-XXXX (8 digits with dash)
- One-time use (removed after use)
- Stored as SHA256 hashes
- Warn when <3 codes remaining

### 3. Security Best Practices
- Secrets NOT saved until verified
- Password required to disable 2FA
- Backup codes hashed in database
- Rate limiting on verification attempts
- Trusted device expiration

### 4. User Experience
- QR code for easy setup
- Manual entry option (no camera)
- Clear instructions and guidance
- Backup codes download/print
- Auto-focus and auto-submit

## Testing Scenarios

### Happy Path
1. User enables 2FA from settings
2. Scan QR code with Google Authenticator
3. Enter code from app
4. Verification succeeds → 2FA enabled
5. Download backup codes
6. Next login: Prompted for 6-digit code
7. Enter code → Login successful

### Backup Code Usage
1. User loses authenticator device
2. Login with email + password
3. Click "Use backup code instead"
4. Enter backup code: 1234-5678
5. Login successful, code removed from DB
6. User has 9 backup codes remaining

### Rate Limiting
1. Attacker tries brute-force 2FA codes
2. After 5 failed attempts → Rate limited
3. 429 error: "Too many attempts, try again in 15 minutes"
4. Legitimate user waits, can retry after cooldown

### Trusted Device
1. User logs in with 2FA
2. Checks "Trust this device for 30 days"
3. Device fingerprint saved
4. Next login from same browser/IP → No 2FA prompt
5. Login from different browser → 2FA required

## Checklist

- [ ] Read existing 2FA implementation
- [ ] Understand TOTP workflow (enable → verify → login)
- [ ] Test QR code generation
- [ ] Test backup code verification
- [ ] Add rate limiting (Redis)
- [ ] Implement trusted devices
- [ ] Create 2FA setup UI
- [ ] Create 2FA login UI
- [ ] Test with Google Authenticator
- [ ] Test backup code flow
- [ ] Add 2FA status to user profile
- [ ] Document setup process for users
