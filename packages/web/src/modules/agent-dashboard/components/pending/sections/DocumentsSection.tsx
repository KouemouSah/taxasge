/**
 * DocumentsSection - Document thumbnails display with signed URL preview
 *
 * @module agent-dashboard/components/pending/sections
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
import { FileText, Check, AlertCircle, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RequestPreviewDocument } from '../../../services/agent-requests-api';
import { getDocumentDownloadUrl } from '../../../services/agent-requests-api';

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

function guessIsImage(fileName?: string | null): boolean {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DocumentsSection({
  documents,
  documentsCount,
  requestId,
}: DocumentsSectionProps) {
  const t = useTranslations('agent.pending.preview');
  const [previewDoc, setPreviewDoc] = useState<RequestPreviewDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);

  const handleDocumentClick = async (doc: RequestPreviewDocument) => {
    setLoadingDocId(doc.id);
    try {
      const signedUrl = await getDocumentDownloadUrl(requestId, doc.code);
      const isImage = guessIsImage(doc.name);
      if (isImage) {
        setPreviewDoc(doc);
        setPreviewUrl(signedUrl);
      } else {
        window.open(signedUrl, '_blank');
      }
    } catch {
      // Fallback: try opening fileUrl directly if available
      if (doc.fileUrl) {
        window.open(doc.fileUrl, '_blank');
      }
    } finally {
      setLoadingDocId(null);
    }
  };

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
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
                const isLoading = loadingDocId === doc.id;

                return (
                  <button
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc)}
                    disabled={isLoading}
                    className={cn(
                      'flex flex-col items-center p-2 rounded-lg border bg-muted/30',
                      'hover:bg-muted transition-colors cursor-pointer',
                      'min-w-[70px]',
                      isLoading && 'opacity-60'
                    )}
                  >
                    {/* Thumbnail or Icon */}
                    <div className="relative">
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                        ) : (
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        )}
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

      {/* Image Preview Dialog */}
      <Dialog open={previewDoc !== null} onOpenChange={(open) => { if (!open) { setPreviewDoc(null); setPreviewUrl(null); } }}>
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
                {t('openInNewTab', { defaultValue: 'Abrir en nueva pestaña' })}
              </Button>
            </DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex items-center justify-center bg-muted rounded-lg p-4 min-h-[300px]">
              <img
                src={previewUrl}
                alt={previewDoc?.name || 'Document'}
                className="max-w-full max-h-[60vh] object-contain rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<p class="text-muted-foreground text-sm">No se pudo cargar la imagen</p>';
                  }
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DocumentsSection;
