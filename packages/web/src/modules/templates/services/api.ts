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

import { fetchClient } from '@/core/api'
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

const DOCUMENTS_BASE = '/document-templates'
const PROCEDURES_BASE = '/procedure-templates'

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
    return fetchClient.get<DocumentTemplate[]>(DOCUMENTS_BASE, {
      category: params?.category,
      is_active: params?.isActive,
      page: params?.page,
      page_size: params?.pageSize,
    })
  },

  /**
   * GET /api/v1/document-templates/{template_id}
   * Get single document template
   */
  get: async (templateId: number | string): Promise<DocumentTemplate> => {
    return fetchClient.get<DocumentTemplate>(`${DOCUMENTS_BASE}/${templateId}`)
  },

  /**
   * POST /api/v1/document-templates
   * Create new document template
   * Auth: Required + Permission "templates.create"
   */
  create: async (data: DocumentTemplateCreate): Promise<DocumentTemplate> => {
    return fetchClient.post<DocumentTemplate>(DOCUMENTS_BASE, data)
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
    return fetchClient.put<DocumentTemplate>(`${DOCUMENTS_BASE}/${templateId}`, data)
  },

  /**
   * DELETE /api/v1/document-templates/{template_id}
   * Delete document template
   * Auth: Required + Permission "templates.delete"
   */
  delete: async (templateId: number | string): Promise<{ message: string }> => {
    return fetchClient.delete<{ message: string }>(`${DOCUMENTS_BASE}/${templateId}`)
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
    return fetchClient.get<ProcedureTemplate[]>(PROCEDURES_BASE, {
      category: params?.category,
      is_active: params?.isActive,
      page: params?.page,
      page_size: params?.pageSize,
    })
  },

  /**
   * GET /api/v1/procedure-templates/{template_id}
   * Get single procedure template
   */
  get: async (templateId: number | string): Promise<ProcedureTemplate> => {
    return fetchClient.get<ProcedureTemplate>(`${PROCEDURES_BASE}/${templateId}`)
  },

  /**
   * POST /api/v1/procedure-templates
   * Create new procedure template
   * Auth: Required + Permission "templates.create"
   */
  create: async (data: ProcedureTemplateCreate): Promise<ProcedureTemplate> => {
    return fetchClient.post<ProcedureTemplate>(PROCEDURES_BASE, data)
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
    return fetchClient.put<ProcedureTemplate>(`${PROCEDURES_BASE}/${templateId}`, data)
  },

  /**
   * DELETE /api/v1/procedure-templates/{template_id}
   * Delete procedure template
   * Auth: Required + Permission "templates.delete"
   */
  delete: async (templateId: number | string): Promise<{ message: string }> => {
    return fetchClient.delete<{ message: string }>(`${PROCEDURES_BASE}/${templateId}`)
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
    return fetchClient.get<ProcedureStep[]>(`${PROCEDURES_BASE}/${templateId}/steps`)
  },

  /**
   * GET /api/v1/procedure-templates/{template_id}/steps/{step_id}
   * Get single procedure step
   */
  get: async (templateId: number | string, stepId: number): Promise<ProcedureStep> => {
    return fetchClient.get<ProcedureStep>(`${PROCEDURES_BASE}/${templateId}/steps/${stepId}`)
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
    return fetchClient.post<ProcedureStep>(`${PROCEDURES_BASE}/${templateId}/steps`, data)
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
    return fetchClient.put<ProcedureStep>(
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
    return fetchClient.delete<{ message: string }>(
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
    return fetchClient.post<{ message: string }>(
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
