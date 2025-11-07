#!/usr/bin/env python3
"""
Script pour obtenir les VRAIS champs de la table users dans Supabase
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env.local")
    sys.exit(1)

try:
    import psycopg2

    print("🔗 Connecting to Supabase database...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    print("✅ Connected successfully\n")

    # Get ALL columns from users table
    cursor.execute("""
        SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
    """)

    columns = cursor.fetchall()

    print("=" * 80)
    print("📋 VRAIS CHAMPS DE LA TABLE 'users' (BASE DE DONNÉES RÉELLE)")
    print("=" * 80)
    print(f"\nTotal: {len(columns)} champs\n")

    for col_name, col_type, nullable, default in columns:
        null_str = "NULL" if nullable == "YES" else "NOT NULL"
        default_str = f", DEFAULT {default}" if default else ""
        print(f"  ✓ {col_name}: {col_type} {null_str}{default_str}")

    print("\n" + "=" * 80)
    print("✅ Vérification terminée")
    print("=" * 80)

    cursor.close()
    conn.close()

except ImportError:
    print("❌ psycopg2 not installed")
    print("Install with: pip install psycopg2-binary")
    sys.exit(1)

except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
