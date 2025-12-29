'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DollarSign,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Calculator,
  CheckCircle,
  XCircle,
  Receipt,
} from 'lucide-react'
import {
  useWorkflows,
  useTariffs,
  useCreateTariff,
  useUpdateTariff,
  useDeleteTariff,
} from '@/modules/service-requests-admin'
import type {
  WorkflowTariff,
  WorkflowTariffCreate,
  WorkflowTariffUpdate,
  TariffType,
} from '@/modules/service-requests-admin'
import { TARIFF_TYPES } from '@/modules/service-requests-admin'
import SupplementsTabContent from './components/SupplementsTabContent'

export default function TariffsPage() {
  const t = useTranslations('admin.serviceRequests.tariffs')
  const tCommon = useTranslations('common')
  const [activeTab, setActiveTab] = useState('tariffs')

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [workflowFilter, setWorkflowFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false)
  const [selectedTariff, setSelectedTariff] = useState<WorkflowTariff | null>(null)

  // Simulator state
  const [simulatorAmount, setSimulatorAmount] = useState<number>(100000)
  const [simulatorResult, setSimulatorResult] = useState<number | null>(null)

  // Form state
  const [formData, setFormData] = useState<WorkflowTariffCreate>({
    workflow_code: '',
    solicitud_type: 'expedicion',
    tariff_type: 'FIXED',
    amount: 0,
    percentage_rate: null,
    currency: 'XAF',
    legal_reference: '',
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: null,
    is_active: true,
  })

  // Queries
  const { data: workflows } = useWorkflows()
  const {
    data: tariffs,
    isLoading,
    error,
    refetch,
  } = useTariffs({
    workflow_code: workflowFilter === 'all' ? undefined : workflowFilter,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
  })

  // Mutations
  const createMutation = useCreateTariff()
  const updateMutation = useUpdateTariff()
  const deleteMutation = useDeleteTariff()

  // Filter tariffs by search
  const filteredTariffs = tariffs?.filter((t) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      t.workflow_code.toLowerCase().includes(query) ||
      t.solicitud_type.toLowerCase().includes(query)
    )
  }) || []

  // Handlers
  const handleCreateTariff = async () => {
    try {
      await createMutation.mutateAsync(formData)
      setIsCreateDialogOpen(false)
      resetForm()
    } catch {
      // Error handled by mutation
    }
  }

  const handleUpdateTariff = async () => {
    if (!selectedTariff) return

    try {
      const updateData: WorkflowTariffUpdate = {
        solicitud_type: formData.solicitud_type,
        tariff_type: formData.tariff_type as TariffType,
        amount: formData.amount,
        percentage_rate: formData.percentage_rate,
        currency: formData.currency,
        legal_reference: formData.legal_reference,
        effective_to: formData.effective_to,
        is_active: formData.is_active,
      }
      await updateMutation.mutateAsync({ tariffId: selectedTariff.id, data: updateData })
      setIsEditDialogOpen(false)
      resetForm()
    } catch {
      // Error handled by mutation
    }
  }

  const handleDeleteTariff = async () => {
    if (!selectedTariff) return

    try {
      await deleteMutation.mutateAsync(selectedTariff.id)
      setIsDeleteDialogOpen(false)
      setSelectedTariff(null)
    } catch {
      // Error handled by mutation
    }
  }

  const openEditDialog = (tariff: WorkflowTariff) => {
    setSelectedTariff(tariff)
    setFormData({
      workflow_code: tariff.workflow_code,
      solicitud_type: tariff.solicitud_type,
      tariff_type: tariff.tariff_type as TariffType,
      amount: tariff.amount,
      percentage_rate: tariff.percentage_rate,
      currency: tariff.currency,
      legal_reference: tariff.legal_reference || '',
      effective_from: tariff.effective_from,
      effective_to: tariff.effective_to,
      is_active: tariff.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (tariff: WorkflowTariff) => {
    setSelectedTariff(tariff)
    setIsDeleteDialogOpen(true)
  }

  const openSimulator = (tariff: WorkflowTariff) => {
    setSelectedTariff(tariff)
    setSimulatorAmount(100000)
    calculateSimulation(tariff, 100000)
    setIsSimulatorOpen(true)
  }

  const calculateSimulation = (tariff: WorkflowTariff, baseAmount: number) => {
    if (tariff.tariff_type === 'FIXED') {
      setSimulatorResult(tariff.amount)
    } else if (tariff.tariff_type === 'PERCENTAGE' && tariff.percentage_rate) {
      setSimulatorResult(baseAmount * (tariff.percentage_rate / 100))
    } else {
      setSimulatorResult(tariff.amount)
    }
  }

  const resetForm = () => {
    setFormData({
      workflow_code: '',
      solicitud_type: 'expedicion',
      tariff_type: 'FIXED',
      amount: 0,
      percentage_rate: null,
      currency: 'XAF',
      legal_reference: '',
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: null,
      is_active: true,
    })
    setSelectedTariff(null)
  }

  const formatCurrency = (amount: number, currency: string = 'XAF') => {
    return new Intl.NumberFormat('es-GQ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getTariffTypeBadge = (type: string) => {
    switch (type) {
      case 'FIXED':
        return <Badge variant="default">{t('typeFixed')}</Badge>
      case 'PERCENTAGE':
        return <Badge variant="secondary">{t('typePercentage')}</Badge>
      case 'NOTA_INGRESO':
        return <Badge variant="outline">{t('typeNotaIngreso')}</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error instanceof Error ? error.message : 'Error loading tariffs'}</span>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              {tCommon('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="tariffs" className="gap-2">
            <DollarSign className="h-4 w-4" />
            {t('tabs.tariffs')}
          </TabsTrigger>
          <TabsTrigger value="supplements" className="gap-2">
            <Receipt className="h-4 w-4" />
            {t('tabs.supplements')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tariffs" className="space-y-6">
          {/* Tariffs Actions */}
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
                <Label htmlFor="workflow">{t('workflow')}</Label>
                <Select
                  value={formData.workflow_code}
                  onValueChange={(value) => setFormData({ ...formData, workflow_code: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectWorkflow')} />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows?.map((wf) => (
                      <SelectItem key={wf.code} value={wf.code}>
                        {wf.code} - {wf.name_es}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="solicitud_type">{t('solicitudType')}</Label>
                  <Select
                    value={formData.solicitud_type}
                    onValueChange={(value) => setFormData({ ...formData, solicitud_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectSolicitudType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expedicion">{t('solicitudTypeExpedicion')}</SelectItem>
                      <SelectItem value="renovacion">{t('solicitudTypeRenovacion')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tariff_type">{t('tariffType')}</Label>
                  <Select
                    value={formData.tariff_type}
                    onValueChange={(value) => setFormData({ ...formData, tariff_type: value as TariffType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARIFF_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">{t('amount')} (XAF)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                {formData.tariff_type === 'PERCENTAGE' && (
                  <div className="grid gap-2">
                    <Label htmlFor="percentage">{t('percentage')} (%)</Label>
                    <Input
                      id="percentage"
                      type="number"
                      value={formData.percentage_rate || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, percentage_rate: parseFloat(e.target.value) || null })
                      }
                      min={0}
                      max={100}
                      step={0.01}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="effective_from">{t('effectiveFrom')}</Label>
                  <Input
                    id="effective_from"
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="effective_to">{t('effectiveTo')}</Label>
                  <Input
                    id="effective_to"
                    type="date"
                    value={formData.effective_to || ''}
                    onChange={(e) => setFormData({ ...formData, effective_to: e.target.value || null })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="legal_reference">{t('legalReference')}</Label>
                <Input
                  id="legal_reference"
                  value={formData.legal_reference || ''}
                  onChange={(e) => setFormData({ ...formData, legal_reference: e.target.value })}
                  placeholder="Ley XX/2024, Art. YY"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active_tariff">{t('isActive')}</Label>
                <Switch
                  id="is_active_tariff"
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
                onClick={handleCreateTariff}
                disabled={!formData.workflow_code || !formData.amount || createMutation.isPending}
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
            <DollarSign className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('total', { count: tariffs?.length || 0 })}</CardDescription>
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
            <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('filterByWorkflow')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allWorkflows')}</SelectItem>
                {workflows?.map((wf) => (
                  <SelectItem key={wf.code} value={wf.code}>
                    {wf.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="inactive">{t('inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tariffs Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('workflow')}</TableHead>
                  <TableHead>{t('solicitudType')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead className="text-right">{t('amount')}</TableHead>
                  <TableHead>{t('validity')}</TableHead>
                  <TableHead className="text-center">{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTariffs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {t('noTariffsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTariffs.map((tariff) => (
                    <TableRow key={tariff.id}>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{tariff.workflow_code}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tariff.solicitud_type}</Badge>
                      </TableCell>
                      <TableCell>{getTariffTypeBadge(tariff.tariff_type)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {tariff.tariff_type === 'PERCENTAGE' && tariff.percentage_rate
                          ? `${tariff.percentage_rate}%`
                          : formatCurrency(tariff.amount, tariff.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{tariff.effective_from}</div>
                          {tariff.effective_to && (
                            <div className="text-muted-foreground">→ {tariff.effective_to}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {tariff.is_active ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openSimulator(tariff)}
                            title={t('simulate')}
                          >
                            <Calculator className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(tariff)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(tariff)}
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
            <div className="grid gap-2">
              <Label>{t('workflow')}</Label>
              <Input value={formData.workflow_code} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-solicitud">{t('solicitudType')}</Label>
                <Select
                  value={formData.solicitud_type}
                  onValueChange={(value) => setFormData({ ...formData, solicitud_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expedicion">{t('solicitudTypeExpedicion')}</SelectItem>
                    <SelectItem value="renovacion">{t('solicitudTypeRenovacion')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">{t('tariffType')}</Label>
                <Select
                  value={formData.tariff_type}
                  onValueChange={(value) => setFormData({ ...formData, tariff_type: value as TariffType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARIFF_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">{t('amount')} (XAF)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              {formData.tariff_type === 'PERCENTAGE' && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-percentage">{t('percentage')} (%)</Label>
                  <Input
                    id="edit-percentage"
                    type="number"
                    value={formData.percentage_rate || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, percentage_rate: parseFloat(e.target.value) || null })
                    }
                    min={0}
                    max={100}
                    step={0.01}
                  />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-legal">{t('legalReference')}</Label>
              <Input
                id="edit-legal"
                value={formData.legal_reference || ''}
                onChange={(e) => setFormData({ ...formData, legal_reference: e.target.value })}
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
            <Button onClick={handleUpdateTariff} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simulator Dialog */}
      <Dialog open={isSimulatorOpen} onOpenChange={setIsSimulatorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {t('simulator')}
            </DialogTitle>
            <DialogDescription>{t('simulatorDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">{t('workflow')}</div>
              <div className="font-medium">{selectedTariff?.workflow_code}</div>
              <div className="text-sm text-muted-foreground mt-2">{t('tariffType')}</div>
              <div className="font-medium">
                {selectedTariff?.tariff_type === 'PERCENTAGE'
                  ? `${selectedTariff?.percentage_rate}%`
                  : formatCurrency(selectedTariff?.amount || 0)}
              </div>
            </div>

            {selectedTariff?.tariff_type === 'PERCENTAGE' && (
              <div className="grid gap-2">
                <Label htmlFor="sim-amount">{t('baseAmount')} (XAF)</Label>
                <Input
                  id="sim-amount"
                  type="number"
                  value={simulatorAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    setSimulatorAmount(val)
                    if (selectedTariff) calculateSimulation(selectedTariff, val)
                  }}
                  min={0}
                />
              </div>
            )}

            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="text-sm text-muted-foreground">{t('calculatedAmount')}</div>
              <div className="text-2xl font-bold text-primary">
                {simulatorResult !== null ? formatCurrency(simulatorResult) : '-'}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSimulatorOpen(false)}>{tCommon('close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmDescription', { workflow: selectedTariff?.workflow_code })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTariff}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </TabsContent>

        <TabsContent value="supplements">
          <SupplementsTabContent />
        </TabsContent>
      </Tabs>
    </div>
  )
}
