'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, X, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { SessionTimer } from '@/modules/service-requests/components/SessionTimer'
import { useBundleWizard } from '@/modules/bundle-workflow/hooks/useBundleWizard'
import { BundleStep, BUNDLE_STEP_LABELS } from '@/modules/bundle-workflow/types'

import { CompanyIdentificationStep } from '@/modules/bundle-workflow/components/CompanyIdentificationStep'
import { CompanyUploadStep } from '@/modules/bundle-workflow/components/CompanyUploadStep'
import { ObligationsReviewStep } from '@/modules/bundle-workflow/components/ObligationsReviewStep'
import { BundlePaymentStep } from '@/modules/bundle-workflow/components/BundlePaymentStep'
import { BundleConfirmationStep } from '@/modules/bundle-workflow/components/BundleConfirmationStep'

const navLabels = {
  back: { es: 'Anterior', fr: 'Precedent', en: 'Back' },
  next: { es: 'Siguiente', fr: 'Suivant', en: 'Next' },
  cancel: { es: 'Cancelar', fr: 'Annuler', en: 'Cancel' },
  expired: {
    es: 'La sesion ha expirado. Por favor, inicie de nuevo.',
    fr: 'La session a expire. Veuillez recommencer.',
    en: 'The session has expired. Please start again.',
  },
  restart: { es: 'Reiniciar', fr: 'Recommencer', en: 'Restart' },
  step: { es: 'Paso', fr: 'Etape', en: 'Step' },
} as const

/**
 * Bundle Payment Wizard Page
 * URL: /dashboard/bundle-payment/[sessionId]
 *
 * 5 steps:
 *   0. Company identification (search + "Mis empresas")
 *   1. Document upload (conditional — new company only)
 *   2. Obligations review (table + mode A/B)
 *   3. Payment (mobile_money / cash)
 *   4. Confirmation (summary + next steps)
 */
export default function BundlePaymentWizardPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) || 'es'
  const sessionId = params?.sessionId as string
  const lang = (locale === 'fr' ? 'fr' : locale === 'en' ? 'en' : 'es') as 'es' | 'fr' | 'en'

  const wizard = useBundleWizard()

  // Load session on mount
  useEffect(() => {
    if (sessionId && !wizard.sessionId) {
      wizard.createSession()
    }
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Determine visible steps (skip doc upload if company exists)
  const visibleSteps = wizard.companyExists
    ? [BundleStep.COMPANY_IDENTIFICATION, BundleStep.OBLIGATIONS_REVIEW, BundleStep.PAYMENT, BundleStep.CONFIRMATION]
    : [BundleStep.COMPANY_IDENTIFICATION, BundleStep.DOCUMENT_UPLOAD, BundleStep.OBLIGATIONS_REVIEW, BundleStep.PAYMENT, BundleStep.CONFIRMATION]

  const currentVisibleIndex = visibleSteps.indexOf(wizard.currentStep)
  const isLastNavStep = wizard.currentStep === BundleStep.PAYMENT
  const isConfirmation = wizard.currentStep === BundleStep.CONFIRMATION

  const handleCancel = () => {
    router.push(`/${locale}/dashboard`)
  }

  // Expired overlay
  if (wizard.isExpired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-4">{navLabels.expired[lang]}</p>
        <Button onClick={() => router.push(`/${locale}/dashboard/bundle-payment`)}>
          {navLabels.restart[lang]}
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header: timer + cancel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {wizard.timeRemaining > 0 && (
            <SessionTimer
              timeRemaining={wizard.timeRemaining}
              isExpiring={wizard.isExpiring}
              isExpired={wizard.isExpired}
              locale={locale}
            />
          )}
        </div>
        {!isConfirmation && (
          <Button variant="ghost" size="sm" onClick={handleCancel} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            {navLabels.cancel[lang]}
          </Button>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-1">
        {visibleSteps.map((step, idx) => {
          const isCurrent = step === wizard.currentStep
          const isCompleted = idx < currentVisibleIndex
          return (
            <div key={step} className="flex items-center">
              {idx > 0 && (
                <div className={`h-px w-6 sm:w-10 mx-1 ${
                  isCompleted ? 'bg-primary' : 'bg-border'
                }`} />
              )}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`h-3 w-3 rounded-full transition-colors ${
                    isCurrent
                      ? 'bg-primary ring-4 ring-primary/20'
                      : isCompleted
                        ? 'bg-primary'
                        : 'bg-border'
                  }`}
                />
                <span className={`text-xs hidden sm:block ${
                  isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}>
                  {BUNDLE_STEP_LABELS[step][lang]}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile step label */}
      <div className="sm:hidden text-center">
        <span className="text-xs text-muted-foreground">
          {navLabels.step[lang]} {currentVisibleIndex + 1} / {visibleSteps.length}
          {' — '}
          {BUNDLE_STEP_LABELS[wizard.currentStep][lang]}
        </span>
      </div>

      {/* Error banner */}
      {wizard.error && wizard.currentStep !== BundleStep.PAYMENT && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{wizard.error}</AlertDescription>
        </Alert>
      )}

      {/* Step content */}
      <div className="min-h-[300px]">
        {wizard.currentStep === BundleStep.COMPANY_IDENTIFICATION && (
          <CompanyIdentificationStep wizard={wizard} locale={locale} />
        )}
        {wizard.currentStep === BundleStep.DOCUMENT_UPLOAD && (
          <CompanyUploadStep wizard={wizard} locale={locale} />
        )}
        {wizard.currentStep === BundleStep.OBLIGATIONS_REVIEW && (
          <ObligationsReviewStep wizard={wizard} locale={locale} />
        )}
        {wizard.currentStep === BundleStep.PAYMENT && (
          <BundlePaymentStep wizard={wizard} locale={locale} />
        )}
        {wizard.currentStep === BundleStep.CONFIRMATION && (
          <BundleConfirmationStep wizard={wizard} locale={locale} />
        )}
      </div>

      {/* Navigation buttons (hidden on payment + confirmation) */}
      {!isLastNavStep && !isConfirmation && (
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={wizard.goBack}
            disabled={!wizard.canGoBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {navLabels.back[lang]}
          </Button>
          <Button
            onClick={wizard.goNext}
            disabled={!wizard.canGoNext || wizard.isLoading}
            className="gap-2"
          >
            {navLabels.next[lang]}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
