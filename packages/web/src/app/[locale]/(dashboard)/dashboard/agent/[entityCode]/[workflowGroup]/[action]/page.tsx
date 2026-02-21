/**
 * Dynamic Workflow Action Page - Unified for ALL Agent Entities
 * Displays service requests table with filters for pending, validation, appointments, history
 *
 * This single page handles all entities:
 *   - ALL entities including cnedoge-pasaporte and cnedoge-residencia
 *   - Entity-specific filters (solicitudType/motivo, workflowCode) driven by config
 *
 * @route /[locale]/dashboard/agent/[entityCode]/[workflowGroup]/[action]
 * @date 2026-01-30
 */

'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// Icons
import {
  Clock,
  CheckCircle,
  Calendar,
  History,
  ArrowLeft,
  Search,
  Filter,
  AlertCircle,
  Eye,
  AlertTriangle,
  FileText,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

// Hooks
import { useEntityServiceRequests, type ActionType } from '@/modules/agent-dashboard/hooks';

// Split View for pending action
import { PendingPage } from '@/modules/agent-dashboard/components/pending/PendingPage';
// Validation and History pages (same as CNEDOGE)
import { ValidationPage } from '@/modules/agent-dashboard/components/validation';
import { HistoryPage } from '@/modules/agent-dashboard/components/history';
import { GenericFilteredList } from '@/modules/agent-dashboard/components/GenericFilteredList';
import { slugToEntityCode } from '@/modules/agent-dashboard/utils';
import type { EntityCode } from '@/modules/agent-dashboard/types';

// =============================================================================
// ENTITY-SPECIFIC FILTER CONFIGURATIONS
// =============================================================================

// Workflow codes per entity (for HistoryPage stats + API filtering)
const ENTITY_WORKFLOW_CODES: Record<string, string[]> = {
  CNEDOGE_PASAPORTE: ['PASAPORTE_NUEVO', 'PASAPORTE_RENOVACION'],
  CNEDOGE_RESIDENCIA: [
    'RESIDENCIA_PRIMERA_VEZ',
    'RESIDENCIA_RENOVACION',
    'RESIDENCIA_DUPLICADO',
    'RESIDENCIA_CAMBIO_DATOS',
    'RESIDENCIA_REAGRUPACION',
  ],
};

// Residencia workflow options for dropdown filter
const RESIDENCIA_WORKFLOW_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'RESIDENCIA_PRIMERA_VEZ', label: 'Primera Vez' },
  { value: 'RESIDENCIA_RENOVACION', label: 'Renovacion' },
  { value: 'RESIDENCIA_DUPLICADO', label: 'Duplicado' },
  { value: 'RESIDENCIA_CAMBIO_DATOS', label: 'Cambio de Datos' },
  { value: 'RESIDENCIA_REAGRUPACION', label: 'Reagrupacion' },
];

// Get type label for the table "Tipo" column (entity-aware)
function getTypeLabel(
  entityCode: string,
  workflowCode: string,
  solicitudType?: string,
  motivo?: string | null,
): string {
  if (entityCode === 'CNEDOGE_PASAPORTE') {
    if (solicitudType === 'expedicion') return 'Nuevo';
    if (solicitudType === 'renovacion' && motivo) {
      const labels: Record<string, string> = {
        VENCIMIENTO: 'Renovacion',
        PERDIDA: 'Perdida',
        ROBO: 'Robo',
        DETERIORO: 'Deterioro',
      };
      return labels[motivo.toUpperCase()] || 'Renovacion';
    }
    return solicitudType || '-';
  }
  if (entityCode === 'CNEDOGE_RESIDENCIA') {
    const labels: Record<string, string> = {
      RESIDENCIA_PRIMERA_VEZ: 'Primera Vez',
      RESIDENCIA_RENOVACION: 'Renovacion',
      RESIDENCIA_DUPLICADO: 'Duplicado',
      RESIDENCIA_CAMBIO_DATOS: 'Cambio Datos',
      RESIDENCIA_REAGRUPACION: 'Reagrupacion',
    };
    return labels[workflowCode] || workflowCode;
  }
  // Generic: format workflowCode to readable text
  return workflowCode?.replace(/_/g, ' ') || '-';
}

// Maps entityCode to workflow group titleKey
const ENTITY_WORKFLOW_TITLES: Record<string, string> = {
  'dgt': 'agent.nav.driverLicenses',
  'ofive': 'agent.nav.vehicles',
  'onrc': 'agent.nav.contracts',
  'extranjeria': 'agent.nav.residences',
  'policia': 'agent.nav.certificates',
  'minfp': 'agent.nav.civilServants',
  'itve': 'agent.nav.inspections',
  // 'dgi': 'agent.nav.declarations', // Not yet implemented
};

// =============================================================================
// CONSTANTS
// =============================================================================

// Standard actions with dedicated components
const STANDARD_ACTIONS: ActionType[] = ['pending', 'validation', 'appointments', 'escalations', 'history'];

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  pending: <Clock className="h-5 w-5" />,
  validation: <CheckCircle className="h-5 w-5" />,
  appointments: <Calendar className="h-5 w-5" />,
  escalations: <ShieldAlert className="h-5 w-5" />,
  history: <History className="h-5 w-5" />,
};

const ACTION_COLORS: Record<ActionType, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  validation: 'bg-blue-100 text-blue-800',
  appointments: 'bg-green-100 text-green-800',
  escalations: 'bg-orange-100 text-orange-800',
  history: 'bg-gray-100 text-gray-800',
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'bg-cyan-100 text-cyan-800',
  UNDER_REVIEW: 'bg-teal-100 text-teal-800',
  DOSSIER_VALIDE: 'bg-indigo-100 text-indigo-800',
  REJECTED: 'bg-red-100 text-red-800',
  CITA_SCHEDULED: 'bg-sky-100 text-sky-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-200 text-green-900',
  CANCELLED: 'bg-gray-200 text-gray-600',
  DOCUMENTS_REQUIRED: 'bg-orange-100 text-orange-800',
  PAYMENT_PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  APPROVED: 'bg-green-100 text-green-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-500 text-white',
  HIGH: 'bg-orange-500 text-white',
  NORMAL: 'bg-blue-100 text-blue-800',
  LOW: 'bg-gray-100 text-gray-800',
};

const SLA_COLORS: Record<string, string> = {
  on_track: 'text-green-600',
  at_risk: 'text-yellow-600',
  violated: 'text-red-600',
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function UnifiedWorkflowActionPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('agent');
  const tCommon = useTranslations('common');

  const searchParams = useSearchParams();

  // Extract route params
  const entityCode = (params?.entityCode as string) || '';
  const workflowGroup = (params?.workflowGroup as string) || '';
  const action = (params?.action as string) || '';

  // Convert URL slug to database entity code (deterministic: lower-kebab → UPPER_SNAKE)
  const ENTITY_CODE = slugToEntityCode(entityCode);

  // Validate action — standard actions get dedicated components, others get GenericFilteredList
  const isStandardAction = STANDARD_ACTIONS.includes(action as ActionType);
  const currentAction = isStandardAction ? (action as ActionType) : 'pending';
  const isValidAction = isStandardAction; // For backward compat with the rest of the component

  // Entity-specific config
  const entityWorkflowCodes = ENTITY_WORKFLOW_CODES[ENTITY_CODE];
  const isPasaporte = ENTITY_CODE === 'CNEDOGE_PASAPORTE';
  const isResidencia = ENTITY_CODE === 'CNEDOGE_RESIDENCIA';

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [solicitudType, setSolicitudType] = useState<string>('all');
  const [motivo, setMotivo] = useState<string>('all');
  const [workflowCode, setWorkflowCode] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch service requests
  const {
    requests,
    total,
    totalPages,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useEntityServiceRequests({
    entityCode: ENTITY_CODE,
    action: currentAction,
    search: searchTerm || undefined,
    priority: priority !== 'all' ? (priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT') : undefined,
    solicitudType: isPasaporte && solicitudType !== 'all' ? (solicitudType as 'expedicion' | 'renovacion') : undefined,
    motivo: isPasaporte && motivo !== 'all' ? (motivo as 'vencimiento' | 'perdida' | 'robo' | 'deterioro') : undefined,
    workflowCode: isResidencia && workflowCode !== 'all' ? workflowCode : undefined,
    page: currentPage,
    pageSize,
    enabled: isValidAction,
  });

  // Formatted workflow group name
  const formattedWorkflowGroup = useMemo(() => {
    const titleKey = ENTITY_WORKFLOW_TITLES[entityCode];
    if (titleKey) {
      try {
        return t(titleKey.replace('agent.nav.', 'nav.'));
      } catch {
        // Fallback to formatted workflowGroup
      }
    }
    if (!workflowGroup) return '';
    return workflowGroup
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [workflowGroup, entityCode, t]);

  // Handle row click - save all request IDs for navigation
  const handleRowClick = (requestId: string) => {
    // Store all request IDs in sessionStorage for prev/next navigation
    const requestIds = requests.map(r => r.id);
    sessionStorage.setItem('agent-request-ids', JSON.stringify(requestIds));
    router.push(`/${locale}/dashboard/agent/${entityCode}/request/${requestId}`);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSolicitudType('all');
    setMotivo('all');
    setWorkflowCode('all');
    setPriority('all');
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Use split view for pending action (optimized for bulk processing)
  if (currentAction === 'pending') {
    return <PendingPage entityCode={ENTITY_CODE} />;
  }

  // Use ValidationPage for validation action (same as CNEDOGE)
  if (currentAction === 'validation') {
    return (
      <ValidationPage
        entityCode={ENTITY_CODE}
        basePath={`/dashboard/agent/${entityCode}`}
        workflowGroup={workflowGroup as string}
      />
    );
  }

  // Use HistoryPage for history action (same as CNEDOGE with stats)
  if (currentAction === 'history') {
    return (
      <HistoryPage
        entityCode={ENTITY_CODE}
        workflowCodes={entityWorkflowCodes}
        basePath={`/dashboard/agent/${entityCode}`}
      />
    );
  }

  // Non-standard action — render GenericFilteredList (for custom sub-items like "Completados")
  if (!isStandardAction) {
    return (
      <GenericFilteredList
        entityCode={ENTITY_CODE}
        entityUrlCode={entityCode}
        action={action}
        searchParams={searchParams}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardContent className="pt-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al cargar datos</AlertTitle>
          <AlertDescription>
            {error?.message || 'No se pudieron cargar las solicitudes. Intente nuevamente.'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/dashboard/agent/${entityCode}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {tCommon('back')}
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${ACTION_COLORS[currentAction]}`}>
              {ACTION_ICONS[currentAction]}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {formattedWorkflowGroup} - {t(`nav.${currentAction}`)}
              </h1>
              <p className="text-muted-foreground">
                {total} solicitudes encontradas
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por referencia o nombre..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Pasaporte: Solicitud Type filter */}
            {isPasaporte && (
              <Select
                value={solicitudType}
                onValueChange={(value) => {
                  setSolicitudType(value);
                  if (value !== 'renovacion') setMotivo('all');
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="expedicion">Expedicion</SelectItem>
                  <SelectItem value="renovacion">Renovacion</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Pasaporte: Motivo filter (only for renovacion) */}
            {isPasaporte && solicitudType === 'renovacion' && (
              <Select
                value={motivo}
                onValueChange={(value) => {
                  setMotivo(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los motivos</SelectItem>
                  <SelectItem value="vencimiento">Vencimiento</SelectItem>
                  <SelectItem value="perdida">Perdida</SelectItem>
                  <SelectItem value="robo">Robo</SelectItem>
                  <SelectItem value="deterioro">Deterioro</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Residencia: Workflow Type filter */}
            {isResidencia && (
              <Select
                value={workflowCode}
                onValueChange={(value) => {
                  setWorkflowCode(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de residencia" />
                </SelectTrigger>
                <SelectContent>
                  {RESIDENCIA_WORKFLOW_OPTIONS.map((wf) => (
                    <SelectItem key={wf.value} value={wf.value}>
                      {wf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Priority */}
            <Select
              value={priority}
              onValueChange={(value) => {
                setPriority(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="LOW">Baja</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Filters */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-muted-foreground"
            >
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Solicitudes
          </CardTitle>
          <CardDescription>
            Haga clic en una fila para ver los detalles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              {ACTION_ICONS[currentAction]}
              <p className="mt-4 text-lg font-medium">
                No hay solicitudes
              </p>
              <p className="text-sm">
                No se encontraron solicitudes con los filtros seleccionados
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Referencia</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead className="w-[120px]">Tipo</TableHead>
                    <TableHead className="w-[100px]">Prioridad</TableHead>
                    <TableHead className="w-[120px]">Estado</TableHead>
                    <TableHead className="w-[80px]">SLA</TableHead>
                    <TableHead className="w-[160px]">Fecha</TableHead>
                    <TableHead className="w-[80px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(request.id)}
                    >
                      <TableCell className="font-medium">
                        {request.reference}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.citizenName}</div>
                          {request.citizenEmail && (
                            <div className="text-xs text-muted-foreground">
                              {request.citizenEmail}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(ENTITY_CODE, request.workflowCode, request.solicitudType, request.motivo)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={PRIORITY_COLORS[request.priority] || PRIORITY_COLORS.NORMAL}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[request.status] || 'bg-gray-100'}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${SLA_COLORS[request.slaStatus]}`}>
                          {request.slaStatus === 'violated' && (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                          {request.slaStatus === 'at_risk' && (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          <span className="text-xs capitalize">
                            {request.slaStatus === 'on_track' ? 'OK' : request.slaStatus === 'at_risk' ? 'Riesgo' : 'Vencido'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(request.submittedAt || request.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(request.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, total)} de {total}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STANDARD_ACTIONS.map((actionItem) => (
          <Link
            key={actionItem}
            href={`/${locale}/dashboard/agent/${entityCode}/${workflowGroup}/${actionItem}`}
          >
            <Card className={`cursor-pointer hover:bg-muted/50 transition-colors ${actionItem === currentAction ? 'border-primary ring-1 ring-primary' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${ACTION_COLORS[actionItem]}`}>
                    {ACTION_ICONS[actionItem]}
                  </div>
                  <span className="font-medium">{t(`nav.${actionItem}`)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
