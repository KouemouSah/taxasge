'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Shield, Plus, Search, Pencil, Trash2, Loader2, AlertCircle, Lock, Building2, Key } from 'lucide-react'
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, RolePermissionsDialog } from '@/modules/roles-admin'
import type { Role, CreateRoleRequest, UpdateRoleRequest } from '@/modules/roles-admin'
import { toast } from 'sonner'

export default function RolesPage() {
  const t = useTranslations('admin.roles')
  const tCommon = useTranslations('common')

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: '',
    code: '',
    entity_type: null,
    description: '',
  })

  // Queries and mutations
  const { data: rolesData, isLoading, error, refetch } = useRoles({
    entity_type: entityTypeFilter === 'all' ? undefined : entityTypeFilter === 'null' ? null : entityTypeFilter,
    page_size: 100,
  })

  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()
  const deleteMutation = useDeleteRole()

  // Filter roles by search query
  const filteredRoles = rolesData?.roles?.filter((role) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      role.name.toLowerCase().includes(query) ||
      role.code.toLowerCase().includes(query) ||
      role.description?.toLowerCase().includes(query)
    )
  }) || []

  // Handlers
  const handleCreateRole = async () => {
    try {
      await createMutation.mutateAsync(formData)
      toast.success(t('createSuccess') || 'Role created successfully')
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create role')
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedRole) return

    try {
      const updateData: UpdateRoleRequest = {
        name: formData.name,
        description: formData.description || undefined,
      }
      await updateMutation.mutateAsync({ id: selectedRole.id, data: updateData })
      toast.success(t('updateSuccess') || 'Role updated successfully')
      setIsEditDialogOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  const handleDeleteRole = async () => {
    if (!selectedRole) return

    try {
      await deleteMutation.mutateAsync(selectedRole.id)
      toast.success(t('deleteSuccess') || 'Role deleted successfully')
      setIsDeleteDialogOpen(false)
      setSelectedRole(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete role')
    }
  }

  const openEditDialog = (role: Role) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      code: role.code,
      entity_type: role.entity_type,
      description: role.description || '',
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (role: Role) => {
    setSelectedRole(role)
    setIsDeleteDialogOpen(true)
  }

  const openPermissionsDialog = (role: Role) => {
    setSelectedRole(role)
    setIsPermissionsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      entity_type: null,
      description: '',
    })
    setSelectedRole(null)
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
              <span>{error instanceof Error ? error.message : 'Error loading roles'}</span>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              {tCommon('retry') || 'Retry'}
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
              {t('createRole') || 'Create Role'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createRole') || 'Create Role'}</DialogTitle>
              <DialogDescription>
                {t('createRoleDescription') || 'Create a new custom role with specific permissions.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('roleName') || 'Role Name'}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Supervisor Junior"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">{t('roleCode') || 'Role Code'}</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                  placeholder="supervisor_junior"
                />
                <p className="text-xs text-muted-foreground">
                  {t('codeHint') || 'Lowercase letters, numbers, and underscores only'}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="entity_type">{t('entityType') || 'Entity Type'}</Label>
                <Select
                  value={formData.entity_type || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, entity_type: value === 'none' ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('global') || 'Global (No restriction)'}</SelectItem>
                    <SelectItem value="DGI">DGI</SelectItem>
                    <SelectItem value="Ministry">{t('ministry') || 'Ministry'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">{t('description') || 'Description'}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Role description..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {tCommon('cancel') || 'Cancel'}
              </Button>
              <Button
                onClick={handleCreateRole}
                disabled={!formData.name || !formData.code || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tCommon('create') || 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {t('totalRoles', { count: rolesData?.total || 0 }) || `${rolesData?.total || 0} roles configured`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder') || 'Search roles...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTypes') || 'All Types'}</SelectItem>
                <SelectItem value="null">{t('global') || 'Global'}</SelectItem>
                <SelectItem value="DGI">DGI</SelectItem>
                <SelectItem value="Ministry">{t('ministry') || 'Ministry'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Roles Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('roleName') || 'Name'}</TableHead>
                  <TableHead>{t('roleCode') || 'Code'}</TableHead>
                  <TableHead>{t('entityType') || 'Type'}</TableHead>
                  <TableHead>{t('status') || 'Status'}</TableHead>
                  <TableHead className="text-right">{t('actions') || 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {t('noRolesFound') || 'No roles found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{role.name}</div>
                            {role.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                                {role.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{role.code}</code>
                      </TableCell>
                      <TableCell>
                        {role.entity_type ? (
                          <Badge variant="outline" className="gap-1">
                            <Building2 className="h-3 w-3" />
                            {role.entity_type}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{t('global') || 'Global'}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {role.is_system ? (
                          <Badge variant="default" className="gap-1">
                            <Lock className="h-3 w-3" />
                            {t('system') || 'System'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{t('custom') || 'Custom'}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPermissionsDialog(role)}
                            title={t('managePermissions') || 'Manage Permissions'}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(role)}
                            disabled={role.is_system}
                            title={role.is_system ? (t('cannotEditSystem') || 'Cannot edit system roles') : ''}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(role)}
                            disabled={role.is_system}
                            title={role.is_system ? (t('cannotDeleteSystem') || 'Cannot delete system roles') : ''}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editRole') || 'Edit Role'}</DialogTitle>
            <DialogDescription>
              {t('editRoleDescription') || 'Update role details. Code cannot be changed.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">{t('roleName') || 'Role Name'}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-code">{t('roleCode') || 'Role Code'}</Label>
              <Input id="edit-code" value={formData.code} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">{t('codeReadonly') || 'Code cannot be changed'}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">{t('description') || 'Description'}</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {tCommon('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleUpdateRole} disabled={!formData.name || updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('save') || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteRole') || 'Delete Role'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteRoleConfirmation', { name: selectedRole?.name }) ||
                `Are you sure you want to delete "${selectedRole?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('delete') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Permissions Dialog */}
      <RolePermissionsDialog
        role={selectedRole}
        open={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
      />
    </div>
  )
}
