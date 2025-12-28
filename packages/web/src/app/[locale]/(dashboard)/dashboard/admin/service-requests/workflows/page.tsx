'use client'

import { useState } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  Power,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import {
  useWorkflows,
  useCreateWorkflow,
  useUpdateWorkflow,
  useDeleteWorkflow,
  useToggleWorkflowStatus,
} from '@/modules/service-requests-admin'
import type {
  Workflow,
  WorkflowCreate,
  WorkflowUpdate,
  WorkflowType,
} from '@/modules/service-requests-admin'
import { WORKFLOW_CATEGORIES, WORKFLOW_TYPES } from '@/modules/service-requests-admin'

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)

  // Form state
  const [formData, setFormData] = useState<WorkflowCreate>({
    code: '',
    name_es: '',
    description_es: '',
    category: 'OTROS',
    entity_code: 'DGI',
    workflow_type: 'standard',
    requires_agent_validation: true,
    requires_appointment: false,
    sla_hours: 48,
    display_order: 0,
    is_active: true,
  })

  // Queries and mutations
  const { data: workflows, isLoading, error, refetch } = useWorkflows({
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
  })

  const createMutation = useCreateWorkflow()
  const updateMutation = useUpdateWorkflow()
  const deleteMutation = useDeleteWorkflow()
  const toggleStatusMutation = useToggleWorkflowStatus()

  // Filter workflows by search query
  const filteredWorkflows = workflows?.filter((wf) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      wf.code.toLowerCase().includes(query) ||
      wf.name_es.toLowerCase().includes(query) ||
      wf.entity_code.toLowerCase().includes(query)
    )
  }) || []

  // Handlers
  const handleCreateWorkflow = async () => {
    try {
      await createMutation.mutateAsync(formData)
      setIsCreateDialogOpen(false)
      resetForm()
    } catch {
      // Error handled by mutation
    }
  }

  const handleUpdateWorkflow = async () => {
    if (!selectedWorkflow) return

    try {
      const updateData: WorkflowUpdate = {
        name_es: formData.name_es,
        description_es: formData.description_es,
        workflow_type: formData.workflow_type,
        requires_agent_validation: formData.requires_agent_validation,
        requires_appointment: formData.requires_appointment,
        sla_hours: formData.sla_hours,
        display_order: formData.display_order,
        is_active: formData.is_active,
      }
      await updateMutation.mutateAsync({ code: selectedWorkflow.code, data: updateData })
      setIsEditDialogOpen(false)
      resetForm()
    } catch {
      // Error handled by mutation
    }
  }

  const handleDeleteWorkflow = async () => {
    if (!selectedWorkflow) return

    try {
      await deleteMutation.mutateAsync(selectedWorkflow.code)
      setIsDeleteDialogOpen(false)
      setSelectedWorkflow(null)
    } catch {
      // Error handled by mutation
    }
  }

  const handleToggleStatus = async (workflow: Workflow) => {
    await toggleStatusMutation.mutateAsync({
      code: workflow.code,
      isActive: !workflow.is_active,
    })
  }

  const openEditDialog = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setFormData({
      code: workflow.code,
      name_es: workflow.name_es,
      description_es: workflow.description_es || '',
      category: workflow.category,
      entity_code: workflow.entity_code,
      workflow_type: workflow.workflow_type as WorkflowType,
      requires_agent_validation: workflow.requires_agent_validation,
      requires_appointment: workflow.requires_appointment,
      sla_hours: workflow.sla_hours,
      display_order: workflow.display_order,
      is_active: workflow.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setIsDeleteDialogOpen(true)
  }

  const navigateToDocuments = (workflowCode: string) => {
    router.push(`/${locale}/dashboard/admin/service-requests/documents?workflow=${workflowCode}`)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name_es: '',
      description_es: '',
      category: 'OTROS',
      entity_code: 'DGI',
      workflow_type: 'standard',
      requires_agent_validation: true,
      requires_appointment: false,
      sla_hours: 48,
      display_order: 0,
      is_active: true,
    })
    setSelectedWorkflow(null)
  }

  const getWorkflowTypeBadge = (type: string) => {
    switch (type) {
      case 'standard':
        return <Badge variant="default">{t('typeStandard')}</Badge>
      case 'direct_payment':
        return <Badge variant="secondary">{t('typeDirectPayment')}</Badge>
      case 'multi_phase':
        return <Badge variant="outline">{t('typeMultiPhase')}</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Render error state
  if (error) {
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
              <span>{error instanceof Error ? error.message : 'Error loading workflows'}</span>
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              {t('create')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('create')}</DialogTitle>
              <DialogDescription>{t('createDescription')}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">{t('code')}</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })
                    }
                    placeholder="PASAPORTE_NUEVO"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="entity_code">{t('entityCode')}</Label>
                  <Input
                    id="entity_code"
                    value={formData.entity_code}
                    onChange={(e) => setFormData({ ...formData, entity_code: e.target.value.toUpperCase() })}
                    placeholder="DGI"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name_es">{t('nameEs')}</Label>
                <Input
                  id="name_es"
                  value={formData.name_es}
                  onChange={(e) => setFormData({ ...formData, name_es: e.target.value })}
                  placeholder="Pasaporte Nuevo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description_es">{t('descriptionEs')}</Label>
                <Textarea
                  id="description_es"
                  value={formData.description_es || ''}
                  onChange={(e) => setFormData({ ...formData, description_es: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">{t('category')}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKFLOW_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="workflow_type">{t('workflowType')}</Label>
                  <Select
                    value={formData.workflow_type}
                    onValueChange={(value) => setFormData({ ...formData, workflow_type: value as WorkflowType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKFLOW_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sla_hours">{t('slaHours')}</Label>
                  <Input
                    id="sla_hours"
                    type="number"
                    value={formData.sla_hours}
                    onChange={(e) => setFormData({ ...formData, sla_hours: parseInt(e.target.value) || 48 })}
                    min={1}
                    max={720}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="display_order">{t('displayOrder')}</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="requires_agent">{t('requiresAgentValidation')}</Label>
                  <Switch
                    id="requires_agent"
                    checked={formData.requires_agent_validation}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_agent_validation: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requires_appointment">{t('requiresAppointment')}</Label>
                  <Switch
                    id="requires_appointment"
                    checked={formData.requires_appointment}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_appointment: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">{t('isActive')}</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {tCommon('cancel')}
              </Button>
              <Button
                onClick={handleCreateWorkflow}
                disabled={!formData.code || !formData.name_es || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tCommon('create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('total', { count: workflows?.length || 0 })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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

          {/* Workflows Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('code')}</TableHead>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead className="text-center">{t('docs')}</TableHead>
                  <TableHead className="text-center">{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {t('noWorkflowsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWorkflows.map((wf) => (
                    <TableRow key={wf.code}>
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
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{wf.documents_count || 0}</span>
                        </div>
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
                            onClick={() => navigateToDocuments(wf.code)}
                            title={t('viewDocuments')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(wf)}
                            title={wf.is_active ? t('deactivate') : t('activate')}
                          >
                            <Power className={`h-4 w-4 ${wf.is_active ? 'text-green-500' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(wf)}
                            title={t('edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(wf)}
                            disabled={!wf.is_generic}
                            title={wf.is_generic ? t('delete') : t('cannotDeleteHardcoded')}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('edit')}</DialogTitle>
            <DialogDescription>{t('editDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-code">{t('code')}</Label>
                <Input id="edit-code" value={formData.code} disabled className="bg-muted" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-entity">{t('entityCode')}</Label>
                <Input id="edit-entity" value={formData.entity_code} disabled className="bg-muted" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">{t('nameEs')}</Label>
              <Input
                id="edit-name"
                value={formData.name_es}
                onChange={(e) => setFormData({ ...formData, name_es: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">{t('descriptionEs')}</Label>
              <Textarea
                id="edit-description"
                value={formData.description_es || ''}
                onChange={(e) => setFormData({ ...formData, description_es: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-type">{t('workflowType')}</Label>
                <Select
                  value={formData.workflow_type}
                  onValueChange={(value) => setFormData({ ...formData, workflow_type: value as WorkflowType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKFLOW_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-sla">{t('slaHours')}</Label>
                <Input
                  id="edit-sla"
                  type="number"
                  value={formData.sla_hours}
                  onChange={(e) => setFormData({ ...formData, sla_hours: parseInt(e.target.value) || 48 })}
                  min={1}
                  max={720}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-agent">{t('requiresAgentValidation')}</Label>
                <Switch
                  id="edit-agent"
                  checked={formData.requires_agent_validation}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_agent_validation: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-appointment">{t('requiresAppointment')}</Label>
                <Switch
                  id="edit-appointment"
                  checked={formData.requires_appointment}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_appointment: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleUpdateWorkflow} disabled={!formData.name_es || updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmDescription', { code: selectedWorkflow?.code })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkflow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
