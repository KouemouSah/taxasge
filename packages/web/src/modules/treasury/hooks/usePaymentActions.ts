/**
 * Hook for payment actions (lock, validate, reject, unlock)
 * Includes error handling with user-friendly toast messages
 *
 * @module treasury/hooks
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { treasuryApi } from '../services/api';
import type {
  PaymentLockRequest,
  PaymentValidationRequest,
  PaymentRejectionRequest,
  PaymentActionResponse,
} from '../types';
import { getTreasuryErrorMessage } from '../types';
import { PENDING_PAYMENTS_QUERY_KEY } from './usePendingPayments';

export function usePaymentActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidatePayments = () => {
    queryClient.invalidateQueries({ queryKey: [PENDING_PAYMENTS_QUERY_KEY] });
  };

  const showError = (error: unknown, fallbackMessage: string) => {
    const message = getTreasuryErrorMessage(error);
    toast({
      title: 'Error',
      description: message || fallbackMessage,
      variant: 'destructive',
    });
  };

  const showSuccess = (message: string) => {
    toast({
      title: 'Operación exitosa',
      description: message,
    });
  };

  const lockPayment = useMutation<
    PaymentActionResponse,
    Error,
    { paymentId: string; request?: PaymentLockRequest }
  >({
    mutationFn: ({ paymentId, request }) =>
      treasuryApi.lockPayment(paymentId, request),
    onSuccess: (data) => {
      invalidatePayments();
      if (data.messageEs) {
        showSuccess(data.messageEs);
      }
    },
    onError: (error) => {
      showError(error, 'No se pudo bloquear el pago.');
    },
  });

  const validatePayment = useMutation<
    PaymentActionResponse,
    Error,
    { paymentId: string; request?: PaymentValidationRequest }
  >({
    mutationFn: ({ paymentId, request }) =>
      treasuryApi.validatePayment(paymentId, request),
    onSuccess: (data) => {
      invalidatePayments();
      showSuccess(data.messageEs || 'Pago validado correctamente.');
    },
    onError: (error) => {
      showError(error, 'No se pudo validar el pago.');
    },
  });

  const rejectPayment = useMutation<
    PaymentActionResponse,
    Error,
    { paymentId: string; request: PaymentRejectionRequest }
  >({
    mutationFn: ({ paymentId, request }) =>
      treasuryApi.rejectPayment(paymentId, request),
    onSuccess: (data) => {
      invalidatePayments();
      showSuccess(data.messageEs || 'Pago rechazado.');
    },
    onError: (error) => {
      showError(error, 'No se pudo rechazar el pago.');
    },
  });

  const unlockPayment = useMutation<PaymentActionResponse, Error, string>({
    mutationFn: (paymentId) => treasuryApi.unlockPayment(paymentId),
    onSuccess: (data) => {
      invalidatePayments();
      showSuccess(data.messageEs || 'Bloqueo liberado.');
    },
    onError: (error) => {
      showError(error, 'No se pudo desbloquear el pago.');
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
