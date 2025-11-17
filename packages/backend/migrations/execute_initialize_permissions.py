"""
Initialize Permissions - Register all module permissions to database (Synchronous)

This script manually initializes permissions by:
1. Registering all module permissions (Assignment, Declarations)
2. Inserting them directly into the database using psycopg2
"""

import psycopg2
import os
import sys
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse
import uuid

# Add backend to path to import modules
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

# Database configuration
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


def initialize_all_permissions():
    """Initialize all module permissions"""

    print("=" * 80)
    print("INITIALIZE PERMISSIONS - Register Module Permissions to Database")
    print("=" * 80)
    print(f"Started at: {datetime.now().isoformat()}")
    print()

    try:
        # Import permission registration functions
        print("[*] Importing permission modules...")
        from app.modules.permissions.services.permission_registry import PermissionRegistry
        from app.modules.assignment.permissions import register_assignment_permissions
        from app.api.v1.declarations_permissions import register_declarations_permissions
        print("    [OK] Modules imported successfully")
        print()

        # Clear registry first (to ensure clean state)
        PermissionRegistry.clear_registry()

        # Register all module permissions (in-memory registry)
        print("[*] Registering module permissions...")
        register_assignment_permissions()
        print("    [OK] Assignment permissions registered")

        register_declarations_permissions()
        print("    [OK] Declarations permissions registered")
        print()

        # Get statistics
        stats = PermissionRegistry.get_stats()
        print(f"    Total modules: {stats['module_count']}")
        print(f"    Total permissions: {stats['permission_count']}")
        print()

        # Get all registered permissions
        registered_perms = PermissionRegistry.get_registered_permissions()

        # Connect to database
        print("[*] Connecting to database...")
        db_params = parse_database_url(DATABASE_URL)
        print(f"    Host: {db_params['host']}")
        print(f"    Database: {db_params['database']}")

        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor()
        print("    [OK] Connected successfully")
        print()

        # Insert permissions into database
        print("[*] Inserting permissions into database...")
        created_count = 0
        skipped_count = 0

        for module_name, permissions in registered_perms.items():
            print(f"    Processing module: {module_name}")

            for perm in permissions:
                name, resource, action, description, is_critical = perm

                try:
                    # Check if permission already exists
                    cursor.execute(
                        "SELECT id FROM permissions WHERE name = %s",
                        (name,)
                    )
                    existing = cursor.fetchone()

                    if existing:
                        skipped_count += 1
                    else:
                        # Insert new permission
                        perm_id = str(uuid.uuid4())
                        cursor.execute("""
                            INSERT INTO permissions (
                                id, name, resource, action, description,
                                is_critical, module_name, created_at, updated_at
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                        """, (
                            perm_id, name, resource, action, description,
                            is_critical, module_name
                        ))
                        created_count += 1

                except Exception as e:
                    print(f"        [ERROR] Failed to insert {name}: {e}")
                    conn.rollback()
                    raise

            print(f"        {module_name}: done")

        # Commit all inserts
        conn.commit()
        print("    [OK] All permissions inserted")
        print()

        # Results
        print("[*] Synchronization Results")
        print("-" * 80)
        print(f"Created (new):     {created_count}")
        print(f"Skipped (exist):   {skipped_count}")
        print(f"Total permissions: {created_count + skipped_count}")
        print()

        # Verification - Count permissions in database
        print("[*] Database Verification")
        print("-" * 80)

        cursor.execute("SELECT COUNT(*) FROM permissions")
        total_perms = cursor.fetchone()[0]
        print(f"Permissions in database: {total_perms}")

        # Count by module
        cursor.execute("""
            SELECT resource, COUNT(*) as count
            FROM permissions
            GROUP BY resource
            ORDER BY resource
        """)
        modules = cursor.fetchall()

        print()
        print("Permissions by module:")
        for resource, count in modules:
            print(f"   {resource:30} {count:3} permissions")

        print()
        print("=" * 80)
        print("[SUCCESS] PERMISSIONS INITIALIZED SUCCESSFULLY!")
        print("=" * 80)
        print(f"Completed at: {datetime.now().isoformat()}")

        # Close connection
        cursor.close()
        conn.close()
        print()
        print("[*] Database connection closed")

        return True

    except ImportError as e:
        print()
        print("=" * 80)
        print("[ERROR] IMPORT ERROR")
        print("=" * 80)
        print(f"Error: {e}")
        print()
        print("Make sure the backend modules are properly structured:")
        print("- app/modules/permissions/services/__init__.py")
        print("- app/modules/assignment/permissions.py")
        print("- app/api/v1/declarations_permissions.py")
        return False

    except Exception as e:
        print()
        print("=" * 80)
        print("[ERROR] ERROR DURING INITIALIZATION")
        print("=" * 80)
        print(f"Error: {e}")
        print()
        import traceback
        traceback.print_exc()

        # Rollback if connection exists
        try:
            if 'conn' in locals():
                conn.rollback()
                conn.close()
        except:
            pass

        return False


if __name__ == "__main__":
    success = initialize_all_permissions()
    exit(0 if success else 1)
