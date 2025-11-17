/**
 * Permissions Admin Hooks
 * Barrel export for all React Query hooks
 *
 * @module permissions-admin/hooks
 * @author Claude Code
 * @date 2025-11-17
 */

// =============================================================================
// PERMISSIONS HOOKS
// =============================================================================

export {
  // Query hooks
  usePermissions,
  usePermission,
  usePermissionsByResource,
  // Utility hooks
  useModuleNames,
  useResources,
  // Query keys
  permissionsKeys,
} from "./usePermissions";

// =============================================================================
// ROLES HOOKS
// =============================================================================

export {
  // Query hooks
  useRoles,
  useRole,
  useRolePermissions,
  // Mutation hooks
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useGrantRolePermission,
  useRevokeRolePermission,
  useBulkUpdateRolePermissions,
  // Utility hooks
  useEntityTypes,
  useRoleHasPermission,
  // Query keys
  rolesKeys,
} from "./useRoles";

// =============================================================================
// USER PERMISSIONS HOOKS
// =============================================================================

export {
  // Query hooks
  useUserPermissions,
  useHasPermission,
  useHasPermissions,
  // Mutation hooks
  useGrantUserPermission,
  useRevokeUserPermission,
  useBulkGrantUserPermissions,
  // Utility hooks
  useExpiredPermissions,
  useTemporaryPermissions,
  usePermanentPermissions,
  usePermissionOverrides,
  // Query keys
  userPermissionsKeys,
} from "./useUserPermissions";
