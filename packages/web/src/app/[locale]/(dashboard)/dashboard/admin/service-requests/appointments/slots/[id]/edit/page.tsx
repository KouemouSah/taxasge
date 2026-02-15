'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  CalendarClock,
  Loader2,
  Save,
  Building,
  Clock,
  Users,
  MapPin,
  AlertCircle,
} from 'lucide-react'
import { TimePicker } from '@/components/ui/time-picker'
import { useSlotConfigs, useUpdateSlotConfig, DAY_OF_WEEK_LABELS } from '@/modules/service-requests-admin'
import type { AppointmentSlotConfigUpdate } from '@/modules/service-requests-admin'
import { toast } from 'sonner'
import { useEntityLocations } from '@/modules/entity-locations/hooks'
import { useCitiesSimple } from '@/modules/cities/hooks'

export default function EditSlotConfigPage() {
  const t = useTranslations('admin.serviceRequests.appointments.slots')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const slotId = params.id as string

  // Load all slot configs to find the one we're editing
  const { data: slotConfigs, isLoading: isLoadingSlot, error: loadError } = useSlotConfigs()

  // Find the slot we're editing
  const existingSlot = useMemo(() => {
    return slotConfigs?.find((s) => s.id === slotId)
  }, [slotConfigs, slotId])

  // Fetch cities from database
  const { data: citiesData, isLoading: citiesLoading } = useCitiesSimple(true)
  const availableCities = useMemo(() => citiesData || [], [citiesData])

  // City filter state - initialized from existing slot
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [selectedDay, setSelectedDay] = useState<number>(0)

  // Form state
  const [formData, setFormData] = useState<AppointmentSlotConfigUpdate>({
    start_time: '08:00',
    end_time: '16:00',
    slot_duration_minutes: 30,
    max_appointments_per_slot: 1,
    is_active: true,
  })

  // Initialize form data when slot loads
  useEffect(() => {
    if (existingSlot) {
      // Set city from existing slot (derive from location if available)
      const city = existingSlot.city || 'Malabo'
      setSelectedCity(city)
      setSelectedLocationId(existingSlot.entity_location_id || '')
      setSelectedDay(existingSlot.day_of_week)

      // Parse time (remove seconds if present)
      const formatTime = (time: string) => {
        if (!time) return '08:00'
        const parts = time.split(':')
        return `${parts[0]}:${parts[1]}`
      }

      setFormData({
        start_time: formatTime(existingSlot.start_time),
        end_time: formatTime(existingSlot.end_time),
        slot_duration_minutes: existingSlot.slot_duration_minutes,
        max_appointments_per_slot: existingSlot.max_appointments_per_slot,
        is_active: existingSlot.is_active,
      })
    }
  }, [existingSlot])

  // Fetch entity locations filtered by city
  const { data: locationsData, isLoading: locationsLoading } = useEntityLocations({
    city: selectedCity || undefined,
    is_active: true,
    page_size: 100,
  })

  // Filter locations by city
  const availableLocations = useMemo(() => {
    return locationsData?.items || []
  }, [locationsData])

  // Get selected location object
  const selectedLocation = useMemo(() => {
    return availableLocations.find((loc) => loc.id === selectedLocationId)
  }, [availableLocations, selectedLocationId])

  // Get selected city object (for region display)
  const selectedCityObj = useMemo(() => {
    return availableCities.find((c) => c.name === selectedCity)
  }, [availableCities, selectedCity])

  // Mutation
  const updateMutation = useUpdateSlotConfig()

  // Navigate back
  const handleBack = () => {
    router.push(`/${locale}/dashboard/admin/service-requests/appointments?tab=slots`)
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedLocationId) {
      toast.error(t('validation.requiredFields'))
      return
    }

    try {
      await updateMutation.mutateAsync({
        slotId,
        data: {
          ...formData,
          entity_location_id: selectedLocationId,
          day_of_week: selectedDay,
        },
      })

      toast.success(t('updateSuccess'))
      handleBack()
    } catch (error) {
      toast.error(t('updateError'))
      console.error('Failed to update slot config:', error)
    }
  }

  // Loading state
  if (isLoadingSlot) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state - slot not found
  if (!existingSlot && !isLoadingSlot) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('editTitle')}</h1>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {loadError?.message || t('slotNotFound')}
          </AlertDescription>
        </Alert>
        <Button onClick={handleBack}>{tCommon('back')}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('editTitle')}</h1>
          <p className="text-muted-foreground">{t('editSubtitle')}</p>
        </div>
      </div>

      {/* Current Slot Info */}
      {existingSlot && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="outline">{existingSlot.entity_code}</Badge>
              <Badge variant="secondary">{DAY_OF_WEEK_LABELS[existingSlot.day_of_week]}</Badge>
              <span className="font-mono">
                {existingSlot.start_time} - {existingSlot.end_time}
              </span>
              {existingSlot.location_name && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {existingSlot.location_name}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            {t('slotConfiguration')}
          </CardTitle>
          <CardDescription>{t('slotConfigDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* City and Location Selection */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* City Selector */}
            <div className="grid gap-2">
              <Label htmlFor="city" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('city')}
              </Label>
              <Select
                value={selectedCity}
                onValueChange={(v) => {
                  setSelectedCity(v)
                  setSelectedLocationId('')
                }}
                disabled={citiesLoading || availableCities.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      citiesLoading
                        ? t('loadingCities')
                        : availableCities.length === 0
                          ? t('noCitiesAvailable')
                          : t('selectCity')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city.id} value={city.name}>
                      <div className="flex items-center gap-2">
                        <span>{city.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {city.region}
                        </Badge>
                        {city.is_capital && (
                          <Badge variant="secondary" className="text-xs">
                            Capital
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t('region')}: <span className="font-medium">{selectedCityObj?.region || '-'}</span>
              </p>
            </div>

            {/* Location Selector */}
            <div className="grid gap-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                {t('location')}
              </Label>
              <Select
                value={selectedLocationId}
                onValueChange={setSelectedLocationId}
                disabled={locationsLoading || availableLocations.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      locationsLoading
                        ? t('loadingLocations')
                        : availableLocations.length === 0
                          ? t('noLocationsForCity')
                          : t('selectLocation')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      <span className="font-medium">
                        {loc.entity_code} - {loc.location_name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLocation && (
                <p className="text-sm text-muted-foreground">
                  {selectedLocation.location_address || t('noAddressProvided')}
                </p>
              )}
            </div>
          </div>

          {/* Day Selection (single day for edit) */}
          <div className="grid gap-2">
            <Label>{t('dayOfWeek')}</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DAY_OF_WEEK_LABELS).map(([day, label]) => {
                const dayNum = parseInt(day)
                const isSelected = selectedDay === dayNum
                return (
                  <Button
                    key={day}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDay(dayNum)}
                    className="min-w-[80px]"
                  >
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Time Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('startTime')}
              </Label>
              <TimePicker
                value={formData.start_time || '08:00'}
                onChange={(v) => setFormData({ ...formData, start_time: v })}
                minuteStep={15}
              />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('endTime')}
              </Label>
              <TimePicker
                value={formData.end_time || '16:00'}
                onChange={(v) => setFormData({ ...formData, end_time: v })}
                minuteStep={15}
              />
            </div>
          </div>
          {(formData.start_time || '08:00') >= (formData.end_time || '16:00') && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              La hora de inicio debe ser anterior a la hora de fin
            </div>
          )}

          {/* Duration and Capacity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('slotDuration')}
              </Label>
              <Select
                value={String(formData.slot_duration_minutes)}
                onValueChange={(v) =>
                  setFormData({ ...formData, slot_duration_minutes: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 {t('minutes')}</SelectItem>
                  <SelectItem value="10">10 {t('minutes')}</SelectItem>
                  <SelectItem value="15">15 {t('minutes')}</SelectItem>
                  <SelectItem value="20">20 {t('minutes')}</SelectItem>
                  <SelectItem value="30">30 {t('minutes')}</SelectItem>
                  <SelectItem value="45">45 {t('minutes')}</SelectItem>
                  <SelectItem value="60">60 {t('minutes')}</SelectItem>
                  <SelectItem value="90">90 {t('minutes')}</SelectItem>
                  <SelectItem value="120">120 {t('minutes')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max_appointments" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('maxAppointments')}
              </Label>
              <Input
                id="max_appointments"
                type="number"
                min={1}
                max={100}
                value={formData.max_appointments_per_slot}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_appointments_per_slot: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)),
                  })
                }
              />
            </div>
          </div>

          {/* Is Active */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">{t('isActive')}</Label>
              <p className="text-sm text-muted-foreground">{t('isActiveDescription')}</p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button variant="outline" onClick={handleBack}>
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedLocationId || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {tCommon('save')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
