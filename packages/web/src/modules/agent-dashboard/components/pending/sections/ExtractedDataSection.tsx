/**
 * ExtractedDataSection - Display extracted form data
 *
 * Dynamically renders fields based on display_config columns.
 * - Labels from translations (columns.*)
 * - Date formatting auto-detected
 * - No hardcoded workflow-specific logic
 *
 * @module agent-dashboard/components/pending/sections
 * @date 2026-01-26
 * @updated 2026-02-02 - Fully dynamic, no hardcoding
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
// =============================================================================
// PROPS
// =============================================================================

interface ExtractedDataSectionProps {
  /** Dynamic extracted data dict (keys may use dot-notation, e.g. "dip.natural_de") */
  data: Record<string, unknown>;
  /** Extracted columns to display (from display_config.list_columns) */
  columns: string[];
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Check if a string value is an ISO date format
 */
function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(value);
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Humanize column ID to display label.
 * Handles dot-notation: "dip.natural_de" → "Natural De (DIP)"
 * Handles snake_case: "fecha_nacimiento" → "Fecha Nacimiento"
 * Handles camelCase: "fechaNacimiento" → "Fecha Nacimiento"
 * NOTE: Must match DisplayConfigForm.tsx humanizeColumnId for consistency.
 */
function humanizeColumnId(columnId: string): string {
  const parts = columnId.split('.');
  if (parts.length > 1) {
    const source = parts[0].toUpperCase();
    const field = parts[1]
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return `${field} (${source})`;
  }
  return columnId
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ExtractedDataSection({
  data,
  columns,
}: ExtractedDataSectionProps) {
  const t = useTranslations('admin.menuConfig.displayConfig');

  // Get label from translations, fallback to humanized column ID
  const getLabel = (columnId: string): string => {
    // Use existing translations from columns.*
    const translated = t(`columns.${columnId}` as Parameters<typeof t>[0], {
      defaultValue: '',
    });
    return translated || humanizeColumnId(columnId);
  };

  // Get value from data, auto-format dates
  const getValue = (columnId: string): string => {
    // Direct key access — backend returns flat keys including dot-notation
    const value = data[columnId];

    if (value === null || value === undefined || value === '') {
      return '-';
    }

    const strValue = String(value);

    // Auto-detect and format ISO dates
    if (isIsoDate(strValue)) {
      return formatDate(strValue);
    }

    return strValue;
  };

  // Render a single field
  const Field = ({ columnId }: { columnId: string }) => (
    <div>
      <p className="text-xs text-muted-foreground">{getLabel(columnId)}</p>
      <p className="text-sm font-medium">{getValue(columnId)}</p>
    </div>
  );

  // Filter out columns with no data (e.g. permiso_residencia.* when citizen submitted a DIP)
  // This prevents showing rows of "-" for documents the citizen didn't provide
  const populatedColumns = columns.filter((columnId) => {
    const value = data[columnId];
    return value !== null && value !== undefined && value !== '';
  });

  // If no columns configured, show message
  if (populatedColumns.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {t('sections.extractedData')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay campos configurados para este workflow.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          {t('sections.extractedData')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {populatedColumns.map((columnId) => (
            <Field key={columnId} columnId={columnId} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ExtractedDataSection;
