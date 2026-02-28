'use client';

/**
 * Treasury Analyst Tab - LLM-powered Q&A for financial analysis.
 * Pattern: AdminAssistantTab.tsx (agents-admin)
 * All UI text from useTranslations('treasury.analyst').
 * LLM responses rendered as markdown.
 */

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Send, BarChart3, Clock, TrendingUp,
  Loader2, Wrench, Download, RefreshCw, Users, ShieldAlert,
} from 'lucide-react';
import { renderMarkdown } from '@/core/utils/markdown';
import { useTreasuryAnalyst, useTreasuryBriefing } from '../hooks';
import type { TreasuryAnalystResponse } from '../types';

interface QAEntry {
  id: string;
  question: string;
  response: TreasuryAnalystResponse;
  timestamp: Date;
  isError?: boolean;
}

let _qaCounter = 0;

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

const PRIORITY_COLORS: Record<string, string> = {
  normal: 'bg-green-100 text-green-800 border-green-200',
  attention: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

export function TreasuryAnalystTab() {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<QAEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const analystMutation = useTreasuryAnalyst();
  const { data: briefing, isLoading: briefingLoading } = useTreasuryBriefing();
  const t = useTranslations('treasury.analyst');

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
      question: 'Tendencia de ingresos de los ultimos 7 dias. ¿Hay patron al alza o a la baja? Prevision proximos dias.',
      icon: TrendingUp,
    },
  ];

  const handleAsk = useCallback(async (question: string) => {
    if (!question.trim()) return;
    setInputValue('');

    try {
      const response = await analystMutation.mutateAsync(question);
      setHistory(prev => [
        { id: `qa-${++_qaCounter}`, question, response, timestamp: new Date() },
        ...prev.slice(0, 9),
      ]);
    } catch {
      setHistory(prev => [
        {
          id: `qa-${++_qaCounter}`,
          question,
          response: { answer: t('error'), toolsUsed: [], data: {} },
          timestamp: new Date(),
          isError: true,
        },
        ...prev.slice(0, 9),
      ]);
    }
  }, [analystMutation, t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(inputValue);
  };

  return (
    <div className="space-y-4">
      {/* Briefing Card */}
      {briefingLoading ? (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-blue-700">{t('analyzing')}</span>
            </div>
          </CardContent>
        </Card>
      ) : briefing ? (
        <Card className={`border ${PRIORITY_COLORS[briefing.priority] || ''}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t('briefingTitle')}
              </CardTitle>
              <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[briefing.priority] || ''}`}>
                {t(`briefingPriority.${briefing.priority}` as 'briefingPriority.normal')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="text-sm prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(briefing.briefing) }}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Header + Quick Actions + Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.labelKey}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAsk(action.question)}
                  disabled={analystMutation.isPending}
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {t(action.labelKey)}
                </Button>
              );
            })}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('placeholder')}
              disabled={analystMutation.isPending}
              className="flex-1"
            />
            <Button type="submit" disabled={!inputValue.trim() || analystMutation.isPending} size="sm">
              {analystMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading state */}
      {analystMutation.isPending && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <div>
                <p className="text-sm font-medium text-blue-800">{t('analyzing')}</p>
                <p className="text-xs text-blue-600">{t('analyzingDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.map((entry) => (
        <Card key={entry.id} className={`border-muted ${entry.isError ? 'border-red-200' : ''}`}>
          <CardContent className="py-4 space-y-3">
            {/* Question */}
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0 mt-0.5 text-[10px]">Q</Badge>
              <p className="text-sm text-muted-foreground flex-1">{entry.question}</p>
            </div>

            {/* Answer — rendered as markdown */}
            <div className="flex items-start gap-2">
              <Badge className="shrink-0 mt-0.5 text-[10px] bg-blue-100 text-blue-800 border-0">IA</Badge>
              <div
                className="text-sm prose prose-sm max-w-none flex-1"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.response.answer) }}
              />
            </div>

            {/* Footer: tools used + actions */}
            <div className="flex items-center gap-1.5 pt-2 border-t flex-wrap">
              {entry.response.toolsUsed.length > 0 && (
                <>
                  <Wrench className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {t('toolsUsed')}: {entry.response.toolsUsed.join(', ')}
                  </span>
                </>
              )}

              <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-2">
                {entry.isError && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => handleAsk(entry.question)}
                    disabled={analystMutation.isPending}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {t('retry')}
                  </Button>
                )}

                {!entry.isError && entry.response.answer && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => downloadMarkdown(entry.response.answer, entry.question)}
                    title={t('downloadTooltip')}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    {t('download')}
                  </Button>
                )}

                {entry.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Empty state */}
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
  );
}

export default TreasuryAnalystTab;
