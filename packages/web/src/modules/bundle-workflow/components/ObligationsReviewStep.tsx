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
              {FEE_TYPE_LABELS[feeType]?.[lang] || feeType}
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
