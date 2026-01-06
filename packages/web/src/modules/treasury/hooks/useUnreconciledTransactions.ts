/**
 * Hook for fetching unreconciled bank transactions
 *
 * @module treasury/hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { treasuryApi } from '../services/api';
import type {
  BankTransactionParams,
  BankTransactionListResponse,
  ReconcileRequest,
  BankTransaction,
} from '../types';

export const UNRECONCILED_QUERY_KEY = 'treasury-unreconciled-transactions';

export function useUnreconciledTransactions(params: BankTransactionParams = {}) {
  return useQuery<BankTransactionListResponse, Error>({
    queryKey: [UNRECONCILED_QUERY_KEY, params],
    queryFn: () => treasuryApi.getUnreconciledTransactions(params),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    retry: 2,
  });
}

export function useReconcileTransaction() {
  const queryClient = useQueryClient();

  return useMutation<BankTransaction, Error, ReconcileRequest>({
    mutationFn: (request) => treasuryApi.reconcileTransaction(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNRECONCILED_QUERY_KEY] });
    },
  });
}

export default useUnreconciledTransactions;
