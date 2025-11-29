'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertCircle, Loader2, ArrowLeft, Calculator
} from "lucide-react"
import Breadcrumb from "@/components/ui/breadcrumb"
import {
  getServiceDetails,
  formatPrice,
  getServiceTypeLabel,
  getCalculationMethodLabel,
  type ServiceDetailsResponse,
} from "@/core/api/serviceDetails"

/**
 * Service Details Page
 * Single page layout with 2 columns:
 * - Left: Documents + Procedures (numbered lists)
 * - Right: Description + Pricing
 */
export default function ServiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = parseInt(params?.id as string)
  const locale = (params?.locale as string) || 'es'

  const t = useTranslations('serviceDetails')

  // State
  const [service, setService] = useState<ServiceDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch service details
  useEffect(() => {
    async function fetchDetails() {
      if (!serviceId || isNaN(serviceId)) {
        setError('Invalid service ID')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await getServiceDetails(serviceId, locale)
        setService(data)
      } catch (err) {
        console.error('Failed to fetch service details:', err)
        setError(err instanceof Error ? err.message : 'Failed to load service details')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [serviceId, locale])

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">{t('loading')}</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || t('errorLoading')}
          </AlertDescription>
        </Alert>
        <div className="text-center mt-6">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToServices')}
          </Button>
        </div>
      </div>
    )
  }

  /**
   * Render pricing based on 4 cases:
   * 1. Free (both prices = 0)
   * 2. Formula-based calculation
   * 3. Same price for expedition/renewal
   * 4. Different prices for expedition/renewal
   */
  const renderPricing = () => {
    const expeditionPrice = service.pricing.expedition_price
    const renewalPrice = service.pricing.renewal_price
    const calculationMethod = service.pricing.calculation_method

    const isFormulaBased = calculationMethod === 'formula_based' ||
                           calculationMethod === 'percentage_based' ||
                           calculationMethod === 'unit_based' ||
                           calculationMethod === 'tiered_rates' ||
                           calculationMethod === 'fixed_plus_unit'

    // Case 1: Free service
    if (expeditionPrice === 0 && renewalPrice === 0 && !isFormulaBased) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 text-lg px-4 py-2">
          {t('free')}
        </Badge>
      )
    }

    // Case 2: Formula-based pricing
    if (isFormulaBased) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('calculationMethod')}</p>
          <p className="font-medium">
            {getCalculationMethodLabel(calculationMethod, locale)}
          </p>
          <Button
            onClick={() => router.push(`/${locale}/calculateur?service_id=${service.id}`)}
            className="w-full"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {t('calculate') || 'Calculer'}
          </Button>
        </div>
      )
    }

    // Case 3: Same price for expedition and renewal
    if (expeditionPrice === renewalPrice && expeditionPrice > 0) {
      return (
        <p className="text-2xl font-bold text-primary">
          {formatPrice(expeditionPrice, service.pricing.currency)}
        </p>
      )
    }

    // Case 4: Different prices
    return (
      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">{t('expeditionPrice')}</p>
          <p className="text-xl font-bold text-primary">
            {formatPrice(expeditionPrice, service.pricing.currency)}
          </p>
        </div>
        {renewalPrice > 0 && (
          <div>
            <p className="text-sm text-muted-foreground">{t('renewalPrice')}</p>
            <p className="text-lg font-semibold">
              {formatPrice(renewalPrice, service.pricing.currency)}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: t('services'), href: `/${locale}/services` },
          { label: service.category?.name || t('category') },
          { label: service.name }
        ]}
        className="mb-6"
      />

      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('backToServices')}
      </Button>

      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{service.name}</h1>
        <Badge variant="secondary" className="mt-2">
          {getServiceTypeLabel(service.service_type, locale)}
        </Badge>
      </div>

      {/* Main Content: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: Documents + Procedures */}
        <div className="space-y-6">
          {/* Documents Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('requiredDocuments')}</CardTitle>
            </CardHeader>
            <CardContent>
              {service.documents.length > 0 ? (
                <ol className="list-decimal list-inside space-y-3">
                  {service.documents.map((doc) => (
                    <li key={doc.id} className="text-sm">
                      <span className="font-medium">{doc.name}</span>
                      {doc.description && (
                        <p className="text-muted-foreground ml-5 mt-1">{doc.description}</p>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-muted-foreground">{t('noDocuments')}</p>
              )}
            </CardContent>
          </Card>

          {/* Procedures Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('procedures')}</CardTitle>
            </CardHeader>
            <CardContent>
              {service.procedures.length > 0 ? (
                <ol className="list-decimal list-inside space-y-4">
                  {service.procedures.map((procedure) => (
                    <li key={procedure.id} className="text-sm">
                      <span className="font-medium">{procedure.name}</span>
                      {procedure.description && (
                        <p className="text-muted-foreground ml-5 mt-1">{procedure.description}</p>
                      )}
                      {/* Procedure steps */}
                      {procedure.steps && procedure.steps.length > 0 && (
                        <ol className="list-decimal list-inside ml-5 mt-2 space-y-1">
                          {procedure.steps.map((step) => (
                            <li key={step.id} className="text-xs text-muted-foreground">
                              {step.description}
                            </li>
                          ))}
                        </ol>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-muted-foreground">{t('noProcedures')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Description + Pricing */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Description (only if exists) */}
              {service.description && (
                <div>
                  <h3 className="font-semibold mb-2">{t('description')}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </div>
              )}

              {/* Pricing */}
              <div>
                <h3 className="font-semibold mb-3">{t('pricing')}</h3>
                {renderPricing()}
              </div>

              {/* Legal Reference (if exists) */}
              {service.legal_reference && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">{t('legalReference')}</h3>
                  <p className="text-sm text-muted-foreground">{service.legal_reference}</p>
                </div>
              )}

              {/* Notes (if exists) */}
              {service.notes && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">{t('additionalNotes')}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{service.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ministry/Category Info */}
          {(service.ministry || service.category) && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  {service.ministry && (
                    <div>
                      <span className="text-muted-foreground">{t('ministry') || 'Ministère'}:</span>
                      <span className="ml-2 font-medium">{service.ministry.name}</span>
                    </div>
                  )}
                  {service.category && (
                    <div>
                      <span className="text-muted-foreground">{t('category') || 'Catégorie'}:</span>
                      <span className="ml-2 font-medium">{service.category.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
