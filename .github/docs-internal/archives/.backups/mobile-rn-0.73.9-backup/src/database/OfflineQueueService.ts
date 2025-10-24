/**
 * TaxasGE Mobile - Offline Queue Service
 * Gère la queue des opérations offline pour synchronisation différée
 */

import {db} from './DatabaseManager';
import {TABLE_NAMES, SYNC_STATUS, MAX_SYNC_RETRIES} from './schema';
import {syncService} from './SyncService';

export type QueueOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface QueueItem {
  id?: number;
  table_name: string;
  record_id: string;
  operation: QueueOperation;
  data: string; // JSON stringified
  created_at?: string;
  retry_count?: number;
  last_error?: string | null;
}

export interface ProcessResult {
  processed: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{id: number; error: string}>;
}

class OfflineQueueService {
  private isProcessing: boolean = false;

  /**
   * Add operation to queue
   */
  async enqueue(
    tableName: string,
    recordId: string,
    operation: QueueOperation,
    data: Record<string, any>
  ): Promise<number> {
    try {
      const dataJson = JSON.stringify(data);

      const id = await db.insert(TABLE_NAMES.SYNC_QUEUE, {
        table_name: tableName,
        record_id: recordId,
        operation,
        data: dataJson,
        retry_count: 0,
        last_error: null,
      });

      console.log(
        `[OfflineQueue] Enqueued ${operation} for ${tableName}:${recordId}`
      );

      return id;
    } catch (error) {
      console.error('[OfflineQueue] Enqueue failed:', error);
      throw error;
    }
  }

  /**
   * Get pending queue items
   */
  async getPendingItems(limit: number = 100): Promise<QueueItem[]> {
    try {
      const items = await db.query<QueueItem>(
        `SELECT * FROM ${TABLE_NAMES.SYNC_QUEUE}
         WHERE retry_count < ?
         ORDER BY created_at ASC
         LIMIT ?`,
        [MAX_SYNC_RETRIES, limit]
      );

      return items;
    } catch (error) {
      console.error('[OfflineQueue] Get pending items failed:', error);
      return [];
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    failed: number;
    byTable: Record<string, number>;
  }> {
    try {
      const totalResult = await db.query<{count: number}>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.SYNC_QUEUE}`
      );

      const pendingResult = await db.query<{count: number}>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.SYNC_QUEUE}
         WHERE retry_count < ?`,
        [MAX_SYNC_RETRIES]
      );

      const failedResult = await db.query<{count: number}>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.SYNC_QUEUE}
         WHERE retry_count >= ?`,
        [MAX_SYNC_RETRIES]
      );

      const byTableResult = await db.query<{
        table_name: string;
        count: number;
      }>(
        `SELECT table_name, COUNT(*) as count
         FROM ${TABLE_NAMES.SYNC_QUEUE}
         GROUP BY table_name`
      );

      const byTable: Record<string, number> = {};
      byTableResult.forEach(row => {
        byTable[row.table_name] = row.count;
      });

      return {
        total: totalResult[0]?.count || 0,
        pending: pendingResult[0]?.count || 0,
        failed: failedResult[0]?.count || 0,
        byTable,
      };
    } catch (error) {
      console.error('[OfflineQueue] Get stats failed:', error);
      return {total: 0, pending: 0, failed: 0, byTable: {}};
    }
  }

  /**
   * Process queue (sync with Supabase)
   */
  async processQueue(userId?: string): Promise<ProcessResult> {
    if (this.isProcessing) {
      console.log('[OfflineQueue] Already processing');
      return {processed: 0, success: 0, failed: 0, skipped: 0, errors: []};
    }

    const online = await syncService.isOnline();
    if (!online) {
      console.log('[OfflineQueue] Device offline, skipping queue processing');
      return {processed: 0, success: 0, failed: 0, skipped: 0, errors: []};
    }

    this.isProcessing = true;
    const result: ProcessResult = {
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    try {
      console.log('[OfflineQueue] Starting queue processing...');

      const items = await this.getPendingItems();

      if (items.length === 0) {
        console.log('[OfflineQueue] Queue is empty');
        return result;
      }

      console.log(`[OfflineQueue] Processing ${items.length} items...`);

      for (const item of items) {
        result.processed++;

        try {
          await this.processItem(item, userId);
          result.success++;

          // Remove from queue on success
          await db.delete(TABLE_NAMES.SYNC_QUEUE, 'id = ?', [item.id!]);
        } catch (error) {
          result.failed++;
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';

          result.errors.push({
            id: item.id!,
            error: errorMsg,
          });

          // Update retry count and error
          await db.update(
            TABLE_NAMES.SYNC_QUEUE,
            {
              retry_count: (item.retry_count || 0) + 1,
              last_error: errorMsg,
            },
            'id = ?',
            [item.id!]
          );

          console.error(
            `[OfflineQueue] Item ${item.id} failed:`,
            errorMsg
          );
        }
      }

      console.log('[OfflineQueue] Processing complete:', result);
    } catch (error) {
      console.error('[OfflineQueue] Queue processing failed:', error);
    } finally {
      this.isProcessing = false;
    }

    return result;
  }

  /**
   * Process single queue item
   */
  private async processItem(
    item: QueueItem,
    userId?: string
  ): Promise<void> {
    const data = JSON.parse(item.data);

    console.log(
      `[OfflineQueue] Processing ${item.operation} for ${item.table_name}:${item.record_id}`
    );

    // Route to appropriate sync method based on table
    switch (item.table_name) {
      case TABLE_NAMES.USER_FAVORITES:
        await this.syncFavorite(item, data, userId);
        break;

      case TABLE_NAMES.CALCULATIONS_HISTORY:
        await this.syncCalculation(item, data, userId);
        break;

      default:
        console.warn(
          `[OfflineQueue] Unknown table for sync: ${item.table_name}`
        );
        throw new Error(`Unsupported table: ${item.table_name}`);
    }
  }

  /**
   * Sync favorite to Supabase
   */
  private async syncFavorite(
    item: QueueItem,
    data: any,
    userId?: string
  ): Promise<void> {
    if (!userId) {
      throw new Error('User ID required for favorites sync');
    }

    // Use syncService to handle the actual sync
    const result = await syncService.syncFavorites(userId);

    if (!result.success) {
      throw new Error(result.errors.join(', '));
    }
  }

  /**
   * Sync calculation to Supabase
   */
  private async syncCalculation(
    item: QueueItem,
    data: any,
    userId?: string
  ): Promise<void> {
    if (!userId) {
      throw new Error('User ID required for calculations sync');
    }

    // Use syncService to handle the actual sync
    const result = await syncService.syncCalculationsHistory(userId);

    if (!result.success) {
      throw new Error(result.errors.join(', '));
    }
  }

  /**
   * Clear failed items (retry_count >= MAX_RETRIES)
   */
  async clearFailedItems(): Promise<number> {
    try {
      const deleted = await db.delete(
        TABLE_NAMES.SYNC_QUEUE,
        'retry_count >= ?',
        [MAX_SYNC_RETRIES]
      );

      console.log(`[OfflineQueue] Cleared ${deleted} failed items`);
      return deleted;
    } catch (error) {
      console.error('[OfflineQueue] Clear failed items error:', error);
      return 0;
    }
  }

  /**
   * Clear all queue items (dangerous - use with caution)
   */
  async clearAllItems(): Promise<number> {
    try {
      const deleted = await db.delete(TABLE_NAMES.SYNC_QUEUE, '1=1', []);

      console.log(`[OfflineQueue] Cleared ${deleted} items from queue`);
      return deleted;
    } catch (error) {
      console.error('[OfflineQueue] Clear all items error:', error);
      return 0;
    }
  }

  /**
   * Retry failed item by ID
   */
  async retryItem(itemId: number): Promise<void> {
    try {
      await db.update(
        TABLE_NAMES.SYNC_QUEUE,
        {
          retry_count: 0,
          last_error: null,
        },
        'id = ?',
        [itemId]
      );

      console.log(`[OfflineQueue] Reset retry count for item ${itemId}`);
    } catch (error) {
      console.error('[OfflineQueue] Retry item error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const offlineQueueService = new OfflineQueueService();

// Export for testing
export {OfflineQueueService};
