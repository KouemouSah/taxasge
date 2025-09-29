import { Metadata } from 'next'
import { Suspense } from 'react'
import { SearchInterface } from '@/components/search/SearchInterface'
import { SearchResults } from '@/components/search/SearchResults'
import { SearchFilters } from '@/components/search/SearchFilters'
import { SearchSkeleton } from '@/components/search/SearchSkeleton'

export const metadata: Metadata = {
  title: 'Recherche Services Fiscaux - TaxasGE',
  description: 'Recherchez parmi 547 services fiscaux officiels de Guinée Équatoriale. Filtres avancés, tri par pertinence et calculs instantanés.',
  openGraph: {
    title: 'Recherche Services Fiscaux - TaxasGE',
    description: 'Trouvez rapidement le service fiscal dont vous avez besoin',
    images: ['/og-search.png'],
  },
}

interface SearchPageProps {
  searchParams: {
    q?: string
    ministry?: string
    sector?: string
    category?: string
    type?: string
    min?: string
    max?: string
    page?: string
  }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ''
  const filters = {
    ministry: searchParams.ministry,
    sector: searchParams.sector,
    category: searchParams.category,
    serviceType: searchParams.type,
    minPrice: searchParams.min ? parseFloat(searchParams.min) : undefined,
    maxPrice: searchParams.max ? parseFloat(searchParams.max) : undefined,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        {/* Header de recherche */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Recherche Services Fiscaux
          </h1>
          <p className="text-muted-foreground">
            Trouvez rapidement parmi 547 services fiscaux officiels
          </p>
        </div>

        {/* Interface de recherche */}
        <div className="mb-8">
          <SearchInterface initialQuery={query} />
        </div>

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filtres sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <SearchFilters initialFilters={filters} />
            </div>
          </div>

          {/* Résultats */}
          <div className="lg:col-span-3">
            <Suspense fallback={<SearchSkeleton />}>
              <SearchResults query={query} filters={filters} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}