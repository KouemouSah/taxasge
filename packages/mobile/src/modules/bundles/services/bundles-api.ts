/**
 * Service Bundles catalog (commerce types, zones, simulator).
 * Backend: app/modules/fiscal_services/api/bundle_routes.py
 * All paths centralized via API_ENDPOINTS.serviceBundles.
 */

import { apiGet } from '@core/api/client';
import { API_ENDPOINTS } from '@core/api/endpoints';
import type { CommerceType, CommerceZone, SimulatorResponse } from '../types/bundles.types';

export async function getCommerceTypes(): Promise<CommerceType[]> {
  return apiGet<CommerceType[]>(API_ENDPOINTS.serviceBundles.commerceTypes);
}

export async function getZones(): Promise<CommerceZone[]> {
  return apiGet<CommerceZone[]>(API_ENDPOINTS.serviceBundles.zones);
}

export async function simulate(commerceType: string, zoneCode: string): Promise<SimulatorResponse> {
  return apiGet<SimulatorResponse>(API_ENDPOINTS.serviceBundles.simulator, {
    commerce_type: commerceType,
    zone_code: zoneCode,
  });
}
