#!/usr/bin/env python3
"""Apply migration 327 — ai_pricing_config (Phase B.2)."""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    logger.error("DATABASE_URL missing")
    sys.exit(1)

MIGRATION = ROOT / "database" / "migrations" / "327_ai_pricing_config.sql"


def main() -> int:
    import psycopg2
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=15)
    try:
        with conn.cursor() as cur:
            logger.info(f"Executing {MIGRATION.name}")
            cur.execute(MIGRATION.read_text(encoding="utf-8"))
        conn.commit()
        logger.success(f"{MIGRATION.name} applied.")

        with conn.cursor() as cur:
            cur.execute(
                "SELECT model_name, input_xaf_per_1m_tokens, output_xaf_per_1m_tokens, is_active "
                "FROM ai_pricing_config ORDER BY model_name"
            )
            rows = cur.fetchall()
            logger.info(f"  {len(rows)} pricing rows seeded:")
            for m, i, o, a in rows:
                logger.info(f"    {m:30s}  input={i}  output={o}  active={a}")
            cur.execute(
                "SELECT count(*) FROM ai_pricing_config WHERE is_active = true"
            )
            assert cur.fetchone()[0] == 9, "expected 9 active rows"
            logger.success("9 active pricing rows verified.")
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
