/**
 * Assignments Hooks
 * React Query hooks for assignment operations
 *
 * @module assignments-admin/hooks
 * @author Claude Code
 * @date 2025-11-25
 *
 * BACKEND ALIGNMENT:
 * Routes: /api/v1/assignments (from app/modules/assignment/api/assignment_routes.py)
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentsApi } from '../services/api'
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
// QUERY KEYS
// =============================================================================

export const assignmentsKeys = {
  all: ['assignments'] as const,
  lists: () => [...assignmentsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...assignmentsKeys.lists(), filters] as const,
  details: () => [...assignmentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...assignmentsKeys.details(), id] as const,
}

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Fetch all assignments with optional filters
 * BACKEND: GET /api/v1/assignments
 */
export function useAssignments(params?: AssignmentFilters) {
  return useQuery({
    queryKey: assignmentsKeys.list(params || {}),
    queryFn: () => assignmentsApi.getAll(params),
  })
}

/**
 * Fetch a single assignment by ID
 * BACKEND: GET /api/v1/assignments/{id}
 */
export function useAssignment(id: string) {
  return useQuery({
    queryKey: assignmentsKeys.detail(id),
    queryFn: () => assignmentsApi.getById(id),
    enabled: !!id,
  })
}

// =============================================================================
// CREATION MUTATIONS
// =============================================================================

/**
 * Create manual assignment (Supervisor only)
 * BACKEND: POST /api/v1/assignments/manual
 * Requires: assignment.create permission
 */
export function useCreateManualAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ManualAssignmentRequest) => assignmentsApi.createManual(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() })
    },
  })
}

/**
 * Create auto assignment using intelligent algorithm
 * BACKEND: POST /api/v1/assignments/auto
 * Requires: assignment.auto_assign permission
 */
export function useCreateAutoAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AutoAssignmentRequest) => assignmentsApi.createAuto(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() })
    },
  })
}

// =============================================================================
// LIFECYCLE MUTATIONS
// =============================================================================

/**
 * Start processing an assignment (Agent action)
 * BACKEND: PUT /api/v1/assignments/{id}/start
 * State transition: assigned → in_progress
 * Requires: assignment.start permission
 */
export function useStartAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => assignmentsApi.startProcessing(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.detail(id) })
    },
  })
}

/**
 * Complete an assignment (Agent action)
 * BACKEND: PUT /api/v1/assignments/{id}/complete
 * State transition: in_progress → completed
 * Requires: assignment.complete permission
 */
export function useCompleteAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteAssignmentRequest }) =>
      assignmentsApi.complete(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.detail(variables.id) })
    },
  })
}

/**
 * Reassign to a new agent (Supervisor only)
 * BACKEND: PUT /api/v1/assignments/{id}/reassign
 * Requires: assignment.reassign permission
 */
export function useReassignAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReassignmentRequest }) =>
      assignmentsApi.reassign(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.detail(variables.id) })
    },
  })
}

/**
 * Cancel an assignment (Supervisor only)
 * BACKEND: DELETE /api/v1/assignments/{id}
 * Requires: assignment.cancel permission (critical)
 */
export function useCancelAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => assignmentsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() })
    },
  })
}

// =============================================================================
// PRIORITY & DEADLINE MUTATIONS
// =============================================================================

/**
 * Update assignment priority (Supervisor only)
 * BACKEND: PATCH /api/v1/assignments/{id}/priority
 * Requires: assignment.update_priority permission
 */
export function useUpdateAssignmentPriority() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePriorityRequest }) =>
      assignmentsApi.updatePriority(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.detail(variables.id) })
    },
  })
}

/**
 * Extend assignment deadline (Supervisor only)
 * BACKEND: PATCH /api/v1/assignments/{id}/deadline
 * Requires: assignment.extend_deadline permission
 */
export function useExtendAssignmentDeadline() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExtendDeadlineRequest }) =>
      assignmentsApi.extendDeadline(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.detail(variables.id) })
    },
  })
}

// =============================================================================
// LEGACY HOOKS (for backward compatibility)
// =============================================================================

/**
 * @deprecated Use useCreateManualAssignment instead
 */
export function useCreateAssignment() {
  return useCreateManualAssignment()
}

/**
 * @deprecated Use specific hooks: useStartAssignment, useCompleteAssignment, etc.
 */
export function useUpdateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: AssignmentStatus } }) =>
      assignmentsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.detail(variables.id) })
    },
  })
}

/**
 * @deprecated Use useCancelAssignment instead
 */
export function useDeleteAssignment() {
  return useCancelAssignment()
}

/**
 * @deprecated Use specific hooks instead
 */
export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AssignmentStatus }) =>
      assignmentsApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.detail(variables.id) })
    },
  })
}
