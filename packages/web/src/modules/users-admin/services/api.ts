/**
 * Users Admin API Service
 * Handles all API calls to the backend admin users endpoints
 *
 * @module users-admin/services
 * @author Claude Code
 * @date 2025-11-25
 *
 * BACKEND ALIGNMENT: Phase 6
 * Routes: /api/v1/admin/users (from app/modules/admin/api/user_management_routes.py)
 * - GET    /api/v1/admin/users              → list_users (paginated)
 * - POST   /api/v1/admin/users              → create_user
 * - GET    /api/v1/admin/users/{user_id}    → get_user
 * - PUT    /api/v1/admin/users/{user_id}    → update_user (partial updates supported)
 * - DELETE /api/v1/admin/users/{user_id}    → delete_user
 * - GET    /api/v1/admin/users/search       → search_users
 * - GET    /api/v1/admin/users/stats        → get_user_stats
 * - GET    /api/v1/admin/users/{user_id}/activities → get_user_activities
 */

import { fetchClient } from '@/core/api'
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

const ADMIN_USERS_BASE = "/admin/users"; // Admin-only users endpoints

// =============================================================================
// USERS API
// =============================================================================

export const usersApi = {
  /**
   * Get all users with optional filters and pagination
   * BACKEND: GET /api/v1/admin/users
   * ROUTE: list_users() in user_management_routes.py:62
   * RESPONSE: UserListResponse with pagination metadata
   */
  getAll: async (params?: {
    role?: UserRole;
    status?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<User[]> => {
    const response = await fetchClient.get<PaginatedUsersResponse>(ADMIN_USERS_BASE, {
      page: params?.page,
      size: params?.size,
      role: params?.role,
      status: params?.status,
      search: params?.search,
    });

    // Backend returns: { items: User[], total: number, page: number, page_size: number, pages: number }
    return response.items || [];
  },

  /**
   * Get user by ID
   * BACKEND: GET /api/v1/admin/users/{user_id}
   * ROUTE: get_user() in user_management_routes.py:177
   */
  getById: async (id: string): Promise<User> => {
    return fetchClient.get<User>(`${ADMIN_USERS_BASE}/${id}`);
  },

  /**
   * Create new user
   * BACKEND: POST /api/v1/admin/users
   * ROUTE: create_user() in user_management_routes.py:125
   *
   * CRITICAL: Backend hashes password automatically using PasswordService
   * Frontend sends plain password, backend handles bcrypt hashing
   */
  create: async (data: CreateUserRequest): Promise<User> => {
    return fetchClient.post<User>(ADMIN_USERS_BASE, data);
  },

  /**
   * Update user (supports partial updates)
   * BACKEND: PUT /api/v1/admin/users/{user_id}
   * ROUTE: update_user() in user_management_routes.py:230
   *
   * CRITICAL:
   * - Backend supports partial updates (exclude_unset=True)
   * - Only sends non-null fields
   * - Email uniqueness check done backend-side
   * - Password hashing done backend-side if password provided
   */
  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    return fetchClient.put<User>(`${ADMIN_USERS_BASE}/${id}`, data);
  },

  /**
   * Delete user (hard delete for professionals, soft delete for citizen/business handled by UI)
   * BACKEND: DELETE /api/v1/admin/users/{user_id}
   * ROUTE: delete_user() in user_management_routes.py:323
   *
   * CRITICAL:
   * - Backend prevents deletion of admin users (400 error)
   * - Returns: { message: "User deleted successfully" }
   */
  delete: async (id: string): Promise<void> => {
    await fetchClient.delete<{ message: string }>(`${ADMIN_USERS_BASE}/${id}`);
  },

  /**
   * Activate/Deactivate user (soft delete for citizen/business)
   * Uses the same PUT endpoint for partial update
   * BACKEND: PUT /api/v1/admin/users/{user_id}
   *
   * NOTE: This is a convenience method that uses update() internally
   * Backend doesn't have a separate setActive endpoint
   */
  setActive: async (id: string, is_active: boolean): Promise<User> => {
    return usersApi.update(id, { is_active });
  },

  /**
   * Search users
   * BACKEND: GET /api/v1/admin/users/search
   * ROUTE: search_users() in user_management_routes.py:375
   */
  search: async (params?: {
    q?: string;
    role?: UserRole;
    status?: string;
    country?: string;
    limit?: number;
  }): Promise<User[]> => {
    return fetchClient.get<User[]>(`${ADMIN_USERS_BASE}/search`, {
      q: params?.q,
      role: params?.role,
      status: params?.status,
      country: params?.country,
      limit: params?.limit,
    });
  },

  /**
   * Get user statistics
   * BACKEND: GET /api/v1/admin/users/stats
   * ROUTE: get_user_stats() in user_management_routes.py:423
   */
  getStats: async (): Promise<{
    total: number;
    by_role: Record<string, number>;
    by_status: Record<string, number>;
  }> => {
    return fetchClient.get(`${ADMIN_USERS_BASE}/stats`);
  },

  /**
   * Get user activity history
   * BACKEND: GET /api/v1/admin/users/{user_id}/activities
   * ROUTE: get_user_activities() in user_management_routes.py:451
   */
  getActivities: async (userId: string, limit: number = 50): Promise<Array<{
    id: string;
    user_id: string;
    action: string;
    resource: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
  }>> => {
    return fetchClient.get(`${ADMIN_USERS_BASE}/${userId}/activities`, { limit });
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export default usersApi;
