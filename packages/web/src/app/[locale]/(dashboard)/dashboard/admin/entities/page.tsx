'use client'

/**
 * Entities Admin Page
 * CRUD management for entities (top-level and departments) with workflow_codes
 *
 * @module dashboard/admin/entities
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Building,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Search,
  AlertTriangle,
  Layers,
  Workflow,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  useEntitiesWithDetails,
  useEntitiesSimple,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
} from '@/modules/cities'
import type {
  EntityWithDetails,
  EntityCreate,
  EntityUpdate,
  EntityType,
  EntityFilters,
} from '@/modules/cities'
import { BackendUnavailableAlert } from '@/modules/admin/components'

interface EntityFormData {
  code: string
  name: string
  description: string
  entity_type: EntityType
  parent_entity_id: string | null
  ministry_id: number | null
  workflow_codes: string[]
  is_active: boolean
}

const defaultFormData: EntityFormData = {
  code: '',
  name: '',
  description: '',
  entity_type: 'entity',
  parent_entity_id: null,
  ministry_id: null,
  workflow_codes: [],
  is_active: true,
}

export default function EntitiesPage() {
  const t = useTranslations('admin.entities')
  const tCommon = useTranslations('common')
  const { toast } = useToast()

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | EntityType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<EntityWithDetails | null>(null)
  const [formData, setFormData] = useState<EntityFormData>(defaultFormData)
  const [workflowCodesInput, setWorkflowCodesInput] = useState('')

  // API filters
  const apiFilters: EntityFilters = {
    ...(typeFilter !== 'all' && { entity_type: typeFilter }),
    ...(statusFilter !== 'all' && { is_active: statusFilter === 'active' }),
  }

  // Queries
  const { data: entitiesData, isLoading, error, refetch } = useEntitiesWithDetails(apiFilters)
  const { data: parentEntities } = useEntitiesSimple(true)

  // Mutations
  const createMutation = useCreateEntity()
  const updateMutation = useUpdateEntity()
  const deleteMutation = useDeleteEntity()

  const entities = entitiesData?.items || []
  const isBackendUnavailable = error?.message?.includes('fetch') || error?.message?.includes('Network')

  // Filter entities by search
  const filteredEntities = entities.filter((e) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      e.code.toLowerCase().includes(search) ||
      e.name.toLowerCase().includes(search) ||
      e.parent_entity_code?.toLowerCase().includes(search) ||
      e.ministry_name?.toLowerCase().includes(search)
    )
  })

  // Stats
  const totalEntities = entities.filter((e) => e.entity_type === 'entity').length
  const totalDepartments = entities.filter((e) => e.entity_type === 'department').length
  const activeCount = entities.filter((e) => e.is_active).length

  // Open create dialog
  const handleCreate = () => {
    setSelectedEntity(null)
    setFormData(defaultFormData)
    setWorkflowCodesInput('')
    setIsDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (entity: EntityWithDetails) => {
    setSelectedEntity(entity)
    setFormData({
      code: entity.code,
      name: entity.name,
      description: entity.description || '',
      entity_type: entity.entity_type,
      parent_entity_id: entity.parent_entity_id,
      ministry_id: entity.ministry_id,
      workflow_codes: entity.workflow_codes || [],
      is_active: entity.is_active,
    })
    setWorkflowCodesInput((entity.workflow_codes || []).join(', '))
    setIsDialogOpen(true)
  }

  // Open delete confirmation
  const handleDeleteClick = (entity: EntityWithDetails) => {
    setSelectedEntity(entity)
    setIsDeleteDialogOpen(true)
  }

  // Parse workflow codes from input
  const parseWorkflowCodes = (input: string): string[] => {
    return input
      .split(/[,\n]/)
      .map((code) => code.trim().toUpperCase())
      .filter((code) => code.length > 0)
  }

  // Submit form
  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Code and name are required',
      })
      return
    }

    const workflowCodes = parseWorkflowCodes(workflowCodesInput)
    const data = { ...formData, workflow_codes: workflowCodes }

    try {
      if (selectedEntity) {
        await updateMutation.mutateAsync({
          entityId: selectedEntity.id,
          data: data as EntityUpdate,
        })
        toast({ title: 'Success', description: 'Entity updated successfully' })
      } else {
        await createMutation.mutateAsync(data as EntityCreate)
        toast({ title: 'Success', description: 'Entity created successfully' })
      }
      setIsDialogOpen(false)
      refetch()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save entity',
      })
    }
  }

  // Delete entity
  const handleDelete = async () => {
    if (!selectedEntity) return

    try {
      await deleteMutation.mutateAsync(selectedEntity.id)
      toast({ title: 'Success', description: 'Entity deleted successfully' })
      setIsDeleteDialogOpen(false)
      refetch()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete entity',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('title') || 'Entities Management'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('subtitle') || 'Manage entities, departments and their workflow assignments'}
        </p>
      </div>

      {/* Backend Unavailable Alert */}
      {isBackendUnavailable && <BackendUnavailableAlert />}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entities.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entities</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Layers className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepartments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Building className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Entities Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('listTitle') || 'Entities List'}</CardTitle>
                <CardDescription>
                  {filteredEntities.length} entities found
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {tCommon('refresh') || 'Refresh'}
                </Button>
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('createEntity') || 'Create Entity'}
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by code, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as 'all' | EntityType)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="entity">Entity</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
          )}

          {error && !isBackendUnavailable && (
            <div className="flex items-center justify-center py-8 text-red-500">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {error.message}
            </div>
          )}

          {!isLoading && !error && filteredEntities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building className="h-12 w-12 mb-4 opacity-50" />
              <p>No entities found</p>
            </div>
          )}

          {!isLoading && !error && filteredEntities.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Workflows</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntities.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell className="font-mono text-sm">{entity.code}</TableCell>
                    <TableCell className="font-medium">{entity.name}</TableCell>
                    <TableCell>
                      <Badge variant={entity.entity_type === 'entity' ? 'default' : 'secondary'}>
                        {entity.entity_type === 'entity' ? (
                          <Building className="h-3 w-3 mr-1" />
                        ) : (
                          <Layers className="h-3 w-3 mr-1" />
                        )}
                        {entity.entity_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entity.parent_entity_code ? (
                        <span className="text-sm text-muted-foreground">
                          {entity.parent_entity_code}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Workflow className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{entity.workflow_count}</span>
                        {entity.resolved_workflow_codes.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({entity.resolved_workflow_codes.slice(0, 2).join(', ')}
                            {entity.resolved_workflow_codes.length > 2 && '...'})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          entity.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }
                      >
                        {entity.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(entity)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(entity)}>
                          <Trash2 className="h-4 w-4" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEntity ? 'Edit Entity' : 'Create Entity'}
            </DialogTitle>
            <DialogDescription>
              {selectedEntity
                ? 'Update entity information and workflow assignments'
                : 'Create a new entity or department'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., CNEDOGE"
                  maxLength={50}
                  disabled={!!selectedEntity}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity_type">Type *</Label>
                <Select
                  value={formData.entity_type}
                  onValueChange={(v) => setFormData({ ...formData, entity_type: v as EntityType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entity">Entity (Top-level)</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Centro Nacional de Documentos de Guinea Ecuatorial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={2}
              />
            </div>

            {formData.entity_type === 'department' && (
              <div className="space-y-2">
                <Label htmlFor="parent_entity_id">Parent Entity *</Label>
                <Select
                  value={formData.parent_entity_id || ''}
                  onValueChange={(v) => setFormData({ ...formData, parent_entity_id: v || null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentEntities
                      ?.filter((e) => e.entity_type === 'entity')
                      .map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.code} - {e.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="workflow_codes">
                Workflow Codes
                <span className="text-xs text-muted-foreground ml-2">
                  (comma or newline separated, will be uppercased)
                </span>
              </Label>
              <Textarea
                id="workflow_codes"
                value={workflowCodesInput}
                onChange={(e) => setWorkflowCodesInput(e.target.value)}
                placeholder="PASAPORTE_NUEVO, PASAPORTE_RENOVACION&#10;RESIDENCIA_PRIMERA_VEZ"
                rows={3}
                className="font-mono text-sm"
              />
              {workflowCodesInput && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {parseWorkflowCodes(workflowCodesInput).map((code, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {code}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {tCommon('cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              {selectedEntity ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedEntity?.name}&quot;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
