'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  MapPin, FileText, CreditCard, ChevronRight, ChevronLeft,
  Loader2, AlertCircle, Check, Printer, Calendar,
  Store, UtensilsCrossed, Coffee, Hammer, Heart,
  Music, Wrench, Palette, Building, Film,
} from 'lucide-react'
import Breadcrumb from '@/components/ui/breadcrumb'
import { bundleApi } from '@/modules/fiscal-services/services/bundle-api'
import { formatXAF } from '@/core/utils/format'
import type {
  BundleItem,
  CommerceTypeOption,
  CommerceZone,
  SimulatorResponse,
  FeeType,
} from '@/types/service-bundle'
import { FEE_TYPE_LABELS } from '@/types/service-bundle'

// ============================================================
// Commerce type SVG icons — lucide vector icons in colored circles
// ============================================================
const COMMERCE_ICONS: Record<string, { icon: typeof Store; color: string; bg: string }> = {
  abaceria:            { icon: Store,            color: 'text-blue-600',    bg: 'bg-blue-100' },
  bar_restaurante:     { icon: UtensilsCrossed,  color: 'text-amber-600',   bg: 'bg-amber-100' },
  cafeteria_pasteleria:{ icon: Coffee,           color: 'text-orange-600',  bg: 'bg-orange-100' },
  carpinteria:         { icon: Hammer,           color: 'text-yellow-700',  bg: 'bg-yellow-100' },
  clinica_farmacia:    { icon: Heart,            color: 'text-rose-600',    bg: 'bg-rose-100' },
  discoteca:           { icon: Music,            color: 'text-purple-600',  bg: 'bg-purple-100' },
  ferreteria:          { icon: Wrench,           color: 'text-slate-600',   bg: 'bg-slate-100' },
  taller_artesanal:    { icon: Palette,          color: 'text-pink-600',    bg: 'bg-pink-100' },
  taller_bloqueria:    { icon: Building,         color: 'text-teal-600',    bg: 'bg-teal-100' },
  video_club:          { icon: Film,             color: 'text-indigo-600',  bg: 'bg-indigo-100' },
}

const DEFAULT_ICON = { icon: Store, color: 'text-gray-600', bg: 'bg-gray-100' }

// Zone tier colors
const ZONE_TIER_COLORS: Record<string, string> = {
  A: 'bg-red-50 border-red-200 text-red-800 hover:border-red-400',
  B: 'bg-orange-50 border-orange-200 text-orange-800 hover:border-orange-400',
  C: 'bg-blue-50 border-blue-200 text-blue-800 hover:border-blue-400',
  D: 'bg-green-50 border-green-200 text-green-800 hover:border-green-400',
}

// Fee type section colors
const FEE_TYPE_COLORS: Record<string, { bg: string; border: string; header: string }> = {
  tesoro: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-700 text-white' },
  municipal: { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-700 text-white' },
  chamber: { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-700 text-white' },
}

// ============================================================
// Steps indicator — compact horizontal stepper
// ============================================================
function StepIndicator({ current, labels }: { current: number; labels: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {labels.map((label, i) => {
        const step = i + 1
        const isActive = step === current
        const isDone = step < current
        return (
          <div key={step} className="flex items-center gap-2">
            {i > 0 && (
              <ChevronRight className={`h-4 w-4 ${isDone ? 'text-primary' : 'text-muted-foreground/40'}`} />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isDone
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : step}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// Step 1 — Commerce type selection (professional card grid)
// ============================================================
function CommerceTypeStep({
  types,
  onSelect,
  t,
}: {
  types: CommerceTypeOption[]
  onSelect: (ct: CommerceTypeOption) => void
  t: ReturnType<typeof useTranslations>
}) {
  if (!types.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Store className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No hay tipos de comercio disponibles</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-center">{t('selectCommerce')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {types.map((ct) => {
          const iconConfig = COMMERCE_ICONS[ct.commerceType] || DEFAULT_ICON
          const Icon = iconConfig.icon
          return (
            <button
              key={ct.commerceType}
              onClick={() => onSelect(ct)}
              className="group relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-transparent bg-card hover:border-primary/60 hover:shadow-lg transition-all duration-200 text-center"
            >
              {/* Icon circle */}
              <div className={`flex items-center justify-center h-14 w-14 rounded-full ${iconConfig.bg} transition-transform group-hover:scale-110`}>
                <Icon className={`h-7 w-7 ${iconConfig.color}`} strokeWidth={1.8} />
              </div>

              {/* Name */}
              <span className="text-sm font-medium leading-tight group-hover:text-primary transition-colors min-h-[2.5rem] flex items-center">
                {ct.nameEs}
              </span>

              {/* Plazos badge — fixed at bottom for alignment */}
              <div className="h-5">
                {ct.installmentEligible && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0 font-medium">
                    <CreditCard className="h-3 w-3 mr-0.5" />
                    Plazos
                  </Badge>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Step 2 — Zone selection
// ============================================================
function ZoneStep({
  zones,
  commerceType,
  onSelect,
  onBack,
  t,
}: {
  zones: CommerceZone[]
  commerceType: CommerceTypeOption
  onSelect: (z: CommerceZone) => void
  onBack: () => void
  t: ReturnType<typeof useTranslations>
}) {
  const tiers = zones.reduce<Record<string, CommerceZone[]>>((acc, z) => {
    const tier = z.zoneTier
    if (!acc[tier]) acc[tier] = []
    acc[tier].push(z)
    return acc
  }, {})

  const tierLabels: Record<string, string> = {
    A: t('zoneTierA'),
    B: t('zoneTierB'),
    C: t('zoneTierC'),
    D: t('zoneTierD'),
  }

  const iconConfig = COMMERCE_ICONS[commerceType.commerceType] || DEFAULT_ICON
  const Icon = iconConfig.icon

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('changeCommerce')}
        </Button>
        <Badge variant="outline" className="text-sm gap-1.5 py-1 px-3">
          <Icon className={`h-4 w-4 ${iconConfig.color}`} strokeWidth={1.8} />
          {commerceType.nameEs}
        </Badge>
      </div>

      <h2 className="text-xl font-semibold mb-6 text-center">{t('selectZone')}</h2>

      <div className="space-y-5">
        {['A', 'B', 'C', 'D'].map((tier) => {
          const tierZones = tiers[tier] || []
          if (!tierZones.length) return null
          return (
            <div key={tier}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {tierLabels[tier] || tier}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tierZones.map((z) => (
                  <button
                    key={z.id}
                    onClick={() => onSelect(z)}
                    className={`p-3 rounded-lg border-2 text-center transition-all hover:shadow-md active:scale-[0.98] ${ZONE_TIER_COLORS[tier] || 'bg-muted'}`}
                  >
                    <div className="text-lg font-bold">{z.zoneCode}</div>
                    <div className="text-xs leading-tight mt-0.5">{z.descriptionEs || z.nameEs}</div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Helper: group items by ministry within a fee group
// ============================================================
interface MinistryGroup {
  ministryName: string
  items: BundleItem[]
  subtotal: number
}

function groupByMinistry(items: BundleItem[]): MinistryGroup[] {
  const map = new Map<string, BundleItem[]>()
  for (const item of items) {
    const key = item.ministryName || '—'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return Array.from(map.entries()).map(([ministryName, grpItems]) => ({
    ministryName,
    items: grpItems,
    subtotal: grpItems.reduce((s, it) => s + (typeof it.amount === 'string' ? parseFloat(it.amount) : it.amount), 0),
  }))
}

// ============================================================
// Step 3 — Pricing result (grouped by ministry + print layout)
// ============================================================
function PricingResult({
  data,
  commerceType,
  zone,
  onBack,
  t,
  locale,
}: {
  data: SimulatorResponse
  commerceType: CommerceTypeOption
  zone: CommerceZone
  onBack: () => void
  t: ReturnType<typeof useTranslations>
  locale: string
}) {
  const iconConfig = COMMERCE_ICONS[commerceType.commerceType] || DEFAULT_ICON
  const Icon = iconConfig.icon

  const printDate = new Date().toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-GQ',
    { year: 'numeric', month: 'long', day: 'numeric' },
  )

  return (
    <div className="space-y-5">
      {/* ---- PRINT HEADER (hidden on screen, visible on print) ---- */}
      <div className="hidden print:block mb-6">
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <h1 className="text-xl font-bold tracking-wide">FACIL — {t('title')}</h1>
          <p className="text-xs mt-1 text-gray-600">
            {t('legalReference')}: {data.bundle.legalReference || 'Decreto Presidencial'}
          </p>
        </div>
        <div className="flex justify-between text-xs text-gray-700 mb-4">
          <div>
            <strong>{t('stepCommerce')}:</strong> {commerceType.nameEs}
          </div>
          <div>
            <strong>{t('stepZone')}:</strong> {zone.zoneCode} — {zone.descriptionEs || zone.nameEs}
          </div>
          <div>{printDate}</div>
        </div>
      </div>

      {/* ---- SCREEN-ONLY: header with context ---- */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('changeZone')}
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 py-1 px-3">
            <Icon className={`h-3.5 w-3.5 ${iconConfig.color}`} strokeWidth={1.8} />
            {commerceType.nameEs}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <MapPin className="h-3 w-3" />
            {zone.zoneCode} — {zone.descriptionEs || zone.nameEs}
          </Badge>
        </div>
      </div>

      {/* Legal reference (screen only — print header already has it) */}
      {data.bundle.legalReference && (
        <p className="text-xs text-muted-foreground text-center print:hidden">
          {t('legalReference')}: {data.bundle.legalReference}
        </p>
      )}

      {/* Fee type sections — grouped by ministry */}
      <div className="space-y-4 print:space-y-3">
        {data.feeGroups.map((group) => {
          const colors = FEE_TYPE_COLORS[group.feeType] || FEE_TYPE_COLORS.tesoro
          const feeLabel = FEE_TYPE_LABELS[group.feeType as FeeType]?.[locale as 'es' | 'fr' | 'en'] || group.labelEs
          const ministryGroups = groupByMinistry(group.items)
          const hasMultipleMinistries = ministryGroups.length > 1

          return (
            <Card key={group.feeType} className={`${colors.border} border print:border print:border-gray-400 print:shadow-none`}>
              {/* Section header */}
              <div className={`${colors.header} px-4 py-2.5 rounded-t-lg print:bg-gray-800 print:text-white print:rounded-none`}>
                <h3 className="font-semibold text-sm tracking-wide">
                  {feeLabel}
                </h3>
              </div>
              <div className="divide-y print:divide-gray-300">
                {ministryGroups.map((mGroup, mIdx) => (
                  <div key={mGroup.ministryName}>
                    {/* Ministry sub-header — always shown */}
                    <div className="px-4 py-1.5 bg-muted/40 print:bg-gray-100">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground print:text-gray-700">
                        {mGroup.ministryName}
                      </span>
                    </div>
                    {/* Items */}
                    {mGroup.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm print:py-1.5 print:text-xs">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{item.serviceName}</span>
                        </div>
                        <span className="font-semibold tabular-nums ml-4 whitespace-nowrap">
                          {formatXAF(item.amount, locale)}
                        </span>
                      </div>
                    ))}
                    {/* Ministry subtotal (only if multiple ministries) */}
                    {hasMultipleMinistries && (
                      <div className="flex items-center justify-between px-4 py-1.5 text-xs text-muted-foreground print:text-gray-600">
                        <span className="italic pl-2">
                          Subtotal {mGroup.ministryName}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {formatXAF(mGroup.subtotal, locale)}
                        </span>
                      </div>
                    )}
                    {/* Separator between ministry groups */}
                    {hasMultipleMinistries && mIdx < ministryGroups.length - 1 && (
                      <div className="border-t border-dashed border-gray-200 print:border-gray-300" />
                    )}
                  </div>
                ))}
                {/* Section subtotal */}
                <div className={`flex items-center justify-between px-4 py-2.5 ${colors.bg} print:bg-gray-100 print:font-bold`}>
                  <span className="text-sm font-semibold">Sub-Total {feeLabel}</span>
                  <span className="font-bold tabular-nums">
                    {formatXAF(group.subtotal, locale)}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Grand total */}
      <Card className="border-2 border-amber-300 bg-amber-50 print:border-2 print:border-black print:bg-gray-50">
        <div className="flex items-center justify-between px-5 py-4 print:py-3">
          <span className="text-lg font-bold print:text-base">{t('totalGeneral')}</span>
          <span className="text-2xl font-extrabold text-amber-900 tabular-nums print:text-black print:text-xl">
            {formatXAF(data.grandTotal, locale)}
          </span>
        </div>
      </Card>

      {/* Installment preview */}
      {data.installmentPreview && (
        <Card className="print:border print:border-gray-400 print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary print:hidden" />
              {t('installmentTitle')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t('installmentDesc')}</p>
          </CardHeader>
          <CardContent>
            <div className="divide-y print:divide-gray-300">
              {data.installmentPreview.installments.map((inst) => (
                <div key={inst.installmentNumber} className="flex items-center justify-between py-2.5 text-sm print:py-1.5 print:text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground print:hidden" />
                    <span>
                      {t('installmentOf', {
                        number: inst.installmentNumber,
                        total: data.installmentPreview!.numInstallments,
                      })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('dueDate')}: {inst.dueDate}
                    </span>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {formatXAF(inst.amountDue, locale)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {data.documents.length > 0 && (
        <Card className="print:border print:border-gray-400 print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary print:hidden" />
              {t('documentsRequired')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 print:space-y-0.5">
              {data.documents.map((doc, i) => (
                <li key={doc.documentTemplateId} className="flex items-start gap-2 text-sm print:text-xs">
                  <span className="flex-shrink-0 font-mono text-xs text-muted-foreground w-5 text-right">
                    {i + 1}.
                  </span>
                  <span className="flex-1">{doc.documentNameEs}</span>
                  <Badge variant={doc.isRequired ? 'default' : 'secondary'} className="text-[10px] flex-shrink-0 print:border print:border-gray-400 print:bg-transparent print:text-black">
                    {doc.isRequired ? t('documentRequired') : t('documentOptional')}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Print footer (hidden on screen) */}
      <div className="hidden print:block mt-6 pt-3 border-t border-gray-300 text-center text-[10px] text-gray-500">
        <p>FACIL — Plataforma de Servicios Fiscales de Guinea Ecuatorial</p>
        <p>Documento informativo generado el {printDate}. Los precios pueden estar sujetos a modificaciones.</p>
      </div>

      {/* Print action (hidden on print) */}
      <div className="flex justify-center pt-2 print:hidden">
        <Button size="lg" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          {t('print')}
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// Main page component
// ============================================================
function LicenciasContent() {
  const params = useParams()
  const locale = (params?.locale as string) || 'es'
  const t = useTranslations('licenses')
  const tNav = useTranslations('nav')

  const [step, setStep] = useState(1)
  const [commerceTypes, setCommerceTypes] = useState<CommerceTypeOption[]>([])
  const [zones, setZones] = useState<CommerceZone[]>([])
  const [selectedCommerce, setSelectedCommerce] = useState<CommerceTypeOption | null>(null)
  const [selectedZone, setSelectedZone] = useState<CommerceZone | null>(null)
  const [simulatorResult, setSimulatorResult] = useState<SimulatorResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // AbortController ref — cancels in-flight requests on unmount
  const abortRef = useRef<AbortController | null>(null)

  // Retry helper with exponential backoff (handles Cloud Run cold starts)
  const fetchWithRetry = useCallback(async <T,>(
    fn: () => Promise<T>,
    retries = 3,
    baseDelay = 1500,
  ): Promise<T> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      // Check if aborted
      if (abortRef.current?.signal.aborted) throw new Error('Aborted')
      try {
        return await fn()
      } catch (e) {
        if (abortRef.current?.signal.aborted) throw new Error('Aborted')
        if (attempt === retries - 1) throw e
        await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)))
      }
    }
    throw new Error('Unreachable')
  }, [])

  // Initial data load with auto-retry
  const loadData = useCallback(async () => {
    // Cancel any previous in-flight request
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    try {
      const [types, zoneList] = await Promise.all([
        fetchWithRetry(() => bundleApi.listCommerceTypes()),
        fetchWithRetry(() => bundleApi.listZones()),
      ])
      if (!abortRef.current?.signal.aborted) {
        setCommerceTypes(types)
        setZones(zoneList)
      }
    } catch (e) {
      if (abortRef.current?.signal.aborted) return
      console.error('Failed to load bundle data:', e)
      setError('loadError')
    } finally {
      if (!abortRef.current?.signal.aborted) {
        setLoading(false)
      }
    }
  }, [fetchWithRetry])

  useEffect(() => {
    loadData()
    return () => { abortRef.current?.abort() }
  }, [loadData])

  // Handle commerce type selection
  const handleCommerceSelect = useCallback((ct: CommerceTypeOption) => {
    setSelectedCommerce(ct)
    setStep(2)
  }, [])

  // Handle zone selection → trigger simulator
  const handleZoneSelect = useCallback(
    async (zone: CommerceZone) => {
      if (!selectedCommerce) return
      setSelectedZone(zone)
      setStep(3)
      setSimulating(true)
      setError(null)
      setSimulatorResult(null)
      try {
        const result = await bundleApi.simulate(selectedCommerce.commerceType, zone.zoneCode)
        if (!abortRef.current?.signal.aborted) {
          setSimulatorResult(result)
        }
      } catch (e) {
        if (abortRef.current?.signal.aborted) return
        console.error('Simulator failed:', e)
        setError('simError')
      } finally {
        if (!abortRef.current?.signal.aborted) {
          setSimulating(false)
        }
      }
    },
    [selectedCommerce]
  )

  const breadcrumbItems = [
    { label: tNav('home'), href: `/${locale}` },
    { label: t('title') },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl print:px-0 print:py-0 print:max-w-none">
      <div className="print:hidden">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="text-center mb-6 mt-4 print:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      <div className="print:hidden">
        <StepIndicator
          current={step}
          labels={[t('stepCommerce'), t('stepZone'), t('stepResult')]}
        />
      </div>

      {/* Error: initial load failure */}
      {error === 'loadError' && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{t('loadError')}</span>
            <Button variant="outline" size="sm" onClick={loadData} className="ml-3 shrink-0">
              {t('retry')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Error: simulation failure (step 3) — show with retry to step 2 */}
      {error === 'simError' && step === 3 && !simulating && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{t('noResults')}</span>
            <Button variant="outline" size="sm" onClick={() => { setStep(2); setError(null) }} className="ml-3 shrink-0">
              {t('changeZone')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Step 1: Commerce type */}
      {step === 1 && !error && (
        <CommerceTypeStep
          types={commerceTypes}
          onSelect={handleCommerceSelect}
          t={t}
        />
      )}

      {/* Step 2: Zone */}
      {step === 2 && selectedCommerce && (
        <ZoneStep
          zones={zones}
          commerceType={selectedCommerce}
          onSelect={handleZoneSelect}
          onBack={() => setStep(1)}
          t={t}
        />
      )}

      {/* Step 3: Loading */}
      {step === 3 && simulating && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">{t('loading')}</span>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && !simulating && simulatorResult && selectedCommerce && selectedZone && (
        <PricingResult
          data={simulatorResult}
          commerceType={selectedCommerce}
          zone={selectedZone}
          onBack={() => {
            setStep(2)
            setSimulatorResult(null)
          }}
          t={t}
          locale={locale}
        />
      )}
    </div>
  )
}

export default function LicenciasPage() {
  return <LicenciasContent />
}
