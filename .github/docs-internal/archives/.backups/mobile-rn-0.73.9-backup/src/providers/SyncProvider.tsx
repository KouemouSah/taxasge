/**
 * TaxasGE Mobile - Sync Provider
 * Gère la synchronisation automatique et le statut online/offline
 */

import React, {createContext, useContext, useEffect, useState, useCallback} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {syncService} from '../database/SyncService';
import {offlineQueueService} from '../database/OfflineQueueService';

interface SyncContextValue {
  online: boolean;
  syncing: boolean;
  queuePending: number;
  queueFailed: number;
  lastSync: string | null;
  error: string | null;
  sync: (userId?: string) => Promise<void>;
  processQueue: (userId?: string) => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export interface SyncProviderProps {
  children: React.ReactNode;
  userId?: string;
  autoSyncInterval?: number; // Minutes (default: 360 = 6h)
  onSyncComplete?: () => void;
  onError?: (error: Error) => void;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({
  children,
  userId,
  autoSyncInterval = 360, // 6 hours default
  onSyncComplete,
  onError,
}) => {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [queuePending, setQueuePending] = useState(0);
  const [queueFailed, setQueueFailed] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Monitor network status
   */
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      const isOnline = state.isConnected === true && state.isInternetReachable === true;

      console.log('[SyncProvider] Network status:', {
        connected: state.isConnected,
        reachable: state.isInternetReachable,
        online: isOnline,
      });

      setOnline(isOnline);

      // Auto-process queue when coming back online
      if (isOnline && queuePending > 0) {
        console.log('[SyncProvider] Back online with pending items, processing queue...');
        processQueue(userId);
      }
    });

    return () => unsubscribe();
  }, [queuePending, userId]);

  /**
   * Refresh queue stats periodically
   */
  useEffect(() => {
    refreshQueueStats();

    const interval = setInterval(() => {
      refreshQueueStats();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  /**
   * Auto-sync periodically
   */
  useEffect(() => {
    if (!autoSyncInterval || autoSyncInterval <= 0) return;

    const interval = setInterval(() => {
      if (online && !syncing) {
        console.log('[SyncProvider] Auto-sync triggered');
        performSync(userId);
      }
    }, autoSyncInterval * 60 * 1000); // Convert minutes to ms

    return () => clearInterval(interval);
  }, [online, syncing, autoSyncInterval, userId]);

  /**
   * Refresh queue statistics
   */
  const refreshQueueStats = async () => {
    try {
      const stats = await offlineQueueService.getStats();
      setQueuePending(stats.pending);
      setQueueFailed(stats.failed);
    } catch (err) {
      console.error('[SyncProvider] Refresh queue stats failed:', err);
    }
  };

  /**
   * Perform sync
   */
  const performSync = useCallback(async (uid?: string) => {
    if (syncing) {
      console.log('[SyncProvider] Sync already in progress');
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const isOnline = await syncService.isOnline();
      if (!isOnline) {
        console.warn('[SyncProvider] Device is offline, skipping sync');
        setSyncing(false);
        return;
      }

      console.log('[SyncProvider] Starting sync...');

      const result = await syncService.fullSync(uid);

      if (result.success) {
        setLastSync(new Date().toISOString());
        console.log('[SyncProvider] Sync complete:', result);
        onSyncComplete?.();
      } else {
        throw new Error(result.errors.join(', '));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed';
      console.error('[SyncProvider] Sync failed:', err);
      setError(errorMsg);
      onError?.(err instanceof Error ? err : new Error(errorMsg));
    } finally {
      setSyncing(false);
    }
  }, [syncing, onSyncComplete, onError]);

  /**
   * Process offline queue
   */
  const processQueue = useCallback(async (uid?: string) => {
    if (syncing) {
      console.log('[SyncProvider] Sync already in progress');
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const isOnline = await syncService.isOnline();
      if (!isOnline) {
        console.warn('[SyncProvider] Device is offline, skipping queue processing');
        setSyncing(false);
        return;
      }

      console.log('[SyncProvider] Processing offline queue...');

      const result = await offlineQueueService.processQueue(uid);

      console.log('[SyncProvider] Queue processing complete:', result);

      // Refresh stats
      await refreshQueueStats();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Queue processing failed';
      console.error('[SyncProvider] Queue processing failed:', err);
      setError(errorMsg);
      onError?.(err instanceof Error ? err : new Error(errorMsg));
    } finally {
      setSyncing(false);
    }
  }, [syncing, onError]);

  const contextValue: SyncContextValue = {
    online,
    syncing,
    queuePending,
    queueFailed,
    lastSync,
    error,
    sync: performSync,
    processQueue,
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};

/**
 * Hook to use sync context
 */
export const useSyncContext = (): SyncContextValue => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};
