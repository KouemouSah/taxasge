'use client';

/**
 * Treasury Analyst Tab — Command Bar Analytics UI.
 *
 * Bloomberg/Metabase-inspired full-width data-first layout:
 * - Briefing strip (collapsible)
 * - Command bar (input + quick actions dropdown + send)
 * - KPI grid + Artifact tables (full width)
 * - LLM analysis (markdown)
 * - Horizontal history bar (bottom)
 *
 * All data displayed via typed artifacts (deterministic, from SQL results).
 * LLM generates markdown analysis text only.
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles, Send, BarChart3, Clock, TrendingUp,
  Loader2, Wrench, Download, Users, ShieldAlert,
  ChevronDown, ChevronUp, ArrowLeftRight,
  ListOrdered,
} from 'lucide-react';
import { renderMarkdown } from '@/core/utils/markdown';
import { useTreasuryAnalyst, useTreasuryBriefing } from '../hooks';
import { ArtifactRenderer } from './ArtifactRenderers';
import type { TreasuryAnalystResponse, ArtifactData } from '../types';

// ─── Types ──────────────────────────────────────────────────

interface QAEntry {
  id: string;
  question: string;
  response: TreasuryAnalystResponse;
  timestamp: Date;
  isError?: boolean;
}

let _qaCounter = 0;

const PRIORITY_COLORS: Record<string, string> = {
  normal: 'bg-green-100 text-green-800 border-green-200',
  attention: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

// ─── Quick Actions Config ───────────────────────────────────

const QUICK_ACTIONS = [
  {
    labelKey: 'quickActions.revenueSummary' as const,
    question: 'Resumen de ingresos del mes: montante total, transacciones, desglose por metodo de pago y servicio.',
    icon: BarChart3,
  },
  {
    labelKey: 'quickActions.pendingSla' as const,
    question: 'Estado de pagos pendientes y alertas SLA. ¿Hay pagos vencidos o en riesgo? Detalle por urgencia.',
    icon: Clock,
  },
  {
    labelKey: 'quickActions.agentPerformance' as const,
    question: 'Rendimiento de los agentes de tesoreria: validaciones, rechazos, tiempo promedio y tasa SLA por agente.',
    icon: Users,
  },
  {
    labelKey: 'quickActions.anomalies' as const,
    question: 'Anomalias detectadas y recomendaciones. ¿Cuantas hay abiertas? ¿Hay patrones preocupantes?',
    icon: ShieldAlert,
  },
  {
    labelKey: 'quickActions.forecast' as const,
    question: 'Tendencia de ingresos de los ultimos 7 dias. ¿Hay patron al alza o a la baja?',
    icon: TrendingUp,
  },
  {
    labelKey: 'quickActions.entityComparison' as const,
    question: 'Comparación de ingresos y volúmenes entre entidades. ¿Cuál genera más revenue?',
    icon: ArrowLeftRight,
  },
  {
    labelKey: 'quickActions.rejectionAnalysis' as const,
    question: 'Análisis de rechazos: patrones por agente y motivo. ¿Hay agentes con tasa alta de rechazo?',
    icon: ListOrdered,
  },
] as const;

// ─── Helper ─────────────────────────────────────────────────

function downloadMarkdown(content: string, question: string) {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  const filename = `treasury-analyst-${timestamp}.md`;
  const markdown = `# ${question}\n\n_Generado: ${new Date().toLocaleString()}_\n\n---\n\n${content}\n`;
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ─────────────────────────────────────────

function BriefingStrip({
  briefing,
  isLoading,
}: {
  briefing: { briefing: string; priority: string; recommendations?: string[] } | undefined;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('treasury.analyst');

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-blue-50/30 border-blue-200">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
        <span className="text-xs text-blue-700">{t('analyzing')}</span>
      </div>
    );
  }

  if (!briefing) return null;

  const priorityClass = PRIORITY_COLORS[briefing.priority] || '';
  const oneLine = briefing.briefing.split('\n')[0].replace(/\*\*/g, '').slice(0, 120);
  const recommendations = briefing.recommendations ?? [];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`rounded-lg border px-3 py-2 ${priorityClass}`}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 w-full text-left">
            <Badge variant="outline" className={`text-[10px] shrink-0 ${priorityClass}`}>
              {t(`briefingPriority.${briefing.priority}` as 'briefingPriority.normal')}
            </Badge>
            <span className="text-xs truncate flex-1">{oneLine}{!open && '...'}</span>
            {recommendations.length > 0 && (
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {recommendations.length} {t('recommendations')}
              </Badge>
            )}
            {open ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div
            className="text-sm prose prose-sm max-w-none mt-2 pt-2 border-t"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(briefing.briefing) }}
          />
          {recommendations.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                {t('recommendationsLabel')}
              </p>
              <ul className="space-y-1">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function CommandBar({
  value,
  onChange,
  onSubmit,
  isPending,
  onQuickAction,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  onQuickAction: (question: string) => void;
}) {
  const t = useTranslations('treasury.analyst');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleFormSubmit} className="flex gap-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('placeholder')}
        disabled={isPending}
        className="flex-1"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isPending} type="button">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            {t('quickActionsMenu')}
            <ChevronDown className="h-3.5 w-3.5 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem
                key={action.labelKey}
                onClick={() => onQuickAction(action.question)}
              >
                <Icon className="h-3.5 w-3.5 mr-2" />
                {t(action.labelKey)}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button type="submit" disabled={!value.trim() || isPending} size="sm">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </form>
  );
}

function AnalyzingCard() {
  const t = useTranslations('treasury.analyst');
  return (
    <Card className="border-blue-200 bg-blue-50/30 mb-3">
      <CardContent className="py-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <div>
            <p className="text-sm font-medium text-blue-800">{t('analyzing')}</p>
            <p className="text-xs text-blue-600">{t('analyzingDesc')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalysisCard({
  answer,
  toolsUsed,
  question,
  artifacts,
}: {
  answer: string;
  toolsUsed: string[];
  question: string;
  artifacts?: ArtifactData[];
}) {
  const t = useTranslations('treasury.analyst');

  const handleExport = useCallback(async (format: 'pdf' | 'markdown') => {
    try {
      const { default: treasuryApi } = await import('../services/api');
      await treasuryApi.exportAnalystResponse(
        question, answer, artifacts || [], format
      );
    } catch {
      // Fallback to client-side markdown download
      downloadMarkdown(answer, question);
    }
  }, [question, answer, artifacts]);

  return (
    <Card className="mb-3">
      <CardContent className="py-4 space-y-3">
        <div
          className="text-sm prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(answer) }}
        />
        <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
          {toolsUsed.length > 0 && (
            <div className="flex items-center gap-1">
              <Wrench className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {t('toolsUsed')}: {toolsUsed.join(', ')}
              </span>
            </div>
          )}
          <div className="ml-auto flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => handleExport('pdf')}
            >
              <Download className="h-3 w-3 mr-1" />
              PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => handleExport('markdown')}
            >
              <Download className="h-3 w-3 mr-1" />
              MD
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryBar({
  entries,
  activeId,
  onSelect,
}: {
  entries: QAEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations('treasury.analyst');

  if (entries.length === 0) return null;

  return (
    <div className="border-t pt-2">
      <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">
        {t('historyLabel')}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {entries.map((entry) => (
          <Button
            key={entry.id}
            variant={activeId === entry.id ? 'default' : 'outline'}
            size="sm"
            className="shrink-0 h-7 text-xs max-w-[200px]"
            onClick={() => onSelect(entry.id)}
          >
            <span className="truncate">
              {entry.question.slice(0, 30)}
              {entry.question.length > 30 ? '...' : ''}
            </span>
            <span className="text-[10px] text-muted-foreground ml-1.5">
              {entry.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function TreasuryAnalystTab() {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<QAEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  // Stable session ID for conversation memory (persists for the lifetime of this component)
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const analystMutation = useTreasuryAnalyst();
  const { data: briefing, isLoading: briefingLoading } = useTreasuryBriefing();
  const t = useTranslations('treasury.analyst');

  // Active entry (from history selection or latest)
  const activeEntry = useMemo(() => {
    if (activeEntryId) {
      return history.find((e) => e.id === activeEntryId) || null;
    }
    return history[0] || null;
  }, [history, activeEntryId]);

  // Extract artifacts from active entry
  const { kpiArtifacts, tableArtifacts, summaryArtifacts } = useMemo(() => {
    const artifacts = activeEntry?.response?.artifacts || [];
    return {
      kpiArtifacts: artifacts.filter((a): a is Extract<ArtifactData, { type: 'kpi_grid' }> => a.type === 'kpi_grid'),
      tableArtifacts: artifacts.filter((a): a is Extract<ArtifactData, { type: 'table' }> => a.type === 'table'),
      summaryArtifacts: artifacts.filter((a): a is Extract<ArtifactData, { type: 'summary' }> => a.type === 'summary'),
    };
  }, [activeEntry]);

  const handleAsk = useCallback(
    async (question: string) => {
      if (!question.trim()) return;
      setInputValue('');

      // Build previous context from last successful Q&A for drill-down
      const lastEntry = history.find((e) => !e.isError);
      const previousContext = lastEntry
        ? { question: lastEntry.question, toolsUsed: lastEntry.response.toolsUsed }
        : undefined;

      try {
        const response = await analystMutation.mutateAsync({
          question,
          previousContext,
          sessionId: sessionIdRef.current,
        });
        const newId = `qa-${++_qaCounter}`;
        setHistory((prev) => [
          { id: newId, question, response, timestamp: new Date() },
          ...prev.slice(0, 9),
        ]);
        setActiveEntryId(newId);
      } catch {
        const newId = `qa-${++_qaCounter}`;
        setHistory((prev) => [
          {
            id: newId,
            question,
            response: { answer: t('error'), toolsUsed: [], data: {}, artifacts: [] },
            timestamp: new Date(),
            isError: true,
          },
          ...prev.slice(0, 9),
        ]);
        setActiveEntryId(newId);
      }
    },
    [analystMutation, t, history]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] gap-3">
      {/* 1. Briefing Strip */}
      <BriefingStrip briefing={briefing} isLoading={briefingLoading} />

      {/* 2. Command Bar */}
      <CommandBar
        value={inputValue}
        onChange={setInputValue}
        onSubmit={() => handleAsk(inputValue)}
        isPending={analystMutation.isPending}
        onQuickAction={handleAsk}
      />

      {/* 3. Main Content — scrollable */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="pr-4">
          {/* 3a. Loading */}
          {analystMutation.isPending && <AnalyzingCard />}

          {/* 3b. KPI Grids */}
          {kpiArtifacts.map((artifact, i) => (
            <ArtifactRenderer key={`kpi-${i}`} artifact={artifact} />
          ))}

          {/* 3c. Summary artifacts */}
          {summaryArtifacts.map((artifact, i) => (
            <ArtifactRenderer key={`sum-${i}`} artifact={artifact} />
          ))}

          {/* 3d. Tables */}
          {tableArtifacts.map((artifact, i) => (
            <ArtifactRenderer key={`tbl-${i}`} artifact={artifact} />
          ))}

          {/* 3e. LLM Analysis */}
          {activeEntry && !activeEntry.isError && (
            <AnalysisCard
              answer={activeEntry.response.answer}
              toolsUsed={activeEntry.response.toolsUsed}
              question={activeEntry.question}
              artifacts={activeEntry.response.artifacts}
            />
          )}

          {/* 3f. Error state */}
          {activeEntry?.isError && (
            <Card className="border-red-200 mb-3">
              <CardContent className="py-4">
                <p className="text-sm text-red-700">{activeEntry.response.answer}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() => handleAsk(activeEntry.question)}
                  disabled={analystMutation.isPending}
                >
                  {t('retry')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 3g. Empty state */}
          {history.length === 0 && !analystMutation.isPending && (
            <Card className="border-dashed">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Sparkles className="h-8 w-8 mb-3 opacity-50" />
                  <p className="text-sm">{t('emptyState')}</p>
                  <p className="text-xs mt-1">{t('emptyExamples')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* 4. History Bar */}
      <HistoryBar
        entries={history}
        activeId={activeEntryId}
        onSelect={setActiveEntryId}
      />
    </div>
  );
}

export default TreasuryAnalystTab;
