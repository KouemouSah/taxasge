'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle, Loader2, ArrowLeft, Clock, FileText, ListChecks,
  Building2, MapPin, Calendar, DollarSign,
  ChevronRight, Info, Scale
} from "lucide-react"
import Breadcrumb from "@/components/ui/breadcrumb"
import {
  getServiceDetails,
  formatPrice,
  formatDuration,
  getServiceTypeLabel,
  getCalculationMethodLabel,
  type ServiceDetailsResponse,
  type DocumentDetailItem,
  type ProcedureDetailItem,
  type RelatedServiceItem,
} from "@/core/api/serviceDetails"

/**
 * Service Details Page
 * Displays complete information about a fiscal service
 */
export default function ServiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = parseInt(params?.id as string)
  const locale = (params?.locale as string) || 'es'

  const t = useTranslations('serviceDetails')
  const _tCommon = useTranslations('common')

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
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                    {service.status === 'active' ? t('statusActive') : t('statusInactive')}
                  </Badge>
                  <Badge variant="outline">
                    {getServiceTypeLabel(service.service_type, locale)}
                  </Badge>
                  {service.is_free && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {t('free')}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold">{service.name}</h1>
                {service.description && (
                  <p className="text-lg text-muted-foreground mt-2">{service.description}</p>
                )}
              </div>

              {/* Price Card */}
              <Card className="lg:w-80">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Pricing Display Logic */}
                    {(() => {
                      const expeditionPrice = service.pricing.expedition_price;
                      const renewalPrice = service.pricing.renewal_price;
                      const calculationMethod = service.pricing.calculation_method;
                      const isFormulaBased = calculationMethod === 'formula_based' ||
                                             calculationMethod === 'percentage_based' ||
                                             calculationMethod === 'unit_based' ||
                                             calculationMethod === 'tiered_rates' ||
                                             calculationMethod === 'fixed_plus_unit';

                      // Case 3: Free service (price == 0)
                      if (expeditionPrice === 0 && renewalPrice === 0) {
                        return (
                          <div className="text-center">
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-lg px-4 py-2">
                              {t('free')}
                            </Badge>
                          </div>
                        );
                      }

                      // Case 4: Formula-based pricing - show calculate button
                      if (isFormulaBased) {
                        return (
                          <div className="space-y-3">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-2">{t('calculationMethod')}</p>
                              <p className="font-medium mb-4">
                                {getCalculationMethodLabel(calculationMethod, locale)}
                              </p>
                              <Button
                                onClick={() => router.push(`/${locale}/calculateur?service_id=${service.id}`)}
                                className="w-full"
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Calculer
                              </Button>
                            </div>
                          </div>
                        );
                      }

                      // Case 2: Same price for expedition and renewal
                      if (expeditionPrice === renewalPrice && expeditionPrice > 0) {
                        return (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">{t('expeditionPrice')}</p>
                            <p className="text-2xl font-bold text-primary">
                              {formatPrice(expeditionPrice, service.pricing.currency)}
                            </p>
                          </div>
                        );
                      }

                      // Case 1: Different prices for expedition and renewal
                      return (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">{t('expeditionPrice')}</p>
                            <p className="text-2xl font-bold text-primary">
                              {formatPrice(expeditionPrice, service.pricing.currency)}
                            </p>
                          </div>
                          {service.requires_renewal && renewalPrice > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">{t('renewalPrice')}</p>
                              <p className="text-xl font-semibold">
                                {formatPrice(renewalPrice, service.pricing.currency)}
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Additional Info */}
                    {service.processing_time_days && (
                      <div className="flex items-center text-muted-foreground pt-3 border-t">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{t('processingTime', { days: service.processing_time_days })}</span>
                      </div>
                    )}
                    {service.pricing.validity_period_months && (
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{t('validityPeriod', { months: service.pricing.validity_period_months })}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Hierarchy Info */}
          {(service.ministry || service.sector || service.category) && (
            <Card className="mb-8">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {service.ministry && (
                    <>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{service.ministry.name}</span>
                    </>
                  )}
                  {service.sector && (
                    <>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <span>{service.sector.name}</span>
                    </>
                  )}
                  {service.category && (
                    <>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{service.category.name}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="overview">{t('tabOverview')}</TabsTrigger>
              <TabsTrigger value="documents">
                {t('tabDocuments')} ({service.documents_count})
              </TabsTrigger>
              <TabsTrigger value="procedures">
                {t('tabProcedures')} ({service.procedures_count})
              </TabsTrigger>
              <TabsTrigger value="related">{t('tabRelated')}</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      {t('pricingInfo')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('calculationMethod')}</span>
                      <span className="font-medium">
                        {getCalculationMethodLabel(service.pricing.calculation_method, locale)}
                      </span>
                    </div>
                    {service.pricing.percentage_rate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('percentageRate')}</span>
                        <span className="font-medium">{service.pricing.percentage_rate}%</span>
                      </div>
                    )}
                    {service.pricing.unit_price && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('unitPrice')}</span>
                        <span className="font-medium">
                          {formatPrice(service.pricing.unit_price, service.pricing.currency)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      {t('timeInfo')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('processingDays')}</span>
                      <span className="font-medium">
                        {service.processing_time_days || '-'} {t('days')}
                      </span>
                    </div>
                    {service.pricing.validity_period_months && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('validity')}</span>
                        <span className="font-medium">
                          {service.pricing.validity_period_months} {t('months')}
                        </span>
                      </div>
                    )}
                    {service.pricing.renewal_frequency_months && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('renewalFrequency')}</span>
                        <span className="font-medium">
                          {t('every')} {service.pricing.renewal_frequency_months} {t('months')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Info className="h-5 w-5 mr-2" />
                      {t('statistics')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('views')}</span>
                      <span className="font-medium">{service.view_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('calculations')}</span>
                      <span className="font-medium">{service.calculation_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('documentsRequired')}</span>
                      <span className="font-medium">{service.documents_count}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Legal Reference */}
              {service.legal_reference && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Scale className="h-5 w-5 mr-2" />
                      {t('legalReference')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{service.legal_reference}</p>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {service.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('additionalNotes')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{service.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              {service.documents.length === 0 ? (
                <Card className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('noDocuments')}</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {service.documents.map((doc: DocumentDetailItem) => (
                    <Card key={doc.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{doc.name}</h4>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {doc.is_required_expedition && (
                                <Badge variant="outline" className="text-xs">
                                  {t('requiredExpedition')}
                                </Badge>
                              )}
                              {doc.is_required_renewal && (
                                <Badge variant="outline" className="text-xs">
                                  {t('requiredRenewal')}
                                </Badge>
                              )}
                              {doc.validity_duration_months && (
                                <Badge variant="secondary" className="text-xs">
                                  {t('validFor', { months: doc.validity_duration_months })}
                                </Badge>
                              )}
                            </div>
                            {doc.custom_notes && (
                              <p className="text-sm text-muted-foreground mt-2 italic">
                                {doc.custom_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Procedures Tab */}
            <TabsContent value="procedures" className="space-y-6">
              {service.procedures.length === 0 ? (
                <Card className="p-8 text-center">
                  <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('noProcedures')}</p>
                </Card>
              ) : (
                service.procedures.map((procedure: ProcedureDetailItem) => (
                  <Card key={procedure.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{procedure.name}</CardTitle>
                        {procedure.applies_to && (
                          <Badge variant="outline">
                            {procedure.applies_to === 'expedition' ? t('forExpedition') :
                             procedure.applies_to === 'renewal' ? t('forRenewal') : t('forBoth')}
                          </Badge>
                        )}
                      </div>
                      {procedure.description && (
                        <p className="text-sm text-muted-foreground">{procedure.description}</p>
                      )}
                      {procedure.total_estimated_minutes > 0 && (
                        <p className="text-sm text-muted-foreground flex items-center mt-2">
                          <Clock className="h-4 w-4 mr-1" />
                          {t('estimatedTime')}: {formatDuration(procedure.total_estimated_minutes)}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {procedure.steps.map((step, index) => (
                          <div key={step.id} className="flex gap-4">
                            <div className="flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                step.is_optional ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
                              }`}>
                                {step.step_number}
                              </div>
                              {index < procedure.steps.length - 1 && (
                                <div className="w-px h-full bg-border ml-4 mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium">{step.description}</h5>
                                {step.is_optional && (
                                  <Badge variant="secondary" className="text-xs">{t('optional')}</Badge>
                                )}
                              </div>
                              {step.instructions && (
                                <p className="text-sm text-muted-foreground mb-2">{step.instructions}</p>
                              )}
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {step.estimated_duration_minutes && (
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDuration(step.estimated_duration_minutes)}
                                  </span>
                                )}
                                {step.location_address && (
                                  <span className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {step.location_address}
                                  </span>
                                )}
                                {step.office_hours && (
                                  <span>{step.office_hours}</span>
                                )}
                                {step.requires_appointment && (
                                  <Badge variant="outline" className="text-xs">
                                    {t('appointmentRequired')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Related Services Tab */}
            <TabsContent value="related" className="space-y-6">
              {/* Parent Service */}
              {service.parent_service && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('parentService')}</h3>
                  <RelatedServiceCard
                    service={service.parent_service}
                    locale={locale}
                    t={t}
                  />
                </div>
              )}

              {/* Child Services */}
              {service.child_services.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('subServices')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.child_services.map((related: RelatedServiceItem) => (
                      <RelatedServiceCard
                        key={related.id}
                        service={related}
                        locale={locale}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Related Services */}
              {service.related_services.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('relatedServices')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.related_services.map((related: RelatedServiceItem) => (
                      <RelatedServiceCard
                        key={related.id}
                        service={related}
                        locale={locale}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No related services */}
              {!service.parent_service &&
               service.child_services.length === 0 &&
               service.related_services.length === 0 && (
                <Card className="p-8 text-center">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('noRelatedServices')}</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
  )
}

/**
 * Related Service Card Component
 */
function RelatedServiceCard({
  service,
  locale,
  t,
}: {
  service: RelatedServiceItem;
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
    <Link href={`/${locale}/services/${service.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 line-clamp-2">{service.name}</h4>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatPrice(service.expedition_price)}</span>
            {service.processing_time_days && (
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {service.processing_time_days} {t('days')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
