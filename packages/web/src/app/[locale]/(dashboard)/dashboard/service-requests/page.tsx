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
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  const [filterWorkflow, setFilterWorkflow] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<{ id: string; reference: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Use the service requests hook
  const {
    requests,
    isLoading,
    error,
    pagination,
    loadMyRequests,
    setFilters,
    clearError,
    deleteRequestById,
  } = useServiceRequests()

  // Load requests on mount
  useEffect(() => {
    loadMyRequests(1, 20)
  }, [loadMyRequests])

  // Apply filters when status or workflow changes
  useEffect(() => {
    const newFilters: { status?: ServiceRequestStatus; workflowCode?: string } = {}
    if (filterStatus !== 'all') {
      newFilters.status = filterStatus as ServiceRequestStatus
    }
    if (filterWorkflow !== 'all') {
      newFilters.workflowCode = filterWorkflow
    }
    setFilters(newFilters)
  }, [filterStatus, filterWorkflow, setFilters])

  // Get unique workflow codes for filter dropdown
  const workflowOptions = useMemo(() => {
    const uniqueWorkflows = new Set(requests.map((r) => r.workflowCode))
    return Array.from(uniqueWorkflows).sort()
  }, [requests])

  // Filter by search query (client-side)
  const filteredRequests = useMemo(() => {
    let result = requests

    // Filter by workflow (client-side backup if server filter not applied)
    if (filterWorkflow !== 'all') {
      result = result.filter((req) => req.workflowCode === filterWorkflow)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((req) => {
        const reference = req.requestNumber || req.id || ''
        const workflow = req.workflowCode || ''
        return (
          reference.toLowerCase().includes(query) ||
          workflow.toLowerCase().includes(query)
        )
      })
    }

    return result
  }, [requests, searchQuery, filterWorkflow])

  // Handle delete confirmation
  const handleDeleteClick = (id: string, reference: string) => {
    setRequestToDelete({ id, reference })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return

    setIsDeleting(true)
    const success = await deleteRequestById(requestToDelete.id)
    setIsDeleting(false)
    setDeleteDialogOpen(false)
    setRequestToDelete(null)

    if (success) {
      // Request was removed from list by the hook
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setRequestToDelete(null)
  }

  // =========================================================================
  // BULK SELECTION HANDLERS
  // =========================================================================

  // Get selectable requests (only DRAFT status can be deleted)
  const selectableRequests = useMemo(() => {
    return filteredRequests.filter(req => req.status === 'DRAFT')
  }, [filteredRequests])

  // Check if all selectable items are selected
  const isAllSelected = useMemo(() => {
    return selectableRequests.length > 0 && selectableRequests.every(req => selectedIds.has(req.id))
  }, [selectableRequests, selectedIds])

  // Check if some items are selected
  const isSomeSelected = useMemo(() => {
    return selectableRequests.some(req => selectedIds.has(req.id))
  }, [selectableRequests, selectedIds])

  // Toggle single item selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Toggle select all
  const handleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all
      setSelectedIds(new Set())
    } else {
      // Select all selectable
      setSelectedIds(new Set(selectableRequests.map(req => req.id)))
    }
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  // Handle bulk delete confirmation
  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0) return

    setIsBulkDeleting(true)
    let successCount = 0
    let errorCount = 0

    // Delete each selected request
    const idsToDelete = Array.from(selectedIds)
    for (const id of idsToDelete) {
      try {
        const success = await deleteRequestById(id)
        if (success) {
          successCount++
        } else {
          errorCount++
        }
      } catch {
        errorCount++
      }
    }

    setIsBulkDeleting(false)
    setBulkDeleteDialogOpen(false)
    clearSelection()

    // Optionally show toast with results (successCount, errorCount)
  }

  const handleBulkDeleteCancel = () => {
    setBulkDeleteDialogOpen(false)
  }

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

  // Get workflow display name (translated)
  const getWorkflowName = (code: string): string => {
    // Try to get translation first
    const translationKey = `workflows.${code.toLowerCase()}`
    try {
      const translated = t(translationKey)
      if (translated && translated !== translationKey) {
        return translated
      }
    } catch {
      // Fallback to formatting
    }
    // Fallback: Replace underscores with spaces and format
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
              <Select value={filterWorkflow} onValueChange={setFilterWorkflow}>
                <SelectTrigger className="w-full sm:w-48">
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('filter_workflow') || 'Tipo'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allTypes') || 'Todos los tipos'}</SelectItem>
                  {workflowOptions.map((workflow) => (
                    <SelectItem key={workflow} value={workflow}>
                      {getWorkflowName(workflow)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('filter_status') || 'Estado'} />
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
          {/* Bulk Actions Bar - Shows when items are selected */}
          {selectedIds.size > 0 && (
            <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedIds.size} {selectedIds.size === 1
                    ? (locale === 'es' ? 'seleccionado' : locale === 'fr' ? 'sélectionné' : 'selected')
                    : (locale === 'es' ? 'seleccionados' : locale === 'fr' ? 'sélectionnés' : 'selected')}
                </span>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  {locale === 'es' ? 'Limpiar selección' : locale === 'fr' ? 'Effacer la sélection' : 'Clear selection'}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4 mr-2" />
                      {locale === 'es' ? 'Acciones' : locale === 'fr' ? 'Actions' : 'Actions'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setBulkDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {locale === 'es'
                        ? `Eliminar ${selectedIds.size} solicitud(es)`
                        : locale === 'fr'
                          ? `Supprimer ${selectedIds.size} demande(s)`
                          : `Delete ${selectedIds.size} request(s)`}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Checkbox column for bulk selection */}
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label={locale === 'es' ? 'Seleccionar todo' : locale === 'fr' ? 'Tout sélectionner' : 'Select all'}
                      disabled={selectableRequests.length === 0}
                      className={isSomeSelected && !isAllSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                    />
                  </TableHead>
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
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t('loading')}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
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
                    const isSelectable = req.status === 'DRAFT'
                    const isSelected = selectedIds.has(req.id)
                    return (
                      <TableRow key={req.id} className={isSelected ? 'bg-primary/5' : ''}>
                        {/* Checkbox cell */}
                        <TableCell>
                          {isSelectable ? (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelect(req.id)}
                              aria-label={`${locale === 'es' ? 'Seleccionar' : 'Select'} ${req.requestNumber || req.id}`}
                            />
                          ) : (
                            <span className="w-4 h-4 block" /> // Placeholder for alignment
                          )}
                        </TableCell>
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
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild title={t('view_details') || 'Ver'}>
                              <Link href={`/${locale}/dashboard/service-requests/${req.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {canContinue(req.status) && (
                              <Button size="icon" className="h-8 w-8" asChild title={t('next') || 'Continuar'}>
                                <Link href={`/${locale}/dashboard/service-requests/${req.id}`}>
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {req.status === 'DRAFT' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title={t('delete') || 'Eliminar'}
                                onClick={() => handleDeleteClick(req.id, req.requestNumber || req.id?.slice(0, 8) || '')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
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

      {/* Delete Confirmation Dialog (Single) */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'es'
                ? 'Eliminar Solicitud'
                : locale === 'fr'
                  ? 'Supprimer la Demande'
                  : 'Delete Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'es'
                ? `¿Está seguro de que desea eliminar la solicitud ${requestToDelete?.reference}? Esta acción no se puede deshacer.`
                : locale === 'fr'
                  ? `Êtes-vous sûr de vouloir supprimer la demande ${requestToDelete?.reference} ? Cette action est irréversible.`
                  : `Are you sure you want to delete request ${requestToDelete?.reference}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
              {locale === 'es' ? 'Cancelar' : locale === 'fr' ? 'Annuler' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {locale === 'es' ? 'Eliminando...' : locale === 'fr' ? 'Suppression...' : 'Deleting...'}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {locale === 'es' ? 'Eliminar' : locale === 'fr' ? 'Supprimer' : 'Delete'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'es'
                ? 'Eliminar Solicitudes Seleccionadas'
                : locale === 'fr'
                  ? 'Supprimer les Demandes Sélectionnées'
                  : 'Delete Selected Requests'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'es'
                ? `¿Está seguro de que desea eliminar ${selectedIds.size} solicitud(es)? Esta acción no se puede deshacer.`
                : locale === 'fr'
                  ? `Êtes-vous sûr de vouloir supprimer ${selectedIds.size} demande(s) ? Cette action est irréversible.`
                  : `Are you sure you want to delete ${selectedIds.size} request(s)? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleBulkDeleteCancel} disabled={isBulkDeleting}>
              {locale === 'es' ? 'Cancelar' : locale === 'fr' ? 'Annuler' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {locale === 'es' ? 'Eliminando...' : locale === 'fr' ? 'Suppression...' : 'Deleting...'}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {locale === 'es'
                    ? `Eliminar ${selectedIds.size} solicitud(es)`
                    : locale === 'fr'
                      ? `Supprimer ${selectedIds.size} demande(s)`
                      : `Delete ${selectedIds.size} request(s)`}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
