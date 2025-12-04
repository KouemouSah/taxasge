/**
 * Companies API Service
 * Handles all API calls to the backend companies endpoints
 *
 * @module companies/services
 * @author Claude Code
 * @date 2025-12-03
 *
 * BACKEND ALIGNMENT:
 * Routes: /api/v1/companies (from app/modules/companies/api/company_routes.py)
 * - POST   /api/v1/companies                              → create_company
 * - GET    /api/v1/companies                              → list_companies (paginated)
 * - GET    /api/v1/companies/{company_id}                 → get_company
 * - PUT    /api/v1/companies/{company_id}                 → update_company
 * - DELETE /api/v1/companies/{company_id}                 → delete_company
 * - GET    /api/v1/companies/{company_id}/members         → get_company_members
 * - POST   /api/v1/companies/{company_id}/members         → add_company_member
 * - DELETE /api/v1/companies/{company_id}/members/{user_id} → remove_company_member
 */

import { fetchClient } from '@/core/api'
import type {
  Company,
  CompanyCreate,
  CompanyUpdate,
  PaginatedCompaniesResponse,
  CompanyMember,
  CompanyMemberRole,
} from '../types'

// =============================================================================
// CONFIGURATION
// =============================================================================

const COMPANIES_BASE = '/companies'

// =============================================================================
// COMPANIES API
// =============================================================================

export const companiesApi = {
  /**
   * Get all companies for current user with pagination
   * BACKEND: GET /api/v1/companies
   * ROUTE: list_companies() in company_routes.py:35
   */
  getAll: async (params?: {
    page?: number
    page_size?: number
  }): Promise<PaginatedCompaniesResponse> => {
    return fetchClient.get<PaginatedCompaniesResponse>(COMPANIES_BASE, {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? 20,
    })
  },

  /**
   * Get company by ID
   * BACKEND: GET /api/v1/companies/{company_id}
   * ROUTE: get_company() in company_routes.py:54
   */
  getById: async (id: string): Promise<Company> => {
    return fetchClient.get<Company>(`${COMPANIES_BASE}/${id}`)
  },

  /**
   * Create new company
   * BACKEND: POST /api/v1/companies
   * ROUTE: create_company() in company_routes.py:22
   *
   * NOTE: Backend automatically assigns creator as company_owner
   */
  create: async (data: CompanyCreate): Promise<Company> => {
    return fetchClient.post<Company>(COMPANIES_BASE, data)
  },

  /**
   * Update company (owner/admin only)
   * BACKEND: PUT /api/v1/companies/{company_id}
   * ROUTE: update_company() in company_routes.py:75
   *
   * NOTE: Requires company_owner or company_admin role
   */
  update: async (id: string, data: CompanyUpdate): Promise<Company> => {
    return fetchClient.put<Company>(`${COMPANIES_BASE}/${id}`, data)
  },

  /**
   * Delete company
   * BACKEND: DELETE /api/v1/companies/{company_id}
   * ROUTE: delete_company() in company_routes.py:97
   *
   * NOTE: Requires company_owner role or companies.delete permission
   */
  delete: async (id: string): Promise<void> => {
    await fetchClient.delete<{ message: string }>(`${COMPANIES_BASE}/${id}`)
  },
}

// =============================================================================
// MEMBERS API
// =============================================================================

export const companyMembersApi = {
  /**
   * Get company members
   * BACKEND: GET /api/v1/companies/{company_id}/members
   * ROUTE: get_company_members() in company_routes.py:131
   */
  getAll: async (companyId: string): Promise<CompanyMember[]> => {
    return fetchClient.get<CompanyMember[]>(`${COMPANIES_BASE}/${companyId}/members`)
  },

  /**
   * Add member to company
   * BACKEND: POST /api/v1/companies/{company_id}/members
   * ROUTE: add_company_member() in company_routes.py:148
   *
   * NOTE: Requires company_owner/company_admin role or companies.manage_members permission
   */
  add: async (
    companyId: string,
    memberUserId: string,
    role: CompanyMemberRole
  ): Promise<CompanyMember> => {
    return fetchClient.post<CompanyMember>(
      `${COMPANIES_BASE}/${companyId}/members`,
      null,
      {
        member_user_id: memberUserId,
        role,
      }
    )
  },

  /**
   * Remove member from company
   * BACKEND: DELETE /api/v1/companies/{company_id}/members/{member_user_id}
   * ROUTE: remove_company_member() in company_routes.py:181
   *
   * NOTE: Requires company_owner/company_admin role
   * NOTE: Owner cannot remove themselves
   */
  remove: async (companyId: string, userId: string): Promise<void> => {
    await fetchClient.delete<{ message: string }>(
      `${COMPANIES_BASE}/${companyId}/members/${userId}`
    )
  },

  /**
   * Update member role
   * NOTE: Backend doesn't have dedicated endpoint yet
   * This would need to be implemented on backend or use remove + add
   */
  updateRole: async (
    _companyId: string,
    _userId: string,
    _role: CompanyMemberRole
  ): Promise<CompanyMember> => {
    // TODO: Implement when backend endpoint is available
    // For now, would require remove + add pattern
    throw new Error('Update role endpoint not yet implemented on backend')
  },
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  companies: companiesApi,
  members: companyMembersApi,
}
