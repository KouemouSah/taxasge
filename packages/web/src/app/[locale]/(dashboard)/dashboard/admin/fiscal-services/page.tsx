'use client'

/**
 * Fiscal Services Admin Page
 * Complete list view with filters and stats
 *
 * PHASE 8.1: Fiscal Services List Page
 * CRITICAL: 100% backend-aligned with fiscal_service_routes.py
 *
 * @module dashboard/admin/fiscal-services
 * @author Claude Code
 * @date 2025-11-25
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, RefreshCw, AlertTriangle, Search, Plus, Upload, Eye, Edit, Trash2, TrendingUp, CheckCircle2, BarChart3 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import fiscalServicesAPI from '@/modules/fiscal-services/services/api'
import type {
  FiscalServiceResponse,
  FiscalServiceStats,
  Ministry,
  Sector,
  Category,
  ServiceTypeEnum,
  ServiceStatusEnum,
} from '@/types/fiscal-service'
import { BackendUnavailableAlert } from '@/modules/admin/components'

export default function FiscalServicesPage() {
  const locale = useLocale()
  const t = useTranslations('admin.fiscalServices')
  const _tCommon = useTranslations('admin')
  const router = useRouter()
  const { toast } = useToast()

  // Data states
  const [services, setServices] = useState<FiscalServiceResponse[]>([])
  const [stats, setStats] = useState<FiscalServiceStats | null>(null)
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // UI states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBackendUnavailable, setIsBackendUnavailable] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [ministryFilter, setMinistryFilter] = useState<number | 'all'>('all')
  const [sectorFilter, setSectorFilter] = useState<number | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all')
  const [typeFilter, _setTypeFilter] = useState<ServiceTypeEnum | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ServiceStatusEnum | 'all'>('all')

  // Pagination states
  const [currentPage, _setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [_totalServices, setTotalServices] = useState(0)

  // Fetch hierarchy data (ministries, sectors, categories)
  const fetchHierarchyData = async () => {
    try {
      const [ministriesData, sectorsData, categoriesData] = await Promise.all([
        fiscalServicesAPI.hierarchy.ministries.list(),
        fiscalServicesAPI.hierarchy.sectors.list(),
        fiscalServicesAPI.hierarchy.categories.list(),
      ])
      setMinistries(ministriesData)
      setSectors(sectorsData)
      setCategories(categoriesData)
    } catch (err) {
      console.error('Error fetching hierarchy data:', err)
    }
  }

  // Fetch fiscal services with filters
  const fetchServices = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params: {
        page?: number
        pageSize?: number
        categoryId?: number
        isActive?: boolean
      } = {
        page: currentPage,
        pageSize,
      }

      if (categoryFilter !== 'all') {
        params.categoryId = categoryFilter
      }

      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active'
      }

      const response = await fiscalServicesAPI.services.list(params)
      setServices(response.services)
      setTotalServices(response.total)
      setIsBackendUnavailable(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorLoading')
      setError(errorMessage)

      if (errorMessage.includes('fetch') || errorMessage.includes('Network') || errorMessage.includes('Failed')) {
        setIsBackendUnavailable(true)
      }

      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: t('errorLoadingServices'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const statsData = await fiscalServicesAPI.admin.stats()
      setStats(statsData)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  useEffect(() => {
    fetchHierarchyData()
    fetchStats()
  }, [])

  useEffect(() => {
    fetchServices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, categoryFilter, statusFilter])

  const handleRefresh = () => {
    fetchServices()
    fetchStats()
    fetchHierarchyData()
  }

  const handleDelete = async (service: FiscalServiceResponse) => {
    if (!confirm(t('confirmDelete', { name: service.nameEs }))) return

    try {
      await fiscalServicesAPI.admin.delete(service.id)
      toast({
        title: t('successTitle'),
        description: t('serviceDeleted'),
      })
      fetchServices()
      fetchStats()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: t('errorDeleting'),
      })
    }
  }

  // Filter services by search query and hierarchy
  const filteredServices = services.filter(service => {
    const matchesSearch = searchQuery === '' ||
      service.serviceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.nameEs.toLowerCase().includes(searchQuery.toLowerCase())

    // Find category for this service
    const serviceCategory = categories.find(c => c.id === service.categoryId)

    const matchesMinistry = ministryFilter === 'all' ||
      (serviceCategory && serviceCategory.ministryId === ministryFilter)

    const matchesSector = sectorFilter === 'all' ||
      (serviceCategory && serviceCategory.sectorId === sectorFilter)

    const matchesType = typeFilter === 'all' || service.serviceType === typeFilter

    return matchesSearch && matchesMinistry && matchesSector && matchesType
  })

  const getStatusBadge = (status: ServiceStatusEnum) => {
    const statusConfig: Record<ServiceStatusEnum, { className: string }> = {
      active: { className: 'bg-green-100 text-green-700' },
      inactive: { className: 'bg-gray-100 text-gray-700' },
      draft: { className: 'bg-blue-100 text-blue-700' },
      deprecated: { className: 'bg-red-100 text-red-700' },
    }

    const config = statusConfig[status]
    return (
      <Badge variant="outline" className={config.className}>
        {t(`status${status.charAt(0).toUpperCase() + status.slice(1)}` as Parameters<typeof t>[0])}
      </Badge>
    )
  }

  const getTypeBadge = (type: ServiceTypeEnum) => {
    return (
      <Badge variant="outline" className="bg-purple-50 text-purple-700">
        {t(`type${type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}` as Parameters<typeof t>[0])}
      </Badge>
    )
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '-'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </div>

      {/* Backend Unavailable Alert */}
      {isBackendUnavailable && <BackendUnavailableAlert />}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statsTotal')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalServices || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statsActive')}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeServices || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statsByType')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.servicesByType ? Object.keys(stats.servicesByType).length : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statsByMinistry')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ministries.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('listTitle')}</CardTitle>
                <CardDescription>
                  {t('servicesFound', { count: filteredServices.length })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('refresh')}
                </Button>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  {t('importServices')}
                </Button>
                <Button size="sm" onClick={() => router.push(`/${locale}/dashboard/admin/fiscal-services/new`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('createService')}
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-6">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={String(ministryFilter)} onValueChange={(v) => setMinistryFilter(v === 'all' ? 'all' : Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filterByMinistry')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allMinistries')}</SelectItem>
                  {ministries.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.nameEs}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(sectorFilter)} onValueChange={(v) => setSectorFilter(v === 'all' ? 'all' : Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filterBySector')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allSectors')}</SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.nameEs}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(categoryFilter)} onValueChange={(v) => setCategoryFilter(v === 'all' ? 'all' : Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filterByCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allCategories')}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nameEs}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('statusActive')}</SelectItem>
                  <SelectItem value="inactive">{t('statusInactive')}</SelectItem>
                  <SelectItem value="draft">{t('statusDraft')}</SelectItem>
                  <SelectItem value="deprecated">{t('statusDeprecated')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">{t('loading')}</span>
            </div>
          )}

          {error && !isBackendUnavailable && (
            <div className="flex items-center justify-center py-8 text-red-500">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {!isLoading && !error && filteredServices.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p>{t('noServicesFound')}</p>
            </div>
          )}

          {!isLoading && !error && filteredServices.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tableCode')}</TableHead>
                  <TableHead>{t('tableName')}</TableHead>
                  <TableHead>{t('tableType')}</TableHead>
                  <TableHead>{t('tableStatus')}</TableHead>
                  <TableHead>{t('tableExpeditionAmount')}</TableHead>
                  <TableHead>{t('tableRenewalAmount')}</TableHead>
                  <TableHead className="text-right">{t('tableActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-mono text-sm">{service.serviceCode}</TableCell>
                    <TableCell className="font-medium">{service.nameEs}</TableCell>
                    <TableCell>{getTypeBadge(service.serviceType)}</TableCell>
                    <TableCell>{getStatusBadge(service.status)}</TableCell>
                    <TableCell>{formatCurrency(service.tasaExpedicion)}</TableCell>
                    <TableCell>{formatCurrency(service.tasaRenovacion)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/${locale}/dashboard/admin/fiscal-services/${service.id}`)}>
                          <Eye className="h-4 w-4 mr-1" />
                          {t('view')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/${locale}/dashboard/admin/fiscal-services/${service.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-1" />
                          {t('edit')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(service)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t('delete')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
