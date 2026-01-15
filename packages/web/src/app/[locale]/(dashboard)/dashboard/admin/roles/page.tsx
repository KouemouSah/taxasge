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
  User,
  RefreshCw,
  ChevronRight,
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
  GrantPermissionDialog,
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
            <User className="h-4 w-4" />
            Permissions Utilisateurs
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

function RolesTab() {
  const t = useTranslations('admin.roles');
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const { data: rolesData, isLoading, error, refetch } = useRoles({
    entity_type: entityTypeFilter === 'all' ? undefined : entityTypeFilter === 'null' ? null : entityTypeFilter,
    page_size: 100,
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
                <SelectItem value="DGI">DGI</SelectItem>
                <SelectItem value="Ministry">Ministère</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
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
                      <TableCell>
                        {role.entity_type ? (
                          <Badge variant="outline" className="gap-1">
                            <Building2 className="h-3 w-3" />
                            {role.entity_type}
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
                            <Button variant="ghost" size="icon" title="Voir/Modifier">
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
                            disabled={role.is_system}
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

function PermissionsCatalogTab() {
  // Note: _t kept for future i18n
  const _t = useTranslations('admin.permissions');

  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [criticalFilter, setCriticalFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');

  const { data: permissions = [], isLoading, error, refetch } = usePermissions({
    module_name: moduleFilter === 'all' ? undefined : moduleFilter,
    is_critical: criticalFilter === 'all' ? undefined : criticalFilter === 'critical',
    search: searchQuery || undefined,
  });

  const moduleNames = useModuleNames();

  const filteredPermissions = permissions.filter((perm) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      perm.name.toLowerCase().includes(query) ||
      perm.description?.toLowerCase().includes(query) ||
      perm.resource.toLowerCase().includes(query)
    );
  });

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
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.modules}</div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Catalogue des Permissions</CardTitle>
          <CardDescription>
            Vue en lecture seule de toutes les permissions système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Module" />
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
            <Select value={criticalFilter} onValueChange={setCriticalFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="critical">Critiques seulement</SelectItem>
                <SelectItem value="normal">Normales seulement</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grouped' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grouped')}
              >
                Groupé
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                Liste
              </Button>
            </div>
          </div>

          {viewMode === 'grouped' ? (
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedByModule).map(([module, perms]) => (
                <AccordionItem key={module} value={module}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {module}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {perms.length} permissions
                      </span>
                      {perms.some(p => p.is_critical) && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {perms.filter(p => p.is_critical).length} critiques
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="border rounded-md mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Ressource</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {perms.map((perm) => (
                            <TableRow key={perm.id}>
                              <TableCell>
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {perm.name}
                                </code>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{perm.resource}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                  {perm.action}
                                </div>
                              </TableCell>
                              <TableCell>
                                {perm.is_critical ? (
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Critique
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Normal</Badge>
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
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Ressource</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Aucune permission trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPermissions.map((perm) => (
                      <TableRow key={perm.id}>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {perm.name}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {perm.module_name || 'other'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{perm.resource}</Badge>
                        </TableCell>
                        <TableCell>{perm.action}</TableCell>
                        <TableCell>
                          {perm.is_critical ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Critique
                            </Badge>
                          ) : (
                            <Badge variant="outline">Normal</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null);
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);

  const { data: userPermissionsData, isLoading, error, refetch } = useUserPermissions(selectedUserId);

  const existingPermissionIds = useMemo(() => {
    if (!userPermissionsData?.user_permissions) return [];
    return userPermissionsData.user_permissions.map((p) => p.permission_id);
  }, [userPermissionsData]);

  const handleUserSelect = (userId: string | null, user: SimpleUser | null) => {
    setSelectedUserId(userId);
    setSelectedUser(user);
  };

  return (
    <div className="space-y-4">
      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Sélectionner un Utilisateur
          </CardTitle>
          <CardDescription>
            Rechercher un utilisateur pour gérer ses permissions individuelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <UserSelector value={selectedUserId} onValueChange={handleUserSelect} />
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
              <Button onClick={() => setIsGrantDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter Override
              </Button>
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

      {/* Empty State */}
      {!selectedUserId && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun utilisateur sélectionné</p>
              <p className="text-sm mt-2">
                Sélectionnez un utilisateur ci-dessus pour gérer ses permissions
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grant Permission Dialog */}
      <GrantPermissionDialog
        user={selectedUser}
        existingPermissionIds={existingPermissionIds}
        open={isGrantDialogOpen}
        onOpenChange={setIsGrantDialogOpen}
      />
    </div>
  );
}
