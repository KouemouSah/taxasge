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

export { useEntityServiceRequests } from './useEntityServiceRequests';
export type { UseEntityServiceRequestsOptions, ActionType, ServiceRequestListItem, ServiceRequestFilters } from './useEntityServiceRequests';

// Widget data hooks
export {
  useUrgentRequests,
  useTodayAppointments,
  useWorkflowDistribution,
  useSystemAlerts,
  useAllWidgetData,
  widgetQueryKeys,
  // New widget hooks
  usePersonalStats,
  useTeamWorkload,
  useEscalations,
  usePendingPayments,
  useAnomalySummary,
  useCalendarWeek,
  useCalendarSlots,
} from './useWidgetData';
export type {
  UrgentRequestItem,
  UrgentRequestsWidgetData,
  AppointmentItem,
  TodayAppointmentsWidgetData,
  WorkflowDistributionItem,
  WorkflowDistributionWidgetData,
  AlertItem,
  AlertsWidgetData,
  AllWidgetData,
  // New widget types
  PersonalStatsItem,
  PersonalStatsWidgetData,
  TeamMemberWorkload,
  TeamWorkloadWidgetData,
  EscalationItem,
  EscalationsWidgetData,
  PendingPaymentItem,
  PendingPaymentsWidgetData,
  AnomalySummaryItem,
  AnomalySummaryWidgetData,
  WeekAppointmentItem,
  DayAppointments,
  CalendarWeekWidgetData,
  DaySlotSummary,
  LocationInfo,
  CalendarSlotsWidgetData,
} from './useWidgetData';
