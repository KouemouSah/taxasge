'use client'

/**
 * Auto Assignment Creation Page
 * Allows admin/supervisor to trigger automatic assignment using intelligent algorithm
 *
 * @route /[locale]/dashboard/admin/assignments/new/auto
 * @date 2026-01-23
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Zap, FileText, Info } from 'lucide-react'
import { toast } from 'sonner'
import { assignmentsApi } from '@/modules/assignments-admin/services/api'
import type { ItemType } from '@/modules/assignments-admin/types'

// Item types that can be assigned - aligned with ItemType
const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: 'service_request', label: 'Service Request' },
  { value: 'tax_declaration', label: 'Tax Declaration' },
  { value: 'service_payment', label: 'Service Payment' },
  { value: 'other', label: 'Other' },
]

export default function AutoAssignmentPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin.assignments')
  const tCommon = useTranslations('common')

  // Form state
  const [itemId, setItemId] = useState('')
  const [itemType, setItemType] = useState<ItemType | ''>('')
  const [entityType, setEntityType] = useState<'DGI' | 'Ministry'>('DGI')
  const [entityId, setEntityId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handler for Select component (converts string to ItemType)
  const handleItemTypeChange = (value: string) => {
    setItemType(value as ItemType)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!itemId || !itemType) {
      toast.error(t('fillRequiredFields') || 'Please fill all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await assignmentsApi.createAuto({
        item_id: itemId,
        item_type: itemType as ItemType,
        item_data: {}, // Empty object - rules will evaluate based on item_type
        entity_type: entityType,
        entity_id: entityId || undefined,
      })
      toast.success(
        t('autoAssignmentSuccess', { agent: result.agent_name }) ||
          `Assigned to ${result.agent_name || 'agent'}`
      )
      router.push(`/${locale}/dashboard/admin/assignments`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to auto-assign')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/admin/assignments`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t('autoAssignment') || 'Auto Assignment'}</h1>
          <p className="text-muted-foreground">
            {t('autoAssignmentDescription') || 'Let the system assign to the best available agent'}
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">{t('howAutoAssignmentWorks') || 'How it works'}</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>{t('autoFeature1') || 'Analyzes agent workloads and availability'}</li>
                <li>{t('autoFeature2') || 'Matches specializations with item type'}</li>
                <li>{t('autoFeature3') || 'Considers performance history'}</li>
                <li>{t('autoFeature4') || 'Applies configured assignment rules'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('itemDetails') || 'Item Details'}
          </CardTitle>
          <CardDescription>
            {t('selectItemForAutoAssign') || 'Select the item to auto-assign'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Type */}
            <div className="space-y-2">
              <Label htmlFor="itemType">{t('itemType') || 'Item Type'} *</Label>
              <Select value={itemType} onValueChange={handleItemTypeChange}>
                <SelectTrigger id="itemType">
                  <SelectValue placeholder={t('selectItemType') || 'Select item type'} />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {t(`itemTypes.${type.value}`) || type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Item ID */}
            <div className="space-y-2">
              <Label htmlFor="itemId">{t('itemId') || 'Item ID'} *</Label>
              <Input
                id="itemId"
                placeholder={t('enterItemId') || 'Enter item UUID'}
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t('itemIdHelp') || 'The UUID of the item to assign'}
              </p>
            </div>

            {/* Entity Type */}
            <div className="space-y-2">
              <Label htmlFor="entityType">{t('entityType') || 'Entity Type'}</Label>
              <Select value={entityType} onValueChange={(v) => setEntityType(v as 'DGI' | 'Ministry')}>
                <SelectTrigger id="entityType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DGI">DGI (Tax Authority)</SelectItem>
                  <SelectItem value="Ministry">Ministry</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('entityTypeHelp') || 'The type of entity that will handle this item'}
              </p>
            </div>

            {/* Entity ID (optional) */}
            <div className="space-y-2">
              <Label htmlFor="entityId">{t('entityId') || 'Entity ID'} ({tCommon('optional') || 'Optional'})</Label>
              <Input
                id="entityId"
                placeholder={t('enterEntityId') || 'Enter entity UUID (optional)'}
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t('entityIdHelp') || 'Specific entity to route to (leave empty for auto-selection)'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Link href={`/${locale}/dashboard/admin/assignments`}>
                <Button type="button" variant="outline">
                  {tCommon('cancel') || 'Cancel'}
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Zap className="mr-2 h-4 w-4" />
                {t('runAutoAssignment') || 'Run Auto Assignment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
