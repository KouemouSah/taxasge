'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Building2, Search, MapPin, ChevronLeft, ChevronRight, ChevronDown,
  Briefcase, FileText, Users, LayoutGrid, List, X, SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { companyPublicApi } from '@/modules/companies/services/api'
import type { PublicCompany, PublicZone } from '@/modules/companies/types'

const PAGE_SIZE = 20

const FORMA_LABELS: Record<string, { label: string; color: string }> = {
  autonomo: { label: 'Autónomo', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  sociedad_limitada: { label: 'S.L.', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  sociedad_anonima: { label: 'S.A.', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  ong: { label: 'ONG', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  cooperativa: { label: 'Cooperativa', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  sucursal: { label: 'Sucursal', color: 'bg-slate-50 text-slate-600 border-slate-200' },
  empresa_individual: { label: 'Emp. Individual', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

const FORMA_FILTER_OPTIONS = [
  { value: 'autonomo', label: 'Autónomo' },
  { value: 'sociedad_limitada', label: 'Sociedad Limitada (S.L.)' },
  { value: 'sociedad_anonima', label: 'Sociedad Anónima (S.A.)' },
  { value: 'ong', label: 'ONG / Asociación' },
]

export default function AnnuairePage() {
  const t = useTranslations('public')

  const [query, setQuery] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [sector, setSector] = useState('')
  const [formaJuridica, setFormaJuridica] = useState('')
  const [provincia, setProvincia] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<PublicCompany[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [zones, setZones] = useState<PublicZone[]>([])
  const [sectors, setSectors] = useState<string[]>([])
  const [provincias, setProvincias] = useState<string[]>([])
  const [ciudades, setCiudades] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const seqRef = useRef(0)

  // Load filter options
  useEffect(() => {
    companyPublicApi.getZones().then(setZones).catch(() => {})
    companyPublicApi.getSectors().then(setSectors).catch(() => {})
    companyPublicApi.getProvincias().then(setProvincias).catch(() => {})
  }, [])

  // Load ciudades when provincia changes
  useEffect(() => {
    if (provincia) {
      companyPublicApi.getCiudades(provincia).then(setCiudades).catch(() => {})
    } else {
      setCiudades([])
      setCiudad('')
    }
  }, [provincia])

  const doSearch = useCallback(async (q: string, z: string, s: string, f: string, p: string, ci: string, pg: number) => {
    const seq = ++seqRef.current
    setLoading(true)
    try {
      const res = await companyPublicApi.search({
        q: q || undefined, zone_id: z || undefined, sector: s || undefined,
        forma_juridica: f || undefined, provincia: p || undefined, ciudad: ci || undefined,
        page: pg, page_size: PAGE_SIZE,
      })
      if (seq === seqRef.current) { setItems(res.items); setTotal(res.total) }
    } catch {
      if (seq === seqRef.current) { setItems([]); setTotal(0) }
    } finally {
      if (seq === seqRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query, zoneId, sector, formaJuridica, provincia, ciudad, page), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, zoneId, sector, formaJuridica, provincia, ciudad, page, doSearch])

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1
  const activeFilterCount = [zoneId, sector, formaJuridica, provincia, ciudad].filter(Boolean).length

  const resetFilters = () => {
    setZoneId(''); setSector(''); setFormaJuridica(''); setProvincia(''); setCiudad('')
    setPage(1)
  }

  const getForma = (f?: string | null) => f ? FORMA_LABELS[f] : null
  const getId = (c: PublicCompany) => c.nif || c.registration_number || ''
  const getIdPrefix = (c: PublicCompany) => c.nif ? 'NIF' : c.registration_number ? 'Reg.' : ''

  const CompanyCard = ({ c, compact }: { c: PublicCompany; compact?: boolean }) => {
    const forma = getForma(c.forma_juridica)
    return (
      <div className={`group border border-gray-200 rounded-lg bg-white hover:border-gray-300 hover:shadow-sm transition-all ${compact ? 'p-3' : 'p-4'}`}>
        {/* Name + Forma badge */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-start gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <h3 className={`font-semibold text-gray-900 leading-tight ${compact ? 'text-sm' : 'text-base'} line-clamp-1`}>
              {c.legal_name}
            </h3>
          </div>
          {forma && (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 border ${forma.color}`}>
              {forma.label}
            </Badge>
          )}
        </div>

        {/* ID */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-6 mb-1">
          <FileText className="h-3 w-3 text-amber-500 shrink-0" />
          <span className="font-mono">{getIdPrefix(c)} {getId(c)}</span>
        </div>

        {/* Sector/SubSector | Objeto Social */}
        {(c.sector_actividad || c.objeto_social) && (
          <div className="flex items-start gap-1.5 text-xs text-gray-500 ml-6 mb-1">
            <Briefcase className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
            <p className="line-clamp-1">
              {c.sector_actividad && (
                <span className="font-medium text-gray-600">
                  {c.sector_actividad}
                  {c.subsector_actividad && ` / ${c.subsector_actividad}`}
                </span>
              )}
              {c.sector_actividad && c.objeto_social && <span className="text-gray-300"> | </span>}
              {c.objeto_social && <span>{c.objeto_social}</span>}
            </p>
          </div>
        )}

        {/* Ciudad, Provincia | Dirección */}
        {(c.city_name || c.address) && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-6">
            <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
            {c.city_name && <span>{c.city_name}{c.provincia ? `, ${c.provincia}` : ''}</span>}
            {c.city_name && c.address && <span className="text-gray-300">|</span>}
            {c.address && <span className="truncate">{c.address}</span>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('annuaire.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('annuaire.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          placeholder={t('annuaire.searchPlaceholder')}
          className="pl-10 h-10 bg-white border-gray-200 focus:border-blue-400"
        />
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-2 flex-wrap items-center">
        {/* Quick filters — always visible */}
        <Select value={sector} onValueChange={(v) => { setSector(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-white">
            <SelectValue placeholder={t('annuaire.allSectors')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('annuaire.allSectors')}</SelectItem>
            {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={formaJuridica} onValueChange={(v) => { setFormaJuridica(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[170px] h-8 text-xs bg-white">
            <SelectValue placeholder="Forma jurídica" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las formas</SelectItem>
            {FORMA_FILTER_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Advanced filters toggle */}
        <Button
          variant={showFilters ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge className="bg-blue-600 text-white text-[10px] px-1 py-0 ml-1">{activeFilterCount}</Badge>
          )}
          <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 gap-1" onClick={resetFilters}>
            <X className="h-3 w-3" /> Limpiar
          </Button>
        )}

        {/* View toggle + count */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400">{total.toLocaleString()} {t('annuaire.results')}</span>
          <div className="flex border border-gray-200 rounded-md overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced filters — expandable */}
      {showFilters && (
        <div className="flex gap-2 mb-4 flex-wrap p-3 bg-gray-50 rounded-lg border border-gray-100">
          <Select value={provincia} onValueChange={(v) => { setProvincia(v === 'all' ? '' : v); setCiudad(''); setPage(1) }}>
            <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
              <SelectValue placeholder="Provincia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las provincias</SelectItem>
              {provincias.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>

          {provincia && ciudades.length > 0 && (
            <Select value={ciudad} onValueChange={(v) => { setCiudad(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {ciudades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <Select value={zoneId} onValueChange={(v) => { setZoneId(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
              <SelectValue placeholder={t('annuaire.allZones')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('annuaire.allZones')}</SelectItem>
              {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.zone_code} — {z.name_es}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400 text-sm">{t('annuaire.noResults')}</p>
        </div>
      ) : (
        <div className={`grid gap-3 ${viewMode === 'list' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
          {items.map(c => <CompanyCard key={c.id} c={c} compact={viewMode === 'list'} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="text-gray-500">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-500 tabular-nums">{page} / {totalPages}</span>
          <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="text-gray-500">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
