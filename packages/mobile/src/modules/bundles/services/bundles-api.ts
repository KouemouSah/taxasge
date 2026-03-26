import { apiGet } from '@core/api/client';
import type { CommerceType, CommerceZone, SimulatorResponse } from '../types/bundles.types';

const PREFIX = '/service-bundles';

export async function getCommerceTypes(): Promise<CommerceType[]> {
  return apiGet<CommerceType[]>(`${PREFIX}/commerce-types`);
}

export async function getZones(): Promise<CommerceZone[]> {
  return apiGet<CommerceZone[]>(`${PREFIX}/zones`);
}

export async function simulate(commerceType: string, zoneCode: string): Promise<SimulatorResponse> {
  return apiGet<SimulatorResponse>(`${PREFIX}/simulator?commerce_type=${commerceType}&zone_code=${zoneCode}`);
}
