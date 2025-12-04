/**
 * Companies Types
 * Type definitions for company and member management
 *
 * @module companies/types
 * @author Claude Code
 * @date 2025-12-03
 *
 * ALIGNED WITH BACKEND:
 * - packages/backend/app/modules/companies/models/company.py
 * - CompanyMemberRole, CompanyBase, CompanyCreate, CompanyUpdate, CompanyResponse, CompanyMember
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Company member roles
 * ALIGNED WITH: CompanyMemberRole in backend/models/company.py
 */
export type CompanyMemberRole =
  | 'company_owner'
  | 'company_admin'
  | 'company_accountant'
  | 'company_member'

// =============================================================================
// COMPANY TYPES
// =============================================================================

/**
 * Base company fields
 * ALIGNED WITH: CompanyBase in backend/models/company.py
 */
export interface CompanyBase {
  // Required fields
  legal_name: string
  tax_id: string

  // Optional fields
  trade_name?: string | null
  primary_sector_id?: number | null
  address?: string | null
  city?: string | null
  phone?: string | null
  email?: string | null

  // Status fields
  is_active?: boolean
  is_verified?: boolean
}

/**
 * Create company request
 * ALIGNED WITH: CompanyCreate in backend/models/company.py
 */
export interface CompanyCreate extends CompanyBase {}

/**
 * Update company request
 * ALIGNED WITH: CompanyUpdate in backend/models/company.py
 */
export interface CompanyUpdate {
  legal_name?: string
  trade_name?: string | null
  primary_sector_id?: number | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  is_active?: boolean
  is_verified?: boolean
}

/**
 * Company response
 * ALIGNED WITH: CompanyResponse in backend/models/company.py
 */
export interface Company extends CompanyBase {
  id: string
  created_at: string
  updated_at: string

  // Related data
  owner_user_id?: string | null
  primary_sector_name?: string | null
  member_count?: number
}

/**
 * Paginated company list
 * ALIGNED WITH: CompanyListResponse in backend/models/company.py
 */
export interface PaginatedCompaniesResponse {
  companies: Company[]
  total: number
  page: number
  page_size: number
}

// =============================================================================
// MEMBER TYPES
// =============================================================================

/**
 * Company member
 * ALIGNED WITH: CompanyMember in backend/models/company.py
 * Table: user_company_roles
 */
export interface CompanyMember {
  // Database fields
  user_id: string
  company_id: string
  role: CompanyMemberRole
  is_active?: boolean
  assigned_at?: string

  // Related data (from joins)
  user_email?: string | null
  user_name?: string | null
}

/**
 * Add member request
 * For POST /companies/{company_id}/members
 */
export interface AddMemberRequest {
  member_user_id: string
  role: CompanyMemberRole
}

/**
 * Update member role request
 * For PUT /companies/{company_id}/members/{user_id}/role
 */
export interface UpdateMemberRoleRequest {
  role: CompanyMemberRole
}

/**
 * Invite member request (future feature)
 */
export interface InviteMemberRequest {
  email: string
  role: CompanyMemberRole
  message?: string
}

/**
 * Member invitation response (future feature)
 */
export interface MemberInvitation {
  invitation_id: string
  company_id: string
  invitee_email: string
  role: CompanyMemberRole
  expires_at?: string | null
  invitation_token: string
  status: 'pending' | 'accepted' | 'revoked'
}
