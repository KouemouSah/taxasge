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
  Languages,
  RefreshCw,
  Search,
  Building2,
  FileText,
  Globe,
  Trash2,
  CheckCircle,
  Loader2,
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
} from '@/modules/translations/hooks'
import type {
  TranslatableEntityType,
  LanguageCode,
  EntityTranslation,
  SystemTranslation,
} from '@/modules/translations/types'
import { ENTITY_TYPE_OPTIONS, LANGUAGE_OPTIONS } from '@/modules/translations/types'

// =============================================================================
// ENTITY TRANSLATIONS TAB
// =============================================================================

function EntityTranslationsTab() {
  const locale = useLocale() as LanguageCode
  const { toast } = useToast()

  const [entityTypeFilter, setEntityTypeFilter] = useState<TranslatableEntityType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 50

  const { data: statsData, isLoading: statsLoading } = useEntityTranslationStats()
  const { data: translationsData, isLoading, refetch } = useEntityTranslations({
    entity_type: entityTypeFilter === 'all' ? undefined : entityTypeFilter,
    search_term: searchQuery || undefined,
    limit: pageSize,
    offset: page * pageSize,
  })

  const deleteMutation = useDeleteEntityTranslation()

  const handleDelete = async (t: EntityTranslation) => {
    if (!confirm(`Delete translation for ${t.entity_type}/${t.entity_code}/${t.language_code}?`)) return

    try {
      await deleteMutation.mutateAsync({
        entityType: t.entity_type,
        entityCode: t.entity_code,
        languageCode: t.language_code,
        fieldName: t.field_name,
      })
      toast({ title: 'Success', description: 'Translation deleted' })
      refetch()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: String(err) })
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : statsData?.total || 0}
            </div>
          </CardContent>
        </Card>
        {['ministry', 'sector', 'category'].map(type => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium capitalize">{type}</CardTitle>
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
              <CardTitle>Entity Translations</CardTitle>
              <CardDescription>Translations for ministries, sectors, and categories</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search entity code or text..."
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
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ENTITY_TYPE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {locale === 'fr' ? opt.label_fr : locale === 'en' ? opt.label_en : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading...
            </div>
          ) : !translationsData?.translations?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-4 opacity-50" />
              <p>No entity translations found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Entity Code</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Translation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {translationsData.translations.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Badge variant="outline">{getEntityTypeLabel(t.entity_type)}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{t.entity_code}</TableCell>
                      <TableCell>{t.field_name}</TableCell>
                      <TableCell>{getLanguageFlag(t.language_code)} {t.language_code.toUpperCase()}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{t.translation_text}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(t)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, translationsData.total)} of {translationsData.total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= translationsData.total} onClick={() => setPage(p => p + 1)}>
                    Next
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
// SYSTEM TRANSLATIONS TAB
// =============================================================================

function SystemTranslationsTab() {
  const _locale = useLocale() as LanguageCode
  const { toast } = useToast()

  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 50

  const { data: categoriesData } = useSystemCategories()
  const { data: translationsData, isLoading, refetch } = useSystemTranslations({
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    search_term: searchQuery || undefined,
    limit: pageSize,
    offset: page * pageSize,
  })

  const deleteMutation = useDeleteSystemTranslation()

  const handleDelete = async (t: SystemTranslation) => {
    if (!confirm(`Delete translation ${t.category}/${t.key_code}?`)) return

    try {
      await deleteMutation.mutateAsync(t.id)
      toast({ title: 'Success', description: 'Translation deleted' })
      refetch()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: String(err) })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Translations</CardTitle>
              <CardDescription>ENUMs, UI labels, forms, and system messages</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search key or translation..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoriesData?.categories?.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading...
            </div>
          ) : !translationsData?.translations?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p>No system translations found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>ES</TableHead>
                    <TableHead>FR</TableHead>
                    <TableHead>EN</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {translationsData.translations.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Badge variant="secondary">{t.category}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{t.key_code}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={t.es}>{t.es}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={t.fr}>{t.fr}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={t.en}>{t.en}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(t)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, translationsData.total)} of {translationsData.total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= translationsData.total} onClick={() => setPage(p => p + 1)}>
                    Next
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
// FRONTEND UI TRANSLATIONS TAB
// =============================================================================

function FrontendTranslationsTab() {
  const _locale = useLocale() as LanguageCode
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

  const handleDelete = async (t: SystemTranslation) => {
    if (!confirm(`Delete frontend translation ${t.key_code}?`)) return

    try {
      await deleteMutation.mutateAsync(t.id)
      toast({ title: 'Success', description: 'Translation deleted' })
      refetch()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: String(err) })
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
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
                  <Badge variant="destructive">{statsData.missing_translations[lang.value]} missing</Badge>
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
              <CardTitle>Frontend UI Translations</CardTitle>
              <CardDescription>next-intl JSON translations for the web application</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search key or translation..."
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
                <SelectValue placeholder="Namespace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Namespaces</SelectItem>
                {namespacesData?.namespaces?.map(ns => (
                  <SelectItem key={ns} value={ns}>{ns}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading...
            </div>
          ) : !translationsData?.translations?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Globe className="h-12 w-12 mb-4 opacity-50" />
              <p>No frontend translations found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>ES</TableHead>
                    <TableHead>FR</TableHead>
                    <TableHead>EN</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {translationsData.translations.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Badge variant="outline">{t.category.replace('frontend.', '')}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{t.key_code}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={t.es}>{t.es}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={t.fr}>{t.fr}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={t.en}>{t.en}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(t)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, translationsData.total)} of {translationsData.total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= translationsData.total} onClick={() => setPage(p => p + 1)}>
                    Next
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
  const _t = useTranslations('admin')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Languages className="h-8 w-8" />
            Translations Management
          </h1>
          <p className="text-muted-foreground">
            Manage all backend and frontend translations in one place
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="entity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="entity" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Entity Translations
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            System Translations
          </TabsTrigger>
          <TabsTrigger value="frontend" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Frontend UI
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
