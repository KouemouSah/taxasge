"""
TaxasGE Database Schema Extractor
Extracts complete database schema from Supabase for reference
"""
import psycopg2
from datetime import datetime

# Connection string from .env
DATABASE_URL = "postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres"

output = []

def add_section(title, char="="):
    output.append("\n" + char * 100)
    output.append(title)
    output.append(char * 100 + "\n")

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    add_section("TAXASGE DATABASE SCHEMA - COMPLETE REFERENCE", "=")
    output.append(f"Extracted on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    output.append("Database: Supabase PostgreSQL")
    output.append("Project: taxasge-dev")

    # ========================================================================
    # 1. LIST ALL TABLES
    # ========================================================================
    add_section("1. ALL TABLES IN PUBLIC SCHEMA")
    cursor.execute("""
        SELECT
            table_name,
            (SELECT obj_description(c.oid)
             FROM pg_class c
             JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = t.table_name AND n.nspname = 'public') as description
        FROM information_schema.tables t
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """)

    tables = []
    for row in cursor.fetchall():
        tables.append(row[0])
        desc = row[1] or "No description"
        output.append(f"  - {row[0]:<40} {desc}")

    # ========================================================================
    # 2. ENUM TYPES
    # ========================================================================
    add_section("2. ENUM TYPES")
    cursor.execute("""
        SELECT DISTINCT
            t.typname as enum_name
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        ORDER BY t.typname;
    """)

    enum_types = [row[0] for row in cursor.fetchall()]

    for enum_name in enum_types:
        output.append(f"\n{enum_name}:")
        cursor.execute("""
            SELECT e.enumlabel
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public' AND t.typname = %s
            ORDER BY e.enumsortorder;
        """, (enum_name,))

        for row in cursor.fetchall():
            output.append(f"  - {row[0]}")

    # ========================================================================
    # 3. DETAILED TABLE SCHEMAS
    # ========================================================================
    add_section("3. DETAILED TABLE SCHEMAS")

    for table_name in tables:
        add_section(f"Table: {table_name.upper()}", "-")

        # Get table columns
        cursor.execute("""
            SELECT
                column_name,
                data_type,
                udt_name,
                character_maximum_length,
                is_nullable,
                column_default,
                col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) as column_description
            FROM information_schema.columns
            WHERE table_name = %s AND table_schema = 'public'
            ORDER BY ordinal_position;
        """, (table_name,))

        columns = cursor.fetchall()

        output.append(f"\n{'Column':<35} {'Type':<25} {'Nullable':<10} {'Default':<30}")
        output.append("-" * 100)

        for col in columns:
            col_name = col[0]
            data_type = col[1]
            udt_name = col[2]
            max_length = col[3]
            nullable = col[4]
            default = col[5] or ''
            description = col[6] or ''

            # Format type
            if data_type == 'USER-DEFINED':
                display_type = udt_name
            elif data_type == 'character varying' and max_length:
                display_type = f"varchar({max_length})"
            elif data_type == 'character' and max_length:
                display_type = f"char({max_length})"
            else:
                display_type = data_type

            output.append(f"{col_name:<35} {display_type:<25} {nullable:<10} {str(default)[:30]:<30}")
            if description:
                output.append(f"  └─ Description: {description}")

        # Get primary key
        cursor.execute("""
            SELECT a.attname
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = %s::regclass AND i.indisprimary;
        """, (table_name,))

        pk_cols = [row[0] for row in cursor.fetchall()]
        if pk_cols:
            output.append(f"\nPrimary Key: {', '.join(pk_cols)}")

        # Get foreign keys
        cursor.execute("""
            SELECT
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.update_rule,
                rc.delete_rule
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            JOIN information_schema.referential_constraints AS rc
              ON rc.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = %s
              AND tc.table_schema = 'public';
        """, (table_name,))

        fks = cursor.fetchall()
        if fks:
            output.append("\nForeign Keys:")
            for fk in fks:
                output.append(f"  - {fk[0]} → {fk[1]}.{fk[2]} (ON UPDATE {fk[3]}, ON DELETE {fk[4]})")

        # Get unique constraints
        cursor.execute("""
            SELECT
                con.conname AS constraint_name,
                STRING_AGG(att.attname, ', ' ORDER BY att.attnum) AS columns
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
            JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
            WHERE nsp.nspname = 'public'
              AND rel.relname = %s
              AND con.contype = 'u'
            GROUP BY con.conname;
        """, (table_name,))

        unique_constraints = cursor.fetchall()
        if unique_constraints:
            output.append("\nUnique Constraints:")
            for uc in unique_constraints:
                output.append(f"  - {uc[0]}: ({uc[1]})")

        # Get indexes
        try:
            cursor.execute("""
                SELECT
                    indexname,
                    indexdef
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND tablename = %s
                  AND indexname NOT LIKE '%%_pkey';
            """, (table_name,))

            indexes = cursor.fetchall()
            if indexes:
                output.append("\nIndexes:")
                for idx in indexes:
                    output.append(f"  - {idx[0]}")
                    if len(idx) > 1 and idx[1]:
                        output.append(f"    {idx[1]}")
        except Exception as e:
            output.append(f"\nError fetching indexes for {table_name}: {str(e)}")

    # ========================================================================
    # 4. VIEWS
    # ========================================================================
    add_section("4. VIEWS")
    cursor.execute("""
        SELECT
            table_name,
            view_definition
        FROM information_schema.views
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)

    views = cursor.fetchall()
    if views:
        for view in views:
            output.append(f"\nView: {view[0]}")
            output.append(f"Definition: {view[1][:200]}...")
    else:
        output.append("\nNo views found in public schema")

    # ========================================================================
    # 5. FUNCTIONS
    # ========================================================================
    add_section("5. FUNCTIONS")
    try:
        cursor.execute("""
            SELECT
                routine_name,
                data_type
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            ORDER BY routine_name;
        """)

        functions = cursor.fetchall()
        if functions:
            for func in functions:
                output.append(f"\nFunction: {func[0]}")
                output.append(f"Returns: {func[1]}")
        else:
            output.append("\nNo custom functions found in public schema")
    except Exception as e:
        output.append(f"\nError fetching functions: {str(e)}")

    # ========================================================================
    # 6. RELATIONSHIP SUMMARY
    # ========================================================================
    add_section("6. TABLE RELATIONSHIPS SUMMARY")
    cursor.execute("""
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name;
    """)

    relationships = cursor.fetchall()
    if relationships:
        for rel in relationships:
            output.append(f"{rel[0]}.{rel[1]} → {rel[2]}.{rel[3]}")

    cursor.close()
    conn.close()

    # Write to file
    schema_content = "\n".join(output)
    with open("DATABASE_SCHEMA_REFERENCE.md", "w", encoding="utf-8") as f:
        f.write(schema_content)

    print("SUCCESS: Schema extraction completed successfully!")
    print(f"Schema saved to: DATABASE_SCHEMA_REFERENCE.md")
    print(f"Total tables: {len(tables)}")
    print(f"Total enums: {len(enum_types)}")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
