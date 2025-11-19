/**
 * Permissions Admin API Service
 * Handles all API calls to the backend permissions endpoints
 *
 * @module permissions-admin/services
 * @author Claude Code
 * @date 2025-11-17
 */

import type {
  Permission,
  Role,
  RolePermission,
  UserPermission,
  CreateRoleRequest,
  UpdateRoleRequest,
  GrantUserPermissionRequest,
  RoleWithPermissions,
  UserWithPermissions,
} from "../types";

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_VERSION = "/api/v1";

// =============================================================================
// HTTP CLIENT
// =============================================================================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get auth token (adjust based on your auth implementation)
    const token = typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Merge with provided headers
    if (options.headers) {
      const headersToMerge = options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : Array.isArray(options.headers)
        ? Object.fromEntries(options.headers)
        : options.headers;
      Object.assign(headers, headersToMerge);
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.detail || "API request failed");
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

const client = new ApiClient(API_BASE_URL + API_VERSION);

// =============================================================================
// PERMISSIONS API
// =============================================================================

export const permissionsApi = {
  /**
   * Get all permissions
   */
  getAll: async (params?: {
    module_name?: string;
    resource?: string;
    is_critical?: boolean;
  }): Promise<Permission[]> => {
    const queryParams = new URLSearchParams();
    if (params?.module_name) queryParams.append("module_name", params.module_name);
    if (params?.resource) queryParams.append("resource", params.resource);
    if (params?.is_critical !== undefined)
      queryParams.append("is_critical", String(params.is_critical));

    const query = queryParams.toString();
    const response = await client.get<{ items: Permission[]; total: number; page: number; page_size: number }>(`/permissions${query ? `?${query}` : ""}`);

    // Extract permissions array from paginated response
    return response.items || [];
  },

  /**
   * Get permission by ID
   */
  getById: async (id: string): Promise<Permission> => {
    return client.get<Permission>(`/permissions/${id}`);
  },

  /**
   * Get permissions grouped by resource
   */
  getByResource: async (): Promise<Record<string, Permission[]>> => {
    const permissions = await permissionsApi.getAll();
    return permissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  },
};

// =============================================================================
// ROLES API
// =============================================================================

export const rolesApi = {
  /**
   * Get all roles
   */
  getAll: async (params?: {
    entity_type?: string;
    is_system?: boolean;
  }): Promise<Role[]> => {
    const queryParams = new URLSearchParams();
    if (params?.entity_type) queryParams.append("entity_type", params.entity_type);
    if (params?.is_system !== undefined)
      queryParams.append("is_system", String(params.is_system));

    const query = queryParams.toString();
    const response = await client.get<{ items: Role[]; total: number; page: number; page_size: number }>(`/roles${query ? `?${query}` : ""}`);

    // Extract roles array from paginated response
    return response.items || [];
  },

  /**
   * Get role by ID with permissions
   */
  getById: async (id: string): Promise<RoleWithPermissions> => {
    return client.get<RoleWithPermissions>(`/roles/${id}`);
  },

  /**
   * Create new role
   */
  create: async (data: CreateRoleRequest): Promise<Role> => {
    return client.post<Role>("/roles", data);
  },

  /**
   * Update role
   */
  update: async (id: string, data: UpdateRoleRequest): Promise<Role> => {
    return client.put<Role>(`/roles/${id}`, data);
  },

  /**
   * Delete role (only custom roles, not system roles)
   */
  delete: async (id: string): Promise<void> => {
    return client.delete<void>(`/roles/${id}`);
  },

  /**
   * Get permissions for a role
   */
  getPermissions: async (roleId: string): Promise<Permission[]> => {
    return client.get<Permission[]>(`/roles/${roleId}/permissions`);
  },

  /**
   * Grant permission to role
   */
  grantPermission: async (
    roleId: string,
    permissionId: string
  ): Promise<RolePermission> => {
    return client.post<RolePermission>(
      `/roles/${roleId}/permissions/${permissionId}`,
      { granted: true }
    );
  },

  /**
   * Revoke permission from role
   */
  revokePermission: async (
    roleId: string,
    permissionId: string
  ): Promise<void> => {
    return client.delete<void>(
      `/roles/${roleId}/permissions/${permissionId}`
    );
  },
};

// =============================================================================
// USER PERMISSIONS API
// =============================================================================

export const userPermissionsApi = {
  /**
   * Get all permissions for a user (role + individual)
   */
  getUserPermissions: async (userId: string): Promise<UserWithPermissions> => {
    return client.get<UserWithPermissions>(`/users/${userId}/permissions`);
  },

  /**
   * Grant permission to user (temporary or permanent)
   */
  grantPermission: async (
    userId: string,
    data: GrantUserPermissionRequest
  ): Promise<UserPermission> => {
    return client.post<UserPermission>(
      `/users/${userId}/permissions`,
      data
    );
  },

  /**
   * Revoke permission from user
   */
  revokePermission: async (
    userId: string,
    permissionId: string
  ): Promise<void> => {
    return client.delete<void>(
      `/users/${userId}/permissions/${permissionId}`
    );
  },

  /**
   * Check if user has specific permission
   */
  hasPermission: async (
    userId: string,
    permissionName: string
  ): Promise<boolean> => {
    try {
      const result = await client.get<{ has_permission: boolean }>(
        `/users/${userId}/permissions/check?permission=${permissionName}`
      );
      return result.has_permission;
    } catch {
      return false;
    }
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export const permissionsAdminApi = {
  permissions: permissionsApi,
  roles: rolesApi,
  userPermissions: userPermissionsApi,
};

export default permissionsAdminApi;
