#!/usr/bin/env python3
"""Apply migration 319 (dashboard_registrations dual provider support).

Idempotent: ADD COLUMN IF NOT EXISTS, DROP/CREATE CONSTRAINT, ENUM via DO block.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

env_path = ROOT / ".env.local"
if not env_path.exists():
    env_path = ROOT / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    logger.error("DATABASE_URL missing")
    sys.exit(1)

MIGRATION = ROOT / "database" / "migrations" / "319_dashboard_provider_dual.sql"


def main() -> int:
    import psycopg2

    if not MIGRATION.exists():
        logger.error(f"Migration file not found: {MIGRATION}")
        return 1

    logger.info(f"Connecting to {DATABASE_URL.split('@')[-1]}")
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=15)
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            logger.info(f"Executing {MIGRATION.name}")
            cur.execute(MIGRATION.read_text(encoding="utf-8"))
        conn.commit()
        logger.success(f"{MIGRATION.name} applied.")

        # ---- Verification ----
        with conn.cursor() as cur:
            logger.info("=" * 60)
            logger.info("Verification")
            logger.info("=" * 60)

            # 1. ENUM
            cur.execute(
                "SELECT enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid "
                "WHERE typname='dashboard_provider_enum' ORDER BY enumsortorder"
            )
            labels = [r[0] for r in cur.fetchall()]
            assert labels == ["looker_studio", "grafana"], f"unexpected enum: {labels}"
            logger.success(f"[1/5] ENUM dashboard_provider_enum: {labels}")

            # 2. Columns
            cur.execute(
                "SELECT column_name, data_type FROM information_schema.columns "
                "WHERE table_name='dashboard_registrations' "
                "AND column_name IN ('provider','grafana_dashboard_uid','grafana_org_id') "
                "ORDER BY column_name"
            )
            cols = {r[0]: r[1] for r in cur.fetchall()}
            assert "provider" in cols
            assert "grafana_dashboard_uid" in cols
            assert "grafana_org_id" in cols
            logger.success(f"[2/5] new columns: {list(cols.keys())}")

            # 3. CHECK constraints
            cur.execute(
                "SELECT conname FROM pg_constraint "
                "WHERE conrelid='dashboard_registrations'::regclass AND contype='c' "
                "ORDER BY conname"
            )
            checks = [r[0] for r in cur.fetchall()]
            assert "chk_grafana_uid_required_when_grafana" in checks
            assert "chk_grafana_dashboard_uid_format" in checks
            logger.success(f"[3/5] CHECK constraints: {checks}")

            # 4. Existing rows auto-defaulted
            cur.execute(
                "SELECT dashboard_id, provider FROM dashboard_registrations"
            )
            rows = cur.fetchall()
            for did, prov in rows:
                if prov != "looker_studio":
                    logger.error(f"[4/5] FAIL: row {did} has provider={prov}")
                    return 1
            logger.success(
                f"[4/5] all {len(rows)} existing row(s) defaulted to 'looker_studio'"
            )

            # 5. CHECK reject path: insert a grafana provider without uid
            cur.execute("SAVEPOINT chk_test")
            try:
                cur.execute(
                    "INSERT INTO dashboard_registrations "
                    "(dashboard_id, provider, looker_report_id) "
                    "VALUES ('test_g_bad_319', 'grafana', 'fake-report-id-12345')"
                )
                logger.error("[5/5] FAIL: grafana provider w/o uid should have been rejected")
                return 1
            except psycopg2.errors.CheckViolation:
                cur.execute("ROLLBACK TO SAVEPOINT chk_test")
                logger.success("[5/5] CHECK chk_grafana_uid_required_when_grafana enforced")

            # CHECK valid path: insert a grafana provider WITH uid
            cur.execute("SAVEPOINT chk_test2")
            try:
                cur.execute(
                    "INSERT INTO dashboard_registrations "
                    "(dashboard_id, provider, grafana_dashboard_uid, grafana_org_id, looker_report_id) "
                    "VALUES ('test_g_ok_319', 'grafana', 'facil-test-recaudacion', 1, 'fake-report-id-12345')"
                )
                cur.execute(
                    "DELETE FROM dashboard_registrations WHERE dashboard_id='test_g_ok_319'"
                )
                cur.execute("RELEASE SAVEPOINT chk_test2")
                logger.success("[bonus] grafana valid path OK (insert+delete clean)")
            except Exception as e:
                logger.error(f"[bonus] grafana valid path failed: {e}")
                return 1

            conn.commit()
    finally:
        conn.close()

    logger.success("Migration 319 applied + verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
