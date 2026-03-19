'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Building2, Search, MapPin, ChevronLeft, ChevronRight, Filter,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { companyPublicApi } from '@/modules/companies/services/api'
import type { PublicCompany, PublicZone } from '@/modules/companies/types'

const PAGE_SIZE = 20

const REGIME_COLORS: Record<string, string> = {
  bundle: 'bg-green-100 text-green-800',
  declarativo: 'bg-blue-100 text-blue-800',
  exento: 'bg-gray-100 text-gray-700',
  pendiente: 'bg-yellow-100 text-yellow-800',
}

export default function AnnuairePage() {
  const t = useTranslations('public')

  // State
  const [query, setQuery] = useState('')
  const [zoneId, setZoneId] = useState<string>('')
  const [sector, setSector] = useState<string>('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<PublicCompany[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [zones, setZones] = useState<PublicZone[]>([])
  const [sectors, setSectors] = useState<string[]>([])
  const debounceRef = useRef<NodeJS.Timeout>()
  const seqRef = useRef(0)

  // Load filter options
  useEffect(() => {
    companyPublicApi.getZones().then(setZones).catch(() => {})
    companyPublicApi.getSectors().then(setSectors).catch(() => {})
  }, [])

  // Search with debounce
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
      if (seq === seqRef.current) {
        setItems([])
        setTotal(0)
      }
    } finally {
      if (seq === seqRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query, zoneId, sector, page), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, zoneId, sector, page, doSearch])

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          {t('annuaire.title')}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          {t('annuaire.subtitle')}
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          placeholder={t('annuaire.searchPlaceholder')}
          className="pl-10 h-12 text-lg"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
        </div>
        <Select value={zoneId} onValueChange={(v) => { setZoneId(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[200px]">
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
        <Select value={sector} onValueChange={(v) => { setSector(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={t('annuaire.allSectors')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('annuaire.allSectors')}</SelectItem>
            {sectors.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center ml-auto">
          {total.toLocaleString()} {t('annuaire.results')}
        </span>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          {t('annuaire.loading')}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t('annuaire.noResults')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{c.legal_name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      {c.nif && (
                        <span className="font-mono">NIF: {c.nif}</span>
                      )}
                      {c.registration_number && (
                        <span className="font-mono">{c.registration_number}</span>
                      )}
                      {c.city_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {c.city_name}{c.provincia ? `, ${c.provincia}` : ''}
                        </span>
                      )}
                    </div>
                    {c.sector_actividad && (
                      <p className="text-sm mt-1">
                        <span className="text-muted-foreground">{c.sector_actividad}</span>
                        {c.subsector_actividad && (
                          <span className="text-muted-foreground"> / {c.subsector_actividad}</span>
                        )}
                      </p>
                    )}
                    {c.objeto_social && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {c.objeto_social}
                      </p>
                    )}
                    {c.address && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.address}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {c.regimen_fiscal && (
                      <Badge className={REGIME_COLORS[c.regimen_fiscal] || 'bg-gray-100'}>
                        {c.regimen_fiscal}
                      </Badge>
                    )}
                    {c.zone_code && (
                      <Badge variant="outline" className="text-xs">
                        {c.zone_code}
                      </Badge>
                    )}
                    {c.forma_juridica && (
                      <span className="text-xs text-muted-foreground">{c.forma_juridica}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline" size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline" size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
