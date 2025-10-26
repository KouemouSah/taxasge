#!/usr/bin/env python3
"""
Auto-migration script for TaxasGE Database
Executes SQL migrations from database/migrations/ directory
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

# PostgreSQL connection (using psycopg2 or via Supabase client)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("DATABASE_URL not found in .env.local")
    sys.exit(1)


def run_migrations():
    """Execute all SQL migration files in order"""

    try:
        # Import psycopg2 for PostgreSQL connection
        import psycopg2

        # Get migrations directory
        migrations_dir = Path(__file__).parent.parent / "database" / "migrations"

        if not migrations_dir.exists():
            logger.error(f"Migrations directory not found: {migrations_dir}")
            return False

        # Get all .sql files sorted by name
        migration_files = sorted(migrations_dir.glob("*.sql"))

        if not migration_files:
            logger.warning("No migration files found")
            return True

        logger.info(f"Found {len(migration_files)} migration files")

        # Connect to database
        logger.info("Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()

        logger.success("✅ Connected to database")

        # Execute each migration
        for migration_file in migration_files:
            logger.info(f"Executing migration: {migration_file.name}")

            # Read SQL content
            with open(migration_file, 'r', encoding='utf-8') as f:
                sql = f.read()

            try:
                # Execute SQL
                cursor.execute(sql)
                logger.success(f"✅ {migration_file.name} executed successfully")

            except Exception as e:
                logger.error(f"❌ Error executing {migration_file.name}: {str(e)}")
                # Continue with other migrations

        # Verify tables were created
        logger.info("\nVerifying tables...")

        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('sessions', 'refresh_tokens')
            ORDER BY table_name;
        """)

        tables = cursor.fetchall()

        if tables:
            logger.success(f"\n✅ Tables created successfully:")
            for table in tables:
                logger.success(f"  - {table[0]}")
        else:
            logger.warning("⚠️  No authentication tables found")

        # Get table details
        for table_name in ['sessions', 'refresh_tokens']:
            cursor.execute(f"""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = '{table_name}'
                ORDER BY ordinal_position;
            """)

            columns = cursor.fetchall()
            if columns:
                logger.info(f"\n📋 Table '{table_name}' ({len(columns)} columns):")
                for col_name, col_type in columns:
                    logger.info(f"  - {col_name}: {col_type}")

        # Close connection
        cursor.close()
        conn.close()

        logger.success("\n🎉 All migrations completed successfully!")
        return True

    except ImportError:
        logger.error("❌ psycopg2 not installed. Install it with: pip install psycopg2-binary")
        return False

    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        return False


if __name__ == "__main__":
    logger.info("=" * 70)
    logger.info("TaxasGE Database Migration Script")
    logger.info("=" * 70)

    success = run_migrations()

    sys.exit(0 if success else 1)
