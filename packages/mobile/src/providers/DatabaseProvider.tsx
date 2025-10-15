/**
 * TaxasGE Mobile - Database Provider
 * Initialise la base de données SQLite au démarrage de l'app
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { db } from '../database/DatabaseManager';
import { syncService } from '../database/SyncService';
import { loadChatbotFAQSeed } from '../database/seed/chatbotFaqSeed';

interface DatabaseContextValue {
  initialized: boolean;
  syncing: boolean;
  error: string | null;
  stats: Record<string, number>;
  sync: (userId?: string) => Promise<void>;
  resetDatabase: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue | undefined>(undefined);

export interface DatabaseProviderProps {
  children: React.ReactNode;
  autoSync?: boolean; // Auto-sync on init
  userId?: string; // User ID for initial sync
  onInitialized?: () => void;
  onError?: (error: Error) => void;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({
  children,
  autoSync = false,
  userId,
  onInitialized,
  onError,
}) => {
  const [initialized, setInitialized] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});

  /**
   * Initialize database on mount
   */
  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
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
        await performSync(userId);
      }

      onInitialized?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Database initialization failed';
      console.error('[DatabaseProvider] Initialization failed:', err);
      setError(errorMsg);
      onError?.(err instanceof Error ? err : new Error(errorMsg));
    }
  };

  /**
   * Check if auto-sync is needed
   */
  const shouldAutoSync = (dbStats: Record<string, number>): boolean => {
    // Sync if no fiscal services in database
    return (dbStats.fiscal_services || 0) === 0;
  };

  /**
   * Perform sync
   */
  const performSync = async (uid?: string) => {
    setSyncing(true);
    setError(null);

    try {
      console.log('[DatabaseProvider] Starting sync...');

      const isOnline = await syncService.isOnline();
      if (!isOnline) {
        console.warn('[DatabaseProvider] Device is offline, skipping sync');
        setSyncing(false);
        return;
      }

      const result = await syncService.fullSync(uid);

      if (result.success) {
        const dbStats = await db.getStats();
        setStats(dbStats);
        console.log('[DatabaseProvider] Sync complete:', result);
      } else {
        throw new Error(result.errors.join(', '));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed';
      console.error('[DatabaseProvider] Sync failed:', err);
      setError(errorMsg);
    } finally {
      setSyncing(false);
    }
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

      console.log('[DatabaseProvider] Database reset complete');
    } catch (err) {
      console.error('[DatabaseProvider] Reset failed:', err);
      throw err;
    }
  };

  const contextValue: DatabaseContextValue = {
    initialized,
    syncing,
    error,
    stats,
    sync: performSync,
    resetDatabase,
  };

  // Show loading screen while initializing
  if (!initialized && !error) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initialisation de la base de données...</Text>
        {syncing && <Text style={styles.syncText}>Synchronisation des données...</Text>}
      </View>
    );
  }

  // Show error screen if initialization failed
  if (error && !initialized) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erreur d'initialisation</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorHint}>Veuillez redémarrer l'application.</Text>
      </View>
    );
  }

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
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});
