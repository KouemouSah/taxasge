/**
 * Stats Cards Component
 * Display key metrics for admin dashboard with real backend data
 *
 * BACKEND INTEGRATION:
 * - Users stats: GET /api/v1/admin/users/stats (users-admin module)
 * - Audit stats: GET /api/v1/audit-logs/stats (audit-logs-admin module)
 *
 * @module modules/admin/components
 * @author Claude Code
 * @date 2025-11-27
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Users, Shield, Key, Activity, AlertTriangle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import usersApi from '@/modules/users-admin/services/api'
import auditLogsApi from '@/modules/audit-logs-admin/services/api'

interface UserStats {
  total_users: number
  active_users: number
  new_users_this_month: number
  users_by_role: Record<string, number>
  users_by_status: Record<string, number>
}

interface AuditStats {
  total_logs: number
  by_action: Record<string, number>
  by_entity_type: Record<string, number>
}

export default function StatsCards() {
  const t = useTranslations('admin.dashboard')
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch both stats in parallel
        const [usersData, auditData] = await Promise.allSettled([
          usersApi.getStats(),
          auditLogsApi.getStats(),
        ])

        if (usersData.status === 'fulfilled') {
          setUserStats({
            total_users: usersData.value.total || 0,
            active_users: usersData.value.by_status?.active || 0,
            new_users_this_month: 0, // Not provided by current API
            users_by_role: usersData.value.by_role || {},
            users_by_status: usersData.value.by_status || {},
          })
        }

        if (auditData.status === 'fulfilled') {
          setAuditStats(auditData.value)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching stats')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Calculate derived stats
  const totalUsers = userStats?.total_users || 0
  const activeRoles = userStats ? Object.keys(userStats.users_by_role).length : 0
  const totalPermissions = 52 // Static for now - permissions catalog
  const activityCount = auditStats?.total_logs || 0

  const stats = [
    {
      name: t('totalUsersLabel'),
      value: totalUsers.toLocaleString(),
      change: userStats?.active_users ? `${Math.round((userStats.active_users / totalUsers) * 100)}%` : '0%',
      changeType: 'positive' as const,
      icon: Users,
      description: t('vsLastMonth'),
    },
    {
      name: t('activeRolesLabel'),
      value: activeRoles.toString(),
      change: `${activeRoles}`,
      changeType: 'neutral' as const,
      icon: Shield,
      description: t('rolesDescription'),
    },
    {
      name: t('permissionsLabel'),
      value: totalPermissions.toString(),
      change: '0',
      changeType: 'neutral' as const,
      icon: Key,
      description: t('completeCatalog'),
    },
    {
      name: t('activity24hLabel'),
      value: activityCount.toLocaleString(),
      change: auditStats ? `${Object.keys(auditStats.by_action).length} types` : '0',
      changeType: 'neutral' as const,
      icon: Activity,
      description: t('actionsRecorded'),
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-24">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="col-span-full">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs font-medium ${
                        stat.changeType === 'positive'
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-500">{stat.description}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
