/**
 * Payments React Query hooks.
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import * as paymentsApi from './payments-api';
import {
  TERMINAL_PAYMENT_STATUSES,
  type PaymentStatus,
  type PaymentsListFilters,
} from '../types/payments.types';

export const PAYMENTS_QUERY_KEYS = {
  list: ['payments'] as const,
  listFiltered: (filters: Omit<PaymentsListFilters, 'page'>) =>
    ['payments', 'list', filters] as const,
  detail: (id: string) => ['payments', 'detail', id] as const,
  serviceRequestStatus: (requestId: string) =>
    ['payments', 'service-request-status', requestId] as const,
} as const;

const DEFAULT_PAGE_SIZE = 20;

/** Infinite-paginated list of the current user's payments. */
export function usePaymentsList(
  filters: { status?: PaymentStatus; page_size?: number } = {},
) {
  const pageSize = filters.page_size ?? DEFAULT_PAGE_SIZE;
  return useInfiniteQuery({
    queryKey: PAYMENTS_QUERY_KEYS.listFiltered({
      status: filters.status,
      page_size: pageSize,
    }),
    queryFn: ({ pageParam = 1 }) =>
      paymentsApi.listPayments({
        page: pageParam as number,
        page_size: pageSize,
        status: filters.status,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    staleTime: 30_000,
  });
}

export function usePayment(paymentId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: PAYMENTS_QUERY_KEYS.detail(paymentId ?? ''),
    queryFn: () => paymentsApi.getPayment(paymentId as string),
    enabled: enabled && !!paymentId,
    staleTime: 15_000,
  });
}

interface UsePaymentStatusPollingOptions {
  enabled?: boolean;
  /** Poll interval in milliseconds (defaults to 3000). */
  intervalMs?: number;
  /** Hard cap on the number of refetches (defaults to 100 ≈ 5 min at 3s). */
  maxAttempts?: number;
}

/**
 * Polls `GET /service-requests/{requestId}/payment/status` while the payment
 * is in a non-terminal state. Stops automatically when the backend reports
 * `completed | failed | cancelled | refunded`, or after `maxAttempts` refetches.
 */
export function usePaymentStatusPolling(
  serviceRequestId: string | null | undefined,
  options: UsePaymentStatusPollingOptions = {},
) {
  const intervalMs = options.intervalMs ?? 3000;
  const maxAttempts = options.maxAttempts ?? 100;

  return useQuery({
    queryKey: PAYMENTS_QUERY_KEYS.serviceRequestStatus(serviceRequestId ?? ''),
    queryFn: () =>
      paymentsApi.getServiceRequestPaymentStatus(serviceRequestId as string),
    enabled: !!serviceRequestId && options.enabled !== false,
    staleTime: 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && TERMINAL_PAYMENT_STATUSES.has(data.status)) return false;
      const fetchCount = query.state.dataUpdateCount + query.state.errorUpdateCount;
      if (fetchCount >= maxAttempts) return false;
      return intervalMs;
    },
    refetchOnWindowFocus: false,
  });
}
