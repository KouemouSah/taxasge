'use client'

/**
 * Service Request Detail Page - Citizen View (Mi Solicitud)
 *
 * 100% dynamic — works for ALL workflows (no passport-specific code).
 * Data comes from a single endpoint: GET /service-requests/{id}/detail-view
 *
 * Features:
 * - Universal progress stepper (adapts to any workflow's steps)
 * - Dynamic data sections (same as PDF, from workflow form configs)
 * - Citizen notifications panel (agent actions, status changes)
 * - Payment & appointment cards
 * - Document list with upload capability
 *
 * BEHAVIOR:
 * - DRAFT status → Auto-redirect to wizard
 * - Other statuses → Read-only consultation with notifications
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
import { useDetailView } from '@/modules/service-requests/hooks/useWorkflowQueries'
import { useServiceRequests } from '@/modules/service-requests'
import { UniversalProgressStepper } from '@/modules/service-requests/components/UniversalProgressStepper'
import { DynamicDataSections } from '@/modules/service-requests/components/DynamicDataSections'
import { CitizenNotificationsPanel } from '@/modules/service-requests/components/CitizenNotificationsPanel'
import { serviceRequestsApi } from '@/modules/service-requests/services/api'

// Status configuration for visual styling (messages use translation keys)
const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; messageKey: string }> = {
  DRAFT: { color: 'bg-slate-500', icon: FileText, messageKey: 'status_messages.draft' },
  TIMBRES_PENDING: { color: 'bg-amber-500', icon: CreditCard, messageKey: 'status_messages.timbres_pending' },
  TIMBRES_PAID: { color: 'bg-amber-600', icon: CheckCircle, messageKey: 'status_messages.timbres_paid' },
  SUBMITTED: { color: 'bg-blue-500', icon: Clock, messageKey: 'status_messages.submitted' },
  DOCUMENTS_REQUIRED: { color: 'bg-orange-500', icon: AlertCircle, messageKey: 'status_messages.documents_required' },
  UNDER_REVIEW: { color: 'bg-indigo-500', icon: Eye, messageKey: 'status_messages.under_review' },
  DOSSIER_VALIDE: { color: 'bg-teal-500', icon: CheckCircle, messageKey: 'status_messages.dossier_valide' },
  REJECTED: { color: 'bg-red-500', icon: XCircle, messageKey: 'status_messages.rejected' },
  PAYMENT_PENDING: { color: 'bg-yellow-500', icon: CreditCard, messageKey: 'status_messages.payment_pending' },
  PAYMENT_PROCESSING: { color: 'bg-yellow-600', icon: Loader2, messageKey: 'status_messages.payment_processing' },
  PAID: { color: 'bg-green-500', icon: CheckCircle, messageKey: 'status_messages.paid' },
  CITA_SCHEDULED: { color: 'bg-cyan-500', icon: CalendarCheck, messageKey: 'status_messages.cita_scheduled' },
  IN_PROGRESS: { color: 'bg-blue-600', icon: Clock, messageKey: 'status_messages.in_progress' },
  COMPLETED: { color: 'bg-green-600', icon: CheckCircle, messageKey: 'status_messages.completed' },
  CANCELLED: { color: 'bg-gray-500', icon: XCircle, messageKey: 'status_messages.cancelled' },
  EXPIRED: { color: 'bg-gray-600', icon: Clock, messageKey: 'status_messages.expired' },
}

export default function ServiceRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const requestId = params.id as string
  const t = useTranslations('service_requests')

  // Detail view data (single API call)
  const { data: detailView, isLoading, error: queryError, refetch } = useDetailView(requestId)

  // Legacy hook for document operations
  const {
    documents,
    loadDocuments,
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
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedDocType) return

    setUploadingDocument(true)
    setUploadError(null)
    setUploadProgress(10)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 90))
      }, 200)

      await uploadDocument(selectedDocType, file)
      clearInterval(progressInterval)
      setUploadProgress(100)
      await loadDocuments()

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

  // Handle PDF download
  const handleDownloadPdf = useCallback(async () => {
    setDownloadingPdf(true)
    try {
      const blob = await serviceRequestsApi.downloadSummaryPDF(requestId, locale)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `solicitud_${detailView?.request.requestNumber || requestId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Silent fail — PDF download is non-critical
    } finally {
      setDownloadingPdf(false)
    }
  }, [requestId, locale, detailView])

  // Load documents on mount
  useEffect(() => {
    if (requestId) {
      loadDocuments()
    }
  }, [requestId, loadDocuments])

  // Auto-redirect DRAFT status to wizard
  useEffect(() => {
    if (detailView?.request && detailView.request.status === 'DRAFT') {
      router.replace(`/${locale}/dashboard/service-requests/${requestId}/wizard`)
    }
  }, [detailView, locale, requestId, router])

  // Get status config
  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT
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

  // Format amount
  const formatAmount = (amount?: number): string => {
    if (!amount) return '-'
    return new Intl.NumberFormat(locale === 'es' ? 'es-GQ' : locale, {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Loading state
  if (isLoading) {
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
  if (queryError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {queryError instanceof Error ? queryError.message : 'Error loading request'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('retry')}
        </Button>
      </div>
    )
  }

  // No data
  if (!detailView) {
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

  const { request, stepper_phases, current_phase_index, data_sections, citizen_notifications, unread_notification_count, photo_url, appointment, payment_status } = detailView
  const statusConfig = getStatusConfig(request.status)
  const StatusIcon = statusConfig.icon
  const hasNotifications = citizen_notifications.length > 0

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
              {request.requestNumber || `#${request.id.slice(0, 8)}`}
            </h1>
            <p className="text-muted-foreground">
              {detailView.workflow_name_es}
            </p>
          </div>
        </div>
        <Badge className={`${statusConfig.color} text-white flex items-center gap-1 px-3 py-1`}>
          <StatusIcon className="h-4 w-4" />
          {t(`status.${request.status.toLowerCase()}`) || request.status}
        </Badge>
      </div>

      {/* Status Alert */}
      <Alert
        className={
          request.status === 'REJECTED'
            ? 'border-red-500 bg-red-50'
            : request.status === 'COMPLETED'
              ? 'border-green-500 bg-green-50'
              : request.status === 'DOCUMENTS_REQUIRED'
                ? 'border-orange-500 bg-orange-50'
                : ''
        }
      >
        <StatusIcon className="h-4 w-4" />
        <AlertTitle>
          {t(`status.${request.status.toLowerCase()}`) || 'Estado de tu solicitud'}
        </AlertTitle>
        <AlertDescription>{t(statusConfig.messageKey)}</AlertDescription>
      </Alert>

      {/* Rejection reason / Notes */}
      {request.rejectionReason && (
        <Alert className="border-red-500 bg-red-50">
          <XCircle className="h-4 w-4 text-red-500" />
          <AlertTitle>{locale === 'es' ? 'Motivo del rechazo' : locale === 'fr' ? 'Motif du rejet' : 'Rejection reason'}</AlertTitle>
          <AlertDescription>{request.rejectionReason}</AlertDescription>
        </Alert>
      )}
      {request.notes && !request.rejectionReason && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{locale === 'es' ? 'Nota del agente' : locale === 'fr' ? 'Note de l\'agent' : 'Agent note'}</AlertTitle>
          <AlertDescription>{request.notes}</AlertDescription>
        </Alert>
      )}

      {/* Universal Progress Stepper */}
      {stepper_phases.length > 0 && (
        <Card className="p-4">
          <UniversalProgressStepper
            phases={stepper_phases}
            currentIndex={current_phase_index}
            status={request.status}
            locale={locale}
          />
        </Card>
      )}

      {/* Continue Wizard Button for DOCUMENTS_REQUIRED */}
      {request.status === 'DOCUMENTS_REQUIRED' && (
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

      {/* Main Content: Split layout when notifications exist (desktop) */}
      <div className={`grid gap-6 ${hasNotifications ? 'lg:grid-cols-[1fr_300px]' : ''}`}>
        {/* Left Column: Tabs */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
              <TabsTrigger value="documents">{t('documents_tab')}</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
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
                        {request.requestNumber || request.id.slice(0, 8)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('sub_type') || 'Tipo'}</p>
                      <p className="font-medium">{detailView.solicitud_type_display || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('created') || 'Creado'}</p>
                      <p className="font-medium">{formatDate(request.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('table.updated') || 'Actualizado'}</p>
                      <p className="font-medium">{formatDate(request.updatedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic Data Sections (from workflow form configs) */}
              {data_sections.length > 0 && (
                <DynamicDataSections
                  sections={data_sections}
                  photoUrl={photo_url}
                />
              )}

              {/* Payment & Appointment Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Payment Card */}
                {detailView.tariff && (detailView.tariff.total_amount as number) > 0 && (
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {locale === 'es' ? 'Pago' : locale === 'fr' ? 'Paiement' : 'Payment'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <span className="font-bold text-primary">
                            {formatAmount(detailView.tariff.total_amount as number)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {locale === 'es' ? 'Estado' : locale === 'fr' ? 'Statut' : 'Status'}
                          </span>
                          <Badge variant={
                            payment_status === 'completed' ? 'default' :
                            payment_status === 'pending_agent_review' ? 'secondary' :
                            'outline'
                          }>
                            {payment_status === 'completed'
                              ? (locale === 'es' ? 'Confirmado' : locale === 'fr' ? 'Confirmé' : 'Confirmed')
                              : payment_status === 'pending_agent_review'
                                ? (locale === 'es' ? 'Pendiente validación' : locale === 'fr' ? 'En attente de validation' : 'Pending validation')
                                : payment_status === 'processing'
                                  ? (locale === 'es' ? 'En proceso' : locale === 'fr' ? 'En cours' : 'Processing')
                                  : (locale === 'es' ? 'Pendiente' : locale === 'fr' ? 'En attente' : 'Pending')}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Appointment Card */}
                {appointment && (
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <CalendarCheck className="h-4 w-4" />
                        {locale === 'es' ? 'Cita Programada' : locale === 'fr' ? 'Rendez-vous' : 'Appointment'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{appointment.date || '-'}</span>
                          {appointment.time && (
                            <span className="text-sm text-muted-foreground">{appointment.time}</span>
                          )}
                        </div>
                        {appointment.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{appointment.location}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
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
                  {['DRAFT', 'DOCUMENTS_REQUIRED'].includes(request.status) && (
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
          </Tabs>
        </div>

        {/* Right Column: Notifications Panel (desktop) */}
        {hasNotifications && (
          <div className="hidden lg:block">
            <CitizenNotificationsPanel
              notifications={citizen_notifications}
              unreadCount={unread_notification_count}
              locale={locale}
            />
          </div>
        )}
      </div>

      {/* Mobile: Notifications below content */}
      {hasNotifications && (
        <div className="lg:hidden">
          <CitizenNotificationsPanel
            notifications={citizen_notifications}
            unreadCount={unread_notification_count}
            locale={locale}
          />
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={`/${locale}/dashboard/service-requests`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back') || 'Volver a mis solicitudes'}
          </Link>
        </Button>
        <div className="flex gap-2">
          {/* Download PDF */}
          {!['DRAFT'].includes(request.status) && (
            <Button variant="outline" onClick={handleDownloadPdf} disabled={downloadingPdf}>
              {downloadingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              PDF
            </Button>
          )}
          {/* Continue wizard */}
          {['DRAFT', 'DOCUMENTS_REQUIRED'].includes(request.status) && (
            <Button
              onClick={() => router.push(`/${locale}/dashboard/service-requests/${requestId}/wizard`)}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              {locale === 'es' ? 'Continuar Solicitud' : locale === 'fr' ? 'Continuer la Demande' : 'Continue Request'}
            </Button>
          )}
        </div>
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
              <p className="text-xs text-muted-foreground">PDF, JPG o PNG. Max 5MB.</p>
            </div>
            {uploadingDocument && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {t('uploading') || 'Subiendo...'} {uploadProgress}%
                </p>
              </div>
            )}
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
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
