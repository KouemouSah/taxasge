/**
 * Translations Admin API Service
 * Handles all API calls for translations management
 *
 * @module translations/services
 *
 * BACKEND ALIGNMENT:
 * - Entity translations: /api/v1/translations/entities
 * - System translations: /api/v1/translations
 * - Frontend translations: /api/v1/translations/frontend
 */

import { fetchClient } from '@/core/api'
import type {
  // Entity translations
  EntityTranslation,
  EntityTranslationCreate,
  EntityTranslationUpdate,
  EntityTranslationBulkCreate,
  EntityTranslationSearchParams,
  EntityTranslationGrouped,
  EntityTranslationStats,
  EntityTranslationListResponse,
  TranslatableEntityType,
  LanguageCode,
  // System translations
  SystemTranslation,
  SystemTranslationCreate,
  SystemTranslationUpdate,
  SystemTranslationSearchParams,
  SystemTranslationListResponse,
  SystemCategoriesResponse,
  // Frontend translations
  FrontendTranslationStats,
  FrontendTranslationSearchParams,
  FrontendTranslationImportResult,
} from '../types'

// =============================================================================
// ENTITY TRANSLATIONS API - /api/v1/translations/entities
// =============================================================================

const ENTITY_BASE = '/translations/entities'

export const entityTranslationsApi = {
  /**
   * Get entity types with labels
   * BACKEND: GET /api/v1/translations/entities/types
   */
  getTypes: async (): Promise<{
    entity_types: Array<{
      value: string
      label: string
      label_fr: string
      label_en: string
    }>
  }> => {
    return fetchClient.get(`${ENTITY_BASE}/types`)
  },

  /**
   * Get entity translation statistics
   * BACKEND: GET /api/v1/translations/entities/stats
   */
  getStats: async (): Promise<EntityTranslationStats> => {
    return fetchClient.get(`${ENTITY_BASE}/stats`)
  },

  /**
   * List entities for a given type
   * BACKEND: GET /api/v1/translations/entities/list/{entity_type}
   */
  listEntities: async (
    entityType: TranslatableEntityType
  ): Promise<{
    entity_type: string
    entities: string[]
    count: number
  }> => {
    return fetchClient.get(`${ENTITY_BASE}/list/${entityType}`)
  },

  /**
   * Export all translations for an entity type
   * BACKEND: GET /api/v1/translations/entities/export/{entity_type}
   */
  exportByType: async (
    entityType: TranslatableEntityType
  ): Promise<{
    entity_type: string
    count: number
    data: EntityTranslationGrouped[]
  }> => {
    return fetchClient.get(`${ENTITY_BASE}/export/${entityType}`)
  },

  /**
   * Search entity translations with filters
   * BACKEND: GET /api/v1/translations/entities
   */
  search: async (
    params: EntityTranslationSearchParams
  ): Promise<EntityTranslationListResponse> => {
    return fetchClient.get(`${ENTITY_BASE}/`, {
      entity_type: params.entity_type,
      entity_code: params.entity_code,
      language_code: params.language_code,
      field_name: params.field_name,
      search_term: params.search_term,
      limit: params.limit || 100,
      offset: params.offset || 0,
    })
  },

  /**
   * Get all translations for a specific entity
   * BACKEND: GET /api/v1/translations/entities/{entity_type}/{entity_code}
   */
  getEntityTranslations: async (
    entityType: TranslatableEntityType,
    entityCode: string
  ): Promise<EntityTranslationGrouped> => {
    return fetchClient.get(`${ENTITY_BASE}/${entityType}/${entityCode}`)
  },

  /**
   * Get single entity translation
   * BACKEND: GET /api/v1/translations/entities/{entity_type}/{entity_code}/{language_code}/{field_name}
   */
  getOne: async (
    entityType: TranslatableEntityType,
    entityCode: string,
    languageCode: LanguageCode,
    fieldName: string
  ): Promise<EntityTranslation> => {
    return fetchClient.get(
      `${ENTITY_BASE}/${entityType}/${entityCode}/${languageCode}/${fieldName}`
    )
  },

  /**
   * Create entity translation
   * BACKEND: POST /api/v1/translations/entities
   */
  create: async (data: EntityTranslationCreate): Promise<EntityTranslation> => {
    return fetchClient.post(`${ENTITY_BASE}/`, data)
  },

  /**
   * Upsert entity translation (create or update)
   * BACKEND: POST /api/v1/translations/entities/upsert
   */
  upsert: async (data: EntityTranslationCreate): Promise<EntityTranslation> => {
    return fetchClient.post(`${ENTITY_BASE}/upsert`, data)
  },

  /**
   * Bulk upsert translations (all 3 languages)
   * BACKEND: POST /api/v1/translations/entities/bulk
   */
  bulkUpsert: async (
    data: EntityTranslationBulkCreate
  ): Promise<{
    created: number
    translations: EntityTranslation[]
  }> => {
    return fetchClient.post(`${ENTITY_BASE}/bulk`, data)
  },

  /**
   * Import translations from export format
   * BACKEND: POST /api/v1/translations/entities/import
   */
  importTranslations: async (
    data: EntityTranslationGrouped[]
  ): Promise<{
    created: number
    updated: number
    errors: string[]
    total_processed: number
  }> => {
    return fetchClient.post(`${ENTITY_BASE}/import`, data)
  },

  /**
   * Update entity translation
   * BACKEND: PUT /api/v1/translations/entities/{entity_type}/{entity_code}/{language_code}/{field_name}
   */
  update: async (
    entityType: TranslatableEntityType,
    entityCode: string,
    languageCode: LanguageCode,
    fieldName: string,
    data: EntityTranslationUpdate
  ): Promise<EntityTranslation> => {
    return fetchClient.put(
      `${ENTITY_BASE}/${entityType}/${entityCode}/${languageCode}/${fieldName}`,
      data
    )
  },

  /**
   * Delete single entity translation
   * BACKEND: DELETE /api/v1/translations/entities/{entity_type}/{entity_code}/{language_code}/{field_name}
   */
  delete: async (
    entityType: TranslatableEntityType,
    entityCode: string,
    languageCode: LanguageCode,
    fieldName: string
  ): Promise<{ message: string }> => {
    return fetchClient.delete(
      `${ENTITY_BASE}/${entityType}/${entityCode}/${languageCode}/${fieldName}`
    )
  },

  /**
   * Delete all translations for an entity
   * BACKEND: DELETE /api/v1/translations/entities/{entity_type}/{entity_code}
   */
  deleteEntity: async (
    entityType: TranslatableEntityType,
    entityCode: string
  ): Promise<{ message: string; count: number }> => {
    return fetchClient.delete(`${ENTITY_BASE}/${entityType}/${entityCode}`)
  },

  /**
   * List source entities with Spanish content for translation
   * BACKEND: GET /api/v1/translations/entities/source/{entity_type}
   */
  listSourceEntities: async (
    entityType: TranslatableEntityType,
    search?: string,
    limit: number = 50,
    offset: number = 0,
    untranslatedOnly: boolean = false
  ): Promise<{
    entity_type: string
    entities: Array<{
      entity_code: string
      name_es: string
      description_es: string
    }>
    total: number
    limit: number
    offset: number
    untranslated_only: boolean
  }> => {
    return fetchClient.get(`${ENTITY_BASE}/source/${entityType}`, {
      search,
      limit,
      offset,
      untranslated_only: untranslatedOnly,
    })
  },

  /**
   * Get Spanish source content for translation workbench
   * BACKEND: GET /api/v1/translations/entities/source/{entity_type}/{entity_code}
   */
  getSourceContent: async (
    entityType: TranslatableEntityType,
    entityCode: string
  ): Promise<{
    entity_type: string
    entity_code: string
    source_language: string
    fields: Record<string, string>
  }> => {
    return fetchClient.get(`${ENTITY_BASE}/source/${entityType}/${entityCode}`)
  },
}

// =============================================================================
// SYSTEM TRANSLATIONS API - /api/v1/translations
// =============================================================================

const SYSTEM_BASE = '/translations/system'

export const systemTranslationsApi = {
  /**
   * Get list of categories with localized labels
   * BACKEND: GET /api/v1/translations/system/categories
   *
   * @param language - Language code for labels (es, fr, en)
   */
  getCategories: async (language: LanguageCode = 'es'): Promise<SystemCategoriesResponse> => {
    return fetchClient.get(`${SYSTEM_BASE}/categories`, { language })
  },

  /**
   * Search system translations
   * BACKEND: GET /api/v1/translations
   */
  search: async (
    params: SystemTranslationSearchParams
  ): Promise<SystemTranslationListResponse> => {
    return fetchClient.get(`${SYSTEM_BASE}/`, {
      category: params.category,
      key_code: params.key_code,
      context: params.context,
      search_term: params.search_term,
      limit: params.limit || 100,
      offset: params.offset || 0,
    })
  },

  /**
   * Get translation by ID
   * BACKEND: GET /api/v1/translations/{id}
   */
  getById: async (id: number): Promise<SystemTranslation> => {
    return fetchClient.get(`${SYSTEM_BASE}/${id}`)
  },

  /**
   * Get translation by key
   * BACKEND: GET /api/v1/translations/by-key
   */
  getByKey: async (
    category: string,
    keyCode: string,
    context?: string
  ): Promise<SystemTranslation> => {
    return fetchClient.get(`${SYSTEM_BASE}/by-key`, {
      category,
      key_code: keyCode,
      context,
    })
  },

  /**
   * Create system translation
   * BACKEND: POST /api/v1/translations
   */
  create: async (data: SystemTranslationCreate): Promise<SystemTranslation> => {
    return fetchClient.post(`${SYSTEM_BASE}/`, data)
  },

  /**
   * Update system translation
   * BACKEND: PUT /api/v1/translations/{id}
   */
  update: async (
    id: number,
    data: SystemTranslationUpdate
  ): Promise<SystemTranslation> => {
    return fetchClient.put(`${SYSTEM_BASE}/${id}`, data)
  },

  /**
   * Delete system translation
   * BACKEND: DELETE /api/v1/translations/{id}
   */
  delete: async (id: number): Promise<{ message: string }> => {
    return fetchClient.delete(`${SYSTEM_BASE}/${id}`)
  },
}

// =============================================================================
// FRONTEND TRANSLATIONS API - /api/v1/translations/frontend
// =============================================================================

const FRONTEND_BASE = '/translations/frontend'

export const frontendTranslationsApi = {
  /**
   * Get list of frontend namespaces
   * BACKEND: GET /api/v1/translations/frontend/namespaces
   */
  getNamespaces: async (): Promise<{
    namespaces: string[]
    count: number
  }> => {
    return fetchClient.get(`${FRONTEND_BASE}/namespaces`)
  },

  /**
   * Get frontend translation statistics
   * BACKEND: GET /api/v1/translations/frontend/stats
   */
  getStats: async (): Promise<FrontendTranslationStats> => {
    return fetchClient.get(`${FRONTEND_BASE}/stats`)
  },

  /**
   * Export namespace as JSON
   * BACKEND: GET /api/v1/translations/frontend/export/{namespace}
   */
  exportNamespace: async (
    namespace: string,
    language: LanguageCode
  ): Promise<Record<string, unknown>> => {
    return fetchClient.get(`${FRONTEND_BASE}/export/${namespace}`, { language })
  },

  /**
   * Export all frontend translations as JSON
   * BACKEND: GET /api/v1/translations/frontend/export-all
   */
  exportAll: async (language: LanguageCode): Promise<Record<string, unknown>> => {
    return fetchClient.get(`${FRONTEND_BASE}/export-all`, { language })
  },

  /**
   * Import JSON translations for namespace
   * BACKEND: POST /api/v1/translations/frontend/import
   */
  importNamespace: async (
    namespace: string,
    language: LanguageCode,
    data: Record<string, unknown>
  ): Promise<FrontendTranslationImportResult> => {
    return fetchClient.post(`${FRONTEND_BASE}/import`, data, {
      namespace,
      language,
    })
  },

  /**
   * Search frontend translations
   * BACKEND: GET /api/v1/translations/frontend
   */
  search: async (
    params: FrontendTranslationSearchParams
  ): Promise<SystemTranslationListResponse> => {
    return fetchClient.get(`${FRONTEND_BASE}/`, {
      namespace: params.namespace,
      key_code: params.key_code,
      search_term: params.search_term,
      limit: params.limit || 100,
      offset: params.offset || 0,
    })
  },

  /**
   * Create frontend translation
   * BACKEND: POST /api/v1/translations/frontend
   */
  create: async (
    namespace: string,
    keyCode: string,
    es: string,
    fr: string,
    en: string,
    description?: string
  ): Promise<SystemTranslation> => {
    return fetchClient.post(`${FRONTEND_BASE}/`, undefined, {
      namespace,
      key_code: keyCode,
      es,
      fr,
      en,
      description,
    })
  },

  /**
   * Update frontend translation
   * BACKEND: PUT /api/v1/translations/frontend/{id}
   */
  update: async (
    id: number,
    data: SystemTranslationUpdate
  ): Promise<SystemTranslation> => {
    return fetchClient.put(`${FRONTEND_BASE}/${id}`, data)
  },

  /**
   * Delete frontend translation
   * BACKEND: DELETE /api/v1/translations/frontend/{id}
   */
  delete: async (id: number): Promise<{ message: string }> => {
    return fetchClient.delete(`${FRONTEND_BASE}/${id}`)
  },
}

// =============================================================================
// EXPORTS
// =============================================================================

export const translationsApi = {
  entity: entityTranslationsApi,
  system: systemTranslationsApi,
  frontend: frontendTranslationsApi,
}

export default translationsApi
