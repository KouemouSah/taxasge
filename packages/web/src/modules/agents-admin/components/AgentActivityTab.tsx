'use client';

/**
 * Agent Activity Tab - Merged Workload + Performance
 * Compact single-viewport view of all agent activity metrics.
 *
 * Row 1: KPI (4 cards) - Processed, Approved, Rejected, Escalated
 * Row 2: Operations (3 cards) - Capacity, Availability, SLA
 * Row 3: Details (3 cards) - Processing Time, Quality, Locks
 * Footer: Last action / Last login
 *
 * @module agents-admin/components
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Calendar,
  Clock,
  TrendingUp,
  Lock,
} from 'lucide-react';
import type { AgentWorkload, AgentPerformance } from '../types';

interface AgentActivityTabProps {
  workload?: AgentWorkload;
  performance?: AgentPerformance;
  isLoading: boolean;
}

export function AgentActivityTab({ workload, performance, isLoading }: AgentActivityTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!workload && !performance) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Aucune donnée d&apos;activité disponible</p>
        <p className="text-xs text-muted-foreground mt-1">Les données apparaîtront après la première activité de l&apos;agent.</p>
      </div>
    );
  }

  // Performance metrics
  const processed = performance?.current_month_processed ?? 0;
  const approved = performance?.current_month_approved ?? 0;
  const rejected = performance?.current_month_rejected ?? 0;
  const escalated = performance?.current_month_escalated ?? 0;
  const slaRespected = performance?.sla_respected_count ?? 0;
  const slaMissed = performance?.sla_missed_count ?? 0;
  const slaTotal = slaRespected + slaMissed;
  const slaRate = slaTotal > 0 ? (slaRespected / slaTotal) * 100 : 100;

  // Workload metrics
  const currentAssignments = workload?.current_assignments ?? 0;
  const maxAssignments = workload?.max_concurrent_assignments ?? 20;
  const capacityPct = workload?.capacity_percentage ?? 0;
  const availability = (workload?.availability as string) ?? 'available';
  const qualityScore = workload?.quality_score_avg ?? 0;
  const successRate = workload?.success_rate ?? 0;
  const deadlineRate = workload?.deadline_compliance_rate ?? 0;

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    return `${(minutes / 60).toFixed(1)}h`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getAvailabilityConfig = (avail: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      available: { label: 'Disponible', variant: 'default' },
      on_leave: { label: 'En congé', variant: 'secondary' },
      sick_leave: { label: 'Maladie', variant: 'destructive' },
      training: { label: 'Formation', variant: 'outline' },
      mission: { label: 'Mission', variant: 'outline' },
      temporarily_unavailable: { label: 'Temp. indisponible', variant: 'secondary' },
    };
    return config[avail] || { label: avail, variant: 'outline' as const };
  };

  const getSlaColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSlaLabel = (rate: number) => {
    if (rate >= 90) return 'Excellent';
    if (rate >= 70) return 'Acceptable';
    return 'À améliorer';
  };

  const availConfig = getAvailabilityConfig(availability);

  return (
    <div className="space-y-4">
      {/* Row 1: KPI - Monthly stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {/* Processed */}
        <Card className="py-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
              Traités ce mois
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold">{processed}</div>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card className="py-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              Approuvés
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold text-green-600">{approved}</div>
            {processed > 0 && (
              <p className="text-xs text-muted-foreground">{((approved / processed) * 100).toFixed(0)}%</p>
            )}
          </CardContent>
        </Card>

        {/* Rejected */}
        <Card className="py-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              Rejetés
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold text-red-600">{rejected}</div>
            {processed > 0 && (
              <p className="text-xs text-muted-foreground">{((rejected / processed) * 100).toFixed(0)}%</p>
            )}
          </CardContent>
        </Card>

        {/* Escalated */}
        <Card className="py-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
              Escaladés
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-2xl font-bold text-orange-600">{escalated}</div>
            {processed > 0 && (
              <p className="text-xs text-muted-foreground">{((escalated / processed) * 100).toFixed(0)}%</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Operations */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        {/* Capacity */}
        <Card className="py-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              Capacité
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{currentAssignments} / {maxAssignments}</span>
              <span className="font-medium">{Number(capacityPct)}%</span>
            </div>
            <Progress
              value={Number(capacityPct)}
              className="h-2"
            />
          </CardContent>
        </Card>

        {/* Availability */}
        <Card className="py-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Disponibilité
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <Badge variant={availConfig.variant}>{availConfig.label}</Badge>
            {workload?.availability_reason && (
              <p className="text-xs text-muted-foreground mt-1">{workload.availability_reason}</p>
            )}
          </CardContent>
        </Card>

        {/* SLA Compliance */}
        <Card className="py-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Respect des SLA
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">{slaRate.toFixed(0)}%</span>
              <span className={`text-xs ${getSlaColor(slaRate)}`}>{getSlaLabel(slaRate)}</span>
            </div>
            <Progress value={slaRate} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="text-green-600">{slaRespected} respectés</span>
              <span className="text-red-600">{slaMissed} manqués</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Details */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        {/* Processing Time */}
        <Card className="py-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Temps moyen
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="text-lg font-bold">
              {formatDuration(performance?.avg_processing_minutes)}
            </div>
            <p className="text-xs text-muted-foreground">par dossier</p>
          </CardContent>
        </Card>

        {/* Quality */}
        <Card className="py-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Qualité
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4 space-y-1">
            <div className="text-lg font-bold">{Number(qualityScore).toFixed(1)}/10</div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Réussite: {(Number(successRate) * 100).toFixed(0)}%</span>
              <span>Délais: {(Number(deadlineRate) * 100).toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Locks */}
        <Card className="py-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Verrouillages
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-lg font-bold">{performance?.current_active_locks ?? 0}</span>
                <span className="text-xs text-muted-foreground ml-1">actifs</span>
              </div>
              <div className="text-xs text-muted-foreground">
                max: {performance?.max_concurrent_locks ?? 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer: Activity dates */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground px-1">
        <span>Dernière action: {formatDate(performance?.last_action_at)}</span>
        <span>Dernière connexion: {formatDate(performance?.last_login_at)}</span>
        {performance?.stats_period_start && (
          <span>Période: depuis le {performance.stats_period_start}</span>
        )}
      </div>
    </div>
  );
}

export default AgentActivityTab;
