'use client'

/**
 * Fiscal Service Create Form
 * Create new fiscal service with essential fields
 *
 * PHASE 8.2: Service Creation Form
 * CRITICAL: 100% backend-aligned with FiscalServiceCreate
 *
 * @module dashboard/admin/fiscal-services/new
 * @author Claude Code
 * @date 2025-11-25
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import fiscalServicesAPI from '@/modules/fiscal-services/services/api'
import type {
  FiscalServiceCreate,
  Category,
  ServiceTypeEnum,
  ServiceStatusEnum,
  CalculationMethodEnum,
} from '@/types/fiscal-service'

export default function CreateFiscalServicePage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin.fiscalServices')
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    const fetchCategories = async () => {
      try {
        const data = await fiscalServicesAPI.hierarchy.categories.list()
        setCategories(data)
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }
    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Basic validation
      if (!formData.serviceCode || !formData.categoryId || !formData.nameEs) {
        toast({
          variant: 'destructive',
          title: t('errorTitle'),
          description: 'Please fill in all required fields',
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
        status: formData.status as ServiceStatusEnum,
        tariffEffectiveFrom: formData.tariffEffectiveFrom!,
      }

      const newService = await fiscalServicesAPI.admin.create(createData)

      toast({
        title: t('successTitle'),
        description: 'Service created successfully',
      })

      router.push(`/${locale}/dashboard/admin/fiscal-services/${newService.id}`)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: err instanceof Error ? err.message : 'Failed to create service',
      })
      setIsSubmitting(false)
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Create Fiscal Service</h1>
          <p className="text-muted-foreground mt-1">Add a new fiscal service to the system</p>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceCode">Service Code *</Label>
                  <Input
                    id="serviceCode"
                    value={formData.serviceCode}
                    onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
                    placeholder="e.g., SRV-001"
                    required
                  />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameEs">Service Name (Spanish) *</Label>
                <Input
                  id="nameEs"
                  value={formData.nameEs}
                  onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
                  placeholder="e.g., Tasa de Registro Comercial"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionEs">Description (Spanish)</Label>
                <Textarea
                  id="descriptionEs"
                  value={formData.descriptionEs || ''}
                  onChange={(e) => setFormData({ ...formData, descriptionEs: e.target.value })}
                  placeholder="Service description..."
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
                  <Label htmlFor="tasaExpedicion">Expedition Fee (XAF)</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="tasaRenovacion">Renewal Fee (XAF)</Label>
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
                  value={formData.tariffEffectiveFrom}
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Service
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
