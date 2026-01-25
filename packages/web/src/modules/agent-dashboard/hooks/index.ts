/**
 * Agent Dashboard Hooks
 * @module agent-dashboard/hooks
 */

export {
  useAgentProfile,
  useAgentDashboard,
  useAgentEntityRedirect,
  default,
} from './useAgentDashboard';

export { useEntityAccess } from './useEntityAccess';
export type { EntityAccessResult } from './useEntityAccess';

export { useEntityStats, ENTITY_STATS_QUERY_KEY } from './useEntityStats';
export type { EntityQueueStats, UseEntityStatsReturn } from './useEntityStats';

export { useMenuConfig, useDynamicMenuItems } from './useMenuConfig';

export { useAgentPersonalStats, AGENT_PERSONAL_STATS_QUERY_KEY } from './useAgentPersonalStats';
export type { AgentPersonalStats, UseAgentPersonalStatsReturn } from './useAgentPersonalStats';
