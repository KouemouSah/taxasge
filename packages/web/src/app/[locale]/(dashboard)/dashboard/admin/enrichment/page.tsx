'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Sparkles, FileText, Languages, Search,
  CheckCircle, XCircle, Clock, AlertTriangle,
  RefreshCw, Loader2, ChevronRight, Eye,
  RotateCcw, CheckCheck, Building2,
} from 'lucide-react'
import { enrichmentApi } from '@/modules/enrichment/services/enrichment-api'
import type { EnrichmentStats, EnrichmentTask, PendingDraft } from '@/modules/enrichment/types/enrichment'
import { useToast } from '@/hooks/use-toast'

// ============================================================
// Stats Cards
// ============================================================
function StatsCards({ stats, loading }: { stats: EnrichmentStats | null; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-4 pb-3">
              <div className="h-4 w-20 bg-muted rounded mb-2" />
              <div className="h-7 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Descripciones',
      value: stats.withDescription,
      total: stats.totalServices,
      icon: FileText,
      detail: `${stats.descManual} manual · ${stats.descAiApproved} IA aprobadas`,
      color: 'text-blue-600',
      pct: stats.withDescriptionPct,
    },
    {
      title: 'Pendientes Revisión',
      value: stats.descAiDraft,
      icon: Clock,
      detail: stats.descAiDraft > 0 ? 'Requieren aprobación admin' : 'Sin borradores pendientes',
      color: stats.descAiDraft > 0 ? 'text-amber-600' : 'text-emerald-600',
      badge: stats.descAiDraft > 0 ? 'amber' : undefined,
    },
    {
      title: 'Traducciones',
      value: stats.withTranslationsFr + stats.withTranslationsEn,
      icon: Languages,
      detail: `FR: ${stats.withTranslationsFr} · EN: ${stats.withTranslationsEn}`,
      color: 'text-violet-600',
    },
    {
      title: 'Cola',
      value: stats.queuePending + stats.queueProcessing,
      icon: RefreshCw,
      detail: `${stats.queueCompleted} ok · ${stats.queueFailed} err`,
      color: stats.queueFailed > 0 ? 'text-red-600' : 'text-emerald-600',
      badge: stats.queueFailed > 0 ? 'red' : undefined,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <Card key={c.title} className="relative overflow-hidden">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {c.title}
                </span>
                <Icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums">{c.value}</span>
                {c.total !== undefined && (
                  <span className="text-sm text-muted-foreground">/ {c.total}</span>
                )}
                {c.badge === 'amber' && (
                  <Badge variant="outline" className="ml-auto text-amber-700 border-amber-300 bg-amber-50 text-[10px]">
                    Pendiente
                  </Badge>
                )}
                {c.badge === 'red' && (
                  <Badge variant="destructive" className="ml-auto text-[10px]">
                    Errores
                  </Badge>
                )}
              </div>
              {c.pct !== undefined && (
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${Math.min(c.pct, 100)}%` }}
                  />
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">{c.detail}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ============================================================
// Approval Table
// ============================================================
function ApprovalTable({
  drafts,
  loading,
  onReview,
  entityType: _entityType,
}: {
  drafts: PendingDraft[]
  loading: boolean
  onReview: (id: number, action: 'approve' | 'reject', editedText?: string) => Promise<void>
  entityType: 'service' | 'ministry'
}) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setActionLoading(`${id}-${action}`)
    try {
      const text = editingId === id && editText.trim() ? editText.trim() : undefined
      await onReview(id, action, text)
      setEditingId(null)
      setEditText('')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!drafts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CheckCircle className="h-10 w-10 mb-2 text-emerald-500" />
        <p className="font-medium">Sin borradores pendientes</p>
        <p className="text-sm">Todas las descripciones IA han sido revisadas</p>
      </div>
    )
  }

  return (
    <div className="divide-y max-h-[480px] overflow-y-auto">
      {drafts.map((d) => (
        <div key={d.id} className="py-3 px-1 hover:bg-muted/30 transition-colors">
          <div className="flex items-start gap-3">
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {d.serviceCode && (
                  <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                    {d.serviceCode}
                  </Badge>
                )}
                <span className="font-medium text-sm truncate">{d.nameEs}</span>
              </div>
              {d.ministryName && (
                <p className="text-[11px] text-muted-foreground truncate mb-1">
                  {d.ministryName}
                </p>
              )}

              {/* Description preview or edit */}
              {editingId === d.id ? (
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="text-sm mt-1 h-20"
                  placeholder="Editar descripción antes de aprobar..."
                />
              ) : (
                <p className="text-sm text-foreground/80 line-clamp-2 bg-amber-50 rounded px-2 py-1 border border-amber-200">
                  {d.descriptionEs || '(vacío)'}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1 shrink-0">
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleAction(d.id, 'approve')}
                disabled={actionLoading !== null}
              >
                {actionLoading === `${d.id}-approve` ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                Aprobar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-red-600 hover:bg-red-50"
                onClick={() => handleAction(d.id, 'reject')}
                disabled={actionLoading !== null}
              >
                {actionLoading === `${d.id}-reject` ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                Rechazar
              </Button>
              {editingId !== d.id ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => { setEditingId(d.id); setEditText(d.descriptionEs || '') }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Editar
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => { setEditingId(null); setEditText('') }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Queue Monitor Table
// ============================================================
function QueueTable({
  tasks,
  loading,
  onRetry,
}: {
  tasks: EnrichmentTask[]
  loading: boolean
  onRetry: (taskId: string) => Promise<void>
}) {
  const [retrying, setRetrying] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!tasks.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Search className="h-8 w-8 mx-auto mb-2" />
        <p>Sin tareas recientes</p>
      </div>
    )
  }

  const statusBadge = (s: string) => {
    switch (s) {
      case 'completed': return <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">OK</Badge>
      case 'failed': return <Badge variant="destructive" className="text-[10px]">Error</Badge>
      case 'pending': return <Badge variant="secondary" className="text-[10px]">Pendiente</Badge>
      case 'processing': return <Badge className="bg-blue-100 text-blue-800 text-[10px]">En curso</Badge>
      default: return <Badge variant="outline" className="text-[10px]">{s}</Badge>
    }
  }

  const taskLabel = (t: string) => {
    switch (t) {
      case 'generate_description': return 'Descripción'
      case 'translate_fr': return 'Trad. FR'
      case 'translate_en': return 'Trad. EN'
      case 'generate_keywords': return 'Keywords'
      case 'generate_ministry_description': return 'Desc. Ministerio'
      default: return t
    }
  }

  return (
    <div className="divide-y max-h-[400px] overflow-y-auto">
      <div className="grid grid-cols-[1fr_100px_70px_60px_70px] gap-2 px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide bg-muted/50 sticky top-0">
        <span>Servicio</span>
        <span>Tipo</span>
        <span>Estado</span>
        <span>Tokens</span>
        <span>Acción</span>
      </div>
      {tasks.map((t) => (
        <div key={t.id} className="grid grid-cols-[1fr_100px_70px_60px_70px] gap-2 px-2 py-2 items-center text-sm hover:bg-muted/30">
          <div className="truncate">
            <span className="font-medium">{t.nameEs || t.ministryName || `ID ${t.fiscalServiceId}`}</span>
            {t.serviceCode && (
              <span className="text-[10px] text-muted-foreground ml-1">[{t.serviceCode}]</span>
            )}
          </div>
          <span className="text-xs">{taskLabel(t.taskType)}</span>
          {statusBadge(t.status)}
          <span className="text-xs tabular-nums text-muted-foreground">{t.tokensUsed || '-'}</span>
          <div>
            {t.status === 'failed' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[11px] px-2"
                onClick={async () => {
                  setRetrying(t.id)
                  await onRetry(t.id)
                  setRetrying(null)
                }}
                disabled={retrying !== null}
              >
                {retrying === t.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Main Page
// ============================================================
export default function EnrichmentAdminPage() {
  const _t = useTranslations('admin')
  const { toast } = useToast()

  const [stats, setStats] = useState<EnrichmentStats | null>(null)
  const [drafts, setDrafts] = useState<PendingDraft[]>([])
  const [ministryDrafts, setMinistryDrafts] = useState<PendingDraft[]>([])
  const [recentTasks, setRecentTasks] = useState<EnrichmentTask[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [activeTab, setActiveTab] = useState('approval')

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, d, md, r] = await Promise.all([
        enrichmentApi.getStats(),
        enrichmentApi.getPendingDrafts(),
        enrichmentApi.getPendingMinistryDrafts(),
        enrichmentApi.getRecent(30),
      ])
      setStats(s)
      setDrafts(d)
      setMinistryDrafts(md)
      setRecentTasks(r)
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadAll() }, [loadAll])

  const handleReviewService = async (id: number, action: 'approve' | 'reject', editedText?: string) => {
    try {
      await enrichmentApi.reviewService(id, action, editedText)
      toast({
        title: action === 'approve' ? 'Descripción aprobada' : 'Descripción rechazada',
        description: `Servicio #${id} — ${action === 'approve' ? 'visible en sitio público' : 'eliminada'}`,
      })
      // Optimistic update
      setDrafts(prev => prev.filter(d => d.id !== id))
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          descAiDraft: prev.descAiDraft - 1,
          ...(action === 'approve' ? { descAiApproved: prev.descAiApproved + 1 } : {}),
        } : null)
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo procesar la acción', variant: 'destructive' })
    }
  }

  const handleReviewMinistry = async (id: number, action: 'approve' | 'reject', editedText?: string) => {
    try {
      await enrichmentApi.reviewMinistry(id, action, editedText)
      toast({
        title: action === 'approve' ? 'Descripción ministerio aprobada' : 'Descripción rechazada',
      })
      setMinistryDrafts(prev => prev.filter(d => d.id !== id))
    } catch {
      toast({ title: 'Error', description: 'No se pudo procesar la acción', variant: 'destructive' })
    }
  }

  const handleRetry = async (taskId: string) => {
    try {
      await enrichmentApi.retryTask(taskId)
      toast({ title: 'Tarea reintentada', description: 'Se procesará en el próximo ciclo cron' })
      setRecentTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'pending' } : t))
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  const handleSeedBatch = async () => {
    setSeeding(true)
    try {
      const result = await enrichmentApi.seedBatch()
      toast({
        title: 'Enriquecimiento lanzado',
        description: `${result.enqueuedDescriptions} descripciones + ${result.enqueuedTranslations} traducciones encoladas`,
      })
      await loadAll()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error'
      toast({ title: 'Error', description: msg.includes('429') ? 'Espere 1 minuto entre cada lanzamiento' : msg, variant: 'destructive' })
    } finally {
      setSeeding(false)
    }
  }

  const handleSeedMinistries = async () => {
    setSeeding(true)
    try {
      const result = await enrichmentApi.seedMinistries()
      toast({ title: 'Ministerios encolados', description: `${result.enqueuedMinistryDescriptions} descripciones encoladas` })
      await loadAll()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error'
      toast({ title: 'Error', description: msg.includes('429') ? 'Espere 1 minuto' : msg, variant: 'destructive' })
    } finally {
      setSeeding(false)
    }
  }

  const handleApproveAll = async () => {
    try {
      const result = await enrichmentApi.approveAll()
      toast({
        title: 'Aprobación masiva completada',
        description: `${result.approvedServices} servicios + ${result.approvedMinistries} ministerios aprobados`,
      })
      await loadAll()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error'
      toast({ title: 'Error', description: msg.includes('429') ? 'Espere 1 minuto' : msg, variant: 'destructive' })
    }
  }

  const pendingCount = drafts.length + ministryDrafts.length

  return (
    <div className="space-y-4 p-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Enriquecimiento IA</h1>
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
              {pendingCount} pendientes
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={loadAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} loading={loading} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="approval" className="text-xs sm:text-sm">
            <CheckCircle className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Revisión
            {drafts.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{drafts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ministries" className="text-xs sm:text-sm">
            <Building2 className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Ministerios
            {ministryDrafts.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{ministryDrafts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="queue" className="text-xs sm:text-sm">
            <RefreshCw className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Cola
          </TabsTrigger>
          <TabsTrigger value="actions" className="text-xs sm:text-sm">
            <Sparkles className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Acciones
          </TabsTrigger>
        </TabsList>

        {/* Tab: Service Approval */}
        <TabsContent value="approval">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Descripciones IA — Servicios</CardTitle>
              {drafts.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-xs">
                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      Aprobar todo ({drafts.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Aprobar todas las descripciones IA?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción aprobará {drafts.length} descripciones de servicios y {ministryDrafts.length} de ministerios.
                        Todas serán visibles en el sitio público.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleApproveAll} className="bg-emerald-600 hover:bg-emerald-700">
                        Aprobar todo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <ApprovalTable
                drafts={drafts}
                loading={loading}
                onReview={handleReviewService}
                entityType="service"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Ministry Approval */}
        <TabsContent value="ministries">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Descripciones IA — Ministerios</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ApprovalTable
                drafts={ministryDrafts}
                loading={loading}
                onReview={handleReviewMinistry}
                entityType="ministry"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Queue Monitor */}
        <TabsContent value="queue">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Monitor de Cola</CardTitle>
              <div className="flex items-center gap-2">
                {stats && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" /> {stats.queuePending} pendientes
                    </span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="flex items-center gap-0.5">
                      <CheckCircle className="h-3 w-3 text-emerald-500" /> {stats.queueCompleted}
                    </span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="flex items-center gap-0.5">
                      <AlertTriangle className="h-3 w-3 text-red-500" /> {stats.queueFailed}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <QueueTable tasks={recentTasks} loading={loading} onRetry={handleRetry} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Actions */}
        <TabsContent value="actions">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Generar Descripciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Encolar generación Gemini para todos los servicios activos sin descripción.
                  Las descripciones generadas quedarán como borrador hasta aprobación.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={seeding} className="w-full">
                      {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Generar Descripciones Servicios
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Lanzar generación masiva?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se encolará la generación de descripciones para ~{stats?.totalServices ?? 0 - (stats?.withDescription ?? 0)} servicios.
                        El proceso es asíncrono (5 min/batch de 20).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSeedBatch}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-violet-600" />
                  Generar Descripciones Ministerios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Encolar generación para ministerios sin descripción.
                  Los borradores requieren aprobación antes de ser visibles.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={seeding} className="w-full">
                      {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Building2 className="h-4 w-4 mr-2" />}
                      Generar Descripciones Ministerios
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Lanzar generación ministerios?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se generarán descripciones IA pour les ministerios actifs sans description.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSeedMinistries}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
