'use client'

import { useState } from 'react'
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

export default function SlotsTabContent() {
  const t = useTranslations('admin.serviceRequests.appointments.slots')
  const tCommon = useTranslations('common')

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlotConfig | null>(null)

  // Form state
  const [formData, setFormData] = useState<AppointmentSlotConfigCreate>({
    entity_code: '',
    day_of_week: 0,
    start_time: '08:00',
    end_time: '16:00',
    slot_duration_minutes: 30,
    max_appointments_per_slot: 10,
    location_name: '',
    location_address: '',
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

  // Filter slots
  const filteredSlots = slotConfigs?.filter((s) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      s.entity_code.toLowerCase().includes(query) ||
      s.location_name?.toLowerCase().includes(query) ||
      s.location_address?.toLowerCase().includes(query)
    )
  }) || []

  // Handlers
  const handleCreateSlot = async () => {
    try {
      await createMutation.mutateAsync(formData)
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
        is_active: formData.is_active,
      }
      await updateMutation.mutateAsync({ slotId: selectedSlot.id, data: updateData })
      setIsEditDialogOpen(false)
      resetForm()
    } catch {
      // Error handled by mutation
    }
  }

  const handleDeleteSlot = async () => {
    if (!selectedSlot) return

    try {
      await deleteMutation.mutateAsync(selectedSlot.id)
      setIsDeleteDialogOpen(false)
      setSelectedSlot(null)
    } catch {
      // Error handled by mutation
    }
  }

  const openEditDialog = (slot: AppointmentSlotConfig) => {
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
      is_active: slot.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (slot: AppointmentSlotConfig) => {
    setSelectedSlot(slot)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      entity_code: '',
      day_of_week: 0,
      start_time: '08:00',
      end_time: '16:00',
      slot_duration_minutes: 30,
      max_appointments_per_slot: 10,
      location_name: '',
      location_address: '',
      is_active: true,
    })
    setSelectedSlot(null)
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="entity">{t('entityCode')}</Label>
                  <Input
                    id="entity"
                    value={formData.entity_code}
                    onChange={(e) => setFormData({ ...formData, entity_code: e.target.value.toUpperCase() })}
                    placeholder="CNEDOGE"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="day">{t('dayOfWeek')}</Label>
                  <Select
                    value={formData.day_of_week.toString()}
                    onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DAY_OF_WEEK_LABELS).map(([day, label]) => (
                        <SelectItem key={day} value={day}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                onClick={handleCreateSlot}
                disabled={!formData.entity_code || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tCommon('create')}
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
          <CardDescription>{t('total', { count: slotConfigs?.length || 0 })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
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
          </div>

          {/* Slots Table */}
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
                  <TableHead className="text-center">{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSlots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {t('noSlotsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSlots.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell>
                        <Badge variant="outline">{slot.entity_code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{DAY_OF_WEEK_LABELS[slot.day_of_week]}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{slot.slot_duration_minutes} min</TableCell>
                      <TableCell className="text-center">{slot.max_appointments_per_slot}</TableCell>
                      <TableCell>
                        {slot.location_name ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm truncate max-w-[150px]">{slot.location_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {slot.is_active ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(slot)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(slot)}
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
                <Input value={DAY_OF_WEEK_LABELS[formData.day_of_week]} disabled className="bg-muted" />
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
              {t('deleteConfirmDescription', {
                entity: selectedSlot?.entity_code,
                day: DAY_OF_WEEK_LABELS[selectedSlot?.day_of_week || 0],
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSlot}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
