'use client'

/**
 * Passport Workflow Wizard Page - IMPROVED VERSION
 *
 * Improvements implemented:
 * 1. Two-step document preview/validate flow (recommended)
 * 2. ExtractionPreview component for confidence/risk display
 * 3. getFormData() integration for pre-filled forms
 * 4. Cross-document validation during extraction (Gemini processor)
 * 5. checkPaymentStatus() polling
 * 6. SMS/Email notifications for appointments
 *
 * Steps:
 * 0. is_minor - Minor/Adult selection
 * 1. select_type - EXPEDICION or RENOVACION
 * 1b. select_motivo - If RENOVACION: VENCIMIENTO, PERDIDA, ROBO, DETERIORO
 * 2. upload_documents - All documents with preview/validate flow
 * 3. form_review_1 - Datos Personales + Domicilio (pre-filled)
 * 4. form_review_2 - Filiacion + Pasaporte Anterior (pre-filled)
 * 5. validation - Cross-document validation results
 * 6. payment - Mobile Money payment with status polling
 * 7. appointment - Select appointment with notifications
 * 8. confirmation - Final summary with PDF download
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Eye,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Bell,
  Building2,
  Clock,
} from 'lucide-react'
import {
  useServiceRequests,
  DocumentUploader,
  AppointmentSelection,
  CitizenSummaryForm,
  notificationService,
  IdentityMismatchBlocker,
} from '@/modules/service-requests'
import type { IdentityMismatch } from '@/modules/service-requests'
import type {
  DocumentRequirement,
  ServiceRequestDocument,
  CitizenSummaryResponse,
  EntityLocation,
  AvailableSlot,
  AppointmentHoldStatus,
  FormDataResponse,
  PassportSolicitudType,
  PassportRenovacionMotivo,
  DocumentExtractionPreview,
  PaymentMethodInfo,
} from '@/modules/service-requests'
import {
  DocumentConditionType,
  PASSPORT_WIZARD_STEPS,
  PASSPORT_TARIFFS,
} from '@/modules/service-requests'
import { PaymentMethod } from '@/types/payment'

// Use shared constants from types/index.ts
const WIZARD_STEPS = PASSPORT_WIZARD_STEPS
const TARIFFS = PASSPORT_TARIFFS

// Solicitud types - Use shared types
type SolicitudType = PassportSolicitudType
type RenovacionMotivo = PassportRenovacionMotivo

interface WizardState {
  isMinor: boolean | null
  solicitudType: SolicitudType | null
  motivo: RenovacionMotivo | null
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
  // isSaving is kept for UI components but no longer set during step transitions
  // Step transitions are now synchronous (data stored locally, saved at final validation)
  const [isSaving] = useState(false)

  // Service requests hook
  const {
    currentRequest,
    documents,
    isLoading: _isLoading,
    error,
    loadRequest,
    saveStepData,
    clearError,
    // Document methods - using 2-step preview/validate flow
    previewDocument,
    validateDocument,
    deleteDocument,
    // Form methods
    getFormData,
    // Summary & PDF
    getCitizenSummary,
    downloadSummaryPDF,
    // Payment methods
    prepareForPayment,
    getPaymentMethods,
    initiatePayment,
    checkPaymentStatus,
    // Appointment methods
    getAppointmentLocations,
    getAppointmentSlots,
    holdAppointmentSlot,
    getAppointmentHoldStatus,
    releaseAppointmentHold,
  } = useServiceRequests()

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethodInfo[]>([])
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null)
  // Store payment result for cash payments (reference number, instructions)
  const [pendingPaymentResult, setPendingPaymentResult] = useState<{
    paymentReference?: string
    messageEs?: string
    messageFr?: string
    actionType?: string
    isManualPayment: boolean
  } | null>(null)
  const paymentPollRef = useRef<NodeJS.Timeout | null>(null)

  // Document preview state - stores extraction data from 2-step flow
  // Key: documentCode, Value: preview data from previewDocument API
  const [documentPreviews, setDocumentPreviews] = useState<Record<string, DocumentExtractionPreview>>({})
  const [isUploadingDocument, setIsUploadingDocument] = useState<string | null>(null)

  // Ref to access latest documentPreviews (avoids stale closures in callbacks)
  const documentPreviewsRef = useRef<Record<string, DocumentExtractionPreview>>(documentPreviews)
  useEffect(() => {
    documentPreviewsRef.current = documentPreviews
    console.log('[Wizard] documentPreviews updated:', Object.keys(documentPreviews))
  }, [documentPreviews])

  // Form review state - edited data during review steps
  const [editedFormData, setEditedFormData] = useState<Record<string, unknown>>({})
  const [isSavingFormData, setIsSavingFormData] = useState(false)
  const [formSaveError, setFormSaveError] = useState<string | null>(null)

  // Form data state
  const [formData, setFormData] = useState<FormDataResponse | null>(null)
  const [isLoadingFormData, setIsLoadingFormData] = useState(false)

  // Confirmation state
  const [citizenSummary, setCitizenSummary] = useState<CitizenSummaryResponse | null>(null)

  // Notification state
  const [notificationsSent, setNotificationsSent] = useState(false)

  // Identity mismatch state - for blocking when documents don't match
  const [identityMismatches, setIdentityMismatches] = useState<IdentityMismatch[]>([])
  const [showMismatchBlocker, setShowMismatchBlocker] = useState(false)

  // Load request on mount
  useEffect(() => {
    if (requestId) {
      loadRequest(requestId)
    }
  }, [requestId, loadRequest])

  // Cleanup payment polling on unmount
  useEffect(() => {
    return () => {
      if (paymentPollRef.current) {
        clearInterval(paymentPollRef.current)
      }
    }
  }, [])

  // Track if initial step determination has been done
  const hasInitializedStep = useRef(false)

  // Initialize wizard state from request form_data (runs on every request update)
  useEffect(() => {
    if (currentRequest) {
      const data = currentRequest.formData as Record<string, unknown> | undefined

      // Always update wizard state from form data
      if (data) {
        setWizardState({
          isMinor: data.is_minor as boolean | null ?? null,
          solicitudType: data.solicitud_type as SolicitudType | null ?? null,
          motivo: data.motivo as RenovacionMotivo | null ?? null,
        })
      }
    }
  }, [currentRequest])

  // Determine initial step ONLY ONCE when request first loads
  useEffect(() => {
    if (currentRequest && !hasInitializedStep.current) {
      hasInitializedStep.current = true
      const data = currentRequest.formData as Record<string, unknown> | undefined

      // Determine step based on status FIRST, then form data
      const stepFromStatus = getStepFromStatus(currentRequest.status)
      if (stepFromStatus !== null) {
        setCurrentStepIndex(stepFromStatus)
        return
      }

      // For DRAFT status, determine step from form data and documents
      if (data) {
        if (data.is_minor === undefined || data.is_minor === null) {
          setCurrentStepIndex(0) // is_minor step
        } else if (!data.solicitud_type) {
          setCurrentStepIndex(1) // select_type step
        } else if (data.solicitud_type === 'RENOVACION' && !data.motivo) {
          setCurrentStepIndex(2) // select_motivo step
        } else if (documents.length === 0) {
          setCurrentStepIndex(3) // upload_documents step
        } else {
          setCurrentStepIndex(4) // form_review_1 step
        }
      } else {
        setCurrentStepIndex(0)
      }
    }
  }, [currentRequest, documents.length])

  // Map status to step index
  function getStepFromStatus(status: string): number | null {
    const statusToStep: Record<string, number> = {
      'SUBMITTED': 6, // validation done, waiting
      'DOCUMENTS_REQUIRED': 3, // back to documents
      'UNDER_REVIEW': 6, // validation
      'DOSSIER_VALIDE': 7, // payment
      'PAYMENT_PENDING': 7, // payment
      'PAID': 8, // appointment
      'CITA_SCHEDULED': 9, // confirmation
      'IN_PROGRESS': 9, // confirmation
      'COMPLETED': 9, // confirmation
    }
    return statusToStep[status] ?? null // null means use form data logic
  }

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

  // Handle minor selection
  // Data kept in memory until form_review validation (as per user requirement)
  const handleMinorSelect = (isMinor: boolean) => {
    clearError()
    setWizardState(prev => ({ ...prev, isMinor }))
    setCurrentStepIndex(1)
  }

  // Handle type selection
  // Data kept in memory until form_review validation (as per user requirement)
  const handleTypeSelect = (type: SolicitudType) => {
    clearError()
    setWizardState(prev => ({ ...prev, solicitudType: type, motivo: null }))

    if (type === 'RENOVACION') {
      setCurrentStepIndex(2)
    } else {
      setCurrentStepIndex(3)
    }
  }

  // Handle motivo selection
  // Data kept in memory until form_review validation (as per user requirement)
  const handleMotivoSelect = (motivo: RenovacionMotivo) => {
    clearError()
    setWizardState(prev => ({ ...prev, motivo }))
    setCurrentStepIndex(3)
  }

  // Navigate back
  const handleBack = () => {
    // Clear any error state before navigation to prevent UI flicker
    setFormSaveError(null)
    clearError()

    if (currentStepIndex === 0) {
      // At step 0, go back to service requests list (not detail page)
      router.push(`/${locale}/dashboard/service-requests`)
      return
    }

    // Special case: if on documents and type is EXPEDICION, skip motivo
    if (currentStepIndex === 3 && wizardState.solicitudType === 'EXPEDICION') {
      setCurrentStepIndex(1)
      return
    }

    setCurrentStepIndex(prev => Math.max(0, prev - 1))
  }

  // ==========================================================================
  // DOCUMENT UPLOAD HANDLERS (2-step preview/validate flow)
  // ==========================================================================

  // Upload document using 2-step flow: preview (OCR extraction) → validate (save to DB)
  // This mirrors the dialog flow but stores preview in wizard state for form_review
  const handleDocumentUpload = async (documentCode: string, file: File) => {
    try {
      setIsUploadingDocument(documentCode)

      // Build existing extractions from preview cache for cross-document risk analysis
      // This enables DIP vs Passport comparison even before documents are saved to DB
      const existingExtractions: Record<string, Record<string, unknown>> = {}
      for (const [code, prev] of Object.entries(documentPreviewsRef.current)) {
        if (code !== documentCode && prev.extraction) {
          existingExtractions[code] = prev.extraction as Record<string, unknown>
        }
      }

      // Step 1: Preview - OCR extraction without saving to DB
      // Pass existing extractions for cross-document risk analysis
      const preview = await previewDocument(documentCode, file, existingExtractions)
      if (preview) {
        // Store preview data in state AND ref synchronously
        // The ref is updated immediately to avoid stale closure issues
        const newPreviews = {
          ...documentPreviewsRef.current,
          [documentCode]: preview
        }
        documentPreviewsRef.current = newPreviews  // Update ref synchronously
        setDocumentPreviews(newPreviews)           // Update state for UI re-render
        console.log(`[Wizard] Preview stored for ${documentCode}:`, preview.extraction)
        console.log('[Wizard] All previews now:', Object.keys(newPreviews))

        // Log risk analysis results if present
        if (preview.riskAnalysis) {
          console.log(`[Wizard] Risk analysis for ${documentCode}:`, preview.riskAnalysis)
          if (preview.riskAnalysis.riskFactors?.length > 0) {
            console.warn(`[Wizard] Risk factors detected:`, preview.riskAnalysis.riskFactors)
          }
        }
      }
    } catch (err) {
      console.error('Failed to preview document:', err)
    } finally {
      setIsUploadingDocument(null)
    }
  }

  // Continue to form review after all documents have been previewed
  // CHECKS FOR BLOCKING IDENTITY MISMATCHES BEFORE PROCEEDING
  const handleDocumentsContinue = () => {
    clearError()  // Clear any existing error before transition

    // Collect all identity mismatches from document previews
    const allMismatches: IdentityMismatch[] = []
    let hasBlockingMismatches = false

    const previews = documentPreviewsRef.current
    console.log('[Wizard] Checking identity mismatches in previews:', Object.keys(previews))

    for (const [docCode, preview] of Object.entries(previews)) {
      const riskAnalysis = preview.riskAnalysis
      if (riskAnalysis) {
        // Check for identity mismatches in risk analysis
        const mismatches = riskAnalysis.identityMismatches as IdentityMismatch[] | undefined
        if (mismatches && mismatches.length > 0) {
          console.log(`[Wizard] Found ${mismatches.length} identity mismatches in ${docCode}:`, mismatches)
          allMismatches.push(...mismatches)
        }

        // Check blocking flag
        if (riskAnalysis.hasBlockingMismatches) {
          hasBlockingMismatches = true
          console.warn(`[Wizard] BLOCKING mismatch detected in ${docCode}`)
        }
      }
    }

    // If we have blocking mismatches, show the blocker instead of proceeding
    if (hasBlockingMismatches && allMismatches.length > 0) {
      console.warn(`[Wizard] BLOCKING: ${allMismatches.length} identity mismatches detected`)
      setIdentityMismatches(allMismatches)
      setShowMismatchBlocker(true)
      return  // Don't proceed to form_review
    }

    // Clear any previous mismatch state
    setIdentityMismatches([])
    setShowMismatchBlocker(false)

    // Build form data BEFORE navigating (avoid timing issues with effects/refs)
    // This is the key difference with dialog - dialog receives data as prop directly,
    // wizard needs to prepare data synchronously before step change
    const previewFormData = buildFormDataFromPreviews()
    if (previewFormData) {
      console.log('[Wizard] Form data prepared before navigation:', previewFormData)
      setFormData(previewFormData)
    } else {
      console.warn('[Wizard] No preview data available when navigating to form_review')
    }

    // Proceed to form review
    setCurrentStepIndex(4)
  }

  // Handle going back from mismatch blocker to documents step
  const handleMismatchBlockerBack = () => {
    setShowMismatchBlocker(false)
    setIdentityMismatches([])
    // Stay on documents step (currentStepIndex is already 3)
  }

  // Handle re-uploading a specific document from mismatch blocker
  const handleReuploadFromBlocker = (documentCode: string) => {
    setShowMismatchBlocker(false)
    setIdentityMismatches([])
    // Clear the preview for this document so user can re-upload
    const newPreviews = { ...documentPreviewsRef.current }
    delete newPreviews[documentCode]
    documentPreviewsRef.current = newPreviews
    setDocumentPreviews(newPreviews)
  }

  // ==========================================================================
  // FORM REVIEW HANDLERS (Validate & Edit extracted data)
  // ==========================================================================

  // Handle field edit in form review
  const handleFormFieldEdit = (field: string, value: unknown) => {
    setEditedFormData(prev => ({ ...prev, [field]: value }))
  }

  // Save form data from review step
  // This calls validateDocument for each preview to save documents to DB (Step 2 of 2-step flow)
  const handleSaveFormReview = async (stepId: string) => {
    if (!formData) return false

    setIsSavingFormData(true)
    setFormSaveError(null) // Clear previous errors
    try {
      // Merge extracted data with user edits
      // IMPORTANT: Include wizardState values (solicitud_type, motivo, is_minor)
      // These are needed for tariff calculation in backend
      const dataToSave = {
        ...formData.extractedData,
        ...formData.formData,
        ...editedFormData,
        // Add wizard selections for tariff calculation
        solicitud_type: wizardState.solicitudType,
        motivo: wizardState.motivo,
        is_minor: wizardState.isMinor,
      }

      // Step 2 of 2-step flow: Validate and save each document preview to DB
      // Only do this on the LAST form review step to avoid duplicate saves
      // CRITICAL: If any document fails to save, the entire operation fails
      if (stepId === 'form_review_2' && Object.keys(documentPreviews).length > 0) {
        console.log('[Wizard] Validating and saving documents to DB...')
        const failedDocuments: string[] = []

        for (const [docCode, preview] of Object.entries(documentPreviews)) {
          if (preview.previewId) {
            // Build confirmed data for this document
            // For DIP, include user corrections
            let confirmedData = preview.extraction as Record<string, unknown>
            if (docCode === 'dip') {
              // Apply user edits to the extraction data
              confirmedData = {
                ...confirmedData,
                titular: {
                  ...(confirmedData.titular as Record<string, unknown> || {}),
                  apellidos: editedFormData.apellidos || (confirmedData.titular as Record<string, unknown>)?.apellidos,
                  nombres: editedFormData.nombres || (confirmedData.titular as Record<string, unknown>)?.nombres,
                  sexo: editedFormData.sexo || (confirmedData.titular as Record<string, unknown>)?.sexo,
                  fecha_nacimiento: editedFormData.fecha_nacimiento || (confirmedData.titular as Record<string, unknown>)?.fecha_nacimiento,
                  lugar_nacimiento: editedFormData.lugar_nacimiento || (confirmedData.titular as Record<string, unknown>)?.lugar_nacimiento,
                  nacionalidad: editedFormData.nacionalidad || (confirmedData.titular as Record<string, unknown>)?.nacionalidad,
                  estado_civil: editedFormData.estado_civil || (confirmedData.titular as Record<string, unknown>)?.estado_civil,
                  profesion: editedFormData.profesion || (confirmedData.titular as Record<string, unknown>)?.profesion,
                  grupo_sanguineo: editedFormData.grupo_sanguineo || (confirmedData.titular as Record<string, unknown>)?.grupo_sanguineo,
                },
                domicilio: {
                  ...(confirmedData.domicilio as Record<string, unknown> || {}),
                  domicilio: editedFormData.domicilio || (confirmedData.domicilio as Record<string, unknown>)?.domicilio,
                  ciudad: editedFormData.ciudad || (confirmedData.domicilio as Record<string, unknown>)?.ciudad,
                },
                filiacion: {
                  ...(confirmedData.filiacion as Record<string, unknown> || {}),
                  nombre_padre: editedFormData.nombre_padre || (confirmedData.filiacion as Record<string, unknown>)?.nombre_padre,
                  profesion_padre: editedFormData.profesion_padre || (confirmedData.filiacion as Record<string, unknown>)?.profesion_padre,
                  nombre_madre: editedFormData.nombre_madre || (confirmedData.filiacion as Record<string, unknown>)?.nombre_madre,
                  profesion_madre: editedFormData.profesion_madre || (confirmedData.filiacion as Record<string, unknown>)?.profesion_madre,
                }
              }
            }

            // Call validateDocument to save to Firebase + DB
            // This will throw an error if Firebase upload fails (fail-fast)
            try {
              const result = await validateDocument(preview.previewId, confirmedData)
              if (result) {
                console.log(`[Wizard] Document ${docCode} saved to DB:`, result)
              } else {
                // validateDocument returned null - something went wrong
                console.error(`[Wizard] Failed to save document ${docCode} - null response`)
                failedDocuments.push(docCode)
              }
            } catch (docErr) {
              console.error(`[Wizard] Failed to save document ${docCode}:`, docErr)
              // Extract localized error message if available from API response
              const apiError = docErr as { response?: { data?: { detail?: { code?: string; message_es?: string; message_fr?: string; message_en?: string } | string } } }
              const detail = apiError?.response?.data?.detail
              let errorMsg = ''
              if (detail && typeof detail === 'object') {
                // Backend returned localized error (e.g., PREVIEW_EXPIRED)
                errorMsg = locale === 'es' ? detail.message_es || '' :
                           locale === 'fr' ? detail.message_fr || '' :
                           detail.message_en || ''
              }
              failedDocuments.push({ code: docCode, error: errorMsg })
            }
          }
        }

        // If any documents failed to save, abort the entire operation
        if (failedDocuments.length > 0) {
          // Check if we have a specific error message (e.g., preview expired)
          const firstError = failedDocuments[0] as { code: string; error?: string }
          if (firstError.error) {
            throw new Error(firstError.error)
          }
          // Fallback to generic message
          const docNames = failedDocuments.map((d: { code: string }) => d.code).join(', ')
          throw new Error(
            locale === 'es' ? `Error al guardar documentos: ${docNames}. Por favor reintente.` :
            locale === 'fr' ? `Erreur lors de la sauvegarde des documents: ${docNames}. Veuillez réessayer.` :
            `Failed to save documents: ${docNames}. Please try again.`
          )
        }

        // Clear previews only after ALL documents saved successfully
        setDocumentPreviews({})
      }

      // Save form data to service request
      await saveStepData(stepId, dataToSave)
      return true
    } catch (err) {
      console.error('Failed to save form data:', err)
      // Set error message for display to user
      const errorMessage = err instanceof Error ? err.message : (
        locale === 'es' ? 'Error al guardar los datos. Por favor reintente.' :
        locale === 'fr' ? 'Erreur lors de la sauvegarde. Veuillez réessayer.' :
        'Failed to save data. Please try again.'
      )
      setFormSaveError(errorMessage)
      return false
    } finally {
      setIsSavingFormData(false)
    }
  }

  // ==========================================================================
  // FORM DATA LOADING (from preview state, NOT from DB)
  // ==========================================================================

  // Build form data from document previews (2-step flow)
  // Uses SAME approach as DocumentPreviewDialog: dynamic flattening
  const buildFormDataFromPreviews = useCallback((): FormDataResponse | null => {
    // Use ref to get latest previews (avoids stale closure)
    const previews = documentPreviewsRef.current
    console.log('[Wizard] buildFormDataFromPreviews called, previews:', Object.keys(previews))

    if (Object.keys(previews).length === 0) {
      console.log('[Wizard] No previews available to build form data')
      return null
    }

    // Helper: Flatten nested object recursively (SAME as dialog)
    const flattenObject = (
      obj: Record<string, unknown>,
      prefix = ''
    ): Record<string, unknown> => {
      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey))
        } else {
          result[fullKey] = value
        }
      }
      return result
    }

    // Collect all extraction data from previews
    const extractedData: Record<string, Record<string, unknown>> = {}
    const allFlattenedData: Record<string, unknown> = {}

    for (const [docCode, preview] of Object.entries(previews)) {
      console.log(`[Wizard] Processing preview for ${docCode}:`, preview.extraction)
      if (preview.extraction) {
        extractedData[docCode] = preview.extraction as Record<string, unknown>

        // Flatten ALL extraction data dynamically (like dialog does)
        const flattened = flattenObject(preview.extraction as Record<string, unknown>)
        console.log(`[Wizard] Flattened ${docCode} data:`, flattened)
        Object.assign(allFlattenedData, flattened)
      }
    }

    console.log('[Wizard] All flattened extraction data:', allFlattenedData)

    // Map flattened keys to form field names
    // This handles both nested keys (documento.numero_dip) and flat keys (numero_dip)
    const formDataFlat: Record<string, unknown> = {}

    // Field mapping: flattened key patterns -> form field name
    const fieldMappings: Array<{ formField: string; possibleKeys: string[] }> = [
      { formField: 'numero_dip', possibleKeys: ['documento.numero_dip', 'numero_dip'] },
      { formField: 'apellidos', possibleKeys: ['titular.apellidos', 'apellidos'] },
      { formField: 'nombres', possibleKeys: ['titular.nombres', 'nombres'] },
      { formField: 'sexo', possibleKeys: ['titular.sexo', 'sexo'] },
      { formField: 'fecha_nacimiento', possibleKeys: ['titular.fecha_nacimiento', 'fecha_nacimiento'] },
      { formField: 'lugar_nacimiento', possibleKeys: ['titular.lugar_nacimiento', 'lugar_nacimiento'] },
      { formField: 'nacionalidad', possibleKeys: ['titular.nacionalidad', 'nacionalidad'] },
      { formField: 'estado_civil', possibleKeys: ['titular.estado_civil', 'estado_civil'] },
      { formField: 'profesion', possibleKeys: ['titular.profesion', 'profesion'] },
      { formField: 'grupo_sanguineo', possibleKeys: ['titular.grupo_sanguineo', 'grupo_sanguineo'] },
      // Address fields - prefer new separated fields from backend post-processing
      { formField: 'domicilio', possibleKeys: ['domiciliacion_barrio', 'titular.domiciliacion', 'domicilio.domicilio', 'domicilio.direccion', 'domicilio', 'domiciliacion'] },
      { formField: 'ciudad', possibleKeys: ['domiciliacion_ciudad', 'domicilio.ciudad', 'ciudad'] },
      { formField: 'departamento', possibleKeys: ['domiciliacion_departamento', 'domicilio.departamento', 'departamento'] },
      { formField: 'nombre_padre', possibleKeys: ['filiacion.nombre_padre', 'nombre_padre'] },
      { formField: 'profesion_padre', possibleKeys: ['filiacion.profesion_padre', 'profesion_padre'] },
      { formField: 'nombre_madre', possibleKeys: ['filiacion.nombre_madre', 'nombre_madre'] },
      { formField: 'profesion_madre', possibleKeys: ['filiacion.profesion_madre', 'profesion_madre'] },
      { formField: 'numero_pasaporte_antiguo', possibleKeys: ['numero', 'numero_pasaporte', 'numero_pasaporte_antiguo'] },
      { formField: 'fecha_expedicion_antiguo', possibleKeys: ['fecha_expedicion', 'fecha_expedicion_antiguo'] },
      { formField: 'fecha_expiracion_antiguo', possibleKeys: ['fecha_expiracion', 'fecha_expiracion_antiguo'] },
    ]

    // Apply mappings - first match wins
    for (const { formField, possibleKeys } of fieldMappings) {
      for (const key of possibleKeys) {
        if (allFlattenedData[key] !== undefined && allFlattenedData[key] !== null && allFlattenedData[key] !== '') {
          formDataFlat[formField] = allFlattenedData[key]
          console.log(`[Wizard] Mapped ${key} -> ${formField}:`, allFlattenedData[key])
          break
        }
      }
    }

    console.log('[Wizard] Final formDataFlat:', formDataFlat)

    // Calculate completion percentage
    const requiredFields = ['numero_dip', 'apellidos', 'nombres', 'sexo', 'fecha_nacimiento', 'lugar_nacimiento', 'domicilio']
    const filledFields = requiredFields.filter(f => formDataFlat[f])
    const completionPercentage = Math.round((filledFields.length / requiredFields.length) * 100)
    const missingFields = requiredFields.filter(f => !formDataFlat[f])

    console.log('[Wizard] Completion:', completionPercentage, '%, missing:', missingFields)

    return {
      formData: formDataFlat,
      extractedData,
      requiresReview: true,
      completionPercentage,
      missingFields
    }
  }, []) // No dependencies - uses ref

  const loadFormDataForReview = useCallback(async () => {
    console.log('[Wizard] loadFormDataForReview called')
    setIsLoadingFormData(true)
    try {
      // First, try to build form data from preview state (2-step flow)
      // Check ref directly to avoid stale closure
      const previews = documentPreviewsRef.current
      console.log('[Wizard] Current previews in ref:', Object.keys(previews))

      if (Object.keys(previews).length > 0) {
        const previewFormData = buildFormDataFromPreviews()
        if (previewFormData) {
          setFormData(previewFormData)
          console.log('[Wizard] Form data built from previews successfully')
          return
        }
      }

      // Fallback: load from DB (for existing requests with documents already saved)
      console.log('[Wizard] No previews available, loading from DB...')
      const data = await getFormData()
      if (data) {
        setFormData(data)
        console.log('[Wizard] Form data loaded from DB:', data)
      } else {
        console.log('[Wizard] No form data returned from DB')
      }
    } catch (err) {
      console.error('[Wizard] Failed to load form data:', err)
      // Set empty form data on error to show the form fields anyway
      setFormData({
        formData: {},
        extractedData: {},
        requiresReview: true,
        completionPercentage: 0,
        missingFields: ['numero_dip', 'apellidos', 'nombres', 'sexo', 'fecha_nacimiento', 'lugar_nacimiento', 'domicilio']
      })
    } finally {
      setIsLoadingFormData(false)
    }
  }, [buildFormDataFromPreviews, getFormData]) // Removed documentPreviews - uses ref

  // Load form data when entering form review steps
  useEffect(() => {
    const isFormReviewStep = currentStep.id === 'form_review_1' || currentStep.id === 'form_review_2'
    console.log('[Wizard] Form review effect:', { stepId: currentStep.id, isFormReviewStep, hasFormData: !!formData })

    if (isFormReviewStep && !formData) {
      loadFormDataForReview()
    }
  }, [currentStep.id, formData, loadFormDataForReview])

  // ==========================================================================
  // PAYMENT WITH STATUS POLLING
  // ==========================================================================

  // Load payment methods when step becomes payment
  // Payment methods must come from the API - no hardcoded fallback
  const loadPaymentMethods = useCallback(async () => {
    setIsLoadingPaymentMethods(true)
    setPaymentMethodsError(null)
    try {
      const response = await getPaymentMethods()
      if (response && response.methods && response.methods.length > 0) {
        setAvailablePaymentMethods(response.methods)
        setPaymentMethodsError(null)
        // Set default if specified
        if (response.defaultMethod) {
          setSelectedPaymentMethod(response.defaultMethod as PaymentMethod)
        }
      } else {
        // Response is null or empty - show error
        console.error('No payment methods returned from API')
        setAvailablePaymentMethods([])
        setPaymentMethodsError(
          locale === 'es' ? 'No se encontraron métodos de pago disponibles.' :
          locale === 'fr' ? 'Aucune méthode de paiement disponible.' :
          'No payment methods available.'
        )
      }
    } catch (err) {
      console.error('Failed to load payment methods:', err)
      setAvailablePaymentMethods([])
      setPaymentMethodsError(
        locale === 'es' ? 'Error al cargar los métodos de pago. Por favor, reintente.' :
        locale === 'fr' ? 'Erreur lors du chargement des méthodes de paiement. Veuillez réessayer.' :
        'Failed to load payment methods. Please try again.'
      )
    } finally {
      setIsLoadingPaymentMethods(false)
    }
  }, [getPaymentMethods, locale])

  // Load payment methods when reaching payment step
  useEffect(() => {
    const step = WIZARD_STEPS[currentStepIndex]
    if (step?.id === 'payment' && availablePaymentMethods.length === 0 && !isLoadingPaymentMethods) {
      loadPaymentMethods()
    }
  }, [currentStepIndex, availablePaymentMethods.length, isLoadingPaymentMethods, loadPaymentMethods])

  const handlePayment = async () => {
    if (!selectedPaymentMethod) return

    setIsProcessingPayment(true)
    setPendingPaymentResult(null)
    setPaymentMethodsError(null) // Clear any previous errors
    try {
      const result = await initiatePayment(selectedPaymentMethod, phoneNumber)
      if (!result) {
        // Payment initiation failed (returned null)
        setIsProcessingPayment(false)
        setPaymentMethodsError(
          locale === 'es'
            ? 'Error al iniciar el pago. Intente nuevamente.'
            : locale === 'fr'
              ? 'Erreur lors de l\'initiation du paiement. Réessayez.'
              : 'Error initiating payment. Please try again.'
        )
        return
      }
      if (result) {
        // Check if this is a manual payment (cash/check) requiring agent validation
        const isManualPayment = result.actionType?.startsWith('agent_validation') || false

        // Store payment result for display (especially for cash payments)
        if (isManualPayment) {
          setPendingPaymentResult({
            paymentReference: result.paymentReference,
            messageEs: result.messageEs,
            messageFr: result.messageFr,
            actionType: result.actionType,
            isManualPayment: true,
          })
        }

        // For BANGE electronic payments, redirect to payment page
        if (result.redirectUrl) {
          // Open BANGE payment page in new window/tab
          // User will complete payment there and return
          window.open(result.redirectUrl, '_blank')
        }

        // Start polling for payment status (works for both BANGE and manual payments)
        paymentPollRef.current = setInterval(async () => {
          try {
            const status = await checkPaymentStatus()
            if (status?.paid) {
              if (paymentPollRef.current) {
                clearInterval(paymentPollRef.current)
              }
              setPaymentComplete(true)
              setIsProcessingPayment(false)
              setPendingPaymentResult(null)
              setCurrentStepIndex(7) // Go to appointment (index 7 after validation step removal)
            }
          } catch (err) {
            console.error('Payment status check failed:', err)
          }
        }, 3000) // Poll every 3 seconds

        // Stop polling after 10 minutes (increased from 5 for BANGE payments)
        setTimeout(() => {
          if (paymentPollRef.current) {
            clearInterval(paymentPollRef.current)
            setIsProcessingPayment(false)
          }
        }, 600000)
      }
    } catch (err) {
      console.error('Payment failed:', err)
      setIsProcessingPayment(false)
    }
  }

  // ==========================================================================
  // APPOINTMENT WITH NOTIFICATIONS
  // ==========================================================================

  const handleAppointmentComplete = async (appointmentData: {
    hasAppointment: boolean
    locationName?: string
    appointmentDate?: string
    appointmentTime?: string
    isFallback: boolean
  }) => {
    // Load citizen summary for confirmation
    const summary = await getCitizenSummary()
    setCitizenSummary(summary)

    // Send notifications if appointment was booked
    if (appointmentData.hasAppointment && appointmentData.locationName && currentRequest) {
      try {
        const userEmail = currentRequest.formData?.email as string || ''
        const userPhone = currentRequest.formData?.phone as string
        const userName = currentRequest.formData?.nombres as string || 'Usuario'

        await notificationService.sendAppointmentConfirmation({
          userEmail,
          userPhone,
          userName,
          requestReference: currentRequest.requestNumber || requestId,
          locationName: appointmentData.locationName,
          appointmentDate: appointmentData.appointmentDate || '',
          appointmentTime: appointmentData.appointmentTime || '',
          language: locale as 'es' | 'fr' | 'en',
        })

        setNotificationsSent(true)
      } catch (err) {
        console.error('Failed to send notifications:', err)
      }
    }

    setCurrentStepIndex(9) // Go to confirmation
  }

  // Loading state - show loading when we don't have a request yet and no error
  // This prevents page flash on initial load (before loadRequest sets isLoading=true)
  if (!currentRequest && !error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  // Error state with improved retry functionality
  if (error) {
    const isNetworkError = error.toLowerCase().includes('failed to fetch') || error.toLowerCase().includes('network')
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isNetworkError ? (
              locale === 'es'
                ? 'Error de conexión. Verifique su conexión a internet e intente de nuevo.'
                : locale === 'fr'
                  ? 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.'
                  : 'Connection error. Check your internet connection and try again.'
            ) : error}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { clearError(); loadRequest(requestId); }} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            {locale === 'es' ? 'Reintentar' : locale === 'fr' ? 'Réessayer' : 'Retry'}
          </Button>
          <Button variant="ghost" onClick={() => router.push(`/${locale}/dashboard/service-requests/${requestId}`)}>
            {locale === 'es' ? 'Volver' : locale === 'fr' ? 'Retour' : 'Back'}
          </Button>
        </div>
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

      {currentStep.id === 'upload_documents' && !showMismatchBlocker && (
        <DocumentsStepImproved
          locale={locale}
          isMinor={wizardState.isMinor || false}
          solicitudType={wizardState.solicitudType}
          motivo={wizardState.motivo}
          documents={documents}
          documentPreviews={documentPreviews}
          isUploadingDocument={isUploadingDocument}
          onUpload={handleDocumentUpload}
          onDelete={async (docId) => { await deleteDocument(docId) }}
          onNext={handleDocumentsContinue}
          onBack={handleBack}
          isLocked={currentRequest?.status !== 'DRAFT'}
        />
      )}

      {/* Identity Mismatch Blocker - shown when documents have conflicting identity data */}
      {currentStep.id === 'upload_documents' && showMismatchBlocker && (
        <IdentityMismatchBlocker
          mismatches={identityMismatches}
          hasBlockingMismatches={identityMismatches.some(m => m.is_blocking)}
          onGoBack={handleMismatchBlockerBack}
          onReuploadDocument={handleReuploadFromBlocker}
        />
      )}

      {(currentStep.id === 'form_review_1' || currentStep.id === 'form_review_2') && (
        <FormReviewStepEditable
          locale={locale}
          step={currentStep.id}
          formData={formData}
          editedData={editedFormData}
          isLoading={isLoadingFormData}
          isSaving={isSavingFormData}
          saveError={formSaveError}
          onFieldEdit={handleFormFieldEdit}
          onSave={() => handleSaveFormReview(currentStep.id)}
          onNext={async () => {
            const success = await handleSaveFormReview(currentStep.id)
            if (success) {
              // If completing form_review_2, prepare for payment (DRAFT -> PAYMENT_PENDING)
              if (currentStep.id === 'form_review_2') {
                console.log('[Wizard] Form review complete, preparing for payment...')
                const prepared = await prepareForPayment()
                if (!prepared) {
                  console.error('[Wizard] Failed to prepare for payment')
                  setFormSaveError(
                    locale === 'es'
                      ? 'Error al preparar el pago. Verifique que todos los documentos esten validados.'
                      : locale === 'fr'
                        ? 'Erreur lors de la preparation du paiement. Verifiez que tous les documents sont valides.'
                        : 'Error preparing payment. Verify all documents are validated.'
                  )
                  return
                }
                console.log('[Wizard] Request prepared for payment, navigating to payment step')
              }
              setCurrentStepIndex(prev => prev + 1)
            }
          }}
          onBack={handleBack}
          onRetry={loadFormDataForReview}
        />
      )}

      {/* NOTE: Validation step removed - cross-document validation is now done during extraction
          by Gemini processor with identity mismatch blocking (Step 3: upload_documents) */}

      {currentStep.id === 'payment' && (
        <PaymentStepImproved
          locale={locale}
          tariff={getTariff()}
          availableMethods={availablePaymentMethods}
          isLoadingMethods={isLoadingPaymentMethods}
          methodsError={paymentMethodsError}
          onRetryLoadMethods={loadPaymentMethods}
          selectedMethod={selectedPaymentMethod}
          phoneNumber={phoneNumber}
          isProcessing={isProcessingPayment}
          paymentComplete={paymentComplete}
          pendingPaymentResult={pendingPaymentResult}
          onMethodSelect={setSelectedPaymentMethod}
          onPhoneChange={setPhoneNumber}
          onPay={handlePayment}
          onNext={() => setCurrentStepIndex(7)} // Appointment is now index 7 after validation step removal
          onBack={handleBack}
        />
      )}

      {currentStep.id === 'appointment' && (
        <AppointmentStepImproved
          locale={locale}
          requestId={requestId}
          tariff={getTariff()}
          paymentComplete={paymentComplete}
          pendingPaymentReference={pendingPaymentResult?.paymentReference}
          getLocations={getAppointmentLocations}
          getSlots={getAppointmentSlots}
          holdSlot={holdAppointmentSlot}
          getHoldStatus={getAppointmentHoldStatus}
          releaseHold={releaseAppointmentHold}
          onComplete={handleAppointmentComplete}
          onBack={handleBack}
        />
      )}

      {currentStep.id === 'confirmation' && (
        <ConfirmationStepImproved
          locale={locale}
          requestId={requestId}
          tariff={getTariff()}
          summary={citizenSummary}
          notificationsSent={notificationsSent}
          onDownloadPDF={async () => {
            await downloadSummaryPDF(locale)
          }}
        />
      )}

    </div>
  )
}

// =============================================================================
// STEP 0: Minor Selection (unchanged)
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
          {locale === 'es' ? 'Tipo de Solicitante' : locale === 'fr' ? 'Type de Demandeur' : 'Applicant Type'}
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
// STEP 1: Type Selection (unchanged)
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
      tariff: 0,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === 'es' ? 'Tipo de Solicitud' : locale === 'fr' ? 'Type de Demande' : 'Request Type'}
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
                    <p className="font-semibold text-primary">{option.tariff.toLocaleString()} XAF</p>
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
// STEP 1b: Motivo Selection (unchanged)
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
          {locale === 'es' ? 'Motivo de Renovacion' : locale === 'fr' ? 'Motif de Renouvellement' : 'Renewal Reason'}
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
                  <p className="font-semibold text-primary">{option.tariff.toLocaleString()} XAF</p>
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
// STEP 2: Documents Step - IMPROVED with Two-Step Flow
// =============================================================================

interface DocumentsStepImprovedProps {
  locale: string
  isMinor: boolean
  solicitudType: SolicitudType | null
  motivo: RenovacionMotivo | null
  documents: ServiceRequestDocument[]
  documentPreviews: Record<string, DocumentExtractionPreview>
  isUploadingDocument: string | null
  onUpload: (documentCode: string, file: File) => Promise<void>
  onDelete: (documentId: string) => Promise<void>
  onNext: () => void
  onBack: () => void
  isLocked?: boolean // True when documents cannot be modified (status != DRAFT)
}

function DocumentsStepImproved({
  locale,
  isMinor,
  solicitudType,
  motivo,
  documents,
  documentPreviews,
  isUploadingDocument,
  onUpload,
  onDelete,
  onNext,
  onBack,
  isLocked = false,
}: DocumentsStepImprovedProps) {
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
      acceptedFormats: ['jpg', 'jpeg', 'png'],
    })

    // Minor-specific documents
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

  // Check if all required documents have previews (2-step flow)
  // OR are already saved in DB (for existing requests)
  const allRequiredUploaded = requirements.every(req => {
    if (!req.isRequired) return true
    // Check preview state first (new 2-step flow)
    if (documentPreviews[req.documentCode]) return true
    // Fallback: check if already saved in DB
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
        {/* Warning when documents are locked */}
        {isLocked && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              {locale === 'es'
                ? 'Los documentos estan bloqueados porque la solicitud ya ha avanzado al pago. No puede modificar los documentos.'
                : locale === 'fr'
                  ? 'Les documents sont bloques car la demande est deja en cours de paiement. Vous ne pouvez pas modifier les documents.'
                  : 'Documents are locked because the request has progressed to payment. You cannot modify documents.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Info about two-step flow */}
        {!isLocked && (
          <Alert className="border-blue-200 bg-blue-50">
            <Eye className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              {locale === 'es'
                ? 'Los documentos seran procesados automaticamente. Podra revisar y corregir los datos extraidos antes de guardar.'
                : locale === 'fr'
                  ? 'Les documents seront traites automatiquement. Vous pourrez verifier et corriger les donnees extraites avant de sauvegarder.'
                  : 'Documents will be processed automatically. You can review and correct extracted data before saving.'}
            </AlertDescription>
          </Alert>
        )}

        {requirements.map((req) => {
          const uploadedDoc = documents.find(d => d.documentCode === req.documentCode)
          const preview = documentPreviews[req.documentCode]
          const isUploading = isUploadingDocument === req.documentCode
          const hasPreview = !!preview

          return (
            <div key={req.documentCode} className="space-y-2">
              <DocumentUploader
                requirement={req}
                uploadedDocument={uploadedDoc}
                locale={locale as 'es' | 'fr' | 'en'}
                onUpload={(file) => onUpload(req.documentCode, file)}
                onDelete={uploadedDoc ? async () => { await onDelete(uploadedDoc.id) } : undefined}
                maxSizeMB={req.documentCode === 'photo_carnet' ? 2 : 5}
                disabled={isLocked}
              />

              {/* Loading state during OCR extraction */}
              {isUploading && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {locale === 'es' ? 'Extrayendo datos...' : locale === 'fr' ? 'Extraction en cours...' : 'Extracting data...'}
                </div>
              )}

              {/* Preview success indicator */}
              {hasPreview && !isUploading && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                  <CheckCircle className="h-4 w-4" />
                  {locale === 'es'
                    ? `Datos extraídos (confianza: ${Math.round((preview.confidence || 0) * 100)}%)`
                    : locale === 'fr'
                      ? `Données extraites (confiance: ${Math.round((preview.confidence || 0) * 100)}%)`
                      : `Data extracted (confidence: ${Math.round((preview.confidence || 0) * 100)}%)`}
                </div>
              )}
            </div>
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

// =============================================================================
// STEP 3-4: Form Review - EDITABLE with confidence indicators
// =============================================================================

interface FormReviewStepEditableProps {
  locale: string
  step: string
  formData: FormDataResponse | null
  editedData: Record<string, unknown>
  isLoading: boolean
  isSaving: boolean
  saveError: string | null
  onFieldEdit: (field: string, value: unknown) => void
  onSave: () => Promise<boolean>
  onNext: () => Promise<void>
  onBack: () => void
  onRetry?: () => void
}

function FormReviewStepEditable({
  locale,
  step,
  formData,
  editedData,
  isLoading,
  isSaving,
  saveError,
  onFieldEdit,
  onNext,
  onBack,
  onRetry,
}: FormReviewStepEditableProps) {
  const isStep1 = step === 'form_review_1'

  // Fields for each step with their types
  const step1Fields = [
    { key: 'numero_dip', type: 'text', required: true },
    { key: 'apellidos', type: 'text', required: true },
    { key: 'nombres', type: 'text', required: true },
    { key: 'sexo', type: 'select', options: ['M', 'F'], required: true },
    { key: 'fecha_nacimiento', type: 'date', required: true },
    { key: 'lugar_nacimiento', type: 'text', required: true },
    { key: 'nacionalidad', type: 'text', required: false },
    { key: 'estado_civil', type: 'text', required: false },
    { key: 'profesion', type: 'text', required: false },
    { key: 'grupo_sanguineo', type: 'text', required: false },
    { key: 'domicilio', type: 'text', required: true },
    { key: 'ciudad', type: 'text', required: false },
  ]
  const step2Fields = [
    { key: 'nombre_padre', type: 'text', required: false },
    { key: 'profesion_padre', type: 'text', required: false },
    { key: 'nombre_madre', type: 'text', required: false },
    { key: 'profesion_madre', type: 'text', required: false },
    { key: 'numero_pasaporte_antiguo', type: 'text', required: false },
    { key: 'fecha_expedicion_antiguo', type: 'date', required: false },
    { key: 'fecha_expiracion_antiguo', type: 'date', required: false },
  ]

  const fieldsToShow = isStep1 ? step1Fields : step2Fields

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, Record<string, string>> = {
      numero_dip: { es: 'Número DIP', fr: 'Numéro DIP', en: 'DIP Number' },
      apellidos: { es: 'Apellidos', fr: 'Nom de famille', en: 'Last Name' },
      nombres: { es: 'Nombres', fr: 'Prénoms', en: 'First Name' },
      sexo: { es: 'Sexo', fr: 'Sexe', en: 'Gender' },
      fecha_nacimiento: { es: 'Fecha de Nacimiento', fr: 'Date de Naissance', en: 'Birth Date' },
      lugar_nacimiento: { es: 'Lugar de Nacimiento', fr: 'Lieu de Naissance', en: 'Birth Place' },
      nacionalidad: { es: 'Nacionalidad', fr: 'Nationalité', en: 'Nationality' },
      estado_civil: { es: 'Estado Civil', fr: 'État Civil', en: 'Marital Status' },
      profesion: { es: 'Profesión', fr: 'Profession', en: 'Profession' },
      grupo_sanguineo: { es: 'Grupo Sanguíneo', fr: 'Groupe Sanguin', en: 'Blood Type' },
      domicilio: { es: 'Domicilio', fr: 'Adresse', en: 'Address' },
      ciudad: { es: 'Ciudad', fr: 'Ville', en: 'City' },
      nombre_padre: { es: 'Nombre del Padre', fr: 'Nom du Père', en: 'Father Name' },
      profesion_padre: { es: 'Profesión del Padre', fr: 'Profession du Père', en: 'Father Profession' },
      nombre_madre: { es: 'Nombre de la Madre', fr: 'Nom de la Mère', en: 'Mother Name' },
      profesion_madre: { es: 'Profesión de la Madre', fr: 'Profession de la Mère', en: 'Mother Profession' },
      numero_pasaporte_antiguo: { es: 'Número Pasaporte Antiguo', fr: 'Numéro Ancien Passeport', en: 'Old Passport Number' },
      fecha_expedicion_antiguo: { es: 'Fecha Expedición Antiguo', fr: 'Date Émission Ancien', en: 'Old Issue Date' },
      fecha_expiracion_antiguo: { es: 'Fecha Expiración Antiguo', fr: 'Date Expiration Ancien', en: 'Old Expiry Date' },
    }
    return labels[field]?.[locale] || field.replace(/_/g, ' ')
  }

  // Get current value (edited or extracted)
  const getFieldValue = (field: string): string => {
    if (editedData[field] !== undefined) {
      return String(editedData[field])
    }
    if (formData?.formData?.[field] !== undefined) {
      return String(formData.formData[field])
    }
    if (formData?.extractedData?.[field] !== undefined) {
      return String(formData.extractedData[field])
    }
    return ''
  }

  // Check if field was extracted (to show confidence indicator)
  const isExtractedField = (field: string): boolean => {
    return formData?.extractedData?.[field] !== undefined
  }

  // Check if field was modified by user
  const isModifiedField = (field: string): boolean => {
    return editedData[field] !== undefined
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            {locale === 'es' ? 'Cargando datos extraídos...' : locale === 'fr' ? 'Chargement des données...' : 'Loading extracted data...'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isStep1
            ? (locale === 'es' ? 'Verificar y Editar Datos (1/2)' : locale === 'fr' ? 'Vérifier et Éditer (1/2)' : 'Verify & Edit Data (1/2)')
            : (locale === 'es' ? 'Verificar y Editar Datos (2/2)' : locale === 'fr' ? 'Vérifier et Éditer (2/2)' : 'Verify & Edit Data (2/2)')}
        </CardTitle>
        <CardDescription>
          {locale === 'es'
            ? 'Los datos fueron extraídos automáticamente. Verifique y corrija si es necesario.'
            : locale === 'fr'
              ? 'Les données ont été extraites automatiquement. Vérifiez et corrigez si nécessaire.'
              : 'Data was extracted automatically. Verify and correct if needed.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {formData ? (
          <>
            {/* Completion Progress */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileCheck className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {locale === 'es' ? 'Datos completados' : locale === 'fr' ? 'Données complétées' : 'Data completed'}
                </p>
                <Progress value={formData.completionPercentage} className="h-2 mt-1" />
              </div>
              <span className="text-sm font-semibold">{formData.completionPercentage}%</span>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                {locale === 'es' ? 'Extraído automáticamente' : 'Auto-extracted'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {locale === 'es' ? 'Modificado por usted' : 'Modified by you'}
              </span>
            </div>

            {/* Editable Form Fields */}
            <div className="space-y-4">
              {fieldsToShow.map(({ key: field, type, required }) => {
                const value = getFieldValue(field)
                const isExtracted = isExtractedField(field)
                const isModified = isModifiedField(field)
                const isMissing = required && !value

                return (
                  <div key={field} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={field} className="text-sm font-medium">
                        {getFieldLabel(field)}
                        {required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {isExtracted && !isModified && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {locale === 'es' ? 'OCR' : 'OCR'}
                        </Badge>
                      )}
                      {isModified && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {locale === 'es' ? 'Editado' : 'Edited'}
                        </Badge>
                      )}
                    </div>
                    {type === 'select' ? (
                      <RadioGroup
                        value={value}
                        onValueChange={(v) => onFieldEdit(field, v)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="M" id={`${field}-m`} />
                          <Label htmlFor={`${field}-m`}>{locale === 'es' ? 'Masculino' : 'Male'}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="F" id={`${field}-f`} />
                          <Label htmlFor={`${field}-f`}>{locale === 'es' ? 'Femenino' : 'Female'}</Label>
                        </div>
                      </RadioGroup>
                    ) : (
                      <Input
                        id={field}
                        type={type}
                        value={value}
                        onChange={(e) => onFieldEdit(field, e.target.value)}
                        className={`${isMissing ? 'border-red-300 bg-red-50' : ''} ${isExtracted && !isModified ? 'border-blue-200 bg-blue-50/30' : ''}`}
                        placeholder={isMissing ? (locale === 'es' ? 'Campo requerido' : 'Required field') : ''}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Missing Fields Warning */}
            {formData.missingFields && formData.missingFields.filter(f => fieldsToShow.some(fs => fs.key === f && fs.required)).length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  {locale === 'es'
                    ? 'Complete los campos requeridos marcados en rojo para continuar.'
                    : 'Fill in required fields marked in red to continue.'}
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {locale === 'es'
                  ? 'No se pudieron cargar los datos extraídos. Verifique su conexión e intente de nuevo.'
                  : locale === 'fr'
                    ? 'Impossible de charger les données extraites. Vérifiez votre connexion et réessayez.'
                    : 'Could not load extracted data. Check your connection and try again.'}
              </AlertDescription>
            </Alert>
            {onRetry && (
              <Button variant="outline" onClick={onRetry} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                {locale === 'es' ? 'Reintentar' : locale === 'fr' ? 'Réessayer' : 'Retry'}
              </Button>
            )}
          </div>
        )}

        {/* Save Error Display */}
        {saveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack} disabled={isSaving}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {locale === 'es' ? 'Anterior' : locale === 'fr' ? 'Précédent' : 'Back'}
          </Button>
          <Button onClick={onNext} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {locale === 'es' ? 'Guardando...' : 'Saving...'}
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {locale === 'es' ? 'Guardar y Continuar' : locale === 'fr' ? 'Enregistrer et Continuer' : 'Save & Continue'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// NOTE: ValidationStepImproved component REMOVED
// Cross-document validation is now done during extraction (Step 3: upload_documents)
// by Gemini processor with identity mismatch blocking. No separate validation step needed.
// =============================================================================

// =============================================================================
// STEP 5: Payment - IMPROVED with status polling (was Step 6 before validation removal)
// =============================================================================

interface PaymentStepImprovedProps {
  locale: string
  tariff: number
  availableMethods: PaymentMethodInfo[]
  isLoadingMethods: boolean
  methodsError: string | null
  onRetryLoadMethods: () => void
  selectedMethod: PaymentMethod | null
  phoneNumber: string
  isProcessing: boolean
  paymentComplete: boolean
  // Cash payment result with reference and instructions
  pendingPaymentResult: {
    paymentReference?: string
    messageEs?: string
    messageFr?: string
    actionType?: string
    isManualPayment: boolean
  } | null
  onMethodSelect: (method: PaymentMethod) => void
  onPhoneChange: (phone: string) => void
  onPay: () => Promise<void>
  onNext: () => void
  onBack: () => void
}

function PaymentStepImproved({
  locale,
  tariff,
  availableMethods,
  isLoadingMethods,
  methodsError,
  onRetryLoadMethods,
  selectedMethod,
  phoneNumber,
  isProcessing,
  paymentComplete,
  pendingPaymentResult,
  onMethodSelect,
  onPhoneChange,
  onPay,
  onNext,
  onBack,
}: PaymentStepImprovedProps) {
  // Get icon for method code
  const getMethodIcon = (code: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      mobile_money: Smartphone,
      cash: Banknote,
      check: Banknote,
      card: CreditCard,
      bank_transfer: Banknote,
    }
    return icons[code] || Banknote
  }

  const texts = {
    es: {
      title: 'Pago de Tasas',
      subtitle: 'Seleccione un metodo de pago',
      amount: 'Monto a pagar',
      selectMethod: 'Metodo de pago',
      phoneLabel: 'Numero de telefono',
      phonePlaceholder: '+240 XXX XXX XXX',
      payButton: 'Pagar ahora',
      processing: 'Procesando pago...',
      waitingConfirmation: 'Esperando confirmacion...',
      paymentComplete: 'Pago confirmado',
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
      processing: 'Traitement en cours...',
      waitingConfirmation: 'En attente de confirmation...',
      paymentComplete: 'Paiement confirme',
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
      processing: 'Processing payment...',
      waitingConfirmation: 'Waiting for confirmation...',
      paymentComplete: 'Payment confirmed',
      back: 'Back',
    },
  }

  const t = texts[locale as keyof typeof texts] || texts.es

  const selectedMethodInfo = availableMethods.find(m => m.code === selectedMethod)
  const canPay = selectedMethod !== null &&
    (!selectedMethodInfo?.requiresPhone || phoneNumber.length >= 9)

  if (paymentComplete) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-600 mb-2">{t.paymentComplete}</h3>
          <p className="text-muted-foreground mb-4">{tariff.toLocaleString()} XAF</p>
          <Button onClick={onNext}>
            {locale === 'es' ? 'Continuar a la Cita' : locale === 'fr' ? 'Continuer au Rendez-vous' : 'Continue to Appointment'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

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
          {isLoadingMethods ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{locale === 'es' ? 'Cargando metodos...' : locale === 'fr' ? 'Chargement...' : 'Loading methods...'}</span>
            </div>
          ) : methodsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{methodsError}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetryLoadMethods}
                  className="ml-4"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {locale === 'es' ? 'Reintentar' : locale === 'fr' ? 'Réessayer' : 'Retry'}
                </Button>
              </AlertDescription>
            </Alert>
          ) : availableMethods.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {locale === 'es' ? 'No hay métodos de pago disponibles.' :
                 locale === 'fr' ? 'Aucune méthode de paiement disponible.' :
                 'No payment methods available.'}
              </AlertDescription>
            </Alert>
          ) : (
            <RadioGroup
              value={selectedMethod || ''}
              onValueChange={(value) => onMethodSelect(value as PaymentMethod)}
              disabled={isProcessing}
            >
              {availableMethods.map((method) => {
                const Icon = getMethodIcon(method.code)
                const label = locale === 'es' ? method.labelEs : locale === 'fr' ? method.labelFr : method.labelEn
                return (
                  <div key={method.code} className="flex items-center space-x-3">
                    <RadioGroupItem value={method.code} id={method.code} />
                    <Label htmlFor={method.code} className="flex items-center gap-2 cursor-pointer">
                      <Icon className="h-5 w-5" />
                      {label}
                      {method.requiresAgentValidation && (
                        <span className="text-xs text-muted-foreground">
                          ({locale === 'es' ? 'validacion manual' : locale === 'fr' ? 'validation manuelle' : 'manual validation'})
                        </span>
                      )}
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          )}
        </div>

        {/* Phone Number (for methods requiring phone) */}
        {selectedMethodInfo?.requiresPhone && (
          <div className="space-y-2">
            <Label htmlFor="phone">{t.phoneLabel}</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder={t.phonePlaceholder}
              disabled={isProcessing}
            />
          </div>
        )}

        {/* Cash/Check Payment Result - Show even when not processing */}
        {pendingPaymentResult?.isManualPayment && !isProcessing && (
          <div className="space-y-4">
            {/* Success Alert */}
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {locale === 'es' ? 'Pago registrado exitosamente.' :
                 locale === 'fr' ? 'Paiement enregistre avec succes.' :
                 'Payment registered successfully.'}
              </AlertDescription>
            </Alert>

            {/* Reference Number Display */}
            <Alert className="border-amber-200 bg-amber-50">
              <Building2 className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 space-y-2">
                <p className="font-medium">
                  {locale === 'es' ? 'Referencia de Pago:' :
                   locale === 'fr' ? 'Reference de paiement:' :
                   'Payment Reference:'}
                </p>
                <p className="text-xl font-bold font-mono">
                  {pendingPaymentResult.paymentReference}
                </p>
              </AlertDescription>
            </Alert>

            {/* Instructions */}
            <Alert className="border-blue-200 bg-blue-50">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                {locale === 'es' ? (
                  <>
                    <p className="font-medium mb-1">Instrucciones:</p>
                    <p>Presente este comprobante en la oficina del Tesoro junto con el monto de <strong>{tariff.toLocaleString()} XAF</strong>.</p>
                    <p className="mt-2 text-sm">Puede continuar a reservar su cita mientras se valida el pago.</p>
                  </>
                ) : locale === 'fr' ? (
                  <>
                    <p className="font-medium mb-1">Instructions:</p>
                    <p>Presentez ce recu au bureau du Tresor avec le montant de <strong>{tariff.toLocaleString()} XAF</strong>.</p>
                    <p className="mt-2 text-sm">Vous pouvez continuer a reserver votre rendez-vous pendant la validation.</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium mb-1">Instructions:</p>
                    <p>Present this receipt at the Treasury office with the amount of <strong>{tariff.toLocaleString()} XAF</strong>.</p>
                    <p className="mt-2 text-sm">You can continue to book your appointment while payment is validated.</p>
                  </>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Electronic Payment Processing State */}
        {isProcessing && !pendingPaymentResult?.isManualPayment && (
          <Alert className="border-blue-200 bg-blue-50">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-700">
              {t.waitingConfirmation}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack} disabled={isProcessing}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.back}
          </Button>
          {pendingPaymentResult?.isManualPayment && !isProcessing ? (
            // Cash payment: Show continue button
            <Button onClick={onNext}>
              {locale === 'es' ? 'Continuar a la Cita' : locale === 'fr' ? 'Continuer au Rendez-vous' : 'Continue to Appointment'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            // Normal pay button
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
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// STEP 7: Appointment - IMPROVED with notifications
// =============================================================================

interface AppointmentStepImprovedProps {
  locale: string
  requestId: string
  tariff: number
  paymentComplete: boolean
  pendingPaymentReference?: string
  getLocations: (requestId: string) => Promise<{ entityCode: string; locations: EntityLocation[]; count: number }>
  getSlots: (requestId: string, locationName: string, fromDate?: string, limit?: number) => Promise<{ entityCode: string; locationName: string; fromDate: string; slots: AvailableSlot[]; count: number; hasAvailability: boolean }>
  holdSlot: (requestId: string, data: { locationName: string; locationAddress?: string; appointmentDate: string; appointmentTime: string }) => Promise<{ success: boolean; holdId?: string; expiresInSeconds: number; expiresAt?: string; error?: string }>
  getHoldStatus: (requestId: string) => Promise<AppointmentHoldStatus>
  releaseHold: (requestId: string) => Promise<{ success: boolean; message: string }>
  onComplete: (data: { hasAppointment: boolean; locationName?: string; appointmentDate?: string; appointmentTime?: string; isFallback: boolean }) => void
  onBack: () => void
}

function AppointmentStepImproved({
  locale,
  requestId,
  tariff,
  paymentComplete,
  pendingPaymentReference,
  getLocations,
  getSlots,
  holdSlot,
  getHoldStatus,
  releaseHold,
  onComplete,
  onBack,
}: AppointmentStepImprovedProps) {
  return (
    <div className="space-y-4">
      {/* Payment Status Banner - Conditional based on actual payment status */}
      {paymentComplete ? (
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
      ) : (
        <Alert className="border-amber-200 bg-amber-50">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            {locale === 'es'
              ? `Pago de ${tariff.toLocaleString()} XAF en espera de validacion.${pendingPaymentReference ? ` Referencia: ${pendingPaymentReference}` : ''} Puede reservar su cita mientras se procesa.`
              : locale === 'fr'
                ? `Paiement de ${tariff.toLocaleString()} XAF en attente de validation.${pendingPaymentReference ? ` Reference: ${pendingPaymentReference}` : ''} Vous pouvez reserver votre rendez-vous pendant le traitement.`
                : `Payment of ${tariff.toLocaleString()} XAF pending validation.${pendingPaymentReference ? ` Reference: ${pendingPaymentReference}` : ''} You can book your appointment while it processes.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Notification Info */}
      <Alert className="border-blue-200 bg-blue-50">
        <Bell className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          {locale === 'es'
            ? 'Recibira una confirmacion por SMS y correo electronico al reservar su cita.'
            : locale === 'fr'
              ? 'Vous recevrez une confirmation par SMS et email lors de la reservation.'
              : 'You will receive SMS and email confirmation when booking your appointment.'}
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

// =============================================================================
// STEP 8: Confirmation - IMPROVED with notification status
// =============================================================================

interface ConfirmationStepImprovedProps {
  locale: string
  requestId: string
  tariff: number
  summary: CitizenSummaryResponse | null
  notificationsSent: boolean
  onDownloadPDF: () => Promise<void>
}

function ConfirmationStepImproved({ locale, requestId, tariff, summary, notificationsSent, onDownloadPDF }: ConfirmationStepImprovedProps) {
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

        {/* Notification Status */}
        {notificationsSent && (
          <Alert className="border-blue-200 bg-blue-50">
            <Bell className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              {locale === 'es'
                ? 'Se ha enviado una confirmacion a su telefono y correo electronico.'
                : locale === 'fr'
                  ? 'Une confirmation a ete envoyee sur votre telephone et email.'
                  : 'A confirmation has been sent to your phone and email.'}
            </AlertDescription>
          </Alert>
        )}

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
          {locale === 'es' ? 'Solicitud Completada' : locale === 'fr' ? 'Demande Terminee' : 'Request Completed'}
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
            <span className="text-muted-foreground">{locale === 'es' ? 'Referencia' : 'Reference'}</span>
            <span className="font-mono font-semibold">{requestId.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{locale === 'es' ? 'Tarifa pagada' : 'Fee paid'}</span>
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
          <Button onClick={() => router.push(`/${locale}/dashboard/service-requests`)}>
            {locale === 'es' ? 'Volver a Solicitudes' : locale === 'fr' ? 'Retour aux Demandes' : 'Back to Requests'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

