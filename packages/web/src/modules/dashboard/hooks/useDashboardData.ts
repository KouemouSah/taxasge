/**
 * useDashboardData Hook
 * Fetches and aggregates all dashboard data from APIs
 *
 * @module dashboard/hooks
 */

import { useState, useEffect, useCallback } from 'react'
import { declarationsApi } from '@/modules/declarations/services/api'
import { paymentsApi } from '@/modules/payments/services/api'
import type { DeclarationResponse } from '@/types/declaration'
import type { PaymentResponse } from '@/types/payment'

// =============================================================================
// TYPES
// =============================================================================

export interface DashboardStats {
  declarationsInProgress: number
  declarationsCompleted: number
  totalPayments: number
  unreadNotifications: number
}

export interface DashboardData {
  stats: DashboardStats
  recentDeclarations: DeclarationResponse[]
  recentPayments: PaymentResponse[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate stats from declarations
 */
function calculateDeclarationStats(declarations: DeclarationResponse[]): {
  inProgress: number
  completed: number
} {
  let inProgress = 0
  let completed = 0

  for (const decl of declarations) {
    if (decl.status === 'draft' || decl.status === 'submitted' || decl.status === 'processing') {
      inProgress++
    } else if (decl.status === 'accepted') {
      completed++
    }
  }

  return { inProgress, completed }
}

/**
 * Calculate total payments amount from completed payments
 */
function calculateTotalPayments(payments: PaymentResponse[]): number {
  return payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0)
}

// =============================================================================
// HOOK
// =============================================================================

export function useDashboardData(): DashboardData {
  const [recentDeclarations, setRecentDeclarations] = useState<DeclarationResponse[]>([])
  const [recentPayments, setRecentPayments] = useState<PaymentResponse[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    declarationsInProgress: 0,
    declarationsCompleted: 0,
    totalPayments: 0,
    unreadNotifications: 0, // Placeholder until notifications API is available
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch data in parallel
      const [declarationsResponse, paymentsResponse] = await Promise.all([
        declarationsApi.listDeclarations({ pageSize: 50 }), // Get more to calculate stats
        paymentsApi.listPayments({ pageSize: 10 }),
      ])

      // Set recent declarations (limit to 5 for display)
      const allDeclarations = declarationsResponse.declarations
      setRecentDeclarations(allDeclarations.slice(0, 5))

      // Set recent payments
      setRecentPayments(paymentsResponse.payments)

      // Calculate stats
      const declStats = calculateDeclarationStats(allDeclarations)
      const totalPaymentsAmount = calculateTotalPayments(paymentsResponse.payments)

      setStats({
        declarationsInProgress: declStats.inProgress,
        declarationsCompleted: declStats.completed,
        totalPayments: totalPaymentsAmount,
        unreadNotifications: 0, // TODO: Fetch from notifications API when available
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(errorMessage)
      console.error('Dashboard data fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    stats,
    recentDeclarations,
    recentPayments,
    isLoading,
    error,
    refetch: fetchDashboardData,
  }
}

export default useDashboardData
