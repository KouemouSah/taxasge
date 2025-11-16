import psycopg2
import os

# Connection string from .env
DATABASE_URL = "postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres"

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Get users table schema
    print("=" * 80)
    print("USERS TABLE SCHEMA")
    print("=" * 80)
    cursor.execute("""
        SELECT
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position;
    """)

    print(f"\n{'Column':<30} {'Type':<20} {'Nullable':<10} {'Default':<30}")
    print("-" * 90)
    for row in cursor.fetchall():
        col_name = row[0]
        data_type = row[1]
        max_length = row[2]
        nullable = row[3]
        default = row[4] or ''

        if max_length:
            data_type = f"{data_type}({max_length})"

        print(f"{col_name:<30} {data_type:<20} {nullable:<10} {str(default):<30}")

    # Check if companies table exists
    print("\n" + "=" * 80)
    print("COMPANIES TABLE SCHEMA")
    print("=" * 80)
    cursor.execute("""
        SELECT
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_name = 'companies' AND table_schema = 'public'
        ORDER BY ordinal_position;
    """)

    rows = cursor.fetchall()
    if rows:
        print(f"\n{'Column':<30} {'Type':<20} {'Nullable':<10} {'Default':<30}")
        print("-" * 90)
        for row in rows:
            col_name = row[0]
            data_type = row[1]
            max_length = row[2]
            nullable = row[3]
            default = row[4] or ''

            if max_length:
                data_type = f"{data_type}({max_length})"

            print(f"{col_name:<30} {data_type:<20} {nullable:<10} {str(default):<30}")
    else:
        print("\nTable 'companies' does not exist")

    # Get enum types
    print("\n" + "=" * 80)
    print("ENUM TYPES")
    print("=" * 80)
    cursor.execute("""
        SELECT
            t.typname as enum_name,
            e.enumlabel as enum_value
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        ORDER BY t.typname, e.enumsortorder;
    """)

    current_enum = None
    for row in cursor.fetchall():
        enum_name = row[0]
        enum_value = row[1]

        if enum_name != current_enum:
            print(f"\n{enum_name}:")
            current_enum = enum_name
        print(f"  - {enum_value}")

    cursor.close()
    conn.close()

    print("\n" + "=" * 80)
    print("Schema extraction completed successfully!")
    print("=" * 80)

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
