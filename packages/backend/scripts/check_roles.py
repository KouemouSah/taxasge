"""
Check user_role_enum values in database
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def main():
    DATABASE_URL = os.getenv("DATABASE_URL")

    # Connect to database
    conn = await asyncpg.connect(DATABASE_URL)

    print("✅ Connected to database")

    # Get enum values
    query = """
        SELECT enumlabel
        FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'user_role_enum'
        ORDER BY enumsortorder;
    """

    roles = await conn.fetch(query)

    print("\n📋 user_role_enum values in database:")
    for role in roles:
        print(f"  - {role['enumlabel']}")

    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
