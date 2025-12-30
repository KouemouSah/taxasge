'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  GitBranch,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calculator,
  Eye,
  Pencil,
} from 'lucide-react'
import {
  useWorkflows,
  useTariffs,
} from '@/modules/service-requests-admin'
import type {
  Workflow,
  WorkflowTariff,
} from '@/modules/service-requests-admin'
import { WORKFLOW_CATEGORIES } from '@/modules/service-requests-admin'
import { DataTablePagination, usePagination } from '@/modules/service-requests-admin/components'

const formatCurrency = (amount: number, currency = 'XAF') => {
  return new Intl.NumberFormat('es-GQ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getTariffDisplay = (
  tariffs: WorkflowTariff[],
  workflowCode: string,
  solicitudType: string
): { amount: number | null; isRBC: boolean } => {
  const tariff = tariffs.find(
    (t) => t.workflow_code === workflowCode && t.solicitud_type === solicitudType && t.is_active
  )
  if (!tariff) return { amount: null, isRBC: false }
  const isRBC = tariff.tariff_type === 'PERCENTAGE' || tariff.tariff_type === 'NOTA_INGRESO'
  return { amount: tariff.amount, isRBC }
}

interface WorkflowWithTariffs extends Workflow {
  expedicionAmount: number | null
  expedicionIsRBC: boolean
  renovacionAmount: number | null
  renovacionIsRBC: boolean
}

export default function WorkflowsPage() {
  const t = useTranslations('admin.serviceRequests.workflows')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    paginateData,
    getTotalPages,
    resetPage,
  } = usePagination(20)

  const { data: workflows, isLoading: loadingWorkflows, error: workflowsError, refetch } = useWorkflows()
  const { data: tariffs, isLoading: loadingTariffs } = useTariffs()

  const isLoading = loadingWorkflows || loadingTariffs

  const workflowsWithTariffs: WorkflowWithTariffs[] = useMemo(() => {
    if (!workflows || !tariffs) return []
    return workflows.map((wf) => {
      const expedicion = getTariffDisplay(tariffs, wf.code, 'EXPEDICION')
      const renovacion = getTariffDisplay(tariffs, wf.code, 'RENOVACION')
      return {
        ...wf,
        expedicionAmount: expedicion.amount,
        expedicionIsRBC: expedicion.isRBC,
        renovacionAmount: renovacion.amount,
        renovacionIsRBC: renovacion.isRBC,
      }
    })
  }, [workflows, tariffs])

  const filteredWorkflows = useMemo(() => {
    let result = workflowsWithTariffs
    if (categoryFilter !== 'all') {
      result = result.filter((wf) => wf.category === categoryFilter)
    }
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      result = result.filter((wf) => wf.is_active === isActive)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (wf) =>
          wf.code.toLowerCase().includes(query) ||
          wf.name_es.toLowerCase().includes(query) ||
          wf.entity_code.toLowerCase().includes(query)
      )
    }
    return result
  }, [workflowsWithTariffs, categoryFilter, statusFilter, searchQuery])

  const paginatedWorkflows = paginateData(filteredWorkflows)
  const totalPages = getTotalPages(filteredWorkflows.length)

  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    setter(value)
    resetPage()
  }

  const navigateToWorkflow = (code: string) => {
    router.push(`/${locale}/dashboard/admin/service-requests/workflows/${code}`)
  }

  const navigateToNewWorkflow = () => {
    router.push(`/${locale}/dashboard/admin/service-requests/workflows/new`)
  }

  const renderTariffCell = (amount: number | null, isRBC: boolean) => {
    if (amount === null) {
      return <span className="text-muted-foreground">-</span>
    }
    if (isRBC) {
      return (
        <Badge variant="outline" className="gap-1">
          <Calculator className="h-3 w-3" />
          RBC
        </Badge>
      )
    }
    return <span className="font-mono text-sm">{formatCurrency(amount)}</span>
  }

  const getWorkflowTypeBadge = (type: string) => {
    switch (type) {
      case 'standard':
        return <Badge variant="default">Estandar</Badge>
      case 'direct_payment':
        return <Badge variant="secondary">Pago Directo</Badge>
      case 'multi_phase':
        return <Badge variant="outline">Multi-fase</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (workflowsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{workflowsError instanceof Error ? workflowsError.message : 'Error loading workflows'}</span>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              {tCommon('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={navigateToNewWorkflow}>
          <Plus className="mr-2 h-4 w-4" />
          {t('create')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {filteredWorkflows.length} de {workflowsWithTariffs.length} workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  resetPage()
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => handleFilterChange(setCategoryFilter, v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('filterByCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCategories')}</SelectItem>
                {WORKFLOW_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => handleFilterChange(setStatusFilter, v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="inactive">{t('inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">{t('code')}</TableHead>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead className="text-right">Expedicion</TableHead>
                  <TableHead className="text-right">Renovacion</TableHead>
                  <TableHead className="text-center">{t('status')}</TableHead>
                  <TableHead className="text-right w-[100px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedWorkflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {t('noWorkflowsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedWorkflows.map((wf) => (
                    <TableRow
                      key={wf.code}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigateToWorkflow(wf.code)}
                    >
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{wf.code}</code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{wf.name_es}</div>
                          <div className="text-sm text-muted-foreground">{wf.entity_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{wf.category}</Badge>
                      </TableCell>
                      <TableCell>{getWorkflowTypeBadge(wf.workflow_type)}</TableCell>
                      <TableCell className="text-right">
                        {renderTariffCell(wf.expedicionAmount, wf.expedicionIsRBC)}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderTariffCell(wf.renovacionAmount, wf.renovacionIsRBC)}
                      </TableCell>
                      <TableCell className="text-center">
                        {wf.is_active ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateToWorkflow(wf.code)
                            }}
                            title={tCommon('view')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/${locale}/dashboard/admin/service-requests/workflows/${wf.code}?mode=edit`)
                            }}
                            title={tCommon('edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredWorkflows.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 30, 50, 100]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
