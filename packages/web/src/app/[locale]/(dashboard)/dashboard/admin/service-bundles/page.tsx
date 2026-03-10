"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Package, MapPin, Layers, Search, Eye, Download, ChevronLeft, ChevronRight,
} from "lucide-react"
import { bundleApi, bundleAdminApi } from "@/modules/fiscal-services/services/bundle-api"
import type { ServiceBundle, BundleListResponse } from "@/types/service-bundle"

export default function ServiceBundlesPage() {
  const router = useRouter()
  const [data, setData] = useState<BundleListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isActive, setIsActive] = useState<string>("all")
  const [stats, setStats] = useState({ bundles: 0, zones: 0, items: 0 })
  const fetchSeq = useRef(0)
  const PAGE_SIZE = 20

  const fetchBundles = useCallback(async () => {
    const seq = ++fetchSeq.current
    setLoading(true)
    try {
      const result = await bundleApi.listBundles({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        isActive: isActive === "all" ? undefined : isActive === "true",
      })
      if (seq === fetchSeq.current) {
        setData(result)
      }
    } catch (err) {
      console.error("Failed to fetch bundles:", err)
    } finally {
      if (seq === fetchSeq.current) setLoading(false)
    }
  }, [page, search, isActive])

  useEffect(() => {
    fetchBundles()
  }, [fetchBundles])

  // Stats
  useEffect(() => {
    async function loadStats() {
      try {
        const [zones, allBundles] = await Promise.all([
          bundleApi.listZones(),
          bundleApi.listBundles({ pageSize: 1 }),
        ])
        setStats({
          bundles: allBundles.total,
          zones: zones.length,
          items: 0, // Would need separate count endpoint
        })
      } catch { /* ignore */ }
    }
    loadStats()
  }, [])

  // Debounced search
  const [searchInput, setSearchInput] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  const handleExport = async (bundleId: string, bundleCode: string) => {
    try {
      const blob = await bundleAdminApi.exportCsv(bundleId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `bundle_${bundleCode}_matrix.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export failed:", err)
    }
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bundles de Servicios Comerciales</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de licencias comerciales por zona geográfica
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Bundles</p>
              <p className="text-lg font-bold">{stats.bundles}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Zonas</p>
              <p className="text-lg font-bold">{stats.zones}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Items</p>
              <p className="text-lg font-bold">{data?.total ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar bundle..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={isActive} onValueChange={(v) => { setIsActive(v); setPage(1) }}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-[120px]">Tipo</TableHead>
                <TableHead className="w-[80px] text-center">Items</TableHead>
                <TableHead className="w-[80px] text-center">Zonas</TableHead>
                <TableHead className="w-[100px] text-center">Pago</TableHead>
                <TableHead className="w-[80px] text-center">Estado</TableHead>
                <TableHead className="w-[90px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : !data?.items?.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No se encontraron bundles
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((bundle) => (
                  <TableRow
                    key={bundle.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`service-bundles/${bundle.id}`)}
                  >
                    <TableCell className="font-mono text-xs">{bundle.bundleCode}</TableCell>
                    <TableCell className="font-medium text-sm">{bundle.nameEs}</TableCell>
                    <TableCell className="text-xs">{bundle.commerceType}</TableCell>
                    <TableCell className="text-center">{bundle.itemCount}</TableCell>
                    <TableCell className="text-center">{bundle.zoneCount}</TableCell>
                    <TableCell className="text-center">
                      {bundle.installmentEligible ? (
                        <Badge variant="outline" className="text-xs">
                          {bundle.maxInstallments}x
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Único</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={bundle.isActive ? "default" : "secondary"} className="text-xs">
                        {bundle.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => router.push(`service-bundles/${bundle.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => handleExport(bundle.id, bundle.bundleCode)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {data?.total ?? 0} bundles — Página {page}/{totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline" size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
