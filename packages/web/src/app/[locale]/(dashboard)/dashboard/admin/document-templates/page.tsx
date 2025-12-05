'use client'

/**
 * Document Templates Admin Page
 * List view with filters and CRUD actions
 *
 * PHASE 10.3: Document Templates List Page
 * CRITICAL: 100% backend-aligned with document_template_routes.py
 *
 * @module dashboard/admin/document-templates
 * @author Claude Code
 * @date 2025-11-25
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
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
import { FileText, RefreshCw, AlertTriangle, Search, Plus, Eye, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import templatesAPI from '@/modules/templates/services/api'
import type { DocumentTemplate } from '@/types/fiscal-service'
import { BackendUnavailableAlert } from '@/modules/admin/components'

export default function DocumentTemplatesPage() {
  const locale = useLocale()
  const router = useRouter()
  const tAdmin = useTranslations('admin')
  const tCommon = useTranslations('common')

  // Helper to get templates translations
  const t = (key: string, params?: Record<string, string | number>) =>
    tAdmin(`templates.${key}`, params)
  const { toast } = useToast()

  // Data states
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])

  // UI states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBackendUnavailable, setIsBackendUnavailable] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<boolean | 'all'>('all')

  // Fetch document templates with filters
  const fetchTemplates = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params: {
        category?: string
        isActive?: boolean
      } = {}

      if (categoryFilter !== 'all') {
        params.category = categoryFilter
      }

      if (statusFilter !== 'all') {
        params.isActive = statusFilter
      }

      const response = await templatesAPI.documents.list(params)
      setTemplates(response)
      setIsBackendUnavailable(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorLoadingDocuments')
      setError(errorMessage)

      if (errorMessage.includes('fetch') || errorMessage.includes('Network') || errorMessage.includes('Failed')) {
        setIsBackendUnavailable(true)
      }

      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: t('errorLoadingDocuments'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, statusFilter])

  const handleRefresh = () => {
    fetchTemplates()
  }

  const handleDelete = async (template: DocumentTemplate) => {
    if (!confirm(t('confirmDeleteDocument', { name: template.documentNameEs }))) return

    try {
      await templatesAPI.documents.delete(template.id)
      toast({
        title: t('successTitle'),
        description: t('documentDeleted'),
      })
      fetchTemplates()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: err instanceof Error ? err.message : 'Error deleting template',
      })
    }
  }

  // Filter templates by search query
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === '' ||
      template.templateCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.documentNameEs.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.category && template.category.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  // Get unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)))

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('documentsTitle')}</h1>
        <p className="text-muted-foreground">{t('documentsSubtitle')}</p>
      </div>

      {/* Backend Unavailable Alert */}
      {isBackendUnavailable && <BackendUnavailableAlert />}

      {/* Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`${tCommon('search')}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon('seeAll')}</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category!}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter === 'all' ? 'all' : String(statusFilter)}
            onValueChange={(value) => setStatusFilter(value === 'all' ? 'all' : value === 'true')}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('tableStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon('seeAll')}</SelectItem>
              <SelectItem value="true">{t('active')}</SelectItem>
              <SelectItem value="false">{t('inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
          <Button onClick={() => router.push(`/${locale}/dashboard/admin/document-templates/new`)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t('createDocumentTemplate')}
          </Button>
        </div>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('documentsTitle')}
          </CardTitle>
          <CardDescription>
            {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} {searchQuery && 'found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">{t('loading')}</span>
            </div>
          ) : error && !isBackendUnavailable ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('refresh')}
              </Button>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium">{t('noDocuments')}</p>
                <p className="text-sm text-muted-foreground">{searchQuery && 'No templates match your search'}</p>
              </div>
              {!searchQuery && (
                <Button onClick={() => router.push(`/${locale}/dashboard/admin/document-templates/new`)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('createDocumentTemplate')}
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tableCode')}</TableHead>
                    <TableHead>{t('tableName')}</TableHead>
                    <TableHead>{t('tableCategory')}</TableHead>
                    <TableHead>{t('tableUsageCount')}</TableHead>
                    <TableHead>{t('tableStatus')}</TableHead>
                    <TableHead className="text-right">{t('tableActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-mono text-sm">{template.templateCode}</TableCell>
                      <TableCell className="font-medium">{template.documentNameEs}</TableCell>
                      <TableCell>
                        {template.category ? (
                          <Badge variant="outline">{template.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{template.usageCount}</TableCell>
                      <TableCell>
                        {template.isActive ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {t('active')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="mr-1 h-3 w-3" />
                            {t('inactive')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/${locale}/dashboard/admin/document-templates/${template.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/${locale}/dashboard/admin/document-templates/${template.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template)}
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
    </div>
  )
}
