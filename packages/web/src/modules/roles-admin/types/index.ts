/**
 * Roles Admin Types
 * Type definitions for role management
 *
 * @module roles-admin/types
 * @author Claude Code
 * @date 2025-12-04
 *
 * BACKEND ALIGNMENT:
 * Models: app/modules/permissions/models/role.py
 */

export interface Role {
  id: string
  name: string
  code: string
  entity_type: string | null // 'DGI' | 'Ministry' | null
  description: string | null
  is_system: boolean
  /** Default agent profile config for this role. NULL = system defaults */
  default_agent_config?: Record<string, unknown> | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface RoleWithPermissions extends Role {
  permissions: string[] // Permission names
  permissions_count: number
}

export interface CreateRoleRequest {
  name: string
  code: string
  entity_type?: string | null
  description?: string
}

export interface UpdateRoleRequest {
  name?: string
  description?: string
}

export interface PaginatedRolesResponse {
  roles: Role[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface AssignPermissionsRequest {
  permission_ids: string[]
  granted?: boolean
}

export interface RemovePermissionsRequest {
  permission_ids: string[]
}

export interface PermissionMatrixRole {
  id: string
  name: string
  code: string
  is_system: boolean
  entity_type: string | null
}

export interface PermissionMatrixPermission {
  id: string
  name: string
  resource: string
  action: string
  description: string | null
  is_critical: boolean
  module_name: string
}

export interface PermissionMatrixResponse {
  roles: PermissionMatrixRole[]
  permissions: PermissionMatrixPermission[]
  assignments: Record<string, boolean> // "role_id:permission_id" → granted
}
