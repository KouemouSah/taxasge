/**
 * Entity-specific filter configurations for agent dashboard
 *
 * Declarative config driving the action page filters, type labels,
 * and workflow codes. Adding a new entity's filters requires ONLY
 * editing this file — no page component changes needed.
 *
 * @module agent-dashboard/config/entity-filters
 */

// =============================================================================
// TYPES
// =============================================================================

export interface FilterOption {
  value: string;
  /** i18n key relative to 'agent' namespace (e.g., 'filters.allTypes') */
  labelKey: string;
}

export interface FilterDef {
  /** API parameter name — must match useEntityServiceRequests option key */
  key: string;
  /** i18n key for the placeholder text */
  placeholderKey: string;
  /** Tailwind width class */
  width: string;
  /** Available options (first should be the 'all' option) */
  options: FilterOption[];
  /** Only show when another filter has a specific value */
  showWhen?: { filterKey: string; value: string };
}

export interface TypeLabelConfig {
  /** Primary request field to read for the type label */
  primaryField: string;
  /** Map of primary field values to i18n keys (relative to 'agent') */
  labels: Record<string, string>;
  /** Optional secondary field (e.g., 'motivo') that overrides primary */
  secondaryField?: string;
  /** Map of secondary field values (UPPERCASED) to i18n keys */
  secondaryLabels?: Record<string, string>;
}

export interface EntityFilterConfig {
  /** Workflow codes for this entity (passed to HistoryPage for stats) */
  workflowCodes: string[];
  /** Filter definitions to render in the UI */
  filters: FilterDef[];
  /** Config for the "Tipo" column type label */
  typeLabel: TypeLabelConfig;
}

// =============================================================================
// CONFIGURATIONS
// =============================================================================

export const ENTITY_FILTER_CONFIGS: Record<string, EntityFilterConfig> = {
  CNEDOGE_PASAPORTE: {
    workflowCodes: ['PASAPORTE_NUEVO', 'PASAPORTE_RENOVACION'],
    filters: [
      {
        key: 'solicitudType',
        placeholderKey: 'filters.type',
        width: 'w-[160px]',
        options: [
          { value: 'all', labelKey: 'filters.allTypes' },
          { value: 'expedicion', labelKey: 'filters.expedicion' },
          { value: 'renovacion', labelKey: 'filters.renovacion' },
        ],
      },
      {
        key: 'motivo',
        placeholderKey: 'filters.motivo',
        width: 'w-[160px]',
        showWhen: { filterKey: 'solicitudType', value: 'renovacion' },
        options: [
          { value: 'all', labelKey: 'filters.allMotivos' },
          { value: 'vencimiento', labelKey: 'filters.vencimiento' },
          { value: 'perdida', labelKey: 'filters.perdida' },
          { value: 'robo', labelKey: 'filters.robo' },
          { value: 'deterioro', labelKey: 'filters.deterioro' },
        ],
      },
    ],
    typeLabel: {
      primaryField: 'solicitudType',
      labels: {
        expedicion: 'filters.nuevo',
      },
      secondaryField: 'motivo',
      secondaryLabels: {
        VENCIMIENTO: 'filters.renovacion',
        PERDIDA: 'filters.perdida',
        ROBO: 'filters.robo',
        DETERIORO: 'filters.deterioro',
      },
    },
  },

  CNEDOGE_RESIDENCIA: {
    workflowCodes: [
      'RESIDENCIA_PRIMERA_VEZ',
      'RESIDENCIA_RENOVACION',
      'RESIDENCIA_DUPLICADO',
      'RESIDENCIA_CAMBIO_DATOS',
      'RESIDENCIA_REAGRUPACION',
    ],
    filters: [
      {
        key: 'workflowCode',
        placeholderKey: 'filters.residenceType',
        width: 'w-[180px]',
        options: [
          { value: 'all', labelKey: 'filters.all' },
          { value: 'RESIDENCIA_PRIMERA_VEZ', labelKey: 'filters.primeraVez' },
          { value: 'RESIDENCIA_RENOVACION', labelKey: 'filters.renovacion' },
          { value: 'RESIDENCIA_DUPLICADO', labelKey: 'filters.duplicado' },
          { value: 'RESIDENCIA_CAMBIO_DATOS', labelKey: 'filters.cambioDatos' },
          { value: 'RESIDENCIA_REAGRUPACION', labelKey: 'filters.reagrupacion' },
        ],
      },
    ],
    typeLabel: {
      primaryField: 'workflowCode',
      labels: {
        RESIDENCIA_PRIMERA_VEZ: 'filters.primeraVez',
        RESIDENCIA_RENOVACION: 'filters.renovacion',
        RESIDENCIA_DUPLICADO: 'filters.duplicado',
        RESIDENCIA_CAMBIO_DATOS: 'filters.cambioDatos',
        RESIDENCIA_REAGRUPACION: 'filters.reagrupacion',
      },
    },
  },
};

// =============================================================================
// WORKFLOW GROUP TITLES
// =============================================================================

/** Maps ENTITY_CODE (UPPER_SNAKE) to i18n key for workflow group title */
export const ENTITY_WORKFLOW_TITLES: Record<string, string> = {
  DGT: 'nav.driverLicenses',
  OFIVE: 'nav.vehicles',
  ONRC: 'nav.contracts',
  EXTRANJERIA: 'nav.residences',
  POLICIA: 'nav.certificates',
  MINFP: 'nav.civilServants',
  ITVE: 'nav.inspections',
};

// =============================================================================
// TYPE LABEL RESOLVER
// =============================================================================

/**
 * Resolve the "Tipo" column label for a service request.
 * Reads from the entity's TypeLabelConfig if available, otherwise
 * formats the workflowCode as readable text.
 *
 * @param entityCode - UPPER_SNAKE entity code
 * @param request - Request data with workflowCode/solicitudType/motivo
 * @param t - i18n translate function (agent namespace)
 * @returns Translated label string
 */
export function resolveTypeLabel(
  entityCode: string,
  request: { workflowCode?: string; solicitudType?: string; motivo?: string | null },
  t: (key: string) => string,
): string {
  const config = ENTITY_FILTER_CONFIGS[entityCode]?.typeLabel;
  if (!config) {
    // Generic: format workflowCode to readable text
    return request.workflowCode?.replace(/_/g, ' ') || '-';
  }

  // Check secondary field first (override, e.g., motivo in pasaporte)
  if (config.secondaryField && config.secondaryLabels) {
    const secValue = (request as Record<string, unknown>)[config.secondaryField] as string;
    if (secValue) {
      const labelKey = config.secondaryLabels[secValue.toUpperCase()];
      if (labelKey) return t(labelKey);
    }
  }

  // Check primary field
  const priValue = (request as Record<string, unknown>)[config.primaryField] as string;
  if (priValue) {
    const labelKey = config.labels[priValue];
    if (labelKey) return t(labelKey);
  }

  return priValue || '-';
}
