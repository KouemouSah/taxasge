/**
 * Translations Admin Types
 * Type definitions for translations management
 *
 * BACKEND ALIGNMENT:
 * - Entity translations: entity_translation.py (Pydantic models)
 * - System translations: translation.py (Pydantic models)
 * - Frontend translations: frontend_translation_routes.py
 *
 * @module translations/types
 */

// =============================================================================
// ENUMS - Match backend ENUMs
// =============================================================================

/**
 * Entity type enum - matches database translatable_entity_type
 * CRITICAL: Only ministry, sector, category are valid (NOT fiscal_service)
 */
export type TranslatableEntityType = 'ministry' | 'sector' | 'category'

/**
 * Language code enum - matches backend LanguageCode
 */
export type LanguageCode = 'es' | 'fr' | 'en'

/**
 * Translation source - how the translation was created
 */
export type TranslationSource = 'manual' | 'import' | 'machine' | 'review'

/**
 * Translation quality level
 */
export type TranslationQuality = 'draft' | 'reviewed' | 'approved'

// =============================================================================
// ENTITY TRANSLATIONS - entity_translations table
// =============================================================================

/**
 * Entity translation record
 * Maps to: entity_translations table
 */
export interface EntityTranslation {
  id: number
  entity_type: TranslatableEntityType
  entity_code: string
  language_code: LanguageCode
  field_name: string
  translation_text: string
  translation_source: TranslationSource
  translation_quality?: TranslationQuality
  created_at: string
  updated_at?: string
}

/**
 * Request for creating entity translation
 */
export interface EntityTranslationCreate {
  entity_type: TranslatableEntityType
  entity_code: string
  language_code: LanguageCode
  field_name: string
  translation_text: string
  translation_source?: TranslationSource
  translation_quality?: TranslationQuality
}

/**
 * Request for updating entity translation
 */
export interface EntityTranslationUpdate {
  translation_text: string
  translation_source?: TranslationSource
  translation_quality?: TranslationQuality
}

/**
 * Bulk create item - all 3 languages for one entity field
 */
export interface EntityTranslationBulkItem {
  entity_type: TranslatableEntityType
  entity_code: string
  field_name: string
  es: string
  fr: string
  en: string
  translation_source?: TranslationSource
}

/**
 * Bulk create request
 */
export interface EntityTranslationBulkCreate {
  translations: EntityTranslationBulkItem[]
}

/**
 * Search parameters for entity translations
 */
export interface EntityTranslationSearchParams {
  entity_type?: TranslatableEntityType
  entity_code?: string
  language_code?: LanguageCode
  field_name?: string
  search_term?: string
  limit?: number
  offset?: number
}

/**
 * Grouped translations for an entity (all languages)
 */
export interface EntityTranslationGrouped {
  entity_type: string
  entity_code: string
  translations: Record<string, Record<LanguageCode, string>>
}

/**
 * Entity translation statistics
 */
export interface EntityTranslationStats {
  total_translations: number
  by_entity_type: Record<string, number>
  by_language: Record<string, number>
  by_field: Record<string, number>
  distinct_entities?: Record<string, number>
}

/**
 * Paginated entity translations response
 */
export interface EntityTranslationListResponse {
  translations: EntityTranslation[]
  total: number
  limit: number
  offset: number
}

// =============================================================================
// SYSTEM TRANSLATIONS - translations table
// =============================================================================

/**
 * System translation record
 * Maps to: translations table
 * Used for: ENUMs, UI labels, forms, messages
 */
export interface SystemTranslation {
  id: number
  category: string
  key_code: string
  context?: string
  es: string
  fr: string
  en: string
  description?: string
  translation_source: TranslationSource
  created_at: string
  updated_at?: string
  created_by?: string
}

/**
 * Request for creating system translation
 */
export interface SystemTranslationCreate {
  category: string
  key_code: string
  context?: string
  es: string
  fr: string
  en: string
  description?: string
  translation_source?: TranslationSource
}

/**
 * Request for updating system translation
 */
export interface SystemTranslationUpdate {
  es?: string
  fr?: string
  en?: string
  description?: string
  translation_source?: TranslationSource
}

/**
 * Search parameters for system translations
 */
export interface SystemTranslationSearchParams {
  category?: string
  key_code?: string
  context?: string
  search_term?: string
  limit?: number
  offset?: number
}

/**
 * Paginated system translations response
 */
export interface SystemTranslationListResponse {
  translations: SystemTranslation[]
  total: number
  limit: number
  offset: number
}

// =============================================================================
// FRONTEND TRANSLATIONS - next-intl JSON sync
// =============================================================================

/**
 * Frontend translation namespace info
 */
export interface FrontendNamespace {
  name: string
  key_count: number
}

/**
 * Frontend translation stats
 */
export interface FrontendTranslationStats {
  total_keys: number
  by_namespace: Record<string, number>
  missing_translations: {
    es: number
    fr: number
    en: number
  }
  coverage: {
    es: number
    fr: number
    en: number
  }
}

/**
 * Frontend translation search params
 */
export interface FrontendTranslationSearchParams {
  namespace?: string
  key_code?: string
  search_term?: string
  limit?: number
  offset?: number
}

/**
 * Frontend translation import result
 */
export interface FrontendTranslationImportResult {
  namespace: string
  language: LanguageCode
  created: number
  updated: number
  total_processed: number
  errors: string[]
  error_count: number
}

// =============================================================================
// ENTITY TYPE OPTIONS (for UI dropdowns)
// =============================================================================

export interface EntityTypeOption {
  value: TranslatableEntityType
  label: string
  label_fr: string
  label_en: string
}

export const ENTITY_TYPE_OPTIONS: EntityTypeOption[] = [
  { value: 'ministry', label: 'Ministerios', label_fr: 'Ministères', label_en: 'Ministries' },
  { value: 'sector', label: 'Sectores', label_fr: 'Secteurs', label_en: 'Sectors' },
  { value: 'category', label: 'Categorías', label_fr: 'Catégories', label_en: 'Categories' },
]

export const LANGUAGE_OPTIONS = [
  { value: 'es' as LanguageCode, label: 'Español', flag: '🇪🇸' },
  { value: 'fr' as LanguageCode, label: 'Français', flag: '🇫🇷' },
  { value: 'en' as LanguageCode, label: 'English', flag: '🇬🇧' },
]

export const TRANSLATION_SOURCE_OPTIONS = [
  { value: 'manual' as TranslationSource, label: 'Manual' },
  { value: 'import' as TranslationSource, label: 'Importación' },
  { value: 'machine' as TranslationSource, label: 'Traducción automática' },
  { value: 'review' as TranslationSource, label: 'Revisión' },
]

export const TRANSLATION_QUALITY_OPTIONS = [
  { value: 'draft' as TranslationQuality, label: 'Borrador', color: 'yellow' },
  { value: 'reviewed' as TranslationQuality, label: 'Revisado', color: 'blue' },
  { value: 'approved' as TranslationQuality, label: 'Aprobado', color: 'green' },
]
