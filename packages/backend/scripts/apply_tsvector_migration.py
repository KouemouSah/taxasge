#!/usr/bin/env python3
"""
Apply ts_vector migration to fiscal_services table
Follows TaxasGE standard migration pattern
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger
import time

sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables from .env.local
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("❌ DATABASE_URL not found in .env.local")
    logger.info("💡 Create .env.local file with:")
    logger.info("   DATABASE_URL=postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres")
    sys.exit(1)


def apply_tsvector_migration():
    """
    Execute ts_vector migration for full-text search optimization
    """

    try:
        import psycopg2

        logger.info("=" * 70)
        logger.info("STEP 1: Checking current database state")
        logger.info("=" * 70)

        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False  # Use transactions
        cursor = conn.cursor()

        logger.success("✅ Connected to Supabase database")

        # Check if fiscal_services table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'fiscal_services'
            );
        """)
        fiscal_services_exists = cursor.fetchone()[0]

        if not fiscal_services_exists:
            logger.error("❌ CRITICAL: 'fiscal_services' table not found!")
            logger.error("   Cannot apply migration - table is required")
            cursor.close()
            conn.close()
            return False

        logger.success("✅ fiscal_services table exists")

        # Check if search_vector column already exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'fiscal_services'
                AND column_name = 'search_vector'
            );
        """)
        search_vector_exists = cursor.fetchone()[0]

        # Count rows in fiscal_services
        cursor.execute("SELECT COUNT(*) FROM fiscal_services")
        row_count = cursor.fetchone()[0]

        logger.info(f"📊 fiscal_services rows: {row_count}")

        if search_vector_exists:
            logger.warning("⚠️  search_vector column already exists")
            logger.info("   Migration will be re-applied (safe operation)")
        else:
            logger.info("✅ search_vector column does not exist (clean migration)")

        logger.info("\n" + "=" * 70)
        logger.info("STEP 2: Loading migration file")
        logger.info("=" * 70)

        # Migration file path
        migration_file = Path(__file__).parent.parent / "database" / "migrations" / "add_tsvector_to_fiscal_services.sql"

        if not migration_file.exists():
            logger.error(f"❌ Migration file not found: {migration_file}")
            cursor.close()
            conn.close()
            return False

        logger.info(f"📄 Migration file: {migration_file.name}")

        # Read migration SQL
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql = f.read()

        logger.info(f"📏 SQL size: {len(sql)} characters")

        logger.info("\n" + "=" * 70)
        logger.info("STEP 3: Applying ts_vector migration")
        logger.info("=" * 70)

        try:
            # Execute migration
            logger.info("🚀 Executing migration SQL...")
            start_time = time.time()

            cursor.execute(sql)
            conn.commit()

            execution_time = time.time() - start_time
            logger.success(f"✅ Migration executed successfully in {execution_time:.2f}s")

        except Exception as e:
            logger.error(f"❌ Error executing migration: {str(e)}")
            conn.rollback()
            cursor.close()
            conn.close()
            return False

        logger.info("\n" + "=" * 70)
        logger.info("STEP 4: Verifying migration")
        logger.info("=" * 70)

        # Check if column exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'fiscal_services'
                AND column_name = 'search_vector'
            );
        """)
        column_exists = cursor.fetchone()[0]

        if column_exists:
            logger.success("  ✅ Column 'search_vector' created")
        else:
            logger.error("  ❌ Column 'search_vector' NOT found")
            cursor.close()
            conn.close()
            return False

        # Check if index exists
        cursor.execute("""
            SELECT COUNT(*)
            FROM pg_indexes
            WHERE tablename = 'fiscal_services'
            AND indexname = 'idx_fiscal_services_search_vector'
        """)
        index_exists = cursor.fetchone()[0]

        if index_exists > 0:
            logger.success("  ✅ GIN index 'idx_fiscal_services_search_vector' created")
        else:
            logger.error("  ❌ GIN index NOT found")
            cursor.close()
            conn.close()
            return False

        # Check if trigger exists
        cursor.execute("""
            SELECT COUNT(*)
            FROM pg_trigger
            WHERE tgname = 'fiscal_services_search_vector_trigger'
        """)
        trigger_exists = cursor.fetchone()[0]

        if trigger_exists > 0:
            logger.success("  ✅ Trigger 'fiscal_services_search_vector_trigger' created")
        else:
            logger.error("  ❌ Trigger NOT found")
            cursor.close()
            conn.close()
            return False

        # Check how many rows have search_vector populated
        cursor.execute("""
            SELECT COUNT(*)
            FROM fiscal_services
            WHERE search_vector IS NOT NULL
        """)
        populated_count = cursor.fetchone()[0]

        logger.success(f"  ✅ {populated_count}/{row_count} rows with search_vector populated")

        logger.info("\n" + "=" * 70)
        logger.info("STEP 5: Testing search functionality")
        logger.info("=" * 70)

        # Test ILIKE search (old method)
        logger.info("🧪 Testing ILIKE search (old method)...")
        start_time = time.time()
        cursor.execute("""
            SELECT COUNT(*)
            FROM fiscal_services
            WHERE name_es ILIKE '%permiso%'
        """)
        ilike_count = cursor.fetchone()[0]
        ilike_time = (time.time() - start_time) * 1000

        logger.info(f"   ILIKE: {ilike_count} results in {ilike_time:.2f}ms")

        # Test ts_vector search (new method)
        logger.info("🧪 Testing ts_vector search (new method)...")
        start_time = time.time()
        cursor.execute("""
            SELECT COUNT(*)
            FROM fiscal_services
            WHERE search_vector @@ to_tsquery('spanish', 'permiso')
        """)
        tsvector_count = cursor.fetchone()[0]
        tsvector_time = (time.time() - start_time) * 1000

        logger.info(f"   ts_vector: {tsvector_count} results in {tsvector_time:.2f}ms")

        # Calculate improvement
        if tsvector_time > 0:
            improvement = ilike_time / tsvector_time
            logger.success(f"   🚀 Performance improvement: {improvement:.1f}x faster")

        # Show sample results
        logger.info("\n🔍 Sample search results for 'permiso':")
        cursor.execute("""
            SELECT id, name_es, ts_rank(search_vector, query) AS rank
            FROM fiscal_services, to_tsquery('spanish', 'permiso') query
            WHERE search_vector @@ query
            ORDER BY rank DESC
            LIMIT 3
        """)
        results = cursor.fetchall()

        if results:
            for idx, (service_id, name_es, rank) in enumerate(results, 1):
                logger.info(f"   {idx}. {name_es} (rank: {rank:.4f})")
        else:
            logger.warning("   ⚠️  No results found (table may be empty)")

        # Close connection
        cursor.close()
        conn.close()

        logger.info("\n" + "=" * 70)
        logger.success("🎉 MIGRATION COMPLETED SUCCESSFULLY!")
        logger.info("=" * 70)
        logger.info("")
        logger.info("✅ Full-text search optimization applied")
        logger.info("⚡ Expected performance: 10-100x faster searches")
        logger.info("🔧 search_vector column with GIN index created")
        logger.info("🔄 Auto-update trigger configured")
        logger.info("")
        logger.info("The search endpoint will now use ts_vector automatically!")
        logger.info("=" * 70)

        return True

    except ImportError:
        logger.error("❌ psycopg2 not installed")
        logger.info("💡 Install with: pip install psycopg2-binary")
        return False

    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    logger.info("=" * 70)
    logger.info("🚀 TaxasGE - ts_vector Migration Script")
    logger.info("=" * 70)
    logger.info("📝 Purpose: Add full-text search optimization to fiscal_services")
    logger.info("⚡ Performance: 10-100x faster than ILIKE search")
    logger.info("🔒 Safe operation: Uses CREATE IF NOT EXISTS")
    logger.info("=" * 70)
    logger.info("")

    success = apply_tsvector_migration()

    sys.exit(0 if success else 1)
