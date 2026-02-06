'use client'

/**
 * Session-Based Wizard Page - Cache-First Architecture
 *
 * This wizard stores ALL data in Redis cache (30 min TTL).
 * No database writes occur until the user initiates payment.
 *
 * Steps:
 * 1. Upload documents (preview + confirm)
 * 2. Form review (N pages, dynamic)
 * 3. Payment preparation (validate + tariff)
 * 4. Confirmation (persist to DB)
 *
 * @since v2.0 - Cache-first wizard migration
 * @see .claude/plans/CACHE_FIRST_WIZARD_MIGRATION_PLAN.md
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Upload,
  FileText,
  CreditCard,
  RefreshCw,
} from 'lucide-react'
import {
  useWizardSession,
  SessionTimer,
  DocumentPreviewDialog,
  IdentityMismatchBlocker,
  DynamicFormRenderer,
  useSessionFormConfig,
  usePrefetchSessionFormConfig,
  validateFormConfig,
} from '@/modules/service-requests'
import type {
  DocumentExtractionPreview,
} from '@/modules/service-requests'
import type { IdentityMismatch } from '@/modules/service-requests/components/IdentityMismatchBlocker'
import type {
  DocumentPreview,
  PreparePaymentResult,
  RequiredDocument,
} from '@/modules/service-requests/types/wizard-session'
import { transformPreviewToExtractionPreview } from '@/modules/service-requests/types/wizard-session'

// ============================================================================
// WIZARD STEPS (computed from session state)
// ============================================================================

interface WizardStepDef {
  id: string
  titleEs: string
  titleFr: string
  titleEn: string
  icon: React.ElementType
}

const STEP_UPLOAD: WizardStepDef = {
  id: 'upload_documents',
  titleEs: 'Documentos',
  titleFr: 'Documents',
  titleEn: 'Documents',
  icon: Upload,
}

const STEP_PAYMENT: WizardStepDef = {
  id: 'payment_preparation',
  titleEs: 'Pago',
  titleFr: 'Paiement',
  titleEn: 'Payment',
  icon: CreditCard,
}

const STEP_CONFIRMATION: WizardStepDef = {
  id: 'confirmation',
  titleEs: 'Confirmacion',
  titleFr: 'Confirmation',
  titleEn: 'Confirmation',
  icon: CheckCircle,
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function SessionWizardPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'es'
  const sessionId = params.sessionId as string
  const t = useTranslations('service_requests')

  // Wizard session hook
  const {
    session,
    isLoading,
    isSaving,
    error,
    timeRemaining,
    isExpiring,
    isExpired,
    loadSession,
    cancelSession,
    previewDocument,
    confirmDocument,
    saveFormData,
    preparePayment,
    persistAndPay,
    clearError,
    reset,
  } = useWizardSession()

  // Local state
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [documentPreviews, setDocumentPreviews] = useState<
    Record<string, DocumentPreview>
  >({})
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})
  const [paymentResult, setPaymentResult] =
    useState<PreparePaymentResult | null>(null)
  const [isPersisting, setIsPersisting] = useState(false)

  // Document preview dialog state
  const [currentPreview, setCurrentPreview] = useState<DocumentExtractionPreview | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [isConfirmingPreview, setIsConfirmingPreview] = useState(false)
  const [pendingDocumentCode, setPendingDocumentCode] = useState<string | null>(null)

  // Identity mismatch blocker state
  const [identityMismatches, setIdentityMismatches] = useState<IdentityMismatch[]>([])
  const [showMismatchBlocker, setShowMismatchBlocker] = useState(false)
  const [hasBlockingMismatches, setHasBlockingMismatches] = useState(false)

  // Form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [currentFormConfig, setCurrentFormConfig] = useState<import('@/modules/service-requests').FormConfig | null>(null)

  // Load session on mount
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    }
  }, [sessionId, loadSession])

  // Restore form data from session when loaded
  useEffect(() => {
    if (session?.formData) {
      setFormValues((prev) => ({ ...prev, ...session.formData }))
    }
  }, [session?.formData])

  // Compute visible steps: upload → form_review_1..N → payment → confirmation
  const steps = useMemo((): WizardStepDef[] => {
    const result: WizardStepDef[] = [STEP_UPLOAD]

    // Form review steps will be detected from workflow config
    // For now, add form_review_1 and form_review_2 as common pattern
    // The DynamicFormRenderer handles the actual section/field rendering
    result.push({
      id: 'form_review_1',
      titleEs: 'Revision de datos (1)',
      titleFr: 'Revision des donnees (1)',
      titleEn: 'Data Review (1)',
      icon: FileText,
    })
    result.push({
      id: 'form_review_2',
      titleEs: 'Revision de datos (2)',
      titleFr: 'Revision des donnees (2)',
      titleEn: 'Data Review (2)',
      icon: FileText,
    })

    result.push(STEP_PAYMENT)
    result.push(STEP_CONFIRMATION)
    return result
  }, [])

  const currentStep = steps[currentStepIndex]
  const progressPercent =
    steps.length > 0
      ? Math.round(((currentStepIndex + 1) / steps.length) * 100)
      : 0

  const getStepTitle = (step: WizardStepDef): string =>
    locale === 'es'
      ? step.titleEs
      : locale === 'fr'
        ? step.titleFr
        : step.titleEn

  // ========================================================================
  // NAVIGATION
  // ========================================================================

  const canGoNext = useCallback((): boolean => {
    if (!session || !currentStep) return false

    switch (currentStep.id) {
      case 'upload_documents': {
        // Block if identity mismatches are blocking
        if (hasBlockingMismatches) return false
        // All required documents must be uploaded
        const required = session.requiredDocuments.filter((d) => d.isRequired)
        return required.every((d) => d.uploaded)
      }
      case 'form_review_1':
      case 'form_review_2':
        return true // Form can always proceed (validation on payment step)
      case 'payment_preparation':
        return paymentResult?.readyForPayment === true
      default:
        return true
    }
  }, [session, currentStep, paymentResult, hasBlockingMismatches])

  const handleNext = useCallback(async () => {
    if (!session || !currentStep) return

    // Validate and save form data before advancing from form review steps
    if (currentStep.id.startsWith('form_review_')) {
      // Validate required fields if form config is loaded
      if (currentFormConfig) {
        const errors = validateFormConfig(
          currentFormConfig,
          formValues,
          locale as 'es' | 'fr' | 'en'
        )
        if (Object.keys(errors).length > 0) {
          setFormErrors(errors)
          return
        }
        setFormErrors({})
      }

      const success = await saveFormData({
        form_data: formValues,
        step_id: currentStep.id,
      })
      if (!success) return
    }

    // Auto-prepare payment when entering payment step
    if (
      currentStepIndex + 1 < steps.length &&
      steps[currentStepIndex + 1].id === 'payment_preparation'
    ) {
      const result = await preparePayment()
      setPaymentResult(result)
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }, [
    session,
    currentStep,
    currentStepIndex,
    steps,
    formValues,
    saveFormData,
    preparePayment,
  ])

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }, [currentStepIndex])

  const handleCancel = useCallback(async () => {
    if (
      window.confirm(
        locale === 'es'
          ? 'Esta seguro de cancelar? Se perderan todos los datos.'
          : locale === 'fr'
            ? 'Etes-vous sur de vouloir annuler ? Toutes les donnees seront perdues.'
            : 'Are you sure you want to cancel? All data will be lost.'
      )
    ) {
      await cancelSession('User cancelled')
      router.push(`/${locale}/dashboard/service-requests`)
    }
  }, [locale, cancelSession, router])

  // ========================================================================
  // DOCUMENT UPLOAD HANDLERS
  // ========================================================================

  const handleDocumentUpload = useCallback(
    async (documentCode: string, file: File) => {
      const preview = await previewDocument(documentCode, file)
      if (preview) {
        // Store raw preview
        setDocumentPreviews((prev) => ({
          ...prev,
          [documentCode]: preview,
        }))

        // Check for identity mismatches in risk analysis
        const ra = preview.riskAnalysis as Record<string, unknown> | null
        if (ra) {
          const mismatches = (ra.identity_mismatches || ra.identityMismatches) as IdentityMismatch[] | undefined
          if (mismatches && mismatches.length > 0) {
            setIdentityMismatches(mismatches)
            const blocking = (ra.has_blocking_mismatches as boolean) ||
              (ra.hasBlockingMismatches as boolean) ||
              mismatches.some(m => m.is_blocking)
            setHasBlockingMismatches(blocking)
            if (blocking) {
              setShowMismatchBlocker(true)
              return // Don't open preview dialog - show blocker instead
            }
          }
        }

        // Transform to legacy format and show preview dialog
        const legacyPreview = transformPreviewToExtractionPreview(preview)
        setCurrentPreview(legacyPreview as unknown as DocumentExtractionPreview)
        setPendingDocumentCode(documentCode)
        setShowPreviewDialog(true)
      }
    },
    [previewDocument]
  )

  // Handle confirm from DocumentPreviewDialog
  const handleConfirmPreview = useCallback(
    async (confirmedData: Record<string, unknown>, userNotes?: string) => {
      if (!pendingDocumentCode) return
      setIsConfirmingPreview(true)
      try {
        await confirmDocument({
          document_code: pendingDocumentCode,
          confirmed_data: confirmedData,
          user_notes: userNotes || null,
        })
        setShowPreviewDialog(false)
        setCurrentPreview(null)
        setPendingDocumentCode(null)
      } finally {
        setIsConfirmingPreview(false)
      }
    },
    [pendingDocumentCode, confirmDocument]
  )

  // Handle close preview dialog
  const handleClosePreviewDialog = useCallback(() => {
    setShowPreviewDialog(false)
    setCurrentPreview(null)
    setPendingDocumentCode(null)
  }, [])

  // Handle go back from mismatch blocker
  const handleMismatchBlockerBack = useCallback(() => {
    setShowMismatchBlocker(false)
    setIdentityMismatches([])
    setHasBlockingMismatches(false)
  }, [])

  // Handle re-upload from mismatch blocker
  const handleReuploadFromBlocker = useCallback((documentCode: string) => {
    setShowMismatchBlocker(false)
    setIdentityMismatches([])
    setHasBlockingMismatches(false)
    // Trigger file input click for the specified document
    document.getElementById(`file-${documentCode}`)?.click()
  }, [])

  // ========================================================================
  // PERSIST & PAY
  // ========================================================================

  const handlePersistAndPay = useCallback(async () => {
    setIsPersisting(true)
    try {
      const result = await persistAndPay()
      if (result?.success && result.serviceRequestId) {
        // Redirect to the created request's detail page
        router.push(
          `/${locale}/dashboard/service-requests/${result.serviceRequestId}`
        )
      }
    } finally {
      setIsPersisting(false)
    }
  }, [persistAndPay, router, locale])

  // ========================================================================
  // FORM CHANGE HANDLER
  // ========================================================================

  const handleFormChange = useCallback((key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================

  // Loading state
  if (isLoading && !session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  // Expired session
  if (isExpired) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle>
              {locale === 'es'
                ? 'Sesion expirada'
                : locale === 'fr'
                  ? 'Session expiree'
                  : 'Session expired'}
            </CardTitle>
            <CardDescription>
              {locale === 'es'
                ? 'Tu sesion ha expirado. Por favor, inicia una nueva solicitud.'
                : locale === 'fr'
                  ? 'Votre session a expire. Veuillez recommencer.'
                  : 'Your session has expired. Please start a new request.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              onClick={() =>
                router.push(`/${locale}/dashboard/service-requests/new`)
              }
            >
              {locale === 'es'
                ? 'Nueva solicitud'
                : locale === 'fr'
                  ? 'Nouvelle demande'
                  : 'New request'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state (no session loaded)
  if (error && !session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle>{t('error')}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                clearError()
                loadSession(sessionId)
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('retry')}
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                router.push(`/${locale}/dashboard/service-requests/new`)
              }
            >
              {locale === 'es'
                ? 'Volver'
                : locale === 'fr'
                  ? 'Retour'
                  : 'Back'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('cancel')}
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {session.workflowCode.replace(/_/g, ' ')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {session.solicitudType}
              {session.motivo && ` - ${session.motivo}`}
            </p>
          </div>
        </div>

        <SessionTimer
          timeRemaining={timeRemaining}
          isExpiring={isExpiring}
          isExpired={isExpired}
          locale={locale as 'es' | 'fr' | 'en'}
        />
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{getStepTitle(currentStep)}</span>
          <span className="text-muted-foreground">
            {currentStepIndex + 1} / {steps.length}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />

        {/* Step indicators */}
        <div className="flex gap-1">
          {steps.map((step, idx) => {
            const StepIcon = step.icon
            return (
              <div
                key={step.id}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  idx === currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : idx < currentStepIndex
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                <StepIcon className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {getStepTitle(step)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Error banner with retry */}
      {error && (
        <Alert variant="destructive" className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <AlertDescription>
              <p>{error}</p>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearError()
                    loadSession(sessionId)
                  }}
                  className="h-7 text-xs"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  {locale === 'es' ? 'Reintentar' : locale === 'fr' ? 'Reessayer' : 'Retry'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="h-7 text-xs"
                >
                  {locale === 'es' ? 'Cerrar' : locale === 'fr' ? 'Fermer' : 'Close'}
                </Button>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {/* ============================================================ */}
          {/* STEP: Upload Documents                                       */}
          {/* ============================================================ */}
          {currentStep.id === 'upload_documents' && !showMismatchBlocker && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {locale === 'es'
                  ? 'Documentos requeridos'
                  : locale === 'fr'
                    ? 'Documents requis'
                    : 'Required documents'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {locale === 'es'
                  ? 'Sube los documentos necesarios para tu tramite.'
                  : locale === 'fr'
                    ? 'Telechargez les documents necessaires pour votre demarche.'
                    : 'Upload the required documents for your application.'}
              </p>

              {/* Non-blocking identity warnings */}
              {identityMismatches.length > 0 && !hasBlockingMismatches && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {locale === 'es'
                      ? 'Se detectaron diferencias menores entre documentos. Puede continuar, pero verifique los datos.'
                      : locale === 'fr'
                        ? 'Des differences mineures ont ete detectees entre les documents. Vous pouvez continuer, mais verifiez les donnees.'
                        : 'Minor differences were detected between documents. You can continue, but verify the data.'}
                  </AlertDescription>
                </Alert>
              )}

              {session.requiredDocuments.map((doc: RequiredDocument) => {
                const docPreview = documentPreviews[doc.code]
                const lowConfidence = docPreview && docPreview.confidence < 0.7
                return (
                <div
                  key={doc.code}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    lowConfidence ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {doc.uploaded ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{doc.nameEs}</p>
                      <div className="flex gap-2">
                        {doc.isRequired && (
                          <Badge variant="outline" className="text-xs">
                            {locale === 'es'
                              ? 'Obligatorio'
                              : locale === 'fr'
                                ? 'Obligatoire'
                                : 'Required'}
                          </Badge>
                        )}
                        {doc.uploaded && (
                          <Badge
                            variant="secondary"
                            className="text-xs text-green-700"
                          >
                            {locale === 'es'
                              ? 'Subido'
                              : locale === 'fr'
                                ? 'Telecharge'
                                : 'Uploaded'}
                          </Badge>
                        )}
                        {/* Confidence badge for uploaded documents */}
                        {doc.uploaded && documentPreviews[doc.code] && (
                          <Badge
                            variant={
                              documentPreviews[doc.code].confidence >= 0.9
                                ? 'default'
                                : documentPreviews[doc.code].confidence >= 0.7
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className="text-xs"
                          >
                            {Math.round(documentPreviews[doc.code].confidence * 100)}%
                          </Badge>
                        )}
                        {/* Processor badge */}
                        {doc.uploaded && documentPreviews[doc.code]?.processor === 'gemini' && (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                            {locale === 'es'
                              ? 'Extraido con IA'
                              : locale === 'fr'
                                ? 'Extrait par IA'
                                : 'AI Extracted'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      id={`file-${doc.code}`}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          await handleDocumentUpload(doc.code, file)
                        }
                        e.target.value = ''
                      }}
                    />
                    <Button
                      variant={doc.uploaded ? 'outline' : 'default'}
                      size="sm"
                      disabled={isSaving}
                      onClick={() =>
                        document.getElementById(`file-${doc.code}`)?.click()
                      }
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : doc.uploaded ? (
                        locale === 'es'
                          ? 'Reemplazar'
                          : locale === 'fr'
                            ? 'Remplacer'
                            : 'Replace'
                      ) : (
                        locale === 'es'
                          ? 'Subir'
                          : locale === 'fr'
                            ? 'Telecharger'
                            : 'Upload'
                      )}
                    </Button>
                  </div>
                </div>
                )
              })}
            </div>
          )}

          {/* Identity Mismatch Blocker - shown when documents have conflicting identity data */}
          {currentStep.id === 'upload_documents' && showMismatchBlocker && (
            <IdentityMismatchBlocker
              mismatches={identityMismatches}
              hasBlockingMismatches={hasBlockingMismatches}
              onGoBack={handleMismatchBlockerBack}
              onReuploadDocument={handleReuploadFromBlocker}
            />
          )}

          {/* ============================================================ */}
          {/* STEP: Form Review (Dynamic via DynamicFormRenderer)          */}
          {/* ============================================================ */}
          {currentStep.id.startsWith('form_review_') && (
            <SessionDynamicFormReview
              sessionId={sessionId}
              stepId={currentStep.id}
              values={formValues}
              onChange={(key, value) => {
                handleFormChange(key, value)
                // Clear error for the field being edited
                if (formErrors[key]) {
                  setFormErrors((prev) => {
                    const next = { ...prev }
                    delete next[key]
                    return next
                  })
                }
              }}
              locale={locale as 'es' | 'fr' | 'en'}
              errors={formErrors}
              onConfigLoaded={setCurrentFormConfig}
            />
          )}

          {/* ============================================================ */}
          {/* STEP: Payment Preparation                                    */}
          {/* ============================================================ */}
          {currentStep.id === 'payment_preparation' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {locale === 'es'
                  ? 'Resumen de pago'
                  : locale === 'fr'
                    ? 'Resume du paiement'
                    : 'Payment Summary'}
              </h2>

              {isLoading && !paymentResult && (
                <div className="flex items-center gap-2 p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">
                    {locale === 'es'
                      ? 'Calculando tarifa...'
                      : locale === 'fr'
                        ? 'Calcul du tarif...'
                        : 'Calculating tariff...'}
                  </span>
                </div>
              )}

              {paymentResult && (
                <div className="space-y-4">
                  {/* Tariff breakdown */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>
                        {locale === 'es'
                          ? 'Monto base'
                          : locale === 'fr'
                            ? 'Montant de base'
                            : 'Base amount'}
                      </span>
                      <span>
                        {paymentResult.tariff.base_amount.toLocaleString()}{' '}
                        {paymentResult.currency}
                      </span>
                    </div>
                    {paymentResult.tariff.supplements?.map((s, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm text-muted-foreground"
                      >
                        <span>{s.label_es}</span>
                        <span>
                          {s.amount.toLocaleString()} {paymentResult.currency}
                        </span>
                      </div>
                    ))}
                    <hr />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>
                        {paymentResult.totalAmount.toLocaleString()}{' '}
                        {paymentResult.currency}
                      </span>
                    </div>
                  </div>

                  {/* Validation errors */}
                  {paymentResult.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc pl-4">
                          {paymentResult.errors.map((e, i) => (
                            <li key={i}>{e.message_es}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Missing documents */}
                  {paymentResult.missingDocuments.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {locale === 'es'
                          ? 'Documentos faltantes: '
                          : locale === 'fr'
                            ? 'Documents manquants : '
                            : 'Missing documents: '}
                        {paymentResult.missingDocuments.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Warnings */}
                  {paymentResult.warnings.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc pl-4">
                          {paymentResult.warnings.map((w, i) => (
                            <li key={i}>{w.message_es}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Ready for payment */}
                  {paymentResult.readyForPayment && (
                    <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-700 dark:text-green-300 font-medium">
                        {locale === 'es'
                          ? 'Solicitud lista para pago'
                          : locale === 'fr'
                            ? 'Demande prete pour le paiement'
                            : 'Request ready for payment'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP: Confirmation                                           */}
          {/* ============================================================ */}
          {currentStep.id === 'confirmation' && (
            <div className="space-y-4 text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <h2 className="text-lg font-semibold">
                {locale === 'es'
                  ? 'Confirmar y pagar'
                  : locale === 'fr'
                    ? 'Confirmer et payer'
                    : 'Confirm and pay'}
              </h2>
              <p className="text-muted-foreground">
                {locale === 'es'
                  ? 'Al confirmar, tu solicitud sera creada y se procesara el pago.'
                  : locale === 'fr'
                    ? 'En confirmant, votre demande sera creee et le paiement sera traite.'
                    : 'By confirming, your request will be created and payment processed.'}
              </p>
              {paymentResult && (
                <p className="text-2xl font-bold">
                  {paymentResult.totalAmount.toLocaleString()}{' '}
                  {paymentResult.currency}
                </p>
              )}
              <Button
                size="lg"
                onClick={handlePersistAndPay}
                disabled={isPersisting || isLoading}
                className="min-w-[200px]"
              >
                {isPersisting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {locale === 'es'
                      ? 'Procesando...'
                      : locale === 'fr'
                        ? 'Traitement...'
                        : 'Processing...'}
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {locale === 'es'
                      ? 'Confirmar pago'
                      : locale === 'fr'
                        ? 'Confirmer le paiement'
                        : 'Confirm payment'}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0 || isSaving}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {locale === 'es'
            ? 'Anterior'
            : locale === 'fr'
              ? 'Precedent'
              : 'Previous'}
        </Button>

        {currentStep.id !== 'confirmation' && (
          <Button
            onClick={handleNext}
            disabled={!canGoNext() || isSaving || isLoading}
          >
            {isSaving || isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {locale === 'es'
              ? 'Siguiente'
              : locale === 'fr'
                ? 'Suivant'
                : 'Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Document Preview Dialog - shown after upload for user validation */}
      <DocumentPreviewDialog
        preview={currentPreview}
        isOpen={showPreviewDialog}
        onClose={handleClosePreviewDialog}
        onConfirm={handleConfirmPreview}
        isConfirming={isConfirmingPreview}
        locale={locale as 'es' | 'fr' | 'en'}
      />
    </div>
  )
}

// ============================================================================
// SUB-COMPONENT: Dynamic Form Review Step (uses DynamicFormRenderer)
// ============================================================================

function SessionDynamicFormReview({
  sessionId,
  stepId,
  values,
  onChange,
  locale,
  errors,
  onConfigLoaded,
}: {
  sessionId: string
  stepId: string
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  locale: 'es' | 'fr' | 'en'
  errors?: Record<string, string>
  onConfigLoaded?: (config: import('@/modules/service-requests').FormConfig) => void
}) {
  const { data: formConfig, isLoading, error } = useSessionFormConfig(sessionId, stepId)

  // Initialize form values from config's current_value when config loads
  useEffect(() => {
    if (formConfig) {
      // Notify parent of loaded config for validation
      onConfigLoaded?.(formConfig)

      for (const section of formConfig.sections) {
        for (const field of section.fields) {
          if (
            field.current_value !== undefined &&
            field.current_value !== null &&
            values[field.key] === undefined
          ) {
            onChange(field.key, field.current_value)
          }
        }
      }
    }
    // Only run when formConfig changes, not values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formConfig])

  // Prefetch next form_review step
  const { prefetch } = usePrefetchSessionFormConfig()
  useEffect(() => {
    const stepNum = parseInt(stepId.replace('form_review_', ''), 10)
    if (!isNaN(stepNum)) {
      prefetch(sessionId, `form_review_${stepNum + 1}`)
    }
  }, [sessionId, stepId, prefetch])

  if (isLoading) {
    return <DynamicFormRenderer.Skeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {locale === 'es'
            ? 'Error al cargar la configuracion del formulario.'
            : locale === 'fr'
              ? 'Erreur lors du chargement de la configuration du formulaire.'
              : 'Error loading form configuration.'}
          <br />
          <span className="text-xs">{(error as Error).message}</span>
        </AlertDescription>
      </Alert>
    )
  }

  if (!formConfig) return null

  return (
    <DynamicFormRenderer
      config={formConfig}
      values={values}
      onChange={onChange}
      locale={locale}
      errors={errors}
    />
  )
}
