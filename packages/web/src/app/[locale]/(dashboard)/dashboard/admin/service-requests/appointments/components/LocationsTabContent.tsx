'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Building,
  MapPin,
  Plus,
  Loader2,
  AlertCircle,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Power,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import {
  useEntityLocations,
  useCreateEntityLocation,
  useUpdateEntityLocation,
  useDeleteEntityLocation,
  useToggleEntityLocationActive,
} from '@/modules/entity-locations/hooks'
import { EntityLocationForm } from '@/modules/entity-locations/components/EntityLocationForm'
import {
  ENTITY_CODES,
  CITIES,
  ENTITY_INFO,
  type EntityLocation,
  type EntityLocationCreate,
  type EntityLocationUpdate,
  type EntityCode,
  type City,
} from '@/modules/entity-locations/types'

export default function LocationsTabContent() {
  const t = useTranslations('admin.serviceRequests.appointments.locations')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  // State
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [entityFilter, setEntityFilter] = useState<EntityCode | 'all'>('all')
  const [cityFilter, setCityFilter] = useState<City | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog state
  const [editingLocation, setEditingLocation] = useState<EntityLocation | null>(null)
  const [deletingLocation, setDeletingLocation] = useState<EntityLocation | null>(null)

  // Build query params
  const queryParams = useMemo(
    () => ({
      entity_code: entityFilter !== 'all' ? entityFilter : undefined,
      city: cityFilter !== 'all' ? cityFilter : undefined,
      is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      page,
      page_size: pageSize,
    }),
    [entityFilter, cityFilter, statusFilter, page, pageSize]
  )

  // Queries
  const { data, isLoading, error, refetch } = useEntityLocations(queryParams)

  // Mutations
  const createMutation = useCreateEntityLocation()
  const updateMutation = useUpdateEntityLocation()
  const deleteMutation = useDeleteEntityLocation()
  const toggleActiveMutation = useToggleEntityLocationActive()

  // Filtered locations (client-side search)
  const filteredLocations = useMemo(() => {
    if (!data?.items) return []
    if (!searchQuery) return data.items

    const query = searchQuery.toLowerCase()
    return data.items.filter(
      (loc) =>
        loc.location_name.toLowerCase().includes(query) ||
        loc.location_address?.toLowerCase().includes(query) ||
        loc.entity_code.toLowerCase().includes(query) ||
        loc.city.toLowerCase().includes(query)
    )
  }, [data?.items, searchQuery])

  // Find index of current editing location
  const currentEditIndex = useMemo(() => {
    if (!editingLocation || !filteredLocations.length) return -1
    return filteredLocations.findIndex((loc) => loc.id === editingLocation.id)
  }, [editingLocation, filteredLocations])

  // Handlers
  const handleUpdate = async (formData: EntityLocationCreate) => {
    if (!editingLocation) return
    const updateData: EntityLocationUpdate = {
      location_name: formData.location_name,
      location_address: formData.location_address,
      phone: formData.phone,
      email: formData.email,
      is_main_office: formData.is_main_office,
      is_active: formData.is_active,
      notes: formData.notes,
    }
    await updateMutation.mutateAsync({ id: editingLocation.id, data: updateData })
    setEditingLocation(null)
  }

  const handleDelete = async () => {
    if (!deletingLocation) return
    await deleteMutation.mutateAsync(deletingLocation.id)
    setDeletingLocation(null)
  }

  const handleToggleActive = async (location: EntityLocation) => {
    await toggleActiveMutation.mutateAsync(location.id)
  }

  const handlePreviousLocation = () => {
    if (currentEditIndex > 0) {
      setEditingLocation(filteredLocations[currentEditIndex - 1])
    }
  }

  const handleNextLocation = () => {
    if (currentEditIndex < filteredLocations.length - 1) {
      setEditingLocation(filteredLocations[currentEditIndex + 1])
    }
  }

  // Stats
  const stats = useMemo(() => {
    const items = data?.items || []
    return {
      total: data?.total || 0,
      insular: items.filter((l) => l.region === 'Insular').length,
      continental: items.filter((l) => l.region === 'Continental').length,
      active: items.filter((l) => l.is_active).length,
    }
  }, [data])

  // Render loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Render error
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalLocations')}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} {t('active')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('insular')}</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.insular}</div>
            <p className="text-xs text-muted-foreground">Malabo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('continental')}</CardTitle>
            <MapPin className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.continental}</div>
            <p className="text-xs text-muted-foreground">Bata, Mongomo...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('entities')}</CardTitle>
            <Building className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ENTITY_CODES.length}</div>
            <p className="text-xs text-muted-foreground">{t('registeredEntities')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('title')}
              </CardTitle>
              <CardDescription>{t('subtitle')}</CardDescription>
            </div>
            <Button onClick={() => router.push(`/${locale}/dashboard/admin/service-requests/appointments/locations/new`)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('addLocation')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select
              value={cityFilter}
              onValueChange={(v) => {
                setCityFilter(v as City | 'all')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('filterCity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCities')}</SelectItem>
                {CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={entityFilter}
              onValueChange={(v) => {
                setEntityFilter(v as EntityCode | 'all')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('filterEntity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allEntities')}</SelectItem>
                {ENTITY_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as 'all' | 'active' | 'inactive')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('filterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatus')}</SelectItem>
                <SelectItem value="active">{t('activeOnly')}</SelectItem>
                <SelectItem value="inactive">{t('inactiveOnly')}</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          {filteredLocations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">{t('noLocations')}</p>
              <p className="text-sm mb-4">{t('noLocationsDescription')}</p>
              <Button onClick={() => router.push(`/${locale}/dashboard/admin/service-requests/appointments/locations/new`)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('createFirstLocation')}
              </Button>
            </div>
          ) : (
            <>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('table.entity')}</TableHead>
                      <TableHead>{t('table.city')}</TableHead>
                      <TableHead>{t('table.region')}</TableHead>
                      <TableHead>{t('table.name')}</TableHead>
                      <TableHead>{t('table.contact')}</TableHead>
                      <TableHead>{t('table.status')}</TableHead>
                      <TableHead className="text-right">{t('table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLocations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{location.entity_code}</div>
                            <div className="text-xs text-muted-foreground max-w-[150px] truncate">
                              {ENTITY_INFO[location.entity_code]?.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {location.city}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              location.region === 'Insular'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }
                          >
                            {location.region}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <div className="font-medium truncate flex items-center gap-1">
                              {location.location_name}
                              {location.is_main_office && (
                                <Badge variant="default" className="text-xs ml-1">
                                  {t('mainOffice')}
                                </Badge>
                              )}
                            </div>
                            {location.location_address && (
                              <div className="text-xs text-muted-foreground truncate">
                                {location.location_address}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            {location.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {location.phone}
                              </span>
                            )}
                            {location.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[120px]">{location.email}</span>
                              </span>
                            )}
                            {!location.phone && !location.email && '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={location.is_active ? 'default' : 'secondary'}>
                            {location.is_active ? t('active') : t('inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingLocation(location)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                {tCommon('edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(location)}>
                                <Power className="mr-2 h-4 w-4" />
                                {location.is_active ? t('deactivate') : t('activate')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeletingLocation(location)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {tCommon('delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data && data.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t('pagination.showing', {
                      from: (page - 1) * pageSize + 1,
                      to: Math.min(page * pageSize, data.total),
                      total: data.total,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      {t('pagination.previous')}
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {t('pagination.page', { current: page, total: data.total_pages })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.total_pages}
                    >
                      {t('pagination.next')}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('form.editTitle')}</DialogTitle>
            <DialogDescription>{t('form.editDescription')}</DialogDescription>
          </DialogHeader>
          {editingLocation && (
            <EntityLocationForm
              location={editingLocation}
              onSubmit={handleUpdate}
              onCancel={() => setEditingLocation(null)}
              isLoading={updateMutation.isPending}
              onPrevious={handlePreviousLocation}
              onNext={handleNextLocation}
              hasPrevious={currentEditIndex > 0}
              hasNext={currentEditIndex < filteredLocations.length - 1}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingLocation} onOpenChange={(open) => !open && setDeletingLocation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm.description', {
                name: deletingLocation?.location_name,
                city: deletingLocation?.city,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
