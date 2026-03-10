/**
 * Service Bundles API Client
 * Handles all API calls to /api/v1/service-bundles
 */

import { appConfig } from '@/core/config/app'

import type {
  CommerceZone,
  ServiceBundle,
  BundleItem,
  BundleWithItems,
  PricingMatrix,
  BundleDocument,
  InstallmentPreview,
  BundleListResponse,
  BundleCreateInput,
  BundleUpdateInput,
  BundleItemCreateInput,
  CopyZonePricesInput,
} from '@/types/service-bundle'

const API_BASE_URL = appConfig.api.baseUrl
const API_VERSION = `/api/${appConfig.api.version}`
const BUNDLES_BASE = '/service-bundles'

// ========== Utility Functions ==========

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

function transformKeys<T>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T
  if (Array.isArray(obj)) return obj.map(item => transformKeys(item)) as T
  if (typeof obj !== 'object') return obj as T
  const transformed: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    transformed[snakeToCamel(key)] = transformKeys(value)
  }
  return transformed as T
}

function toSnakeCase<T>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T
  if (Array.isArray(obj)) return obj.map(item => toSnakeCase(item)) as T
  if (typeof obj !== 'object') return obj as T
  const transformed: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    transformed[camelToSnake(key)] = toSnakeCase(value)
  }
  return transformed as T
}

function getAuthData() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('auth_data')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const auth = getAuthData()
  if (auth?.access_token) {
    headers['Authorization'] = `Bearer ${auth.access_token}`
  }
  return headers
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${API_VERSION}${BUNDLES_BASE}${path}`
  const response = await fetch(url, {
    headers: getHeaders(),
    ...options,
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || `API Error ${response.status}`)
  }
  if (response.status === 204) return undefined as T
  const data = await response.json()
  return transformKeys<T>(data)
}

// ========== Public API ==========

export const bundleApi = {
  // Zones
  listZones: () => fetchApi<CommerceZone[]>('/zones'),

  // Bundles
  listBundles: (params?: {
    page?: number
    pageSize?: number
    search?: string
    commerceType?: string
    isActive?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.pageSize) searchParams.set('page_size', String(params.pageSize))
    if (params?.search) searchParams.set('search', params.search)
    if (params?.commerceType) searchParams.set('commerce_type', params.commerceType)
    if (params?.isActive !== undefined) searchParams.set('is_active', String(params.isActive))
    const query = searchParams.toString()
    return fetchApi<BundleListResponse>(`/${query ? `?${query}` : ''}`)
  },

  getBundle: (id: string) => fetchApi<ServiceBundle>(`/${id}`),

  getBundlePricing: (id: string, zoneId: string) =>
    fetchApi<BundleWithItems>(`/${id}/pricing?zone_id=${zoneId}`),

  getPricingMatrix: (id: string) => fetchApi<PricingMatrix>(`/${id}/matrix`),

  getBundleDocuments: (id: string) => fetchApi<BundleDocument[]>(`/${id}/documents`),

  previewInstallments: (id: string, zoneId: string, installments: number) =>
    fetchApi<InstallmentPreview>(
      `/${id}/installment-preview?zone_id=${zoneId}&installments=${installments}`
    ),
}

// ========== Admin API ==========

export const bundleAdminApi = {
  createBundle: (data: BundleCreateInput) =>
    fetchApi<ServiceBundle>('/admin/bundles', {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    }),

  updateBundle: (id: string, data: BundleUpdateInput) =>
    fetchApi<ServiceBundle>(`/admin/bundles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    }),

  deleteBundle: (id: string) =>
    fetchApi<void>(`/admin/bundles/${id}`, { method: 'DELETE' }),

  upsertItem: (bundleId: string, data: BundleItemCreateInput) =>
    fetchApi<BundleItem>(`/admin/bundles/${bundleId}/items`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    }),

  deleteItem: (itemId: string) =>
    fetchApi<void>(`/admin/items/${itemId}`, { method: 'DELETE' }),

  copyZonePrices: (bundleId: string, data: CopyZonePricesInput) =>
    fetchApi<{ copiedItems: number }>(`/admin/bundles/${bundleId}/copy-zone-prices`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    }),

  exportCsv: async (bundleId: string): Promise<Blob> => {
    const url = `${API_BASE_URL}${API_VERSION}${BUNDLES_BASE}/admin/export/csv?bundle_id=${bundleId}`
    const response = await fetch(url, { headers: getHeaders() })
    if (!response.ok) throw new Error(`Export failed: ${response.status}`)
    return response.blob()
  },
}
