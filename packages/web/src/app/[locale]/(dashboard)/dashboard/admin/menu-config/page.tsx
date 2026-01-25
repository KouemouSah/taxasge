'use client';

/**
 * Menu Configuration Admin Page
 * Manage menu templates and workflow menu mappings
 *
 * @module dashboard/admin/menu-config
 * @date 2026-01-19
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  Menu,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Workflow,
  LayoutTemplate,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/core/api/client';
import type {
  WorkflowMenuMapping,
  WorkflowMenuMappingListResponse,
  MenuTemplateListResponse,
} from '@/modules/agent-dashboard/types/menu-config';

const PAGE_SIZE = 10;

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function fetchWorkflowMappings(
  page: number,
  isActive?: boolean
): Promise<WorkflowMenuMappingListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: PAGE_SIZE.toString(),
  });
  if (isActive !== undefined) {
    params.append('is_active', isActive.toString());
  }
  const response = await apiClient.get<WorkflowMenuMappingListResponse>(
    `/menu-config/workflow-mappings?${params}`
  );
  return response.data;
}

async function updateWorkflowMapping(
  id: number,
  data: Partial<WorkflowMenuMapping>
): Promise<WorkflowMenuMapping> {
  const response = await apiClient.put<WorkflowMenuMapping>(
    `/menu-config/workflow-mappings/${id}`,
    data
  );
  return response.data;
}

async function deleteWorkflowMapping(id: number): Promise<void> {
  await apiClient.delete(`/menu-config/workflow-mappings/${id}`);
}

async function fetchMenuTemplates(
  page: number,
  templateType?: string,
  entityCode?: string
): Promise<MenuTemplateListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: PAGE_SIZE.toString(),
  });
  if (templateType && templateType !== 'all') {
    params.append('template_type', templateType);
  }
  if (entityCode && entityCode !== 'all') {
    params.append('entity_code', entityCode);
  }
  const response = await apiClient.get<MenuTemplateListResponse>(
    `/menu-config/templates?${params}`
  );
  return response.data;
}

async function fetchTemplateEntityCodes(): Promise<string[]> {
  const response = await apiClient.get<string[]>('/menu-config/templates/entity-codes');
  return response.data;
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function MenuConfigPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'workflow-mappings');

  // Sync tab state with URL parameter
  useEffect(() => {
    if (tabParam && (tabParam === 'templates' || tabParam === 'workflow-mappings')) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Menu className="h-8 w-8" />
            Configuration des Menus
          </h1>
          <p className="text-muted-foreground mt-2">
            Configurer les menus dynamiques et mappings workflow
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workflow-mappings" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Mappings Workflow
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Templates Menu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflow-mappings" className="mt-6">
          <WorkflowMappingsTab />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <MenuTemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =============================================================================
// WORKFLOW MAPPINGS TAB
// =============================================================================

function WorkflowMappingsTab() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<WorkflowMenuMapping | null>(null);
  // Selection state for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['workflow-mappings', currentPage, activeFilter],
    queryFn: () => fetchWorkflowMappings(
      currentPage,
      activeFilter === 'all' ? undefined : activeFilter === 'active'
    ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WorkflowMenuMapping> }) =>
      updateWorkflowMapping(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-mappings'] });
      toast.success('Mapping mis à jour');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur de mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkflowMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-mappings'] });
      toast.success('Mapping supprimé');
      setIsDeleteDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur de suppression');
    },
  });

  // Batch update mutation (activate/deactivate multiple)
  const batchUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }: { ids: number[]; data: Partial<WorkflowMenuMapping> }) => {
      await Promise.all(ids.map(id => updateWorkflowMapping(id, data)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-mappings'] });
      toast.success(`${selectedIds.size} mapping(s) mis à jour`);
      setSelectedIds(new Set());
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur de mise à jour batch');
    },
  });

  // Batch delete mutation
  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => deleteWorkflowMapping(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-mappings'] });
      toast.success(`${selectedIds.size} mapping(s) supprimé(s)`);
      setSelectedIds(new Set());
      setIsBatchDeleteDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur de suppression batch');
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  // Clear selection when page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage]);

  const filteredMappings = data?.items?.filter((mapping) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      mapping.workflow_pattern.toLowerCase().includes(query) ||
      mapping.menu_group_id.toLowerCase().includes(query) ||
      mapping.menu_title_key.toLowerCase().includes(query)
    );
  }) || [];

  const handleToggleActive = async (mapping: WorkflowMenuMapping) => {
    updateMutation.mutate({
      id: mapping.id,
      data: { is_active: !mapping.is_active },
    });
  };

  // Selection helpers
  const isAllSelected = filteredMappings.length > 0 &&
    filteredMappings.every(m => selectedIds.has(m.id));
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredMappings.map(m => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBatchActivate = () => {
    batchUpdateMutation.mutate({ ids: Array.from(selectedIds), data: { is_active: true } });
  };

  const handleBatchDeactivate = () => {
    batchUpdateMutation.mutate({ ids: Array.from(selectedIds), data: { is_active: false } });
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
            <CardTitle className="text-sm font-medium">Total Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data?.items?.filter(m => m.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {data?.items?.filter(m => !m.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mappings Workflow → Menu</CardTitle>
              <CardDescription>
                Règles de génération automatique des menus depuis les codes workflow
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button size="sm" asChild>
                <Link href={`/${locale}/dashboard/admin/workflow-mappings/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Mapping
                </Link>
              </Button>
            </div>
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
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Batch Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 p-3 mb-4 bg-muted/50 border rounded-lg">
              <span className="text-sm font-medium">
                {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
              </span>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                onClick={handleBatchActivate}
                disabled={batchUpdateMutation.isPending}
              >
                {batchUpdateMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                <Check className="mr-1 h-3 w-3" />
                Activer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBatchDeactivate}
                disabled={batchUpdateMutation.isPending}
              >
                {batchUpdateMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                <X className="mr-1 h-3 w-3" />
                Désactiver
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsBatchDeleteDialogOpen(true)}
                disabled={batchDeleteMutation.isPending}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Supprimer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
              >
                Annuler
              </Button>
            </div>
          )}

          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Sélectionner tout"
                      className={isSomeSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                    />
                  </TableHead>
                  <TableHead>Pattern Workflow</TableHead>
                  <TableHead>ID Menu</TableHead>
                  <TableHead>Icône</TableHead>
                  <TableHead className="hidden md:table-cell">Options</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Aucun mapping trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMappings.map((mapping) => (
                    <TableRow key={mapping.id} data-state={selectedIds.has(mapping.id) ? 'selected' : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(mapping.id)}
                          onCheckedChange={(checked) => handleSelectOne(mapping.id, !!checked)}
                          aria-label={`Sélectionner ${mapping.workflow_pattern}`}
                        />
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {mapping.workflow_pattern}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{mapping.menu_group_id}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{mapping.menu_icon}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {mapping.include_pending && <Badge variant="secondary" className="text-xs">Pending</Badge>}
                          {mapping.include_validation && <Badge variant="secondary" className="text-xs">Valid</Badge>}
                          {mapping.include_appointments && <Badge variant="secondary" className="text-xs">RDV</Badge>}
                          {mapping.include_history && <Badge variant="secondary" className="text-xs">History</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={mapping.is_active}
                          onCheckedChange={() => handleToggleActive(mapping)}
                          disabled={updateMutation.isPending}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/${locale}/dashboard/admin/workflow-mappings/${mapping.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setSelectedMapping(mapping);
                              setIsDeleteDialogOpen(true);
                            }}
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

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {data.page} sur {data.pages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(data.pages, prev + 1))}
                  disabled={currentPage >= data.pages}
                >
                  <ChevronRight className="h-4 w-4" />
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
            <AlertDialogTitle>Supprimer le Mapping ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le mapping &quot;{selectedMapping?.workflow_pattern}&quot; ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedMapping && deleteMutation.mutate(selectedMapping.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Dialog */}
      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selectedIds.size} Mapping(s) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer les {selectedIds.size} mappings sélectionnés ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => batchDeleteMutation.mutate(Array.from(selectedIds))}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {batchDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer {selectedIds.size} mapping(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// =============================================================================
// MENU TEMPLATES TAB
// =============================================================================

function MenuTemplatesTab() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: string; code: string } | null>(null);
  // Selection state for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['menu-templates', currentPage, typeFilter, entityFilter],
    queryFn: () => fetchMenuTemplates(currentPage, typeFilter, entityFilter),
  });

  // Fetch distinct entity codes for filter dropdown
  const { data: entityCodes = [] } = useQuery({
    queryKey: ['menu-templates-entity-codes'],
    queryFn: fetchTemplateEntityCodes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/menu-config/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-templates'] });
      toast.success('Template supprimé');
      setIsDeleteDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur de suppression');
    },
  });

  // Batch delete mutation
  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => apiClient.delete(`/menu-config/templates/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-templates'] });
      toast.success(`${selectedIds.size} template(s) supprimé(s)`);
      setSelectedIds(new Set());
      setIsBatchDeleteDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur de suppression batch');
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, entityFilter]);

  // Clear selection when page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage]);

  // Client-side search filter
  const templates = (data?.items || []).filter((template) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.code.toLowerCase().includes(query) ||
      template.name.toLowerCase().includes(query) ||
      (template.description?.toLowerCase().includes(query) ?? false)
    );
  });

  // Selection helpers
  const isAllSelected = templates.length > 0 &&
    templates.every(t => selectedIds.has(t.id));
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(templates.map(t => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
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
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Type Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data?.items?.filter(t => t.template_type === 'workflow').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Type Module</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data?.items?.filter(t => t.template_type === 'module').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Templates de Menu</CardTitle>
              <CardDescription>
                Configurations de menu réutilisables pour différents types d&apos;agents
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button size="sm" asChild>
                <Link href={`/${locale}/dashboard/admin/menu-templates/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Template
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code, nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
                <SelectItem value="module">Module</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Entité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes entités</SelectItem>
                {entityCodes.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Batch Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 p-3 mb-4 bg-muted/50 border rounded-lg">
              <span className="text-sm font-medium">
                {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
              </span>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsBatchDeleteDialogOpen(true)}
                disabled={batchDeleteMutation.isPending}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Supprimer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
              >
                Annuler
              </Button>
            </div>
          )}

          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Sélectionner tout"
                      className={isSomeSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                    />
                  </TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Entité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Aucun template trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id} data-state={selectedIds.has(template.id) ? 'selected' : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(template.id)}
                          onCheckedChange={(checked) => handleSelectOne(template.id, !!checked)}
                          aria-label={`Sélectionner ${template.code}`}
                        />
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {template.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          {template.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {template.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            template.template_type === 'workflow'
                              ? 'default'
                              : template.template_type === 'module'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {template.template_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {template.entity_code || (
                          <span className="text-muted-foreground">Global</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {template.is_active ? (
                          <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                            <Check className="h-3 w-3" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-muted-foreground">
                            <X className="h-3 w-3" />
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/${locale}/dashboard/admin/menu-templates/${template.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setSelectedTemplate({ id: template.id, code: template.code });
                              setIsDeleteDialogOpen(true);
                            }}
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

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {data.page} sur {data.pages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(data.pages, prev + 1))}
                  disabled={currentPage >= data.pages}
                >
                  <ChevronRight className="h-4 w-4" />
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
            <AlertDialogTitle>Supprimer le Template ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le template &quot;{selectedTemplate?.code}&quot; ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTemplate && deleteMutation.mutate(selectedTemplate.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Dialog */}
      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selectedIds.size} Template(s) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer les {selectedIds.size} templates sélectionnés ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => batchDeleteMutation.mutate(Array.from(selectedIds))}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {batchDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer {selectedIds.size} template(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
