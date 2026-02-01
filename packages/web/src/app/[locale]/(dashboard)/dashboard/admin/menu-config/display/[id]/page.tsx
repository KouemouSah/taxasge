'use client';

/**
 * Display Config Edit Page - Dedicated full-page editor
 * Features:
 * - P0: Sections configuration (restored)
 * - P1: Centralized translations
 * - P2: Real RequestListItem preview + leave confirmation
 * - P3: Drag & drop with @dnd-kit
 *
 * @module dashboard/admin/menu-config/display/[id]
 * @date 2026-02-01
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  ArrowLeft,
  Save,
  Loader2,
  Search,
  Plus,
  X,
  GripVertical,
  ChevronRight,
  Eye,
  Columns,
  LayoutList,
  AlertCircle,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// DnD Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  useDisplayConfig,
  useUpdateDisplayConfig,
  useAllAvailableColumns,
  AVAILABLE_SECTIONS,
} from '@/modules/admin/hooks/useDisplayConfigs';
import { RequestListItem } from '@/modules/agent-dashboard/components/pending/RequestListItem';
import type { ServiceRequestListItem } from '@/modules/agent-dashboard/services/agent-requests-api';

// =============================================================================
// SAMPLE DATA FOR PREVIEW (realistic mock)
// =============================================================================

const SAMPLE_REQUEST: ServiceRequestListItem = {
  id: 'preview-sample',
  reference: 'REF-2026-00142',
  workflowCode: 'PASAPORTE_ADULTO_EXPEDICION',
  solicitudType: 'expedicion',
  motivo: null,
  status: 'pending_review',
  priority: 'NORMAL',
  citizenName: 'Juan Carlos García López',
  citizenEmail: 'juan.garcia@email.com',
  submittedAt: '2026-02-01T10:30:00Z',
  createdAt: '2026-02-01T09:15:00Z',
  assignedTo: 'agent-001',
  slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  slaStatus: 'on_track',
};

// =============================================================================
// SORTABLE COLUMN ITEM
// =============================================================================

interface SortableColumnItemProps {
  id: string;
  label: string;
  description: string;
  onRemove: () => void;
}

function SortableColumnItem({ id, label, description, onRemove }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors group"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm">{label}</span>
        {description && (
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// =============================================================================
// AVAILABLE COLUMN ITEM
// =============================================================================

interface AvailableColumnItemProps {
  columnId: string;
  label: string;
  description: string;
  sampleCount?: number;
  isSelected: boolean;
  onAdd: () => void;
}

function AvailableColumnItem({
  columnId: _columnId,
  label,
  description,
  sampleCount,
  isSelected,
  onAdd,
}: AvailableColumnItemProps) {
  return (
    <div
      className={`
        flex items-center justify-between p-3 rounded-lg border
        ${isSelected ? 'bg-muted/50 border-muted' : 'bg-card hover:bg-accent/50 border-border cursor-pointer'}
        transition-colors
      `}
      onClick={!isSelected ? onAdd : undefined}
      role={!isSelected ? 'button' : undefined}
      tabIndex={!isSelected ? 0 : undefined}
      onKeyDown={!isSelected ? (e) => e.key === 'Enter' && onAdd() : undefined}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-sm ${isSelected ? 'text-muted-foreground' : ''}`}>
            {label}
          </span>
          {sampleCount !== undefined && sampleCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {sampleCount}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
        )}
      </div>
      {!isSelected && (
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); onAdd(); }}>
          <Plus className="h-4 w-4" />
        </Button>
      )}
      {isSelected && (
        <Badge variant="outline" className="text-xs shrink-0">
          Ajouté
        </Badge>
      )}
    </div>
  );
}

// =============================================================================
// SECTION ITEM
// =============================================================================

interface SectionItemProps {
  id: string;
  label: string;
  description: string;
  isSelected: boolean;
  onToggle: () => void;
}

function SectionItem({ id, label, description, isSelected, onToggle }: SectionItemProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 cursor-pointer transition-colors"
      onClick={onToggle}
    >
      <Checkbox
        id={`section-${id}`}
        checked={isSelected}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1">
        <label htmlFor={`section-${id}`} className="font-medium text-sm cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function DisplayConfigEditPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('admin.menuConfig.displayConfig');

  const configId = parseInt(params.id as string, 10);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [systemCollapsed, setSystemCollapsed] = useState(false);
  const [extractedCollapsed, setExtractedCollapsed] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch config
  const { data: config, isLoading: isLoadingConfig, isError } = useDisplayConfig(configId);

  // Fetch available columns
  const {
    systemColumns,
    extractedColumns,
    isLoading: isLoadingColumns,
  } = useAllAvailableColumns(config?.workflow_pattern || '', !!config?.workflow_pattern);

  // Update mutation
  const updateMutation = useUpdateDisplayConfig();

  // Initialize state from config
  useEffect(() => {
    if (config) {
      setSelectedColumns(config.list_columns);
      setSelectedSections(config.preview_sections);
      setHasChanges(false);
    }
  }, [config]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Get column label from translations
  const getColumnLabel = useCallback((columnId: string): string => {
    const key = `columns.${columnId}` as Parameters<typeof t>[0];
    const translated = t(key, { defaultValue: '' });
    return translated || columnId;
  }, [t]);

  // Get column description (simplified)
  const getColumnDescription = useCallback((_columnId: string): string => {
    // For now, return empty - could be extended with descriptions
    return '';
  }, []);

  // Get section label from translations
  const getSectionLabel = useCallback((sectionId: string): string => {
    const key = `sections.${sectionId}` as Parameters<typeof t>[0];
    const translated = t(key, { defaultValue: '' });
    return translated || sectionId;
  }, [t]);

  // Get section description from translations
  const getSectionDescription = useCallback((sectionId: string): string => {
    const key = `sectionDescriptions.${sectionId}` as Parameters<typeof t>[0];
    const translated = t(key, { defaultValue: '' });
    return translated || '';
  }, [t]);

  // Filter columns by search
  const filteredSystemColumns = useMemo(() => {
    if (!searchQuery) return systemColumns;
    const query = searchQuery.toLowerCase();
    return systemColumns.filter((col) => {
      const label = getColumnLabel(col.id).toLowerCase();
      return label.includes(query) || col.id.toLowerCase().includes(query);
    });
  }, [systemColumns, searchQuery, getColumnLabel]);

  const filteredExtractedColumns = useMemo(() => {
    if (!searchQuery) return extractedColumns;
    const query = searchQuery.toLowerCase();
    return extractedColumns.filter((col) => {
      const label = getColumnLabel(col.id).toLowerCase();
      return label.includes(query) || col.id.toLowerCase().includes(query);
    });
  }, [extractedColumns, searchQuery, getColumnLabel]);

  // Column actions
  const addColumn = useCallback((columnId: string) => {
    setSelectedColumns((prev) => {
      if (prev.includes(columnId)) return prev;
      return [...prev, columnId];
    });
    setHasChanges(true);
  }, []);

  const removeColumn = useCallback((columnId: string) => {
    setSelectedColumns((prev) => prev.filter((c) => c !== columnId));
    setHasChanges(true);
  }, []);

  // Section actions
  const toggleSection = useCallback((sectionId: string) => {
    setSelectedSections((prev) => {
      if (prev.includes(sectionId)) {
        return prev.filter((s) => s !== sectionId);
      }
      return [...prev, sectionId];
    });
    setHasChanges(true);
  }, []);

  // Handle drag end for reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedColumns((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  }, []);

  // Handle back navigation with confirmation
  const handleBack = useCallback(() => {
    if (hasChanges) {
      setPendingNavigation(`/${locale}/dashboard/admin/menu-config/display`);
      setShowLeaveDialog(true);
    } else {
      window.location.href = `/${locale}/dashboard/admin/menu-config/display`;
    }
  }, [hasChanges, locale]);

  const confirmLeave = useCallback(() => {
    if (pendingNavigation) {
      window.location.href = pendingNavigation;
    }
    setShowLeaveDialog(false);
  }, [pendingNavigation]);

  // Save handler
  const handleSave = async () => {
    if (!config) return;

    try {
      await updateMutation.mutateAsync({
        id: config.id,
        data: {
          list_columns: selectedColumns,
          preview_sections: selectedSections,
        },
      });
      setHasChanges(false);
      toast.success(t('editPage.saved'));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  // Loading state
  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (isError || !config) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{t('editPage.configNotFound')}</p>
        <Button variant="outline" asChild>
          <Link href={`/${locale}/dashboard/admin/menu-config/display`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('editPage.back')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <LayoutList className="h-6 w-6" />
              {t('editPage.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              <code className="bg-muted px-2 py-0.5 rounded text-sm">
                {config.workflow_pattern}
              </code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              {t('editPage.unsavedChanges')}
            </Badge>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t('editPage.save')}
          </Button>
        </div>
      </div>

      {/* Main content - Three panels */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left Panel - Available Columns (4 cols) */}
        <Card className="col-span-4 flex flex-col min-h-0">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Columns className="h-4 w-4" />
              {t('editPage.availableColumns')}
            </CardTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('editPage.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-4 pb-4">
              <div className="space-y-3">
                {/* System Columns */}
                <Collapsible open={!systemCollapsed} onOpenChange={(open) => setSystemCollapsed(!open)}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight className={`h-4 w-4 transition-transform ${!systemCollapsed ? 'rotate-90' : ''}`} />
                    {t('editPage.systemColumns')}
                    <Badge variant="outline" className="ml-auto text-xs">
                      {filteredSystemColumns.length}
                    </Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {isLoadingColumns ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredSystemColumns.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t('editPage.noColumnsFound')}
                      </p>
                    ) : (
                      filteredSystemColumns.map((col) => (
                        <AvailableColumnItem
                          key={col.id}
                          columnId={col.id}
                          label={getColumnLabel(col.id)}
                          description={getColumnDescription(col.id)}
                          sampleCount={col.sample_count}
                          isSelected={selectedColumns.includes(col.id)}
                          onAdd={() => addColumn(col.id)}
                        />
                      ))
                    )}
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Extracted Columns */}
                <Collapsible open={!extractedCollapsed} onOpenChange={(open) => setExtractedCollapsed(!open)}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight className={`h-4 w-4 transition-transform ${!extractedCollapsed ? 'rotate-90' : ''}`} />
                    {t('editPage.extractedColumns')}
                    <Badge variant="outline" className="ml-auto text-xs">
                      {filteredExtractedColumns.length}
                    </Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {isLoadingColumns ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredExtractedColumns.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t('editPage.noColumnsFound')}
                      </p>
                    ) : (
                      filteredExtractedColumns.map((col) => (
                        <AvailableColumnItem
                          key={col.id}
                          columnId={col.id}
                          label={getColumnLabel(col.id)}
                          description={getColumnDescription(col.id)}
                          sampleCount={col.sample_count}
                          isSelected={selectedColumns.includes(col.id)}
                          onAdd={() => addColumn(col.id)}
                        />
                      ))
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Middle Panel - Selected Columns with DnD (4 cols) */}
        <Card className="col-span-4 flex flex-col min-h-0">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <LayoutList className="h-4 w-4" />
                {t('editPage.selectedColumns')}
              </span>
              <Badge variant="secondary">{selectedColumns.length}</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('editPage.reorderHint')}
            </p>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-4 pb-4">
              {selectedColumns.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Columns className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">{t('editPage.noColumnsSelected')}</p>
                  <p className="text-xs">{t('editPage.addColumnHint')}</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={selectedColumns} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {selectedColumns.map((columnId) => (
                        <SortableColumnItem
                          key={columnId}
                          id={columnId}
                          label={getColumnLabel(columnId)}
                          description={getColumnDescription(columnId)}
                          onRemove={() => removeColumn(columnId)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Panel - Sections + Preview (4 cols) */}
        <div className="col-span-4 flex flex-col gap-4 min-h-0">
          {/* P0: Sections Configuration */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  {t('editPage.sectionsTitle')}
                </span>
                <Badge variant="secondary">{selectedSections.length}</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t('editPage.sectionsDescription')}
              </p>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-4 pb-4">
                <div className="space-y-2">
                  {AVAILABLE_SECTIONS.map((section) => (
                    <SectionItem
                      key={section.id}
                      id={section.id}
                      label={getSectionLabel(section.id)}
                      description={getSectionDescription(section.id)}
                      isSelected={selectedSections.includes(section.id)}
                      onToggle={() => toggleSection(section.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* P2: Preview using real RequestListItem */}
          <Card className="shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {t('editPage.preview')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t('editPage.previewDescription')}
              </p>
            </CardHeader>
            <CardContent>
              {selectedColumns.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-muted-foreground text-sm border rounded-lg">
                  {t('editPage.previewEmpty')}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <RequestListItem
                    item={SAMPLE_REQUEST}
                    isSelected={false}
                    onClick={() => {}}
                    displayColumns={selectedColumns}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* P2: Leave confirmation dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('editPage.leaveConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('editPage.leaveConfirmMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('editPage.leaveConfirmCancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('editPage.leaveConfirmLeave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
