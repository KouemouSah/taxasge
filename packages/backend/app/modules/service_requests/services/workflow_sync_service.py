"""
Workflow Sync Service

Automatically synchronizes workflow configuration (menu_mapping, display_config)
from PredefinedWorkflow classes to database tables.

100% dynamic: reads properties from workflow classes via workflow_engine registry.
Zero hardcoded mapping. Adding a new PredefinedWorkflow class automatically
populates all related DB tables at startup.

Called from:
- main.py lifespan (startup sync)
- POST /admin/service-requests/sync/workflows (admin manual sync)
"""
import json
import logging
from typing import Dict, Any

from app.core.cache import (
    get_workflow_mappings_cache,
    get_menu_cache,
    CacheKeys,
    invalidate_workflow_mappings_cache,
)

logger = logging.getLogger(__name__)


# Default display_config columns/sections per category
# These are reasonable defaults; admin can override via UI
_DEFAULT_LIST_COLUMNS = ["reference", "beneficiary", "status", "created_at"]
_DEFAULT_PREVIEW_SECTIONS = ["identity", "documents"]


async def sync_workflow_config(
    db_connection,
    *,
    invalidate_cache: bool = True,
) -> Dict[str, Any]:
    """
    Sync workflow menu_mapping and display_config from workflow_engine registry.

    Reads menu_group, menu_icon, menu_title_key, requires_appointment from
    each PredefinedWorkflow class. Zero hardcoded mapping.

    Args:
        db_connection: asyncpg connection
        invalidate_cache: Whether to invalidate Redis caches after sync

    Returns:
        Dict with sync stats: mappings_synced, configs_synced, mappings_created, configs_created
    """
    from app.modules.menu_config.services.menu_config_service import (
        get_workflow_menu_metadata,
        get_workflow_category_index,
        invalidate_workflow_indexes,
    )

    # Force rebuild of indexes to pick up any new workflow registrations
    invalidate_workflow_indexes()

    category_index = get_workflow_category_index()
    menu_metadata = get_workflow_menu_metadata()

    result = {
        "mappings_synced": 0,
        "mappings_created": 0,
        "configs_synced": 0,
        "configs_created": 0,
    }

    # Step 1: Sync workflow_menu_mapping (one row per menu_group)
    # INSERT ON CONFLICT DO NOTHING: never overwrite admin customizations.
    # If admin wants to reset to Python defaults, delete the row and restart.
    display_order_counter = 0
    for menu_group, meta in menu_metadata.items():
        pattern = f"{menu_group}_%"
        menu_group_id = menu_group.lower().replace('_', '-')

        try:
            row = await db_connection.fetchrow(
                """
                INSERT INTO workflow_menu_mapping (
                    workflow_pattern, menu_group_id, menu_title_key, menu_icon,
                    display_order, include_appointments, permission_prefix, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
                ON CONFLICT (workflow_pattern) DO NOTHING
                RETURNING id
                """,
                pattern,
                menu_group_id,
                meta["title_key"],
                meta["icon"],
                display_order_counter,
                meta["has_appointments"],
                "service_requests",
            )

            if row:
                result["mappings_created"] += 1

            display_order_counter += 1
            result["mappings_synced"] += 1
        except Exception as e:
            logger.warning(f"Failed to sync menu mapping for {menu_group}: {e}")

    # Step 2: Sync workflow_display_config (one row per workflow_code)
    for code in category_index:
        try:
            existing = await db_connection.fetchrow(
                "SELECT workflow_code FROM workflow_display_config WHERE workflow_code = $1",
                code,
            )

            if not existing:
                # Insert with defaults (DO NOTHING if exists — don't overwrite admin config)
                list_columns = json.dumps(_DEFAULT_LIST_COLUMNS)
                preview_sections = json.dumps(_DEFAULT_PREVIEW_SECTIONS)

                await db_connection.execute(
                    """
                    INSERT INTO workflow_display_config (
                        workflow_code, list_columns, preview_sections
                    ) VALUES ($1, $2::jsonb, $3::jsonb)
                    ON CONFLICT (workflow_code) DO NOTHING
                    """,
                    code,
                    list_columns,
                    preview_sections,
                )
                result["configs_created"] += 1

            result["configs_synced"] += 1
        except Exception as e:
            logger.warning(f"Failed to sync display config for {code}: {e}")

    # Step 3: Invalidate caches
    if invalidate_cache:
        try:
            await invalidate_workflow_mappings_cache()
            # Invalidate display config cache for all codes
            cache = get_menu_cache()
            for code in category_index:
                await cache.delete(CacheKeys.display_config(code))
        except Exception as e:
            logger.warning(f"Cache invalidation warning (non-critical): {e}")

    logger.info(
        f"Workflow config sync: {result['mappings_synced']} mappings "
        f"({result['mappings_created']} new), {result['configs_synced']} display configs "
        f"({result['configs_created']} new)"
    )

    return result
