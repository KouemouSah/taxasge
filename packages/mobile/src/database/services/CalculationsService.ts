/**
 * TaxasGE Mobile - Calculations History Service
 */

import { db } from '../DatabaseManager';
import { TABLE_NAMES, QUERIES, SYNC_STATUS } from '../schema';
import { offlineQueueService } from '../OfflineQueueService';

export interface Calculation {
  id?: number;
  user_id: string;
  fiscal_service_code: string;                      // FIXED: was fiscal_service_id
  calculation_type: 'expedition' | 'renewal';       // FIXED: was payment_type, removed 'urgent'
  input_parameters: string;                          // FIXED: was parameters
  calculated_amount: number;
  calculation_details?: string;                      // FIXED: was breakdown
  saved_for_later?: number;                          // NEW
  created_at?: string;                               // FIXED: was calculated_at
  synced?: number;
  // From join
  service_name?: string;
  calculation_method?: string;  // From fiscal_services table
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
   * Calculate tax amount for service (v2.0.0 - 8 methods support)
   */
  calculateAmount(
    service: {
      calculation_method: string;
      tasa_expedicion?: number;
      tasa_renovacion?: number;
      urgent_amount?: number;
      base_percentage?: number;
      percentage_of?: string;
      rate_tiers?: string;
      unit_rate?: number;
      expedition_formula?: string;
    },
    paymentType: 'expedition' | 'renewal' | 'urgent',
    params?: CalculationParams
  ): { amount: number; breakdown: CalculationBreakdown } {
    let calculatedAmount = 0;
    let breakdown: CalculationBreakdown;

    switch (service.calculation_method) {
      case 'fixed_expedition':
        calculatedAmount = paymentType === 'renewal'
          ? (service.tasa_renovacion || 0)
          : (service.tasa_expedicion || 0);
        breakdown = {
          base: calculatedAmount,
          rate: 1,
          subtotal: calculatedAmount,
          total: calculatedAmount,
          details: `Montant fixe (${paymentType})`,
        };
        break;

      case 'fixed_renewal':
        calculatedAmount = service.tasa_renovacion || 0;
        breakdown = {
          base: calculatedAmount,
          rate: 1,
          subtotal: calculatedAmount,
          total: calculatedAmount,
          details: 'Montant fixe renouvellement',
        };
        break;

      case 'fixed_both':
        calculatedAmount = paymentType === 'renewal'
          ? (service.tasa_renovacion || 0)
          : (service.tasa_expedicion || 0);
        breakdown = {
          base: calculatedAmount,
          rate: 1,
          subtotal: calculatedAmount,
          total: calculatedAmount,
          details: `Montant fixe (${paymentType})`,
        };
        break;

      case 'percentage_based':
        if (!params?.base_amount || !service.base_percentage) {
          throw new Error('base_amount et base_percentage requis pour percentage_based');
        }
        calculatedAmount = params.base_amount * (service.base_percentage / 100);
        breakdown = {
          base: params.base_amount,
          rate: service.base_percentage / 100,
          subtotal: calculatedAmount,
          total: calculatedAmount,
          details: `${service.base_percentage}% de ${service.percentage_of || 'base'}`,
        };
        break;

      case 'unit_based':
        if (!params?.units || !service.unit_rate) {
          throw new Error('units et unit_rate requis pour unit_based');
        }
        calculatedAmount = params.units * service.unit_rate;
        breakdown = {
          base: service.unit_rate,
          rate: params.units,
          subtotal: calculatedAmount,
          total: calculatedAmount,
          details: `${params.units} unités × ${service.unit_rate} FCFA`,
        };
        break;

      case 'tiered_rates':
        if (!params?.base_amount || !service.rate_tiers) {
          throw new Error('base_amount et rate_tiers requis pour tiered_rates');
        }
        const tiers = JSON.parse(service.rate_tiers);
        calculatedAmount = this.calculateTiered(params.base_amount, tiers);
        breakdown = {
          base: params.base_amount,
          rate: 0,
          subtotal: calculatedAmount,
          total: calculatedAmount,
          details: 'Calcul par tiers progressifs',
        };
        break;

      case 'formula_based':
        if (!service.expedition_formula) {
          throw new Error('expedition_formula requis pour formula_based');
        }
        calculatedAmount = this.evaluateFormula(service.expedition_formula, params);
        breakdown = {
          base: params?.base_amount || 0,
          rate: 1,
          subtotal: calculatedAmount,
          total: calculatedAmount,
          details: `Formule: ${service.expedition_formula}`,
        };
        break;

      case 'fixed_plus_unit':
        const fixedPart = paymentType === 'renewal'
          ? (service.tasa_renovacion || 0)
          : (service.tasa_expedicion || 0);
        const unitPart = (params?.units || 0) * (service.unit_rate || 0);
        calculatedAmount = fixedPart + unitPart;
        breakdown = {
          base: fixedPart,
          rate: params?.units || 0,
          subtotal: unitPart,
          fees: fixedPart,
          total: calculatedAmount,
          details: `Fixe (${fixedPart}) + Variable (${unitPart})`,
        };
        break;

      default:
        throw new Error(`Méthode de calcul non supportée: ${service.calculation_method}`);
    }

    // Apply fees and penalties if provided
    if (params?.fees) {
      calculatedAmount += params.fees;
      breakdown.fees = (breakdown.fees || 0) + params.fees;
    }

    if (params?.penalties) {
      calculatedAmount += params.penalties;
      breakdown.penalties = params.penalties;
    }

    breakdown.total = calculatedAmount;

    return { amount: calculatedAmount, breakdown };
  }

  /**
   * Calculate tiered rates
   */
  private calculateTiered(
    baseAmount: number,
    tiers: Array<{ min: number; max: number; rate: number }>
  ): number {
    let total = 0;

    for (const tier of tiers) {
      if (baseAmount > tier.min) {
        const applicableAmount = Math.min(baseAmount, tier.max) - tier.min;
        total += applicableAmount * (tier.rate / 100);
      }
    }

    return total;
  }

  /**
   * Evaluate formula string safely
   */
  private evaluateFormula(formula: string, params?: CalculationParams): number {
    try {
      let evaluableFormula = formula;

      if (params) {
        Object.keys(params).forEach(key => {
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          evaluableFormula = evaluableFormula.replace(regex, params[key]?.toString() || '0');
        });
      }

      // Whitelist operators only
      const safeFormula = evaluableFormula.replace(/[^0-9+\-*/().\s]/g, '');

      // Using Function is safer than eval
      const result = new Function(`return ${safeFormula}`)();

      return parseFloat(result) || 0;
    } catch (error) {
      console.error('[Calculations] Formula evaluation error:', error);
      return 0;
    }
  }

  /**
   * Save calculation to history
   * @param userId - User UUID
   * @param serviceCode - fiscal_services.service_code (NOT id)
   * @param calculationType - 'expedition' | 'renewal'
   * @param calculatedAmount - Final calculated amount
   * @param params - All calculation inputs (base_amount, units, etc.)
   * @param breakdown - Calculation breakdown details
   * @param savedForLater - Whether user wants to save for later payment
   */
  async saveCalculation(
    userId: string,
    serviceCode: string,
    calculationType: 'expedition' | 'renewal',
    calculatedAmount: number,
    params: CalculationParams,
    breakdown?: CalculationBreakdown,
    savedForLater: boolean = false
  ): Promise<number> {
    try {
      const inputParams = JSON.stringify(params);
      const details = breakdown ? JSON.stringify(breakdown) : null;

      const insertId = await db.insert(TABLE_NAMES.CALCULATION_HISTORY, {
        user_id: userId,
        fiscal_service_code: serviceCode,
        calculation_type: calculationType,
        input_parameters: inputParams,
        calculated_amount: calculatedAmount,
        calculation_details: details,
        saved_for_later: savedForLater ? 1 : 0,
        created_at: new Date().toISOString(),
        synced: SYNC_STATUS.PENDING,
      });

      console.log('[Calculations] Saved calculation:', insertId);

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
          calculated_amount: calculatedAmount,
          calculation_details: details,
          saved_for_later: savedForLater ? 1 : 0,
          created_at: new Date().toISOString(),
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

      // Return as-is (JSON fields remain as strings, parse them in UI if needed)
      return results;
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
    serviceCode: string,
    limit: number = 20
  ): Promise<Calculation[]> {
    try {
      const results = await db.query<Calculation>(
        `SELECT
          ch.*,
          fs.name_es as service_name,
          fs.calculation_method
         FROM ${TABLE_NAMES.CALCULATION_HISTORY} ch
         JOIN fiscal_services fs ON ch.fiscal_service_code = fs.service_code
         WHERE ch.user_id = ? AND ch.fiscal_service_code = ?
         ORDER BY ch.created_at DESC
         LIMIT ?`,
        [userId, serviceCode, limit]
      );

      return results;
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
          fs.calculation_method
         FROM ${TABLE_NAMES.CALCULATION_HISTORY} ch
         JOIN fiscal_services fs ON ch.fiscal_service_code = fs.service_code
         WHERE ch.user_id = ? AND ch.created_at >= ?
         ORDER BY ch.created_at DESC`,
        [userId, since.toISOString()]
      );

      return results;
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
         FROM ${TABLE_NAMES.CALCULATION_HISTORY}
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
         FROM ${TABLE_NAMES.CALCULATION_HISTORY}
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
   * Get calculations statistics by calculation type
   */
  async getStatsByCalculationType(userId: string): Promise<{
    expedition: { count: number; total: number };
    renewal: { count: number; total: number };
  }> {
    try {
      const results = await db.query<{
        calculation_type: string;
        count: number;
        total: number;
      }>(
        `SELECT
          calculation_type,
          COUNT(*) as count,
          SUM(calculated_amount) as total
         FROM ${TABLE_NAMES.CALCULATION_HISTORY}
         WHERE user_id = ?
         GROUP BY calculation_type`,
        [userId]
      );

      const stats = {
        expedition: { count: 0, total: 0 },
        renewal: { count: 0, total: 0 },
      };

      results.forEach(row => {
        if (row.calculation_type in stats) {
          stats[row.calculation_type as keyof typeof stats] = {
            count: row.count,
            total: row.total,
          };
        }
      });

      return stats;
    } catch (error) {
      console.error('[Calculations] Get stats by calculation type error:', error);
      return {
        expedition: { count: 0, total: 0 },
        renewal: { count: 0, total: 0 },
      };
    }
  }

  /**
   * Delete calculation
   */
  async deleteCalculation(userId: string, calculationId: number): Promise<boolean> {
    try {
      const deleted = await db.delete(TABLE_NAMES.CALCULATION_HISTORY, 'id = ? AND user_id = ?', [
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
      await db.delete(TABLE_NAMES.CALCULATION_HISTORY, 'user_id = ?', [userId]);

      console.log('[Calculations] Cleared all history for user:', userId);
      return true;
    } catch (error) {
      console.error('[Calculations] Clear history error:', error);
      return false;
    }
  }
}

export const calculationsService = new CalculationsService();
