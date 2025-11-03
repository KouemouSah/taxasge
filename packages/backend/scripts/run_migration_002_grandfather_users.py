#!/usr/bin/env python3
"""
MODULE_02 Migration 002: Grandfather Existing Users
Sets email_verified=TRUE for users created before 2025-11-03
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
env_path = Path(__file__).parent.parent / ".env"
if not env_path.exists():
    env_path = Path(__file__).parent.parent / ".env.local"

load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("DATABASE_URL not found in .env or .env.local")
    sys.exit(1)


def run_migration_002():
    """Execute migration 002: Grandfather existing users"""

    try:
        import psycopg2

        # Get migration file
        migration_file = (
            Path(__file__).parent.parent
            / "migrations"
            / "module_02"
            / "002_set_existing_users_email_verified.sql"
        )

        if not migration_file.exists():
            logger.error(f"Migration file not found: {migration_file}")
            return False

        logger.info(f"Found migration: {migration_file.name}")

        # Read SQL content
        with open(migration_file, "r", encoding="utf-8") as f:
            sql = f.read()

        # Connect to database
        logger.info("Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()

        logger.success("✅ Connected to database")

        # Count users BEFORE migration
        logger.info("\n📊 Counting users before migration...")

        cursor.execute("""
            SELECT
                COUNT(*) FILTER (WHERE email_verified IS TRUE) as verified_count,
                COUNT(*) FILTER (WHERE email_verified IS FALSE OR email_verified IS NULL) as unverified_count,
                COUNT(*) FILTER (WHERE created_at < '2025-11-03 00:00:00+00'::timestamptz) as old_users_count,
                COUNT(*) as total_count
            FROM users;
        """)

        before_stats = cursor.fetchone()
        verified_before, unverified_before, old_users, total = before_stats

        logger.info(f"  Total users: {total}")
        logger.info(f"  Already verified: {verified_before}")
        logger.info(f"  Not verified: {unverified_before}")
        logger.info(f"  Created before 2025-11-03: {old_users}")

        # Execute migration
        logger.info(f"\n🚀 Executing migration: {migration_file.name}")

        try:
            cursor.execute(sql)
            logger.success(f"✅ Migration executed successfully")

        except Exception as e:
            logger.error(f"❌ Error executing migration: {str(e)}")
            cursor.close()
            conn.close()
            return False

        # Count users AFTER migration
        logger.info("\n📊 Counting users after migration...")

        cursor.execute("""
            SELECT
                COUNT(*) FILTER (WHERE email_verified IS TRUE) as verified_count,
                COUNT(*) FILTER (WHERE email_verified IS FALSE OR email_verified IS NULL) as unverified_count,
                COUNT(*) FILTER (
                    WHERE email_verified IS TRUE
                    AND created_at < '2025-11-03 00:00:00+00'::timestamptz
                ) as grandfathered_count
            FROM users;
        """)

        after_stats = cursor.fetchone()
        verified_after, unverified_after, grandfathered = after_stats

        logger.info(f"  Verified users: {verified_after}")
        logger.info(f"  Not verified: {unverified_after}")
        logger.info(f"  Grandfathered (old users): {grandfathered}")

        # Show migration impact
        logger.info("\n📈 Migration Impact:")

        users_grandfathered = verified_after - verified_before

        if users_grandfathered > 0:
            logger.success(
                f"  ✅ {users_grandfathered} users grandfathered (email_verified set to TRUE)"
            )
            logger.success(
                f"  ✅ These users can now access dashboard without email verification"
            )
        else:
            logger.warning("  ⚠️  No users were affected by this migration")
            logger.info("     (All existing users already had email_verified=TRUE)")

        # Show sample of grandfathered users
        if users_grandfathered > 0:
            logger.info("\n👥 Sample of grandfathered users:")

            cursor.execute("""
                SELECT
                    id,
                    email,
                    created_at,
                    email_verified
                FROM users
                WHERE created_at < '2025-11-03 00:00:00+00'::timestamptz
                AND email_verified IS TRUE
                ORDER BY created_at DESC
                LIMIT 5;
            """)

            users = cursor.fetchall()

            for user_id, email, created_at, verified in users:
                logger.info(
                    f"  - {email} (created: {created_at.strftime('%Y-%m-%d')}, verified: {verified})"
                )

        # Close connection
        cursor.close()
        conn.close()

        logger.success("\n🎉 Migration 002 completed successfully!")

        return True

    except ImportError:
        logger.error(
            "❌ psycopg2 not installed. Install it with: pip install psycopg2-binary"
        )
        return False

    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        import traceback

        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    logger.info("=" * 80)
    logger.info("TaxasGE Migration 002: Grandfather Existing Users")
    logger.info("Purpose: Set email_verified=TRUE for users created before 2025-11-03")
    logger.info("=" * 80)

    success = run_migration_002()

    sys.exit(0 if success else 1)
