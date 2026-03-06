/**
 * ExtractedDataSection - Display structured data sections
 *
 * Driven by display_config.list_columns + OCR extraction_data.
 * Admin adds/removes columns in display_config → split-view updates automatically.
 *
 * @module agent-dashboard/components/pending/sections
 * @date 2026-01-26
 * @updated 2026-03-07 - Single source: display_config, legacy removed
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';
import type { PreviewDataSection } from '../../../services/agent-requests-api';

interface ExtractedDataSectionProps {
  dataSections?: PreviewDataSection[];
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

export function ExtractedDataSection({ dataSections }: ExtractedDataSectionProps) {
  if (!dataSections || dataSections.length === 0) {
    return (
      <Card>
        <CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <ClipboardList className="h-3 w-3" />
            Datos de la Solicitud
          </p>
          <p className="text-xs text-muted-foreground">
            Documentos pendientes de procesamiento OCR.
          </p>
        </CardContent>
      </Card>
    );
  }

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
