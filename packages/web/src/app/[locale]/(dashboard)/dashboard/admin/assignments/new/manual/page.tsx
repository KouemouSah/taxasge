'use client'

/**
 * Manual Assignment Creation Page
 * Allows admin/supervisor to manually assign an item to an agent
 *
 * ARCHITECTURE NOTE:
 * This is a standalone assignment page. In a proper flow, assignments should
 * be triggered from item detail pages (service requests, declarations) with
 * context already available. This page requires manual UUID entry which is
 * not ideal UX but serves as a fallback/admin tool.
 *
 * @route /[locale]/dashboard/admin/assignments/new/manual
 * @date 2026-01-23
 */

import { useState, useEffect } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2, Save, User, FileText, Building2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { assignmentsApi } from '@/modules/assignments-admin/services/api'
import { agentsApi, type AgentProfile } from '@/modules/assignments-admin/services/agents'
import type { ItemType } from '@/modules/assignments-admin/types'
import { useQuery } from '@tanstack/react-query'
import { fetchClient } from '@/core/api'

// Item types that can be assigned - aligned with ItemType
const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: 'service_request', label: 'Service Request' },
  { value: 'tax_declaration', label: 'Tax Declaration' },
  { value: 'service_payment', label: 'Service Payment' },
  { value: 'other', label: 'Other' },
]

// Entity types for agent filtering
const ENTITY_TYPES = [
  { value: 'ministry', label: 'Ministry' },
  { value: 'entity', label: 'Entity' },
] as const

type EntityType = 'ministry' | 'entity'

interface Ministry {
  id: number
  name: string
  name_es?: string
}

interface Entity {
  id: string
  name: string
  name_es?: string
}

export default function ManualAssignmentPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin.assignments')
  const tCommon = useTranslations('common')

  // Form state
  const [itemId, setItemId] = useState('')
  const [itemType, setItemType] = useState<ItemType | ''>('')
  const [entityType, setEntityType] = useState<EntityType>('ministry')
  const [ministryId, setMinistryId] = useState<number | null>(null)
  const [entityId, setEntityId] = useState<string | null>(null)
  const [agentProfileId, setAgentProfileId] = useState('')
  const [priorityLevel, setPriorityLevel] = useState(5)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset agent when ministry/entity changes
  useEffect(() => {
    setAgentProfileId('')
  }, [ministryId, entityId, entityType])

  // Fetch ministries
  const { data: ministries = [] } = useQuery({
    queryKey: ['ministries'],
    queryFn: async () => {
      const response = await fetchClient.get<{ items: Ministry[] }>('/ministries/')
      return response.items || []
    },
  })

  // Fetch entities (if entity type selected)
  const { data: entities = [] } = useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const response = await fetchClient.get<{ items: Entity[] }>('/entities/')
      return response.items || []
    },
    enabled: entityType === 'entity',
  })

  // Fetch available agents based on ministry/entity selection
  const {
    data: agents = [],
    isLoading: isLoadingAgents,
    error: agentsError,
  } = useQuery({
    queryKey: ['agents', 'available', entityType, ministryId, entityId],
    queryFn: async (): Promise<AgentProfile[]> => {
      if (entityType === 'ministry' && ministryId) {
        return agentsApi.getAvailableByMinistry(ministryId)
      } else if (entityType === 'entity' && entityId) {
        return agentsApi.getAvailableByEntity(entityId)
      }
      return []
    },
    enabled: (entityType === 'ministry' && !!ministryId) || (entityType === 'entity' && !!entityId),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!itemId || !itemType || !agentProfileId) {
      toast.error(t('fillRequiredFields'))
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
      toast.success(t('assignmentCreated'))
      router.push(`/${locale}/dashboard/admin/assignments`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSelectAgent =
    (entityType === 'ministry' && ministryId) || (entityType === 'entity' && entityId)

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
          <h1 className="text-2xl font-bold">{t('manualAssignment')}</h1>
          <p className="text-muted-foreground">{t('manualAssignmentDescription')}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('itemDetails')}
          </CardTitle>
          <CardDescription>{t('selectItemToAssign')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Type */}
            <div className="space-y-2">
              <Label htmlFor="itemType">{t('itemType') || 'Item Type'} *</Label>
              <Select
                value={itemType}
                onValueChange={(value: string) => setItemType(value as ItemType)}
              >
                <SelectTrigger id="itemType">
                  <SelectValue placeholder={t('selectItemType')} />
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
              <Label htmlFor="itemId">{t('itemId')} *</Label>
              <Input
                id="itemId"
                placeholder={t('enterItemId')}
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t('itemIdHelp')}</p>
            </div>

            {/* Entity Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="entityType">
                <Building2 className="inline h-4 w-4 mr-1" />
                {t('entityType')}
              </Label>
              <Select
                value={entityType}
                onValueChange={(value: string) => {
                  setEntityType(value as EntityType)
                  setMinistryId(null)
                  setEntityId(null)
                }}
              >
                <SelectTrigger id="entityType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {t(`entityTypes.${type.value}`) || type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ministry/Entity Selection */}
            {entityType === 'ministry' ? (
              <div className="space-y-2">
                <Label htmlFor="ministry">{t('entityTypes.ministry')} *</Label>
                <Select
                  value={ministryId?.toString() || ''}
                  onValueChange={(value: string) => setMinistryId(parseInt(value, 10))}
                >
                  <SelectTrigger id="ministry">
                    <SelectValue placeholder={t('selectMinistryFirst')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ministries.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name_es || m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="entity">{t('entityTypes.entity')} *</Label>
                <Select
                  value={entityId || ''}
                  onValueChange={(value: string) => setEntityId(value)}
                >
                  <SelectTrigger id="entity">
                    <SelectValue placeholder={t('selectEntityFirst')} />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name_es || e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Agent Selection */}
            <div className="space-y-2">
              <Label htmlFor="agent">
                <User className="inline h-4 w-4 mr-1" />
                {t('assignTo')} *
              </Label>
              {!canSelectAgent ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {entityType === 'ministry'
                      ? t('selectMinistryFirst')
                      : t('selectEntityFirst')}
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={agentProfileId}
                  onValueChange={setAgentProfileId}
                  disabled={isLoadingAgents}
                >
                  <SelectTrigger id="agent">
                    <SelectValue
                      placeholder={isLoadingAgents ? t('loadingAgents') : t('selectAgent')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAgents ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : agentsError ? (
                      <div className="text-center py-4 text-destructive">
                        {t('errorLoading')}
                      </div>
                    ) : agents.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        {t('noAgentsAvailable')}
                      </div>
                    ) : (
                      agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          <div className="flex items-center gap-2">
                            <span>{agent.full_name || agent.email || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">
                              ({agent.current_workload || 0}/{agent.max_capacity || 20})
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-4">
              <Label>
                {t('priority')}: {priorityLevel}
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
                <span>{t('low')}</span>
                <span>{t('medium')}</span>
                <span>{t('high')}</span>
                <span>{t('urgent')}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                placeholder={t('optionalNotes')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Link href={`/${locale}/dashboard/admin/assignments`}>
                <Button type="button" variant="outline">
                  {tCommon('cancel')}
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || !canSelectAgent}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {t('createAssignment')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
