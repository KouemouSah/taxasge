#!/usr/bin/env python3
"""Quick read-only check of the 11 seeded dashboards after migration 323."""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
env_path = ROOT / ".env.local"
if not env_path.exists():
    env_path = ROOT / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL missing", file=sys.stderr)
    sys.exit(1)

import psycopg2

conn = psycopg2.connect(DATABASE_URL, connect_timeout=15)
with conn.cursor() as cur:
    cur.execute("""
        SELECT dashboard_id, provider, grafana_dashboard_uid, category,
               display_order, rls_mode, is_active, title_es
        FROM dashboard_registrations
        ORDER BY display_order, dashboard_id
    """)
    rows = cur.fetchall()
    print(f"\n{len(rows)} dashboards in dashboard_registrations:\n")
    print(f"{'slug':22} {'provider':14} {'uid':24} {'cat':12} {'ord':4} {'rls':18} {'act':4} title_es")
    print("-" * 130)
    for r in rows:
        slug, prov, uid, cat, order, rls, active, title = r
        print(f"{slug:22} {prov:14} {(uid or ''):24} {(cat or ''):12} {order:4} {rls:18} {str(active):4} {title}")

conn.close()
