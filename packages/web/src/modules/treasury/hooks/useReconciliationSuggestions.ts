'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import treasuryApi from '../services/api';

export const RECONCILIATION_SUGGESTIONS_KEY = 'treasury-reconciliation-suggestions';

export function useReconciliationSuggestions(limit: number = 50) {
  return useQuery({
    queryKey: [RECONCILIATION_SUGGESTIONS_KEY, limit],
    queryFn: () => treasuryApi.getReconciliationSuggestions(limit),
    staleTime: 60 * 1000, // 1 min
  });
}

export function useAutoMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threshold: number) => treasuryApi.autoMatchReconciliation(threshold),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECONCILIATION_SUGGESTIONS_KEY] });
    },
  });
}
