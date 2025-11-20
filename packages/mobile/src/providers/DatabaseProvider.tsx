/**
 * TaxasGE Mobile - Database Provider
 * Initialise la base de données SQLite au démarrage de l'app
 *
 * UPDATED 2025-11-06:
 * - Progressive sync with 3 phases
 * - Non-blocking (allows onboarding to show)
 * - Retry logic with exponential backoff
 * - Phase completion callbacks
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { db } from '../database/DatabaseManager';
import { syncService } from '../database/SyncService';
import { loadChatbotFAQSeed } from '../database/seed/chatbotFaqSeed';

interface DatabaseContextValue {
  initialized: boolean;
  syncing: boolean;
  syncPhase: number; // 0 = not started, 1-3 = phase number
  syncComplete: boolean;
  error: string | null;
  stats: Record<string, number>;
  sync: (userId?: string) => Promise<void>;
  resetDatabase: () => Promise<void>;
  retrySync: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue | undefined>(undefined);

export interface DatabaseProviderProps {
  children: React.ReactNode;
  autoSync?: boolean; // Auto-sync on init
  progressive?: boolean; // Use progressive sync (default: true)
  userId?: string; // User ID for initial sync
  onInitialized?: () => void;
  onSyncPhaseComplete?: (phase: 1 | 2 | 3) => void;
  onSyncComplete?: () => void;
  onError?: (error: Error) => void;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({
  children,
  autoSync = false,
  progressive = true,
  userId,
  onInitialized,
  onSyncPhaseComplete,
  onSyncComplete,
  onError,
}) => {
  const [initialized, setInitialized] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncPhase, setSyncPhase] = useState(0);
  const [syncComplete, setSyncComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [retryCount, setRetryCount] = useState(0);

  const initializeDatabase = useCallback(async () => {
    try {
      console.log('[DatabaseProvider] Initializing database...');

      // Initialize SQLite database
      await db.init();

      // Load chatbot FAQ seed data (if not already loaded)
      await loadChatbotFAQSeed(db);

      // Get initial stats
      const dbStats = await db.getStats();
      setStats(dbStats);

      setInitialized(true);
      setError(null);

      console.log('[DatabaseProvider] Database initialized successfully');
      console.log('[DatabaseProvider] Stats:', dbStats);

      // Auto-sync if enabled and data is empty
      if (autoSync && shouldAutoSync(dbStats)) {
        console.log('[DatabaseProvider] Auto-syncing reference data...');

        // Start sync in background (non-blocking)
        setTimeout(() => {
          performSync(userId);
        }, 100);
      } else if (dbStats.fiscal_services > 0) {
        // Data already exists, mark sync as complete
        setSyncComplete(true);
      }

      onInitialized?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Database initialization failed';
      console.error('[DatabaseProvider] Initialization failed:', err);
      setError(errorMsg);
      onError?.(err instanceof Error ? err : new Error(errorMsg));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync, userId, onInitialized, onError]);

  /**
   * Initialize database on mount
   */
  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  /**
   * Check if auto-sync is needed
   */
  const shouldAutoSync = (dbStats: Record<string, number>): boolean => {
    // Sync if no fiscal services in database
    return (dbStats.fiscal_services || 0) === 0;
  };

  /**
   * Perform sync with retry logic
   */
  const performSync = async (uid?: string, isRetry: boolean = false) => {
    if (syncing) {
      console.log('[DatabaseProvider] Sync already in progress, skipping');
      return;
    }

    setSyncing(true);
    setError(null);
    setSyncPhase(0);

    try {
      console.log('[DatabaseProvider] Starting sync...');

      const isOnline = await syncService.isOnline();
      if (!isOnline) {
        throw new Error('Device is offline. Please check your internet connection.');
      }

      if (progressive) {
        // Progressive sync with phase callbacks
        const result = await syncService.progressiveSync((phase, phaseResult) => {
          console.log(`[DatabaseProvider] Phase ${phase} complete:`, phaseResult);
          setSyncPhase(phase);
          onSyncPhaseComplete?.(phase);
        });

        if (result.success) {
          const dbStats = await db.getStats();
          setStats(dbStats);
          setSyncComplete(true);
          setRetryCount(0); // Reset retry count on success
          console.log('[DatabaseProvider] Progressive sync complete:', result);
          onSyncComplete?.();
        } else {
          throw new Error(result.errors.join(', '));
        }
      } else {
        // Full sync (legacy)
        const result = await syncService.fullSync(uid);

        if (result.success) {
          const dbStats = await db.getStats();
          setStats(dbStats);
          setSyncComplete(true);
          setRetryCount(0);
          console.log('[DatabaseProvider] Sync complete:', result);
          onSyncComplete?.();
        } else {
          throw new Error(result.errors.join(', '));
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed';
      console.error('[DatabaseProvider] Sync failed:', err);

      // Retry logic with exponential backoff
      if (!isRetry && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
        console.log(`[DatabaseProvider] Retrying in ${delay/1000}s... (Attempt ${retryCount + 1}/3)`);

        setRetryCount(retryCount + 1);

        setTimeout(() => {
          performSync(uid, true);
        }, delay);
      } else {
        // Max retries reached or manual retry
        setError(errorMsg);
        onError?.(err instanceof Error ? err : new Error(errorMsg));
      }
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Retry sync manually
   */
  const retrySync = async () => {
    setRetryCount(0); // Reset retry count
    setError(null);
    await performSync(userId, false);
  };

  /**
   * Reset database
   */
  const resetDatabase = async () => {
    try {
      console.log('[DatabaseProvider] Resetting database...');
      await db.clearAllData();
      await db.setMetadata('last_full_sync', '');

      const dbStats = await db.getStats();
      setStats(dbStats);
      setSyncComplete(false);
      setSyncPhase(0);

      console.log('[DatabaseProvider] Database reset complete');
    } catch (err) {
      console.error('[DatabaseProvider] Reset failed:', err);
      throw err;
    }
  };

  const contextValue: DatabaseContextValue = {
    initialized,
    syncing,
    syncPhase,
    syncComplete,
    error,
    stats,
    sync: performSync,
    resetDatabase,
    retrySync,
  };

  // Show loading screen while initializing (ONLY DB init, not sync)
  if (!initialized && !error) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#004aad" />
        <Text style={styles.loadingText}>Initialisation de la base de données...</Text>
      </View>
    );
  }

  // Show error screen if initialization failed
  if (error && !initialized) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>❌ Erreur d'initialisation</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retrySync}>
          <Text style={styles.retryButtonText}>🔄 Réessayer</Text>
        </TouchableOpacity>
        <Text style={styles.errorHint}>
          {retryCount > 0 ? `Tentative ${retryCount}/3` : 'Vérifiez votre connexion internet'}
        </Text>
      </View>
    );
  }

  // Render children immediately (non-blocking)
  // Sync happens in background
  return <DatabaseContext.Provider value={contextValue}>{children}</DatabaseContext.Provider>;
};

/**
 * Hook to use database context
 */
export const useDatabaseContext = (): DatabaseContextValue => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  syncText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#004aad',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorHint: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});
