'use client'

/**
 * MissionAttributionTab — Manage agent assignments across active missions.
 *
 * Shows planned/in_progress missions with their agents, progress,
 * and quick actions (auto-assign, add agent, mark absent).
 */

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Users, Plus, Bot, UserX, Trash2, ChevronDown, ChevronUp, Target,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { inspectionApi } from '@/modules/inspections/services/api'
import type {
  MissionListItem, Mission, AgentAvailability, MissionAgent,
} from '@/modules/inspections/types'

interface Props {
  locationFilter?: string
}

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  assigned: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-600',
  absent: 'bg-red-100 text-red-800',
}

export function MissionAttributionTab({ locationFilter }: Props) {
  const t = useTranslations('inspection')
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMission, setExpandedMission] = useState<string | null>(null)
  const [availableAgents, setAvailableAgents] = useState<AgentAvailability[]>([])
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set())
  const [assigning, setAssigning] = useState(false)

  const fetchMissions = useCallback(async () => {
    try {
      setLoading(true)
      const result = await inspectionApi.listMissions({
        status: undefined, // planned + in_progress
        entity_location_id: locationFilter || undefined,
        page_size: 50,
      })
      // Filter to active missions only, fetch details for each
      const activeMissions = result.items.filter(
        (m: MissionListItem) => m.status === 'planned' || m.status === 'in_progress'
      )
      // Fetch full mission with agents for each
      const detailed = await Promise.all(
        activeMissions.slice(0, 10).map((m: MissionListItem) =>
          inspectionApi.getMission(m.id).catch(() => null)
        )
      )
      setMissions(detailed.filter(Boolean) as Mission[])
    } catch {
      toast.error(t('common.error', { defaultMessage: 'Error' }))
    } finally {
      setLoading(false)
    }
  }, [locationFilter, t])

  useEffect(() => { fetchMissions() }, [fetchMissions])

  const handleExpand = useCallback(async (mission: Mission) => {
    if (expandedMission === mission.id) {
      setExpandedMission(null)
      return
    }
    setExpandedMission(mission.id)
    setSelectedAgents(new Set())
    try {
      const agents = await inspectionApi.getAgentsAvailability(
        mission.mission_date, mission.entity_location_id,
      )
      setAvailableAgents(agents)
    } catch {
      setAvailableAgents([])
    }
  }, [expandedMission])

  const handleAssign = useCallback(async (missionId: string) => {
    if (selectedAgents.size === 0) return
    setAssigning(true)
    try {
      const agents = availableAgents
        .filter(a => selectedAgents.has(a.agent_id))
        .map(a => ({
          agent_id: a.agent_id,
          agent_profile_id: a.agent_profile_id,
          target_inspections: 10,
        }))
      await inspectionApi.assignAgents(missionId, agents)
      setSelectedAgents(new Set())
      toast.success(t('missions.agentsAssigned', { defaultMessage: 'Agents assigned' }))
      fetchMissions()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setAssigning(false)
    }
  }, [selectedAgents, availableAgents, t, fetchMissions])

  const handleAutoAssign = useCallback(async (missionId: string) => {
    try {
      const result = await inspectionApi.autoAssignMission(missionId)
      if (result.agents_proposed === 0) {
        toast.info(t('missions.noAvailable', { defaultMessage: 'No agents available' }))
        return
      }
      // Auto-confirm the proposal
      const agents = result.proposals.map((p: { agent_id: string; agent_profile_id: string; target_inspections: number }) => ({
        agent_id: p.agent_id,
        agent_profile_id: p.agent_profile_id,
        target_inspections: p.target_inspections,
      }))
      await inspectionApi.assignAgents(missionId, agents)
      toast.success(`${result.agents_proposed} ${t('missions.agentsAssigned', { defaultMessage: 'agents assigned' })}`)
      fetchMissions()
    } catch (err) {
      toast.error(String(err))
    }
  }, [t, fetchMissions])

  const handleRemoveAgent = useCallback(async (missionId: string, agentId: string) => {
    try {
      await inspectionApi.removeAgent(missionId, agentId)
      toast.success(t('missions.agentRemoved', { defaultMessage: 'Agent removed' }))
      fetchMissions()
    } catch (err) {
      toast.error(String(err))
    }
  }, [t, fetchMissions])

  if (loading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>
  }

  if (missions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>{t('missions.noActive', { defaultMessage: 'No active missions' })}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {missions.map((mission) => {
        const agents: MissionAgent[] = mission.agents ?? []
        const actual = agents.reduce((s, a) => s + (a.actual_inspections ?? 0), 0)
        const target = agents.reduce((s, a) => s + (a.target_inspections ?? 10), 0)
        const pct = target > 0 ? Math.round(actual / target * 100) : 0
        const isExpanded = expandedMission === mission.id

        return (
          <Card key={mission.id} className="overflow-hidden">
            <CardHeader
              className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => handleExpand(mission)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">
                    {mission.title ?? mission.mission_date}
                  </CardTitle>
                  <Badge className={STATUS_COLORS[mission.status] ?? ''} variant="secondary">
                    {mission.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> {agents.length}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3" /> {actual}/{target}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              <Progress value={pct} className="h-1.5 mt-2" />
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                {/* Action buttons */}
                <div className="flex gap-2 mb-3">
                  <Button size="sm" variant="outline" onClick={() => handleAutoAssign(mission.id)}>
                    <Bot className="h-3.5 w-3.5 mr-1" /> Auto
                  </Button>
                  {mission.status === 'planned' && (
                    <Button size="sm" variant="outline" onClick={() => handleExpand(mission)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> {t('common.add', { defaultMessage: 'Add' })}
                    </Button>
                  )}
                </div>

                {/* Agent list */}
                {agents.length > 0 ? (
                  <div className="divide-y">
                    {agents.map((agent) => (
                      <div key={agent.agent_id} className="flex items-center py-2 gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          agent.status === 'active' ? 'bg-green-500' :
                          agent.status === 'absent' ? 'bg-red-500' :
                          agent.status === 'completed' ? 'bg-gray-400' : 'bg-blue-500'
                        }`} />
                        <span className="flex-1 text-sm">{agent.full_name ?? agent.agent_name ?? agent.agent_id}</span>
                        <span className="text-xs text-muted-foreground">
                          {agent.actual_inspections ?? 0}/{agent.target_inspections ?? 10}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {agent.status}
                        </Badge>
                        {mission.status === 'planned' && (
                          <Button
                            size="icon" variant="ghost" className="h-6 w-6"
                            onClick={() => handleRemoveAgent(mission.id, agent.agent_id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">
                    {t('missions.noAgents', { defaultMessage: 'No agents assigned' })}
                  </p>
                )}

                {/* Available agents panel */}
                {availableAgents.length > 0 && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-medium mb-2">
                      {t('missions.available', { defaultMessage: 'Available agents' })} ({availableAgents.filter(a => a.is_available).length})
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {availableAgents.filter(a => a.is_available).map((a) => (
                        <label key={a.agent_id} className="flex items-center gap-2 py-1 cursor-pointer">
                          <Checkbox
                            checked={selectedAgents.has(a.agent_id)}
                            onCheckedChange={() => {
                              setSelectedAgents(prev => {
                                const next = new Set(prev)
                                if (next.has(a.agent_id)) next.delete(a.agent_id)
                                else next.add(a.agent_id)
                                return next
                              })
                            }}
                          />
                          <span className="text-sm">{a.agent_name}</span>
                        </label>
                      ))}
                    </div>
                    {selectedAgents.size > 0 && (
                      <Button
                        size="sm" className="mt-2 w-full"
                        onClick={() => handleAssign(mission.id)}
                        disabled={assigning}
                      >
                        {assigning ? '...' : `${t('missions.assign', { defaultMessage: 'Assign' })} (${selectedAgents.size})`}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return <Users className={className} />
}
