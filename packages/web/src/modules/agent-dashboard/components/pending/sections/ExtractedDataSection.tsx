/**
 * ExtractedDataSection - Display extracted form data
 *
 * Uses structured data_sections from workflow config (same as citizen résumé).
 * Falls back to legacy flat dict if no sections available.
 *
 * @module agent-dashboard/components/pending/sections
 * @date 2026-01-26
 * @updated 2026-03-06 - Structured sections from get_pdf_data_sections()
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';
import type { PreviewDataSection } from '../../../services/agent-requests-api';

interface ExtractedDataSectionProps {
  /** Structured sections from workflow config (preferred) */
  dataSections?: PreviewDataSection[];
  /** Legacy flat dict (fallback) */
  data?: Record<string, unknown>;
  columns?: string[];
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

function formatValue(value: string): string {
  if (isIsoDate(value)) return formatDate(value);
  return value;
}

export function ExtractedDataSection({ dataSections, data, columns }: ExtractedDataSectionProps) {
  // Prefer structured sections from workflow config
  const hasSections = dataSections && dataSections.length > 0;

  // Fallback: legacy flat dict
  if (!hasSections) {
    if (!data || !columns || columns.length === 0) {
      return (
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <ClipboardList className="h-3 w-3" />
              Datos Extraídos
            </p>
            <p className="text-xs text-muted-foreground">
              Sin datos disponibles para esta solicitud.
            </p>
          </CardContent>
        </Card>
      );
    }

    // Legacy flat rendering
    const populatedColumns = columns.filter((col) => {
      const v = data[col];
      return v !== null && v !== undefined && v !== '';
    });

    if (populatedColumns.length === 0) {
      return (
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <ClipboardList className="h-3 w-3" />
              Datos Extraídos
            </p>
            <p className="text-xs text-muted-foreground">
              Documentos pendientes de procesamiento OCR.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <ClipboardList className="h-3 w-3" />
            Datos Extraídos
            <span className="ml-1 text-muted-foreground/60">({populatedColumns.length})</span>
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-1.5">
            {populatedColumns.map((col) => (
              <div key={col}>
                <p className="text-[10px] text-muted-foreground leading-tight">{col}</p>
                <p className="text-xs font-medium leading-tight">{formatValue(String(data[col]))}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Structured sections rendering (same as citizen résumé)
  const totalFields = dataSections.reduce((sum, s) => sum + s.fields.length, 0);

  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <ClipboardList className="h-3 w-3" />
          Datos de la Solicitud
          <span className="ml-1 text-muted-foreground/60">({totalFields})</span>
        </p>
        <div className="space-y-2.5">
          {dataSections.map((section, idx) => (
            <div key={idx}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {section.title}
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-1">
                {section.fields.map((field, fIdx) => (
                  <div key={fIdx}>
                    <p className="text-[10px] text-muted-foreground leading-tight">{field.label}</p>
                    <p className="text-xs font-medium leading-tight">{formatValue(field.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ExtractedDataSection;
