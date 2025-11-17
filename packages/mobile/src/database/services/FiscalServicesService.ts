/**
 * TaxasGE Mobile - Fiscal Services Data Access
 */

import { db } from '../DatabaseManager';
import { QUERIES, TABLE_NAMES } from '../schema';
import TranslationService from '../../services/TranslationService';

export interface FiscalService {
  id: string;
  service_code: string;
  name_es: string;
  name_fr?: string;
  name_en?: string;
  description_es?: string;
  description_fr?: string;
  description_en?: string;
  service_type?: string;

  // CALCULATION
  calculation_method: string;
  tasa_expedicion: number;
  tasa_renovacion?: number;

  // CALCULATION CONFIG
  base_percentage?: number;
  percentage_of?: string;
  tier_group_name?: string;
  is_tier_component?: number;
  parent_service_id?: string;
  calculation_config?: string;
  rate_tiers?: string;
  unit_rate?: number;
  unit_type?: string;
  expedition_formula?: string;
  renewal_formula?: string;
  expedition_unit_measure?: string;
  renewal_unit_measure?: string;

  // Hiérarchie (from v_fiscal_services_complete view)
  category_id?: string;
  category_name?: string;
  category_name_fr?: string;
  category_name_en?: string;
  category_code?: string;
  sector_id?: string;
  sector_name?: string;
  sector_name_fr?: string;
  sector_name_en?: string;
  sector_code?: string;
  ministry_id?: string;
  ministry_name?: string;
  ministry_name_fr?: string;
  ministry_name_en?: string;
  ministry_code?: string;
  ministry_color?: string;

  // Status and metadata
  status?: string;
  priority?: number;
  complexity_level?: number;
  processing_time_days?: number;

  // Statistics (mobile analytics)
  view_count?: number;
  calculation_count?: number;
  payment_count?: number;
  favorite_count?: number;

  // Audit
  created_at?: string;
  updated_at?: string;
}

export interface SearchFilters {
  searchQuery?: string;
  ministryId?: string;
  sectorId?: string;
  categoryId?: string;
  serviceType?: string;
  minAmount?: number;
  maxAmount?: number;
  onlineOnly?: boolean;
}

class FiscalServicesService {
  /**
   * Enrich services with translations from entity_translations table
   */
  private async enrichWithTranslations(services: FiscalService[]): Promise<FiscalService[]> {
    try {
      // Load all translations - direct mapping service_code → entity_code
      const [serviceTranslations, ministryTranslations, sectorTranslations, categoryTranslations] = await Promise.all([
        TranslationService.getTranslationsForEntityType('service'),
        TranslationService.getTranslationsForEntityType('ministry'),
        TranslationService.getTranslationsForEntityType('sector'),
        TranslationService.getTranslationsForEntityType('category'),
      ]);

      console.log(`[FiscalServices] Enriching ${services.length} services with translations`);

      // Apply translations to each service
      const enrichedServices = services.map(service => {
        // Direct mapping: service.service_code (T-001) → entity_translations.entity_code (T-001)
        const serviceTrans = service.service_code ? serviceTranslations[service.service_code] : undefined;
        const ministryTrans = service.ministry_code ? ministryTranslations[service.ministry_code] : undefined;
        const sectorTrans = service.sector_code ? sectorTranslations[service.sector_code] : undefined;
        const categoryTrans = service.category_code ? categoryTranslations[service.category_code] : undefined;

        return {
          ...service,
          // Service translations using direct mapping (service_code → entity_code)
          name_fr: serviceTrans?.fr?.name,
          name_en: serviceTrans?.en?.name,
          description_fr: serviceTrans?.fr?.description,
          description_en: serviceTrans?.en?.description,
          // Ministry translations
          ministry_name_fr: ministryTrans?.fr?.name,
          ministry_name_en: ministryTrans?.en?.name,
          // Sector translations
          sector_name_fr: sectorTrans?.fr?.name,
          sector_name_en: sectorTrans?.en?.name,
          // Category translations
          category_name_fr: categoryTrans?.fr?.name,
          category_name_en: categoryTrans?.en?.name,
        };
      });

      return enrichedServices;
    } catch (error) {
      console.error('[FiscalServices] Error enriching with translations:', error);
      return services; // Return services without translations on error
    }
  }

  /**
   * Search services by query (full-text search)
   */
  async search(query: string, limit: number = 20): Promise<FiscalService[]> {
    try {
      // Prepare FTS5 query (escape special characters)
      const ftsQuery = query
        .trim()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(term => term.length > 2)
        .join(' OR ');

      if (!ftsQuery) {
        return [];
      }

      const results = await db.query<FiscalService>(QUERIES.searchServices, [ftsQuery, limit]);

      console.log(`[FiscalServices] Search "${query}" found ${results.length} results`);

      // Enrich with translations
      return await this.enrichWithTranslations(results);
    } catch (error) {
      console.error('[FiscalServices] Search error:', error);
      return [];
    }
  }

  /**
   * Get service by ID with full details
   */
  async getById(id: string): Promise<FiscalService | null> {
    try {
      const results = await db.query<FiscalService>(
        `SELECT * FROM v_fiscal_services_complete WHERE id = ? LIMIT 1`,
        [id]
      );

      if (results[0]) {
        const enriched = await this.enrichWithTranslations([results[0]]);
        return enriched[0] || null;
      }

      return null;
    } catch (error) {
      console.error('[FiscalServices] Get by ID error:', error);
      return null;
    }
  }

  /**
   * Get services by category
   */
  async getByCategory(categoryId: string, limit: number = 50): Promise<FiscalService[]> {
    try {
      const results = await db.query<FiscalService>(`${QUERIES.getServicesByCategory} LIMIT ?`, [
        categoryId,
        limit,
      ]);

      return await this.enrichWithTranslations(results);
    } catch (error) {
      console.error('[FiscalServices] Get by category error:', error);
      return [];
    }
  }

  /**
   * Get popular services
   */
  async getPopular(limit: number = 20): Promise<FiscalService[]> {
    try {
      const results = await db.query<FiscalService>(`SELECT * FROM v_popular_services LIMIT ?`, [
        limit,
      ]);

      return await this.enrichWithTranslations(results);
    } catch (error) {
      console.error('[FiscalServices] Get popular error:', error);
      return [];
    }
  }

  /**
   * Get services with filters
   */
  async getFiltered(filters: SearchFilters, limit: number = 50): Promise<FiscalService[]> {
    try {
      let sql = 'SELECT * FROM v_fiscal_services_complete WHERE status = ?';
      const params: any[] = ['active'];

      if (filters.searchQuery && filters.searchQuery.trim()) {
        const searchTerm = `%${filters.searchQuery.trim()}%`;
        sql += ' AND (name_es LIKE ? OR description_es LIKE ? OR service_code LIKE ?)';
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.ministryId) {
        sql += ' AND ministry_id = ?';
        params.push(filters.ministryId);
      }

      if (filters.categoryId) {
        sql += ' AND category_id = ?';
        params.push(filters.categoryId);
      }

      if (filters.serviceType) {
        sql += ' AND service_type = ?';
        params.push(filters.serviceType);
      }

      if (filters.calculationMethod) {
        sql += ' AND calculation_method = ?';
        params.push(filters.calculationMethod);
      }

      if (filters.minAmount !== undefined) {
        sql += ' AND tasa_expedicion >= ?';
        params.push(filters.minAmount);
      }

      if (filters.maxAmount !== undefined) {
        sql += ' AND tasa_expedicion <= ?';
        params.push(filters.maxAmount);
      }

      // Note: onlineOnly filter removed - is_online_available column doesn't exist

      sql += ' ORDER BY favorite_count DESC, view_count DESC, name_es LIMIT ?';
      params.push(limit);

      const results = await db.query<FiscalService>(sql, params);

      console.log(`[FiscalServices] Filtered query found ${results.length} results`);

      // Enrich with translations from entity_translations
      return await this.enrichWithTranslations(results);
    } catch (error) {
      console.error('[FiscalServices] Get filtered error:', error);
      return [];
    }
  }

  /**
   * Get recent services (last 30 days)
   */
  async getRecent(limit: number = 10): Promise<FiscalService[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const results = await db.query<FiscalService>(
        `SELECT * FROM v_fiscal_services_complete
         WHERE status = 'active'
         AND updated_at >= ?
         ORDER BY updated_at DESC
         LIMIT ?`,
        [thirtyDaysAgo.toISOString(), limit]
      );

      return await this.enrichWithTranslations(results);
    } catch (error) {
      console.error('[FiscalServices] Get recent error:', error);
      return [];
    }
  }

  /**
   * Get total count
   */
  async getCount(filters?: SearchFilters): Promise<number> {
    try {
      let sql = 'SELECT COUNT(*) as count FROM fiscal_services WHERE status = ?';
      const params: any[] = ['active'];

      if (filters?.ministryId) {
        sql += ' AND ministry_id = ?';
        params.push(filters.ministryId);
      }

      if (filters?.categoryId) {
        sql += ' AND category_id = ?';
        params.push(filters.categoryId);
      }

      const results = await db.query<{ count: number }>(sql, params);
      return results[0]?.count || 0;
    } catch (error) {
      console.error('[FiscalServices] Get count error:', error);
      return 0;
    }
  }

  /**
   * Increment view count (for analytics)
   */
  async incrementViewCount(serviceId: string): Promise<void> {
    try {
      await db.execute(
        `UPDATE ${TABLE_NAMES.FISCAL_SERVICES}
         SET view_count = view_count + 1
         WHERE id = ?`,
        [serviceId]
      );
    } catch (error) {
      console.error('[FiscalServices] Increment view count error:', error);
    }
  }

  /**
   * Increment popularity (favorite_count) for analytics
   */
  async incrementPopularity(serviceId: string): Promise<void> {
    try {
      await db.execute(
        `UPDATE ${TABLE_NAMES.FISCAL_SERVICES}
         SET favorite_count = favorite_count + 1
         WHERE id = ?`,
        [serviceId]
      );
    } catch (error) {
      console.error('[FiscalServices] Increment popularity error:', error);
    }
  }

  /**
   * Get all unique ministries with their services count
   */
  async getMinistries(): Promise<Array<{ id: string; name: string; name_fr?: string; name_en?: string; code: string; count: number }>> {
    try {
      const results = await db.query<{ id: string; name: string; code: string; count: number }>(
        `SELECT
          ministry_id as id,
          ministry_name as name,
          ministry_code as code,
          COUNT(*) as count
         FROM v_fiscal_services_complete
         WHERE status = 'active' AND ministry_id IS NOT NULL
         GROUP BY ministry_id, ministry_name, ministry_code
         ORDER BY ministry_name`,
        []
      );

      // Enrich with translations
      const ministryTranslations = await TranslationService.getTranslationsForEntityType('ministry');

      return results.map(m => ({
        ...m,
        name_fr: ministryTranslations[m.code]?.fr?.name,
        name_en: ministryTranslations[m.code]?.en?.name,
      }));
    } catch (error) {
      console.error('[FiscalServices] Get ministries error:', error);
      return [];
    }
  }

  /**
   * Get all unique categories with their services count
   */
  async getCategories(): Promise<Array<{ id: string; name: string; name_fr?: string; name_en?: string; code: string; count: number }>> {
    try {
      const results = await db.query<{ id: string; name: string; code: string; count: number }>(
        `SELECT
          category_id as id,
          category_name as name,
          category_code as code,
          COUNT(*) as count
         FROM v_fiscal_services_complete
         WHERE status = 'active' AND category_id IS NOT NULL
         GROUP BY category_id, category_name, category_code
         ORDER BY category_name`,
        []
      );

      // Enrich with translations
      const categoryTranslations = await TranslationService.getTranslationsForEntityType('category');

      return results.map(c => ({
        ...c,
        name_fr: categoryTranslations[c.code]?.fr?.name,
        name_en: categoryTranslations[c.code]?.en?.name,
      }));
    } catch (error) {
      console.error('[FiscalServices] Get categories error:', error);
      return [];
    }
  }

  /**
   * Get all unique service types with their services count
   */
  async getServiceTypes(): Promise<Array<{ type: string; count: number }>> {
    try {
      const results = await db.query<{ type: string; count: number }>(
        `SELECT
          service_type as type,
          COUNT(*) as count
         FROM fiscal_services
         WHERE status = 'active' AND service_type IS NOT NULL AND service_type != ''
         GROUP BY service_type
         ORDER BY service_type`,
        []
      );

      return results;
    } catch (error) {
      console.error('[FiscalServices] Get service types error:', error);
      return [];
    }
  }
}

export const fiscalServicesService = new FiscalServicesService();

/**
 * Helper functions for multilingual service data
 */

/**
 * Get service name in the specified language
 * Falls back to Spanish if translation is not available
 */
export const getServiceName = (service: FiscalService, language: 'es' | 'fr' | 'en'): string => {
  if (language === 'fr' && service.name_fr) {
    return service.name_fr;
  }
  if (language === 'en' && service.name_en) {
    return service.name_en;
  }
  return service.name_es;
};

/**
 * Get service description in the specified language
 * Falls back to Spanish if translation is not available
 */
export const getServiceDescription = (
  service: FiscalService,
  language: 'es' | 'fr' | 'en'
): string | undefined => {
  if (language === 'fr' && service.description_fr) {
    return service.description_fr;
  }
  if (language === 'en' && service.description_en) {
    return service.description_en;
  }
  return service.description_es;
};

/**
 * Get ministry name in the specified language
 * Falls back to Spanish if translation is not available
 */
export const getMinistryName = (service: FiscalService, language: 'es' | 'fr' | 'en'): string | undefined => {
  if (!service.ministry_name) return undefined;

  if (language === 'fr' && service.ministry_name_fr) {
    return service.ministry_name_fr;
  }
  if (language === 'en' && service.ministry_name_en) {
    return service.ministry_name_en;
  }
  return service.ministry_name;
};

/**
 * Get sector name in the specified language
 * Falls back to Spanish if translation is not available
 */
export const getSectorName = (service: FiscalService, language: 'es' | 'fr' | 'en'): string | undefined => {
  if (!service.sector_name) return undefined;

  if (language === 'fr' && service.sector_name_fr) {
    return service.sector_name_fr;
  }
  if (language === 'en' && service.sector_name_en) {
    return service.sector_name_en;
  }
  return service.sector_name;
};

/**
 * Get category name in the specified language
 * Falls back to Spanish if translation is not available
 */
export const getCategoryName = (service: FiscalService, language: 'es' | 'fr' | 'en'): string | undefined => {
  if (!service.category_name) return undefined;

  if (language === 'fr' && service.category_name_fr) {
    return service.category_name_fr;
  }
  if (language === 'en' && service.category_name_en) {
    return service.category_name_en;
  }
  return service.category_name;
};
