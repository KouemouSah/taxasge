'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  CalendarClock,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
} from 'lucide-react'
import {
  useSlotConfigs,
  useCreateSlotConfig,
  useUpdateSlotConfig,
  useDeleteSlotConfig,
} from '@/modules/service-requests-admin'
import type {
  AppointmentSlotConfig,
  AppointmentSlotConfigCreate,
  AppointmentSlotConfigUpdate,
} from '@/modules/service-requests-admin'
import { DAY_OF_WEEK_LABELS } from '@/modules/service-requests-admin'
import { DataTablePagination, usePagination } from '@/modules/service-requests-admin/components'

// Short labels for compact display
const DAY_SHORT_LABELS: Record<number, string> = {
  0: 'Lun',
  1: 'Mar',
  2: 'Mié',
  3: 'Jue',
  4: 'Vie',
  5: 'Sáb',
  6: 'Dom',
}

// Interface for grouped slot configurations
interface GroupedSlotConfig {
  id: string
  entity_code: string
  days: number[]
  dayRangeDisplay: string
  start_time: string
  end_time: string
  slot_duration_minutes: number
  max_appointments_per_slot: number
  location_name: string | null
  location_address: string | null
  city: string | null  // Malabo or Bata
  region: string | null  // Insular or Continental
  is_active: boolean
  originalSlots: AppointmentSlotConfig[]
}

// Format day range display (e.g., "Lunes - Viernes" for consecutive days)
function formatDayRange(days: number[]): string {
  if (days.length === 0) return '-'
  if (days.length === 1) return DAY_OF_WEEK_LABELS[days[0]]

  const sorted = [...days].sort((a, b) => a - b)

  // Check if days are consecutive
  let isConsecutive = true
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== 1) {
      isConsecutive = false
      break
    }
  }

  if (isConsecutive && sorted.length >= 2) {
    return `${DAY_OF_WEEK_LABELS[sorted[0]]} - ${DAY_OF_WEEK_LABELS[sorted[sorted.length - 1]]}`
  }

  // Non-consecutive: show abbreviated days
  return sorted.map((d) => DAY_SHORT_LABELS[d]).join(', ')
}

// Group slot configs with identical settings
function groupSlotConfigs(slots: AppointmentSlotConfig[]): GroupedSlotConfig[] {
  if (!slots || slots.length === 0) return []

  // Group by entity first, then by config key
  const entityGroups = new Map<string, AppointmentSlotConfig[]>()
  for (const slot of slots) {
    const existing = entityGroups.get(slot.entity_code) || []
    existing.push(slot)
    entityGroups.set(slot.entity_code, existing)
  }

  const result: GroupedSlotConfig[] = []

  for (const [entity_code, entitySlots] of Array.from(entityGroups.entries())) {
    // Group by identical config (start_time|end_time|duration|capacity|location|is_active)
    const configGroups = new Map<string, AppointmentSlotConfig[]>()

    for (const slot of entitySlots) {
      const configKey = `${slot.start_time}|${slot.end_time}|${slot.slot_duration_minutes}|${slot.max_appointments_per_slot}|${slot.location_name || ''}|${slot.location_address || ''}|${slot.is_active}`
      const existing = configGroups.get(configKey) || []
      existing.push(slot)
      configGroups.set(configKey, existing)
    }

    for (const [, groupSlots] of Array.from(configGroups.entries())) {
      const days = groupSlots.map((s: AppointmentSlotConfig) => s.day_of_week).sort((a: number, b: number) => a - b)
      const firstSlot = groupSlots[0]

      result.push({
        id: firstSlot.id,
        entity_code,
        days,
        dayRangeDisplay: formatDayRange(days),
        start_time: firstSlot.start_time,
        end_time: firstSlot.end_time,
        slot_duration_minutes: firstSlot.slot_duration_minutes,
        max_appointments_per_slot: firstSlot.max_appointments_per_slot,
        location_name: firstSlot.location_name ?? null,
        location_address: firstSlot.location_address ?? null,
        city: firstSlot.city ?? null,
        region: firstSlot.region ?? null,
        is_active: firstSlot.is_active,
        originalSlots: groupSlots,
      })
    }
  }

  // Sort by entity, then by first day
  return result.sort((a, b) => {
    const entityCompare = a.entity_code.localeCompare(b.entity_code)
    if (entityCompare !== 0) return entityCompare
    return (a.days[0] || 0) - (b.days[0] || 0)
  })
}

export default function SlotsTabContent() {
  const t = useTranslations('admin.serviceRequests.appointments.slots')
  const tCommon = useTranslations('common')

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlotConfig | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<GroupedSlotConfig | null>(null)

  // Multi-day selection state for creation
  const [selectedDays, setSelectedDays] = useState<number[]>([0])

  // Pagination
  const {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    paginateData,
    getTotalPages,
    resetPage,
  } = usePagination(10)

  // Form state (without day_of_week, using selectedDays instead)
  const [formData, setFormData] = useState<Omit<AppointmentSlotConfigCreate, 'day_of_week'> & { day_of_week?: number }>({
    entity_code: '',
    start_time: '08:00',
    end_time: '16:00',
    slot_duration_minutes: 30,
    max_appointments_per_slot: 10,
    location_name: '',
    location_address: '',
    city: 'Malabo',  // Default to capital
    region: 'Insular',  // Default region
    is_active: true,
  })

  // Queries
  const {
    data: slotConfigs,
    isLoading,
    error,
    refetch,
  } = useSlotConfigs({
    entity_code: entityFilter === 'all' ? undefined : entityFilter,
  })

  // Mutations
  const createMutation = useCreateSlotConfig()
  const updateMutation = useUpdateSlotConfig()
  const deleteMutation = useDeleteSlotConfig()

  // Get unique entity codes for filter
  const entities = Array.from(new Set(slotConfigs?.map((s) => s.entity_code) || []))

  // Group and filter slots
  const groupedSlots = useMemo(() => {
    return groupSlotConfigs(slotConfigs || [])
  }, [slotConfigs])

  // Filter grouped slots
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedSlots
    const query = searchQuery.toLowerCase()
    return groupedSlots.filter(
      (g) =>
        g.entity_code.toLowerCase().includes(query) ||
        g.location_name?.toLowerCase().includes(query) ||
        g.location_address?.toLowerCase().includes(query)
    )
  }, [groupedSlots, searchQuery])

  // Pagination
  const paginatedGroups = paginateData(filteredGroups)
  const totalPages = getTotalPages(filteredGroups.length)

  // Toggle day selection
  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day)
      }
      return [...prev, day].sort((a, b) => a - b)
    })
  }

  // Handlers
  const handleCreateSlots = async () => {
    if (selectedDays.length === 0) return

    try {
      // Create a slot for each selected day
      for (const day of selectedDays) {
        await createMutation.mutateAsync({
          ...formData,
          day_of_week: day,
        } as AppointmentSlotConfigCreate)
      }
      setIsCreateDialogOpen(false)
      resetForm()
    } catch {
      // Error handled by mutation
    }
  }

  const handleUpdateSlot = async () => {
    if (!selectedSlot) return

    try {
      const updateData: AppointmentSlotConfigUpdate = {
        start_time: formData.start_time,
        end_time: formData.end_time,
        slot_duration_minutes: formData.slot_duration_minutes,
        max_appointments_per_slot: formData.max_appointments_per_slot,
        location_name: formData.location_name,
        location_address: formData.location_address,
        city: formData.city,
        region: formData.region,
        is_active: formData.is_active,
      }
      await updateMutation.mutateAsync({ slotId: selectedSlot.id, data: updateData })
      setIsEditDialogOpen(false)
      resetForm()
    } catch {
      // Error handled by mutation
    }
  }

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return

    try {
      // Delete all slots in the group
      for (const slot of selectedGroup.originalSlots) {
        await deleteMutation.mutateAsync(slot.id)
      }
      setIsDeleteDialogOpen(false)
      setSelectedGroup(null)
    } catch {
      // Error handled by mutation
    }
  }

  const openEditDialog = (group: GroupedSlotConfig) => {
    // For edit, we only allow editing one slot at a time
    // Use the first slot as the reference
    const slot = group.originalSlots[0]
    setSelectedSlot(slot)
    setFormData({
      entity_code: slot.entity_code,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      slot_duration_minutes: slot.slot_duration_minutes,
      max_appointments_per_slot: slot.max_appointments_per_slot,
      location_name: slot.location_name || '',
      location_address: slot.location_address || '',
      city: slot.city || 'Malabo',
      region: slot.region || 'Insular',
      is_active: slot.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (group: GroupedSlotConfig) => {
    setSelectedGroup(group)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      entity_code: '',
      start_time: '08:00',
      end_time: '16:00',
      slot_duration_minutes: 30,
      max_appointments_per_slot: 10,
      location_name: '',
      location_address: '',
      city: 'Malabo',
      region: 'Insular',
      is_active: true,
    })
    setSelectedSlot(null)
    setSelectedGroup(null)
    setSelectedDays([0])
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
            <span>{error instanceof Error ? error.message : 'Error loading slot configs'}</span>
          </div>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            {tCommon('retry')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              {t('create')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('create')}</DialogTitle>
              <DialogDescription>{t('createDescription')}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="entity">{t('entityCode')}</Label>
                <Input
                  id="entity"
                  value={formData.entity_code}
                  onChange={(e) => setFormData({ ...formData, entity_code: e.target.value.toUpperCase() })}
                  placeholder="CNEDOGE"
                />
              </div>

              {/* Multi-day selection */}
              <div className="grid gap-2">
                <Label>{t('dayOfWeek')}</Label>
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
                {selectedDays.length > 1 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedDays.length} días seleccionados: {formatDayRange(selectedDays)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start">{t('startTime')}</Label>
                  <Input
                    id="start"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end">{t('endTime')}</Label>
                  <Input
                    id="end"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">{t('slotDuration')}</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.slot_duration_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, slot_duration_minutes: parseInt(e.target.value) || 30 })
                    }
                    min={5}
                    max={120}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max">{t('maxPerSlot')}</Label>
                  <Input
                    id="max"
                    type="number"
                    value={formData.max_appointments_per_slot}
                    onChange={(e) =>
                      setFormData({ ...formData, max_appointments_per_slot: parseInt(e.target.value) || 10 })
                    }
                    min={1}
                    max={100}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">{t('locationName')}</Label>
                <Input
                  id="location"
                  value={formData.location_name || ''}
                  onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                  placeholder="Oficina Principal"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">{t('locationAddress')}</Label>
                <Input
                  id="address"
                  value={formData.location_address || ''}
                  onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                  placeholder="Av. de la Independencia, Malabo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">{t('city')}</Label>
                  <Select
                    value={formData.city || 'Malabo'}
                    onValueChange={(v) => setFormData({ ...formData, city: v, region: v === 'Malabo' ? 'Insular' : 'Continental' })}
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
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active_slot">{t('isActive')}</Label>
                <Switch
                  id="is_active_slot"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {tCommon('cancel')}
              </Button>
              <Button
                onClick={handleCreateSlots}
                disabled={!formData.entity_code || selectedDays.length === 0 || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedDays.length > 1 ? `Crear ${selectedDays.length} días` : tCommon('create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {filteredGroups.length} configuraciones ({slotConfigs?.length || 0} slots individuales)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  resetPage()
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={entityFilter}
              onValueChange={(v) => {
                setEntityFilter(v)
                resetPage()
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('filterByEntity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allEntities')}</SelectItem>
                {entities.map((entity) => (
                  <SelectItem key={entity} value={entity}>
                    {entity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={cityFilter}
              onValueChange={(v) => {
                setCityFilter(v)
                resetPage()
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('filterByCity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCities')}</SelectItem>
                <SelectItem value="Malabo">Malabo</SelectItem>
                <SelectItem value="Bata">Bata</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Slots Table with Grouped Days */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('entity')}</TableHead>
                  <TableHead>{t('day')}</TableHead>
                  <TableHead>{t('hours')}</TableHead>
                  <TableHead className="text-center">{t('duration')}</TableHead>
                  <TableHead className="text-center">{t('capacity')}</TableHead>
                  <TableHead>{t('location')}</TableHead>
                  <TableHead>{t('city')}</TableHead>
                  <TableHead className="text-center">{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      {t('noSlotsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>
                        <Badge variant="outline">{group.entity_code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{group.dayRangeDisplay}</span>
                          {group.days.length > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              {group.days.length}d
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {group.start_time} - {group.end_time}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{group.slot_duration_minutes} min</TableCell>
                      <TableCell className="text-center">{group.max_appointments_per_slot}</TableCell>
                      <TableCell>
                        {group.location_name ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm truncate max-w-[150px]">{group.location_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {group.city ? (
                          <Badge variant="secondary">{group.city}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {group.is_active ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(group)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(group)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredGroups.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 30, 50]}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('edit')}</DialogTitle>
            <DialogDescription>{t('editDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('entityCode')}</Label>
                <Input value={formData.entity_code} disabled className="bg-muted" />
              </div>
              <div className="grid gap-2">
                <Label>{t('dayOfWeek')}</Label>
                <Input
                  value={formData.day_of_week !== undefined ? DAY_OF_WEEK_LABELS[formData.day_of_week] : ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-start">{t('startTime')}</Label>
                <Input
                  id="edit-start"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-end">{t('endTime')}</Label>
                <Input
                  id="edit-end"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-duration">{t('slotDuration')}</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={formData.slot_duration_minutes}
                  onChange={(e) =>
                    setFormData({ ...formData, slot_duration_minutes: parseInt(e.target.value) || 30 })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-max">{t('maxPerSlot')}</Label>
                <Input
                  id="edit-max"
                  type="number"
                  value={formData.max_appointments_per_slot}
                  onChange={(e) =>
                    setFormData({ ...formData, max_appointments_per_slot: parseInt(e.target.value) || 10 })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">{t('locationName')}</Label>
              <Input
                id="edit-location"
                value={formData.location_name || ''}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">{t('locationAddress')}</Label>
              <Input
                id="edit-address"
                value={formData.location_address || ''}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-city">{t('city')}</Label>
                <Select
                  value={formData.city || 'Malabo'}
                  onValueChange={(v) => setFormData({ ...formData, city: v, region: v === 'Malabo' ? 'Insular' : 'Continental' })}
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
                <Label htmlFor="edit-region">{t('region')}</Label>
                <Input
                  id="edit-region"
                  value={formData.region || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">{t('isActive')}</Label>
              <Switch
                id="edit-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleUpdateSlot} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedGroup && selectedGroup.days.length > 1
                ? `¿Eliminar ${selectedGroup.days.length} configuraciones para ${selectedGroup.entity_code} (${selectedGroup.dayRangeDisplay})?`
                : t('deleteConfirmDescription', {
                    entity: selectedGroup?.entity_code,
                    day: selectedGroup ? DAY_OF_WEEK_LABELS[selectedGroup.days[0]] : '',
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedGroup && selectedGroup.days.length > 1
                ? `Eliminar ${selectedGroup.days.length} días`
                : tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
