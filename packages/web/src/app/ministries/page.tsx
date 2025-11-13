'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search, Building2, Phone, Mail, Globe, AlertCircle, Loader2, ArrowRight
} from "lucide-react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import Breadcrumb from "@/components/ui/breadcrumb"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Ministry {
  id: number
  ministry_code: string
  name: string
  description: string | null
  website_url: string | null
  contact_email: string | null
  contact_phone: string | null
  categories_count: number
  services_count: number
}

export default function MinistriesPage() {
  const router = useRouter()
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMinistries()
  }, [])

  const fetchMinistries = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/v1/ministries`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron cargar los ministerios`)
      }

      const data = await response.json()
      setMinistries(Array.isArray(data) ? data : data.ministries || [])

    } catch (err) {
      console.error('Error fetching ministries:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar los ministerios')
    } finally {
      setLoading(false)
    }
  }

  const filteredMinistries = ministries.filter((ministry) =>
    ministry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ministry.ministry_code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <Breadcrumb
            items={[
              { label: 'Ministerios' }
            ]}
            className="mb-6"
          />

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Ministerios de Guinea Ecuatorial</h1>
            <p className="text-muted-foreground">
              {loading
                ? "Cargando ministerios..."
                : `${filteredMinistries.length} ministerio${filteredMinistries.length !== 1 ? 's' : ''} encontrado${filteredMinistries.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar ministerios por nombre o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-6 text-base"
              />
            </div>
          </div>

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
              <span className="ml-3 text-muted-foreground">Cargando ministerios...</span>
            </div>
          )}

          {/* No Results */}
          {!loading && filteredMinistries.length === 0 && !error && (
            <Card className="p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron ministerios</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Intenta con otros términos de búsqueda'
                  : 'No hay ministerios disponibles en este momento'}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Limpiar búsqueda
                </Button>
              )}
            </Card>
          )}

          {/* Ministries Grid */}
          {!loading && filteredMinistries.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMinistries.map((ministry) => (
                <Card
                  key={ministry.id}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
                  onClick={() => router.push(`/ministries/${ministry.id}`)}
                >
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {ministry.ministry_code}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {ministry.name}
                      </h3>
                    </div>

                    {/* Description */}
                    {ministry.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {ministry.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {ministry.categories_count || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Categorías</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {ministry.services_count || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Servicios</div>
                      </div>
                    </div>

                    {/* Contact Info (if available) */}
                    <div className="space-y-2 text-sm pt-3 border-t">
                      {ministry.website_url && (
                        <div className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                          <Globe className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate text-xs">Sitio web disponible</span>
                        </div>
                      )}
                      {ministry.contact_email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate text-xs">{ministry.contact_email}</span>
                        </div>
                      )}
                      {ministry.contact_phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs">{ministry.contact_phone}</span>
                        </div>
                      )}
                    </div>

                    {/* View Details Button */}
                    <Button
                      variant="ghost"
                      className="w-full group-hover:bg-primary/10 transition-colors"
                      size="sm"
                    >
                      Ver Detalles
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Info Card */}
          {!loading && filteredMinistries.length > 0 && (
            <Card className="mt-8 p-6 bg-muted/50">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">¿Qué son los Ministerios?</h3>
                  <p className="text-sm text-muted-foreground">
                    Los ministerios son las instituciones gubernamentales responsables de administrar
                    los diferentes servicios y trámites fiscales en Guinea Ecuatorial. Cada ministerio
                    gestiona categorías específicas de servicios relacionados con su área de competencia.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
