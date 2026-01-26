/**
 * PendingPage - Split View for processing pending requests
 * Optimized for processing 50+ requests/day in 3-4 clicks
 *
 * @module agent-dashboard/components/pending
 * @date 2026-01-26
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch list
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
    page,
    pageSize: 20,
  });

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleNavigate('prev');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleNavigate('next');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavigate]);

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

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <Select
          value={priority || 'all'}
          onValueChange={(v) => setPriority(v === 'all' ? undefined : v as Priority)}
        >
          <SelectTrigger className="w-[140px] h-9">
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
              onApprove={handleApprove}
              onReject={handleReject}
              onNavigate={handleNavigate}
              canNavigatePrev={selectedIndex > 0}
              canNavigateNext={selectedIndex < requests.length - 1}
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
