#!/usr/bin/env python3
"""
Database Schema Verification Script for TaxasGE
SAFELY checks existing database structure before proposing migrations
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


def check_database_schema():
    """
    SAFELY check existing database schema
    READ-ONLY operation - NO modifications
    """

    try:
        import psycopg2

        logger.info("Connecting to Supabase database (READ-ONLY)...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        logger.success("✅ Connected to database")

        # 1. List ALL existing tables
        logger.info("\n" + "="*70)
        logger.info("📋 EXISTING TABLES IN DATABASE")
        logger.info("="*70)

        cursor.execute("""
            SELECT table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)

        existing_tables = cursor.fetchall()

        if existing_tables:
            for table_name, table_type in existing_tables:
                logger.info(f"  ✓ {table_name} ({table_type})")
        else:
            logger.warning("  ⚠️  No tables found in public schema")

        # 2. Check specific tables we need
        logger.info("\n" + "="*70)
        logger.info("🔍 CHECKING AUTHENTICATION TABLES")
        logger.info("="*70)

        tables_to_check = ['users', 'sessions', 'refresh_tokens']

        for table_name in tables_to_check:
            cursor.execute(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = '{table_name}'
                );
            """)

            exists = cursor.fetchone()[0]

            if exists:
                logger.success(f"\n✅ Table '{table_name}' EXISTS")

                # Get columns
                cursor.execute(f"""
                    SELECT
                        column_name,
                        data_type,
                        is_nullable,
                        column_default
                    FROM information_schema.columns
                    WHERE table_name = '{table_name}'
                    ORDER BY ordinal_position;
                """)

                columns = cursor.fetchall()
                logger.info(f"   Columns ({len(columns)}):")
                for col_name, col_type, nullable, default in columns:
                    null_str = "NULL" if nullable == "YES" else "NOT NULL"
                    default_str = f", DEFAULT {default}" if default else ""
                    logger.info(f"     - {col_name}: {col_type} {null_str}{default_str}")

                # Get indexes
                cursor.execute(f"""
                    SELECT indexname, indexdef
                    FROM pg_indexes
                    WHERE tablename = '{table_name}';
                """)

                indexes = cursor.fetchall()
                if indexes:
                    logger.info(f"   Indexes ({len(indexes)}):")
                    for idx_name, idx_def in indexes:
                        logger.info(f"     - {idx_name}")

                # Get constraints
                cursor.execute(f"""
                    SELECT constraint_name, constraint_type
                    FROM information_schema.table_constraints
                    WHERE table_name = '{table_name}';
                """)

                constraints = cursor.fetchall()
                if constraints:
                    logger.info(f"   Constraints ({len(constraints)}):")
                    for const_name, const_type in constraints:
                        logger.info(f"     - {const_name}: {const_type}")

            else:
                logger.warning(f"\n⚠️  Table '{table_name}' DOES NOT EXIST")

        # 3. Summary and recommendations
        logger.info("\n" + "="*70)
        logger.info("📊 MIGRATION RECOMMENDATIONS")
        logger.info("="*70)

        table_exists = {}
        for table_name in tables_to_check:
            cursor.execute(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = '{table_name}'
                );
            """)
            table_exists[table_name] = cursor.fetchone()[0]

        if not table_exists['users']:
            logger.error("❌ CRITICAL: 'users' table missing!")
            logger.info("   → You need to create the users table first")
        else:
            logger.success("✅ 'users' table exists")

        if not table_exists['sessions']:
            logger.warning("⚠️  'sessions' table missing")
            logger.info("   → SAFE to run: 001_create_sessions_table.sql")
            logger.info("   → Uses 'CREATE IF NOT EXISTS' - won't affect existing data")
        else:
            logger.success("✅ 'sessions' table exists")
            logger.info("   → Migration will be skipped (IF NOT EXISTS)")

        if not table_exists['refresh_tokens']:
            logger.warning("⚠️  'refresh_tokens' table missing")
            logger.info("   → SAFE to run: 002_create_refresh_tokens_table.sql")
            logger.info("   → Uses 'CREATE IF NOT EXISTS' - won't affect existing data")
        else:
            logger.success("✅ 'refresh_tokens' table exists")
            logger.info("   → Migration will be skipped (IF NOT EXISTS)")

        # Close connection
        cursor.close()
        conn.close()

        logger.info("\n" + "="*70)
        logger.success("✅ Database check completed (READ-ONLY, no changes made)")
        logger.info("="*70)

        return True

    except ImportError:
        logger.error("❌ psycopg2 not installed")
        logger.info("Install with: cd packages/backend && ./venv/Scripts/pip.exe install psycopg2-binary")
        return False

    except Exception as e:
        logger.error(f"❌ Database check failed: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    logger.info("="*70)
    logger.info("TaxasGE Database Schema Checker (READ-ONLY)")
    logger.info("="*70)
    logger.info("This script will ONLY READ the database structure")
    logger.info("NO modifications will be made")
    logger.info("="*70 + "\n")

    success = check_database_schema()

    sys.exit(0 if success else 1)
