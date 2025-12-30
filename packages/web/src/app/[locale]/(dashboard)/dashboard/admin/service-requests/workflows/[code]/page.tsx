'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  ChevronLeft,
  ChevronRight,
  GitBranch,
  DollarSign,
  FileCheck,
  CalendarClock,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Save,
  X,
  Boxes,
} from 'lucide-react'
import {
  useWorkflow,
  useWorkflows,
  useCreateWorkflow,
  useUpdateWorkflow,
  useTariffs,
  useCreateTariff,
  useUpdateTariff,
  useDeleteTariff,
  useSupplements,
  useWorkflowSupplements,
  useAddWorkflowSupplement,
  useUpdateWorkflowSupplement,
  useRemoveWorkflowSupplement,
  useDocumentRequirements,
  useAddDocumentRequirement,
  useUpdateDocumentRequirement,
  useRemoveDocumentRequirement,
  useReorderDocuments,
  useSlotConfigs,
  useBlockedDates,
  useDelayRules,
  WORKFLOW_CATEGORIES,
  DOCUMENT_CONDITION_TYPES,
  TARIFF_TYPES,
} from '@/modules/service-requests-admin'
import type {
  WorkflowCreate,
  WorkflowUpdate,
  WorkflowTariff,
  WorkflowTariffCreate,
  WorkflowTariffUpdate,
  TariffType,
  WorkflowSupplementConfig,
  WorkflowSupplementConfigCreate,
  WorkflowSupplementConfigUpdate,
  DocumentRequirement,
  DocumentRequirementCreate,
  DocumentRequirementUpdate,
  DocumentConditionType,
  DocumentReorderItem,
} from '@/modules/service-requests-admin'

export default function WorkflowDetailPage() {
  const t = useTranslations('admin.serviceRequests.workflows')
  const tTariffs = useTranslations('admin.serviceRequests.tariffs')
  const tDocs = useTranslations('admin.serviceRequests.documents')
  const tCommon = useTranslations('common')
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const workflowCode = params.code as string
  const locale = params.locale as string
  const initialTab = searchParams.get('tab') || 'info'
  const [activeTab, setActiveTab] = useState(initialTab)

  // Detect create mode
  const isCreateMode = workflowCode === 'new'

  // Workflow data (skip fetch in create mode)
  const { data: workflow, isLoading: loadingWorkflow, error: workflowError, refetch } = useWorkflow(
    isCreateMode ? '' : workflowCode,
    { enabled: !isCreateMode }
  )
  const { data: allWorkflows } = useWorkflows()
  const createWorkflowMutation = useCreateWorkflow()
  const updateWorkflowMutation = useUpdateWorkflow()

  // Create mode form state
  const [createForm, setCreateForm] = useState<WorkflowCreate>({
    code: '',
    entity_code: '',
    name_es: '',
    description_es: '',
    category: 'IDENTIDAD',
    workflow_type: 'standard',
    requires_appointment: false,
    is_active: true,
  })
  const [isCreating, setIsCreating] = useState(false)

  // Calculate prev/next navigation
  const workflowCodes = allWorkflows?.map((w) => w.code) || []
  const currentIndex = workflowCodes.indexOf(workflowCode)
  const prevWorkflowCode = currentIndex > 0 ? workflowCodes[currentIndex - 1] : null
  const nextWorkflowCode = currentIndex >= 0 && currentIndex < workflowCodes.length - 1 ? workflowCodes[currentIndex + 1] : null
  const workflowPosition = currentIndex >= 0 ? `${currentIndex + 1} de ${workflowCodes.length}` : ''

  // Workflow edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<WorkflowUpdate>>({})

  // Tariffs data
  const { data: allTariffs, isLoading: loadingTariffs } = useTariffs({ workflow_code: workflowCode })
  const createTariffMutation = useCreateTariff()
  const updateTariffMutation = useUpdateTariff()
  const deleteTariffMutation = useDeleteTariff()

  // Tariff inline form state
  type TariffEditMode = 'none' | 'create' | 'edit'
  const [tariffEditMode, setTariffEditMode] = useState<TariffEditMode>('none')
  const [editingTariffId, setEditingTariffId] = useState<number | null>(null)
  const [isDeleteTariffDialogOpen, setIsDeleteTariffDialogOpen] = useState(false)
  const [tariffToDelete, setTariffToDelete] = useState<WorkflowTariff | null>(null)
  const [tariffForm, setTariffForm] = useState<WorkflowTariffCreate>({
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

  // Supplements data
  const { data: allSupplements } = useSupplements(true) // Get only active supplements
  const { data: workflowSupplements, isLoading: loadingSupplements } = useWorkflowSupplements(workflowCode)
  const addWorkflowSupplementMutation = useAddWorkflowSupplement()
  const updateWorkflowSupplementMutation = useUpdateWorkflowSupplement()
  const removeWorkflowSupplementMutation = useRemoveWorkflowSupplement()

  // Supplement inline form state
  type SupplementEditMode = 'none' | 'create' | 'edit'
  const [supplementEditMode, setSupplementEditMode] = useState<SupplementEditMode>('none')
  const [editingSupplementCode, setEditingSupplementCode] = useState<string | null>(null)
  const [isDeleteSupplementDialogOpen, setIsDeleteSupplementDialogOpen] = useState(false)
  const [supplementToDelete, setSupplementToDelete] = useState<WorkflowSupplementConfig | null>(null)
  const [supplementForm, setSupplementForm] = useState<WorkflowSupplementConfigCreate>({
    supplement_code: '',
    quantity_per_request: 1,
    is_required: false,
    is_active: true,
  })

  // Documents data
  const { data: documents, isLoading: loadingDocuments } = useDocumentRequirements(workflowCode)
  const addDocumentMutation = useAddDocumentRequirement()
  const updateDocumentMutation = useUpdateDocumentRequirement()
  const removeDocumentMutation = useRemoveDocumentRequirement()
  const reorderDocumentsMutation = useReorderDocuments()

  // Document inline form state
  type DocumentEditMode = 'none' | 'create' | 'edit'
  const [documentEditMode, setDocumentEditMode] = useState<DocumentEditMode>('none')
  const [editingDocumentCode, setEditingDocumentCode] = useState<string | null>(null)
  const [isDeleteDocDialogOpen, setIsDeleteDocDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<DocumentRequirement | null>(null)
  const [docForm, setDocForm] = useState<DocumentRequirementCreate>({
    document_code: '',
    document_name_es: '',
    condition_type: 'always',
    is_required: true,
    display_order: 0,
    instructions_es: '',
    extraction_schema_key: '',
    is_active: true,
  })

  // Appointments data (read-only summary)
  const { data: slotConfigs } = useSlotConfigs({ workflow_code: workflowCode })
  const { data: blockedDates } = useBlockedDates({ workflow_code: workflowCode })
  const { data: delayRules } = useDelayRules(workflowCode)

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const newUrl = `/${locale}/dashboard/admin/service-requests/workflows/${workflowCode}?tab=${value}`
    router.push(newUrl, { scroll: false })
  }

  // Initialize edit form when workflow loads
  useEffect(() => {
    if (workflow) {
      setEditForm({
        name_es: workflow.name_es,
        description_es: workflow.description_es,
        workflow_type: workflow.workflow_type,
        is_active: workflow.is_active,
      })
    }
  }, [workflow])

  // Handlers - Workflow
  const handleCreateWorkflow = async () => {
    if (!createForm.code || !createForm.entity_code || !createForm.name_es) {
      return
    }
    setIsCreating(true)
    try {
      const newWorkflow = await createWorkflowMutation.mutateAsync(createForm)
      // Redirect to the created workflow's detail page
      router.push(`/${locale}/dashboard/admin/service-requests/workflows/${newWorkflow.code}`)
    } catch {
      // Error handled by mutation
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveWorkflow = async () => {
    try {
      await updateWorkflowMutation.mutateAsync({ code: workflowCode, data: editForm as WorkflowUpdate })
      setIsEditing(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isCreateFormValid = createForm.code && createForm.entity_code && createForm.name_es

  // Handlers - Tariffs
  const resetTariffForm = () => {
    setTariffForm({
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
    setTariffEditMode('none')
    setEditingTariffId(null)
  }

  const startCreateTariff = () => {
    resetTariffForm()
    setTariffEditMode('create')
  }

  const startEditTariff = (tariff: WorkflowTariff) => {
    setTariffForm({
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
    setTariffEditMode('edit')
  }

  const handleSaveTariff = async () => {
    try {
      if (tariffEditMode === 'create') {
        await createTariffMutation.mutateAsync({ ...tariffForm, workflow_code: workflowCode })
      } else if (tariffEditMode === 'edit' && editingTariffId) {
        const updateData: WorkflowTariffUpdate = {
          solicitud_type: tariffForm.solicitud_type,
          tariff_type: tariffForm.tariff_type as TariffType,
          amount: tariffForm.amount,
          percentage_rate: tariffForm.percentage_rate,
          currency: tariffForm.currency,
          legal_reference: tariffForm.legal_reference,
          effective_to: tariffForm.effective_to,
          is_active: tariffForm.is_active,
        }
        await updateTariffMutation.mutateAsync({ tariffId: editingTariffId, data: updateData })
      }
      resetTariffForm()
    } catch {
      // Error handled by mutation
    }
  }

  const handleDeleteTariff = async () => {
    if (!tariffToDelete) return
    try {
      await deleteTariffMutation.mutateAsync(tariffToDelete.id)
      setIsDeleteTariffDialogOpen(false)
      setTariffToDelete(null)
    } catch {
      // Error handled by mutation
    }
  }

  const isTariffSaving = createTariffMutation.isPending || updateTariffMutation.isPending

  // Handlers - Supplements
  const resetSupplementForm = () => {
    setSupplementForm({
      supplement_code: '',
      quantity_per_request: 1,
      is_required: false,
      is_active: true,
    })
    setSupplementEditMode('none')
    setEditingSupplementCode(null)
  }

  const startCreateSupplement = () => {
    resetSupplementForm()
    setSupplementEditMode('create')
  }

  const startEditSupplement = (config: WorkflowSupplementConfig) => {
    setSupplementForm({
      supplement_code: config.supplement_code,
      quantity_per_request: config.quantity_per_request,
      is_required: config.is_required,
      is_active: config.is_active,
    })
    setEditingSupplementCode(config.supplement_code)
    setSupplementEditMode('edit')
  }

  const handleSaveSupplement = async () => {
    try {
      if (supplementEditMode === 'create') {
        await addWorkflowSupplementMutation.mutateAsync({
          workflowCode,
          data: supplementForm,
        })
      } else if (supplementEditMode === 'edit' && editingSupplementCode) {
        const updateData: WorkflowSupplementConfigUpdate = {
          quantity_per_request: supplementForm.quantity_per_request,
          is_required: supplementForm.is_required,
          is_active: supplementForm.is_active,
        }
        await updateWorkflowSupplementMutation.mutateAsync({
          workflowCode,
          supplementCode: editingSupplementCode,
          data: updateData,
        })
      }
      resetSupplementForm()
    } catch {
      // Error handled by mutation
    }
  }

  const handleDeleteSupplement = async () => {
    if (!supplementToDelete) return
    try {
      await removeWorkflowSupplementMutation.mutateAsync({
        workflowCode,
        supplementCode: supplementToDelete.supplement_code,
      })
      setIsDeleteSupplementDialogOpen(false)
      setSupplementToDelete(null)
    } catch {
      // Error handled by mutation
    }
  }

  const isSupplementSaving = addWorkflowSupplementMutation.isPending || updateWorkflowSupplementMutation.isPending

  // Get available supplements (not already configured for this workflow)
  const configuredSupplementCodes = workflowSupplements?.map((ws) => ws.supplement_code) || []
  const availableSupplements = allSupplements?.filter((s) => !configuredSupplementCodes.includes(s.code)) || []

  // Handlers - Documents
  const resetDocForm = () => {
    setDocForm({
      document_code: '',
      document_name_es: '',
      condition_type: 'always',
      is_required: true,
      display_order: 0,
      instructions_es: '',
      extraction_schema_key: '',
      is_active: true,
    })
    setDocumentEditMode('none')
    setEditingDocumentCode(null)
  }

  const startCreateDocument = () => {
    resetDocForm()
    setDocumentEditMode('create')
  }

  const startEditDocument = (doc: DocumentRequirement) => {
    setDocForm({
      document_code: doc.document_code,
      document_name_es: doc.document_name_es,
      condition_type: doc.condition_type as DocumentConditionType,
      is_required: doc.is_required,
      display_order: doc.display_order,
      instructions_es: doc.instructions_es || '',
      extraction_schema_key: doc.extraction_schema_key || '',
      is_active: doc.is_active,
    })
    setEditingDocumentCode(doc.document_code)
    setDocumentEditMode('edit')
  }

  const handleSaveDocument = async () => {
    try {
      if (documentEditMode === 'create') {
        await addDocumentMutation.mutateAsync({
          workflowCode,
          data: { ...docForm, display_order: documents?.length || 0 },
        })
      } else if (documentEditMode === 'edit' && editingDocumentCode) {
        const updateData: DocumentRequirementUpdate = {
          document_name_es: docForm.document_name_es,
          condition_type: docForm.condition_type,
          is_required: docForm.is_required,
          instructions_es: docForm.instructions_es,
          extraction_schema_key: docForm.extraction_schema_key,
          is_active: docForm.is_active,
        }
        await updateDocumentMutation.mutateAsync({
          workflowCode,
          documentCode: editingDocumentCode,
          data: updateData,
        })
      }
      resetDocForm()
    } catch {
      // Error handled by mutation
    }
  }

  const handleRemoveDocument = async () => {
    if (!documentToDelete) return
    try {
      await removeDocumentMutation.mutateAsync({
        workflowCode,
        documentCode: documentToDelete.document_code,
      })
      setIsDeleteDocDialogOpen(false)
      setDocumentToDelete(null)
    } catch {
      // Error handled by mutation
    }
  }

  const handleMoveDocument = async (doc: DocumentRequirement, direction: 'up' | 'down') => {
    const sortedDocs = [...(documents || [])].sort((a, b) => a.display_order - b.display_order)
    const currentIndex = sortedDocs.findIndex((d) => d.id === doc.id)
    if (direction === 'up' && currentIndex <= 0) return
    if (direction === 'down' && currentIndex >= sortedDocs.length - 1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const newOrder: DocumentReorderItem[] = sortedDocs.map((d, i) => {
      if (i === currentIndex) return { document_code: d.document_code, display_order: targetIndex }
      if (i === targetIndex) return { document_code: d.document_code, display_order: currentIndex }
      return { document_code: d.document_code, display_order: i }
    })

    await reorderDocumentsMutation.mutateAsync({ workflowCode, order: newOrder })
  }

  const isDocumentSaving = addDocumentMutation.isPending || updateDocumentMutation.isPending

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
      case 'FIXED': return <Badge variant="default">{tTariffs('typeFixed')}</Badge>
      case 'PERCENTAGE': return <Badge variant="secondary">{tTariffs('typePercentage')}</Badge>
      case 'NOTA_INGRESO': return <Badge variant="outline">{tTariffs('typeNotaIngreso')}</Badge>
      default: return <Badge variant="outline">{type}</Badge>
    }
  }

  const getConditionBadge = (type: string) => {
    switch (type) {
      case 'always': return <Badge variant="default">{tDocs('conditionAlways')}</Badge>
      case 'if_solicitud_type': return <Badge variant="secondary">{tDocs('conditionSolicitud')}</Badge>
      case 'if_form_field': return <Badge variant="outline">{tDocs('conditionFormField')}</Badge>
      default: return <Badge variant="outline">{type}</Badge>
    }
  }

  const sortedDocuments = [...(documents || [])].sort((a, b) => a.display_order - b.display_order)

  // Loading state
  // Create Mode UI
  if (isCreateMode) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/${locale}/dashboard/admin/service-requests/workflows`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Lista
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('createNew')}</h1>
          <p className="text-muted-foreground">{t('createNewDescription')}</p>
        </div>

        {/* Create Workflow Form */}
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
                <Label htmlFor="create_code">{t('code')} *</Label>
                <Input
                  id="create_code"
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                  placeholder="TR_PERMISO_CONDUCIR"
                />
                <p className="text-xs text-muted-foreground">Codigo unico del workflow (ej: TR_PERMISO_CONDUCIR)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_entity_code">{t('entityCode')} *</Label>
                <Input
                  id="create_entity_code"
                  value={createForm.entity_code}
                  onChange={(e) => setCreateForm({ ...createForm, entity_code: e.target.value.toUpperCase() })}
                  placeholder="MIN_TRANSPORTE"
                />
                <p className="text-xs text-muted-foreground">Entidad responsable (ej: MIN_TRANSPORTE)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_name_es">{t('nameEs')} *</Label>
                <Input
                  id="create_name_es"
                  value={createForm.name_es}
                  onChange={(e) => setCreateForm({ ...createForm, name_es: e.target.value })}
                  placeholder="Permiso de Conducir"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_category">{t('category')} *</Label>
                <Select
                  value={createForm.category}
                  onValueChange={(v) => setCreateForm({ ...createForm, category: v })}
                >
                  <SelectTrigger id="create_category">
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
                <Label htmlFor="create_workflow_type">{t('type')} *</Label>
                <Select
                  value={createForm.workflow_type || 'standard'}
                  onValueChange={(v) => setCreateForm({ ...createForm, workflow_type: v as 'standard' | 'direct_payment' | 'multi_phase' })}
                >
                  <SelectTrigger id="create_workflow_type">
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
              <Label htmlFor="create_description_es">{t('descriptionEs')}</Label>
              <Textarea
                id="create_description_es"
                value={createForm.description_es || ''}
                onChange={(e) => setCreateForm({ ...createForm, description_es: e.target.value })}
                rows={3}
                placeholder="Descripcion del tramite..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="create_requires_appointment">Requiere Cita</Label>
                <Switch
                  id="create_requires_appointment"
                  checked={createForm.requires_appointment || false}
                  onCheckedChange={(checked) => setCreateForm({ ...createForm, requires_appointment: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="create_is_active">{t('isActive')}</Label>
                <Switch
                  id="create_is_active"
                  checked={createForm.is_active}
                  onCheckedChange={(checked) => setCreateForm({ ...createForm, is_active: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info about next steps */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Tarifas, Documentos y Suplementos</p>
                <p className="text-sm text-muted-foreground">
                  Despues de crear el workflow, podra configurar tarifas, documentos requeridos y suplementos desde la pagina de detalle.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/dashboard/admin/service-requests/workflows`)}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={handleCreateWorkflow}
            disabled={!isCreateFormValid || isCreating}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {t('create')}
          </Button>
        </div>
      </div>
    )
  }

  if (loadingWorkflow) {
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
        <Button variant="ghost" onClick={() => router.push(`/${locale}/dashboard/admin/service-requests/workflows`)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {tCommon('back')}
        </Button>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{workflowError instanceof Error ? workflowError.message : 'Workflow not found'}</span>
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
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/${locale}/dashboard/admin/service-requests/workflows`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Lista
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => prevWorkflowCode && router.push(`/${locale}/dashboard/admin/service-requests/workflows/${prevWorkflowCode}?tab=${activeTab}`)}
            disabled={!prevWorkflowCode}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground px-2 min-w-[80px] text-center">
            {workflowPosition}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => nextWorkflowCode && router.push(`/${locale}/dashboard/admin/service-requests/workflows/${nextWorkflowCode}?tab=${activeTab}`)}
            disabled={!nextWorkflowCode}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Workflow Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{workflow.name_es}</h1>
            {workflow.is_active ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Activo
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3" />
                Inactivo
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            <code className="bg-muted px-2 py-0.5 rounded">{workflow.code}</code>
            {" - "}{workflow.entity_code}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="info" className="gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Informacion</span>
          </TabsTrigger>
          <TabsTrigger value="tariffs" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Tarifas</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Documentos</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">Citas</span>
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('workflowDetails')}</CardTitle>
                <CardDescription>{t('workflowDetailsDescription')}</CardDescription>
              </div>
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {tCommon('edit')}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    {tCommon('cancel')}
                  </Button>
                  <Button onClick={handleSaveWorkflow} disabled={updateWorkflowMutation.isPending}>
                    {updateWorkflowMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    {tCommon('save')}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t('code')}</Label>
                  <Input value={workflow.code} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>{t('entityCode')}</Label>
                  <Input value={workflow.entity_code} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>{t('nameEs')}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.name_es || ''}
                      onChange={(e) => setEditForm({ ...editForm, name_es: e.target.value })}
                    />
                  ) : (
                    <Input value={workflow.name_es} disabled className="bg-muted" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t('category')}</Label>
                  <Input value={workflow.category} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>{t('type')}</Label>
                  <Input value={workflow.workflow_type} disabled className="bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('descriptionEs')}</Label>
                {isEditing ? (
                  <Textarea
                    value={editForm.description_es || ''}
                    onChange={(e) => setEditForm({ ...editForm, description_es: e.target.value })}
                    rows={3}
                  />
                ) : (
                  <Textarea value={workflow.description_es || '-'} disabled className="bg-muted" rows={3} />
                )}
              </div>
              {isEditing && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <Label htmlFor="is_active">{t('isActive')}</Label>
                  <Switch
                    id="is_active"
                    checked={editForm.is_active}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tariffs Tab */}
        <TabsContent value="tariffs" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {tTariffs('title')}
                </CardTitle>
                <CardDescription>
                  {tTariffs('total', { count: allTariffs?.length || 0 })}
                </CardDescription>
              </div>
              {tariffEditMode === 'none' && (
                <Button onClick={startCreateTariff}>
                  <Plus className="mr-2 h-4 w-4" />
                  {tTariffs('create')}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Inline Create/Edit Form */}
              {tariffEditMode !== 'none' && (
                <Card className="border-primary">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">
                      {tariffEditMode === 'create' ? tTariffs('create') : tTariffs('edit')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>{tTariffs('solicitudType')}</Label>
                        <Select
                          value={tariffForm.solicitud_type}
                          onValueChange={(v) => setTariffForm({ ...tariffForm, solicitud_type: v })}
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
                          value={tariffForm.tariff_type}
                          onValueChange={(v) => setTariffForm({ ...tariffForm, tariff_type: v as TariffType })}
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
                        <Label>{tTariffs('amount')} (XAF)</Label>
                        <Input
                          type="number"
                          value={tariffForm.amount}
                          onChange={(e) => setTariffForm({ ...tariffForm, amount: parseFloat(e.target.value) || 0 })}
                          min={0}
                        />
                      </div>
                      {tariffForm.tariff_type === 'PERCENTAGE' && (
                        <div className="space-y-2">
                          <Label>{tTariffs('percentage')} (%)</Label>
                          <Input
                            type="number"
                            value={tariffForm.percentage_rate || ''}
                            onChange={(e) => setTariffForm({ ...tariffForm, percentage_rate: parseFloat(e.target.value) || null })}
                            min={0}
                            max={100}
                            step={0.01}
                          />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{tTariffs('effectiveFrom')}</Label>
                        <Input
                          type="date"
                          value={tariffForm.effective_from}
                          onChange={(e) => setTariffForm({ ...tariffForm, effective_from: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{tTariffs('effectiveTo')}</Label>
                        <Input
                          type="date"
                          value={tariffForm.effective_to || ''}
                          onChange={(e) => setTariffForm({ ...tariffForm, effective_to: e.target.value || null })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{tTariffs('legalReference')}</Label>
                        <Input
                          value={tariffForm.legal_reference || ''}
                          onChange={(e) => setTariffForm({ ...tariffForm, legal_reference: e.target.value })}
                          placeholder="Ley XX/2024, Art. YY"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="tariff_is_active"
                          checked={tariffForm.is_active}
                          onCheckedChange={(checked) => setTariffForm({ ...tariffForm, is_active: checked })}
                        />
                        <Label htmlFor="tariff_is_active">{tTariffs('isActive')}</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={resetTariffForm} disabled={isTariffSaving}>
                          <X className="mr-2 h-4 w-4" />
                          {tCommon('cancel')}
                        </Button>
                        <Button onClick={handleSaveTariff} disabled={!tariffForm.amount || isTariffSaving}>
                          {isTariffSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Save className="mr-2 h-4 w-4" />
                          {tCommon('save')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tariffs Table */}
              {loadingTariffs ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (allTariffs?.length || 0) === 0 && tariffEditMode === 'none' ? (
                <div className="text-center text-muted-foreground py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">{tTariffs('noTariffsFound')}</p>
                  <p className="text-sm mt-1">Haga clic en &quot;Crear Tarifa&quot; para agregar una nueva tarifa</p>
                  <Button onClick={startCreateTariff} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    {tTariffs('create')}
                  </Button>
                </div>
              ) : (allTariffs?.length || 0) > 0 && (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tTariffs('solicitudType')}</TableHead>
                        <TableHead>{tTariffs('type')}</TableHead>
                        <TableHead className="text-right">{tTariffs('amount')}</TableHead>
                        <TableHead>{tTariffs('legalReference')}</TableHead>
                        <TableHead>{tTariffs('validity')}</TableHead>
                        <TableHead className="text-center">{tTariffs('status')}</TableHead>
                        <TableHead className="text-right">{tTariffs('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allTariffs?.map((tariff) => (
                        <TableRow key={tariff.id} className={editingTariffId === tariff.id ? 'bg-muted/50' : ''}>
                          <TableCell><Badge variant="outline" className="capitalize">{tariff.solicitud_type}</Badge></TableCell>
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
                              {tariff.effective_to && <div className="text-muted-foreground">hasta {tariff.effective_to}</div>}
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
                                onClick={() => startEditTariff(tariff)}
                                disabled={tariffEditMode !== 'none'}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setTariffToDelete(tariff); setIsDeleteTariffDialogOpen(true) }}
                                className="text-destructive hover:text-destructive"
                                disabled={tariffEditMode !== 'none'}
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

          {/* Delete Tariff Confirmation Dialog */}
          <AlertDialog open={isDeleteTariffDialogOpen} onOpenChange={setIsDeleteTariffDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tTariffs('deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tTariffs('deleteConfirmDescription', { workflow: tariffToDelete?.workflow_code })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTariff}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteTariffMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {tCommon('delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Supplements Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="h-5 w-5" />
                  Suplementos
                </CardTitle>
                <CardDescription>
                  {workflowSupplements?.length || 0} suplementos configurados
                </CardDescription>
              </div>
              {supplementEditMode === 'none' && availableSupplements.length > 0 && (
                <Button onClick={startCreateSupplement}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Suplemento
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Inline Create/Edit Form */}
              {supplementEditMode !== 'none' && (
                <Card className="border-primary">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">
                      {supplementEditMode === 'create' ? 'Agregar Suplemento' : 'Editar Suplemento'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {supplementEditMode === 'create' && (
                        <div className="space-y-2">
                          <Label>Suplemento</Label>
                          <Select
                            value={supplementForm.supplement_code}
                            onValueChange={(v) => setSupplementForm({ ...supplementForm, supplement_code: v })}
                          >
                            <SelectTrigger><SelectValue placeholder="Seleccionar suplemento" /></SelectTrigger>
                            <SelectContent>
                              {availableSupplements.map((s) => (
                                <SelectItem key={s.code} value={s.code}>
                                  {s.name_es} ({s.amount.toLocaleString()} XAF)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {supplementEditMode === 'edit' && (
                        <div className="space-y-2">
                          <Label>Suplemento</Label>
                          <Input value={editingSupplementCode || ''} disabled className="bg-muted" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Cantidad por solicitud</Label>
                        <Input
                          type="number"
                          value={supplementForm.quantity_per_request}
                          onChange={(e) => setSupplementForm({ ...supplementForm, quantity_per_request: parseInt(e.target.value) || 1 })}
                          min={1}
                        />
                      </div>
                      <div className="space-y-2 flex items-end gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="supplement_is_required"
                            checked={supplementForm.is_required}
                            onCheckedChange={(checked) => setSupplementForm({ ...supplementForm, is_required: checked })}
                          />
                          <Label htmlFor="supplement_is_required">Obligatorio</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="supplement_is_active"
                            checked={supplementForm.is_active}
                            onCheckedChange={(checked) => setSupplementForm({ ...supplementForm, is_active: checked })}
                          />
                          <Label htmlFor="supplement_is_active">Activo</Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={resetSupplementForm} disabled={isSupplementSaving}>
                        <X className="mr-2 h-4 w-4" />
                        {tCommon('cancel')}
                      </Button>
                      <Button onClick={handleSaveSupplement} disabled={!supplementForm.supplement_code || isSupplementSaving}>
                        {isSupplementSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        {tCommon('save')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Supplements Table */}
              {loadingSupplements ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (workflowSupplements?.length || 0) === 0 && supplementEditMode === 'none' ? (
                <div className="text-center text-muted-foreground py-8">
                  <Boxes className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Sin suplementos configurados</p>
                  <p className="text-sm mt-1">Los suplementos son cargos adicionales opcionales u obligatorios</p>
                  {availableSupplements.length > 0 && (
                    <Button onClick={startCreateSupplement} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Suplemento
                    </Button>
                  )}
                </div>
              ) : (workflowSupplements?.length || 0) > 0 && (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-center">Obligatorio</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workflowSupplements?.map((config) => (
                        <TableRow key={config.id} className={editingSupplementCode === config.supplement_code ? 'bg-muted/50' : ''}>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{config.supplement_code}</code>
                          </TableCell>
                          <TableCell>{config.supplement_name || config.supplement_code}</TableCell>
                          <TableCell className="text-right font-mono">
                            {config.supplement_amount?.toLocaleString()} XAF
                          </TableCell>
                          <TableCell className="text-center">{config.quantity_per_request}</TableCell>
                          <TableCell className="text-center">
                            {config.is_required ? (
                              <Badge variant="default">Si</Badge>
                            ) : (
                              <Badge variant="outline">No</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {config.is_active ? (
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
                                onClick={() => startEditSupplement(config)}
                                disabled={supplementEditMode !== 'none'}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSupplementToDelete(config); setIsDeleteSupplementDialogOpen(true) }}
                                className="text-destructive hover:text-destructive"
                                disabled={supplementEditMode !== 'none'}
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

          {/* Delete Supplement Confirmation Dialog */}
          <AlertDialog open={isDeleteSupplementDialogOpen} onOpenChange={setIsDeleteSupplementDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar Suplemento</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta accion eliminara el suplemento &quot;{supplementToDelete?.supplement_code}&quot; de este workflow. Esta accion no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteSupplement}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {removeWorkflowSupplementMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {tCommon('delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  {tDocs('documentsList')}
                </CardTitle>
                <CardDescription>
                  {tDocs('documentsCount', { count: documents?.length || 0 })}
                </CardDescription>
              </div>
              {documentEditMode === 'none' && (
                <Button onClick={startCreateDocument}>
                  <Plus className="mr-2 h-4 w-4" />
                  {tDocs('addDocument')}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Inline Create/Edit Form */}
              {documentEditMode !== 'none' && (
                <Card className="border-primary">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">
                      {documentEditMode === 'create' ? tDocs('addDocument') : tDocs('editDocument')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{tDocs('documentCode')}</Label>
                        {documentEditMode === 'create' ? (
                          <Input
                            value={docForm.document_code}
                            onChange={(e) => setDocForm({ ...docForm, document_code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                            placeholder="DIP_ORIGINAL"
                          />
                        ) : (
                          <Input value={docForm.document_code} disabled className="bg-muted" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>{tDocs('documentName')}</Label>
                        <Input
                          value={docForm.document_name_es}
                          onChange={(e) => setDocForm({ ...docForm, document_name_es: e.target.value })}
                          placeholder="Documento de Identidad Personal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{tDocs('conditionType')}</Label>
                        <Select
                          value={docForm.condition_type}
                          onValueChange={(v) => setDocForm({ ...docForm, condition_type: v as DocumentConditionType })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_CONDITION_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{tDocs('extractionSchema')}</Label>
                        <Input
                          value={docForm.extraction_schema_key || ''}
                          onChange={(e) => setDocForm({ ...docForm, extraction_schema_key: e.target.value })}
                          placeholder="dip_gq"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{tDocs('instructions')}</Label>
                      <Textarea
                        value={docForm.instructions_es || ''}
                        onChange={(e) => setDocForm({ ...docForm, instructions_es: e.target.value })}
                        rows={2}
                        placeholder="Instrucciones para el ciudadano..."
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="doc_is_required"
                            checked={docForm.is_required}
                            onCheckedChange={(checked) => setDocForm({ ...docForm, is_required: checked })}
                          />
                          <Label htmlFor="doc_is_required">{tDocs('isRequired')}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="doc_is_active"
                            checked={docForm.is_active}
                            onCheckedChange={(checked) => setDocForm({ ...docForm, is_active: checked })}
                          />
                          <Label htmlFor="doc_is_active">{tDocs('isActive')}</Label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={resetDocForm} disabled={isDocumentSaving}>
                          <X className="mr-2 h-4 w-4" />
                          {tCommon('cancel')}
                        </Button>
                        <Button
                          onClick={handleSaveDocument}
                          disabled={!docForm.document_code || !docForm.document_name_es || isDocumentSaving}
                        >
                          {isDocumentSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Save className="mr-2 h-4 w-4" />
                          {tCommon('save')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents Table */}
              {loadingDocuments ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sortedDocuments.length === 0 && documentEditMode === 'none' ? (
                <div className="text-center text-muted-foreground py-8">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">{tDocs('noDocuments')}</p>
                  <p className="text-sm mt-1">Haga clic en &quot;Agregar Documento&quot; para agregar un nuevo requisito</p>
                  <Button onClick={startCreateDocument} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    {tDocs('addDocument')}
                  </Button>
                </div>
              ) : sortedDocuments.length > 0 && (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">{tDocs('order')}</TableHead>
                        <TableHead>{tDocs('documentCode')}</TableHead>
                        <TableHead>{tDocs('documentName')}</TableHead>
                        <TableHead>{tDocs('condition')}</TableHead>
                        <TableHead className="text-center">{tDocs('required')}</TableHead>
                        <TableHead className="text-center">{tDocs('status')}</TableHead>
                        <TableHead className="text-right">{tDocs('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedDocuments.map((doc, index) => (
                        <TableRow key={doc.id} className={editingDocumentCode === doc.document_code ? 'bg-muted/50' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleMoveDocument(doc, 'up')}
                                  disabled={index === 0 || reorderDocumentsMutation.isPending || documentEditMode !== 'none'}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleMoveDocument(doc, 'down')}
                                  disabled={index === sortedDocuments.length - 1 || reorderDocumentsMutation.isPending || documentEditMode !== 'none'}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{doc.document_code}</code>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{doc.document_name_es}</div>
                              {doc.instructions_es && (
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {doc.instructions_es}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getConditionBadge(doc.condition_type)}</TableCell>
                          <TableCell className="text-center">
                            {doc.is_required ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">Opcional</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {doc.is_active ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditDocument(doc)}
                                disabled={documentEditMode !== 'none'}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setDocumentToDelete(doc); setIsDeleteDocDialogOpen(true) }}
                                className="text-destructive hover:text-destructive"
                                disabled={documentEditMode !== 'none'}
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

          {/* Delete Document Dialog */}
          <AlertDialog open={isDeleteDocDialogOpen} onOpenChange={setIsDeleteDocDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tDocs('deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tDocs('deleteConfirmDescription', { name: documentToDelete?.document_name_es })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemoveDocument}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {removeDocumentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {tCommon('delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Slot Configs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horarios</CardTitle>
                <CardDescription>
                  Configuracion de horarios de citas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {slotConfigs && slotConfigs.length > 0 ? (
                  <div className="space-y-2">
                    {slotConfigs.slice(0, 3).map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{slot.day_of_week}</span>
                        <Badge variant="outline">{slot.max_appointments_per_slot} slots</Badge>
                      </div>
                    ))}
                    {slotConfigs.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{slotConfigs.length - 3} mas
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin horarios configurados
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push(`/${locale}/dashboard/admin/service-requests/appointments?tab=slots&workflow=${workflowCode}`)}
                >
                  Gestionar Horarios
                </Button>
              </CardContent>
            </Card>

            {/* Blocked Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fechas Bloqueadas</CardTitle>
                <CardDescription>
                  Fechas sin disponibilidad
                </CardDescription>
              </CardHeader>
              <CardContent>
                {blockedDates && blockedDates.length > 0 ? (
                  <div className="space-y-2">
                    {blockedDates.slice(0, 3).map((blocked) => (
                      <div key={blocked.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{blocked.blocked_date}</span>
                        <Badge variant="secondary">Bloqueado</Badge>
                      </div>
                    ))}
                    {blockedDates.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{blockedDates.length - 3} mas
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin fechas bloqueadas
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push(`/${locale}/dashboard/admin/service-requests/appointments?tab=blocked&workflow=${workflowCode}`)}
                >
                  Gestionar Fechas
                </Button>
              </CardContent>
            </Card>

            {/* Delay Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reglas de Espera</CardTitle>
                <CardDescription>
                  Dias minimos de anticipacion
                </CardDescription>
              </CardHeader>
              <CardContent>
                {delayRules && delayRules.length > 0 ? (
                  <div className="space-y-2">
                    {delayRules.slice(0, 3).map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{rule.priority}</span>
                        <Badge variant="outline">{rule.delay_business_days}d</Badge>
                      </div>
                    ))}
                    {delayRules.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{delayRules.length - 3} mas
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin reglas de espera
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push(`/${locale}/dashboard/admin/service-requests/appointments?tab=delays&workflow=${workflowCode}`)}
                >
                  Gestionar Reglas
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
