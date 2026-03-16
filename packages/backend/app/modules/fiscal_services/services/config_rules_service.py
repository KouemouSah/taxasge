"""Config Rules Service — Business logic for fiscal_config_rules.

Handles cross-table validation, cache invalidation, and CRUD orchestration.
"""

import logging
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from app.core.cache import get_services_cache
from app.modules.fiscal_services.repositories.config_rules_repository import (
    ConfigRulesRepository,
)

logger = logging.getLogger(__name__)


class ConfigRulesService:
    """Service layer for fiscal_config_rules."""

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    @staticmethod
    async def list_rules(
        conn,
        config_type: Optional[str] = None,
        bundle_id: Optional[UUID] = None,
        is_enabled: Optional[bool] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[Dict], int]:
        """List config rules with filters."""
        return await ConfigRulesRepository.list_rules(
            conn,
            config_type=config_type,
            bundle_id=bundle_id,
            is_enabled=is_enabled,
            page=page,
            page_size=page_size,
        )

    @staticmethod
    async def get_rule(conn, rule_id: UUID) -> Optional[Dict]:
        """Get a single config rule by ID."""
        return await ConfigRulesRepository.get_rule(conn, rule_id)

    @staticmethod
    async def resolve_for_item(
        conn, bundle_id: UUID, fee_type: str,
        ministry_id: Optional[int], item_id: UUID,
    ) -> Dict:
        """Resolve effective config for a specific item (debug/preview)."""
        return await ConfigRulesRepository.get_effective_for_item(
            conn, bundle_id, fee_type, ministry_id, item_id,
        )

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    @staticmethod
    async def create_rule(
        conn, data: Dict, user_id: Optional[UUID] = None
    ) -> Dict:
        """Create a config rule with cross-table validation.

        Validates:
        - item_id belongs to bundle_id (if both provided)
        - bundle_id exists and is active
        - ministry_id exists
        """
        await ConfigRulesService._validate_scope(conn, data)
        rule = await ConfigRulesRepository.create_rule(conn, data, user_id)
        await ConfigRulesService._invalidate_cache(data.get("bundle_id"))
        return rule

    @staticmethod
    async def update_rule(
        conn, rule_id: UUID, data: Dict, user_id: Optional[UUID] = None
    ) -> Optional[Dict]:
        """Update a config rule. Invalidates cache after mutation."""
        # Fetch existing rule to know the bundle_id for cache invalidation
        existing = await ConfigRulesRepository.get_rule(conn, rule_id)
        if not existing:
            return None

        rule = await ConfigRulesRepository.update_rule(conn, rule_id, data, user_id)
        if rule:
            await ConfigRulesService._invalidate_cache(existing.get("bundle_id"))
        return rule

    @staticmethod
    async def delete_rule(conn, rule_id: UUID) -> bool:
        """Delete a config rule. Invalidates cache after mutation."""
        existing = await ConfigRulesRepository.get_rule(conn, rule_id)
        if not existing:
            return False

        success = await ConfigRulesRepository.delete_rule(conn, rule_id)
        if success:
            await ConfigRulesService._invalidate_cache(existing.get("bundle_id"))
        return success

    # ------------------------------------------------------------------
    # Recompute
    # ------------------------------------------------------------------

    @staticmethod
    async def recompute(conn, bundle_id: Optional[UUID] = None) -> int:
        """Force recompute of effective configs. Invalidates all bundle cache."""
        affected = await ConfigRulesRepository.recompute(conn, bundle_id)
        await ConfigRulesService._invalidate_cache(bundle_id)
        return affected

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    @staticmethod
    async def _validate_scope(conn, data: Dict):
        """Cross-table validation for scope fields."""
        bundle_id = data.get("bundle_id")
        item_id = data.get("item_id")
        ministry_id = data.get("ministry_id")

        # Validate bundle exists and is active
        if bundle_id:
            row = await conn.fetchrow(
                "SELECT id, is_active FROM service_bundles WHERE id = $1",
                bundle_id,
            )
            if not row:
                raise ValueError(f"Bundle {bundle_id} not found")
            if not row["is_active"]:
                raise ValueError(f"Bundle {bundle_id} is inactive")

        # Validate item exists and belongs to the specified bundle
        if item_id:
            row = await conn.fetchrow(
                "SELECT id, bundle_id FROM service_bundle_items WHERE id = $1",
                item_id,
            )
            if not row:
                raise ValueError(f"Item {item_id} not found")
            if bundle_id and row["bundle_id"] != bundle_id:
                raise ValueError(
                    f"Item {item_id} does not belong to bundle {bundle_id}"
                )

        # Validate ministry exists
        if ministry_id:
            row = await conn.fetchrow(
                "SELECT id FROM ministries WHERE id = $1", ministry_id
            )
            if not row:
                raise ValueError(f"Ministry {ministry_id} not found")

    # ------------------------------------------------------------------
    # Cache Invalidation
    # ------------------------------------------------------------------

    @staticmethod
    async def _invalidate_cache(bundle_id: Optional[UUID] = None):
        """Invalidate bundle cache after config mutations.

        Config changes materialize to service_bundle_items via the DB trigger,
        so cached pricing data becomes stale. We nuke relevant bundle cache keys.
        """
        try:
            cache = get_services_cache()
            if bundle_id:
                await cache.delete_pattern(f"bundle:{bundle_id}:")
            # Simulator cache uses commerce_type keys — nuke all
            await cache.delete_pattern("bundle:sim:")
        except Exception as e:
            logger.warning(f"Config rules cache invalidation failed: {e}")
