'use client';

/**
 * Display Configuration Admin Page
 * Manage workflow display configurations (columns and sections per workflow)
 *
 * @module dashboard/admin/menu-config/display
 * @date 2026-02-01
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  LayoutGrid,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Columns,
  Rows,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  useDisplayConfigOperations,
  useAllAvailableColumns,
  FALLBACK_SYSTEM_COLUMNS,
  AVAILABLE_SECTIONS,
} from '@/modules/admin/hooks';
import type { AvailableColumn } from '@/modules/admin/services/menuConfigService';
import type {
  DisplayConfig,
  DisplayConfigCreateRequest,
} from '@/modules/admin/services/menuConfigService';

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function DisplayConfigPage() {
  const t = useTranslations('admin.menuConfig.displayConfig');
  const locale = useLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<DisplayConfig | null>(null);

  const {
    configs,
    total,
    pages,
    isLoading,
    isError,
    error,
    refetch,
    createConfigAsync,
    updateConfigAsync,
    deleteConfigAsync,
    isCreating,
    isUpdating,
    isDeleting,
  } = useDisplayConfigOperations({ page: currentPage, page_size: 10 });

  const filteredConfigs = configs.filter((config) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return config.workflow_pattern.toLowerCase().includes(query);
  });

  const handleCreate = async (data: DisplayConfigCreateRequest) => {
    await createConfigAsync(data);
    setIsCreateDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedConfig) return;
    await deleteConfigAsync(selectedConfig.id);
    setIsDeleteDialogOpen(false);
    setSelectedConfig(null);
  };

  const handleToggleActive = async (config: DisplayConfig) => {
    await updateConfigAsync(config.id, { is_active: !config.is_active });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error instanceof Error ? error.message : 'Error loading configurations'}</span>
          </div>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            {t('messages.createError')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/dashboard/admin/menu-config`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <LayoutGrid className="h-8 w-8" />
              {t('title')}
            </h1>
            <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Columns className="h-4 w-4" />
              Colonnes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Dynamique par workflow
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Rows className="h-4 w-4" />
              Sections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{AVAILABLE_SECTIONS.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>{t('subtitle')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('createTitle')}
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
          </div>

          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('pattern')}</TableHead>
                  <TableHead>{t('listColumns')}</TableHead>
                  <TableHead>{t('previewSections')}</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConfigs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {t('noConfigsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {config.workflow_pattern}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                          {config.list_columns.slice(0, 3).map((col) => (
                            <Badge key={col} variant="secondary" className="text-xs">
                              {col}
                            </Badge>
                          ))}
                          {config.list_columns.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{config.list_columns.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                          {config.preview_sections.slice(0, 3).map((sec) => (
                            <Badge key={sec} variant="secondary" className="text-xs">
                              {sec}
                            </Badge>
                          ))}
                          {config.preview_sections.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{config.preview_sections.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={config.is_active}
                          onCheckedChange={() => handleToggleActive(config)}
                          disabled={isUpdating}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/${locale}/dashboard/admin/menu-config/display/${config.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setSelectedConfig(config);
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
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} sur {pages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(pages, prev + 1))}
                  disabled={currentPage >= pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <DisplayConfigFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreate}
        isSubmitting={isCreating}
        mode="create"
      />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDeleteDescription', { pattern: selectedConfig?.workflow_pattern })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// =============================================================================
// CREATE DIALOG COMPONENT
// =============================================================================

interface DisplayConfigFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DisplayConfigCreateRequest) => Promise<void>;
  isSubmitting: boolean;
  mode: 'create';
}

function DisplayConfigFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: DisplayConfigFormDialogProps) {
  const t = useTranslations('admin.menuConfig.displayConfig');
  const [pattern, setPattern] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  // Fetch available columns dynamically based on pattern
  const {
    columns: availableColumns,
    systemColumns,
    extractedColumns,
    defaultSelected,
    totalRequests,
    isLoading: isLoadingColumns,
  } = useAllAvailableColumns(pattern, open && !!pattern);

  useEffect(() => {
    if (open) {
      setPattern('');
      // Use default selected columns from backend
      setSelectedColumns(defaultSelected);
      setSelectedSections(['info', 'extractedData', 'documents', 'contact']);
    }
  }, [open, defaultSelected]);

  // Columns to show: use dynamic if available, fallback otherwise
  const columnsToShow: AvailableColumn[] =
    availableColumns.length > 0
      ? availableColumns
      : FALLBACK_SYSTEM_COLUMNS.map((c) => ({
          id: c.id,
          label_key: `columns.${c.id}`,
          source: 'system' as const,
          data_type: 'string' as const,
          sample_count: 0,
        }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      workflow_pattern: pattern,
      list_columns: selectedColumns,
      preview_sections: selectedSections,
    });
  };

  const toggleColumn = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId) ? prev.filter((c) => c !== columnId) : [...prev, columnId]
    );
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((s) => s !== sectionId) : [...prev, sectionId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('createTitle')}</DialogTitle>
          <DialogDescription>
            {t('createDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pattern */}
          <div className="space-y-2">
              <Label htmlFor="pattern">{t('pattern')}</Label>
              <Input
                id="pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder={t('patternPlaceholder')}
                required
              />
              <p className="text-xs text-muted-foreground">{t('patternDescription')}</p>
            </div>

          {/* Columns */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('listColumns')}</Label>
                <p className="text-xs text-muted-foreground">{t('listColumnsDescription')}</p>
              </div>
              {pattern && (
                <div className="text-xs text-muted-foreground">
                  {isLoadingColumns ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Chargement...
                    </span>
                  ) : (
                    <span>
                      {systemColumns.length} système + {extractedColumns.length} extraites
                      {totalRequests > 0 && ` (${totalRequests} demandes)`}
                    </span>
                  )}
                </div>
              )}
            </div>

            {isLoadingColumns ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* System columns */}
                {systemColumns.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Colonnes système</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {systemColumns.map((col) => (
                        <div key={col.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`col-${col.id}`}
                            checked={selectedColumns.includes(col.id)}
                            onCheckedChange={() => toggleColumn(col.id)}
                          />
                          <label
                            htmlFor={`col-${col.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {t(`columns.${col.id}` as Parameters<typeof t>[0], {
                              defaultValue: col.id,
                            })}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted columns */}
                {extractedColumns.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Colonnes extraites des données
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {extractedColumns.map((col) => (
                        <div key={col.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`col-${col.id}`}
                            checked={selectedColumns.includes(col.id)}
                            onCheckedChange={() => toggleColumn(col.id)}
                          />
                          <label
                            htmlFor={`col-${col.id}`}
                            className="text-sm cursor-pointer flex items-center gap-1"
                          >
                            {t(`columns.${col.id}` as Parameters<typeof t>[0], {
                              defaultValue: col.id,
                            })}
                            <Badge variant="outline" className="text-[10px] px-1">
                              {col.sample_count}
                            </Badge>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback when no pattern entered */}
                {!pattern && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {columnsToShow.map((col) => (
                      <div key={col.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`col-${col.id}`}
                          checked={selectedColumns.includes(col.id)}
                          onCheckedChange={() => toggleColumn(col.id)}
                        />
                        <label htmlFor={`col-${col.id}`} className="text-sm cursor-pointer">
                          {t(`columns.${col.id}` as Parameters<typeof t>[0], {
                            defaultValue: col.id,
                          })}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sections */}
          <div className="space-y-3">
            <div>
              <Label>{t('previewSections')}</Label>
              <p className="text-xs text-muted-foreground">{t('previewSectionsDescription')}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AVAILABLE_SECTIONS.map((sec) => (
                <div key={sec.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sec-${sec.id}`}
                    checked={selectedSections.includes(sec.id)}
                    onCheckedChange={() => toggleSection(sec.id)}
                  />
                  <label
                    htmlFor={`sec-${sec.id}`}
                    className="text-sm cursor-pointer"
                    title={sec.description}
                  >
                    {t(`sections.${sec.id}` as Parameters<typeof t>[0], { defaultValue: sec.label })}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
