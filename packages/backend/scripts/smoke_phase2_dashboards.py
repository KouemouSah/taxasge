#!/usr/bin/env python3
"""Smoke test — Phase 2 dashboards backend (mig 323).

Exercises the BD-backed flows against the live BD (Supabase pooler):
1. list_admin_configs: returns 11 rows with i18n metadata
2. get_public_reports_config(user_role=None): hides admin_only rows (returns 10)
3. get_public_reports_config(user_role='admin'): returns all 11 rows
4. create_config + soft_delete_config: full lifecycle on a test slug
5. patch_metadata: title_es update round-trip
6. discover_grafana: graceful handling when GRAFANA_SA_TOKEN missing

NO writes that survive the run — every test row is cleaned up with hard DELETE.
"""

import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

env_path = ROOT / ".env.local"
if not env_path.exists():
    env_path = ROOT / ".env"
load_dotenv(env_path)

import asyncpg
from loguru import logger

from app.modules.dashboards.models import (
    DashboardConfigCreateRequest,
    DashboardMetadataPatchRequest,
)
from app.modules.dashboards.services import DashboardConfigService

DATABASE_URL = os.getenv("DATABASE_URL")
TEST_SLUG = "smoke-test-323"
ADMIN_USER_ID = os.getenv("SMOKE_ADMIN_USER_ID")  # any valid users.id


async def main() -> int:
    if not DATABASE_URL:
        logger.error("DATABASE_URL missing")
        return 1
    if not ADMIN_USER_ID:
        logger.error(
            "SMOKE_ADMIN_USER_ID missing — set it to a valid users.id "
            "(needed for FK on dashboard_registrations.updated_by)"
        )
        return 1

    pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=2)
    svc = DashboardConfigService(pool)

    try:
        # 1. list_admin_configs: 11 rows
        configs = await svc.list_admin_configs()
        logger.info(f"[1] list_admin_configs → {len(configs)} rows")
        assert len(configs) >= 11, f"expected >=11, got {len(configs)}"
        sample = next(c for c in configs if c.dashboard_id == "overview")
        assert sample.title_es == "Resumen ejecutivo"
        assert sample.title_fr == "Aperçu exécutif"
        assert sample.title_en == "Executive Overview"
        assert sample.category == "executive"
        assert sample.embed_url is not None or os.environ.get("GRAFANA_BASE_URL") is None
        logger.success(f"[1] OK — overview has i18n + embed_url={bool(sample.embed_url)}")

        # 2. get_public_reports_config (non-admin): admin_only hidden
        public = await svc.get_public_reports_config(user_role="citizen")
        public_ids = {e.dashboard_id for e in public}
        logger.info(f"[2] get_public_reports_config(non-admin) → {len(public)} rows")
        assert "user-activity" not in public_ids, "admin_only row leaked to non-admin"
        logger.success("[2] OK — admin_only hidden")

        # 3. get_public_reports_config (admin): all rows
        admin = await svc.get_public_reports_config(user_role="admin")
        admin_ids = {e.dashboard_id for e in admin}
        logger.info(f"[3] get_public_reports_config(admin) → {len(admin)} rows")
        assert "user-activity" in admin_ids, "admin should see user-activity"
        logger.success("[3] OK — admin sees user-activity")

        # 4. create + soft-delete lifecycle
        # Cleanup any leftover from a failed previous run
        async with pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM dashboard_registrations WHERE dashboard_id = $1",
                TEST_SLUG,
            )

        body = DashboardConfigCreateRequest(
            dashboard_id=TEST_SLUG,
            provider="grafana",
            grafana_dashboard_uid="facil-smoke-test",
            grafana_org_id=1,
            title_es="Test smoke",
            title_fr="Test smoke",
            title_en="Test smoke",
            description_es="ephemeral",
            description_fr="ephemeral",
            description_en="ephemeral",
            rls_mode="authenticated",
            embed_mode="kiosk",
            display_order=999,
            default_time_range="now-7d",
            category="operations",
            is_active=True,
        )
        created = await svc.create_config(body, user_id=ADMIN_USER_ID)
        logger.info(f"[4a] create_config → {created.dashboard_id} (provider={created.provider})")
        assert created.title_fr == "Test smoke"
        assert created.is_active

        # 4b. patch metadata
        patched = await svc.patch_metadata(
            TEST_SLUG,
            DashboardMetadataPatchRequest(title_es="Test smoke v2"),
            user_id=ADMIN_USER_ID,
        )
        assert patched.title_es == "Test smoke v2"
        assert patched.title_fr == "Test smoke"  # unchanged
        logger.success("[4b] patch_metadata: title_es updated, others preserved")

        # 4c. soft-delete
        deleted = await svc.soft_delete_config(TEST_SLUG, user_id=ADMIN_USER_ID)
        assert not deleted.is_active
        logger.success("[4c] soft_delete: is_active=false")

        # Hard cleanup
        async with pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM dashboard_registrations WHERE dashboard_id = $1",
                TEST_SLUG,
            )
        logger.success("[4] OK — full create/patch/soft-delete lifecycle")

        # 5. discover_grafana (likely no SA token configured locally)
        disc = await svc.discover_grafana()
        logger.info(
            f"[5] discover_grafana → sa_configured={disc.sa_token_configured} "
            f"dashboards={len(disc.dashboards)} error={disc.error}"
        )
        assert disc.error is None or disc.sa_token_configured is False
        logger.success("[5] OK — graceful response shape")

    finally:
        await pool.close()

    logger.success("All Phase 2 smoke tests passed.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
