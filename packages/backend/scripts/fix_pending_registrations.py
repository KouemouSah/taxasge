"""Fix pending_registrations table - drop bloated version, create minimal"""
import asyncio
import asyncpg
import sys
from pathlib import Path

DATABASE_URL = 'postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres'

async def fix_table():
    try:
        print("[*] Connecting to database...")
        conn = await asyncpg.connect(DATABASE_URL)

        migration_file = Path(__file__).parent.parent / 'migrations' / 'fix_pending_registrations_minimal.sql'
        with open(migration_file, 'r') as f:
            sql = f.read()

        print("[*] Dropping bloated table and creating minimal version...")
        await conn.execute(sql)

        # Verify
        col_count = await conn.fetchval("""
            SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name = 'pending_registrations'
        """)

        if col_count == 6:
            print(f"[OK] Table recreated with {col_count} columns (was 25)")
        else:
            print(f"[ERROR] Expected 6 columns, got {col_count}")
            sys.exit(1)

        await conn.close()
        print("[OK] Migration completed!")

    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(fix_table())
