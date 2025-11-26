/**
 * Assignments Admin API Service
 * Handles all API calls to the backend assignments endpoints
 *
 * @module assignments-admin/services
 * @author Claude Code
 * @date 2025-11-25
 *
 * BACKEND ALIGNMENT:
 * Routes: /api/v1/assignments (from app/modules/assignment/api/assignment_routes.py)
 *
 * Endpoints:
 * - POST   /api/v1/assignments/manual       → create_manual_assignment
 * - POST   /api/v1/assignments/auto         → create_auto_assignment
 * - GET    /api/v1/assignments              → list_assignments
 * - GET    /api/v1/assignments/{id}         → get_assignment
 * - PUT    /api/v1/assignments/{id}/start   → start_processing
 * - PUT    /api/v1/assignments/{id}/complete → complete_assignment
 * - PUT    /api/v1/assignments/{id}/reassign → reassign_assignment
 * - DELETE /api/v1/assignments/{id}         → cancel_assignment
 * - PATCH  /api/v1/assignments/{id}/priority → update_priority
 * - PATCH  /api/v1/assignments/{id}/deadline → extend_deadline
 */

import { fetchClient } from '@/core/api'
import type {
  Assignment,
  ManualAssignmentRequest,
  AutoAssignmentRequest,
  CompleteAssignmentRequest,
  ReassignmentRequest,
  UpdatePriorityRequest,
  ExtendDeadlineRequest,
  AssignmentStatus,
  AssignmentFilters,
} from '../types'

// =============================================================================
// CONFIGURATION
// =============================================================================

const ASSIGNMENTS_BASE = '/assignments'

// =============================================================================
// ASSIGNMENTS API
// =============================================================================

export const assignmentsApi = {
  // ===========================================================================
  // LIST & GET
  // ===========================================================================

  /**
   * Get all assignments with optional filters
   * BACKEND: GET /api/v1/assignments
   * ROUTE: list_assignments() in assignment_routes.py:303
   */
  getAll: async (params?: AssignmentFilters): Promise<Assignment[]> => {
    return fetchClient.get<Assignment[]>(ASSIGNMENTS_BASE, {
      agent_id: params?.agent_id,
      status: params?.status,
      declaration_id: params?.declaration_id,
      limit: params?.limit ?? 50,
      offset: params?.offset ?? 0,
    })
  },

  /**
   * Get assignment by ID
   * BACKEND: GET /api/v1/assignments/{assignment_id}
   * ROUTE: get_assignment() in assignment_routes.py:263
   */
  getById: async (id: string): Promise<Assignment> => {
    return fetchClient.get<Assignment>(`${ASSIGNMENTS_BASE}/${id}`)
  },

  // ===========================================================================
  // CREATE ASSIGNMENT
  // ===========================================================================

  /**
   * Create manual assignment (Supervisor only)
   * BACKEND: POST /api/v1/assignments/manual
   * ROUTE: create_manual_assignment() in assignment_routes.py:148
   *
   * Requires: assignment.create permission
   */
  createManual: async (data: ManualAssignmentRequest): Promise<Assignment> => {
    return fetchClient.post<Assignment>(`${ASSIGNMENTS_BASE}/manual`, data)
  },

  /**
   * Create auto assignment using intelligent algorithm
   * BACKEND: POST /api/v1/assignments/auto
   * ROUTE: create_auto_assignment() in assignment_routes.py:202
   *
   * Requires: assignment.auto_assign permission
   *
   * Algorithm uses 5 criteria:
   * - Workload (30%): Current assignments
   * - Speed (20%): Avg processing time
   * - Success Rate (25%): Validation success rate
   * - Specialization (15%): Type match
   * - Pending Duration (10%): Age of pending assignments
   */
  createAuto: async (data: AutoAssignmentRequest): Promise<Assignment> => {
    return fetchClient.post<Assignment>(`${ASSIGNMENTS_BASE}/auto`, data)
  },

  // ===========================================================================
  // ASSIGNMENT LIFECYCLE
  // ===========================================================================

  /**
   * Start processing an assignment (Agent action)
   * BACKEND: PUT /api/v1/assignments/{assignment_id}/start
   * ROUTE: start_processing() in assignment_routes.py:380
   *
   * State transition: assigned → in_progress
   * Requires: assignment.start permission
   */
  startProcessing: async (id: string): Promise<Assignment> => {
    return fetchClient.put<Assignment>(`${ASSIGNMENTS_BASE}/${id}/start`, {})
  },

  /**
   * Complete an assignment (Agent action)
   * BACKEND: PUT /api/v1/assignments/{assignment_id}/complete
   * ROUTE: complete_assignment() in assignment_routes.py:436
   *
   * State transition: in_progress → completed
   * Requires: assignment.complete permission
   */
  complete: async (id: string, data: CompleteAssignmentRequest): Promise<Assignment> => {
    return fetchClient.put<Assignment>(`${ASSIGNMENTS_BASE}/${id}/complete`, data)
  },

  /**
   * Reassign to a new agent (Supervisor only)
   * BACKEND: PUT /api/v1/assignments/{assignment_id}/reassign
   * ROUTE: reassign_assignment() in assignment_routes.py:503
   *
   * Creates new assignment for new agent
   * Requires: assignment.reassign permission
   * For in-progress: requires assignment.reassign_in_progress (critical)
   */
  reassign: async (id: string, data: ReassignmentRequest): Promise<Assignment> => {
    return fetchClient.put<Assignment>(`${ASSIGNMENTS_BASE}/${id}/reassign`, data)
  },

  /**
   * Cancel an assignment (Supervisor only)
   * BACKEND: DELETE /api/v1/assignments/{assignment_id}
   * ROUTE: cancel_assignment() in assignment_routes.py:587
   *
   * State transition: any → cancelled
   * Requires: assignment.cancel permission (critical)
   */
  cancel: async (id: string): Promise<void> => {
    return fetchClient.delete<void>(`${ASSIGNMENTS_BASE}/${id}`)
  },

  // ===========================================================================
  // PRIORITY & DEADLINE
  // ===========================================================================

  /**
   * Update assignment priority (Supervisor only)
   * BACKEND: PATCH /api/v1/assignments/{assignment_id}/priority
   * ROUTE: update_priority() in assignment_routes.py:629
   *
   * Requires: assignment.update_priority permission
   */
  updatePriority: async (id: string, data: UpdatePriorityRequest): Promise<Assignment> => {
    return fetchClient.patch<Assignment>(`${ASSIGNMENTS_BASE}/${id}/priority`, data)
  },

  /**
   * Extend assignment deadline (Supervisor only)
   * BACKEND: PATCH /api/v1/assignments/{assignment_id}/deadline
   * ROUTE: extend_deadline() in assignment_routes.py:678
   *
   * Requires: assignment.extend_deadline permission
   */
  extendDeadline: async (id: string, data: ExtendDeadlineRequest): Promise<Assignment> => {
    return fetchClient.patch<Assignment>(`${ASSIGNMENTS_BASE}/${id}/deadline`, data)
  },

  // ===========================================================================
  // LEGACY METHODS (for backward compatibility)
  // ===========================================================================

  /**
   * @deprecated Use createManual instead
   */
  create: async (data: ManualAssignmentRequest): Promise<Assignment> => {
    return assignmentsApi.createManual(data)
  },

  /**
   * @deprecated Not supported - use specific operations instead
   */
  update: async (id: string, data: { status?: AssignmentStatus }): Promise<Assignment> => {
    console.warn(
      'assignmentsApi.update is deprecated. Use specific operations: startProcessing, complete, reassign, cancel'
    )
    // Try to map to correct operation
    if (data.status === 'in_progress') {
      return assignmentsApi.startProcessing(id)
    }
    if (data.status === 'cancelled') {
      await assignmentsApi.cancel(id)
      return assignmentsApi.getById(id)
    }
    throw new Error('Use specific operations: startProcessing, complete, reassign, cancel')
  },

  /**
   * @deprecated Use cancel instead
   */
  delete: async (id: string): Promise<void> => {
    return assignmentsApi.cancel(id)
  },

  /**
   * @deprecated Use updatePriority instead
   */
  updateStatus: async (id: string, status: AssignmentStatus): Promise<Assignment> => {
    console.warn('assignmentsApi.updateStatus is deprecated.')
    if (status === 'in_progress') {
      return assignmentsApi.startProcessing(id)
    }
    if (status === 'cancelled') {
      await assignmentsApi.cancel(id)
      return assignmentsApi.getById(id)
    }
    throw new Error('Use specific operations: startProcessing, complete, reassign, cancel')
  },
}

// =============================================================================
// EXPORTS
// =============================================================================

export default assignmentsApi
