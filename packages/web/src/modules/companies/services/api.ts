/**
 * Companies API Service
 * Uses shared apiClient (Axios) for automatic token refresh, Accept-Language, etc.
 */

import apiClient from '@/core/api/client'
import { toSnakeCase } from '@/core/utils/api-transform'

import type {
  Company,
  CompanyCreate,
  CompanyUpdate,
  PaginatedCompaniesResponse,
  CompanyMember,
  CompanyMemberRole,
  CompanyAdminListResponse,
  CompanyStats,
  CompanySearchResult,
  CompanyClassifyResult,
} from '../types'

const BASE = '/companies'

// NOTE: No transformKeys — Company types use snake_case matching backend/DB.
// Other modules (accountant) extend Company and depend on snake_case fields.
async function get<T>(path: string): Promise<T> {
  const { data } = await apiClient.get(`${BASE}${path}`)
  return data as T
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.post(`${BASE}${path}`, body ? toSnakeCase(body) : undefined)
  return data as T
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const { data } = await apiClient.put(`${BASE}${path}`, toSnakeCase(body))
  return data as T
}

async function del<T>(path: string): Promise<T> {
  const { data } = await apiClient.delete(`${BASE}${path}`)
  return data as T
}

// ========== User-Scoped API ==========

export const companiesApi = {
  getAll: (params?: { page?: number; pageSize?: number }) => {
    const sp = new URLSearchParams()
    if (params?.page) sp.set('page', String(params.page))
    if (params?.pageSize) sp.set('page_size', String(params.pageSize))
    const q = sp.toString()
    return get<PaginatedCompaniesResponse>(`${q ? `?${q}` : ''}`)
  },

  getById: (id: string) => get<Company>(`/${id}`),

  create: (data: CompanyCreate) => post<Company>('', data),

  update: (id: string, data: CompanyUpdate) => put<Company>(`/${id}`, data),

  delete: (id: string) => del<{ message: string }>(`/${id}`),
}

// ========== Members API ==========

export const companyMembersApi = {
  getAll: (companyId: string) => get<CompanyMember[]>(`/${companyId}/members`),

  add: (companyId: string, memberUserId: string, role: CompanyMemberRole) =>
    post<CompanyMember>(`/${companyId}/members`, { memberUserId, role }),

  remove: async (companyId: string, userId: string) => {
    await apiClient.delete(`${BASE}/${companyId}/members/${userId}`)
  },

  updateRole: (companyId: string, userId: string, role: CompanyMemberRole) =>
    put<CompanyMember>(`/${companyId}/members/${userId}/role`, { role }),
}

// ========== Admin API ==========

export interface CompanyAdminListParams {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
  isVerified?: boolean
  regimenFiscal?: string
  zoneId?: string
  cityId?: string
  sortBy?: string
  sortOrder?: string
}

export const companiesAdminApi = {
  listAll: (params?: CompanyAdminListParams) => {
    const sp = new URLSearchParams()
    if (params?.page) sp.set('page', String(params.page))
    if (params?.pageSize) sp.set('page_size', String(params.pageSize))
    if (params?.search) sp.set('search', params.search)
    if (params?.isActive !== undefined) sp.set('is_active', String(params.isActive))
    if (params?.isVerified !== undefined) sp.set('is_verified', String(params.isVerified))
    if (params?.regimenFiscal) sp.set('regimen_fiscal', params.regimenFiscal)
    if (params?.zoneId) sp.set('zone_id', params.zoneId)
    if (params?.cityId) sp.set('city_id', params.cityId)
    if (params?.sortBy) sp.set('sort_by', params.sortBy)
    if (params?.sortOrder) sp.set('sort_order', params.sortOrder)
    const q = sp.toString()
    return get<CompanyAdminListResponse>(`/admin/all${q ? `?${q}` : ''}`)
  },

  getStats: () => get<CompanyStats>('/admin/stats'),

  search: (q: string, limit: number = 10) =>
    get<CompanySearchResult[]>(`/admin/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  verify: (id: string, isVerified: boolean) =>
    put<Company>(`/admin/${id}/verify`, { is_verified: isVerified }),

  delete: (id: string) => del<{ message: string }>(`/${id}`),

  classify: (id: string) =>
    post<CompanyClassifyResult>(`/admin/${id}/classify`),
}

// ========== Supervisor API (entity-scoped) ==========

export interface CompanySupervisorListParams {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
  isVerified?: boolean
  regimenFiscal?: string
  sortBy?: string
  sortOrder?: string
}

export const companiesSupervisorApi = {
  listMyCompanies: (params?: CompanySupervisorListParams) => {
    const sp = new URLSearchParams()
    if (params?.page) sp.set('page', String(params.page))
    if (params?.pageSize) sp.set('page_size', String(params.pageSize))
    if (params?.search) sp.set('search', params.search)
    if (params?.isActive !== undefined) sp.set('is_active', String(params.isActive))
    if (params?.isVerified !== undefined) sp.set('is_verified', String(params.isVerified))
    if (params?.regimenFiscal) sp.set('regimen_fiscal', params.regimenFiscal)
    if (params?.sortBy) sp.set('sort_by', params.sortBy)
    if (params?.sortOrder) sp.set('sort_order', params.sortOrder)
    const q = sp.toString()
    return get<CompanyAdminListResponse>(`/supervisor/my-companies${q ? `?${q}` : ''}`)
  },

  getStats: () => get<CompanyStats>('/supervisor/stats'),
}

export default {
  companies: companiesApi,
  members: companyMembersApi,
  admin: companiesAdminApi,
  supervisor: companiesSupervisorApi,
}
