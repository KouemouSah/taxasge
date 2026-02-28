'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import treasuryApi from '../services/api';

export const TREASURY_BRIEFING_QUERY_KEY = 'treasury-analyst-briefing';

/**
 * Mutation hook for treasury analyst Q&A.
 * Sends a question, gets back LLM analysis with data.
 */
export function useTreasuryAnalyst() {
  return useMutation({
    mutationFn: (question: string) => treasuryApi.askAnalyst(question),
  });
}

/**
 * Query hook for auto-briefing.
 * Fetches pre-computed financial briefing with priority.
 */
export function useTreasuryBriefing() {
  return useQuery({
    queryKey: [TREASURY_BRIEFING_QUERY_KEY],
    queryFn: () => treasuryApi.getAnalystBriefing(),
    staleTime: 5 * 60 * 1000, // 5 min
    refetchInterval: 5 * 60 * 1000,
  });
}
