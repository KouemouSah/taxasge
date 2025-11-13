'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft, FileText, DollarSign, Clock, Calendar, AlertCircle,
  CheckCircle, Info, Building2, FolderOpen, Scale, FileCheck,
  AlertTriangle, Tag, Users, ShieldCheck
} from "lucide-react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import Breadcrumb from "@/components/ui/breadcrumb"
import Link from 'next/link'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Service {
  id: number
  service_code: string
  name: string
  description: string | null
  category_name: string
  ministry_name: string
  sector_name: string | null
  service_type: string
  calculation_method: string | null
  expedition_price: number
  renewal_price: number | null
  processing_time_days: number
  validity_period_months: number | null
  grace_period_days: number | null
  late_penalty_percentage: number | null
  legal_reference: string | null
  regulatory_articles: string | null
  required_documents: string[] | null
  eligibility_criteria: string | null
  exemption_conditions: string | null
  status: string
  tariff_effective_from: string | null
  tariff_effective_to: string | null
}

export default function ServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = params.id

  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (serviceId) {
      fetchServiceData()
    }
  }, [serviceId])

  const fetchServiceData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/v1/fiscal-services/${serviceId}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Service non trouvé`)
      }

      const data = await response.json()
      setService(data)

    } catch (err) {
      console.error('Error fetching service:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du service')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getServiceTypeLabel = (type: string): string => {
    const types: { [key: string]: string } = {
      'license': 'Licence',
      'permit': 'Permis',
      'certificate': 'Certificat',
      'registration': 'Enregistrement',
      'authorization': 'Autorisation',
      'declaration': 'Déclaration',
      'stamp': 'Timbre',
      'fee': 'Frais'
    }
    return types[type] || type
  }

  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'suspended': 'bg-yellow-100 text-yellow-800',
      'archived': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
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

  if (error || !service) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto px-4 py-8">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Service non trouvé'}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/services')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux Services
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
              { label: 'Services', href: '/services' },
              { label: service.name }
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

          {/* Service Header */}
          <Card className="p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{service.service_code}</Badge>
                      <Badge className={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{service.name}</h1>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <Link
                        href={`/services?category=${service.category_name}`}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <FolderOpen className="h-4 w-4" />
                        {service.category_name}
                      </Link>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {service.ministry_name}
                      </div>
                      {service.sector_name && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Tag className="h-4 w-4" />
                            {service.sector_name}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {service.description && (
                  <p className="text-muted-foreground mt-4 leading-relaxed">
                    {service.description}
                  </p>
                )}
              </div>

              {/* Quick Info Card */}
              <Card className="bg-muted/50 p-6 min-w-[280px]">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Informations Rapides
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Type de Service</div>
                    <div className="font-medium">{getServiceTypeLabel(service.service_type)}</div>
                  </div>
                  {service.calculation_method && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Méthode de Calcul</div>
                      <div className="font-medium text-sm">{service.calculation_method}</div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </Card>

          {/* Price & Time Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-blue-600 font-medium">Prix d&apos;Expédition</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatPrice(service.expedition_price)}
                  </div>
                </div>
              </div>
            </Card>

            {service.renewal_price !== null && service.renewal_price > 0 && (
              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-green-600 font-medium">Prix de Renouvellement</div>
                    <div className="text-2xl font-bold text-green-900">
                      {formatPrice(service.renewal_price)}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-purple-600 font-medium">Délai de Traitement</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {service.processing_time_days} jours
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">
                <Info className="mr-2 h-4 w-4" />
                Détails
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileCheck className="mr-2 h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="legal">
                <Scale className="mr-2 h-4 w-4" />
                Cadre Légal
              </TabsTrigger>
              <TabsTrigger value="conditions">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Conditions
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Validity & Periods */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Périodes & Validité
                  </h2>
                  <div className="space-y-4">
                    {service.validity_period_months !== null && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <span className="text-muted-foreground">Période de Validité</span>
                        <span className="font-semibold">
                          {service.validity_period_months} mois
                        </span>
                      </div>
                    )}
                    {service.grace_period_days !== null && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <span className="text-muted-foreground">Période de Grâce</span>
                        <span className="font-semibold">
                          {service.grace_period_days} jours
                        </span>
                      </div>
                    )}
                    {service.late_penalty_percentage !== null && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <span className="text-muted-foreground">Pénalité de Retard</span>
                        <span className="font-semibold text-red-600">
                          {service.late_penalty_percentage}%
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-muted-foreground">Délai de Traitement</span>
                      <span className="font-semibold">
                        {service.processing_time_days} jours
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Tariff Period */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Période Tarifaire
                  </h2>
                  <div className="space-y-4">
                    {service.tariff_effective_from && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Date d&apos;Entrée en Vigueur</div>
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          {formatDate(service.tariff_effective_from)}
                        </div>
                      </div>
                    )}
                    {service.tariff_effective_to && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Date de Fin</div>
                        <div className="font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          {formatDate(service.tariff_effective_to)}
                        </div>
                      </div>
                    )}
                    {!service.tariff_effective_from && !service.tariff_effective_to && (
                      <div className="text-muted-foreground text-center py-8">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Aucune période tarifaire spécifiée</p>
                      </div>
                    )}
                  </div>

                  {service.late_penalty_percentage !== null && service.late_penalty_percentage > 0 && (
                    <Alert className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Une pénalité de {service.late_penalty_percentage}% s&apos;applique en cas de retard de paiement.
                      </AlertDescription>
                    </Alert>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Documents Requis
                </h2>
                {service.required_documents && service.required_documents.length > 0 ? (
                  <div className="space-y-3">
                    {service.required_documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{doc}</div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Aucun document requis spécifié</p>
                  </div>
                )}

                <Alert className="mt-6">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Assurez-vous d&apos;avoir tous les documents nécessaires avant de soumettre votre demande.
                    Les documents incomplets peuvent entraîner des retards dans le traitement.
                  </AlertDescription>
                </Alert>
              </Card>
            </TabsContent>

            {/* Legal Tab */}
            <TabsContent value="legal" className="space-y-4">
              <div className="grid grid-cols-1 gap-6">
                {service.legal_reference && (
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Scale className="h-5 w-5" />
                      Référence Légale
                    </h2>
                    <div className="prose max-w-none">
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {service.legal_reference}
                      </p>
                    </div>
                  </Card>
                )}

                {service.regulatory_articles && (
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Articles Réglementaires
                    </h2>
                    <div className="prose max-w-none">
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {service.regulatory_articles}
                      </p>
                    </div>
                  </Card>
                )}

                {!service.legal_reference && !service.regulatory_articles && (
                  <Card className="p-12 text-center">
                    <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Aucune référence légale disponible</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Conditions Tab */}
            <TabsContent value="conditions" className="space-y-4">
              <div className="grid grid-cols-1 gap-6">
                {service.eligibility_criteria && (
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Critères d&apos;Éligibilité
                    </h2>
                    <div className="prose max-w-none">
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {service.eligibility_criteria}
                      </p>
                    </div>
                  </Card>
                )}

                {service.exemption_conditions && (
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5" />
                      Conditions d&apos;Exonération
                    </h2>
                    <div className="prose max-w-none">
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {service.exemption_conditions}
                      </p>
                    </div>
                  </Card>
                )}

                {!service.eligibility_criteria && !service.exemption_conditions && (
                  <Card className="p-12 text-center">
                    <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Aucune condition spéciale disponible</p>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <Card className="p-6 mt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Besoin d&apos;aide ? Contactez {service.ministry_name}</span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.push('/services')}>
                  Voir Tous les Services
                </Button>
                <Button>
                  Commencer la Demande
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
