# Database Migrations for TaxasGE Backend

This directory contains SQL migration scripts for the TaxasGE database.

## Migration Files

### Module 1: Authentication & User Management

- `001_create_sessions_table.sql` - Creates the sessions table for JWT authentication
- `002_create_refresh_tokens_table.sql` - Creates the refresh_tokens table for token management

## Running Migrations

### Using Supabase Dashboard

1. Open your Supabase project at https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Copy the content of each migration file in order (001, 002, etc.)
4. Paste and run each script

### Using Supabase CLI

```bash
# Apply all migrations
supabase db push

# Or apply individual migrations
psql $DATABASE_URL -f 001_create_sessions_table.sql
psql $DATABASE_URL -f 002_create_refresh_tokens_table.sql
```

### Using Python Script

```python
from app.core.supabase import get_supabase_client

supabase = get_supabase_client()

# Read and execute migration
with open('database/migrations/001_create_sessions_table.sql') as f:
    sql = f.read()
    # Execute via Supabase admin API or direct PostgreSQL connection
```

## Table Schemas

### sessions

Stores user authentication sessions with JWT tokens.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Session unique identifier |
| user_id | UUID | Reference to users table |
| access_token | TEXT | JWT access token |
| refresh_token | TEXT | JWT refresh token |
| status | VARCHAR(20) | Session status (active, expired, revoked) |
| ip_address | VARCHAR(45) | Client IP address |
| user_agent | TEXT | Client user agent |
| device_info | JSONB | Additional device information |
| expires_at | TIMESTAMPTZ | Session expiration time |
| created_at | TIMESTAMPTZ | Session creation time |
| last_activity | TIMESTAMPTZ | Last activity timestamp |
| revoked_at | TIMESTAMPTZ | Revocation timestamp (if revoked) |

### refresh_tokens

Stores refresh tokens with revocation support.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Token unique identifier |
| token | TEXT | Hashed refresh token (SHA-256) |
| user_id | UUID | Reference to users table |
| session_id | UUID | Reference to sessions table |
| is_revoked | BOOLEAN | Whether token is revoked |
| expires_at | TIMESTAMPTZ | Token expiration time |
| created_at | TIMESTAMPTZ | Token creation time |
| revoked_at | TIMESTAMPTZ | Revocation timestamp (if revoked) |
| last_used_at | TIMESTAMPTZ | Last use timestamp |

## Notes

- All migrations use `CREATE TABLE IF NOT EXISTS` to be idempotent
- Foreign keys are set with `ON DELETE CASCADE` for automatic cleanup
- Indexes are created for common query patterns
- Timestamps use `TIMESTAMP WITH TIME ZONE` for timezone awareness
- UUIDs are auto-generated using `gen_random_uuid()`
