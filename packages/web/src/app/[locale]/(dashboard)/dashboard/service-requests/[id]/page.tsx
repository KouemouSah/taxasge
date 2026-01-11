'use client'

/**
 * Service Request Detail Page - User View (Read-Only Consultation)
 *
 * BEHAVIOR:
 * - DRAFT status with wizard → Auto-redirect to wizard
 * - Other statuses → Show read-only consultation page organized by wizard steps
 */

import { useEffect, useState, useCallback, useRef } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress' 
import {
  ArrowLeft,
  ArrowRight,
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
  Download,
} from 'lucide-react'
import {
  useServiceRequests,
  getVisiblePassportSteps,
  getPassportStepIndex,
} from '@/modules/service-requests'

// Workflow prefixes that have dedicated wizards
const WORKFLOW_PREFIXES_WITH_WIZARD = ['PASAPORTE']

// Check if a workflow code has a dedicated wizard
function hasWorkflowWizard(workflowCode: string): boolean {
  return WORKFLOW_PREFIXES_WITH_WIZARD.some(prefix => workflowCode.startsWith(prefix))
}

// Status configuration for visual styling (messages use translation keys)
const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; messageKey: string }> = {
  DRAFT: {
    color: 'bg-slate-500',
    icon: FileText,
    messageKey: 'status_messages.draft',
  },
  TIMBRES_PENDING: {
    color: 'bg-amber-500',
    icon: CreditCard,
    messageKey: 'status_messages.timbres_pending',
  },
  TIMBRES_PAID: {
    color: 'bg-amber-600',
    icon: CheckCircle,
    messageKey: 'status_messages.timbres_paid',
  },
  SUBMITTED: {
    color: 'bg-blue-500',
    icon: Clock,
    messageKey: 'status_messages.submitted',
  },
  DOCUMENTS_REQUIRED: {
    color: 'bg-orange-500',
    icon: AlertCircle,
    messageKey: 'status_messages.documents_required',
  },
  UNDER_REVIEW: {
    color: 'bg-indigo-500',
    icon: Eye,
    messageKey: 'status_messages.under_review',
  },
  DOSSIER_VALIDE: {
    color: 'bg-teal-500',
    icon: CheckCircle,
    messageKey: 'status_messages.dossier_valide',
  },
  REJECTED: {
    color: 'bg-red-500',
    icon: XCircle,
    messageKey: 'status_messages.rejected',
  },
  PAYMENT_PENDING: {
    color: 'bg-yellow-500',
    icon: CreditCard,
    messageKey: 'status_messages.payment_pending',
  },
  PAYMENT_PROCESSING: {
    color: 'bg-yellow-600',
    icon: Loader2,
    messageKey: 'status_messages.payment_processing',
  },
  PAID: {
    color: 'bg-green-500',
    icon: CheckCircle,
    messageKey: 'status_messages.paid',
  },
  CITA_SCHEDULED: {
    color: 'bg-cyan-500',
    icon: CalendarCheck,
    messageKey: 'status_messages.cita_scheduled',
  },
  IN_PROGRESS: {
    color: 'bg-blue-600',
    icon: Clock,
    messageKey: 'status_messages.in_progress',
  },
  COMPLETED: {
    color: 'bg-green-600',
    icon: CheckCircle,
    messageKey: 'status_messages.completed',
  },
  CANCELLED: {
    color: 'bg-gray-500',
    icon: XCircle,
    messageKey: 'status_messages.cancelled',
  },
  EXPIRED: {
    color: 'bg-gray-600',
    icon: Clock,
    messageKey: 'status_messages.expired',
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
    uploadDocument,
  } = useServiceRequests()

  // State for upload dialog
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedDocType, setSelectedDocType] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedDocType) return

    setUploadingDocument(true)
    setUploadError(null)
    setUploadProgress(10)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 90))
      }, 200)

      await uploadDocument(selectedDocType, file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Refresh documents list
      await loadDocuments()
      
      // Close dialog and reset state
      setTimeout(() => {
        setShowUploadDialog(false)
        setSelectedDocType('')
        setUploadProgress(0)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }, 500)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error uploading document')
    } finally {
      setUploadingDocument(false)
    }
  }, [selectedDocType, uploadDocument, loadDocuments])

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

  // Auto-redirect DRAFT status to wizard for workflows with dedicated wizard
  useEffect(() => {
    if (currentRequest && currentRequest.status === 'DRAFT') {
      if (hasWorkflowWizard(currentRequest.workflowCode)) {
        router.replace(`/${locale}/dashboard/service-requests/${requestId}/wizard`)
      }
    }
  }, [currentRequest, locale, requestId, router])

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

  // Format date as DD/MM/YY - HHhMM
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString().slice(-2)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} - ${hours}H${minutes}`
  }

  // Get workflow display name (translated)
  const getWorkflowName = (code: string): string => {
    // Try to get translation first
    const translationKey = `workflows.${code.toLowerCase()}`
    try {
      const translated = t(translationKey)
      if (translated && translated !== translationKey) {
        return translated
      }
    } catch {
      // Fallback to formatting
    }
    // Fallback: Replace underscores with spaces and format
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
          <AlertTitle>{t('no_requests_found')}</AlertTitle>
          <AlertDescription>
            {t('request_not_found_id', { id: requestId })}
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
        <AlertDescription>{t(statusConfig.messageKey)}</AlertDescription>
      </Alert>

      {/* Horizontal Progress Bar - Adapts to workflow type */}
      <Card className="p-4">
        {hasWorkflowWizard(currentRequest.workflowCode) ? (
          // Workflows with wizard use their specific steps from shared constants
          <PassportProgressStepper
            status={currentRequest.status}
            formData={currentRequest.formData as Record<string, unknown> | undefined}
            locale={locale}
          />
        ) : (
          // Generic 6-step progress for other workflows
          <div className="flex items-center justify-between">
            {[
              { key: 'DRAFT', label: t('progress.draft') || 'Borrador' },
              { key: 'DOCUMENTS', label: t('progress.documents') || 'Documentos' },
              { key: 'SUBMITTED', label: t('progress.submitted') || 'Enviado' },
              { key: 'REVIEW', label: t('progress.review') || 'Revisión' },
              { key: 'PAYMENT', label: t('progress.payment') || 'Pago' },
              { key: 'COMPLETED', label: t('progress.completed') || 'Completado' },
            ].map((step, index, arr) => {
              const statusOrder = ['DRAFT', 'DOCUMENTS_REQUIRED', 'SUBMITTED', 'UNDER_REVIEW', 'DOSSIER_VALIDE', 'PAYMENT_PENDING', 'PAID', 'CITA_SCHEDULED', 'IN_PROGRESS', 'COMPLETED']
              const stepToStatus: Record<string, string[]> = {
                'DRAFT': ['DRAFT'],
                'DOCUMENTS': ['DOCUMENTS_REQUIRED'],
                'SUBMITTED': ['SUBMITTED'],
                'REVIEW': ['UNDER_REVIEW', 'DOSSIER_VALIDE'],
                'PAYMENT': ['PAYMENT_PENDING', 'PAID'],
                'COMPLETED': ['CITA_SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
              }
              const currentIndex = statusOrder.indexOf(currentRequest.status)
              const stepStatuses = stepToStatus[step.key]
              const stepMaxIndex = Math.max(...stepStatuses.map(s => statusOrder.indexOf(s)))
              const isActive = stepStatuses.includes(currentRequest.status)
              const isDone = currentIndex > stepMaxIndex
              const isCurrent = isActive && !isDone

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isDone
                          ? 'bg-green-500 text-white'
                          : isCurrent
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isDone ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className={`text-xs mt-1 text-center max-w-[80px] ${isDone ? 'text-green-700 font-medium' : isCurrent ? 'text-blue-700 font-medium' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < arr.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isDone ? 'bg-green-500' : 'bg-muted'}`} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Continue Wizard Button for workflows with dedicated wizard (non-DRAFT only, DRAFT auto-redirects) */}
      {hasWorkflowWizard(currentRequest.workflowCode) && currentRequest.status === 'DOCUMENTS_REQUIRED' && (
        <Alert className="border-primary/50 bg-primary/5">
          <FileText className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">
            {locale === 'es' ? 'Documentos Requeridos' : locale === 'fr' ? 'Documents Requis' : 'Documents Required'}
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {locale === 'es'
                ? 'Se requieren documentos adicionales para continuar.'
                : locale === 'fr'
                  ? 'Des documents supplémentaires sont requis pour continuer.'
                  : 'Additional documents are required to continue.'}
            </span>
            <Button size="sm" asChild>
              <Link href={`/${locale}/dashboard/service-requests/${requestId}/wizard`}>
                {locale === 'es' ? 'Continuar' : locale === 'fr' ? 'Continuer' : 'Continue'}
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      {/* Note: Tariff tab removed - tariff is displayed in Aperçu section (PassportDataSummary) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="documents">{t('documents_tab')}</TabsTrigger>
          {currentRequest.status === 'CITA_SCHEDULED' && (
            <TabsTrigger value="appointment">{t('schedule_appointment') || 'Cita'}</TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {/* Request Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('overview') || 'Información General'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('request_number') || 'Referencia'}</p>
                    <p className="font-mono font-medium">
                      {currentRequest.requestNumber || currentRequest.id.slice(0, 8)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('sub_type') || 'Tipo'}</p>
                    <p className="font-medium">
                      {(() => {
                        const typeValue = currentRequest.subType || (currentRequest.formData as Record<string, unknown>)?.solicitud_type
                        const typeLabels: Record<string, Record<string, string>> = {
                          EXPEDICION: { es: 'Nueva Expedición', fr: 'Nouvelle Émission', en: 'New Issuance' },
                          expedicion: { es: 'Nueva Expedición', fr: 'Nouvelle Émission', en: 'New Issuance' },
                          RENOVACION: { es: 'Renovación', fr: 'Renouvellement', en: 'Renewal' },
                          renovacion: { es: 'Renovación', fr: 'Renouvellement', en: 'Renewal' },
                        }
                        return typeLabels[String(typeValue)]?.[locale] || String(typeValue || 'Expedición')
                      })()}
                    </p>
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
              </CardContent>
            </Card>

            {/* Wizard Data Display - Organized by steps */}
            {hasWorkflowWizard(currentRequest.workflowCode) && currentRequest.formData ? (
              <PassportDataSummary
                formData={currentRequest.formData as Record<string, unknown>}
                locale={locale}
                tariff={tariff}
              />
            ) : (
              /* Generic form data display for non-wizard workflows */
              currentRequest.formData && Object.keys(currentRequest.formData).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('form_data') || 'Datos del Formulario'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(currentRequest.formData).map(([key, value]) => (
                        <div key={key} className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">{key.replace(/_/g, ' ')}</p>
                          <p className="font-medium mt-1">{String(value) || '-'}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('documents_tab')}</CardTitle>
                <CardDescription>
                  {documents.length} {t('documents_uploaded')}
                </CardDescription>
              </div>
              {['DRAFT', 'DOCUMENTS_REQUIRED'].includes(currentRequest.status) && (
                <Button onClick={() => router.push(`/${locale}/dashboard/service-requests/${requestId}/documents`)}>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('upload')}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('documents.no_documents')}</p>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Trigger download with proper filename
                              const link = document.createElement('a')
                              link.href = doc.fileUrl!
                              link.download = doc.fileName || 'document'
                              link.target = '_blank'
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            {locale === 'es' ? 'Descargar' : locale === 'fr' ? 'Télécharger' : 'Download'}
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

        {/* Payment Tab removed - tariff is displayed in Aperçu section (PassportDataSummary) */}

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
          <div className="flex gap-2">
            {hasWorkflowWizard(currentRequest.workflowCode) ? (
              /* Workflows with wizard: Single button to continue wizard */
              <Button
                onClick={() => router.push(`/${locale}/dashboard/service-requests/${requestId}/wizard`)}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                {locale === 'es' ? 'Continuar Solicitud' : locale === 'fr' ? 'Continuer la Demande' : 'Continue Request'}
              </Button>
            ) : (
              /* Workflows without wizard: Upload documents buttons */
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/dashboard/service-requests/${requestId}/documents`)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t('upload_documents')}
                </Button>
                {documents.length > 0 && (
                  <Button
                    onClick={() => router.push(`/${locale}/dashboard/service-requests/${requestId}/documents`)}
                    disabled={documents.length === 0}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('continue_to_verification')}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('upload_document') || 'Subir Documento'}
            </DialogTitle>
            <DialogDescription>
              {t('upload_document_description') || 'Selecciona el tipo de documento y sube el archivo'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Document type selection */}
            <div className="space-y-2">
              <Label htmlFor="docType">{t('document_type') || 'Tipo de documento'}</Label>
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger id="docType">
                  <SelectValue placeholder={t('select_document_type') || 'Seleccionar tipo...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dip_gq">DIP Guinea Ecuatorial</SelectItem>
                  <SelectItem value="pasaporte_gq">Pasaporte GQ</SelectItem>
                  <SelectItem value="partida_nacimiento">Partida de Nacimiento</SelectItem>
                  <SelectItem value="certificado_residencia">Certificado de Residencia</SelectItem>
                  <SelectItem value="foto_carnet">Foto Carnet</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File input */}
            <div className="space-y-2">
              <Label htmlFor="file">{t('file') || 'Archivo'}</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={!selectedDocType || uploadingDocument}
              />
              <p className="text-xs text-muted-foreground">
                PDF, JPG o PNG. Max 5MB.
              </p>
            </div>

            {/* Progress bar */}
            {uploadingDocument && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {t('uploading') || 'Subiendo...'} {uploadProgress}%
                </p>
              </div>
            )}

            {/* Error message */}
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* Success message */}
            {uploadProgress === 100 && !uploadingDocument && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">
                  {t('upload_success') || 'Documento subido correctamente'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// =============================================================================
// PASSPORT PROGRESS STEPPER - Uses shared constants from types/index.ts
// =============================================================================

interface PassportProgressStepperProps {
  status: string
  formData?: Record<string, unknown>
  locale: string
}

function PassportProgressStepper({ status, formData, locale }: PassportProgressStepperProps) {
  // Use shared functions from types/index.ts
  const solicitudType = formData?.solicitud_type as string | undefined
  const visibleSteps = getVisiblePassportSteps(solicitudType)
  const currentStepIndex = getPassportStepIndex(status, formData)

  // Adjust index for hidden motivo step when not RENOVACION
  const isRenovacion = solicitudType === 'RENOVACION'
  const adjustedIndex = !isRenovacion && currentStepIndex > 2
    ? currentStepIndex - 1
    : currentStepIndex

  const getLabel = (step: { labelEs: string; labelFr: string; labelEn: string }) => {
    return locale === 'es' ? step.labelEs : locale === 'fr' ? step.labelFr : step.labelEn
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between min-w-[600px]">
        {visibleSteps.map((step, index) => {
          const isDone = index < adjustedIndex
          const isCurrent = index === adjustedIndex

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isDone
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-blue-500 text-white ring-2 ring-blue-200'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : index + 1}
                </div>
                <span className={`text-[10px] mt-1 text-center max-w-[60px] leading-tight ${
                  isDone ? 'text-green-700 font-medium' : isCurrent ? 'text-blue-700 font-medium' : 'text-muted-foreground'
                }`}>
                  {getLabel(step)}
                </span>
              </div>
              {index < visibleSteps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${isDone ? 'bg-green-500' : 'bg-muted'}`} />
              )}
            </div>
          )
        })}
      </div>
      {/* Progress percentage */}
      <div className="mt-3 text-center">
        <span className="text-xs text-muted-foreground">
          {Math.round((adjustedIndex / visibleSteps.length) * 100)}%{' '}
          {locale === 'es' ? 'completado' : locale === 'fr' ? 'complété' : 'completed'}
        </span>
      </div>
    </div>
  )
}

// =============================================================================
// PASSPORT DATA SUMMARY - Displays form data organized by wizard steps
// =============================================================================

interface PassportDataSummaryProps {
  formData: Record<string, unknown>
  locale: string
  tariff?: {
    baseAmount?: number
    totalAmount?: number
    additionalFees?: Array<{ code: string; nameEs?: string; amount: number }>
  } | null
}

function PassportDataSummary({ formData, locale, tariff }: PassportDataSummaryProps) {
  // Labels for each section
  const labels = {
    applicant: {
      es: 'Solicitante',
      fr: 'Demandeur',
      en: 'Applicant',
    },
    requestType: {
      es: 'Tipo de Solicitud',
      fr: 'Type de Demande',
      en: 'Request Type',
    },
    reason: {
      es: 'Motivo',
      fr: 'Motif',
      en: 'Reason',
    },
    personalData: {
      es: 'Datos Personales',
      fr: 'Données Personnelles',
      en: 'Personal Data',
    },
    contact: {
      es: 'Contacto',
      fr: 'Contact',
      en: 'Contact',
    },
    tariff: {
      es: 'Tarifa',
      fr: 'Tarif',
      en: 'Tariff',
    },
  }

  const getLabel = (key: keyof typeof labels) => {
    return labels[key][locale as 'es' | 'fr' | 'en'] || labels[key].es
  }

  // Format field labels
  const formatFieldLabel = (key: string): string => {
    const fieldLabels: Record<string, Record<string, string>> = {
      is_minor: { es: '¿Es menor de edad?', fr: 'Est mineur?', en: 'Is minor?' },
      solicitud_type: { es: 'Tipo de solicitud', fr: 'Type de demande', en: 'Request type' },
      renovacion_motivo: { es: 'Motivo de renovación', fr: 'Motif de renouvellement', en: 'Renewal reason' },
      apellidos: { es: 'Apellidos', fr: 'Nom de famille', en: 'Last name' },
      nombres: { es: 'Nombres', fr: 'Prénoms', en: 'First name' },
      fecha_nacimiento: { es: 'Fecha de nacimiento', fr: 'Date de naissance', en: 'Date of birth' },
      lugar_nacimiento: { es: 'Lugar de nacimiento', fr: 'Lieu de naissance', en: 'Place of birth' },
      sexo: { es: 'Sexo', fr: 'Sexe', en: 'Gender' },
      estado_civil: { es: 'Estado civil', fr: 'État civil', en: 'Marital status' },
      profesion: { es: 'Profesión', fr: 'Profession', en: 'Profession' },
      telefono: { es: 'Teléfono', fr: 'Téléphone', en: 'Phone' },
      email: { es: 'Correo electrónico', fr: 'Email', en: 'Email' },
      direccion: { es: 'Dirección', fr: 'Adresse', en: 'Address' },
      numero_dip: { es: 'Número DIP', fr: 'Numéro DIP', en: 'DIP Number' },
      numero_pasaporte_anterior: { es: 'Pasaporte anterior', fr: 'Passeport précédent', en: 'Previous passport' },
    }
    return fieldLabels[key]?.[locale] || key.replace(/_/g, ' ')
  }

  // Format values
  const formatValue = (key: string, value: unknown): string => {
    if (value === null || value === undefined || value === '') return '-'
    if (typeof value === 'boolean') {
      return value
        ? (locale === 'es' ? 'Sí' : locale === 'fr' ? 'Oui' : 'Yes')
        : (locale === 'es' ? 'No' : locale === 'fr' ? 'Non' : 'No')
    }
    if (key === 'solicitud_type') {
      const types: Record<string, Record<string, string>> = {
        EXPEDICION: { es: 'Nueva Expedición', fr: 'Nouvelle Émission', en: 'New Issuance' },
        RENOVACION: { es: 'Renovación', fr: 'Renouvellement', en: 'Renewal' },
      }
      return types[String(value)]?.[locale] || String(value)
    }
    if (key === 'renovacion_motivo') {
      const motivos: Record<string, Record<string, string>> = {
        VENCIMIENTO: { es: 'Vencimiento', fr: 'Expiration', en: 'Expiration' },
        PERDIDA: { es: 'Pérdida', fr: 'Perte', en: 'Loss' },
        ROBO: { es: 'Robo', fr: 'Vol', en: 'Theft' },
        DETERIORO: { es: 'Deterioro', fr: 'Détérioration', en: 'Damage' },
      }
      return motivos[String(value)]?.[locale] || String(value)
    }
    if (key === 'sexo') {
      const sexos: Record<string, Record<string, string>> = {
        M: { es: 'Masculino', fr: 'Masculin', en: 'Male' },
        F: { es: 'Femenino', fr: 'Féminin', en: 'Female' },
      }
      return sexos[String(value)]?.[locale] || String(value)
    }
    return String(value)
  }

  // Format amount
  const formatAmount = (amount?: number): string => {
    if (!amount) return '-'
    return new Intl.NumberFormat(locale === 'es' ? 'es-GQ' : locale, {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Group fields by section
  // Note: solicitud_type is shown in Aperçu block, not here (avoid redundancy)
  // Note: renovacion_motivo is merged with applicant section
  const applicantFields = ['is_minor', 'renovacion_motivo']
  const personalFields = ['apellidos', 'nombres', 'fecha_nacimiento', 'lugar_nacimiento', 'sexo', 'estado_civil', 'profesion', 'numero_dip', 'numero_pasaporte_anterior']
  const contactFields = ['telefono', 'email', 'direccion']

  const renderFieldGroup = (fields: string[], title: string) => {
    const relevantFields = fields.filter(f => formData[f] !== undefined && formData[f] !== '')
    if (relevantFields.length === 0) return null

    return (
      <Card key={title}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relevantFields.map(field => (
              <div key={field} className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">{formatFieldLabel(field)}</p>
                <p className="font-medium mt-0.5">{formatValue(field, formData[field])}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {/* Applicant Section (includes motif when RENOVACION) */}
      {/* Note: Type de demande is shown in Aperçu block, removed here to avoid redundancy */}
      {renderFieldGroup(applicantFields, getLabel('applicant'))}

      {/* Personal Data Section */}
      {renderFieldGroup(personalFields, getLabel('personalData'))}

      {/* Contact Section */}
      {renderFieldGroup(contactFields, getLabel('contact'))}

      {/* Tariff Section */}
      {tariff && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {getLabel('tariff')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground">
                  {locale === 'es' ? 'Tarifa base' : locale === 'fr' ? 'Tarif de base' : 'Base tariff'}
                </span>
                <span className="font-medium">{formatAmount(tariff.baseAmount)}</span>
              </div>
              {tariff.additionalFees?.map((fee, index) => (
                <div key={index} className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">{fee.nameEs || fee.code}</span>
                  <span className="font-medium">{formatAmount(fee.amount)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between p-2 font-bold">
                <span>Total</span>
                <span className="text-primary">{formatAmount(tariff.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
