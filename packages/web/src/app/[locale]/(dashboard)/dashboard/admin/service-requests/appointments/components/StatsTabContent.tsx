'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart3,
  MapPin,
  Calendar,
  Users,
  Clock,
  Building2,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  useSlotConfigs,
  useBlockedDates,
  useDelayRules,
} from '@/modules/service-requests-admin'
import type { AppointmentSlotConfig } from '@/modules/service-requests-admin'
import { DAY_OF_WEEK_LABELS } from '@/modules/service-requests-admin'

// City/Region configuration for Equatorial Guinea
const CITIES = ['Malabo', 'Bata'] as const
const REGIONS: Record<string, string> = {
  'Malabo': 'Insular',
  'Bata': 'Continental',
}

// Entity codes for display
const ENTITY_LABELS: Record<string, string> = {
  'CNEDOGE': 'CNEDOGE - Identidad',
  'DGT': 'DGT - Tráfico',
  'EXTRANJERIA': 'Extranjería',
  'MINFP': 'Función Pública',
  'ONRC': 'Registro Civil',
  'MINHV': 'Vivienda',
}

interface CityStats {
  city: string
  region: string
  totalSlots: number
  activeSlots: number
  inactiveSlots: number
  totalCapacity: number
  entitiesCovered: string[]
  daysWithSlots: number[]
}

interface EntityStats {
  entityCode: string
  label: string
  malaboSlots: number
  bataSlots: number
  totalSlots: number
  totalCapacity: number
}

export default function StatsTabContent() {
  const t = useTranslations('admin.serviceRequests.appointments')

  // Fetch data from hooks
  const { data: slotConfigs, isLoading: loadingSlots, error: slotsError } = useSlotConfigs()
  const { data: blockedDates, isLoading: loadingBlocked } = useBlockedDates()
  const { data: delayRules, isLoading: loadingDelays } = useDelayRules()

  const isLoading = loadingSlots || loadingBlocked || loadingDelays

  // Calculate statistics by city
  const cityStats = useMemo((): CityStats[] => {
    if (!slotConfigs) return []

    const statsByCity: Record<string, CityStats> = {}

    // Initialize stats for each city
    CITIES.forEach(city => {
      statsByCity[city] = {
        city,
        region: REGIONS[city] || 'Unknown',
        totalSlots: 0,
        activeSlots: 0,
        inactiveSlots: 0,
        totalCapacity: 0,
        entitiesCovered: [],
        daysWithSlots: [],
      }
    })

    // Process slot configurations
    slotConfigs.forEach((slot: AppointmentSlotConfig) => {
      const city = slot.city || 'Unknown'
      if (!statsByCity[city]) {
        statsByCity[city] = {
          city,
          region: slot.region || 'Unknown',
          totalSlots: 0,
          activeSlots: 0,
          inactiveSlots: 0,
          totalCapacity: 0,
          entitiesCovered: [],
          daysWithSlots: [],
        }
      }

      const stats = statsByCity[city]
      stats.totalSlots++

      if (slot.is_active) {
        stats.activeSlots++
        stats.totalCapacity += slot.max_appointments_per_slot
      } else {
        stats.inactiveSlots++
      }

      // Track entities
      if (!stats.entitiesCovered.includes(slot.entity_code)) {
        stats.entitiesCovered.push(slot.entity_code)
      }

      // Track days
      if (!stats.daysWithSlots.includes(slot.day_of_week)) {
        stats.daysWithSlots.push(slot.day_of_week)
      }
    })

    return Object.values(statsByCity).filter(s => CITIES.includes(s.city as typeof CITIES[number]))
  }, [slotConfigs])

  // Calculate statistics by entity
  const entityStats = useMemo((): EntityStats[] => {
    if (!slotConfigs) return []

    const statsByEntity: Record<string, EntityStats> = {}

    slotConfigs.forEach((slot: AppointmentSlotConfig) => {
      const entityCode = slot.entity_code
      if (!statsByEntity[entityCode]) {
        statsByEntity[entityCode] = {
          entityCode,
          label: ENTITY_LABELS[entityCode] || entityCode,
          malaboSlots: 0,
          bataSlots: 0,
          totalSlots: 0,
          totalCapacity: 0,
        }
      }

      const stats = statsByEntity[entityCode]
      stats.totalSlots++

      if (slot.is_active) {
        stats.totalCapacity += slot.max_appointments_per_slot
      }

      if (slot.city === 'Malabo') {
        stats.malaboSlots++
      } else if (slot.city === 'Bata') {
        stats.bataSlots++
      }
    })

    return Object.values(statsByEntity).sort((a, b) => b.totalSlots - a.totalSlots)
  }, [slotConfigs])

  // Calculate overall totals
  const totals = useMemo(() => {
    const total = {
      slots: slotConfigs?.length || 0,
      activeSlots: slotConfigs?.filter((s: AppointmentSlotConfig) => s.is_active).length || 0,
      blockedDates: blockedDates?.length || 0,
      delayRules: delayRules?.length || 0,
      totalCapacity: slotConfigs?.reduce((sum: number, s: AppointmentSlotConfig) =>
        s.is_active ? sum + s.max_appointments_per_slot : sum, 0) || 0,
      entities: Array.from(new Set(slotConfigs?.map((s: AppointmentSlotConfig) => s.entity_code) || [])).length,
    }
    return total
  }, [slotConfigs, blockedDates, delayRules])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
  if (slotsError) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading statistics</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.totalSlots')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.slots}</div>
            <p className="text-xs text-muted-foreground">
              {totals.activeSlots} {t('stats.active')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.dailyCapacity')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalCapacity}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.appointmentsPerDay')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.blockedDates')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.blockedDates}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.datesBlocked')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.entities')}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.entities}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.entitiesWithSlots')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* City/Region Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('stats.byCity')}
          </CardTitle>
          <CardDescription>
            {t('stats.cityDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {cityStats.map((stats) => (
              <Card key={stats.city} className="bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{stats.city}</CardTitle>
                    <Badge variant="outline">{stats.region}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Slot counts */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-bold">{stats.totalSlots}</div>
                      <div className="text-xs text-muted-foreground">{t('stats.total')}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.activeSlots}</div>
                      <div className="text-xs text-muted-foreground">{t('stats.active')}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-muted-foreground">{stats.inactiveSlots}</div>
                      <div className="text-xs text-muted-foreground">{t('stats.inactive')}</div>
                    </div>
                  </div>

                  {/* Progress bar for active ratio */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('stats.activeRatio')}</span>
                      <span>{stats.totalSlots > 0 ? Math.round((stats.activeSlots / stats.totalSlots) * 100) : 0}%</span>
                    </div>
                    <Progress
                      value={stats.totalSlots > 0 ? (stats.activeSlots / stats.totalSlots) * 100 : 0}
                      className="h-2"
                    />
                  </div>

                  {/* Capacity */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {t('stats.capacity')}
                    </span>
                    <span className="font-medium">{stats.totalCapacity} {t('stats.perDay')}</span>
                  </div>

                  {/* Entities */}
                  <div>
                    <div className="text-sm mb-2">{t('stats.entitiesServed')}</div>
                    <div className="flex flex-wrap gap-1">
                      {stats.entitiesCovered.map(entity => (
                        <Badge key={entity} variant="secondary" className="text-xs">
                          {entity}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Days with slots */}
                  <div>
                    <div className="text-sm mb-2">{t('stats.operatingDays')}</div>
                    <div className="flex flex-wrap gap-1">
                      {stats.daysWithSlots.sort((a, b) => a - b).map(day => (
                        <Badge key={day} variant="outline" className="text-xs">
                          {DAY_OF_WEEK_LABELS[day]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entity Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('stats.byEntity')}
          </CardTitle>
          <CardDescription>
            {t('stats.entityDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('stats.entity')}</TableHead>
                <TableHead className="text-center">Malabo</TableHead>
                <TableHead className="text-center">Bata</TableHead>
                <TableHead className="text-center">{t('stats.total')}</TableHead>
                <TableHead className="text-center">{t('stats.capacity')}</TableHead>
                <TableHead>{t('stats.distribution')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entityStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t('stats.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                entityStats.map((entity) => {
                  const malaboPercent = entity.totalSlots > 0
                    ? Math.round((entity.malaboSlots / entity.totalSlots) * 100)
                    : 0
                  const bataPercent = 100 - malaboPercent

                  return (
                    <TableRow key={entity.entityCode}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entity.entityCode}</div>
                          <div className="text-xs text-muted-foreground">
                            {ENTITY_LABELS[entity.entityCode]?.replace(`${entity.entityCode} - `, '') || ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-blue-50">
                          {entity.malaboSlots}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50">
                          {entity.bataSlots}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {entity.totalSlots}
                      </TableCell>
                      <TableCell className="text-center">
                        {entity.totalCapacity}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${malaboPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-16">
                            {malaboPercent}% / {bataPercent}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delay Rules Summary */}
      {delayRules && delayRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('stats.delayRules')}
            </CardTitle>
            <CardDescription>
              {t('stats.delayDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {delayRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-lg border ${rule.is_active ? 'bg-muted/50' : 'bg-muted/20 opacity-50'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={
                      rule.priority === 'URGENT' ? 'destructive' :
                      rule.priority === 'HIGH' ? 'default' :
                      rule.priority === 'NORMAL' ? 'secondary' : 'outline'
                    }>
                      {rule.priority}
                    </Badge>
                    {!rule.is_active && (
                      <Badge variant="outline" className="text-xs">
                        {t('stats.inactive')}
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold">{rule.delay_business_days}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('stats.businessDays')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
