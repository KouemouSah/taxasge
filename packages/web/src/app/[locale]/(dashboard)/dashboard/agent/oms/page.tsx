'use client'

/**
 * OMS Agent Dashboard — Obligations processing queue
 *
 * Shows the agent's queue of obligations to process, scoped by ministry_id.
 * KPI cards + filterable queue table + batch actions.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ClipboardList, Clock, CheckCircle2, AlertTriangle, Search,
  ChevronLeft, ChevronRight, RefreshCw, Play, XCircle, DollarSign,
  Building2, FileCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { omsQueueApi } from '@/modules/oms/services/api'
import type { AgentQueueItem, AgentQueueStats } from '@/modules/oms/types'

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: typeof Clock }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente', icon: Clock },
  processing: { color: 'bg-blue-100 text-blue-800', label: 'En proceso', icon: Play },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completado', icon: CheckCircle2 },
  paid: { color: 'bg-emerald-100 text-emerald-800', label: 'Pagado', icon: DollarSign },
  overdue: { color: 'bg-red-100 text-red-800', label: 'Vencido', icon: AlertTriangle },
}

function fmtXAF(n: number): string {
  return new Intl.NumberFormat('es-GQ', { maximumFractionDigits: 0 }).format(n) + ' XAF'
}

export default function OMSAgentDashboardPage() {
  const { toast } = useToast()

  const [stats, setStats] = useState<AgentQueueStats | null>(null)
  const [queue, setQueue] = useState<{ items: AgentQueueItem[]; total: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const seqRef = useRef(0)
  const PAGE_SIZE = 20

  const fetchAll = useCallback(async () => {
    const seq = ++seqRef.current
    setLoading(true)
    try {
      const [s, q] = await Promise.all([
        omsQueueApi.getStats(),
        omsQueueApi.getQueue({
          status: statusFilter === 'all' ? undefined : statusFilter,
          page,
          page_size: PAGE_SIZE,
        }),
      ])
      if (seq === seqRef.current) {
        setStats(s)
        setQueue(q)
      }
    } catch {
      if (seq === seqRef.current) toast({ title: 'Error al cargar la cola', variant: 'destructive' })
    } finally {
      if (seq === seqRef.current) setLoading(false)
    }
  }, [page, statusFilter, toast])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Search debounce (client-side filter on loaded items)
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(searchInput), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  const filteredItems = queue?.items.filter(item => {
    if (!search) return true
    const q = search.toLowerCase()
    return (item.company_name?.toLowerCase().includes(q)) ||
           (item.fee_type?.toLowerCase().includes(q)) ||
           (item.service_name?.toLowerCase().includes(q))
  }) ?? []

  const totalPages = queue ? Math.ceil(queue.total / PAGE_SIZE) : 0

  // Selection
  const allSelected = filteredItems.length > 0 && filteredItems.every(i => selected.has(i.id))
  const toggleSelectAll = () => {
    const next = new Set(selected)
    if (allSelected) filteredItems.forEach(i => next.delete(i.id))
    else filteredItems.forEach(i => next.add(i.id))
    setSelected(next)
  }

  // Actions
  const handleProcess = async (id: string) => {
    try {
      await omsQueueApi.processObligation(id)
      toast({ title: 'Obligación procesada' })
      fetchAll()
    } catch {
      toast({ title: 'Error al procesar', variant: 'destructive' })
    }
  }

  const handleReject = async (id: string) => {
    const reason = window.prompt('Motivo del rechazo:')
    if (!reason || reason.length < 5) return
    try {
      await omsQueueApi.rejectObligation(id, { reason })
      toast({ title: 'Obligación rechazada' })
      fetchAll()
    } catch {
      toast({ title: 'Error al rechazar', variant: 'destructive' })
    }
  }

  const handleBatchProcess = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`Procesar ${selected.size} obligaciones?`)) return
    setProcessing(true)
    try {
      await omsQueueApi.batchProcess(Array.from(selected))
      toast({ title: `${selected.size} obligaciones procesadas` })
      setSelected(new Set())
      fetchAll()
    } catch {
      toast({ title: 'Error en batch', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Cola de Obligaciones
          </h1>
          <p className="text-sm text-muted-foreground">Gestión de obligaciones fiscales de tu ministerio</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-3"><Skeleton className="h-14 w-full" /></Card>
          ))
        ) : stats ? (<>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pending_count}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Completados hoy</p>
                <p className="text-2xl font-bold">{stats.completed_today}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Monto pendiente</p>
                <p className="text-lg font-bold">{fmtXAF(stats.total_amount_pending)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Procesado hoy</p>
                <p className="text-lg font-bold">{fmtXAF(stats.total_amount_completed_today)}</p>
              </div>
            </div>
          </Card>
        </>) : null}
      </div>

      {/* Filters + Bulk actions */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar empresa, tipo, servicio..." className="pl-8 h-8 text-xs" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="processing">En proceso</SelectItem>
            <SelectItem value="paid">Pagado</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center">{queue?.total ?? 0} obligaciones</span>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-xs font-medium text-blue-700">{selected.size} seleccionadas</span>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 ml-auto"
            onClick={handleBatchProcess} disabled={processing}>
            <CheckCircle2 className="h-3 w-3" /> Procesar batch
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Queue Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox checked={allSelected && filteredItems.length > 0} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead className="text-xs">Empresa</TableHead>
                <TableHead className="text-xs w-[100px]">Tipo</TableHead>
                <TableHead className="text-xs w-[100px]">Servicio</TableHead>
                <TableHead className="text-xs w-[90px] text-right">Monto</TableHead>
                <TableHead className="text-xs w-[80px]">Vence</TableHead>
                <TableHead className="text-xs w-[80px]">Estado</TableHead>
                <TableHead className="text-xs w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No hay obligaciones en la cola</p>
                    {statusFilter !== 'all' && <p className="text-xs mt-1">Prueba cambiando el filtro de estado</p>}
                  </TableCell>
                </TableRow>
              ) : filteredItems.map(item => {
                const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending
                return (
                  <TableRow key={item.id}>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox checked={selected.has(item.id)}
                        onCheckedChange={() => {
                          const next = new Set(selected)
                          next.has(item.id) ? next.delete(item.id) : next.add(item.id)
                          setSelected(next)
                        }} />
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[180px]">{item.company_name || '—'}</span>
                      </div>
                      {item.zone_code && <span className="text-[10px] text-muted-foreground ml-5">{item.zone_code}</span>}
                    </TableCell>
                    <TableCell className="text-xs">{item.fee_type}</TableCell>
                    <TableCell className="text-xs truncate max-w-[100px]">{item.service_name || '—'}</TableCell>
                    <TableCell className="text-xs text-right font-mono">
                      {fmtXAF(item.amount)}
                      {item.penalty_amount > 0 && (
                        <span className="block text-[10px] text-red-500">+{fmtXAF(item.penalty_amount)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{item.due_date || '—'}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Procesar"
                          onClick={() => handleProcess(item.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Rechazar"
                          onClick={() => handleReject(item.id)}>
                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs">{queue?.total ?? 0} obligaciones — Página {page}/{totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
