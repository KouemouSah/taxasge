/**
 * TaxasGE Mobile - Fiscal Services Data Access
 */

import {db} from '../DatabaseManager';
import {QUERIES, TABLE_NAMES} from '../schema';

export interface FiscalService {
  id: string;
  code: string;
  name_es: string;
  name_fr?: string;
  name_en?: string;
  description_es?: string;
  service_type?: string;
  expedition_amount: number;
  renewal_amount?: number;
  category_id?: string;
  category_name?: string;
  sector_name?: string;
  ministry_name?: string;
  ministry_code?: string;
  is_online_available: number;
  popularity_score: number;
}

export interface SearchFilters {
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

      const results = await db.query<FiscalService>(
        QUERIES.searchServices,
        [ftsQuery, limit]
      );

      console.log(`[FiscalServices] Search "${query}" found ${results.length} results`);
      return results;
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

      return results[0] || null;
    } catch (error) {
      console.error('[FiscalServices] Get by ID error:', error);
      return null;
    }
  }

  /**
   * Get services by category
   */
  async getByCategory(
    categoryId: string,
    limit: number = 50
  ): Promise<FiscalService[]> {
    try {
      const results = await db.query<FiscalService>(
        `${QUERIES.getServicesByCategory} LIMIT ?`,
        [categoryId, limit]
      );

      return results;
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
      const results = await db.query<FiscalService>(
        `SELECT * FROM v_popular_services LIMIT ?`,
        [limit]
      );

      return results;
    } catch (error) {
      console.error('[FiscalServices] Get popular error:', error);
      return [];
    }
  }

  /**
   * Get services with filters
   */
  async getFiltered(
    filters: SearchFilters,
    limit: number = 50
  ): Promise<FiscalService[]> {
    try {
      let sql = 'SELECT * FROM v_fiscal_services_complete WHERE is_active = 1';
      const params: any[] = [];

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

      if (filters.minAmount !== undefined) {
        sql += ' AND expedition_amount >= ?';
        params.push(filters.minAmount);
      }

      if (filters.maxAmount !== undefined) {
        sql += ' AND expedition_amount <= ?';
        params.push(filters.maxAmount);
      }

      if (filters.onlineOnly) {
        sql += ' AND is_online_available = 1';
      }

      sql += ' ORDER BY popularity_score DESC, name_es LIMIT ?';
      params.push(limit);

      const results = await db.query<FiscalService>(sql, params);
      return results;
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
         WHERE is_active = 1
         AND last_updated >= ?
         ORDER BY last_updated DESC
         LIMIT ?`,
        [thirtyDaysAgo.toISOString(), limit]
      );

      return results;
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
      let sql = 'SELECT COUNT(*) as count FROM fiscal_services WHERE is_active = 1';
      const params: any[] = [];

      if (filters?.ministryId) {
        sql += ' AND ministry_id = ?';
        params.push(filters.ministryId);
      }

      if (filters?.categoryId) {
        sql += ' AND category_id = ?';
        params.push(filters.categoryId);
      }

      const results = await db.query<{count: number}>(sql, params);
      return results[0]?.count || 0;
    } catch (error) {
      console.error('[FiscalServices] Get count error:', error);
      return 0;
    }
  }

  /**
   * Increment popularity score
   */
  async incrementPopularity(serviceId: string): Promise<void> {
    try {
      await db.execute(
        `UPDATE ${TABLE_NAMES.FISCAL_SERVICES}
         SET popularity_score = popularity_score + 1
         WHERE id = ?`,
        [serviceId]
      );
    } catch (error) {
      console.error('[FiscalServices] Increment popularity error:', error);
    }
  }
}

export const fiscalServicesService = new FiscalServicesService();
