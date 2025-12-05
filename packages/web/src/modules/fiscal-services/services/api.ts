/**
 * Fiscal Services API Service
 * Handles all API calls to fiscal services backend endpoints
 *
 * @module fiscal-services/services
 * @author Claude Code
 * @date 2025-11-25
 *
 * BACKEND ALIGNMENT: Phase 7
 * Base URL: /api/v1/fiscal-services
 * Routes: From app/modules/fiscal_services/api/fiscal_service_routes.py
 *
 * PUBLIC ENDPOINTS (12):
 * - GET    /ministries
 * - GET    /sectors?ministry_id={id}
 * - GET    /categories?sector_id={id}
 * - GET    /?page={n}&page_size={n}&category_id={id}&is_active={bool}
 * - GET    /{service_id}
 * - POST   /search
 * - GET    /popular/list?limit={n}
 * - GET    /recent/list?limit={n}
 * - POST   /calculate
 *
 * ADMIN ENDPOINTS (5):
 * - POST   /admin/services
 * - PUT    /admin/services/{service_id}
 * - DELETE /admin/services/{service_id}
 * - GET    /admin/stats
 * - POST   /admin/bulk/import
 * - POST   /admin/bulk/update-status
 */

import type {
  Ministry,
  Sector,
  Category,
  FiscalServiceResponse,
  FiscalServiceCreate,
  FiscalServiceUpdate,
  FiscalServiceListResponse,
  FiscalServiceFilter,
  FiscalServiceStats,
  CalculationInput,
  CalculationResult,
  ServiceStatusEnum,
  DocumentTemplate,
  ServiceDocumentAssignment,
  ProcedureTemplate,
  ProcedureStep,
  ServiceProcedureAssignment,
  ServiceKeyword,
  EntityTranslation,
} from '@/types/fiscal-service'
import { getAuthData, setAuthData, clearAuthData } from '@/core/auth/storage'
import { appConfig } from '@/core/config/app'

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_VERSION = '/api/v1'
const FISCAL_SERVICES_BASE = '/fiscal-services'

// =============================================================================
// HTTP CLIENT
// =============================================================================

class ApiClient {
  private baseUrl: string
  private isRefreshing: boolean = false
  private refreshPromise: Promise<string | null> | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshToken(): Promise<string | null> {
    const authData = getAuthData()
    if (!authData?.refresh_token) {
      return null
    }

    try {
      const response = await fetch(`${appConfig.api.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: authData.refresh_token }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      const { access_token, refresh_token } = data

      // Update stored tokens
      setAuthData({
        ...authData,
        access_token,
        refresh_token,
      })

      return access_token
    } catch {
      // Clear auth data and redirect to login
      clearAuthData()
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
      return null
    }
  }

  /**
   * Get a fresh token, refreshing if necessary
   */
  private async getFreshToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = this.refreshToken()

    try {
      const token = await this.refreshPromise
      return token
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const authData = typeof window !== 'undefined'
      ? getAuthData()
      : null

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authData?.access_token) {
      headers['Authorization'] = `Bearer ${authData.access_token}`
    }

    if (options.headers) {
      const headersToMerge = options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : Array.isArray(options.headers)
        ? Object.fromEntries(options.headers)
        : options.headers
      Object.assign(headers, headersToMerge)
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Handle 401 Unauthorized - attempt token refresh
    if (response.status === 401 && !isRetry) {
      const newToken = await this.getFreshToken()
      if (newToken) {
        // Retry the request with the new token
        return this.request<T>(endpoint, options, true)
      }
      throw new Error('Invalid or expired access token')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }))
      throw new Error(error.detail || 'API request failed')
    }

    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

const client = new ApiClient(API_BASE_URL + API_VERSION)

// =============================================================================
// HIERARCHY API
// =============================================================================

export const hierarchyApi = {
  /**
   * GET /api/v1/fiscal-services/ministries
   * List all ministries
   */
  ministries: {
    list: async (): Promise<Ministry[]> => {
      return client.get<Ministry[]>(`${FISCAL_SERVICES_BASE}/ministries`)
    },
    get: async (ministryId: number): Promise<Ministry> => {
      return client.get<Ministry>(`${FISCAL_SERVICES_BASE}/admin/ministries/${ministryId}`)
    },
    create: async (data: Omit<Ministry, 'id' | 'created_at' | 'updated_at'>): Promise<Ministry> => {
      return client.post<Ministry>(`${FISCAL_SERVICES_BASE}/admin/ministries`, data)
    },
    update: async (ministryId: number, data: Partial<Ministry>): Promise<Ministry> => {
      return client.put<Ministry>(`${FISCAL_SERVICES_BASE}/admin/ministries/${ministryId}`, data)
    },
    delete: async (ministryId: number): Promise<void> => {
      return client.delete<void>(`${FISCAL_SERVICES_BASE}/admin/ministries/${ministryId}`)
    },
  },

  /**
   * GET /api/v1/fiscal-services/sectors?ministry_id={id}
   * List sectors, optionally filtered by ministry
   */
  sectors: {
    list: async (ministryId?: number): Promise<Sector[]> => {
      const query = ministryId ? `?ministry_id=${ministryId}` : ''
      return client.get<Sector[]>(`${FISCAL_SERVICES_BASE}/sectors${query}`)
    },
    get: async (sectorId: number): Promise<Sector> => {
      return client.get<Sector>(`${FISCAL_SERVICES_BASE}/admin/sectors/${sectorId}`)
    },
    create: async (data: Omit<Sector, 'id' | 'created_at' | 'updated_at'>): Promise<Sector> => {
      return client.post<Sector>(`${FISCAL_SERVICES_BASE}/admin/sectors`, data)
    },
    update: async (sectorId: number, data: Partial<Sector>): Promise<Sector> => {
      return client.put<Sector>(`${FISCAL_SERVICES_BASE}/admin/sectors/${sectorId}`, data)
    },
    delete: async (sectorId: number): Promise<void> => {
      return client.delete<void>(`${FISCAL_SERVICES_BASE}/admin/sectors/${sectorId}`)
    },
  },

  /**
   * GET /api/v1/fiscal-services/categories?sector_id={id}
   * List categories, optionally filtered by sector
   */
  categories: {
    list: async (sectorId?: number): Promise<Category[]> => {
      const query = sectorId ? `?sector_id=${sectorId}` : ''
      return client.get<Category[]>(`${FISCAL_SERVICES_BASE}/categories${query}`)
    },
    get: async (categoryId: number): Promise<Category> => {
      return client.get<Category>(`${FISCAL_SERVICES_BASE}/admin/categories/${categoryId}`)
    },
    create: async (data: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> => {
      return client.post<Category>(`${FISCAL_SERVICES_BASE}/admin/categories`, data)
    },
    update: async (categoryId: number, data: Partial<Category>): Promise<Category> => {
      return client.put<Category>(`${FISCAL_SERVICES_BASE}/admin/categories/${categoryId}`, data)
    },
    delete: async (categoryId: number): Promise<void> => {
      return client.delete<void>(`${FISCAL_SERVICES_BASE}/admin/categories/${categoryId}`)
    },
  },
}

// =============================================================================
// FISCAL SERVICES API (PUBLIC)
// =============================================================================

export const fiscalServicesApi = {
  /**
   * GET /api/v1/fiscal-services
   * List fiscal services with pagination
   */
  list: async (params?: {
    page?: number
    pageSize?: number
    categoryId?: number
    isActive?: boolean
  }): Promise<FiscalServiceListResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.pageSize) queryParams.append('page_size', String(params.pageSize))
    if (params?.categoryId) queryParams.append('category_id', String(params.categoryId))
    if (params?.isActive !== undefined) queryParams.append('is_active', String(params.isActive))

    const query = queryParams.toString()
    return client.get<FiscalServiceListResponse>(
      `${FISCAL_SERVICES_BASE}${query ? `?${query}` : ''}`
    )
  },

  /**
   * GET /api/v1/fiscal-services/{service_id}
   * Get single fiscal service by ID
   */
  get: async (serviceId: number | string): Promise<FiscalServiceResponse> => {
    return client.get<FiscalServiceResponse>(`${FISCAL_SERVICES_BASE}/${serviceId}`)
  },

  /**
   * POST /api/v1/fiscal-services/search
   * Advanced search for fiscal services
   */
  search: async (
    filters: FiscalServiceFilter,
    page: number = 1,
    pageSize: number = 50
  ): Promise<FiscalServiceListResponse> => {
    const query = `?page=${page}&page_size=${pageSize}`
    return client.post<FiscalServiceListResponse>(
      `${FISCAL_SERVICES_BASE}/search${query}`,
      filters
    )
  },

  /**
   * GET /api/v1/fiscal-services/popular/list?limit={n}
   * Get most used fiscal services
   */
  popular: async (limit: number = 10): Promise<FiscalServiceResponse[]> => {
    return client.get<FiscalServiceResponse[]>(
      `${FISCAL_SERVICES_BASE}/popular/list?limit=${limit}`
    )
  },

  /**
   * GET /api/v1/fiscal-services/recent/list?limit={n}
   * Get recently used fiscal services
   */
  recent: async (limit: number = 10): Promise<FiscalServiceResponse[]> => {
    return client.get<FiscalServiceResponse[]>(
      `${FISCAL_SERVICES_BASE}/recent/list?limit=${limit}`
    )
  },

  /**
   * POST /api/v1/fiscal-services/calculate
   * Calculate amount for a fiscal service
   * Auth: Required (JWT Bearer token)
   */
  calculate: async (input: CalculationInput): Promise<CalculationResult> => {
    return client.post<CalculationResult>(`${FISCAL_SERVICES_BASE}/calculate`, input)
  },
}

// =============================================================================
// FISCAL SERVICES ADMIN API
// =============================================================================

export const fiscalServicesAdminApi = {
  /**
   * POST /api/v1/fiscal-services/admin/services
   * Create new fiscal service
   * Auth: Required + Permission "fiscal_services.create"
   */
  create: async (data: FiscalServiceCreate): Promise<FiscalServiceResponse> => {
    return client.post<FiscalServiceResponse>(`${FISCAL_SERVICES_BASE}/admin/services`, data)
  },

  /**
   * PUT /api/v1/fiscal-services/admin/services/{service_id}
   * Update fiscal service
   * Auth: Required + Permission "fiscal_services.update"
   */
  update: async (serviceId: number | string, data: FiscalServiceUpdate): Promise<FiscalServiceResponse> => {
    return client.put<FiscalServiceResponse>(
      `${FISCAL_SERVICES_BASE}/admin/services/${serviceId}`,
      data
    )
  },

  /**
   * DELETE /api/v1/fiscal-services/admin/services/{service_id}
   * Delete fiscal service
   * Auth: Required + Permission "fiscal_services.delete"
   */
  delete: async (serviceId: number | string): Promise<{ message: string }> => {
    return client.delete<{ message: string }>(
      `${FISCAL_SERVICES_BASE}/admin/services/${serviceId}`
    )
  },

  /**
   * GET /api/v1/fiscal-services/admin/stats
   * Get comprehensive statistics
   * Auth: Required + Permission "fiscal_services.view_stats"
   */
  stats: async (): Promise<FiscalServiceStats> => {
    return client.get<FiscalServiceStats>(`${FISCAL_SERVICES_BASE}/admin/stats`)
  },

  /**
   * POST /api/v1/fiscal-services/admin/bulk/import
   * Bulk import fiscal services (max 100 per request)
   * Auth: Required + Permission "fiscal_services.bulk_import"
   */
  bulkImport: async (services: FiscalServiceCreate[]): Promise<{
    success: boolean
    totalProcessed: number
    successfulImports: number
    failedImports: number
    failedServices: Array<{ code: string; error: string }>
  }> => {
    return client.post(`${FISCAL_SERVICES_BASE}/admin/bulk/import`, services)
  },

  /**
   * POST /api/v1/fiscal-services/admin/bulk/update-status
   * Bulk update service status (max 50 per request)
   * Auth: Required + Permission "fiscal_services.bulk_update"
   */
  bulkUpdateStatus: async (serviceIds: string[], newStatus: ServiceStatusEnum): Promise<{
    success: boolean
    totalRequested: number
    updatedCount: number
    failedUpdates: number
    newStatus: string
  }> => {
    return client.post(`${FISCAL_SERVICES_BASE}/admin/bulk/update-status`, {
      service_ids: serviceIds,
      new_status: newStatus,
    })
  },
}

// =============================================================================
// DOCUMENTS API
// =============================================================================

export const documentsApi = {
  /**
   * GET /api/v1/fiscal-services/{service_id}/documents
   * Get all document assignments for a service
   */
  list: async (serviceId: number | string): Promise<ServiceDocumentAssignment[]> => {
    return client.get<ServiceDocumentAssignment[]>(
      `${FISCAL_SERVICES_BASE}/${serviceId}/documents`
    )
  },

  /**
   * POST /api/v1/fiscal-services/{service_id}/documents
   * Assign a document to a service
   */
  assign: async (
    serviceId: number | string,
    data: {
      documentTemplateId: number
      isRequiredExpedition: boolean
      isRequiredRenewal: boolean
      displayOrder?: number
      customNotes?: string
    }
  ): Promise<ServiceDocumentAssignment> => {
    return client.post<ServiceDocumentAssignment>(
      `${FISCAL_SERVICES_BASE}/${serviceId}/documents`,
      data
    )
  },

  /**
   * DELETE /api/v1/fiscal-services/{service_id}/documents/{assignment_id}
   * Remove a document assignment
   */
  unassign: async (
    serviceId: number | string,
    assignmentId: number
  ): Promise<{ message: string }> => {
    return client.delete<{ message: string }>(
      `${FISCAL_SERVICES_BASE}/${serviceId}/documents/${assignmentId}`
    )
  },

  /**
   * GET /api/v1/document-templates
   * Get all available document templates
   */
  templates: {
    list: async (): Promise<DocumentTemplate[]> => {
      return client.get<DocumentTemplate[]>('/document-templates')
    },
  },
}

// =============================================================================
// PROCEDURES API
// =============================================================================

export const proceduresApi = {
  /**
   * GET /api/v1/fiscal-services/{service_id}/procedures
   * Get all procedure assignments for a service
   */
  list: async (serviceId: number | string): Promise<ServiceProcedureAssignment[]> => {
    return client.get<ServiceProcedureAssignment[]>(
      `${FISCAL_SERVICES_BASE}/${serviceId}/procedures`
    )
  },

  /**
   * POST /api/v1/fiscal-services/{service_id}/procedures
   * Assign a procedure to a service
   */
  assign: async (
    serviceId: number | string,
    data: {
      templateId: number
      appliesTo?: string
      displayOrder?: number
      customNotes?: string
      overrideSteps?: Record<string, any>
    }
  ): Promise<ServiceProcedureAssignment> => {
    return client.post<ServiceProcedureAssignment>(
      `${FISCAL_SERVICES_BASE}/${serviceId}/procedures`,
      data
    )
  },

  /**
   * DELETE /api/v1/fiscal-services/{service_id}/procedures/{assignment_id}
   * Remove a procedure assignment
   */
  unassign: async (
    serviceId: number | string,
    assignmentId: number
  ): Promise<{ message: string }> => {
    return client.delete<{ message: string }>(
      `${FISCAL_SERVICES_BASE}/${serviceId}/procedures/${assignmentId}`
    )
  },

  /**
   * GET /api/v1/procedure-templates
   * Get all available procedure templates
   */
  templates: {
    list: async (): Promise<ProcedureTemplate[]> => {
      return client.get<ProcedureTemplate[]>('/procedure-templates')
    },

    /**
     * GET /api/v1/procedure-templates/{template_id}/steps
     * Get steps for a procedure template
     */
    steps: async (templateId: number): Promise<ProcedureStep[]> => {
      return client.get<ProcedureStep[]>(`/procedure-templates/${templateId}/steps`)
    },
  },
}

// =============================================================================
// KEYWORDS API
// =============================================================================

export const keywordsApi = {
  /**
   * GET /api/v1/fiscal-services/{service_id}/keywords
   * Get all keywords for a service
   */
  list: async (serviceId: number | string): Promise<ServiceKeyword[]> => {
    return client.get<ServiceKeyword[]>(`${FISCAL_SERVICES_BASE}/${serviceId}/keywords`)
  },

  /**
   * POST /api/v1/fiscal-services/{service_id}/keywords
   * Add a keyword to a service
   */
  create: async (
    serviceId: number | string,
    data: {
      keyword: string
      languageCode: string
      weight: number
    }
  ): Promise<ServiceKeyword> => {
    return client.post<ServiceKeyword>(
      `${FISCAL_SERVICES_BASE}/${serviceId}/keywords`,
      data
    )
  },

  /**
   * DELETE /api/v1/fiscal-services/{service_id}/keywords/{keyword_id}
   * Remove a keyword
   */
  delete: async (
    serviceId: number | string,
    keywordId: number
  ): Promise<{ message: string }> => {
    return client.delete<{ message: string }>(
      `${FISCAL_SERVICES_BASE}/${serviceId}/keywords/${keywordId}`
    )
  },
}

// =============================================================================
// TRANSLATIONS API
// =============================================================================

export const translationsApi = {
  /**
   * GET /api/v1/fiscal-services/{service_id}/translations
   * Get all translations for a service
   */
  list: async (serviceId: number | string): Promise<EntityTranslation[]> => {
    return client.get<EntityTranslation[]>(
      `${FISCAL_SERVICES_BASE}/${serviceId}/translations`
    )
  },

  /**
   * POST /api/v1/fiscal-services/{service_id}/translations
   * Add or update a translation
   */
  upsert: async (
    serviceId: number | string,
    data: {
      languageCode: string
      fieldName: string
      translationText: string
      translationSource?: string
    }
  ): Promise<EntityTranslation> => {
    return client.post<EntityTranslation>(
      `${FISCAL_SERVICES_BASE}/${serviceId}/translations`,
      data
    )
  },

  /**
   * DELETE /api/v1/fiscal-services/{service_id}/translations/{language_code}/{field_name}
   * Remove a translation
   */
  delete: async (
    serviceId: number | string,
    languageCode: string,
    fieldName: string
  ): Promise<{ message: string }> => {
    return client.delete<{ message: string }>(
      `${FISCAL_SERVICES_BASE}/${serviceId}/translations/${languageCode}/${fieldName}`
    )
  },
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  hierarchy: hierarchyApi,
  services: fiscalServicesApi,
  admin: fiscalServicesAdminApi,
  documents: documentsApi,
  procedures: proceduresApi,
  keywords: keywordsApi,
  translations: translationsApi,
}
