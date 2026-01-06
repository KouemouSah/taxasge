/**
 * Hook for payment actions (lock, validate, reject, unlock)
 *
 * @module treasury/hooks
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { treasuryApi } from '../services/api';
import type {
  PaymentLockRequest,
  PaymentValidationRequest,
  PaymentRejectionRequest,
  PaymentActionResponse,
} from '../types';
import { PENDING_PAYMENTS_QUERY_KEY } from './usePendingPayments';

export function usePaymentActions() {
  const queryClient = useQueryClient();

  const invalidatePayments = () => {
    queryClient.invalidateQueries({ queryKey: [PENDING_PAYMENTS_QUERY_KEY] });
  };

  const lockPayment = useMutation<
    PaymentActionResponse,
    Error,
    { paymentId: string; request?: PaymentLockRequest }
  >({
    mutationFn: ({ paymentId, request }) =>
      treasuryApi.lockPayment(paymentId, request),
    onSuccess: () => {
      invalidatePayments();
    },
  });

  const validatePayment = useMutation<
    PaymentActionResponse,
    Error,
    { paymentId: string; request?: PaymentValidationRequest }
  >({
    mutationFn: ({ paymentId, request }) =>
      treasuryApi.validatePayment(paymentId, request),
    onSuccess: () => {
      invalidatePayments();
    },
  });

  const rejectPayment = useMutation<
    PaymentActionResponse,
    Error,
    { paymentId: string; request: PaymentRejectionRequest }
  >({
    mutationFn: ({ paymentId, request }) =>
      treasuryApi.rejectPayment(paymentId, request),
    onSuccess: () => {
      invalidatePayments();
    },
  });

  const unlockPayment = useMutation<PaymentActionResponse, Error, string>({
    mutationFn: (paymentId) => treasuryApi.unlockPayment(paymentId),
    onSuccess: () => {
      invalidatePayments();
    },
  });

  return {
    lockPayment,
    validatePayment,
    rejectPayment,
    unlockPayment,
    isLocking: lockPayment.isPending,
    isValidating: validatePayment.isPending,
    isRejecting: rejectPayment.isPending,
    isUnlocking: unlockPayment.isPending,
  };
}

export default usePaymentActions;
