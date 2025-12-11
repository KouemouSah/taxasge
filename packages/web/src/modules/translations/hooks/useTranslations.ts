/**
 * Translations Hooks
 * React Query hooks for translations management
 *
 * @module translations/hooks
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  entityTranslationsApi,
  systemTranslationsApi,
  frontendTranslationsApi,
} from '../services/api'
import type {
  EntityTranslationCreate,
  EntityTranslationUpdate,
  EntityTranslationBulkCreate,
  EntityTranslationSearchParams,
  TranslatableEntityType,
  LanguageCode,
  SystemTranslationCreate,
  SystemTranslationUpdate,
  SystemTranslationSearchParams,
  SystemCategoriesResponse,
  FrontendTranslationSearchParams,
} from '../types'

// =============================================================================
// QUERY KEYS
// =============================================================================

export const translationKeys = {
  // Entity translations
  entity: {
    all: ['entity-translations'] as const,
    types: () => [...translationKeys.entity.all, 'types'] as const,
    stats: () => [...translationKeys.entity.all, 'stats'] as const,
    lists: () => [...translationKeys.entity.all, 'list'] as const,
    list: (params: EntityTranslationSearchParams) =>
      [...translationKeys.entity.lists(), params] as const,
    entities: (type: TranslatableEntityType) =>
      [...translationKeys.entity.all, 'entities', type] as const,
    export: (type: TranslatableEntityType) =>
      [...translationKeys.entity.all, 'export', type] as const,
    detail: (
      type: TranslatableEntityType,
      code: string,
      lang?: LanguageCode,
      field?: string
    ) => [...translationKeys.entity.all, 'detail', type, code, lang, field] as const,
    grouped: (type: TranslatableEntityType, code: string) =>
      [...translationKeys.entity.all, 'grouped', type, code] as const,
    sourceList: (type: TranslatableEntityType, search?: string, untranslatedOnly?: boolean) =>
      [...translationKeys.entity.all, 'source', type, 'list', search, untranslatedOnly] as const,
    sourceContent: (type: TranslatableEntityType, code: string) =>
      [...translationKeys.entity.all, 'source', type, code] as const,
  },
  // System translations
  system: {
    all: ['system-translations'] as const,
    categories: (language: LanguageCode = 'es') => [...translationKeys.system.all, 'categories', language] as const,
    lists: () => [...translationKeys.system.all, 'list'] as const,
    list: (params: SystemTranslationSearchParams) =>
      [...translationKeys.system.lists(), params] as const,
    detail: (id: number) => [...translationKeys.system.all, 'detail', id] as const,
  },
  // Frontend translations
  frontend: {
    all: ['frontend-translations'] as const,
    namespaces: () => [...translationKeys.frontend.all, 'namespaces'] as const,
    stats: () => [...translationKeys.frontend.all, 'stats'] as const,
    lists: () => [...translationKeys.frontend.all, 'list'] as const,
    list: (params: FrontendTranslationSearchParams) =>
      [...translationKeys.frontend.lists(), params] as const,
    export: (namespace: string, lang: LanguageCode) =>
      [...translationKeys.frontend.all, 'export', namespace, lang] as const,
    exportAll: (lang: LanguageCode) =>
      [...translationKeys.frontend.all, 'export-all', lang] as const,
  },
}

// =============================================================================
// ENTITY TRANSLATION HOOKS
// =============================================================================

/**
 * Get entity types with labels
 */
export function useEntityTypes() {
  return useQuery({
    queryKey: translationKeys.entity.types(),
    queryFn: () => entityTranslationsApi.getTypes(),
  })
}

/**
 * Get entity translation statistics
 */
export function useEntityTranslationStats() {
  return useQuery({
    queryKey: translationKeys.entity.stats(),
    queryFn: () => entityTranslationsApi.getStats(),
  })
}

/**
 * List entities for a given type
 */
export function useEntityList(entityType: TranslatableEntityType) {
  return useQuery({
    queryKey: translationKeys.entity.entities(entityType),
    queryFn: () => entityTranslationsApi.listEntities(entityType),
    enabled: !!entityType,
  })
}

/**
 * Export translations for an entity type
 */
export function useEntityTranslationExport(entityType: TranslatableEntityType) {
  return useQuery({
    queryKey: translationKeys.entity.export(entityType),
    queryFn: () => entityTranslationsApi.exportByType(entityType),
    enabled: !!entityType,
  })
}

/**
 * Search entity translations
 */
export function useEntityTranslations(params: EntityTranslationSearchParams) {
  return useQuery({
    queryKey: translationKeys.entity.list(params),
    queryFn: () => entityTranslationsApi.search(params),
  })
}

/**
 * Get all translations for a specific entity
 */
export function useEntityGroupedTranslations(
  entityType: TranslatableEntityType,
  entityCode: string
) {
  return useQuery({
    queryKey: translationKeys.entity.grouped(entityType, entityCode),
    queryFn: () =>
      entityTranslationsApi.getEntityTranslations(entityType, entityCode),
    enabled: !!entityType && !!entityCode,
  })
}

/**
 * Create entity translation
 */
export function useCreateEntityTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EntityTranslationCreate) =>
      entityTranslationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.entity.lists() })
      queryClient.invalidateQueries({ queryKey: translationKeys.entity.stats() })
    },
  })
}

/**
 * Upsert entity translation
 */
export function useUpsertEntityTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EntityTranslationCreate) =>
      entityTranslationsApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.entity.lists() })
      queryClient.invalidateQueries({ queryKey: translationKeys.entity.stats() })
    },
  })
}

/**
 * Bulk upsert entity translations
 */
export function useBulkUpsertEntityTranslations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EntityTranslationBulkCreate) =>
      entityTranslationsApi.bulkUpsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.entity.lists() })
      queryClient.invalidateQueries({ queryKey: translationKeys.entity.stats() })
    },
  })
}

/**
 * Update entity translation
 */
export function useUpdateEntityTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      entityType,
      entityCode,
      languageCode,
      fieldName,
      data,
    }: {
      entityType: TranslatableEntityType
      entityCode: string
      languageCode: LanguageCode
      fieldName: string
      data: EntityTranslationUpdate
    }) =>
      entityTranslationsApi.update(
        entityType,
        entityCode,
        languageCode,
        fieldName,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.entity.lists() })
    },
  })
}

/**
 * Delete entity translation
 */
export function useDeleteEntityTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      entityType,
      entityCode,
      languageCode,
      fieldName,
    }: {
      entityType: TranslatableEntityType
      entityCode: string
      languageCode: LanguageCode
      fieldName: string
    }) =>
      entityTranslationsApi.delete(entityType, entityCode, languageCode, fieldName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.entity.lists() })
      queryClient.invalidateQueries({ queryKey: translationKeys.entity.stats() })
    },
  })
}

/**
 * Delete all translations for an entity
 */
export function useDeleteEntityAllTranslations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      entityType,
      entityCode,
    }: {
      entityType: TranslatableEntityType
      entityCode: string
    }) => entityTranslationsApi.deleteEntity(entityType, entityCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.entity.lists() })
      queryClient.invalidateQueries({ queryKey: translationKeys.entity.stats() })
    },
  })
}

/**
 * List source entities for translation workbench
 * Gets entities from source tables (ministries, sectors, etc.) with Spanish content
 */
export function useSourceEntities(
  entityType: TranslatableEntityType,
  search?: string,
  limit: number = 50,
  offset: number = 0,
  untranslatedOnly: boolean = false
) {
  return useQuery({
    queryKey: translationKeys.entity.sourceList(entityType, search, untranslatedOnly),
    queryFn: () => entityTranslationsApi.listSourceEntities(entityType, search, limit, offset, untranslatedOnly),
    enabled: !!entityType,
  })
}

/**
 * Get source content for a specific entity (Spanish fields from source table)
 */
export function useSourceContent(
  entityType: TranslatableEntityType,
  entityCode: string
) {
  return useQuery({
    queryKey: translationKeys.entity.sourceContent(entityType, entityCode),
    queryFn: () => entityTranslationsApi.getSourceContent(entityType, entityCode),
    enabled: !!entityType && !!entityCode,
  })
}

// =============================================================================
// SYSTEM TRANSLATION HOOKS
// =============================================================================

/**
 * Get system translation categories with localized labels
 *
 * @param language - Language code for labels (es, fr, en)
 */
export function useSystemCategories(language: LanguageCode = 'es') {
  return useQuery({
    queryKey: translationKeys.system.categories(language),
    queryFn: () => systemTranslationsApi.getCategories(language),
  })
}

/**
 * Search system translations
 */
export function useSystemTranslations(params: SystemTranslationSearchParams) {
  return useQuery({
    queryKey: translationKeys.system.list(params),
    queryFn: () => systemTranslationsApi.search(params),
  })
}

/**
 * Get system translation by ID
 */
export function useSystemTranslation(id: number) {
  return useQuery({
    queryKey: translationKeys.system.detail(id),
    queryFn: () => systemTranslationsApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Create system translation
 */
export function useCreateSystemTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SystemTranslationCreate) =>
      systemTranslationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.system.lists() })
      queryClient.invalidateQueries({
        queryKey: translationKeys.system.categories(),
      })
    },
  })
}

/**
 * Update system translation
 */
export function useUpdateSystemTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SystemTranslationUpdate }) =>
      systemTranslationsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: translationKeys.system.lists() })
      queryClient.invalidateQueries({
        queryKey: translationKeys.system.detail(variables.id),
      })
    },
  })
}

/**
 * Delete system translation
 */
export function useDeleteSystemTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => systemTranslationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.system.lists() })
      queryClient.invalidateQueries({
        queryKey: translationKeys.system.categories(),
      })
    },
  })
}

// =============================================================================
// FRONTEND TRANSLATION HOOKS
// =============================================================================

/**
 * Get frontend namespaces
 */
export function useFrontendNamespaces() {
  return useQuery({
    queryKey: translationKeys.frontend.namespaces(),
    queryFn: () => frontendTranslationsApi.getNamespaces(),
  })
}

/**
 * Get frontend translation statistics
 */
export function useFrontendTranslationStats() {
  return useQuery({
    queryKey: translationKeys.frontend.stats(),
    queryFn: () => frontendTranslationsApi.getStats(),
  })
}

/**
 * Export namespace as JSON
 */
export function useFrontendExportNamespace(
  namespace: string,
  language: LanguageCode
) {
  return useQuery({
    queryKey: translationKeys.frontend.export(namespace, language),
    queryFn: () => frontendTranslationsApi.exportNamespace(namespace, language),
    enabled: !!namespace && !!language,
  })
}

/**
 * Export all frontend translations
 */
export function useFrontendExportAll(language: LanguageCode) {
  return useQuery({
    queryKey: translationKeys.frontend.exportAll(language),
    queryFn: () => frontendTranslationsApi.exportAll(language),
    enabled: !!language,
  })
}

/**
 * Search frontend translations
 */
export function useFrontendTranslations(params: FrontendTranslationSearchParams) {
  return useQuery({
    queryKey: translationKeys.frontend.list(params),
    queryFn: () => frontendTranslationsApi.search(params),
  })
}

/**
 * Import frontend translations
 */
export function useImportFrontendTranslations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      namespace,
      language,
      data,
    }: {
      namespace: string
      language: LanguageCode
      data: Record<string, unknown>
    }) => frontendTranslationsApi.importNamespace(namespace, language, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.frontend.lists() })
      queryClient.invalidateQueries({ queryKey: translationKeys.frontend.stats() })
      queryClient.invalidateQueries({
        queryKey: translationKeys.frontend.namespaces(),
      })
    },
  })
}

/**
 * Create frontend translation
 */
export function useCreateFrontendTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      namespace,
      keyCode,
      es,
      fr,
      en,
      description,
    }: {
      namespace: string
      keyCode: string
      es: string
      fr: string
      en: string
      description?: string
    }) =>
      frontendTranslationsApi.create(namespace, keyCode, es, fr, en, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.frontend.lists() })
      queryClient.invalidateQueries({ queryKey: translationKeys.frontend.stats() })
    },
  })
}

/**
 * Update frontend translation
 */
export function useUpdateFrontendTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SystemTranslationUpdate }) =>
      frontendTranslationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.frontend.lists() })
    },
  })
}

/**
 * Delete frontend translation
 */
export function useDeleteFrontendTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => frontendTranslationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.frontend.lists() })
      queryClient.invalidateQueries({ queryKey: translationKeys.frontend.stats() })
    },
  })
}
