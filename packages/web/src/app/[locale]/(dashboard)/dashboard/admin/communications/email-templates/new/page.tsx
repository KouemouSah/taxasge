'use client'

/**
 * Create Email Template Page
 * Page for creating new email templates with inline form
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowLeft, RefreshCw, X, FileText, Check, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { RichTextEditor } from '@/modules/communications/components/RichTextEditor'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useCreateEmailTemplate } from '@/modules/communications/hooks/useEmailTemplates'
import { STARTER_TEMPLATES, type StarterTemplate } from '@/modules/communications/components/EmailTemplateStarters'
import { VARIABLE_GROUPS, type VariableContext } from '@/modules/communications/components/EmailTemplateVariables'
import type { EmailTemplateCreate, TemplateVariable } from '@/modules/communications/types'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/core/utils'

const EMAIL_CATEGORY_KEYS = ['auth', 'notifications', 'payments', 'declarations', 'reminders', 'alerts', 'system'] as const

export default function NewEmailTemplatePage() {
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('admin.emailTemplates')
  const tCommon = useTranslations('common')
  const { toast } = useToast()
  const { mutateAsync: createTemplate, isPending: isSubmitting } = useCreateEmailTemplate()

  const [formData, setFormData] = useState<EmailTemplateCreate>({
    templateCode: '',
    nameEs: '',
    nameFr: '',
    nameEn: '',
    subjectEs: '',
    subjectFr: '',
    subjectEn: '',
    descriptionEs: '',
    descriptionFr: '',
    descriptionEn: '',
    htmlContent: '',
    variables: [],
    category: 'notifications',
    isActive: true,
  })

  const [selectedStarterTemplate, setSelectedStarterTemplate] = useState<string | null>(null)
  const [selectedVariableContext, setSelectedVariableContext] = useState<VariableContext | ''>('')

  // Get variables for the selected context
  const currentContextVariables = useMemo(() => {
    if (!selectedVariableContext) return []
    const group = VARIABLE_GROUPS.find(g => g.context === selectedVariableContext)
    return group?.variables || []
  }, [selectedVariableContext])

  // Group selected variables by context for the summary
  const groupedSelectedVariables = useMemo(() => {
    const groups: Record<string, TemplateVariable[]> = {}
    formData.variables.forEach(variable => {
      const group = VARIABLE_GROUPS.find(g => g.variables.some(v => v.name === variable.name))
      if (group) {
        if (!groups[group.context]) {
          groups[group.context] = []
        }
        groups[group.context].push(variable)
      }
    })
    return groups
  }, [formData.variables])

  // Filter starter templates by selected category
  const filteredStarterTemplates = useMemo(() => {
    if (formData.category === 'notifications') {
      // Show all templates when default category is selected
      return STARTER_TEMPLATES
    }
    return STARTER_TEMPLATES.filter(t => t.category === formData.category)
  }, [formData.category])

  // Handle starter template from URL parameter
  useEffect(() => {
    const starterId = searchParams.get('starter')
    if (starterId) {
      const template = STARTER_TEMPLATES.find(t => t.id === starterId)
      if (template) {
        setSelectedStarterTemplate(template.id)
        setFormData(prev => ({
          ...prev,
          htmlContent: template.htmlContent,
          category: template.category,
        }))
      }
    }
  }, [searchParams])

  const handleSelectStarterTemplate = (template: StarterTemplate) => {
    setSelectedStarterTemplate(template.id)
    setFormData({
      ...formData,
      htmlContent: template.htmlContent,
      category: template.category,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createTemplate(formData)
      toast({
        title: t('successTitle'),
        description: t('templateCreated'),
      })
      router.push(`/${locale}/dashboard/admin/communications/email-templates`)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: error instanceof Error ? error.message : t('errorCreating'),
      })
    }
  }

  const handleCancel = () => {
    router.back()
  }

  const toggleVariable = (variable: TemplateVariable) => {
    const exists = formData.variables.some(v => v.name === variable.name)
    if (exists) {
      setFormData({
        ...formData,
        variables: formData.variables.filter(v => v.name !== variable.name),
      })
    } else {
      setFormData({
        ...formData,
        variables: [...formData.variables, variable],
      })
    }
  }

  const isVariableSelected = (name: string) => {
    return formData.variables.some(v => v.name === name)
  }

  const removeVariable = (variableName: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v.name !== variableName),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('createTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('createDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('basicInfo')}</CardTitle>
            <CardDescription>{t('basicInfoDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateCode">{t('fieldTemplateCode')} *</Label>
                <Input
                  id="templateCode"
                  value={formData.templateCode}
                  onChange={(e) => setFormData({ ...formData, templateCode: e.target.value.toUpperCase() })}
                  placeholder="WELCOME_EMAIL"
                  maxLength={100}
                  required
                />
                <p className="text-xs text-muted-foreground">{t('templateCodeHint')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{t('fieldCategory')}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_CATEGORY_KEYS.map((categoryKey) => (
                      <SelectItem key={categoryKey} value={categoryKey}>
                        {t(`categories.${categoryKey}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameEs">{t('fieldNameEs')} *</Label>
                <Input
                  id="nameEs"
                  value={formData.nameEs}
                  onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
                  placeholder="Correo de Bienvenida"
                  maxLength={255}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameFr">{t('fieldNameFr')}</Label>
                <Input
                  id="nameFr"
                  value={formData.nameFr}
                  onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                  placeholder="Email de Bienvenue"
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">{t('fieldNameEn')}</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="Welcome Email"
                  maxLength={255}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Subjects */}
        <Card>
          <CardHeader>
            <CardTitle>{t('subjectTitle')}</CardTitle>
            <CardDescription>{t('subjectDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subjectEs">{t('fieldSubjectEs')} *</Label>
                <Input
                  id="subjectEs"
                  value={formData.subjectEs}
                  onChange={(e) => setFormData({ ...formData, subjectEs: e.target.value })}
                  placeholder="Bienvenido a TaxasGE"
                  maxLength={255}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjectFr">{t('fieldSubjectFr')}</Label>
                <Input
                  id="subjectFr"
                  value={formData.subjectFr}
                  onChange={(e) => setFormData({ ...formData, subjectFr: e.target.value })}
                  placeholder="Bienvenue à TaxasGE"
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjectEn">{t('fieldSubjectEn')}</Label>
                <Input
                  id="subjectEn"
                  value={formData.subjectEn}
                  onChange={(e) => setFormData({ ...formData, subjectEn: e.target.value })}
                  placeholder="Welcome to TaxasGE"
                  maxLength={255}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Descriptions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('descriptionTitle')}</CardTitle>
            <CardDescription>{t('descriptionHelp')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="descriptionEs">{t('fieldDescriptionEs')}</Label>
                <Textarea
                  id="descriptionEs"
                  value={formData.descriptionEs}
                  onChange={(e) => setFormData({ ...formData, descriptionEs: e.target.value })}
                  placeholder="Descripción de la plantilla..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionFr">{t('fieldDescriptionFr')}</Label>
                <Textarea
                  id="descriptionFr"
                  value={formData.descriptionFr}
                  onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                  placeholder="Description du modèle..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionEn">{t('fieldDescriptionEn')}</Label>
                <Textarea
                  id="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  placeholder="Template description..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Starter Templates */}
        <Card>
          <CardHeader>
            <CardTitle>{t('starterTemplates.title')}</CardTitle>
            <CardDescription>{t('starterTemplates.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStarterTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('noStarterTemplatesForCategory') || 'No starter templates for this category'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredStarterTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleSelectStarterTemplate(template)}
                    className={cn(
                      "relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary hover:shadow-md",
                      selectedStarterTemplate === template.id
                        ? "border-primary bg-primary/5"
                        : "border-muted"
                    )}
                  >
                    {selectedStarterTemplate === template.id && (
                      <div className="absolute right-2 top-2">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="rounded-full bg-muted p-3">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {t(`categories.${template.category}`)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* HTML Content */}
        <Card>
          <CardHeader>
            <CardTitle>{t('htmlContentTitle')}</CardTitle>
            <CardDescription>{t('htmlContentDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('fieldHtmlContent')} *</Label>
              <RichTextEditor
                content={formData.htmlContent}
                onChange={(html) => setFormData({ ...formData, htmlContent: html })}
                placeholder={t('htmlContentPlaceholder') || 'Start writing your email content...'}
              />
              <p className="text-xs text-muted-foreground">{t('htmlContentHint')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Variables */}
        <Card>
          <CardHeader>
            <CardTitle>{t('variablesTitle')}</CardTitle>
            <CardDescription>{t('variablesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Context Selector */}
            <div className="space-y-2">
              <Label>{t('selectContext') || 'Select Context'}</Label>
              <Select
                value={selectedVariableContext}
                onValueChange={(v) => setSelectedVariableContext(v as VariableContext)}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder={t('selectContextPlaceholder') || 'Choose a variable category...'} />
                </SelectTrigger>
                <SelectContent>
                  {VARIABLE_GROUPS.map((group) => (
                    <SelectItem key={group.context} value={group.context}>
                      <div className="flex items-center justify-between w-full">
                        <span>{t(`variableGroups.${group.context}`)}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {group.variables.filter(v => isVariableSelected(v.name)).length}/{group.variables.length}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Variables Table for Selected Context */}
            {selectedVariableContext && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    {t(`variableGroups.${selectedVariableContext}`)}
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {currentContextVariables.filter(v => isVariableSelected(v.name)).length} {t('selected') || 'selected'}
                  </span>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>{t('variableName') || 'Name'}</TableHead>
                        <TableHead>{t('variablePlaceholder') || 'Placeholder'}</TableHead>
                        <TableHead>{t('variableDescription') || 'Description'}</TableHead>
                        <TableHead className="w-[100px] text-center">{t('required') || 'Required'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentContextVariables.map((variable) => (
                        <TableRow
                          key={variable.name}
                          className={cn(
                            "cursor-pointer transition-colors",
                            isVariableSelected(variable.name) && "bg-primary/5"
                          )}
                          onClick={() => toggleVariable(variable)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isVariableSelected(variable.name)}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={() => toggleVariable(variable)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{variable.name.replace(/_/g, ' ')}</TableCell>
                          <TableCell>
                            <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                              {`{{${variable.name}}}`}
                            </code>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {variable.description}
                          </TableCell>
                          <TableCell className="text-center">
                            {variable.required ? (
                              <Badge variant="destructive" className="text-xs">
                                {tCommon('yes') || 'Yes'}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">{tCommon('no') || 'No'}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Selected Variables Summary - Grouped by Context */}
            {formData.variables.length > 0 && (
              <div className="space-y-3">
                <Label>{t('variablesSummary') || 'Selected Variables'} ({formData.variables.length})</Label>
                <div className="border rounded-lg divide-y">
                  {Object.entries(groupedSelectedVariables).map(([context, variables]) => (
                    <div key={context} className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{t(`variableGroups.${context}`)}</Badge>
                        <span className="text-sm text-muted-foreground">({variables.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {variables.map((variable) => (
                          <Badge
                            key={variable.name}
                            variant="secondary"
                            className="flex items-center gap-1 py-1.5 pl-3 pr-1"
                          >
                            <code className="text-xs">{`{{${variable.name}}}`}</code>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeVariable(variable.name)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settingsTitle')}</CardTitle>
            <CardDescription>{t('settingsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">{t('fieldActive')}</Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            {tCommon('cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {t('create')}
          </Button>
        </div>
      </form>
    </div>
  )
}
