'use client';

/**
 * Menu Configuration Admin Page
 * Manage workflow menu mappings (auto-generation rules)
 *
 * @module dashboard/admin/menu-config
 * @date 2026-01-19
 * @updated 2026-01-31 - Removed unused menu_templates tab
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/core/api/client';
import type {
  WorkflowMenuMapping,
  WorkflowMenuMappingListResponse,
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


// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function MenuConfigPage() {
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
            Configurer les règles de génération automatique des menus agent
          </p>
        </div>
      </div>

      {/* Workflow Mappings */}
      <WorkflowMappingsTab />
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

