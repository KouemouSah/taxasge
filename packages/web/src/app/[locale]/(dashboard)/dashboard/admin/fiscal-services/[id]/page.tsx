'use client'

/**
 * Fiscal Service Detail Page
 * View complete service information with tabs
 *
 * PHASE 8.3: Service Detail View
 * CRITICAL: 100% backend-aligned with fiscal_service_routes.py
 *
 * @module dashboard/admin/fiscal-services/[id]
 * @author Claude Code
 * @date 2025-11-25
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Calendar,
  DollarSign,
  Info,
  BookOpen,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import fiscalServicesAPI from '@/modules/fiscal-services/services/api'
import type {
  FiscalServiceResponse,
  ServiceStatusEnum,
} from '@/types/fiscal-service'
import { BackendUnavailableAlert } from '@/modules/admin/components'

export default function FiscalServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin.fiscalServices')
  const { toast } = useToast()

  const serviceId = params.id as string

  const [service, setService] = useState<FiscalServiceResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBackendUnavailable, setIsBackendUnavailable] = useState(false)

  const fetchService = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fiscalServicesAPI.services.get(serviceId)
      setService(data)
      setIsBackendUnavailable(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorLoading')
      setError(errorMessage)

      if (errorMessage.includes('fetch') || errorMessage.includes('Network') || errorMessage.includes('Failed')) {
        setIsBackendUnavailable(true)
      }

      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: t('errorLoadingServices'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchService()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId])

  const handleDelete = async () => {
    if (!service) return
    if (!confirm(t('confirmDelete', { name: service.nameEs }))) return

    try {
      await fiscalServicesAPI.admin.delete(service.id)
      toast({
        title: t('successTitle'),
        description: t('serviceDeleted'),
      })
      router.push(`/${locale}/dashboard/admin/fiscal-services`)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: t('errorDeleting'),
      })
    }
  }

  const getStatusBadge = (status: ServiceStatusEnum) => {
    const statusConfig: Record<ServiceStatusEnum, { className: string; icon: typeof CheckCircle2 }> = {
      active: { className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      inactive: { className: 'bg-gray-100 text-gray-700', icon: AlertTriangle },
      draft: { className: 'bg-blue-100 text-blue-700', icon: FileText },
      deprecated: { className: 'bg-red-100 text-red-700', icon: AlertTriangle },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant="outline" className={`${config.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {t(`status${status.charAt(0).toUpperCase() + status.slice(1)}` as Parameters<typeof t>[0])}
      </Badge>
    )
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '-'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">{t('loading')}</span>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
        {isBackendUnavailable && <BackendUnavailableAlert />}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-medium">{t('errorLoading')}</p>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{service.nameEs}</h1>
              {getStatusBadge(service.status)}
            </div>
            <p className="text-muted-foreground mt-1">
              Code: <span className="font-mono">{service.serviceCode}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchService}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('refresh')}
          </Button>
          <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/fiscal-services/${service.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            {t('edit')}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('delete')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">
            <Info className="h-4 w-4 mr-2" />
            Information
          </TabsTrigger>
          <TabsTrigger value="calculation">
            <DollarSign className="h-4 w-4 mr-2" />
            Calculation
          </TabsTrigger>
          <TabsTrigger value="legal">
            <BookOpen className="h-4 w-4 mr-2" />
            Legal
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Calendar className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>General service details and classification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Service Code</label>
                  <p className="mt-1 font-mono text-lg">{service.serviceCode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Service Type</label>
                  <p className="mt-1">{t(`type${service.serviceType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}` as Parameters<typeof t>[0])}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category ID</label>
                  <p className="mt-1">{service.categoryId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(service.status)}</div>
                </div>
              </div>

              {service.descriptionEs && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-sm">{service.descriptionEs}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <p className="mt-1">{service.priority || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Complexity Level</label>
                  <p className="mt-1">{service.complexityLevel || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Processing Time</label>
                  <p className="mt-1">{service.processingTimeDays ? `${service.processingTimeDays} days` : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculation Tab */}
        <TabsContent value="calculation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calculation Details</CardTitle>
              <CardDescription>Fee structure and calculation method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Calculation Method</label>
                <p className="mt-1 text-lg font-medium">
                  {t(`method${service.calculationMethod.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}` as Parameters<typeof t>[0])}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Expedition Fee</label>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(service.tasaExpedicion)}</p>
                  {service.expeditionFormula && (
                    <p className="text-xs text-muted-foreground">Formula: {service.expeditionFormula}</p>
                  )}
                  {service.expeditionUnitMeasure && (
                    <p className="text-xs text-muted-foreground">Unit: {service.expeditionUnitMeasure}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Renewal Fee</label>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(service.tasaRenovacion)}</p>
                  {service.renewalFormula && (
                    <p className="text-xs text-muted-foreground">Formula: {service.renewalFormula}</p>
                  )}
                  {service.renewalUnitMeasure && (
                    <p className="text-xs text-muted-foreground">Unit: {service.renewalUnitMeasure}</p>
                  )}
                </div>
              </div>

              {(service.basePercentage || service.unitRate) && (
                <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                  {service.basePercentage && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Base Percentage</label>
                      <p className="mt-1">{service.basePercentage}%</p>
                      {service.percentageOf && (
                        <p className="text-xs text-muted-foreground">Of: {service.percentageOf}</p>
                      )}
                    </div>
                  )}
                  {service.unitRate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Unit Rate</label>
                      <p className="mt-1">{formatCurrency(service.unitRate)}</p>
                      {service.unitType && (
                        <p className="text-xs text-muted-foreground">Per: {service.unitType}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {service.validityPeriodMonths && (
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground">Validity Period</label>
                  <p className="mt-1">{service.validityPeriodMonths} months</p>
                  {service.renewalFrequencyMonths && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Renewal frequency: Every {service.renewalFrequencyMonths} months
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal Tab */}
        <TabsContent value="legal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Legal Information</CardTitle>
              <CardDescription>Legal references and regulatory details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {service.legalReference && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Legal Reference</label>
                  <p className="mt-1">{service.legalReference}</p>
                </div>
              )}

              {service.regulatoryArticles && service.regulatoryArticles.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Regulatory Articles</label>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {service.regulatoryArticles.map((article, index) => (
                      <li key={index} className="text-sm">{article}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Effective From</label>
                  <p className="mt-1">{formatDate(service.tariffEffectiveFrom)}</p>
                </div>
                {service.tariffEffectiveTo && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Effective To</label>
                    <p className="mt-1">{formatDate(service.tariffEffectiveTo)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">View Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{service.viewCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Calculations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{service.calculationCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{service.paymentCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Favorites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{service.favoriteCount}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="mt-1">{formatDate(service.createdAt)}</p>
                  {service.createdBy && (
                    <p className="text-xs text-muted-foreground">By: {service.createdBy}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                  <p className="mt-1">{service.updatedAt ? formatDate(service.updatedAt) : '-'}</p>
                  {service.updatedBy && (
                    <p className="text-xs text-muted-foreground">By: {service.updatedBy}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
