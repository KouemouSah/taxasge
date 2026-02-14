"""
Workflow Sync Service

Automatically synchronizes workflow configuration from PredefinedWorkflow classes
to database tables at startup:
1. workflows table (INSERT ON CONFLICT DO UPDATE)
2. workflow_menu_mapping (INSERT ON CONFLICT DO NOTHING)
3. workflow_display_config (INSERT ON CONFLICT DO NOTHING)
4. Deactivate orphaned predefined workflows

100% dynamic: reads properties from workflow classes via workflow_engine registry.
Zero hardcoded mapping. Adding a new PredefinedWorkflow class automatically
populates all related DB tables at startup.

Called from:
- main.py lifespan (startup sync)
- POST /admin/service-requests/sync/workflows (admin manual sync)
"""
import json
import logging
from typing import Dict, Any, List, Set

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


async def sync_workflows_table(
    db_connection,
) -> Dict[str, Any]:
    """
    Lightweight sync of workflows table from Python classes at startup.

    For each registered workflow, ensures a row exists in the workflows table.
    Uses INSERT ON CONFLICT DO UPDATE for core fields (category, entity_code,
    requires_appointment, is_active=true) but preserves admin-edited fields
    (name_es, description_es, sla_hours, display_order).

    Also deactivates orphaned predefined workflows (in DB but not in code).
    """
    from app.modules.service_requests.services.workflow_engine import workflow_engine
    from app.modules.service_requests.models.enums import WorkflowCode

    result = {
        "workflows_synced": 0,
        "workflows_created": 0,
        "workflows_deactivated": 0,
    }

    all_workflows = workflow_engine.get_all_workflows()
    synced_codes: Set[str] = set()

    for base_code, workflow in all_workflows.items():
        try:
            # Collect all codes this workflow registers
            codes_to_sync: List[str] = []

            allowed_sub_types = getattr(workflow, 'allowed_sub_types', [])
            has_subtype_mapping = hasattr(workflow, 'get_workflow_code_for_subtype')

            if allowed_sub_types and has_subtype_mapping:
                for sub_type in allowed_sub_types:
                    wf_code = workflow.get_workflow_code_for_subtype(sub_type)
                    codes_to_sync.append(wf_code.value)
            elif hasattr(workflow, 'get_all_workflow_codes'):
                for wf_code in workflow.get_all_workflow_codes():
                    codes_to_sync.append(wf_code.value)
            else:
                codes_to_sync.append(base_code.value)

            category = workflow.category.value if hasattr(workflow, 'category') else 'GENERAL'
            entity_code = workflow.entity_code.value if hasattr(workflow, 'entity_code') else 'GENERAL'
            requires_appointment = getattr(workflow, 'requires_appointment', False)
            requires_agent = getattr(workflow, 'requires_agent_review', True)

            for code in codes_to_sync:
                if code in synced_codes:
                    continue

                name_es = code.replace('_', ' ').title()

                row = await db_connection.fetchrow(
                    """
                    INSERT INTO workflows (
                        code, name_es, description_es, category, entity_code,
                        workflow_type, requires_agent_validation, requires_appointment,
                        is_generic, is_active
                    ) VALUES ($1, $2, $3, $4, $5, 'standard', $6, $7, FALSE, TRUE)
                    ON CONFLICT (code) DO UPDATE SET
                        category = EXCLUDED.category,
                        entity_code = EXCLUDED.entity_code,
                        requires_agent_validation = EXCLUDED.requires_agent_validation,
                        requires_appointment = EXCLUDED.requires_appointment,
                        is_active = TRUE,
                        updated_at = NOW()
                    WHERE workflows.is_generic = FALSE
                    RETURNING (xmax = 0) AS is_new
                    """,
                    code, name_es, f"Trámite de {name_es}",
                    category, entity_code,
                    requires_agent, requires_appointment,
                )

                if row and row['is_new']:
                    result["workflows_created"] += 1

                synced_codes.add(code)
                result["workflows_synced"] += 1

        except Exception as e:
            logger.warning(f"Failed to sync workflow {base_code.value}: {e}")

    # Deactivate orphaned predefined workflows
    if synced_codes:
        try:
            orphaned = await db_connection.fetch("""
                UPDATE workflows
                SET is_active = FALSE, updated_at = NOW()
                WHERE is_generic = FALSE
                  AND is_active = TRUE
                  AND code != ALL($1)
                RETURNING code
            """, list(synced_codes))
            if orphaned:
                orphan_codes = [r['code'] for r in orphaned]
                result["workflows_deactivated"] = len(orphan_codes)
                logger.info(f"Deactivated {len(orphan_codes)} orphaned workflows: {orphan_codes}")
        except Exception as e:
            logger.warning(f"Failed to deactivate orphaned workflows: {e}")

    return result


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
