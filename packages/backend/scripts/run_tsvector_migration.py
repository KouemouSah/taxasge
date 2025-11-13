#!/usr/bin/env python3
"""
Execute ts_vector migration for fiscal_services full-text search optimization
Connects directly to Supabase PostgreSQL database
"""

import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables from .env.local
env_path = Path(__file__).parent.parent / ".env.local"
if env_path.exists():
    load_dotenv(env_path)
    logger.info(f"✅ Loaded environment from {env_path}")
else:
    logger.warning(f"⚠️ .env.local not found at {env_path}")
    logger.info("📋 Trying environment variables from system...")

# Get DATABASE_URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("❌ DATABASE_URL not found in environment")
    logger.info("💡 Set DATABASE_URL or create .env.local with:")
    logger.info("   DATABASE_URL=postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres")
    sys.exit(1)

async def run_tsvector_migration():
    """Execute ts_vector migration using asyncpg"""

    try:
        import asyncpg

        # Migration file path
        migration_file = Path(__file__).parent.parent / "database" / "migrations" / "add_tsvector_to_fiscal_services.sql"

        if not migration_file.exists():
            logger.error(f"❌ Migration file not found: {migration_file}")
            return False

        logger.info(f"📄 Migration file: {migration_file.name}")

        # Read migration SQL
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql = f.read()

        logger.info(f"📏 SQL size: {len(sql)} characters")

        # Connect to database
        logger.info("🔌 Connecting to Supabase PostgreSQL...")
        conn = await asyncpg.connect(DATABASE_URL)
        logger.success("✅ Connected to database")

        try:
            # Execute migration
            logger.info("🚀 Executing ts_vector migration...")
            await conn.execute(sql)
            logger.success("✅ Migration executed successfully!")

            # Verify the migration
            logger.info("\n🔍 Verifying migration...")

            # Check if column exists
            column_check = await conn.fetchval("""
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_name = 'fiscal_services'
                AND column_name = 'search_vector'
            """)

            if column_check > 0:
                logger.success("  ✅ Column 'search_vector' created")
            else:
                logger.error("  ❌ Column 'search_vector' NOT found")
                return False

            # Check if index exists
            index_check = await conn.fetchval("""
                SELECT COUNT(*)
                FROM pg_indexes
                WHERE tablename = 'fiscal_services'
                AND indexname = 'idx_fiscal_services_search_vector'
            """)

            if index_check > 0:
                logger.success("  ✅ GIN index 'idx_fiscal_services_search_vector' created")
            else:
                logger.error("  ❌ GIN index NOT found")
                return False

            # Check if trigger exists
            trigger_check = await conn.fetchval("""
                SELECT COUNT(*)
                FROM pg_trigger
                WHERE tgname = 'fiscal_services_search_vector_trigger'
            """)

            if trigger_check > 0:
                logger.success("  ✅ Trigger 'fiscal_services_search_vector_trigger' created")
            else:
                logger.error("  ❌ Trigger NOT found")
                return False

            # Check how many rows have search_vector populated
            row_count = await conn.fetchval("""
                SELECT COUNT(*)
                FROM fiscal_services
                WHERE search_vector IS NOT NULL
            """)

            logger.success(f"  ✅ {row_count} rows with search_vector populated")

            # Test search functionality
            logger.info("\n🧪 Testing search functionality...")
            test_results = await conn.fetch("""
                SELECT id, name_es, ts_rank(search_vector, query) AS rank
                FROM fiscal_services, to_tsquery('spanish', 'permiso') query
                WHERE search_vector @@ query
                ORDER BY rank DESC
                LIMIT 3
            """)

            if test_results:
                logger.success(f"  ✅ Search test passed! Found {len(test_results)} results for 'permiso':")
                for row in test_results:
                    logger.info(f"     - {row['name_es']} (rank: {row['rank']:.4f})")
            else:
                logger.warning("  ⚠️ No results found for test search (this may be normal if no services contain 'permiso')")

            logger.success("\n🎉 Migration completed successfully!")
            logger.info("\n📊 Performance improvement: 10-100x faster full-text search")
            logger.info("🔧 The search endpoint will now use ts_vector automatically")

            return True

        finally:
            await conn.close()
            logger.info("🔌 Database connection closed")

    except ImportError:
        logger.error("❌ asyncpg not installed. Install it with: pip install asyncpg")
        return False

    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    logger.info("=" * 80)
    logger.info("🚀 TaxasGE - ts_vector Migration Script")
    logger.info("=" * 80)
    logger.info("📝 Purpose: Add full-text search optimization to fiscal_services")
    logger.info("⚡ Performance: 10-100x faster than ILIKE search")
    logger.info("=" * 80)
    logger.info("")

    success = asyncio.run(run_tsvector_migration())

    sys.exit(0 if success else 1)
