'use client';

/**
 * Create New Role Page
 * Dedicated page for creating a custom role with permissions
 *
 * @module dashboard/admin/roles/new
 * @date 2025-01-14
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  ArrowLeft,
  Loader2,
  Key,
  Search,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { useCreateRole } from '@/modules/roles-admin';
import type { CreateRoleRequest } from '@/modules/roles-admin';
import { usePermissions, useModuleNames } from '@/modules/permissions-admin';
import type { Permission } from '@/modules/permissions-admin';

export default function CreateRolePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin.roles');
  // Note: _tPerm kept for future i18n
  const _tPerm = useTranslations('admin.permissions');

  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: '',
    code: '',
    entity_type: null,
    description: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  const createMutation = useCreateRole();

  // Fetch permissions for selection
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions({
    module_name: moduleFilter === 'all' ? undefined : moduleFilter,
    search: permissionSearch || undefined,
  });

  const modules = useModuleNames();

  // Group permissions by module for better display
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const module = perm.module_name || 'other';
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Le nom et le code sont requis');
      return;
    }

    try {
      const newRole = await createMutation.mutateAsync(formData);

      // TODO: If API supports it, assign permissions during creation
      // For now, navigate to the role page to add permissions

      toast.success(t('createSuccess') || 'Role created successfully');
      router.push(`/${locale}/dashboard/admin/roles/${newRole.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error creating role');
    }
  };

  const handleCodeChange = (value: string) => {
    // Auto-format: lowercase, replace spaces and special chars with underscores
    const formatted = value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    setFormData({ ...formData, code: formatted });
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/admin/roles`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Créer un Nouveau Rôle
          </h1>
          <p className="text-muted-foreground mt-1">
            Définir un rôle personnalisé avec des permissions spécifiques
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Role Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du Rôle</CardTitle>
              <CardDescription>
                Définissez les informations de base du rôle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">Nom du rôle *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Superviseur Junior"
                  required
                />
              </div>

              {/* Code */}
              <div className="grid gap-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="supervisor_junior"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Lettres minuscules, chiffres et underscores uniquement. Utilisé pour identifier le rôle dans le code.
                </p>
              </div>

              {/* Entity Type */}
              <div className="grid gap-2">
                <Label htmlFor="entity_type">Type d&apos;entité</Label>
                <Select
                  value={formData.entity_type || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, entity_type: value === 'none' ? null : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Global (pas de restriction)</SelectItem>
                    <SelectItem value="DGI">DGI</SelectItem>
                    <SelectItem value="Ministry">Ministère</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Restreindre ce rôle à un type d&apos;organisation spécifique
                </p>
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du rôle et de ses responsabilités..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Permissions Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Permissions
              </CardTitle>
              <CardDescription>
                Sélectionnez les permissions pour ce rôle ({selectedPermissions.length} sélectionnées)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
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
                    <SelectItem value="all">Tous</SelectItem>
                    {modules.map((mod: string | null) => mod && (
                      <SelectItem key={mod} value={mod}>
                        {mod}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Permissions List */}
              <div className="border rounded-md max-h-[400px] overflow-y-auto">
                {permissionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : permissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>Aucune permission trouvée</p>
                  </div>
                ) : (
                  Object.entries(groupedPermissions).map(([module, perms]) => (
                    <div key={module}>
                      <div className="sticky top-0 bg-muted px-3 py-2 font-medium text-sm">
                        {module} ({perms.length})
                      </div>
                      {perms.map((perm) => (
                        <div
                          key={perm.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                          onClick={() => togglePermission(perm.id)}
                        >
                          <Checkbox
                            checked={selectedPermissions.includes(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{perm.name}</span>
                              {perm.is_critical && (
                                <span className="text-xs text-amber-600 font-medium">
                                  Critique
                                </span>
                              )}
                            </div>
                            {perm.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {perm.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Les permissions seront assignées après la création du rôle.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Separator className="my-6" />
        <div className="flex items-center justify-end gap-4">
          <Link href={`/${locale}/dashboard/admin/roles`}>
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!formData.name.trim() || !formData.code.trim() || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer le Rôle
          </Button>
        </div>
      </form>
    </div>
  );
}
