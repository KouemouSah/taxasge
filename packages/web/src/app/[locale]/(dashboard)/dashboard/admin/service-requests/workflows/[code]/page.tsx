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
  Calculator,
  Save,
} from 'lucide-react'
import {
  useWorkflow,
  useUpdateWorkflow,
  useTariffs,
  useCreateTariff,
  useUpdateTariff,
  useDeleteTariff,
  useDocumentRequirements,
  useAddDocumentRequirement,
  useUpdateDocumentRequirement,
  useRemoveDocumentRequirement,
  useReorderDocuments,
  useSlotConfigs,
  useBlockedDates,
  useDelayRules,
  TARIFF_TYPES,
  DOCUMENT_CONDITION_TYPES,
  WORKFLOW_CATEGORIES,
} from '@/modules/service-requests-admin'
import type {
  WorkflowUpdate,
  WorkflowTariff,
  WorkflowTariffCreate,
  WorkflowTariffUpdate,
  TariffType,
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

  // Workflow data
  const { data: workflow, isLoading: loadingWorkflow, error: workflowError, refetch } = useWorkflow(workflowCode)
  const updateWorkflowMutation = useUpdateWorkflow()

  // Workflow edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<WorkflowUpdate>>({})

  // Tariffs data
  const { data: allTariffs, isLoading: loadingTariffs } = useTariffs({ workflow_code: workflowCode })
  const createTariffMutation = useCreateTariff()
  const updateTariffMutation = useUpdateTariff()
  const deleteTariffMutation = useDeleteTariff()

  // Tariff dialogs state
  const [isTariffDialogOpen, setIsTariffDialogOpen] = useState(false)
  const [isEditTariffDialogOpen, setIsEditTariffDialogOpen] = useState(false)
  const [isDeleteTariffDialogOpen, setIsDeleteTariffDialogOpen] = useState(false)
  const [selectedTariff, setSelectedTariff] = useState<WorkflowTariff | null>(null)
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

  // Documents data
  const { data: documents, isLoading: loadingDocuments } = useDocumentRequirements(workflowCode)
  const addDocumentMutation = useAddDocumentRequirement()
  const updateDocumentMutation = useUpdateDocumentRequirement()
  const removeDocumentMutation = useRemoveDocumentRequirement()
  const reorderDocumentsMutation = useReorderDocuments()

  // Document dialogs state
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false)
  const [isEditDocDialogOpen, setIsEditDocDialogOpen] = useState(false)
  const [isDeleteDocDialogOpen, setIsDeleteDocDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentRequirement | null>(null)
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
  const handleSaveWorkflow = async () => {
    try {
      await updateWorkflowMutation.mutateAsync({ code: workflowCode, data: editForm as WorkflowUpdate })
      setIsEditing(false)
    } catch {
      // Error handled by mutation
    }
  }

  // Handlers - Tariffs
  const handleCreateTariff = async () => {
    try {
      await createTariffMutation.mutateAsync({ ...tariffForm, workflow_code: workflowCode })
      setIsTariffDialogOpen(false)
      resetTariffForm()
    } catch {
      // Error handled by mutation
    }
  }

  const handleUpdateTariff = async () => {
    if (!selectedTariff) return
    try {
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
      await updateTariffMutation.mutateAsync({ tariffId: selectedTariff.id, data: updateData })
      setIsEditTariffDialogOpen(false)
      resetTariffForm()
    } catch {
      // Error handled by mutation
    }
  }

  const handleDeleteTariff = async () => {
    if (!selectedTariff) return
    try {
      await deleteTariffMutation.mutateAsync(selectedTariff.id)
      setIsDeleteTariffDialogOpen(false)
      setSelectedTariff(null)
    } catch {
      // Error handled by mutation
    }
  }

  const openEditTariffDialog = (tariff: WorkflowTariff) => {
    setSelectedTariff(tariff)
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
    setIsEditTariffDialogOpen(true)
  }

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
    setSelectedTariff(null)
  }

  // Handlers - Documents
  const handleAddDocument = async () => {
    try {
      await addDocumentMutation.mutateAsync({
        workflowCode,
        data: { ...docForm, display_order: documents?.length || 0 },
      })
      setIsDocDialogOpen(false)
      resetDocForm()
    } catch {
      // Error handled by mutation
    }
  }

  const handleUpdateDocument = async () => {
    if (!selectedDocument) return
    try {
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
        documentCode: selectedDocument.document_code,
        data: updateData,
      })
      setIsEditDocDialogOpen(false)
      resetDocForm()
    } catch {
      // Error handled by mutation
    }
  }

  const handleRemoveDocument = async () => {
    if (!selectedDocument) return
    try {
      await removeDocumentMutation.mutateAsync({
        workflowCode,
        documentCode: selectedDocument.document_code,
      })
      setIsDeleteDocDialogOpen(false)
      setSelectedDocument(null)
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

  const openEditDocDialog = (doc: DocumentRequirement) => {
    setSelectedDocument(doc)
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
    setIsEditDocDialogOpen(true)
  }

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
    setSelectedDocument(null)
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
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
              <Dialog open={isTariffDialogOpen} onOpenChange={setIsTariffDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetTariffForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    {tTariffs('create')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{tTariffs('create')}</DialogTitle>
                    <DialogDescription>{tTariffs('createDescription')}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
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
                            {TARIFF_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <div className="space-y-2">
                      <Label>{tTariffs('legalReference')}</Label>
                      <Input
                        value={tariffForm.legal_reference || ''}
                        onChange={(e) => setTariffForm({ ...tariffForm, legal_reference: e.target.value })}
                        placeholder="Ley XX/2024, Art. YY"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{tTariffs('isActive')}</Label>
                      <Switch
                        checked={tariffForm.is_active}
                        onCheckedChange={(checked) => setTariffForm({ ...tariffForm, is_active: checked })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTariffDialogOpen(false)}>
                      {tCommon('cancel')}
                    </Button>
                    <Button onClick={handleCreateTariff} disabled={!tariffForm.amount || createTariffMutation.isPending}>
                      {createTariffMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {tCommon('create')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingTariffs ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (allTariffs?.length || 0) === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {tTariffs('noTariffsFound')}
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tTariffs('solicitudType')}</TableHead>
                        <TableHead>{tTariffs('type')}</TableHead>
                        <TableHead className="text-right">{tTariffs('amount')}</TableHead>
                        <TableHead>{tTariffs('validity')}</TableHead>
                        <TableHead className="text-center">{tTariffs('status')}</TableHead>
                        <TableHead className="text-right">{tTariffs('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allTariffs?.map((tariff) => (
                        <TableRow key={tariff.id}>
                          <TableCell><Badge variant="outline">{tariff.solicitud_type}</Badge></TableCell>
                          <TableCell>{getTariffTypeBadge(tariff.tariff_type)}</TableCell>
                          <TableCell className="text-right font-mono">
                            {tariff.tariff_type === 'PERCENTAGE' && tariff.percentage_rate
                              ? `${tariff.percentage_rate}%`
                              : formatCurrency(tariff.amount, tariff.currency)}
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
                              <Button variant="ghost" size="icon" onClick={() => openEditTariffDialog(tariff)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedTariff(tariff); setIsDeleteTariffDialogOpen(true) }}
                                className="text-destructive hover:text-destructive"
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

          {/* Edit Tariff Dialog */}
          <Dialog open={isEditTariffDialogOpen} onOpenChange={setIsEditTariffDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{tTariffs('edit')}</DialogTitle>
                <DialogDescription>{tTariffs('editDescription')}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
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
                        {TARIFF_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>{tTariffs('legalReference')}</Label>
                  <Input
                    value={tariffForm.legal_reference || ''}
                    onChange={(e) => setTariffForm({ ...tariffForm, legal_reference: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{tTariffs('isActive')}</Label>
                  <Switch
                    checked={tariffForm.is_active}
                    onCheckedChange={(checked) => setTariffForm({ ...tariffForm, is_active: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditTariffDialogOpen(false)}>
                  {tCommon('cancel')}
                </Button>
                <Button onClick={handleUpdateTariff} disabled={updateTariffMutation.isPending}>
                  {updateTariffMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {tCommon('save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Tariff Dialog */}
          <AlertDialog open={isDeleteTariffDialogOpen} onOpenChange={setIsDeleteTariffDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tTariffs('deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tTariffs('deleteConfirmDescription', { workflow: selectedTariff?.workflow_code })}
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
              <Dialog open={isDocDialogOpen} onOpenChange={setIsDocDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetDocForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    {tDocs('addDocument')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{tDocs('addDocument')}</DialogTitle>
                    <DialogDescription>{tDocs('addDocumentDescription')}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>{tDocs('documentCode')}</Label>
                      <Input
                        value={docForm.document_code}
                        onChange={(e) => setDocForm({ ...docForm, document_code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                        placeholder="DIP_ORIGINAL"
                      />
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
                    <div className="space-y-2">
                      <Label>{tDocs('instructions')}</Label>
                      <Textarea
                        value={docForm.instructions_es || ''}
                        onChange={(e) => setDocForm({ ...docForm, instructions_es: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>{tDocs('isRequired')}</Label>
                        <Switch
                          checked={docForm.is_required}
                          onCheckedChange={(checked) => setDocForm({ ...docForm, is_required: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>{tDocs('isActive')}</Label>
                        <Switch
                          checked={docForm.is_active}
                          onCheckedChange={(checked) => setDocForm({ ...docForm, is_active: checked })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDocDialogOpen(false)}>
                      {tCommon('cancel')}
                    </Button>
                    <Button onClick={handleAddDocument} disabled={!docForm.document_code || !docForm.document_name_es || addDocumentMutation.isPending}>
                      {addDocumentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {tCommon('add')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingDocuments ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sortedDocuments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {tDocs('noDocuments')}
                </div>
              ) : (
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
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleMoveDocument(doc, 'up')}
                                  disabled={index === 0 || reorderDocumentsMutation.isPending}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleMoveDocument(doc, 'down')}
                                  disabled={index === sortedDocuments.length - 1 || reorderDocumentsMutation.isPending}
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
                              <Button variant="ghost" size="icon" onClick={() => openEditDocDialog(doc)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedDocument(doc); setIsDeleteDocDialogOpen(true) }}
                                className="text-destructive hover:text-destructive"
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

          {/* Edit Document Dialog */}
          <Dialog open={isEditDocDialogOpen} onOpenChange={setIsEditDocDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{tDocs('editDocument')}</DialogTitle>
                <DialogDescription>{tDocs('editDocumentDescription')}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>{tDocs('documentCode')}</Label>
                  <Input value={docForm.document_code} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>{tDocs('documentName')}</Label>
                  <Input
                    value={docForm.document_name_es}
                    onChange={(e) => setDocForm({ ...docForm, document_name_es: e.target.value })}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>{tDocs('instructions')}</Label>
                  <Textarea
                    value={docForm.instructions_es || ''}
                    onChange={(e) => setDocForm({ ...docForm, instructions_es: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{tDocs('isRequired')}</Label>
                    <Switch
                      checked={docForm.is_required}
                      onCheckedChange={(checked) => setDocForm({ ...docForm, is_required: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>{tDocs('isActive')}</Label>
                    <Switch
                      checked={docForm.is_active}
                      onCheckedChange={(checked) => setDocForm({ ...docForm, is_active: checked })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDocDialogOpen(false)}>
                  {tCommon('cancel')}
                </Button>
                <Button onClick={handleUpdateDocument} disabled={!docForm.document_name_es || updateDocumentMutation.isPending}>
                  {updateDocumentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {tCommon('save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Document Dialog */}
          <AlertDialog open={isDeleteDocDialogOpen} onOpenChange={setIsDeleteDocDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tDocs('deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tDocs('deleteConfirmDescription', { name: selectedDocument?.document_name_es })}
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
