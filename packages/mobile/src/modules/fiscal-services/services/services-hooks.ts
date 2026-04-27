/**
 * Fiscal Services React Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useRef, useEffect } from 'react';
import * as servicesApi from './services-api';
import { logger } from '@core/logging/logger';
import type { ServiceSearchFilters, ServiceSearchResponse } from '../types/services.types';

export const SERVICES_QUERY_KEYS = {
  list: ['fiscal-services'] as const,
  detail: (id: number) => ['fiscal-services', 'detail', id] as const,
  ministries: ['fiscal-services', 'ministries'] as const,
  categories: ['fiscal-services', 'categories'] as const,
  popular: ['fiscal-services', 'popular'] as const,
  search: (q: string) => ['fiscal-services', 'search', q] as const,
} as const;

/** Ministries list — cached 1 hour */
export function useMinistries(language = 'es') {
  return useQuery({
    queryKey: [...SERVICES_QUERY_KEYS.ministries, language],
    queryFn: () => servicesApi.getMinistries(language),
    staleTime: 60 * 60_000,
  });
}

/** Categories list — cached 1 hour */
export function useCategories(language = 'es') {
  return useQuery({
    queryKey: [...SERVICES_QUERY_KEYS.categories, language],
    queryFn: () => servicesApi.getCategories(language),
    staleTime: 60 * 60_000,
  });
}

/** Popular services — cached 1 hour */
export function usePopularServices(limit = 10) {
  return useQuery({
    queryKey: [...SERVICES_QUERY_KEYS.popular, limit],
    queryFn: () => servicesApi.getPopularServices(limit),
    staleTime: 60 * 60_000,
  });
}

/** Service detail — cached 1 hour */
export function useServiceDetail(id: number, language = 'es', enabled = true) {
  return useQuery({
    queryKey: [...SERVICES_QUERY_KEYS.detail(id), language],
    queryFn: () => servicesApi.getServiceDetail(id, language),
    enabled: enabled && id > 0,
    staleTime: 60 * 60_000,
  });
}

/**
 * Debounced service search hook.
 * Returns search results with facets, auto-triggers after 300ms of inactivity.
 */
export function useServiceSearch(debounceMs = 300, language = 'es') {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ServiceSearchFilters>({});
  const [results, setResults] = useState<ServiceSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const currentFiltersRef = useRef<ServiceSearchFilters>({});

  const search = useCallback(
    (q: string, extraFilters: Partial<ServiceSearchFilters> = {}) => {
      setQuery(q);
      const merged = { ...filters, ...extraFilters, q };
      currentFiltersRef.current = merged;
      currentPageRef.current = 1;
      hasMoreRef.current = true;

      if (timerRef.current) clearTimeout(timerRef.current);

      if (!q && !merged.category_id && !merged.ministry_id) {
        setResults(null);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      timerRef.current = setTimeout(async () => {
        try {
          const data = await servicesApi.searchServices({
            ...merged,
            language: merged.language ?? language,
            include_facets: true,
            limit: 30,
            page: 1,
          });
          setResults(data);
          const items = data.results || data.services || [];
          const total = data.total_results ?? data.total ?? 0;
          hasMoreRef.current = items.length < total;
        } catch (error) {
          logger.error('ServiceSearch', error, 'Search failed');
          setSearchError(error instanceof Error ? error.message : 'Search failed');
        } finally {
          setIsSearching(false);
        }
      }, debounceMs);
    },
    [filters, debounceMs, language],
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreRef.current || !results) return;
    setIsLoadingMore(true);
    const nextPage = currentPageRef.current + 1;
    try {
      const data = await servicesApi.searchServices({
        ...currentFiltersRef.current,
        language: currentFiltersRef.current.language ?? language,
        include_facets: false,
        limit: 30,
        page: nextPage,
      });
      const newItems = data.results || data.services || [];
      if (newItems.length === 0) {
        hasMoreRef.current = false;
      } else {
        currentPageRef.current = nextPage;
        setResults((prev) => {
          if (!prev) return data;
          const existingItems = prev.results || prev.services || [];
          return {
            ...prev,
            results: [...existingItems, ...newItems],
            services: [...existingItems, ...newItems],
          };
        });
      }
    } catch {
      // Silently fail on load more
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, results, language]);

  const updateFilters = useCallback((newFilters: Partial<ServiceSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { query, search, results, isSearching, isLoadingMore, loadMore, searchError, filters, updateFilters };
}
