/**
 * Audit Logs Admin Types
 * Type definitions for audit log management
 *
 * @module audit-logs-admin/types
 * @author Claude Code
 * @date 2025-11-19
 */

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.update'
  | 'user.delete'
  | 'role.create'
  | 'role.update'
  | 'role.delete'
  | 'permission.grant'
  | 'permission.revoke'
  | 'settings.update'
  | 'declaration.create'
  | 'declaration.update'
  | 'declaration.submit'
  | 'declaration.approve'
  | 'declaration.reject'

export interface AuditLog {
  id: string
  user_id: string
  user_email: string
  action: AuditAction
  resource_type: string
  resource_id?: string
  details?: string
  ip_address?: string
  user_agent?: string
  timestamp: string
  success: boolean
}

export interface PaginatedAuditLogsResponse {
  items: AuditLog[]
  total: number
  page: number
  page_size: number
}
