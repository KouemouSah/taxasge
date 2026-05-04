#!/usr/bin/env python3
"""End-to-end smoke test for E1 phase 2 backend (DashboardConfigService).

Runs against the live Supabase BD. NO HTTP server required.

Coverage:
1. list_admin_configs: empty BD → 3 entries with source="unset"
2. list_admin_configs: env var set → source="env_fallback"
3. upsert_config: insert new → audit_log entry, source="db", returns DTO
4. get_public_reports_config: cache hit on 2nd call (no DB query)
5. upsert_config: invalidates cache
6. upsert_config: unknown dashboard_id → DashboardNotFoundError
7. cleanup
"""

import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env.local")


async def main() -> int:
    # NB: import here so .env is loaded first.
    import asyncpg
    from app.modules.dashboards.models import DashboardConfigUpdateRequest
    from app.modules.dashboards.services import (
        DashboardConfigService,
        DashboardNotFoundError,
    )
    from app.core.cache import get_cache

    REGISTRY = {
        "recaudacion": {
            "label": "Recaudacion Fiscal",
            "description": "Treasury KPIs",
            "rls_mode": "entity",
        },
        "agentes": {
            "label": "Performance Agentes",
            "description": "Daily workload per agent",
            "rls_mode": "agent_via_join",
        },
        "services": {
            "label": "Catalogo de Servicios",
            "description": "Reference catalog",
            "rls_mode": "public",
        },
    }

    pool = await asyncpg.create_pool(os.getenv("DATABASE_URL"), min_size=1, max_size=2)
    cache = get_cache()
    svc = DashboardConfigService(pool, REGISTRY)

    # Resolve admin user_id for the upsert call (audit_logs.user_id is required uuid)
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id::text FROM users WHERE role::text IN ('admin','super_admin') "
            "ORDER BY created_at LIMIT 1"
        )
    admin_id = row["id"]
    logger.info(f"Admin id for tests: {admin_id}")

    # Cleanup any leftover from previous runs
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM dashboard_registrations WHERE dashboard_id = ANY($1)",
            ["recaudacion", "agentes", "services"],
        )
    await cache.delete(svc.CACHE_KEY)

    # --- Test 1: empty BD, no env → all source=unset
    logger.info("[Test 1] Empty BD, no env → source=unset")
    for k in ("RECAUDACION", "AGENTES", "SERVICES"):
        os.environ.pop(f"LOOKER_REPORTS_{k}_REPORT_ID", None)
        os.environ.pop(f"LOOKER_REPORTS_{k}_PAGE_ID", None)
    configs = await svc.list_admin_configs()
    assert len(configs) == 3, f"expected 3 configs, got {len(configs)}"
    for c in configs:
        assert c.source == "unset", f"expected unset, got {c.source} for {c.dashboard_id}"
        assert c.looker_report_id is None
    logger.success(f"   3 configs all with source=unset")

    # --- Test 2: env var set → source=env_fallback
    logger.info("[Test 2] Env var set → source=env_fallback")
    os.environ["LOOKER_REPORTS_RECAUDACION_REPORT_ID"] = "envfallback-test-123"
    os.environ["LOOKER_REPORTS_RECAUDACION_PAGE_ID"] = "p_env"
    configs = await svc.list_admin_configs()
    rec = next(c for c in configs if c.dashboard_id == "recaudacion")
    assert rec.source == "env_fallback", f"expected env_fallback, got {rec.source}"
    assert rec.looker_report_id == "envfallback-test-123"
    assert rec.looker_page_id == "p_env"
    logger.success(f"   recaudacion: source=env_fallback, report_id={rec.looker_report_id}")

    # --- Test 3: upsert insert → source=db
    logger.info("[Test 3] upsert insert → source=db, audit_log row created")
    update = DashboardConfigUpdateRequest(
        looker_report_id="testreport-abc-123-xyz",
        looker_page_id="p_test",
        is_active=True,
    )
    dto = await svc.upsert_config("recaudacion", update, user_id=admin_id, request=None)
    assert dto.source == "db"
    assert dto.looker_report_id == "testreport-abc-123-xyz"
    assert dto.is_active is True
    assert dto.updated_by == admin_id
    logger.success(f"   recaudacion DTO: source=db, report_id={dto.looker_report_id}")

    async with pool.acquire() as conn:
        audit = await conn.fetchrow(
            "SELECT user_id::text, entity_type, entity_id, action, "
            "       new_values::text, old_values::text "
            "FROM audit_logs "
            "WHERE entity_type='dashboard_config' AND entity_id='recaudacion' "
            "ORDER BY created_at DESC LIMIT 1"
        )
    assert audit is not None, "no audit_logs row for upsert"
    assert audit["user_id"] == admin_id, f"audit user_id mismatch: {audit['user_id']}"
    assert audit["action"] == "dashboard.config_update"
    assert audit["old_values"] is None  # first INSERT, no previous state
    logger.success(
        f"   audit_log: action={audit['action']} old_values={audit['old_values']}"
    )

    # --- Test 4: cache hit on 2nd call to get_public_reports_config
    logger.info("[Test 4] Cache hit on 2nd /reports-config call")
    await cache.delete(svc.CACHE_KEY)  # ensure cold start
    entries1 = await svc.get_public_reports_config()
    cached_value = await cache.get(svc.CACHE_KEY)
    assert cached_value is not None, "cache should be populated after 1st call"
    entries2 = await svc.get_public_reports_config()
    assert len(entries1) == len(entries2) == 3
    rec_entry = next(e for e in entries2 if e.dashboard_id == "recaudacion")
    assert rec_entry.looker_report_id == "testreport-abc-123-xyz"
    logger.success(f"   cache populated, 2nd call returned same payload")

    # --- Test 5: upsert invalidates cache
    logger.info("[Test 5] upsert invalidates cache")
    update2 = DashboardConfigUpdateRequest(
        looker_report_id="updated-report-xyz-789",
        is_active=True,
    )
    await svc.upsert_config("recaudacion", update2, user_id=admin_id, request=None)
    cached_after_write = await cache.get(svc.CACHE_KEY)
    assert cached_after_write is None, (
        f"cache should be cleared after upsert, got {cached_after_write}"
    )
    logger.success(f"   cache cleared after upsert")

    # Audit row 2 should have old_values populated now
    async with pool.acquire() as conn:
        audit2 = await conn.fetchrow(
            "SELECT old_values::text, new_values::text FROM audit_logs "
            "WHERE entity_type='dashboard_config' AND entity_id='recaudacion' "
            "ORDER BY created_at DESC LIMIT 1"
        )
    assert audit2["old_values"] is not None, "old_values should not be None on 2nd update"
    assert "testreport-abc-123-xyz" in audit2["old_values"]
    assert "updated-report-xyz-789" in audit2["new_values"]
    logger.success(f"   audit_log row 2: old_values + new_values both present")

    # --- Test 6: upsert unknown dashboard_id → 404
    logger.info("[Test 6] upsert unknown dashboard_id → DashboardNotFoundError")
    try:
        await svc.upsert_config(
            "nonexistent_id", update, user_id=admin_id, request=None
        )
        logger.error("   FAIL: should have raised DashboardNotFoundError")
        return 1
    except DashboardNotFoundError as exc:
        logger.success(f"   raised: {exc}")

    # --- Cleanup
    logger.info("[Cleanup] Removing test rows + cache + env vars")
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM dashboard_registrations WHERE dashboard_id = ANY($1)",
            ["recaudacion"],
        )
        await conn.execute(
            "DELETE FROM audit_logs "
            "WHERE entity_type='dashboard_config' AND entity_id='recaudacion'"
        )
    await cache.delete(svc.CACHE_KEY)
    for k in ("RECAUDACION_REPORT_ID", "RECAUDACION_PAGE_ID"):
        os.environ.pop(f"LOOKER_REPORTS_{k}", None)
    os.environ.pop("LOOKER_REPORTS_RECAUDACION_REPORT_ID", None)
    os.environ.pop("LOOKER_REPORTS_RECAUDACION_PAGE_ID", None)
    logger.success("   cleanup done")

    await pool.close()
    logger.success("E1 phase 2 backend smoke: ALL 6 TESTS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
