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

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import type { RequestPreviewExtractedData } from '../../../services/agent-requests-api';

// =============================================================================
// PROPS
// =============================================================================

interface ExtractedDataSectionProps {
  data: RequestPreviewExtractedData;
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
 * Humanize column ID: camelCase → Title Case
 * Example: certFechaNacimiento → Cert Fecha Nacimiento
 */
function humanizeColumnId(columnId: string): string {
  return columnId
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (str) => str.toUpperCase());
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
    const value = data[columnId as keyof RequestPreviewExtractedData];

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

  // DYNAMIC APPROACH: Extract columns from actual data if no config provided
  // This ensures we only show fields that have actual values
  const dynamicColumns = useMemo(() => {
    // If columns are configured, filter to only those with actual values
    if (columns.length > 0) {
      return columns.filter((col) => {
        const value = data[col as keyof RequestPreviewExtractedData];
        return value !== null && value !== undefined && value !== '';
      });
    }

    // No config: extract all non-empty keys from data
    return Object.entries(data)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key]) => key);
  }, [columns, data]);

  // If no data at all, show message
  if (dynamicColumns.length === 0) {
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
            No hay datos extraídos para esta solicitud.
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
          {dynamicColumns.map((columnId) => (
            <Field key={columnId} columnId={columnId} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ExtractedDataSection;
