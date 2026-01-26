/**
 * Widget Data Hooks
 * Fetch data for dashboard widgets from backend API
 *
 * @module agent-dashboard/hooks
 * @date 2026-01-26
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/core/api/client';
import type { EntityCode } from '../types';

// =============================================================================
// TYPES - Aligned with backend Pydantic models
// =============================================================================

export interface UrgentRequestItem {
  id: string;
  reference: string;
  workflow_code: string;
  solicitud_type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: string;
  citizen_name: string;
  sla_status: 'on_track' | 'at_risk' | 'violated';
  sla_deadline: string | null;
  submitted_at: string | null;
  assigned_to: string | null;
}

export interface UrgentRequestsWidgetData {
  items: UrgentRequestItem[];
  total_urgent: number;
  total_high: number;
  total_assigned: number;
}

export interface AppointmentItem {
  id: string;
  reference: string;
  workflow_code: string;
  solicitud_type: string;
  citizen_name: string;
  cita_date: string;
  cita_time: string | null;
  cita_location: string | null;
  status: string;
  is_past: boolean;
}

export interface TodayAppointmentsWidgetData {
  items: AppointmentItem[];
  total_today: number;
  completed_today: number;
  upcoming_count: number;
}

export interface WorkflowDistributionItem {
  workflow_code: string;
  solicitud_type: string;
  label: string;
  count: number;
  percentage: number;
}

export interface WorkflowDistributionWidgetData {
  items: WorkflowDistributionItem[];
  total: number;
}

export interface AlertItem {
  id: string;
  type: 'sla_warning' | 'documents_pending' | 'assignment_needed' | 'system';
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  request_id: string | null;
  request_reference: string | null;
  action_url: string | null;
  created_at: string;
}

export interface AlertsWidgetData {
  items: AlertItem[];
  total_warnings: number;
  total_errors: number;
}

// =============================================================================
// QUERY KEYS
// =============================================================================

export const widgetQueryKeys = {
  all: ['widget'] as const,
  urgent: (entityCode: EntityCode) => [...widgetQueryKeys.all, 'urgent', entityCode] as const,
  appointments: (entityCode: EntityCode) => [...widgetQueryKeys.all, 'appointments', entityCode] as const,
  distribution: (entityCode: EntityCode) => [...widgetQueryKeys.all, 'distribution', entityCode] as const,
  alerts: (entityCode: EntityCode) => [...widgetQueryKeys.all, 'alerts', entityCode] as const,
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to fetch urgent/assigned requests for widget
 */
export function useUrgentRequests(
  entityCode: EntityCode,
  options?: { limit?: number; includeAssigned?: boolean; enabled?: boolean }
) {
  const { limit = 10, includeAssigned = true, enabled = true } = options || {};

  return useQuery<UrgentRequestsWidgetData>({
    queryKey: widgetQueryKeys.urgent(entityCode),
    queryFn: async () => {
      const response = await apiClient.get<UrgentRequestsWidgetData>(
        '/agent/service-requests/dashboard/widgets/urgent',
        {
          params: {
            entity_code: entityCode,
            limit,
            include_assigned: includeAssigned,
          },
        }
      );
      return response.data;
    },
    enabled: enabled && !!entityCode,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

/**
 * Hook to fetch today's appointments for widget
 */
export function useTodayAppointments(
  entityCode: EntityCode,
  options?: { includePast?: boolean; enabled?: boolean }
) {
  const { includePast = true, enabled = true } = options || {};

  return useQuery<TodayAppointmentsWidgetData>({
    queryKey: widgetQueryKeys.appointments(entityCode),
    queryFn: async () => {
      const response = await apiClient.get<TodayAppointmentsWidgetData>(
        '/agent/service-requests/dashboard/widgets/appointments',
        {
          params: {
            entity_code: entityCode,
            include_past: includePast,
          },
        }
      );
      return response.data;
    },
    enabled: enabled && !!entityCode,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Hook to fetch workflow distribution for widget
 */
export function useWorkflowDistribution(
  entityCode: EntityCode,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options || {};

  return useQuery<WorkflowDistributionWidgetData>({
    queryKey: widgetQueryKeys.distribution(entityCode),
    queryFn: async () => {
      const response = await apiClient.get<WorkflowDistributionWidgetData>(
        '/agent/service-requests/dashboard/widgets/distribution',
        {
          params: { entity_code: entityCode },
        }
      );
      return response.data;
    },
    enabled: enabled && !!entityCode,
    staleTime: 60 * 1000, // 1 minute (less volatile)
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch system alerts for widget
 */
export function useSystemAlerts(
  entityCode: EntityCode,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options || {};

  return useQuery<AlertsWidgetData>({
    queryKey: widgetQueryKeys.alerts(entityCode),
    queryFn: async () => {
      const response = await apiClient.get<AlertsWidgetData>(
        '/agent/service-requests/dashboard/widgets/alerts',
        {
          params: { entity_code: entityCode },
        }
      );
      return response.data;
    },
    enabled: enabled && !!entityCode,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// =============================================================================
// COMBINED HOOK - Fetch all widget data at once
// =============================================================================

export interface AllWidgetData {
  urgent: UrgentRequestsWidgetData | null;
  appointments: TodayAppointmentsWidgetData | null;
  distribution: WorkflowDistributionWidgetData | null;
  alerts: AlertsWidgetData | null;
  isLoading: boolean;
  isError: boolean;
}

export function useAllWidgetData(
  entityCode: EntityCode,
  options?: { enabled?: boolean }
): AllWidgetData {
  const { enabled = true } = options || {};

  const urgentQuery = useUrgentRequests(entityCode, { enabled });
  const appointmentsQuery = useTodayAppointments(entityCode, { enabled });
  const distributionQuery = useWorkflowDistribution(entityCode, { enabled });
  const alertsQuery = useSystemAlerts(entityCode, { enabled });

  return {
    urgent: urgentQuery.data ?? null,
    appointments: appointmentsQuery.data ?? null,
    distribution: distributionQuery.data ?? null,
    alerts: alertsQuery.data ?? null,
    isLoading:
      urgentQuery.isLoading ||
      appointmentsQuery.isLoading ||
      distributionQuery.isLoading ||
      alertsQuery.isLoading,
    isError:
      urgentQuery.isError ||
      appointmentsQuery.isError ||
      distributionQuery.isError ||
      alertsQuery.isError,
  };
}

// =============================================================================
// PERSONAL STATS WIDGET (uses v_agent_performance_summary)
// =============================================================================

export interface PersonalStatsItem {
  agent_profile_id: string | null;
  current_month_processed: number;
  current_month_approved: number;
  current_month_rejected: number;
  current_month_escalated: number;
  avg_processing_minutes: number | null;
  sla_respected_count: number;
  sla_missed_count: number;
  sla_respect_percentage: number | null;
  approval_rate: number | null;
  rejection_rate: number | null;
  escalation_rate: number | null;
  last_action_at: string | null;
}

export interface PersonalStatsWidgetData {
  stats: PersonalStatsItem;
  period_label: string;
}

export function usePersonalStats(options?: { enabled?: boolean }) {
  const { enabled = true } = options || {};

  return useQuery<PersonalStatsWidgetData>({
    queryKey: [...widgetQueryKeys.all, 'personal-stats'],
    queryFn: async () => {
      const response = await apiClient.get<PersonalStatsWidgetData>(
        '/agent/service-requests/dashboard/widgets/personal-stats'
      );
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

// =============================================================================
// TEAM WORKLOAD WIDGET (uses v_agents_workload_dashboard)
// For supervisors only
// =============================================================================

export interface TeamMemberWorkload {
  agent_profile_id: string;
  full_name: string;
  email: string | null;
  current_assignments: number;
  max_concurrent_assignments: number;
  capacity_percentage: number | null;
  load_level: 'low' | 'normal' | 'high' | 'critical';
  workload_status: string;
  availability: string;
  current_month_processed: number;
  sla_respect_percentage: number | null;
}

export interface TeamWorkloadWidgetData {
  members: TeamMemberWorkload[];
  total_agents: number;
  available_agents: number;
  overloaded_agents: number;
  avg_capacity: number | null;
}

export function useTeamWorkload(
  entityCode: EntityCode,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options || {};

  return useQuery<TeamWorkloadWidgetData>({
    queryKey: [...widgetQueryKeys.all, 'team-workload', entityCode],
    queryFn: async () => {
      const response = await apiClient.get<TeamWorkloadWidgetData>(
        '/agent/service-requests/dashboard/widgets/team-workload',
        { params: { entity_code: entityCode } }
      );
      return response.data;
    },
    enabled: enabled && !!entityCode,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// =============================================================================
// ESCALATIONS WIDGET (uses v_pending_escalations)
// For supervisors only
// =============================================================================

export interface EscalationItem {
  payment_id: string;
  payment_reference: string;
  service_request_reference: string | null;
  total_amount: number | null;
  escalation_level: 'low' | 'medium' | 'high' | 'critical';
  escalation_reason: string | null;
  escalated_at: string;
  hours_since_escalation: number | null;
  original_agent_name: string | null;
  escalated_to_name: string | null;
}

export interface EscalationsWidgetData {
  items: EscalationItem[];
  total_escalations: number;
  critical_count: number;
  high_count: number;
}

export function useEscalations(
  entityCode: EntityCode,
  options?: { limit?: number; enabled?: boolean }
) {
  const { limit = 10, enabled = true } = options || {};

  return useQuery<EscalationsWidgetData>({
    queryKey: [...widgetQueryKeys.all, 'escalations', entityCode],
    queryFn: async () => {
      const response = await apiClient.get<EscalationsWidgetData>(
        '/agent/service-requests/dashboard/widgets/escalations',
        { params: { entity_code: entityCode, limit } }
      );
      return response.data;
    },
    enabled: enabled && !!entityCode,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// =============================================================================
// PENDING PAYMENTS WIDGET (uses v_pending_payment_validations)
// For treasury agents
// =============================================================================

export interface PendingPaymentItem {
  payment_id: string;
  payment_reference: string;
  request_reference: string | null;
  workflow_code: string | null;
  user_name: string | null;
  payment_method: string | null;
  total_amount: number | null;
  currency: string;
  hours_waiting: number | null;
  assigned_to_name: string | null;
  created_at: string;
}

export interface PendingPaymentsWidgetData {
  items: PendingPaymentItem[];
  total_pending: number;
  total_amount: number | null;
  avg_waiting_hours: number | null;
}

export function usePendingPayments(options?: {
  workflowCode?: string;
  limit?: number;
  enabled?: boolean;
}) {
  const { workflowCode, limit = 10, enabled = true } = options || {};

  return useQuery<PendingPaymentsWidgetData>({
    queryKey: [...widgetQueryKeys.all, 'pending-payments', workflowCode],
    queryFn: async () => {
      const response = await apiClient.get<PendingPaymentsWidgetData>(
        '/agent/service-requests/dashboard/widgets/pending-payments',
        { params: { workflow_code: workflowCode, limit } }
      );
      return response.data;
    },
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// =============================================================================
// ANOMALY SUMMARY WIDGET (uses v_anomaly_summary)
// For treasury/supervisors
// =============================================================================

export interface AnomalySummaryItem {
  anomaly_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  count: number;
  total_affected: number | null;
}

export interface AnomalySummaryWidgetData {
  items: AnomalySummaryItem[];
  total_open: number;
  total_critical: number;
  total_amount_affected: number | null;
}

export function useAnomalySummary(options?: { enabled?: boolean }) {
  const { enabled = true } = options || {};

  return useQuery<AnomalySummaryWidgetData>({
    queryKey: [...widgetQueryKeys.all, 'anomaly-summary'],
    queryFn: async () => {
      const response = await apiClient.get<AnomalySummaryWidgetData>(
        '/agent/service-requests/dashboard/widgets/anomaly-summary'
      );
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  });
}
