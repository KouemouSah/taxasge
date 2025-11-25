/**
 * Templates API Service
 * Handles all API calls for document and procedure templates
 *
 * @module templates/services
 * @author Claude Code
 * @date 2025-11-25
 *
 * BACKEND ALIGNMENT: Phase 10
 * Base URL: /api/v1
 * Routes: /document-templates, /procedure-templates
 */

import type {
  DocumentTemplate,
  DocumentTemplateCreate,
  DocumentTemplateUpdate,
  ProcedureTemplate,
  ProcedureTemplateCreate,
  ProcedureTemplateUpdate,
  ProcedureStep,
  ProcedureStepCreate,
  ProcedureStepUpdate,
} from '@/types/fiscal-service'

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_VERSION = '/api/v1'
const DOCUMENTS_BASE = '/document-templates'
const PROCEDURES_BASE = '/procedure-templates'

// =============================================================================
// HTTP CLIENT
// =============================================================================

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
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

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`,
      }))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

const client = new ApiClient(`${API_BASE_URL}${API_VERSION}`)

// =============================================================================
// DOCUMENT TEMPLATES API
// =============================================================================

export const documentTemplatesApi = {
  /**
   * GET /api/v1/document-templates
   * Get all document templates
   */
  list: async (params?: {
    category?: string
    isActive?: boolean
    page?: number
    pageSize?: number
  }): Promise<DocumentTemplate[]> => {
    const query = new URLSearchParams()
    if (params?.category) query.append('category', params.category)
    if (params?.isActive !== undefined) query.append('is_active', String(params.isActive))
    if (params?.page) query.append('page', String(params.page))
    if (params?.pageSize) query.append('page_size', String(params.pageSize))

    const queryString = query.toString()
    return client.get<DocumentTemplate[]>(
      `${DOCUMENTS_BASE}${queryString ? `?${queryString}` : ''}`
    )
  },

  /**
   * GET /api/v1/document-templates/{template_id}
   * Get single document template
   */
  get: async (templateId: number | string): Promise<DocumentTemplate> => {
    return client.get<DocumentTemplate>(`${DOCUMENTS_BASE}/${templateId}`)
  },

  /**
   * POST /api/v1/document-templates
   * Create new document template
   * Auth: Required + Permission "templates.create"
   */
  create: async (data: DocumentTemplateCreate): Promise<DocumentTemplate> => {
    return client.post<DocumentTemplate>(DOCUMENTS_BASE, data)
  },

  /**
   * PUT /api/v1/document-templates/{template_id}
   * Update document template
   * Auth: Required + Permission "templates.update"
   */
  update: async (
    templateId: number | string,
    data: DocumentTemplateUpdate
  ): Promise<DocumentTemplate> => {
    return client.put<DocumentTemplate>(`${DOCUMENTS_BASE}/${templateId}`, data)
  },

  /**
   * DELETE /api/v1/document-templates/{template_id}
   * Delete document template
   * Auth: Required + Permission "templates.delete"
   */
  delete: async (templateId: number | string): Promise<{ message: string }> => {
    return client.delete<{ message: string }>(`${DOCUMENTS_BASE}/${templateId}`)
  },
}

// =============================================================================
// PROCEDURE TEMPLATES API
// =============================================================================

export const procedureTemplatesApi = {
  /**
   * GET /api/v1/procedure-templates
   * Get all procedure templates
   */
  list: async (params?: {
    category?: string
    isActive?: boolean
    page?: number
    pageSize?: number
  }): Promise<ProcedureTemplate[]> => {
    const query = new URLSearchParams()
    if (params?.category) query.append('category', params.category)
    if (params?.isActive !== undefined) query.append('is_active', String(params.isActive))
    if (params?.page) query.append('page', String(params.page))
    if (params?.pageSize) query.append('page_size', String(params.pageSize))

    const queryString = query.toString()
    return client.get<ProcedureTemplate[]>(
      `${PROCEDURES_BASE}${queryString ? `?${queryString}` : ''}`
    )
  },

  /**
   * GET /api/v1/procedure-templates/{template_id}
   * Get single procedure template
   */
  get: async (templateId: number | string): Promise<ProcedureTemplate> => {
    return client.get<ProcedureTemplate>(`${PROCEDURES_BASE}/${templateId}`)
  },

  /**
   * POST /api/v1/procedure-templates
   * Create new procedure template
   * Auth: Required + Permission "templates.create"
   */
  create: async (data: ProcedureTemplateCreate): Promise<ProcedureTemplate> => {
    return client.post<ProcedureTemplate>(PROCEDURES_BASE, data)
  },

  /**
   * PUT /api/v1/procedure-templates/{template_id}
   * Update procedure template
   * Auth: Required + Permission "templates.update"
   */
  update: async (
    templateId: number | string,
    data: ProcedureTemplateUpdate
  ): Promise<ProcedureTemplate> => {
    return client.put<ProcedureTemplate>(`${PROCEDURES_BASE}/${templateId}`, data)
  },

  /**
   * DELETE /api/v1/procedure-templates/{template_id}
   * Delete procedure template
   * Auth: Required + Permission "templates.delete"
   */
  delete: async (templateId: number | string): Promise<{ message: string }> => {
    return client.delete<{ message: string }>(`${PROCEDURES_BASE}/${templateId}`)
  },
}

// =============================================================================
// PROCEDURE STEPS API
// =============================================================================

export const procedureStepsApi = {
  /**
   * GET /api/v1/procedure-templates/{template_id}/steps
   * Get all steps for a procedure template
   */
  list: async (templateId: number | string): Promise<ProcedureStep[]> => {
    return client.get<ProcedureStep[]>(`${PROCEDURES_BASE}/${templateId}/steps`)
  },

  /**
   * GET /api/v1/procedure-templates/{template_id}/steps/{step_id}
   * Get single procedure step
   */
  get: async (templateId: number | string, stepId: number): Promise<ProcedureStep> => {
    return client.get<ProcedureStep>(`${PROCEDURES_BASE}/${templateId}/steps/${stepId}`)
  },

  /**
   * POST /api/v1/procedure-templates/{template_id}/steps
   * Create new procedure step
   * Auth: Required + Permission "templates.update"
   */
  create: async (
    templateId: number | string,
    data: ProcedureStepCreate
  ): Promise<ProcedureStep> => {
    return client.post<ProcedureStep>(`${PROCEDURES_BASE}/${templateId}/steps`, data)
  },

  /**
   * PUT /api/v1/procedure-templates/{template_id}/steps/{step_id}
   * Update procedure step
   * Auth: Required + Permission "templates.update"
   */
  update: async (
    templateId: number | string,
    stepId: number,
    data: ProcedureStepUpdate
  ): Promise<ProcedureStep> => {
    return client.put<ProcedureStep>(
      `${PROCEDURES_BASE}/${templateId}/steps/${stepId}`,
      data
    )
  },

  /**
   * DELETE /api/v1/procedure-templates/{template_id}/steps/{step_id}
   * Delete procedure step
   * Auth: Required + Permission "templates.update"
   */
  delete: async (
    templateId: number | string,
    stepId: number
  ): Promise<{ message: string }> => {
    return client.delete<{ message: string }>(
      `${PROCEDURES_BASE}/${templateId}/steps/${stepId}`
    )
  },

  /**
   * POST /api/v1/procedure-templates/{template_id}/steps/reorder
   * Reorder procedure steps
   * Auth: Required + Permission "templates.update"
   */
  reorder: async (
    templateId: number | string,
    stepIds: number[]
  ): Promise<{ message: string }> => {
    return client.post<{ message: string }>(
      `${PROCEDURES_BASE}/${templateId}/steps/reorder`,
      { step_ids: stepIds }
    )
  },
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  documents: documentTemplatesApi,
  procedures: procedureTemplatesApi,
  steps: procedureStepsApi,
}
