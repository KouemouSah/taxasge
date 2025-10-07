/**
 * TaxasGE Mobile - Database Exports
 * Point d'entrée centralisé pour toutes les fonctionnalités DB
 */

// Core imports (pour usage interne)
import {db, DatabaseManager} from './DatabaseManager';
import {syncService, SyncService} from './SyncService';
import {offlineQueueService, OfflineQueueService} from './OfflineQueueService';

// Core exports
export {db, DatabaseManager} from './DatabaseManager';
export {syncService, SyncService} from './SyncService';
export {offlineQueueService, OfflineQueueService} from './OfflineQueueService';
export * from './schema';

// Services
export {fiscalServicesService} from './services/FiscalServicesService';
export {favoritesService} from './services/FavoritesService';
export {calculationsService} from './services/CalculationsService';

// Types
export type {FiscalService, SearchFilters} from './services/FiscalServicesService';
export type {Favorite} from './services/FavoritesService';
export type {
  Calculation,
  CalculationParams,
  CalculationBreakdown,
} from './services/CalculationsService';
export type {QueueItem, ProcessResult} from './OfflineQueueService';

/**
 * Initialize database on app start
 * Usage:
 *
 * import {initDatabase} from '@/database';
 *
 * await initDatabase();
 */
export async function initDatabase(): Promise<void> {
  await db.init();
  console.log('[Database] Initialized successfully');
}

/**
 * Perform initial sync
 */
export async function performInitialSync(userId?: string): Promise<void> {
  console.log('[Database] Starting initial sync...');
  const result = await syncService.fullSync(userId);

  if (result.success) {
    console.log('[Database] Initial sync complete:', result);
  } else {
    console.error('[Database] Initial sync failed:', result.errors);
    throw new Error(`Sync failed: ${result.errors.join(', ')}`);
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<Record<string, number>> {
  return await db.getStats();
}

/**
 * Reset database (clear all data)
 */
export async function resetDatabase(): Promise<void> {
  console.log('[Database] Resetting database...');
  await db.clearAllData();
  await db.setMetadata('last_full_sync', '');
  console.log('[Database] Database reset complete');
}
