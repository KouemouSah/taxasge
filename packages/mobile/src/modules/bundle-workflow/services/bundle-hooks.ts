/**
 * useBundleWizard — aligned with web useBundleWizard.ts
 *
 * 6-step wizard: Company → Upload → Classification → Obligations → Payment → Confirmation
 * Existing company: skips Upload+Classification → direct to Obligations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Linking } from 'react-native';
import * as bundleApi from './bundle-api';
import type {
  BundleStep,
  CompanySummary,
  MyCompanyWithStatus,
  CompanySearchResult,
  BundleInitiateResponse,
  BundlePaymentResult,
  ClassifyPreviewResponse,
  DocumentPreview,
  ProcessingMode,
  PaymentMethod,
} from '../types';

export function useBundleWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 6;

  // Step 0: Company
  const [myCompanies, setMyCompanies] = useState<MyCompanyWithStatus[]>([]);
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanySummary | null>(null);
  const [companyExists, setCompanyExists] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout>(null);
  const searchSeqRef = useRef(0);

  // Step 1: Document upload
  const [documentPreview, setDocumentPreview] = useState<DocumentPreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Step 2: Classification
  const [classificationPreview, setClassificationPreview] = useState<ClassifyPreviewResponse | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedCommerceType, setSelectedCommerceType] = useState<string | null>(null);
  const [editedRegistrationNumber, setEditedRegistrationNumber] = useState<string | null>(null);

  // Step 3: Obligations
  const [licenseData, setLicenseData] = useState<BundleInitiateResponse | null>(null);
  const [selectedMode, setSelectedModeState] = useState<ProcessingMode>('consolidated');
  const [selectedObligationIds, setSelectedObligationIds] = useState<Set<string>>(new Set());
  const [isInitiating, setIsInitiating] = useState(false);

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const paymentLockRef = useRef(false);

  // Step 5: Confirmation
  const [paymentResult, setPaymentResult] = useState<BundlePaymentResult | null>(null);

  // Global
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── Step 0: Company ──

  const loadMyCompanies = useCallback(async () => {
    setIsLoadingCompanies(true);
    try {
      const data = await bundleApi.getMyCompanies();
      setMyCompanies(data.companies || []);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.response?.data?.message_es || 'Failed to load companies');
    } finally { setIsLoadingCompanies(false); }
  }, []);

  useEffect(() => { loadMyCompanies(); }, [loadMyCompanies]);

  const searchCompany = useCallback((q: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (q.length < 2) { setSearchResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    const seq = ++searchSeqRef.current;
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const data = await bundleApi.searchCompany(q);
        if (seq === searchSeqRef.current) setSearchResults(data.companies || []);
      } catch { /* stale */ }
      finally { if (seq === searchSeqRef.current) setIsSearching(false); }
    }, 300);
  }, []);

  const selectCompany = useCallback((company: CompanySummary) => {
    setSelectedCompany(company);
    setCompanyExists(true);
    setError(null);
  }, []);

  const clearCompanySelection = useCallback(() => {
    setSelectedCompany(null);
    setCompanyExists(true);
    setLicenseData(null);
    setSearchResults([]);
  }, []);

  const requestNewCompany = useCallback(() => {
    setCompanyExists(false);
    setSelectedCompany(null);
    setCurrentStep(1); // → Document upload
  }, []);

  // ── Step 1: Document upload ──

  const uploadDocument = useCallback(async (uri: string, mimeType: string) => {
    setIsUploading(true);
    setError(null);
    try {
      // Use the wizard session's document preview API
      const formData = new FormData();
      formData.append('file', { uri, type: mimeType, name: 'certificado_padron.pdf' } as any);
      formData.append('document_type', 'certificado_padron');

      // Direct API call since wizard session may not be created yet
      const { apiUpload } = await import('@core/api/client');
      const result = await apiUpload('/wizard-sessions/preview-document', formData);
      setDocumentPreview(result as DocumentPreview);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Upload failed');
    } finally { setIsUploading(false); }
  }, []);

  const deleteDocument = useCallback(() => {
    setDocumentPreview(null);
  }, []);

  // ── Step 2: Classification ──

  const loadClassification = useCallback(async () => {
    if (!documentPreview?.extraction) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await bundleApi.classifyPreview(documentPreview.extraction, selectedZoneId || undefined);
      setClassificationPreview(data);
      // Auto-populate if resolved
      if (data.zone_resolved && data.zone && !selectedZoneId) {
        setSelectedZoneId(data.zone.id);
      }
      if (data.classification?.commerce_type && !selectedCommerceType) {
        setSelectedCommerceType(data.classification.commerce_type);
      }
      // Auto-populate registration number from extraction (like web line 289)
      const extReg = data.extracted_data?.registration_number || data.extracted_data?.numero_registro;
      if (extReg && !editedRegistrationNumber) {
        setEditedRegistrationNumber(String(extReg));
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Classification failed');
    } finally { setIsLoading(false); }
  }, [documentPreview, selectedZoneId, selectedCommerceType]);

  // Refetch classification when zone changes (like web)
  useEffect(() => {
    if (currentStep === 2 && documentPreview?.extraction && selectedZoneId) {
      setSelectedCommerceType(null); // Reset category on zone change
      loadClassification();
    }
  }, [selectedZoneId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 3: Obligations ──

  const loadObligations = useCallback(async () => {
    setIsInitiating(true);
    setError(null);
    try {
      let data: BundleInitiateResponse;
      if (companyExists && selectedCompany) {
        data = await bundleApi.initiate(selectedCompany.id);
      } else if (documentPreview?.extraction) {
        // Inject user-corrected registration number (like web line 322-326)
        const extraction = { ...documentPreview.extraction };
        if (editedRegistrationNumber) {
          if (extraction.empresa && typeof extraction.empresa === 'object') {
            (extraction.empresa as Record<string, unknown>).numero_registro = editedRegistrationNumber;
          } else {
            extraction.numero_registro = editedRegistrationNumber;
          }
        }
        data = await bundleApi.initiateFromUpload(
          extraction, undefined, selectedZoneId || undefined, selectedCommerceType || undefined
        );
      } else {
        throw new Error('No company or document');
      }
      setLicenseData(data);
      if (data.company) setSelectedCompany(data.company);
      // Auto-select all payable (like web)
      const payableIds = new Set(
        (data.obligations || []).filter((o) => o.is_payable).map((o) => o.id)
      );
      setSelectedObligationIds(payableIds);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.response?.data?.message_es || 'Failed to load obligations');
    } finally { setIsInitiating(false); }
  }, [companyExists, selectedCompany, documentPreview, selectedZoneId, selectedCommerceType]);

  const toggleObligation = useCallback((id: string) => {
    setSelectedObligationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAllObligations = useCallback(() => {
    if (!licenseData) return;
    setSelectedObligationIds(new Set(
      licenseData.obligations.filter((o) => o.is_payable).map((o) => o.id)
    ));
  }, [licenseData]);

  const deselectAllObligations = useCallback(() => setSelectedObligationIds(new Set()), []);

  const setSelectedMode = useCallback((mode: ProcessingMode) => {
    setSelectedModeState(mode);
    if (mode === 'consolidated' && licenseData) {
      // Auto-select all payable in consolidated mode (like web)
      setSelectedObligationIds(new Set(
        licenseData.obligations.filter((o) => o.is_payable).map((o) => o.id)
      ));
    }
  }, [licenseData]);

  // ── Step 4: Payment ──

  const submitPayment = useCallback(async () => {
    if (paymentLockRef.current || !licenseData || !paymentMethod) return;
    paymentLockRef.current = true;
    setIsPaymentProcessing(true);
    setError(null);
    try {
      const result = await bundleApi.initiatePayment({
        license_id: licenseData.license_id,
        processing_mode: selectedMode,
        payment_method: paymentMethod,
        selected_obligation_ids: Array.from(selectedObligationIds),
        ...(paymentMethod === 'mobile_money' && phoneNumber ? { phone_number: phoneNumber } : {}),
      });
      if (result.redirect_url) {
        await Linking.openURL(result.redirect_url);
      }
      setPaymentResult(result);
      setCurrentStep(5); // → Confirmation
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.response?.data?.message_es || 'Payment failed');
    } finally {
      setIsPaymentProcessing(false);
      paymentLockRef.current = false;
    }
  }, [licenseData, paymentMethod, selectedMode, selectedObligationIds, phoneNumber]);

  // ── Navigation (aligned with web) ──

  const canGoNext = (() => {
    switch (currentStep) {
      case 0: return !!selectedCompany || !companyExists;
      case 1: return !!documentPreview;
      case 2: return !!editedRegistrationNumber && !!selectedZoneId && !!selectedCommerceType;
      case 3: return !!licenseData && !licenseData.already_complete && selectedObligationIds.size > 0;
      case 4: return !!paymentMethod && (paymentMethod !== 'mobile_money' || phoneNumber.length >= 9);
      default: return false;
    }
  })();

  const canGoBack = currentStep > 0 && currentStep < 5;

  const goNext = useCallback(async () => {
    setError(null);
    if (currentStep === 0) {
      if (companyExists && selectedCompany) {
        // Existing company → skip upload+classification → obligations
        setIsLoading(true);
        try {
          const data = await bundleApi.initiate(selectedCompany.id);
          setLicenseData(data);
          if (data.company) setSelectedCompany(data.company);
          setSelectedObligationIds(new Set(
            (data.obligations || []).filter((o) => o.is_payable).map((o) => o.id)
          ));
          setCurrentStep(3); // → Obligations (skip 1+2)
        } catch (e: any) {
          setError(e?.response?.data?.detail || 'Failed to initiate');
        } finally { setIsLoading(false); }
        return;
      }
      setCurrentStep(1); // → Document upload
      return;
    }
    if (currentStep === 1) {
      // After upload → classification
      await loadClassification();
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      // After classification → load obligations
      await loadObligations();
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      setCurrentStep(4); // → Payment
      return;
    }
    if (currentStep === 4) {
      await submitPayment(); // Handles step advance internally
      return;
    }
  }, [currentStep, companyExists, selectedCompany, loadClassification, loadObligations, submitPayment]);

  // goBack aligned with web: obligations → company_id (existing) or classification (new)
  const goBack = useCallback(() => {
    if (currentStep === 3 && companyExists) {
      setCurrentStep(0); // Skip back over upload+classification
    } else if (currentStep === 3 && !companyExists) {
      setCurrentStep(2); // Back to classification (not upload)
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, companyExists]);

  const clearError = useCallback(() => setError(null), []);

  return {
    currentStep, totalSteps, canGoNext, canGoBack, goNext, goBack,
    myCompanies, searchResults, selectedCompany, companyExists,
    isLoadingCompanies, isSearching,
    loadMyCompanies, searchCompany, selectCompany, clearCompanySelection, requestNewCompany,
    documentPreview, isUploading, uploadDocument, deleteDocument,
    classificationPreview, selectedZoneId, selectedCommerceType, editedRegistrationNumber,
    setSelectedZoneId, setSelectedCommerceType, setEditedRegistrationNumber, loadClassification,
    licenseData, selectedMode, selectedObligationIds, isInitiating,
    setSelectedMode, toggleObligation, selectAllObligations, deselectAllObligations, loadObligations,
    paymentMethod, phoneNumber, isPaymentProcessing,
    setPaymentMethod, setPhoneNumber, submitPayment,
    paymentResult,
    error, isLoading, clearError,
  };
}
