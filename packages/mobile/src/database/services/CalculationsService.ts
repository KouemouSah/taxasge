/**
 * TaxasGE Mobile - Calculations History Service
 */

import { db } from '../DatabaseManager';
import { TABLE_NAMES, QUERIES, SYNC_STATUS } from '../schema';
import { offlineQueueService } from '../OfflineQueueService';

export interface Calculation {
  id?: number;
  user_id: string;
  fiscal_service_id: string;
  calculation_base: number;
  calculated_amount: number;
  payment_type: 'expedition' | 'renewal' | 'urgent';
  parameters?: string; // JSON
  breakdown?: string; // JSON
  calculated_at?: string;
  synced?: number;
  // From join
  service_name?: string;
  service_code?: string;
}

export interface CalculationParams {
  base_amount?: number;
  units?: number;
  percentage?: number;
  tier?: number;
  [key: string]: any;
}

export interface CalculationBreakdown {
  base: number;
  rate: number;
  subtotal: number;
  fees?: number;
  penalties?: number;
  total: number;
  details?: string;
}

class CalculationsService {
  /**
   * Calculate tax amount for service
   */
  calculateAmount(
    service: {
      expedition_amount?: number;
      renewal_amount?: number;
      urgent_amount?: number;
    },
    paymentType: 'expedition' | 'renewal' | 'urgent',
    params?: CalculationParams
  ): { amount: number; breakdown: CalculationBreakdown } {
    let baseAmount = 0;

    // Get base amount by payment type
    switch (paymentType) {
      case 'expedition':
        baseAmount = service.expedition_amount || 0;
        break;
      case 'renewal':
        baseAmount = service.renewal_amount || 0;
        break;
      case 'urgent':
        baseAmount = service.urgent_amount || 0;
        break;
    }

    // Apply parameters if provided
    let calculatedAmount = baseAmount;
    let breakdown: CalculationBreakdown = {
      base: baseAmount,
      rate: 1,
      subtotal: baseAmount,
      total: baseAmount,
    };

    if (params) {
      // Unit-based calculation
      if (params.units) {
        calculatedAmount = baseAmount * params.units;
        breakdown.rate = params.units;
        breakdown.subtotal = calculatedAmount;
      }

      // Percentage-based calculation
      if (params.percentage && params.base_amount) {
        calculatedAmount = params.base_amount * (params.percentage / 100);
        breakdown.base = params.base_amount;
        breakdown.rate = params.percentage / 100;
        breakdown.subtotal = calculatedAmount;
      }

      // Add fees if specified
      if (params.fees) {
        calculatedAmount += params.fees;
        breakdown.fees = params.fees;
      }

      // Add penalties if specified
      if (params.penalties) {
        calculatedAmount += params.penalties;
        breakdown.penalties = params.penalties;
      }
    }

    breakdown.total = calculatedAmount;

    return {
      amount: calculatedAmount,
      breakdown,
    };
  }

  /**
   * Save calculation to history
   */
  async saveCalculation(
    userId: string,
    serviceId: string,
    calculationBase: number,
    calculatedAmount: number,
    paymentType: 'expedition' | 'renewal' | 'urgent',
    params?: CalculationParams,
    breakdown?: CalculationBreakdown
  ): Promise<number> {
    try {
      const paramsJson = params ? JSON.stringify(params) : '{}';
      const breakdownJson = breakdown ? JSON.stringify(breakdown) : '{}';

      const insertId = await db.insert(TABLE_NAMES.CALCULATIONS_HISTORY, {
        user_id: userId,
        fiscal_service_id: serviceId,
        calculation_base: calculationBase,
        calculated_amount: calculatedAmount,
        payment_type: paymentType,
        parameters: paramsJson,
        breakdown: breakdownJson,
        calculated_at: new Date().toISOString(),
        synced: SYNC_STATUS.PENDING,
      });

      console.log('[Calculations] Saved calculation:', insertId);

      // Enqueue for sync
      await offlineQueueService.enqueue(
        TABLE_NAMES.CALCULATIONS_HISTORY,
        insertId.toString(),
        'INSERT',
        {
          user_id: userId,
          fiscal_service_id: serviceId,
          calculation_base: calculationBase,
          calculated_amount: calculatedAmount,
          payment_type: paymentType,
          parameters: paramsJson,
          breakdown: breakdownJson,
          calculated_at: new Date().toISOString(),
        }
      );

      return insertId;
    } catch (error) {
      console.error('[Calculations] Save calculation error:', error);
      throw error;
    }
  }

  /**
   * Get user calculation history
   */
  async getUserHistory(userId: string, limit: number = 50): Promise<Calculation[]> {
    try {
      const results = await db.query<Calculation>(QUERIES.getCalculationsHistory, [userId, limit]);

      // Parse JSON fields
      return results.map(calc => ({
        ...calc,
        parameters: calc.parameters ? JSON.parse(calc.parameters as any) : undefined,
        breakdown: calc.breakdown ? JSON.parse(calc.breakdown as any) : undefined,
      }));
    } catch (error) {
      console.error('[Calculations] Get user history error:', error);
      return [];
    }
  }

  /**
   * Get calculations for specific service
   */
  async getByService(
    userId: string,
    serviceId: string,
    limit: number = 20
  ): Promise<Calculation[]> {
    try {
      const results = await db.query<Calculation>(
        `SELECT
          ch.*,
          fs.name_es as service_name,
          fs.code as service_code
         FROM ${TABLE_NAMES.CALCULATIONS_HISTORY} ch
         JOIN fiscal_services fs ON ch.fiscal_service_id = fs.id
         WHERE ch.user_id = ? AND ch.fiscal_service_id = ?
         ORDER BY ch.calculated_at DESC
         LIMIT ?`,
        [userId, serviceId, limit]
      );

      return results.map(calc => ({
        ...calc,
        parameters: calc.parameters ? JSON.parse(calc.parameters as any) : undefined,
        breakdown: calc.breakdown ? JSON.parse(calc.breakdown as any) : undefined,
      }));
    } catch (error) {
      console.error('[Calculations] Get by service error:', error);
      return [];
    }
  }

  /**
   * Get recent calculations (last 7 days)
   */
  async getRecent(userId: string, days: number = 7): Promise<Calculation[]> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const results = await db.query<Calculation>(
        `SELECT
          ch.*,
          fs.name_es as service_name,
          fs.code as service_code
         FROM ${TABLE_NAMES.CALCULATIONS_HISTORY} ch
         JOIN fiscal_services fs ON ch.fiscal_service_id = fs.id
         WHERE ch.user_id = ? AND ch.calculated_at >= ?
         ORDER BY ch.calculated_at DESC`,
        [userId, since.toISOString()]
      );

      return results.map(calc => ({
        ...calc,
        parameters: calc.parameters ? JSON.parse(calc.parameters as any) : undefined,
        breakdown: calc.breakdown ? JSON.parse(calc.breakdown as any) : undefined,
      }));
    } catch (error) {
      console.error('[Calculations] Get recent error:', error);
      return [];
    }
  }

  /**
   * Get total amount calculated
   */
  async getTotalCalculated(userId: string): Promise<number> {
    try {
      const results = await db.query<{ total: number }>(
        `SELECT SUM(calculated_amount) as total
         FROM ${TABLE_NAMES.CALCULATIONS_HISTORY}
         WHERE user_id = ?`,
        [userId]
      );

      return results[0]?.total || 0;
    } catch (error) {
      console.error('[Calculations] Get total calculated error:', error);
      return 0;
    }
  }

  /**
   * Get calculations count
   */
  async getCount(userId: string): Promise<number> {
    try {
      const results = await db.query<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM ${TABLE_NAMES.CALCULATIONS_HISTORY}
         WHERE user_id = ?`,
        [userId]
      );

      return results[0]?.count || 0;
    } catch (error) {
      console.error('[Calculations] Get count error:', error);
      return 0;
    }
  }

  /**
   * Get calculations statistics by payment type
   */
  async getStatsByPaymentType(userId: string): Promise<{
    expedition: { count: number; total: number };
    renewal: { count: number; total: number };
    urgent: { count: number; total: number };
  }> {
    try {
      const results = await db.query<{
        payment_type: string;
        count: number;
        total: number;
      }>(
        `SELECT
          payment_type,
          COUNT(*) as count,
          SUM(calculated_amount) as total
         FROM ${TABLE_NAMES.CALCULATIONS_HISTORY}
         WHERE user_id = ?
         GROUP BY payment_type`,
        [userId]
      );

      const stats = {
        expedition: { count: 0, total: 0 },
        renewal: { count: 0, total: 0 },
        urgent: { count: 0, total: 0 },
      };

      results.forEach(row => {
        if (row.payment_type in stats) {
          stats[row.payment_type as keyof typeof stats] = {
            count: row.count,
            total: row.total,
          };
        }
      });

      return stats;
    } catch (error) {
      console.error('[Calculations] Get stats by payment type error:', error);
      return {
        expedition: { count: 0, total: 0 },
        renewal: { count: 0, total: 0 },
        urgent: { count: 0, total: 0 },
      };
    }
  }

  /**
   * Delete calculation
   */
  async deleteCalculation(userId: string, calculationId: number): Promise<boolean> {
    try {
      const deleted = await db.delete(TABLE_NAMES.CALCULATIONS_HISTORY, 'id = ? AND user_id = ?', [
        calculationId,
        userId,
      ]);

      console.log('[Calculations] Deleted calculation:', calculationId, 'rows affected:', deleted);
      return deleted > 0;
    } catch (error) {
      console.error('[Calculations] Delete calculation error:', error);
      return false;
    }
  }

  /**
   * Clear all history
   */
  async clearHistory(userId: string): Promise<boolean> {
    try {
      await db.delete(TABLE_NAMES.CALCULATIONS_HISTORY, 'user_id = ?', [userId]);

      console.log('[Calculations] Cleared all history for user:', userId);
      return true;
    } catch (error) {
      console.error('[Calculations] Clear history error:', error);
      return false;
    }
  }
}

export const calculationsService = new CalculationsService();
