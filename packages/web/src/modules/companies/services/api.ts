/**
 * Companies API Service
 * Uses shared apiClient (Axios) for automatic token refresh, Accept-Language, etc.
 */

import apiClient from '@/core/api/client'
import { transformKeys, toSnakeCase } from '@/core/utils/api-transform'

import type {
  Company,
  CompanyCreate,
  CompanyUpdate,
  PaginatedCompaniesResponse,
  CompanyMember,
  CompanyMemberRole,
} from '../types'

const BASE = '/companies'

async function get<T>(path: string): Promise<T> {
  const { data } = await apiClient.get(`${BASE}${path}`)
  return transformKeys<T>(data)
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.post(`${BASE}${path}`, body ? toSnakeCase(body) : undefined)
  return transformKeys<T>(data)
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const { data } = await apiClient.put(`${BASE}${path}`, toSnakeCase(body))
  return transformKeys<T>(data)
}

async function del<T>(path: string): Promise<T> {
  const { data } = await apiClient.delete(`${BASE}${path}`)
  return transformKeys<T>(data)
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

export default {
  companies: companiesApi,
  members: companyMembersApi,
}
