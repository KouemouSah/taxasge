/**
 * Agent Dashboard Configuration
 *
 * entity-menus.ts has been REMOVED (P0-2).
 * All menu configuration now comes dynamically from backend API (GET /menu-config/me).
 *
 * Entity-specific filter configs are in entity-filters.ts (declarative, no code changes needed).
 *
 * @module agent-dashboard/config
 */

export {
  ENTITY_FILTER_CONFIGS,
  ENTITY_WORKFLOW_TITLES,
  resolveTypeLabel,
} from './entity-filters';
export type {
  FilterOption,
  FilterDef,
  TypeLabelConfig,
  EntityFilterConfig,
} from './entity-filters';
