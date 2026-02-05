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
  DocumentUploader,
  SessionTimer,
  DynamicFormRenderer,
  useFormConfig,
} from '@/modules/service-requests'
import type {
  DocumentRequirement,
  DocumentExtractionPreview,
} from '@/modules/service-requests'
import type {
  WizardSession,
  PreparePaymentResult,
  RequiredDocument,
} from '@/modules/service-requests/types/wizard-session'
import { WizardSessionStatus } from '@/modules/service-requests/types/wizard-session'

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
    Record<string, DocumentExtractionPreview>
  >({})
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})
  const [paymentResult, setPaymentResult] =
    useState<PreparePaymentResult | null>(null)
  const [isPersisting, setIsPersisting] = useState(false)

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
  }, [session, currentStep, paymentResult])

  const handleNext = useCallback(async () => {
    if (!session || !currentStep) return

    // Save form data before advancing from form review steps
    if (currentStep.id.startsWith('form_review_')) {
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
        setDocumentPreviews((prev) => ({
          ...prev,
          [documentCode]: preview as unknown as DocumentExtractionPreview,
        }))
        // Auto-confirm for high confidence
        if (preview.confidence >= 0.8) {
          await confirmDocument({
            document_code: documentCode,
            confirmed_data: preview.extraction,
          })
        }
      }
    },
    [previewDocument, confirmDocument]
  )

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

      {/* Error banner */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="link"
              size="sm"
              onClick={clearError}
              className="ml-2"
            >
              {t('close')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {/* ============================================================ */}
          {/* STEP: Upload Documents                                       */}
          {/* ============================================================ */}
          {currentStep.id === 'upload_documents' && (
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

              {session.requiredDocuments.map((doc: RequiredDocument) => (
                <div
                  key={doc.code}
                  className="flex items-center justify-between p-4 border rounded-lg"
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
              ))}

              {/* Document preview info for recently uploaded */}
              {Object.entries(documentPreviews).map(([code, preview]) => (
                <div
                  key={code}
                  className="p-3 bg-muted/50 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{code}</span>
                    <Badge
                      variant={
                        preview.confidence >= 0.8
                          ? 'default'
                          : 'secondary'
                      }
                      className="text-xs"
                    >
                      {Math.round(preview.confidence * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP: Form Review (Dynamic)                                  */}
          {/* ============================================================ */}
          {currentStep.id.startsWith('form_review_') && (
            <SessionFormReviewStep
              session={session}
              stepId={currentStep.id}
              values={formValues}
              onChange={handleFormChange}
              locale={locale as 'es' | 'fr' | 'en'}
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
    </div>
  )
}

// ============================================================================
// SUB-COMPONENT: Form Review Step (uses DynamicFormRenderer)
// ============================================================================

function SessionFormReviewStep({
  session,
  stepId,
  values,
  onChange,
  locale,
}: {
  session: WizardSession
  stepId: string
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  locale: 'es' | 'fr' | 'en'
}) {
  // Note: useFormConfig currently expects a requestId. For cache-first,
  // the backend form-config endpoint can also accept a session_id parameter.
  // For now, we pass a placeholder and let the backend return config based
  // on workflow_code and solicitud_type from the session.
  //
  // TODO: Add /wizard-sessions/{sessionId}/form-config/{stepId} endpoint
  // For now, render a simple form based on extracted data.
  const mergedValues = useMemo(() => {
    // Merge extracted data (from documents) with user-edited values
    const extracted = session.extractedData || {}
    const flat: Record<string, unknown> = {}
    // Flatten extracted data from all documents
    Object.values(extracted).forEach((docData) => {
      if (typeof docData === 'object' && docData !== null) {
        Object.assign(flat, docData)
      }
    })
    return { ...flat, ...values }
  }, [session.extractedData, values])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {locale === 'es'
          ? `Revision de datos - Pagina ${stepId.replace('form_review_', '')}`
          : locale === 'fr'
            ? `Revision des donnees - Page ${stepId.replace('form_review_', '')}`
            : `Data Review - Page ${stepId.replace('form_review_', '')}`}
      </h2>
      <p className="text-sm text-muted-foreground">
        {locale === 'es'
          ? 'Verifica y corrige los datos extraidos de tus documentos.'
          : locale === 'fr'
            ? 'Verifiez et corrigez les donnees extraites de vos documents.'
            : 'Verify and correct the data extracted from your documents.'}
      </p>

      {/* Display extracted fields as editable inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(mergedValues).map(([key, value]) => (
          <div key={key} className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              {key.replace(/_/g, ' ')}
            </label>
            <input
              type="text"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={String(value ?? '')}
              onChange={(e) => onChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>

      {Object.keys(mergedValues).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>
            {locale === 'es'
              ? 'No hay datos extraidos. Sube tus documentos primero.'
              : locale === 'fr'
                ? "Aucune donnee extraite. Telechargez vos documents d'abord."
                : 'No extracted data. Upload your documents first.'}
          </p>
        </div>
      )}
    </div>
  )
}
