/**
 * Hook for payment actions (validate, reject)
 * Includes error handling with user-friendly toast messages
 *
 * @module treasury/hooks
 * @version 2.0.0 - Removed lock/unlock (auto-assignment architecture)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { treasuryApi } from '../services/api';
import type {
  PaymentValidationRequest,
  PaymentRejectionRequest,
  PaymentActionResponse,
} from '../types';
import { getTreasuryErrorCode } from '../types';
import { PENDING_PAYMENTS_QUERY_KEY } from './usePendingPayments';

export function usePaymentActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const tTreasury = useTranslations('treasury');
  const tCommon = useTranslations('common');

  const invalidatePayments = () => {
    queryClient.invalidateQueries({ queryKey: [PENDING_PAYMENTS_QUERY_KEY] });
  };

  /**
   * Get translated error message from API error
   */
  const getTranslatedError = (error: unknown, fallbackKey: string): string => {
    const errorCode = getTreasuryErrorCode(error);
    if (errorCode) {
      // Try to get translation for this error code
      try {
        return tTreasury(`errors.${errorCode}`);
      } catch {
        // Fall through to fallback
      }
    }
    // Use fallback translation key
    try {
      return tTreasury(`errors.${fallbackKey}`);
    } catch {
      return tTreasury('errors.generic');
    }
  };

  const showError = (error: unknown, fallbackKey: string) => {
    const message = getTranslatedError(error, fallbackKey);
    toast({
      title: tCommon('error'),
      description: message,
      variant: 'destructive',
    });
  };

  const showSuccess = (message: string) => {
    toast({
      title: tCommon('success'),
      description: message,
    });
  };

  const validatePayment = useMutation<
    PaymentActionResponse,
    Error,
    { paymentId: string; request?: PaymentValidationRequest }
  >({
    mutationFn: ({ paymentId, request }) =>
      treasuryApi.validatePayment(paymentId, request),
    onSuccess: (data) => {
      invalidatePayments();
      if (data.messageEs) {
        showSuccess(data.messageEs);
      }
    },
    onError: (error) => {
      showError(error, 'validateFailed');
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
      if (data.messageEs) {
        showSuccess(data.messageEs);
      }
    },
    onError: (error) => {
      showError(error, 'rejectFailed');
    },
  });

  return {
    validatePayment,
    rejectPayment,
    isValidating: validatePayment.isPending,
    isRejecting: rejectPayment.isPending,
  };
}

export default usePaymentActions;
