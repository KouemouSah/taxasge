'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft, Camera, MapPin, CheckCircle2, AlertTriangle,
  Lock, DollarSign, Save, FileText, Upload,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { inspectionApi } from '@/modules/inspections/services/api'
import { INSPECTION_STATUS_CONFIG, SEAL_REASON_LABELS, fmtXAF } from '@/modules/inspections/utils/formatters'
import type { Inspection, SealReason } from '@/modules/inspections/types'

export default function InspectPage() {
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const inspectionId = searchParams.get('id')
  const { toast } = useToast()

  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [activityConforme, setActivityConforme] = useState<boolean | null>(null)
  const [activityObserved, setActivityObserved] = useState('')
  const [notes, setNotes] = useState('')
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)

  // Dialogs
  const [showMedDialog, setShowMedDialog] = useState(false)
  const [showSealDialog, setShowSealDialog] = useState(false)
  const [showCollectDialog, setShowCollectDialog] = useState(false)
  const [medDeadline, setMedDeadline] = useState(72)
  const [sealReason, setSealReason] = useState<SealReason | ''>('')
  const [sealNotes, setSealNotes] = useState('')
  const [collectMethod, setCollectMethod] = useState<'cash' | 'mobile_money'>('cash')
  const [collectPhone, setCollectPhone] = useState('')

  const fetchInspection = useCallback(async () => {
    if (!inspectionId) return
    try {
      setLoading(true)
      const data = await inspectionApi.get(inspectionId)
      setInspection(data)
      setActivityConforme(data.activity_conforme ?? null)
      setActivityObserved(data.activity_observed ?? '')
      setNotes(data.notes ?? '')
    } catch {
      toast({ title: 'Error', description: 'Inspección no encontrada', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [inspectionId, toast])

  useEffect(() => { fetchInspection() }, [fetchInspection])

  // Auto-capture GPS
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => { /* GPS unavailable */ },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const handleSave = useCallback(async () => {
    if (!inspection) return
    try {
      setSaving(true)
      const data = await inspectionApi.update(inspection.id, {
        activity_conforme: activityConforme ?? undefined,
        activity_observed: activityObserved || undefined,
        notes: notes || undefined,
        gps_latitude: gps?.lat,
        gps_longitude: gps?.lng,
        gps_accuracy: gps?.accuracy,
      })
      setInspection(data)
      toast({ title: 'Guardado', description: 'Inspección actualizada' })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }, [inspection, activityConforme, activityObserved, notes, gps, toast])

  const handleComplete = useCallback(async () => {
    if (!inspection) return
    try {
      setSaving(true)
      // Save first, then complete
      await inspectionApi.update(inspection.id, {
        activity_conforme: activityConforme ?? undefined,
        activity_observed: activityObserved || undefined,
        notes: notes || undefined,
        gps_latitude: gps?.lat,
        gps_longitude: gps?.lng,
        gps_accuracy: gps?.accuracy,
      })
      const data = await inspectionApi.complete(inspection.id, { notes })
      setInspection(data)
      toast({ title: 'Inspección completada', description: `Resultado: ${data.result}` })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }, [inspection, activityConforme, activityObserved, notes, gps, toast])

  const handleMED = useCallback(async () => {
    if (!inspection) return
    // All unpaid obligation IDs
    const unpaidIds = (inspection as Inspection & { obligations?: Array<{ id: string; status: string }> })
      .obligations?.filter(o => o.status === 'pending' || o.status === 'overdue')
      .map(o => o.id) ?? []

    // If no obligations on inspection, we need to fetch them
    // For now, use the mise_en_demeure_obligations if available
    try {
      const data = await inspectionApi.miseEnDemeure(inspection.id, {
        obligation_ids: unpaidIds.length > 0 ? unpaidIds : [],
        deadline_hours: medDeadline,
        notes: notes || undefined,
      })
      setInspection(data)
      setShowMedDialog(false)
      toast({ title: 'Mise en demeure emitida', description: `Plazo: ${medDeadline}h` })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }, [inspection, medDeadline, notes, toast])

  const handleSeal = useCallback(async () => {
    if (!inspection || !sealReason) return
    try {
      const data = await inspectionApi.proposeSeal(inspection.id, {
        reason: sealReason,
        notes: sealNotes || undefined,
      })
      setInspection(data)
      setShowSealDialog(false)
      toast({ title: 'Scellé propuesto', description: 'Esperando aprobación del supervisor' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }, [inspection, sealReason, sealNotes, toast])

  const handleCollect = useCallback(async () => {
    if (!inspection) return
    try {
      const result = await inspectionApi.collectPayment(inspection.id, {
        obligation_ids: [],  // Will be populated from license verification
        method: collectMethod,
        amount: inspection.unpaid_obligations_amount,
        phone_number: collectMethod === 'mobile_money' ? collectPhone : undefined,
      })
      setShowCollectDialog(false)
      toast({
        title: collectMethod === 'cash' ? 'Cobro registrado' : 'Pago móvil iniciado',
        description: result.receipt_number ? `Recibo: ${result.receipt_number}` : undefined,
      })
      fetchInspection()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }, [inspection, collectMethod, collectPhone, toast, fetchInspection])

  if (loading || !inspection) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
      </div>
    )
  }

  const statusCfg = INSPECTION_STATUS_CONFIG[inspection.status]
  const isEditable = inspection.status === 'in_progress'

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{inspection.company_name}</h1>
            <p className="text-xs text-muted-foreground">{inspection.company_nif}</p>
          </div>
        </div>
        <Badge className={`${statusCfg.bgColor} ${statusCfg.color}`}>
          {statusCfg.label}
        </Badge>
      </div>

      {/* 1. Company info (readonly) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Empresa</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><strong>{inspection.company_name}</strong></p>
          <p className="text-muted-foreground">NIF: {inspection.company_nif} | {inspection.entity_code}</p>
        </CardContent>
      </Card>

      {/* 2. Activity compliance */}
      {isEditable && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Conformidad de actividad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={activityConforme === true ? 'default' : 'outline'}
                size="sm"
                className="flex-1 gap-1"
                onClick={() => setActivityConforme(true)}
              >
                <CheckCircle2 className="h-4 w-4" /> Conforme
              </Button>
              <Button
                variant={activityConforme === false ? 'destructive' : 'outline'}
                size="sm"
                className="flex-1 gap-1"
                onClick={() => setActivityConforme(false)}
              >
                <AlertTriangle className="h-4 w-4" /> No conforme
              </Button>
            </div>
            {activityConforme === false && (
              <div>
                <Label className="text-xs">Actividad constatada</Label>
                <Input
                  placeholder="Actividad real observada..."
                  value={activityObserved}
                  onChange={e => setActivityObserved(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. Payment status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Estado de pago</span>
            <span className={inspection.unpaid_obligations_count > 0 ? 'text-red-600' : 'text-green-600'}>
              {inspection.unpaid_obligations_count > 0
                ? `${inspection.unpaid_obligations_count} impago(s) — ${fmtXAF(inspection.unpaid_obligations_amount, locale)}`
                : 'Todo al día'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <span>Total obligaciones: {inspection.total_obligations_count}</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-green-600">
              Pagadas: {inspection.total_obligations_count - inspection.unpaid_obligations_count}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-red-600">
              Impagadas: {inspection.unpaid_obligations_count}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Photos */}
      {isEditable && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Camera className="h-4 w-4" /> Fotos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {inspection.photos.map((url, i) => (
                <div key={i} className="w-20 h-20 rounded border overflow-hidden">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              <label className="w-20 h-20 rounded border border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={async (e) => {
                    // TODO: Upload to Supabase Storage
                    const file = e.target.files?.[0]
                    if (file) {
                      toast({ title: 'Foto capturada', description: file.name })
                    }
                  }}
                />
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. GPS */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1">
            <MapPin className="h-4 w-4" /> GPS
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {gps ? (
            <span className="text-green-600">
              {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)} (±{gps.accuracy.toFixed(0)}m)
            </span>
          ) : (
            <span className="text-muted-foreground">Obteniendo ubicación...</span>
          )}
        </CardContent>
      </Card>

      {/* 6. Notes */}
      {isEditable && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <FileText className="h-4 w-4" /> Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Observaciones de la inspección..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>
      )}

      {/* 7. Actions (sticky bottom) */}
      {isEditable && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex gap-2 z-50">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-1">
            <Save className="h-4 w-4" /> Guardar
          </Button>
          <Button
            size="sm"
            onClick={handleComplete}
            disabled={saving}
            className="gap-1 flex-1"
          >
            <CheckCircle2 className="h-4 w-4" /> Validar
          </Button>
          {inspection.unpaid_obligations_count > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-orange-600 border-orange-300"
                onClick={() => setShowMedDialog(true)}
              >
                <AlertTriangle className="h-4 w-4" /> MED
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-green-600 border-green-300"
                onClick={() => setShowCollectDialog(true)}
              >
                <DollarSign className="h-4 w-4" /> Cobrar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-red-600 border-red-300"
                onClick={() => setShowSealDialog(true)}
              >
                <Lock className="h-4 w-4" /> Sellar
              </Button>
            </>
          )}
        </div>
      )}

      {/* MED Dialog */}
      <Dialog open={showMedDialog} onOpenChange={setShowMedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mise en demeure</DialogTitle>
            <DialogDescription>
              Emitir un aviso formal con plazo para regularización.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Plazo (horas)</Label>
              <Select value={String(medDeadline)} onValueChange={v => setMedDeadline(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="48">48 horas</SelectItem>
                  <SelectItem value="72">72 horas (defecto)</SelectItem>
                  <SelectItem value="168">7 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Impago: {fmtXAF(inspection.unpaid_obligations_amount, locale)}
              {' '}({inspection.unpaid_obligations_count} obligacion(es))
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMedDialog(false)}>Cancelar</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleMED}>
              Emitir mise en demeure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seal Dialog */}
      <Dialog open={showSealDialog} onOpenChange={setShowSealDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proponer scellé</DialogTitle>
            <DialogDescription>
              El scellé requiere la aprobación del supervisor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Motivo</Label>
              <Select value={sealReason} onValueChange={v => setSealReason(v as SealReason)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar motivo..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SEAL_REASON_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={sealNotes}
                onChange={e => setSealNotes(e.target.value)}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSealDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleSeal} disabled={!sealReason}>
              Proponer scellé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collect Dialog */}
      <Dialog open={showCollectDialog} onOpenChange={setShowCollectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cobrar en terreno</DialogTitle>
            <DialogDescription>
              Cobrar {fmtXAF(inspection.unpaid_obligations_amount, locale)} por {inspection.unpaid_obligations_count} obligación(es).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Método</Label>
              <Select value={collectMethod} onValueChange={v => setCollectMethod(v as 'cash' | 'mobile_money')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {collectMethod === 'mobile_money' && (
              <div>
                <Label>Teléfono</Label>
                <Input
                  placeholder="+240..."
                  value={collectPhone}
                  onChange={e => setCollectPhone(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollectDialog(false)}>Cancelar</Button>
            <Button onClick={handleCollect} className="bg-green-600 hover:bg-green-700">
              Confirmar cobro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
