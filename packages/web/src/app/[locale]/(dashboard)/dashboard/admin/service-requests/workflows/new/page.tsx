'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  GitBranch,
  DollarSign,
  Loader2,
  Save,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  useCreateWorkflow,
  useCreateTariff,
  WORKFLOW_CATEGORIES,
  TARIFF_TYPES,
} from '@/modules/service-requests-admin'
import type {
  WorkflowCreate,
  WorkflowTariffCreate,
  TariffType,
} from '@/modules/service-requests-admin'

interface TariffFormData {
  solicitud_type: string
  tariff_type: TariffType
  amount: number
  percentage_rate: number | null
  legal_reference: string
}

export default function NewWorkflowPage() {
  const t = useTranslations('admin.serviceRequests.workflows')
  const tTariffs = useTranslations('admin.serviceRequests.tariffs')
  const tCommon = useTranslations('common')
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string

  // Workflow form state
  const [workflowForm, setWorkflowForm] = useState<WorkflowCreate>({
    code: '',
    entity_code: '',
    name_es: '',
    description_es: '',
    category: 'IDENTIDAD',
    workflow_type: 'standard',
    requires_appointment: false,
    is_active: true,
  })

  // Tariffs to create with workflow
  const [tariffs, setTariffs] = useState<TariffFormData[]>([
    {
      solicitud_type: 'expedicion',
      tariff_type: 'FIXED',
      amount: 0,
      percentage_rate: null,
      legal_reference: '',
    },
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const createWorkflowMutation = useCreateWorkflow()
  const createTariffMutation = useCreateTariff()

  const addTariffRow = () => {
    setTariffs([
      ...tariffs,
      {
        solicitud_type: tariffs.length === 0 ? 'expedicion' : 'renovacion',
        tariff_type: 'FIXED',
        amount: 0,
        percentage_rate: null,
        legal_reference: '',
      },
    ])
  }

  const removeTariffRow = (index: number) => {
    if (tariffs.length > 1) {
      setTariffs(tariffs.filter((_, i) => i !== index))
    }
  }

  const updateTariff = (index: number, field: keyof TariffFormData, value: string | number | null) => {
    const updated = [...tariffs]
    updated[index] = { ...updated[index], [field]: value }
    setTariffs(updated)
  }

  const handleSubmit = async () => {
    if (!workflowForm.code || !workflowForm.entity_code || !workflowForm.name_es) {
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Create the workflow
      const workflow = await createWorkflowMutation.mutateAsync(workflowForm)

      // 2. Create tariffs for the workflow
      const validTariffs = tariffs.filter((t) => t.amount > 0 || t.percentage_rate)
      for (const tariff of validTariffs) {
        const tariffData: WorkflowTariffCreate = {
          workflow_code: workflow.code,
          solicitud_type: tariff.solicitud_type,
          tariff_type: tariff.tariff_type,
          amount: tariff.amount,
          percentage_rate: tariff.percentage_rate,
          currency: 'XAF',
          legal_reference: tariff.legal_reference || null,
          effective_from: new Date().toISOString().split('T')[0],
          effective_to: null,
          is_active: true,
        }
        await createTariffMutation.mutateAsync(tariffData)
      }

      // Navigate to the workflow detail page
      router.push(`/${locale}/dashboard/admin/service-requests/workflows/${workflow.code}`)
    } catch (error) {
      // Errors handled by mutations
      console.error('Error creating workflow:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = workflowForm.code && workflowForm.entity_code && workflowForm.name_es

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('createNew')}</h1>
          <p className="text-muted-foreground">{t('createNewDescription')}</p>
        </div>
      </div>

      {/* Workflow Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {t('workflowDetails')}
          </CardTitle>
          <CardDescription>{t('workflowDetailsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="code">{t('code')} *</Label>
              <Input
                id="code"
                value={workflowForm.code}
                onChange={(e) => setWorkflowForm({ ...workflowForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                placeholder="TR_PERMISO_CONDUCIR"
              />
              <p className="text-xs text-muted-foreground">Codigo unico del workflow (ej: TR_PERMISO_CONDUCIR)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity_code">{t('entityCode')} *</Label>
              <Input
                id="entity_code"
                value={workflowForm.entity_code}
                onChange={(e) => setWorkflowForm({ ...workflowForm, entity_code: e.target.value.toUpperCase() })}
                placeholder="MIN_TRANSPORTE"
              />
              <p className="text-xs text-muted-foreground">Entidad responsable (ej: MIN_TRANSPORTE)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_es">{t('nameEs')} *</Label>
              <Input
                id="name_es"
                value={workflowForm.name_es}
                onChange={(e) => setWorkflowForm({ ...workflowForm, name_es: e.target.value })}
                placeholder="Permiso de Conducir"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t('category')} *</Label>
              <Select
                value={workflowForm.category}
                onValueChange={(v) => setWorkflowForm({ ...workflowForm, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKFLOW_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow_type">{t('type')} *</Label>
              <Select
                value={workflowForm.workflow_type || 'standard'}
                onValueChange={(v) => setWorkflowForm({ ...workflowForm, workflow_type: v as 'standard' | 'direct_payment' | 'multi_phase' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Estandar</SelectItem>
                  <SelectItem value="direct_payment">Pago Directo</SelectItem>
                  <SelectItem value="multi_phase">Multi-fase</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description_es">{t('descriptionEs')}</Label>
            <Textarea
              id="description_es"
              value={workflowForm.description_es || ''}
              onChange={(e) => setWorkflowForm({ ...workflowForm, description_es: e.target.value })}
              rows={3}
              placeholder="Descripcion del tramite..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="requires_appointment">Requiere Cita</Label>
              <Switch
                id="requires_appointment"
                checked={workflowForm.requires_appointment || false}
                onCheckedChange={(checked) => setWorkflowForm({ ...workflowForm, requires_appointment: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">{t('isActive')}</Label>
              <Switch
                id="is_active"
                checked={workflowForm.is_active}
                onCheckedChange={(checked) => setWorkflowForm({ ...workflowForm, is_active: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tariffs Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {tTariffs('title')}
            </CardTitle>
            <CardDescription>Configure las tarifas para este workflow</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addTariffRow}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Tarifa
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {tariffs.map((tariff, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Tarifa {index + 1}</span>
                {tariffs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTariffRow(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>{tTariffs('solicitudType')}</Label>
                  <Select
                    value={tariff.solicitud_type}
                    onValueChange={(v) => updateTariff(index, 'solicitud_type', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expedicion">Expedicion</SelectItem>
                      <SelectItem value="renovacion">Renovacion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{tTariffs('tariffType')}</Label>
                  <Select
                    value={tariff.tariff_type}
                    onValueChange={(v) => updateTariff(index, 'tariff_type', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TARIFF_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{tTariffs('amount')} (XAF)</Label>
                  <Input
                    type="number"
                    value={tariff.amount}
                    onChange={(e) => updateTariff(index, 'amount', parseFloat(e.target.value) || 0)}
                    min={0}
                  />
                </div>
                {tariff.tariff_type === 'PERCENTAGE' && (
                  <div className="space-y-2">
                    <Label>{tTariffs('percentage')} (%)</Label>
                    <Input
                      type="number"
                      value={tariff.percentage_rate || ''}
                      onChange={(e) => updateTariff(index, 'percentage_rate', parseFloat(e.target.value) || null)}
                      min={0}
                      max={100}
                      step={0.01}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>{tTariffs('legalReference')}</Label>
                <Input
                  value={tariff.legal_reference}
                  onChange={(e) => updateTariff(index, 'legal_reference', e.target.value)}
                  placeholder="Ley XX/2024, Art. YY"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          {tCommon('cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {t('create')}
        </Button>
      </div>
    </div>
  )
}
