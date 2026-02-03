/**
 * RequestPreview - Right column preview of selected request
 *
 * @module agent-dashboard/components/pending
 * @date 2026-01-26
 */

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
import { useDisplayConfigForWorkflow } from '@/modules/admin/hooks/useDisplayConfigs';
import type { ServiceRequestPreview, ActionType } from '../../services/agent-requests-api';
import type { EntityCode } from '../../types';

// =============================================================================
// DEFAULT PREVIEW SECTIONS
// =============================================================================

const DEFAULT_PREVIEW_SECTIONS = ['info', 'extractedData', 'documents', 'contact', 'appointment'];

// NOTE: System columns filtering removed.
// The backend _extract_preview_data_dynamic() already returns only the configured
// extracted columns. list_columns are passed directly to ExtractedDataSection.

// =============================================================================
// PREDEFINED REJECTION REASONS
// =============================================================================

const REJECTION_REASONS = [
  { code: 'DIP_EXPIRE', labelKey: 'dipExpired' },
  { code: 'DOC_ILLEGIBLE', labelKey: 'docIllegible' },
  { code: 'PHOTO_NON_CONFORME', labelKey: 'photoNonCompliant' },
  { code: 'FRAUDE_SUSPECTEE', labelKey: 'fraudSuspected' },
  { code: 'DOC_FAUX', labelKey: 'docFalse' },
  { code: 'AUTRE', labelKey: 'other' },
] as const;

// =============================================================================
// PROPS
// =============================================================================

interface RequestPreviewProps {
  data: ServiceRequestPreview;
  entityCode: EntityCode;
  action?: ActionType;
  /** Workflow code for fetching display config (sections to show) */
  workflowCode?: string;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onNavigate: (direction: 'prev' | 'next') => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  // External control of reject dialog (for keyboard shortcuts)
  showRejectDialog?: boolean;
  onRejectDialogChange?: (open: boolean) => void;
  // Callback when appointment is created
  onAppointmentCreated?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RequestPreview({
  data,
  entityCode,
  action = 'pending',
  workflowCode,
  onApprove,
  onReject,
  onNavigate,
  canNavigatePrev,
  canNavigateNext,
  showRejectDialog: externalShowRejectDialog,
  onRejectDialogChange,
  onAppointmentCreated,
}: RequestPreviewProps) {
  // History action is read-only (no approve/reject buttons)
  const isReadOnly = action === 'history';
  const locale = useLocale();
  const t = useTranslations('agent.pending.preview');

  // Fetch display config for this specific workflow (Option D: workflow-specific preview)
  const { data: displayConfig } = useDisplayConfigForWorkflow(
    workflowCode ?? '',
    !!workflowCode
  );

  // Determine which sections to show (from config or defaults)
  const previewSections = displayConfig?.preview_sections ?? DEFAULT_PREVIEW_SECTIONS;
  const shouldShowSection = (sectionId: string) => previewSections.includes(sectionId);

  // Pass configured columns directly — backend already returns only extracted data
  // for these columns in the dynamic extracted_data dict
  const extractedColumns = useMemo(() => {
    return displayConfig?.list_columns ?? [];
  }, [displayConfig?.list_columns]);

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [internalShowRejectDialog, setInternalShowRejectDialog] = useState(false);
  const [selectedReasonCode, setSelectedReasonCode] = useState<string>('');
  const [customReason, setCustomReason] = useState('');

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
    if (!selectedReasonCode) {
      toast.error(t('rejectReasonRequired'));
      return;
    }
    // For "AUTRE", require custom reason
    if (selectedReasonCode === 'AUTRE' && !customReason.trim()) {
      toast.error(t('customReasonRequired'));
      return;
    }

    // Build final reason: predefined label + custom text if applicable
    const selectedReason = REJECTION_REASONS.find(r => r.code === selectedReasonCode);
    const predefinedLabel = selectedReason ? t(`rejectReasons.${selectedReason.labelKey}`) : '';
    const finalReason = selectedReasonCode === 'AUTRE'
      ? customReason.trim()
      : `${predefinedLabel}${customReason.trim() ? ` - ${customReason.trim()}` : ''}`;

    setIsRejecting(true);
    try {
      await onReject(finalReason);
      toast.success(t('rejectSuccess'));
      setShowRejectDialog(false);
      setSelectedReasonCode('');
      setCustomReason('');
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

      {/* Content - Sections rendered based on display config */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Section: Request Info (always shown - critical info) */}
        {shouldShowSection('info') && (
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
        )}

        {/* Section: Extracted Data - displays columns from display_config */}
        {shouldShowSection('extractedData') && (
          <ExtractedDataSection
            data={data.extractedData}
            columns={extractedColumns}
          />
        )}

        {/* Section: Documents */}
        {shouldShowSection('documents') && (
          <DocumentsSection
            documents={data.documents}
            documentsCount={data.documentsCount}
            requestId={data.id}
          />
        )}

        {/* Section: Contact */}
        {shouldShowSection('contact') && (
          <ContactSection
            name={data.contactName}
            email={data.contactEmail}
            phone={data.contactPhone}
          />
        )}

        {/* Section: Appointment */}
        {shouldShowSection('appointment') && (
          <AppointmentSection
            appointment={data.appointment}
            requestId={data.id}
            entityCode={entityCode}
            onAppointmentCreated={onAppointmentCreated}
          />
        )}
      </div>

      {/* Actions Footer - Hidden for read-only (history) mode */}
      {!isReadOnly && (
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
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={(open) => {
        setShowRejectDialog(open);
        if (!open) {
          setSelectedReasonCode('');
          setCustomReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectTitle')}</DialogTitle>
            <DialogDescription>
              {t('rejectDescription', { reference: data.reference })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Predefined reasons select */}
            <div className="space-y-2">
              <Label>{t('selectReason')}</Label>
              <Select
                value={selectedReasonCode}
                onValueChange={setSelectedReasonCode}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectReasonPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((reason) => (
                    <SelectItem key={reason.code} value={reason.code}>
                      {t(`rejectReasons.${reason.labelKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom reason textarea - always visible for additional details */}
            <div className="space-y-2">
              <Label>
                {selectedReasonCode === 'AUTRE'
                  ? t('customReasonRequired')
                  : t('additionalDetails')}
              </Label>
              <Textarea
                placeholder={selectedReasonCode === 'AUTRE'
                  ? t('customReasonPlaceholder')
                  : t('additionalDetailsPlaceholder')}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
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
              disabled={isRejecting || !selectedReasonCode || (selectedReasonCode === 'AUTRE' && !customReason.trim())}
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
