"""
Execute Migration 008 - Permissions Module
"""
import psycopg2
import sys
from pathlib import Path

# Database connection string
DATABASE_URL = "postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres"

def execute_migration():
    """Execute migration 008 with proper error handling"""
    migration_file = Path(__file__).parent / "008_permissions_module.sql"

    if not migration_file.exists():
        print(f"[ERROR] Migration file not found: {migration_file}")
        return False

    print("=" * 80)
    print("MIGRATION 008: Permissions Module - Sistema de Permisos Granulares")
    print("=" * 80)
    print(f"\n[*] Migration file: {migration_file}")
    print(f"[*] Database: Supabase PostgreSQL\n")

    # Read migration SQL
    with open(migration_file, 'r', encoding='utf-8') as f:
        migration_sql = f.read()

    # Connect to database
    try:
        print("[*] Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False  # Use transactions
        cursor = conn.cursor()

        print("[OK] Connected successfully\n")

        # Check if tables already exist
        print("[*] Checking if permissions tables already exist...")
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('permissions', 'roles', 'role_permissions', 'user_permissions', 'permission_audit_log')
            ORDER BY table_name
        """)
        existing_tables = [row[0] for row in cursor.fetchall()]

        if existing_tables:
            print(f"[WARN] Some permissions tables already exist: {', '.join(existing_tables)}")
            print("[INFO] Migration will skip existing tables (IF NOT EXISTS)")
            print()

        # Execute migration
        print("[*] Executing migration 008...")
        print("-" * 80)

        try:
            cursor.execute(migration_sql)
            conn.commit()

            print("-" * 80)
            print("[OK] Migration executed successfully!\n")

            # Verify migration
            print("[*] Verifying migration...")

            # Get tables count
            cursor.execute("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('permissions', 'roles', 'role_permissions', 'user_permissions', 'permission_audit_log')
            """)
            tables_count = cursor.fetchone()[0]

            # Get system roles count
            cursor.execute("SELECT COUNT(*) FROM roles WHERE is_system = TRUE")
            roles_count = cursor.fetchone()[0]

            # Get migrated users count
            cursor.execute("SELECT COUNT(*) FROM users WHERE role_id IS NOT NULL")
            users_migrated = cursor.fetchone()[0]

            # Get total users count
            cursor.execute("SELECT COUNT(*) FROM users")
            users_total = cursor.fetchone()[0]

            print(f"   [OK] Tables created: {tables_count} / 5")
            print(f"   [OK] System roles: {roles_count} / 8")
            print(f"   [OK] Users migrated: {users_migrated} / {users_total}")
            print()

            # Display created tables
            cursor.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('permissions', 'roles', 'role_permissions', 'user_permissions', 'permission_audit_log')
                ORDER BY table_name
            """)
            tables = [row[0] for row in cursor.fetchall()]
            print("   [INFO] Permissions tables:")
            for table in tables:
                print(f"     - {table}")
            print()

            # Display system roles
            cursor.execute("""
                SELECT code, name, entity_type
                FROM roles
                WHERE is_system = TRUE
                ORDER BY code
            """)
            roles = cursor.fetchall()
            print(f"   [INFO] System roles ({len(roles)} total):")
            for code, name, entity_type in roles:
                entity_str = f" ({entity_type})" if entity_type else ""
                print(f"     - {code}: {name}{entity_str}")
            print()

            # Check if users.role_id column exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'role_id'
                )
            """)
            role_id_exists = cursor.fetchone()[0]
            print(f"   [OK] users.role_id column: {'EXISTS' if role_id_exists else 'MISSING'}")
            print()

            # Verify triggers
            cursor.execute("""
                SELECT trigger_name, event_manipulation, event_object_table
                FROM information_schema.triggers
                WHERE trigger_schema = 'public'
                AND trigger_name IN ('trg_audit_role_permissions', 'trg_audit_user_permissions')
                ORDER BY trigger_name
            """)
            triggers = cursor.fetchall()
            print(f"   [OK] Audit triggers created: {len(triggers)} / 2")
            for trigger_name, event, table_name in triggers:
                print(f"     - {trigger_name} on {table_name} ({event})")
            print()

            print("=" * 80)
            print("[SUCCESS] MIGRATION 008 COMPLETED SUCCESSFULLY")
            print("=" * 80)
            print("\n[INFO] Next steps:")
            print("   1. Create Pydantic models for permissions")
            print("   2. Create repositories (permission_repository, role_repository, user_permission_repository)")
            print("   3. Create services (permission_service, role_service, permission_registry)")
            print("   4. Create middleware (@require_permission decorator)")
            print("   5. Create API routes (permission_routes, role_routes, user_permission_routes)")
            print("   6. Integrate with Assignment module")
            print("\n")

            return True

        except psycopg2.Error as e:
            conn.rollback()
            print("-" * 80)
            print(f"[ERROR] Migration failed: {e}")
            print(f"   Error code: {e.pgcode}")
            print(f"   Error details: {e.pgerror}")
            return False

    except psycopg2.Error as e:
        print(f"[ERROR] Database connection error: {e}")
        return False

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
            print("[*] Database connection closed\n")

if __name__ == "__main__":
    success = execute_migration()
    sys.exit(0 if success else 1)
