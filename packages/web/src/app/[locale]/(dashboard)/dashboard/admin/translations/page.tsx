'use client'

/**
 * Translations Admin Page
 * Centralized translation management with 3 tabs:
 * 1. Entity Translations - ministry, sector, category translations
 * 2. System Translations - ENUMs, UI labels, forms, messages
 * 3. Frontend UI - next-intl JSON translations
 *
 * @page /dashboard/admin/translations
 */

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Languages,
  RefreshCw,
  Search,
  Building2,
  FileText,
  Globe,
  Trash2,
  CheckCircle,
  Loader2,
  Plus,
  Pencil,
  Wrench,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  useEntityTranslations,
  useEntityTranslationStats,
  useSystemTranslations,
  useSystemCategories,
  useFrontendTranslations,
  useFrontendTranslationStats,
  useFrontendNamespaces,
  useDeleteEntityTranslation,
  useDeleteSystemTranslation,
  useDeleteFrontendTranslation,
  useUpsertEntityTranslation,
  useCreateSystemTranslation,
  useUpdateSystemTranslation,
  useSourceEntities,
  useSourceContent,
  useEntityGroupedTranslations,
  useBulkUpsertEntityTranslations,
} from '@/modules/translations/hooks'
import type {
  TranslatableEntityType,
  LanguageCode,
  EntityTranslation,
  SystemTranslation,
  SystemCategory,
} from '@/modules/translations/types'
import { ENTITY_TYPE_OPTIONS, LANGUAGE_OPTIONS } from '@/modules/translations/types'

// =============================================================================
// ENTITY TRANSLATIONS TAB
// =============================================================================

function EntityTranslationsTab() {
  const locale = useLocale() as LanguageCode
  const t = useTranslations('admin.translations')
  const { toast } = useToast()

  const [entityTypeFilter, setEntityTypeFilter] = useState<TranslatableEntityType | 'all'>('all')
  const [languageFilter, setLanguageFilter] = useState<LanguageCode | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 50

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTranslation, setEditingTranslation] = useState<EntityTranslation | null>(null)
  const [editText, setEditText] = useState('')

  // Workbench modal state
  const [workbenchOpen, setWorkbenchOpen] = useState(false)
  const [workbenchEntityType, setWorkbenchEntityType] = useState<TranslatableEntityType | ''>('')
  const [workbenchEntityCode, setWorkbenchEntityCode] = useState('')
  const [workbenchSearch, setWorkbenchSearch] = useState('')
  const [workbenchTranslations, setWorkbenchTranslations] = useState<Record<string, { fr: string; en: string }>>({})
  const [workbenchUntranslatedOnly, setWorkbenchUntranslatedOnly] = useState(true) // Default to showing only untranslated

  // Workbench data fetching
  const { data: sourceEntitiesData, isLoading: loadingSourceEntities } = useSourceEntities(
    workbenchEntityType as TranslatableEntityType,
    workbenchSearch || undefined,
    100,
    0,
    workbenchUntranslatedOnly
  )

  const { data: sourceContentData, isLoading: loadingSourceContent } = useSourceContent(
    workbenchEntityType as TranslatableEntityType,
    workbenchEntityCode
  )

  const { data: existingTranslationsData, isLoading: loadingExisting } = useEntityGroupedTranslations(
    workbenchEntityType as TranslatableEntityType,
    workbenchEntityCode
  )

  const bulkUpsertMutation = useBulkUpsertEntityTranslations()

  const { data: statsData, isLoading: statsLoading } = useEntityTranslationStats()
  const { data: translationsData, isLoading, refetch } = useEntityTranslations({
    entity_type: entityTypeFilter === 'all' ? undefined : entityTypeFilter,
    language_code: languageFilter === 'all' ? undefined : languageFilter,
    search_term: searchQuery || undefined,
    limit: pageSize,
    offset: page * pageSize,
  })

  const deleteMutation = useDeleteEntityTranslation()
  const upsertMutation = useUpsertEntityTranslation()

  const handleDelete = async (tr: EntityTranslation) => {
    if (!confirm(t('common.deleteConfirm', { entity: `${tr.entity_type}/${tr.entity_code}/${tr.language_code}` }))) return

    try {
      await deleteMutation.mutateAsync({
        entityType: tr.entity_type,
        entityCode: tr.entity_code,
        languageCode: tr.language_code,
        fieldName: tr.field_name,
      })
      toast({ title: t('common.success'), description: t('common.translationDeleted') })
      refetch()
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: String(err) })
    }
  }

  const handleEdit = (tr: EntityTranslation) => {
    setEditingTranslation(tr)
    setEditText(tr.translation_text)
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingTranslation) return

    try {
      await upsertMutation.mutateAsync({
        entity_type: editingTranslation.entity_type,
        entity_code: editingTranslation.entity_code,
        language_code: editingTranslation.language_code,
        field_name: editingTranslation.field_name,
        translation_text: editText,
      })
      toast({ title: t('common.success'), description: t('common.translationSaved') })
      setEditModalOpen(false)
      setEditingTranslation(null)
      refetch()
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: String(err) })
    }
  }

  const getEntityTypeLabel = (type: TranslatableEntityType) => {
    const option = ENTITY_TYPE_OPTIONS.find(o => o.value === type)
    if (!option) return type
    return locale === 'fr' ? option.label_fr : locale === 'en' ? option.label_en : option.label
  }

  const getLanguageFlag = (code: LanguageCode) => {
    const opt = LANGUAGE_OPTIONS.find(o => o.value === code)
    return opt?.flag || code
  }

  // Workbench handlers
  const handleSelectWorkbenchEntity = (code: string) => {
    setWorkbenchEntityCode(code)
    setWorkbenchTranslations({})
  }

  // Initialize workbench translations from existing data
  const initializeWorkbenchTranslations = () => {
    if (!sourceContentData?.fields) return

    const newTranslations: Record<string, { fr: string; en: string }> = {}
    Object.keys(sourceContentData.fields).forEach((field) => {
      const existing = existingTranslationsData?.translations?.[field]
      newTranslations[field] = {
        fr: existing?.fr || '',
        en: existing?.en || '',
      }
    })
    setWorkbenchTranslations(newTranslations)
  }

  // Effect to initialize translations when source content loads
  if (sourceContentData?.fields && Object.keys(workbenchTranslations).length === 0 && !loadingExisting) {
    initializeWorkbenchTranslations()
  }

  const handleSaveWorkbenchTranslations = async () => {
    if (!workbenchEntityType || !workbenchEntityCode || !sourceContentData?.fields) return

    const translations = Object.entries(workbenchTranslations)
      .filter(([, trans]) => trans.fr || trans.en)
      .map(([fieldName, trans]) => ({
        entity_type: workbenchEntityType as TranslatableEntityType,
        entity_code: workbenchEntityCode,
        field_name: fieldName,
        es: sourceContentData.fields[fieldName] || '',
        fr: trans.fr,
        en: trans.en,
        translation_source: 'manual' as const,
      }))

    if (translations.length === 0) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'No translations to save' })
      return
    }

    try {
      await bulkUpsertMutation.mutateAsync({ translations })
      toast({ title: t('common.success'), description: t('workbench.translationsSaved') })
      refetch()
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: String(err) })
    }
  }

  const handleOpenWorkbench = () => {
    setWorkbenchOpen(true)
    setWorkbenchEntityType('')
    setWorkbenchEntityCode('')
    setWorkbenchSearch('')
    setWorkbenchTranslations({})
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('entity.total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : statsData?.total_translations || 0}
            </div>
          </CardContent>
        </Card>
        {(['ministry', 'sector', 'category'] as const).map(type => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t(`entity.${type}`)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : statsData?.by_entity_type?.[type] || 0}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('entity.title')}</CardTitle>
              <CardDescription>{t('entity.description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" onClick={handleOpenWorkbench}>
                <Wrench className="h-4 w-4 mr-2" />
                {t('workbench.openWorkbench')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('common.refresh')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('entity.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <Select
              value={entityTypeFilter}
              onValueChange={(v) => { setEntityTypeFilter(v as TranslatableEntityType | 'all'); setPage(0); }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('entity.entityType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('entity.allTypes')}</SelectItem>
                {ENTITY_TYPE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {locale === 'fr' ? opt.label_fr : locale === 'en' ? opt.label_en : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={languageFilter}
              onValueChange={(v) => { setLanguageFilter(v as LanguageCode | 'all'); setPage(0); }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('common.languageFilter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.allLanguages')}</SelectItem>
                {LANGUAGE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.flag} {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              {t('common.loading')}
            </div>
          ) : !translationsData?.translations?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-4 opacity-50" />
              <p>{t('entity.noTranslations')}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('entity.tableHeaders.type')}</TableHead>
                    <TableHead>{t('entity.tableHeaders.entityCode')}</TableHead>
                    <TableHead>{t('entity.tableHeaders.field')}</TableHead>
                    <TableHead>{t('entity.tableHeaders.language')}</TableHead>
                    <TableHead>{t('entity.tableHeaders.translation')}</TableHead>
                    <TableHead className="text-right">{t('entity.tableHeaders.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {translationsData.translations.map((tr) => (
                    <TableRow key={tr.id}>
                      <TableCell>
                        <Badge variant="outline">{getEntityTypeLabel(tr.entity_type)}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{tr.entity_code}</TableCell>
                      <TableCell>{tr.field_name}</TableCell>
                      <TableCell>{getLanguageFlag(tr.language_code)} {tr.language_code.toUpperCase()}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{tr.translation_text}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(tr)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(tr)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {t('common.showing', { start: page * pageSize + 1, end: Math.min((page + 1) * pageSize, translationsData.total), total: translationsData.total })}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    {t('common.previous')}
                  </Button>
                  <Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= translationsData.total} onClick={() => setPage(p => p + 1)}>
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.editTranslation')}</DialogTitle>
            <DialogDescription>
              {editingTranslation && `${editingTranslation.entity_type} / ${editingTranslation.entity_code} / ${editingTranslation.language_code}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('entity.tableHeaders.field')}</Label>
              <Input value={editingTranslation?.field_name || ''} disabled />
            </div>
            <div>
              <Label>{t('entity.tableHeaders.translation')}</Label>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Translation Workbench Modal */}
      <Dialog open={workbenchOpen} onOpenChange={setWorkbenchOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {t('workbench.title')}
            </DialogTitle>
            <DialogDescription>{t('workbench.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Entity Type Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('workbench.selectEntityType')}</Label>
                <Select
                  value={workbenchEntityType}
                  onValueChange={(v) => {
                    setWorkbenchEntityType(v as TranslatableEntityType)
                    setWorkbenchEntityCode('')
                    setWorkbenchTranslations({})
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('workbench.selectEntityType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {locale === 'fr' ? opt.label_fr : locale === 'en' ? opt.label_en : opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {workbenchEntityType && (
                <div>
                  <Label>{t('workbench.searchEntities')}</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t('workbench.searchEntities')}
                      value={workbenchSearch}
                      onChange={(e) => setWorkbenchSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Untranslated Only Filter */}
            {workbenchEntityType && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="untranslated-only"
                  checked={workbenchUntranslatedOnly}
                  onCheckedChange={(checked) => setWorkbenchUntranslatedOnly(checked === true)}
                />
                <Label htmlFor="untranslated-only" className="text-sm cursor-pointer">
                  {t('workbench.untranslatedOnly')}
                </Label>
                {sourceEntitiesData?.total !== undefined && (
                  <Badge variant="secondary" className="ml-2">
                    {sourceEntitiesData.total} {t('workbench.entitiesCount')}
                  </Badge>
                )}
              </div>
            )}

            {/* Entity List */}
            {workbenchEntityType && (
              <div>
                <Label>{t('workbench.selectEntity')}</Label>
                <div className="border rounded-md max-h-48 overflow-y-auto mt-2">
                  {loadingSourceEntities ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t('common.loading')}
                    </div>
                  ) : !sourceEntitiesData?.entities?.length ? (
                    <div className="text-center text-muted-foreground py-4">
                      {t('workbench.noEntitiesFound')}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {sourceEntitiesData.entities.map((entity) => (
                        <div
                          key={entity.entity_code}
                          className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                            workbenchEntityCode === entity.entity_code ? 'bg-primary/10 border-l-2 border-primary' : ''
                          }`}
                          onClick={() => handleSelectWorkbenchEntity(entity.entity_code)}
                        >
                          <div className="font-mono text-sm font-medium">{entity.entity_code}</div>
                          <div className="text-sm text-muted-foreground truncate">{entity.name_es}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Translation Form */}
            {workbenchEntityCode && sourceContentData?.fields && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 font-medium text-sm border-b pb-2">
                  <div>{t('workbench.field')}</div>
                  <div>{t('workbench.spanish')}</div>
                  <div>{t('workbench.french')}</div>
                  <div>{t('workbench.english')}</div>
                </div>

                {loadingSourceContent || loadingExisting ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('workbench.loadingSource')}
                  </div>
                ) : (
                  Object.entries(sourceContentData.fields).map(([fieldName, spanishValue]) => (
                    <div key={fieldName} className="grid grid-cols-4 gap-4 items-start">
                      <div className="font-mono text-sm py-2">{fieldName}</div>
                      <div className="bg-muted p-2 rounded text-sm min-h-[60px]">
                        {spanishValue || <span className="text-muted-foreground italic">-</span>}
                      </div>
                      <div>
                        <Textarea
                          value={workbenchTranslations[fieldName]?.fr || ''}
                          onChange={(e) =>
                            setWorkbenchTranslations((prev) => ({
                              ...prev,
                              [fieldName]: { ...prev[fieldName], fr: e.target.value, en: prev[fieldName]?.en || '' },
                            }))
                          }
                          placeholder={t('workbench.french')}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Textarea
                          value={workbenchTranslations[fieldName]?.en || ''}
                          onChange={(e) =>
                            setWorkbenchTranslations((prev) => ({
                              ...prev,
                              [fieldName]: { ...prev[fieldName], en: e.target.value, fr: prev[fieldName]?.fr || '' },
                            }))
                          }
                          placeholder={t('workbench.english')}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {!workbenchEntityCode && workbenchEntityType && (
              <div className="text-center text-muted-foreground py-8">
                {t('workbench.selectEntityFirst')}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkbenchOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveWorkbenchTranslations}
              disabled={!workbenchEntityCode || bulkUpsertMutation.isPending}
            >
              {bulkUpsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('workbench.saveTranslations')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// =============================================================================
// SYSTEM TRANSLATIONS TAB
// =============================================================================

function SystemTranslationsTab() {
  const locale = useLocale() as LanguageCode
  const t = useTranslations('admin.translations')
  const { toast } = useToast()

  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 50

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTranslation, setEditingTranslation] = useState<SystemTranslation | null>(null)
  const [formData, setFormData] = useState({ category: '', key_code: '', es: '', fr: '', en: '', description: '' })

  // Pass locale to get localized category labels
  const { data: categoriesData } = useSystemCategories(locale)

  // Helper to get category label from code
  const getCategoryLabel = (code: string): string => {
    const category = categoriesData?.categories?.find((c: SystemCategory) => c.code === code)
    return category?.label || code
  }

  // Helper to get category info (table/enum)
  const getCategoryInfo = (code: string): { table?: string | null; enum?: string | null } => {
    const category = categoriesData?.categories?.find((c: SystemCategory) => c.code === code)
    return { table: category?.db_table, enum: category?.db_enum }
  }
  const { data: translationsData, isLoading, refetch } = useSystemTranslations({
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    search_term: searchQuery || undefined,
    limit: pageSize,
    offset: page * pageSize,
  })

  const deleteMutation = useDeleteSystemTranslation()
  const createMutation = useCreateSystemTranslation()
  const updateMutation = useUpdateSystemTranslation()

  const handleDelete = async (tr: SystemTranslation) => {
    if (!confirm(t('common.deleteConfirm', { entity: `${tr.category}/${tr.key_code}` }))) return

    try {
      await deleteMutation.mutateAsync(tr.id)
      toast({ title: t('common.success'), description: t('common.translationDeleted') })
      refetch()
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: String(err) })
    }
  }

  const handleAdd = () => {
    setEditingTranslation(null)
    setFormData({ category: '', key_code: '', es: '', fr: '', en: '', description: '' })
    setModalOpen(true)
  }

  const handleEdit = (tr: SystemTranslation) => {
    setEditingTranslation(tr)
    setFormData({
      category: tr.category,
      key_code: tr.key_code,
      es: tr.es,
      fr: tr.fr,
      en: tr.en,
      description: tr.description || '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingTranslation) {
        await updateMutation.mutateAsync({
          id: editingTranslation.id,
          data: { es: formData.es, fr: formData.fr, en: formData.en, description: formData.description },
        })
        toast({ title: t('common.success'), description: t('common.translationSaved') })
      } else {
        await createMutation.mutateAsync(formData)
        toast({ title: t('common.success'), description: t('common.translationCreated') })
      }
      setModalOpen(false)
      refetch()
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: String(err) })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('system.title')}</CardTitle>
              <CardDescription>{t('system.description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                {t('common.add')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('common.refresh')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('system.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder={t('system.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('system.allCategories')}</SelectItem>
                {categoriesData?.categories?.map((cat: SystemCategory) => (
                  <SelectItem key={cat.code} value={cat.code}>
                    <span className="flex items-center gap-2">
                      <span>{cat.label}</span>
                      {cat.db_enum && (
                        <span className="text-xs text-muted-foreground">({cat.db_enum})</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              {t('common.loading')}
            </div>
          ) : !translationsData?.translations?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p>{t('system.noTranslations')}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('system.tableHeaders.category')}</TableHead>
                    <TableHead>{t('system.tableHeaders.key')}</TableHead>
                    <TableHead>{t('system.tableHeaders.es')}</TableHead>
                    <TableHead>{t('system.tableHeaders.fr')}</TableHead>
                    <TableHead>{t('system.tableHeaders.en')}</TableHead>
                    <TableHead className="text-right">{t('system.tableHeaders.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {translationsData.translations.map((tr) => {
                    const catInfo = getCategoryInfo(tr.category)
                    return (
                    <TableRow key={tr.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" title={tr.category}>
                            {getCategoryLabel(tr.category)}
                          </Badge>
                          {(catInfo.table || catInfo.enum) && (
                            <span className="text-xs text-muted-foreground">
                              {catInfo.enum && <span className="font-mono">{catInfo.enum}</span>}
                              {catInfo.table && !catInfo.enum && <span>📋 {catInfo.table}</span>}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{tr.key_code}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={tr.es}>{tr.es}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={tr.fr}>{tr.fr}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={tr.en}>{tr.en}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(tr)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(tr)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {t('common.showing', { start: page * pageSize + 1, end: Math.min((page + 1) * pageSize, translationsData.total), total: translationsData.total })}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    {t('common.previous')}
                  </Button>
                  <Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= translationsData.total} onClick={() => setPage(p => p + 1)}>
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTranslation ? t('common.editTranslation') : t('common.addTranslation')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('system.tableHeaders.category')}</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={!!editingTranslation}
                />
              </div>
              <div>
                <Label>{t('system.tableHeaders.key')}</Label>
                <Input
                  value={formData.key_code}
                  onChange={(e) => setFormData({ ...formData, key_code: e.target.value })}
                  disabled={!!editingTranslation}
                />
              </div>
            </div>
            <div>
              <Label>ES (Español)</Label>
              <Textarea
                value={formData.es}
                onChange={(e) => setFormData({ ...formData, es: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>FR (Français)</Label>
              <Textarea
                value={formData.fr}
                onChange={(e) => setFormData({ ...formData, fr: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>EN (English)</Label>
              <Textarea
                value={formData.en}
                onChange={(e) => setFormData({ ...formData, en: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// =============================================================================
// FRONTEND UI TRANSLATIONS TAB
// =============================================================================

function FrontendTranslationsTab() {
  const _locale = useLocale() as LanguageCode
  const t = useTranslations('admin.translations')
  const { toast } = useToast()

  const [namespaceFilter, setNamespaceFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 50

  const { data: statsData, isLoading: statsLoading } = useFrontendTranslationStats()
  const { data: namespacesData } = useFrontendNamespaces()
  const { data: translationsData, isLoading, refetch } = useFrontendTranslations({
    namespace: namespaceFilter === 'all' ? undefined : namespaceFilter,
    search_term: searchQuery || undefined,
    limit: pageSize,
    offset: page * pageSize,
  })

  const deleteMutation = useDeleteFrontendTranslation()

  const handleDelete = async (tr: SystemTranslation) => {
    if (!confirm(t('common.deleteConfirm', { entity: tr.key_code }))) return

    try {
      await deleteMutation.mutateAsync(tr.id)
      toast({ title: t('common.success'), description: t('common.translationDeleted') })
      refetch()
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: String(err) })
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('frontend.totalKeys')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : statsData?.total_keys || 0}
            </div>
          </CardContent>
        </Card>
        {LANGUAGE_OPTIONS.map(lang => (
          <Card key={lang.value}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{lang.flag} {lang.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${statsData?.coverage?.[lang.value] || 0}%`}
                </div>
                {statsData?.coverage?.[lang.value] === 100 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : statsData?.missing_translations?.[lang.value] ? (
                  <Badge variant="destructive">{statsData.missing_translations[lang.value]} {t('frontend.missing')}</Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('frontend.title')}</CardTitle>
              <CardDescription>{t('frontend.description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('common.refresh')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('system.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <Select
              value={namespaceFilter}
              onValueChange={(v) => { setNamespaceFilter(v); setPage(0); }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('frontend.namespace')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('frontend.allNamespaces')}</SelectItem>
                {namespacesData?.namespaces?.map(ns => (
                  <SelectItem key={ns} value={ns}>{ns}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              {t('common.loading')}
            </div>
          ) : !translationsData?.translations?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Globe className="h-12 w-12 mb-4 opacity-50" />
              <p>{t('frontend.noTranslations')}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('frontend.tableHeaders.namespace')}</TableHead>
                    <TableHead>{t('frontend.tableHeaders.key')}</TableHead>
                    <TableHead>{t('system.tableHeaders.es')}</TableHead>
                    <TableHead>{t('system.tableHeaders.fr')}</TableHead>
                    <TableHead>{t('system.tableHeaders.en')}</TableHead>
                    <TableHead className="text-right">{t('system.tableHeaders.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {translationsData.translations.map((tr) => (
                    <TableRow key={tr.id}>
                      <TableCell>
                        <Badge variant="outline">{tr.category.replace('frontend.', '')}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{tr.key_code}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={tr.es}>{tr.es}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={tr.fr}>{tr.fr}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={tr.en}>{tr.en}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(tr)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {t('common.showing', { start: page * pageSize + 1, end: Math.min((page + 1) * pageSize, translationsData.total), total: translationsData.total })}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    {t('common.previous')}
                  </Button>
                  <Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= translationsData.total} onClick={() => setPage(p => p + 1)}>
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function TranslationsAdminPage() {
  const t = useTranslations('admin.translations')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Languages className="h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="entity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="entity" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t('tabs.entity')}
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('tabs.system')}
          </TabsTrigger>
          <TabsTrigger value="frontend" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('tabs.frontend')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entity" className="mt-6">
          <EntityTranslationsTab />
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <SystemTranslationsTab />
        </TabsContent>

        <TabsContent value="frontend" className="mt-6">
          <FrontendTranslationsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
