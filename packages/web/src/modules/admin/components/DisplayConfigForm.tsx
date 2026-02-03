'use client';

/**
 * Display Configuration Form Component
 * Reusable form for creating/editing workflow display configurations
 *
 * Features:
 * - Dropdown selection of workflow codes (grouped by category)
 * - Checkbox toggle for column selection (NOTHING pre-selected in create mode)
 * - Sub-workflow filters (is_minor, solicitud_type, motivo)
 * - Extracted columns grouped by source prefix (dip.*, cert.*, etc.)
 * - Real drag & drop reordering with @dnd-kit
 * - Arrow buttons as alternative for reordering
 * - Section checkboxes
 * - Live preview panel with REAL DATA from sample request
 *
 * @module admin/components
 * @date 2026-02-01
 * @updated 2026-02-03 - Dynamic flattening, filters, no pre-selection
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Loader2,
  Search,
  X,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronRight,
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
  Filter,
} from 'lucide-react';
import {
  useAllAvailableColumns,
  useWorkflowCodesGrouped,
  useSampleRequest,
  FALLBACK_SYSTEM_COLUMNS,
  AVAILABLE_SECTIONS,
} from '@/modules/admin/hooks';
import type { SampleRequest, AvailableColumn, AvailableColumnsFilters } from '@/modules/admin/hooks';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * System columns that belong in "Información General" section of the preview.
 * When selected, they enrich the Info General card — NOT "Datos Extraídos".
 */
const INFO_GENERAL_COLUMN_IDS = new Set([
  'reference', 'fullName', 'citizenName', 'solicitudType',
  'createdAt', 'submittedAt', 'priority', 'status',
  'workflowCode', 'workflowLabel',
]);

/**
 * Default system columns pre-selected in create mode.
 * These are the most commonly needed for any workflow.
 */
const DEFAULT_SYSTEM_COLUMNS = ['reference', 'fullName', 'solicitudType'];

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
 * Handles dot-notation: "dip.natural_de" → "Natural De (DIP)"
 */
function humanizeColumnId(id: string): string {
  const parts = id.split('.');
  if (parts.length > 1) {
    const source = parts[0].toUpperCase();
    const field = parts[1]
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return `${field} (${source})`;
  }
  return id
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Group extracted columns by source prefix
 * e.g., "dip.natural_de" → group "dip", "cert.nombre" → group "cert"
 * Columns without prefix go into "root" group
 */
function groupColumnsBySource(columns: AvailableColumn[]): Record<string, AvailableColumn[]> {
  const groups: Record<string, AvailableColumn[]> = {};
  for (const col of columns) {
    const dotIdx = col.id.indexOf('.');
    const group = dotIdx > 0 ? col.id.substring(0, dotIdx) : '_root';
    if (!groups[group]) groups[group] = [];
    groups[group].push(col);
  }
  return groups;
}

/**
 * Extract value from sample request data
 * Handles dot-notation keys (e.g., "dip.natural_de")
 */
function getSampleValue(
  sampleRequest: SampleRequest | null | undefined,
  fieldId: string
): string | null {
  if (!sampleRequest) return null;

  const parts = fieldId.split('.');

  // Check form_data first
  if (sampleRequest.form_data) {
    if (parts.length > 1) {
      // Dot-notation: e.g., "dip.natural_de"
      const parent = sampleRequest.form_data[parts[0]];
      if (parent && typeof parent === 'object' && !Array.isArray(parent)) {
        const val = (parent as Record<string, unknown>)[parts[1]];
        if (val !== null && val !== undefined) return String(val);
      }
    } else if (fieldId in sampleRequest.form_data) {
      const value = sampleRequest.form_data[fieldId];
      if (value !== null && value !== undefined) return String(value);
    }
  }

  // Then check extracted_data
  if (sampleRequest.extracted_data && fieldId in sampleRequest.extracted_data) {
    const value = sampleRequest.extracted_data[fieldId];
    if (value !== null && value !== undefined) return String(value);
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
  /** Callback to expose the form's submit function to the parent */
  onSubmitRef?: (submitFn: () => Promise<void>) => void;
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
      {/* Drag Handle */}
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
  onSubmitRef,
  isSubmitting = false,
  mode = 'create',
}: DisplayConfigFormProps) {
  const t = useTranslations('admin.menuConfig.displayConfig');

  // Local state
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>(
    initialData?.workflow_code ?? ''
  );
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    initialData?.list_columns ?? []
  );
  const [selectedSections, setSelectedSections] = useState<string[]>(
    initialData?.preview_sections ?? ['info', 'extractedData', 'documents', 'contact']
  );
  const [columnSearch, setColumnSearch] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Sub-workflow filters
  const [filterIsMinor, setFilterIsMinor] = useState<boolean | undefined>(undefined);
  const [filterSolicitudType, setFilterSolicitudType] = useState<string | undefined>(undefined);
  const [filterMotivo, setFilterMotivo] = useState<string | undefined>(undefined);

  // Collapsible state for column groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Build filters object for API
  const columnFilters = useMemo<AvailableColumnsFilters | undefined>(() => {
    const f: AvailableColumnsFilters = {};
    if (filterIsMinor !== undefined) f.is_minor = filterIsMinor;
    if (filterSolicitudType) f.solicitud_type = filterSolicitudType;
    if (filterMotivo) f.motivo = filterMotivo;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [filterIsMinor, filterSolicitudType, filterMotivo]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
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
    suggestedColumns,
    availableFilters,
    totalRequests,
    isLoading: isLoadingColumns,
  } = useAllAvailableColumns(selectedWorkflow, columnFilters, shouldFetchColumns);

  // Group extracted columns by source prefix
  const extractedGroups = useMemo(
    () => groupColumnsBySource(extractedColumns),
    [extractedColumns]
  );
  const extractedGroupNames = useMemo(
    () => Object.keys(extractedGroups).sort((a, b) => {
      // "_root" first, then alphabetical
      if (a === '_root') return -1;
      if (b === '_root') return 1;
      return a.localeCompare(b);
    }),
    [extractedGroups]
  );

  // Auto-open all groups when they change
  // Serialized key prevents infinite loop from unstable array references
  const extractedGroupKey = extractedGroupNames.join(',');
  useEffect(() => {
    if (extractedGroupNames.length === 0) return;
    setOpenGroups((prev) => {
      const newOpen: Record<string, boolean> = {};
      for (const name of extractedGroupNames) {
        newOpen[name] = prev[name] ?? true;
      }
      return newOpen;
    });
  }, [extractedGroupKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset state when initialData changes (for edit mode)
  // Compare by serialized value to avoid spurious resets from parent re-renders
  const initialDataKey = useMemo(
    () => initialData ? JSON.stringify([initialData.workflow_code, initialData.list_columns, initialData.preview_sections]) : '',
    [initialData]
  );
  useEffect(() => {
    if (initialData) {
      setSelectedWorkflow(initialData.workflow_code);
      setSelectedColumns(initialData.list_columns);
      setSelectedSections(initialData.preview_sections);
      setIsDirty(false);
    }
  }, [initialDataKey]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Track whether we've applied suggested columns for the current workflow
  // Resets when workflow changes; prevents re-applying after manual edits
  const [suggestedApplied, setSuggestedApplied] = useState(false);

  // Auto-select suggested extracted columns in create mode when they arrive from API
  // Appends to existing default system columns (does not replace)
  useEffect(() => {
    if (
      mode === 'create' &&
      suggestedColumns.length > 0 &&
      !suggestedApplied
    ) {
      setSelectedColumns((prev) => {
        // Merge: keep existing system defaults + add suggested extracted columns
        const merged = [...prev];
        for (const col of suggestedColumns) {
          if (!merged.includes(col)) merged.push(col);
        }
        return merged;
      });
      setSuggestedApplied(true);
    }
  }, [suggestedColumns, mode, suggestedApplied]);

  // Handler for workflow change
  const handleWorkflowChange = (workflowCode: string) => {
    setSelectedWorkflow(workflowCode);
    if (mode === 'create') {
      // Reset to default system columns (not empty)
      setSelectedColumns([...DEFAULT_SYSTEM_COLUMNS]);
      setSuggestedApplied(false); // Allow new suggestions for new workflow
    }
    // Reset filters when changing workflow
    setFilterIsMinor(undefined);
    setFilterSolicitudType(undefined);
    setFilterMotivo(undefined);
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

  const filteredExtractedGroups = useMemo(() => {
    if (!columnSearch) return extractedGroups;

    const filtered: Record<string, AvailableColumn[]> = {};
    for (const [group, cols] of Object.entries(extractedGroups)) {
      const matching = cols.filter((col) => {
        const label = t(`columns.${col.id}` as Parameters<typeof t>[0], {
          defaultValue: humanizeColumnId(col.id),
        });
        return (
          col.id.toLowerCase().includes(columnSearch.toLowerCase()) ||
          label.toLowerCase().includes(columnSearch.toLowerCase())
        );
      });
      if (matching.length > 0) filtered[group] = matching;
    }
    return filtered;
  }, [extractedGroups, columnSearch, t]);

  const hasFilteredExtracted = Object.keys(filteredExtractedGroups).length > 0;

  // Handlers
  const toggleColumn = useCallback((columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((c) => c !== columnId)
        : [...prev, columnId]
    );
  }, []);

  const removeColumn = useCallback((columnId: string) => {
    setSelectedColumns((prev) => prev.filter((c) => c !== columnId));
  }, []);

  const moveColumn = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedColumns.length) return;
    setSelectedColumns((items) => arrayMove(items, index, newIndex));
  }, [selectedColumns.length]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedColumns((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((s) => s !== sectionId) : [...prev, sectionId]
    );
  }, []);

  const handleSubmit = async () => {
    if (!selectedWorkflow || selectedColumns.length === 0) {
      return;
    }
    await onSubmit({
      workflow_code: selectedWorkflow,
      list_columns: selectedColumns,
      preview_sections: selectedSections,
    });
  };

  // Expose submit function to parent via callback
  useEffect(() => {
    onSubmitRef?.(handleSubmit);
  }, [selectedWorkflow, selectedColumns, selectedSections]); // eslint-disable-line react-hooks/exhaustive-deps

  const getColumnLabel = useCallback((colId: string) => {
    return t(`columns.${colId}` as Parameters<typeof t>[0], {
      defaultValue: humanizeColumnId(colId),
    });
  }, [t]);

  const toggleGroup = useCallback((groupName: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  }, []);

  const isValid = selectedWorkflow.length > 0 && selectedColumns.length > 0;

  // Split selected columns: system → Info General, extracted → Datos Extraídos
  const infoGeneralSelectedColumns = useMemo(
    () => selectedColumns.filter((col) => INFO_GENERAL_COLUMN_IDS.has(col)),
    [selectedColumns]
  );
  const extractedDataSelectedColumns = useMemo(
    () => selectedColumns.filter((col) => !INFO_GENERAL_COLUMN_IDS.has(col)),
    [selectedColumns]
  );

  // Derive filter options from available_filters
  const filterOptions = useMemo(() => {
    if (!availableFilters) return null;
    return {
      isMinor: (availableFilters.is_minor as boolean[] | undefined) ?? null,
      solicitudType: (availableFilters.solicitud_type as string[] | undefined) ?? null,
      motivo: (availableFilters.motivo as string[] | undefined) ?? null,
    };
  }, [availableFilters]);

  const hasAnyFilter = filterOptions && (
    filterOptions.isMinor || filterOptions.solicitudType || filterOptions.motivo
  );

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

            {/* Sub-workflow Filters */}
            {hasAnyFilter && (
              <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                {filterOptions?.isMinor && (
                  <Select
                    value={filterIsMinor === undefined ? '__all__' : String(filterIsMinor)}
                    onValueChange={(v) => setFilterIsMinor(v === '__all__' ? undefined : v === 'true')}
                  >
                    <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs">
                      <SelectValue placeholder="Menor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Menor: Todos</SelectItem>
                      <SelectItem value="true">Menor: Sí</SelectItem>
                      <SelectItem value="false">Menor: No</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {filterOptions?.solicitudType && (
                  <Select
                    value={filterSolicitudType ?? '__all__'}
                    onValueChange={(v) => setFilterSolicitudType(v === '__all__' ? undefined : v)}
                  >
                    <SelectTrigger className="h-7 w-auto min-w-[120px] text-xs">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Tipo: Todos</SelectItem>
                      {filterOptions.solicitudType.map((val) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {filterOptions?.motivo && (
                  <Select
                    value={filterMotivo ?? '__all__'}
                    onValueChange={(v) => setFilterMotivo(v === '__all__' ? undefined : v)}
                  >
                    <SelectTrigger className="h-7 w-auto min-w-[120px] text-xs">
                      <SelectValue placeholder="Motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Motivo: Todos</SelectItem>
                      {filterOptions.motivo.map((val) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

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
                        Colonnes Système ({filteredSystemColumns.length})
                      </p>
                      <p className="text-[10px] text-muted-foreground italic">
                        reference, status, priority, workflow sont déjà dans Información General
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

                  {/* Extracted Columns - Grouped by source */}
                  {hasFilteredExtracted && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Colonnes Extraites ({extractedColumns.length})
                      </p>
                      <div className="space-y-1">
                        {Object.entries(filteredExtractedGroups)
                          .sort(([a], [b]) => {
                            if (a === '_root') return -1;
                            if (b === '_root') return 1;
                            return a.localeCompare(b);
                          })
                          .map(([groupName, groupCols]) => (
                            <Collapsible
                              key={groupName}
                              open={openGroups[groupName] !== false}
                              onOpenChange={() => toggleGroup(groupName)}
                            >
                              <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-left py-1 hover:bg-muted/50 rounded px-1">
                                <ChevronRight
                                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                                    openGroups[groupName] !== false ? 'rotate-90' : ''
                                  }`}
                                />
                                <span className="text-xs font-medium">
                                  {groupName === '_root' ? 'Datos Personales' : groupName.toUpperCase()}
                                </span>
                                <Badge variant="outline" className="text-[10px] px-1 ml-1">
                                  {groupCols.length}
                                </Badge>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-5 pt-1 pb-2">
                                  {groupCols.map((col) => (
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
                              </CollapsibleContent>
                            </Collapsible>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* No workflow selected message */}
                  {!selectedWorkflow && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('selectWorkflowFirst', { defaultValue: 'Sélectionnez un workflow pour voir les colonnes extraites' })}
                    </p>
                  )}

                  {/* No results */}
                  {selectedWorkflow && filteredSystemColumns.length === 0 && !hasFilteredExtracted && (
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
                  {/* Show selected system columns under info section */}
                  {sec.id === 'info' && selectedSections.includes('info') && infoGeneralSelectedColumns.length > 0 && (
                    <div className="ml-6 pl-2 border-l-2 border-muted">
                      <div className="flex flex-wrap gap-1 py-1">
                        {infoGeneralSelectedColumns.map((col) => (
                          <Badge key={col} variant="secondary" className="text-[10px]">
                            {getColumnLabel(col)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Show selected extracted columns under extractedData section */}
                  {sec.id === 'extractedData' && selectedSections.includes('extractedData') && (
                    <div className="ml-6 pl-2 border-l-2 border-muted">
                      {extractedDataSelectedColumns.length > 0 ? (
                        <div className="flex flex-wrap gap-1 py-1">
                          {extractedDataSelectedColumns.slice(0, 8).map((col) => (
                            <Badge key={col} variant="secondary" className="text-[10px]">
                              {getColumnLabel(col)}
                            </Badge>
                          ))}
                          {extractedDataSelectedColumns.length > 8 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{extractedDataSelectedColumns.length - 8}
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
                  {/* Info Section Preview — ALWAYS shows 6 fixed baseline fields */}
                  {selectedSections.includes('info') && (
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {t('sections.info' as Parameters<typeof t>[0], { defaultValue: 'Información General' })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Fixed field: Referencia */}
                        <div>
                          <span className="text-muted-foreground">Referencia:</span>
                          <span className="ml-1 font-medium">
                            {sampleRequest?.reference || 'REF-XXXX-XXXXX'}
                          </span>
                        </div>
                        {/* Fixed field: Fecha de Creación */}
                        <div>
                          <span className="text-muted-foreground">Fecha de Creación:</span>
                          <span className="ml-1">
                            {sampleRequest?.created_at
                              ? new Date(sampleRequest.created_at).toLocaleDateString('es')
                              : '—'}
                          </span>
                        </div>
                        {/* Fixed field: Tipo de Solicitud */}
                        <div>
                          <span className="text-muted-foreground">Tipo de Solicitud:</span>
                          <span className="ml-1">
                            {(sampleRequest?.form_data as Record<string, unknown>)?.solicitud_type as string || '—'}
                          </span>
                        </div>
                        {/* Fixed field: Prioridad */}
                        <div>
                          <span className="text-muted-foreground">Prioridad:</span>
                          <span className="ml-1">{sampleRequest?.priority || '—'}</span>
                        </div>
                        {/* Fixed field: Estado */}
                        <div>
                          <span className="text-muted-foreground">Estado:</span>
                          <span className="ml-1">{sampleRequest?.status || '—'}</span>
                        </div>
                        {/* Fixed field: Workflow */}
                        <div>
                          <span className="text-muted-foreground">Workflow:</span>
                          <span className="ml-1 text-xs font-mono">
                            {sampleRequest?.workflow_code || selectedWorkflow || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Extracted Data Section Preview — ONLY non-system columns */}
                  {selectedSections.includes('extractedData') && (
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {t('sections.extractedData' as Parameters<typeof t>[0], { defaultValue: 'Datos Extraídos' })}
                        </span>
                        {extractedDataSelectedColumns.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {extractedDataSelectedColumns.length}
                          </Badge>
                        )}
                      </div>
                      {extractedDataSelectedColumns.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {extractedDataSelectedColumns.map((col) => {
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
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600 italic">
                          {t('noExtractedColumnsSelected', { defaultValue: 'Aucune colonne sélectionnée' })}
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
