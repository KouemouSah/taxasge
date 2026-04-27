import { useQuery } from '@tanstack/react-query';
import * as api from './directory-api';

export function useDirectorySearch(params: Record<string, string>, enabled = true) {
  return useQuery({
    queryKey: ['directory', 'search', params],
    queryFn: () => api.searchDirectory(params),
    enabled,
    staleTime: 30_000,
    placeholderData: (prev: any) => prev,
  });
}

/**
 * Directory reference data (zones / sectors / provinces / legal forms) is
 * effectively immutable for a session — bump staleTime to 1h to avoid
 * pointless refetches on every screen mount. P8.5 review.
 */
const REFERENCE_STALE_TIME_MS = 60 * 60_000;

export function useDirectoryFilters() {
  const zones = useQuery({ queryKey: ['directory', 'zones'], queryFn: api.getZones, staleTime: REFERENCE_STALE_TIME_MS });
  const sectors = useQuery({ queryKey: ['directory', 'sectors'], queryFn: api.getSectors, staleTime: REFERENCE_STALE_TIME_MS });
  const provincias = useQuery({ queryKey: ['directory', 'provincias'], queryFn: api.getProvincias, staleTime: REFERENCE_STALE_TIME_MS });
  const formas = useQuery({ queryKey: ['directory', 'formas'], queryFn: api.getFormasJuridicas, staleTime: REFERENCE_STALE_TIME_MS });

  return { zones, sectors, provincias, formas };
}
