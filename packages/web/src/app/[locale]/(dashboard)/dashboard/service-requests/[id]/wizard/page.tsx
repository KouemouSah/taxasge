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
 * 6. payment - Mobile Money payment (using PaymentMethod from payments module)
 * 7. appointment - Select appointment slot (after payment)
 * 8. confirmation - Final summary with PDF download
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  ArrowRight,
  UserCheck,
  Loader2,
  AlertCircle,
  CheckCircle,
  Baby,
  CreditCard,
  Smartphone,
  Banknote,
  Download,
} from 'lucide-react'
import {
  useServiceRequests,
  DocumentUploader,
  AppointmentSelection,
  CitizenSummaryForm,
} from '@/modules/service-requests'
import type {
  DocumentRequirement,
  ServiceRequestDocument,
  CitizenSummaryResponse,
  EntityLocation,
  AvailableSlot,
  AppointmentHoldStatus,
} from '@/modules/service-requests'
import { DocumentConditionType } from '@/modules/service-requests'
import { PaymentMethod, getPaymentMethodLabel } from '@/types/payment'

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
    documents,
    isLoading,
    error,
    loadRequest,
    saveStepData,
    clearError,
    uploadDocument,
    deleteDocument,
    getCitizenSummary,
    downloadSummaryPDF,
    initiatePayment,
    getAppointmentLocations,
    getAppointmentSlots,
    holdAppointmentSlot,
    getAppointmentHoldStatus,
    releaseAppointmentHold,
  } = useServiceRequests()

  // Additional state for payment and confirmation
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [_paymentSuccess, setPaymentSuccess] = useState(false) // Prefixed with _ as it's used for state tracking
  const [citizenSummary, setCitizenSummary] = useState<CitizenSummaryResponse | null>(null)

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
        <DocumentsStep
          locale={locale}
          requestId={requestId}
          isMinor={wizardState.isMinor || false}
          solicitudType={wizardState.solicitudType}
          motivo={wizardState.motivo}
          documents={documents}
          onUpload={async (documentCode, file, face) => {
            await uploadDocument(documentCode, file, face)
          }}
          onDelete={async (docId) => { await deleteDocument(docId) }}
          onNext={() => setCurrentStepIndex(4)}
          onBack={handleBack}
        />
      )}

      {(currentStep.id === 'form_review_1' || currentStep.id === 'form_review_2') && (
        <FormReviewStep
          locale={locale}
          step={currentStep.id}
          onNext={() => setCurrentStepIndex(prev => prev + 1)}
          onBack={handleBack}
        />
      )}

      {currentStep.id === 'validation' && (
        <ValidationStep
          locale={locale}
          onNext={() => setCurrentStepIndex(7)}
          onBack={handleBack}
        />
      )}

      {currentStep.id === 'payment' && (
        <PaymentStep
          locale={locale}
          tariff={getTariff()}
          selectedMethod={selectedPaymentMethod}
          phoneNumber={phoneNumber}
          isProcessing={isProcessingPayment}
          onMethodSelect={setSelectedPaymentMethod}
          onPhoneChange={setPhoneNumber}
          onPay={async () => {
            if (!selectedPaymentMethod) return
            setIsProcessingPayment(true)
            try {
              const result = await initiatePayment(selectedPaymentMethod, phoneNumber)
              if (result) {
                setPaymentSuccess(true)
                setCurrentStepIndex(8) // Go to appointment step
              }
            } finally {
              setIsProcessingPayment(false)
            }
          }}
          onNext={() => setCurrentStepIndex(8)}
          onBack={handleBack}
        />
      )}

      {currentStep.id === 'appointment' && (
        <AppointmentStep
          locale={locale}
          requestId={requestId}
          tariff={getTariff()}
          getLocations={getAppointmentLocations}
          getSlots={getAppointmentSlots}
          holdSlot={holdAppointmentSlot}
          getHoldStatus={getAppointmentHoldStatus}
          releaseHold={releaseAppointmentHold}
          onComplete={async (_appointmentData) => {
            // Load citizen summary for confirmation step
            const summary = await getCitizenSummary()
            setCitizenSummary(summary)
            setCurrentStepIndex(9) // Go to confirmation step
          }}
          onBack={handleBack}
        />
      )}

      {currentStep.id === 'confirmation' && (
        <ConfirmationStep
          locale={locale}
          requestId={requestId}
          tariff={getTariff()}
          summary={citizenSummary}
          onDownloadPDF={async () => {
            await downloadSummaryPDF(locale)
          }}
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
// STEP COMPONENTS - Integrated with actual module components
// =============================================================================

interface DocumentsStepProps {
  locale: string
  requestId: string
  isMinor: boolean
  solicitudType: SolicitudType | null
  motivo: RenovacionMotivo | null
  documents: ServiceRequestDocument[]
  onUpload: (documentCode: string, file: File, face?: string) => Promise<void>
  onDelete: (documentId: string) => Promise<void>
  onNext: () => void
  onBack: () => void
}

function DocumentsStep({
  locale,
  isMinor,
  solicitudType,
  motivo,
  documents,
  onUpload,
  onDelete,
  onNext,
  onBack,
}: DocumentsStepProps) {
  // Build document requirements based on selection
  const getDocumentRequirements = (): DocumentRequirement[] => {
    const requirements: DocumentRequirement[] = []

    // DIP - Always required
    requirements.push({
      documentCode: 'dip',
      documentNameEs: 'Documento de Identidad Personal (DIP)',
      schemaKey: 'DIP_GQ_V2',
      isRequired: true,
      displayOrder: 1,
      conditionType: DocumentConditionType.ALWAYS,
      instructionsEs: 'Escanee ambas caras de su DIP vigente',
      acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    })

    // Type-specific documents
    if (solicitudType === 'EXPEDICION') {
      requirements.push({
        documentCode: 'certificado_nacimiento',
        documentNameEs: 'Certificado de Nacimiento',
        isRequired: true,
        displayOrder: 2,
        conditionType: DocumentConditionType.IS_NEW,
        instructionsEs: 'Certificacion literal de inscripcion de nacimiento',
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      })
    } else if (solicitudType === 'RENOVACION' && motivo) {
      if (motivo === 'VENCIMIENTO' || motivo === 'DETERIORO') {
        requirements.push({
          documentCode: 'pasaporte_antiguo',
          documentNameEs: motivo === 'DETERIORO' ? 'Pasaporte Danado' : 'Pasaporte Antiguo',
          isRequired: true,
          displayOrder: 2,
          conditionType: DocumentConditionType.CUSTOM,
          instructionsEs: motivo === 'DETERIORO'
            ? 'Presente el pasaporte danado para verificacion'
            : 'Escanee la pagina de datos de su pasaporte vencido',
          acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        })
      } else if (motivo === 'PERDIDA' || motivo === 'ROBO') {
        requirements.push({
          documentCode: 'denuncia_policial',
          documentNameEs: 'Denuncia Policial',
          isRequired: true,
          displayOrder: 2,
          conditionType: DocumentConditionType.CUSTOM,
          instructionsEs: `Denuncia de ${motivo === 'ROBO' ? 'robo' : 'perdida'} emitida por la Policia Nacional`,
          acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        })
      }
    }

    // Photo - Always required (images only)
    requirements.push({
      documentCode: 'photo_carnet',
      documentNameEs: 'Fotografia tipo pasaporte',
      isRequired: true,
      displayOrder: 10,
      conditionType: DocumentConditionType.ALWAYS,
      instructionsEs: '1 foto de 35x45mm, fondo blanco, rostro visible',
      acceptedFormats: ['jpg', 'jpeg', 'png'], // Only images for photos
    })

    // Minor-specific documents (using CUSTOM since IS_MINOR doesn't exist in enum)
    if (isMinor) {
      requirements.push({
        documentCode: 'autorizacion_parental',
        documentNameEs: 'Autorizacion Parental',
        isRequired: true,
        displayOrder: 5,
        conditionType: DocumentConditionType.CUSTOM,
        conditionValue: { is_minor: true },
        instructionsEs: 'Autorizacion firmada por ambos padres o tutor legal',
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      })
      requirements.push({
        documentCode: 'dip_padre_tutor',
        documentNameEs: 'DIP del Padre, Madre o Tutor',
        isRequired: true,
        displayOrder: 6,
        conditionType: DocumentConditionType.CUSTOM,
        conditionValue: { is_minor: true },
        instructionsEs: 'DIP del padre, madre o tutor legal',
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      })
    }

    return requirements.sort((a, b) => a.displayOrder - b.displayOrder)
  }

  const requirements = getDocumentRequirements()

  // Check if all required documents are uploaded
  const allRequiredUploaded = requirements.every(req => {
    if (!req.isRequired) return true
    return documents.some(doc => doc.documentCode === req.documentCode)
  })

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
        {requirements.map((req) => {
          const uploadedDoc = documents.find(d => d.documentCode === req.documentCode)
          return (
            <DocumentUploader
              key={req.documentCode}
              requirement={req}
              uploadedDocument={uploadedDoc}
              locale={locale as 'es' | 'fr' | 'en'}
              onUpload={(file, face) => onUpload(req.documentCode, file, face)}
              onDelete={uploadedDoc ? async () => { await onDelete(uploadedDoc.id) } : undefined}
              maxSizeMB={req.documentCode === 'photo_carnet' ? 2 : 5}
            />
          )
        })}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {locale === 'es' ? 'Anterior' : locale === 'fr' ? 'Precedent' : 'Back'}
          </Button>
          <Button onClick={onNext} disabled={!allRequiredUploaded}>
            {locale === 'es' ? 'Continuar' : locale === 'fr' ? 'Continuer' : 'Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {!allRequiredUploaded && (
          <p className="text-sm text-muted-foreground text-center">
            {locale === 'es'
              ? 'Suba todos los documentos requeridos para continuar'
              : locale === 'fr'
                ? 'Telechargez tous les documents requis pour continuer'
                : 'Upload all required documents to continue'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface FormReviewStepProps {
  locale: string
  step: string
  onNext: () => void
  onBack: () => void
}

function FormReviewStep({ locale, step, onNext, onBack }: FormReviewStepProps) {
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

interface ValidationStepProps {
  locale: string
  onNext: () => void
  onBack: () => void
}

function ValidationStep({ locale, onNext, onBack }: ValidationStepProps) {
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

interface PaymentStepProps {
  locale: string
  tariff: number
  selectedMethod: PaymentMethod | null
  phoneNumber: string
  isProcessing: boolean
  onMethodSelect: (method: PaymentMethod) => void
  onPhoneChange: (phone: string) => void
  onPay: () => Promise<void>
  onNext: () => void
  onBack: () => void
}

function PaymentStep({
  locale,
  tariff,
  selectedMethod,
  phoneNumber,
  isProcessing,
  onMethodSelect,
  onPhoneChange,
  onPay,
  onBack,
}: PaymentStepProps) {
  // Available payment methods from PaymentMethod enum (aligned with backend)
  const availableMethods = [
    {
      method: PaymentMethod.MOBILE_MONEY,
      icon: Smartphone,
      requiresPhone: true,
    },
    {
      method: PaymentMethod.CASH,
      icon: Banknote,
      requiresPhone: false,
    },
  ]

  const texts = {
    es: {
      title: 'Pago de Tasas',
      subtitle: 'Seleccione un metodo de pago',
      amount: 'Monto a pagar',
      selectMethod: 'Metodo de pago',
      phoneLabel: 'Numero de telefono',
      phonePlaceholder: '+240 XXX XXX XXX',
      payButton: 'Pagar ahora',
      processing: 'Procesando...',
      back: 'Anterior',
    },
    fr: {
      title: 'Paiement des Frais',
      subtitle: 'Selectionnez un mode de paiement',
      amount: 'Montant a payer',
      selectMethod: 'Mode de paiement',
      phoneLabel: 'Numero de telephone',
      phonePlaceholder: '+240 XXX XXX XXX',
      payButton: 'Payer maintenant',
      processing: 'Traitement...',
      back: 'Precedent',
    },
    en: {
      title: 'Fee Payment',
      subtitle: 'Select a payment method',
      amount: 'Amount to pay',
      selectMethod: 'Payment method',
      phoneLabel: 'Phone number',
      phonePlaceholder: '+240 XXX XXX XXX',
      payButton: 'Pay now',
      processing: 'Processing...',
      back: 'Back',
    },
  }

  const t = texts[locale as keyof typeof texts] || texts.es

  const canPay = selectedMethod !== null &&
    (!availableMethods.find(m => m.method === selectedMethod)?.requiresPhone || phoneNumber.length >= 9)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Display */}
        <div className="p-4 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">{t.amount}</p>
          <p className="text-3xl font-bold text-primary">{tariff.toLocaleString()} XAF</p>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <Label>{t.selectMethod}</Label>
          <RadioGroup
            value={selectedMethod || ''}
            onValueChange={(value) => onMethodSelect(value as PaymentMethod)}
          >
            {availableMethods.map(({ method, icon: Icon }) => (
              <div key={method} className="flex items-center space-x-3">
                <RadioGroupItem value={method} id={method} />
                <Label htmlFor={method} className="flex items-center gap-2 cursor-pointer">
                  <Icon className="h-5 w-5" />
                  {getPaymentMethodLabel(method)}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Phone Number (for Mobile Money) */}
        {selectedMethod === PaymentMethod.MOBILE_MONEY && (
          <div className="space-y-2">
            <Label htmlFor="phone">{t.phoneLabel}</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder={t.phonePlaceholder}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack} disabled={isProcessing}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.back}
          </Button>
          <Button onClick={onPay} disabled={!canPay || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.processing}
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {t.payButton}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface AppointmentStepProps {
  locale: string
  requestId: string
  tariff: number
  getLocations: (requestId: string) => Promise<{ entityCode: string; locations: EntityLocation[]; count: number }>
  getSlots: (requestId: string, locationName: string, fromDate?: string, limit?: number) => Promise<{ entityCode: string; locationName: string; fromDate: string; slots: AvailableSlot[]; count: number; hasAvailability: boolean }>
  holdSlot: (requestId: string, data: { locationName: string; locationAddress?: string; appointmentDate: string; appointmentTime: string }) => Promise<{ success: boolean; holdId?: string; expiresInSeconds: number; expiresAt?: string; error?: string }>
  getHoldStatus: (requestId: string) => Promise<AppointmentHoldStatus>
  releaseHold: (requestId: string) => Promise<{ success: boolean; message: string }>
  onComplete: (data: { hasAppointment: boolean; locationName?: string; appointmentDate?: string; appointmentTime?: string; isFallback: boolean }) => void
  onBack: () => void
}

function AppointmentStep({
  locale,
  requestId,
  tariff,
  getLocations,
  getSlots,
  holdSlot,
  getHoldStatus,
  releaseHold,
  onComplete,
  onBack,
}: AppointmentStepProps) {
  return (
    <div className="space-y-4">
      {/* Payment Confirmation Banner */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          {locale === 'es'
            ? `Pago de ${tariff.toLocaleString()} XAF confirmado. Seleccione su cita.`
            : locale === 'fr'
              ? `Paiement de ${tariff.toLocaleString()} XAF confirme. Selectionnez votre rendez-vous.`
              : `Payment of ${tariff.toLocaleString()} XAF confirmed. Select your appointment.`}
        </AlertDescription>
      </Alert>

      {/* AppointmentSelection Component */}
      <AppointmentSelection
        requestId={requestId}
        locale={locale as 'es' | 'fr' | 'en'}
        onComplete={onComplete}
        onBack={onBack}
        getLocations={getLocations}
        getSlots={getSlots}
        holdSlot={holdSlot}
        getHoldStatus={getHoldStatus}
        releaseHold={releaseHold}
        submitWithoutAppointment={async (reqId, preferredLocation) => ({
          success: true,
          locationName: preferredLocation,
          message: 'Submitted without appointment',
        })}
      />
    </div>
  )
}

interface ConfirmationStepProps {
  locale: string
  requestId: string
  tariff: number
  summary: CitizenSummaryResponse | null
  onDownloadPDF: () => Promise<void>
}

function ConfirmationStep({ locale, requestId, tariff, summary, onDownloadPDF }: ConfirmationStepProps) {
  const router = useRouter()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await onDownloadPDF()
    } finally {
      setIsDownloading(false)
    }
  }

  // If we have a summary, use CitizenSummaryForm for display
  if (summary) {
    return (
      <div className="space-y-4">
        {/* Success Banner */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 font-semibold">
            {locale === 'es'
              ? 'Solicitud completada exitosamente'
              : locale === 'fr'
                ? 'Demande completee avec succes'
                : 'Request completed successfully'}
          </AlertDescription>
        </Alert>

        {/* Summary Display using CitizenSummaryForm */}
        <CitizenSummaryForm
          summary={summary}
          locale={locale as 'es' | 'fr' | 'en'}
          isSubmitting={false}
          onSubmit={async () => {}}
          onBack={() => {}}
          onEditDocuments={() => {}}
          onEditPersonalData={() => {}}
          onDownloadPDF={handleDownload}
        />

        {/* Navigation */}
        <div className="flex justify-center gap-2 pt-4">
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
      </div>
    )
  }

  // Fallback simple display
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
          <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {locale === 'es' ? 'Descargar PDF' : locale === 'fr' ? 'Telecharger PDF' : 'Download PDF'}
          </Button>
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
