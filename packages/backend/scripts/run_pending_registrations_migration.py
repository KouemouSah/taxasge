"""
Migration script to create pending_registrations table
Executes the SQL migration for the new two-step registration flow
"""
import asyncio
import asyncpg
import sys
from pathlib import Path

DATABASE_URL = 'postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres'

async def run_migration():
    """Execute the pending_registrations table migration"""
    try:
        print("[*] Connecting to database...")
        conn = await asyncpg.connect(DATABASE_URL)

        # Read migration SQL
        migration_file = Path(__file__).parent.parent / 'migrations' / 'create_pending_registrations.sql'
        with open(migration_file, 'r') as f:
            sql = f.read()

        print("[*] Executing migration...")
        await conn.execute(sql)
        print("[OK] Migration executed successfully")

        # Verify table exists
        result = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'pending_registrations'
            )
        """)

        if result:
            print("[OK] Table 'pending_registrations' created successfully")

            # Count columns
            col_count = await conn.fetchval("""
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_name = 'pending_registrations'
            """)
            print(f"[OK] Table has {col_count} columns")

            # List indexes
            indexes = await conn.fetch("""
                SELECT indexname
                FROM pg_indexes
                WHERE tablename = 'pending_registrations'
            """)
            print(f"[OK] Created {len(indexes)} indexes:")
            for idx in indexes:
                print(f"   - {idx['indexname']}")
        else:
            print("[ERROR] Table creation failed")
            sys.exit(1)

        await conn.close()
        print("\n[OK] Migration completed successfully!")

    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_migration())
