# -*- coding: utf-8 -*-
"""
Run Migration 001: Module 03 Infrastructure
Simple script to execute migration without emoji issues
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

# Load .env file
try:
    from dotenv import load_dotenv
    env_path = backend_path / ".env"
    load_dotenv(env_path)
    print("[INFO] Loaded environment from:", env_path)
except ImportError:
    print("[WARN] python-dotenv not installed")

try:
    import psycopg2
except ImportError as e:
    print("[ERROR] Import error:", e)
    print("Install: pip install psycopg2-binary python-dotenv")
    sys.exit(1)


def get_connection():
    """Get database connection"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment")

    print("[INFO] Connecting to database...")
    conn = psycopg2.connect(database_url)
    print("[OK] Connected successfully")
    return conn


def main():
    print("=" * 80)
    print("MIGRATION 001 - MODULE 03 INFRASTRUCTURE")
    print("=" * 80)
    print()

    # Load migration file
    migration_path = backend_path / "migrations" / "001_module_03_infrastructure_clean.sql"

    if not migration_path.exists():
        print("[ERROR] Migration file not found:", migration_path)
        sys.exit(1)

    with open(migration_path, 'r', encoding='utf-8') as f:
        migration_sql = f.read()

    print("[INFO] Loaded migration file ({} chars)".format(len(migration_sql)))
    print()

    # Connect and execute
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Disable notices (emoji encoding issues on Windows)
        cursor.execute("SET client_min_messages TO WARNING")

        print("[INFO] Executing migration (may take 10-30 seconds)...")
        print()

        # Execute migration
        cursor.execute(migration_sql)

        conn.commit()
        print()
        print("[OK] Migration executed successfully!")
        print()

        # Verification checks
        print("Running verification checks...")
        print()

        checks = [
            ("sessions.context_data",
             "SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='context_data'"),
            ("sessions.termination_reason",
             "SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='termination_reason'"),
            ("agent_work_queue table",
             "SELECT 1 FROM information_schema.tables WHERE table_name='agent_work_queue'"),
            ("document_processing_queue table",
             "SELECT 1 FROM information_schema.tables WHERE table_name='document_processing_queue'"),
            ("calculate_priority trigger",
             "SELECT 1 FROM pg_trigger WHERE tgname='trg_calculate_priority'"),
            ("calculate_next_retry trigger",
             "SELECT 1 FROM pg_trigger WHERE tgname='trg_calculate_next_retry'"),
        ]

        all_passed = True
        for name, query in checks:
            cursor.execute(query)
            if cursor.rowcount > 0:
                print("[OK] Check passed:", name)
            else:
                print("[ERROR] Check failed:", name)
                all_passed = False

        print()
        print("=" * 80)
        if all_passed:
            print("[SUCCESS] ALL CHECKS PASSED!")
            print()
            print("Summary:")
            print("  - sessions: 2 columns added")
            print("  - agent_work_queue: Created with triggers")
            print("  - document_processing_queue: Created with triggers")
            print("  - Indexes and functions created")
        else:
            print("[WARNING] SOME CHECKS FAILED")
            print("Review errors above")
        print("=" * 80)

        cursor.close()
        conn.close()

        return 0 if all_passed else 1

    except psycopg2.Error as e:
        print("[ERROR] Migration failed:")
        print(str(e))
        if conn:
            conn.rollback()
        return 1
    except Exception as e:
        print("[ERROR] Unexpected error:")
        print(str(e))
        return 1


if __name__ == "__main__":
    sys.exit(main())
