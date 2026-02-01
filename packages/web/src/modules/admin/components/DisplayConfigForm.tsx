'use client';

/**
 * Display Configuration Form Component
 * Reusable form for creating/editing workflow display configurations
 *
 * Features:
 * - Checkbox toggle for column selection
 * - Real drag & drop reordering with @dnd-kit
 * - Arrow buttons as alternative for reordering
 * - Section checkboxes
 * - Live preview panel
 *
 * @module admin/components
 * @date 2026-02-01
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Search,
  X,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Eye,
  Columns,
  Layers,
} from 'lucide-react';
import {
  useAllAvailableColumns,
  FALLBACK_SYSTEM_COLUMNS,
  AVAILABLE_SECTIONS,
  DEFAULT_SELECTED_COLUMNS,
} from '@/modules/admin/hooks';
// AvailableColumn type used internally by hooks

// =============================================================================
// HELPER: Humanize column ID for display
// =============================================================================

function humanizeColumnId(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// =============================================================================
// TYPES
// =============================================================================

export interface DisplayConfigFormData {
  workflow_pattern: string;
  list_columns: string[];
  preview_sections: string[];
}

export interface DisplayConfigFormProps {
  initialData?: DisplayConfigFormData;
  patternEditable?: boolean;
  onSubmit: (data: DisplayConfigFormData) => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
}

// =============================================================================
// SORTABLE COLUMN ITEM COMPONENT
// =============================================================================

interface SortableColumnItemProps {
  id: string;
  label: string;
  index: number;
  totalCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

function SortableColumnItem({
  id,
  label,
  index,
  totalCount,
  onMoveUp,
  onMoveDown,
  onRemove,
}: SortableColumnItemProps) {
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
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-md border bg-card ${
        isDragging ? 'shadow-lg ring-2 ring-primary' : ''
      }`}
    >
      {/* Drag Handle - FUNCTIONAL */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Label */}
      <span className="flex-1 text-sm truncate">{label}</span>

      {/* Arrow Controls */}
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveUp}
          disabled={index === 0}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveDown}
          disabled={index === totalCount - 1}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DisplayConfigForm({
  initialData,
  patternEditable = true,
  onSubmit,
  onDirtyChange,
  isSubmitting = false,
  mode = 'create',
}: DisplayConfigFormProps) {
  const t = useTranslations('admin.menuConfig.displayConfig');

  // Local state
  const [pattern, setPattern] = useState(initialData?.workflow_pattern ?? '');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    initialData?.list_columns ?? [...DEFAULT_SELECTED_COLUMNS]
  );
  const [selectedSections, setSelectedSections] = useState<string[]>(
    initialData?.preview_sections ?? ['info', 'extractedData', 'documents', 'contact']
  );
  const [columnSearch, setColumnSearch] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch available columns dynamically when pattern is entered
  const shouldFetchColumns = !!pattern && pattern.length >= 3;
  const {
    systemColumns,
    extractedColumns,
    totalRequests,
    isLoading: isLoadingColumns,
  } = useAllAvailableColumns(pattern, shouldFetchColumns);

  // Reset state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setPattern(initialData.workflow_pattern);
      setSelectedColumns(initialData.list_columns);
      setSelectedSections(initialData.preview_sections);
      setIsDirty(false);
    }
  }, [initialData]);

  // Track dirty state
  useEffect(() => {
    if (!initialData) {
      setIsDirty(pattern.length > 0);
    } else {
      const columnsChanged =
        JSON.stringify(selectedColumns) !== JSON.stringify(initialData.list_columns);
      const sectionsChanged =
        JSON.stringify(selectedSections) !== JSON.stringify(initialData.preview_sections);
      setIsDirty(columnsChanged || sectionsChanged);
    }
  }, [pattern, selectedColumns, selectedSections, initialData]);

  // Notify parent of dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Note: availableColumns was removed as it was unused
  // We use filteredSystemColumns and filteredExtractedColumns directly

  // Filter columns by search
  const filteredSystemColumns = useMemo(() => {
    const cols = systemColumns.length > 0 ? systemColumns : FALLBACK_SYSTEM_COLUMNS.map((c) => ({
      id: c.id,
      label_key: `columns.${c.id}`,
      source: 'system' as const,
      data_type: 'string' as const,
      sample_count: 0,
    }));

    if (!columnSearch) return cols;

    return cols.filter((col) => {
      const label = t(`columns.${col.id}` as Parameters<typeof t>[0], {
        defaultValue: humanizeColumnId(col.id),
      });
      return (
        col.id.toLowerCase().includes(columnSearch.toLowerCase()) ||
        label.toLowerCase().includes(columnSearch.toLowerCase())
      );
    });
  }, [systemColumns, columnSearch, t]);

  const filteredExtractedColumns = useMemo(() => {
    if (!columnSearch) return extractedColumns;

    return extractedColumns.filter((col) => {
      const label = t(`columns.${col.id}` as Parameters<typeof t>[0], {
        defaultValue: humanizeColumnId(col.id),
      });
      return (
        col.id.toLowerCase().includes(columnSearch.toLowerCase()) ||
        label.toLowerCase().includes(columnSearch.toLowerCase())
      );
    });
  }, [extractedColumns, columnSearch, t]);

  // Handlers
  const toggleColumn = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((c) => c !== columnId)
        : [...prev, columnId]
    );
  };

  const removeColumn = (columnId: string) => {
    setSelectedColumns((prev) => prev.filter((c) => c !== columnId));
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedColumns.length) return;
    setSelectedColumns((items) => arrayMove(items, index, newIndex));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedColumns((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((s) => s !== sectionId) : [...prev, sectionId]
    );
  };

  const handleSubmit = async () => {
    await onSubmit({
      workflow_pattern: pattern,
      list_columns: selectedColumns,
      preview_sections: selectedSections,
    });
  };

  const getColumnLabel = (colId: string) => {
    return t(`columns.${colId}` as Parameters<typeof t>[0], {
      defaultValue: humanizeColumnId(colId),
    });
  };

  const isValid = pattern.length >= 3 && selectedColumns.length > 0;

  return (
    <div className="space-y-6">
      {/* Pattern Input */}
      {patternEditable && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('pattern')}</CardTitle>
            <CardDescription>{t('patternDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value.toUpperCase())}
                  placeholder={t('patternPlaceholder')}
                  className="font-mono"
                />
              </div>
              {pattern && (
                <div className="text-sm text-muted-foreground">
                  {isLoadingColumns ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t('loadingColumns')}
                    </span>
                  ) : (
                    <span>
                      {totalRequests > 0
                        ? `${totalRequests} demandes trouvées`
                        : 'Aucune demande existante'}
                    </span>
                  )}
                </div>
              )}
            </div>
            {!pattern && (
              <p className="text-xs text-muted-foreground mt-2">
                Exemples: PASAPORTE_%, RESIDENCIA_%, CONDUCIR_%, VEHICULO_%
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content - 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Available Columns (Checkboxes) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Columns className="h-4 w-4" />
              {t('availableColumns')}
            </CardTitle>
            <CardDescription>
              {isLoadingColumns ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('loadingColumns')}
                </span>
              ) : (
                <>
                  {filteredSystemColumns.length} système
                  {extractedColumns.length > 0 && ` + ${extractedColumns.length} extraites`}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchColumns')}
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Column Checkboxes */}
            <div className="max-h-[400px] overflow-y-auto space-y-4">
              {isLoadingColumns ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* System Columns */}
                  {filteredSystemColumns.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Colonnes Système
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredSystemColumns.map((col) => (
                          <div key={col.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`col-${col.id}`}
                              checked={selectedColumns.includes(col.id)}
                              onCheckedChange={() => toggleColumn(col.id)}
                            />
                            <label
                              htmlFor={`col-${col.id}`}
                              className="text-sm cursor-pointer truncate"
                            >
                              {getColumnLabel(col.id)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Columns */}
                  {filteredExtractedColumns.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Colonnes Extraites ({totalRequests} demandes)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredExtractedColumns.map((col) => (
                          <div key={col.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`col-${col.id}`}
                              checked={selectedColumns.includes(col.id)}
                              onCheckedChange={() => toggleColumn(col.id)}
                            />
                            <label
                              htmlFor={`col-${col.id}`}
                              className="text-sm cursor-pointer truncate flex items-center gap-1"
                            >
                              {getColumnLabel(col.id)}
                              <Badge variant="outline" className="text-[10px] px-1">
                                {col.sample_count}
                              </Badge>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No results */}
                  {filteredSystemColumns.length === 0 && filteredExtractedColumns.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('noColumnsMatchSearch')}
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Selected Columns (Sortable) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              {t('selectedColumns')}
              <Badge variant="secondary">{selectedColumns.length}</Badge>
            </CardTitle>
            <CardDescription>{t('selectedColumnsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedColumns}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {selectedColumns.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t('noColumnsSelected')}
                    </p>
                  ) : (
                    selectedColumns.map((colId, index) => (
                      <SortableColumnItem
                        key={colId}
                        id={colId}
                        label={getColumnLabel(colId)}
                        index={index}
                        totalCount={selectedColumns.length}
                        onMoveUp={() => moveColumn(index, 'up')}
                        onMoveDown={() => moveColumn(index, 'down')}
                        onRemove={() => removeColumn(colId)}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        {/* Bottom Left: Sections */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              {t('previewSections')}
              <Badge variant="secondary">{selectedSections.length}</Badge>
            </CardTitle>
            <CardDescription>{t('previewSectionsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
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
                    {t(`sections.${sec.id}` as Parameters<typeof t>[0], {
                      defaultValue: sec.label,
                    })}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Right: Preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t('preview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-4 bg-muted/30">
              {/* Preview Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-sm">REF-2026-00142</p>
                  <p className="text-xs text-muted-foreground">Juan Carlos García López</p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-[10px]">
                    Normal
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    En revisión
                  </Badge>
                </div>
              </div>
              <Separator className="my-2" />

              {/* Preview Columns */}
              <div className="space-y-1">
                {selectedColumns.slice(0, 5).map((colId) => (
                  <div key={colId} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate max-w-[120px]">
                      {getColumnLabel(colId)}
                    </span>
                    <span className="font-medium">—</span>
                  </div>
                ))}
                {selectedColumns.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{selectedColumns.length - 5} {t('moreColumns')}
                  </p>
                )}
              </div>
              <Separator className="my-2" />

              {/* Preview Sections */}
              <div className="flex flex-wrap gap-1">
                {selectedSections.map((secId) => (
                  <Badge key={secId} variant="outline" className="text-[10px]">
                    {t(`sections.${secId}` as Parameters<typeof t>[0], { defaultValue: secId })}
                  </Badge>
                ))}
                {selectedSections.length === 0 && (
                  <span className="text-xs text-muted-foreground">Aucune section</span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full mt-4"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? t('actions.create') : t('actions.save')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DisplayConfigForm;
