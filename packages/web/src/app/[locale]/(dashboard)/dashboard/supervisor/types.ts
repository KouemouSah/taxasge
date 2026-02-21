/**
 * Shared types and helpers for Supervisor pages
 * Aligned with backend supervisor_routes.py response models
 *
 * Single source of truth — all supervisor pages import from here.
 */

// =============================================================================
// AGENT
// =============================================================================

/** Backend: AgentListItem (supervisor_routes.py:168-180) */
export interface AgentListItem {
  agent_profile_id: string;
  agent_id: string | null; // DEPRECATED: backward compat
  agent_name: string;
  agent_email: string;
  current_assignments: number;
  capacity_percentage: number;
  workload_status: 'available' | 'normal' | 'busy' | 'overloaded' | 'unavailable';
  availability: 'available' | 'on_leave' | 'sick_leave' | 'training' | 'mission' | 'temporarily_unavailable';
  specializations?: string[];
  avg_processing_time_hours?: number;
  success_rate: number;
}

/** Backend: AgentAssignmentItem (supervisor_routes.py) */
export interface AgentAssignmentItem {
  assignment_id: string;
  request_id: string;
  request_reference: string | null;
  workflow_code: string | null;
  status: string;
  assigned_at: string | null;
}

// =============================================================================
// ESCALATION
// =============================================================================

/** Backend: EscalationListItem (supervisor_routes.py:969-983) */
export interface Escalation {
  id: string;
  queue_id: string;
  reason: string;
  priority_score: number;
  status: string;
  escalation_status: 'pending' | 'in_review' | 'resolved' | 'reassigned';
  case_reference: string;
  case_type: string;
  escalated_by_name: string;
  escalated_by_email: string;
  escalated_at: string;
  created_at: string;
  assigned_to_name?: string;
}

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export function getPriorityLevel(score: number): PriorityLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

// =============================================================================
// DASHBOARD
// =============================================================================

/** Backend: DashboardResponse (supervisor_routes.py:160-165) */
export interface SupervisorDashboardStats {
  team: { activeAgents: number; totalAgents: number; utilizationRate: number };
  escalations: { pending: number; resolvedToday: number; avgResolutionTime: number };
  assignments: { pending: number; inProgress: number; completedToday: number };
  performance: { avgResponseTime: number; slaCompliance: number; qualityScore: number };
}

// =============================================================================
// WORKLOAD
// =============================================================================

/** Backend: WorkloadBalanceReport (supervisor_routes.py:196) */
export interface WorkloadBalanceReport {
  balance_score: number;
  total_agents: number;
  available_agents: number;
  busy_agents: number;
  overloaded_agents: number;
  unavailable_agents: number;
  total_assignments: number;
  avg_assignments_per_agent: number;
  min_assignments: number;
  max_assignments: number;
  rebalancing_needed: boolean;
  rebalancing_recommendation: string | null;
}

export interface WorkloadRecommendation {
  type: string;
  priority: string;
  message: string;
}

export interface WorkloadBalanceResponse {
  report: WorkloadBalanceReport;
  agents: AgentListItem[];
  recommendations: WorkloadRecommendation[];
}

// =============================================================================
// RULES EFFECTIVENESS
// =============================================================================

/** Backend: RuleEffectivenessItem (supervisor_routes.py:183-193) */
export interface RuleEffectivenessItem {
  rule_id: string;
  rule_name: string;
  priority: number;
  times_applied: number;
  times_matched: number;
  success_rate: number;
  effectiveness_score: number;
  application_rate: number; // (times_applied / times_matched) * 100
  last_applied_at: string | null;
}

// =============================================================================
// SHARED HELPERS
// =============================================================================

export const WORKLOAD_STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  normal: 'bg-blue-100 text-blue-800',
  busy: 'bg-yellow-100 text-yellow-800',
  overloaded: 'bg-red-100 text-red-800',
  unavailable: 'bg-gray-100 text-gray-800',
};

export function getBalanceColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

export function getBalanceBadgeKey(score: number): { color: string; key: string } {
  if (score >= 80) return { color: 'bg-green-100 text-green-800', key: 'workload.excellent' };
  if (score >= 60) return { color: 'bg-blue-100 text-blue-800', key: 'workload.good' };
  if (score >= 40) return { color: 'bg-yellow-100 text-yellow-800', key: 'workload.moderate' };
  return { color: 'bg-red-100 text-red-800', key: 'workload.poor' };
}
