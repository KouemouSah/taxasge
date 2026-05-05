#!/usr/bin/env python3
"""Apply migration 325 — ai_call_metrics + cost rollup views (Phase A.1).

Idempotent: CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS,
CREATE OR REPLACE VIEW, GRANT (re-grant is no-op).
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

MIGRATION = ROOT / "database" / "migrations" / "325_ai_call_metrics.sql"

EXPECTED_COLUMNS = {
    "id", "timestamp", "trace_id", "span_id",
    "provider", "model_name", "operation",
    "feature", "user_id", "user_role",
    "input_tokens", "output_tokens", "total_tokens", "cost_xaf",
    "latency_ms", "finish_reason", "status", "error_class",
    "prompt_hash", "created_at",
}

EXPECTED_INDEXES = {
    "ai_call_metrics_pkey",
    "idx_aim_timestamp",
    "idx_aim_feature_time",
    "idx_aim_model_time",
    "idx_aim_status_errors",
    "idx_aim_user_time",
    "idx_aim_prompt_hash",
    "idx_aim_trace_id",
}

EXPECTED_CHECKS = {
    "chk_aim_provider",
    "chk_aim_operation",
    "chk_aim_status",
    "chk_aim_tokens_nonneg",
    "chk_aim_latency_nonneg",
    "chk_aim_cost_nonneg",
    "chk_aim_prompt_hash_format",
    "chk_aim_trace_id_format",
    "chk_aim_span_id_format",
}

EXPECTED_VIEWS = {"v_ai_cost_daily", "v_ai_cost_hourly"}


def main() -> int:
    import psycopg2

    if not MIGRATION.exists():
        logger.error(f"Missing: {MIGRATION}")
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

        with conn.cursor() as cur:
            logger.info("=" * 60)
            logger.info("Verification")
            logger.info("=" * 60)

            # 1. Columns
            cur.execute(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'ai_call_metrics'"
            )
            cols = {r[0] for r in cur.fetchall()}
            missing = EXPECTED_COLUMNS - cols
            assert not missing, f"missing columns: {missing}"
            logger.success(f"[1/7] all {len(EXPECTED_COLUMNS)} columns present")

            # 2. Indexes
            cur.execute(
                "SELECT indexname FROM pg_indexes WHERE tablename = 'ai_call_metrics'"
            )
            indexes = {r[0] for r in cur.fetchall()}
            missing = EXPECTED_INDEXES - indexes
            assert not missing, f"missing indexes: {missing}"
            logger.success(f"[2/7] all {len(EXPECTED_INDEXES)} indexes present")

            # 3. CHECK constraints
            cur.execute(
                "SELECT conname FROM pg_constraint "
                "WHERE conrelid = 'ai_call_metrics'::regclass AND contype = 'c'"
            )
            checks = {r[0] for r in cur.fetchall()}
            missing = EXPECTED_CHECKS - checks
            assert not missing, f"missing CHECKs: {missing}"
            logger.success(f"[3/7] all {len(EXPECTED_CHECKS)} CHECK constraints present")

            # 4. Views
            cur.execute(
                "SELECT viewname FROM pg_views WHERE viewname IN ('v_ai_cost_daily','v_ai_cost_hourly')"
            )
            views = {r[0] for r in cur.fetchall()}
            missing = EXPECTED_VIEWS - views
            assert not missing, f"missing views: {missing}"
            logger.success(f"[4/7] both rollup views present")

            # 5. Grants on looker_readonly
            cur.execute(
                "SELECT table_name FROM information_schema.role_table_grants "
                "WHERE grantee = 'looker_readonly' "
                "AND table_name IN ('ai_call_metrics','v_ai_cost_daily','v_ai_cost_hourly') "
                "AND privilege_type = 'SELECT'"
            )
            granted = {r[0] for r in cur.fetchall()}
            assert "ai_call_metrics" in granted, "looker_readonly missing SELECT on ai_call_metrics"
            assert "v_ai_cost_daily" in granted, "looker_readonly missing SELECT on v_ai_cost_daily"
            assert "v_ai_cost_hourly" in granted, "looker_readonly missing SELECT on v_ai_cost_hourly"
            logger.success(f"[5/7] looker_readonly grants verified ({len(granted)} relations)")

            # 6. CHECK reject path: invalid operation
            cur.execute("SAVEPOINT chk_test")
            try:
                cur.execute(
                    "INSERT INTO ai_call_metrics (model_name, operation, feature, latency_ms, status) "
                    "VALUES ('test', 'invalid_op', 'test', 100, 'success')"
                )
                logger.error("[6/7] FAIL: invalid operation should have been rejected")
                return 1
            except psycopg2.errors.CheckViolation:
                cur.execute("ROLLBACK TO SAVEPOINT chk_test")
                logger.success("[6/7] CHECK chk_aim_operation enforced")

            # 7. CHECK valid path + GENERATED total_tokens
            cur.execute("SAVEPOINT ok_test")
            cur.execute("""
                INSERT INTO ai_call_metrics (
                    model_name, operation, feature, latency_ms, status,
                    input_tokens, output_tokens, prompt_hash, trace_id
                ) VALUES (
                    'gemini-2.5-flash', 'chat', 'chatbot_rag', 1234, 'success',
                    150, 80, 'a1b2c3d4e5f60718', 'a1b2c3d4e5f6071829aabbccddee0011'
                ) RETURNING total_tokens, cost_xaf
            """)
            row = cur.fetchone()
            total = row[0]
            assert total == 230, f"expected total_tokens=230, got {total}"
            cur.execute("ROLLBACK TO SAVEPOINT ok_test")
            logger.success(
                f"[7/7] valid INSERT OK — total_tokens={total} (GENERATED column works)"
            )

            conn.commit()
    finally:
        conn.close()

    logger.success("Migration 325 applied + verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
