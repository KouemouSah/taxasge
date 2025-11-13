/**
 * Services API Client - PostgreSQL-based search
 * Connects to /api/v1/fiscal-services/search-db endpoint
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ===================================================================================================
// TYPES
// ===================================================================================================

export interface SearchFilters {
  // Search
  q?: string

  // Filters
  category_id?: number
  category_code?: string
  service_type?: string
  min_price?: number
  max_price?: number

  // Sorting
  sort_by?: 'relevance' | 'name' | 'price' | 'popular'
  sort_order?: 'asc' | 'desc'

  // Pagination
  page?: number
  limit?: number

  // Options
  include_facets?: boolean
  language?: string
}

export interface ServiceResult {
  id: number
  name: string
  description: string | null
  category_name: string
  ministry_name: string | null
  sector_name: string | null
  service_type: string
  expedition_price: number
  renewal_price: number
  processing_time_days: number
  status: string
  // Note: service_code is NOT included (as per requirements)
}

export interface FacetItem {
  id?: number
  code?: string
  name?: string
  type?: string
  range?: string
  count: number
  min?: number
  max?: number
}

export interface SearchFacets {
  categories: FacetItem[]
  service_types: FacetItem[]
  price_ranges: FacetItem[]
}

export interface SearchResponse {
  success: boolean
  query: string
  total_results: number
  page: number
  limit: number
  total_pages: number
  results: ServiceResult[]
  facets: SearchFacets | null
  suggestions: string[]
  execution_time_ms: number
  cached: boolean
}

// ===================================================================================================
// API FUNCTIONS
// ===================================================================================================

/**
 * Search fiscal services with filters
 */
export async function searchServices(filters: SearchFilters = {}): Promise<SearchResponse> {
  try {
    // Default values
    const payload = {
      q: filters.q || null,
      category_id: filters.category_id || null,
      category_code: filters.category_code || null,
      service_type: filters.service_type || null,
      min_price: filters.min_price !== undefined ? filters.min_price : null,
      max_price: filters.max_price !== undefined ? filters.max_price : null,
      sort_by: filters.sort_by || 'relevance',
      sort_order: filters.sort_order || 'asc',
      page: filters.page || 1,
      limit: filters.limit || 20,
      include_facets: filters.include_facets !== false, // true by default
      language: filters.language || 'es'
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/fiscal-services/search-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Search failed: ${response.statusText}`)
    }

    const data: SearchResponse = await response.json()
    return data

  } catch (error) {
    console.error('Search services error:', error)

    // Return fallback response
    return getDefaultSearchResponse('Failed to load services')
  }
}

/**
 * Get default/fallback search response for error cases
 */
export function getDefaultSearchResponse(errorMessage: string = 'Failed to load services'): SearchResponse {
  return {
    success: false,
    query: '',
    total_results: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
    results: [],
    facets: {
      categories: [],
      service_types: [],
      price_ranges: []
    },
    suggestions: [
      'permiso de construcción',
      'licencia comercial',
      'registro de empresa'
    ],
    execution_time_ms: 0,
    cached: false
  }
}

/**
 * Format price for display (GNF currency)
 */
export function formatPrice(price: number): string {
  if (price === 0) {
    return 'Gratuit'
  }

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

/**
 * Get price range label
 */
export function getPriceRangeLabel(range: string): string {
  const labels: Record<string, string> = {
    'free': 'Gratuit',
    'low': '< 50.000 GNF',
    'medium': '50.000 - 200.000 GNF',
    'high': '200.000 - 500.000 GNF',
    'very_high': '> 500.000 GNF'
  }

  return labels[range] || range
}

/**
 * Get service type label (Spanish)
 */
export function getServiceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'administrative': 'Administrativo',
    'fiscal': 'Fiscal',
    'legal': 'Legal',
    'customs': 'Aduanas',
    'mining': 'Minería',
    'commercial': 'Comercial',
    'social': 'Social',
    'transport': 'Transporte',
    'agriculture': 'Agricultura',
    'health': 'Salud',
    'education': 'Educación',
    'other': 'Otro'
  }

  return labels[type] || type
}
