'use client';

/**
 * Roles & Permissions Admin Page
 * Unified management of roles, permissions catalog, and user overrides
 *
 * STRUCTURE (3 tabs):
 * - Rôles: CRUD for custom roles with permission assignment
 * - Catalogue Permissions: Read-only view of all system permissions
 * - Permissions Utilisateurs: Individual user permission overrides
 *
 * @module dashboard/admin/roles
 * @date 2025-01-14
 */

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Dialog imports kept for potential future use
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
// Label and Textarea imports kept for potential future use
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
import {
  Shield,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Lock,
  Building2,
  Key,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

// Roles module
import { useRoles, useDeleteRole } from '@/modules/roles-admin';
import type { Role } from '@/modules/roles-admin';

// Permissions module
import { usePermissions, useModuleNames } from '@/modules/permissions-admin';
import type { Permission } from '@/modules/permissions-admin';

// User Permissions module
import {
  UserSelector,
  UserPermissionList,
  useUserPermissions,
} from '@/modules/user-permissions-admin';
import type { SimpleUser } from '@/modules/user-permissions-admin';

export default function RolesPermissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  // Note: translation hooks kept for future i18n
  const _t = useTranslations('admin.roles');
  const _tPerm = useTranslations('admin.permissions');
  const _tUserPerm = useTranslations('admin.userPermissions');
  const _tCommon = useTranslations('common');

  // Read initial tab from URL params
  const tabParam = searchParams.get('tab');
  const validTabs = ['roles', 'permissions', 'user-permissions'];
  const initialTab = validTabs.includes(tabParam || '') ? tabParam! : 'roles';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab state with URL
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only sync when tabParam changes from URL
  }, [tabParam]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/${locale}/dashboard/admin/roles?tab=${value}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Rôles & Permissions
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérer les rôles, le catalogue de permissions et les overrides utilisateurs
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Rôles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Catalogue Permissions
          </TabsTrigger>
          <TabsTrigger value="user-permissions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Permissions Agents
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-6">
          <RolesTab />
        </TabsContent>

        {/* Permissions Catalog Tab */}
        <TabsContent value="permissions" className="mt-6">
          <PermissionsCatalogTab />
        </TabsContent>

        {/* User Permissions Tab */}
        <TabsContent value="user-permissions" className="mt-6">
          <UserPermissionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =============================================================================
// ROLES TAB COMPONENT
// =============================================================================

const PAGE_SIZE = 10;

function RolesTab() {
  const t = useTranslations('admin.roles');
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [entityTypeFilter]);

  const { data: rolesData, isLoading, error, refetch } = useRoles({
    entity_type: entityTypeFilter === 'all' ? undefined : entityTypeFilter === 'null' ? null : entityTypeFilter,
    page: currentPage,
    page_size: PAGE_SIZE,
  });

  const deleteMutation = useDeleteRole();

  const filteredRoles = rolesData?.roles?.filter((role) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      role.name.toLowerCase().includes(query) ||
      role.code.toLowerCase().includes(query) ||
      role.description?.toLowerCase().includes(query)
    );
  }) || [];

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    try {
      await deleteMutation.mutateAsync(selectedRole.id);
      toast.success(t('deleteSuccess') || 'Role deleted');
      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error deleting role');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error instanceof Error ? error.message : 'Erreur de chargement'}</span>
          </div>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Rôles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rolesData?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rôles Système</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rolesData?.roles?.filter(r => r.is_system).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rôles Personnalisés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rolesData?.roles?.filter(r => !r.is_system).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des Rôles</CardTitle>
              <CardDescription>
                {filteredRoles.length} rôles configurés
              </CardDescription>
            </div>
            <Link href={`/${locale}/dashboard/admin/roles/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Créer un Rôle
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="null">Global</SelectItem>
                <SelectItem value="ministry_agent">Agent Ministériel</SelectItem>
                <SelectItem value="entity_agent">Agent Entité</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Aucun rôle trouvé
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
                      <TableCell className="hidden md:table-cell">
                        {role.entity_type ? (
                          <Badge variant="outline" className="gap-1">
                            <Building2 className="h-3 w-3" />
                            {role.entity_type === 'ministry_agent' ? 'Agent Ministériel' :
                             role.entity_type === 'entity_agent' ? 'Agent Entité' :
                             role.entity_type}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Global</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {role.is_system ? (
                          <Badge variant="default" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Système
                          </Badge>
                        ) : (
                          <Badge variant="outline">Personnalisé</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/${locale}/dashboard/admin/roles/${role.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedRole(role);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-destructive hover:text-destructive"
                            title="Supprimer"
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

          {/* Pagination Controls */}
          {rolesData && rolesData.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {rolesData.page} sur {rolesData.total_pages} ({rolesData.total} rôles)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, rolesData.total_pages) }, (_, i) => {
                    let pageNum: number;
                    if (rolesData.total_pages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= rolesData.total_pages - 2) {
                      pageNum = rolesData.total_pages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={isLoading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(rolesData.total_pages, prev + 1))}
                  disabled={currentPage >= rolesData.total_pages || isLoading}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le Rôle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{selectedRole?.name}&quot; ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

// =============================================================================
// PERMISSIONS CATALOG TAB COMPONENT
// =============================================================================

const PERMISSIONS_PAGE_SIZE = 20;

function PermissionsCatalogTab() {
  // Note: _t kept for future i18n
  const _t = useTranslations('admin.permissions');

  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [criticalFilter, setCriticalFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, moduleFilter, criticalFilter]);

  const { data: permissions = [], isLoading, error, refetch } = usePermissions({
    module_name: moduleFilter === 'all' ? undefined : moduleFilter,
    is_critical: criticalFilter === 'all' ? undefined : criticalFilter === 'critical',
    search: searchQuery || undefined,
  });

  const moduleNames = useModuleNames();

  const filteredPermissions = permissions.filter((perm) => {
    // Apply critical filter for 'normal' option
    if (criticalFilter === 'normal' && perm.is_critical) return false;

    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      perm.name.toLowerCase().includes(query) ||
      perm.description?.toLowerCase().includes(query) ||
      perm.resource.toLowerCase().includes(query)
    );
  });

  // Pagination for list view
  const totalPages = Math.ceil(filteredPermissions.length / PERMISSIONS_PAGE_SIZE);
  const paginatedPermissions = viewMode === 'list'
    ? filteredPermissions.slice(
        (currentPage - 1) * PERMISSIONS_PAGE_SIZE,
        currentPage * PERMISSIONS_PAGE_SIZE
      )
    : filteredPermissions;

  const groupedByModule = filteredPermissions.reduce((acc, perm) => {
    const module = perm.module_name || 'other';
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const stats = {
    total: permissions.length,
    critical: permissions.filter(p => p.is_critical).length,
    modules: new Set(permissions.map(p => p.module_name)).size,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error instanceof Error ? error.message : 'Erreur de chargement'}</span>
          </div>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards - Improved layout */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">dans {stats.modules} modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">requièrent supervision</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.modules}</div>
            <p className="text-xs text-muted-foreground">catégories de permissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Filtrées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPermissions.length}</div>
            <p className="text-xs text-muted-foreground">permissions affichées</p>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Catalog - Improved UI */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Catalogue des Permissions
              </CardTitle>
              <CardDescription>
                Référence complète des permissions système ({stats.total} permissions)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters - Improved layout */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, description ou ressource..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modules ({stats.modules})</SelectItem>
                  <Separator className="my-1" />
                  {moduleNames.map((module) => {
                    const count = permissions.filter(p => p.module_name === module).length;
                    return (
                      <SelectItem key={module} value={module}>
                        {module} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select value={criticalFilter} onValueChange={setCriticalFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="critical">Critiques ({stats.critical})</SelectItem>
                  <SelectItem value="normal">Normales ({stats.total - stats.critical})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grouped' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grouped')}
                  className="gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Par Module
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="gap-2"
                >
                  <Key className="h-4 w-4" />
                  Liste
                </Button>
              </div>
              {viewMode === 'list' && filteredPermissions.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  Affichage {(currentPage - 1) * PERMISSIONS_PAGE_SIZE + 1}-
                  {Math.min(currentPage * PERMISSIONS_PAGE_SIZE, filteredPermissions.length)} sur {filteredPermissions.length}
                </span>
              )}
            </div>
          </div>

          {viewMode === 'grouped' ? (
            <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedByModule).slice(0, 2)}>
              {Object.entries(groupedByModule)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([module, perms]) => (
                <AccordionItem key={module} value={module}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize font-mono">
                        {module}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {perms.length} permission{perms.length > 1 ? 's' : ''}
                      </span>
                      {perms.some(p => p.is_critical) && (
                        <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 border-amber-300">
                          <AlertTriangle className="h-3 w-3" />
                          {perms.filter(p => p.is_critical).length} critique{perms.filter(p => p.is_critical).length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="border rounded-md mt-2 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[40%]">Permission</TableHead>
                            <TableHead className="w-[20%]">Ressource</TableHead>
                            <TableHead className="w-[15%]">Action</TableHead>
                            <TableHead className="w-[25%]">Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {perms.map((perm) => (
                            <TableRow key={perm.id} className="hover:bg-muted/30">
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium text-sm">
                                    {perm.description || perm.name}
                                  </div>
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                    {perm.name}
                                  </code>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {perm.resource}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-medium text-primary">
                                  {perm.action}
                                </span>
                              </TableCell>
                              <TableCell>
                                {perm.is_critical ? (
                                  <Badge className="gap-1 bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100">
                                    <AlertTriangle className="h-3 w-3" />
                                    Critique
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">Normal</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[35%]">Permission</TableHead>
                      <TableHead className="w-[15%]">Module</TableHead>
                      <TableHead className="w-[15%]">Ressource</TableHead>
                      <TableHead className="w-[10%]">Action</TableHead>
                      <TableHead className="w-[25%]">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPermissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                          <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Aucune permission trouvée</p>
                          <p className="text-sm">Essayez de modifier vos filtres</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPermissions.map((perm) => (
                        <TableRow key={perm.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-sm">
                                {perm.description || perm.name}
                              </div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                {perm.name}
                              </code>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize font-mono text-xs">
                              {perm.module_name || 'other'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {perm.resource}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-primary">
                              {perm.action}
                            </span>
                          </TableCell>
                          <TableCell>
                            {perm.is_critical ? (
                              <Badge className="gap-1 bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100">
                                <AlertTriangle className="h-3 w-3" />
                                Critique
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Normal</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} sur {totalPages} ({filteredPermissions.length} permissions)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Précédent
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// USER PERMISSIONS TAB COMPONENT
// =============================================================================

function UserPermissionsTab() {
  // Note: translation hooks kept for future i18n
  const _t = useTranslations('admin.userPermissions');
  const _tCommon = useTranslations('common');
  const locale = useLocale();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null);

  const { data: userPermissionsData, isLoading, error, refetch } = useUserPermissions(selectedUserId);

  const handleUserSelect = (userId: string | null, user: SimpleUser | null) => {
    setSelectedUserId(userId);
    setSelectedUser(user);
  };

  // Build grant permission URL with user info
  const grantPermissionUrl = selectedUser
    ? `/${locale}/dashboard/admin/roles/grant-permission?userId=${selectedUser.id}&userName=${encodeURIComponent(`${selectedUser.first_name} ${selectedUser.last_name}`)}&userEmail=${encodeURIComponent(selectedUser.email)}`
    : null;

  // Get existing permission IDs
  const existingPermissionIds = userPermissionsData?.user_permissions?.map(p => p.permission_id) || [];

  return (
    <div className="space-y-4">
      {/* Agent Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sélectionner un Agent
          </CardTitle>
          <CardDescription>
            Rechercher un agent pour gérer ses permissions individuelles (overrides RBAC)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <UserSelector
                value={selectedUserId}
                onValueChange={handleUserSelect}
                roleFilter="agent"
                placeholder="Rechercher un agent..."
                searchPlaceholder="Tapez le nom ou l'email..."
                emptyLabel="Aucun agent trouvé"
              />
            </div>
            {selectedUserId && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Permissions */}
      {selectedUserId && selectedUser && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissions de {selectedUser.first_name} {selectedUser.last_name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <span>{selectedUser.email}</span>
                  <Badge variant="secondary">{selectedUser.role}</Badge>
                </CardDescription>
              </div>
              {grantPermissionUrl && (
                <Link href={grantPermissionUrl}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter Override
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex items-center gap-2 text-destructive py-8 justify-center">
                <AlertCircle className="h-5 w-5" />
                <span>{error instanceof Error ? error.message : 'Erreur de chargement'}</span>
              </div>
            ) : (
              <Tabs defaultValue="overrides">
                <TabsList>
                  <TabsTrigger value="overrides">
                    Overrides
                    {userPermissionsData?.user_permissions && (
                      <Badge variant="secondary" className="ml-2">
                        {userPermissionsData.user_permissions.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="effective">Permissions Effectives</TabsTrigger>
                  <TabsTrigger value="role">Du Rôle</TabsTrigger>
                </TabsList>

                <TabsContent value="overrides" className="mt-4">
                  <UserPermissionList
                    permissions={userPermissionsData?.user_permissions || []}
                    userId={selectedUserId}
                    isLoading={isLoading}
                    onRefresh={() => refetch()}
                  />
                </TabsContent>

                <TabsContent value="effective" className="mt-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Toutes les permissions de cet utilisateur (rôle + overrides combinés)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {userPermissionsData?.effective_permissions?.length ? (
                          userPermissionsData.effective_permissions.map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">Aucune permission effective</span>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="role" className="mt-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Rôle:</span>
                        <Badge variant="secondary">
                          {userPermissionsData?.role_name || selectedUser.role}
                        </Badge>
                      </div>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        Permissions héritées du rôle de l&apos;utilisateur
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {userPermissionsData?.role_permissions?.length ? (
                          userPermissionsData.role_permissions.map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">Aucune permission du rôle</span>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State with guidance */}
      {!selectedUserId && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium text-foreground">Sélectionnez un agent</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Recherchez un agent par nom ou email pour gérer ses permissions individuelles (RBAC overrides).
                Tapez au moins 2 caractères pour lancer la recherche.
              </p>
              <Separator className="my-6 max-w-xs mx-auto" />
              <div className="text-left max-w-md mx-auto space-y-3">
                <h4 className="text-sm font-medium text-foreground">Permissions Agents vs Spécialisations</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Spécialisations</strong> (onglet Agents) : Types de workflows que l&apos;agent peut traiter (passeport, résidence, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Permissions (ici)</strong> : Overrides RBAC individuels pour accorder/refuser des actions spécifiques</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Utilisez cette fonctionnalité pour des cas exceptionnels uniquement (ex: accès temporaire)</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
