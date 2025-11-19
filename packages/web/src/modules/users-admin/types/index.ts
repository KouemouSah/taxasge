/**
 * Users Admin Types
 * Type definitions for user management
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

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  is_active: boolean
  two_factor_enabled: boolean
  created_at: string
  updated_at?: string
  last_login?: string
}

export interface CreateUserRequest {
  email: string
  first_name: string
  last_name: string
  role: UserRole
  password: string
  is_active?: boolean
  two_factor_enabled?: boolean
}

export interface UpdateUserRequest {
  email?: string
  first_name?: string
  last_name?: string
  role?: UserRole
  is_active?: boolean
  two_factor_enabled?: boolean
}

export interface PaginatedUsersResponse {
  items: User[]
  total: number
  page: number
  page_size: number
}
