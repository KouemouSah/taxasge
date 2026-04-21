# Security

## Overview

Facil handles sensitive government data for Equatorial Guinea's citizens. Security is built into every layer of the application, following OWASP best practices.

## Authentication

### JWT Token Flow

```
Client                          Backend
  |                                |
  |-- POST /auth/login ---------->|
  |   { email, password }         |
  |                                |-- bcrypt verify (12 rounds)
  |                                |-- Check 2FA requirement
  |<-- { access_token (30min),    |
  |      refresh_token (30 days)} |
  |                                |
  |-- GET /api/v1/resource ------>|
  |   Authorization: Bearer <AT>  |
  |                                |-- Verify JWT signature
  |                                |-- Check token expiry
  |                                |-- Extract user_id, role
  |<-- { data }                   |
  |                                |
  |-- POST /auth/refresh -------->|
  |   { refresh_token }           |
  |                                |-- Verify refresh token
  |                                |-- Check revocation list
  |<-- { new_access_token }       |
```

### Token Configuration

| Parameter | Value |
|-----------|-------|
| Access token TTL | 30 minutes |
| Refresh token TTL | 30 days |
| Algorithm | HS256 |
| Password hashing | bcrypt (12 rounds) |
| Token storage | `sessions` + `refresh_tokens` tables |

### Two-Factor Authentication (2FA)

- **Protocol**: TOTP (Time-based One-Time Password)
- **Library**: pyotp (RFC 6238 compliant)
- **QR Code**: Generated via `pyotp.totp.TOTP.provisioning_uri()`
- **Recovery**: Backup codes stored hashed in DB

Flow:
1. User enables 2FA via `/auth/2fa/setup` (returns secret + QR code)
2. User scans QR with authenticator app (Google Authenticator, Authy)
3. User confirms setup via `/auth/2fa/verify` with first TOTP code
4. On subsequent logins, server returns `{ requires_2fa: true, temp_token }`
5. User submits TOTP code via `/auth/2fa/validate` to get real access token

## Role-Based Access Control (RBAC)

### Architecture

```
User
  |
  +-- has Role(s)  ---------> Role
  |                              |
  |                              +-- has Permission(s) --> Permission
  |
  +-- has Override(s) -------> UserPermission (per-user grant/deny)
```

### Numbers

| Entity | Count |
|--------|-------|
| Roles | 47 |
| Permissions | 335 |
| Built-in user roles | citizen, business, accountant, admin, supervisor, dgi_agent, ministry_agent |

### Permission Guard Pattern

```python
from app.modules.auth.dependencies import get_current_user, require_permissions

@router.get("/admin/users")
async def list_users(
    user = Depends(get_current_user),
    _perms = Depends(require_permissions("users.read_all")),
    conn = Depends(get_db)
):
    ...
```

### Permission Categories

| Category | Examples | Count |
|----------|----------|-------|
| users.* | users.read_all, users.update, users.delete | ~15 |
| declarations.* | declarations.create, declarations.review, declarations.approve | ~20 |
| payments.* | payments.read, payments.validate, payments.refund | ~15 |
| service_requests.* | service_requests.read, service_requests.assign, service_requests.decide | ~25 |
| admin.* | admin.users.manage, admin.roles.manage, admin.system.configure | ~30 |
| agents.* | agents.read, agents.manage, agents.workload | ~15 |
| (and more) | communications.*, support.*, translations.*, etc. | ~215 |

### Cache Invalidation

Permissions are cached in Redis (10 min TTL) and invalidated in real-time:

```
DB trigger (role_permissions change)
  --> PostgreSQL NOTIFY 'rbac_invalidation'
    --> rbac_listener.py
      --> Redis DEL user_permissions:{user_id}
```

## SQL Injection Prevention

All database queries use **parameterized queries** via asyncpg:

```python
# CORRECT - parameterized
query = "SELECT * FROM users WHERE email = $1 AND status = $2"
row = await conn.fetchrow(query, email, "active")

# NEVER - string formatting (would be a critical vulnerability)
# query = f"SELECT * FROM users WHERE email = '{email}'"
```

This is enforced by code review and the asyncpg library which requires positional parameters.

## Security Headers

Applied via `SecurityHeadersMiddleware` (pure ASGI):

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (production only) |

CSP (Content-Security-Policy) is set by the frontend Next.js middleware, not the backend, to avoid conflicting policies.

## CORS Configuration

```python
# Production origins (allowlist)
"https://taxasge.emacsah.com"
"https://taxasge-dev.web.app"
"https://taxasge-pro.web.app"
"https://taxasge-dev.firebaseapp.com"
"https://taxasge-pro.firebaseapp.com"

# Staging channel regex
r"https://taxasge-(dev|frontend-staging)--[\w-]+\.(web\.app|run\.app)"

# Development (debug mode only)
"http://localhost:3000"
"http://localhost:3001"
```

## Rate Limiting

Implemented via Upstash Redis:

```python
from app.core.cache import check_rate_limit

is_allowed, remaining = await check_rate_limit(
    user_id="user-uuid",
    endpoint="/api/v1/chatbot/ask",
    max_requests=100,
    window_seconds=60
)
```

| Endpoint Category | Limit |
|------------------|-------|
| General API | 1000 req/hour per user |
| Chatbot | 100 req/min per user |
| Auth (login) | 10 attempts/15 min per IP |
| Auth (register) | 5 attempts/hour per IP |

## Audit Logging

All significant actions are logged to the `audit_logs` table:

| Field | Description |
|-------|-------------|
| `user_id` | Who performed the action |
| `action` | What was done (e.g., `user.login`, `payment.approved`) |
| `resource_type` | Target type (user, payment, declaration, etc.) |
| `resource_id` | Target identifier |
| `details` | JSONB with before/after state |
| `ip_address` | Client IP |
| `user_agent` | Client user agent |
| `created_at` | When it happened |

Audit events are published via the EventBus and handled asynchronously by the `AuditHandler`.

## Payment Security

- **Pessimistic locking**: `SELECT ... FOR UPDATE` on payments during processing
- **Lock history**: Every lock/unlock recorded in `payment_lock_history`
- **Validation audit**: Every validation step recorded in `payment_validation_audit`
- **BANGE webhooks**: HMAC signature verification on callbacks
- **Receipt verification**: Public endpoint to verify receipt authenticity via QR code

## AI Chatbot Security

- **Prompt injection detection**: System prompts are isolated; user input is sanitized
- **Rate limiting**: Strict per-user limits on AI endpoints
- **Context scoping**: RAG retrieval limited to public fiscal service information
- **No PII in embeddings**: Embeddings contain only service descriptions, not user data

## Database Security

- **Connection via Supabase**: TLS-encrypted connections
- **Connection pooling**: asyncpg pool with configurable min/max connections
- **Transaction timeouts**: `SET LOCAL lock_timeout = '3s'; SET LOCAL statement_timeout = '5s';`
- **Row-Level Security (RLS)**: Supabase RLS policies on sensitive tables

## Secret Management

Production secrets are stored in **Google Cloud Secret Manager**, not in environment variables or code:

```python
from app.core.secrets import get_secret

secret_value = await get_secret("BANGE_API_KEY")
```

Development uses `.env` files (excluded from git via `.gitignore`).

## CodeQL Security Scanning

GitHub CodeQL runs weekly on `main`/`develop` branches, scanning both Python and JavaScript/TypeScript for:
- SQL injection
- Cross-site scripting (XSS)
- Path traversal
- Insecure deserialization
- Hardcoded credentials
