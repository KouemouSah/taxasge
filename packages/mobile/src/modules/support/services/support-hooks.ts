/**
 * Support React Query hooks.
 */

import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';

import * as supportApi from './support-api';
import type {
  MyTicketsFilters,
  SupportMessagePayload,
  SupportTicketCreatePayload,
} from '../types/support.types';

export const SUPPORT_QUERY_KEYS = {
  myTickets: (filters: Omit<MyTicketsFilters, never> | undefined = {}) =>
    ['support', 'my-tickets', filters] as const,
  ticket: (id: number) => ['support', 'ticket', id] as const,
  ticketMessages: (id: number) => ['support', 'ticket', id, 'messages'] as const,
  categories: ['support', 'categories'] as const,
} as const;

const DEFAULT_PAGE_SIZE = 20;

export function useMyTickets(filters: MyTicketsFilters = {}) {
  return useInfiniteQuery({
    queryKey: SUPPORT_QUERY_KEYS.myTickets(filters),
    queryFn: ({ pageParam = 1 }) =>
      supportApi.listMyTickets({
        page: pageParam as number,
        page_size: filters.page_size ?? DEFAULT_PAGE_SIZE,
        status: filters.status,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
  });
}

export function useTicket(ticketId: number | null | undefined, enabled = true) {
  return useQuery({
    queryKey: SUPPORT_QUERY_KEYS.ticket((ticketId as number) ?? 0),
    queryFn: () => supportApi.getTicket(ticketId as number),
    enabled: enabled && !!ticketId,
    staleTime: 15_000,
  });
}

export function useTicketMessages(ticketId: number | null | undefined, enabled = true) {
  return useQuery({
    queryKey: SUPPORT_QUERY_KEYS.ticketMessages((ticketId as number) ?? 0),
    queryFn: () => supportApi.listTicketMessages(ticketId as number),
    enabled: enabled && !!ticketId,
    staleTime: 10_000,
  });
}

/** Categories rarely change — long staleTime. */
export function useSupportCategories() {
  return useQuery({
    queryKey: SUPPORT_QUERY_KEYS.categories,
    queryFn: () => supportApi.listCategories(true),
    staleTime: 60 * 60_000, // 1h
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SupportTicketCreatePayload) => supportApi.createTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'my-tickets'] });
    },
  });
}

export function usePostTicketMessage(ticketId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SupportMessagePayload) =>
      supportApi.postMessage(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SUPPORT_QUERY_KEYS.ticketMessages(ticketId),
      });
      queryClient.invalidateQueries({
        queryKey: SUPPORT_QUERY_KEYS.ticket(ticketId),
      });
    },
  });
}

export function useCloseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: number) => supportApi.closeTicket(ticketId),
    onSuccess: (_data, ticketId) => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_QUERY_KEYS.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: ['support', 'my-tickets'] });
    },
  });
}
