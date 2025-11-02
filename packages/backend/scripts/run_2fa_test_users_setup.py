"""
Setup 2FA Test Users in Supabase

Creates test users for 2FA login integration tests:
- test_2fa_user@taxasge.com (WITH 2FA enabled)
- test_no2fa_user@taxasge.com (WITHOUT 2FA)

Usage:
    python scripts/run_2fa_test_users_setup.py

Requirements:
    - SUPABASE_URL environment variable
    - SUPABASE_SERVICE_ROLE_KEY environment variable (or DB password)
    - asyncpg library (pip install asyncpg)

Source: TASK-M01-013 - 2FA Login Integration
"""

import asyncio
import os
from pathlib import Path
import asyncpg


async def run_migration():
    """Execute 2FA test users setup on Supabase database."""

    # Get Supabase credentials from environment
    supabase_url = os.getenv("SUPABASE_URL")
    db_password = os.getenv("SUPABASE_DB_PASSWORD") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url:
        raise ValueError(
            "SUPABASE_URL environment variable not set. "
            "Example: https://xxxxx.supabase.co"
        )

    if not db_password:
        raise ValueError(
            "SUPABASE_DB_PASSWORD or SUPABASE_SERVICE_ROLE_KEY environment variable not set"
        )

    # Extract project ref from Supabase URL
    # Example: https://abcdefghij.supabase.co → abcdefghij
    project_ref = supabase_url.replace("https://", "").replace(".supabase.co", "")

    # Construct PostgreSQL connection string
    connection_string = (
        f"postgresql://postgres:{db_password}@"
        f"db.{project_ref}.supabase.co:5432/postgres"
    )

    print(f"🔗 Connecting to Supabase database...")
    print(f"   Project: {project_ref}")

    try:
        # Connect to database
        conn = await asyncpg.connect(connection_string)
        print(f"✅ Connected to Supabase database")

        # Read migration SQL file
        sql_file = Path(__file__).parent / "setup_2fa_test_users.sql"
        if not sql_file.exists():
            raise FileNotFoundError(f"SQL file not found: {sql_file}")

        migration_sql = sql_file.read_text(encoding="utf-8")
        print(f"📄 Loaded SQL file: {sql_file.name}")

        # Execute migration
        print(f"\n🚀 Executing migration...")
        await conn.execute(migration_sql)
        print(f"✅ Migration executed successfully")

        # Verify users were created
        print(f"\n🔍 Verifying test users...")
        users = await conn.fetch("""
            SELECT
                email,
                first_name,
                last_name,
                two_factor_enabled,
                two_factor_secret,
                CASE
                    WHEN two_factor_backup_codes IS NOT NULL
                    THEN jsonb_array_length(two_factor_backup_codes)
                    ELSE 0
                END as backup_codes_count
            FROM users
            WHERE email IN ('test_2fa_user@taxasge.com', 'test_no2fa_user@taxasge.com')
            ORDER BY email
        """)

        if not users:
            print("❌ No test users found after migration")
            return

        print(f"✅ Found {len(users)} test user(s):\n")

        for user in users:
            print(f"   📧 {user['email']}")
            print(f"      Name: {user['first_name']} {user['last_name']}")
            print(f"      2FA: {'ENABLED' if user['two_factor_enabled'] else 'DISABLED'}")
            if user['two_factor_enabled']:
                print(f"      Secret: {user['two_factor_secret']}")
                print(f"      Backup codes: {user['backup_codes_count']} codes")
            print()

        # Close connection
        await conn.close()
        print(f"✅ Migration complete!\n")

        # Print next steps
        print("=" * 70)
        print("NEXT STEPS")
        print("=" * 70)
        print("\n1. Generate TOTP code for testing:")
        print("   python -c \"import pyotp; print(pyotp.TOTP('JBSWY3DPEHPK3PXP').now())\"")

        print("\n2. Test login with 2FA (should return temp_token):")
        print("   curl -X POST http://localhost:8000/api/v1/auth/login \\")
        print("     -H 'Content-Type: application/json' \\")
        print("     -d '{\"email\": \"test_2fa_user@taxasge.com\", \"password\": \"TestPass2FA123!\"}' | python -m json.tool")

        print("\n3. Update test file constants:")
        print("   File: tests/integration/test_auth_2fa_login_endpoints.py")
        print("   TEST_2FA_USER_EMAIL = 'test_2fa_user@taxasge.com'")
        print("   TEST_2FA_USER_PASSWORD = 'TestPass2FA123!'")
        print("   TEST_2FA_USER_SECRET = 'JBSWY3DPEHPK3PXP'")

        print("\n4. Uncomment skipped tests")

        print("\n5. Run integration tests:")
        print("   pytest tests/integration/test_auth_2fa_login_endpoints.py -v")
        print()

    except asyncpg.exceptions.InvalidPasswordError:
        print("❌ Authentication failed. Check SUPABASE_DB_PASSWORD.")
    except asyncpg.exceptions.InvalidCatalogNameError:
        print(f"❌ Database not found. Check project ref: {project_ref}")
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise


if __name__ == "__main__":
    print("=" * 70)
    print("2FA TEST USERS SETUP")
    print("=" * 70)
    print()

    # Check required dependencies
    try:
        import asyncpg
    except ImportError:
        print("❌ asyncpg library not found.")
        print("   Install: pip install asyncpg")
        exit(1)

    try:
        import pyotp
    except ImportError:
        print("⚠️  pyotp library not found (optional for TOTP generation).")
        print("   Install: pip install pyotp")

    # Run migration
    asyncio.run(run_migration())
