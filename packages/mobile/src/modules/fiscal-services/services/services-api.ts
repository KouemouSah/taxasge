/**
 * Fiscal Services API
 */

import { apiGet, apiPost } from '@core/api/client';
import { API_ENDPOINTS } from '@core/api/endpoints';
import type {
  FiscalServiceListResponse,
  ServiceSearchResponse,
  ServiceSearchFilters,
  ServiceDetail,
  MinistryItem,
  CategoryItem,
  FiscalServiceItem,
} from '../types/services.types';

/** GET /fiscal-services/ with pagination */
export async function getServices(
  params: Record<string, unknown> = {},
): Promise<FiscalServiceListResponse> {
  return apiGet<FiscalServiceListResponse>(API_ENDPOINTS.fiscalServices.list, params);
}

/** POST /homepage/search (public, translated — same endpoint as web) */
export async function searchServices(
  filters: ServiceSearchFilters,
): Promise<ServiceSearchResponse> {
  return apiPost<ServiceSearchResponse>(API_ENDPOINTS.fiscalServices.search, filters);
}

/** GET /fiscal-services/{id}/details */
export async function getServiceDetail(
  id: number,
  language = 'es',
): Promise<ServiceDetail> {
  return apiGet<ServiceDetail>(
    API_ENDPOINTS.fiscalServices.details(String(id)),
    { language, include_related: true },
  );
}

/** GET /fiscal-services/ministries */
export async function getMinistries(
  language = 'es',
): Promise<MinistryItem[]> {
  return apiGet<MinistryItem[]>(API_ENDPOINTS.fiscalServices.ministries, { language });
}

/** GET /fiscal-services/categories */
export async function getCategories(
  language = 'es',
): Promise<CategoryItem[]> {
  return apiGet<CategoryItem[]>(API_ENDPOINTS.fiscalServices.categories, { language });
}

/** GET /fiscal-services/popular/list */
export async function getPopularServices(
  limit = 10,
): Promise<FiscalServiceItem[]> {
  return apiGet<FiscalServiceItem[]>(API_ENDPOINTS.fiscalServices.popular, { limit });
}
