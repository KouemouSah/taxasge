#!/usr/bin/env python3
"""Apply migration 317 (dashboard_registrations table + dashboards.manage perm).

Pattern: psycopg2 sync (asyncpg hangs from MSYS bash on Supabase pooler).
Sets app.current_user_id BEFORE INSERT INTO role_permissions to satisfy
audit_role_permissions_change trigger.

Idempotent: CREATE TABLE IF NOT EXISTS, ON CONFLICT DO NOTHING.

Usage:
    cd packages/backend
    python scripts/apply_migration_317.py
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
    logger.error("DATABASE_URL not found in .env.local or .env")
    sys.exit(1)

MIGRATION = ROOT / "database" / "migrations" / "317_dashboard_registrations.sql"


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
            # Audit trigger context (required for INSERT INTO role_permissions)
            cur.execute(
                "SELECT id::text FROM users WHERE role::text IN "
                "('admin', 'super_admin') ORDER BY created_at LIMIT 1"
            )
            row = cur.fetchone()
            if not row:
                logger.error("No admin user found - audit trigger would crash")
                return 1
            admin_id = row[0]
            logger.info(f"Audit trigger context: app.current_user_id = {admin_id}")
            cur.execute(
                "SELECT set_config('app.current_user_id', %s, false)",
                (admin_id,),
            )

            logger.info(f"Executing {MIGRATION.name}")
            cur.execute(MIGRATION.read_text(encoding="utf-8"))
            logger.success(f"{MIGRATION.name} applied (in transaction)")

        conn.commit()
        logger.success("Migration committed.")

        # ---- Verification queries ----
        with conn.cursor() as cur:
            logger.info("=" * 60)
            logger.info("Verification of migration 317")
            logger.info("=" * 60)

            # 1. Table exists
            cur.execute(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables "
                "WHERE table_schema='public' AND table_name='dashboard_registrations')"
            )
            assert cur.fetchone()[0], "dashboard_registrations missing"
            logger.success("[1/8] table dashboard_registrations exists")

            # 2. Columns
            cur.execute(
                "SELECT column_name, data_type FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name='dashboard_registrations' "
                "ORDER BY ordinal_position"
            )
            cols = cur.fetchall()
            expected_cols = {
                "dashboard_id",
                "looker_report_id",
                "looker_page_id",
                "is_active",
                "updated_by",
                "updated_at",
                "created_at",
            }
            actual_cols = {c[0] for c in cols}
            assert actual_cols == expected_cols, (
                f"column mismatch: missing={expected_cols - actual_cols}, "
                f"unexpected={actual_cols - expected_cols}"
            )
            logger.success(f"[2/8] columns OK ({len(cols)} columns)")

            # 3. CHECK constraints
            cur.execute(
                "SELECT conname FROM pg_constraint "
                "WHERE conrelid = 'dashboard_registrations'::regclass "
                "AND contype = 'c' ORDER BY conname"
            )
            checks = [r[0] for r in cur.fetchall()]
            assert "chk_looker_report_id_format" in checks, "chk_looker_report_id_format missing"
            assert "chk_looker_page_id_format" in checks, "chk_looker_page_id_format missing"
            logger.success(f"[3/8] CHECK constraints active: {checks}")

            # 4. Partial index
            cur.execute(
                "SELECT indexname FROM pg_indexes "
                "WHERE tablename='dashboard_registrations' "
                "ORDER BY indexname"
            )
            indexes = [r[0] for r in cur.fetchall()]
            assert "idx_dashboard_registrations_active" in indexes, "partial index missing"
            logger.success(f"[4/8] indexes: {indexes}")

            # 5. Permission registered
            cur.execute(
                "SELECT id::text, name, is_critical, module_name FROM permissions "
                "WHERE name = 'dashboards.manage'"
            )
            p = cur.fetchone()
            assert p is not None, "dashboards.manage permission missing"
            assert p[2] is True, f"is_critical should be TRUE, got {p[2]}"
            logger.success(
                f"[5/8] permission dashboards.manage: id={p[0]} "
                f"is_critical={p[2]} module={p[3]}"
            )
            perm_id = p[0]

            # 6. Grants exactly to admin + super_admin
            cur.execute(
                "SELECT r.code FROM roles r "
                "JOIN role_permissions rp ON rp.role_id = r.id "
                "WHERE rp.permission_id = %s ORDER BY r.code",
                (perm_id,),
            )
            grants = [r[0] for r in cur.fetchall()]
            assert grants == ["admin", "super_admin"], (
                f"expected [admin, super_admin], got {grants}"
            )
            logger.success(f"[6/8] grants: {grants}")

            # 7. CHECK valid path (insert + delete)
            cur.execute(
                "INSERT INTO dashboard_registrations (dashboard_id, looker_report_id, looker_page_id) "
                "VALUES ('test_dummy_317', 'abc123-def456-ghi789', 'p_12345')"
            )
            cur.execute(
                "DELETE FROM dashboard_registrations WHERE dashboard_id = 'test_dummy_317'"
            )
            logger.success("[7/8] CHECK valid path: insert + delete OK")

            # 8. CHECK reject path (regex fail, 7 chars too short)
            cur.execute("SAVEPOINT chk_reject_test")
            try:
                cur.execute(
                    "INSERT INTO dashboard_registrations (dashboard_id, looker_report_id) "
                    "VALUES ('test_bad_317', 'tooshrt')"
                )
                cur.execute("ROLLBACK TO SAVEPOINT chk_reject_test")
                logger.error("[8/8] FAIL: bad regex should have been rejected")
                return 1
            except psycopg2.errors.CheckViolation:
                cur.execute("ROLLBACK TO SAVEPOINT chk_reject_test")
                logger.success("[8/8] CHECK reject path: regex correctly enforced")

            conn.commit()

            # Final non-regression counts (compare to known state)
            logger.info("=" * 60)
            logger.info("Non-regression counts")
            logger.info("=" * 60)
            cur.execute("SELECT count(*) FROM permissions")
            logger.info(f"  permissions total: {cur.fetchone()[0]} (expected ~337)")
            cur.execute("SELECT count(*) FROM role_permissions")
            logger.info(f"  role_permissions total: {cur.fetchone()[0]} (expected ~1890)")

    finally:
        conn.close()

    logger.success("Migration 317 applied + verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
