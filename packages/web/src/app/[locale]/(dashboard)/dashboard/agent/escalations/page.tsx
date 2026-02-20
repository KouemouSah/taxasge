'use client';

/**
 * Agent Escalations Page
 * View and create escalations for the current agent
 *
 * @route /[locale]/dashboard/agent/escalations
 * @date 2026-01-19
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Search,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle,
  UserCheck,
} from 'lucide-react';
import apiClient from '@/core/api/client';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es, fr, enUS } from 'date-fns/locale';

// Aligned with backend EscalationItemResponse from agent_routes.py
interface MyEscalation {
  id: string;
  queue_id: string;
  reason: string;
  priority_score: number;
  status: string;
  escalation_status: 'pending' | 'in_review' | 'resolved' | 'reassigned';
  case_reference: string;
  case_type: string;
  notes?: string;
  created_at: string;
  escalated_at: string;
}

// Priority thresholds based on priority_score (0-100+)
const getPriorityLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const STATUS_ICONS = {
  pending: Clock,
  in_review: AlertTriangle,
  resolved: CheckCircle,
  reassigned: UserCheck,
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  reassigned: 'bg-purple-100 text-purple-800',
};

export default function AgentEscalationsPage() {
  const _router = useRouter();
  const locale = useLocale();
  const t = useTranslations('agent');
  const tSupervisor = useTranslations('supervisor');
  const tCommon = useTranslations('common');

  const dateLocale = locale === 'es' ? es : locale === 'fr' ? fr : enUS;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch my escalations - uses GET /agent/service-requests/my-escalations
  const { data: escalations, isLoading, isError, error, refetch } = useQuery<MyEscalation[]>({
    queryKey: ['agent', 'escalations', 'my'],
    queryFn: async () => {
      const response = await apiClient.get('/agent/service-requests/my-escalations', {
        params: { include_resolved: true }
      });
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Filter escalations
  const filteredEscalations = escalations?.filter((esc) => {
    const matchesSearch =
      esc.case_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      esc.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || esc.escalation_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Count by status
  const pendingCount = escalations?.filter((e) => e.escalation_status === 'pending').length || 0;
  const resolvedCount = escalations?.filter((e) => e.escalation_status === 'resolved').length || 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {tCommon('error')}
            </CardTitle>
            <CardDescription>
              {(error as Error)?.message || tCommon('errorGeneric')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => refetch()}>
              {tCommon('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard/agent`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              {t('nav.myEscalations')}
            </h1>
            <p className="text-muted-foreground">{tSupervisor('escalations.title')}</p>
          </div>
        </div>
        <Link href={`/${locale}/dashboard/agent/escalations/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t('nav.escalate')}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tSupervisor('escalations.pending')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tSupervisor('escalations.resolved')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tCommon('total')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escalations?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={tCommon('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={tCommon('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon('all')}</SelectItem>
                <SelectItem value="pending">{tSupervisor('escalations.pending')}</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="resolved">{tSupervisor('escalations.resolved')}</SelectItem>
                <SelectItem value="reassigned">Reassigned</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {tCommon('refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Escalations Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('status')}</TableHead>
                <TableHead>{tSupervisor('escalations.priority')}</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>{tSupervisor('escalations.reason')}</TableHead>
                <TableHead>{tSupervisor('escalations.escalatedAt')}</TableHead>
                <TableHead>Resolution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEscalations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {tCommon('noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEscalations?.map((esc) => {
                  const StatusIcon = STATUS_ICONS[esc.escalation_status] || Clock;
                  const priorityLevel = getPriorityLevel(esc.priority_score);
                  return (
                    <TableRow key={esc.id}>
                      <TableCell>
                        <Badge className={STATUS_COLORS[esc.escalation_status] || STATUS_COLORS.pending}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {esc.escalation_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={PRIORITY_COLORS[priorityLevel]}>
                          {tSupervisor(`escalations.${priorityLevel}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{esc.case_reference || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{esc.case_type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="truncate max-w-[200px]">{esc.reason}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(esc.escalated_at), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {esc.escalation_status === 'resolved' ? (
                          <Badge variant="outline" className="bg-green-50">Resolved</Badge>
                        ) : esc.escalation_status === 'in_review' ? (
                          <Badge variant="outline" className="bg-blue-50">Under Review</Badge>
                        ) : esc.escalation_status === 'reassigned' ? (
                          <Badge variant="outline">Reassigned</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Awaiting review</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
