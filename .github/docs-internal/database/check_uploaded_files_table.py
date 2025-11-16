#!/usr/bin/env python3
"""Check if uploaded_files table exists and its schema"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_root = Path(__file__).parent / "packages" / "backend"
sys.path.insert(0, str(backend_root))

from app.database.db_manager import db_manager

async def check_table():
    """Check uploaded_files table"""
    try:
        # Check if table exists
        query = """
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'uploaded_files'
            );
        """
        result = await db_manager.execute_single(query)
        exists = result.get("exists") if result else False

        print(f"Table 'uploaded_files' exists: {exists}")

        if exists:
            # Get table schema
            schema_query = """
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'uploaded_files'
                ORDER BY ordinal_position;
            """
            columns = await db_manager.execute_query(schema_query)

            print(f"\nTable schema ({len(columns)} columns):")
            for col in columns:
                nullable = "NULL" if col["is_nullable"] == "YES" else "NOT NULL"
                default = f" DEFAULT {col['column_default']}" if col['column_default'] else ""
                print(f"  - {col['column_name']}: {col['data_type']} {nullable}{default}")
        else:
            print("\n❌ Table 'uploaded_files' does NOT exist in database")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_table())
