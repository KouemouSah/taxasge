/**
 * Assignments Admin Types
 * Type definitions for assignment management
 *
 * @module assignments-admin/types
 * @author Claude Code
 * @date 2025-11-25
 *
 * BACKEND ALIGNMENT:
 * Routes: /api/v1/assignments (from app/modules/assignment/api/assignment_routes.py)
 *
 * Assignment states: assigned → in_progress → completed/cancelled/reassigned
 */

// =============================================================================
// ENUMS
// =============================================================================

export type AssignmentStatus =
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'reassigned'

export type AssignmentPriority = 'low' | 'medium' | 'high' | 'urgent'

export type DeclarationType = 'tax_declaration' | 'fiscal_service'

export type ReassignmentReason =
  | 'workload_rebalance'
  | 'agent_unavailable'
  | 'specialization_mismatch'
  | 'performance_issues'
  | 'agent_request'
  | 'deadline_risk'
  | 'quality_concerns'
  | 'other'

// =============================================================================
// ASSIGNMENT MODEL
// =============================================================================

export interface Assignment {
  id: string
  declaration_id: string
  declaration_type: DeclarationType
  agent_id: string
  supervisor_id?: string
  status: AssignmentStatus
  priority_level: AssignmentPriority
  assigned_at: string
  started_at?: string
  completed_at?: string
  deadline?: string
  notes?: string
  validation_status?: 'approved' | 'rejected'
  quality_score?: number
  processing_duration_hours?: number
  auto_assignment_score?: number
  previous_assignment_id?: string
  reassignment_reason?: ReassignmentReason
  created_at: string
  updated_at: string
}

// =============================================================================
// REQUEST TYPES - Manual Assignment
// =============================================================================

export interface ManualAssignmentRequest {
  declaration_id: string
  declaration_type: DeclarationType
  agent_id: string
  notes?: string
  priority_level?: AssignmentPriority
  deadline_days?: number
}

// =============================================================================
// REQUEST TYPES - Auto Assignment
// =============================================================================

export interface AutoAssignmentRequest {
  declaration_id: string
  declaration_type: DeclarationType
  declaration_data: Record<string, unknown>
  entity_type?: 'DGI' | 'Ministry'
  entity_id?: string
}

// =============================================================================
// REQUEST TYPES - Assignment Operations
// =============================================================================

export interface CompleteAssignmentRequest {
  validation_status: 'approved' | 'rejected'
  quality_score?: number
}

export interface ReassignmentRequest {
  new_agent_id: string
  reason: ReassignmentReason
  notes?: string
}

export interface UpdatePriorityRequest {
  priority_level: AssignmentPriority
}

export interface ExtendDeadlineRequest {
  additional_days: number
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface PaginatedAssignmentsResponse {
  items: Assignment[]
  total: number
  page: number
  page_size: number
}

// =============================================================================
// FILTER TYPES
// =============================================================================

export interface AssignmentFilters {
  agent_id?: string
  status?: AssignmentStatus
  declaration_id?: string
  priority_level?: AssignmentPriority
  limit?: number
  offset?: number
}

// =============================================================================
// LEGACY ALIASES (for backward compatibility)
// =============================================================================

/** @deprecated Use ManualAssignmentRequest instead */
export type CreateAssignmentRequest = ManualAssignmentRequest

/** @deprecated Use specific operation requests instead */
export interface UpdateAssignmentRequest {
  status?: AssignmentStatus
  priority_level?: AssignmentPriority
  notes?: string
}
