"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft, Download, FileText, CreditCard, MapPin,
} from "lucide-react"
import { bundleApi, bundleAdminApi } from "@/modules/fiscal-services/services/bundle-api"
import type {
  ServiceBundle, CommerceZone, BundleItem, BundleDocument,
  ZoneTotal, InstallmentPreview,
} from "@/types/service-bundle"

function formatXAF(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("es-GQ", { style: "decimal" }).format(num) + " XAF"
}

export default function BundleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bundleId = params.id as string

  const [bundle, setBundle] = useState<ServiceBundle | null>(null)
  const [zones, setZones] = useState<CommerceZone[]>([])
  const [selectedZone, setSelectedZone] = useState<string>("")
  const [items, setItems] = useState<BundleItem[]>([])
  const [zoneTotals, setZoneTotals] = useState<ZoneTotal[]>([])
  const [documents, setDocuments] = useState<BundleDocument[]>([])
  const [installmentPreview, setInstallmentPreview] = useState<InstallmentPreview | null>(null)
  const [totalAmount, setTotalAmount] = useState<string>("0")
  const [loading, setLoading] = useState(true)

  // Load bundle + zones
  useEffect(() => {
    async function load() {
      try {
        const [b, z, docs] = await Promise.all([
          bundleApi.getBundle(bundleId),
          bundleApi.listZones(),
          bundleApi.getBundleDocuments(bundleId),
        ])
        setBundle(b)
        setZones(z)
        setDocuments(docs)
        if (z.length > 0) setSelectedZone(z[0].id)
      } catch (err) {
        console.error("Failed to load bundle:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [bundleId])

  // Load pricing for selected zone
  useEffect(() => {
    if (!selectedZone || !bundleId) return
    async function loadPricing() {
      try {
        const pricing = await bundleApi.getBundlePricing(bundleId, selectedZone)
        setItems(pricing.items || [])
        setTotalAmount(String(pricing.totalAmount || "0"))
      } catch (err) {
        console.error("Failed to load pricing:", err)
      }
    }
    loadPricing()
  }, [bundleId, selectedZone])

  // Load zone totals (matrix summary)
  useEffect(() => {
    if (!bundleId) return
    async function loadMatrix() {
      try {
        const matrix = await bundleApi.getPricingMatrix(bundleId)
        setZoneTotals(matrix.zoneTotals || [])
      } catch { /* ignore */ }
    }
    loadMatrix()
  }, [bundleId])

  // Load installment preview when zone selected
  useEffect(() => {
    if (!selectedZone || !bundle?.installmentEligible) {
      setInstallmentPreview(null)
      return
    }
    async function loadPreview() {
      try {
        const preview = await bundleApi.previewInstallments(
          bundleId, selectedZone, bundle!.maxInstallments
        )
        setInstallmentPreview(preview)
      } catch { setInstallmentPreview(null) }
    }
    loadPreview()
  }, [bundleId, selectedZone, bundle])

  const handleExport = async () => {
    if (!bundle) return
    try {
      const blob = await bundleAdminApi.exportCsv(bundleId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `bundle_${bundle.bundleCode}_matrix.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export failed:", err)
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{bundle.nameEs}</h1>
            <Badge variant={bundle.isActive ? "default" : "secondary"}>
              {bundle.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {bundle.bundleCode} — {bundle.commerceType}
            {bundle.legalReference && ` — ${bundle.legalReference}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Servicios</p>
          <p className="text-lg font-bold">{bundle.itemCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Zonas</p>
          <p className="text-lg font-bold">{bundle.zoneCount}/12</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Pago</p>
          <p className="text-lg font-bold">
            {bundle.installmentEligible ? `${bundle.maxInstallments}x ${bundle.installmentFrequency}` : "Único"}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total ({selectedZoneObj?.zoneCode || "—"})</p>
          <p className="text-lg font-bold">{formatXAF(totalAmount)}</p>
        </Card>
      </div>

      <Tabs defaultValue="pricing" className="space-y-3">
        <TabsList>
          <TabsTrigger value="pricing">
            <CreditCard className="h-3.5 w-3.5 mr-1" /> Precios por Zona
          </TabsTrigger>
          <TabsTrigger value="matrix">
            <MapPin className="h-3.5 w-3.5 mr-1" /> Resumen Zonas
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-3.5 w-3.5 mr-1" /> Documentos ({documents.length})
          </TabsTrigger>
        </TabsList>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-3">
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
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Código</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Ministerio</TableHead>
                    <TableHead className="w-[120px] text-right">Monto (XAF)</TableHead>
                    <TableHead className="w-[60px] text-center">Fijo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.serviceCode}</TableCell>
                      <TableCell className="text-sm">{item.serviceName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.ministryName}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatXAF(item.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.isFixedAcrossZones && <Badge variant="outline" className="text-xs">F</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={3} className="text-right">
                      TOTAL TESORO PÚBLICO
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatXAF(totalAmount)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Installment Preview */}
          {installmentPreview && (
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">
                  Plan de Pago ({installmentPreview.numInstallments} cuotas {installmentPreview.frequency})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">#</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Acumulado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installmentPreview.installments.map((inst) => (
                      <TableRow key={inst.installmentNumber}>
                        <TableCell>{inst.installmentNumber}</TableCell>
                        <TableCell>{inst.dueDate}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatXAF(inst.amountDue)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatXAF(inst.cumulativePaid)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-2">
                  Período de gracia: {installmentPreview.gracePeriodDays} días —
                  Penalidad por mora: {(parseFloat(installmentPreview.lateFeeRate) * 100).toFixed(0)}%
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Zone Totals Tab */}
        <TabsContent value="matrix">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Zona</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-[60px] text-center">Tier</TableHead>
                    <TableHead className="w-[80px] text-center">Items</TableHead>
                    <TableHead className="w-[140px] text-right">Total (XAF)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zoneTotals.map((zt) => (
                    <TableRow
                      key={zt.zone.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedZone(zt.zone.id)
                        // Switch to pricing tab
                        const pricingTab = document.querySelector('[data-value="pricing"]') as HTMLElement
                        pricingTab?.click()
                      }}
                    >
                      <TableCell className="font-mono font-bold">{zt.zone.zoneCode}</TableCell>
                      <TableCell className="text-sm">{zt.zone.nameEs}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{zt.zone.zoneTier}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{zt.itemCount}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatXAF(zt.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead className="w-[120px]">Código</TableHead>
                    <TableHead className="w-[100px] text-center">Requerido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        Sin documentos asignados a los servicios de este bundle
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc) => (
                      <TableRow key={doc.documentTemplateId}>
                        <TableCell className="text-sm">{doc.documentNameEs}</TableCell>
                        <TableCell className="font-mono text-xs">{doc.templateCode || "—"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={doc.isRequired ? "default" : "outline"} className="text-xs">
                            {doc.isRequired ? "Sí" : "No"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
