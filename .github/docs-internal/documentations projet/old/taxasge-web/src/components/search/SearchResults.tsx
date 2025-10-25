'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, SortAsc, Grid, List, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TaxCard } from '@/components/tax/TaxCard'
import { Pagination } from '@/components/ui/pagination'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { taxService } from '@/lib/api/taxService'
import { Tax, SearchFilters } from '@/types/tax'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useOffline } from '@/components/providers/OfflineProvider'

interface SearchResultsProps {
  query: string
  filters: SearchFilters
}

export function SearchResults({ query, filters }: SearchResultsProps) {
  const [results, setResults] = useState<Tax[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(filters.page || 1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState(filters.sort || 'relevance')
  
  const router = useRouter()
  const { language } = useLanguage()
  const { isOnline } = useOffline()

  useEffect(() => {
    searchTaxes()
  }, [query, filters, currentPage, sortBy])

  const searchTaxes = async () => {
    try {
      setLoading(true)
      setError(null)

      let searchResults

      if (isOnline) {
        // Recherche en ligne via API
        searchResults = await taxService.searchTaxes(query, {
          ...filters,
          sort: sortBy,
          page: currentPage,
          language,
        })
      } else {
        // Recherche offline dans IndexedDB
        const offlineResults = await taxService.searchOffline(query)
        searchResults = {
          results: offlineResults,
          total: offlineResults.length,
          page: 1,
          totalPages: 1,
        }
      }

      setResults(searchResults.results)
      setTotalResults(searchResults.total)
      setTotalPages(searchResults.totalPages)
      
    } catch (err) {
      console.error('Search failed:', err)
      setError('Erreur lors de la recherche. Veuillez réessayer.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    updateURL({ sort: newSort, page: '1' })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURL({ page: page.toString() })
    
    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(window.location.search)
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    router.push(`/search?${params.toString()}`)
  }

  const exportResults = () => {
    // Générer CSV des résultats
    const csvContent = generateCSV(results)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `taxasge-search-${query}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const shareResults = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Résultats TaxasGE: ${query}`,
          text: `${totalResults} services fiscaux trouvés pour "${query}"`,
          url: window.location.href,
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      // Fallback: copier URL
      navigator.clipboard.writeText(window.location.href)
      // Afficher toast notification
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-8 text-center">
          <div className="text-destructive mb-4">
            <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <h3 className="text-lg font-semibold">Erreur de Recherche</h3>
          </div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={searchTaxes} variant="outline">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="Aucun résultat trouvé"
        description={`Aucun service fiscal ne correspond à "${query}"`}
        action={
          <Button onClick={() => router.push('/search')} variant="outline">
            Nouvelle recherche
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header résultats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Résultats pour "{query}"
          </h2>
          <p className="text-sm text-muted-foreground">
            {totalResults.toLocaleString()} service{totalResults > 1 ? 's' : ''} trouvé{totalResults > 1 ? 's' : ''}
            {!isOnline && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Recherche hors ligne
              </Badge>
            )}
          </p>
        </div>

        {/* Actions et options d'affichage */}
        <div className="flex items-center space-x-2">
          {/* Tri */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Pertinence</SelectItem>
              <SelectItem value="name_asc">Nom A-Z</SelectItem>
              <SelectItem value="name_desc">Nom Z-A</SelectItem>
              <SelectItem value="price_asc">Prix croissant</SelectItem>
              <SelectItem value="price_desc">Prix décroissant</SelectItem>
            </SelectContent>
          </Select>

          {/* Mode d'affichage */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <Button variant="outline" size="sm" onClick={exportResults}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          
          <Button variant="outline" size="sm" onClick={shareResults}>
            <Share2 className="h-4 w-4 mr-1" />
            Partager
          </Button>
        </div>
      </div>

      {/* Filtres actifs */}
      {(filters.ministry || filters.sector || filters.category || filters.serviceType) && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Filtres actifs:</span>
          {filters.ministry && (
            <Badge variant="secondary">
              Ministère: {filters.ministry}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0"
                onClick={() => updateURL({ ministry: '' })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.sector && (
            <Badge variant="secondary">
              Secteur: {filters.sector}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0"
                onClick={() => updateURL({ sector: '' })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.category && (
            <Badge variant="secondary">
              Catégorie: {filters.category}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0"
                onClick={() => updateURL({ category: '' })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Grille de résultats */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      }>
        {results.map((tax) => (
          <TaxCard 
            key={tax.id} 
            tax={tax} 
            viewMode={viewMode}
            showCategory
            showMinistry
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Suggestions si peu de résultats */}
      {results.length > 0 && results.length < 5 && (
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-foreground mb-2">
              Peu de résultats trouvés
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Essayez d'élargir votre recherche ou utilisez des termes plus généraux
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleSearch('permis')}>
                Permis
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSearch('licence')}>
                Licence
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSearch('déclaration')}>
                Déclaration
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSearch('certificat')}>
                Certificat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Fonction utilitaire pour générer CSV
function generateCSV(taxes: Tax[]): string {
  const headers = ['ID', 'Nom', 'Catégorie', 'Ministère', 'Prix Expédition', 'Prix Renouvellement', 'Délai']
  const rows = taxes.map(tax => [
    tax.id,
    tax.name.es,
    tax.category,
    tax.ministry,
    tax.prices.expedition.toString(),
    tax.prices.renewal?.toString() || 'N/A',
    tax.processingTime
  ])

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}