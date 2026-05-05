#!/usr/bin/env python3
"""Apply migration 330 — register security-monitoring dashboard (Phase C.5)."""

import os, sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env.local"); load_dotenv(ROOT / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    logger.error("DATABASE_URL missing")
    sys.exit(1)

MIGRATION = ROOT / "database" / "migrations" / "330_register_security_dashboard.sql"


def main() -> int:
    import psycopg2
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=15)
    try:
        with conn.cursor() as cur:
            cur.execute(MIGRATION.read_text(encoding="utf-8"))
        conn.commit()
        with conn.cursor() as cur:
            cur.execute("SELECT dashboard_id, provider, grafana_dashboard_uid, rls_mode, category FROM dashboard_registrations WHERE dashboard_id='security-monitoring'")
            row = cur.fetchone()
            assert row is not None, "security-monitoring not registered"
            logger.success(f"Mig 330 applied: {row}")
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
