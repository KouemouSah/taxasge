/**
 * Companies React Query hooks.
 *
 * Pagination is offset-based (page/page_size) — different from the vault
 * cursor-based pagination. `getNextPageParam` advances by 1 until total is
 * exhausted.
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import * as companiesApi from './companies-api';
import { downloadLicensePdf } from './company-pdf';
import type {
  AddMemberRequest,
  CompanyCreate,
  CompanyListResponse,
  CompanyMember,
  CompanyResponse,
  CompanyUpdate,
  UpdateMemberRoleRequest,
} from '../types/companies.types';

const QK = {
  list: (params?: companiesApi.ListCompaniesParams) =>
    ['companies', 'list', params ?? null] as const,
  detail: (id: string) => ['companies', 'detail', id] as const,
  members: (id: string) => ['companies', 'members', id] as const,
};

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// List + detail
// ---------------------------------------------------------------------------

export function useCompaniesList(): UseInfiniteQueryResult<{
  pages: CompanyListResponse[];
  pageParams: number[];
}> {
  return useInfiniteQuery({
    queryKey: QK.list({ page_size: PAGE_SIZE }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      companiesApi.listCompanies({ page: pageParam, page_size: PAGE_SIZE }),
    getNextPageParam: (last, all) => {
      const fetched = all.reduce((acc, p) => acc + p.companies.length, 0);
      return fetched < last.total ? last.page + 1 : undefined;
    },
    staleTime: 30_000,
  });
}

export function useCompanyDetail(id: string | null): UseQueryResult<CompanyResponse> {
  return useQuery({
    queryKey: id ? QK.detail(id) : ['companies', 'detail', 'disabled'],
    queryFn: () => companiesApi.getCompany(id as string),
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// CRUD mutations
// ---------------------------------------------------------------------------

export function useCreateCompany(): UseMutationResult<CompanyResponse, Error, CompanyCreate> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompanyCreate) => companiesApi.createCompany(payload),
    onSuccess: (data) => {
      qc.setQueryData(QK.detail(data.id), data);
      qc.invalidateQueries({ queryKey: ['companies', 'list'] });
    },
  });
}

export function useUpdateCompany(): UseMutationResult<
  CompanyResponse,
  Error,
  { id: string; patch: CompanyUpdate }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: CompanyUpdate }) =>
      companiesApi.updateCompany(id, patch),
    onSuccess: (data) => {
      qc.setQueryData(QK.detail(data.id), data);
      qc.invalidateQueries({ queryKey: ['companies', 'list'] });
    },
  });
}

export function useDeleteCompany(): UseMutationResult<{ message: string }, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companiesApi.deleteCompany(id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: QK.detail(id) });
      qc.removeQueries({ queryKey: QK.members(id) });
      qc.invalidateQueries({ queryKey: ['companies', 'list'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export function useCompanyMembers(companyId: string | null): UseQueryResult<CompanyMember[]> {
  return useQuery({
    queryKey: companyId ? QK.members(companyId) : ['companies', 'members', 'disabled'],
    queryFn: () => companiesApi.listMembers(companyId as string),
    enabled: !!companyId,
    staleTime: 30_000,
  });
}

export function useAddMember(companyId: string): UseMutationResult<
  CompanyMember,
  Error,
  AddMemberRequest
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddMemberRequest) => companiesApi.addMember(companyId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.members(companyId) });
      qc.invalidateQueries({ queryKey: QK.detail(companyId) });
    },
  });
}

export function useUpdateMemberRole(companyId: string): UseMutationResult<
  CompanyMember,
  Error,
  { memberUserId: string; payload: UpdateMemberRoleRequest }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberUserId,
      payload,
    }: {
      memberUserId: string;
      payload: UpdateMemberRoleRequest;
    }) => companiesApi.updateMemberRole(companyId, memberUserId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.members(companyId) });
    },
  });
}

export function useRemoveMember(companyId: string): UseMutationResult<
  { message: string },
  Error,
  string
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberUserId: string) =>
      companiesApi.removeMember(companyId, memberUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.members(companyId) });
      qc.invalidateQueries({ queryKey: QK.detail(companyId) });
    },
  });
}

// ---------------------------------------------------------------------------
// License PDF download
// ---------------------------------------------------------------------------

export function useDownloadLicensePdf(): UseMutationResult<
  void,
  Error,
  { companyId: string; language?: 'es' | 'fr' | 'en' }
> {
  return useMutation({
    mutationFn: ({ companyId, language }) =>
      downloadLicensePdf(companyId, language ?? 'es'),
  });
}
