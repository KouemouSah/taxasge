/**
 * useUserPermissions Hook
 * React Query hook for fetching and managing user-specific permissions
 *
 * @module permissions-admin/hooks
 * @author Claude Code
 * @date 2025-11-17
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  GrantUserPermissionRequest,
} from "../types";
import { userPermissionsApi } from "../services/api";

// =============================================================================
// QUERY KEYS
// =============================================================================

export const userPermissionsKeys = {
  all: ["user-permissions"] as const,
  user: (userId: string) => [...userPermissionsKeys.all, userId] as const,
  check: (userId: string, permission: string) =>
    [...userPermissionsKeys.user(userId), "check", permission] as const,
};

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Hook to fetch all permissions for a specific user
 * Includes:
 * - Role permissions (from assigned role)
 * - Individual permission overrides (temporary or permanent)
 * - Effective permissions (combined)
 */
export function useUserPermissions(userId: string | null) {
  return useQuery({
    queryKey: userPermissionsKeys.user(userId || ""),
    queryFn: () => userPermissionsApi.getUserPermissions(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to check if a user has a specific permission
 */
export function useHasPermission(userId: string | null, permissionName: string) {
  return useQuery({
    queryKey: userPermissionsKeys.check(userId || "", permissionName),
    queryFn: () => userPermissionsApi.hasPermission(userId!, permissionName),
    enabled: !!userId && !!permissionName,
    staleTime: 1 * 60 * 1000, // 1 minute (shorter for security checks)
  });
}

/**
 * Hook to check multiple permissions at once
 * Returns an object mapping permission names to boolean values
 */
export function useHasPermissions(userId: string | null, permissionNames: string[]) {
  // Note: In production, consider using useQueries from React Query
  // For now, we'll use a simpler approach
  const { data: userPerms } = useUserPermissions(userId);

  if (!userPerms) {
    return permissionNames.reduce((acc, name) => {
      acc[name] = false;
      return acc;
    }, {} as Record<string, boolean>);
  }

  return permissionNames.reduce((acc, name) => {
    acc[name] = userPerms.effective_permissions.some((p) => p.name === name);
    return acc;
  }, {} as Record<string, boolean>);
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Hook to grant a permission to a user
 * Can be temporary (with expires_at) or permanent
 */
export function useGrantUserPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: GrantUserPermissionRequest }) =>
      userPermissionsApi.grantPermission(userId, data),
    onSuccess: (_, { userId }) => {
      // Invalidate user permissions cache
      queryClient.invalidateQueries({ queryKey: userPermissionsKeys.user(userId) });
      // Invalidate all permission checks for this user
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "user-permissions" &&
          query.queryKey[1] === userId &&
          query.queryKey[2] === "check",
      });
    },
  });
}

/**
 * Hook to revoke a permission from a user
 */
export function useRevokeUserPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, permissionId }: { userId: string; permissionId: string }) =>
      userPermissionsApi.revokePermission(userId, permissionId),
    onSuccess: (_, { userId }) => {
      // Invalidate user permissions cache
      queryClient.invalidateQueries({ queryKey: userPermissionsKeys.user(userId) });
      // Invalidate all permission checks for this user
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "user-permissions" &&
          query.queryKey[1] === userId &&
          query.queryKey[2] === "check",
      });
    },
  });
}

/**
 * Hook to bulk grant permissions to a user
 */
export function useBulkGrantUserPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: GrantUserPermissionRequest[];
    }) => {
      const results = await Promise.all(
        permissions.map((perm) => userPermissionsApi.grantPermission(userId, perm))
      );
      return { userId, granted: results.length };
    },
    onSuccess: (result) => {
      // Invalidate user permissions cache
      queryClient.invalidateQueries({ queryKey: userPermissionsKeys.user(result.userId) });
      // Invalidate all permission checks for this user
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "user-permissions" &&
          query.queryKey[1] === result.userId &&
          query.queryKey[2] === "check",
      });
    },
  });
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get expired permissions for a user
 */
export function useExpiredPermissions(userId: string | null) {
  const { data: userPerms } = useUserPermissions(userId);

  if (!userPerms) return [];

  const now = new Date();
  return userPerms.user_permissions.filter((up) => {
    if (!up.expires_at) return false;
    return new Date(up.expires_at) < now;
  });
}

/**
 * Hook to get temporary (non-expired) permissions for a user
 */
export function useTemporaryPermissions(userId: string | null) {
  const { data: userPerms } = useUserPermissions(userId);

  if (!userPerms) return [];

  const now = new Date();
  return userPerms.user_permissions.filter((up) => {
    if (!up.expires_at) return false;
    return new Date(up.expires_at) >= now;
  });
}

/**
 * Hook to get permanent permissions for a user
 */
export function usePermanentPermissions(userId: string | null) {
  const { data: userPerms } = useUserPermissions(userId);

  if (!userPerms) return [];

  return userPerms.user_permissions.filter((up) => !up.expires_at);
}

/**
 * Hook to get permission overrides (granted or denied)
 * These are permissions that differ from the role's default
 */
export function usePermissionOverrides(userId: string | null) {
  const { data: userPerms } = useUserPermissions(userId);

  if (!userPerms) return { granted: [], denied: [] };

  const rolePermissionIds = new Set(userPerms.role_permissions.map((p) => p.id));

  return {
    granted: userPerms.user_permissions.filter(
      (up) => up.granted && !rolePermissionIds.has(up.permission_id)
    ),
    denied: userPerms.user_permissions.filter((up) => !up.granted),
  };
}
