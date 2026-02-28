'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users } from 'lucide-react';
import type { AgentLoadItem } from '../types';

interface AgentWorkloadPanelProps {
  agents: AgentLoadItem[];
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'available': return 'bg-green-500';
    case 'normal': return 'bg-blue-500';
    case 'busy': return 'bg-yellow-500';
    case 'overloaded': return 'bg-red-500';
    case 'unavailable': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
}

function getCapacityColor(pct: number): string {
  if (pct >= 80) return 'bg-red-500';
  if (pct >= 60) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'available': return 'Disponible';
    case 'normal': return 'Normal';
    case 'busy': return 'Ocupado';
    case 'overloaded': return 'Sobrecargado';
    case 'unavailable': return 'No disponible';
    default: return status;
  }
}

export function AgentWorkloadPanel({ agents }: AgentWorkloadPanelProps) {
  const totalPending = agents.reduce((s, a) => s + a.pending, 0);
  const totalCompleted = agents.reduce((s, a) => s + a.completedToday, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Carga de Agentes</CardTitle>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{totalPending} pendientes</span>
            <span>{totalCompleted} hoy</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {agents.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay agentes activos
          </p>
        )}
        {agents.map(agent => (
          <div key={agent.agentProfileId} className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${getStatusColor(agent.status)}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate">{agent.agentName}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs h-5">
                    {agent.pending} pend.
                  </Badge>
                  <Badge variant="secondary" className="text-xs h-5">
                    {agent.completedToday} hoy
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={Math.min(agent.capacityPct, 100)}
                  className={`h-1.5 flex-1 [&>div]:${getCapacityColor(agent.capacityPct)}`}
                />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {agent.capacityPct}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {getStatusLabel(agent.status)}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
