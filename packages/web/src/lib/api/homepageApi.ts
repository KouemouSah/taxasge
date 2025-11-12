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
  description_es: string | null;
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
  } catch (error: any) {
    console.error('Error fetching homepage stats:', error);

    // Extract error message
    const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch homepage statistics';

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
      params: { language }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching category directory:', error);

    // Extract error message
    const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch category directory';

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
    last_updated: new Date().toISOString()
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
    last_updated: new Date().toISOString()
  };
}
