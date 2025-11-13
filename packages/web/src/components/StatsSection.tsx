'use client'

import { Users, FileCheck, Building2, TrendingUp, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"
import { getHomepageStats, getDefaultStats, type HomepageStats } from "@/lib/api/homepageApi"

export const StatsSection = () => {
  const [stats, setStats] = useState<HomepageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)
        const data = await getHomepageStats()
        setStats(data)
      } catch (err) {
        console.error('Failed to fetch homepage stats:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics'
        setError(errorMessage)
        // Use default/fallback stats on error
        setStats(getDefaultStats())
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const displayStats = [
    {
      icon: FileCheck,
      value: loading ? "..." : (stats?.total_services.toString() || "0"),
      label: "Services Fiscaux",
      description: "Services disponibles",
      color: "text-primary",
    },
    {
      icon: Building2,
      value: loading ? "..." : (stats?.total_ministries.toString() || "0"),
      label: "Ministères",
      description: "Ministères couverts",
      color: "text-red-600",
    },
    {
      icon: Users,
      value: loading ? "..." : (stats?.total_categories.toString() || "0"),
      label: "Catégories",
      description: "Catégories de services",
      color: "text-yellow-600",
    },
    {
      icon: TrendingUp,
      value: loading ? "..." : (stats?.total_sectors.toString() || "0"),
      label: "Secteurs",
      description: "Secteurs d'activité",
      color: "text-green-600",
    },
  ]

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Une plateforme complète</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Accédez à l&apos;ensemble des services fiscaux de la Guinée Équatoriale, organisés de manière claire et accessible
          </p>
        </div>

        {/* Error Alert */}
        {error && !loading && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Impossible de charger les statistiques: {error}. Affichage des valeurs par défaut.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.label}
                className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="font-semibold text-foreground">{stat.label}</div>
                    <div className="text-sm text-muted-foreground">{stat.description}</div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default StatsSection
