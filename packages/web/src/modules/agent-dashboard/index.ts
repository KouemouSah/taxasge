/**
 * Agent Dashboard Module
 * Generic, configurable agent dashboard based on entity assignment
 *
 * @module agent-dashboard
 * @date 2025-01-14
 *
 * This module provides:
 * - Dynamic menu configuration per entity (CNEDOGE, DGT, ONRC, etc.)
 * - Permission-based menu filtering
 * - Generic sidebar component
 * - Hooks for agent profile and dashboard context
 *
 * Usage:
 * ```tsx
 * import { GenericAgentSidebar, useAgentDashboard } from '@/modules/agent-dashboard';
 *
 * // In your agent dashboard layout:
 * export default function AgentLayout({ children }) {
 *   return (
 *     <div className="flex h-screen">
 *       <GenericAgentSidebar />
 *       <main className="flex-1">{children}</main>
 *     </div>
 *   );
 * }
 * ```
 */

// Types
export type {
  EntityCode,
  WorkflowCode,
  MenuSingleItem,
  MenuGroup,
  MenuItem,
  EntityDashboardConfig,
  AgentDashboardContext,
} from './types';
export { isMenuGroup } from './types';

// Configuration
export {
  CNEDOGE_CONFIG,
  DGT_CONFIG,
  ONRC_CONFIG,
  MINFP_CONFIG,
  TESORO_CONFIG,
  OFIVE_CONFIG,
  EXTRANJERIA_CONFIG,
  ENTITY_CONFIGS,
  getEntityConfig,
  getEntityCodeFromName,
} from './config';

// Hooks
export {
  useAgentProfile,
  useAgentDashboard,
  useAgentEntityRedirect,
  useMenuConfig,
  useDynamicMenuItems,
} from './hooks';

// Components
export {
  GenericAgentSidebar,
  MobileAgentSidebar,
  GenericEntityDashboard,
  DynamicMenu,
  DynamicDashboard,
} from './components';
export type { WidgetData } from './components';
