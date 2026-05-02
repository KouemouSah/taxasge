'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Construction } from 'lucide-react'
import type { DashboardReportEntry } from '../types'

const LOOKER_BASE = 'https://lookerstudio.google.com'

/**
 * Build the embed URL from a Looker report id + optional page id.
 * Reference: https://developers.google.com/looker-studio/integrate/api
 */
function buildEmbedUrl(reportId: string, pageId: string | null): string {
  const path = pageId
    ? `/embed/reporting/${reportId}/page/${pageId}`
    : `/embed/reporting/${reportId}`
  return `${LOOKER_BASE}${path}`
}

interface Props {
  report: DashboardReportEntry
}

/**
 * Renders one Looker Studio report inside an iframe — the canonical way
 * to embed a Looker dashboard in another web app.
 *
 * Two fallback states:
 *   1. The report id is not yet provisioned (operator hasn't built the
 *      Looker report). We show a "Construction" placeholder with the
 *      runbook link instead of a 404 iframe.
 *   2. The user lost permission between the landing page load and now
 *      (rare). Sentry captures the route-level 403 in that case.
 */
export function DashboardEmbed({ report }: Props) {
  const t = useTranslations('admin.dashboards')

  if (!report.looker_report_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-amber-500" />
            {report.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('awaitingSetup')}</AlertTitle>
            <AlertDescription>
              {t('awaitingSetupHelp', { id: report.dashboard_id })}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const url = buildEmbedUrl(report.looker_report_id, report.looker_page_id)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{report.label}</h2>
        <p className="text-muted-foreground text-sm">{report.description}</p>
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <iframe
          src={url}
          title={report.label}
          className="w-full min-h-[calc(100vh-12rem)] border-0"
          allow="fullscreen"
        />
      </div>
    </div>
  )
}
