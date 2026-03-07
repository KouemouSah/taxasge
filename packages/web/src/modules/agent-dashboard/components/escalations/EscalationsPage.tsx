/**
 * EscalationsPage - Agent view of their escalated service requests
 * Compact, no-scroll layout optimized for agents (0-10 escalations typical)
 *
 * @module agent-dashboard/components/escalations
 * @date 2026-03-06
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  ShieldAlert,
  CheckCircle2,
  Hourglass,
  Eye,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { agentRequestsApi } from '../../services/agent-requests-api';
import type { EscalationListItem } from '../../services/agent-requests-api';
import type { EntityCode } from '../../types';

// =============================================================================
// PROPS
// =============================================================================

interface EscalationsPageProps {
  entityCode: EntityCode;
  basePath?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function getTimeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return '< 1h';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function getEscalationStatusStyle(status: string) {
  switch (status) {
    case 'pending':
      return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', icon: Hourglass };
    case 'in_review':
      return { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: Eye };
    case 'resolved':
      return { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: CheckCircle2 };
    default:
      return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', icon: Hourglass };
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function EscalationsPage({ entityCode, basePath }: EscalationsPageProps) {
  const locale = useLocale();
  const t = useTranslations('agent');
  const tCommon = useTranslations('common');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [includeResolved, setIncludeResolved] = useState(false);

  const { data: items = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['my-escalations', includeResolved],
    queryFn: () => agentRequestsApi.getMyEscalations({ includeResolved, pageSize: 100 }),
    staleTime: 30_000,
  });

  // Counts for inline badges
  const pendingCount = useMemo(() => items.filter((i) => i.escalationStatus === 'pending').length, [items]);
  const inReviewCount = useMemo(() => items.filter((i) => i.escalationStatus === 'in_review').length, [items]);

  // Filter
  const filtered = useMemo(() => {
    let result = items;
    if (statusFilter !== 'all') {
      result = result.filter((i) => i.escalationStatus === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.caseReference.toLowerCase().includes(q) ||
          i.reason.toLowerCase().includes(q) ||
          i.caseType.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, statusFilter, search]);

  const backHref = basePath
    ? `/${locale}${basePath}`
    : `/${locale}/dashboard/agent/${entityCode}`;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Compact header + filters in one row */}
      <div className="flex flex-wrap items-center gap-3 pb-3 border-b shrink-0">
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="gap-1 px-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-orange-600" />
          <h1 className="text-lg font-semibold">{t('escalations.title')}</h1>
          {items.length > 0 && (
            <Badge variant="secondary" className="text-xs">{items.length}</Badge>
          )}
          {pendingCount > 0 && (
            <Badge className="bg-orange-100 text-orange-800 text-xs gap-1">
              <Hourglass className="h-3 w-3" />
              {pendingCount}
            </Badge>
          )}
          {inReviewCount > 0 && (
            <Badge className="bg-blue-100 text-blue-800 text-xs gap-1">
              <Eye className="h-3 w-3" />
              {inReviewCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t('escalations.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 w-[200px] text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[150px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon('all')}</SelectItem>
              <SelectItem value="pending">{t('escalations.status.pending')}</SelectItem>
              <SelectItem value="in_review">{t('escalations.status.in_review')}</SelectItem>
              <SelectItem value="resolved">{t('escalations.status.resolved')}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={includeResolved ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setIncludeResolved(!includeResolved)}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            {t('escalations.showResolved')}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Content area - fills remaining viewport */}
      <div className="flex-1 min-h-0 overflow-y-auto pt-2">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-destructive">{t('escalations.loadError')}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              {tCommon('retry')}
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <ShieldAlert className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {items.length === 0 ? t('escalations.empty') : t('escalations.noResults')}
            </p>
          </div>
        )}

        {/* Escalation cards list */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((item) => (
              <EscalationCard key={item.id} item={item} locale={locale} entityCode={entityCode} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// ESCALATION CARD
// =============================================================================

function EscalationCard({
  item,
  locale,
  entityCode,
  t,
}: {
  item: EscalationListItem;
  locale: string;
  entityCode: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const style = getEscalationStatusStyle(item.escalationStatus);
  const StatusIcon = style.icon;
  const elapsed = getTimeSince(item.escalatedAt);

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-3 rounded-lg border transition-colors hover:shadow-sm',
        style.bg
      )}
    >
      {/* Status icon */}
      <div className={cn('shrink-0 flex items-center justify-center h-10 w-10 rounded-full', style.bg)}>
        <StatusIcon className={cn('h-5 w-5', style.text)} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">{item.caseReference}</span>
          <Badge variant="outline" className="text-[10px]">
            {item.caseType.replace(/_/g, ' ')}
          </Badge>
          <Badge className={cn('text-[10px] gap-0.5', style.text, style.bg)}>
            {t(`escalations.status.${item.escalationStatus}`)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1" title={item.reason}>
          {item.reason}
        </p>
      </div>

      {/* Time elapsed */}
      <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{elapsed}</span>
      </div>

      {/* View link */}
      <Link
        href={`/${locale}/dashboard/agent/${entityCode}?view=${item.id}`}
        className="shrink-0"
      >
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}

export default EscalationsPage;
