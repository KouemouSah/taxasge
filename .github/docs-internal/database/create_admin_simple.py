"""
Simple script to create admin user
No emojis, direct SQL approach
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection (from packages/backend/.env)
DATABASE_URL = "postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres"

# Admin credentials
ADMIN_EMAIL = "sah@emacsah.com"
ADMIN_PASSWORD = "Taxasge@25"
ADMIN_NAME = "Admin System"

print("=" * 80)
print("CREATION UTILISATEUR ADMINISTRATEUR")
print("=" * 80)
print()

try:
    # Connect
    print(f"[1/5] Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    cursor = conn.cursor()
    print("   OK: Connected successfully")
    print()

    # Check/Create admin role
    print("[2/5] Checking admin role...")
    cursor.execute("""
        SELECT id, code, name
        FROM roles
        WHERE code = 'ADMIN' OR LOWER(name) = 'admin'
    """)
    role = cursor.fetchone()

    if role:
        role_id = role['id']
        print(f"   OK: Admin role found: {role['name']} ({role['code']})")
    else:
        print("   Creating admin role...")
        cursor.execute("""
            INSERT INTO roles (code, name, description, is_system, entity_type)
            VALUES ('ADMIN', 'Administrator', 'Super administrateur avec tous les droits', true, NULL)
            RETURNING id
        """)
        role_id = cursor.fetchone()['id']
        print(f"   OK: Admin role created with ID: {role_id}")
    print()

    # Check if user exists
    print("[3/5] Checking if user exists...")
    cursor.execute("""
        SELECT id, email, email_confirmed_at
        FROM auth.users
        WHERE email = %s
    """, (ADMIN_EMAIL,))
    auth_user = cursor.fetchone()

    if auth_user:
        user_id = auth_user['id']
        print(f"   OK: User already exists: {auth_user['email']}")
        print(f"       Email verified: {'Yes' if auth_user['email_confirmed_at'] else 'No'}")
    else:
        print("   Creating admin user...")
        now = datetime.utcnow()

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
            now,  # email_confirmed_at
            now,  # created_at
            now,  # updated_at
            now,  # confirmation_sent_at
            ADMIN_NAME
        ))

        user_id = cursor.fetchone()['id']
        print(f"   OK: Admin user created with ID: {user_id}")
        print(f"       Email: {ADMIN_EMAIL}")
        print(f"       Email verified: Yes (pre-verified)")
    print()

    # Create/Update user profile
    print("[4/5] Creating/updating user profile...")
    cursor.execute("""
        INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, created_at, updated_at)
        VALUES (%s, %s, crypt(%s, gen_salt('bf')), %s, %s, %s, %s, %s)
        ON CONFLICT (email) DO UPDATE
        SET role_id = EXCLUDED.role_id,
            password_hash = EXCLUDED.password_hash,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            updated_at = EXCLUDED.updated_at
    """, (
        user_id,
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
        "Admin",  # first_name
        "System",  # last_name
        role_id,
        datetime.utcnow(),
        datetime.utcnow()
    ))
    print("   OK: User profile created/updated")
    print()

    # Grant all permissions to admin role
    print("[5/5] Granting permissions to admin role...")
    cursor.execute("SELECT id, name FROM permissions")
    permissions = cursor.fetchall()
    print(f"   Found {len(permissions)} permissions")

    granted = 0
    for perm in permissions:
        try:
            cursor.execute("""
                INSERT INTO role_permissions (role_id, permission_id, granted)
                VALUES (%s, %s, true)
                ON CONFLICT (role_id, permission_id) DO UPDATE
                SET granted = true
            """, (role_id, perm['id']))
            granted += 1
        except:
            pass

    print(f"   OK: Granted {granted} permissions to admin role")
    print()

    # Commit
    conn.commit()

    print("=" * 80)
    print("SUCCESS - Admin user created successfully!")
    print("=" * 80)
    print()
    print("CREDENTIALS:")
    print(f"  Email: {ADMIN_EMAIL}")
    print(f"  Password: {ADMIN_PASSWORD}")
    print(f"  Role: admin")
    print(f"  Email Verified: Yes")
    print()
    print("You can now login with these credentials.")
    print()

except Exception as e:
    print(f"\nERROR: {e}")
    if conn:
        conn.rollback()
    sys.exit(1)
finally:
    if conn:
        conn.close()
