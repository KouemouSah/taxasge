'use client'

/**
 * Fiscal Service Edit Form
 * Edit existing fiscal service
 *
 * PHASE 8.4: Service Edit Form
 * CRITICAL: 100% backend-aligned with FiscalServiceUpdate
 *
 * @module dashboard/admin/fiscal-services/[id]/edit
 * @author Claude Code
 * @date 2025-11-25
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import fiscalServicesAPI from '@/modules/fiscal-services/services/api'
import type {
  FiscalServiceResponse,
  FiscalServiceUpdate,
  Category,
  ServiceTypeEnum,
  ServiceStatusEnum,
  CalculationMethodEnum,
} from '@/types/fiscal-service'

export default function EditFiscalServicePage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin.fiscalServices')
  const { toast } = useToast()

  const serviceId = params.id as string

  const [service, setService] = useState<FiscalServiceResponse | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<Partial<FiscalServiceUpdate>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [serviceData, categoriesData] = await Promise.all([
          fiscalServicesAPI.services.get(serviceId),
          fiscalServicesAPI.hierarchy.categories.list(),
        ])
        setService(serviceData)
        setCategories(categoriesData)

        // Initialize form with service data
        setFormData({
          categoryId: serviceData.categoryId,
          nameEs: serviceData.nameEs,
          descriptionEs: serviceData.descriptionEs,
          serviceType: serviceData.serviceType,
          calculationMethod: serviceData.calculationMethod,
          tasaExpedicion: serviceData.tasaExpedicion,
          tasaRenovacion: serviceData.tasaRenovacion,
          status: serviceData.status,
          tariffEffectiveFrom: serviceData.tariffEffectiveFrom,
        })
      } catch (err) {
        toast({
          variant: 'destructive',
          title: t('errorTitle'),
          description: t('errorLoadingServices'),
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updateData: FiscalServiceUpdate = {}

      // Only send changed fields
      if (formData.categoryId !== undefined) updateData.categoryId = formData.categoryId
      if (formData.nameEs !== undefined) updateData.nameEs = formData.nameEs
      if (formData.descriptionEs !== undefined) updateData.descriptionEs = formData.descriptionEs
      if (formData.serviceType !== undefined) updateData.serviceType = formData.serviceType
      if (formData.calculationMethod !== undefined) updateData.calculationMethod = formData.calculationMethod
      if (formData.tasaExpedicion !== undefined) updateData.tasaExpedicion = formData.tasaExpedicion
      if (formData.tasaRenovacion !== undefined) updateData.tasaRenovacion = formData.tasaRenovacion
      if (formData.status !== undefined) updateData.status = formData.status
      if (formData.tariffEffectiveFrom !== undefined) updateData.tariffEffectiveFrom = formData.tariffEffectiveFrom

      await fiscalServicesAPI.admin.update(serviceId, updateData)

      toast({
        title: t('successTitle'),
        description: 'Service updated successfully',
      })

      router.push(`/${locale}/dashboard/admin/fiscal-services/${serviceId}`)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: err instanceof Error ? err.message : 'Failed to update service',
      })
      setIsSubmitting(false)
    }
  }

  if (isLoading || !service) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">{t('loading')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Fiscal Service</h1>
          <p className="text-muted-foreground mt-1">
            Editing: <span className="font-mono">{service.serviceCode}</span>
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential service details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Service Code</Label>
                <Input value={service.serviceCode} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Service code cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select
                  value={String(formData.categoryId || '')}
                  onValueChange={(v) => setFormData({ ...formData, categoryId: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.nameEs}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameEs">Service Name (Spanish) *</Label>
                <Input
                  id="nameEs"
                  value={formData.nameEs || ''}
                  onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionEs">Description (Spanish)</Label>
                <Textarea
                  id="descriptionEs"
                  value={formData.descriptionEs || ''}
                  onChange={(e) => setFormData({ ...formData, descriptionEs: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(v) => setFormData({ ...formData, serviceType: v as ServiceTypeEnum })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document_processing">Document Processing</SelectItem>
                      <SelectItem value="license_permit">License/Permit</SelectItem>
                      <SelectItem value="residence_permit">Residence Permit</SelectItem>
                      <SelectItem value="registration_fee">Registration Fee</SelectItem>
                      <SelectItem value="inspection_fee">Inspection Fee</SelectItem>
                      <SelectItem value="administrative_tax">Administrative Tax</SelectItem>
                      <SelectItem value="customs_duty">Customs Duty</SelectItem>
                      <SelectItem value="declaration_tax">Declaration Tax</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as ServiceStatusEnum })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculation */}
          <Card>
            <CardHeader>
              <CardTitle>Calculation</CardTitle>
              <CardDescription>Fee structure and amounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calculationMethod">Calculation Method *</Label>
                <Select
                  value={formData.calculationMethod}
                  onValueChange={(v) => setFormData({ ...formData, calculationMethod: v as CalculationMethodEnum })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed_expedition">Fixed - Expedition</SelectItem>
                    <SelectItem value="fixed_renewal">Fixed - Renewal</SelectItem>
                    <SelectItem value="fixed_both">Fixed - Both</SelectItem>
                    <SelectItem value="percentage_based">Percentage Based</SelectItem>
                    <SelectItem value="unit_based">Unit Based</SelectItem>
                    <SelectItem value="tiered_rates">Tiered Rates</SelectItem>
                    <SelectItem value="formula_based">Formula Based</SelectItem>
                    <SelectItem value="fixed_plus_unit">Fixed + Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tasaExpedicion">Expedition Fee (GNF)</Label>
                  <Input
                    id="tasaExpedicion"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.tasaExpedicion || ''}
                    onChange={(e) => setFormData({ ...formData, tasaExpedicion: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tasaRenovacion">Renewal Fee (GNF)</Label>
                  <Input
                    id="tasaRenovacion"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.tasaRenovacion || ''}
                    onChange={(e) => setFormData({ ...formData, tasaRenovacion: Number(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal */}
          <Card>
            <CardHeader>
              <CardTitle>Legal Information</CardTitle>
              <CardDescription>Regulatory details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tariffEffectiveFrom">Effective From *</Label>
                <Input
                  id="tariffEffectiveFrom"
                  type="date"
                  value={formData.tariffEffectiveFrom?.split('T')[0] || ''}
                  onChange={(e) => setFormData({ ...formData, tariffEffectiveFrom: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
