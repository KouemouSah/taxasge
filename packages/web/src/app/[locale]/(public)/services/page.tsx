'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search, Filter, X, AlertCircle, Loader2, ChevronLeft, ChevronRight,
  Building2, Clock, SlidersHorizontal, LayoutGrid, List
} from "lucide-react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import Breadcrumb from "@/components/ui/breadcrumb"
import {
  searchServices,
  getDefaultSearchResponse,
  formatPrice,
  getPriceRangeLabel,
  getServiceTypeLabel,
  type SearchFilters,
  type SearchResponse,
  type ServiceResult,
  type FacetItem
} from "@/core/api/services"

type ViewMode = 'kanban' | 'list'

/**
 * Services Content - Component that uses useSearchParams
 */
function ServicesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const locale = (params?.locale as string) || 'es'
  const t = useTranslations('services')
  const tCommon = useTranslations('common')

  // Translation objects for helper functions
  const serviceTypeTranslations: Record<string, string> = {
    administrative: t('serviceTypes.administrative'),
    fiscal: t('serviceTypes.fiscal'),
    legal: t('serviceTypes.legal'),
    customs: t('serviceTypes.customs'),
    mining: t('serviceTypes.mining'),
    commercial: t('serviceTypes.commercial'),
    social: t('serviceTypes.social'),
    transport: t('serviceTypes.transport'),
    agriculture: t('serviceTypes.agriculture'),
    health: t('serviceTypes.health'),
    education: t('serviceTypes.education'),
    other: t('serviceTypes.other'),
  }

  const priceRangeTranslations: Record<string, string> = {
    free: t('priceRanges.free'),
    low: t('priceRanges.low'),
    medium: t('priceRanges.medium'),
    high: t('priceRanges.high'),
    very_high: t('priceRanges.very_high'),
  }

  const freeLabel = t('free')

  // State
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')

  // Search filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMinistry, setSelectedMinistry] = useState<number | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null)
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null)

  // Advanced price filters
  const [minExpeditionPrice, setMinExpeditionPrice] = useState<number | undefined>()
  const [maxExpeditionPrice, setMaxExpeditionPrice] = useState<number | undefined>()
  const [minRenewalPrice, setMinRenewalPrice] = useState<number | undefined>()
  const [maxRenewalPrice, setMaxRenewalPrice] = useState<number | undefined>()

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
        ministry_id: selectedMinistry || undefined,
        service_type: selectedServiceType || undefined,
        sort_by: sortBy,
        page: currentPage,
        limit: 20,
        include_facets: true,
        language: locale
      }

      // Add price range filters (legacy UI)
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

      // Add advanced price filters
      if (minExpeditionPrice !== undefined) {
        filters.min_expedition_price = minExpeditionPrice
      }
      if (maxExpeditionPrice !== undefined) {
        filters.max_expedition_price = maxExpeditionPrice
      }
      if (minRenewalPrice !== undefined) {
        filters.min_renewal_price = minRenewalPrice
      }
      if (maxRenewalPrice !== undefined) {
        filters.max_renewal_price = maxRenewalPrice
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
  }, [searchQuery, selectedCategory, selectedMinistry, selectedServiceType, selectedPriceRange, minExpeditionPrice, maxExpeditionPrice, minRenewalPrice, maxRenewalPrice, sortBy, currentPage, locale])

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
    setCurrentPage(1)

    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }

    const timer = setTimeout(() => {
      performSearch()
    }, 300)

    setSearchDebounceTimer(timer)
  }

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

  const handleMinistryFilter = (ministryId: number) => {
    setSelectedMinistry(selectedMinistry === ministryId ? null : ministryId)
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
    setSelectedMinistry(null)
    setSelectedServiceType(null)
    setSelectedPriceRange(null)
    setMinExpeditionPrice(undefined)
    setMaxExpeditionPrice(undefined)
    setMinRenewalPrice(undefined)
    setMaxRenewalPrice(undefined)
    setSortBy('relevance')
    setCurrentPage(1)
  }

  const handleServiceClick = (service: ServiceResult) => {
    router.push(`/${locale}/services/${service.id}`)
  }

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
    selectedMinistry,
    selectedServiceType,
    selectedPriceRange,
    minExpeditionPrice !== undefined,
    maxExpeditionPrice !== undefined,
    minRenewalPrice !== undefined,
    maxRenewalPrice !== undefined
  ].filter(Boolean).length

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb
            items={[{ label: t('title') }]}
            className="mb-6"
          />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
              <p className="text-muted-foreground">
                {loading
                  ? t('loading')
                  : t('resultsFound', { count: searchResults?.total_results || 0 })
                }
              </p>
            </div>

            {!loading && searchResults && searchResults.results.length > 0 && (
              <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">{tCommon('viewKanban')}</span>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">{tCommon('viewList')}</span>
                </Button>
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-6 text-base"
              />
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between lg:hidden">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('filters')}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">{activeFiltersCount}</Badge>
              )}
            </Button>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                {tCommon('clear')}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
              <Card className="p-6 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    {t('filters')}
                  </h2>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      <X className="h-4 w-4 mr-1" />
                      {tCommon('clear')}
                    </Button>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">{t('sortBy')}</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'relevance', label: t('sortRelevance') },
                        { value: 'name', label: t('sortName') },
                        { value: 'price', label: t('sortPrice') },
                        { value: 'popular', label: t('sortPopular') }
                      ].map((option) => (
                        <Button
                          key={option.value}
                          variant={sortBy === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => { setSortBy(option.value as typeof sortBy); setCurrentPage(1) }}
                          className="w-full justify-start"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {searchResults?.facets?.categories && searchResults.facets.categories.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">{t('categories')}</h3>
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
                            <Badge variant="secondary" className="ml-2 text-xs">{category.count}</Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults?.facets?.service_types && searchResults.facets.service_types.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">{t('serviceType')}</h3>
                      <div className="space-y-2">
                        {searchResults.facets.service_types.map((type) => (
                          <Button
                            key={type.type}
                            variant={selectedServiceType === type.type ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleServiceTypeFilter(type.type!)}
                            className="w-full justify-between text-left"
                          >
                            <span className="truncate text-xs">{getServiceTypeLabel(type.type!, serviceTypeTranslations)}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">{type.count}</Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults?.facets?.price_ranges && searchResults.facets.price_ranges.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">{t('priceRange')}</h3>
                      <div className="space-y-2">
                        {searchResults.facets.price_ranges.map((range) => (
                          <Button
                            key={range.range}
                            variant={selectedPriceRange === range.range ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePriceRangeFilter(range.range!)}
                            className="w-full justify-between text-left"
                          >
                            <span className="truncate text-xs">{getPriceRangeLabel(range.range!, priceRangeTranslations)}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">{range.count}</Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults?.facets?.ministries && searchResults.facets.ministries.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">{t('ministry')}</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {searchResults.facets.ministries.map((ministry: FacetItem) => (
                          <Button
                            key={ministry.id ?? ministry.name}
                            variant={selectedMinistry === ministry.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => ministry.id && handleMinistryFilter(ministry.id)}
                            className="w-full justify-between text-left"
                          >
                            <span className="truncate text-xs">{ministry.name}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">{ministry.count}</Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium mb-3">{t('specificPrices')}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block">{t('expeditionPrice')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder={t('min')}
                            value={minExpeditionPrice || ''}
                            onChange={(e) => { setMinExpeditionPrice(e.target.value ? parseFloat(e.target.value) : undefined); setCurrentPage(1) }}
                            className="text-xs"
                          />
                          <Input
                            type="number"
                            placeholder={t('max')}
                            value={maxExpeditionPrice || ''}
                            onChange={(e) => { setMaxExpeditionPrice(e.target.value ? parseFloat(e.target.value) : undefined); setCurrentPage(1) }}
                            className="text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block">{t('renewalPrice')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder={t('min')}
                            value={minRenewalPrice || ''}
                            onChange={(e) => { setMinRenewalPrice(e.target.value ? parseFloat(e.target.value) : undefined); setCurrentPage(1) }}
                            className="text-xs"
                          />
                          <Input
                            type="number"
                            placeholder={t('max')}
                            value={maxRenewalPrice || ''}
                            onChange={(e) => { setMaxRenewalPrice(e.target.value ? parseFloat(e.target.value) : undefined); setCurrentPage(1) }}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </aside>

            <div className="lg:col-span-3">
              {error && !loading && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading && (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">{t('searching')}</span>
                </div>
              )}

              {!loading && searchResults && searchResults.total_results === 0 && (
                <Card className="p-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('noResults')}</h3>
                  <p className="text-muted-foreground mb-4">{t('tryDifferentFilters')}</p>
                  {searchResults.suggestions && searchResults.suggestions.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm text-muted-foreground mb-3">{t('suggestions')}:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {searchResults.suggestions.map((suggestion, idx) => (
                          <Button key={idx} variant="outline" size="sm" onClick={() => handleSearchChange(suggestion)}>
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {!loading && searchResults && searchResults.results.length > 0 && viewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {searchResults.results.map((service) => (
                    <Card
                      key={service.id}
                      className="group cursor-pointer hover:shadow-lg transition-all duration-300"
                      onClick={() => handleServiceClick(service)}
                    >
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {service.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">{service.category_name}</Badge>
                        </div>
                        {service.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">{service.description}</p>
                        )}
                        <div className="space-y-2 text-sm">
                          {service.ministry_name && (
                            <div className="flex items-center text-muted-foreground">
                              <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate">{service.ministry_name}</span>
                            </div>
                          )}
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{t('processingDays', { days: service.processing_time_days })}</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">{t('expedition')}</p>
                              <p className="font-semibold text-primary">{formatPrice(service.expedition_price, freeLabel, locale)}</p>
                            </div>
                            {service.renewal_price > 0 && (
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">{t('renewal')}</p>
                                <p className="font-semibold text-sm">{formatPrice(service.renewal_price, freeLabel, locale)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {!loading && searchResults && searchResults.results.length > 0 && viewMode === 'list' && (
                <div className="space-y-4 mb-8">
                  {searchResults.results.map((service) => (
                    <Card
                      key={service.id}
                      className="group cursor-pointer hover:shadow-md transition-all duration-300"
                      onClick={() => handleServiceClick(service)}
                    >
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                              {service.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <Badge variant="secondary" className="text-xs">{service.category_name}</Badge>
                              {service.ministry_name && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  <span>{service.ministry_name}</span>
                                </div>
                              )}
                            </div>
                            {service.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{service.description}</p>
                            )}
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>{t('processingDays', { days: service.processing_time_days })}</span>
                            </div>
                          </div>
                          <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-2 pt-4 md:pt-0 border-t md:border-t-0 md:border-l md:pl-6">
                            <div className="text-center md:text-right">
                              <p className="text-xs text-muted-foreground mb-1">{t('expedition')}</p>
                              <p className="font-bold text-xl text-primary">{formatPrice(service.expedition_price, freeLabel, locale)}</p>
                            </div>
                            {service.renewal_price > 0 && (
                              <div className="text-center md:text-right">
                                <p className="text-xs text-muted-foreground mb-1">{t('renewal')}</p>
                                <p className="font-semibold text-base">{formatPrice(service.renewal_price, freeLabel, locale)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {!loading && searchResults && searchResults.results.length > 0 && searchResults.total_pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                  <Button variant="outline" onClick={handlePreviousPage} disabled={currentPage === 1} className="w-full sm:w-auto">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    {tCommon('previous')}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {tCommon('pageOf', { current: currentPage, total: searchResults.total_pages })}
                  </span>
                  <Button variant="outline" onClick={handleNextPage} disabled={currentPage === searchResults.total_pages} className="w-full sm:w-auto">
                    {tCommon('next')}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {!loading && searchResults && searchResults.execution_time_ms > 0 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {t('searchCompleted', { time: searchResults.execution_time_ms.toFixed(2) })}
                  {searchResults.cached && ` (${t('cached')})`}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

/**
 * Services Page - Wrapper with Suspense boundary
 */
export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Cargando...</span>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <ServicesContent />
    </Suspense>
  )
}
