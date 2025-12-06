'use client'

/**
 * Procedure Template Edit Page
 *
 * @module dashboard/admin/procedure-templates/[id]/edit
 */

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, ListOrdered, RefreshCw, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import templatesAPI from '@/modules/templates/services/api'
import type { ProcedureTemplate, ProcedureTemplateUpdate } from '@/types/fiscal-service'

export default function EditProcedureTemplatePage() {
  const locale = useLocale()
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string
  const tAdmin = useTranslations('admin')
  const tCommon = useTranslations('common')
  const { toast } = useToast()

  const t = (key: string) => tAdmin(`templates.${key}`)

  const [template, setTemplate] = useState<ProcedureTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProcedureTemplateUpdate>({
    nameEs: '',
    descriptionEs: '',
    category: '',
    isActive: true,
  })

  useEffect(() => {
    const fetchTemplate = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await templatesAPI.procedures.get(templateId)
        setTemplate(data)
        setFormData({
          nameEs: data.nameEs,
          descriptionEs: data.descriptionEs || '',
          category: data.category || '',
          isActive: data.isActive,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error loading template'
        setError(errorMessage)
        toast({
          variant: 'destructive',
          title: t('errorTitle'),
          description: errorMessage,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplate()
  }, [templateId, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await templatesAPI.procedures.update(templateId, formData)
      toast({
        title: t('successTitle'),
        description: t('procedureUpdated'),
      })
      router.push(`/${locale}/dashboard/admin/procedure-templates/${templateId}`)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: err instanceof Error ? err.message : 'Error updating template',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof ProcedureTemplateUpdate, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">{t('loading')}</span>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-sm text-muted-foreground">{error || 'Template not found'}</p>
        <Button onClick={() => router.push(`/${locale}/dashboard/admin/procedure-templates`)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('back')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/${locale}/dashboard/admin/procedure-templates/${templateId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('editProcedureTemplate')}</h1>
          <p className="text-muted-foreground font-mono">{template.templateCode}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5" />
              {t('procedureInfo')}
            </CardTitle>
            <CardDescription>{t('editProcedureDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template Code (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="templateCode">{t('templateCode')}</Label>
              <Input
                id="templateCode"
                value={template.templateCode}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">{t('templateCodeReadOnly')}</p>
            </div>

            {/* Procedure Name */}
            <div className="space-y-2">
              <Label htmlFor="nameEs">{t('procedureName')} *</Label>
              <Input
                id="nameEs"
                value={formData.nameEs || ''}
                onChange={(e) => handleInputChange('nameEs', e.target.value)}
                placeholder={t('procedureNamePlaceholder')}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="descriptionEs">{t('description')}</Label>
              <Textarea
                id="descriptionEs"
                value={formData.descriptionEs || ''}
                onChange={(e) => handleInputChange('descriptionEs', e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                rows={3}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">{t('category')}</Label>
              <Input
                id="category"
                value={formData.category || ''}
                onChange={(e) => handleInputChange('category', e.target.value)}
                placeholder={t('categoryPlaceholder')}
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>{t('activeStatus')}</Label>
                <p className="text-sm text-muted-foreground">{t('activeStatusDescription')}</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${locale}/dashboard/admin/procedure-templates/${templateId}`)}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? tCommon('saving') : tCommon('save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
