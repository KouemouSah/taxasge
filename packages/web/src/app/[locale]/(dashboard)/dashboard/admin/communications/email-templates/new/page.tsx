'use client'

/**
 * Create Email Template Page
 * Page for creating new email templates with inline form
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowLeft, RefreshCw, Plus, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useCreateEmailTemplate } from '@/modules/communications/hooks/useEmailTemplates'
import type { EmailTemplateCreate, TemplateVariable } from '@/modules/communications/types'

const EMAIL_CATEGORY_KEYS = ['auth', 'notifications', 'payments', 'declarations', 'reminders', 'alerts', 'system'] as const

export default function NewEmailTemplatePage() {
  const locale = useLocale()
  const router = useRouter()
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

  const [newVariable, setNewVariable] = useState<TemplateVariable>({
    name: '',
    description: '',
    example: '',
    required: false,
  })

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

  const addVariable = () => {
    if (newVariable.name && !formData.variables.some(v => v.name === newVariable.name)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, newVariable],
      })
      setNewVariable({ name: '', description: '', example: '', required: false })
    }
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

        {/* HTML Content */}
        <Card>
          <CardHeader>
            <CardTitle>{t('htmlContentTitle')}</CardTitle>
            <CardDescription>{t('htmlContentDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="htmlContent">{t('fieldHtmlContent')} *</Label>
              <Textarea
                id="htmlContent"
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                placeholder="<!DOCTYPE html>&#10;<html>&#10;<head>&#10;  <meta charset='utf-8'>&#10;  <title>{{subject}}</title>&#10;</head>&#10;<body>&#10;  <h1>Hello {{user_name}}!</h1>&#10;</body>&#10;</html>"
                rows={12}
                className="font-mono text-sm"
                required
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              <div className="space-y-2">
                <Label htmlFor="varName">{t('varName')}</Label>
                <Input
                  id="varName"
                  value={newVariable.name}
                  onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                  placeholder="user_name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="varDescription">{t('varDescription')}</Label>
                <Input
                  id="varDescription"
                  value={newVariable.description}
                  onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                  placeholder="User's full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="varExample">{t('varExample')}</Label>
                <Input
                  id="varExample"
                  value={newVariable.example}
                  onChange={(e) => setNewVariable({ ...newVariable, example: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="varRequired">{t('varRequired')}</Label>
                <div className="flex items-center h-10">
                  <Switch
                    id="varRequired"
                    checked={newVariable.required}
                    onCheckedChange={(checked) => setNewVariable({ ...newVariable, required: checked })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button type="button" onClick={addVariable} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('addVariable')}
                </Button>
              </div>
            </div>

            {formData.variables.length > 0 && (
              <div className="space-y-2">
                <Label>{t('variablesList')}</Label>
                <div className="border rounded-md p-4 space-y-2">
                  {formData.variables.map((variable) => (
                    <div key={variable.name} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {'{{'}
                            {variable.name}
                            {'}}'}
                          </Badge>
                          {variable.required && (
                            <Badge variant="destructive" className="text-xs">
                              {t('required')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{variable.description}</p>
                        {variable.example && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('example')}: {variable.example}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariable(variable.name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
