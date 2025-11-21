"""
Update User Role to Admin
Updates the role of a specific user from 'citizen' to 'admin'
"""

import psycopg2
from datetime import datetime

# Database connection
DATABASE_URL = "postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres"

# User email to update
USER_EMAIL = "sah@emacsah.com"

def update_user_role():
    """Update user role to admin"""
    try:
        # Connect to database
        print(f"Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Check current role
        print(f"\nChecking current role for {USER_EMAIL}...")
        cursor.execute("""
            SELECT id, email, role_id, first_name, last_name
            FROM users
            WHERE email = %s
        """, (USER_EMAIL,))

        user = cursor.fetchone()
        if not user:
            print(f"[ERROR] User {USER_EMAIL} not found!")
            return

        user_id, email, current_role_id, first_name, last_name = user
        print(f"[OK] Found user: {first_name} {last_name} ({email})")
        print(f"  Current role_id: {current_role_id}")

        # Get admin role ID
        print(f"\nGetting admin role ID...")
        cursor.execute("""
            SELECT id, code, name
            FROM roles
            WHERE code = 'ADMIN'
        """)

        admin_role = cursor.fetchone()
        if not admin_role:
            print(f"[ERROR] Admin role not found!")
            return

        admin_role_id, admin_code, admin_name = admin_role
        print(f"[OK] Found admin role: {admin_name} ({admin_code}) - ID: {admin_role_id}")

        # Update user role
        print(f"\nUpdating user role...")
        cursor.execute("""
            UPDATE users
            SET role_id = %s,
                updated_at = %s
            WHERE email = %s
        """, (admin_role_id, datetime.now(), USER_EMAIL))

        # Also update in auth.users raw_user_meta_data
        print(f"Updating auth.users metadata...")
        cursor.execute("""
            UPDATE auth.users
            SET raw_user_meta_data = jsonb_set(
                COALESCE(raw_user_meta_data, '{}'::jsonb),
                '{role}',
                '"admin"'::jsonb
            ),
            updated_at = %s
            WHERE email = %s
        """, (datetime.now(), USER_EMAIL))

        # Commit changes
        conn.commit()
        print(f"\n[SUCCESS] Successfully updated role for {USER_EMAIL}")
        print(f"   New role: admin (role_id: {admin_role_id})")

        # Verify update
        print(f"\nVerifying update...")
        cursor.execute("""
            SELECT u.email, r.code, r.name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.email = %s
        """, (USER_EMAIL,))

        result = cursor.fetchone()
        if result:
            email, role_code, role_name = result
            print(f"[OK] Verified: {email} has role {role_name} ({role_code})")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"[ERROR] Error updating user role: {e}")
        if conn:
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("UPDATE USER ROLE TO ADMIN")
    print("=" * 60)
    update_user_role()
    print("\n" + "=" * 60)
