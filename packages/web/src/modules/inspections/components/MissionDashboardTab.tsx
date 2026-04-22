'use client'

/**
 * MissionDashboardTab — KPIs, trends, top agents, stale zones for missions.
 */

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  CalendarDays, CheckCircle2, Target, TrendingUp, DollarSign,
  Clock, Users, MapPin, AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { inspectionApi } from '@/modules/inspections/services/api'
import type { MissionAnalyticsResponse } from '@/modules/inspections/types'

interface Props {
  locationFilter?: string
}

export function MissionDashboardTab({ locationFilter }: Props) {
  const t = useTranslations('inspection')
  const [data, setData] = useState<MissionAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const result = await inspectionApi.getMissionAnalytics({
        entity_location_id: locationFilter || undefined,
      })
      setData(result)
    } catch {
      // Silent
    } finally {
      setLoading(false)
    }
  }, [locationFilter])

  useEffect(() => { fetch() }, [fetch])

  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    )
  }

  const s = data.summary
  const fmtXAF = (v: number) => new Intl.NumberFormat('es-GQ', { maximumFractionDigits: 0 }).format(v)

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={CalendarDays} color="text-blue-600" bg="bg-blue-50"
          value={`${s.completed}/${s.total_missions}`}
          label={t('missions.completed', { defaultMessage: 'Missions completed' })}
          sub={`${s.completion_rate}%`}
        />
        <KpiCard
          icon={Target} color="text-green-600" bg="bg-green-50"
          value={`${s.total_inspections_actual}/${s.total_inspections_target}`}
          label={t('missions.inspections', { defaultMessage: 'Inspections' })}
          sub={`${s.target_achievement_rate}%`}
        />
        <KpiCard
          icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50"
          value={`${s.conformity_rate}%`}
          label={t('missions.conformity', { defaultMessage: 'Conformity' })}
        />
        <KpiCard
          icon={DollarSign} color="text-orange-600" bg="bg-orange-50"
          value={`${fmtXAF(s.total_collected)} XAF`}
          label={t('missions.collected', { defaultMessage: 'Collected' })}
          sub={s.avg_duration_hours > 0 ? `~${s.avg_duration_hours}h avg` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trends */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('missions.weeklyTrends', { defaultMessage: 'Weekly trends' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.trends.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">{t('common.noData', { defaultMessage: 'No data' })}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.week', { defaultMessage: 'Week' })}</TableHead>
                    <TableHead className="text-center">{t('missions.missionsLabel', { defaultMessage: 'Missions' })}</TableHead>
                    <TableHead className="text-center">{t('missions.inspections', { defaultMessage: 'Insp.' })}</TableHead>
                    <TableHead className="text-center">{t('missions.conformity', { defaultMessage: 'Conf.' })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.trends.map((row) => (
                    <TableRow key={row.week}>
                      <TableCell className="text-xs">{row.week}</TableCell>
                      <TableCell className="text-center font-medium">{row.missions}</TableCell>
                      <TableCell className="text-center">{row.inspections}</TableCell>
                      <TableCell className="text-center">
                        {row.conformity != null ? `${row.conformity}%` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('missions.topAgents', { defaultMessage: 'Top agents' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_agents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">{t('common.noData', { defaultMessage: 'No data' })}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.agent', { defaultMessage: 'Agent' })}</TableHead>
                    <TableHead className="text-center">{t('missions.missionsLabel', { defaultMessage: 'Miss.' })}</TableHead>
                    <TableHead className="text-center">{t('missions.inspections', { defaultMessage: 'Insp.' })}</TableHead>
                    <TableHead className="text-center">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.top_agents.map((agent, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{agent.agent_name}</TableCell>
                      <TableCell className="text-center">{agent.missions_count}</TableCell>
                      <TableCell className="text-center font-medium">{agent.inspections}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={
                          (agent.avg_target_pct ?? 0) >= 80 ? 'default' :
                          (agent.avg_target_pct ?? 0) >= 50 ? 'secondary' : 'destructive'
                        }>
                          {agent.avg_target_pct ?? 0}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stale Zones */}
      {data.stale_zones.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              {t('missions.staleZones', { defaultMessage: 'Zones requiring attention' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.stale_zones.map((zone) => (
                <Badge key={zone.zone_code} variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {zone.zone_code} {zone.zone_name ? `(${zone.zone_name})` : ''}
                  {' — '}
                  {zone.days_since != null ? `${zone.days_since}d` : 'never'}
                  {zone.pending_count > 0 ? ` · ${zone.pending_count} pending` : ''}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, color, bg, value, label, sub }: {
  icon: React.ElementType; color: string; bg: string;
  value: string; label: string; sub?: string
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className={`p-1.5 rounded ${bg}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <span className="text-xs text-muted-foreground truncate">{label}</span>
        </div>
        <p className="text-lg font-bold tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}
