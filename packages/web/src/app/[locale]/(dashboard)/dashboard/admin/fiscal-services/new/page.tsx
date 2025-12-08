'use client'

/**
 * Fiscal Service Create Form
 * Create new fiscal service with all fields and tabs
 *
 * PHASE 8.2: Service Creation Form
 * CRITICAL: 100% backend-aligned with FiscalServiceCreate
 *
 * @module dashboard/admin/fiscal-services/new
 * @author Claude Code
 * @date 2025-12-07
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, Building2, FileText, Link2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import fiscalServicesAPI from '@/modules/fiscal-services/services/api'
import type {
  FiscalServiceCreate,
  Category,
  Ministry,
  Sector,
  ServiceTypeEnum,
  ServiceStatusEnum,
  CalculationMethodEnum,
  DocumentTemplate,
  ProcedureTemplate,
} from '@/types/fiscal-service'

export default function CreateFiscalServicePage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin.fiscalServices')
  const { toast } = useToast()

  // Hierarchy data
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredSectors, setFilteredSectors] = useState<Sector[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])

  // Templates data
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([])
  const [procedureTemplates, setProcedureTemplates] = useState<ProcedureTemplate[]>([])

  // Assignments
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([])
  const [selectedProcedures, setSelectedProcedures] = useState<number[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMinistry, setSelectedMinistry] = useState<number | null>(null)
  const [selectedSector, setSelectedSector] = useState<number | null>(null)

  // Form state - Essential fields only
  const [formData, setFormData] = useState<Partial<FiscalServiceCreate>>({
    serviceCode: '',
    categoryId: 0,
    nameEs: '',
    descriptionEs: '',
    serviceType: 'registration_fee' as ServiceTypeEnum,
    calculationMethod: 'fixed_both' as CalculationMethodEnum,
    status: 'draft' as ServiceStatusEnum,
    tariffEffectiveFrom: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ministriesData, sectorsData, categoriesData] = await Promise.all([
          fiscalServicesAPI.hierarchy.ministries.list(locale),
          fiscalServicesAPI.hierarchy.sectors.list(undefined, locale),
          fiscalServicesAPI.hierarchy.categories.list(undefined, locale),
        ])
        setMinistries(ministriesData)
        setSectors(sectorsData)
        setCategories(categoriesData)
      } catch (err) {
        console.error('Error fetching hierarchy data:', err)
      }
    }

    const fetchTemplates = async () => {
      try {
        const [docs, procs] = await Promise.all([
          fiscalServicesAPI.documents.templates.list(locale),
          fiscalServicesAPI.procedures.templates.list(locale),
        ])
        setDocumentTemplates(docs)
        setProcedureTemplates(procs)
      } catch (err) {
        console.error('Error fetching templates:', err)
      }
    }

    fetchData()
    fetchTemplates()
  }, [locale])

  // Filter sectors when ministry changes
  useEffect(() => {
    if (selectedMinistry) {
      const filtered = sectors.filter(s => (s.ministryId ?? s.ministry_id) === selectedMinistry)
      setFilteredSectors(filtered)
      setSelectedSector(null)
      setFilteredCategories([])
      setFormData(prev => ({ ...prev, categoryId: 0 }))
    } else {
      setFilteredSectors([])
    }
  }, [selectedMinistry, sectors])

  // Filter categories when sector changes
  useEffect(() => {
    if (selectedSector) {
      const filtered = categories.filter(c => (c.sectorId ?? c.sector_id) === selectedSector)
      setFilteredCategories(filtered)
      setFormData(prev => ({ ...prev, categoryId: 0 }))
    } else {
      setFilteredCategories([])
    }
  }, [selectedSector, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Basic validation
      if (!formData.serviceCode || !formData.categoryId || !formData.nameEs) {
        toast({
          variant: 'destructive',
          title: t('errorTitle'),
          description: t('requiredFields'),
        })
        setIsSubmitting(false)
        return
      }

      // Create service
      const createData: FiscalServiceCreate = {
        serviceCode: formData.serviceCode!,
        categoryId: formData.categoryId!,
        nameEs: formData.nameEs!,
        descriptionEs: formData.descriptionEs,
        serviceType: formData.serviceType as ServiceTypeEnum,
        calculationMethod: formData.calculationMethod as CalculationMethodEnum,
        tasaExpedicion: formData.tasaExpedicion,
        tasaRenovacion: formData.tasaRenovacion,
        basePercentage: formData.basePercentage,
        percentageOf: formData.percentageOf,
        unitRate: formData.unitRate,
        unitType: formData.unitType,
        expeditionFormula: formData.expeditionFormula,
        renewalFormula: formData.renewalFormula,
        status: formData.status as ServiceStatusEnum,
        tariffEffectiveFrom: formData.tariffEffectiveFrom!,
      }

      const newService = await fiscalServicesAPI.admin.create(createData)

      // Assign documents and procedures if any selected
      if (selectedDocuments.length > 0) {
        for (const docId of selectedDocuments) {
          await fiscalServicesAPI.documents.assign(newService.id, {
            documentTemplateId: docId,
            isRequiredExpedition: true,
            isRequiredRenewal: false,
          })
        }
      }

      if (selectedProcedures.length > 0) {
        for (const procId of selectedProcedures) {
          await fiscalServicesAPI.procedures.assign(newService.id, {
            templateId: procId,
            appliesTo: 'both',
          })
        }
      }

      toast({
        title: t('successTitle'),
        description: t('serviceCreated'),
      })

      router.push(`/${locale}/dashboard/admin/fiscal-services/${newService.id}`)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: err instanceof Error ? err.message : t('errorCreating'),
      })
      setIsSubmitting(false)
    }
  }

  const toggleDocumentSelection = (docId: number) => {
    setSelectedDocuments(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    )
  }

  const toggleProcedureSelection = (procId: number) => {
    setSelectedProcedures(prev =>
      prev.includes(procId)
        ? prev.filter(id => id !== procId)
        : [...prev, procId]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('createTitle')}</h1>
          <p className="text-muted-foreground mt-1">{t('createSubtitle')}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('basicInformation')}
            </TabsTrigger>
            <TabsTrigger value="hierarchy" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t('hierarchyTab')}
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              {t('assignmentsTab')}
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('basicInformation')}</CardTitle>
                <CardDescription>{t('basicInformationDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceCode">{t('serviceCode')} *</Label>
                    <Input
                      id="serviceCode"
                      value={formData.serviceCode}
                      onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
                      placeholder={t('serviceCodePlaceholder')}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">{t('tableStatus')} *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v as ServiceStatusEnum })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{t('statusDraft')}</SelectItem>
                        <SelectItem value="active">{t('statusActive')}</SelectItem>
                        <SelectItem value="inactive">{t('statusInactive')}</SelectItem>
                        <SelectItem value="deprecated">{t('statusDeprecated')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nameEs">{t('serviceName')} *</Label>
                  <Input
                    id="nameEs"
                    value={formData.nameEs}
                    onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
                    placeholder={t('serviceNamePlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descriptionEs">{t('description')}</Label>
                  <Textarea
                    id="descriptionEs"
                    value={formData.descriptionEs || ''}
                    onChange={(e) => setFormData({ ...formData, descriptionEs: e.target.value })}
                    placeholder={t('descriptionPlaceholder')}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceType">{t('serviceType')} *</Label>
                    <Select
                      value={formData.serviceType}
                      onValueChange={(v) => setFormData({ ...formData, serviceType: v as ServiceTypeEnum })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document_processing">{t('typeDocumentProcessing')}</SelectItem>
                        <SelectItem value="license_permit">{t('typeLicensePermit')}</SelectItem>
                        <SelectItem value="residence_permit">{t('typeResidencePermit')}</SelectItem>
                        <SelectItem value="registration_fee">{t('typeRegistrationFee')}</SelectItem>
                        <SelectItem value="inspection_fee">{t('typeInspectionFee')}</SelectItem>
                        <SelectItem value="administrative_tax">{t('typeAdministrativeTax')}</SelectItem>
                        <SelectItem value="customs_duty">{t('typeCustomsDuty')}</SelectItem>
                        <SelectItem value="declaration_tax">{t('typeDeclarationTax')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tariffEffectiveFrom">{t('effectiveFrom')} *</Label>
                    <Input
                      id="tariffEffectiveFrom"
                      type="date"
                      value={formData.tariffEffectiveFrom}
                      onChange={(e) => setFormData({ ...formData, tariffEffectiveFrom: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calculation */}
            <Card>
              <CardHeader>
                <CardTitle>{t('calculation')}</CardTitle>
                <CardDescription>{t('calculationDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="calculationMethod">{t('calculationMethod')} *</Label>
                  <Select
                    value={formData.calculationMethod}
                    onValueChange={(v) => setFormData({ ...formData, calculationMethod: v as CalculationMethodEnum })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_expedition">{t('methodFixedExpedition')}</SelectItem>
                      <SelectItem value="fixed_renewal">{t('methodFixedRenewal')}</SelectItem>
                      <SelectItem value="fixed_both">{t('methodFixedBoth')}</SelectItem>
                      <SelectItem value="percentage_based">{t('methodPercentageBased')}</SelectItem>
                      <SelectItem value="unit_based">{t('methodUnitBased')}</SelectItem>
                      <SelectItem value="tiered_rates">{t('methodTieredRates')}</SelectItem>
                      <SelectItem value="formula_based">{t('methodFormulaBased')}</SelectItem>
                      <SelectItem value="fixed_plus_unit">{t('methodFixedPlusUnit')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Fixed Fees - for fixed_expedition, fixed_renewal, fixed_both, fixed_plus_unit */}
                {['fixed_expedition', 'fixed_both', 'fixed_plus_unit'].includes(formData.calculationMethod || '') && (
                  <div className="space-y-2">
                    <Label htmlFor="tasaExpedicion">{t('expeditionFee')} (XAF)</Label>
                    <Input
                      id="tasaExpedicion"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.tasaExpedicion || ''}
                      onChange={(e) => setFormData({ ...formData, tasaExpedicion: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                )}

                {['fixed_renewal', 'fixed_both', 'fixed_plus_unit'].includes(formData.calculationMethod || '') && (
                  <div className="space-y-2">
                    <Label htmlFor="tasaRenovacion">{t('renewalFee')} (XAF)</Label>
                    <Input
                      id="tasaRenovacion"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.tasaRenovacion || ''}
                      onChange={(e) => setFormData({ ...formData, tasaRenovacion: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                )}

                {/* Percentage Based */}
                {formData.calculationMethod === 'percentage_based' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="basePercentage">{t('basePercentage')} (%)</Label>
                      <Input
                        id="basePercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.basePercentage || ''}
                        onChange={(e) => setFormData({ ...formData, basePercentage: Number(e.target.value) })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="percentageOf">{t('percentageOf')}</Label>
                      <Input
                        id="percentageOf"
                        type="text"
                        value={formData.percentageOf || ''}
                        onChange={(e) => setFormData({ ...formData, percentageOf: e.target.value })}
                        placeholder="valor_declarado"
                      />
                    </div>
                  </div>
                )}

                {/* Unit Based */}
                {['unit_based', 'fixed_plus_unit'].includes(formData.calculationMethod || '') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unitRate">{t('unitRate')} (XAF)</Label>
                      <Input
                        id="unitRate"
                        type="number"
                        min="0"
                        step="1"
                        value={formData.unitRate || ''}
                        onChange={(e) => setFormData({ ...formData, unitRate: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unitType">{t('unitType')}</Label>
                      <Input
                        id="unitType"
                        type="text"
                        value={formData.unitType || ''}
                        onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                        placeholder="unidad, m², kg, etc."
                      />
                    </div>
                  </div>
                )}

                {/* Formula Based */}
                {formData.calculationMethod === 'formula_based' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="expeditionFormula">{t('expeditionFormula')}</Label>
                      <Input
                        id="expeditionFormula"
                        type="text"
                        value={formData.expeditionFormula || ''}
                        onChange={(e) => setFormData({ ...formData, expeditionFormula: e.target.value })}
                        placeholder="base_value * 0.05 + 10000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="renewalFormula">{t('renewalFormula')}</Label>
                      <Input
                        id="renewalFormula"
                        type="text"
                        value={formData.renewalFormula || ''}
                        onChange={(e) => setFormData({ ...formData, renewalFormula: e.target.value })}
                        placeholder="base_value * 0.03 + 5000"
                      />
                    </div>
                  </div>
                )}

                {/* Tiered Rates - complex configuration notice */}
                {formData.calculationMethod === 'tiered_rates' && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      {t('tieredRatesNotice') || 'Las tarifas escalonadas se configuran después de crear el servicio.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hierarchy Tab */}
          <TabsContent value="hierarchy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('hierarchyTab')}</CardTitle>
                <CardDescription>{t('hierarchyTabDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('selectMinistry')}</Label>
                  <Select
                    value={String(selectedMinistry || '')}
                    onValueChange={(v) => setSelectedMinistry(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectMinistry')} />
                    </SelectTrigger>
                    <SelectContent>
                      {ministries.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.nameEs || m.name_es}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('selectSector')}</Label>
                  <Select
                    value={String(selectedSector || '')}
                    onValueChange={(v) => setSelectedSector(Number(v))}
                    disabled={!selectedMinistry}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectSector')} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSectors.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.nameEs || s.name_es}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('category')} *</Label>
                  <Select
                    value={String(formData.categoryId || '')}
                    onValueChange={(v) => setFormData({ ...formData, categoryId: Number(v) })}
                    disabled={!selectedSector}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nameEs || c.name_es}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            {/* Document Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>{t('documentsTitle')}</CardTitle>
                <CardDescription>{t('documentsSubtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                {documentTemplates.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t('noDocuments')}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {documentTemplates.map((doc) => (
                      <div
                        key={doc.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedDocuments.includes(doc.id)
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() => toggleDocumentSelection(doc.id)}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{doc.documentNameEs || doc.templateCode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Procedure Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>{t('proceduresTitle')}</CardTitle>
                <CardDescription>{t('proceduresSubtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                {procedureTemplates.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t('noProcedures')}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {procedureTemplates.map((proc) => (
                      <div
                        key={proc.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedProcedures.includes(proc.id)
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() => toggleProcedureSelection(proc.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{proc.nameEs || proc.templateCode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('creating')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('createServiceButton')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
