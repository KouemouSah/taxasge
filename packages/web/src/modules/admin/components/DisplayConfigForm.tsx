'use client';

/**
 * Display Configuration Form Component
 * Reusable form for creating/editing workflow display configurations
 *
 * Features:
 * - Dropdown selection of workflow codes (grouped by category)
 * - Checkbox toggle for column selection
 * - Real drag & drop reordering with @dnd-kit
 * - Arrow buttons as alternative for reordering
 * - Section checkboxes
 * - Live preview panel with REAL DATA from sample request
 *
 * @module admin/components
 * @date 2026-02-01
 * @updated 2026-02-02 - Refactored to use workflow_code exact match instead of pattern
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  FileText,
  User,
  File,
  Phone,
  Calendar,
  CreditCard,
  Clock,
  History,
  Database,
} from 'lucide-react';
import {
  useAllAvailableColumns,
  useWorkflowCodesGrouped,
  useSampleRequest,
  FALLBACK_SYSTEM_COLUMNS,
  AVAILABLE_SECTIONS,
  DEFAULT_SELECTED_COLUMNS,
} from '@/modules/admin/hooks';
import type { SampleRequest } from '@/modules/admin/hooks';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * System column IDs (not extracted from form_data)
 * Used to separate system columns from extracted columns
 */
const SYSTEM_COLUMN_IDS = [
  'reference',
  'fullName',
  'citizenName',
  'status',
  'priority',
  'createdAt',
  'submittedAt',
  'slaDeadline',
  'slaStatus',
  'solicitudType',
  'motivo',
  'workflowCode',
  'workflowLabel',
  'assignedTo',
  'assignedAgent',
  'entityCode',
  'totalAmount',
  'paymentStatus',
];

/**
 * Section icons mapping
 */
const SECTION_ICONS: Record<string, React.ReactNode> = {
  info: <FileText className="h-4 w-4" />,
  extractedData: <User className="h-4 w-4" />,
  documents: <File className="h-4 w-4" />,
  contact: <Phone className="h-4 w-4" />,
  appointment: <Calendar className="h-4 w-4" />,
  paymentDetails: <CreditCard className="h-4 w-4" />,
  timeline: <Clock className="h-4 w-4" />,
  history: <History className="h-4 w-4" />,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Humanize column ID for display
 */
function humanizeColumnId(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Extract value from sample request data
 * Checks both form_data and extracted_data
 */
function getSampleValue(
  sampleRequest: SampleRequest | null | undefined,
  fieldId: string
): string | null {
  if (!sampleRequest) return null;

  // Check form_data first
  if (sampleRequest.form_data && fieldId in sampleRequest.form_data) {
    const value = sampleRequest.form_data[fieldId];
    if (value !== null && value !== undefined) {
      return String(value);
    }
  }

  // Then check extracted_data
  if (sampleRequest.extracted_data && fieldId in sampleRequest.extracted_data) {
    const value = sampleRequest.extracted_data[fieldId];
    if (value !== null && value !== undefined) {
      return String(value);
    }
  }

  return null;
}

// =============================================================================
// TYPES
// =============================================================================

export interface DisplayConfigFormData {
  workflow_code: string;
  list_columns: string[];
  preview_sections: string[];
}

export interface DisplayConfigFormProps {
  initialData?: DisplayConfigFormData;
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
  onSubmit,
  onDirtyChange,
  isSubmitting = false,
  mode = 'create',
}: DisplayConfigFormProps) {
  const t = useTranslations('admin.menuConfig.displayConfig');

  // Local state
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>(
    initialData?.workflow_code ?? ''
  );
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

  // Hook for workflow list (dropdown)
  const {
    grouped: workflowGroups,
    categories: workflowCategories,
    isLoading: workflowsLoading,
    isError: workflowsError,
  } = useWorkflowCodesGrouped();

  // Hook for sample request (preview with real data)
  const {
    data: sampleRequest,
    isLoading: sampleLoading,
  } = useSampleRequest(selectedWorkflow || undefined);

  // Fetch available columns dynamically when workflow is selected
  const shouldFetchColumns = !!selectedWorkflow && selectedWorkflow.length > 0;
  const {
    systemColumns,
    extractedColumns,
    nestedColumns,
    totalRequests,
    isLoading: isLoadingColumns,
  } = useAllAvailableColumns(selectedWorkflow, shouldFetchColumns);

  // State for collapsible nested columns section
  const [isNestedExpanded, setIsNestedExpanded] = useState(false);

  // Reset state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setSelectedWorkflow(initialData.workflow_code);
      setSelectedColumns(initialData.list_columns);
      setSelectedSections(initialData.preview_sections);
      setIsDirty(false);
    }
  }, [initialData]);

  // Track dirty state
  useEffect(() => {
    if (!initialData) {
      setIsDirty(selectedWorkflow.length > 0);
    } else {
      const workflowChanged = selectedWorkflow !== initialData.workflow_code;
      const columnsChanged =
        JSON.stringify(selectedColumns) !== JSON.stringify(initialData.list_columns);
      const sectionsChanged =
        JSON.stringify(selectedSections) !== JSON.stringify(initialData.preview_sections);
      setIsDirty(workflowChanged || columnsChanged || sectionsChanged);
    }
  }, [selectedWorkflow, selectedColumns, selectedSections, initialData]);

  // Notify parent of dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Handler for workflow change
  const handleWorkflowChange = (workflowCode: string) => {
    setSelectedWorkflow(workflowCode);
    // Reset columns to defaults when changing workflow in create mode
    if (mode === 'create') {
      setSelectedColumns([...DEFAULT_SELECTED_COLUMNS]);
    }
  };

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

  const filteredNestedColumns = useMemo(() => {
    if (!columnSearch) return nestedColumns;

    return nestedColumns.filter((col) => {
      const label = t(`columns.${col.id}` as Parameters<typeof t>[0], {
        defaultValue: humanizeColumnId(col.id),
      });
      return (
        col.id.toLowerCase().includes(columnSearch.toLowerCase()) ||
        label.toLowerCase().includes(columnSearch.toLowerCase())
      );
    });
  }, [nestedColumns, columnSearch, t]);

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
      workflow_code: selectedWorkflow,
      list_columns: selectedColumns,
      preview_sections: selectedSections,
    });
  };

  const getColumnLabel = (colId: string) => {
    return t(`columns.${colId}` as Parameters<typeof t>[0], {
      defaultValue: humanizeColumnId(colId),
    });
  };

  // Get selected extracted columns (non-system columns)
  const selectedExtractedColumns = useMemo(
    () => selectedColumns.filter((col) => !SYSTEM_COLUMN_IDS.includes(col)),
    [selectedColumns]
  );

  const isValid = selectedWorkflow.length > 0 && selectedColumns.length > 0;

  return (
    <div className="space-y-6">
      {/* Workflow Selection - Mode Create: Dropdown */}
      {mode === 'create' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t('workflowCode', { defaultValue: 'Código de Workflow' })}
            </CardTitle>
            <CardDescription>
              {t('workflowCodeDescription', { defaultValue: 'Seleccione el workflow para configurar las columnas y secciones' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select
                  value={selectedWorkflow}
                  onValueChange={handleWorkflowChange}
                  disabled={workflowsLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('selectWorkflow', { defaultValue: 'Seleccionar un workflow...' })} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {workflowCategories.map((category) => (
                      <SelectGroup key={category}>
                        <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase">
                          {category}
                        </SelectLabel>
                        {workflowGroups[category]?.map((wf) => (
                          <SelectItem key={wf.code} value={wf.code}>
                            <span className="font-medium">{wf.name_es}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({wf.code})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Loading / Result indicator */}
              {selectedWorkflow && (
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  {isLoadingColumns ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t('loadingColumns', { defaultValue: 'Chargement...' })}
                    </span>
                  ) : (
                    <span>
                      {totalRequests > 0
                        ? t('requestsFound', { count: totalRequests, defaultValue: `${totalRequests} demandes trouvées` })
                        : t('noRequestsFound', { defaultValue: 'Aucune demande existante' })}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Error message if workflow loading fails */}
            {workflowsError && (
              <p className="text-sm text-destructive mt-2">
                {t('workflowLoadError', { defaultValue: 'Erreur de chargement des workflows' })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Workflow Display - Mode Edit: Read-only */}
      {mode === 'edit' && initialData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t('workflowCode', { defaultValue: 'Código de Workflow' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                {initialData.workflow_code}
              </Badge>
              <span className="text-sm text-muted-foreground">
                ({t('readOnly', { defaultValue: 'Lecture seule' })})
              </span>
              {/* Show request count in edit mode too */}
              {!isLoadingColumns && totalRequests > 0 && (
                <span className="text-sm text-muted-foreground ml-auto">
                  {totalRequests} demandes
                </span>
              )}
            </div>
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
              {t('availableColumns', { defaultValue: 'Colonnes Disponibles' })}
            </CardTitle>
            <CardDescription>
              {isLoadingColumns ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('loadingColumns', { defaultValue: 'Chargement...' })}
                </span>
              ) : (
                <>
                  {filteredSystemColumns.length} système
                  {extractedColumns.length > 0 && ` + ${extractedColumns.length} extraites`}
                  {nestedColumns.length > 0 && ` + ${nestedColumns.length} imbriquées`}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchColumns', { defaultValue: 'Buscar columna...' })}
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

                  {/* Extracted Columns (top-level form_data fields) */}
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

                  {/* Nested Object Columns (dip.*, pasaporte_antiguo.* - collapsible) */}
                  {filteredNestedColumns.length > 0 && (
                    <div className="space-y-2 border-t pt-3 mt-3">
                      <button
                        type="button"
                        onClick={() => setIsNestedExpanded(!isNestedExpanded)}
                        className="flex items-center gap-2 w-full text-left text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                      >
                        {isNestedExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronUp className="h-3 w-3 rotate-90" />
                        )}
                        Colonnes Imbriquées (DIP, Pasaporte)
                        <Badge variant="outline" className="text-[10px] px-1 ml-auto">
                          {filteredNestedColumns.length}
                        </Badge>
                      </button>
                      {isNestedExpanded && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-5 animate-in fade-in-50 duration-200">
                          {filteredNestedColumns.map((col) => (
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
                      )}
                    </div>
                  )}

                  {/* No workflow selected message */}
                  {!selectedWorkflow && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('selectWorkflowFirst', { defaultValue: 'Sélectionnez un workflow pour voir les colonnes extraites' })}
                    </p>
                  )}

                  {/* No results */}
                  {selectedWorkflow && filteredSystemColumns.length === 0 && filteredExtractedColumns.length === 0 && filteredNestedColumns.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('noColumnsMatchSearch', { defaultValue: 'Aucune colonne ne correspond à la recherche' })}
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
              {t('selectedColumns', { defaultValue: 'Colonnes Sélectionnées' })}
              <Badge variant="secondary">{selectedColumns.length}</Badge>
            </CardTitle>
            <CardDescription>
              {t('selectedColumnsDescription', { defaultValue: 'Réordonner avec les flèches pour définir l\'ordre d\'affichage' })}
            </CardDescription>
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
                      {t('noColumnsSelected', { defaultValue: 'Aucune colonne sélectionnée' })}
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
              {t('previewSections', { defaultValue: 'Secciones de Vista Previa' })}
              <Badge variant="secondary">{selectedSections.length}</Badge>
            </CardTitle>
            <CardDescription>
              {t('previewSectionsDescription', { defaultValue: 'Secciones a mostrar en el panel de vista previa' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {AVAILABLE_SECTIONS.map((sec) => (
                <div key={sec.id} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`sec-${sec.id}`}
                      checked={selectedSections.includes(sec.id)}
                      onCheckedChange={() => toggleSection(sec.id)}
                    />
                    <label
                      htmlFor={`sec-${sec.id}`}
                      className="text-sm cursor-pointer flex items-center gap-2"
                      title={sec.description}
                    >
                      {SECTION_ICONS[sec.id]}
                      {t(`sections.${sec.id}` as Parameters<typeof t>[0], {
                        defaultValue: sec.label,
                      })}
                    </label>
                  </div>
                  {/* Show extracted columns under extractedData section */}
                  {sec.id === 'extractedData' && selectedSections.includes('extractedData') && (
                    <div className="ml-6 pl-2 border-l-2 border-muted">
                      {selectedExtractedColumns.length > 0 ? (
                        <div className="flex flex-wrap gap-1 py-1">
                          {selectedExtractedColumns.slice(0, 6).map((col) => (
                            <Badge key={col} variant="secondary" className="text-[10px]">
                              {getColumnLabel(col)}
                            </Badge>
                          ))}
                          {selectedExtractedColumns.length > 6 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{selectedExtractedColumns.length - 6}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic py-1">
                          {t('noExtractedColumnsSelected', { defaultValue: 'Aucune colonne extraite sélectionnée' })}
                        </p>
                      )}
                    </div>
                  )}
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
              {t('preview', { defaultValue: 'Vista Previa' })}
              {sampleRequest && (
                <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">
                  Datos reales
                </Badge>
              )}
              {!sampleRequest && selectedWorkflow && !sampleLoading && (
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                  Aperçu
                </Badge>
              )}
              {sampleLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            <CardDescription>
              {sampleRequest
                ? t('previewRealData', { defaultValue: 'Aperçu avec données réelles' })
                : t('previewDescription', { defaultValue: 'Aperçu du panneau agent' })
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md bg-muted/30 max-h-[350px] overflow-y-auto">
              {selectedSections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Sélectionnez des sections à afficher
                </p>
              ) : (
                <div className="divide-y">
                  {/* Info Section Preview */}
                  {selectedSections.includes('info') && (
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {t('sections.info' as Parameters<typeof t>[0], { defaultValue: 'Información General' })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Référence:</span>
                          <span className="ml-1 font-medium">
                            {sampleRequest?.reference || 'REF-XXXX-XXXXX'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Priorité:</span>
                          <Badge className="ml-1 text-[10px] bg-blue-100 text-blue-700">
                            {sampleRequest?.priority || 'Normal'}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Statut:</span>
                          <span className="ml-1">{sampleRequest?.status || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Workflow:</span>
                          <span className="ml-1 text-xs font-mono">
                            {sampleRequest?.workflow_code || selectedWorkflow || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Extracted Data Section Preview */}
                  {selectedSections.includes('extractedData') && (
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {t('sections.extractedData' as Parameters<typeof t>[0], { defaultValue: 'Datos Extraídos' })}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {selectedExtractedColumns.length}
                        </Badge>
                      </div>
                      {selectedExtractedColumns.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {selectedExtractedColumns.slice(0, 8).map((col) => {
                            const value = getSampleValue(sampleRequest, col);
                            return (
                              <div key={col}>
                                <span className="text-muted-foreground">{getColumnLabel(col)}:</span>
                                <span className="ml-1 font-medium">
                                  {value || '—'}
                                </span>
                              </div>
                            );
                          })}
                          {selectedExtractedColumns.length > 8 && (
                            <div className="col-span-2 text-muted-foreground italic">
                              +{selectedExtractedColumns.length - 8} más...
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600 italic">
                          ⚠️ {t('noExtractedColumnsSelected', { defaultValue: 'Aucune colonne extraite sélectionnée' })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Documents Section Preview */}
                  {selectedSections.includes('documents') && (
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <File className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {t('sections.documents' as Parameters<typeof t>[0], { defaultValue: 'Documentos' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Documents requis selon le workflow sélectionné
                      </p>
                    </div>
                  )}

                  {/* Contact Section Preview */}
                  {selectedSections.includes('contact') && (
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {t('sections.contact' as Parameters<typeof t>[0], { defaultValue: 'Contacto' })}
                        </span>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <span className="ml-1">
                            {getSampleValue(sampleRequest, 'email') ||
                             getSampleValue(sampleRequest, 'correo') ||
                             '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Teléfono:</span>
                          <span className="ml-1">
                            {getSampleValue(sampleRequest, 'telefono') ||
                             getSampleValue(sampleRequest, 'phone') ||
                             '—'}
                          </span>
                        </div>
                        {sampleRequest?.citizen_name && (
                          <div>
                            <span className="text-muted-foreground">Ciudadano:</span>
                            <span className="ml-1">{sampleRequest.citizen_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Appointment Section Preview */}
                  {selectedSections.includes('appointment') && (
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {t('sections.appointment' as Parameters<typeof t>[0], { defaultValue: 'Cita' })}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Fecha:</span>
                        <span className="ml-1">
                          {getSampleValue(sampleRequest, 'appointment_date') ||
                           getSampleValue(sampleRequest, 'fecha_cita') ||
                           '—'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Payment Section Preview */}
                  {selectedSections.includes('paymentDetails') && (
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {t('sections.paymentDetails' as Parameters<typeof t>[0], { defaultValue: 'Detalles de Pago' })}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="ml-1">
                          {getSampleValue(sampleRequest, 'total_amount') ||
                           getSampleValue(sampleRequest, 'monto_total') ||
                           '—'} XAF
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Timeline Section Preview */}
                  {selectedSections.includes('timeline') && (
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {t('sections.timeline' as Parameters<typeof t>[0], { defaultValue: 'Línea de Tiempo' })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Historial de la solicitud
                      </div>
                    </div>
                  )}

                  {/* History Section Preview */}
                  {selectedSections.includes('history') && (
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <History className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {t('sections.history' as Parameters<typeof t>[0], { defaultValue: 'Historial' })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Acciones realizadas
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              className="w-full mt-4"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? t('actions.create', { defaultValue: 'Crear Configuración' }) : t('actions.save', { defaultValue: 'Guardar Cambios' })}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DisplayConfigForm;
