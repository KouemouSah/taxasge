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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Search, X, AlertCircle, Loader2, ChevronLeft, ChevronRight,
  Building2, Clock, LayoutGrid, List, SlidersHorizontal, ChevronDown
} from "lucide-react"
import Breadcrumb from "@/components/ui/breadcrumb"
import {
  searchServices,
  getDefaultSearchResponse,
  formatPrice,
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

  const freeLabel = t('free')

  // State
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Search filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMinistry, setSelectedMinistry] = useState<number | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Debounced search
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  /**
   * Initialize filters from URL query params
   */
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const queryParam = searchParams.get('q')
    const ministryParam = searchParams.get('ministry')

    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }

    if (queryParam) {
      setSearchQuery(queryParam)
    }

    if (ministryParam) {
      setSelectedMinistry(parseInt(ministryParam, 10))
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
        sort_by: 'relevance',
        page: currentPage,
        limit: 20,
        include_facets: true,
        language: locale
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
  }, [searchQuery, selectedCategory, selectedMinistry, selectedServiceType, currentPage, locale])

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

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
    setSelectedMinistry(null)
    setSelectedServiceType(null)
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
    selectedServiceType
  ].filter(Boolean).length

  // Get selected names for display
  const getSelectedCategoryName = () => {
    if (!selectedCategory || !searchResults?.facets?.categories) return null
    const cat = searchResults.facets.categories.find(c => c.code === selectedCategory)
    return cat?.name
  }

  const getSelectedMinistryName = () => {
    if (!selectedMinistry || !searchResults?.facets?.ministries) return null
    const ministry = searchResults.facets.ministries.find(m => m.id === selectedMinistry)
    return ministry?.name
  }

  const getSelectedServiceTypeName = () => {
    if (!selectedServiceType) return null
    return getServiceTypeLabel(selectedServiceType, serviceTypeTranslations)
  }

  return (
    <div className="bg-background">
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

        {/* Advanced Search Bar with Integrated Filters */}
        <div className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-6 text-base"
              />
            </div>

            {/* Filters Popover */}
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-[52px] px-4 gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('filters')}</span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{t('advancedFilters')}</h4>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                        <X className="h-4 w-4 mr-1" />
                        {tCommon('clear')}
                      </Button>
                    )}
                  </div>

                  {/* Category filter */}
                  {searchResults?.facets?.categories && searchResults.facets.categories.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t('category')}</label>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        <Button
                          variant={!selectedCategory ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full justify-start text-sm"
                          onClick={() => { setSelectedCategory(null); setCurrentPage(1) }}
                        >
                          {t('allCategories')}
                        </Button>
                        {searchResults.facets.categories.map((category) => (
                          <Button
                            key={category.code}
                            variant={selectedCategory === category.code ? "secondary" : "ghost"}
                            size="sm"
                            className="w-full justify-between text-sm"
                            onClick={() => { setSelectedCategory(category.code!); setCurrentPage(1) }}
                          >
                            <span className="truncate">{category.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">{category.count}</Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ministry filter */}
                  {searchResults?.facets?.ministries && searchResults.facets.ministries.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t('ministry')}</label>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        <Button
                          variant={!selectedMinistry ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full justify-start text-sm"
                          onClick={() => { setSelectedMinistry(null); setCurrentPage(1) }}
                        >
                          {t('allMinistries')}
                        </Button>
                        {searchResults.facets.ministries.map((ministry: FacetItem) => (
                          <Button
                            key={ministry.id ?? ministry.name}
                            variant={selectedMinistry === ministry.id ? "secondary" : "ghost"}
                            size="sm"
                            className="w-full justify-between text-sm"
                            onClick={() => { setSelectedMinistry(ministry.id!); setCurrentPage(1) }}
                          >
                            <span className="truncate">{ministry.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">{ministry.count}</Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service type filter */}
                  {searchResults?.facets?.service_types && searchResults.facets.service_types.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t('serviceType')}</label>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        <Button
                          variant={!selectedServiceType ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full justify-start text-sm"
                          onClick={() => { setSelectedServiceType(null); setCurrentPage(1) }}
                        >
                          {t('allServiceTypes')}
                        </Button>
                        {searchResults.facets.service_types.map((type) => (
                          <Button
                            key={type.type}
                            variant={selectedServiceType === type.type ? "secondary" : "ghost"}
                            size="sm"
                            className="w-full justify-between text-sm"
                            onClick={() => { setSelectedServiceType(type.type!); setCurrentPage(1) }}
                          >
                            <span className="truncate">{getServiceTypeLabel(type.type!, serviceTypeTranslations)}</span>
                            <Badge variant="outline" className="ml-2 text-xs">{type.count}</Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Active filters display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {getSelectedCategoryName() && (
                <Badge variant="secondary" className="gap-1">
                  {t('category')}: {getSelectedCategoryName()}
                  <button onClick={() => { setSelectedCategory(null); setCurrentPage(1) }} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {getSelectedMinistryName() && (
                <Badge variant="secondary" className="gap-1">
                  {t('ministry')}: {getSelectedMinistryName()}
                  <button onClick={() => { setSelectedMinistry(null); setCurrentPage(1) }} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {getSelectedServiceTypeName() && (
                <Badge variant="secondary" className="gap-1">
                  {t('serviceType')}: {getSelectedServiceTypeName()}
                  <button onClick={() => { setSelectedServiceType(null); setCurrentPage(1) }} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 px-2 text-xs">
                {t('clearFilters')}
              </Button>
            </div>
          )}
        </div>

        {/* Results area */}
        <div>
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

          {/* Kanban View */}
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

          {/* List View */}
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

          {/* Pagination */}
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
  )
}

/**
 * Services Page - Wrapper with Suspense boundary
 * Note: Header and Footer are provided by the (public) layout
 */
export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div className="bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    }>
      <ServicesContent />
    </Suspense>
  )
}
