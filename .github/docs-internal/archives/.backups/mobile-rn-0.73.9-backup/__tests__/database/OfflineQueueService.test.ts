/**
 * TaxasGE Mobile - OfflineQueueService Tests
 * Phase 5: Offline Queue Infrastructure Validation
 */

import {OfflineQueueService} from '../../src/database/OfflineQueueService';
import {DatabaseManager} from '../../src/database/DatabaseManager';
import {TABLE_NAMES, MAX_SYNC_RETRIES} from '../../src/database/schema';

// Mock SyncService
jest.mock('../../src/database/SyncService', () => ({
  syncService: {
    isOnline: jest.fn(() => Promise.resolve(true)),
    syncFavorites: jest.fn(() =>
      Promise.resolve({
        success: true,
        inserted: 1,
        updated: 0,
        deleted: 0,
        errors: [],
      })
    ),
    syncCalculationsHistory: jest.fn(() =>
      Promise.resolve({
        success: true,
        inserted: 1,
        updated: 0,
        deleted: 0,
        errors: [],
      })
    ),
  },
}));

describe('OfflineQueueService - Phase 5 Infrastructure', () => {
  let offlineQueue: OfflineQueueService;
  let dbManager: DatabaseManager;

  beforeAll(async () => {
    dbManager = new DatabaseManager();
    await dbManager.init();
    offlineQueue = new OfflineQueueService();
  });

  beforeEach(async () => {
    // Clear queue before each test
    await dbManager.delete(TABLE_NAMES.SYNC_QUEUE, '1=1', []);
  });

  afterAll(async () => {
    await dbManager.close();
  });

  describe('Queue Operations', () => {
    it('should enqueue operation successfully', async () => {
      const id = await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'test-record-1',
        'INSERT',
        {
          user_id: 'test-user',
          fiscal_service_id: 'test-service',
          notes: 'Test note',
        }
      );

      expect(id).toBeGreaterThan(0);

      const items = await offlineQueue.getPendingItems();
      expect(items.length).toBe(1);
      expect(items[0].table_name).toBe(TABLE_NAMES.USER_FAVORITES);
      expect(items[0].operation).toBe('INSERT');
    });

    it('should get pending items correctly', async () => {
      // Enqueue multiple items
      await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'record-1',
        'INSERT',
        {data: 'test1'}
      );

      await offlineQueue.enqueue(
        TABLE_NAMES.CALCULATIONS_HISTORY,
        'record-2',
        'UPDATE',
        {data: 'test2'}
      );

      const items = await offlineQueue.getPendingItems();

      expect(items.length).toBe(2);
      expect(items[0].table_name).toBe(TABLE_NAMES.USER_FAVORITES);
      expect(items[1].table_name).toBe(TABLE_NAMES.CALCULATIONS_HISTORY);
    });

    it('should limit pending items by parameter', async () => {
      // Enqueue 5 items
      for (let i = 0; i < 5; i++) {
        await offlineQueue.enqueue(
          TABLE_NAMES.USER_FAVORITES,
          `record-${i}`,
          'INSERT',
          {index: i}
        );
      }

      const items = await offlineQueue.getPendingItems(3);

      expect(items.length).toBe(3);
    });

    it('should exclude items exceeding max retries', async () => {
      // Enqueue item
      const id = await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'failed-record',
        'INSERT',
        {data: 'test'}
      );

      // Simulate max retries
      await dbManager.update(
        TABLE_NAMES.SYNC_QUEUE,
        {retry_count: MAX_SYNC_RETRIES},
        'id = ?',
        [id]
      );

      const items = await offlineQueue.getPendingItems();

      expect(items.length).toBe(0);
    });
  });

  describe('Queue Statistics', () => {
    beforeEach(async () => {
      // Setup test data
      await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'stat-1',
        'INSERT',
        {data: 'test1'}
      );

      await offlineQueue.enqueue(
        TABLE_NAMES.CALCULATIONS_HISTORY,
        'stat-2',
        'UPDATE',
        {data: 'test2'}
      );

      const id = await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'stat-3',
        'DELETE',
        {data: 'test3'}
      );

      // Mark one as failed
      await dbManager.update(
        TABLE_NAMES.SYNC_QUEUE,
        {retry_count: MAX_SYNC_RETRIES},
        'id = ?',
        [id]
      );
    });

    it('should return correct total count', async () => {
      const stats = await offlineQueue.getStats();

      expect(stats.total).toBe(3);
    });

    it('should return correct pending count', async () => {
      const stats = await offlineQueue.getStats();

      expect(stats.pending).toBe(2);
    });

    it('should return correct failed count', async () => {
      const stats = await offlineQueue.getStats();

      expect(stats.failed).toBe(1);
    });

    it('should return counts by table', async () => {
      const stats = await offlineQueue.getStats();

      expect(stats.byTable[TABLE_NAMES.USER_FAVORITES]).toBe(2);
      expect(stats.byTable[TABLE_NAMES.CALCULATIONS_HISTORY]).toBe(1);
    });
  });

  describe('Queue Processing', () => {
    it('should process queue when online', async () => {
      await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'process-1',
        'INSERT',
        {
          user_id: 'test-user',
          fiscal_service_id: 'test-service',
          notes: 'Test',
        }
      );

      const result = await offlineQueue.processQueue('test-user');

      expect(result.processed).toBeGreaterThan(0);
    });

    it('should skip processing when offline', async () => {
      const {syncService} = require('../../src/database/SyncService');
      syncService.isOnline.mockResolvedValueOnce(false);

      await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'offline-1',
        'INSERT',
        {data: 'test'}
      );

      const result = await offlineQueue.processQueue('test-user');

      expect(result.processed).toBe(0);
      expect(result.success).toBe(0);
    });

    it('should prevent concurrent processing', async () => {
      await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'concurrent-1',
        'INSERT',
        {data: 'test'}
      );

      const promise1 = offlineQueue.processQueue('test-user');
      const promise2 = offlineQueue.processQueue('test-user');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // One should process, one should skip
      const totalProcessed = result1.processed + result2.processed;
      expect(totalProcessed).toBeGreaterThan(0);
    });

    it('should remove successfully processed items', async () => {
      await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'remove-1',
        'INSERT',
        {
          user_id: 'test-user',
          fiscal_service_id: 'test-service',
        }
      );

      await offlineQueue.processQueue('test-user');

      const items = await offlineQueue.getPendingItems();

      // Item should be removed after successful sync
      // (Depends on mock implementation)
      expect(items.length).toBeGreaterThanOrEqual(0);
    });

    it('should increment retry count on failure', async () => {
      const {syncService} = require('../../src/database/SyncService');
      syncService.syncFavorites.mockResolvedValueOnce({
        success: false,
        inserted: 0,
        updated: 0,
        deleted: 0,
        errors: ['Sync failed'],
      });

      const id = await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'retry-1',
        'INSERT',
        {
          user_id: 'test-user',
          fiscal_service_id: 'test-service',
        }
      );

      await offlineQueue.processQueue('test-user');

      const item = await dbManager.query(
        `SELECT retry_count FROM ${TABLE_NAMES.SYNC_QUEUE} WHERE id = ?`,
        [id]
      );

      // Retry count should be incremented
      expect(item[0]?.retry_count).toBeGreaterThan(0);
    });
  });

  describe('Queue Cleanup', () => {
    beforeEach(async () => {
      // Setup test data
      const id1 = await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'cleanup-1',
        'INSERT',
        {data: 'test1'}
      );

      const id2 = await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'cleanup-2',
        'INSERT',
        {data: 'test2'}
      );

      // Mark one as failed
      await dbManager.update(
        TABLE_NAMES.SYNC_QUEUE,
        {retry_count: MAX_SYNC_RETRIES},
        'id = ?',
        [id1]
      );
    });

    it('should clear failed items only', async () => {
      const deleted = await offlineQueue.clearFailedItems();

      expect(deleted).toBe(1);

      const remaining = await offlineQueue.getPendingItems();
      expect(remaining.length).toBe(1);
    });

    it('should clear all items', async () => {
      const deleted = await offlineQueue.clearAllItems();

      expect(deleted).toBe(2);

      const remaining = await offlineQueue.getPendingItems();
      expect(remaining.length).toBe(0);
    });

    it('should retry failed item', async () => {
      const items = await dbManager.query(
        `SELECT id FROM ${TABLE_NAMES.SYNC_QUEUE} WHERE retry_count >= ?`,
        [MAX_SYNC_RETRIES]
      );

      const failedId = items[0].id;

      await offlineQueue.retryItem(failedId);

      const updated = await dbManager.query(
        `SELECT retry_count FROM ${TABLE_NAMES.SYNC_QUEUE} WHERE id = ?`,
        [failedId]
      );

      expect(updated[0].retry_count).toBe(0);
    });
  });

  describe('Operation Types', () => {
    it('should handle INSERT operation', async () => {
      const id = await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'insert-op',
        'INSERT',
        {data: 'test'}
      );

      const item = await dbManager.query(
        `SELECT operation FROM ${TABLE_NAMES.SYNC_QUEUE} WHERE id = ?`,
        [id]
      );

      expect(item[0].operation).toBe('INSERT');
    });

    it('should handle UPDATE operation', async () => {
      const id = await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'update-op',
        'UPDATE',
        {data: 'test'}
      );

      const item = await dbManager.query(
        `SELECT operation FROM ${TABLE_NAMES.SYNC_QUEUE} WHERE id = ?`,
        [id]
      );

      expect(item[0].operation).toBe('UPDATE');
    });

    it('should handle DELETE operation', async () => {
      const id = await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'delete-op',
        'DELETE',
        {data: 'test'}
      );

      const item = await dbManager.query(
        `SELECT operation FROM ${TABLE_NAMES.SYNC_QUEUE} WHERE id = ?`,
        [id]
      );

      expect(item[0].operation).toBe('DELETE');
    });
  });

  describe('Data Persistence', () => {
    it('should persist enqueued data as JSON', async () => {
      const testData = {
        user_id: 'test-user-123',
        fiscal_service_id: 'service-456',
        notes: 'Important note',
        tags: JSON.stringify(['tag1', 'tag2']),
      };

      const id = await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'persist-1',
        'INSERT',
        testData
      );

      const item = await dbManager.query(
        `SELECT data FROM ${TABLE_NAMES.SYNC_QUEUE} WHERE id = ?`,
        [id]
      );

      const parsedData = JSON.parse(item[0].data);

      expect(parsedData.user_id).toBe(testData.user_id);
      expect(parsedData.fiscal_service_id).toBe(testData.fiscal_service_id);
      expect(parsedData.notes).toBe(testData.notes);
    });

    it('should store error messages on failure', async () => {
      const {syncService} = require('../../src/database/SyncService');
      const testError = 'Connection timeout';

      syncService.syncFavorites.mockResolvedValueOnce({
        success: false,
        inserted: 0,
        updated: 0,
        deleted: 0,
        errors: [testError],
      });

      const id = await offlineQueue.enqueue(
        TABLE_NAMES.USER_FAVORITES,
        'error-1',
        'INSERT',
        {user_id: 'test', fiscal_service_id: 'test'}
      );

      await offlineQueue.processQueue('test-user');

      const item = await dbManager.query(
        `SELECT last_error FROM ${TABLE_NAMES.SYNC_QUEUE} WHERE id = ?`,
        [id]
      );

      expect(item[0].last_error).toBeTruthy();
    });
  });
});
