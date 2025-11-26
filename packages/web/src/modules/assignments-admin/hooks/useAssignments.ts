/**
 * Assignments Hooks
 * React Query hooks for assignment operations
 *
 * @module assignments-admin/hooks
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentsApi } from '../services/api'
import type {
  Assignment,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentStatus,
} from '../types'

// Query keys
export const assignmentsKeys = {
  all: ['assignments'] as const,
  lists: () => [...assignmentsKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) =>
    [...assignmentsKeys.lists(), filters] as const,
  details: () => [...assignmentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...assignmentsKeys.details(), id] as const,
}

/**
 * Fetch all assignments with optional filters
 */
export function useAssignments(params?: {
  status?: AssignmentStatus
  assignee_id?: string
  declaration_id?: string
  page?: number
  page_size?: number
}) {
  return useQuery({
    queryKey: assignmentsKeys.list(params || {}),
    queryFn: () => assignmentsApi.getAll(params),
  })
}

/**
 * Fetch a single assignment by ID
 */
export function useAssignment(id: string) {
  return useQuery({
    queryKey: assignmentsKeys.detail(id),
    queryFn: () => assignmentsApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Create a new assignment
 */
export function useCreateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAssignmentRequest) => assignmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() })
    },
  })
}

/**
 * Update an existing assignment
 */
export function useUpdateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssignmentRequest }) =>
      assignmentsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: assignmentsKeys.detail(variables.id),
      })
    },
  })
}

/**
 * Delete an assignment
 */
export function useDeleteAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => assignmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() })
    },
  })
}

/**
 * Update assignment status
 */
export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AssignmentStatus }) =>
      assignmentsApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: assignmentsKeys.detail(variables.id),
      })
    },
  })
}
