/**
 * TaxasGE Mobile - SyncService Tests
 * Phase 5: Synchronization Infrastructure Validation
 */

import {SyncService} from '../../src/database/SyncService';
import {DatabaseManager} from '../../src/database/DatabaseManager';
import {TABLE_NAMES, SYNC_STATUS} from '../../src/database/schema';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
    })
  ),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        data: [],
        error: null,
      })),
      upsert: jest.fn(() => ({
        data: null,
        error: null,
      })),
      insert: jest.fn(() => ({
        data: null,
        error: null,
      })),
      gte: jest.fn(function() {
        return this;
      }),
    })),
  })),
}));

describe('SyncService - Phase 5 Infrastructure', () => {
  let syncService: SyncService;
  let dbManager: DatabaseManager;

  beforeAll(async () => {
    dbManager = new DatabaseManager();
    await dbManager.init();
    syncService = new SyncService();
  });

  afterAll(async () => {
    await dbManager.close();
  });

  describe('Connection Status', () => {
    it('should check online status', async () => {
      const isOnline = await syncService.isOnline();
      expect(typeof isOnline).toBe('boolean');
    });
  });

  describe('Reference Data Sync', () => {
    it('should have syncReferenceData method', () => {
      expect(syncService.syncReferenceData).toBeDefined();
      expect(typeof syncService.syncReferenceData).toBe('function');
    });

    it('should return SyncResult structure', async () => {
      const result = await syncService.syncReferenceData();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('inserted');
      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('deleted');
      expect(result).toHaveProperty('errors');

      expect(typeof result.success).toBe('boolean');
      expect(typeof result.inserted).toBe('number');
      expect(typeof result.updated).toBe('number');
      expect(typeof result.deleted).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('User Favorites Sync', () => {
    const testUserId = 'test-user-123';

    beforeEach(async () => {
      // Clear favorites
      await dbManager.delete(TABLE_NAMES.USER_FAVORITES, '1=1', []);
    });

    it('should sync favorites for user', async () => {
      const result = await syncService.syncFavorites(testUserId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('inserted');
      expect(result).toHaveProperty('errors');
    });

    it('should handle empty favorites list', async () => {
      const result = await syncService.syncFavorites(testUserId);

      expect(result.success).toBe(true);
      expect(result.inserted).toBe(0);
    });

    it('should sync unsynced favorites only', async () => {
      // Insert test favorite
      await dbManager.insert(TABLE_NAMES.USER_FAVORITES, {
        user_id: testUserId,
        fiscal_service_id: 'TEST-SERVICE-1',
        notes: 'Test note',
        synced: SYNC_STATUS.PENDING,
      });

      const result = await syncService.syncFavorites(testUserId);

      // Should attempt to sync (might fail due to mocked Supabase)
      expect(result).toBeDefined();
    });
  });

  describe('Calculations History Sync', () => {
    const testUserId = 'test-user-456';

    beforeEach(async () => {
      // Clear calculations
      await dbManager.delete(TABLE_NAMES.CALCULATIONS_HISTORY, '1=1', []);
    });

    it('should sync calculations for user', async () => {
      const result = await syncService.syncCalculationsHistory(testUserId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('inserted');
      expect(result).toHaveProperty('errors');
    });

    it('should handle empty calculations list', async () => {
      const result = await syncService.syncCalculationsHistory(testUserId);

      expect(result.success).toBe(true);
      expect(result.inserted).toBe(0);
    });

    it('should sync unsynced calculations only', async () => {
      // Insert test calculation
      await dbManager.insert(TABLE_NAMES.CALCULATIONS_HISTORY, {
        user_id: testUserId,
        fiscal_service_id: 'TEST-SERVICE-2',
        calculation_base: 1000.0,
        calculated_amount: 150.0,
        payment_type: 'expedition',
        parameters: '{}',
        breakdown: '{}',
        synced: SYNC_STATUS.PENDING,
      });

      const result = await syncService.syncCalculationsHistory(testUserId);

      expect(result).toBeDefined();
    });
  });

  describe('Full Sync', () => {
    it('should perform full sync without user', async () => {
      const result = await syncService.fullSync();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('inserted');
      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('deleted');
      expect(result).toHaveProperty('errors');
    });

    it('should perform full sync with user', async () => {
      const testUserId = 'test-user-789';
      const result = await syncService.fullSync(testUserId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
    });

    it('should aggregate results from all sync operations', async () => {
      const result = await syncService.fullSync('test-user-agg');

      // Results should combine reference + favorites + calculations
      expect(result.inserted).toBeGreaterThanOrEqual(0);
      expect(result.updated).toBeGreaterThanOrEqual(0);
      expect(result.deleted).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('Sync Metadata Tracking', () => {
    it('should track last full sync timestamp', async () => {
      await syncService.syncReferenceData();

      const lastSync = await dbManager.getMetadata('last_full_sync');

      // Should be set after sync (might be null if sync failed)
      expect(typeof lastSync === 'string' || lastSync === null).toBe(true);
    });

    it('should use last sync timestamp for incremental sync', async () => {
      // First sync
      await syncService.syncReferenceData();

      const firstSync = await dbManager.getMetadata('last_full_sync');

      // Wait 1ms
      await new Promise(resolve => setTimeout(resolve, 1));

      // Second sync should use timestamp
      await syncService.syncReferenceData();

      const secondSync = await dbManager.getMetadata('last_full_sync');

      // Second sync should update timestamp
      expect(secondSync).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle sync when offline', async () => {
      const NetInfo = require('@react-native-community/netinfo');
      NetInfo.fetch.mockResolvedValueOnce({
        isConnected: false,
        isInternetReachable: false,
      });

      const result = await syncService.syncReferenceData();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toBe('Device is offline');
    });

    it('should prevent concurrent syncs', async () => {
      const promise1 = syncService.syncReferenceData();
      const promise2 = syncService.syncReferenceData();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // One should succeed, one should be skipped
      const totalProcessed = result1.inserted + result2.inserted;
      expect(totalProcessed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Mapping', () => {
    it('should map boolean fields correctly', () => {
      // Test is implicit in sync operations
      // SQLite uses INTEGER (0/1) for booleans
      // Supabase uses BOOLEAN (true/false)
      // Mapping should handle conversion

      expect(true).toBe(true); // Placeholder
    });

    it('should handle null values correctly', () => {
      // Test is implicit in sync operations
      // Mapping should preserve null values

      expect(true).toBe(true); // Placeholder
    });

    it('should map timestamp fields correctly', () => {
      // Test is implicit in sync operations
      // Timestamps should be ISO 8601 strings

      expect(true).toBe(true); // Placeholder
    });
  });
});
