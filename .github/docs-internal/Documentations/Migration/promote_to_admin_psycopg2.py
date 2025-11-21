"""
Promote a user to admin role using psycopg2 (compatible with Odoo Python)
Usage: python promote_to_admin_psycopg2.py <email>
"""
import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from urllib.parse import urlparse

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Load environment variables from root directory
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
env_path = os.path.join(root_dir, 'packages', 'backend', '.env')

if os.path.exists(env_path):
    from dotenv import load_dotenv
    load_dotenv(env_path)
    print(f"[OK] Loaded .env from {env_path}")
else:
    print(f"[WARN] .env not found at {env_path}")

def get_db_config():
    """Parse DATABASE_URL into connection parameters"""
    DATABASE_URL = os.getenv("DATABASE_URL")

    if not DATABASE_URL:
        print("[ERROR] DATABASE_URL not found in environment variables")
        return None

    # Parse the URL
    result = urlparse(DATABASE_URL)

    return {
        'host': result.hostname,
        'port': result.port or 5432,
        'database': result.path[1:],  # Remove leading '/'
        'user': result.username,
        'password': result.password,
        'sslmode': 'require'  # Supabase requires SSL
    }

def promote_user_to_admin(email: str):
    """Promote a user to admin role by email"""
    db_config = get_db_config()

    if not db_config:
        return False

    try:
        # Connect to database
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        print(f"[OK] Connected to database")

        # Check if user exists
        cursor.execute("""
            SELECT id, email, role, first_name, last_name
            FROM users
            WHERE email = %s
        """, (email,))

        user = cursor.fetchone()

        if not user:
            print(f"[ERROR] User with email '{email}' not found")
            cursor.close()
            conn.close()
            return False

        print(f"\n[INFO] User found:")
        print(f"  ID: {user['id']}")
        print(f"  Email: {user['email']}")
        print(f"  Name: {user['first_name']} {user['last_name']}")
        print(f"  Current role: {user['role']}")

        if user['role'] == 'admin':
            print(f"\n[WARN] User is already an admin")
            cursor.close()
            conn.close()
            return True

        # Update user role to admin
        cursor.execute("""
            UPDATE users
            SET role = 'admin', updated_at = NOW()
            WHERE id = %s
            RETURNING id, email, role
        """, (user['id'],))

        updated_user = cursor.fetchone()
        conn.commit()

        if updated_user:
            print(f"\n[SUCCESS] User promoted to admin successfully!")
            print(f"  New role: {updated_user['role']}")
        else:
            print(f"\n[ERROR] Failed to update user role")
            cursor.close()
            conn.close()
            return False

        cursor.close()
        conn.close()
        return True

    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False


def list_all_users():
    """List all users in the database"""
    db_config = get_db_config()

    if not db_config:
        return

    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        print(f"[OK] Connected to database")

        # Get all users
        cursor.execute("""
            SELECT id, email, role, first_name, last_name, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 20
        """)

        users = cursor.fetchall()

        print(f"\n[INFO] Users in database (showing last 20):")
        print(f"{'Email':<40} {'Role':<15} {'Name':<30}")
        print("-" * 85)

        for user in users:
            name = f"{user['first_name']} {user['last_name']}"
            print(f"{user['email']:<40} {user['role']:<15} {name:<30}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        if 'conn' in locals():
            conn.close()


def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python promote_to_admin_psycopg2.py <email>         # Promote user to admin")
        print("  python promote_to_admin_psycopg2.py --list          # List all users")
        print("\nExample:")
        print("  python promote_to_admin_psycopg2.py user@example.com")
        sys.exit(1)

    if sys.argv[1] == "--list":
        list_all_users()
    else:
        email = sys.argv[1]
        success = promote_user_to_admin(email)
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
