/**
 * Homepage API Client
 * Provides functions to fetch dynamic homepage data from backend
 */

import apiClient from './client';

/**
 * Homepage statistics response
 */
export interface HomepageStats {
  total_services: number;
  total_ministries: number;
  total_categories: number;
  total_sectors: number;
  last_updated: string;
}

/**
 * Category with service count
 */
export interface CategoryWithServices {
  id: number;
  category_code: string;
  name_es: string;
  name_fr?: string;
  name_en?: string;
  description_es: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  icon: string | null;
  color: string | null;
  service_count: number;
  ministry_name: string | null;
  sector_name: string | null;
}

/**
 * Category directory response
 */
export interface CategoryDirectory {
  total_categories: number;
  total_services: number;
  categories: CategoryWithServices[];
  last_updated: string;
}

/**
 * API Error response
 */
export interface ApiError {
  detail: string;
  status?: number;
}

/**
 * Fetch homepage statistics
 * Returns dynamic counts of services, ministries, categories, and sectors
 *
 * @throws {Error} If the API request fails
 */
export async function getHomepageStats(): Promise<HomepageStats> {
  try {
    const response = await apiClient.get<HomepageStats>('/homepage/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching homepage stats:', error);

    // Type-safe error handling
    let errorMessage = 'Failed to fetch homepage statistics';
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { detail?: string } }; message?: string };
      errorMessage = axiosError.response?.data?.detail || axiosError.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Fetch category directory with service counts
 * Returns categories sorted by service count (descending)
 *
 * @param language - Language code (es, fr, en). Default: 'es'
 * @throws {Error} If the API request fails
 */
export async function getCategoryDirectory(language: string = 'es'): Promise<CategoryDirectory> {
  try {
    const response = await apiClient.get<CategoryDirectory>('/homepage/categories', {
      params: { language },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching category directory:', error);

    // Type-safe error handling
    let errorMessage = 'Failed to fetch category directory';
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { detail?: string } }; message?: string };
      errorMessage = axiosError.response?.data?.detail || axiosError.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Get default/fallback stats (used when API fails)
 */
export function getDefaultStats(): HomepageStats {
  return {
    total_services: 0,
    total_ministries: 0,
    total_categories: 0,
    total_sectors: 0,
    last_updated: new Date().toISOString(),
  };
}

/**
 * Get default/fallback category directory (used when API fails)
 */
export function getDefaultCategoryDirectory(): CategoryDirectory {
  return {
    total_categories: 0,
    total_services: 0,
    categories: [],
    last_updated: new Date().toISOString(),
  };
}

/**
 * Service type enum values
 */
export type ServiceType =
  | 'document_processing'
  | 'license_permit'
  | 'residence_permit'
  | 'registration_fee'
  | 'inspection_fee'
  | 'administrative_tax'
  | 'customs_duty'
  | 'declaration_tax';

/**
 * Service details for services-by-type endpoint
 */
export interface ServiceByType {
  id: number;
  service_code: string;
  name_es: string;
  name_fr?: string | null;
  name_en?: string | null;
  tasa_expedicion?: number | null;
}

/**
 * Response for services grouped by type and letter
 */
export interface ServicesByTypeResponse {
  type: string;
  letter?: string | null;
  services: ServiceByType[];
  total: number;
  has_more: boolean;
}

/**
 * Fetch services filtered by service type and optionally by first letter
 *
 * @param type - Service type filter
 * @param options - Optional query parameters
 * @throws {Error} If the API request fails
 */
export async function getServicesByType(
  type: ServiceType,
  options?: {
    letter?: string;
    language?: string;
    limit?: number;
  }
): Promise<ServicesByTypeResponse> {
  try {
    const response = await apiClient.get<ServicesByTypeResponse>('/homepage/services-by-type', {
      params: {
        type,
        letter: options?.letter,
        language: options?.language || 'es',
        limit: options?.limit || 10,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching services by type:', error);

    // Type-safe error handling
    let errorMessage = 'Failed to fetch services by type';
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { detail?: string } }; message?: string };
      errorMessage = axiosError.response?.data?.detail || axiosError.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Get default/fallback services by type response (used when API fails)
 */
export function getDefaultServicesByType(type: ServiceType): ServicesByTypeResponse {
  return {
    type,
    letter: null,
    services: [],
    total: 0,
    has_more: false,
  };
}
