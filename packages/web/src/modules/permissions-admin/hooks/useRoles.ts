/**
 * useRoles Hook
 * React Query hook for fetching and managing roles
 *
 * @module permissions-admin/hooks
 * @author Claude Code
 * @date 2025-11-17
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Role,
  RoleWithPermissions,
  RoleFilter,
  CreateRoleRequest,
  UpdateRoleRequest,
  Permission,
  RolePermission,
} from "../types";
import { rolesApi } from "../services/api";

// =============================================================================
// QUERY KEYS
// =============================================================================

export const rolesKeys = {
  all: ["roles"] as const,
  lists: () => [...rolesKeys.all, "list"] as const,
  list: (filters: RoleFilter) => [...rolesKeys.lists(), filters] as const,
  details: () => [...rolesKeys.all, "detail"] as const,
  detail: (id: string) => [...rolesKeys.details(), id] as const,
  permissions: (roleId: string) => [...rolesKeys.detail(roleId), "permissions"] as const,
};

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Hook to fetch all roles with optional filters
 */
export function useRoles(filters?: RoleFilter) {
  return useQuery({
    queryKey: rolesKeys.list(filters || {}),
    queryFn: async () => {
      const params: {
        entity_type?: string;
        is_system?: boolean;
      } = {};

      if (filters?.entity_type) params.entity_type = filters.entity_type;
      if (filters?.is_system !== undefined) params.is_system = filters.is_system;

      const roles = await rolesApi.getAll(params);

      // Client-side filtering for search
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        return roles.filter(
          (role) =>
            role.name.toLowerCase().includes(searchLower) ||
            role.code.toLowerCase().includes(searchLower) ||
            role.description.toLowerCase().includes(searchLower)
        );
      }

      return roles;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single role by ID with permissions
 */
export function useRole(id: string | null) {
  return useQuery({
    queryKey: rolesKeys.detail(id || ""),
    queryFn: () => rolesApi.getById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter because permissions might change)
  });
}

/**
 * Hook to fetch permissions for a specific role
 */
export function useRolePermissions(roleId: string | null) {
  return useQuery({
    queryKey: rolesKeys.permissions(roleId || ""),
    queryFn: () => rolesApi.getPermissions(roleId!),
    enabled: !!roleId,
    staleTime: 2 * 60 * 1000,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Hook to create a new role
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesApi.create(data),
    onSuccess: () => {
      // Invalidate all role lists
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
    },
  });
}

/**
 * Hook to update an existing role
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleRequest }) =>
      rolesApi.update(id, data),
    onSuccess: (updatedRole) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      // Update detail cache
      queryClient.setQueryData(rolesKeys.detail(updatedRole.id), updatedRole);
    },
  });
}

/**
 * Hook to delete a role (only custom roles)
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: rolesKeys.detail(deletedId) });
    },
  });
}

/**
 * Hook to grant a permission to a role
 */
export function useGrantRolePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      rolesApi.grantPermission(roleId, permissionId),
    onSuccess: (_, { roleId }) => {
      // Invalidate role details and permissions
      queryClient.invalidateQueries({ queryKey: rolesKeys.detail(roleId) });
      queryClient.invalidateQueries({ queryKey: rolesKeys.permissions(roleId) });
    },
  });
}

/**
 * Hook to revoke a permission from a role
 */
export function useRevokeRolePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      rolesApi.revokePermission(roleId, permissionId),
    onSuccess: (_, { roleId }) => {
      // Invalidate role details and permissions
      queryClient.invalidateQueries({ queryKey: rolesKeys.detail(roleId) });
      queryClient.invalidateQueries({ queryKey: rolesKeys.permissions(roleId) });
    },
  });
}

/**
 * Hook to bulk grant/revoke permissions for a role
 */
export function useBulkUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roleId,
      permissionsToGrant,
      permissionsToRevoke,
    }: {
      roleId: string;
      permissionsToGrant: string[];
      permissionsToRevoke: string[];
    }) => {
      // Grant permissions
      const grantPromises = permissionsToGrant.map((permId) =>
        rolesApi.grantPermission(roleId, permId)
      );

      // Revoke permissions
      const revokePromises = permissionsToRevoke.map((permId) =>
        rolesApi.revokePermission(roleId, permId)
      );

      await Promise.all([...grantPromises, ...revokePromises]);

      return { roleId, granted: permissionsToGrant.length, revoked: permissionsToRevoke.length };
    },
    onSuccess: (result) => {
      // Invalidate role details and permissions
      queryClient.invalidateQueries({ queryKey: rolesKeys.detail(result.roleId) });
      queryClient.invalidateQueries({ queryKey: rolesKeys.permissions(result.roleId) });
    },
  });
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get unique entity types from roles
 */
export function useEntityTypes() {
  const { data: roles = [] } = useRoles();

  const entityTypes = Array.from(
    new Set(roles.map((r) => r.entity_type).filter((et) => et !== null))
  ).sort() as string[];

  return entityTypes;
}

/**
 * Hook to check if a role has a specific permission
 */
export function useRoleHasPermission(roleId: string | null, permissionId: string) {
  const { data: permissions = [] } = useRolePermissions(roleId);

  return permissions.some((p) => p.id === permissionId);
}
