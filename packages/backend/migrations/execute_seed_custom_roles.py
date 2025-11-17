#!/usr/bin/env python3
"""
Execute seed_custom_roles.sql against Supabase database
Creates 3 custom roles examples:
- supervisor_dgi_junior (limited permissions)
- supervisor_readonly (read-only access)
- supervisor_senior (all permissions)

Date: 2025-11-17
Author: Claude Code
"""

import os
import sys
import psycopg2
from pathlib import Path

# Database connection from .env
DATABASE_URL = "postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres"

def execute_seed():
    """Execute seed_custom_roles.sql"""

    # Get script directory
    script_dir = Path(__file__).parent
    sql_file = script_dir / "seed_custom_roles.sql"

    if not sql_file.exists():
        print(f"[ERROR] SQL file not found: {sql_file}")
        sys.exit(1)

    print("=" * 80)
    print("SEED CUSTOM ROLES - Execution")
    print("=" * 80)
    print(f"SQL File: {sql_file}")
    print(f"Database: Supabase (bpdzfkymgydjxxwlctam)")
    print("=" * 80)

    # Read SQL file
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print(f"\nSQL Script loaded ({len(sql_content)} characters)")

    # Connect to database
    print("\nConnecting to Supabase...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False  # Use transaction
        cursor = conn.cursor()
        print("[OK] Connected successfully")

        # Execute SQL
        print("\nExecuting seed_custom_roles.sql...")
        cursor.execute(sql_content)

        # Get results from verification queries
        print("\n" + "=" * 80)
        print("VERIFICATION RESULTS")
        print("=" * 80)

        # Fetch all result sets
        results_count = 0
        while True:
            try:
                rows = cursor.fetchall()
                if rows:
                    results_count += 1
                    print(f"\n--- Result Set {results_count} ---")

                    # Get column names
                    if cursor.description:
                        columns = [desc[0] for desc in cursor.description]
                        print(f"Columns: {', '.join(columns)}")
                        print("-" * 80)

                        for row in rows:
                            print(row)

                # Try to move to next result set
                if not cursor.nextset():
                    break
            except Exception as e:
                # No more results
                break

        # Commit transaction
        conn.commit()
        print("\n" + "=" * 80)
        print("[SUCCESS] SEED COMPLETED SUCCESSFULLY")
        print("=" * 80)

        # Summary query
        cursor.execute("""
            SELECT
                code,
                name,
                entity_type,
                is_system
            FROM roles
            WHERE code IN ('supervisor_dgi_junior', 'supervisor_readonly', 'supervisor_senior')
            ORDER BY code;
        """)

        roles = cursor.fetchall()
        print("\nCustom Roles Created:")
        for role in roles:
            print(f"  - {role[0]:30s} | {role[1]:35s} | Entity: {role[2] or 'Global':10s} | System: {role[3]}")

        # Count permissions per role
        cursor.execute("""
            SELECT
                r.code,
                COUNT(rp.permission_id) AS permissions_count,
                COUNT(CASE WHEN p.is_critical THEN 1 END) AS critical_count
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = TRUE
            LEFT JOIN permissions p ON rp.permission_id = p.id
            WHERE r.code IN ('supervisor_dgi_junior', 'supervisor_readonly', 'supervisor_senior')
            GROUP BY r.code
            ORDER BY permissions_count DESC;
        """)

        permissions = cursor.fetchall()
        print("\nPermissions Count:")
        for perm in permissions:
            print(f"  - {perm[0]:30s} | Total: {perm[1]:2d} permissions | Critical: {perm[2]:2d}")

        cursor.close()
        conn.close()

        print("\n[OK] Database connection closed")
        print("=" * 80)

    except psycopg2.Error as e:
        print(f"\n[ERROR] DATABASE ERROR:")
        print(f"   {e}")
        if conn:
            conn.rollback()
            conn.close()
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] UNEXPECTED ERROR:")
        print(f"   {e}")
        if conn:
            conn.rollback()
            conn.close()
        sys.exit(1)

if __name__ == "__main__":
    execute_seed()
