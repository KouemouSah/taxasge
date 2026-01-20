'use client';

/**
 * Assignment Rules Management Page
 * List and manage auto-assignment rules
 *
 * Backend Model (from assignment_rule.py):
 * - rule_type: RuleType enum (round_robin, load_balance, specialization, priority_based)
 * - criteria: Dict[str, Any] (flexible JSON)
 * - priority: int (1-100)
 * - is_active: bool
 *
 * @route /[locale]/dashboard/supervisor/assignments/rules
 * @date 2026-01-19
 */

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Plus,
  Pencil,
  Trash2,
  Settings2,
  ArrowLeft,
  Search,
  RefreshCw,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import apiClient from '@/core/api/client';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es, fr, enUS } from 'date-fns/locale';

// ============================================================================
// TYPES - Aligned with backend assignment_rule.py
// ============================================================================

type RuleType = 'round_robin' | 'load_balance' | 'specialization' | 'priority_based';

interface AssignmentRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: RuleType;
  criteria: Record<string, unknown>;  // Dict[str, Any] from backend
  priority: number;  // 1-100
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

interface _PaginatedResponse {
  items: AssignmentRule[];
  total: number;
  page: number;
  page_size: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RULE_TYPE_LABELS: Record<RuleType, { label: string; description: string; color: string }> = {
  round_robin: {
    label: 'Round Robin',
    description: 'Distribute equally among agents',
    color: 'bg-blue-100 text-blue-800',
  },
  load_balance: {
    label: 'Load Balance',
    description: 'Assign based on current workload',
    color: 'bg-green-100 text-green-800',
  },
  specialization: {
    label: 'Specialization',
    description: 'Match agent skills to task type',
    color: 'bg-purple-100 text-purple-800',
  },
  priority_based: {
    label: 'Priority Based',
    description: 'Route high-priority items first',
    color: 'bg-orange-100 text-orange-800',
  },
};

const PAGE_SIZE = 10;

// ============================================================================
// COMPONENT
// ============================================================================

export default function AssignmentRulesPage() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const t = useTranslations('supervisor');
  const tCommon = useTranslations('common');

  const dateLocale = locale === 'es' ? es : locale === 'fr' ? fr : enUS;

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<AssignmentRule | null>(null);

  // Fetch rules
  const { data, isLoading, isError, error, refetch } = useQuery<AssignmentRule[]>({
    queryKey: ['supervisor', 'rules', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await apiClient.get(`/supervisor/rules?${params.toString()}`);
      return response.data;
    },
  });

  // Filter and paginate client-side (backend doesn't have search)
  const filteredRules = data?.filter((rule) => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rule.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesSearch;
  }) ?? [];

  const totalPages = Math.ceil(filteredRules.length / PAGE_SIZE);
  const paginatedRules = filteredRules.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Activate rule mutation
  const activateMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await apiClient.post(`/supervisor/rules/${ruleId}/activate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor', 'rules'] });
      toast.success(t('rules.activated'));
    },
    onError: (err: Error) => {
      toast.error(err.message || tCommon('error'));
    },
  });

  // Deactivate rule mutation
  const deactivateMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await apiClient.post(`/supervisor/rules/${ruleId}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor', 'rules'] });
      toast.success(t('rules.deactivated'));
    },
    onError: (err: Error) => {
      toast.error(err.message || tCommon('error'));
    },
  });

  // Delete (archive) rule mutation
  const deleteMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      await apiClient.delete(`/supervisor/rules/${ruleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor', 'rules'] });
      setDeleteConfirmRule(null);
      toast.success(tCommon('deleted'));
    },
    onError: (err: Error) => {
      toast.error(err.message || tCommon('error'));
    },
  });

  // Toggle active status
  const handleToggleActive = (rule: AssignmentRule) => {
    if (rule.is_active) {
      deactivateMutation.mutate(rule.id);
    } else {
      activateMutation.mutate(rule.id);
    }
  };

  // Format criteria for display
  const formatCriteria = (criteria: Record<string, unknown>): string => {
    if (!criteria || Object.keys(criteria).length === 0) {
      return '-';
    }
    const entries = Object.entries(criteria).slice(0, 2);
    const formatted = entries.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ');
    if (Object.keys(criteria).length > 2) {
      return `${formatted}...`;
    }
    return formatted;
  };

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
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/supervisor`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings2 className="h-6 w-6" />
            {t('rules.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('rules.description') || 'Manage automatic assignment rules for your team'}
          </p>
        </div>
        <Link href={`/${locale}/dashboard/supervisor/assignments/rules/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t('rules.createRule')}
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{tCommon('total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{tCommon('active')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data?.filter((r) => r.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{tCommon('inactive')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">
              {data?.filter((r) => !r.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('rules.ruleTypes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(data?.map((r) => r.rule_type)).size || 0}
            </div>
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={tCommon('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon('all')}</SelectItem>
                <SelectItem value="active">{tCommon('active')}</SelectItem>
                <SelectItem value="inactive">{tCommon('inactive')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {tCommon('refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('name')}</TableHead>
                <TableHead>{t('rules.ruleType')}</TableHead>
                <TableHead>{t('rules.criteria')}</TableHead>
                <TableHead className="text-center">{t('rules.priority')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
                <TableHead>{tCommon('updated')}</TableHead>
                <TableHead className="text-right">{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? tCommon('noResults') : tCommon('noData')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRules.map((rule) => {
                  const typeInfo = RULE_TYPE_LABELS[rule.rule_type];
                  return (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {rule.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={typeInfo?.color || 'bg-gray-100'}>
                          {typeInfo?.label || rule.rule_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] block truncate">
                          {formatCriteria(rule.criteria)}
                        </code>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{rule.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rule.is_active ? 'default' : 'secondary'}
                          className={rule.is_active ? 'bg-green-100 text-green-800' : ''}
                        >
                          {rule.is_active ? tCommon('active') : tCommon('inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {rule.updated_at
                            ? formatDistanceToNow(new Date(rule.updated_at), {
                                addSuffix: true,
                                locale: dateLocale,
                              })
                            : formatDistanceToNow(new Date(rule.created_at), {
                                addSuffix: true,
                                locale: dateLocale,
                              })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(rule)}
                            disabled={activateMutation.isPending || deactivateMutation.isPending}
                            title={rule.is_active ? t('rules.deactivate') : t('rules.activate')}
                          >
                            {rule.is_active ? (
                              <Pause className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <Play className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Link href={`/${locale}/dashboard/supervisor/assignments/rules/${rule.id}/edit`}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmRule(rule)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {t('rules.showing')} {(currentPage - 1) * PAGE_SIZE + 1}-
                {Math.min(currentPage * PAGE_SIZE, filteredRules.length)} {t('rules.of')}{' '}
                {filteredRules.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmRule} onOpenChange={() => setDeleteConfirmRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('rules.deleteRule')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tCommon('deleteConfirm')} &quot;{deleteConfirmRule?.name}&quot;?
              <br />
              <span className="text-muted-foreground text-sm">
                {t('rules.deleteWarning') || 'This action cannot be undone.'}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmRule && deleteMutation.mutate(deleteConfirmRule.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
