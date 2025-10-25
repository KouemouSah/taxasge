/**
 * TaxasGE Mobile - useDatabase Hook
 * Hook pour gérer l'initialisation et l'état de la base de données
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '../database/DatabaseManager';
import { syncService } from '../database/SyncService';

export interface DatabaseState {
  initialized: boolean;
  syncing: boolean;
  lastSync: string | null;
  error: string | null;
  stats: Record<string, number>;
}

export function useDatabase() {
  const [state, setState] = useState<DatabaseState>({
    initialized: false,
    syncing: false,
    lastSync: null,
    error: null,
    stats: {},
  });

  /**
   * Initialize database on mount
   */
  useEffect(() => {
    initDatabase();
  }, []);

  const initDatabase = async () => {
    try {
      console.log('[useDatabase] Initializing database...');
      await db.init();

      const lastSyncTime = await db.getMetadata('last_full_sync');
      const dbStats = await db.getStats();

      setState(prev => ({
        ...prev,
        initialized: true,
        lastSync: lastSyncTime,
        stats: dbStats,
        error: null,
      }));

      console.log('[useDatabase] Database initialized successfully');
    } catch (error) {
      console.error('[useDatabase] Initialization failed:', error);
      setState(prev => ({
        ...prev,
        initialized: false,
        error: error instanceof Error ? error.message : 'Database init failed',
      }));
    }
  };

  /**
   * Perform full sync
   */
  const sync = useCallback(async (userId?: string) => {
    setState(prev => ({ ...prev, syncing: true, error: null }));

    try {
      console.log('[useDatabase] Starting sync...');
      const result = await syncService.fullSync(userId);

      if (result.success) {
        const lastSyncTime = await db.getMetadata('last_full_sync');
        const dbStats = await db.getStats();

        setState(prev => ({
          ...prev,
          syncing: false,
          lastSync: lastSyncTime,
          stats: dbStats,
          error: null,
        }));

        console.log('[useDatabase] Sync complete:', result);
        return result;
      } else {
        throw new Error(result.errors.join(', '));
      }
    } catch (error) {
      console.error('[useDatabase] Sync failed:', error);
      setState(prev => ({
        ...prev,
        syncing: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
      throw error;
    }
  }, []);

  /**
   * Refresh database stats
   */
  const refreshStats = useCallback(async () => {
    try {
      const dbStats = await db.getStats();
      setState(prev => ({ ...prev, stats: dbStats }));
      return dbStats;
    } catch (error) {
      console.error('[useDatabase] Refresh stats failed:', error);
      return {};
    }
  }, []);

  /**
   * Reset database
   */
  const resetDatabase = useCallback(async () => {
    try {
      console.log('[useDatabase] Resetting database...');
      await db.clearAllData();
      await db.setMetadata('last_full_sync', '');

      setState(prev => ({
        ...prev,
        lastSync: null,
        stats: {},
      }));

      console.log('[useDatabase] Database reset complete');
    } catch (error) {
      console.error('[useDatabase] Reset failed:', error);
      throw error;
    }
  }, []);

  /**
   * Check if database needs sync (older than 24h)
   */
  const needsSync = useCallback((): boolean => {
    if (!state.lastSync) return true;

    const lastSyncDate = new Date(state.lastSync);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);

    return hoursSinceSync > 24;
  }, [state.lastSync]);

  return {
    // State
    initialized: state.initialized,
    syncing: state.syncing,
    lastSync: state.lastSync,
    error: state.error,
    stats: state.stats,

    // Actions
    sync,
    refreshStats,
    resetDatabase,
    needsSync,
  };
}
