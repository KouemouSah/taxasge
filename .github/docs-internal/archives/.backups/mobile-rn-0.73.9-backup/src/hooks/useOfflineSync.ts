/**
 * TaxasGE Mobile - useOfflineSync Hook
 * Hook pour gérer la synchronisation et la queue offline
 */

import {useState, useCallback, useEffect} from 'react';
import {syncService} from '../database/SyncService';
import {offlineQueueService} from '../database/OfflineQueueService';

export interface SyncState {
  online: boolean;
  syncing: boolean;
  queueStats: {
    total: number;
    pending: number;
    failed: number;
    byTable: Record<string, number>;
  };
  lastSync: string | null;
  error: string | null;
}

export function useOfflineSync(userId?: string) {
  const [state, setState] = useState<SyncState>({
    online: true,
    syncing: false,
    queueStats: {total: 0, pending: 0, failed: 0, byTable: {}},
    lastSync: null,
    error: null,
  });

  /**
   * Check online status
   */
  const checkOnlineStatus = useCallback(async () => {
    try {
      const isOnline = await syncService.isOnline();
      setState(prev => ({...prev, online: isOnline}));
      return isOnline;
    } catch (error) {
      console.error('[useOfflineSync] Check online status failed:', error);
      return false;
    }
  }, []);

  /**
   * Get queue statistics
   */
  const refreshQueueStats = useCallback(async () => {
    try {
      const stats = await offlineQueueService.getStats();
      setState(prev => ({...prev, queueStats: stats}));
      return stats;
    } catch (error) {
      console.error('[useOfflineSync] Refresh queue stats failed:', error);
      return {total: 0, pending: 0, failed: 0, byTable: {}};
    }
  }, []);

  /**
   * Perform full sync
   */
  const sync = useCallback(
    async (uid?: string) => {
      const targetUserId = uid || userId;

      setState(prev => ({...prev, syncing: true, error: null}));

      try {
        // Check if online first
        const isOnline = await syncService.isOnline();
        if (!isOnline) {
          throw new Error('Device is offline');
        }

        console.log('[useOfflineSync] Starting full sync...');

        // Perform full sync
        const result = await syncService.fullSync(targetUserId);

        if (!result.success) {
          throw new Error(result.errors.join(', '));
        }

        // Process offline queue
        await offlineQueueService.processQueue(targetUserId);

        // Refresh stats
        const stats = await offlineQueueService.getStats();

        setState(prev => ({
          ...prev,
          syncing: false,
          online: true,
          queueStats: stats,
          lastSync: new Date().toISOString(),
          error: null,
        }));

        console.log('[useOfflineSync] Sync complete:', result);
        return result;
      } catch (error) {
        console.error('[useOfflineSync] Sync failed:', error);
        setState(prev => ({
          ...prev,
          syncing: false,
          error: error instanceof Error ? error.message : 'Sync failed',
        }));
        throw error;
      }
    },
    [userId]
  );

  /**
   * Sync only reference data (no user data)
   */
  const syncReferenceData = useCallback(async () => {
    setState(prev => ({...prev, syncing: true, error: null}));

    try {
      const isOnline = await syncService.isOnline();
      if (!isOnline) {
        throw new Error('Device is offline');
      }

      console.log('[useOfflineSync] Syncing reference data...');

      const result = await syncService.syncReferenceData();

      setState(prev => ({
        ...prev,
        syncing: false,
        online: true,
        lastSync: new Date().toISOString(),
        error: null,
      }));

      console.log('[useOfflineSync] Reference data sync complete:', result);
      return result;
    } catch (error) {
      console.error('[useOfflineSync] Reference data sync failed:', error);
      setState(prev => ({
        ...prev,
        syncing: false,
        error:
          error instanceof Error
            ? error.message
            : 'Reference data sync failed',
      }));
      throw error;
    }
  }, []);

  /**
   * Process offline queue
   */
  const processQueue = useCallback(
    async (uid?: string) => {
      const targetUserId = uid || userId;

      setState(prev => ({...prev, syncing: true, error: null}));

      try {
        const isOnline = await syncService.isOnline();
        if (!isOnline) {
          console.log('[useOfflineSync] Device offline, skipping queue processing');
          setState(prev => ({...prev, syncing: false, online: false}));
          return {processed: 0, success: 0, failed: 0, skipped: 0, errors: []};
        }

        console.log('[useOfflineSync] Processing offline queue...');

        const result = await offlineQueueService.processQueue(targetUserId);

        // Refresh stats
        const stats = await offlineQueueService.getStats();

        setState(prev => ({
          ...prev,
          syncing: false,
          online: true,
          queueStats: stats,
          error: null,
        }));

        console.log('[useOfflineSync] Queue processing complete:', result);
        return result;
      } catch (error) {
        console.error('[useOfflineSync] Queue processing failed:', error);
        setState(prev => ({
          ...prev,
          syncing: false,
          error: error instanceof Error ? error.message : 'Queue processing failed',
        }));
        throw error;
      }
    },
    [userId]
  );

  /**
   * Clear failed queue items
   */
  const clearFailedItems = useCallback(async () => {
    try {
      const deleted = await offlineQueueService.clearFailedItems();

      // Refresh stats
      const stats = await offlineQueueService.getStats();
      setState(prev => ({...prev, queueStats: stats}));

      console.log('[useOfflineSync] Cleared failed items:', deleted);
      return deleted;
    } catch (error) {
      console.error('[useOfflineSync] Clear failed items error:', error);
      return 0;
    }
  }, []);

  /**
   * Retry failed item
   */
  const retryFailedItem = useCallback(async (itemId: number) => {
    try {
      await offlineQueueService.retryItem(itemId);

      // Refresh stats
      const stats = await offlineQueueService.getStats();
      setState(prev => ({...prev, queueStats: stats}));

      console.log('[useOfflineSync] Item retry queued:', itemId);
    } catch (error) {
      console.error('[useOfflineSync] Retry item failed:', error);
      throw error;
    }
  }, []);

  /**
   * Auto-check online status periodically
   */
  useEffect(() => {
    checkOnlineStatus();
    refreshQueueStats();

    const interval = setInterval(() => {
      checkOnlineStatus();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkOnlineStatus, refreshQueueStats]);

  /**
   * Auto-process queue when coming back online
   */
  useEffect(() => {
    if (state.online && state.queueStats.pending > 0 && !state.syncing) {
      console.log('[useOfflineSync] Device online with pending items, processing queue...');
      processQueue(userId);
    }
  }, [state.online, state.queueStats.pending, state.syncing, userId, processQueue]);

  return {
    // State
    online: state.online,
    syncing: state.syncing,
    queueStats: state.queueStats,
    lastSync: state.lastSync,
    error: state.error,

    // Actions
    sync,
    syncReferenceData,
    processQueue,
    checkOnlineStatus,
    refreshQueueStats,
    clearFailedItems,
    retryFailedItem,

    // Computed
    hasPendingItems: state.queueStats.pending > 0,
    hasFailedItems: state.queueStats.failed > 0,
  };
}
