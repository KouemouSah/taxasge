'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Building2, Search, MapPin, ChevronLeft, ChevronRight,
  Briefcase, FileText, Users, LayoutGrid, List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { companyPublicApi } from '@/modules/companies/services/api'
import type { PublicCompany, PublicZone } from '@/modules/companies/types'

const PAGE_SIZE = 24

const FORMA_LABELS: Record<string, string> = {
  autonomo: 'Autónomo',
  sociedad_limitada: 'S.L.',
  sociedad_anonima: 'S.A.',
  ong: 'ONG',
  cooperativa: 'Cooperativa',
  sucursal: 'Sucursal',
  empresa_individual: 'Emp. Individual',
}

const FORMA_OPTIONS = [
  { value: 'autonomo', label: 'Autónomo' },
  { value: 'sociedad_limitada', label: 'Sociedad Limitada' },
  { value: 'sociedad_anonima', label: 'Sociedad Anónima' },
  { value: 'ong', label: 'ONG / Asociación' },
]

export default function AnnuairePage() {
  const t = useTranslations('public')

  const [query, setQuery] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [sector, setSector] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<PublicCompany[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [zones, setZones] = useState<PublicZone[]>([])
  const [sectors, setSectors] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const debounceRef = useRef<NodeJS.Timeout>()
  const seqRef = useRef(0)

  useEffect(() => {
    companyPublicApi.getZones().then(setZones).catch(() => {})
    companyPublicApi.getSectors().then(setSectors).catch(() => {})
  }, [])

  const doSearch = useCallback(async (q: string, z: string, s: string, p: number) => {
    const seq = ++seqRef.current
    setLoading(true)
    try {
      const res = await companyPublicApi.search({
        q: q || undefined,
        zone_id: z || undefined,
        sector: s || undefined,
        page: p,
        page_size: PAGE_SIZE,
      })
      if (seq === seqRef.current) {
        setItems(res.items)
        setTotal(res.total)
      }
    } catch {
      if (seq === seqRef.current) { setItems([]); setTotal(0) }
    } finally {
      if (seq === seqRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query, zoneId, sector, page), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, zoneId, sector, page, doSearch])

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  const getFormaLabel = (f?: string) => f ? (FORMA_LABELS[f] || f) : ''
  const getId = (c: PublicCompany) => c.nif || c.registration_number || ''
  const getIdLabel = (c: PublicCompany) => c.nif ? 'NIF' : c.registration_number ? 'Reg.' : ''

  // ── Company card (shared between grid and list) ──
  const CompanyCard = ({ c, compact }: { c: PublicCompany; compact?: boolean }) => (
    <div className={`group border border-gray-200 rounded-lg bg-white hover:border-gray-300 hover:shadow-sm transition-all ${compact ? 'p-3' : 'p-4'}`}>
      {/* Row 1: Name */}
      <div className="flex items-start gap-2 mb-1.5">
        <Building2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
        <h3 className={`font-semibold text-gray-900 leading-tight ${compact ? 'text-sm' : 'text-base'} line-clamp-1`}>
          {c.legal_name}
        </h3>
      </div>

      {/* Row 2: ID | Forma Juridica */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-6 mb-1">
        <FileText className="h-3 w-3 text-gray-400 shrink-0" />
        <span className="font-mono">{getIdLabel(c)} {getId(c)}</span>
        {getFormaLabel(c.forma_juridica) && (
          <>
            <span className="text-gray-300">|</span>
            <span>{getFormaLabel(c.forma_juridica)}</span>
          </>
        )}
      </div>

      {/* Row 3: Sector/SubSector | Objeto Social */}
      {(c.sector_actividad || c.objeto_social) && (
        <div className="flex items-start gap-1.5 text-xs text-gray-500 ml-6 mb-1">
          <Briefcase className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
          <p className="line-clamp-1">
            {c.sector_actividad && (
              <span className="font-medium text-gray-600">
                {c.sector_actividad}
                {c.subsector_actividad && ` / ${c.subsector_actividad}`}
              </span>
            )}
            {c.sector_actividad && c.objeto_social && (
              <span className="text-gray-300"> | </span>
            )}
            {c.objeto_social && <span>{c.objeto_social}</span>}
          </p>
        </div>
      )}

      {/* Row 4: Ciudad, Provincia | Dirección */}
      {(c.city_name || c.address) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-6">
          <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
          {c.city_name && <span>{c.city_name}{c.provincia ? `, ${c.provincia}` : ''}</span>}
          {c.city_name && c.address && <span className="text-gray-300">|</span>}
          {c.address && <span className="truncate">{c.address}</span>}
        </div>
      )}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
          <Users className="h-6 w-6 text-gray-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('annuaire.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('annuaire.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          placeholder={t('annuaire.searchPlaceholder')}
          className="pl-10 h-10 bg-white border-gray-200 focus:border-gray-400"
        />
      </div>

      {/* Filters row */}
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <Select value={sector} onValueChange={(v) => { setSector(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[160px] h-9 text-sm bg-white">
            <SelectValue placeholder={t('annuaire.allSectors')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('annuaire.allSectors')}</SelectItem>
            {sectors.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={zoneId} onValueChange={(v) => { setZoneId(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[160px] h-9 text-sm bg-white">
            <SelectValue placeholder={t('annuaire.allZones')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('annuaire.allZones')}</SelectItem>
            {zones.map(z => (
              <SelectItem key={z.id} value={z.id}>
                {z.zone_code} — {z.name_es}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View toggle + count */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400">
            {total.toLocaleString()} {t('annuaire.results')}
          </span>
          <div className="flex border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400 text-sm">{t('annuaire.noResults')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid: 2 columns */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(c => <CompanyCard key={c.id} c={c} />)}
        </div>
      ) : (
        /* List: 2 columns compact */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {items.map(c => <CompanyCard key={c.id} c={c} compact />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="ghost" size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-gray-500"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-500 tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost" size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-gray-500"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
