'use client'

/**
 * Permissions Admin Page
 * Lists all permissions with filtering by module, resource, and criticality
 *
 * @module dashboard/admin/permissions
 * @author Claude Code
 * @date 2025-11-17
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Shield, Search, Filter, RefreshCw } from 'lucide-react'

// Import module components and hooks
import { QueryProvider } from '@/modules/permissions-admin/providers/QueryProvider'
import {
  usePermissions,
  useModuleNames,
  useResources,
  usePermissionsByResource,
} from '@/modules/permissions-admin/hooks'
import { PermissionBadge } from '@/modules/permissions-admin/components'
import type { PermissionFilter } from '@/modules/permissions-admin/types'

// =============================================================================
// FILTERS COMPONENT
// =============================================================================

interface PermissionsFiltersProps {
  filters: PermissionFilter
  onFiltersChange: (filters: PermissionFilter) => void
  moduleNames: string[]
  resources: string[]
}

function PermissionsFilters({
  filters,
  onFiltersChange,
  moduleNames,
  resources,
}: PermissionsFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
            <CardDescription>
              Filtrer les permissions par module, resource ou criticité
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({})}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Recherche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nom ou description..."
                value={filters.search || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, search: e.target.value || undefined })
                }
                className="pl-9"
              />
            </div>
          </div>

          {/* Module */}
          <div className="space-y-2">
            <Label htmlFor="module">Module</Label>
            <Select
              value={filters.module_name || 'all'}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  module_name: value === 'all' ? undefined : value,
                  resource: undefined, // Reset resource when module changes
                })
              }
            >
              <SelectTrigger id="module">
                <SelectValue placeholder="Tous les modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modules</SelectItem>
                {moduleNames.map((module) => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resource */}
          <div className="space-y-2">
            <Label htmlFor="resource">Resource</Label>
            <Select
              value={filters.resource || 'all'}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  resource: value === 'all' ? undefined : value,
                })
              }
              disabled={!filters.module_name}
            >
              <SelectTrigger id="resource">
                <SelectValue placeholder="Toutes les resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les resources</SelectItem>
                {resources.map((resource) => (
                  <SelectItem key={resource} value={resource}>
                    {resource}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Criticality */}
          <div className="space-y-2">
            <Label htmlFor="critical">Criticité</Label>
            <Select
              value={
                filters.is_critical === undefined
                  ? 'all'
                  : filters.is_critical
                  ? 'critical'
                  : 'normal'
              }
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  is_critical:
                    value === 'all'
                      ? undefined
                      : value === 'critical'
                      ? true
                      : false,
                })
              }
            >
              <SelectTrigger id="critical">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="critical">Critiques uniquement</SelectItem>
                <SelectItem value="normal">Non-critiques uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// PERMISSIONS TABLE COMPONENT
// =============================================================================

function PermissionsTableContent() {
  const [filters, setFilters] = useState<PermissionFilter>({})

  // Fetch data
  const { data: permissions = [], isLoading, error, refetch } = usePermissions(filters)
  const { data: permissionsByResource = {} } = usePermissionsByResource()
  const moduleNames = useModuleNames()
  const resources = useResources(filters.module_name)

  // Statistics
  const stats = useMemo(() => {
    return {
      total: permissions.length,
      critical: permissions.filter((p) => p.is_critical).length,
      modules: new Set(permissions.map((p) => p.module_name)).size,
      resources: new Set(permissions.map((p) => p.resource)).size,
    }
  }, [permissions])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
        <p className="text-muted-foreground mt-2">
          Gérer toutes les permissions du système
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Dans {stats.modules} modules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modules</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.modules}</div>
            <p className="text-xs text-muted-foreground">
              Modules actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resources}</div>
            <p className="text-xs text-muted-foreground">
              Types de resources
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <PermissionsFilters
        filters={filters}
        onFiltersChange={setFilters}
        moduleNames={moduleNames}
        resources={resources}
      />

      {/* Tabs: List view / Grouped view */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Vue Liste</TabsTrigger>
          <TabsTrigger value="grouped">Vue Groupée</TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Toutes les permissions</CardTitle>
                  <CardDescription>
                    {stats.total} permission(s) trouvée(s)
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
                  Erreur lors du chargement des permissions
                </div>
              )}

              {!isLoading && !error && permissions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mb-4 opacity-50" />
                  <p>Aucune permission trouvée</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => setFilters({})}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}

              {!isLoading && !error && permissions.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Critique</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-mono font-medium">
                          {permission.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{permission.resource}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{permission.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{permission.module_name}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md text-sm text-muted-foreground">
                          {permission.description}
                        </TableCell>
                        <TableCell className="text-center">
                          {permission.is_critical ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Oui
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Non
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grouped View */}
        <TabsContent value="grouped" className="space-y-4">
          {Object.entries(permissionsByResource).map(([resource, perms]) => (
            <Card key={resource}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Resource: {resource}</span>
                  <Badge variant="secondary">{perms.length} permissions</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {perms.map((perm) => (
                    <PermissionBadge
                      key={perm.id}
                      permission={perm}
                      mode="action"
                      showCriticalIcon
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function PermissionsPage() {
  return (
    <QueryProvider>
      <PermissionsTableContent />
    </QueryProvider>
  )
}
