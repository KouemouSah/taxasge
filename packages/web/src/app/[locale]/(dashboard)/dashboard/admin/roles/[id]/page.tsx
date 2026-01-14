'use client';

/**
 * Edit Role Page
 * Dedicated page for viewing and editing a role with its permissions
 *
 * @module dashboard/admin/roles/[id]
 * @date 2025-01-14
 */

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Shield,
  ArrowLeft,
  Loader2,
  Key,
  Search,
  AlertCircle,
  Lock,
  Trash2,
  Building2,
  Save,
  Plus,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useRoleWithPermissions,
  useUpdateRole,
  useDeleteRole,
  useAssignPermissions,
  useRemovePermissions,
} from '@/modules/roles-admin';
import type { UpdateRoleRequest } from '@/modules/roles-admin';
import { usePermissions, useModuleNames } from '@/modules/permissions-admin';
import type { Permission } from '@/modules/permissions-admin';

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const roleId = params.id as string;

  const t = useTranslations('admin.roles');
  const tPerm = useTranslations('admin.permissions');

  // Fetch role with permissions
  const {
    data: role,
    isLoading: roleLoading,
    error: roleError,
    refetch: refetchRole,
  } = useRoleWithPermissions(roleId);

  // Form state
  const [formData, setFormData] = useState<UpdateRoleRequest>({
    name: '',
    description: '',
  });
  const [formInitialized, setFormInitialized] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  // Mutations
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();
  const assignMutation = useAssignPermissions();
  const removeMutation = useRemovePermissions();

  // Fetch all permissions
  const { data: allPermissions = [], isLoading: permissionsLoading } = usePermissions({
    module_name: moduleFilter === 'all' ? undefined : moduleFilter,
    search: permissionSearch || undefined,
  });
  const modules = useModuleNames();

  // Initialize form when role data loads
  if (role && !formInitialized) {
    setFormData({
      name: role.name,
      description: role.description || '',
    });
    setFormInitialized(true);
  }

  // Current permissions (names from role)
  const currentPermissionNames = useMemo(() => {
    return new Set(role?.permissions || []);
  }, [role?.permissions]);

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    return allPermissions.reduce((acc, perm) => {
      const module = perm.module_name || 'other';
      if (!acc[module]) acc[module] = [];
      acc[module].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [allPermissions]);

  // Handle update
  const handleUpdate = async () => {
    if (!role || role.is_system) return;

    try {
      await updateMutation.mutateAsync({
        id: roleId,
        data: formData,
      });
      toast.success('Role updated successfully');
      refetchRole();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error updating role');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!role || role.is_system) return;

    try {
      await deleteMutation.mutateAsync(roleId);
      toast.success('Role deleted successfully');
      router.push(`/${locale}/dashboard/admin/roles`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error deleting role');
    }
  };

  // Handle permission toggle
  const handleTogglePermission = async (permission: Permission) => {
    if (!role || role.is_system) return;

    const hasPermission = currentPermissionNames.has(permission.name);

    try {
      if (hasPermission) {
        await removeMutation.mutateAsync({
          roleId,
          data: { permission_ids: [permission.id] },
        });
        toast.success(`Permission "${permission.name}" removed`);
      } else {
        await assignMutation.mutateAsync({
          roleId,
          data: { permission_ids: [permission.id], granted: true },
        });
        toast.success(`Permission "${permission.name}" assigned`);
      }
      refetchRole();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error updating permission');
    }
  };

  // Loading state
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (roleError || !role) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard/admin/roles`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Role not found</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>
                {roleError instanceof Error ? roleError.message : 'Role not found or access denied'}
              </span>
            </div>
            <Link href={`/${locale}/dashboard/admin/roles`}>
              <Button variant="outline" className="mt-4">
                Return to roles
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard/admin/roles`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Shield className="h-8 w-8" />
                {role.name}
              </h1>
              {role.is_system && (
                <Badge variant="default" className="gap-1">
                  <Lock className="h-3 w-3" />
                  System
                </Badge>
              )}
              {role.entity_type && (
                <Badge variant="outline" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  {role.entity_type}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              <code className="bg-muted px-2 py-1 rounded text-sm">{role.code}</code>
              {' - '}
              {role.permissions_count} permissions
            </p>
          </div>
        </div>

        {!role.is_system && (
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Role
          </Button>
        )}
      </div>

      {/* System role warning */}
      {role.is_system && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-amber-700">
              <Lock className="h-5 w-5" />
              <p className="text-sm">
                <strong>System Role.</strong> This role is managed by the system and cannot be modified.
                You can only view its permissions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Role Information */}
        <Card>
          <CardHeader>
            <CardTitle>Role Information</CardTitle>
            <CardDescription>
              {role.is_system ? 'View role details' : 'Update role name and description'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={role.is_system}
              />
            </div>

            {/* Code (read-only) */}
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={role.code} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Code cannot be changed after creation
              </p>
            </div>

            {/* Entity Type (read-only) */}
            <div className="grid gap-2">
              <Label>Entity Type</Label>
              <Input
                value={role.entity_type || 'Global (no restriction)'}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={role.is_system}
                rows={4}
              />
            </div>

            {/* Save button */}
            {!role.is_system && (
              <Button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                className="w-full"
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Permissions
            </CardTitle>
            <CardDescription>
              {role.is_system
                ? `${role.permissions_count} permissions assigned (read-only)`
                : `Manage permissions for this role (${role.permissions_count} assigned)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search permissions..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modules</SelectItem>
                  {modules.map((mod: string | null) => mod && (
                    <SelectItem key={mod} value={mod}>
                      {mod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Permissions List */}
            <div className="border rounded-md max-h-[500px] overflow-y-auto">
              {permissionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : allPermissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>No permissions found</p>
                </div>
              ) : (
                Object.entries(groupedPermissions).map(([module, perms]) => (
                  <div key={module}>
                    <div className="sticky top-0 bg-muted px-3 py-2 font-medium text-sm flex items-center justify-between">
                      <span>{module}</span>
                      <Badge variant="secondary" className="text-xs">
                        {perms.filter((p) => currentPermissionNames.has(p.name)).length}/{perms.length}
                      </Badge>
                    </div>
                    {perms.map((perm) => {
                      const hasPermission = currentPermissionNames.has(perm.name);
                      const isUpdating =
                        assignMutation.isPending || removeMutation.isPending;

                      return (
                        <div
                          key={perm.id}
                          className={`flex items-center gap-3 px-3 py-2 hover:bg-muted/50 ${
                            role.is_system ? '' : 'cursor-pointer'
                          }`}
                          onClick={() => !role.is_system && handleTogglePermission(perm)}
                        >
                          <Checkbox
                            checked={hasPermission}
                            disabled={role.is_system || isUpdating}
                            onCheckedChange={() =>
                              !role.is_system && handleTogglePermission(perm)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{perm.name}</span>
                              {perm.is_critical && (
                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                  Critical
                                </Badge>
                              )}
                            </div>
                            {perm.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {perm.description}
                              </p>
                            )}
                          </div>
                          {!role.is_system && (
                            <div className="flex-shrink-0">
                              {hasPermission ? (
                                <Minus className="h-4 w-4 text-destructive" />
                              ) : (
                                <Plus className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role &quot;{role.name}&quot;?
              This action cannot be undone. Users assigned to this role will lose
              their associated permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
