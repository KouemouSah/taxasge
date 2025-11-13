'use client'

import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, Building, AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getCategoryDirectory, getDefaultCategoryDirectory, type CategoryDirectory } from "@/lib/api/homepageApi"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

/**
 * Page des catégories - Affiche toutes les catégories de services disponibles
 */
export default function CategoriesPage() {
  const router = useRouter()
  const [directory, setDirectory] = useState<CategoryDirectory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDirectory() {
      try {
        setLoading(true)
        setError(null)
        const data = await getCategoryDirectory('es')
        setDirectory(data)
      } catch (err) {
        console.error('Failed to fetch category directory:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load category directory'
        setError(errorMessage)
        // Use default/fallback directory on error
        setDirectory(getDefaultCategoryDirectory())
      } finally {
        setLoading(false)
      }
    }

    fetchDirectory()
  }, [])

  // Display ALL categories (no limit)
  const allCategories = directory?.categories || []

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-4">Toutes les catégories</h1>
              <p className="text-muted-foreground text-lg">
                {loading
                  ? "Chargement des catégories..."
                  : `${directory?.total_categories || 0} catégories • ${directory?.total_services || 0} services disponibles`
                }
              </p>
            </div>

            {/* Error Alert */}
            {error && !loading && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Impossible de charger les catégories: {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Chargement des catégories...</span>
              </div>
            )}

            {/* Empty State */}
            {!loading && allCategories.length === 0 && (
              <Card className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune catégorie disponible</h3>
                <p className="text-muted-foreground">
                  Les catégories de services ne sont pas encore disponibles.
                </p>
              </Card>
            )}

            {/* Category Grid - Display ALL categories */}
            {!loading && allCategories.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {allCategories.map((category) => (
                  <Card
                    key={category.id}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300"
                    onClick={() => router.push(`/services?category=${category.category_code}`)}
                  >
                    <div className="p-6 space-y-4">
                      {/* Category Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {category.icon && (
                              <span className="text-xl">{category.icon}</span>
                            )}
                          </div>
                          <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors line-clamp-2">
                            {category.name_es}
                          </h3>
                        </div>
                      </div>

                      {/* Description */}
                      {category.description_es && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {category.description_es}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="pt-4 border-t space-y-2">
                        {/* Service Count */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-primary">
                            {category.service_count} {category.service_count === 1 ? 'service' : 'services'}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>

                        {/* Ministry/Sector Info */}
                        {(category.ministry_name || category.sector_name) && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Building className="mr-1 h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {category.ministry_name || category.sector_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
