#!/usr/bin/env python3
"""
Migration script to add 2FA fields to users table.

TASK-M01-011: Two-Factor Authentication Implementation
Source: RAPPORT_MODULE_01_AUTHENTICATION.md lines 436-440

Usage:
    python scripts/run_2fa_migration.py

Requirements:
    - SUPABASE_URL environment variable
    - SUPABASE_SERVICE_KEY environment variable
"""

import os
import sys
import asyncpg
from datetime import datetime


async def run_migration():
    """Execute 2FA migration on Supabase database."""

    # Get Supabase connection string
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url:
        print("❌ ERROR: SUPABASE_URL environment variable not set")
        sys.exit(1)

    # Extract database connection details from Supabase URL
    # Format: https://PROJECT_REF.supabase.co
    project_ref = supabase_url.replace("https://", "").replace(".supabase.co", "")

    # Supabase PostgreSQL connection string
    # Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
    db_password = os.getenv("SUPABASE_DB_PASSWORD", "")

    if not db_password:
        print("⚠️  WARNING: SUPABASE_DB_PASSWORD not set, using SUPABASE_SERVICE_KEY")
        db_password = supabase_key

    connection_string = f"postgresql://postgres:{db_password}@db.{project_ref}.supabase.co:5432/postgres"

    print("🔄 Starting 2FA migration...")
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Target: users table")

    try:
        # Connect to database
        conn = await asyncpg.connect(connection_string)
        print("✅ Connected to Supabase database")

        # Read migration SQL
        script_dir = os.path.dirname(os.path.abspath(__file__))
        migration_file = os.path.join(script_dir, "add_2fa_fields.sql")

        with open(migration_file, "r") as f:
            migration_sql = f.read()

        print("📄 Executing migration SQL...")

        # Execute migration
        await conn.execute(migration_sql)

        print("✅ Migration completed successfully!")

        # Verify columns were added
        columns_query = """
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name IN ('two_factor_enabled', 'two_factor_secret',
                              'two_factor_backup_codes', 'two_factor_enabled_at')
        ORDER BY column_name;
        """

        columns = await conn.fetch(columns_query)

        print("\n📊 Verification - 2FA columns added:")
        for col in columns:
            print(f"  - {col['column_name']}: {col['data_type']} "
                  f"(nullable: {col['is_nullable']}, default: {col['column_default']})")

        # Count users with 2FA enabled (should be 0 after migration)
        count_query = "SELECT COUNT(*) as count FROM users WHERE two_factor_enabled = TRUE"
        result = await conn.fetchrow(count_query)
        print(f"\n📈 Users with 2FA enabled: {result['count']}")

        await conn.close()
        print("\n✅ Migration complete and verified!")

    except Exception as e:
        print(f"❌ ERROR: Migration failed")
        print(f"   {type(e).__name__}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_migration())
