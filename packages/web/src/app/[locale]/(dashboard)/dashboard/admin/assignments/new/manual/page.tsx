'use client'

/**
 * Manual Assignment Creation Page
 * Allows admin/supervisor to manually assign an item to an agent
 *
 * @route /[locale]/dashboard/admin/assignments/new/manual
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { ArrowLeft, Loader2, Save, User, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { assignmentsApi } from '@/modules/assignments-admin/services/api'
import { agentsApi } from '@/modules/assignments-admin/services/agents'
import type { ItemType } from '@/modules/assignments-admin/types'
import { useQuery } from '@tanstack/react-query'

// Item types that can be assigned - aligned with ItemType
const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: 'service_request', label: 'Service Request' },
  { value: 'tax_declaration', label: 'Tax Declaration' },
  { value: 'service_payment', label: 'Service Payment' },
  { value: 'other', label: 'Other' },
]

export default function ManualAssignmentPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin.assignments')
  const tCommon = useTranslations('common')

  // Form state
  const [itemId, setItemId] = useState('')
  const [itemType, setItemType] = useState<ItemType | ''>('')
  const [agentProfileId, setAgentProfileId] = useState('')
  const [priorityLevel, setPriorityLevel] = useState(5)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handler for Select component (converts string to ItemType)
  const handleItemTypeChange = (value: string) => {
    setItemType(value as ItemType)
  }

  // Fetch available agents
  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents', 'available'],
    queryFn: () => agentsApi.getAvailable(),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!itemId || !itemType || !agentProfileId) {
      toast.error(t('fillRequiredFields') || 'Please fill all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await assignmentsApi.createManual({
        item_id: itemId,
        item_type: itemType as ItemType,
        agent_profile_id: agentProfileId,
        priority_level: priorityLevel,
        notes: notes || undefined,
      })
      toast.success(t('assignmentCreated') || 'Assignment created successfully')
      router.push(`/${locale}/dashboard/admin/assignments`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create assignment')
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
          <h1 className="text-2xl font-bold">{t('manualAssignment') || 'Manual Assignment'}</h1>
          <p className="text-muted-foreground">
            {t('manualAssignmentDescription') || 'Assign an item to a specific agent'}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('itemDetails') || 'Item Details'}
          </CardTitle>
          <CardDescription>
            {t('selectItemToAssign') || 'Select the item you want to assign'}
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
                {t('itemIdHelp') || 'The UUID of the item to assign (service request, declaration, etc.)'}
              </p>
            </div>

            {/* Agent Selection */}
            <div className="space-y-2">
              <Label htmlFor="agent">
                <User className="inline h-4 w-4 mr-1" />
                {t('assignTo') || 'Assign To'} *
              </Label>
              <Select value={agentProfileId} onValueChange={setAgentProfileId}>
                <SelectTrigger id="agent">
                  <SelectValue placeholder={t('selectAgent') || 'Select agent'} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingAgents ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      {t('noAgentsAvailable') || 'No agents available'}
                    </div>
                  ) : (
                    agents.map((agent) => (
                      <SelectItem key={agent.agent_profile_id} value={agent.agent_profile_id}>
                        <div className="flex items-center gap-2">
                          <span>{agent.agent_name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({agent.current_assignments}/{agent.max_concurrent_assignments})
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-4">
              <Label>
                {t('priority') || 'Priority'}: {priorityLevel}
              </Label>
              <Slider
                value={[priorityLevel]}
                onValueChange={(v) => setPriorityLevel(v[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('low') || 'Low (1-3)'}</span>
                <span>{t('medium') || 'Medium (4-6)'}</span>
                <span>{t('high') || 'High (7-8)'}</span>
                <span>{t('urgent') || 'Urgent (9-10)'}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes') || 'Notes'}</Label>
              <Textarea
                id="notes"
                placeholder={t('optionalNotes') || 'Optional notes for the agent...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
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
                <Save className="mr-2 h-4 w-4" />
                {t('createAssignment') || 'Create Assignment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
