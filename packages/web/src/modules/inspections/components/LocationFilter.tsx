'use client'

/**
 * LocationFilter — Reusable site/location filter for main-office supervisors.
 *
 * Only renders if the user is_main_office and there are 2+ locations.
 * Default: supervisor's own location. Dropdown allows switching to other sites.
 *
 * Usage:
 *   <LocationFilter
 *     entityCode={profile.entity_code}
 *     isMainOffice={profile.is_main_office}
 *     defaultLocationId={profile.entity_location_id}
 *     value={locationFilter}
 *     onChange={setLocationFilter}
 *   />
 */

import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { MapPin } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiClient } from '@/core/api/client'

interface EntityLocation {
  id: string
  entity_code: string
  location_name: string
  city: string
  is_main_office: boolean
}

function useEntityLocations(entityCode: string | undefined) {
  return useQuery({
    queryKey: ['entity-locations', entityCode],
    queryFn: async () => {
      if (!entityCode) return []
      try {
        const res = await apiClient.get<EntityLocation[]>(
          `/entity-locations/by-entity/${entityCode}`
        )
        return res.data
      } catch {
        return []
      }
    },
    enabled: !!entityCode,
    staleTime: 5 * 60 * 1000,
  })
}

interface LocationFilterProps {
  entityCode: string | undefined
  isMainOffice: boolean
  defaultLocationId?: string
  value: string // '' = all, UUID = specific location
  onChange: (locationId: string) => void
  className?: string
}

export function LocationFilter({
  entityCode,
  isMainOffice,
  defaultLocationId,
  value,
  onChange,
  className,
}: LocationFilterProps) {
  const t = useTranslations('supervisor')

  const { data: locations = [] } = useEntityLocations(entityCode)

  const handleChange = useCallback(
    (val: string) => {
      onChange(val === '_all' ? '' : val)
    },
    [onChange]
  )

  // Only show for main-office supervisors with multiple locations
  if (!isMainOffice || locations.length <= 1) return null

  // Find default location label for placeholder
  const currentLabel =
    value && value !== '_all'
      ? locations.find((l) => l.id === value)
      : null

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <Select value={value || '_all'} onValueChange={handleChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue
            placeholder={
              currentLabel
                ? `${currentLabel.location_name} — ${currentLabel.city}`
                : t('allSites', { defaultMessage: 'All sites' })
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">
            {t('allSites', { defaultMessage: 'All sites' })}
          </SelectItem>
          {locations.map((loc) => (
            <SelectItem key={loc.id} value={loc.id}>
              {loc.location_name} — {loc.city}
              {loc.is_main_office ? ' (principal)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * Hook to manage location filter state with auto-default to supervisor's own site.
 *
 * Usage:
 *   const { locationFilter, setLocationFilter, isReady } = useLocationFilter(agentProfile)
 *   // locationFilter defaults to supervisor's entity_location_id on first load
 *   // supervisor can switch to '' (all) or another site
 */
function useLocationFilterState(profile: {
  entity_location_id?: string | null
  is_main_office?: boolean
} | null | undefined) {
  const [value, setValue] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!initialized && profile?.entity_location_id && profile?.is_main_office) {
      setValue(profile.entity_location_id)
      setInitialized(true)
    }
  }, [profile, initialized])

  return { locationFilter: value, setLocationFilter: setValue, isReady: initialized }
}

export { useEntityLocations, useLocationFilterState }
export type { EntityLocation }
