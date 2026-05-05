#!/usr/bin/env python3
"""Apply migration 329 — request_telemetry + hourly MV (Phase C.2)."""

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

MIGRATION = ROOT / "database" / "migrations" / "329_request_telemetry.sql"


def main() -> int:
    import psycopg2
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=15)
    try:
        with conn.cursor() as cur:
            cur.execute(MIGRATION.read_text(encoding="utf-8"))
        conn.commit()
        logger.success(f"{MIGRATION.name} applied.")

        with conn.cursor() as cur:
            # Columns
            cur.execute(
                "SELECT count(*) FROM information_schema.columns "
                "WHERE table_name = 'request_telemetry'"
            )
            cols = cur.fetchone()[0]
            assert cols >= 30, f"expected >=30 cols, got {cols}"
            logger.success(f"[1/4] {cols} columns in request_telemetry")

            # Indexes
            cur.execute(
                "SELECT count(*) FROM pg_indexes WHERE tablename = 'request_telemetry'"
            )
            indexes = cur.fetchone()[0]
            assert indexes >= 8, f"expected >=8 indexes, got {indexes}"
            logger.success(f"[2/4] {indexes} indexes")

            # CHECK constraints
            cur.execute(
                "SELECT count(*) FROM pg_constraint "
                "WHERE conrelid = 'request_telemetry'::regclass AND contype = 'c'"
            )
            checks = cur.fetchone()[0]
            assert checks >= 6, f"expected >=6 CHECKs, got {checks}"
            logger.success(f"[3/4] {checks} CHECK constraints")

            # MV
            cur.execute(
                "SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_request_telemetry_hourly'"
            )
            assert cur.fetchone(), "MV mv_request_telemetry_hourly missing"
            logger.success("[4/4] MV mv_request_telemetry_hourly created")

            # Grants
            cur.execute(
                "SELECT count(*) FROM information_schema.role_table_grants "
                "WHERE grantee = 'looker_readonly' "
                "AND table_name IN ('request_telemetry', 'mv_request_telemetry_hourly')"
            )
            grants = cur.fetchone()[0]
            assert grants == 2, f"expected 2 grants, got {grants}"
            logger.success(f"[bonus] {grants} grants to looker_readonly")
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
