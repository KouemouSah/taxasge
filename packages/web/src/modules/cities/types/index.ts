/**
 * Cities Types
 *
 * TypeScript interfaces for cities and entities management.
 */

// Valid regions (fixed)
export const REGIONS = ['Insular', 'Continental'] as const
export type Region = (typeof REGIONS)[number]

// City interfaces
export interface City {
  id: string
  name: string
  region: Region
  description: string | null
  is_capital: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CitySimple {
  id: string
  name: string
  region: Region
  is_capital: boolean
}

export interface CityCreate {
  name: string
  region: Region
  description?: string | null
  is_capital?: boolean
  is_active?: boolean
}

export interface CityUpdate {
  name?: string
  region?: Region
  description?: string | null
  is_capital?: boolean
  is_active?: boolean
}

export interface CityListResponse {
  items: City[]
  total: number
}

// Entity interfaces
export interface Entity {
  id: string
  code: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EntitySimple {
  id: string
  code: string
  name: string
}

export interface EntityCreate {
  code: string
  name: string
  description?: string | null
  is_active?: boolean
}

export interface EntityUpdate {
  code?: string
  name?: string
  description?: string | null
  is_active?: boolean
}

export interface EntityListResponse {
  items: Entity[]
  total: number
}
