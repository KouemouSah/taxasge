'use client'

import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, AlertTriangle, PieChart, BarChart3 } from 'lucide-react'
import type { TooltipItem } from 'chart.js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { fetchClient } from '@/core/api'
import usersApi from '@/modules/users-admin/services/api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
)

// Palette for donut charts
const DONUT_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

// Colors for specific role types
const ROLE_COLORS: Record<string, string> = {
  citizen: '#3b82f6',
  business: '#10b981',
  accountant: '#f59e0b',
  admin: '#ef4444',
  supervisor: '#8b5cf6',
  agent: '#ec4899',
}

// Colors for service types
const SERVICE_TYPE_COLORS: Record<string, string> = {
  document_processing: '#3b82f6',
  license_permit: '#10b981',
  residence_permit: '#8b5cf6',
  registration_fee: '#f59e0b',
  inspection_fee: '#14b8a6',
  administrative_tax: '#ef4444',
  customs_duty: '#f97316',
  declaration_tax: '#ec4899',
}

interface UserStats {
  by_role?: Record<string, number>
  users_by_role?: Record<string, number>
  total_users?: number
}

interface FiscalServiceStats {
  total_services: number
  active_services: number
  inactive_services: number
  services_by_type: Record<string, number>
  services_by_category: Record<string, number>
  services_by_ministry: Record<string, number>
  services_by_status: Record<string, number>
  most_used_services: Array<{
    service_code?: string
    name_es?: string
    calculation_count?: number
    view_count?: number
  }>
  total_calculations: number
  total_views: number
}

export default function OperationalOverview() {
  const t = useTranslations('admin.dashboard')
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [serviceStats, setServiceStats] = useState<FiscalServiceStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const errs: string[] = []

      const [usersResult, servicesResult] = await Promise.allSettled([
        usersApi.getStats(),
        fetchClient.get<FiscalServiceStats>('/fiscal-services/admin/stats'),
      ])

      if (usersResult.status === 'fulfilled') {
        setUserStats(usersResult.value as UserStats)
      } else {
        errs.push('users')
      }

      if (servicesResult.status === 'fulfilled') {
        setServiceStats(servicesResult.value)
      } else {
        errs.push('services')
      }

      setErrors(errs)
      setIsLoading(false)
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-56">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // =============================================
  // CHART 1: Users by Role (Donut)
  // =============================================
  const roleData = userStats?.by_role || userStats?.users_by_role || {}
  const roleLabels = Object.keys(roleData)
  const roleValues = Object.values(roleData)
  const roleColors = roleLabels.map(r => ROLE_COLORS[r] || DONUT_PALETTE[roleLabels.indexOf(r) % DONUT_PALETTE.length])

  const usersDonutData = {
    labels: roleLabels.map(r => {
      try {
        const translated = t(`chart.role.${r}`)
        return translated || r
      } catch {
        return r.charAt(0).toUpperCase() + r.slice(1)
      }
    }),
    datasets: [{
      data: roleValues,
      backgroundColor: roleColors,
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  }

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 10, font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'doughnut'>) => {
            const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0)
            const pct = total > 0 ? Math.round(((ctx.parsed || 0) / total) * 100) : 0
            return `${ctx.label}: ${ctx.parsed} (${pct}%)`
          },
        },
      },
    },
  }

  // =============================================
  // CHART 2: Services by Type (Donut)
  // =============================================
  const typeData = serviceStats?.services_by_type || {}
  const typeLabels = Object.keys(typeData)
  const typeValues = Object.values(typeData)
  const typeColors = typeLabels.map(t => SERVICE_TYPE_COLORS[t] || DONUT_PALETTE[typeLabels.indexOf(t) % DONUT_PALETTE.length])

  const typesDonutData = {
    labels: typeLabels.map(tp => tp.replace(/_/g, ' ')),
    datasets: [{
      data: typeValues,
      backgroundColor: typeColors,
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  }

  // =============================================
  // CHART 3: Top 10 Most Used Services (Horizontal Bar)
  // =============================================
  const topServices = (serviceStats?.most_used_services || []).slice(0, 10)
  const topLabels = topServices.map(s => {
    const name = s.name_es || s.service_code || '—'
    return name.length > 30 ? name.substring(0, 27) + '...' : name
  })
  const topCalcValues = topServices.map(s => s.calculation_count || 0)
  const topViewValues = topServices.map(s => s.view_count || 0)

  const topServicesData = {
    labels: topLabels,
    datasets: [
      {
        label: t('chart.calculations'),
        data: topCalcValues,
        backgroundColor: '#3b82f6',
        borderRadius: 3,
        maxBarThickness: 20,
      },
      {
        label: t('chart.views'),
        data: topViewValues,
        backgroundColor: '#93c5fd',
        borderRadius: 3,
        maxBarThickness: 20,
      },
    ],
  }

  const horizontalBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } },
      },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
      y: { grid: { display: false }, ticks: { font: { size: 10 } } },
    },
  }

  // =============================================
  // CHART 4: Services by Ministry (Vertical Bar)
  // =============================================
  const ministryData = serviceStats?.services_by_ministry || {}
  const ministryEntries = Object.entries(ministryData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  const ministryLabels = ministryEntries.map(([name]) =>
    name.length > 20 ? name.substring(0, 17) + '...' : name
  )
  const ministryValues = ministryEntries.map(([, count]) => count)

  const ministryBarData = {
    labels: ministryLabels,
    datasets: [{
      label: t('chart.services'),
      data: ministryValues,
      backgroundColor: ministryValues.map((_, i) => DONUT_PALETTE[i % DONUT_PALETTE.length]),
      borderRadius: 4,
      maxBarThickness: 40,
    }],
  }

  const verticalBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: TooltipItem<'bar'>[]) => {
            // Show full ministry name in tooltip
            const idx = items[0]?.dataIndex
            if (idx !== undefined && ministryEntries[idx]) {
              return ministryEntries[idx][0]
            }
            return ''
          },
          label: (ctx: TooltipItem<'bar'>) => `${ctx.parsed.y} ${t('chart.services').toLowerCase()}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45 } },
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1, font: { size: 10 } } },
    },
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Users by Role (Donut) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            {t('chart.usersByRole')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {roleLabels.length > 0 ? (
            <div className="h-56">
              <Doughnut data={usersDonutData} options={donutOptions} />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              {errors.includes('users') ? (
                <><AlertTriangle className="h-4 w-4" /><span className="text-sm">{t('chart.errorUsers')}</span></>
              ) : (
                <span className="text-sm">{t('chart.noData')}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Services by Type (Donut) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            {t('chart.servicesByType')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {typeLabels.length > 0 ? (
            <div className="h-56">
              <Doughnut data={typesDonutData} options={donutOptions} />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              {errors.includes('services') ? (
                <><AlertTriangle className="h-4 w-4" /><span className="text-sm">{t('chart.errorServices')}</span></>
              ) : (
                <span className="text-sm">{t('chart.noData')}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 3: Top 10 Most Used Services (Horizontal Bar) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {t('chart.topServices')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topServices.length > 0 ? (
            <div style={{ height: Math.max(topServices.length * 30 + 40, 200) }}>
              <Bar data={topServicesData} options={horizontalBarOptions} />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <span className="text-sm">{t('chart.noData')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 4: Services by Ministry (Vertical Bar) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {t('chart.servicesByMinistry')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ministryEntries.length > 0 ? (
            <div className="h-64">
              <Bar data={ministryBarData} options={verticalBarOptions} />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              {errors.includes('services') ? (
                <><AlertTriangle className="h-4 w-4" /><span className="text-sm">{t('chart.errorServices')}</span></>
              ) : (
                <span className="text-sm">{t('chart.noData')}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
