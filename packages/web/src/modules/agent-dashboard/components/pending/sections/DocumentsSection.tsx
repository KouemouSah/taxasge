/**
 * DocumentsSection - Document thumbnails display
 *
 * @module agent-dashboard/components/pending/sections
 * @date 2026-01-26
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Check, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RequestPreviewDocument } from '../../../services/agent-requests-api';

// =============================================================================
// PROPS
// =============================================================================

interface DocumentsSectionProps {
  documents: RequestPreviewDocument[];
  documentsCount: number;
  requestId: string;
}

// =============================================================================
// HELPERS
// =============================================================================

const STATUS_STYLES: Record<string, { icon: React.ReactNode; color: string }> = {
  valid: { icon: <Check className="h-3 w-3" />, color: 'text-green-600' },
  validated: { icon: <Check className="h-3 w-3" />, color: 'text-green-600' },
  pending: { icon: <Clock className="h-3 w-3" />, color: 'text-orange-600' },
  invalid: { icon: <AlertCircle className="h-3 w-3" />, color: 'text-red-600' },
  rejected: { icon: <AlertCircle className="h-3 w-3" />, color: 'text-red-600' },
};

const DOC_LABELS: Record<string, string> = {
  dip: 'DIP',
  photo_carnet: 'Foto',
  certificado_nacimiento: 'Acta Nac.',
  pasaporte_antiguo: 'Pasaporte',
  denuncia_policial: 'Denuncia',
  autorizacion_parental: 'Autoriz.',
  documento_representante_1: 'Doc Rep. 1',
  documento_representante_2: 'Doc Rep. 2',
};

// =============================================================================
// COMPONENT
// =============================================================================

export function DocumentsSection({
  documents,
  documentsCount,
  requestId: _requestId,
}: DocumentsSectionProps) {
  const t = useTranslations('agent.pending.preview');

  const handleOpenDocument = (doc: RequestPreviewDocument) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t('documents')}
            <Badge variant="secondary" className="ml-1">
              {documentsCount}
            </Badge>
          </CardTitle>
          {documentsCount > 4 && (
            <Button variant="ghost" size="sm" className="text-xs">
              {t('viewAllDocs')}
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noDocuments')}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {documents.map((doc) => {
              const status = STATUS_STYLES[doc.validationStatus] || STATUS_STYLES.pending;
              const label = DOC_LABELS[doc.code] || doc.name.slice(0, 10);

              return (
                <button
                  key={doc.id}
                  onClick={() => handleOpenDocument(doc)}
                  className={cn(
                    'flex flex-col items-center p-2 rounded-lg border bg-muted/30',
                    'hover:bg-muted transition-colors cursor-pointer',
                    'min-w-[70px]'
                  )}
                >
                  {/* Icon/Thumbnail */}
                  <div className="relative">
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    {/* Status indicator */}
                    <div className={cn(
                      'absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white',
                      status.color
                    )}>
                      {status.icon}
                    </div>
                  </div>
                  {/* Label */}
                  <p className="text-[10px] text-muted-foreground mt-1 text-center truncate max-w-[60px]">
                    {label}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DocumentsSection;
