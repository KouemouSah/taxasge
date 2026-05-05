#!/usr/bin/env python3
"""Apply migration 328 — ai_call_metrics injection columns (Phase C.1)."""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    logger.error("DATABASE_URL missing")
    sys.exit(1)

MIGRATION = ROOT / "database" / "migrations" / "328_ai_call_metrics_injection.sql"


def main() -> int:
    import psycopg2
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=15)
    try:
        with conn.cursor() as cur:
            cur.execute(MIGRATION.read_text(encoding="utf-8"))
        conn.commit()
        logger.success(f"{MIGRATION.name} applied.")
        with conn.cursor() as cur:
            cur.execute(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='ai_call_metrics' AND column_name LIKE 'injection_%'"
            )
            cols = sorted(r[0] for r in cur.fetchall())
            assert cols == ["injection_risk", "injection_rules", "injection_score"], cols
            logger.success(f"3 columns present: {cols}")

            cur.execute(
                "SELECT conname FROM pg_constraint "
                "WHERE conrelid='ai_call_metrics'::regclass "
                "  AND conname LIKE 'chk_aim_injection_%'"
            )
            checks = sorted(r[0] for r in cur.fetchall())
            assert "chk_aim_injection_risk" in checks
            assert "chk_aim_injection_score_nonneg" in checks
            logger.success(f"2 CHECK constraints active: {checks}")

            cur.execute(
                "SELECT indexname FROM pg_indexes "
                "WHERE tablename='ai_call_metrics' AND indexname='idx_aim_high_risk'"
            )
            assert cur.fetchone(), "idx_aim_high_risk missing"
            logger.success("Partial index idx_aim_high_risk created")
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
