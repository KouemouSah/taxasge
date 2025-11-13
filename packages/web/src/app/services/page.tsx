'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search, Filter, X, AlertCircle, Loader2, ChevronLeft, ChevronRight,
  Building2, Clock, SlidersHorizontal
} from "lucide-react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import {
  searchServices,
  getDefaultSearchResponse,
  formatPrice,
  getPriceRangeLabel,
  getServiceTypeLabel,
  type SearchFilters,
  type SearchResponse,
  type ServiceResult
} from "@/lib/api/servicesApi"

/**
 * Services Page - Advanced search with filters
 * Connects to PostgreSQL-based search endpoint
 */
export default function ServicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Search filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null)
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'relevance' | 'name' | 'price' | 'popular'>('relevance')
  const [currentPage, setCurrentPage] = useState(1)

  // Debounced search
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  /**
   * Initialize filters from URL query params
   */
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const queryParam = searchParams.get('q')

    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }

    if (queryParam) {
      setSearchQuery(queryParam)
    }
  }, [searchParams])

  /**
   * Perform search
   */
  const performSearch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: SearchFilters = {
        q: searchQuery || undefined,
        category_code: selectedCategory || undefined,
        service_type: selectedServiceType || undefined,
        sort_by: sortBy,
        page: currentPage,
        limit: 20,
        include_facets: true,
        language: 'es'
      }

      // Add price range filters
      if (selectedPriceRange) {
        const priceRanges: Record<string, { min?: number, max?: number }> = {
          'free': { max: 0 },
          'low': { min: 0, max: 50000 },
          'medium': { min: 50000, max: 200000 },
          'high': { min: 200000, max: 500000 },
          'very_high': { min: 500000 }
        }

        const range = priceRanges[selectedPriceRange]
        if (range) {
          filters.min_price = range.min
          filters.max_price = range.max
        }
      }

      const results = await searchServices(filters)
      setSearchResults(results)

    } catch (err) {
      console.error('Search failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to search services'
      setError(errorMessage)
      setSearchResults(getDefaultSearchResponse())
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory, selectedServiceType, selectedPriceRange, sortBy, currentPage])

  /**
   * Trigger search when filters change
   */
  useEffect(() => {
    performSearch()
  }, [performSearch])

  /**
   * Handle search input change with debounce
   */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page

    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }

    // Set new timer (300ms debounce)
    const timer = setTimeout(() => {
      performSearch()
    }, 300)

    setSearchDebounceTimer(timer)
  }

  /**
   * Handle filter changes
   */
  const handleCategoryFilter = (categoryCode: string) => {
    setSelectedCategory(selectedCategory === categoryCode ? null : categoryCode)
    setCurrentPage(1)
  }

  const handleServiceTypeFilter = (type: string) => {
    setSelectedServiceType(selectedServiceType === type ? null : type)
    setCurrentPage(1)
  }

  const handlePriceRangeFilter = (range: string) => {
    setSelectedPriceRange(selectedPriceRange === range ? null : range)
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
    setSelectedServiceType(null)
    setSelectedPriceRange(null)
    setSortBy('relevance')
    setCurrentPage(1)
  }

  /**
   * Navigate to service detail page
   */
  const handleServiceClick = (service: ServiceResult) => {
    // TODO: Navigate to service detail page
    console.log('Service clicked:', service)
    router.push(`/services/${service.id}`)
  }

  /**
   * Handle pagination
   */
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (searchResults && currentPage < searchResults.total_pages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const activeFiltersCount = [
    selectedCategory,
    selectedServiceType,
    selectedPriceRange
  ].filter(Boolean).length

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Servicios Fiscales</h1>
            <p className="text-muted-foreground">
              {loading
                ? "Cargando servicios..."
                : `${searchResults?.total_results || 0} servicios encontrados`
              }
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar servicios fiscales..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-6 text-base"
              />
            </div>
          </div>

          {/* Filter Toggle (Mobile) */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <aside className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
              <Card className="p-6 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros
                  </h2>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Sort By */}
                  <div>
                    <h3 className="font-medium mb-3">Ordenar por</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'relevance', label: 'Relevancia' },
                        { value: 'name', label: 'Nombre' },
                        { value: 'price', label: 'Precio' },
                        { value: 'popular', label: 'Popularidad' }
                      ].map((option) => (
                        <Button
                          key={option.value}
                          variant={sortBy === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => { setSortBy(option.value as 'relevance' | 'name' | 'price' | 'popular'); setCurrentPage(1) }}
                          className="w-full justify-start"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Categories Facets */}
                  {searchResults?.facets?.categories && searchResults.facets.categories.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Categorías</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {searchResults.facets.categories.map((category) => (
                          <Button
                            key={category.code}
                            variant={selectedCategory === category.code ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCategoryFilter(category.code!)}
                            className="w-full justify-between text-left"
                          >
                            <span className="truncate text-xs">{category.name}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {category.count}
                            </Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service Types Facets */}
                  {searchResults?.facets?.service_types && searchResults.facets.service_types.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Tipo de Servicio</h3>
                      <div className="space-y-2">
                        {searchResults.facets.service_types.map((type) => (
                          <Button
                            key={type.type}
                            variant={selectedServiceType === type.type ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleServiceTypeFilter(type.type!)}
                            className="w-full justify-between text-left"
                          >
                            <span className="truncate text-xs">{getServiceTypeLabel(type.type!)}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {type.count}
                            </Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Ranges Facets */}
                  {searchResults?.facets?.price_ranges && searchResults.facets.price_ranges.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Rango de Precio</h3>
                      <div className="space-y-2">
                        {searchResults.facets.price_ranges.map((range) => (
                          <Button
                            key={range.range}
                            variant={selectedPriceRange === range.range ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePriceRangeFilter(range.range!)}
                            className="w-full justify-between text-left"
                          >
                            <span className="truncate text-xs">{getPriceRangeLabel(range.range!)}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {range.count}
                            </Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </aside>

            {/* Results Section */}
            <div className="lg:col-span-3">
              {/* Error Alert */}
              {error && !loading && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Buscando servicios...</span>
                </div>
              )}

              {/* No Results */}
              {!loading && searchResults && searchResults.total_results === 0 && (
                <Card className="p-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron servicios</h3>
                  <p className="text-muted-foreground mb-4">
                    Intenta con otros términos de búsqueda o filtros
                  </p>

                  {/* Suggestions */}
                  {searchResults.suggestions && searchResults.suggestions.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm text-muted-foreground mb-3">Sugerencias:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {searchResults.suggestions.map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSearchChange(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Results Grid */}
              {!loading && searchResults && searchResults.results.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    {searchResults.results.map((service) => (
                      <Card
                        key={service.id}
                        className="group cursor-pointer hover:shadow-lg transition-all duration-300"
                        onClick={() => handleServiceClick(service)}
                      >
                        <div className="p-6 space-y-4">
                          {/* Header */}
                          <div>
                            <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
                              {service.name}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {service.category_name}
                            </Badge>
                          </div>

                          {/* Description */}
                          {service.description && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {service.description}
                            </p>
                          )}

                          {/* Info */}
                          <div className="space-y-2 text-sm">
                            {service.ministry_name && (
                              <div className="flex items-center text-muted-foreground">
                                <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="truncate">{service.ministry_name}</span>
                              </div>
                            )}

                            <div className="flex items-center text-muted-foreground">
                              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>{service.processing_time_days} días de procesamiento</span>
                            </div>
                          </div>

                          {/* Pricing */}
                          <div className="pt-4 border-t">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Expedición</p>
                                <p className="font-semibold text-primary">
                                  {formatPrice(service.expedition_price)}
                                </p>
                              </div>
                              {service.renewal_price > 0 && (
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Renovación</p>
                                  <p className="font-semibold text-sm">
                                    {formatPrice(service.renewal_price)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {searchResults.total_pages > 1 && (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Anterior
                      </Button>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Página {currentPage} de {searchResults.total_pages}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        onClick={handleNextPage}
                        disabled={currentPage === searchResults.total_pages}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}

                  {/* Execution time (debug info) */}
                  {searchResults.execution_time_ms > 0 && (
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Búsqueda completada en {searchResults.execution_time_ms.toFixed(2)}ms
                      {searchResults.cached && ' (en caché)'}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
