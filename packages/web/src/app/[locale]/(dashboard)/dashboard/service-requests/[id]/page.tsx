'use client'

/**
 * Service Request Detail Page - User View
 * Shows request details, documents, status timeline, and next actions
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  CreditCard,
  Upload,
  Eye,
  Loader2,
  MapPin,
  CalendarCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { useServiceRequests } from '@/modules/service-requests'

// Status configuration for visual styling
const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; message: string }> = {
  DRAFT: {
    color: 'bg-slate-500',
    icon: FileText,
    message: 'Tu solicitud está en borrador. Completa los documentos requeridos para continuar.',
  },
  TIMBRES_PENDING: {
    color: 'bg-amber-500',
    icon: CreditCard,
    message: 'Pago de timbres fiscales pendiente.',
  },
  TIMBRES_PAID: {
    color: 'bg-amber-600',
    icon: CheckCircle,
    message: 'Timbres pagados. Puedes continuar con tu solicitud.',
  },
  SUBMITTED: {
    color: 'bg-blue-500',
    icon: Clock,
    message: 'Tu solicitud ha sido enviada y está en espera de revisión.',
  },
  DOCUMENTS_REQUIRED: {
    color: 'bg-orange-500',
    icon: AlertCircle,
    message: 'Se requieren documentos adicionales. Por favor, sube los documentos faltantes.',
  },
  UNDER_REVIEW: {
    color: 'bg-indigo-500',
    icon: Eye,
    message: 'Un agente está revisando tu solicitud.',
  },
  DOSSIER_VALIDE: {
    color: 'bg-teal-500',
    icon: CheckCircle,
    message: 'Tu dossier ha sido validado. Procede al pago.',
  },
  REJECTED: {
    color: 'bg-red-500',
    icon: XCircle,
    message: 'Tu solicitud ha sido rechazada. Revisa los motivos abajo.',
  },
  PAYMENT_PENDING: {
    color: 'bg-yellow-500',
    icon: CreditCard,
    message: 'Pago pendiente. Completa el pago para continuar.',
  },
  PAYMENT_PROCESSING: {
    color: 'bg-yellow-600',
    icon: Loader2,
    message: 'Procesando tu pago. Por favor espera.',
  },
  PAID: {
    color: 'bg-green-500',
    icon: CheckCircle,
    message: 'Pago completado exitosamente.',
  },
  CITA_SCHEDULED: {
    color: 'bg-cyan-500',
    icon: CalendarCheck,
    message: 'Tu cita ha sido programada. Revisa los detalles abajo.',
  },
  IN_PROGRESS: {
    color: 'bg-blue-600',
    icon: Clock,
    message: 'Tu solicitud está siendo procesada.',
  },
  COMPLETED: {
    color: 'bg-green-600',
    icon: CheckCircle,
    message: '¡Felicidades! Tu solicitud ha sido completada.',
  },
  CANCELLED: {
    color: 'bg-gray-500',
    icon: XCircle,
    message: 'Esta solicitud fue cancelada.',
  },
  EXPIRED: {
    color: 'bg-gray-600',
    icon: Clock,
    message: 'Esta solicitud ha expirado.',
  },
}

export default function ServiceRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const requestId = params.id as string
  const t = useTranslations('service_requests')

  const {
    currentRequest,
    documents,
    tariff,
    isLoading,
    error,
    loadRequest,
    loadDocuments,
    calculateTariff,
    clearError,
  } = useServiceRequests()

  // Load request on mount
  useEffect(() => {
    if (requestId) {
      loadRequest(requestId)
      loadDocuments()
    }
  }, [requestId, loadRequest, loadDocuments])

  // Load tariff when request is loaded
  useEffect(() => {
    if (currentRequest && !tariff) {
      calculateTariff()
    }
  }, [currentRequest, tariff, calculateTariff])

  // Get status config
  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT
  }

  // Format currency
  const formatAmount = (amount?: number): string => {
    if (!amount) return '-'
    return new Intl.NumberFormat(locale === 'es' ? 'es-GQ' : locale, {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get workflow display name
  const getWorkflowName = (code: string): string => {
    return code
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Loading state
  if (isLoading && !currentRequest) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          onClick={() => {
            clearError()
            loadRequest(requestId)
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('retry')}
        </Button>
      </div>
    )
  }

  // No request found
  if (!currentRequest) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('no_requests_found') || 'Solicitud no encontrada'}</AlertTitle>
          <AlertDescription>
            No se encontró la solicitud con ID: {requestId}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const statusConfig = getStatusConfig(currentRequest.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {currentRequest.requestNumber || `#${currentRequest.id.slice(0, 8)}`}
            </h1>
            <p className="text-muted-foreground">
              {getWorkflowName(currentRequest.workflowCode)}
            </p>
          </div>
        </div>
        <Badge className={`${statusConfig.color} text-white flex items-center gap-1 px-3 py-1`}>
          <StatusIcon className="h-4 w-4" />
          {t(`status.${currentRequest.status.toLowerCase()}`) || currentRequest.status}
        </Badge>
      </div>

      {/* Status Alert */}
      <Alert
        className={
          currentRequest.status === 'REJECTED'
            ? 'border-red-500 bg-red-50'
            : currentRequest.status === 'COMPLETED'
              ? 'border-green-500 bg-green-50'
              : currentRequest.status === 'DOCUMENTS_REQUIRED'
                ? 'border-orange-500 bg-orange-50'
                : ''
        }
      >
        <StatusIcon className="h-4 w-4" />
        <AlertTitle>
          {t(`status.${currentRequest.status.toLowerCase()}`) || 'Estado de tu solicitud'}
        </AlertTitle>
        <AlertDescription>{statusConfig.message}</AlertDescription>
      </Alert>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="documents">{t('documents')}</TabsTrigger>
          <TabsTrigger value="payment">{t('tariff') || 'Pago'}</TabsTrigger>
          {currentRequest.status === 'CITA_SCHEDULED' && (
            <TabsTrigger value="appointment">{t('schedule_appointment') || 'Cita'}</TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Request Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('overview') || 'Información General'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('request_number') || 'Referencia'}</p>
                    <p className="font-mono font-medium">
                      {currentRequest.requestNumber || currentRequest.id.slice(0, 8)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('sub_type') || 'Tipo'}</p>
                    <p className="font-medium">{currentRequest.subType || 'Expedición'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('created') || 'Creado'}</p>
                    <p className="font-medium">{formatDate(currentRequest.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('table.updated') || 'Actualizado'}</p>
                    <p className="font-medium">{formatDate(currentRequest.updatedAt)}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t('workflow') || 'Trámite'}</p>
                  <p className="font-medium">{getWorkflowName(currentRequest.workflowCode)}</p>
                </div>

                {currentRequest.formData && Object.keys(currentRequest.formData).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t('form_data') || 'Datos del Formulario'}</p>
                      <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                        {Object.entries(currentRequest.formData).slice(0, 5).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Timeline / Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t('history') || 'Progreso'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Simple timeline based on status */}
                  {[
                    { status: 'DRAFT', label: 'Borrador creado', done: true },
                    { status: 'SUBMITTED', label: 'Solicitud enviada', done: ['SUBMITTED', 'UNDER_REVIEW', 'DOSSIER_VALIDE', 'PAYMENT_PENDING', 'PAID', 'CITA_SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(currentRequest.status) },
                    { status: 'UNDER_REVIEW', label: 'En revisión', done: ['DOSSIER_VALIDE', 'PAYMENT_PENDING', 'PAID', 'CITA_SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(currentRequest.status) },
                    { status: 'DOSSIER_VALIDE', label: 'Dossier validado', done: ['DOSSIER_VALIDE', 'PAYMENT_PENDING', 'PAID', 'CITA_SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(currentRequest.status) },
                    { status: 'PAID', label: 'Pago completado', done: ['PAID', 'CITA_SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(currentRequest.status) },
                    { status: 'COMPLETED', label: 'Completado', done: currentRequest.status === 'COMPLETED' },
                  ].map((step, index) => (
                    <div key={step.status} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.done
                            ? 'bg-green-500 text-white'
                            : currentRequest.status === step.status
                              ? 'bg-blue-500 text-white'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {step.done ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${step.done ? 'text-green-700' : ''}`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('documents')}</CardTitle>
                <CardDescription>
                  {documents.length} documento(s) subido(s)
                </CardDescription>
              </div>
              {['DRAFT', 'DOCUMENTS_REQUIRED'].includes(currentRequest.status) && (
                <Button asChild>
                  <Link href={`/${locale}/dashboard/service-requests/${requestId}/upload`}>
                    <Upload className="mr-2 h-4 w-4" />
                    {t('upload') || 'Subir documento'}
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('no_documents') || 'No hay documentos subidos'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.documentNameEs || doc.documentCode}</p>
                          <p className="text-sm text-muted-foreground">{doc.fileName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            doc.extractionStatus === 'completed'
                              ? 'default'
                              : doc.extractionStatus === 'failed'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {doc.extractionStatus === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {doc.extractionStatus === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                          {doc.extractionStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {doc.extractionStatus}
                        </Badge>
                        {doc.fileUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('tariff') || 'Desglose de Pago'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tariff ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tarifa base</span>
                      <span className="font-medium">{formatAmount(tariff.baseAmount)}</span>
                    </div>
                    {tariff.additionalFees?.map((fee, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-muted-foreground">{fee.nameEs || fee.code}</span>
                        <span className="font-medium">{formatAmount(fee.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatAmount(tariff.totalAmount)}</span>
                  </div>

                  {['PAYMENT_PENDING', 'DOSSIER_VALIDE'].includes(currentRequest.status) && (
                    <Button className="w-full mt-4">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Proceder al pago
                    </Button>
                  )}

                  {currentRequest.status === 'PAID' && (
                    <Alert className="mt-4 border-green-500 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertTitle className="text-green-700">Pago completado</AlertTitle>
                      <AlertDescription className="text-green-600">
                        Tu pago ha sido procesado exitosamente.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Calculando tarifa...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointment Tab */}
        {currentRequest.status === 'CITA_SCHEDULED' && (
          <TabsContent value="appointment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5" />
                  {t('schedule_appointment') || 'Detalles de la Cita'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentRequest.appointmentId ? (
                    <>
                      <div className="flex items-center gap-3 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                        <Calendar className="h-8 w-8 text-cyan-600" />
                        <div>
                          <p className="font-bold text-lg text-cyan-800">
                            {t('date')}: Por determinar
                          </p>
                          <p className="text-cyan-600">{t('time')}: Por determinar</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <MapPin className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{t('location')}</p>
                          <p className="text-muted-foreground">Dirección por confirmar</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Cita programada. Detalles pendientes.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Bottom Actions */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={`/${locale}/dashboard/service-requests`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back') || 'Volver a mis solicitudes'}
          </Link>
        </Button>
        {['DRAFT', 'DOCUMENTS_REQUIRED'].includes(currentRequest.status) && (
          <Button asChild>
            <Link href={`/${locale}/dashboard/service-requests/${requestId}/continue`}>
              Continuar solicitud
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
