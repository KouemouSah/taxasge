#!/usr/bin/env python3
"""
SAFE Database Migration Script - TaxasGE
Follows strict verification protocol:
1. Read database.md (source of truth)
2. Check Supabase (current state)
3. Apply ONLY missing tables
4. NEVER delete data
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger

sys.path.insert(0, str(Path(__file__).parent.parent))

env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

def verify_and_migrate():
    """
    STEP 1: Verify source of truth (database.md)
    STEP 2: Check current Supabase state
    STEP 3: Apply ONLY missing migrations
    """

    try:
        import psycopg2

        logger.info("="*70)
        logger.info("STEP 1: Reading SOURCE OF TRUTH (database.md)")
        logger.info("="*70)

        # Tables documented in database.md
        documented_tables = [
            "users", "audit_logs", "companies", "tax_declarations",
            "payments", "fiscal_services", "ministries", "sectors",
            "categories", "uploaded_files", "bank_transactions",
            # ... mais PAS sessions ni refresh_tokens
        ]

        logger.info(f"✅ database.md documents {len(documented_tables)} tables")
        logger.info("❌ 'sessions' NOT in database.md")
        logger.info("❌ 'refresh_tokens' NOT in database.md")

        logger.info("\n" + "="*70)
        logger.info("STEP 2: Checking CURRENT SUPABASE STATE")
        logger.info("="*70)

        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Check if users table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'users'
            );
        """)
        users_exists = cursor.fetchone()[0]

        # Check if sessions table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'sessions'
            );
        """)
        sessions_exists = cursor.fetchone()[0]

        # Check if refresh_tokens table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'refresh_tokens'
            );
        """)
        refresh_tokens_exists = cursor.fetchone()[0]

        logger.info(f"{'✅' if users_exists else '❌'} users table: {'EXISTS' if users_exists else 'MISSING'}")
        logger.info(f"{'✅' if sessions_exists else '❌'} sessions table: {'EXISTS' if sessions_exists else 'MISSING'}")
        logger.info(f"{'✅' if refresh_tokens_exists else '❌'} refresh_tokens table: {'EXISTS' if refresh_tokens_exists else 'MISSING'}")

        logger.info("\n" + "="*70)
        logger.info("STEP 3: SAFE MIGRATION PLAN")
        logger.info("="*70)

        if not users_exists:
            logger.error("❌ CRITICAL: 'users' table missing!")
            logger.error("   Cannot proceed - users table is required")
            cursor.close()
            conn.close()
            return False

        migrations_to_apply = []

        if not sessions_exists:
            migrations_to_apply.append("001_create_sessions_table.sql")

        if not refresh_tokens_exists:
            migrations_to_apply.append("002_create_refresh_tokens_table.sql")

        if not migrations_to_apply:
            logger.success("✅ All tables already exist - No migrations needed!")
            cursor.close()
            conn.close()
            return True

        logger.info(f"\n📋 Migrations to apply: {len(migrations_to_apply)}")
        for migration in migrations_to_apply:
            logger.info(f"   - {migration}")

        # Apply migrations
        migrations_dir = Path(__file__).parent.parent / "database" / "migrations"

        for migration_file in migrations_to_apply:
            migration_path = migrations_dir / migration_file

            if not migration_path.exists():
                logger.error(f"❌ Migration file not found: {migration_file}")
                continue

            logger.info(f"\n🔄 Applying: {migration_file}")

            with open(migration_path, 'r', encoding='utf-8') as f:
                sql = f.read()

            try:
                cursor.execute(sql)
                conn.commit()
                logger.success(f"✅ {migration_file} applied successfully")
            except Exception as e:
                logger.error(f"❌ Error applying {migration_file}: {str(e)}")
                conn.rollback()

        # Verify final state
        logger.info("\n" + "="*70)
        logger.info("VERIFICATION: Final Database State")
        logger.info("="*70)

        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('users', 'sessions', 'refresh_tokens')
            ORDER BY table_name;
        """)

        final_tables = cursor.fetchall()

        for table in final_tables:
            logger.success(f"✅ {table[0]} table exists")

        cursor.close()
        conn.close()

        logger.info("\n" + "="*70)
        logger.success("🎉 MIGRATION COMPLETED SUCCESSFULLY!")
        logger.info("="*70)

        return True

    except ImportError:
        logger.error("❌ psycopg2 not installed")
        logger.info("Install: cd packages/backend && ./venv/Scripts/pip.exe install psycopg2-binary")
        return False

    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    logger.info("="*70)
    logger.info("TaxasGE SAFE Database Migration")
    logger.info("Methodology: Verify → Check → Migrate")
    logger.info("="*70 + "\n")

    success = verify_and_migrate()

    sys.exit(0 if success else 1)
