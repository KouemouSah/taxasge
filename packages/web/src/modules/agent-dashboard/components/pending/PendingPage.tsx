/**
 * PendingPage - Split View for processing pending requests
 * Optimized for processing 50+ requests/day in 3-4 clicks
 *
 * Supports dynamic column configuration via workflow_display_config table
 *
 * @module agent-dashboard/components/pending
 * @date 2026-01-26
 * @updated 2026-02-01 - Added dynamic display config support
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEntityServiceRequests } from '../../hooks/useEntityServiceRequests';
import { useRequestPreview } from '../../hooks/useRequestPreview';
import { agentRequestsApi } from '../../services/agent-requests-api';
import { RequestList } from './RequestList';
import { RequestPreview } from './RequestPreview';
import { PreviewSkeleton } from './PreviewSkeleton';
import { DEFAULT_LIST_COLUMNS } from './RequestListItem';
import type { EntityCode } from '../../types';
import type { ActionType, Priority } from '../../services/agent-requests-api';

// =============================================================================
// PROPS
// =============================================================================

interface PendingPageProps {
  entityCode: EntityCode;
  action?: ActionType;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PendingPage({ entityCode, action = 'pending' }: PendingPageProps) {
  const t = useTranslations('agent.pending');
  const queryClient = useQueryClient();

  // State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [solicitudType, setSolicitudType] = useState<'expedicion' | 'renovacion' | undefined>(undefined);
  const [motivo, setMotivo] = useState<'vencimiento' | 'perdida' | 'robo' | 'deterioro' | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRequestDocsDialog, setShowRequestDocsDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch list of requests
  const {
    requests,
    total,
    totalPages,
    currentPage,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
  } = useEntityServiceRequests({
    entityCode,
    action,
    search: debouncedSearch || undefined,
    priority,
    solicitudType,
    motivo,
    page,
    pageSize: 20,
  });

  // List always uses default columns (Option D: consistent columns for mixed workflows)
  // Preview will fetch workflow-specific config for sections
  const displayColumns = [...DEFAULT_LIST_COLUMNS];

  // Get selected request's workflow code for preview config
  const selectedRequest = useMemo(
    () => requests.find((r) => r.id === selectedId),
    [requests, selectedId]
  );
  const selectedWorkflowCode = selectedRequest?.workflowCode;

  // Fetch preview
  const {
    data: preview,
    isLoading: previewLoading,
    isError: previewError,
  } = useRequestPreview(entityCode, selectedId, {
    listIndex: selectedIndex,
    listTotal: total,
    enabled: !!selectedId,
  });

  // Auto-select first item when list loads
  useEffect(() => {
    if (requests.length > 0 && !selectedId) {
      setSelectedId(requests[0].id);
      setSelectedIndex(0);
    }
  }, [requests, selectedId]);

  // Handle selection
  const handleSelect = useCallback((id: string, index: number) => {
    setSelectedId(id);
    setSelectedIndex(index);
  }, []);

  // Navigate to previous/next
  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? selectedIndex - 1 : selectedIndex + 1;
    if (newIndex >= 0 && newIndex < requests.length) {
      setSelectedId(requests[newIndex].id);
      setSelectedIndex(newIndex);
    }
  }, [selectedIndex, requests]);

  // Handle approve action
  const handleApprove = useCallback(async () => {
    if (!selectedId) return;

    await agentRequestsApi.makeDecision(selectedId, 'approve', {
      comments: 'Aprobado desde vista rápida',
    });

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['entity-service-requests'] });
    queryClient.invalidateQueries({ queryKey: ['request-preview'] });

    // Select next item
    if (selectedIndex < requests.length - 1) {
      setSelectedId(requests[selectedIndex + 1].id);
    } else if (selectedIndex > 0) {
      setSelectedId(requests[selectedIndex - 1].id);
      setSelectedIndex(selectedIndex - 1);
    } else {
      setSelectedId(null);
    }
  }, [selectedId, selectedIndex, requests, queryClient]);

  // Handle reject action
  const handleReject = useCallback(async (reason: string) => {
    if (!selectedId) return;

    await agentRequestsApi.makeDecision(selectedId, 'reject', {
      rejectionReason: reason,
    });

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['entity-service-requests'] });
    queryClient.invalidateQueries({ queryKey: ['request-preview'] });

    // Select next item
    if (selectedIndex < requests.length - 1) {
      setSelectedId(requests[selectedIndex + 1].id);
    } else if (selectedIndex > 0) {
      setSelectedId(requests[selectedIndex - 1].id);
      setSelectedIndex(selectedIndex - 1);
    } else {
      setSelectedId(null);
    }
  }, [selectedId, selectedIndex, requests, queryClient]);

  // Handle request documents action
  const handleRequestDocuments = useCallback(async (requestedDocuments: string[], comments: string) => {
    if (!selectedId) return;

    await agentRequestsApi.makeDecision(selectedId, 'request_documents', {
      requestedDocuments,
      comments,
    });

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['entity-service-requests'] });
    queryClient.invalidateQueries({ queryKey: ['request-preview'] });

    // Select next item
    if (selectedIndex < requests.length - 1) {
      setSelectedId(requests[selectedIndex + 1].id);
    } else if (selectedIndex > 0) {
      setSelectedId(requests[selectedIndex - 1].id);
      setSelectedIndex(selectedIndex - 1);
    } else {
      setSelectedId(null);
    }
  }, [selectedId, selectedIndex, requests, queryClient]);

  // Handle escalation
  const handleEscalate = useCallback(async (reason: string, priorityBoost: number) => {
    if (!selectedId) return;

    await agentRequestsApi.escalate(selectedId, reason, priorityBoost);

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['entity-service-requests'] });
    queryClient.invalidateQueries({ queryKey: ['request-preview'] });

    // Select next item
    if (selectedIndex < requests.length - 1) {
      setSelectedId(requests[selectedIndex + 1].id);
    } else if (selectedIndex > 0) {
      setSelectedId(requests[selectedIndex - 1].id);
      setSelectedIndex(selectedIndex - 1);
    } else {
      setSelectedId(null);
    }
  }, [selectedId, selectedIndex, requests, queryClient]);

  // Handle resolve escalation (de-escalate)
  const handleResolveEscalation = useCallback(async () => {
    if (!selectedId) return;

    await agentRequestsApi.resolveEscalation(selectedId);

    // Invalidate queries — item will disappear from escalations list
    queryClient.invalidateQueries({ queryKey: ['entity-service-requests'] });
    queryClient.invalidateQueries({ queryKey: ['request-preview'] });

    // Select next item
    if (selectedIndex < requests.length - 1) {
      setSelectedId(requests[selectedIndex + 1].id);
    } else if (selectedIndex > 0) {
      setSelectedId(requests[selectedIndex - 1].id);
      setSelectedIndex(selectedIndex - 1);
    } else {
      setSelectedId(null);
    }
  }, [selectedId, selectedIndex, requests, queryClient]);

  // Handle appointment created - refresh preview
  const handleAppointmentCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['request-preview'] });
  }, [queryClient]);

  // Keyboard navigation and shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or dialog is open
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ignore if processing an action
      if (isProcessing) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleNavigate('prev');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleNavigate('next');
          break;
        case 'a':
        case 'A':
          // Quick approve with 'A' key (disabled for history/read-only mode)
          if (action !== 'history' && selectedId && preview && !showRejectDialog) {
            e.preventDefault();
            setIsProcessing(true);
            handleApprove().finally(() => setIsProcessing(false));
          }
          break;
        case 'r':
        case 'R':
          // Open reject dialog with 'R' key (disabled for history/read-only mode)
          if (action !== 'history' && selectedId && preview && !showRejectDialog && !showRequestDocsDialog) {
            e.preventDefault();
            setShowRejectDialog(true);
          }
          break;
        case 'd':
        case 'D':
          // Open request documents dialog with 'D' key
          if (action !== 'history' && selectedId && preview && !showRejectDialog && !showRequestDocsDialog) {
            e.preventDefault();
            setShowRequestDocsDialog(true);
          }
          break;
        case 'Escape':
          // Close dialogs with Escape
          if (showRejectDialog) {
            setShowRejectDialog(false);
          }
          if (showRequestDocsDialog) {
            setShowRequestDocsDialog(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavigate, handleApprove, selectedId, preview, showRejectDialog, showRequestDocsDialog, isProcessing, action]);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('subtitle', { count: total })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchList()}
            disabled={listLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${listLoading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>
      </div>

      {/* Filters - Full Width */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        {/* Search - 5 columns */}
        <div className="col-span-5">
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full"
          />
        </div>
        {/* Type filter - 2 columns */}
        <div className="col-span-2">
          <Select
            value={solicitudType || 'all'}
            onValueChange={(v) => {
              setSolicitudType(v === 'all' ? undefined : v as 'expedicion' | 'renovacion');
              if (v !== 'renovacion') setMotivo(undefined);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder={t('filters.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
              <SelectItem value="expedicion">{t('filters.expedicion')}</SelectItem>
              <SelectItem value="renovacion">{t('filters.renovacion')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Motivo filter - 3 columns (visible only for renovacion) */}
        <div className="col-span-3">
          {solicitudType === 'renovacion' ? (
            <Select
              value={motivo || 'all'}
              onValueChange={(v) => {
                setMotivo(v === 'all' ? undefined : v as 'vencimiento' | 'perdida' | 'robo' | 'deterioro');
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={t('filters.motivo')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allMotivos')}</SelectItem>
                <SelectItem value="vencimiento">{t('filters.vencimiento')}</SelectItem>
                <SelectItem value="perdida">{t('filters.perdida')}</SelectItem>
                <SelectItem value="robo">{t('filters.robo')}</SelectItem>
                <SelectItem value="deterioro">{t('filters.deterioro')}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            /* Placeholder to maintain grid layout */
            <div className="h-9" />
          )}
        </div>
        {/* Priority filter - 2 columns */}
        <div className="col-span-2">
          <Select
            value={priority || 'all'}
            onValueChange={(v) => {
              setPriority(v === 'all' ? undefined : v as Priority);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('filters.priority')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="URGENT">Urgente</SelectItem>
              <SelectItem value="HIGH">Alta</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="LOW">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Split View */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left Column - List (35%) */}
        <div className="w-[35%] flex flex-col min-h-0">
          <RequestList
            items={requests}
            selectedId={selectedId}
            onSelect={handleSelect}
            isLoading={listLoading}
            isError={listError}
            page={currentPage}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            displayColumns={displayColumns}
          />
        </div>

        {/* Right Column - Preview (65%) */}
        <div className="w-[65%] overflow-y-auto border rounded-lg bg-card">
          {previewLoading ? (
            <PreviewSkeleton />
          ) : previewError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">{t('preview.loadError')}</p>
            </div>
          ) : preview ? (
            <RequestPreview
              data={preview}
              entityCode={entityCode}
              action={action}
              workflowCode={selectedWorkflowCode}
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestDocuments={handleRequestDocuments}
              onEscalate={handleEscalate}
              onResolveEscalation={action === 'escalations' ? handleResolveEscalation : undefined}
              onNavigate={handleNavigate}
              canNavigatePrev={selectedIndex > 0}
              canNavigateNext={selectedIndex < requests.length - 1}
              showRejectDialog={showRejectDialog}
              onRejectDialogChange={setShowRejectDialog}
              showRequestDocsDialog={showRequestDocsDialog}
              onRequestDocsDialogChange={setShowRequestDocsDialog}
              onAppointmentCreated={handleAppointmentCreated}
              escalationReason={selectedRequest?.escalationReason}
              escalatedAt={selectedRequest?.escalatedAt}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">{t('selectRequest')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PendingPage;
