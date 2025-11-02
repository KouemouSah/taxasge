/**
 * Tax Service Types
 * Types for TaxasGE fiscal services
 */

// Multi-language text
export interface MultiLangText {
  es: string;
  fr: string;
  en: string;
}

// Required document for a tax service
export interface RequiredDocument {
  id: string;
  name: MultiLangText;
  description?: MultiLangText;
  isRequired: boolean;
  format?: string;
  maxSizeMB?: number;
  examples?: string[];
}

// Procedure step
export interface Procedure {
  stepNumber: number;
  title: MultiLangText;
  description: MultiLangText;
  estimatedDuration?: string;
  location?: string;
  requiredDocuments?: string[];
  cost?: number;
  canBeOnline?: boolean;
}

// Tax service
export interface Tax {
  id: string;
  name: MultiLangText;
  description: MultiLangText;
  category: string;
  subcategory: string;
  serviceType: 'license' | 'permit' | 'certificate' | 'registration' | 'declaration' | 'other';
  prices: {
    expedition: number;
    renewal?: number;
  };
  processingTime: string;
  ministry: string;
  sector: string;
  isOnlineAvailable: boolean;
  isUrgentAvailable: boolean;
  requiredDocuments?: RequiredDocument[];
  procedures?: Procedure[];
  keywords?: string[];
  lastUpdated?: string;
  popularity?: number;
  averageRating?: number;
}

// Search filters
export interface SearchFilters {
  ministry?: string;
  sector?: string;
  category?: string;
  serviceType?: string;
  minPrice?: number;
  maxPrice?: number;
  isOnlineAvailable?: boolean;
  isUrgentAvailable?: boolean;
  language?: 'es' | 'fr' | 'en';
  sort?: 'relevance' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

// Calculation parameters (specific structure for tax calculation)
export interface CalculationParameters {
  serviceId: string;
  paymentType: 'expedition' | 'renewal';
  calculationBase?: number;
  isUrgent?: boolean;
  additionalFees?: Record<string, number>;
}

// User context for calculations
export interface UserContext {
  userId?: string;
  userRole?: string;
  location?: string;
  metadata?: Record<string, string>;
}

// Calculation params
export interface CalculationParams {
  serviceId: string;
  paymentType: 'expedition' | 'renewal';
  calculationBase?: number;
  parameters?: CalculationParameters;
  isUrgent?: boolean;
  userContext?: UserContext;
}

// Payment option
export interface PaymentOption {
  method: string;
  provider: string;
  supported: boolean;
  feePercentage: number;
  estimatedTime?: string;
  description?: string;
}

// Calculation result
export interface CalculationResult {
  calculatedAmount: number;
  baseAmount: number;
  breakdown: {
    basePrice: number;
    processingFee?: number;
    urgencyFee?: number;
    taxes?: number;
    total: number;
  };
  nextSteps: string[];
  paymentOptions: PaymentOption[];
  calculatedAt: string;
  validUntil?: string;
}

// Ministry
export interface Ministry {
  id: string;
  code: string;
  name: MultiLangText;
  description?: MultiLangText;
  sectors: Sector[];
  serviceCount: number;
  icon?: string;
  color?: string;
}

// Sector
export interface Sector {
  id: string;
  code: string;
  name: MultiLangText;
  ministryId: string;
  categories: Category[];
  serviceCount: number;
  icon?: string;
}

// Category
export interface Category {
  id: string;
  code: string;
  name: MultiLangText;
  sectorId: string;
  services: Tax[];
  serviceCount: number;
  serviceType: string;
}

// Search suggestion
export interface SearchSuggestion {
  text: string;
  type: 'service' | 'category' | 'ministry' | 'keyword';
  count?: number;
  relevance?: number;
}

// Favorite service
export interface FavoriteService {
  taxId: string;
  addedAt: string;
  notes?: string;
  lastAccessed?: string;
}

// Calculation history
export interface CalculationHistory {
  id: string;
  taxId: string;
  taxName: string;
  parameters: CalculationParams;
  result: CalculationResult;
  calculatedAt: string;
  savedForLater: boolean;
}

// Tax stats
export interface TaxStats {
  totalServices: number;
  totalMinistries: number;
  totalUsers: number;
  totalCalculations: number;
  popularServices: Tax[];
  recentUpdates: Tax[];
  categoryDistribution: Record<string, number>;
  averageProcessingTime: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Error with specific details
export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: ApiErrorDetail[];
}

// Offline data
export interface OfflineData {
  taxes: Tax[];
  hierarchy: Ministry[];
  lastSync: number;
  version: string;
}

// Sync status
export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingSync: boolean;
  syncProgress?: number;
}
