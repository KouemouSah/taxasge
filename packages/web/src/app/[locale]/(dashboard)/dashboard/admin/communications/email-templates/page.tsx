'use client'

import { useState } from 'react'
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
  DialogFooter,
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Plus, Search, Pencil, Trash2, Loader2, Eye, FileText } from 'lucide-react'
import {
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  useEmailTemplatePreview,
} from '@/modules/communications/hooks/useEmailTemplates'
import type {
  EmailTemplateResponse,
  EmailTemplateCreate,
  EmailTemplateUpdate,
  TemplateVariable,
} from '@/modules/communications/types'
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateResponse | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Form state
  const [formData, setFormData] = useState<EmailTemplateCreate>({
    templateCode: '',
    nameEs: '',
    subjectEs: '',
    htmlContent: '',
    variables: [],
    category: '',
    isActive: true,
  })

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

  const createMutation = useCreateEmailTemplate()
  const updateMutation = useUpdateEmailTemplate()
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

  // Handlers
  const handleCreateTemplate = async () => {
    try {
      await createMutation.mutateAsync(formData)
      toast.success(t('createSuccess') || 'Email template created successfully')
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create email template')
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return

    try {
      const updateData: EmailTemplateUpdate = {
        nameEs: formData.nameEs,
        subjectEs: formData.subjectEs,
        descriptionEs: formData.descriptionEs,
        htmlContent: formData.htmlContent,
        variables: formData.variables,
        category: formData.category,
        isActive: formData.isActive,
      }
      await updateMutation.mutateAsync({ templateId: selectedTemplate.id, data: updateData })
      toast.success(t('updateSuccess') || 'Email template updated successfully')
      setIsEditDialogOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update email template')
    }
  }

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

  const openEditDialog = (template: EmailTemplateResponse) => {
    setSelectedTemplate(template)
    setFormData({
      templateCode: template.templateCode,
      nameEs: template.nameEs,
      nameFr: template.nameFr,
      nameEn: template.nameEn,
      subjectEs: template.subjectEs,
      subjectFr: template.subjectFr,
      subjectEn: template.subjectEn,
      descriptionEs: template.descriptionEs,
      descriptionFr: template.descriptionFr,
      descriptionEn: template.descriptionEn,
      htmlContent: '',
      variables: template.variables,
      category: template.category,
      isActive: template.isActive,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (template: EmailTemplateResponse) => {
    setSelectedTemplate(template)
    setIsDeleteDialogOpen(true)
  }

  const openPreviewDialog = (template: EmailTemplateResponse) => {
    setSelectedTemplate(template)
    setIsPreviewDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      templateCode: '',
      nameEs: '',
      subjectEs: '',
      htmlContent: '',
      variables: [],
      category: '',
      isActive: true,
    })
    setSelectedTemplate(null)
  }

  const addVariable = () => {
    setFormData({
      ...formData,
      variables: [
        ...formData.variables,
        { name: '', description: '', example: '', required: true },
      ],
    })
  }

  const updateVariable = (index: number, field: keyof TemplateVariable, value: string | boolean) => {
    const newVariables = [...formData.variables]
    newVariables[index] = { ...newVariables[index], [field]: value }
    setFormData({ ...formData, variables: newVariables })
  }

  const removeVariable = (index: number) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter((_, i) => i !== index),
    })
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('createTitle') || 'Create Email Template'}</DialogTitle>
            <DialogDescription>
              {t('createDescription') || 'Create a new email template'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="templateCode">{t('code') || 'Template Code'}</Label>
              <Input
                id="templateCode"
                value={formData.templateCode}
                onChange={(e) => setFormData({ ...formData, templateCode: e.target.value })}
                placeholder="password_reset"
              />
            </div>
            <div>
              <Label htmlFor="nameEs">{t('nameEs') || 'Name (Spanish)'}</Label>
              <Input
                id="nameEs"
                value={formData.nameEs}
                onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="subjectEs">{t('subjectEs') || 'Subject (Spanish)'}</Label>
              <Input
                id="subjectEs"
                value={formData.subjectEs}
                onChange={(e) => setFormData({ ...formData, subjectEs: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">{t('category') || 'Category'}</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auth">{tCategories('auth')}</SelectItem>
                  <SelectItem value="notifications">{tCategories('notifications')}</SelectItem>
                  <SelectItem value="declarations">{tCategories('declarations')}</SelectItem>
                  <SelectItem value="payments">{tCategories('payments')}</SelectItem>
                  <SelectItem value="reminders">{tCategories('reminders')}</SelectItem>
                  <SelectItem value="alerts">{tCategories('alerts')}</SelectItem>
                  <SelectItem value="system">{tCategories('system')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="htmlContent">{t('htmlContent') || 'HTML Content'}</Label>
              <Textarea
                id="htmlContent"
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t('variables') || 'Variables'}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addVariable}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t('addVariable') || 'Add'}
                </Button>
              </div>
              {formData.variables.map((variable, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2 mb-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder={t('variableName') || 'Name'}
                      value={variable.name}
                      onChange={(e) => updateVariable(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder={t('variableExample') || 'Example'}
                      value={variable.example || ''}
                      onChange={(e) => updateVariable(index, 'example', e.target.value)}
                    />
                  </div>
                  <Input
                    placeholder={t('variableDescription') || 'Description'}
                    value={variable.description}
                    onChange={(e) => updateVariable(index, 'description', e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={variable.required}
                        onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                      />
                      {t('required') || 'Required'}
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariable(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleCreateTemplate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {tCommon('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Similar to Create */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editTitle') || 'Edit Email Template'}</DialogTitle>
            <DialogDescription>
              {t('editDescription') || 'Update email template details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('code') || 'Template Code'}</Label>
              <Input value={formData.templateCode} disabled />
            </div>
            <div>
              <Label htmlFor="edit-nameEs">{t('nameEs') || 'Name (Spanish)'}</Label>
              <Input
                id="edit-nameEs"
                value={formData.nameEs}
                onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-subjectEs">{t('subjectEs') || 'Subject (Spanish)'}</Label>
              <Input
                id="edit-subjectEs"
                value={formData.subjectEs}
                onChange={(e) => setFormData({ ...formData, subjectEs: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-htmlContent">{t('htmlContent') || 'HTML Content (optional)'}</Label>
              <Textarea
                id="edit-htmlContent"
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                rows={10}
                className="font-mono text-sm"
                placeholder={t('htmlPlaceholder') || 'Leave empty to keep current HTML'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleUpdateTemplate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
