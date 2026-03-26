import { useQuery } from '@tanstack/react-query';
import * as api from './bundles-api';

export function useCommerceTypes() {
  return useQuery({
    queryKey: ['bundles', 'commerce-types'],
    queryFn: api.getCommerceTypes,
    staleTime: 60 * 60_000,
  });
}

export function useZones() {
  return useQuery({
    queryKey: ['bundles', 'zones'],
    queryFn: api.getZones,
    staleTime: 60 * 60_000,
  });
}

export function useSimulate(commerceType: string, zoneCode: string) {
  return useQuery({
    queryKey: ['bundles', 'simulate', commerceType, zoneCode],
    queryFn: () => api.simulate(commerceType, zoneCode),
    enabled: !!commerceType && !!zoneCode,
    staleTime: 5 * 60_000,
  });
}
