import { apiGet } from '@core/api/client';
import type { DirectorySearchResponse, FilterOption } from '../types/directory.types';

const PREFIX = '/public/companies';

export async function searchDirectory(params: Record<string, string>): Promise<DirectorySearchResponse> {
  const qs = new URLSearchParams(params).toString();
  return apiGet<DirectorySearchResponse>(`${PREFIX}/search?${qs}`);
}

export async function getZones(): Promise<FilterOption[]> {
  return apiGet<FilterOption[]>(`${PREFIX}/zones`);
}

export async function getSectors(): Promise<FilterOption[]> {
  return apiGet<FilterOption[]>(`${PREFIX}/sectors`);
}

export async function getProvincias(): Promise<FilterOption[]> {
  return apiGet<FilterOption[]>(`${PREFIX}/provincias`);
}

export async function getCiudades(provincia?: string): Promise<FilterOption[]> {
  const qs = provincia ? `?provincia=${provincia}` : '';
  return apiGet<FilterOption[]>(`${PREFIX}/ciudades${qs}`);
}

export async function getFormasJuridicas(): Promise<FilterOption[]> {
  return apiGet<FilterOption[]>(`${PREFIX}/formas-juridicas`);
}
