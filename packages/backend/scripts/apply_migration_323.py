#!/usr/bin/env python3
"""Apply migration 323 (dashboards metadata dynamic — i18n + 8 new Grafana).

Idempotent: ADD COLUMN IF NOT EXISTS, DROP/CREATE CONSTRAINT, ON CONFLICT DO UPDATE
with COALESCE pattern that preserves admin config.
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

MIGRATION = ROOT / "database" / "migrations" / "323_dashboards_metadata_dynamic.sql"

EXPECTED_NEW_COLUMNS = {
    "title_es", "title_fr", "title_en",
    "description_es", "description_fr", "description_en",
    "rls_mode", "embed_mode", "panel_id",
    "display_order", "default_time_range", "icon_name", "category",
}

EXPECTED_DASHBOARDS = {
    # 3 existing (backfilled with i18n)
    "recaudacion", "agentes", "services",
    # 8 new Grafana
    "overview", "payments", "companies", "oms",
    "service-requests", "channel", "inspections", "user-activity",
}

EXPECTED_NEW_CHECKS = {
    "chk_rls_mode_value",
    "chk_embed_mode_value",
    "chk_panel_id_for_solo",
    "chk_category_value",
    "chk_default_time_range_format",
}


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

            # 1. New columns present
            cur.execute(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='dashboard_registrations'"
            )
            cols = {r[0] for r in cur.fetchall()}
            missing = EXPECTED_NEW_COLUMNS - cols
            assert not missing, f"missing columns: {missing}"
            logger.success(f"[1/6] all {len(EXPECTED_NEW_COLUMNS)} new columns present")

            # 2. CHECK constraints created
            cur.execute(
                "SELECT conname FROM pg_constraint "
                "WHERE conrelid='dashboard_registrations'::regclass AND contype='c'"
            )
            checks = {r[0] for r in cur.fetchall()}
            missing_checks = EXPECTED_NEW_CHECKS - checks
            assert not missing_checks, f"missing checks: {missing_checks}"
            logger.success(f"[2/6] all {len(EXPECTED_NEW_CHECKS)} new CHECK constraints active")

            # 3. 11 rows seeded (3 existing + 8 new)
            cur.execute(
                "SELECT dashboard_id FROM dashboard_registrations ORDER BY dashboard_id"
            )
            rows = {r[0] for r in cur.fetchall()}
            missing_rows = EXPECTED_DASHBOARDS - rows
            assert not missing_rows, f"missing rows: {missing_rows}"
            logger.success(f"[3/6] all {len(EXPECTED_DASHBOARDS)} dashboards seeded ({len(rows)} total in BD)")

            # 4. All seeded rows have i18n titles
            cur.execute(
                "SELECT dashboard_id FROM dashboard_registrations "
                "WHERE title_es IS NULL OR title_fr IS NULL OR title_en IS NULL"
            )
            untitled = [r[0] for r in cur.fetchall()]
            assert not untitled, f"rows missing i18n titles: {untitled}"
            logger.success("[4/6] all rows have title_es/fr/en populated")

            # 5. CHECK reject path: bad time range
            cur.execute("SAVEPOINT chk_test")
            try:
                cur.execute(
                    "INSERT INTO dashboard_registrations "
                    "(dashboard_id, provider, default_time_range, grafana_dashboard_uid, "
                    " title_es, title_fr, title_en) "
                    "VALUES ('test_323_bad_time', 'grafana', 'last week', 'facil-test-x', 't', 't', 't')"
                )
                logger.error("[5/6] FAIL: bad time range should have been rejected")
                return 1
            except psycopg2.errors.CheckViolation:
                cur.execute("ROLLBACK TO SAVEPOINT chk_test")
                logger.success("[5/6] CHECK chk_default_time_range_format enforced")

            # 6. CHECK reject path: panel_id missing for solo embed
            cur.execute("SAVEPOINT chk_test2")
            try:
                cur.execute(
                    "INSERT INTO dashboard_registrations "
                    "(dashboard_id, provider, embed_mode, grafana_dashboard_uid, "
                    " title_es, title_fr, title_en) "
                    "VALUES ('test_323_solo_no_panel', 'grafana', 'solo', 'facil-test-y', 't', 't', 't')"
                )
                logger.error("[6/6] FAIL: solo without panel_id should have been rejected")
                return 1
            except psycopg2.errors.CheckViolation:
                cur.execute("ROLLBACK TO SAVEPOINT chk_test2")
                logger.success("[6/6] CHECK chk_panel_id_for_solo enforced")

            # Idempotence is guaranteed by construction:
            #   - ALTER TABLE ... ADD COLUMN IF NOT EXISTS
            #   - DROP CONSTRAINT IF EXISTS / ADD CONSTRAINT
            #   - INSERT ... ON CONFLICT DO UPDATE (preserves admin tweaks via COALESCE)
            # Re-running the SQL file directly via psql is safe.
            conn.commit()
    finally:
        conn.close()

    logger.success("Migration 323 applied + verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
