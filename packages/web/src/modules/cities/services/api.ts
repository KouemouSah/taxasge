/**
 * Cities API Service
 *
 * API calls for cities and entities management.
 */

import apiClient from '@/core/api/client'
import type {
  City,
  CitySimple,
  CityCreate,
  CityUpdate,
  CityListResponse,
  Entity,
  EntitySimple,
  EntityCreate,
  EntityUpdate,
  EntityListResponse,
  Region,
} from '../types'

// ============================================================================
// City API
// ============================================================================

export async function getCities(params?: {
  region?: Region
  is_active?: boolean
}): Promise<CityListResponse> {
  const response = await apiClient.get<CityListResponse>('/api/v1/cities', { params })
  return response.data
}

export async function getCitiesSimple(isActive: boolean = true): Promise<CitySimple[]> {
  const response = await apiClient.get<CitySimple[]>('/api/v1/cities/simple', {
    params: { is_active: isActive },
  })
  return response.data
}

export async function getCityById(cityId: string): Promise<City> {
  const response = await apiClient.get<City>(`/api/v1/cities/${cityId}`)
  return response.data
}

export async function createCity(data: CityCreate): Promise<City> {
  const response = await apiClient.post<City>('/api/v1/cities', data)
  return response.data
}

export async function updateCity(cityId: string, data: CityUpdate): Promise<City> {
  const response = await apiClient.patch<City>(`/api/v1/cities/${cityId}`, data)
  return response.data
}

export async function deleteCity(cityId: string): Promise<void> {
  await apiClient.delete(`/api/v1/cities/${cityId}`)
}

// ============================================================================
// Entity API
// ============================================================================

export async function getEntities(params?: { is_active?: boolean }): Promise<EntityListResponse> {
  const response = await apiClient.get<EntityListResponse>('/api/v1/entities', { params })
  return response.data
}

export async function getEntitiesSimple(isActive: boolean = true): Promise<EntitySimple[]> {
  const response = await apiClient.get<EntitySimple[]>('/api/v1/entities/simple', {
    params: { is_active: isActive },
  })
  return response.data
}

export async function getEntityById(entityId: string): Promise<Entity> {
  const response = await apiClient.get<Entity>(`/api/v1/entities/${entityId}`)
  return response.data
}

export async function createEntity(data: EntityCreate): Promise<Entity> {
  const response = await apiClient.post<Entity>('/api/v1/entities', data)
  return response.data
}

export async function updateEntity(entityId: string, data: EntityUpdate): Promise<Entity> {
  const response = await apiClient.patch<Entity>(`/api/v1/entities/${entityId}`, data)
  return response.data
}

export async function deleteEntity(entityId: string): Promise<void> {
  await apiClient.delete(`/api/v1/entities/${entityId}`)
}
