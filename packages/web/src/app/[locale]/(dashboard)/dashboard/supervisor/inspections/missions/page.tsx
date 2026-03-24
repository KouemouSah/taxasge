'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { inspectionApi } from '@/modules/inspections/services/api'
import { MissionCalendar } from '@/modules/inspections/components/MissionCalendar'
import { MissionPlanPanel } from '@/modules/inspections/components/MissionPlanPanel'
import type { MissionListItem } from '@/modules/inspections/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMonday(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - diff)
  return date.toISOString().slice(0, 10)
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MissionsPage() {
  const locale = useLocale()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('inspection')

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [missions, setMissions] = useState<MissionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showPlan, setShowPlan] = useState(false)

  // Stats
  const stats = useMemo(() => {
    const planned = missions.filter(m => m.status === 'planned').length
    const inProgress = missions.filter(m => m.status === 'in_progress').length
    const completed = missions.filter(m => m.status === 'completed').length
    const totalInspections = missions.reduce((s, m) => s + m.inspections_done, 0)
    const totalTarget = missions.reduce((s, m) => s + m.inspections_target, 0)
    return { planned, inProgress, completed, totalInspections, totalTarget }
  }, [missions])

  // Fetch missions for the current week
  const fetchMissions = useCallback(async (start?: string) => {
    const ws = start || weekStart
    const weekEnd = addDays(ws, 6)
    try {
      setLoading(true)
      const result = await inspectionApi.listMissions({
        date_from: ws,
        date_to: weekEnd,
        page_size: 50,
      })
      setMissions(result.items)
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [weekStart, toast, t])

  useEffect(() => { fetchMissions() }, [fetchMissions])

  const handleWeekChange = useCallback((ws: string) => {
    setWeekStart(ws)
    fetchMissions(ws)
  }, [fetchMissions])

  const handleMissionCreated = useCallback(() => {
    setShowPlan(false)
    fetchMissions()
  }, [fetchMissions])

  return (
    <div className="flex flex-col gap-4 p-4 max-h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => router.push(`/${locale}/dashboard/supervisor/inspections`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">{t('mission.title') || 'Missions'}</h1>
          </div>
        </div>

        {/* Week stats badges */}
        <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            {stats.planned} {t('mission.planned')}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {stats.inProgress} {t('mission.in_progress')}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {stats.completed} {t('mission.completed')}
          </span>
          <span className="tabular-nums font-medium text-foreground">
            {stats.totalInspections}/{stats.totalTarget} {t('mission.inspections')}
          </span>
        </div>
      </div>

      {/* Mission plan panel (inline collapsible) */}
      <MissionPlanPanel
        open={showPlan}
        onClose={() => setShowPlan(false)}
        onMissionCreated={handleMissionCreated}
      />

      {/* Calendar */}
      <div className="flex-1 overflow-y-auto">
        <MissionCalendar
          missions={missions}
          loading={loading}
          onMissionClick={(id) => router.push(`/${locale}/dashboard/supervisor/inspections/missions/${id}`)}
          onWeekChange={handleWeekChange}
          onCreateMission={() => setShowPlan(true)}
        />
      </div>
    </div>
  )
}
