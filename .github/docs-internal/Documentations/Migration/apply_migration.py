#!/usr/bin/env python3
"""
Fix email_verified status for existing users
"""
import psycopg2
import sys

DATABASE_URL = "postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres"

def main():
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        print("[OK] Connected to database")

        # Check current email_verified status
        print("\n[CHECK] Current email_verified status:")
        cursor.execute("""
            SELECT
                COUNT(*) as total_users,
                COUNT(*) FILTER (WHERE email_verified = true) as verified,
                COUNT(*) FILTER (WHERE email_verified = false) as not_verified
            FROM users;
        """)
        stats = cursor.fetchone()
        print(f"  Total users: {stats[0]}")
        print(f"  Verified: {stats[1]}")
        print(f"  Not verified: {stats[2]}")

        # Update email_verified to true for all active users
        # (assuming users who can login have verified their email)
        print("\n[UPDATE] Setting email_verified=true for all users...")
        cursor.execute("""
            UPDATE users
            SET email_verified = true
            WHERE email_verified = false OR email_verified IS NULL;
        """)
        rows_affected = cursor.rowcount
        print(f"[OK] Updated {rows_affected} users")

        # Verify the update
        print("\n[VERIFY] New email_verified status:")
        cursor.execute("""
            SELECT
                COUNT(*) as total_users,
                COUNT(*) FILTER (WHERE email_verified = true) as verified,
                COUNT(*) FILTER (WHERE email_verified = false) as not_verified
            FROM users;
        """)
        stats = cursor.fetchone()
        print(f"  Total users: {stats[0]}")
        print(f"  Verified: {stats[1]}")
        print(f"  Not verified: {stats[2]}")

        cursor.close()
        conn.close()

        print("\n[SUCCESS] Email verification status updated successfully!")
        return 0

    except Exception as e:
        print(f"\n[ERROR] Error updating email status: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
