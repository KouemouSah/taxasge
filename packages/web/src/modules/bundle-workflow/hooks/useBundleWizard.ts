/**
 * useBundleWizard — State orchestration for the Bundle Payment wizard.
 *
 * Combines two concerns:
 * 1. Wizard session lifecycle (TTL, document upload) via useWizardSession
 * 2. Bundle business logic (company search, initiation, payment) via bundleWorkflowApi
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useWizardSession } from '@/modules/service-requests/hooks'
import { bundleWorkflowApi } from '../services/bundle-workflow-api'
import type {
  BundleStep,
  CompanySummary,
  CompanySearchResult,
  MyCompanyWithStatus,
  BundleInitiateResponse,
  BundlePaymentResult,
  ObligationItem,
} from '../types'
import { BundleStep as Step } from '../types'
import type { ProcessingMode } from '@/types/service-bundle'
import type { DocumentPreview } from '@/modules/service-requests/types/wizard-session'

// ── Return Interface ────────────────────────────────────────────

export interface UseBundleWizardReturn {
  // Step navigation
  currentStep: number
  totalSteps: number
  goNext: () => void
  goBack: () => void
  canGoNext: boolean
  canGoBack: boolean

  // Session (from useWizardSession)
  sessionId: string | null
  timeRemaining: number
  isExpiring: boolean
  isExpired: boolean
  createSession: () => Promise<string | null>

  // Step 0: Company identification
  myCompanies: MyCompanyWithStatus[]
  searchResults: CompanySearchResult[]
  selectedCompany: CompanySummary | null
  companyExists: boolean
  isLoadingCompanies: boolean
  isSearching: boolean
  searchCompany: (q: string) => void
  selectCompany: (company: CompanySummary) => void
  clearCompanySelection: () => void
  requestNewCompany: () => void

  // Step 1: Document upload (delegates to useWizardSession)
  documentPreview: DocumentPreview | null
  isUploading: boolean
  uploadDocument: (file: File) => Promise<DocumentPreview | null>
  deleteDocument: () => Promise<void>

  // Step 2: Obligations review
  licenseData: BundleInitiateResponse | null
  isInitiating: boolean
  selectedMode: ProcessingMode
  selectedObligationIds: Set<string>
  setSelectedMode: (mode: ProcessingMode) => void
  toggleObligation: (id: string) => void
  selectAllObligations: () => void
  deselectAllObligations: () => void
  loadObligations: () => Promise<void>

  // Step 3: Payment
  paymentMethod: string | null
  phoneNumber: string
  isPaymentProcessing: boolean
  setPaymentMethod: (method: string) => void
  setPhoneNumber: (phone: string) => void
  submitPayment: () => Promise<BundlePaymentResult | null>

  // Step 4: Confirmation
  paymentResult: BundlePaymentResult | null

  // Global
  isLoading: boolean
  error: string | null
  clearError: () => void
}

// ── Hook ────────────────────────────────────────────────────────

export function useBundleWizard(): UseBundleWizardReturn {
  // -- Wizard session (for docs + TTL) --
  const wizardSession = useWizardSession()

  // -- Step state --
  const [currentStep, setCurrentStep] = useState(Step.COMPANY_IDENTIFICATION)

  // -- Step 0: Company --
  const [myCompanies, setMyCompanies] = useState<MyCompanyWithStatus[]>([])
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([])
  const [selectedCompany, setSelectedCompany] = useState<CompanySummary | null>(null)
  const [companyExists, setCompanyExists] = useState(true)
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchSeqRef = useRef(0)

  // -- Step 1: Document --
  const [documentPreview, setDocumentPreview] = useState<DocumentPreview | null>(null)

  // -- Step 2: Obligations --
  const [licenseData, setLicenseData] = useState<BundleInitiateResponse | null>(null)
  const [isInitiating, setIsInitiating] = useState(false)
  const [selectedMode, setSelectedMode] = useState<ProcessingMode>('per_line')
  const [selectedObligationIds, setSelectedObligationIds] = useState<Set<string>>(new Set())

  // -- Step 3: Payment --
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)

  // -- Step 4: Confirmation --
  const [paymentResult, setPaymentResult] = useState<BundlePaymentResult | null>(null)

  // -- Global --
  const [error, setError] = useState<string | null>(null)

  // ── Session creation ────────────────────────────────────────

  const createSession = useCallback(async (): Promise<string | null> => {
    try {
      const session = await wizardSession.createSession({
        workflow_code: 'BUNDLE_PAYMENT',
        solicitud_type: 'expedicion',
      })
      return session?.sessionId ?? null
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creating session')
      return null
    }
  }, [wizardSession])

  // ── Step 0: Load my companies on mount ──────────────────────

  const loadMyCompanies = useCallback(async () => {
    setIsLoadingCompanies(true)
    try {
      const resp = await bundleWorkflowApi.getMyCompanies()
      setMyCompanies(resp.companies)
    } catch (e) {
      console.error('[BundleWizard] Failed to load my companies:', e)
    } finally {
      setIsLoadingCompanies(false)
    }
  }, [])

  useEffect(() => {
    loadMyCompanies()
  }, [loadMyCompanies])

  // ── Step 0: Search ──────────────────────────────────────────

  const searchCompany = useCallback((q: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)

    if (!q || q.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const seq = ++searchSeqRef.current

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const resp = await bundleWorkflowApi.searchCompany(q)
        // Discard stale responses
        if (seq === searchSeqRef.current) {
          setSearchResults(resp.companies)
        }
      } catch (e) {
        console.error('[BundleWizard] Search error:', e)
      } finally {
        if (seq === searchSeqRef.current) setIsSearching(false)
      }
    }, 300)
  }, [])

  const selectCompany = useCallback((company: CompanySummary) => {
    setSelectedCompany(company)
    setCompanyExists(true)
    setSearchResults([])
    setError(null)
  }, [])

  const clearCompanySelection = useCallback(() => {
    setSelectedCompany(null)
    setCompanyExists(true)
    setLicenseData(null)
    setSelectedObligationIds(new Set())
  }, [])

  const requestNewCompany = useCallback(() => {
    setCompanyExists(false)
    setSelectedCompany(null)
    setCurrentStep(Step.DOCUMENT_UPLOAD)
  }, [])

  // ── Step 1: Document upload ─────────────────────────────────

  const uploadDocument = useCallback(async (file: File): Promise<DocumentPreview | null> => {
    if (!wizardSession.session) return null
    try {
      const preview = await wizardSession.previewDocument('certificado_padron', file)
      setDocumentPreview(preview)
      return preview
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error uploading document')
      return null
    }
  }, [wizardSession])

  const deleteDocument = useCallback(async () => {
    if (!wizardSession.session) return
    try {
      await wizardSession.deleteDocument('certificado_padron')
      setDocumentPreview(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error deleting document')
    }
  }, [wizardSession])

  // ── Step 2: Load obligations ────────────────────────────────

  const loadObligations = useCallback(async () => {
    setIsInitiating(true)
    setError(null)
    try {
      let result: BundleInitiateResponse

      if (companyExists && selectedCompany) {
        // Existing company → initiate directly
        result = await bundleWorkflowApi.initiate(selectedCompany.id)
      } else if (documentPreview) {
        // New company → initiate from upload extraction
        const extraction = documentPreview.extraction || {}
        result = await bundleWorkflowApi.initiateFromUpload(extraction)
      } else {
        throw new Error('No company selected and no document uploaded')
      }

      setLicenseData(result)

      // Auto-select all payable obligations
      const payableIds = result.obligations
        .filter((o: ObligationItem) => o.isPayable)
        .map((o: ObligationItem) => o.id)
      setSelectedObligationIds(new Set(payableIds))

      // If company was created from upload, update selectedCompany
      if (result.company) {
        setSelectedCompany(result.company)
        setCompanyExists(true)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error loading obligations'
      setError(msg)
    } finally {
      setIsInitiating(false)
    }
  }, [companyExists, selectedCompany, documentPreview])

  // ── Step 2: Obligation selection ────────────────────────────

  const toggleObligation = useCallback((id: string) => {
    setSelectedObligationIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAllObligations = useCallback(() => {
    if (!licenseData) return
    const payableIds = licenseData.obligations
      .filter(o => o.isPayable)
      .map(o => o.id)
    setSelectedObligationIds(new Set(payableIds))
  }, [licenseData])

  const deselectAllObligations = useCallback(() => {
    setSelectedObligationIds(new Set())
  }, [])

  const handleSetSelectedMode = useCallback((mode: ProcessingMode) => {
    setSelectedMode(mode)
    if (mode === 'consolidated' && licenseData) {
      // Auto-select all payable in consolidated mode
      const payableIds = licenseData.obligations
        .filter(o => o.isPayable)
        .map(o => o.id)
      setSelectedObligationIds(new Set(payableIds))
    }
  }, [licenseData])

  // ── Step 3: Payment ─────────────────────────────────────────

  const submitPayment = useCallback(async (): Promise<BundlePaymentResult | null> => {
    if (!licenseData || !paymentMethod) return null

    setIsPaymentProcessing(true)
    setError(null)

    try {
      const result = await bundleWorkflowApi.initiatePayment({
        licenseId: licenseData.licenseId,
        processingMode: selectedMode,
        paymentMethod,
        selectedObligationIds: Array.from(selectedObligationIds),
        phoneNumber: paymentMethod === 'mobile_money' ? phoneNumber : undefined,
        wizardSessionId: wizardSession.session?.sessionId,
      })

      setPaymentResult(result)

      if (result.redirectUrl) {
        // BANGE redirect
        window.location.href = result.redirectUrl
        return result
      }

      // Cash/check → advance to confirmation
      setCurrentStep(Step.CONFIRMATION)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error initiating payment'
      setError(msg)
      return null
    } finally {
      setIsPaymentProcessing(false)
    }
  }, [
    licenseData, paymentMethod, selectedMode,
    selectedObligationIds, phoneNumber, wizardSession.session,
  ])

  // ── Navigation ──────────────────────────────────────────────

  const canGoNext = (() => {
    switch (currentStep) {
      case Step.COMPANY_IDENTIFICATION:
        return selectedCompany !== null
      case Step.DOCUMENT_UPLOAD:
        return documentPreview !== null || companyExists
      case Step.OBLIGATIONS_REVIEW:
        return licenseData !== null &&
          !licenseData.alreadyComplete &&
          selectedObligationIds.size > 0
      case Step.PAYMENT:
        return paymentMethod !== null &&
          (paymentMethod !== 'mobile_money' || phoneNumber.length >= 9)
      default:
        return false
    }
  })()

  const canGoBack = currentStep > Step.COMPANY_IDENTIFICATION &&
    currentStep < Step.CONFIRMATION

  const goNext = useCallback(() => {
    if (currentStep === Step.COMPANY_IDENTIFICATION && companyExists) {
      // Skip document upload for existing companies
      setCurrentStep(Step.OBLIGATIONS_REVIEW)
    } else if (currentStep === Step.PAYMENT) {
      // Payment handles its own navigation via submitPayment
      return
    } else {
      setCurrentStep(prev => Math.min(prev + 1, Step.CONFIRMATION))
    }
  }, [currentStep, companyExists])

  const goBack = useCallback(() => {
    if (currentStep === Step.OBLIGATIONS_REVIEW && companyExists) {
      // Skip document upload going back for existing companies
      setCurrentStep(Step.COMPANY_IDENTIFICATION)
    } else {
      setCurrentStep(prev => Math.max(prev - 1, Step.COMPANY_IDENTIFICATION))
    }
  }, [currentStep, companyExists])

  const clearError = useCallback(() => setError(null), [])

  // ── Return ──────────────────────────────────────────────────

  return {
    currentStep,
    totalSteps: 5,
    goNext,
    goBack,
    canGoNext,
    canGoBack,

    sessionId: wizardSession.session?.sessionId ?? null,
    timeRemaining: wizardSession.timeRemaining,
    isExpiring: wizardSession.isExpiring,
    isExpired: wizardSession.isExpired,
    createSession,

    myCompanies,
    searchResults,
    selectedCompany,
    companyExists,
    isLoadingCompanies,
    isSearching,
    searchCompany,
    selectCompany,
    clearCompanySelection,
    requestNewCompany,

    documentPreview,
    isUploading: wizardSession.isDocumentUploading('certificado_padron'),
    uploadDocument,
    deleteDocument,

    licenseData,
    isInitiating,
    selectedMode,
    selectedObligationIds,
    setSelectedMode: handleSetSelectedMode,
    toggleObligation,
    selectAllObligations,
    deselectAllObligations,
    loadObligations,

    paymentMethod,
    phoneNumber,
    isPaymentProcessing,
    setPaymentMethod,
    setPhoneNumber,
    submitPayment,

    paymentResult,

    isLoading: wizardSession.isLoading || isLoadingCompanies || isInitiating || isPaymentProcessing,
    error: error || wizardSession.error,
    clearError,
  }
}
