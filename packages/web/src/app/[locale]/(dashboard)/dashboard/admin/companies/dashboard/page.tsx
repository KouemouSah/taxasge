'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Building2, ShieldCheck, TrendingUp, BarChart3,
  AlertTriangle, RefreshCw, FileWarning,
} from 'lucide-react'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { companyDashboardApi } from '@/modules/companies/services/api'
import type { GlobalStats, ZoneStats } from '@/modules/companies/types'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const REGIME_COLORS = {
  bundle: '#22c55e',
  declarativo: '#3b82f6',
  mixto: '#a855f7',
  exento: '#6b7280',
  pendiente: '#eab308',
}

export default function AdminCompaniesDashboardPage() {
  const t = useTranslations('admin')
  const { toast } = useToast()

  const [global, setGlobal] = useState<GlobalStats | null>(null)
  const [zones, setZones] = useState<ZoneStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [g, z] = await Promise.all([
        companyDashboardApi.getGlobalStats(),
        companyDashboardApi.getZoneStats(),
      ])
      setGlobal(g)
      setZones(z.zones)
    } catch {
      toast({ title: 'Error', description: 'Failed to load dashboard', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading || !global) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
        {t('companies.loading')}
      </div>
    )
  }

  // Charts data
  const regimeDonut = {
    labels: ['Bundle', 'Declarativo', 'Mixto', 'Exento', 'Pendiente'],
    datasets: [{
      data: [global.bundle_count, global.declarativo_count, global.mixto_count, global.exento_count, global.pendiente_count],
      backgroundColor: Object.values(REGIME_COLORS),
      borderWidth: 0,
    }],
  }

  const topZones = [...zones]
    .sort((a, b) => b.total_companies - a.total_companies)
    .slice(0, 8)

  const zoneBar = {
    labels: topZones.map(z => z.zone_code),
    datasets: [{
      label: t('companyDashboard.companies'),
      data: topZones.map(z => z.total_companies),
      backgroundColor: '#3b82f6',
      borderRadius: 4,
    }, {
      label: t('companyDashboard.debt'),
      data: topZones.map(z => z.total_debt),
      backgroundColor: '#ef4444',
      borderRadius: 4,
    }],
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t('companyDashboard.title')}
        </h1>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1" />
          {t('companyDashboard.refresh')}
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              {t('companyDashboard.total')}
            </div>
            <p className="text-2xl font-bold mt-1">{global.total_companies.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{global.active_companies} {t('companyDashboard.active')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              {t('companyDashboard.verified')}
            </div>
            <p className="text-2xl font-bold mt-1">{global.verified_companies.toLocaleString()}</p>
            <Progress
              value={global.total_companies > 0 ? (global.verified_companies / global.total_companies) * 100 : 0}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Bundle
            </div>
            <p className="text-2xl font-bold mt-1">{global.bundle_count.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileWarning className="h-4 w-4 text-blue-600" />
              Declarativo
            </div>
            <p className="text-2xl font-bold mt-1">{global.declarativo_count.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              {t('companyDashboard.missingId')}
            </div>
            <p className="text-2xl font-bold mt-1">{global.missing_identifier}</p>
            <p className="text-xs text-muted-foreground">
              NIF: {global.with_nif} | PE: {global.with_reg_number}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Regime Donut */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('companyDashboard.regimeDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              <Doughnut
                data={regimeDonut}
                options={{
                  cutout: '60%',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, padding: 8 } },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Zone Bar */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('companyDashboard.byZone')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <Bar
                data={zoneBar}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { grid: { display: false } },
                    y: { grid: { display: false } },
                  },
                  plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12 } },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('companyDashboard.zoneDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 pl-4">Zone</th>
                <th className="text-right p-2">{t('companyDashboard.companies')}</th>
                <th className="text-right p-2">Bundle</th>
                <th className="text-right p-2">Decl.</th>
                <th className="text-right p-2">{t('companyDashboard.obligations')}</th>
                <th className="text-right p-2">{t('companyDashboard.paid')}</th>
                <th className="text-right p-2">{t('companyDashboard.debt')}</th>
                <th className="text-right p-2 pr-4">{t('companyDashboard.recovery')}</th>
              </tr>
            </thead>
            <tbody>
              {zones.map(z => (
                <tr key={z.zone_id} className="border-b hover:bg-muted/30">
                  <td className="p-2 pl-4">
                    <Badge variant="outline" className="font-mono">{z.zone_code}</Badge>
                    <span className="ml-2 text-muted-foreground text-xs">{z.zone_name}</span>
                  </td>
                  <td className="text-right p-2 font-medium">{z.total_companies}</td>
                  <td className="text-right p-2">{z.bundle_count}</td>
                  <td className="text-right p-2">{z.declarativo_count}</td>
                  <td className="text-right p-2 font-mono text-xs">{z.total_obligations_amount > 0 ? z.total_obligations_amount.toLocaleString() : '-'}</td>
                  <td className="text-right p-2 font-mono text-xs text-green-700">{z.total_paid_amount > 0 ? z.total_paid_amount.toLocaleString() : '-'}</td>
                  <td className="text-right p-2 font-mono text-xs text-red-700">{z.total_debt > 0 ? z.total_debt.toLocaleString() : '-'}</td>
                  <td className="text-right p-2 pr-4">
                    <Badge className={z.recovery_rate_pct >= 80 ? 'bg-green-100 text-green-800' : z.recovery_rate_pct >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                      {z.recovery_rate_pct}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
