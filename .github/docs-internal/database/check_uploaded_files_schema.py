import os
import sys
sys.path.insert(0, r'C:\taxasge\packages\backend')

from dotenv import load_dotenv
load_dotenv(r'C:\taxasge\packages\backend\.env')

import asyncpg
import asyncio

async def main():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    result = await conn.fetch("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'uploaded_files'
        ORDER BY ordinal_position
    """)

    print(f"{'Column Name':<35} {'Type':<25} {'Nullable':<10} {'Default':<30}")
    print("=" * 110)
    for r in result:
        default = str(r['column_default'])[:28] if r['column_default'] else ''
        print(f"{r['column_name']:<35} {r['data_type']:<25} {r['is_nullable']:<10} {default:<30}")

    await conn.close()

asyncio.run(main())
