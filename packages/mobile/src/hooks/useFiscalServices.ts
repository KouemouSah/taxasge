/**
 * TaxasGE Mobile - useFiscalServices Hook
 * Hook pour rechercher et gérer les services fiscaux
 */

import { useState, useCallback, useEffect } from 'react';
import {
  fiscalServicesService,
  FiscalService,
  SearchFilters,
} from '../database/services/FiscalServicesService';

export interface FiscalServicesState {
  services: FiscalService[];
  loading: boolean;
  error: string | null;
  total: number;
}

export function useFiscalServices(initialFilters?: SearchFilters) {
  const [state, setState] = useState<FiscalServicesState>({
    services: [],
    loading: false,
    error: null,
    total: 0,
  });

  /**
   * Search services by query
   */
  const search = useCallback(async (query: string, limit: number = 20) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const results = await fiscalServicesService.search(query, limit);

      setState(prev => ({
        ...prev,
        services: results,
        loading: false,
        total: results.length,
        error: null,
      }));

      return results;
    } catch (error) {
      console.error('[useFiscalServices] Search failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Search failed',
      }));
      return [];
    }
  }, []);

  /**
   * Get service by ID
   */
  const getById = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const service = await fiscalServicesService.getById(id);

      setState(prev => ({
        ...prev,
        loading: false,
        error: null,
      }));

      return service;
    } catch (error) {
      console.error('[useFiscalServices] Get by ID failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Load failed',
      }));
      return null;
    }
  }, []);

  /**
   * Get services by category
   */
  const getByCategory = useCallback(async (categoryId: string, limit: number = 50) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const results = await fiscalServicesService.getByCategory(categoryId, limit);

      setState(prev => ({
        ...prev,
        services: results,
        loading: false,
        total: results.length,
        error: null,
      }));

      return results;
    } catch (error) {
      console.error('[useFiscalServices] Get by category failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Load failed',
      }));
      return [];
    }
  }, []);

  /**
   * Get popular services
   */
  const getPopular = useCallback(async (limit: number = 20) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const results = await fiscalServicesService.getPopular(limit);

      setState(prev => ({
        ...prev,
        services: results,
        loading: false,
        total: results.length,
        error: null,
      }));

      return results;
    } catch (error) {
      console.error('[useFiscalServices] Get popular failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Load failed',
      }));
      return [];
    }
  }, []);

  /**
   * Get services with filters
   */
  const getFiltered = useCallback(async (filters: SearchFilters, limit: number = 50) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const results = await fiscalServicesService.getFiltered(filters, limit);
      const total = await fiscalServicesService.getCount(filters);

      setState(prev => ({
        ...prev,
        services: results,
        loading: false,
        total,
        error: null,
      }));

      return results;
    } catch (error) {
      console.error('[useFiscalServices] Get filtered failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Load failed',
      }));
      return [];
    }
  }, []);

  /**
   * Get recent services
   */
  const getRecent = useCallback(async (limit: number = 10) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const results = await fiscalServicesService.getRecent(limit);

      setState(prev => ({
        ...prev,
        services: results,
        loading: false,
        total: results.length,
        error: null,
      }));

      return results;
    } catch (error) {
      console.error('[useFiscalServices] Get recent failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Load failed',
      }));
      return [];
    }
  }, []);

  /**
   * Increment popularity score
   */
  const incrementPopularity = useCallback(async (serviceId: string) => {
    try {
      await fiscalServicesService.incrementPopularity(serviceId);
    } catch (error) {
      console.error('[useFiscalServices] Increment popularity failed:', error);
    }
  }, []);

  /**
   * Load initial data on mount if filters provided
   */
  useEffect(() => {
    if (initialFilters) {
      getFiltered(initialFilters);
    }
  }, [initialFilters, getFiltered]);

  return {
    // State
    services: state.services,
    loading: state.loading,
    error: state.error,
    total: state.total,

    // Actions
    search,
    getById,
    getByCategory,
    getPopular,
    getFiltered,
    getRecent,
    incrementPopularity,
  };
}
