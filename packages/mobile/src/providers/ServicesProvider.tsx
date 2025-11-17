/**
 * TaxasGE Mobile - Services Provider
 * Global cache for fiscal services with progressive loading
 * Date: 2025-11-16
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { FiscalService, fiscalServicesService } from '../database/services/FiscalServicesService';

interface ServicesContextValue {
  services: FiscalService[];
  isLoading: boolean;
  error: string | null;
  loadServices: (force?: boolean) => Promise<void>;
  clearCache: () => void;
}

const ServicesContext = createContext<ServicesContextValue | undefined>(undefined);

export interface ServicesProviderProps {
  children: ReactNode;
}

/**
 * Services Provider Component
 * Manages global state for fiscal services with intelligent caching and progressive loading
 */
export const ServicesProvider: React.FC<ServicesProviderProps> = ({ children }) => {
  const [services, setServices] = useState<FiscalService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  const INITIAL_LOAD = 50; // Quick initial load
  const FULL_LOAD = 1000; // Full background load

  /**
   * Load fiscal services with intelligent caching and progressive loading
   * @param force - Force reload even if cache is valid
   */
  const loadServices = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    const cacheValid = now - lastLoadTime < CACHE_DURATION;

    // Use cache if valid and not forcing reload
    if (isLoaded && !force && services.length > 0 && cacheValid) {
      console.log('[ServicesProvider] ⚡ Using cached services:', services.length);
      return;
    }

    const startTime = Date.now();
    try {
      setIsLoading(true);
      setError(null);

      console.log('[ServicesProvider] 🚀 Quick loading first services...');
      const quickStart = Date.now();

      // Quick load first 50 services for immediate display
      const initialResults = await fiscalServicesService.getFiltered({}, INITIAL_LOAD);
      console.log(`[ServicesProvider] ⚡ Initial load: ${initialResults.length} services in ${Date.now() - quickStart}ms`);

      setServices(initialResults);
      setIsLoaded(true);
      setIsLoading(false);
      setLastLoadTime(now);

      // Background load remaining services (non-blocking)
      setTimeout(async () => {
        console.log('[ServicesProvider] 📥 Background loading remaining services...');
        const fullStart = Date.now();
        const fullResults = await fiscalServicesService.getFiltered({}, FULL_LOAD);
        setServices(fullResults);
        console.log(`[ServicesProvider] ✅ Full load: ${fullResults.length} services in ${Date.now() - fullStart}ms`);
        console.log(`[ServicesProvider] 📊 Total time: ${Date.now() - startTime}ms`);
      }, 100); // 100ms delay to let UI stabilize

    } catch (err) {
      console.error('[ServicesProvider] ❌ Error loading services:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [isLoaded, services.length, lastLoadTime]);

  /**
   * Clear cache and force next load to fetch fresh data
   */
  const clearCache = useCallback(() => {
    console.log('[ServicesProvider] 🗑️ Clearing cache');
    setServices([]);
    setIsLoaded(false);
    setError(null);
    setLastLoadTime(0);
  }, []);

  /**
   * Auto-load services on mount
   */
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const value: ServicesContextValue = {
    services,
    isLoading,
    error,
    loadServices,
    clearCache,
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};

/**
 * Hook to access services context
 */
export const useServices = (): ServicesContextValue => {
  const context = useContext(ServicesContext);

  if (context === undefined) {
    throw new Error('useServices must be used within a ServicesProvider');
  }

  return context;
};

// Export default for convenience
export default ServicesProvider;
