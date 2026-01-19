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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  templateType?: string
): Promise<MenuTemplateListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: PAGE_SIZE.toString(),
  });
  if (templateType && templateType !== 'all') {
    params.append('template_type', templateType);
  }
  const response = await apiClient.get<MenuTemplateListResponse>(
    `/menu-config/templates?${params}`
  );
  return response.data;
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function MenuConfigPage() {
  const [activeTab, setActiveTab] = useState('workflow-mappings');

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
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<WorkflowMenuMapping | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
      setIsEditDialogOpen(false);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

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
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
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

          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aucun mapping trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMappings.map((mapping) => (
                    <TableRow key={mapping.id}>
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
                            onClick={() => {
                              setSelectedMapping(mapping);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
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

      {/* Edit Dialog */}
      <EditMappingDialog
        mapping={selectedMapping}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={(data) => {
          if (selectedMapping) {
            updateMutation.mutate({ id: selectedMapping.id, data });
          }
        }}
        isPending={updateMutation.isPending}
      />

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
    </div>
  );
}

// =============================================================================
// EDIT MAPPING DIALOG
// =============================================================================

function EditMappingDialog({
  mapping,
  open,
  onOpenChange,
  onSave,
  isPending,
}: {
  mapping: WorkflowMenuMapping | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<WorkflowMenuMapping>) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState<Partial<WorkflowMenuMapping>>({});

  useEffect(() => {
    if (mapping) {
      setFormData({
        menu_title_key: mapping.menu_title_key,
        menu_icon: mapping.menu_icon,
        display_order: mapping.display_order,
        include_pending: mapping.include_pending,
        include_validation: mapping.include_validation,
        include_appointments: mapping.include_appointments,
        include_history: mapping.include_history,
      });
    }
  }, [mapping]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le Mapping</DialogTitle>
          <DialogDescription>
            Pattern: {mapping?.workflow_pattern}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title_key">Clé de traduction titre</Label>
            <Input
              id="title_key"
              value={formData.menu_title_key || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, menu_title_key: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon">Icône (Lucide)</Label>
            <Input
              id="icon"
              value={formData.menu_icon || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, menu_icon: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order">Ordre d&apos;affichage</Label>
            <Input
              id="order"
              type="number"
              value={formData.display_order || 0}
              onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
            />
          </div>
          <div className="space-y-3">
            <Label>Sous-menus inclus</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.include_pending}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, include_pending: checked }))}
                />
                <span className="text-sm">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.include_validation}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, include_validation: checked }))}
                />
                <span className="text-sm">Validation</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.include_appointments}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, include_appointments: checked }))}
                />
                <span className="text-sm">RDV</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.include_history}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, include_history: checked }))}
                />
                <span className="text-sm">Historique</span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={() => onSave(formData)} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// MENU TEMPLATES TAB
// =============================================================================

function MenuTemplatesTab() {
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['menu-templates', currentPage, typeFilter],
    queryFn: () => fetchMenuTemplates(currentPage, typeFilter),
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter]);

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
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
                <SelectItem value="module">Module</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Entité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!data?.items || data.items.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aucun template trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((template) => (
                    <TableRow key={template.id}>
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
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
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
    </div>
  );
}
