'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft, Building2, Phone, Mail, Globe, MapPin, Clock,
  AlertCircle, Folder, FileText, Users, CheckCircle
} from "lucide-react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import Breadcrumb from "@/components/ui/breadcrumb"
import Link from 'next/link'

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

interface Category {
  id: number
  category_code: string
  name: string
  service_count: number
  icon: string | null
  color: string | null
}

interface Service {
  id: number
  name: string
  category_name: string
  expedition_price: number
  renewal_price: number
  processing_time_days: number
}

// Mock data for location and hours (since not in database)
interface LocationInfo {
  address: string
  city: string
  zipCode: string
  coordinates?: {
    lat: number
    lng: number
  }
}

interface WorkingHours {
  [key: string]: {
    open: string
    close: string
    closed?: boolean
  }
}

const DEFAULT_LOCATION: LocationInfo = {
  address: "Rue de la République",
  city: "Conakry",
  zipCode: "BP 1012"
}

const DEFAULT_HOURS: WorkingHours = {
  "Lundi": { open: "08:00", close: "16:00" },
  "Mardi": { open: "08:00", close: "16:00" },
  "Mercredi": { open: "08:00", close: "16:00" },
  "Jeudi": { open: "08:00", close: "16:00" },
  "Vendredi": { open: "08:00", close: "16:00" },
  "Samedi": { open: "08:00", close: "12:00" },
  "Dimanche": { closed: true, open: "", close: "" }
}

export default function MinistryDetailClient() {
  const params = useParams()
  const router = useRouter()
  const ministryId = params.id

  const [ministry, setMinistry] = useState<Ministry | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ministryId) {
      fetchMinistryData()
    }
  }, [ministryId])

  const fetchMinistryData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch ministry details
      const ministryResponse = await fetch(`${API_BASE_URL}/api/v1/ministries/${ministryId}`)

      if (!ministryResponse.ok) {
        throw new Error(`Error ${ministryResponse.status}: Ministerio no encontrado`)
      }

      const ministryData = await ministryResponse.json()
      setMinistry(ministryData)

      // Fetch categories for this ministry
      const categoriesResponse = await fetch(`${API_BASE_URL}/api/v1/homepage/categories`)
      const categoriesData = await categoriesResponse.json()

      const ministryCategories = categoriesData.categories
        .filter((cat: any) => cat.ministry_name === ministryData.name)
        .map((cat: any) => ({
          id: cat.id,
          category_code: cat.category_code,
          name: cat.name_es,
          service_count: cat.service_count,
          icon: cat.icon,
          color: cat.color
        }))

      setCategories(ministryCategories)

      // Fetch services for this ministry
      const servicesResponse = await fetch(`${API_BASE_URL}/api/v1/fiscal-services/search-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ministry_id: parseInt(ministryId as string),
          limit: 10,
          include_facets: false
        })
      })

      const servicesData = await servicesResponse.json()
      setServices(servicesData.results.map((s: any) => ({
        id: s.id,
        name: s.name,
        category_name: s.category_name,
        expedition_price: s.expedition_price,
        renewal_price: s.renewal_price,
        processing_time_days: s.processing_time_days
      })))

    } catch (err) {
      console.error('Error fetching ministry:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar el ministerio')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !ministry) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto px-4 py-8">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Ministerio no encontrado'}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/ministries')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Ministerios
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <Breadcrumb
            items={[
              { label: 'Ministerios', href: '/ministries' },
              { label: ministry.name }
            ]}
            className="mb-6"
          />

          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          {/* Ministry Header */}
          <Card className="p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-2">{ministry.ministry_code}</Badge>
                    <h1 className="text-3xl font-bold">{ministry.name}</h1>
                  </div>
                </div>

                {ministry.description && (
                  <p className="text-muted-foreground mt-4">
                    {ministry.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <Folder className="h-4 w-4" />
                      <span className="text-sm font-medium">Catégories</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {ministry.categories_count || categories.length}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Services</span>
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {ministry.services_count || services.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info Card */}
              <Card className="bg-muted/50 p-6 min-w-[300px]">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Informations de Contact
                </h3>
                <div className="space-y-3 text-sm">
                  {ministry.website_url && (
                    <a
                      href={ministry.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      {ministry.website_url}
                    </a>
                  )}
                  {ministry.contact_email && (
                    <a
                      href={`mailto:${ministry.contact_email}`}
                      className="flex items-center gap-2 hover:text-primary"
                    >
                      <Mail className="h-4 w-4" />
                      {ministry.contact_email}
                    </a>
                  )}
                  {ministry.contact_phone && (
                    <a
                      href={`tel:${ministry.contact_phone}`}
                      className="flex items-center gap-2 hover:text-primary"
                    >
                      <Phone className="h-4 w-4" />
                      {ministry.contact_phone}
                    </a>
                  )}
                  <div className="flex items-start gap-2 pt-2 border-t">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <div>{DEFAULT_LOCATION.address}</div>
                      <div className="text-muted-foreground">
                        {DEFAULT_LOCATION.city}, {DEFAULT_LOCATION.zipCode}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="categories" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="categories">
                <Folder className="mr-2 h-4 w-4" />
                Catégories
              </TabsTrigger>
              <TabsTrigger value="services">
                <FileText className="mr-2 h-4 w-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="info">
                <Clock className="mr-2 h-4 w-4" />
                Horaires & Accès
              </TabsTrigger>
            </TabsList>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-4">
              {categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Link key={category.id} href={`/services?category=${category.category_code}`}>
                      <Card className="p-6 hover:shadow-lg transition-all cursor-pointer h-full">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold">{category.name}</h3>
                          <Badge variant="secondary">{category.service_count}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {category.service_count} services disponibles
                        </p>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune catégorie disponible</p>
                </Card>
              )}
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-4">
              {services.length > 0 ? (
                <div className="space-y-3">
                  {services.map((service) => (
                    <Link key={service.id} href={`/services/${service.id}`}>
                      <Card className="p-6 hover:shadow-lg transition-all cursor-pointer">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">{service.category_name}</p>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div>
                              <div className="text-xs text-muted-foreground">Expédition</div>
                              <div className="font-semibold text-primary">
                                {formatPrice(service.expedition_price)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Délai</div>
                              <div className="font-medium">
                                {service.processing_time_days}j
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}

                  {ministry.services_count > services.length && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/services?ministry=${ministry.id}`)}
                    >
                      Voir tous les services ({ministry.services_count})
                    </Button>
                  )}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun service disponible</p>
                </Card>
              )}
            </TabsContent>

            {/* Hours & Access Tab */}
            <TabsContent value="info" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Working Hours */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Heures d&apos;Ouverture
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(DEFAULT_HOURS).map(([day, hours]) => (
                      <div key={day} className="flex justify-between items-center pb-2 border-b last:border-0">
                        <span className="font-medium">{day}</span>
                        {hours.closed ? (
                          <span className="text-red-600">Fermé</span>
                        ) : (
                          <span className="text-muted-foreground">
                            {hours.open} - {hours.close}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <Alert className="mt-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Les horaires peuvent varier selon les périodes. Contactez le ministère pour confirmer.
                    </AlertDescription>
                  </Alert>
                </Card>

                {/* Location */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Localisation
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Adresse</h3>
                      <p className="text-muted-foreground">
                        {DEFAULT_LOCATION.address}<br />
                        {DEFAULT_LOCATION.city}<br />
                        {DEFAULT_LOCATION.zipCode}
                      </p>
                    </div>

                    {ministry.contact_phone && (
                      <div>
                        <h3 className="font-medium mb-2">Téléphone</h3>
                        <a
                          href={`tel:${ministry.contact_phone}`}
                          className="text-primary hover:underline"
                        >
                          {ministry.contact_phone}
                        </a>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-3">Comment s&apos;y rendre ?</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                          <span>En transport en commun : Bus 12, 15, 23</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                          <span>En taxi : Zone Centre-ville</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                          <span>Parking disponible sur place</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
