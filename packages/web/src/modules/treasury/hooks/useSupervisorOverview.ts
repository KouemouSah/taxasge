/**
 * Hook for Treasury Supervisor Overview data.
 * Used by the supervisor piloting dashboard.
 */
import { useQuery } from '@tanstack/react-query';
import { treasuryApi } from '../services';
import type { SupervisorOverviewResponse } from '../types';

export const SUPERVISOR_OVERVIEW_QUERY_KEY = 'treasury-supervisor-overview';

export function useSupervisorOverview(days: number = 30) {
  return useQuery<SupervisorOverviewResponse>({
    queryKey: [SUPERVISOR_OVERVIEW_QUERY_KEY, days],
    queryFn: () => treasuryApi.getSupervisorOverview(days),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 3 * 60 * 1000, // Auto-refresh every 3 minutes
  });
}
