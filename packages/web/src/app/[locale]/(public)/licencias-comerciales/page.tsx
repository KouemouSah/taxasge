'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  MapPin, FileText, CreditCard, ChevronRight, ChevronLeft,
  Loader2, AlertCircle, Check, Printer, Calendar,
} from 'lucide-react'
import Breadcrumb from '@/components/ui/breadcrumb'
import { bundleApi } from '@/modules/fiscal-services/services/bundle-api'
import { formatXAF } from '@/core/utils/format'
import type {
  CommerceTypeOption,
  CommerceZone,
  SimulatorResponse,
  FeeType,
} from '@/types/service-bundle'
import { FEE_TYPE_LABELS } from '@/types/service-bundle'

// ============================================================
// Commerce type icons mapping
// ============================================================
const COMMERCE_ICONS: Record<string, string> = {
  abaceria: '🏪',
  bar_restaurante: '🍽️',
  cafeteria_pasteleria: '☕',
  carpinteria: '🪚',
  clinica_farmacia: '🏥',
  discoteca: '🎵',
  ferreteria: '🔧',
  taller_artesanal: '🎨',
  taller_bloqueria: '🏗️',
  video_club: '📀',
}

// Zone tier colors
const ZONE_TIER_COLORS: Record<string, string> = {
  A: 'bg-red-50 border-red-200 text-red-800',
  B: 'bg-orange-50 border-orange-200 text-orange-800',
  C: 'bg-blue-50 border-blue-200 text-blue-800',
  D: 'bg-green-50 border-green-200 text-green-800',
}

// Fee type section colors
const FEE_TYPE_COLORS: Record<string, { bg: string; border: string; header: string }> = {
  tesoro: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-700 text-white' },
  municipal: { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-700 text-white' },
  chamber: { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-700 text-white' },
}

// ============================================================
// Steps indicator
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
// Step 1 — Commerce type selection
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
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-center">{t('selectCommerce')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {types.map((ct) => (
          <button
            key={ct.commerceType}
            onClick={() => onSelect(ct)}
            className="group flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent bg-card hover:border-primary hover:shadow-md transition-all text-center"
          >
            <span className="text-3xl" role="img" aria-hidden>
              {COMMERCE_ICONS[ct.commerceType] || '🏢'}
            </span>
            <span className="text-sm font-medium group-hover:text-primary transition-colors leading-tight">
              {ct.nameEs}
            </span>
            {ct.installmentEligible && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                <CreditCard className="h-3 w-3 mr-0.5" />
                Plazos
              </Badge>
            )}
          </button>
        ))}
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
  // Group zones by tier
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('changeCommerce')}
        </Button>
        <Badge variant="outline" className="text-sm">
          {COMMERCE_ICONS[commerceType.commerceType] || '🏢'} {commerceType.nameEs}
        </Badge>
      </div>

      <h2 className="text-xl font-semibold mb-6 text-center">{t('selectZone')}</h2>

      <div className="space-y-4">
        {['A', 'B', 'C', 'D'].map((tier) => {
          const tierZones = tiers[tier] || []
          if (!tierZones.length) return null
          return (
            <div key={tier}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {tierLabels[tier] || tier}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {tierZones.map((z) => (
                  <button
                    key={z.id}
                    onClick={() => onSelect(z)}
                    className={`p-3 rounded-lg border-2 text-center transition-all hover:shadow-md hover:scale-[1.02] ${ZONE_TIER_COLORS[tier] || 'bg-muted'}`}
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
// Step 3 — Pricing result
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
  return (
    <div className="space-y-6">
      {/* Header with context */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('changeZone')}
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {COMMERCE_ICONS[commerceType.commerceType] || '🏢'} {commerceType.nameEs}
          </Badge>
          <Badge variant="secondary">
            <MapPin className="h-3 w-3 mr-1" />
            {zone.zoneCode} — {zone.descriptionEs || zone.nameEs}
          </Badge>
        </div>
      </div>

      {/* Legal reference */}
      {data.bundle.legalReference && (
        <p className="text-xs text-muted-foreground text-center">
          {t('legalReference')}: {data.bundle.legalReference}
        </p>
      )}

      {/* Fee type sections */}
      <div className="space-y-4">
        {data.feeGroups.map((group) => {
          const colors = FEE_TYPE_COLORS[group.feeType] || FEE_TYPE_COLORS.tesoro
          const feeLabel = FEE_TYPE_LABELS[group.feeType as FeeType]?.[locale as 'es' | 'fr' | 'en'] || group.labelEs
          return (
            <Card key={group.feeType} className={`${colors.border} border`}>
              <div className={`${colors.header} px-4 py-2.5 rounded-t-lg`}>
                <h3 className="font-semibold text-sm tracking-wide">
                  {feeLabel}
                </h3>
              </div>
              <div className="divide-y">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{item.serviceName}</span>
                      {item.ministryName && (
                        <span className="text-muted-foreground ml-2 text-xs hidden sm:inline">
                          ({item.ministryName})
                        </span>
                      )}
                    </div>
                    <span className="font-semibold tabular-nums ml-4 whitespace-nowrap">
                      {formatXAF(item.amount, locale)}
                    </span>
                  </div>
                ))}
                {/* Subtotal */}
                <div className={`flex items-center justify-between px-4 py-2.5 ${colors.bg}`}>
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
      <Card className="border-2 border-amber-300 bg-amber-50">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-lg font-bold">{t('totalGeneral')}</span>
          <span className="text-2xl font-extrabold text-amber-900 tabular-nums">
            {formatXAF(data.grandTotal, locale)}
          </span>
        </div>
      </Card>

      {/* Installment preview */}
      {data.installmentPreview && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              {t('installmentTitle')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t('installmentDesc')}</p>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.installmentPreview.installments.map((inst) => (
                <div key={inst.installmentNumber} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {t('documentsRequired')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {data.documents.map((doc, i) => (
                <li key={doc.documentTemplateId} className="flex items-start gap-2 text-sm">
                  <span className="flex-shrink-0 font-mono text-xs text-muted-foreground w-5 text-right">
                    {i + 1}.
                  </span>
                  <span className="flex-1">{doc.documentNameEs}</span>
                  <Badge variant={doc.isRequired ? 'default' : 'secondary'} className="text-[10px] flex-shrink-0">
                    {doc.isRequired ? t('documentRequired') : t('documentOptional')}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
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

  // Initial data load
  useEffect(() => {
    async function load() {
      try {
        const [types, zoneList] = await Promise.all([
          bundleApi.listCommerceTypes(),
          bundleApi.listZones(),
        ])
        setCommerceTypes(types)
        setZones(zoneList)
      } catch (e) {
        console.error('Failed to load bundle data:', e)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
      try {
        const result = await bundleApi.simulate(selectedCommerce.commerceType, zone.zoneCode)
        setSimulatorResult(result)
      } catch (e) {
        console.error('Simulator failed:', e)
        setError(t('noResults'))
      } finally {
        setSimulating(false)
      }
    },
    [selectedCommerce, t]
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
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Breadcrumb items={breadcrumbItems} />

      <div className="text-center mb-6 mt-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      <StepIndicator
        current={step}
        labels={[t('stepCommerce'), t('stepZone'), t('stepResult')]}
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Commerce type */}
      {step === 1 && (
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

      {/* Step 3: Result */}
      {step === 3 && simulating && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">{t('loading')}</span>
        </div>
      )}

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
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LicenciasContent />
    </Suspense>
  )
}
