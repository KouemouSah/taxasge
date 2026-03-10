"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  ArrowLeft, Save, Plus, Trash2, Copy, Loader2,
} from "lucide-react"
import { bundleApi, bundleAdminApi } from "@/modules/fiscal-services/services/bundle-api"
import type {
  ServiceBundle, CommerceZone, BundleItem,
} from "@/types/service-bundle"

function formatXAF(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("es-GQ", { style: "decimal" }).format(num) + " XAF"
}

export default function BundleEditPage() {
  const params = useParams()
  const router = useRouter()
  const bundleId = params.id as string

  // Bundle metadata
  const [bundle, setBundle] = useState<ServiceBundle | null>(null)
  const [form, setForm] = useState({
    bundleCode: "",
    commerceType: "",
    nameEs: "",
    descriptionEs: "",
    legalReference: "",
    isActive: true,
    installmentEligible: false,
    maxInstallments: 1,
    installmentFrequency: "monthly",
  })

  // Zones & items
  const [zones, setZones] = useState<CommerceZone[]>([])
  const [selectedZone, setSelectedZone] = useState<string>("")
  const [items, setItems] = useState<BundleItem[]>([])
  const [totalAmount, setTotalAmount] = useState("0")

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [itemSaving, setItemSaving] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showCopyZone, setShowCopyZone] = useState(false)

  // Add item form
  const [newItem, setNewItem] = useState({
    fiscalServiceId: "",
    amount: "",
    isFixedAcrossZones: false,
    displayOrder: 0,
    notes: "",
  })

  // Copy zone form
  const [copySource, setCopySource] = useState("")
  const [copyTarget, setCopyTarget] = useState("")
  const [copyMultiplier, setCopyMultiplier] = useState("1.0")

  // Load bundle + zones
  useEffect(() => {
    async function load() {
      try {
        const [b, z] = await Promise.all([
          bundleApi.getBundle(bundleId),
          bundleApi.listZones(),
        ])
        setBundle(b)
        setForm({
          bundleCode: b.bundleCode,
          commerceType: b.commerceType,
          nameEs: b.nameEs,
          descriptionEs: b.descriptionEs || "",
          legalReference: b.legalReference || "",
          isActive: b.isActive,
          installmentEligible: b.installmentEligible,
          maxInstallments: b.maxInstallments,
          installmentFrequency: b.installmentFrequency,
        })
        setZones(z)
        if (z.length > 0) setSelectedZone(z[0].id)
      } catch (err) {
        console.error("Failed to load bundle:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [bundleId])

  // Load items for selected zone
  const loadItems = useCallback(async () => {
    if (!selectedZone || !bundleId) return
    try {
      const pricing = await bundleApi.getBundlePricing(bundleId, selectedZone)
      setItems(pricing.items || [])
      setTotalAmount(String(pricing.totalAmount || "0"))
    } catch (err) {
      console.error("Failed to load pricing:", err)
    }
  }, [bundleId, selectedZone])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // Save bundle metadata
  const handleSaveMetadata = async () => {
    setSaving(true)
    try {
      const updated = await bundleAdminApi.updateBundle(bundleId, {
        bundleCode: form.bundleCode,
        commerceType: form.commerceType,
        nameEs: form.nameEs,
        descriptionEs: form.descriptionEs || undefined,
        legalReference: form.legalReference || undefined,
        isActive: form.isActive,
        installmentEligible: form.installmentEligible,
        maxInstallments: form.maxInstallments,
        installmentFrequency: form.installmentFrequency,
      })
      setBundle(updated)
    } catch (err) {
      console.error("Save failed:", err)
    } finally {
      setSaving(false)
    }
  }

  // Add/update item
  const handleAddItem = async () => {
    if (!newItem.fiscalServiceId || !newItem.amount) return
    setItemSaving(true)
    try {
      await bundleAdminApi.upsertItem(bundleId, {
        fiscalServiceId: parseInt(newItem.fiscalServiceId),
        zoneId: selectedZone,
        amount: parseFloat(newItem.amount),
        isFixedAcrossZones: newItem.isFixedAcrossZones,
        displayOrder: newItem.displayOrder,
        notes: newItem.notes || undefined,
      })
      setShowAddItem(false)
      setNewItem({ fiscalServiceId: "", amount: "", isFixedAcrossZones: false, displayOrder: 0, notes: "" })
      await loadItems()
    } catch (err) {
      console.error("Add item failed:", err)
    } finally {
      setItemSaving(false)
    }
  }

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    try {
      await bundleAdminApi.deleteItem(itemId)
      await loadItems()
    } catch (err) {
      console.error("Delete item failed:", err)
    }
  }

  // Copy zone prices
  const handleCopyZone = async () => {
    if (!copySource || !copyTarget) return
    setItemSaving(true)
    try {
      await bundleAdminApi.copyZonePrices(bundleId, {
        sourceZoneId: copySource,
        targetZoneId: copyTarget,
        multiplier: parseFloat(copyMultiplier) || 1.0,
      })
      setShowCopyZone(false)
      await loadItems()
    } catch (err) {
      console.error("Copy zone failed:", err)
    } finally {
      setItemSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>
  }

  if (!bundle) {
    return <div className="p-8 text-center text-destructive">Bundle no encontrado</div>
  }

  const selectedZoneObj = zones.find(z => z.id === selectedZone)

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Editar: {bundle.nameEs}</h1>
          <p className="text-sm text-muted-foreground">{bundle.bundleCode}</p>
        </div>
      </div>

      {/* Metadata Form */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Datos del Bundle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Código</Label>
              <Input
                value={form.bundleCode}
                onChange={(e) => setForm(f => ({ ...f, bundleCode: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Tipo Comercio</Label>
              <Input
                value={form.commerceType}
                onChange={(e) => setForm(f => ({ ...f, commerceType: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Nombre (ES)</Label>
            <Input
              value={form.nameEs}
              onChange={(e) => setForm(f => ({ ...f, nameEs: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Descripción</Label>
            <Textarea
              value={form.descriptionEs}
              onChange={(e) => setForm(f => ({ ...f, descriptionEs: e.target.value }))}
              className="text-sm min-h-[60px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Referencia Legal</Label>
              <Input
                value={form.legalReference}
                onChange={(e) => setForm(f => ({ ...f, legalReference: e.target.value }))}
                className="h-8 text-sm"
                placeholder="Ej: Decreto 127/2004"
              />
            </div>
            <div>
              <Label className="text-xs">Frecuencia Cuotas</Label>
              <Select
                value={form.installmentFrequency}
                onValueChange={(v) => setForm(f => ({ ...f, installmentFrequency: v }))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="bi-monthly">Bimestral</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm(f => ({ ...f, isActive: v }))}
              />
              <Label className="text-xs">Activo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.installmentEligible}
                onCheckedChange={(v) => setForm(f => ({ ...f, installmentEligible: v }))}
              />
              <Label className="text-xs">Permite Cuotas</Label>
            </div>
            <div>
              <Label className="text-xs">Max Cuotas</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={form.maxInstallments}
                onChange={(e) => setForm(f => ({ ...f, maxInstallments: parseInt(e.target.value) || 1 }))}
                className="h-8 text-sm"
                disabled={!form.installmentEligible}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveMetadata} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              Guardar Datos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items by Zone */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              Servicios por Zona — {selectedZoneObj?.zoneCode || "—"} ({selectedZoneObj?.nameEs || ""})
            </CardTitle>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowCopyZone(true)}>
                <Copy className="h-3 w-3 mr-1" /> Copiar Zona
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={() => setShowAddItem(true)}>
                <Plus className="h-3 w-3 mr-1" /> Agregar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-3">
          {/* Zone Selector */}
          <div className="flex gap-1 flex-wrap">
            {zones.map((zone) => (
              <Button
                key={zone.id}
                variant={selectedZone === zone.id ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSelectedZone(zone.id)}
              >
                {zone.zoneCode}
              </Button>
            ))}
          </div>

          {/* Items Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Código</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead className="w-[120px] text-right">Monto (XAF)</TableHead>
                <TableHead className="w-[60px] text-center">Fijo</TableHead>
                <TableHead className="w-[60px] text-center">Orden</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    Sin servicios en esta zona
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.serviceCode}</TableCell>
                    <TableCell className="text-sm">{item.serviceName}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatXAF(item.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.isFixedAcrossZones && <Badge variant="outline" className="text-xs">F</Badge>}
                    </TableCell>
                    <TableCell className="text-center text-xs">{item.displayOrder}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {items.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={2} className="text-right">TOTAL</TableCell>
                  <TableCell className="text-right font-mono">{formatXAF(totalAmount)}</TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Agregar Servicio — Zona {selectedZoneObj?.zoneCode}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">ID Servicio Fiscal</Label>
              <Input
                type="number"
                value={newItem.fiscalServiceId}
                onChange={(e) => setNewItem(n => ({ ...n, fiscalServiceId: e.target.value }))}
                className="h-8 text-sm"
                placeholder="Ej: 183 (T-183)"
              />
            </div>
            <div>
              <Label className="text-xs">Monto (XAF)</Label>
              <Input
                type="number"
                step="0.01"
                value={newItem.amount}
                onChange={(e) => setNewItem(n => ({ ...n, amount: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Orden</Label>
                <Input
                  type="number"
                  value={newItem.displayOrder}
                  onChange={(e) => setNewItem(n => ({ ...n, displayOrder: parseInt(e.target.value) || 0 }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <Switch
                  checked={newItem.isFixedAcrossZones}
                  onCheckedChange={(v) => setNewItem(n => ({ ...n, isFixedAcrossZones: v }))}
                />
                <Label className="text-xs">Fijo todas zonas</Label>
              </div>
            </div>
            <div>
              <Label className="text-xs">Notas</Label>
              <Input
                value={newItem.notes}
                onChange={(e) => setNewItem(n => ({ ...n, notes: e.target.value }))}
                className="h-8 text-sm"
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAddItem(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAddItem} disabled={itemSaving}>
              {itemSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Zone Dialog */}
      <Dialog open={showCopyZone} onOpenChange={setShowCopyZone}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Copiar Precios entre Zonas</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Zona Origen</Label>
              <Select value={copySource} onValueChange={setCopySource}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {zones.map(z => (
                    <SelectItem key={z.id} value={z.id}>{z.zoneCode} — {z.nameEs}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Zona Destino</Label>
              <Select value={copyTarget} onValueChange={setCopyTarget}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {zones.map(z => (
                    <SelectItem key={z.id} value={z.id}>{z.zoneCode} — {z.nameEs}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Multiplicador</Label>
              <Input
                type="number"
                step="0.01"
                value={copyMultiplier}
                onChange={(e) => setCopyMultiplier(e.target.value)}
                className="h-8 text-sm"
                placeholder="1.0 = mismo precio"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ej: 0.75 para zona B (75% de zona A)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCopyZone(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCopyZone} disabled={itemSaving || !copySource || !copyTarget}>
              {itemSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              Copiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
