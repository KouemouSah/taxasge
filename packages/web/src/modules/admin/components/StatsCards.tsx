'use client'

import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Users, UserCheck, AlertTriangle, Activity, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import usersApi from '@/modules/users-admin/services/api'
import { agentAlertsApi } from '@/modules/agents-admin/services/api'
import type { AdminAlertsDashboard } from '@/modules/agents-admin/types'

interface UserStats {
  totalUsers?: number
  total_users?: number
  activeUsers?: number
  active_users?: number
  newUsersThisMonth?: number
  new_users_this_month?: number
}

function MiniProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function StatsCards() {
  const t = useTranslations('admin.dashboard')
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [alerts, setAlerts] = useState<AdminAlertsDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [usersData, alertsData] = await Promise.allSettled([
          usersApi.getStats(),
          agentAlertsApi.getDashboard(),
        ])

        if (usersData.status === 'fulfilled') {
          const data = usersData.value as UserStats
          setUserStats({
            totalUsers: data.totalUsers ?? data.total_users ?? 0,
            activeUsers: data.activeUsers ?? data.active_users ?? 0,
            newUsersThisMonth: data.newUsersThisMonth ?? data.new_users_this_month ?? 0,
          })
        }

        if (alertsData.status === 'fulfilled') {
          setAlerts(alertsData.value)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching stats')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const totalUsersCount = userStats?.totalUsers ?? userStats?.total_users ?? 0
  const activeUsers = userStats?.activeUsers ?? userStats?.active_users ?? 0
  const newThisMonth = userStats?.newUsersThisMonth ?? userStats?.new_users_this_month ?? 0

  const entities = alerts?.workload_by_entity || []
  const totalAgents = entities.reduce((sum, e) => sum + (e.agent_count || 0), 0)
  const totalAssignments = entities.reduce((sum, e) => sum + (e.total_assignments || 0), 0)
  const avgCapacity = entities.length > 0
    ? Math.round(entities.reduce((sum, e) => sum + (e.avg_capacity || 0), 0) / entities.length)
    : 0
  const totalAlerts = alerts?.total_alerts || 0

  const stats = [
    {
      name: t('totalUsersLabel'),
      value: totalUsersCount.toLocaleString(),
      detail: activeUsers > 0 ? `${Math.round((activeUsers / Math.max(totalUsersCount, 1)) * 100)}% ${t('activeLabel')}` : '',
      detailType: 'positive' as const,
      icon: Users,
      bar: { value: activeUsers, max: totalUsersCount, color: 'bg-emerald-500' },
    },
    {
      name: t('activeAgentsLabel'),
      value: totalAgents.toString(),
      detail: totalAssignments > 0 ? `${totalAssignments} ${t('activeCasesLabel')}` : t('noCases'),
      detailType: 'neutral' as const,
      icon: UserCheck,
      bar: { value: avgCapacity, max: 100, color: avgCapacity > 80 ? 'bg-red-500' : avgCapacity > 60 ? 'bg-amber-500' : 'bg-blue-500' },
    },
    {
      name: t('operationalAlertsLabel'),
      value: totalAlerts.toString(),
      detail: totalAlerts === 0 ? t('allNormal') : `${alerts?.sla_at_risk_count || 0} SLA`,
      detailType: (totalAlerts > 0 ? 'negative' : 'positive') as 'negative' | 'positive' | 'neutral',
      icon: AlertTriangle,
      bar: { value: totalAlerts, max: Math.max(totalAlerts, 5), color: totalAlerts > 0 ? 'bg-red-500' : 'bg-emerald-500' },
    },
    {
      name: t('newUsersLabel'),
      value: newThisMonth.toLocaleString(),
      detail: t('thisMonth'),
      detailType: (newThisMonth > 0 ? 'positive' : 'neutral') as 'negative' | 'positive' | 'neutral',
      icon: Activity,
      bar: { value: newThisMonth, max: Math.max(totalUsersCount, 1), color: 'bg-violet-500' },
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-center h-16">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-full">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.name}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground truncate">{stat.name}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <span
                    className={`text-xs font-medium ${
                      stat.detailType === 'positive'
                        ? 'text-emerald-600'
                        : stat.detailType === 'negative'
                          ? 'text-red-600'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {stat.detail}
                  </span>
                </div>
                <div className="bg-primary/10 p-2.5 rounded-lg shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <MiniProgressBar {...stat.bar} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
