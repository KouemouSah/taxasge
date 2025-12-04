/**
 * Roles Admin Module
 * Role management for admin dashboard
 *
 * @module roles-admin
 * @author Claude Code
 * @date 2025-12-04
 */

// Types
export * from './types'

// API
export { rolesApi } from './services/api'

// Hooks
export {
  rolesKeys,
  useRoles,
  useSystemRoles,
  useCustomRoles,
  useRole,
  useRoleWithPermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignPermissions,
  useRemovePermissions,
} from './hooks/useRoles'
