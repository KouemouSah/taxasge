/**
 * DocumentsSection - Document thumbnails display with image preview
 *
 * @module agent-dashboard/components/pending/sections
 * @date 2026-01-30
 */

'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

/**
 * Check if mime type is an image
 */
function isImageMimeType(mimeType?: string | null): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith('image/');
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DocumentsSection({
  documents,
  documentsCount,
  requestId: _requestId,
}: DocumentsSectionProps) {
  const t = useTranslations('agent.pending.preview');
  const [previewDoc, setPreviewDoc] = useState<RequestPreviewDocument | null>(null);

  const handleDocumentClick = (doc: RequestPreviewDocument) => {
    if (isImageMimeType(doc.mimeType)) {
      // Open preview dialog for images
      setPreviewDoc(doc);
    } else if (doc.fileUrl) {
      // Open in new tab for non-images (PDF, etc.)
      window.open(doc.fileUrl, '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    if (previewDoc?.fileUrl) {
      window.open(previewDoc.fileUrl, '_blank');
    }
  };

  return (
    <>
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
                const isImage = isImageMimeType(doc.mimeType);

                return (
                  <button
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc)}
                    className={cn(
                      'flex flex-col items-center p-2 rounded-lg border bg-muted/30',
                      'hover:bg-muted transition-colors cursor-pointer',
                      'min-w-[70px]'
                    )}
                  >
                    {/* Thumbnail or Icon */}
                    <div className="relative">
                      {isImage && doc.fileUrl ? (
                        // Show actual image thumbnail for images
                        <div className="h-12 w-12 rounded overflow-hidden bg-muted">
                          <img
                            src={doc.fileUrl}
                            alt={doc.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = '<div class="h-12 w-12 flex items-center justify-center"><svg class="h-6 w-6 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></div>';
                            }}
                          />
                        </div>
                      ) : (
                        // Show icon for non-images or missing URL
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
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

      {/* Image Preview Dialog */}
      <Dialog open={previewDoc !== null} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewDoc?.name || 'Document'}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                className="ml-4"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir en nueva pestaña
              </Button>
            </DialogTitle>
          </DialogHeader>
          {previewDoc && previewDoc.fileUrl && (
            <div className="flex items-center justify-center bg-muted rounded-lg p-4 min-h-[300px]">
              <img
                src={previewDoc.fileUrl}
                alt={previewDoc.name}
                className="max-w-full max-h-[60vh] object-contain rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DocumentsSection;
