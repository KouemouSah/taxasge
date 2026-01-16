'use client'

/**
 * Workflows Admin Page - Hierarchical View
 *
 * Displays workflows grouped by parent (PASAPORTE, RESIDENCIA, etc.)
 * with expandable/collapsible sections.
 *
 * Features:
 * - Hierarchical grouping by parent_workflow_code
 * - Read-only badge for predefined workflows (is_generic = false)
 * - Editable dynamic workflows (is_generic = true)
 * - Tariff display per workflow
 * - Search and filters
 *
 * @module dashboard/admin/service-requests/workflows
 */

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  Trash2,
  ChevronRight,
  Lock,
  FileText,
  DollarSign,
  FolderOpen,
  Folder,
} from 'lucide-react'
import {
  useWorkflows,
  useTariffs,
  useDeleteWorkflow,
} from '@/modules/service-requests-admin'
import type {
  Workflow,
  WorkflowTariff,
} from '@/modules/service-requests-admin'
import { WORKFLOW_CATEGORIES_MAP } from '@/modules/service-requests-admin'
import { cn } from '@/lib/utils'

const formatCurrency = (amount: number, currency = 'XAF') => {
  return new Intl.NumberFormat('es-GQ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface WorkflowWithTariffs extends Workflow {
  tariffsList: WorkflowTariff[]
}

interface WorkflowGroup {
  parent: Workflow | null
  children: WorkflowWithTariffs[]
  isExpanded: boolean
}

export default function WorkflowsPage() {
  const t = useTranslations('admin.serviceRequests.workflows')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Mutations
  const deleteWorkflowMutation = useDeleteWorkflow()

  // Queries
  const { data: workflows, isLoading: loadingWorkflows, error: workflowsError, refetch } = useWorkflows()
  const { data: tariffs, isLoading: loadingTariffs } = useTariffs()

  const isLoading = loadingWorkflows || loadingTariffs

  // Build hierarchical structure
  const workflowGroups = useMemo(() => {
    if (!workflows || !tariffs) return []

    // Separate parent workflows from child workflows
    const parentWorkflows = workflows.filter((wf) => wf.is_parent === true)
    const childWorkflows = workflows.filter((wf) => wf.is_parent !== true)

    // Map tariffs by workflow_code for quick lookup
    const tariffsByWorkflow = new Map<string, WorkflowTariff[]>()
    tariffs.forEach((t) => {
      if (!tariffsByWorkflow.has(t.workflow_code)) {
        tariffsByWorkflow.set(t.workflow_code, [])
      }
      tariffsByWorkflow.get(t.workflow_code)?.push(t)
    })

    // Create groups
    const groups: WorkflowGroup[] = []
    const assignedChildren = new Set<string>()

    // First, create groups for parent workflows
    parentWorkflows.forEach((parent) => {
      const children = childWorkflows
        .filter((child) => child.parent_workflow_code === parent.code)
        .map((child) => ({
          ...child,
          tariffsList: tariffsByWorkflow.get(child.code) || [],
        }))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

      children.forEach((child) => assignedChildren.add(child.code))

      groups.push({
        parent,
        children,
        isExpanded: expandedGroups.has(parent.code),
      })
    })

    // Then, create a group for orphan workflows (those without parent)
    const orphanWorkflows = childWorkflows
      .filter((child) => !assignedChildren.has(child.code) && !child.parent_workflow_code)
      .map((child) => ({
        ...child,
        tariffsList: tariffsByWorkflow.get(child.code) || [],
      }))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

    if (orphanWorkflows.length > 0) {
      groups.push({
        parent: null,
        children: orphanWorkflows,
        isExpanded: expandedGroups.has('_orphans'),
      })
    }

    // Sort groups by display_order of parent
    return groups.sort((a, b) => {
      const orderA = a.parent?.display_order || 999
      const orderB = b.parent?.display_order || 999
      return orderA - orderB
    })
  }, [workflows, tariffs, expandedGroups])

  // Filter groups based on search and filters
  const filteredGroups = useMemo(() => {
    return workflowGroups
      .map((group) => {
        let filteredChildren = group.children

        // Apply category filter
        if (categoryFilter !== 'all') {
          filteredChildren = filteredChildren.filter((wf) => wf.category === categoryFilter)
        }

        // Apply status filter
        if (statusFilter !== 'all') {
          const isActive = statusFilter === 'active'
          filteredChildren = filteredChildren.filter((wf) => wf.is_active === isActive)
        }

        // Apply source filter (predefined vs dynamic)
        if (sourceFilter !== 'all') {
          const isGeneric = sourceFilter === 'dynamic'
          filteredChildren = filteredChildren.filter((wf) => wf.is_generic === isGeneric)
        }

        // Apply search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filteredChildren = filteredChildren.filter(
            (wf) =>
              wf.code.toLowerCase().includes(query) ||
              wf.name_es.toLowerCase().includes(query) ||
              wf.entity_code.toLowerCase().includes(query) ||
              (wf.tags && wf.tags.some((tag) => tag.toLowerCase().includes(query)))
          )
        }

        return { ...group, children: filteredChildren }
      })
      .filter((group) => group.children.length > 0)
  }, [workflowGroups, categoryFilter, statusFilter, sourceFilter, searchQuery])

  // Stats
  const totalWorkflows = workflows?.filter((wf) => wf.is_parent !== true).length || 0
  const predefinedCount = workflows?.filter((wf) => wf.is_parent !== true && wf.is_generic === false).length || 0
  const dynamicCount = workflows?.filter((wf) => wf.is_parent !== true && wf.is_generic === true).length || 0

  // Toggle group expansion
  const toggleGroup = (code: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }

  // Expand all groups
  const expandAllGroups = () => {
    const allCodes = new Set(workflowGroups.map((g) => g.parent?.code || '_orphans'))
    setExpandedGroups(allCodes)
  }

  // Collapse all groups
  const collapseAllGroups = () => {
    setExpandedGroups(new Set())
  }

  // Navigation
  const navigateToWorkflow = (code: string) => {
    router.push(`/${locale}/dashboard/admin/service-requests/workflows/${code}`)
  }

  const navigateToNewWorkflow = () => {
    router.push(`/${locale}/dashboard/admin/service-requests/workflows/new`)
  }

  // Delete handling
  const handleDeleteClick = (e: React.MouseEvent, workflow: Workflow) => {
    e.stopPropagation()
    if (!workflow.is_generic) {
      // Cannot delete predefined workflows
      return
    }
    setWorkflowToDelete(workflow)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!workflowToDelete) return
    await deleteWorkflowMutation.mutateAsync(workflowToDelete.code)
    setDeleteDialogOpen(false)
    setWorkflowToDelete(null)
  }

  // Render tariff info
  const renderTariffs = (tariffsList: WorkflowTariff[]) => {
    const activeTariffs = tariffsList.filter((t) => t.is_active)
    if (activeTariffs.length === 0) {
      return <span className="text-muted-foreground text-xs">Sin tarifas</span>
    }

    return (
      <div className="flex flex-wrap gap-1">
        {activeTariffs.slice(0, 3).map((tariff, idx) => {
          const isRBC = tariff.tariff_type === 'PERCENTAGE' || tariff.tariff_type === 'NOTA_INGRESO'
          return (
            <Badge key={idx} variant="outline" className="text-xs">
              {tariff.solicitud_type?.substring(0, 3) || 'N/A'}:{' '}
              {isRBC ? (
                <span className="flex items-center gap-0.5">
                  <Calculator className="h-2.5 w-2.5" />
                  RBC
                </span>
              ) : (
                formatCurrency(tariff.amount)
              )}
            </Badge>
          )
        })}
        {activeTariffs.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{activeTariffs.length - 3}
          </Badge>
        )}
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
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
      {/* Header */}
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkflows}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predefinidos</CardTitle>
            <Lock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{predefinedCount}</div>
            <p className="text-xs text-muted-foreground">Solo lectura</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dinámicos</CardTitle>
            <Pencil className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dynamicCount}</div>
            <p className="text-xs text-muted-foreground">Editables</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Workflows Agrupados
              </CardTitle>
              <CardDescription>
                {filteredGroups.reduce((acc, g) => acc + g.children.length, 0)} workflows en {filteredGroups.length} grupos
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAllGroups}>
                <FolderOpen className="h-4 w-4 mr-1" />
                Expandir
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAllGroups}>
                <Folder className="h-4 w-4 mr-1" />
                Colapsar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('filterByCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCategories')}</SelectItem>
                {WORKFLOW_CATEGORIES_MAP.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="inactive">{t('inactive')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="predefined">Predefinidos</SelectItem>
                <SelectItem value="dynamic">Dinámicos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hierarchical Workflow List */}
          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <GitBranch className="h-12 w-12 mb-4 opacity-50" />
              <p>{t('noWorkflowsFound')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGroups.map((group) => {
                const groupCode = group.parent?.code || '_orphans'
                const isExpanded = expandedGroups.has(groupCode)

                return (
                  <Collapsible
                    key={groupCode}
                    open={isExpanded}
                    onOpenChange={() => toggleGroup(groupCode)}
                    className="border rounded-lg"
                  >
                    {/* Group Header */}
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <ChevronRight
                            className={cn(
                              'h-5 w-5 transition-transform duration-200',
                              isExpanded && 'transform rotate-90'
                            )}
                          />
                          <div>
                            <div className="font-semibold text-lg flex items-center gap-2">
                              {group.parent?.name_es || 'Otros Workflows'}
                              <Badge variant="secondary" className="text-xs">
                                {group.children.length}
                              </Badge>
                            </div>
                            {group.parent?.description_es && (
                              <p className="text-sm text-muted-foreground">
                                {group.parent.description_es}
                              </p>
                            )}
                          </div>
                        </div>
                        {group.parent?.tags && group.parent.tags.length > 0 && (
                          <div className="hidden md:flex gap-1">
                            {group.parent.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CollapsibleTrigger>

                    {/* Group Content - Child Workflows */}
                    <CollapsibleContent>
                      <div className="border-t bg-muted/30">
                        {group.children.map((wf) => (
                          <div
                            key={wf.code}
                            className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => navigateToWorkflow(wf.code)}
                          >
                            {/* Left side: Info */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              {/* Indentation indicator */}
                              <div className="w-6 border-l-2 border-muted-foreground/30 h-8" />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">
                                    {wf.code}
                                  </code>
                                  {/* Source type badge */}
                                  {wf.is_generic === false ? (
                                    <Badge variant="default" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-100">
                                      <Lock className="h-3 w-3 mr-1" />
                                      Predefinido
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      <Pencil className="h-3 w-3 mr-1" />
                                      Dinámico
                                    </Badge>
                                  )}
                                  {/* Status indicator */}
                                  {wf.is_active ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                                <div className="text-sm font-medium mt-1">{wf.name_es}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                  <span>{wf.entity_code}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {wf.documents_count || 0} docs
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Middle: Tariffs */}
                            <div className="hidden lg:flex items-center gap-2 px-4">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              {renderTariffs(wf.tariffsList)}
                            </div>

                            {/* Right side: Actions */}
                            <div className="flex items-center gap-1">
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
                              {wf.is_generic && (
                                <>
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => handleDeleteClick(e, wf)}
                                    title={tCommon('delete')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmDescription', { code: workflowToDelete?.code || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={deleteWorkflowMutation.isPending}
            >
              {deleteWorkflowMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon('deleting')}
                </>
              ) : (
                tCommon('delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
