'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Plus, Search, Pencil, Trash2, Loader2, Eye, FileText, Sparkles, LayoutGrid, List } from 'lucide-react'
import {
  useEmailTemplates,
  useDeleteEmailTemplate,
  useEmailTemplatePreview,
} from '@/modules/communications/hooks/useEmailTemplates'
import type { EmailTemplateResponse } from '@/modules/communications/types'
import { STARTER_TEMPLATES } from '@/modules/communications/components/EmailTemplateStarters'
import { toast } from 'sonner'

export default function EmailTemplatesPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin.communications.email')
  const tCategories = useTranslations('admin.emailTemplates.categories')
  const tCommon = useTranslations('common')

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateResponse | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [starterViewMode, setStarterViewMode] = useState<'grid' | 'list'>('grid')

  // Filter starter templates by category and search
  const filteredStarterTemplates = useMemo(() => {
    return STARTER_TEMPLATES.filter((template) => {
      // Category filter
      if (categoryFilter !== 'all' && template.category !== categoryFilter) {
        return false
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [categoryFilter, searchQuery])

  // Queries and mutations
  const { data: templatesData, isLoading, error } = useEmailTemplates({
    page: currentPage,
    pageSize: 20,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    isActive: isActiveFilter === 'all' ? undefined : isActiveFilter === 'true',
  })

  const { data: previewData } = useEmailTemplatePreview(
    selectedTemplate?.id || 0,
    isPreviewDialogOpen && !!selectedTemplate
  )

  const deleteMutation = useDeleteEmailTemplate()

  // Filter templates by search query
  const filteredTemplates = templatesData?.templates?.filter((template) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      template.templateCode.toLowerCase().includes(query) ||
      template.nameEs.toLowerCase().includes(query) ||
      template.subjectEs.toLowerCase().includes(query)
    )
  }) || []

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return

    try {
      await deleteMutation.mutateAsync(selectedTemplate.id)
      toast.success(t('deleteSuccess') || 'Email template deleted successfully')
      setIsDeleteDialogOpen(false)
      setSelectedTemplate(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete email template')
    }
  }

  const openDeleteDialog = (template: EmailTemplateResponse) => {
    setSelectedTemplate(template)
    setIsDeleteDialogOpen(true)
  }

  const openPreviewDialog = (template: EmailTemplateResponse) => {
    setSelectedTemplate(template)
    setIsPreviewDialogOpen(true)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{tCommon('error')}</h3>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="w-8 h-8" />
            {t('title') || 'Email Templates'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('description') || 'Manage email templates for notifications'}
          </p>
        </div>
        <Button onClick={() => router.push(`/${locale}/dashboard/admin/communications/email-templates/new`)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('createButton') || 'Create Template'}
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{tCommon('filters')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={tCommon('search') || 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectCategory') || 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon('all')}</SelectItem>
                <SelectItem value="auth">{tCategories('auth')}</SelectItem>
                <SelectItem value="notifications">{tCategories('notifications')}</SelectItem>
                <SelectItem value="declarations">{tCategories('declarations')}</SelectItem>
                <SelectItem value="payments">{tCategories('payments')}</SelectItem>
                <SelectItem value="reminders">{tCategories('reminders')}</SelectItem>
                <SelectItem value="alerts">{tCategories('alerts')}</SelectItem>
                <SelectItem value="system">{tCategories('system')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Active Filter */}
            <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectStatus') || 'Select status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon('all')}</SelectItem>
                <SelectItem value="true">{tCommon('active')}</SelectItem>
                <SelectItem value="false">{tCommon('inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Starter Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>{t('starterTemplates') || 'Starter Templates'}</CardTitle>
                <CardDescription className="mt-1">
                  {t('starterTemplatesDescription') || 'Pre-built templates to help you get started quickly'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={starterViewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setStarterViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={starterViewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setStarterViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStarterTemplates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('noStarterTemplatesForCategory') || 'No starter templates for this category'}</p>
            </div>
          ) : starterViewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredStarterTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => router.push(`/${locale}/dashboard/admin/communications/email-templates/new?starter=${template.id}`)}
                  className="relative cursor-pointer rounded-lg border-2 border-muted p-4 transition-all hover:border-primary hover:shadow-md group"
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="rounded-full bg-muted p-3 group-hover:bg-primary/10 transition-colors">
                      <FileText className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {tCategories(template.category)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name') || 'Name'}</TableHead>
                  <TableHead>{t('description') || 'Description'}</TableHead>
                  <TableHead>{t('category') || 'Category'}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStarterTemplates.map((template) => (
                  <TableRow key={template.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {template.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{template.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tCategories(template.category)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/${locale}/dashboard/admin/communications/email-templates/new?starter=${template.id}`)}
                      >
                        {t('useTemplate') || 'Use Template'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('templatesCount') || 'Templates'} ({templatesData?.total || 0})
          </CardTitle>
          <CardDescription>
            {t('templatesDescription') || 'Manage and preview email templates'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('noTemplates') || 'No templates found'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('code') || 'Code'}</TableHead>
                  <TableHead>{t('name') || 'Name'}</TableHead>
                  <TableHead>{t('subject') || 'Subject'}</TableHead>
                  <TableHead>{t('category') || 'Category'}</TableHead>
                  <TableHead>{t('variables') || 'Variables'}</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-mono text-sm">{template.templateCode}</TableCell>
                    <TableCell className="font-medium">{template.nameEs}</TableCell>
                    <TableCell className="max-w-xs truncate">{template.subjectEs}</TableCell>
                    <TableCell>
                      {template.category && (
                        <Badge variant="outline">{tCategories(template.category)}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{template.variables.length}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.isActive ? 'default' : 'secondary'}>
                        {template.isActive ? tCommon('active') : tCommon('inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openPreviewDialog(template)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/${locale}/dashboard/admin/communications/email-templates/${template.id}/edit`)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(template)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {templatesData && templatesData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                {tCommon('previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('page')} {currentPage} {t('of')} {templatesData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === templatesData.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                {tCommon('next')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle') || 'Delete Email Template'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmation') || 'Are you sure you want to delete this template?'}{' '}
              <strong>{selectedTemplate?.nameEs}</strong>
              {'. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t('previewTitle') || 'Email Preview'}</DialogTitle>
            <DialogDescription>{selectedTemplate?.nameEs}</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg overflow-auto max-h-[60vh]">
            {previewData ? (
              <div dangerouslySetInnerHTML={{ __html: previewData.htmlContent }} />
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
