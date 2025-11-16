/**
 * TaxasGE Mobile - Services Provider
 * Provides global access to fiscal services data
 * Date: 2025-11-16
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { FiscalService, fiscalServicesService } from '../database/services/FiscalServicesService';

interface ServicesContextValue {
  services: FiscalService[];
  isLoading: boolean;
  error: string | null;
  loadServices: () => Promise<void>;
}

const ServicesContext = createContext<ServicesContextValue | undefined>(undefined);

interface ServicesProviderProps {
  children: ReactNode;
}

/**
 * Services Provider Component
 * Manages global state for fiscal services
 */
export const ServicesProvider: React.FC<ServicesProviderProps> = ({ children }) => {
  const [services, setServices] = useState<FiscalService[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all fiscal services from database
   */
  const loadServices = useCallback(async () => {
    console.log('[ServicesProvider] Loading services...');
    setIsLoading(true);
    setError(null);

    try {
      const allServices = await fiscalServicesService.getAllServices();
      console.log(`[ServicesProvider] Loaded ${allServices.length} services`);
      setServices(allServices);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load services';
      console.error('[ServicesProvider] Error loading services:', errorMessage);
      setError(errorMessage);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load services on mount
   */
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const value: ServicesContextValue = {
    services,
    isLoading,
    error,
    loadServices,
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
