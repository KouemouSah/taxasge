export interface TaxCategory {
  id: string
  name: string | { es: string; fr: string; en: string }
  description?: string | { es: string; fr: string; en: string }
  icon?: string
  color?: string
}

export interface TaxService {
  id: string
  code: string
  name: string
  description?: string
  category_id: string
  category?: TaxCategory | string
  amount?: number
  currency?: string
  processing_time?: string
  required_documents?: string[]
  is_active: boolean
}

export interface TaxDeclaration {
  id: string
  user_id: string
  service_id: string
  service?: TaxService
  status: 'draft' | 'submitted' | 'processing' | 'approved' | 'rejected'
  declaration_data: Record<string, unknown>
  submitted_at?: string
  reviewed_at?: string
  reviewed_by?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface TaxPayment {
  id: string
  declaration_id: string
  declaration?: TaxDeclaration
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method?: string
  transaction_id?: string
  paid_at?: string
  created_at: string
}

export interface TaxDocument {
  id: string
  declaration_id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  uploaded_at: string
}

export interface TaxCalculation {
  base_amount: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  currency: string
  baseAmount?: number
  calculatedAmount?: number
  nextSteps?: string | string[]
  breakdown?: {
    label: string
    amount: number
  }[]
}

// Aliases for compatibility
export type Tax = TaxService
export type CalculationResult = TaxCalculation
export interface CalculationParams {
  serviceId: string
  baseAmount: number
  taxRate?: number
  paymentType?: string
  calculationBase?: string
  parameters?: Record<string, any>
}

export interface SearchFilters {
  category?: string
  status?: string
  search?: string
  minAmount?: number
  maxAmount?: number
}
