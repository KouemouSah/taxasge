"""
Execute seed_predefined_roles.sql - Assign permissions to system roles

This script safely executes the seed file that assigns permissions to the 8 system roles.
"""

import psycopg2
import os
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse


# Database configuration from .env
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres"
)


def parse_database_url(url):
    """Parse DATABASE_URL into connection parameters"""
    parsed = urlparse(url)
    return {
        'host': parsed.hostname,
        'port': parsed.port or 5432,
        'database': parsed.path[1:],  # Remove leading /
        'user': parsed.username,
        'password': parsed.password
    }


def execute_seed():
    """Execute the seed_predefined_roles.sql file"""

    print("=" * 80)
    print("SEED PREDEFINED ROLES - Assign Permissions to System Roles")
    print("=" * 80)
    print(f"Started at: {datetime.now().isoformat()}")
    print()

    # Get SQL file path
    current_dir = Path(__file__).parent
    seed_file = current_dir / "seed_predefined_roles.sql"

    if not seed_file.exists():
        print(f"[ERROR] Seed file not found at {seed_file}")
        return False

    print(f"[*] Reading seed file: {seed_file.name}")

    # Read SQL content
    with open(seed_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print(f"    File size: {len(sql_content)} bytes")
    print()

    # Parse database URL
    db_params = parse_database_url(DATABASE_URL)

    # Connect to database
    print("[*] Connecting to database...")
    print(f"    Host: {db_params['host']}")
    print(f"    Database: {db_params['database']}")
    try:
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor()
        print("    [OK] Connected successfully")
        print()
    except Exception as e:
        print(f"    [ERROR] Connection failed: {e}")
        return False

    try:
        # Verify prerequisites
        print("[*] Verifying prerequisites...")

        # Check roles exist
        cursor.execute("SELECT COUNT(*) FROM roles WHERE is_system = TRUE")
        roles_count = cursor.fetchone()[0]
        print(f"    System roles: {roles_count}")

        if roles_count < 8:
            print(f"    [WARNING] Expected 8 system roles, found {roles_count}")
            print("    Make sure migration 008 has been executed")

        # Check permissions exist
        cursor.execute("SELECT COUNT(*) FROM permissions")
        perms_count = cursor.fetchone()[0]
        print(f"    Permissions: {perms_count}")

        if perms_count == 0:
            print("    [WARNING] No permissions found in database")
            print("    Make sure permissions have been registered via initialize_permissions()")

        print()

        # Execute seed
        print("[*] Executing seed SQL...")
        cursor.execute(sql_content)
        conn.commit()
        print("    [OK] Seed executed successfully")
        print()

        # Verification
        print("[*] Verification Report")
        print("-" * 80)

        # Count total role-permission assignments
        cursor.execute("SELECT COUNT(*) FROM role_permissions WHERE granted = TRUE")
        total_assignments = cursor.fetchone()[0]
        print(f"Total permission grants: {total_assignments}")
        print()

        # Report by role
        print("Permissions by role:")
        cursor.execute("""
            SELECT r.code, r.name, COUNT(rp.permission_id) as perm_count
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = TRUE
            WHERE r.is_system = TRUE
            GROUP BY r.id, r.code, r.name
            ORDER BY perm_count DESC
        """)
        roles_report = cursor.fetchall()

        for role in roles_report:
            code, name, perm_count = role
            print(f"   {name:30} ({code:25}): {perm_count:3} permissions")

        print()
        print("=" * 80)
        print("[SUCCESS] SEED COMPLETED SUCCESSFULLY!")
        print("=" * 80)
        print(f"Completed at: {datetime.now().isoformat()}")

        return True

    except Exception as e:
        conn.rollback()
        print()
        print("=" * 80)
        print("[ERROR] ERROR DURING SEED EXECUTION")
        print("=" * 80)
        print(f"Error: {e}")
        print()
        import traceback
        traceback.print_exc()
        return False

    finally:
        cursor.close()
        conn.close()
        print()
        print("[*] Database connection closed")


if __name__ == "__main__":
    success = execute_seed()
    exit(0 if success else 1)
