/**
 * Dynamic Workflow Action Page
 * Handles all workflow sub-menu actions (pending, validation, appointments, history)
 *
 * @route /[locale]/dashboard/agent/cnedoge-pasaporte/[workflowGroup]/[action]
 * @date 2026-01-25
 */

'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
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
  ArrowLeft,
  FileText,
  Construction,
  AlertCircle,
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

// =============================================================================
// COMPONENT
// =============================================================================

export default function WorkflowActionPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('agent');
  const tCommon = useTranslations('common');

  const workflowGroup = (params?.workflowGroup as string) || '';
  const action = (params?.action as string) || '';

  const { isLoading } = useAgentDashboard();

  // Validate action
  const isValidAction = VALID_ACTIONS.includes(action as ActionType);
  const currentAction = isValidAction ? (action as ActionType) : 'pending';

  // Memoize the formatted workflow group name
  const formattedWorkflowGroup = useMemo(() => {
    if (!workflowGroup) return '';
    return workflowGroup
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [workflowGroup]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
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

  // Invalid action - show error instead of notFound()
  if (!isValidAction) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acción no válida</AlertTitle>
          <AlertDescription>
            La acción &quot;{action}&quot; no es válida. Acciones permitidas: pending, validation, appointments, history.
          </AlertDescription>
        </Alert>
        <Link href={`/${locale}/dashboard/agent/cnedoge-pasaporte`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al panel
          </Button>
        </Link>
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
                {formattedWorkflowGroup} - {t(`nav.${currentAction}`)}
              </h1>
              <p className="text-muted-foreground">
                {t(`pages.${currentAction}.description`, { workflow: formattedWorkflowGroup })}
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
          {t('pages.underConstruction.description', { feature: `${formattedWorkflowGroup} ${t(`nav.${currentAction}`)}` })}
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
            {t(`pages.${currentAction}.placeholder`)}
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
