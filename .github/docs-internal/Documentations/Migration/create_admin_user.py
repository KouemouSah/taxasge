"""
Script pour créer un utilisateur administrateur
Avec email pré-vérifié et rôle admin assigné

Usage:
    python create_admin_user.py

Credentials:
    Email: sah@emacsah.com
    Password: Taxasge@25
    Role: admin
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Load environment variables
load_dotenv()

# Database connection parameters
DB_CONFIG = {
    'host': os.getenv('SUPABASE_DB_HOST'),
    'port': os.getenv('SUPABASE_DB_PORT', '5432'),
    'database': os.getenv('SUPABASE_DB_NAME'),
    'user': os.getenv('SUPABASE_DB_USER'),
    'password': os.getenv('SUPABASE_DB_PASSWORD')
}

# Admin user credentials
ADMIN_EMAIL = "sah@emacsah.com"
ADMIN_PASSWORD = "Taxasge@25"
ADMIN_NAME = "Admin System"

def get_db_connection():
    """Create database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        sys.exit(1)

def check_admin_role_exists(cursor) -> bool:
    """Check if admin role exists"""
    cursor.execute("""
        SELECT id, code, name
        FROM roles
        WHERE code = 'ADMIN' OR LOWER(name) = 'admin'
    """)
    role = cursor.fetchone()
    if role:
        print(f"✅ Admin role found: {role['name']} ({role['code']})")
        return True, role['id']
    else:
        print("⚠️  Admin role not found")
        return False, None

def create_admin_role(cursor) -> str:
    """Create admin role if it doesn't exist"""
    cursor.execute("""
        INSERT INTO roles (code, name, description, is_system, entity_type)
        VALUES ('ADMIN', 'Administrator', 'Super administrateur avec tous les droits', true, NULL)
        RETURNING id
    """)
    role_id = cursor.fetchone()['id']
    print(f"✅ Admin role created with ID: {role_id}")
    return role_id

def check_user_exists(cursor, email: str) -> bool:
    """Check if user already exists"""
    # Check in Supabase auth.users
    cursor.execute("""
        SELECT id, email, email_confirmed_at
        FROM auth.users
        WHERE email = %s
    """, (email,))
    auth_user = cursor.fetchone()

    if auth_user:
        print(f"✅ User exists in auth.users: {auth_user['email']}")
        print(f"   Email verified: {'Yes' if auth_user['email_confirmed_at'] else 'No'}")
        return True, auth_user['id']

    return False, None

def create_admin_user(cursor, role_id: str) -> str:
    """
    Create admin user in Supabase auth.users with email already confirmed
    """
    now = datetime.utcnow()

    # Insert into auth.users with email_confirmed_at set (email already verified)
    # Using PostgreSQL crypt() function directly for password hashing
    cursor.execute("""
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_sent_at,
            raw_app_meta_data,
            raw_user_meta_data
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            %s,
            crypt(%s, gen_salt('bf')),
            %s,
            %s,
            %s,
            %s,
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
            jsonb_build_object('full_name', %s, 'role', 'admin')
        )
        RETURNING id
    """, (
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
        now,  # email_confirmed_at - EMAIL ALREADY VERIFIED
        now,  # created_at
        now,  # updated_at
        now,  # confirmation_sent_at
        ADMIN_NAME
    ))

    user_id = cursor.fetchone()['id']
    print(f"✅ Admin user created in auth.users with ID: {user_id}")
    print(f"   Email: {ADMIN_EMAIL}")
    print(f"   Email verified: Yes (email_confirmed_at set)")

    return user_id

def create_user_profile(cursor, user_id: str, role_id: str):
    """Create user profile in public.users table"""
    cursor.execute("""
        INSERT INTO users (id, email, full_name, role_id, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE
        SET role_id = EXCLUDED.role_id,
            full_name = EXCLUDED.full_name,
            updated_at = EXCLUDED.updated_at
    """, (
        user_id,
        ADMIN_EMAIL,
        ADMIN_NAME,
        role_id,
        datetime.utcnow(),
        datetime.utcnow()
    ))
    print(f"✅ User profile created/updated in public.users")

def grant_all_permissions_to_admin(cursor, role_id: str):
    """Grant ALL permissions to admin role"""
    # Get all permissions
    cursor.execute("SELECT id, name FROM permissions")
    permissions = cursor.fetchall()

    print(f"📋 Found {len(permissions)} permissions in the system")

    # Grant each permission to admin role
    granted_count = 0
    for perm in permissions:
        try:
            cursor.execute("""
                INSERT INTO role_permissions (role_id, permission_id, granted)
                VALUES (%s, %s, true)
                ON CONFLICT (role_id, permission_id) DO UPDATE
                SET granted = true
            """, (role_id, perm['id']))
            granted_count += 1
        except Exception as e:
            print(f"⚠️  Warning: Could not grant permission {perm['name']}: {e}")

    print(f"✅ Granted {granted_count} permissions to admin role")

def main():
    """Main execution"""
    print("=" * 80)
    print("CRÉATION D'UTILISATEUR ADMINISTRATEUR")
    print("=" * 80)
    print()

    conn = None
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Step 1: Check/Create admin role
        print("📝 Step 1: Checking admin role...")
        role_exists, role_id = check_admin_role_exists(cursor)
        if not role_exists:
            role_id = create_admin_role(cursor)
        print()

        # Step 2: Check if user exists
        print("📝 Step 2: Checking if user exists...")
        user_exists, user_id = check_user_exists(cursor, ADMIN_EMAIL)
        print()

        if user_exists:
            print("⚠️  User already exists. Updating role and profile...")
            create_user_profile(cursor, user_id, role_id)
        else:
            # Step 3: Create admin user
            print("📝 Step 3: Creating admin user...")
            user_id = create_admin_user(cursor, role_id)
            print()

            # Step 4: Create user profile
            print("📝 Step 4: Creating user profile...")
            create_user_profile(cursor, user_id, role_id)
            print()

        # Step 5: Grant all permissions to admin role
        print("📝 Step 5: Granting all permissions to admin role...")
        grant_all_permissions_to_admin(cursor, role_id)
        print()

        # Commit transaction
        conn.commit()

        print("=" * 80)
        print("✅ SUCCESS - Admin user created successfully!")
        print("=" * 80)
        print()
        print("CREDENTIALS:")
        print(f"  Email: {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}")
        print(f"  Role: admin")
        print(f"  Email Verified: Yes (no verification needed)")
        print()
        print("You can now login with these credentials.")
        print("The email is already marked as verified, no email confirmation needed.")
        print()

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        if conn:
            conn.rollback()
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
