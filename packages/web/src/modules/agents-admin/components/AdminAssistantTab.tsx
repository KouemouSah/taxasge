'use client';

/**
 * Admin Assistant Tab - LLM-powered Q&A for agent management.
 * All UI text from useTranslations('admin.agents').
 * LLM responses rendered as markdown.
 *
 * @module agents-admin/components
 */

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Send, AlertTriangle, Users, BarChart3, Clock, UserX, Loader2, Wrench,
} from 'lucide-react';
import { renderMarkdown } from '@/core/utils/markdown';
import { useAdminAssistant } from '../hooks';
import type { AdminAssistantResponse } from '../types';

interface QAEntry {
  id: string;
  question: string;
  response: AdminAssistantResponse;
  timestamp: Date;
}

let _qaCounter = 0;

export function AdminAssistantTab() {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<QAEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const assistantMutation = useAdminAssistant();
  const t = useTranslations('admin.agents');

  // Quick actions use translation keys for labels but send Spanish questions
  // (because the LLM system prompt expects Spanish input)
  const QUICK_ACTIONS = [
    {
      labelKey: 'assistantQuickActions.daySummary',
      question: '¿Cuál es el resumen operativo del día? Analiza las alertas activas, la distribución de carga y detecta cualquier anomalía.',
      icon: BarChart3,
    },
    {
      labelKey: 'assistantQuickActions.inactiveAgents',
      question: '¿Hay agentes inactivos? Lista los que no tienen actividad reciente y analiza si hay un patrón.',
      icon: UserX,
    },
    {
      labelKey: 'assistantQuickActions.workloadDist',
      question: 'Muéstrame la distribución de carga de trabajo entre todas las entidades. ¿Hay desequilibrios?',
      icon: Users,
    },
    {
      labelKey: 'assistantQuickActions.slaReport',
      question: 'Dame un reporte de cumplimiento SLA. ¿Hay pagos en riesgo o vencidos? ¿Hay patrones de incumplimiento?',
      icon: Clock,
    },
    {
      labelKey: 'assistantQuickActions.anomalies',
      question: 'Analiza todos los datos disponibles y detecta anomalías o patrones inusuales en el comportamiento de los agentes.',
      icon: AlertTriangle,
    },
  ];

  const handleAsk = async (question: string) => {
    if (!question.trim()) return;
    setInputValue('');

    try {
      const response = await assistantMutation.mutateAsync(question);
      setHistory(prev => [
        { id: `qa-${++_qaCounter}`, question, response, timestamp: new Date() },
        ...prev.slice(0, 4),
      ]);
    } catch {
      setHistory(prev => [
        {
          id: `qa-${++_qaCounter}`,
          question,
          response: { answer: t('assistantError'), tools_used: [], data: {} },
          timestamp: new Date(),
        },
        ...prev.slice(0, 4),
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(inputValue);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            {t('assistantTitle')}
          </CardTitle>
          <CardDescription>{t('assistantDesc')}</CardDescription>
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
                  disabled={assistantMutation.isPending}
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
              placeholder={t('assistantPlaceholder')}
              disabled={assistantMutation.isPending}
              className="flex-1"
            />
            <Button type="submit" disabled={!inputValue.trim() || assistantMutation.isPending} size="sm">
              {assistantMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading state */}
      {assistantMutation.isPending && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <div>
                <p className="text-sm font-medium text-blue-800">{t('assistantAnalyzing')}</p>
                <p className="text-xs text-blue-600">{t('assistantAnalyzingDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.map((entry) => (
        <Card key={entry.id} className="border-muted">
          <CardContent className="py-4 space-y-3">
            {/* Question */}
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0 mt-0.5 text-[10px]">Q</Badge>
              <p className="text-sm text-muted-foreground">{entry.question}</p>
            </div>

            {/* Answer — rendered as markdown */}
            <div className="flex items-start gap-2">
              <Badge className="shrink-0 mt-0.5 text-[10px] bg-blue-100 text-blue-800 border-0">IA</Badge>
              <div
                className="text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.response.answer) }}
              />
            </div>

            {/* Tools used footer */}
            {entry.response.tools_used.length > 0 && (
              <div className="flex items-center gap-1.5 pt-2 border-t">
                <Wrench className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {t('assistantToolsUsed')}: {entry.response.tools_used.join(', ')}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {entry.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Empty state */}
      {history.length === 0 && !assistantMutation.isPending && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
              <Sparkles className="h-8 w-8 mb-3 opacity-50" />
              <p className="text-sm">{t('assistantEmptyState')}</p>
              <p className="text-xs mt-1">{t('assistantEmptyExamples')}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminAssistantTab;
