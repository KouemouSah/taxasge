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

export function useDirectoryFilters() {
  const zones = useQuery({ queryKey: ['directory', 'zones'], queryFn: api.getZones, staleTime: 120_000 });
  const sectors = useQuery({ queryKey: ['directory', 'sectors'], queryFn: api.getSectors, staleTime: 120_000 });
  const provincias = useQuery({ queryKey: ['directory', 'provincias'], queryFn: api.getProvincias, staleTime: 120_000 });
  const formas = useQuery({ queryKey: ['directory', 'formas'], queryFn: api.getFormasJuridicas, staleTime: 120_000 });

  return { zones, sectors, provincias, formas };
}
