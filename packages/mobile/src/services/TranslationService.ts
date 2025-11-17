/**
 * TaxasGE Mobile - Translation Service
 * Service for managing translations using entity_translations table
 *
 * Purpose:
 * - fiscal_services and other tables only have Spanish (name_es, description_es)
 * - FR/EN translations are stored in entity_translations table
 * - This service provides a unified interface to get translated text
 *
 * Created: 2025-11-06
 * Based on: Supabase inspection findings
 */

import { db } from '../database/DatabaseManager';

/**
 * Supported entity types (must match entity_translations CHECK constraint)
 */
export type EntityType =
  | 'ministry'
  | 'sector'
  | 'category'
  | 'service'
  | 'procedure_template'
  | 'procedure_step'
  | 'document_template';

/**
 * Supported field names (must match entity_translations CHECK constraint)
 */
export type FieldName = 'name' | 'description' | 'instructions';

/**
 * Supported language codes
 * Note: 'es' not in entity_translations (Spanish is source language)
 */
export type LanguageCode = 'fr' | 'en' | 'es';

/**
 * Translation result with fallback information
 */
export interface TranslationResult {
  text: string;
  language: LanguageCode;
  isFallback: boolean; // true if Spanish fallback was used
  source: 'translation' | 'fallback' | 'cache';
}

/**
 * Translation cache entry
 */
interface CacheEntry {
  text: string;
  timestamp: number;
}

/**
 * Translation Service
 *
 * Handles all translations from entity_translations table
 * with caching and fallback to Spanish
 */
class TranslationService {
  private static cache: Map<string, CacheEntry> = new Map();
  private static CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Get cache key for a translation
   */
  private static getCacheKey(
    entityType: EntityType,
    entityCode: string,
    fieldName: FieldName,
    languageCode: LanguageCode
  ): string {
    return `${entityType}:${entityCode}:${fieldName}:${languageCode}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private static isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.CACHE_TTL;
  }

  /**
   * Get translation from cache
   */
  private static getFromCache(
    entityType: EntityType,
    entityCode: string,
    fieldName: FieldName,
    languageCode: LanguageCode
  ): string | null {
    const key = this.getCacheKey(entityType, entityCode, fieldName, languageCode);
    const entry = this.cache.get(key);

    if (entry && this.isCacheValid(entry)) {
      return entry.text;
    }

    // Remove stale cache entry
    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Save translation to cache
   */
  private static saveToCache(
    entityType: EntityType,
    entityCode: string,
    fieldName: FieldName,
    languageCode: LanguageCode,
    text: string
  ): void {
    const key = this.getCacheKey(entityType, entityCode, fieldName, languageCode);
    this.cache.set(key, {
      text,
      timestamp: Date.now(),
    });
  }

  /**
   * Get translation for an entity field
   *
   * @param entityType Type of entity ('service', 'ministry', etc.)
   * @param entityCode Unique code (e.g., 'T-201', 'M-001', 'PROC_001:step_1')
   * @param fieldName Field to translate ('name', 'description', 'instructions')
   * @param languageCode Target language ('fr', 'en', 'es')
   * @param fallbackText Spanish text to use if translation not found
   * @returns Translated text or fallback
   *
   * @example
   * ```typescript
   * // Get French name for service T-201
   * const name = await TranslationService.translate(
   *   'service', 'T-201', 'name', 'fr', 'Micro empresa'
   * );
   * ```
   */
  static async translate(
    entityType: EntityType,
    entityCode: string,
    fieldName: FieldName,
    languageCode: LanguageCode,
    fallbackText?: string
  ): Promise<string> {
    // If Spanish requested, return fallback immediately (no lookup needed)
    if (languageCode === 'es') {
      return fallbackText || '';
    }

    // Check cache first
    const cached = this.getFromCache(entityType, entityCode, fieldName, languageCode);
    if (cached !== null) {
      return cached;
    }

    try {
      // Query entity_translations table
      const result = await db.query(
        `SELECT translation_text
         FROM entity_translations
         WHERE entity_type = ?
           AND entity_code = ?
           AND field_name = ?
           AND language_code = ?
         LIMIT 1`,
        [entityType, entityCode, fieldName, languageCode]
      );

      if (result && result.length > 0 && result[0].translation_text) {
        const translatedText = result[0].translation_text;

        // Save to cache
        this.saveToCache(entityType, entityCode, fieldName, languageCode, translatedText);

        return translatedText;
      }

      // No translation found, use fallback
      if (fallbackText) {
        console.warn(
          `[TranslationService] No ${languageCode} translation for ${entityType}:${entityCode}:${fieldName}, using Spanish fallback`
        );
        return fallbackText;
      }

      return '';
    } catch (error) {
      console.error('[TranslationService] Error fetching translation:', error);
      return fallbackText || '';
    }
  }

  /**
   * Get detailed translation result with metadata
   *
   * @returns TranslationResult with fallback info
   */
  static async translateWithMeta(
    entityType: EntityType,
    entityCode: string,
    fieldName: FieldName,
    languageCode: LanguageCode,
    fallbackText?: string
  ): Promise<TranslationResult> {
    // Spanish is always returned as is (no translation needed)
    if (languageCode === 'es') {
      return {
        text: fallbackText || '',
        language: 'es',
        isFallback: false,
        source: 'fallback',
      };
    }

    // Check cache
    const cached = this.getFromCache(entityType, entityCode, fieldName, languageCode);
    if (cached !== null) {
      return {
        text: cached,
        language: languageCode,
        isFallback: false,
        source: 'cache',
      };
    }

    try {
      const result = await db.query(
        `SELECT translation_text
         FROM entity_translations
         WHERE entity_type = ?
           AND entity_code = ?
           AND field_name = ?
           AND language_code = ?
         LIMIT 1`,
        [entityType, entityCode, fieldName, languageCode]
      );

      if (result && result.length > 0 && result[0].translation_text) {
        const translatedText = result[0].translation_text;
        this.saveToCache(entityType, entityCode, fieldName, languageCode, translatedText);

        return {
          text: translatedText,
          language: languageCode,
          isFallback: false,
          source: 'translation',
        };
      }

      // Fallback to Spanish
      return {
        text: fallbackText || '',
        language: 'es',
        isFallback: true,
        source: 'fallback',
      };
    } catch (error) {
      console.error('[TranslationService] Error:', error);
      return {
        text: fallbackText || '',
        language: 'es',
        isFallback: true,
        source: 'fallback',
      };
    }
  }

  /**
   * Get all translations for an entity (name + description)
   *
   * @returns Object with translated fields
   *
   * @example
   * ```typescript
   * const translations = await TranslationService.translateEntity(
   *   'service', 'T-201', 'fr',
   *   { name_es: 'Micro empresa', description_es: 'Registro de micro empresa' }
   * );
   * // Returns: { name: 'Micro-entreprise', description: 'Enregistrement...' }
   * ```
   */
  static async translateEntity(
    entityType: EntityType,
    entityCode: string,
    languageCode: LanguageCode,
    fallbacks?: {
      name_es?: string;
      description_es?: string;
      instructions_es?: string;
    }
  ): Promise<{
    name?: string;
    description?: string;
    instructions?: string;
  }> {
    const fields: FieldName[] = ['name', 'description', 'instructions'];
    const translations: Record<string, string> = {};

    // Translate all fields in parallel
    await Promise.all(
      fields.map(async (fieldName) => {
        const fallbackKey = `${fieldName}_es` as keyof typeof fallbacks;
        const fallbackText = fallbacks?.[fallbackKey];

        const translated = await this.translate(
          entityType,
          entityCode,
          fieldName,
          languageCode,
          fallbackText
        );

        if (translated) {
          translations[fieldName] = translated;
        }
      })
    );

    return translations;
  }

  /**
   * Batch translate multiple entities for performance
   *
   * Useful when displaying a list of services, ministries, etc.
   *
   * @param entities Array of entities to translate
   * @param fieldName Field to translate
   * @param languageCode Target language
   * @returns Map of entityCode → translated text
   *
   * @example
   * ```typescript
   * const services = [
   *   { service_code: 'T-201', name_es: 'Micro empresa' },
   *   { service_code: 'T-202', name_es: 'Pequeña empresa' },
   * ];
   *
   * const translations = await TranslationService.batchTranslate(
   *   services.map(s => ({
   *     entityType: 'service',
   *     entityCode: s.service_code,
   *     fallbackText: s.name_es
   *   })),
   *   'name',
   *   'fr'
   * );
   *
   * // translations.get('T-201') → 'Micro-entreprise'
   * ```
   */
  static async batchTranslate(
    entities: Array<{
      entityType: EntityType;
      entityCode: string;
      fallbackText?: string;
    }>,
    fieldName: FieldName,
    languageCode: LanguageCode
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();

    // If Spanish, return all fallbacks immediately
    if (languageCode === 'es') {
      entities.forEach((entity) => {
        if (entity.fallbackText) {
          result.set(entity.entityCode, entity.fallbackText);
        }
      });
      return result;
    }

    // Build list of entity codes to query (excluding cached)
    const toQuery: typeof entities = [];
    entities.forEach((entity) => {
      const cached = this.getFromCache(
        entity.entityType,
        entity.entityCode,
        fieldName,
        languageCode
      );

      if (cached !== null) {
        result.set(entity.entityCode, cached);
      } else {
        toQuery.push(entity);
      }
    });

    // If all cached, return immediately
    if (toQuery.length === 0) {
      return result;
    }

    try {
      // Build IN clause for batch query
      const entityCodes = toQuery.map((e) => e.entityCode);
      const placeholders = entityCodes.map(() => '?').join(',');

      const translations = await db.query(
        `SELECT entity_code, translation_text
         FROM entity_translations
         WHERE entity_type = ?
           AND entity_code IN (${placeholders})
           AND field_name = ?
           AND language_code = ?`,
        [toQuery[0].entityType, ...entityCodes, fieldName, languageCode]
      );

      // Build map of entity_code → translation
      const translationMap = new Map<string, string>();
      translations.forEach((row: any) => {
        translationMap.set(row.entity_code, row.translation_text);
        // Cache the translation
        this.saveToCache(
          toQuery[0].entityType,
          row.entity_code,
          fieldName,
          languageCode,
          row.translation_text
        );
      });

      // Fill result with translations or fallbacks
      toQuery.forEach((entity) => {
        const translated = translationMap.get(entity.entityCode);
        result.set(entity.entityCode, translated || entity.fallbackText || '');
      });

      return result;
    } catch (error) {
      console.error('[TranslationService] Batch translation error:', error);

      // Return fallbacks for all
      toQuery.forEach((entity) => {
        if (entity.fallbackText) {
          result.set(entity.entityCode, entity.fallbackText);
        }
      });

      return result;
    }
  }

  /**
   * Clear translation cache
   * Useful when language changes or data is refreshed
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('[TranslationService] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    maxSize: number;
    ttlMinutes: number;
  } {
    return {
      size: this.cache.size,
      maxSize: 10000, // Arbitrary limit
      ttlMinutes: this.CACHE_TTL / 60000,
    };
  }

  /**
   * Preload translations for frequently accessed entities
   *
   * Call this after sync to warm up the cache
   *
   * @param languageCode Language to preload
   */
  static async preloadCommonTranslations(languageCode: LanguageCode): Promise<void> {
    if (languageCode === 'es') {
      return; // No preload needed for Spanish
    }

    try {
      console.log(`[TranslationService] Preloading ${languageCode} translations...`);

      // Preload all ministries, sectors, categories (small datasets)
      const commonTypes: EntityType[] = ['ministry', 'sector', 'category'];

      for (const entityType of commonTypes) {
        const translations = await db.query(
          `SELECT entity_code, field_name, translation_text
           FROM entity_translations
           WHERE entity_type = ?
             AND language_code = ?`,
          [entityType, languageCode]
        );

        translations.forEach((row: any) => {
          this.saveToCache(
            entityType,
            row.entity_code,
            row.field_name,
            languageCode,
            row.translation_text
          );
        });

        console.log(
          `[TranslationService] Preloaded ${translations.length} ${entityType} translations`
        );
      }

      console.log('[TranslationService] Preload complete');
    } catch (error) {
      console.error('[TranslationService] Preload error:', error);
    }
  }

  /**
   * Get all translations for a specific entity type
   * Returns a nested object structure for easy lookup
   *
   * @param entityType Type of entity to fetch translations for
   * @returns Object with entity_code as key, containing fr/en translations
   *
   * @example
   * ```typescript
   * const translations = await TranslationService.getTranslationsForEntityType('ministry');
   * // Returns:
   * // {
   * //   'M-001': {
   * //     fr: { name: 'Ministère...', description: '...' },
   * //     en: { name: 'Ministry...', description: '...' }
   * //   },
   * //   ...
   * // }
   * ```
   */
  static async getTranslationsForEntityType(
    entityType: EntityType
  ): Promise<Record<string, {
    fr?: { name?: string; description?: string; instructions?: string };
    en?: { name?: string; description?: string; instructions?: string };
  }>> {
    try {
      console.log(`[TranslationService] Loading all ${entityType} translations...`);

      // Query all translations for this entity type (FR and EN)
      const translations = await db.query<{
        entity_code: string;
        language_code: string;
        field_name: string;
        translation_text: string;
      }>(
        `SELECT entity_code, language_code, field_name, translation_text
         FROM entity_translations
         WHERE entity_type = ?
           AND language_code IN ('fr', 'en')
         ORDER BY entity_code, language_code, field_name`,
        [entityType]
      );

      console.log(`[TranslationService] Found ${translations.length} ${entityType} translations`);

      // Build nested structure
      const result: Record<string, {
        fr?: { name?: string; description?: string; instructions?: string };
        en?: { name?: string; description?: string; instructions?: string };
      }> = {};

      translations.forEach(row => {
        const { entity_code, language_code, field_name, translation_text } = row;

        // Initialize entity_code if needed
        if (!result[entity_code]) {
          result[entity_code] = {};
        }

        // Initialize language if needed
        if (!result[entity_code][language_code as 'fr' | 'en']) {
          result[entity_code][language_code as 'fr' | 'en'] = {};
        }

        // Set the field
        result[entity_code][language_code as 'fr' | 'en']![field_name as 'name' | 'description' | 'instructions'] = translation_text;

        // Cache the translation
        this.saveToCache(
          entityType,
          entity_code,
          field_name as FieldName,
          language_code as LanguageCode,
          translation_text
        );
      });

      return result;
    } catch (error) {
      console.error(`[TranslationService] Error loading ${entityType} translations:`, error);
      return {};
    }
  }
}

export default TranslationService;
