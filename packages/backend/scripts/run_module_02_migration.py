#!/usr/bin/env python3
"""
MODULE_02 Migration Script
Executes MODULE_02 auth advanced columns migration to Supabase
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("DATABASE_URL not found in .env.local")
    sys.exit(1)


def run_module_02_migration():
    """Execute MODULE_02 migration"""

    try:
        import psycopg2

        # Get migration file
        migration_file = Path(__file__).parent.parent / "migrations" / "module_02" / "001_add_auth_advanced_columns.sql"

        if not migration_file.exists():
            logger.error(f"Migration file not found: {migration_file}")
            return False

        logger.info(f"Found migration: {migration_file.name}")

        # Read SQL content
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql = f.read()

        # Connect to database
        logger.info("Connecting to Supabase database...")
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()

        logger.success("✅ Connected to Supabase")

        # Execute migration
        logger.info(f"Executing migration: {migration_file.name}")

        try:
            cursor.execute(sql)
            logger.success(f"✅ Migration executed successfully")

        except Exception as e:
            logger.error(f"❌ Error executing migration: {str(e)}")
            cursor.close()
            conn.close()
            return False

        # Verify columns were added
        logger.info("\nVerifying columns...")

        cursor.execute("""
            SELECT
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name IN (
                'email_verified',
                'email_verification_code',
                'email_verification_expires_at',
                'password_reset_token',
                'password_reset_expires_at',
                'two_factor_enabled',
                'two_factor_secret',
                'two_factor_backup_codes'
            )
            ORDER BY ordinal_position;
        """)

        columns = cursor.fetchall()

        if columns:
            logger.success(f"\n✅ Columns verified ({len(columns)} total):")
            for col_name, col_type, nullable, default in columns:
                nullable_str = "NULL" if nullable == "YES" else "NOT NULL"
                default_str = f", DEFAULT {default}" if default else ""
                logger.success(f"  - {col_name}: {col_type} {nullable_str}{default_str}")
        else:
            logger.warning("⚠️  No MODULE_02 columns found")

        # Verify indexes
        logger.info("\nVerifying indexes...")

        cursor.execute("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'users'
            AND indexname IN (
                'idx_users_email_verification_code',
                'idx_users_password_reset_token',
                'idx_users_email_verified'
            )
            ORDER BY indexname;
        """)

        indexes = cursor.fetchall()

        if indexes:
            logger.success(f"\n✅ Indexes created ({len(indexes)} total):")
            for idx_name, idx_def in indexes:
                logger.success(f"  - {idx_name}")
        else:
            logger.warning("⚠️  No MODULE_02 indexes found")

        # Close connection
        cursor.close()
        conn.close()

        logger.success("\n🎉 MODULE_02 migration completed successfully!")
        return True

    except ImportError:
        logger.error("❌ psycopg2 not installed. Install it with: pip install psycopg2-binary")
        return False

    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    logger.info("=" * 70)
    logger.info("TaxasGE MODULE_02 Migration Script")
    logger.info("Adding auth advanced columns to users table")
    logger.info("=" * 70)

    success = run_module_02_migration()

    sys.exit(0 if success else 1)
