'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Save,
  X,
} from 'lucide-react'
import {
  useWorkflow,
  useTariffs,
  useCreateTariff,
  useUpdateTariff,
  useDeleteTariff,
  TARIFF_TYPES,
} from '@/modules/service-requests-admin'
import type {
  WorkflowTariff,
  WorkflowTariffCreate,
  WorkflowTariffUpdate,
  TariffType,
} from '@/modules/service-requests-admin'

type EditMode = 'none' | 'create' | 'edit'

export default function WorkflowTariffsPage() {
  const t = useTranslations('admin.serviceRequests.tariffs')
  const tCommon = useTranslations('common')
  const params = useParams()
  const router = useRouter()

  const workflowCode = params.code as string
  const locale = params.locale as string

  // Data
  const { data: workflow, isLoading: loadingWorkflow, error: workflowError } = useWorkflow(workflowCode)
  const { data: tariffs, isLoading: loadingTariffs } = useTariffs({ workflow_code: workflowCode })
  const createTariffMutation = useCreateTariff()
  const updateTariffMutation = useUpdateTariff()
  const deleteTariffMutation = useDeleteTariff()

  // Edit state
  const [editMode, setEditMode] = useState<EditMode>('none')
  const [editingTariffId, setEditingTariffId] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [tariffToDelete, setTariffToDelete] = useState<WorkflowTariff | null>(null)

  // Form state
  const [form, setForm] = useState<WorkflowTariffCreate>({
    workflow_code: workflowCode,
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

  // Reset form
  const resetForm = () => {
    setForm({
      workflow_code: workflowCode,
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
    setEditMode('none')
    setEditingTariffId(null)
  }

  // Start creating
  const startCreate = () => {
    resetForm()
    setEditMode('create')
  }

  // Start editing
  const startEdit = (tariff: WorkflowTariff) => {
    setForm({
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
    setEditingTariffId(tariff.id)
    setEditMode('edit')
  }

  // Cancel edit
  const cancelEdit = () => {
    resetForm()
  }

  // Save (create or update)
  const handleSave = async () => {
    try {
      if (editMode === 'create') {
        await createTariffMutation.mutateAsync({ ...form, workflow_code: workflowCode })
      } else if (editMode === 'edit' && editingTariffId) {
        const updateData: WorkflowTariffUpdate = {
          solicitud_type: form.solicitud_type,
          tariff_type: form.tariff_type as TariffType,
          amount: form.amount,
          percentage_rate: form.percentage_rate,
          currency: form.currency,
          legal_reference: form.legal_reference,
          effective_to: form.effective_to,
          is_active: form.is_active,
        }
        await updateTariffMutation.mutateAsync({ tariffId: editingTariffId, data: updateData })
      }
      resetForm()
    } catch {
      // Error handled by mutation
    }
  }

  // Delete
  const handleDelete = async () => {
    if (!tariffToDelete) return
    try {
      await deleteTariffMutation.mutateAsync(tariffToDelete.id)
      setIsDeleteDialogOpen(false)
      setTariffToDelete(null)
    } catch {
      // Error handled by mutation
    }
  }

  // Helpers
  const formatCurrency = (amount: number, currency = 'XAF') => {
    return new Intl.NumberFormat('es-GQ', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getTariffTypeBadge = (type: string) => {
    switch (type) {
      case 'FIXED': return <Badge variant="default">{t('typeFixed')}</Badge>
      case 'PERCENTAGE': return <Badge variant="secondary">{t('typePercentage')}</Badge>
      case 'NOTA_INGRESO': return <Badge variant="outline">{t('typeNotaIngreso')}</Badge>
      default: return <Badge variant="outline">{type}</Badge>
    }
  }

  const isSaving = createTariffMutation.isPending || updateTariffMutation.isPending
  const isLoading = loadingWorkflow || loadingTariffs

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
  if (workflowError || !workflow) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {tCommon('back')}
        </Button>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{workflowError instanceof Error ? workflowError.message : 'Workflow not found'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/${locale}/dashboard/admin/service-requests/workflows/${workflowCode}?tab=tariffs`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              Tarifas - {workflow.name_es}
            </h1>
            <p className="text-muted-foreground">
              <code className="bg-muted px-2 py-0.5 rounded">{workflow.code}</code>
            </p>
          </div>
        </div>
        {editMode === 'none' && (
          <Button onClick={startCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('create')}
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {editMode !== 'none' && (
        <Card className="border-primary">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {editMode === 'create' ? t('create') : t('edit')}
            </CardTitle>
            <CardDescription>
              {editMode === 'create' ? t('createDescription') : t('editDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{t('solicitudType')}</Label>
                <Select
                  value={form.solicitud_type}
                  onValueChange={(v) => setForm({ ...form, solicitud_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expedicion">Expedicion</SelectItem>
                    <SelectItem value="renovacion">Renovacion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('tariffType')}</Label>
                <Select
                  value={form.tariff_type}
                  onValueChange={(v) => setForm({ ...form, tariff_type: v as TariffType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TARIFF_TYPES.map((tt) => (
                      <SelectItem key={tt.value} value={tt.value}>{tt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('amount')} (XAF)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              {form.tariff_type === 'PERCENTAGE' && (
                <div className="space-y-2">
                  <Label>{t('percentage')} (%)</Label>
                  <Input
                    type="number"
                    value={form.percentage_rate || ''}
                    onChange={(e) => setForm({ ...form, percentage_rate: parseFloat(e.target.value) || null })}
                    min={0}
                    max={100}
                    step={0.01}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('effectiveFrom')}</Label>
                <Input
                  type="date"
                  value={form.effective_from}
                  onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('effectiveTo')}</Label>
                <Input
                  type="date"
                  value={form.effective_to || ''}
                  onChange={(e) => setForm({ ...form, effective_to: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('legalReference')}</Label>
                <Input
                  value={form.legal_reference || ''}
                  onChange={(e) => setForm({ ...form, legal_reference: e.target.value })}
                  placeholder="Ley XX/2024, Art. YY"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
                <Label htmlFor="is_active">{t('isActive')}</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancelEdit} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  {tCommon('cancel')}
                </Button>
                <Button onClick={handleSave} disabled={!form.amount || isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {tCommon('save')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tariffs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {t('total', { count: tariffs?.length || 0 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(tariffs?.length || 0) === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('noTariffsFound')}</p>
              <p className="text-sm mt-1">Haga clic en &quot;Crear Tarifa&quot; para agregar una nueva tarifa</p>
              {editMode === 'none' && (
                <Button onClick={startCreate} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('create')}
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('solicitudType')}</TableHead>
                    <TableHead>{t('type')}</TableHead>
                    <TableHead className="text-right">{t('amount')}</TableHead>
                    <TableHead>{t('legalReference')}</TableHead>
                    <TableHead>{t('validity')}</TableHead>
                    <TableHead className="text-center">{t('status')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tariffs?.map((tariff) => (
                    <TableRow key={tariff.id} className={editingTariffId === tariff.id ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{tariff.solicitud_type}</Badge>
                      </TableCell>
                      <TableCell>{getTariffTypeBadge(tariff.tariff_type)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {tariff.tariff_type === 'PERCENTAGE' && tariff.percentage_rate
                          ? `${tariff.percentage_rate}%`
                          : formatCurrency(tariff.amount, tariff.currency)}
                      </TableCell>
                      <TableCell>
                        {tariff.legal_reference ? (
                          <span className="text-sm">{tariff.legal_reference}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{tariff.effective_from}</div>
                          {tariff.effective_to && (
                            <div className="text-muted-foreground">hasta {tariff.effective_to}</div>
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
                            onClick={() => startEdit(tariff)}
                            disabled={editMode !== 'none'}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setTariffToDelete(tariff); setIsDeleteDialogOpen(true) }}
                            className="text-destructive hover:text-destructive"
                            disabled={editMode !== 'none'}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmDescription', { workflow: tariffToDelete?.workflow_code })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTariffMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
