/**
 * PersonalDocumentsGrid - Grid/list of personal (uploaded + wizard-imported) documents
 *
 * Features:
 * - Infinite scroll with cursor-based pagination
 * - Category filter chips
 * - Search input
 * - Responsive grid layout (1/2/3 cols)
 * - Empty state
 * - Loading skeleton
 *
 * @module user-documents/components
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Filter,
  FileX,
  Loader2,
} from 'lucide-react';
import { useUserDocuments } from '../hooks';
import { DocumentCard } from './DocumentCard';
import { DocumentDetailSheet } from './DocumentDetailSheet';
import type { DocumentCategory, DocumentFilters, UserDocumentListItem } from '../types';
import { CATEGORY_LABELS } from '../types';

// ---------------------------------------------------------------------------
// Category filter options
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS: DocumentCategory[] = [
  'identity',
  'vehicle',
  'legal',
  'financial',
  'administrative',
  'medical',
  'education',
  'photo',
  'business',
  'employment',
  'other',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PersonalDocumentsGrid() {
  const t = useTranslations('userDocuments');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<DocumentCategory | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Build filters: personal includes both 'personal' and 'wizard_import' sources
  // We use source: 'personal' which the backend treats as personal uploads
  const filters: DocumentFilters = {
    source: 'personal',
    category,
    search: debouncedSearch || undefined,
    limit: 20,
  };

  const {
    documents,
    totalCount,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUserDocuments(filters);

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Category toggle
  const toggleCategory = useCallback(
    (cat: DocumentCategory) => {
      setCategory((prev) => (prev === cat ? undefined : cat));
    },
    []
  );

  // Handle document view - open detail sheet
  const handleView = useCallback((doc: UserDocumentListItem) => {
    setSelectedDocId(doc.id);
  }, []);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('personal.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          {CATEGORY_OPTIONS.map((cat) => (
            <Badge
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => toggleCategory(cat)}
            >
              {CATEGORY_LABELS[cat]?.es ?? cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          {t('personal.resultCount', { count: totalCount })}
        </p>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && documents.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <FileX className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">{t('personal.emptyTitle')}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {debouncedSearch || category
              ? t('personal.emptyFiltered')
              : t('personal.emptyDescription')}
          </p>
        </div>
      )}

      {/* Document grid */}
      {!isLoading && documents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto flex-1 min-h-0 pb-2">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} onView={handleView} />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} className="col-span-full h-1" />

          {/* Loading more indicator */}
          {isFetchingNextPage && (
            <div className="col-span-full flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                {t('personal.loadingMore')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Load more button fallback */}
      {!isLoading && hasNextPage && !isFetchingNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => fetchNextPage()}>
            {t('personal.loadMore')}
          </Button>
        </div>
      )}

      {/* Document detail sheet */}
      <DocumentDetailSheet
        documentId={selectedDocId}
        open={!!selectedDocId}
        onOpenChange={(open) => {
          if (!open) setSelectedDocId(null);
        }}
      />
    </div>
  );
}
