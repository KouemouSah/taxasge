'use client'

/**
 * Passport Workflow Wizard Page
 *
 * Step-based wizard for passport service requests.
 * Aligns with pasaporte_workflow_v2.py backend implementation.
 *
 * Steps:
 * 0. is_minor - Minor/Adult selection
 * 1. select_type - EXPEDICION or RENOVACION
 * 1b. select_motivo - If RENOVACION: VENCIMIENTO, PERDIDA, ROBO, DETERIORO
 * 2. upload_documents - All documents on one page
 * 3. form_review_1 - Datos Personales + Domicilio
 * 4. form_review_2 - Filiacion + Pasaporte Anterior
 * 5. validation - Cross-document validation results
 * 6. payment - Mobile Money payment
 * 7. appointment - Select appointment slot (after payment)
 * 8. confirmation - Final summary
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  ArrowRight,
  User,
  UserCheck,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Baby,
} from 'lucide-react'
import { useServiceRequests } from '@/modules/service-requests'

// Step definitions
const WIZARD_STEPS = [
  { id: 'is_minor', number: 0, titleKey: 'wizard.step_minor' },
  { id: 'select_type', number: 1, titleKey: 'wizard.step_type' },
  { id: 'select_motivo', number: 1.5, titleKey: 'wizard.step_motivo' }, // Sub-step for RENOVACION
  { id: 'upload_documents', number: 2, titleKey: 'wizard.step_documents' },
  { id: 'form_review_1', number: 3, titleKey: 'wizard.step_form_1' },
  { id: 'form_review_2', number: 4, titleKey: 'wizard.step_form_2' },
  { id: 'validation', number: 5, titleKey: 'wizard.step_validation' },
  { id: 'payment', number: 6, titleKey: 'wizard.step_payment' },
  { id: 'appointment', number: 7, titleKey: 'wizard.step_appointment' },
  { id: 'confirmation', number: 8, titleKey: 'wizard.step_confirmation' },
]

// Solicitud types
type SolicitudType = 'EXPEDICION' | 'RENOVACION'
type RenovacionMotivo = 'VENCIMIENTO' | 'PERDIDA' | 'ROBO' | 'DETERIORO'

interface WizardState {
  isMinor: boolean | null
  solicitudType: SolicitudType | null
  motivo: RenovacionMotivo | null
}

// Tariffs
const TARIFFS: Record<string, number> = {
  EXPEDICION: 7500,
  VENCIMIENTO: 5000,
  PERDIDA: 10000,
  ROBO: 10000,
  DETERIORO: 7500,
}

export default function PassportWizardPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'es'
  const requestId = params.id as string
  const t = useTranslations('service_requests')

  // Local wizard state
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [wizardState, setWizardState] = useState<WizardState>({
    isMinor: null,
    solicitudType: null,
    motivo: null,
  })
  const [isSaving, setIsSaving] = useState(false)

  // Service requests hook
  const {
    currentRequest,
    workflow,
    isLoading,
    error,
    loadRequest,
    saveStepData,
    clearError,
  } = useServiceRequests()

  // Load request on mount
  useEffect(() => {
    if (requestId) {
      loadRequest(requestId)
    }
  }, [requestId, loadRequest])

  // Initialize wizard state from request form_data
  useEffect(() => {
    if (currentRequest?.formData) {
      const formData = currentRequest.formData as Record<string, unknown>
      setWizardState({
        isMinor: formData.is_minor as boolean | null ?? null,
        solicitudType: formData.solicitud_type as SolicitudType | null ?? null,
        motivo: formData.motivo as RenovacionMotivo | null ?? null,
      })

      // Determine current step based on saved data
      if (formData.is_minor === undefined || formData.is_minor === null) {
        setCurrentStepIndex(0)
      } else if (!formData.solicitud_type) {
        setCurrentStepIndex(1)
      } else if (formData.solicitud_type === 'RENOVACION' && !formData.motivo) {
        setCurrentStepIndex(2) // select_motivo
      } else {
        setCurrentStepIndex(3) // upload_documents
      }
    }
  }, [currentRequest])

  // Get current step
  const currentStep = WIZARD_STEPS[currentStepIndex]

  // Calculate progress percentage
  const progressPercent = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100

  // Calculate tariff based on selection
  const getTariff = (): number => {
    if (wizardState.solicitudType === 'EXPEDICION') {
      return TARIFFS.EXPEDICION
    }
    if (wizardState.solicitudType === 'RENOVACION' && wizardState.motivo) {
      return TARIFFS[wizardState.motivo] || 0
    }
    return 0
  }

  // Handle step data save
  const handleSaveStepData = useCallback(async (data: Record<string, unknown>) => {
    if (!currentRequest) return false

    setIsSaving(true)
    try {
      await saveStepData(currentStep.id, data)
      return true
    } catch (err) {
      console.error('Failed to save step data:', err)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [currentRequest, currentStep, saveStepData])

  // Handle minor selection
  const handleMinorSelect = async (isMinor: boolean) => {
    setWizardState(prev => ({ ...prev, isMinor }))
    const success = await handleSaveStepData({ is_minor: isMinor })
    if (success) {
      setCurrentStepIndex(1) // Go to type selection
    }
  }

  // Handle type selection
  const handleTypeSelect = async (type: SolicitudType) => {
    setWizardState(prev => ({ ...prev, solicitudType: type, motivo: null }))
    await handleSaveStepData({ solicitud_type: type })

    if (type === 'RENOVACION') {
      setCurrentStepIndex(2) // Go to motivo selection
    } else {
      setCurrentStepIndex(3) // Go to documents
    }
  }

  // Handle motivo selection
  const handleMotivoSelect = async (motivo: RenovacionMotivo) => {
    setWizardState(prev => ({ ...prev, motivo }))
    await handleSaveStepData({ motivo })
    setCurrentStepIndex(3) // Go to documents
  }

  // Navigate back
  const handleBack = () => {
    if (currentStepIndex === 0) {
      router.push(`/${locale}/dashboard/service-requests/${requestId}`)
      return
    }

    // Special case: if on documents and type is EXPEDICION, skip motivo
    if (currentStepIndex === 3 && wizardState.solicitudType === 'EXPEDICION') {
      setCurrentStepIndex(1)
      return
    }

    setCurrentStepIndex(prev => Math.max(0, prev - 1))
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
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={clearError}>
          {t('retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('back')}
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {locale === 'es' ? 'Solicitud de Pasaporte' : locale === 'fr' ? 'Demande de Passeport' : 'Passport Request'}
        </h1>
        <p className="text-muted-foreground">
          {currentRequest?.requestNumber && `Ref: ${currentRequest.requestNumber}`}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {locale === 'es'
              ? `Paso ${Math.ceil(currentStep.number + 1)} de 9`
              : locale === 'fr'
                ? `Etape ${Math.ceil(currentStep.number + 1)} sur 9`
                : `Step ${Math.ceil(currentStep.number + 1)} of 9`}
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Step Content */}
      {currentStep.id === 'is_minor' && (
        <MinorSelectionStep
          locale={locale}
          selectedValue={wizardState.isMinor}
          onSelect={handleMinorSelect}
          isSaving={isSaving}
        />
      )}

      {currentStep.id === 'select_type' && (
        <TypeSelectionStep
          locale={locale}
          isMinor={wizardState.isMinor}
          selectedValue={wizardState.solicitudType}
          onSelect={handleTypeSelect}
          isSaving={isSaving}
        />
      )}

      {currentStep.id === 'select_motivo' && (
        <MotivoSelectionStep
          locale={locale}
          selectedValue={wizardState.motivo}
          onSelect={handleMotivoSelect}
          isSaving={isSaving}
        />
      )}

      {currentStep.id === 'upload_documents' && (
        <DocumentsPlaceholder
          locale={locale}
          requestId={requestId}
          isMinor={wizardState.isMinor || false}
          solicitudType={wizardState.solicitudType}
          motivo={wizardState.motivo}
          onNext={() => setCurrentStepIndex(4)}
        />
      )}

      {(currentStep.id === 'form_review_1' || currentStep.id === 'form_review_2') && (
        <FormReviewPlaceholder
          locale={locale}
          step={currentStep.id}
          onNext={() => setCurrentStepIndex(prev => prev + 1)}
          onBack={handleBack}
        />
      )}

      {currentStep.id === 'validation' && (
        <ValidationPlaceholder
          locale={locale}
          onNext={() => setCurrentStepIndex(7)}
          onBack={handleBack}
        />
      )}

      {currentStep.id === 'payment' && (
        <PaymentPlaceholder
          locale={locale}
          tariff={getTariff()}
          onNext={() => setCurrentStepIndex(8)}
          onBack={handleBack}
        />
      )}

      {currentStep.id === 'appointment' && (
        <AppointmentPlaceholder
          locale={locale}
          requestId={requestId}
          onNext={() => setCurrentStepIndex(9)}
          onBack={handleBack}
        />
      )}

      {currentStep.id === 'confirmation' && (
        <ConfirmationPlaceholder
          locale={locale}
          requestId={requestId}
          tariff={getTariff()}
        />
      )}
    </div>
  )
}

// =============================================================================
// STEP 0: Minor Selection
// =============================================================================

interface MinorSelectionStepProps {
  locale: string
  selectedValue: boolean | null
  onSelect: (value: boolean) => void
  isSaving: boolean
}

function MinorSelectionStep({ locale, selectedValue, onSelect, isSaving }: MinorSelectionStepProps) {
  const options = [
    {
      value: false,
      icon: UserCheck,
      labelEs: 'Mayor de Edad',
      labelFr: 'Majeur',
      labelEn: 'Adult',
      descEs: 'Persona de 18 anos o mas',
      descFr: 'Personne de 18 ans ou plus',
      descEn: 'Person 18 years or older',
    },
    {
      value: true,
      icon: Baby,
      labelEs: 'Menor de Edad',
      labelFr: 'Mineur',
      labelEn: 'Minor',
      descEs: 'Menor de 18 anos (requiere autorizacion parental)',
      descFr: 'Moins de 18 ans (autorisation parentale requise)',
      descEn: 'Under 18 years (parental authorization required)',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === 'es'
            ? 'Tipo de Solicitante'
            : locale === 'fr'
              ? 'Type de Demandeur'
              : 'Applicant Type'}
        </CardTitle>
        <CardDescription>
          {locale === 'es'
            ? 'Indique si la solicitud es para un adulto o un menor de edad'
            : locale === 'fr'
              ? 'Indiquez si la demande concerne un adulte ou un mineur'
              : 'Indicate if the request is for an adult or a minor'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.map((option) => {
          const Icon = option.icon
          const isSelected = selectedValue === option.value

          return (
            <button
              key={String(option.value)}
              onClick={() => !isSaving && onSelect(option.value)}
              disabled={isSaving}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50 hover:bg-muted/50'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">
                    {locale === 'es' ? option.labelEs : locale === 'fr' ? option.labelFr : option.labelEn}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'es' ? option.descEs : locale === 'fr' ? option.descFr : option.descEn}
                  </p>
                </div>
                {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
              </div>
            </button>
          )
        })}

        {isSaving && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{locale === 'es' ? 'Guardando...' : locale === 'fr' ? 'Enregistrement...' : 'Saving...'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// STEP 1: Type Selection
// =============================================================================

interface TypeSelectionStepProps {
  locale: string
  isMinor: boolean | null
  selectedValue: SolicitudType | null
  onSelect: (value: SolicitudType) => void
  isSaving: boolean
}

function TypeSelectionStep({ locale, isMinor, selectedValue, onSelect, isSaving }: TypeSelectionStepProps) {
  const options: Array<{
    value: SolicitudType
    labelEs: string
    labelFr: string
    labelEn: string
    descEs: string
    descFr: string
    descEn: string
    tariff: number
  }> = [
    {
      value: 'EXPEDICION',
      labelEs: 'Primera Expedicion',
      labelFr: 'Premiere Emission',
      labelEn: 'First Issuance',
      descEs: 'Solicito mi primer pasaporte',
      descFr: 'Je demande mon premier passeport',
      descEn: 'I am requesting my first passport',
      tariff: 7500,
    },
    {
      value: 'RENOVACION',
      labelEs: 'Renovacion',
      labelFr: 'Renouvellement',
      labelEn: 'Renewal',
      descEs: 'Ya tengo un pasaporte (vencido, perdido, robado o danado)',
      descFr: "J'ai deja un passeport (expire, perdu, vole ou endommage)",
      descEn: 'I already have a passport (expired, lost, stolen or damaged)',
      tariff: 0, // Depends on motivo
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === 'es'
            ? 'Tipo de Solicitud'
            : locale === 'fr'
              ? 'Type de Demande'
              : 'Request Type'}
        </CardTitle>
        <CardDescription>
          {locale === 'es'
            ? `Solicitud para: ${isMinor ? 'Menor de edad' : 'Mayor de edad'}`
            : locale === 'fr'
              ? `Demande pour: ${isMinor ? 'Mineur' : 'Majeur'}`
              : `Request for: ${isMinor ? 'Minor' : 'Adult'}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.map((option) => {
          const isSelected = selectedValue === option.value

          return (
            <button
              key={option.value}
              onClick={() => !isSaving && onSelect(option.value)}
              disabled={isSaving}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50 hover:bg-muted/50'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold">
                    {locale === 'es' ? option.labelEs : locale === 'fr' ? option.labelFr : option.labelEn}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'es' ? option.descEs : locale === 'fr' ? option.descFr : option.descEn}
                  </p>
                </div>
                <div className="text-right">
                  {option.tariff > 0 ? (
                    <p className="font-semibold text-primary">
                      {option.tariff.toLocaleString()} XAF
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {locale === 'es' ? 'Segun motivo' : locale === 'fr' ? 'Selon motif' : 'Varies'}
                    </p>
                  )}
                  {isSelected && <CheckCircle className="h-5 w-5 text-primary mt-1 ml-auto" />}
                </div>
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// STEP 1b: Motivo Selection (for RENOVACION)
// =============================================================================

interface MotivoSelectionStepProps {
  locale: string
  selectedValue: RenovacionMotivo | null
  onSelect: (value: RenovacionMotivo) => void
  isSaving: boolean
}

function MotivoSelectionStep({ locale, selectedValue, onSelect, isSaving }: MotivoSelectionStepProps) {
  const options: Array<{
    value: RenovacionMotivo
    labelEs: string
    labelFr: string
    labelEn: string
    descEs: string
    descFr: string
    descEn: string
    tariff: number
  }> = [
    {
      value: 'VENCIMIENTO',
      labelEs: 'Vencimiento',
      labelFr: 'Expiration',
      labelEn: 'Expiration',
      descEs: 'Mi pasaporte esta vencido o por vencer',
      descFr: 'Mon passeport est expire ou va expirer',
      descEn: 'My passport is expired or expiring',
      tariff: 5000,
    },
    {
      value: 'PERDIDA',
      labelEs: 'Perdida',
      labelFr: 'Perte',
      labelEn: 'Loss',
      descEs: 'Perdi mi pasaporte (requiere denuncia policial)',
      descFr: "J'ai perdu mon passeport (declaration de perte requise)",
      descEn: 'I lost my passport (police report required)',
      tariff: 10000,
    },
    {
      value: 'ROBO',
      labelEs: 'Robo',
      labelFr: 'Vol',
      labelEn: 'Theft',
      descEs: 'Me robaron mi pasaporte (requiere denuncia policial)',
      descFr: 'Mon passeport a ete vole (declaration de vol requise)',
      descEn: 'My passport was stolen (police report required)',
      tariff: 10000,
    },
    {
      value: 'DETERIORO',
      labelEs: 'Deterioro',
      labelFr: 'Deterioration',
      labelEn: 'Damage',
      descEs: 'Mi pasaporte esta danado',
      descFr: 'Mon passeport est endommage',
      descEn: 'My passport is damaged',
      tariff: 7500,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === 'es'
            ? 'Motivo de Renovacion'
            : locale === 'fr'
              ? 'Motif de Renouvellement'
              : 'Renewal Reason'}
        </CardTitle>
        <CardDescription>
          {locale === 'es'
            ? 'Seleccione el motivo de la renovacion'
            : locale === 'fr'
              ? 'Selectionnez le motif du renouvellement'
              : 'Select the reason for renewal'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.map((option) => {
          const isSelected = selectedValue === option.value

          return (
            <button
              key={option.value}
              onClick={() => !isSaving && onSelect(option.value)}
              disabled={isSaving}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50 hover:bg-muted/50'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold">
                    {locale === 'es' ? option.labelEs : locale === 'fr' ? option.labelFr : option.labelEn}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'es' ? option.descEs : locale === 'fr' ? option.descFr : option.descEn}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">
                    {option.tariff.toLocaleString()} XAF
                  </p>
                  {isSelected && <CheckCircle className="h-5 w-5 text-primary mt-1 ml-auto" />}
                </div>
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// PLACEHOLDER COMPONENTS (To be implemented in detail)
// =============================================================================

interface DocumentsPlaceholderProps {
  locale: string
  requestId: string
  isMinor: boolean
  solicitudType: SolicitudType | null
  motivo: RenovacionMotivo | null
  onNext: () => void
}

function DocumentsPlaceholder({ locale, requestId, isMinor, solicitudType, motivo, onNext }: DocumentsPlaceholderProps) {
  const router = useRouter()

  // Redirect to existing documents page for now
  const handleGoToDocuments = () => {
    router.push(`/${locale}/dashboard/service-requests/${requestId}/documents`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === 'es' ? 'Documentos Requeridos' : locale === 'fr' ? 'Documents Requis' : 'Required Documents'}
        </CardTitle>
        <CardDescription>
          {locale === 'es'
            ? `Tipo: ${solicitudType === 'EXPEDICION' ? 'Primera Expedicion' : `Renovacion - ${motivo}`}${isMinor ? ' (Menor de edad)' : ''}`
            : locale === 'fr'
              ? `Type: ${solicitudType === 'EXPEDICION' ? 'Premiere Emission' : `Renouvellement - ${motivo}`}${isMinor ? ' (Mineur)' : ''}`
              : `Type: ${solicitudType === 'EXPEDICION' ? 'First Issuance' : `Renewal - ${motivo}`}${isMinor ? ' (Minor)' : ''}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            {locale === 'es'
              ? 'Utilice la pagina de documentos existente para cargar sus archivos.'
              : locale === 'fr'
                ? 'Utilisez la page de documents existante pour telecharger vos fichiers.'
                : 'Use the existing documents page to upload your files.'}
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={handleGoToDocuments}>
            <FileText className="mr-2 h-4 w-4" />
            {locale === 'es' ? 'Ir a Documentos' : locale === 'fr' ? 'Aller aux Documents' : 'Go to Documents'}
          </Button>
          <Button variant="outline" onClick={onNext}>
            {locale === 'es' ? 'Continuar' : locale === 'fr' ? 'Continuer' : 'Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface FormReviewPlaceholderProps {
  locale: string
  step: string
  onNext: () => void
  onBack: () => void
}

function FormReviewPlaceholder({ locale, step, onNext, onBack }: FormReviewPlaceholderProps) {
  const isStep1 = step === 'form_review_1'

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isStep1
            ? (locale === 'es' ? 'Verificar Datos (1/2)' : locale === 'fr' ? 'Verifier les Donnees (1/2)' : 'Verify Data (1/2)')
            : (locale === 'es' ? 'Verificar Datos (2/2)' : locale === 'fr' ? 'Verifier les Donnees (2/2)' : 'Verify Data (2/2)')}
        </CardTitle>
        <CardDescription>
          {isStep1
            ? (locale === 'es' ? 'Datos Personales y Domicilio' : locale === 'fr' ? 'Donnees Personnelles et Domicile' : 'Personal Data and Address')
            : (locale === 'es' ? 'Filiacion y Pasaporte Anterior' : locale === 'fr' ? 'Filiation et Ancien Passeport' : 'Filiation and Previous Passport')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {locale === 'es'
              ? 'Esta seccion mostrara los datos extraidos de sus documentos para revision.'
              : locale === 'fr'
                ? "Cette section affichera les donnees extraites de vos documents pour verification."
                : 'This section will show extracted data from your documents for review.'}
          </AlertDescription>
        </Alert>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {locale === 'es' ? 'Anterior' : locale === 'fr' ? 'Precedent' : 'Back'}
          </Button>
          <Button onClick={onNext}>
            {locale === 'es' ? 'Continuar' : locale === 'fr' ? 'Continuer' : 'Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface ValidationPlaceholderProps {
  locale: string
  onNext: () => void
  onBack: () => void
}

function ValidationPlaceholder({ locale, onNext, onBack }: ValidationPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === 'es' ? 'Validacion de Documentos' : locale === 'fr' ? 'Validation des Documents' : 'Document Validation'}
        </CardTitle>
        <CardDescription>
          {locale === 'es'
            ? 'El sistema verifica la coherencia de sus documentos'
            : locale === 'fr'
              ? 'Le systeme verifie la coherence de vos documents'
              : 'The system verifies the consistency of your documents'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {locale === 'es'
              ? 'Los resultados de la validacion apareceran aqui.'
              : locale === 'fr'
                ? 'Les resultats de la validation apparaitront ici.'
                : 'Validation results will appear here.'}
          </AlertDescription>
        </Alert>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {locale === 'es' ? 'Anterior' : locale === 'fr' ? 'Precedent' : 'Back'}
          </Button>
          <Button onClick={onNext}>
            {locale === 'es' ? 'Continuar al Pago' : locale === 'fr' ? 'Continuer au Paiement' : 'Continue to Payment'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface PaymentPlaceholderProps {
  locale: string
  tariff: number
  onNext: () => void
  onBack: () => void
}

function PaymentPlaceholder({ locale, tariff, onNext, onBack }: PaymentPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === 'es' ? 'Pago de Tasas' : locale === 'fr' ? 'Paiement des Frais' : 'Fee Payment'}
        </CardTitle>
        <CardDescription>
          {locale === 'es'
            ? 'Realice el pago mediante Mobile Money'
            : locale === 'fr'
              ? 'Effectuez le paiement via Mobile Money'
              : 'Make payment via Mobile Money'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            {locale === 'es' ? 'Monto a pagar' : locale === 'fr' ? 'Montant a payer' : 'Amount to pay'}
          </p>
          <p className="text-3xl font-bold text-primary">{tariff.toLocaleString()} XAF</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {locale === 'es'
              ? 'La integracion de pago Mobile Money se mostrara aqui.'
              : locale === 'fr'
                ? "L'integration du paiement Mobile Money sera affichee ici."
                : 'Mobile Money payment integration will be shown here.'}
          </AlertDescription>
        </Alert>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {locale === 'es' ? 'Anterior' : locale === 'fr' ? 'Precedent' : 'Back'}
          </Button>
          <Button onClick={onNext}>
            {locale === 'es' ? 'Simular Pago y Continuar' : locale === 'fr' ? 'Simuler Paiement et Continuer' : 'Simulate Payment & Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface AppointmentPlaceholderProps {
  locale: string
  requestId: string
  onNext: () => void
  onBack: () => void
}

function AppointmentPlaceholder({ locale, requestId, onNext, onBack }: AppointmentPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === 'es' ? 'Programar Cita' : locale === 'fr' ? 'Programmer un Rendez-vous' : 'Schedule Appointment'}
        </CardTitle>
        <CardDescription>
          {locale === 'es'
            ? 'Seleccione una cita en la oficina CNEDOGE'
            : locale === 'fr'
              ? 'Selectionnez un rendez-vous au bureau CNEDOGE'
              : 'Select an appointment at the CNEDOGE office'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-600">
            {locale === 'es'
              ? 'Pago confirmado. Ahora puede seleccionar su cita.'
              : locale === 'fr'
                ? 'Paiement confirme. Vous pouvez maintenant selectionner votre rendez-vous.'
                : 'Payment confirmed. You can now select your appointment.'}
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {locale === 'es'
              ? 'El componente AppointmentSelection con hold de 15min se integrara aqui.'
              : locale === 'fr'
                ? "Le composant AppointmentSelection avec hold de 15min sera integre ici."
                : 'The AppointmentSelection component with 15min hold will be integrated here.'}
          </AlertDescription>
        </Alert>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {locale === 'es' ? 'Anterior' : locale === 'fr' ? 'Precedent' : 'Back'}
          </Button>
          <Button onClick={onNext}>
            {locale === 'es' ? 'Confirmar Cita' : locale === 'fr' ? 'Confirmer le Rendez-vous' : 'Confirm Appointment'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface ConfirmationPlaceholderProps {
  locale: string
  requestId: string
  tariff: number
}

function ConfirmationPlaceholder({ locale, requestId, tariff }: ConfirmationPlaceholderProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <CardTitle className="text-green-600">
          {locale === 'es'
            ? 'Solicitud Completada'
            : locale === 'fr'
              ? 'Demande Terminee'
              : 'Request Completed'}
        </CardTitle>
        <CardDescription>
          {locale === 'es'
            ? 'Su solicitud de pasaporte ha sido registrada exitosamente'
            : locale === 'fr'
              ? 'Votre demande de passeport a ete enregistree avec succes'
              : 'Your passport request has been successfully registered'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {locale === 'es' ? 'Referencia' : locale === 'fr' ? 'Reference' : 'Reference'}
            </span>
            <span className="font-mono font-semibold">{requestId.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {locale === 'es' ? 'Tarifa pagada' : locale === 'fr' ? 'Frais payes' : 'Fee paid'}
            </span>
            <span className="font-semibold">{tariff.toLocaleString()} XAF</span>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/dashboard/service-requests/${requestId}`)}
          >
            {locale === 'es' ? 'Ver Detalles' : locale === 'fr' ? 'Voir les Details' : 'View Details'}
          </Button>
          <Button onClick={() => router.push(`/${locale}/dashboard/service-requests`)}>
            {locale === 'es' ? 'Volver a Solicitudes' : locale === 'fr' ? 'Retour aux Demandes' : 'Back to Requests'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
