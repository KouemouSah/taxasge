'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Building,
  MapPin,
  Plus,
  Loader2,
  AlertCircle,
  CalendarClock,
  Globe,
} from 'lucide-react'
import { useSlotConfigs } from '@/modules/service-requests-admin'
import { useEntitiesSimple } from '@/modules/cities'

interface EntityLocationInfo {
  entity_code: string
  entity_name: string
  city: string
  region: string
  location_name: string | null
  location_address: string | null
  slotCount: number
  activeSlotCount: number
}

export default function EntitiesTabContent() {
  const t = useTranslations('admin.serviceRequests.appointments.entities')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  // Fetch all slot configs
  const { data: slotConfigs, isLoading, error, refetch } = useSlotConfigs()

  // Fetch entities from API for dynamic name resolution
  const { data: entities } = useEntitiesSimple(true)

  // Build entity code -> name map from API data
  const entityNameMap = useMemo(() => {
    const map = new Map<string, string>()
    if (entities) {
      for (const entity of entities) {
        map.set(entity.code, entity.name)
      }
    }
    return map
  }, [entities])

  // Derive entity-location combinations from slot configs
  const entityLocations: EntityLocationInfo[] = useMemo(() => {
    if (!slotConfigs) return []

    // Group by entity_code + city
    const groupMap = new Map<string, EntityLocationInfo>()

    for (const slot of slotConfigs) {
      const key = `${slot.entity_code}-${slot.city || 'unknown'}`

      if (!groupMap.has(key)) {
        // Use dynamic entity name from API, fallback to code
        const entityName = entityNameMap.get(slot.entity_code) || slot.entity_code
        groupMap.set(key, {
          entity_code: slot.entity_code,
          entity_name: entityName,
          city: slot.city || 'N/A',
          region: slot.region || 'N/A',
          location_name: slot.location_name ?? null,
          location_address: slot.location_address ?? null,
          slotCount: 0,
          activeSlotCount: 0,
        })
      }

      const info = groupMap.get(key)!
      info.slotCount++
      if (slot.is_active) {
        info.activeSlotCount++
      }
      // Update location info if not set
      if (!info.location_name && slot.location_name) {
        info.location_name = slot.location_name
      }
      if (!info.location_address && slot.location_address) {
        info.location_address = slot.location_address
      }
    }

    // Sort by entity_code then city
    return Array.from(groupMap.values()).sort((a, b) => {
      if (a.entity_code !== b.entity_code) {
        return a.entity_code.localeCompare(b.entity_code)
      }
      return a.city.localeCompare(b.city)
    })
  }, [slotConfigs, entityNameMap])

  // Get unique entities count
  const uniqueEntities = useMemo(() => {
    return new Set(entityLocations.map(e => e.entity_code)).size
  }, [entityLocations])

  // Navigate to create new slot with pre-filled entity/city
  const handleCreateSlotForEntity = (entityCode: string, city: string) => {
    router.push(`/${locale}/dashboard/admin/service-requests/appointments/slots/new?entity=${entityCode}&city=${city}`)
  }

  // Navigate to create new slot
  const handleCreateNew = () => {
    router.push(`/${locale}/dashboard/admin/service-requests/appointments/slots/new`)
  }

  // Navigate to view slots filtered by entity
  const handleViewSlots = (entityCode: string, city: string) => {
    router.push(`/${locale}/dashboard/admin/service-requests/appointments?tab=slots&entity=${entityCode}&city=${city}`)
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error instanceof Error ? error.message : 'Error loading data'}</span>
          </div>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            {tCommon('retry')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalEntities')}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueEntities}</div>
            <p className="text-xs text-muted-foreground">{t('entitiesWithSlots')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalLocations')}</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entityLocations.length}</div>
            <p className="text-xs text-muted-foreground">{t('entityCityCombinations')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalSlots')}</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entityLocations.reduce((sum, e) => sum + e.activeSlotCount, 0)}/
              {entityLocations.reduce((sum, e) => sum + e.slotCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">{t('activeSlotsTotal')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Entity Locations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('title')}
              </CardTitle>
              <CardDescription>{t('subtitle')}</CardDescription>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              {t('createSlot')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {entityLocations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">{t('noEntities')}</p>
              <p className="text-sm mb-4">{t('noEntitiesDescription')}</p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                {t('createFirstSlot')}
              </Button>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('entityCode')}</TableHead>
                    <TableHead>{t('city')}</TableHead>
                    <TableHead>{t('region')}</TableHead>
                    <TableHead>{t('location')}</TableHead>
                    <TableHead className="text-center">{t('slots')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entityLocations.map((entity) => (
                    <TableRow key={`${entity.entity_code}-${entity.city}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entity.entity_code}</div>
                          <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {entity.entity_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <MapPin className="h-3 w-3" />
                          {entity.city}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{entity.region}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          {entity.location_name ? (
                            <>
                              <div className="font-medium truncate">{entity.location_name}</div>
                              {entity.location_address && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {entity.location_address}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{entity.activeSlotCount}</span>
                          <span className="text-xs text-muted-foreground">
                            / {entity.slotCount} {t('total')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSlots(entity.entity_code, entity.city)}
                          >
                            {t('viewSlots')}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleCreateSlotForEntity(entity.entity_code, entity.city)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            {t('addSlot')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card - Dynamic from API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4" />
            {t('aboutEntities')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>{t('entityInfo1')}</p>
          <p>{t('entityInfo2')}</p>
          {entities && entities.length > 0 && (
            <ul className="list-disc list-inside ml-4 space-y-1">
              {entities.map((entity) => (
                <li key={entity.id}>
                  <strong>{entity.code}</strong> - {entity.name}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
