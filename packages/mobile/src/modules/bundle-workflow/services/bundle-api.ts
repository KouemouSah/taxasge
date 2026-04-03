/**
 * Bundle Workflow API — 7 endpoints aligned with web
 * Base path: /bundle-workflow
 * All require authentication.
 */

import { apiGet, apiPost } from '@core/api/client';
import type {
  MyCompaniesResponse,
  SearchCompanyResponse,
  BundleInitiateResponse,
  ClassifyPreviewResponse,
  BundlePaymentResult,
} from '../types';

const BASE = '/bundle-workflow';

/** GET /bundle-workflow/my-companies */
export async function getMyCompanies(fiscalYear?: number): Promise<MyCompaniesResponse> {
  return apiGet<MyCompaniesResponse>(`${BASE}/my-companies`, fiscalYear ? { fiscal_year: fiscalYear } : undefined);
}

/** GET /bundle-workflow/search-company?q=&limit= */
export async function searchCompany(q: string, limit = 10): Promise<SearchCompanyResponse> {
  return apiGet<SearchCompanyResponse>(`${BASE}/search-company`, { q, limit });
}

/** POST /bundle-workflow/initiate */
export async function initiate(companyId: string, fiscalYear?: number): Promise<BundleInitiateResponse> {
  return apiPost<BundleInitiateResponse>(`${BASE}/initiate`, {
    company_id: companyId,
    ...(fiscalYear ? { fiscal_year: fiscalYear } : {}),
  });
}

/** POST /bundle-workflow/classify-preview */
export async function classifyPreview(extraction: Record<string, unknown>, zoneId?: string): Promise<ClassifyPreviewResponse> {
  return apiPost<ClassifyPreviewResponse>(`${BASE}/classify-preview`, {
    extraction,
    ...(zoneId ? { zone_id: zoneId } : {}),
  });
}

/** POST /bundle-workflow/initiate-from-upload */
export async function initiateFromUpload(
  extraction: Record<string, unknown>,
  fiscalYear?: number,
  zoneId?: string,
  commerceType?: string,
): Promise<BundleInitiateResponse> {
  return apiPost<BundleInitiateResponse>(`${BASE}/initiate-from-upload`, {
    extraction,
    ...(fiscalYear ? { fiscal_year: fiscalYear } : {}),
    ...(zoneId ? { zone_id: zoneId } : {}),
    ...(commerceType ? { commerce_type: commerceType } : {}),
  });
}

/** POST /bundle-workflow/validate-selection */
export async function validateSelection(
  licenseId: string,
  processingMode: string,
  selectedObligationIds?: string[],
): Promise<{ valid: boolean; selected_total: number; errors?: any[] }> {
  return apiPost(`${BASE}/validate-selection`, {
    license_id: licenseId,
    processing_mode: processingMode,
    ...(selectedObligationIds ? { selected_obligation_ids: selectedObligationIds } : {}),
  });
}

/** POST /bundle-workflow/initiate-payment */
export async function initiatePayment(params: {
  license_id: string;
  processing_mode: string;
  payment_method: string;
  selected_obligation_ids: string[];
  phone_number?: string;
  wizard_session_id?: string;
}): Promise<BundlePaymentResult> {
  return apiPost<BundlePaymentResult>(`${BASE}/initiate-payment`, params);
}
