/**
 * TaxasGE Mobile - Calculation History Service
 *
 * Manages calculation history with automatic cleanup (keeps last 100 records).
 * Extends the existing CalculationsService with history management.
 *
 * Date: 2025-10-21
 */

import { db } from '../DatabaseManager';
import { TABLE_NAMES, SYNC_STATUS } from '../schema';
import { offlineQueueService } from '../OfflineQueueService';
import { CalculationInput, CalculationResult } from '../../services/CalculatorEngine';

export interface CalculationHistoryRecord {
  id?: number;
  user_id: string;
  fiscal_service_code: string;
  calculation_type: 'expedition' | 'renewal';
  input_parameters: string; // JSON
  calculated_amount: number;
  calculation_details: string; // JSON
  saved_for_later: number;
  created_at: string;
  synced: number;
  // From join
  service_name?: string;
  service_code?: string;
  calculation_method?: string;
}

export interface SaveCalculationParams {
  userId: string;
  serviceCode: string;
  serviceName?: string;
  calculationType: 'expedition' | 'renewal';
  inputs: CalculationInput;
  result: CalculationResult;
  savedForLater?: boolean;
}

class CalculationHistoryService {
  private readonly MAX_HISTORY_RECORDS = 100;

  /**
   * Save a calculation to history
   */
  async saveCalculation(params: SaveCalculationParams): Promise<number> {
    try {
      const {
        userId,
        serviceCode,
        calculationType,
        inputs,
        result,
        savedForLater = false,
      } = params;

      console.log(`[CalculationHistory] Saving calculation for service ${serviceCode}`);

      // Prepare data
      const inputParams = JSON.stringify(inputs);
      const calculationDetails = JSON.stringify({
        breakdown: result.breakdown,
        method: result.method,
        timestamp: new Date().toISOString(),
      });

      // Insert into database
      const insertId = await db.insert(TABLE_NAMES.CALCULATION_HISTORY, {
        user_id: userId,
        fiscal_service_code: serviceCode,
        calculation_type: calculationType,
        input_parameters: inputParams,
        calculated_amount: result.amount,
        calculation_details: calculationDetails,
        saved_for_later: savedForLater ? 1 : 0,
        created_at: new Date().toISOString(),
        synced: SYNC_STATUS.PENDING,
      });

      console.log(`[CalculationHistory] Saved with ID: ${insertId}`);

      // Enqueue for sync
      await offlineQueueService.enqueue(
        TABLE_NAMES.CALCULATION_HISTORY,
        insertId.toString(),
        'INSERT',
        {
          user_id: userId,
          fiscal_service_code: serviceCode,
          calculation_type: calculationType,
          input_parameters: inputParams,
          calculated_amount: result.amount,
          calculation_details: calculationDetails,
          saved_for_later: savedForLater ? 1 : 0,
          created_at: new Date().toISOString(),
        }
      );

      // Cleanup old records
      await this.cleanupOldRecords(userId);

      return insertId;
    } catch (error) {
      console.error('[CalculationHistory] Save calculation error:', error);
      throw error;
    }
  }

  /**
   * Get user calculation history
   */
  async getHistory(
    userId: string,
    limit: number = 50
  ): Promise<CalculationHistoryRecord[]> {
    try {
      const query = `
        SELECT
          ch.*,
          fs.name_es as service_name,
          fs.service_code,
          fs.calculation_method
        FROM ${TABLE_NAMES.CALCULATION_HISTORY} ch
        LEFT JOIN fiscal_services fs ON ch.fiscal_service_code = fs.service_code
        WHERE ch.user_id = ?
        ORDER BY ch.created_at DESC
        LIMIT ?
      `;

      const results = await db.query<CalculationHistoryRecord>(query, [userId, limit]);

      console.log(`[CalculationHistory] Retrieved ${results.length} records for user ${userId}`);

      return results;
    } catch (error) {
      console.error('[CalculationHistory] Get history error:', error);
      return [];
    }
  }

  /**
   * Get history for a specific service
   */
  async getHistoryByService(
    userId: string,
    serviceCode: string,
    limit: number = 20
  ): Promise<CalculationHistoryRecord[]> {
    try {
      const query = `
        SELECT
          ch.*,
          fs.name_es as service_name,
          fs.service_code,
          fs.calculation_method
        FROM ${TABLE_NAMES.CALCULATION_HISTORY} ch
        LEFT JOIN fiscal_services fs ON ch.fiscal_service_code = fs.service_code
        WHERE ch.user_id = ? AND ch.fiscal_service_code = ?
        ORDER BY ch.created_at DESC
        LIMIT ?
      `;

      const results = await db.query<CalculationHistoryRecord>(
        query,
        [userId, serviceCode, limit]
      );

      return results;
    } catch (error) {
      console.error('[CalculationHistory] Get history by service error:', error);
      return [];
    }
  }

  /**
   * Get saved calculations (saved_for_later = 1)
   */
  async getSavedCalculations(userId: string): Promise<CalculationHistoryRecord[]> {
    try {
      const query = `
        SELECT
          ch.*,
          fs.name_es as service_name,
          fs.service_code,
          fs.calculation_method
        FROM ${TABLE_NAMES.CALCULATION_HISTORY} ch
        LEFT JOIN fiscal_services fs ON ch.fiscal_service_code = fs.service_code
        WHERE ch.user_id = ? AND ch.saved_for_later = 1
        ORDER BY ch.created_at DESC
      `;

      const results = await db.query<CalculationHistoryRecord>(query, [userId]);

      console.log(`[CalculationHistory] Retrieved ${results.length} saved calculations`);

      return results;
    } catch (error) {
      console.error('[CalculationHistory] Get saved calculations error:', error);
      return [];
    }
  }

  /**
   * Get calculation by ID
   */
  async getCalculationById(
    userId: string,
    calculationId: number
  ): Promise<CalculationHistoryRecord | null> {
    try {
      const query = `
        SELECT
          ch.*,
          fs.name_es as service_name,
          fs.service_code,
          fs.calculation_method
        FROM ${TABLE_NAMES.CALCULATION_HISTORY} ch
        LEFT JOIN fiscal_services fs ON ch.fiscal_service_code = fs.service_code
        WHERE ch.id = ? AND ch.user_id = ?
        LIMIT 1
      `;

      const results = await db.query<CalculationHistoryRecord>(
        query,
        [calculationId, userId]
      );

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('[CalculationHistory] Get calculation by ID error:', error);
      return null;
    }
  }

  /**
   * Update saved_for_later flag
   */
  async toggleSavedForLater(
    userId: string,
    calculationId: number
  ): Promise<boolean> {
    try {
      // First, get current value
      const record = await this.getCalculationById(userId, calculationId);
      if (!record) {
        console.warn(`[CalculationHistory] Calculation ${calculationId} not found`);
        return false;
      }

      const newValue = record.saved_for_later === 1 ? 0 : 1;

      const updated = await db.update(
        TABLE_NAMES.CALCULATION_HISTORY,
        { saved_for_later: newValue },
        'id = ? AND user_id = ?',
        [calculationId, userId]
      );

      console.log(`[CalculationHistory] Toggled saved_for_later for ${calculationId}: ${newValue}`);

      return updated > 0;
    } catch (error) {
      console.error('[CalculationHistory] Toggle saved_for_later error:', error);
      return false;
    }
  }

  /**
   * Delete a calculation
   */
  async deleteCalculation(userId: string, calculationId: number): Promise<boolean> {
    try {
      const deleted = await db.delete(
        TABLE_NAMES.CALCULATION_HISTORY,
        'id = ? AND user_id = ?',
        [calculationId, userId]
      );

      console.log(`[CalculationHistory] Deleted calculation ${calculationId}: ${deleted > 0}`);

      return deleted > 0;
    } catch (error) {
      console.error('[CalculationHistory] Delete calculation error:', error);
      return false;
    }
  }

  /**
   * Get total count of calculations
   */
  async getCount(userId: string): Promise<number> {
    try {
      const results = await db.query<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM ${TABLE_NAMES.CALCULATION_HISTORY}
         WHERE user_id = ?`,
        [userId]
      );

      return results[0]?.count || 0;
    } catch (error) {
      console.error('[CalculationHistory] Get count error:', error);
      return 0;
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(userId: string): Promise<{
    totalCalculations: number;
    totalAmount: number;
    byType: {
      expedition: { count: number; total: number };
      renewal: { count: number; total: number };
    };
    byMethod: Record<string, { count: number; total: number }>;
  }> {
    try {
      // Total calculations and amount
      const totalQuery = `
        SELECT
          COUNT(*) as count,
          SUM(calculated_amount) as total
        FROM ${TABLE_NAMES.CALCULATION_HISTORY}
        WHERE user_id = ?
      `;
      const totalResults = await db.query<{ count: number; total: number }>(
        totalQuery,
        [userId]
      );

      // By calculation type
      const byTypeQuery = `
        SELECT
          calculation_type,
          COUNT(*) as count,
          SUM(calculated_amount) as total
        FROM ${TABLE_NAMES.CALCULATION_HISTORY}
        WHERE user_id = ?
        GROUP BY calculation_type
      `;
      const typeResults = await db.query<{
        calculation_type: string;
        count: number;
        total: number;
      }>(byTypeQuery, [userId]);

      // By calculation method
      const byMethodQuery = `
        SELECT
          fs.calculation_method,
          COUNT(*) as count,
          SUM(ch.calculated_amount) as total
        FROM ${TABLE_NAMES.CALCULATION_HISTORY} ch
        LEFT JOIN fiscal_services fs ON ch.fiscal_service_code = fs.service_code
        WHERE ch.user_id = ?
        GROUP BY fs.calculation_method
      `;
      const methodResults = await db.query<{
        calculation_method: string;
        count: number;
        total: number;
      }>(byMethodQuery, [userId]);

      // Build statistics object
      const stats = {
        totalCalculations: totalResults[0]?.count || 0,
        totalAmount: totalResults[0]?.total || 0,
        byType: {
          expedition: { count: 0, total: 0 },
          renewal: { count: 0, total: 0 },
        },
        byMethod: {} as Record<string, { count: number; total: number }>,
      };

      typeResults.forEach(row => {
        if (row.calculation_type in stats.byType) {
          stats.byType[row.calculation_type as keyof typeof stats.byType] = {
            count: row.count,
            total: row.total,
          };
        }
      });

      methodResults.forEach(row => {
        if (row.calculation_method) {
          stats.byMethod[row.calculation_method] = {
            count: row.count,
            total: row.total,
          };
        }
      });

      return stats;
    } catch (error) {
      console.error('[CalculationHistory] Get statistics error:', error);
      return {
        totalCalculations: 0,
        totalAmount: 0,
        byType: {
          expedition: { count: 0, total: 0 },
          renewal: { count: 0, total: 0 },
        },
        byMethod: {},
      };
    }
  }

  /**
   * Cleanup old records - keeps only the last MAX_HISTORY_RECORDS
   */
  async cleanupOldRecords(userId: string): Promise<number> {
    try {
      const count = await this.getCount(userId);

      if (count <= this.MAX_HISTORY_RECORDS) {
        // No cleanup needed
        return 0;
      }

      const toDelete = count - this.MAX_HISTORY_RECORDS;

      // Delete oldest records
      const deleteQuery = `
        DELETE FROM ${TABLE_NAMES.CALCULATION_HISTORY}
        WHERE id IN (
          SELECT id FROM ${TABLE_NAMES.CALCULATION_HISTORY}
          WHERE user_id = ?
          ORDER BY created_at ASC
          LIMIT ?
        )
      `;

      const deleted = await db.delete(
        TABLE_NAMES.CALCULATION_HISTORY,
        `id IN (
          SELECT id FROM (
            SELECT id FROM ${TABLE_NAMES.CALCULATION_HISTORY}
            WHERE user_id = ?
            ORDER BY created_at ASC
            LIMIT ?
          ) AS old_records
        )`,
        [userId, toDelete]
      );

      console.log(
        `[CalculationHistory] Cleaned up ${deleted} old records for user ${userId}`
      );

      return deleted;
    } catch (error) {
      console.error('[CalculationHistory] Cleanup error:', error);
      return 0;
    }
  }

  /**
   * Delete all history for a user
   */
  async clearHistory(userId: string): Promise<boolean> {
    try {
      await db.delete(TABLE_NAMES.CALCULATION_HISTORY, 'user_id = ?', [userId]);

      console.log(`[CalculationHistory] Cleared all history for user ${userId}`);

      return true;
    } catch (error) {
      console.error('[CalculationHistory] Clear history error:', error);
      return false;
    }
  }
}

export const calculationHistoryService = new CalculationHistoryService();
