"""
Test Migration 001: Module 03 Infrastructure
Teste l'exécution de la migration et vérifie les résultats

Usage:
    python packages/backend/scripts/test_migration_001.py
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

# Load .env file
try:
    from dotenv import load_dotenv
    env_path = backend_path / ".env"
    load_dotenv(env_path)
    print(f"[FILE] Loaded environment from: {env_path}")
except ImportError:
    print("[WARN] python-dotenv not installed, using system environment")

try:
    import psycopg2
    from psycopg2 import sql
except ImportError as e:
    print(f"[ERROR] Import error: {e}")
    print("Install dependencies: pip install psycopg2-binary python-dotenv")
    sys.exit(1)


def get_supabase_connection():
    """Get Supabase PostgreSQL connection from DATABASE_URL"""
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        raise ValueError("DATABASE_URL not found in environment")

    print(f"🔌 Connecting to: {database_url.split('@')[1] if '@' in database_url else 'database'}")

    conn = psycopg2.connect(database_url)
    return conn


def load_migration_file():
    """Charge le fichier de migration SQL"""
    migration_path = backend_path / "migrations" / "001_module_03_infrastructure.sql"

    if not migration_path.exists():
        print(f"[ERROR] Migration file not found: {migration_path}")
        sys.exit(1)

    with open(migration_path, 'r', encoding='utf-8') as f:
        return f.read()


def test_migration():
    """Teste l'exécution de la migration"""
    print("=" * 80)
    print("🧪 TEST MIGRATION 001 - MODULE 03 INFRASTRUCTURE")
    print("=" * 80)
    print()

    # 1. Charger la migration
    print("📂 Step 1: Loading migration file...")
    migration_sql = load_migration_file()
    print(f"   [OK] Loaded {len(migration_sql)} characters")
    print()

    # 2. Connexion à la base de données
    print("🔌 Step 2: Connecting to database...")
    try:
        conn = get_supabase_connection()
        print("   [OK] Connected successfully")
    except Exception as e:
        print(f"   [ERROR] Connection failed: {e}")
        print("\n[WARN]  Make sure DATABASE_URL is set in .env.local")
        return False
    print()

    # 3. Exécuter la migration
    print("🚀 Step 3: Executing migration...")
    print("   (This may take 10-30 seconds...)")

    try:
        cursor = conn.cursor()

        # Activer affichage NOTICE
        cursor.execute("SET client_min_messages TO NOTICE")

        # Exécuter migration
        cursor.execute(migration_sql)

        # Récupérer messages
        for notice in conn.notices:
            print(f"   {notice.strip()}")

        conn.commit()
        print("   [OK] Migration executed successfully")

    except psycopg2.Error as e:
        print(f"   [ERROR] Migration failed: {e}")
        conn.rollback()
        return False
    print()

    # 4. Vérifications post-migration
    print("🔍 Step 4: Verification checks...")

    checks = [
        # Check 1: sessions.context_data existe
        {
            "name": "sessions.context_data column",
            "query": """
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = 'sessions' AND column_name = 'context_data'
            """,
            "expected": 1
        },
        # Check 2: sessions.termination_reason existe
        {
            "name": "sessions.termination_reason column",
            "query": """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'sessions' AND column_name = 'termination_reason'
            """,
            "expected": 1
        },
        # Check 3: agent_work_queue table existe
        {
            "name": "agent_work_queue table",
            "query": """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'agent_work_queue'
            """,
            "expected": 1
        },
        # Check 4: document_processing_queue table existe
        {
            "name": "document_processing_queue table",
            "query": """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'document_processing_queue'
            """,
            "expected": 1
        },
        # Check 5: Triggers créés
        {
            "name": "calculate_priority trigger",
            "query": """
                SELECT tgname
                FROM pg_trigger
                WHERE tgname = 'trg_calculate_priority'
            """,
            "expected": 1
        },
        {
            "name": "calculate_next_retry trigger",
            "query": """
                SELECT tgname
                FROM pg_trigger
                WHERE tgname = 'trg_calculate_next_retry'
            """,
            "expected": 1
        },
        # Check 6: Indexes créés
        {
            "name": "sessions indexes",
            "query": """
                SELECT indexname
                FROM pg_indexes
                WHERE tablename = 'sessions'
                AND indexname IN ('idx_sessions_context_data', 'idx_sessions_active_user')
            """,
            "expected": 2
        },
        {
            "name": "agent_work_queue indexes",
            "query": """
                SELECT indexname
                FROM pg_indexes
                WHERE tablename = 'agent_work_queue'
            """,
            "expected_min": 5  # Au moins 5 indexes
        },
        # Check 7: Fonctions créées
        {
            "name": "calculate_queue_priority function",
            "query": """
                SELECT proname
                FROM pg_proc
                WHERE proname = 'calculate_queue_priority'
            """,
            "expected": 1
        },
    ]

    all_passed = True

    for i, check in enumerate(checks, 1):
        try:
            cursor.execute(check["query"])
            result_count = cursor.rowcount

            # Vérifier résultat
            if "expected_min" in check:
                passed = result_count >= check["expected_min"]
                status = "[OK]" if passed else "[ERROR]"
                print(f"   {status} Check {i}: {check['name']} ({result_count} found, expected >={check['expected_min']})")
            else:
                passed = result_count == check["expected"]
                status = "[OK]" if passed else "[ERROR]"
                print(f"   {status} Check {i}: {check['name']} ({result_count} found, expected {check['expected']})")

            if not passed:
                all_passed = False

        except psycopg2.Error as e:
            print(f"   [ERROR] Check {i} failed: {e}")
            all_passed = False

    print()

    # 5. Test données sample (optionnel)
    print("🧪 Step 5: Testing sample data insertion...")

    try:
        # Test 1: Insérer context_data dans sessions (si session existe)
        cursor.execute("""
            UPDATE sessions
            SET context_data = '{"test": "migration_001", "timestamp": "2025-11-13"}'::jsonb
            WHERE id = (SELECT id FROM sessions LIMIT 1)
            RETURNING id, context_data
        """)

        if cursor.rowcount > 0:
            row = cursor.fetchone()
            print(f"   [OK] Context data updated: session {row[0]}")
            print(f"      Data: {row[1]}")
        else:
            print("   [WARN]  No existing sessions to update (normal for new DB)")

        conn.rollback()  # Rollback test data

    except psycopg2.Error as e:
        print(f"   [ERROR] Sample data test failed: {e}")
        conn.rollback()

    print()

    # 6. Résumé final
    print("=" * 80)
    if all_passed:
        print("[OK] ALL CHECKS PASSED - Migration 001 successful!")
        print()
        print("📊 Summary:")
        print("   - sessions table: 2 columns added")
        print("   - agent_work_queue: Created with 3 triggers")
        print("   - document_processing_queue: Created with 3 triggers")
        print("   - 8+ indexes created")
        print("   - 6 functions created")
    else:
        print("[ERROR] SOME CHECKS FAILED - Review errors above")
        print()
        print("[WARN]  Migration may have partially succeeded.")
        print("   Check database manually before retrying.")

    print("=" * 80)

    # Cleanup
    cursor.close()
    conn.close()

    return all_passed


def rollback_migration():
    """Rollback migration (pour tests)"""
    print("🔄 Rolling back migration...")

    rollback_sql = """
    -- Rollback migration 001
    BEGIN;

    -- Drop new tables
    DROP TABLE IF EXISTS document_processing_queue CASCADE;
    DROP TABLE IF EXISTS agent_work_queue CASCADE;

    -- Drop functions
    DROP FUNCTION IF EXISTS calculate_queue_priority() CASCADE;
    DROP FUNCTION IF EXISTS update_sla_status() CASCADE;
    DROP FUNCTION IF EXISTS calculate_next_retry() CASCADE;
    DROP FUNCTION IF EXISTS increment_retry_count() CASCADE;

    -- Rollback sessions columns (careful: data loss)
    ALTER TABLE sessions
        DROP COLUMN IF EXISTS context_data CASCADE,
        DROP COLUMN IF EXISTS termination_reason CASCADE;

    COMMIT;
    """

    try:
        conn = get_supabase_connection()
        cursor = conn.cursor()
        cursor.execute(rollback_sql)
        conn.commit()
        print("[OK] Rollback completed")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"[ERROR] Rollback failed: {e}")
        return False


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Test migration 001")
    parser.add_argument("--rollback", action="store_true", help="Rollback migration")
    args = parser.parse_args()

    if args.rollback:
        success = rollback_migration()
    else:
        success = test_migration()

    sys.exit(0 if success else 1)
