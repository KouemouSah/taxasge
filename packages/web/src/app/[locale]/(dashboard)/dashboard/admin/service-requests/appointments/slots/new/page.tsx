'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
} from 'lucide-react'
import { useCreateSlotConfig } from '@/modules/service-requests-admin'
import { DAY_OF_WEEK_LABELS } from '@/modules/service-requests-admin'
import type { AppointmentSlotConfigCreate } from '@/modules/service-requests-admin'
import { toast } from 'sonner'

// Entity codes for dropdown
const ENTITY_CODES = [
  'CNEDOGE',
  'DGT',
  'EXTRANJERIA',
  'MINFP',
  'ONRC',
  'MINHV',
]

export default function NewSlotConfigPage() {
  const t = useTranslations('admin.serviceRequests.appointments.slots')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  // Multi-day selection state
  const [selectedDays, setSelectedDays] = useState<number[]>([0])

  // Form state
  const [formData, setFormData] = useState<Omit<AppointmentSlotConfigCreate, 'day_of_week'>>({
    entity_code: '',
    start_time: '08:00',
    end_time: '16:00',
    slot_duration_minutes: 30,
    max_appointments_per_slot: 1,
    location_name: '',
    location_address: '',
    city: 'Malabo',
    region: 'Insular',
    is_active: true,
  })

  // Mutation
  const createMutation = useCreateSlotConfig()

  // Toggle day selection
  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  // Select all weekdays
  const selectAllWeekdays = () => {
    setSelectedDays([0, 1, 2, 3, 4]) // Monday to Friday
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedDays([])
  }

  // Navigate back
  const handleBack = () => {
    router.push(`/${locale}/dashboard/admin/service-requests/appointments?tab=slots`)
  }

  // Handle form submission - creates one slot per selected day
  const handleSubmit = async () => {
    if (!formData.entity_code || selectedDays.length === 0) {
      toast.error(t('validation.requiredFields'))
      return
    }

    try {
      // Create a slot for each selected day
      for (const day of selectedDays) {
        await createMutation.mutateAsync({
          ...formData,
          day_of_week: day,
        })
      }

      toast.success(
        selectedDays.length > 1
          ? t('createSuccess.multiple', { count: selectedDays.length })
          : t('createSuccess.single')
      )
      handleBack()
    } catch (error) {
      toast.error(t('createError'))
      console.error('Failed to create slot configs:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('createTitle')}</h1>
          <p className="text-muted-foreground">{t('createSubtitle')}</p>
        </div>
      </div>

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
          {/* Entity Code */}
          <div className="grid gap-2">
            <Label htmlFor="entity_code" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              {t('entityCode')}
            </Label>
            <Select
              value={formData.entity_code}
              onValueChange={(v) => setFormData({ ...formData, entity_code: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectEntity')} />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day Selection */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>{t('daysOfWeek')}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllWeekdays}
                >
                  {t('selectWeekdays')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                >
                  {t('clearSelection')}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DAY_OF_WEEK_LABELS).map(([day, label]) => {
                const dayNum = parseInt(day)
                const isSelected = selectedDays.includes(dayNum)
                return (
                  <Button
                    key={day}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDay(dayNum)}
                    className="min-w-[80px]"
                  >
                    {label}
                  </Button>
                )
              })}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-sm text-destructive">{t('validation.selectDay')}</p>
            )}
            {selectedDays.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {t('selectedDays', { count: selectedDays.length })}
              </p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="start_time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('startTime')}
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('endTime')}
              </Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

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
                  <SelectItem value="15">15 {t('minutes')}</SelectItem>
                  <SelectItem value="30">30 {t('minutes')}</SelectItem>
                  <SelectItem value="45">45 {t('minutes')}</SelectItem>
                  <SelectItem value="60">60 {t('minutes')}</SelectItem>
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
                max={20}
                value={formData.max_appointments_per_slot}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_appointments_per_slot: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="location_name" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('locationName')}
              </Label>
              <Input
                id="location_name"
                value={formData.location_name || ''}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                placeholder={t('locationNamePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location_address">{t('locationAddress')}</Label>
              <Input
                id="location_address"
                value={formData.location_address || ''}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                placeholder={t('locationAddressPlaceholder')}
              />
            </div>
          </div>

          {/* City and Region */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="city">{t('city')}</Label>
              <Select
                value={formData.city || 'Malabo'}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    city: v,
                    region: v === 'Malabo' ? 'Insular' : 'Continental',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectCity')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Malabo">Malabo</SelectItem>
                  <SelectItem value="Bata">Bata</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="region">{t('region')}</Label>
              <Input
                id="region"
                value={formData.region || ''}
                disabled
                className="bg-muted"
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
              disabled={!formData.entity_code || selectedDays.length === 0 || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {selectedDays.length > 1
                    ? t('createMultiple', { count: selectedDays.length })
                    : tCommon('create')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
