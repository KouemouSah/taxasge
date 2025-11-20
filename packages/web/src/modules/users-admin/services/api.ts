/**
 * Users Admin API Service
 * Handles all API calls to the backend admin users endpoints
 *
 * @module users-admin/services
 * @author Claude Code
 * @date 2025-11-19
 *
 * IMPORTANT: Uses /api/v1/admin/users endpoints (admin-only operations)
 * Backend: app/modules/admin/api/user_management_routes.py
 */

import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  PaginatedUsersResponse,
  UserRole,
} from "../types";

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_VERSION = "/api/v1";
const ADMIN_USERS_BASE = "/admin/users"; // Admin-only users endpoints

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

    // Get auth token
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
// USERS API
// =============================================================================

export const usersApi = {
  /**
   * Get all users with optional filters
   * ENDPOINT: GET /api/v1/admin/users
   */
  getAll: async (params?: {
    role?: UserRole;
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<User[]> => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append("role", params.role);
    if (params?.is_active !== undefined)
      queryParams.append("is_active", String(params.is_active));
    if (params?.search) queryParams.append("search", params.search);
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.page_size) queryParams.append("page_size", String(params.page_size));

    const query = queryParams.toString();
    const response = await client.get<PaginatedUsersResponse>(
      `${ADMIN_USERS_BASE}${query ? `?${query}` : ""}`
    );

    // Extract users array from paginated response
    return response.items || [];
  },

  /**
   * Get user by ID
   * ENDPOINT: GET /api/v1/admin/users/{id}
   */
  getById: async (id: string): Promise<User> => {
    return client.get<User>(`${ADMIN_USERS_BASE}/${id}`);
  },

  /**
   * Create new user
   * ENDPOINT: POST /api/v1/admin/users
   */
  create: async (data: CreateUserRequest): Promise<User> => {
    return client.post<User>(ADMIN_USERS_BASE, data);
  },

  /**
   * Update user
   * ENDPOINT: PUT /api/v1/admin/users/{id}
   */
  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    return client.put<User>(`${ADMIN_USERS_BASE}/${id}`, data);
  },

  /**
   * Delete user
   * ENDPOINT: DELETE /api/v1/admin/users/{id}
   */
  delete: async (id: string): Promise<void> => {
    return client.delete<void>(`${ADMIN_USERS_BASE}/${id}`);
  },

  /**
   * Activate/Deactivate user
   * ENDPOINT: PATCH /api/v1/admin/users/{id}
   */
  setActive: async (id: string, is_active: boolean): Promise<User> => {
    return client.patch<User>(`${ADMIN_USERS_BASE}/${id}`, { is_active });
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export default usersApi;
