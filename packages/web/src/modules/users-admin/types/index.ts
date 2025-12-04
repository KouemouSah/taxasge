/**
 * Users Admin Types
 * Type definitions for user management
 *
 * BACKEND ALIGNMENT:
 * - Backend uses 'status' (UserStatus enum) not 'is_active' (boolean)
 * - The API service transforms backend 'status' to frontend 'is_active'
 *
 * @module users-admin/types
 * @author Claude Code
 * @date 2025-11-19
 */

export type UserRole =
  | 'citizen'
  | 'business'
  | 'accountant'
  | 'admin'
  | 'dgi_agent'
  | 'supervisor_junior_dgi'
  | 'supervisor_readonly'
  | 'supervisor_senior'
  | 'ministry_agent'
  | 'supervisor_dgi'

/**
 * User status enum - matches backend UserStatus
 */
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification'

/**
 * User interface for frontend display
 * Uses is_active boolean for simplicity (transformed from backend status)
 */
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  is_active: boolean  // Transformed from backend 'status' field
  two_factor_enabled: boolean
  created_at: string
  updated_at?: string
  last_login?: string
}

/**
 * Request for creating a new user
 * Backend uses UserCreate model with 'profile' containing first_name/last_name
 */
export interface CreateUserRequest {
  email: string
  first_name: string
  last_name: string
  role: UserRole
  password: string
  is_active?: boolean
  two_factor_enabled?: boolean
}

/**
 * Request for updating a user
 * Backend expects 'status' not 'is_active'
 */
export interface UpdateUserRequest {
  email?: string
  first_name?: string
  last_name?: string
  role?: UserRole
  status?: UserStatus  // Backend expects status, not is_active
  two_factor_enabled?: boolean
}

export interface PaginatedUsersResponse {
  items: User[]
  total: number
  page: number
  page_size: number
}
