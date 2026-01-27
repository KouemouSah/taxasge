'use client';

/**
 * History/Timeline Page for CNEDOGE Passport Agents
 * Displays chronological history of actions on service requests
 *
 * @route /[locale]/dashboard/agent/cnedoge-pasaporte/historial
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  RefreshCw,
  ChevronLeft,
  Search,
  Filter,
  Clock,
  ArrowRightCircle,
  FileText,
  UserPlus,
  Calendar,
  ShieldCheck,
  MessageSquare,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { serviceRequestsApi } from '@/modules/service-requests/services/api';
import {
  HistoryActionType,
  getHistoryActionLabel,
  getHistoryActionColor,
  getStatusLabel,
  getStatusColor,
} from '@/modules/service-requests/types';
import type {
  HistorySummaryItem,
  HistoryEntry,
  HistoryListResponse,
} from '@/modules/service-requests/types';

const ENTITY_CODE = 'CNEDOGE_PASAPORTE';
const WORKFLOW_CODES = ['PASAPORTE_NUEVO', 'PASAPORTE_RENOVACION'];

// Icon mapping for history action types
const ActionIcon: React.FC<{ action: HistoryActionType; className?: string }> = ({
  action,
  className = 'h-4 w-4',
}) => {
  switch (action) {
    case HistoryActionType.STATUS_CHANGE:
      return <ArrowRightCircle className={className} />;
    case HistoryActionType.DOCUMENT_ADDED:
    case HistoryActionType.DOCUMENT_VALIDATED:
      return <FileText className={className} />;
    case HistoryActionType.ASSIGNED:
    case HistoryActionType.UNASSIGNED:
      return <UserPlus className={className} />;
    case HistoryActionType.CITA_SCHEDULED:
    case HistoryActionType.CITA_CANCELLED:
      return <Calendar className={className} />;
    case HistoryActionType.VERIFICATION_UPDATED:
      return <ShieldCheck className={className} />;
    case HistoryActionType.COMMENT_ADDED:
    case HistoryActionType.NOTE_ADDED:
      return <MessageSquare className={className} />;
    case HistoryActionType.PAYMENT_RECEIVED:
    case HistoryActionType.PAYMENT_FAILED:
      return <CreditCard className={className} />;
    case HistoryActionType.ESCALATED:
      return <AlertTriangle className={className} />;
    case HistoryActionType.REOPENED:
      return <RotateCcw className={className} />;
    default:
      return <Clock className={className} />;
  }
};

// Timeline entry component
const TimelineEntry: React.FC<{
  entry: HistoryEntry;
  locale: 'es' | 'fr' | 'en';
  isLast: boolean;
}> = ({ entry, locale, isLast }) => {
  const colorClass = getHistoryActionColor(entry.action);
  const date = new Date(entry.performedAt);

  return (
    <div className="flex gap-4">
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-full ${colorClass}`}>
          <ActionIcon action={entry.action} className="h-4 w-4" />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-sm">
              {getHistoryActionLabel(entry.action, locale)}
            </p>
            {entry.action === HistoryActionType.STATUS_CHANGE && (
              <div className="flex items-center gap-2 mt-1">
                {entry.previousStatus && (
                  <Badge variant="outline" className="text-xs">
                    {getStatusLabel(entry.previousStatus, locale)}
                  </Badge>
                )}
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                {entry.newStatus && (
                  <Badge className={`text-xs ${getStatusColor(entry.newStatus)}`}>
                    {getStatusLabel(entry.newStatus, locale)}
                  </Badge>
                )}
              </div>
            )}
            {entry.comment && (
              <p className="text-sm text-muted-foreground mt-1">{entry.comment}</p>
            )}
            {entry.details && Object.keys(entry.details).length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {entry.details.document_code && (
                  <span>Doc: {entry.details.document_code as string}</span>
                )}
                {entry.details.agent_name && (
                  <span>Agent: {entry.details.agent_name as string}</span>
                )}
              </div>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{date.toLocaleDateString(locale === 'es' ? 'es-ES' : locale === 'fr' ? 'fr-FR' : 'en-US')}</p>
            <p>{date.toLocaleTimeString(locale === 'es' ? 'es-ES' : locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        {entry.performedBy && (
          <p className="text-xs text-muted-foreground mt-1">
            {entry.performedBy.isSystem ? (
              <span className="italic">Sistema</span>
            ) : (
              entry.performedBy.fullName
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default function HistorialPage() {
  const router = useRouter();
  const t = useTranslations();

  // Get locale from path (simplified - you may want to use useLocale hook)
  const [locale, setLocale] = useState<'es' | 'fr' | 'en'>('es');
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/fr/')) setLocale('fr');
    else if (path.includes('/en/')) setLocale('en');
    else setLocale('es');
  }, []);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<HistorySummaryItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Query for list of requests with history summary
  const {
    data: listData,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
    isFetching: isListFetching,
  } = useQuery({
    queryKey: ['history-list', ENTITY_CODE, statusFilter, page, pageSize],
    queryFn: () =>
      serviceRequestsApi.listRequestsWithHistory(
        ENTITY_CODE,
        WORKFLOW_CODES,
        statusFilter === 'all' ? undefined : statusFilter,
        page,
        pageSize
      ),
  });

  // Query for detailed history when a request is selected
  const {
    data: detailData,
    isLoading: isDetailLoading,
  } = useQuery({
    queryKey: ['history-detail', selectedRequest?.requestId],
    queryFn: () =>
      selectedRequest
        ? serviceRequestsApi.getRequestHistory(selectedRequest.requestId)
        : Promise.reject('No request selected'),
    enabled: !!selectedRequest,
  });

  const handleRowClick = (item: HistorySummaryItem) => {
    setSelectedRequest(item);
    setIsDetailOpen(true);
  };

  const handleBack = () => {
    router.push('/dashboard/agent/cnedoge-pasaporte');
  };

  // Filter items by search query (client-side)
  const filteredItems =
    listData?.items.filter(
      (item) =>
        !searchQuery ||
        item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.citizenName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    ) || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {t('history.title', { defaultValue: 'Historial de Solicitudes' })}
            </h1>
            <p className="text-muted-foreground">
              {t('history.subtitle', {
                defaultValue: 'Timeline de acciones en solicitudes de pasaporte',
              })}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => refetchList()}
          disabled={isListFetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isListFetching ? 'animate-spin' : ''}`}
          />
          {t('common.refresh', { defaultValue: 'Actualizar' })}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search', {
                  defaultValue: 'Buscar por referencia o nombre...',
                })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('common.all', { defaultValue: 'Todos' })}
                </SelectItem>
                <SelectItem value="DRAFT">
                  {t('status.draft', { defaultValue: 'Borrador' })}
                </SelectItem>
                <SelectItem value="SUBMITTED">
                  {t('status.submitted', { defaultValue: 'Enviada' })}
                </SelectItem>
                <SelectItem value="UNDER_REVIEW">
                  {t('status.under_review', { defaultValue: 'En Revisión' })}
                </SelectItem>
                <SelectItem value="COMPLETED">
                  {t('status.completed', { defaultValue: 'Completada' })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats summary */}
      {listData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('history.totalRequests', { defaultValue: 'Total solicitudes' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold">{listData.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('common.page', { defaultValue: 'Página' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold">
                {listData.page} / {Math.ceil(listData.total / listData.pageSize) || 1}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('common.showing', { defaultValue: 'Mostrando' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold">
                {filteredItems.length} {t('common.of', { defaultValue: 'de' })}{' '}
                {listData.items.length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isListLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : isListError ? (
            <div className="text-center py-12 text-red-500">
              {t('common.error', { defaultValue: 'Error al cargar los datos' })}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('history.noHistory', {
                defaultValue: 'No hay historial disponible',
              })}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t('common.reference', { defaultValue: 'Referencia' })}
                  </TableHead>
                  <TableHead>
                    {t('common.citizen', { defaultValue: 'Ciudadano' })}
                  </TableHead>
                  <TableHead>
                    {t('common.status', { defaultValue: 'Estado' })}
                  </TableHead>
                  <TableHead>
                    {t('history.lastAction', { defaultValue: 'Última Acción' })}
                  </TableHead>
                  <TableHead>
                    {t('history.totalActions', { defaultValue: 'Acciones' })}
                  </TableHead>
                  <TableHead>
                    {t('common.date', { defaultValue: 'Fecha' })}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.requestId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(item)}
                  >
                    <TableCell className="font-medium">{item.reference}</TableCell>
                    <TableCell>{item.citizenName || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.currentStatus)}>
                        {getStatusLabel(item.currentStatus, locale)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1 rounded ${getHistoryActionColor(
                            item.lastAction
                          )}`}
                        >
                          <ActionIcon action={item.lastAction} className="h-3 w-3" />
                        </span>
                        <span className="text-sm">
                          {getHistoryActionLabel(item.lastAction, locale)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.totalActions}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.lastActionAt
                        ? new Date(item.lastActionAt).toLocaleDateString(
                            locale === 'es' ? 'es-ES' : locale === 'fr' ? 'fr-FR' : 'en-US'
                          )
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {listData && listData.total > pageSize && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                {t('common.showingOf', {
                  defaultValue: `Mostrando ${(page - 1) * pageSize + 1}-${Math.min(
                    page * pageSize,
                    listData.total
                  )} de ${listData.total}`,
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t('common.previous', { defaultValue: 'Anterior' })}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * pageSize >= listData.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('common.next', { defaultValue: 'Siguiente' })}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-[500px] sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle>
              {t('history.detailTitle', { defaultValue: 'Timeline de Solicitud' })}
            </SheetTitle>
            <SheetDescription>
              {selectedRequest?.reference} - {selectedRequest?.citizenName}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {isDetailLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : detailData ? (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="text-lg font-bold">{detailData.totalStatusChanges || 0}</p>
                    <p className="text-xs text-muted-foreground">Estados</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="text-lg font-bold">{detailData.totalDocuments || 0}</p>
                    <p className="text-xs text-muted-foreground">Docs</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="text-lg font-bold">{detailData.totalAssignments || 0}</p>
                    <p className="text-xs text-muted-foreground">Asign.</p>
                  </div>
                </div>

                {/* Timeline */}
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="pr-4">
                    {detailData.entries.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {t('history.noEntries', { defaultValue: 'Sin entradas de historial' })}
                      </p>
                    ) : (
                      detailData.entries.map((entry, index) => (
                        <TimelineEntry
                          key={entry.id}
                          entry={entry}
                          locale={locale}
                          isLast={index === detailData.entries.length - 1}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <p className="text-center text-muted-foreground">
                {t('common.noData', { defaultValue: 'Sin datos' })}
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
