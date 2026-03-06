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
 * @updated 2026-03-06 - Compact layout, 3-col grid, reduced padding
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';

interface ExtractedDataSectionProps {
  data: Record<string, unknown>;
  columns: string[];
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(value);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

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

export function ExtractedDataSection({ data, columns }: ExtractedDataSectionProps) {
  const t = useTranslations('admin.menuConfig.displayConfig');

  const getLabel = (columnId: string): string => {
    const translated = t(`columns.${columnId}` as Parameters<typeof t>[0], { defaultValue: '' });
    return translated || humanizeColumnId(columnId);
  };

  const getValue = (columnId: string): string => {
    const value = data[columnId];
    if (value === null || value === undefined || value === '') return '-';
    const strValue = String(value);
    if (isIsoDate(strValue)) return formatDate(strValue);
    return strValue;
  };

  const populatedColumns = columns.filter((columnId) => {
    const value = data[columnId];
    return value !== null && value !== undefined && value !== '';
  });

  if (populatedColumns.length === 0) {
    return (
      <Card>
        <CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <User className="h-3 w-3" />
            {t('sections.extractedData')}
          </p>
          <p className="text-xs text-muted-foreground">
            No hay campos configurados para este workflow.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <User className="h-3 w-3" />
          {t('sections.extractedData')}
          <span className="ml-1 text-muted-foreground/60">({populatedColumns.length})</span>
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-1.5">
          {populatedColumns.map((columnId) => (
            <div key={columnId}>
              <p className="text-[10px] text-muted-foreground leading-tight">{getLabel(columnId)}</p>
              <p className="text-xs font-medium leading-tight">{getValue(columnId)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ExtractedDataSection;
