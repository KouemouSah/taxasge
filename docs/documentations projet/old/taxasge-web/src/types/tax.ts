// Types pour les services fiscaux TaxasGE

export interface Tax {
  id: string
  name: {
    es: string
    fr: string
    en: string
  }
  description: {
    es: string
    fr: string
    en: string
  }
  category: string
  subcategory: string
  serviceType: 'license' | 'permit' | 'certificate' | 'registration' | 'declaration' | 'other'
  prices: {
    expedition: number
    renewal?: number
  }
  processingTime: string
  ministry: string
  sector: string
  isOnlineAvailable: boolean
  isUrgentAvailable: boolean
  requiredDocuments?: RequiredDocument[]
  procedures?: Procedure[]
  keywords?: string[]
  lastUpdated?: string
  popularity?: number
  averageRating?: number
}

export interface RequiredDocument {
  id: string
  name: {
    es: string
    fr: string
    en: string
  }
  description?: {
    es: string
    fr: string
    en: string
  }
  isRequired: boolean
  format?: string
  maxSizeMB?: number
  examples?: string[]
}

export interface Procedure {
  stepNumber: number
  title: {
    es: string
    fr: string
    en: string
  }
  description: {
    es: string
    fr: string
    en: string
  }
  estimatedDuration?: string
  location?: string
  requiredDocuments?: string[]
  cost?: number
  canBeOnline?: boolean
}

export interface SearchFilters {
  ministry?: string
  sector?: string
  category?: string
  serviceType?: string
  minPrice?: number
  maxPrice?: number
  isOnlineAvailable?: boolean
  isUrgentAvailable?: boolean
  language?: 'es' | 'fr' | 'en'
  sort?: 'relevance' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc'
  page?: number
  limit?: number
}

export interface CalculationParams {
  serviceId: string
  paymentType: 'expedition' | 'renewal'
  calculationBase?: number
  parameters?: Record<string, any>
  isUrgent?: boolean
  userContext?: Record<string, any>
}

export interface CalculationResult {
  calculatedAmount: number
  baseAmount: number
  breakdown: {
    basePrice: number
    processingFee?: number
    urgencyFee?: number
    taxes?: number
    total: number
  }
  nextSteps: string[]
  paymentOptions: PaymentOption[]
  calculatedAt: string
  validUntil?: string
}

export interface PaymentOption {
  method: string
  provider: string
  supported: boolean
  feePercentage: number
  estimatedTime?: string
  description?: string
}

export interface Ministry {
  id: string
  code: string
  name: {
    es: string
    fr: string
    en: string
  }
  description?: {
    es: string
    fr: string
    en: string
  }
  sectors: Sector[]
  serviceCount: number
  icon?: string
  color?: string
}

export interface Sector {
  id: string
  code: string
  name: {
    es: string
    fr: string
    en: string
  }
  ministryId: string
  categories: Category[]
  serviceCount: number
  icon?: string
}

export interface Category {
  id: string
  code: string
  name: {
    es: string
    fr: string
    en: string
  }
  sectorId: string
  services: Tax[]
  serviceCount: number
  serviceType: string
}

export interface SearchSuggestion {
  text: string
  type: 'service' | 'category' | 'ministry' | 'keyword'
  count?: number
  relevance?: number
}

export interface FavoriteService {
  taxId: string
  addedAt: string
  notes?: string
  lastAccessed?: string
}

export interface CalculationHistory {
  id: string
  taxId: string
  taxName: string
  parameters: CalculationParams
  result: CalculationResult
  calculatedAt: string
  savedForLater: boolean
}

export interface TaxStats {
  totalServices: number
  totalMinistries: number
  totalUsers: number
  totalCalculations: number
  popularServices: Tax[]
  recentUpdates: Tax[]
  categoryDistribution: Record<string, number>
  averageProcessingTime: string
}

// Types pour l'API backend
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  code: string
  details?: any
}

// Types pour le cache offline
export interface OfflineData {
  taxes: Tax[]
  hierarchy: Ministry[]
  lastSync: number
  version: string
}

export interface SyncStatus {
  isOnline: boolean
  lastSync: Date | null
  pendingSync: boolean
  syncProgress?: number
}