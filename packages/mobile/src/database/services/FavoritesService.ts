/**
 * TaxasGE Mobile - Favorites Service
 */

import { db } from '../DatabaseManager';
import { TABLE_NAMES, QUERIES, SYNC_STATUS } from '../schema';

export interface Favorite {
  id: number;
  user_id: string;
  fiscal_service_code: string;  // FIXED: was fiscal_service_id
  notes?: string;
  tags?: string;
  created_at: string;            // FIXED: was added_at
  synced: number;
  // From join
  name_es?: string;
  service_type?: string;
  tasa_expedicion?: number;
  ministry_name?: string;
}

class FavoritesService {
  /**
   * Get user favorites
   */
  async getUserFavorites(userId: string): Promise<Favorite[]> {
    try {
      const results = await db.query<Favorite>(QUERIES.getUserFavorites, [userId]);

      return results;
    } catch (error) {
      console.error('[Favorites] Get user favorites error:', error);
      return [];
    }
  }

  /**
   * Check if service is favorited
   */
  async isFavorite(userId: string, serviceId: string): Promise<boolean> {
    try {
      const results = await db.query<{ exists: number }>(QUERIES.checkFavoriteExists, [
        userId,
        serviceId,
      ]);

      return results.length > 0;
    } catch (error) {
      console.error('[Favorites] Check favorite error:', error);
      return false;
    }
  }

  /**
   * Add favorite
   */
  async addFavorite(
    userId: string,
    serviceId: string,
    notes?: string,
    tags?: string[]
  ): Promise<number> {
    try {
      const tagsJson = tags ? JSON.stringify(tags) : null;

      const insertId = await db.insert(TABLE_NAMES.USER_FAVORITES, {
        user_id: userId,
        fiscal_service_code: serviceId,  // FIXED: was fiscal_service_id
        notes: notes || null,
        tags: tagsJson,
        created_at: new Date().toISOString(),  // FIXED: was added_at
        synced: SYNC_STATUS.PENDING,
      });

      console.log('[Favorites] Added favorite:', insertId);
      return insertId;
    } catch (error) {
      console.error('[Favorites] Add favorite error:', error);
      throw error;
    }
  }

  /**
   * Remove favorite
   */
  async removeFavorite(userId: string, serviceId: string): Promise<boolean> {
    try {
      const deleted = await db.delete(
        TABLE_NAMES.USER_FAVORITES,
        'user_id = ? AND fiscal_service_code = ?',  // FIXED: was fiscal_service_id
        [userId, serviceId]
      );

      console.log('[Favorites] Removed favorite, rows affected:', deleted);
      return deleted > 0;
    } catch (error) {
      console.error('[Favorites] Remove favorite error:', error);
      return false;
    }
  }

  /**
   * Update favorite notes
   */
  async updateNotes(userId: string, serviceId: string, notes: string): Promise<boolean> {
    try {
      const updated = await db.update(
        TABLE_NAMES.USER_FAVORITES,
        {
          notes,
          synced: SYNC_STATUS.PENDING,
        },
        'user_id = ? AND fiscal_service_code = ?',  // FIXED: was fiscal_service_id
        [userId, serviceId]
      );

      return updated > 0;
    } catch (error) {
      console.error('[Favorites] Update notes error:', error);
      return false;
    }
  }

  /**
   * Get favorites count
   */
  async getCount(userId: string): Promise<number> {
    try {
      const results = await db.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USER_FAVORITES}
         WHERE user_id = ?`,
        [userId]
      );

      return results[0]?.count || 0;
    } catch (error) {
      console.error('[Favorites] Get count error:', error);
      return 0;
    }
  }

  /**
   * Clear all favorites
   */
  async clearAll(userId: string): Promise<boolean> {
    try {
      await db.delete(TABLE_NAMES.USER_FAVORITES, 'user_id = ?', [userId]);

      console.log('[Favorites] Cleared all favorites for user:', userId);
      return true;
    } catch (error) {
      console.error('[Favorites] Clear all error:', error);
      return false;
    }
  }
}

export const favoritesService = new FavoritesService();
