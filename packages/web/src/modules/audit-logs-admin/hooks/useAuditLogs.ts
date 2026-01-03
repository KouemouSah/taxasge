/**
 * Audit Logs Hooks
 * React Query hooks for audit log operations
 *
 * @module audit-logs-admin/hooks
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { auditLogsApi } from '../services/api'
import type { AuditAction } from '../types'

// Query keys
export const auditLogsKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogsKeys.all, 'list'] as const,
  list: (filters: Record<string, string | number | boolean | undefined>) =>
    [...auditLogsKeys.lists(), filters] as const,
  details: () => [...auditLogsKeys.all, 'detail'] as const,
  detail: (id: string) => [...auditLogsKeys.details(), id] as const,
  user: (userId: string) => [...auditLogsKeys.all, 'user', userId] as const,
}

/**
 * Fetch all audit logs with optional filters
 */
export function useAuditLogs(params?: {
  action?: AuditAction
  user_id?: string
  resource_type?: string
  success?: boolean
  start_date?: string
  end_date?: string
  search?: string
  page?: number
  page_size?: number
}) {
  return useQuery({
    queryKey: auditLogsKeys.list(params || {}),
    queryFn: () => auditLogsApi.getAll(params),
  })
}

/**
 * Fetch a single audit log by ID
 */
export function useAuditLog(id: string) {
  return useQuery({
    queryKey: auditLogsKeys.detail(id),
    queryFn: () => auditLogsApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Fetch audit logs for a specific user
 */
export function useUserAuditLogs(
  userId: string,
  params?: {
    action?: AuditAction
    page?: number
    page_size?: number
  }
) {
  return useQuery({
    queryKey: [...auditLogsKeys.user(userId), params],
    queryFn: () => auditLogsApi.getByUser(userId, params),
    enabled: !!userId,
  })
}
