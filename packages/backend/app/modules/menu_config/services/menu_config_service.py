"""
Menu Configuration Service

Generates dynamic menus based on entity workflows or role configuration.
Supports two modes:
- Workflow-based: Auto-generates menus from entity.workflow_codes using mapping rules
- Module-based: Uses explicit menu_config from roles table

Requires database columns (migration 063):
- roles: menu_config, dashboard_config, ui_config
- agent_profiles: menu_overrides, dashboard_overrides

Author: Claude Code Expert
Date: 2026-01-19
Updated: 2026-01-25 - Added caching for performance optimization (Phase 4)
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from loguru import logger
import json

from app.modules.menu_config.models.menu_config import (
    MenuConfigResponse,
    DashboardConfigResponse,
    AgentMenuConfigResponse,
    MenuItemBase,
    SubMenuItemWithBadge,
    MenuBadgeConfig,
    WidgetConfigBase,
)
from app.modules.permissions.repositories.user_permission_repository import UserPermissionRepository
from app.core.cache import (
    get_menu_cache,
    get_workflow_mappings_cache,
    CacheKeys,
)


class MenuConfigService:
    """Service for generating and managing menu configurations"""

    # Workflow category icons mapping (fallback if no mapping rule exists)
    # These are workflow prefixes, not entity codes - used for icon assignment
    WORKFLOW_ICONS = {
        'PASAPORTE': 'Plane',
        'RESIDENCIA': 'Globe',
        'CONDUCIR': 'Car',
        'VEHICULO': 'Car',
        'CONTRATO': 'FileSignature',
        'VISADO': 'Globe',
        'PERMISO_TRABAJO': 'Briefcase',
        'CEDULA': 'CreditCard',
        'ACTA': 'FileText',
    }

    # NOTE: Module-based entities are now determined dynamically:
    # If role.menu_config IS NOT NULL → module-based (use role config)
    # Otherwise → workflow-based (generate from entity.workflow_codes)

    async def get_agent_menu_config(
        self,
        agent_profile_id: UUID,
        user_id: UUID,
        db_connection,
        use_cache: bool = True
    ) -> AgentMenuConfigResponse:
        """
        Get complete menu configuration for an agent.

        Process:
        1. Check cache first (if enabled)
        2. Fetch agent profile with entity and role info
        3. Determine if workflow-based or module-based
        4. Generate or fetch menu config accordingly
        5. Add common agent menus (stats, etc.)
        6. Merge with any agent-specific overrides
        7. Fetch dashboard config
        8. Include permissions for frontend filtering
        9. Cache the result

        Args:
            agent_profile_id: Agent profile UUID
            user_id: User UUID (for permissions)
            db_connection: Database connection
            use_cache: Whether to use cache (default: True)

        Returns:
            AgentMenuConfigResponse with all configuration
        """
        cache = get_menu_cache()
        cache_key = CacheKeys.agent_menu_config(str(agent_profile_id))

        # Check cache first
        if use_cache:
            cached = await cache.get(cache_key)
            if cached:
                logger.debug(f"Cache hit for agent menu config: {agent_profile_id}")
                return cached

        # 1. Fetch agent profile with joins
        agent_data = await self._fetch_agent_with_details(agent_profile_id, db_connection)

        if not agent_data:
            raise ValueError(f"Agent profile not found: {agent_profile_id}")

        entity_code = agent_data.get('entity_code')
        role_code = agent_data.get('role_code')
        role_menu_config = agent_data.get('role_menu_config')
        role_dashboard_config = agent_data.get('role_dashboard_config')
        agent_menu_overrides = agent_data.get('menu_overrides')
        agent_dashboard_overrides = agent_data.get('dashboard_overrides')
        available_workflows = agent_data.get('available_workflows', [])

        # 2. Determine entity type dynamically
        # Module-based: role has explicit menu_config (no workflow generation needed)
        # Workflow-based: generate menus from entity.workflow_codes
        is_module_based = role_menu_config is not None
        entity_type = "module" if is_module_based else "workflow"

        logger.debug(
            f"Agent {agent_profile_id}: entity={entity_code}, type={entity_type}, "
            f"role={role_code}, has_role_menu={role_menu_config is not None}, "
            f"workflows={available_workflows}"
        )

        # 3. Generate or fetch menu config
        if is_module_based:
            # Module-based: use role.menu_config directly
            menu_config = self._parse_menu_config(role_menu_config, "role")
            logger.debug(f"Using role menu_config for {role_code}")
        else:
            # Workflow-based: generate from workflows
            menu_config = await self._generate_workflow_menus(
                available_workflows,
                entity_code,
                db_connection
            )
            logger.debug(f"Generated workflow menus for entity: {entity_code}")

        # 4. Add common agent menus (stats, etc.) - applies to all entities
        menu_config = self._add_common_agent_menus(menu_config)

        # 5. Apply agent overrides if any
        if agent_menu_overrides:
            menu_config = self._apply_menu_overrides(menu_config, agent_menu_overrides)

        # 6. Get dashboard config
        if is_module_based and role_dashboard_config:
            dashboard_config = self._parse_dashboard_config(role_dashboard_config)
        else:
            dashboard_config = self._get_default_dashboard_config(entity_type)

        if agent_dashboard_overrides:
            dashboard_config = self._apply_dashboard_overrides(
                dashboard_config, agent_dashboard_overrides
            )

        # 7. Get user permissions
        perm_repo = UserPermissionRepository(db_connection)
        permissions = await perm_repo.get_all_permission_names(str(user_id))

        result = AgentMenuConfigResponse(
            agent_profile_id=agent_profile_id,
            entity_code=entity_code,
            entity_type=entity_type,
            role_code=role_code,
            available_workflows=available_workflows,
            menu_config=menu_config,
            dashboard_config=dashboard_config,
            permissions=permissions
        )

        # 8. Cache the result (5 min TTL)
        if use_cache:
            await cache.set(cache_key, result, ttl=300)
            logger.debug(f"Cached menu config for agent: {agent_profile_id}")

        return result

    async def _fetch_agent_with_details(
        self,
        agent_profile_id: UUID,
        db_connection
    ) -> Optional[Dict[str, Any]]:
        """Fetch agent profile with entity, role, and workflow details"""
        query = """
            SELECT
                ap.id,
                ap.user_id,
                ap.entity_id,
                ap.is_supervisor,
                ap.specializations,
                ap.menu_overrides,
                ap.dashboard_overrides,
                e.code as entity_code,
                e.workflow_codes as entity_workflow_codes,
                r.code as role_code,
                r.menu_config as role_menu_config,
                r.dashboard_config as role_dashboard_config,
                u.role_id
            FROM agent_profiles ap
            LEFT JOIN entities e ON ap.entity_id = e.id
            LEFT JOIN users u ON ap.user_id = u.id
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE ap.id = $1 AND ap.is_active = true
        """
        result = await db_connection.fetchrow(query, agent_profile_id)

        if not result:
            return None

        data = dict(result)

        # Parse JSONB fields
        if data.get('specializations'):
            if isinstance(data['specializations'], str):
                data['specializations'] = json.loads(data['specializations'])
        else:
            data['specializations'] = []

        if data.get('entity_workflow_codes'):
            if isinstance(data['entity_workflow_codes'], str):
                data['entity_workflow_codes'] = json.loads(data['entity_workflow_codes'])
        else:
            data['entity_workflow_codes'] = []

        if data.get('role_menu_config'):
            if isinstance(data['role_menu_config'], str):
                data['role_menu_config'] = json.loads(data['role_menu_config'])

        if data.get('role_dashboard_config'):
            if isinstance(data['role_dashboard_config'], str):
                data['role_dashboard_config'] = json.loads(data['role_dashboard_config'])

        if data.get('menu_overrides'):
            if isinstance(data['menu_overrides'], str):
                data['menu_overrides'] = json.loads(data['menu_overrides'])

        if data.get('dashboard_overrides'):
            if isinstance(data['dashboard_overrides'], str):
                data['dashboard_overrides'] = json.loads(data['dashboard_overrides'])

        # Resolve available workflows
        # Specializations override entity workflows if defined
        specializations = data.get('specializations') or []
        entity_workflows = data.get('entity_workflow_codes') or []
        data['available_workflows'] = specializations if specializations else entity_workflows

        return data

    async def _generate_workflow_menus(
        self,
        workflows: List[str],
        entity_code: str,
        db_connection
    ) -> MenuConfigResponse:
        """Generate menus from workflow codes using mapping rules"""

        if not workflows:
            logger.warning(f"No workflows found for entity {entity_code}")
            return self._get_default_menu_config("workflow")

        # Fetch mapping rules
        mappings = await self._fetch_workflow_mappings(db_connection)

        # Group workflows by category
        workflow_groups: Dict[str, List[str]] = {}
        for workflow_code in workflows:
            category = self._get_workflow_category(workflow_code)
            if category not in workflow_groups:
                workflow_groups[category] = []
            workflow_groups[category].append(workflow_code)

        # Generate menu items
        menus: List[MenuItemBase] = []

        # Always add dashboard first
        menus.append(MenuItemBase(
            id="dashboard",
            titleKey="agent.nav.dashboard",
            href=f"/dashboard/agent/{entity_code.lower().replace('_', '-') if entity_code else 'default'}",
            icon="LayoutDashboard"
        ))

        # Generate menu for each workflow group
        for category, category_workflows in sorted(workflow_groups.items()):
            mapping = self._find_mapping_for_category(category, mappings)

            if mapping:
                menu_item = self._create_menu_from_mapping(
                    mapping,
                    category_workflows,
                    entity_code
                )
                menus.append(menu_item)
            else:
                # Default menu generation
                menu_item = self._create_default_menu(
                    category,
                    category_workflows,
                    entity_code
                )
                menus.append(menu_item)

        return MenuConfigResponse(
            version="1.0",
            source="workflow",
            menus=menus
        )

    def _get_workflow_category(self, workflow_code: str) -> str:
        """Extract category from workflow code (e.g., PASAPORTE_NUEVO -> PASAPORTE)"""
        parts = workflow_code.split('_')
        return parts[0] if parts else workflow_code

    async def _fetch_workflow_mappings(self, db_connection) -> List[Dict]:
        """Fetch all active workflow menu mappings (cached for 30 min)"""
        cache = get_workflow_mappings_cache()
        cache_key = CacheKeys.workflow_mappings()

        # Check cache first
        cached = await cache.get(cache_key)
        if cached:
            logger.debug("Cache hit for workflow mappings")
            return cached

        # Fetch from database
        query = """
            SELECT * FROM workflow_menu_mapping
            WHERE is_active = true
            ORDER BY display_order
        """
        results = await db_connection.fetch(query)
        mappings = [dict(r) for r in results]

        # Cache for 30 minutes (workflow mappings rarely change)
        await cache.set(cache_key, mappings, ttl=1800)
        logger.debug(f"Cached {len(mappings)} workflow mappings")

        return mappings

    def _find_mapping_for_category(
        self,
        category: str,
        mappings: List[Dict]
    ) -> Optional[Dict]:
        """Find mapping rule for a workflow category"""
        for mapping in mappings:
            pattern = mapping['workflow_pattern'].replace('%', '')
            if category.startswith(pattern.rstrip('_')):
                return mapping
        return None

    def _create_menu_from_mapping(
        self,
        mapping: Dict,
        workflows: List[str],
        entity_code: str
    ) -> MenuItemBase:
        """Create menu item from mapping rule"""
        # Convert underscores to hyphens for URL paths (e.g., CNEDOGE_PASAPORTE -> cnedoge-pasaporte)
        entity_path = entity_code.lower().replace('_', '-') if entity_code else 'default'
        base_path = f"/dashboard/agent/{entity_path}/{mapping['menu_group_id']}"
        permission_prefix = mapping.get('permission_prefix', 'service_requests')

        items: List[SubMenuItemWithBadge] = []

        if mapping.get('include_pending', True):
            items.append(SubMenuItemWithBadge(
                id="pending",
                titleKey="agent.nav.pending",
                href=f"{base_path}/pending",
                icon="Clock",
                permission=f"{permission_prefix}.read",
                badge=MenuBadgeConfig(type="count", source="pending_count")
            ))

        if mapping.get('include_validation', True):
            items.append(SubMenuItemWithBadge(
                id="validation",
                titleKey="agent.nav.validation",
                href=f"{base_path}/validation",
                icon="CheckCircle",
                permission=f"{permission_prefix}.validate"
            ))

        if mapping.get('include_appointments', False):
            items.append(SubMenuItemWithBadge(
                id="appointments",
                titleKey="agent.nav.appointments",
                href=f"{base_path}/appointments",
                icon="Calendar",
                permission="appointments.manage"
            ))

        if mapping.get('include_history', True):
            items.append(SubMenuItemWithBadge(
                id="history",
                titleKey="agent.nav.history",
                href=f"{base_path}/history",
                icon="History",
                permission=f"{permission_prefix}.read"
            ))

        return MenuItemBase(
            id=mapping['menu_group_id'],
            titleKey=mapping['menu_title_key'],
            icon=mapping['menu_icon'],
            permission=f"{permission_prefix}.read",
            items=items
        )

    def _create_default_menu(
        self,
        category: str,
        workflows: List[str],
        entity_code: str
    ) -> MenuItemBase:
        """Create default menu for unmapped workflow category"""
        menu_id = category.lower()
        # Convert underscores to hyphens for URL paths
        entity_path = entity_code.lower().replace('_', '-') if entity_code else 'default'
        base_path = f"/dashboard/agent/{entity_path}/{menu_id}"
        icon = self.WORKFLOW_ICONS.get(category, 'FileText')

        return MenuItemBase(
            id=menu_id,
            titleKey=f"agent.nav.{menu_id}",
            icon=icon,
            permission="service_requests.read",
            items=[
                SubMenuItemWithBadge(
                    id="pending",
                    titleKey="agent.nav.pending",
                    href=f"{base_path}/pending",
                    icon="Clock",
                    permission="service_requests.read"
                ),
                SubMenuItemWithBadge(
                    id="validation",
                    titleKey="agent.nav.validation",
                    href=f"{base_path}/validation",
                    icon="CheckCircle",
                    permission="service_requests.validate"
                ),
                SubMenuItemWithBadge(
                    id="history",
                    titleKey="agent.nav.history",
                    href=f"{base_path}/history",
                    icon="History",
                    permission="service_requests.read"
                )
            ]
        )

    def _parse_menu_config(
        self,
        config: Optional[Dict],
        source: str
    ) -> MenuConfigResponse:
        """Parse menu config from JSON"""
        if not config:
            return self._get_default_menu_config(source)

        try:
            # Parse menus
            menus = []
            for menu_data in config.get('menus', []):
                items = None
                if menu_data.get('items'):
                    items = [
                        SubMenuItemWithBadge(
                            id=item['id'],
                            titleKey=item['titleKey'],
                            href=item['href'],
                            icon=item['icon'],
                            permission=item.get('permission'),
                            badge=MenuBadgeConfig(**item['badge']) if item.get('badge') else None
                        )
                        for item in menu_data['items']
                    ]

                menus.append(MenuItemBase(
                    id=menu_data['id'],
                    titleKey=menu_data['titleKey'],
                    icon=menu_data['icon'],
                    href=menu_data.get('href'),
                    permission=menu_data.get('permission'),
                    items=items
                ))

            return MenuConfigResponse(
                version=config.get('version', '1.0'),
                source=config.get('source', source),
                menus=menus
            )
        except Exception as e:
            logger.error(f"Failed to parse menu config: {e}")
            return self._get_default_menu_config(source)

    def _get_default_menu_config(self, source: str) -> MenuConfigResponse:
        """Return default menu config"""
        return MenuConfigResponse(
            version="1.0",
            source=source,
            menus=[
                MenuItemBase(
                    id="dashboard",
                    titleKey="agent.nav.dashboard",
                    href="/dashboard/agent",
                    icon="LayoutDashboard"
                )
            ]
        )

    def _parse_dashboard_config(
        self,
        config: Optional[Dict]
    ) -> DashboardConfigResponse:
        """Parse dashboard config from JSON"""
        if not config:
            return self._get_default_dashboard_config("module")

        try:
            widgets = [
                WidgetConfigBase(
                    id=w['id'],
                    visible=w.get('visible', True),
                    position=w.get('position', 1),
                    size=w.get('size', 'medium'),
                    customConfig=w.get('customConfig')
                )
                for w in config.get('widgets', [])
            ]

            return DashboardConfigResponse(
                version=config.get('version', '1.0'),
                layout=config.get('layout', 'grid'),
                widgets=widgets
            )
        except Exception as e:
            logger.error(f"Failed to parse dashboard config: {e}")
            return self._get_default_dashboard_config("module")

    def _get_default_dashboard_config(self, entity_type: str) -> DashboardConfigResponse:
        """Return default dashboard config based on entity type"""
        if entity_type == "workflow":
            widgets = [
                WidgetConfigBase(id="pending_requests", visible=True, position=1, size="small"),
                WidgetConfigBase(id="in_progress", visible=True, position=2, size="small"),
                WidgetConfigBase(id="completed_today", visible=True, position=3, size="small"),
                WidgetConfigBase(id="recent_activity", visible=True, position=4, size="large"),
            ]
        else:
            widgets = [
                WidgetConfigBase(id="stats_card", visible=True, position=1, size="medium"),
                WidgetConfigBase(id="recent_activity", visible=True, position=2, size="large"),
            ]

        return DashboardConfigResponse(
            version="1.0",
            layout="grid",
            widgets=widgets
        )

    def _add_common_agent_menus(
        self,
        menu_config: MenuConfigResponse
    ) -> MenuConfigResponse:
        """
        Add common menu items that apply to all agents regardless of entity type.

        Currently adds:
        - My Stats: Personal performance statistics page

        These are added at the end of the menu list.
        """
        # Check if stats menu already exists (to avoid duplicates)
        existing_ids = {menu.id for menu in menu_config.menus}
        if 'my-stats' in existing_ids:
            return menu_config

        # Add My Stats menu
        stats_menu = MenuItemBase(
            id="my-stats",
            titleKey="agent.stats.title",
            href="/dashboard/agent/stats",
            icon="BarChart3",
            permission="agent.view_performance"
        )

        # Insert stats menu after dashboard (position 1) if dashboard exists
        updated_menus = list(menu_config.menus)
        if updated_menus and updated_menus[0].id == "dashboard":
            updated_menus.insert(1, stats_menu)
        else:
            updated_menus.append(stats_menu)

        return MenuConfigResponse(
            version=menu_config.version,
            source=menu_config.source,
            menus=updated_menus
        )

    def _apply_menu_overrides(
        self,
        menu_config: MenuConfigResponse,
        overrides: Dict
    ) -> MenuConfigResponse:
        """
        Apply agent-specific menu overrides.

        Supports:
        - hidden_menus: List of menu IDs to hide
        - additional_menus: List of menu items to add
        """
        if not overrides:
            return menu_config

        # Get hidden menus
        hidden_menus = set(overrides.get('hidden_menus', []))

        # Filter out hidden menus
        filtered_menus = [
            menu for menu in menu_config.menus
            if menu.id not in hidden_menus
        ]

        # Add additional menus if any
        additional = overrides.get('additional_menus', [])
        for menu_data in additional:
            try:
                items = None
                if menu_data.get('items'):
                    items = [
                        SubMenuItemWithBadge(**item)
                        for item in menu_data['items']
                    ]
                filtered_menus.append(MenuItemBase(
                    id=menu_data['id'],
                    titleKey=menu_data['titleKey'],
                    icon=menu_data['icon'],
                    href=menu_data.get('href'),
                    permission=menu_data.get('permission'),
                    items=items
                ))
            except Exception as e:
                logger.warning(f"Failed to add additional menu: {e}")

        return MenuConfigResponse(
            version=menu_config.version,
            source="custom",  # Mark as custom since overrides were applied
            menus=filtered_menus
        )

    def _apply_dashboard_overrides(
        self,
        dashboard_config: DashboardConfigResponse,
        overrides: Dict
    ) -> DashboardConfigResponse:
        """
        Apply agent-specific dashboard overrides.

        Supports:
        - hidden_widgets: List of widget IDs to hide
        - widget_positions: Dict of widget_id -> new position
        """
        if not overrides:
            return dashboard_config

        hidden_widgets = set(overrides.get('hidden_widgets', []))
        widget_positions = overrides.get('widget_positions', {})

        # Filter and update widgets
        updated_widgets = []
        for widget in dashboard_config.widgets:
            if widget.id in hidden_widgets:
                continue

            # Update position if specified
            new_position = widget_positions.get(widget.id, widget.position)
            updated_widgets.append(WidgetConfigBase(
                id=widget.id,
                visible=widget.visible,
                position=new_position,
                size=widget.size,
                customConfig=widget.customConfig
            ))

        # Sort by position
        updated_widgets.sort(key=lambda w: w.position)

        return DashboardConfigResponse(
            version=dashboard_config.version,
            layout=dashboard_config.layout,
            widgets=updated_widgets
        )


# Singleton instance
_menu_config_service: Optional[MenuConfigService] = None


def get_menu_config_service() -> MenuConfigService:
    """Get menu config service singleton"""
    global _menu_config_service
    if _menu_config_service is None:
        _menu_config_service = MenuConfigService()
    return _menu_config_service
