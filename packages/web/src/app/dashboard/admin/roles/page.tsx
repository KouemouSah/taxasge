'use client'

/**
 * Roles Admin Page
 * Manage custom roles with CRUD operations and permission assignment
 *
 * @module dashboard/admin/roles
 * @author Claude Code
 * @date 2025-11-17
 */

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Building2,
  Globe,
  Lock,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Import module components and hooks
import { QueryProvider } from '@/modules/permissions-admin/providers/QueryProvider'
import {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '@/modules/permissions-admin/hooks'
import { usePermissions } from '@/modules/permissions-admin/hooks'
import { PermissionCheckboxGroup } from '@/modules/permissions-admin/components'
import type { Role } from '@/modules/permissions-admin/types'

// =============================================================================
// CREATE/EDIT ROLE DIALOG
// =============================================================================

interface RoleDialogProps {
  role?: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function RoleDialog({ role, open, onOpenChange, onSuccess }: RoleDialogProps) {
  const { toast } = useToast()
  const isEdit = !!role

  // Form state
  const [name, setName] = useState(role?.name || '')
  const [code, setCode] = useState(role?.code || '')
  const [entityType, setEntityType] = useState<string>(role?.entity_type || 'null')
  const [description, setDescription] = useState(role?.description || '')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())

  // Fetch permissions
  const { data: permissions = [] } = usePermissions()
  const { data: roleDetails } = useRole(role?.id || null)

  // Mutations
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()

  // Initialize selected permissions when editing
  useState(() => {
    if (roleDetails?.permissions) {
      setSelectedPermissions(new Set(roleDetails.permissions.map((p) => p.id)))
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !code || !description) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      })
      return
    }

    try {
      if (isEdit && role) {
        // Update existing role
        await updateRole.mutateAsync({
          id: role.id,
          data: {
            name,
            description,
            permissions: Array.from(selectedPermissions),
          },
        })
        toast({
          title: 'Succès',
          description: 'Rôle mis à jour avec succès',
        })
      } else {
        // Create new role
        await createRole.mutateAsync({
          name,
          code,
          entity_type: entityType === 'null' ? null : entityType,
          description,
          permissions: Array.from(selectedPermissions),
        })
        toast({
          title: 'Succès',
          description: 'Rôle créé avec succès',
        })
      }

      onSuccess()
      onOpenChange(false)
      // Reset form
      setName('')
      setCode('')
      setEntityType('null')
      setDescription('')
      setSelectedPermissions(new Set())
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    }
  }

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(permissionId)
      } else {
        newSet.delete(permissionId)
      }
      return newSet
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Éditer le rôle' : 'Créer un nouveau rôle'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifier les détails du rôle et ses permissions'
              : 'Définir un nouveau rôle custom avec des permissions spécifiques'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom du rôle <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Superviseur Junior DGI"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">
                  Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: supervisor_dgi_junior"
                  required
                  disabled={isEdit}
                  className={isEdit ? 'opacity-50 cursor-not-allowed' : ''}
                />
                {isEdit && (
                  <p className="text-xs text-muted-foreground">
                    Le code ne peut pas être modifié
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity_type">Type d&apos;entité</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger id="entity_type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Global (tous)</SelectItem>
                  <SelectItem value="DGI">DGI</SelectItem>
                  <SelectItem value="Ministry">Ministère</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez les responsabilités et le scope de ce rôle..."
                rows={3}
                required
              />
            </div>
          </div>

          {/* Permissions Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Permissions ({selectedPermissions.size} sélectionnées)
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPermissions(new Set(permissions.map((p) => p.id)))}
                >
                  Tout sélectionner
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPermissions(new Set())}
                >
                  Tout désélectionner
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6 max-h-96 overflow-y-auto">
                <PermissionCheckboxGroup
                  permissions={permissions}
                  selectedPermissions={selectedPermissions}
                  onSelectionChange={handlePermissionToggle}
                  mode="normal"
                  groupByResource
                  confirmCritical={false}
                />
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createRole.isPending || updateRole.isPending}
            >
              {createRole.isPending || updateRole.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Mise à jour...' : 'Création...'}
                </>
              ) : (
                <>{isEdit ? 'Mettre à jour' : 'Créer le rôle'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// DELETE CONFIRMATION DIALOG
// =============================================================================

interface DeleteDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

function DeleteDialog({ role, open, onOpenChange, onConfirm }: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmer la suppression
          </AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le rôle <strong>{role?.name}</strong> ?
            <br />
            <br />
            Cette action est irréversible et affectera tous les utilisateurs ayant ce rôle.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// =============================================================================
// ROLES TABLE COMPONENT
// =============================================================================

function RolesTableContent() {
  const { toast } = useToast()
  const [filter, setFilter] = useState<'all' | 'system' | 'custom'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  // Fetch data
  const {
    data: roles = [],
    isLoading,
    error,
    refetch,
  } = useRoles({
    is_system: filter === 'all' ? undefined : filter === 'system',
  })

  const deleteRole = useDeleteRole()

  const handleEdit = (role: Role) => {
    setSelectedRole(role)
    setDialogOpen(true)
  }

  const handleDelete = (role: Role) => {
    setSelectedRole(role)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedRole) return

    try {
      await deleteRole.mutateAsync(selectedRole.id)
      toast({
        title: 'Succès',
        description: 'Rôle supprimé avec succès',
      })
      setDeleteDialogOpen(false)
      setSelectedRole(null)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le rôle',
        variant: 'destructive',
      })
    }
  }

  const getEntityIcon = (entityType: string | null) => {
    if (!entityType) return <Globe className="h-4 w-4" />
    if (entityType === 'DGI') return <Building2 className="h-4 w-4" />
    if (entityType === 'Ministry') return <Building2 className="h-4 w-4 text-blue-500" />
    return <Shield className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rôles</h1>
          <p className="text-muted-foreground mt-2">
            Gérer les rôles système et custom
          </p>
        </div>
        <Button onClick={() => { setSelectedRole(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un rôle
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rôles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">
              Système + Custom
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rôles Système</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.filter((r) => r.is_system).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Non modifiables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rôles Custom</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {roles.filter((r) => !r.is_system).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Personnalisés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Filter */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'system' | 'custom')}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Liste des rôles</CardTitle>
                  <CardDescription>
                    {roles.length} rôle(s) trouvé(s)
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Chargement...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center py-8 text-red-500">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Erreur lors du chargement des rôles
                </div>
              )}

              {!isLoading && !error && roles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mb-4 opacity-50" />
                  <p>Aucun rôle trouvé</p>
                </div>
              )}

              {!isLoading && !error && roles.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Entité</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell className="font-mono text-sm">{role.code}</TableCell>
                        <TableCell>
                          {role.is_system ? (
                            <Badge variant="outline" className="gap-1">
                              <Lock className="h-3 w-3" />
                              Système
                            </Badge>
                          ) : (
                            <Badge className="gap-1">
                              <Shield className="h-3 w-3" />
                              Custom
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEntityIcon(role.entity_type)}
                            <span className="text-sm">
                              {role.entity_type || 'Global'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md text-sm text-muted-foreground">
                          {role.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(role)}
                              disabled={role.is_system}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(role)}
                              disabled={role.is_system}
                              className={!role.is_system ? 'hover:bg-red-50 hover:text-red-600' : ''}
                            >
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
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <RoleDialog
        role={selectedRole}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => refetch()}
      />
      <DeleteDialog
        role={selectedRole}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function RolesPage() {
  return (
    <DashboardLayout>
      <QueryProvider>
        <RolesTableContent />
      </QueryProvider>
    </DashboardLayout>
  )
}
