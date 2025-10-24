/**
 * TaxasGE Mobile - useCalculations Hook
 * Hook pour gérer les calculs fiscaux et l'historique
 */

import { useState, useCallback, useEffect } from 'react';
import {
  calculationsService,
  Calculation,
  CalculationParams,
  CalculationBreakdown,
} from '../database/services/CalculationsService';
import { FiscalService } from '../database/services/FiscalServicesService';

export interface CalculationsState {
  history: Calculation[];
  loading: boolean;
  error: string | null;
  totalCalculated: number;
  count: number;
}

export function useCalculations(userId?: string) {
  const [state, setState] = useState<CalculationsState>({
    history: [],
    loading: false,
    error: null,
    totalCalculated: 0,
    count: 0,
  });

  /**
   * Calculate tax amount
   */
  const calculate = useCallback(
    (
      service: FiscalService,
      paymentType: 'expedition' | 'renewal' | 'urgent',
      params?: CalculationParams
    ) => {
      try {
        const result = calculationsService.calculateAmount(service, paymentType, params);

        return result;
      } catch (error) {
        console.error('[useCalculations] Calculate failed:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Calculate and save to history
   */
  const calculateAndSave = useCallback(
    async (
      service: FiscalService,
      paymentType: 'expedition' | 'renewal' | 'urgent',
      params?: CalculationParams,
      uid?: string
    ) => {
      const targetUserId = uid || userId;
      if (!targetUserId) {
        throw new Error('User ID required to save calculation');
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Calculate amount
        const { amount, breakdown } = calculationsService.calculateAmount(
          service,
          paymentType,
          params
        );

        // Save to history
        const insertId = await calculationsService.saveCalculation(
          targetUserId,
          service.id,
          params?.base_amount || amount,
          amount,
          paymentType,
          params,
          breakdown
        );

        // Reload history
        await loadHistory(targetUserId);

        console.log('[useCalculations] Calculation saved:', insertId);

        return {
          id: insertId,
          amount,
          breakdown,
        };
      } catch (error) {
        console.error('[useCalculations] Calculate and save failed:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Calculation save failed',
        }));
        throw error;
      }
    },
    [userId]
  );

  /**
   * Load user calculation history
   */
  const loadHistory = useCallback(
    async (uid?: string, limit: number = 50) => {
      const targetUserId = uid || userId;
      if (!targetUserId) {
        console.warn('[useCalculations] No user ID provided');
        return [];
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const results = await calculationsService.getUserHistory(targetUserId, limit);
        const total = await calculationsService.getTotalCalculated(targetUserId);
        const totalCount = await calculationsService.getCount(targetUserId);

        setState(prev => ({
          ...prev,
          history: results,
          loading: false,
          totalCalculated: total,
          count: totalCount,
          error: null,
        }));

        return results;
      } catch (error) {
        console.error('[useCalculations] Load history failed:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Load failed',
        }));
        return [];
      }
    },
    [userId]
  );

  /**
   * Get calculations for specific service
   */
  const getByService = useCallback(
    async (serviceId: string, uid?: string, limit: number = 20) => {
      const targetUserId = uid || userId;
      if (!targetUserId) {
        return [];
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const results = await calculationsService.getByService(targetUserId, serviceId, limit);

        setState(prev => ({
          ...prev,
          loading: false,
          error: null,
        }));

        return results;
      } catch (error) {
        console.error('[useCalculations] Get by service failed:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Load failed',
        }));
        return [];
      }
    },
    [userId]
  );

  /**
   * Get recent calculations
   */
  const getRecent = useCallback(
    async (days: number = 7, uid?: string) => {
      const targetUserId = uid || userId;
      if (!targetUserId) {
        return [];
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const results = await calculationsService.getRecent(targetUserId, days);

        setState(prev => ({
          ...prev,
          history: results,
          loading: false,
          error: null,
        }));

        return results;
      } catch (error) {
        console.error('[useCalculations] Get recent failed:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Load failed',
        }));
        return [];
      }
    },
    [userId]
  );

  /**
   * Get statistics by payment type
   */
  const getStatsByPaymentType = useCallback(
    async (uid?: string) => {
      const targetUserId = uid || userId;
      if (!targetUserId) {
        return {
          expedition: { count: 0, total: 0 },
          renewal: { count: 0, total: 0 },
          urgent: { count: 0, total: 0 },
        };
      }

      try {
        const stats = await calculationsService.getStatsByPaymentType(targetUserId);
        return stats;
      } catch (error) {
        console.error('[useCalculations] Get stats failed:', error);
        return {
          expedition: { count: 0, total: 0 },
          renewal: { count: 0, total: 0 },
          urgent: { count: 0, total: 0 },
        };
      }
    },
    [userId]
  );

  /**
   * Delete calculation
   */
  const deleteCalculation = useCallback(
    async (calculationId: number, uid?: string) => {
      const targetUserId = uid || userId;
      if (!targetUserId) {
        throw new Error('User ID required to delete calculation');
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const success = await calculationsService.deleteCalculation(targetUserId, calculationId);

        if (success) {
          // Reload history
          await loadHistory(targetUserId);
          console.log('[useCalculations] Calculation deleted');
        }

        return success;
      } catch (error) {
        console.error('[useCalculations] Delete calculation failed:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Delete failed',
        }));
        throw error;
      }
    },
    [userId, loadHistory]
  );

  /**
   * Clear all history
   */
  const clearHistory = useCallback(
    async (uid?: string) => {
      const targetUserId = uid || userId;
      if (!targetUserId) {
        throw new Error('User ID required to clear history');
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const success = await calculationsService.clearHistory(targetUserId);

        if (success) {
          setState(prev => ({
            ...prev,
            history: [],
            loading: false,
            totalCalculated: 0,
            count: 0,
            error: null,
          }));

          console.log('[useCalculations] History cleared');
        }

        return success;
      } catch (error) {
        console.error('[useCalculations] Clear history failed:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Clear failed',
        }));
        throw error;
      }
    },
    [userId]
  );

  /**
   * Load history on mount if userId provided
   */
  useEffect(() => {
    if (userId) {
      loadHistory(userId);
    }
  }, [userId, loadHistory]);

  return {
    // State
    history: state.history,
    loading: state.loading,
    error: state.error,
    totalCalculated: state.totalCalculated,
    count: state.count,

    // Actions
    calculate,
    calculateAndSave,
    loadHistory,
    getByService,
    getRecent,
    getStatsByPaymentType,
    deleteCalculation,
    clearHistory,
  };
}
