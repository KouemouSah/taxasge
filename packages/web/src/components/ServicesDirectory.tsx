'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, Building, AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getCategoryDirectory, getDefaultCategoryDirectory, type CategoryDirectory } from "@/lib/api/homepageApi"

export const ServicesDirectory = () => {
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
      } catch (err: any) {
        console.error('Failed to fetch category directory:', err)
        setError(err.message || 'Failed to load category directory')
        // Use default/fallback directory on error
        setDirectory(getDefaultCategoryDirectory())
      } finally {
        setLoading(false)
      }
    }

    fetchDirectory()
  }, [])

  // Display only top 6 categories
  const topCategories = directory?.categories.slice(0, 6) || []

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">Annuaire des services</h2>
            <p className="text-muted-foreground">
              {loading
                ? "Chargement de l'annuaire..."
                : `${directory?.total_categories || 0} catégories • ${directory?.total_services || 0} services disponibles`
              }
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/services")}
            disabled={loading}
          >
            Voir tous les services
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Error Alert */}
        {error && !loading && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Impossible de charger l&apos;annuaire: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Chargement de l&apos;annuaire...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && topCategories.length === 0 && (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune catégorie disponible</h3>
            <p className="text-muted-foreground">
              L&apos;annuaire des services n&apos;est pas encore disponible.
            </p>
          </Card>
        )}

        {/* Category Grid */}
        {!loading && topCategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topCategories.map((category) => (
              <Card
                key={category.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4"
                style={{ borderLeftColor: category.color || '#3b82f6' }}
                onClick={() => router.push(`/services?category=${category.category_code}`)}
              >
                <div className="p-6 space-y-4">
                  {/* Category Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {category.icon && (
                          <span className="text-2xl">{category.icon}</span>
                        )}
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: category.color ? `${category.color}20` : undefined,
                            color: category.color || undefined
                          }}
                        >
                          {category.category_code}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-2">
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

        {/* View All Button (bottom) */}
        {!loading && topCategories.length > 0 && directory && directory.total_categories > 6 && (
          <div className="mt-8 text-center">
            <Button
              size="lg"
              onClick={() => router.push("/services")}
              className="min-w-[200px]"
            >
              Voir toutes les {directory.total_categories} catégories
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

export default ServicesDirectory
