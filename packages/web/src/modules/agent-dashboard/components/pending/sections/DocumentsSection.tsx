/**
 * DocumentsSection - Document icons with Dialog preview (iframe for PDF, img for images)
 *
 * Flow: icons in split-view → click → fetch signed URL → Dialog opens → close
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
import { FileText, Image as ImageIcon, Check, AlertCircle, Clock, ExternalLink, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RequestPreviewDocument } from '../../../services/agent-requests-api';
import { getDocumentDownloadUrl } from '../../../services/agent-requests-api';

interface DocumentsSectionProps {
  documents: RequestPreviewDocument[];
  documentsCount: number;
  requestId: string;
}

const STATUS_STYLES: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  valid: { icon: <Check className="h-3 w-3" />, color: 'text-green-600', bg: 'bg-green-50' },
  validated: { icon: <Check className="h-3 w-3" />, color: 'text-green-600', bg: 'bg-green-50' },
  pending: { icon: <Clock className="h-3 w-3" />, color: 'text-orange-600', bg: 'bg-orange-50' },
  invalid: { icon: <AlertCircle className="h-3 w-3" />, color: 'text-red-600', bg: 'bg-red-50' },
  rejected: { icon: <AlertCircle className="h-3 w-3" />, color: 'text-red-600', bg: 'bg-red-50' },
};

const DOC_LABELS: Record<string, string> = {
  dip: 'DIP',
  photo_carnet: 'Foto Carnet',
  certificado_nacimiento: 'Acta Nacimiento',
  pasaporte_antiguo: 'Pasaporte Ant.',
  denuncia_policial: 'Denuncia',
  autorizacion_parental: 'Autoriz. Parental',
  documento_representante_1: 'Doc Rep. 1',
  documento_representante_2: 'Doc Rep. 2',
  permiso_residencia: 'Permiso Residencia',
  contrato_trabajo: 'Contrato Trabajo',
  certificado_solvencia: 'Cert. Solvencia',
  certificado_penales: 'Cert. Penales',
};

function isPdf(mimeType?: string | null, fileName?: string | null): boolean {
  if (mimeType === 'application/pdf') return true;
  if (fileName?.toLowerCase().endsWith('.pdf')) return true;
  return false;
}

function isImage(mimeType?: string | null, fileName?: string | null): boolean {
  if (mimeType?.startsWith('image/')) return true;
  const ext = fileName?.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
}

export function DocumentsSection({
  documents,
  documentsCount,
  requestId,
}: DocumentsSectionProps) {
  const t = useTranslations('agent.pending.preview');
  const [previewDoc, setPreviewDoc] = useState<RequestPreviewDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDocumentClick = async (doc: RequestPreviewDocument) => {
    setLoadingDocId(doc.id);
    setError(null);
    try {
      const signedUrl = await getDocumentDownloadUrl(requestId, doc.code);
      setPreviewDoc(doc);
      setPreviewUrl(signedUrl);
    } catch (err) {
      setError(`Error al cargar ${doc.name}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoadingDocId(null);
    }
  };

  const handleClose = () => {
    setPreviewDoc(null);
    setPreviewUrl(null);
  };

  const handleOpenInNewTab = () => {
    if (previewUrl) window.open(previewUrl, '_blank');
  };

  const docIsPdf = previewDoc ? isPdf(previewDoc.mimeType, previewDoc.name) : false;
  const docIsImage = previewDoc ? isImage(previewDoc.mimeType, previewDoc.name) : false;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {t('documents')}
              <Badge variant="secondary" className="ml-1">{documentsCount}</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 p-2 bg-destructive/10 text-destructive text-xs rounded flex items-center gap-2">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto"><X className="h-3 w-3" /></button>
            </div>
          )}
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noDocuments')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {documents.map((doc) => {
                const status = STATUS_STYLES[doc.validationStatus] || STATUS_STYLES.pending;
                const label = DOC_LABELS[doc.code] || doc.code.replace(/_/g, ' ');
                const isLoading = loadingDocId === doc.id;
                const docIsImg = isImage(doc.mimeType, doc.name);

                return (
                  <button
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc)}
                    disabled={isLoading}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg border text-left',
                      'hover:bg-muted/50 transition-colors cursor-pointer',
                      isLoading && 'opacity-60'
                    )}
                  >
                    <div className={cn('shrink-0 h-9 w-9 rounded flex items-center justify-center', status.bg)}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : docIsImg ? (
                        <ImageIcon className={cn('h-4 w-4', status.color)} />
                      ) : (
                        <FileText className={cn('h-4 w-4', status.color)} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{doc.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      <Dialog open={previewDoc !== null} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-4 pt-4 pb-2 border-b shrink-0">
            <DialogTitle className="flex items-center justify-between text-sm">
              <span className="truncate mr-4">
                {DOC_LABELS[previewDoc?.code || ''] || previewDoc?.name || 'Document'}
              </span>
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab} className="shrink-0">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Nueva pestaña
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden">
            {previewUrl && docIsPdf && (
              <iframe
                src={previewUrl}
                className="w-full h-full min-h-[70vh]"
                title={previewDoc?.name || 'Document'}
              />
            )}
            {previewUrl && docIsImage && (
              <div className="flex items-center justify-center p-4 h-full bg-muted/30">
                <img
                  src={previewUrl}
                  alt={previewDoc?.name || 'Document'}
                  className="max-w-full max-h-[70vh] object-contain rounded shadow-sm"
                />
              </div>
            )}
            {previewUrl && !docIsPdf && !docIsImage && (
              <div className="flex flex-col items-center justify-center p-8 gap-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Vista previa no disponible para este tipo de archivo
                </p>
                <Button onClick={handleOpenInNewTab}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir documento
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DocumentsSection;
