'use client'

import { useEffect } from 'react'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FEE_TYPE_LABELS } from '@/types/service-bundle'
import { CompanyInfoCard } from './CompanyInfoCard'
import { PaymentModeSwitcher } from './PaymentModeSwitcher'
import { ObligationRow } from './ObligationRow'
import type { UseBundleWizardReturn } from '../hooks/useBundleWizard'
import type { ObligationItem } from '../types'

interface ObligationsReviewStepProps {
  wizard: UseBundleWizardReturn
  locale: string
}

const labels = {
  title: {
    es: 'Obligaciones Fiscales',
    fr: 'Obligations Fiscales',
    en: 'Fiscal Obligations',
  },
  loading: {
    es: 'Verificando obligaciones fiscales...',
    fr: 'Verification des obligations fiscales...',
    en: 'Verifying fiscal obligations...',
  },
  alreadyComplete: {
    es: 'Todas las obligaciones ya estan pagadas para este ano fiscal.',
    fr: 'Toutes les obligations sont deja payees pour cette annee fiscale.',
    en: 'All obligations are already paid for this fiscal year.',
  },
  paymentMode: {
    es: 'Modo de pago',
    fr: 'Mode de paiement',
    en: 'Payment mode',
  },
  obligations: {
    es: 'Obligaciones',
    fr: 'Obligations',
    en: 'Obligations',
  },
  selectAll: {
    es: 'Seleccionar todo',
    fr: 'Tout selectionner',
    en: 'Select all',
  },
  deselectAll: {
    es: 'Deseleccionar todo',
    fr: 'Tout deselectionner',
    en: 'Deselect all',
  },
  totalSelected: {
    es: 'Total seleccionado',
    fr: 'Total selectionne',
    en: 'Total selected',
  },
  alreadyPaid: {
    es: 'Ya pagado',
    fr: 'Deja paye',
    en: 'Already paid',
  },
  year: {
    es: 'Ano fiscal',
    fr: 'Annee fiscale',
    en: 'Fiscal year',
  },
  backToDashboard: {
    es: 'Volver al dashboard',
    fr: 'Retour au tableau de bord',
    en: 'Back to dashboard',
  },
  pendingWarning: {
    es: 'Las obligaciones no seleccionadas quedaran pendientes. Podra pagarlas en otro momento.',
    fr: 'Les obligations non selectionnees resteront en attente. Vous pourrez les payer plus tard.',
    en: 'Unselected obligations will remain pending. You can pay them later.',
  },
} as const

function formatXAF(amount: number): string {
  return new Intl.NumberFormat('es-GQ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ObligationsReviewStep({ wizard, locale }: ObligationsReviewStepProps) {
  const lang = (locale === 'fr' ? 'fr' : locale === 'en' ? 'en' : 'es') as 'es' | 'fr' | 'en'

  // Load obligations on mount
  useEffect(() => {
    if (!wizard.licenseData && wizard.selectedCompany) {
      wizard.loadObligations()
    }
  }, [wizard.selectedCompany]) // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state
  if (wizard.isInitiating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">{labels.loading[lang]}</p>
      </div>
    )
  }

  if (!wizard.licenseData) {
    // Classification preview needs manual zone/category selection
    const preview = wizard.classificationPreview
    if (preview && (preview.needsManualZone || preview.needsManualCategory)) {
      const classLabels = {
        title: { es: 'Clasificación de la Empresa', fr: "Classification de l'Entreprise", en: 'Company Classification' },
        extracted: { es: 'Datos extraídos del documento', fr: 'Données extraites du document', en: 'Data extracted from document' },
        selectZone: { es: 'Seleccione la zona fiscal', fr: 'Sélectionnez la zone fiscale', en: 'Select the fiscal zone' },
        selectCategory: { es: 'Seleccione la categoría', fr: 'Sélectionnez la catégorie', en: 'Select the category' },
        confirm: { es: 'Confirmar y continuar', fr: 'Confirmer et continuer', en: 'Confirm and continue' },
      }
      const ed = preview.extractedData
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{classLabels.title[lang]}</h3>

          {/* Extracted data summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-1 text-sm">
            <p className="text-xs font-medium text-muted-foreground mb-2">{classLabels.extracted[lang]}</p>
            {ed.legalName && <p><span className="font-medium">Nombre:</span> {ed.legalName}</p>}
            {ed.registrationNumber && <p><span className="font-medium">N° Registro:</span> {ed.registrationNumber}</p>}
            {ed.localidad && <p><span className="font-medium">Localidad:</span> {ed.localidad}{ed.provincia ? ` (${ed.provincia})` : ''}</p>}
            {ed.formaJuridica && <p><span className="font-medium">Forma jurídica:</span> {ed.formaJuridica}</p>}
          </div>

          {/* Zone selector (if needed) */}
          {preview.needsManualZone && preview.availableZones.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{classLabels.selectZone[lang]}</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={wizard.selectedZoneId || ''}
                onChange={(e) => wizard.setSelectedZoneId(e.target.value || null)}
              >
                <option value="">--</option>
                {preview.availableZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.code} — {z.name} ({z.cities.join(', ')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category selector (if needed and zone selected) */}
          {preview.needsManualCategory && preview.availableCategories.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{classLabels.selectCategory[lang]}</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={wizard.selectedCommerceType || ''}
                onChange={(e) => wizard.setSelectedCommerceType(e.target.value || null)}
              >
                <option value="">--</option>
                {preview.availableCategories.map((c) => (
                  <option key={c.commerceType} value={c.commerceType}>
                    {c.bundleName} ({c.commerceType})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Confirm button */}
          <Button
            className="w-full"
            disabled={
              (preview.needsManualZone && !wizard.selectedZoneId) ||
              (preview.needsManualCategory && !wizard.selectedCommerceType)
            }
            onClick={() => {
              wizard.clearError()
              wizard.loadObligations()
            }}
          >
            {classLabels.confirm[lang]}
          </Button>
        </div>
      )
    }

    // Show error if obligations failed to load
    if (wizard.error) {
      return (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {wizard.error}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => {
              wizard.clearError()
              wizard.loadObligations()
            }}
          >
            {lang === 'fr' ? 'Réessayer' : lang === 'en' ? 'Retry' : 'Reintentar'}
          </Button>
        </div>
      )
    }
    return null
  }

  const { licenseData } = wizard

  // Already complete
  if (licenseData.alreadyComplete) {
    return (
      <div className="space-y-4">
        {wizard.selectedCompany && (
          <CompanyInfoCard company={wizard.selectedCompany} locale={locale} compact />
        )}
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {labels.alreadyComplete[lang]}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Group obligations by fee_type
  const groups = groupByFeeType(licenseData.obligations)
  const showCheckbox = wizard.selectedMode === 'per_line'

  // Calculate selected total
  const selectedTotal = licenseData.obligations
    .filter(o => wizard.selectedObligationIds.has(o.id))
    .reduce((sum, o) => sum + o.total, 0)

  const paidTotal = licenseData.obligations
    .filter(o => !o.isPayable)
    .reduce((sum, o) => sum + o.total, 0)

  const hasUnselected = showCheckbox &&
    wizard.selectedObligationIds.size < licenseData.obligations.filter(o => o.isPayable).length

  return (
    <div className="space-y-6">
      {/* Company summary */}
      {wizard.selectedCompany && (
        <CompanyInfoCard company={wizard.selectedCompany} locale={locale} compact />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {labels.title[lang]} — {licenseData.fiscalYear}
        </h2>
      </div>

      {/* Payment mode switcher */}
      <div>
        <h3 className="text-sm font-medium mb-3">{labels.paymentMode[lang]}</h3>
        <PaymentModeSwitcher
          value={wizard.selectedMode}
          onChange={wizard.setSelectedMode}
          locale={locale}
        />
      </div>

      <Separator />

      {/* Obligations table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">{labels.obligations[lang]}</h3>
          {showCheckbox && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={wizard.selectAllObligations}>
                {labels.selectAll[lang]}
              </Button>
              <Button variant="ghost" size="sm" onClick={wizard.deselectAllObligations}>
                {labels.deselectAll[lang]}
              </Button>
            </div>
          )}
        </div>

        {groups.map(({ feeType, obligations: groupObls }) => (
          <div key={feeType} className="mb-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {(FEE_TYPE_LABELS as Record<string, Record<string, string>>)[feeType]?.[lang] || feeType}
            </h4>

            {/* Desktop table */}
            <table className="hidden md:table w-full">
              <tbody>
                {groupObls.map((obl) => (
                  <ObligationRow
                    key={obl.id}
                    obligation={obl}
                    isSelected={wizard.selectedObligationIds.has(obl.id)}
                    onToggle={wizard.toggleObligation}
                    showCheckbox={showCheckbox}
                    locale={locale}
                  />
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {groupObls.map((obl) => (
                <ObligationRow
                  key={obl.id}
                  obligation={obl}
                  isSelected={wizard.selectedObligationIds.has(obl.id)}
                  onToggle={wizard.toggleObligation}
                  showCheckbox={showCheckbox}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Totals */}
      <div className="space-y-2">
        {paidTotal > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{labels.alreadyPaid[lang]}</span>
            <span className="tabular-nums">{formatXAF(paidTotal)} XAF</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold">
          <span>
            {labels.totalSelected[lang]}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({wizard.selectedObligationIds.size} obl.)
            </span>
          </span>
          <span className="tabular-nums">{formatXAF(selectedTotal)} XAF</span>
        </div>
      </div>

      {/* Warning for partial selection */}
      {hasUnselected && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {labels.pendingWarning[lang]}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// ── Helper: Group obligations by fee_type ─────────────────────

function groupByFeeType(
  obligations: ObligationItem[],
): Array<{ feeType: string; obligations: ObligationItem[] }> {
  const order = ['tesoro', 'municipal', 'chamber']
  const map = new Map<string, ObligationItem[]>()

  for (const obl of obligations) {
    const group = map.get(obl.feeType) || []
    group.push(obl)
    map.set(obl.feeType, group)
  }

  return order
    .filter(ft => map.has(ft))
    .map(ft => ({ feeType: ft, obligations: map.get(ft)! }))
}
