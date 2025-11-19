/**
 * Assignments Admin Types
 * Type definitions for assignment management
 *
 * @module assignments-admin/types
 * @author Claude Code
 * @date 2025-11-19
 */

export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type AssignmentPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Assignment {
  id: string
  declaration_id: string
  assignee_id: string
  assignee_name: string
  status: AssignmentStatus
  priority: AssignmentPriority
  assigned_at: string
  completed_at?: string
  cancelled_at?: string
  notes?: string
}

export interface CreateAssignmentRequest {
  declaration_id: string
  assignee_id: string
  priority?: AssignmentPriority
  notes?: string
}

export interface UpdateAssignmentRequest {
  status?: AssignmentStatus
  priority?: AssignmentPriority
  notes?: string
}

export interface PaginatedAssignmentsResponse {
  items: Assignment[]
  total: number
  page: number
  page_size: number
}
