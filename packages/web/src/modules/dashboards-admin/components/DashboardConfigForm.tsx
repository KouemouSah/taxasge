/**
 * DashboardConfigForm — inline form for one dashboard's Looker config.
 *
 * Zod regex matches the BD CHECK constraints (migration 317) and the
 * Pydantic regex (DashboardConfigUpdateRequest). Three layers of defense:
 * Zod (instant feedback) → Pydantic (422) → BD CHECK (last-resort).
 */

'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations, useFormatter } from 'next-intl'
import { Database, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'

import { useUpdateDashboardConfig } from '../hooks/useUpdateDashboardConfig'
import type {
  DashboardConfigDTO,
  DashboardConfigSource,
} from '../types'

// Patterns must mirror exactly:
//   - Pydantic: DashboardConfigUpdateRequest (regex + length)
//   - BD CHECK: chk_looker_report_id_format / chk_looker_page_id_format (migration 317)
const REPORT_ID_PATTERN = /^[a-zA-Z0-9_-]{8,64}$/
const PAGE_ID_PATTERN = /^[a-zA-Z0-9_]{1,32}$/

const SOURCE_BADGE: Record<DashboardConfigSource, 'default' | 'secondary' | 'outline'> = {
  db: 'default',
  env_fallback: 'secondary',
  unset: 'outline',
}

interface Props {
  config: DashboardConfigDTO
}

export function DashboardConfigForm({ config }: Props) {
  const t = useTranslations('admin.dashboards.config')
  const format = useFormatter()
  const { toast } = useToast()
  const mutation = useUpdateDashboardConfig()

  const schema = z.object({
    looker_report_id: z
      .string()
      .min(8, { message: t('form.reportIdInvalid') })
      .max(64, { message: t('form.reportIdInvalid') })
      .regex(REPORT_ID_PATTERN, { message: t('form.reportIdInvalid') }),
    looker_page_id: z
      .string()
      .regex(PAGE_ID_PATTERN, { message: t('form.pageIdInvalid') })
      .max(32, { message: t('form.pageIdInvalid') })
      .or(z.literal(''))
      .optional()
      .nullable(),
    is_active: z.boolean(),
  })

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      looker_report_id: config.looker_report_id ?? '',
      looker_page_id: config.looker_page_id ?? '',
      is_active: config.is_active,
    },
  })

  const onSubmit = (values: FormValues) => {
    const body = {
      looker_report_id: values.looker_report_id,
      // Send null when empty so the BD column ends up NULL, not the string "".
      looker_page_id: values.looker_page_id ? values.looker_page_id : null,
      is_active: values.is_active,
    }
    mutation.mutate(
      { dashboardId: config.dashboard_id, body },
      {
        onSuccess: () => {
          toast({
            title: t('form.saveSuccess'),
            description: config.label,
          })
        },
        onError: (err: unknown) => {
          const status = (err as { response?: { status?: number } })?.response?.status
          const detail =
            (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            t('form.saveError')
          toast({
            variant: 'destructive',
            title: status === 429 ? t('form.rateLimitError') : t('form.saveError'),
            description: detail,
          })
        },
      },
    )
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{config.label}</h3>
            <Badge variant={SOURCE_BADGE[config.source]} className="font-mono text-xs">
              {t(`source.${config.source}`)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          {config.source === 'db' && config.updated_at ? (
            <>
              <div>
                {t('updatedAt', {
                  date: format.dateTime(new Date(config.updated_at), {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }),
                })}
              </div>
              {config.updated_by && (
                <div className="font-mono text-[10px] mt-0.5">
                  {config.updated_by.slice(0, 8)}…
                </div>
              )}
            </>
          ) : (
            <div className="italic">{t('neverUpdated')}</div>
          )}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="looker_report_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.reportIdLabel')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('form.reportIdPlaceholder')}
                    className="font-mono text-sm"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </FormControl>
                <FormDescription>{t('form.reportIdHelp')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="looker_page_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.pageIdLabel')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder={t('form.pageIdPlaceholder')}
                    className="font-mono text-sm"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </FormControl>
                <FormDescription>{t('form.pageIdHelp')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                  <FormLabel>{t('form.isActiveLabel')}</FormLabel>
                  <FormDescription className="text-xs">
                    {t('form.isActiveHelp')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label={t('form.isActiveLabel')}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            {mutation.isSuccess && !mutation.isPending && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('form.savedJustNow')}
              </span>
            )}
            {mutation.isError && !mutation.isPending && (
              <span className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {t('form.saveError')}
              </span>
            )}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('form.saving')}
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  {t('form.save')}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
