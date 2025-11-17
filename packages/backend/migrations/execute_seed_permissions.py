"""
Execute seed_permissions.sql - Insert all module permissions
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
    """Execute the seed_permissions.sql file"""

    print("=" * 80)
    print("SEED PERMISSIONS - Insert Module Permissions")
    print("=" * 80)
    print(f"Started at: {datetime.now().isoformat()}")
    print()

    # Get SQL file path
    current_dir = Path(__file__).parent
    seed_file = current_dir / "seed_permissions.sql"

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

        # Check permissions table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'permissions'
            )
        """)
        table_exists = cursor.fetchone()[0]

        if not table_exists:
            print("    [ERROR] permissions table does not exist")
            print("    Make sure migration 008 has been executed")
            return False

        print("    [OK] permissions table exists")
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

        # Count total permissions
        cursor.execute("SELECT COUNT(*) FROM permissions")
        total_permissions = cursor.fetchone()[0]
        print(f"Total permissions: {total_permissions}")

        # Count by module
        cursor.execute("""
            SELECT module_name, COUNT(*) as count
            FROM permissions
            GROUP BY module_name
            ORDER BY module_name
        """)
        modules = cursor.fetchall()

        print()
        print("Permissions by module:")
        for module_name, count in modules:
            print(f"   {module_name:25} {count:3} permissions")

        # Count critical permissions
        cursor.execute("SELECT COUNT(*) FROM permissions WHERE is_critical = TRUE")
        critical_count = cursor.fetchone()[0]

        print()
        print(f"Critical permissions: {critical_count}")

        print()
        print("=" * 80)
        print("[SUCCESS] PERMISSIONS SEED COMPLETED SUCCESSFULLY!")
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
