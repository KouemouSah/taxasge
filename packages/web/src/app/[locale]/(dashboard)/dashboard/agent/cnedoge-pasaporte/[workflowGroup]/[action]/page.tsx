/**
 * Dynamic Workflow Action Page
 * Handles all workflow sub-menu actions (pending, validation, appointments, history)
 *
 * @route /[locale]/dashboard/agent/cnedoge-pasaporte/[workflowGroup]/[action]
 * @date 2026-01-25
 */

'use client';

import { useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle,
  Calendar,
  History,
  AlertCircle,
  ArrowLeft,
  FileText,
  Loader2,
  Construction,
} from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAgentDashboard } from '@/modules/agent-dashboard/hooks';

// =============================================================================
// TYPES
// =============================================================================

type ActionType = 'pending' | 'validation' | 'appointments' | 'history';

const VALID_ACTIONS: ActionType[] = ['pending', 'validation', 'appointments', 'history'];

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  pending: <Clock className="h-5 w-5" />,
  validation: <CheckCircle className="h-5 w-5" />,
  appointments: <Calendar className="h-5 w-5" />,
  history: <History className="h-5 w-5" />,
};

const ACTION_TITLE_KEYS: Record<ActionType, string> = {
  pending: 'nav.pending',
  validation: 'nav.validation',
  appointments: 'nav.appointments',
  history: 'nav.history',
};

const ACTION_DESCRIPTION_KEYS: Record<ActionType, string> = {
  pending: 'pages.pending.description',
  validation: 'pages.validation.description',
  appointments: 'pages.appointments.description',
  history: 'pages.history.description',
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function WorkflowActionPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('agent');
  const tCommon = useTranslations('common');

  const workflowGroup = params.workflowGroup as string;
  const action = params.action as string;

  const { isLoading, context } = useAgentDashboard();

  // Validate action
  const isValidAction = VALID_ACTIONS.includes(action as ActionType);

  // Memoize the formatted workflow group name
  const formattedWorkflowGroup = useMemo(() => {
    return workflowGroup
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [workflowGroup]);

  // Return 404 for invalid actions
  if (!isValidAction) {
    notFound();
  }

  const currentAction = action as ActionType;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/dashboard/agent/cnedoge-pasaporte`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {tCommon('back')}
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {ACTION_ICONS[currentAction]}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {formattedWorkflowGroup} - {t(ACTION_TITLE_KEYS[currentAction])}
              </h1>
              <p className="text-muted-foreground">
                {t(ACTION_DESCRIPTION_KEYS[currentAction], { workflow: formattedWorkflowGroup })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Under Construction Notice */}
      <Alert>
        <Construction className="h-4 w-4" />
        <AlertTitle>{t('pages.underConstruction.title')}</AlertTitle>
        <AlertDescription>
          {t('pages.underConstruction.description', { feature: `${formattedWorkflowGroup} ${t(ACTION_TITLE_KEYS[currentAction])}` })}
        </AlertDescription>
      </Alert>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t(`pages.${currentAction}.title`, { workflow: formattedWorkflowGroup })}
          </CardTitle>
          <CardDescription>
            {currentAction === 'pending' && t('pages.pending.placeholder')}
            {currentAction === 'validation' && t('pages.validation.placeholder')}
            {currentAction === 'appointments' && t('pages.appointments.placeholder')}
            {currentAction === 'history' && t('pages.history.placeholder')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            {ACTION_ICONS[currentAction]}
            <p className="mt-4 text-lg font-medium">
              {t('pages.noData')}
            </p>
            <p className="text-sm">
              {t('pages.checkBackLater')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {VALID_ACTIONS.map((actionItem) => (
          <Link
            key={actionItem}
            href={`/${locale}/dashboard/agent/cnedoge-pasaporte/${workflowGroup}/${actionItem}`}
          >
            <Card className={`cursor-pointer hover:bg-muted/50 transition-colors ${actionItem === currentAction ? 'border-primary' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {ACTION_ICONS[actionItem]}
                  <span className="font-medium">{t(ACTION_TITLE_KEYS[actionItem])}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
