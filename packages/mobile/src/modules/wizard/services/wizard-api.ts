/**
 * Wizard Session API — 17 endpoint functions
 *
 * Thin wrappers around apiGet/apiPost/apiPut/apiDelete.
 * All paths relative to /wizard-sessions (prefix in backend).
 */

import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '@core/api/client';
import type {
  WizardSessionCreate,
  WizardSession,
  WorkflowConfig,
  DocumentPreview,
  DocumentConfirmRequest,
  FormConfig,
  FormDataSaveRequest,
  PreparePaymentResult,
  InitiatePaymentRequest,
  InitiatePaymentResult,
  AppointmentLocationsResponse,
  AvailableDaysResponse,
  AvailableSlotsResponse,
  AppointmentSelectionRequest,
  AvailableSitesResponse,
  SiteSelectionRequest,
} from '../types/wizard.types';
import { Platform } from 'react-native';

const BASE = '/wizard-sessions';

// Workflow config (from service-requests router)
export async function getWorkflowConfig(workflowCode: string): Promise<WorkflowConfig> {
  return apiGet<WorkflowConfig>(`/service-requests/workflows/${workflowCode}`);
}

// Session lifecycle
export async function createSession(data: WizardSessionCreate): Promise<WizardSession> {
  return apiPost<WizardSession>(BASE, data);
}

export async function getSession(sessionId: string): Promise<WizardSession> {
  return apiGet<WizardSession>(`${BASE}/${sessionId}`);
}

export async function deleteSession(sessionId: string, reason?: string): Promise<void> {
  const url = reason ? `${BASE}/${sessionId}?reason=${encodeURIComponent(reason)}` : `${BASE}/${sessionId}`;
  await apiDelete(url);
}

// Documents
export async function previewDocument(
  sessionId: string,
  documentCode: string,
  fileUri: string,
  fileName: string,
): Promise<DocumentPreview> {
  const formData = new FormData();
  const match = /\.(\w+)$/.exec(fileName);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  const type = ext === 'pdf' ? 'application/pdf'
    : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : ext === 'png' ? 'image/png'
    : ext === 'webp' ? 'image/webp'
    : 'application/octet-stream';

  formData.append('file', {
    uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
    name: fileName,
    type,
  } as unknown as Blob);

  return apiUpload<DocumentPreview>(
    `${BASE}/${sessionId}/documents/preview?document_code=${encodeURIComponent(documentCode)}`,
    formData,
  );
}

export async function confirmDocument(
  sessionId: string,
  data: DocumentConfirmRequest,
): Promise<WizardSession> {
  return apiPost<WizardSession>(`${BASE}/${sessionId}/documents/confirm`, data);
}

export async function deleteDocument(
  sessionId: string,
  documentCode: string,
): Promise<WizardSession> {
  return apiDelete<WizardSession>(`${BASE}/${sessionId}/documents/${documentCode}`);
}

// Form data
export async function saveFormData(
  sessionId: string,
  data: FormDataSaveRequest,
): Promise<WizardSession> {
  return apiPut<WizardSession>(`${BASE}/${sessionId}/form-data`, data);
}

export async function getFormConfig(
  sessionId: string,
  stepId: string,
): Promise<FormConfig> {
  return apiGet<FormConfig>(`${BASE}/${sessionId}/form-config/${stepId}`);
}

// Payment
export async function preparePayment(
  sessionId: string,
): Promise<PreparePaymentResult> {
  return apiPost<PreparePaymentResult>(`${BASE}/${sessionId}/prepare-payment`);
}

export async function initiatePayment(
  sessionId: string,
  data: InitiatePaymentRequest,
): Promise<InitiatePaymentResult> {
  return apiPost<InitiatePaymentResult>(`${BASE}/${sessionId}/initiate-payment`, data);
}

// Site selection
export async function getAvailableSites(
  sessionId: string,
): Promise<AvailableSitesResponse> {
  return apiGet<AvailableSitesResponse>(`${BASE}/${sessionId}/available-sites`);
}

export async function selectSite(
  sessionId: string,
  data: SiteSelectionRequest,
): Promise<{ success: boolean; site_selection: WizardSession['site_selection'] }> {
  return apiPost(`${BASE}/${sessionId}/select-site`, data);
}

// Appointments
export async function getAppointmentLocations(
  sessionId: string,
): Promise<AppointmentLocationsResponse> {
  return apiGet<AppointmentLocationsResponse>(`${BASE}/${sessionId}/appointments/locations`);
}

export async function getAvailableDays(
  sessionId: string,
  entityLocationId: string,
  fromDate?: string,
  toDate?: string,
): Promise<AvailableDaysResponse> {
  const params: Record<string, string> = { entity_location_id: entityLocationId };
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;
  return apiGet<AvailableDaysResponse>(`${BASE}/${sessionId}/appointments/available-days`, params);
}

export async function getAvailableSlots(
  sessionId: string,
  entityLocationId: string,
  fromDate?: string,
  limit?: number,
): Promise<AvailableSlotsResponse> {
  const params: Record<string, string | number> = { entity_location_id: entityLocationId };
  if (fromDate) params.from_date = fromDate;
  if (limit) params.limit = limit;
  return apiGet<AvailableSlotsResponse>(`${BASE}/${sessionId}/appointments/available-slots`, params);
}

export async function selectAppointment(
  sessionId: string,
  data: AppointmentSelectionRequest,
): Promise<{ success: boolean; appointment_data: WizardSession['appointment_data'] }> {
  return apiPost(`${BASE}/${sessionId}/appointments/select`, data);
}
