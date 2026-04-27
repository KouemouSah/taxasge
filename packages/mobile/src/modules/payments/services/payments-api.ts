/**
 * Payments API — thin wrappers around the FastAPI payments routes.
 */

import { apiGet } from '@core/api/client';
import { API_ENDPOINTS } from '@core/api/endpoints';
import type {
  Payment,
  PaymentListResponse,
  PaymentStatusPolled,
  PaymentsListFilters,
} from '../types/payments.types';

/** GET /api/v1/payments — paginated list (filters scoped to current user by backend). */
export async function listPayments(
  filters: PaymentsListFilters,
): Promise<PaymentListResponse> {
  const params: Record<string, unknown> = {
    page: filters.page,
    page_size: filters.page_size,
  };
  if (filters.status) params.status = filters.status;
  return apiGet<PaymentListResponse>(API_ENDPOINTS.payments.list, params);
}

/** GET /api/v1/payments/{id} — detail with ownership check. */
export async function getPayment(paymentId: string): Promise<Payment> {
  return apiGet<Payment>(API_ENDPOINTS.payments.detail(paymentId));
}

/**
 * GET /api/v1/service-requests/{request_id}/payment/status — polling endpoint.
 * Used by `wizard/payment-result` and the in-flight payment detail UI.
 */
export async function getServiceRequestPaymentStatus(
  serviceRequestId: string,
): Promise<PaymentStatusPolled> {
  return apiGet<PaymentStatusPolled>(
    API_ENDPOINTS.payments.serviceRequestStatus(serviceRequestId),
  );
}
