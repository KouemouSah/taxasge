/**
 * TaxasGE Mobile - Sync Service
 * Service de synchronisation bidirectionnelle SQLite <-> Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import NetInfo from '@react-native-community/netinfo';
import { db } from './DatabaseManager';
import { TABLE_NAMES, SYNC_STATUS } from './schema';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

interface SyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  errors: string[];
}

interface FiscalService {
  id: string;
  code: string;
  name_es: string;
  name_fr?: string;
  name_en?: string;
  service_type?: string;
  expedition_amount?: number;
  category_id?: string;
  [key: string]: any;
}

class SyncService {
  private supabase: SupabaseClient;
  private isSyncing: boolean = false;
  private lastSyncTimestamp: string | null = null;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  }

  /**
   * Sync all reference data (ministries, services, etc.)
   */
  async syncReferenceData(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        inserted: 0,
        updated: 0,
        deleted: 0,
        errors: ['Sync already in progress'],
      };
    }

    const online = await this.isOnline();
    if (!online) {
      return {
        success: false,
        inserted: 0,
        updated: 0,
        deleted: 0,
        errors: ['Device is offline'],
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      inserted: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      console.log('[Sync] Starting reference data sync...');

      // Get last sync timestamp
      this.lastSyncTimestamp = await db.getMetadata('last_full_sync');
      const since = this.lastSyncTimestamp ? new Date(this.lastSyncTimestamp) : null;

      console.log('[Sync] Last sync:', since?.toISOString() || 'never');

      // 1. Sync ministries
      await this.syncTable('ministries', result, since);

      // 2. Sync sectors
      await this.syncTable('sectors', result, since);

      // 3. Sync categories
      await this.syncTable('categories', result, since);

      // 4. Sync fiscal services
      await this.syncFiscalServices(result, since);

      // 5. Sync required documents
      await this.syncTable('required_documents', result, since);

      // 6. Sync service procedures
      await this.syncTable('service_procedures', result, since);

      // 7. Sync service keywords
      await this.syncTable('service_keywords', result, since);

      // Update last sync timestamp
      await db.setMetadata('last_full_sync', new Date().toISOString());

      console.log('[Sync] Reference data sync complete:', result);
    } catch (error) {
      console.error('[Sync] Reference data sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Sync a single table
   */
  private async syncTable(
    tableName: string,
    result: SyncResult,
    since: Date | null
  ): Promise<void> {
    try {
      console.log(`[Sync] Syncing ${tableName}...`);

      let query = this.supabase.from(tableName).select('*');

      if (since) {
        query = query.gte('updated_at', since.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Map Supabase fields to SQLite fields
        const mapped = data.map(item => ({
          ...item,
          is_active: item.is_active ? 1 : 0,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        }));

        await db.insertBatch(tableName, mapped);
        result.inserted += mapped.length;

        console.log(`[Sync] ${tableName}: ${mapped.length} rows synced`);
      } else {
        console.log(`[Sync] ${tableName}: No changes`);
      }
    } catch (error) {
      console.error(`[Sync] Error syncing ${tableName}:`, error);
      result.errors.push(`${tableName}: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Sync fiscal services with FTS update
   */
  private async syncFiscalServices(result: SyncResult, since: Date | null): Promise<void> {
    try {
      console.log('[Sync] Syncing fiscal services...');

      let query = this.supabase.from('fiscal_services').select('*');

      if (since) {
        query = query.gte('updated_at', since.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const mapped = data.map((item: FiscalService) => ({
          id: item.id,
          code: item.code,
          category_id: item.category_id || null,
          name_es: item.name_es,
          name_fr: item.name_fr || null,
          name_en: item.name_en || null,
          description_es: item.description_es || null,
          description_fr: item.description_fr || null,
          description_en: item.description_en || null,
          service_type: item.service_type || 'other',
          expedition_amount: item.expedition_amount || 0,
          renewal_amount: item.renewal_amount || 0,
          urgent_amount: item.urgent_amount || 0,
          currency: item.currency || 'XAF',
          processing_time_days: item.processing_time_days || null,
          processing_time_text: item.processing_time_text || null,
          urgent_processing_days: item.urgent_processing_days || null,
          is_online_available: item.is_online_available ? 1 : 0,
          is_urgent_available: item.is_urgent_available ? 1 : 0,
          is_active: item.is_active ? 1 : 0,
          popularity_score: item.popularity_score || 0,
          last_updated: item.last_updated || item.updated_at,
          created_at: item.created_at || new Date().toISOString(),
        }));

        await db.insertBatch('fiscal_services', mapped);
        result.inserted += mapped.length;

        console.log(`[Sync] fiscal_services: ${mapped.length} rows synced`);
      } else {
        console.log('[Sync] fiscal_services: No changes');
      }
    } catch (error) {
      console.error('[Sync] Error syncing fiscal_services:', error);
      result.errors.push(`fiscal_services: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Sync user favorites to Supabase
   */
  async syncFavorites(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      inserted: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      const online = await this.isOnline();
      if (!online) {
        console.log('[Sync] Offline - favorites will sync later');
        return result;
      }

      // Get unsynced favorites
      const favorites = await db.query<{
        id: number;
        fiscal_service_id: string;
        notes: string | null;
        tags: string | null;
        added_at: string;
      }>(
        `SELECT * FROM ${TABLE_NAMES.USER_FAVORITES}
         WHERE user_id = ? AND synced = ?`,
        [userId, SYNC_STATUS.PENDING]
      );

      if (favorites.length === 0) {
        console.log('[Sync] No favorites to sync');
        return result;
      }

      console.log(`[Sync] Syncing ${favorites.length} favorites...`);

      // Sync each favorite
      for (const favorite of favorites) {
        try {
          const { error } = await this.supabase.from('user_favorites').upsert({
            user_id: userId,
            fiscal_service_id: favorite.fiscal_service_id,
            notes: favorite.notes,
            tags: favorite.tags,
            added_at: favorite.added_at,
          });

          if (error) {
            throw error;
          }

          // Mark as synced
          await db.update(
            TABLE_NAMES.USER_FAVORITES,
            {
              synced: SYNC_STATUS.SYNCED,
              sync_timestamp: new Date().toISOString(),
            },
            'id = ?',
            [favorite.id]
          );

          result.inserted++;
        } catch (error) {
          console.error('[Sync] Error syncing favorite:', error);
          result.errors.push(
            `Favorite ${favorite.id}: ${error instanceof Error ? error.message : 'Unknown'}`
          );
        }
      }

      console.log('[Sync] Favorites sync complete:', result);
    } catch (error) {
      console.error('[Sync] Favorites sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Sync calculations history to Supabase
   */
  async syncCalculationsHistory(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      inserted: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    try {
      const online = await this.isOnline();
      if (!online) {
        console.log('[Sync] Offline - calculations will sync later');
        return result;
      }

      // Get unsynced calculations
      const calculations = await db.query<any>(
        `SELECT * FROM ${TABLE_NAMES.CALCULATIONS_HISTORY}
         WHERE user_id = ? AND synced = ?`,
        [userId, SYNC_STATUS.PENDING]
      );

      if (calculations.length === 0) {
        console.log('[Sync] No calculations to sync');
        return result;
      }

      console.log(`[Sync] Syncing ${calculations.length} calculations...`);

      // Sync each calculation
      for (const calc of calculations) {
        try {
          const { error } = await this.supabase.from('calculations_history').insert({
            user_id: userId,
            fiscal_service_id: calc.fiscal_service_id,
            calculation_base: calc.calculation_base,
            calculated_amount: calc.calculated_amount,
            payment_type: calc.payment_type,
            parameters: calc.parameters,
            breakdown: calc.breakdown,
            calculated_at: calc.calculated_at,
          });

          if (error) {
            throw error;
          }

          // Mark as synced
          await db.update(
            TABLE_NAMES.CALCULATIONS_HISTORY,
            { synced: SYNC_STATUS.SYNCED },
            'id = ?',
            [calc.id]
          );

          result.inserted++;
        } catch (error) {
          console.error('[Sync] Error syncing calculation:', error);
          result.errors.push(
            `Calculation ${calc.id}: ${error instanceof Error ? error.message : 'Unknown'}`
          );
        }
      }

      console.log('[Sync] Calculations sync complete:', result);
    } catch (error) {
      console.error('[Sync] Calculations sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Full sync (all data)
   */
  async fullSync(userId?: string): Promise<SyncResult> {
    console.log('[Sync] Starting full sync...');

    // Sync reference data
    const refResult = await this.syncReferenceData();

    if (!userId) {
      return refResult;
    }

    // Sync user data
    const favResult = await this.syncFavorites(userId);
    const calcResult = await this.syncCalculationsHistory(userId);

    return {
      success: refResult.success && favResult.success && calcResult.success,
      inserted: refResult.inserted + favResult.inserted + calcResult.inserted,
      updated: refResult.updated + favResult.updated + calcResult.updated,
      deleted: refResult.deleted + favResult.deleted + calcResult.deleted,
      errors: [...refResult.errors, ...favResult.errors, ...calcResult.errors],
    };
  }
}

// Export singleton instance
export const syncService = new SyncService();

// Export for testing
export { SyncService };
