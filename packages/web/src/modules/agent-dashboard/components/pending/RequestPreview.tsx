/**
 * RequestPreview - Right column preview of selected request
 *
 * @module agent-dashboard/components/pending
 * @date 2026-01-26
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { RequestInfoSection } from './sections/RequestInfoSection';
import { ExtractedDataSection } from './sections/ExtractedDataSection';
import { DocumentsSection } from './sections/DocumentsSection';
import { ContactSection } from './sections/ContactSection';
import { AppointmentSection } from './sections/AppointmentSection';
import type { ServiceRequestPreview } from '../../services/agent-requests-api';
import type { EntityCode } from '../../types';

// =============================================================================
// PROPS
// =============================================================================

interface RequestPreviewProps {
  data: ServiceRequestPreview;
  entityCode: EntityCode;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onNavigate: (direction: 'prev' | 'next') => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  // External control of reject dialog (for keyboard shortcuts)
  showRejectDialog?: boolean;
  onRejectDialogChange?: (open: boolean) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RequestPreview({
  data,
  entityCode,
  onApprove,
  onReject,
  onNavigate,
  canNavigatePrev,
  canNavigateNext,
  showRejectDialog: externalShowRejectDialog,
  onRejectDialogChange,
}: RequestPreviewProps) {
  const locale = useLocale();
  const t = useTranslations('agent.pending.preview');

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [internalShowRejectDialog, setInternalShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Use external control if provided, otherwise use internal state
  const showRejectDialog = externalShowRejectDialog ?? internalShowRejectDialog;
  const setShowRejectDialog = onRejectDialogChange ?? setInternalShowRejectDialog;

  const entityPath = entityCode.toLowerCase().replace('_', '-');
  const detailUrl = `/${locale}/dashboard/agent/${entityPath}/request/${data.id}`;

  // Handle approve
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove();
      toast.success(t('approveSuccess'));
    } catch (error) {
      console.error('Approve error:', error);
      toast.error(t('approveError'));
    } finally {
      setIsApproving(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error(t('rejectReasonRequired'));
      return;
    }
    setIsRejecting(true);
    try {
      await onReject(rejectReason);
      toast.success(t('rejectSuccess'));
      setShowRejectDialog(false);
      setRejectReason('');
    } catch (error) {
      console.error('Reject error:', error);
      toast.error(t('rejectError'));
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('prev')}
            disabled={!canNavigatePrev}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('prev')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {(data.listIndex ?? 0) + 1} / {data.listTotal ?? 1}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('next')}
            disabled={!canNavigateNext}
          >
            {t('next')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <Link href={detailUrl}>
          <Button variant="outline" size="sm">
            {t('viewDetail')}
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Section 1: Request Info */}
        <RequestInfoSection
          reference={data.reference}
          workflowLabel={data.workflowLabel}
          solicitudType={data.solicitudType}
          motivo={data.motivo}
          priority={data.priority}
          status={data.status}
          slaStatus={data.slaStatus}
          slaRemainingHours={data.slaRemainingHours}
          isMinor={data.isMinor}
        />

        {/* Section 2: Extracted Data */}
        <ExtractedDataSection
          data={data.extractedData}
          isMinor={data.isMinor}
          solicitudType={data.solicitudType}
        />

        {/* Section 3: Documents */}
        <DocumentsSection
          documents={data.documents}
          documentsCount={data.documentsCount}
          requestId={data.id}
        />

        {/* Section 4: Contact */}
        <ContactSection
          name={data.contactName}
          email={data.contactEmail}
          phone={data.contactPhone}
        />

        {/* Section 5: Appointment */}
        {data.appointment && (
          <AppointmentSection appointment={data.appointment} />
        )}
      </div>

      {/* Actions Footer */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleApprove}
            disabled={isApproving || isRejecting}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {isApproving ? t('approving') : t('approve')}
            <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-green-700/50 rounded">A</kbd>
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowRejectDialog(true)}
            disabled={isApproving || isRejecting}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            {t('reject')}
            <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-red-700/50 rounded">R</kbd>
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          {t('keyboardHint')}
        </p>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectTitle')}</DialogTitle>
            <DialogDescription>
              {t('rejectDescription', { reference: data.reference })}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t('rejectReasonPlaceholder')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isRejecting}
            >
              {t('cancelReject')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {isRejecting ? t('rejecting') : t('confirmReject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RequestPreview;
