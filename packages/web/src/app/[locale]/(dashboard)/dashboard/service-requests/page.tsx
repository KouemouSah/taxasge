'use client'

/**
 * Service Requests Page - User Dashboard
 * List and manage service requests for citizens
 *
 * ALIGNED WITH BACKEND:
 * - ServiceRequestResponse Pydantic model
 * - ServiceRequestStatus enum (15+ statuses)
 * - Workflow codes and categories
 */

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FilePlus,
  FileText,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  XCircle,
  CreditCard,
  CalendarCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslations } from 'next-intl'
import { useServiceRequests } from '@/modules/service-requests'
import type { ServiceRequestStatus } from '@/modules/service-requests'

// Status color mapping
const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  DRAFT: { bg: 'bg-slate-500', text: 'text-white', icon: FileText },
  TIMBRES_PENDING: { bg: 'bg-amber-500', text: 'text-white', icon: CreditCard },
  TIMBRES_PAID: { bg: 'bg-amber-600', text: 'text-white', icon: CheckCircle },
  SUBMITTED: { bg: 'bg-blue-500', text: 'text-white', icon: Clock },
  DOCUMENTS_REQUIRED: { bg: 'bg-orange-500', text: 'text-white', icon: AlertCircle },
  UNDER_REVIEW: { bg: 'bg-indigo-500', text: 'text-white', icon: Eye },
  DOSSIER_VALIDE: { bg: 'bg-teal-500', text: 'text-white', icon: CheckCircle },
  REJECTED: { bg: 'bg-red-500', text: 'text-white', icon: XCircle },
  PENDING_NOTA_INGRESO: { bg: 'bg-purple-500', text: 'text-white', icon: CreditCard },
  NOTA_UPLOADED: { bg: 'bg-purple-600', text: 'text-white', icon: FileText },
  PAYMENT_PENDING: { bg: 'bg-yellow-500', text: 'text-white', icon: CreditCard },
  PAYMENT_PROCESSING: { bg: 'bg-yellow-600', text: 'text-white', icon: Loader2 },
  PAID: { bg: 'bg-green-500', text: 'text-white', icon: CheckCircle },
  PAYMENT_FAILED: { bg: 'bg-red-600', text: 'text-white', icon: XCircle },
  CITA_SCHEDULED: { bg: 'bg-cyan-500', text: 'text-white', icon: CalendarCheck },
  IN_PROGRESS: { bg: 'bg-blue-600', text: 'text-white', icon: Clock },
  COMPLETED: { bg: 'bg-green-600', text: 'text-white', icon: CheckCircle },
  CANCELLED: { bg: 'bg-gray-500', text: 'text-white', icon: XCircle },
  EXPIRED: { bg: 'bg-gray-600', text: 'text-white', icon: Clock },
}

// Status options for filter
const STATUS_OPTIONS = [
  { value: 'all', labelKey: 'allStatuses' },
  { value: 'DRAFT', labelKey: 'status.draft' },
  { value: 'SUBMITTED', labelKey: 'status.submitted' },
  { value: 'UNDER_REVIEW', labelKey: 'status.agent_review' },
  { value: 'DOCUMENTS_REQUIRED', labelKey: 'status.documents_pending' },
  { value: 'PAYMENT_PENDING', labelKey: 'status.payment_pending' },
  { value: 'PAID', labelKey: 'status.payment_completed' },
  { value: 'CITA_SCHEDULED', labelKey: 'status.appointment_scheduled' },
  { value: 'COMPLETED', labelKey: 'status.completed' },
  { value: 'REJECTED', labelKey: 'status.rejected' },
  { value: 'CANCELLED', labelKey: 'status.cancelled' },
]

export default function ServiceRequestsPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('service_requests')

  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Use the service requests hook
  const {
    requests,
    isLoading,
    error,
    pagination,
    loadMyRequests,
    setFilters,
    clearError,
  } = useServiceRequests()

  // Load requests on mount
  useEffect(() => {
    loadMyRequests(1, 20)
  }, [loadMyRequests])

  // Apply filters when status changes
  useEffect(() => {
    if (filterStatus === 'all') {
      setFilters({})
    } else {
      setFilters({ status: filterStatus as ServiceRequestStatus })
    }
  }, [filterStatus, setFilters])

  // Filter by search query (client-side)
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests

    const query = searchQuery.toLowerCase()
    return requests.filter((req) => {
      const reference = req.requestNumber || req.id || ''
      const workflow = req.workflowCode || ''
      return (
        reference.toLowerCase().includes(query) ||
        workflow.toLowerCase().includes(query)
      )
    })
  }, [requests, searchQuery])

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS.DRAFT
    const Icon = config.icon
    const statusKey = `status.${status.toLowerCase()}`
    let label: string
    try {
      label = t(statusKey)
    } catch {
      label = status.replace(/_/g, ' ')
    }

    return (
      <Badge className={`${config.bg} ${config.text} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  // Calculate progress based on status
  const getProgress = (status: string): number => {
    const progressMap: Record<string, number> = {
      DRAFT: 10,
      TIMBRES_PENDING: 15,
      TIMBRES_PAID: 20,
      SUBMITTED: 30,
      DOCUMENTS_REQUIRED: 35,
      UNDER_REVIEW: 50,
      DOSSIER_VALIDE: 60,
      PENDING_NOTA_INGRESO: 65,
      NOTA_UPLOADED: 70,
      PAYMENT_PENDING: 75,
      PAYMENT_PROCESSING: 80,
      PAID: 85,
      CITA_SCHEDULED: 90,
      IN_PROGRESS: 95,
      COMPLETED: 100,
      REJECTED: 100,
      CANCELLED: 100,
      EXPIRED: 100,
    }
    return progressMap[status] || 0
  }

  // Check if request can be continued
  const canContinue = (status: string): boolean => {
    return ['DRAFT', 'DOCUMENTS_REQUIRED', 'TIMBRES_PENDING'].includes(status)
  }

  // Format currency
  const formatAmount = (amount?: number): string => {
    if (!amount) return '-'
    return new Intl.NumberFormat(locale === 'es' ? 'es-GQ' : locale, {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Get workflow display name
  const getWorkflowName = (code: string): string => {
    // Replace underscores with spaces and format
    return code
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/service-requests/new`}>
            <FilePlus className="mr-2 h-4 w-4" />
            {t('newRequest')}
          </Link>
        </Button>
      </div>

      {/* Quick Action Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-primary/20">
          <Link href={`/${locale}/dashboard/service-requests/new`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('newRequest')}</CardTitle>
              <FilePlus className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {t('wizard.step_content_placeholder') || 'Iniciar una nueva solicitud de servicio'}
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('myRequests')}</CardTitle>
            <FileText className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {filteredRequests.length} {t('table.shown')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('filters.pending') || 'Pendientes'}</CardTitle>
            <Clock className="h-6 w-6 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) =>
                ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'PAYMENT_PENDING'].includes(r.status)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('filters.pending')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('allRequests') || 'Todas las Solicitudes'}</CardTitle>
              <CardDescription>
                {t('table.loading') || 'Historial de tus solicitudes de servicio'}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('search_placeholder') || 'Buscar...'}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('filter_status') || 'Filtrar'} />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey) || option.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('request_number') || 'Referencia'}</TableHead>
                  <TableHead>{t('workflow') || 'Tipo'}</TableHead>
                  <TableHead>{t('created') || 'Fecha'}</TableHead>
                  <TableHead>{t('tariff') || 'Monto'}</TableHead>
                  <TableHead>{t('table.status') || 'Estado'}</TableHead>
                  <TableHead>{t('table.priority') || 'Progreso'}</TableHead>
                  <TableHead className="text-right">{t('table.actions') || 'Acciones'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t('loading')}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-destructive">
                        <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                        <p>{error}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            clearError()
                            loadMyRequests(1, 20)
                          }}
                          className="mt-2"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {t('retry')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => {
                    const progress = getProgress(req.status)
                    return (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium font-mono">
                          {req.requestNumber || req.id?.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-[150px]">
                              {getWorkflowName(req.workflowCode)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(req.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatAmount(req.tariffAmount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-secondary rounded-full h-2 max-w-[80px]">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  progress === 100
                                    ? req.status === 'COMPLETED'
                                      ? 'bg-green-500'
                                      : 'bg-red-500'
                                    : 'bg-primary'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground min-w-[35px]">
                              {progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/${locale}/dashboard/service-requests/${req.id}`}>
                                <Eye className="mr-1 h-3 w-3" />
                                {t('view_details') || 'Ver'}
                              </Link>
                            </Button>
                            {canContinue(req.status) && (
                              <Button size="sm" asChild>
                                <Link href={`/${locale}/dashboard/service-requests/${req.id}`}>
                                  {t('next') || 'Continuar'}
                                  <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">{t('no_requests_found') || 'No tienes solicitudes'}</p>
                      <p className="text-sm mb-4">
                        {t('wizard.step_content_placeholder') || 'Comienza creando tu primera solicitud de servicio'}
                      </p>
                      <Button asChild>
                        <Link href={`/${locale}/dashboard/service-requests/new`}>
                          <FilePlus className="mr-2 h-4 w-4" />
                          {t('newRequest')}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {t('showing_of', {
                  start: (pagination.page - 1) * pagination.pageSize + 1,
                  end: Math.min(pagination.page * pagination.pageSize, pagination.total),
                  total: pagination.total,
                }) || `Mostrando ${filteredRequests.length} de ${pagination.total}`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => loadMyRequests(pagination.page - 1, pagination.pageSize)}
                >
                  {t('previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadMyRequests(pagination.page + 1, pagination.pageSize)}
                >
                  {t('next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
