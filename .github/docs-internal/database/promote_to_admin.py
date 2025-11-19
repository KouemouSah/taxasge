"""
Promote a user to admin role
Usage: python scripts/promote_to_admin.py <email>
"""
import asyncio
import asyncpg
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def promote_user_to_admin(email: str):
    """Promote a user to admin role by email"""
    DATABASE_URL = os.getenv("DATABASE_URL")

    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in environment variables")
        return False

    try:
        # Connect to database
        conn = await asyncpg.connect(DATABASE_URL)
        print(f"✅ Connected to database")

        # Check if user exists
        user_query = """
            SELECT id, email, role, first_name, last_name
            FROM users
            WHERE email = $1
        """
        user = await conn.fetchrow(user_query, email)

        if not user:
            print(f"❌ User with email '{email}' not found")
            await conn.close()
            return False

        print(f"\n📋 User found:")
        print(f"  ID: {user['id']}")
        print(f"  Email: {user['email']}")
        print(f"  Name: {user['first_name']} {user['last_name']}")
        print(f"  Current role: {user['role']}")

        if user['role'] == 'admin':
            print(f"\n⚠️  User is already an admin")
            await conn.close()
            return True

        # Update user role to admin
        update_query = """
            UPDATE users
            SET role = 'admin', updated_at = NOW()
            WHERE id = $1
            RETURNING id, email, role
        """
        updated_user = await conn.fetchrow(update_query, user['id'])

        if updated_user:
            print(f"\n✅ User promoted to admin successfully!")
            print(f"  New role: {updated_user['role']}")
        else:
            print(f"\n❌ Failed to update user role")
            await conn.close()
            return False

        await conn.close()
        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


async def list_all_users():
    """List all users in the database"""
    DATABASE_URL = os.getenv("DATABASE_URL")

    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in environment variables")
        return

    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print(f"✅ Connected to database")

        # Get all users
        query = """
            SELECT id, email, role, first_name, last_name, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 20
        """
        users = await conn.fetch(query)

        print(f"\n📋 Users in database (showing last 20):")
        print(f"{'Email':<40} {'Role':<15} {'Name':<30}")
        print("-" * 85)

        for user in users:
            name = f"{user['first_name']} {user['last_name']}"
            print(f"{user['email']:<40} {user['role']:<15} {name:<30}")

        await conn.close()

    except Exception as e:
        print(f"\n❌ Error: {e}")


async def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python scripts/promote_to_admin.py <email>         # Promote user to admin")
        print("  python scripts/promote_to_admin.py --list          # List all users")
        print("\nExample:")
        print("  python scripts/promote_to_admin.py user@example.com")
        sys.exit(1)

    if sys.argv[1] == "--list":
        await list_all_users()
    else:
        email = sys.argv[1]
        success = await promote_user_to_admin(email)
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
