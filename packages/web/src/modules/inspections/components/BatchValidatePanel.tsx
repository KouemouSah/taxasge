'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckSquare, Loader2, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { inspectionApi } from '../services/api'
import { fmtXAF } from '../utils/formatters'
import type { FieldPayment } from '../types'

// ---------------------------------------------------------------------------
// Selection Hook
// ---------------------------------------------------------------------------

export function usePaymentSelection(payments: FieldPayment[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === payments.length) {
        return new Set()
      }
      return new Set(payments.map((p) => p.id))
    })
  }, [payments])

  const isSelected = useCallback(
    (id: string) => selected.has(id),
    [selected],
  )

  const isAllSelected = payments.length > 0 && selected.size === payments.length

  const clearSelection = useCallback(() => {
    setSelected(new Set())
  }, [])

  const selectedPayments = useMemo(
    () => payments.filter((p) => selected.has(p.id)),
    [payments, selected],
  )

  const selectedCount = selected.size

  const selectedTotal = useMemo(
    () => selectedPayments.reduce((sum, p) => sum + p.total_amount, 0),
    [selectedPayments],
  )

  return {
    selected,
    toggleOne,
    toggleAll,
    isSelected,
    isAllSelected,
    clearSelection,
    selectedPayments,
    selectedCount,
    selectedTotal,
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BatchValidatePanelProps {
  payments: FieldPayment[]
  onPaymentValidated: (paymentId: string) => void
  onBatchComplete: () => void
  selection: ReturnType<typeof usePaymentSelection>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_PREVIEW_ITEMS = 5

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BatchValidatePanel({
  payments,
  onPaymentValidated,
  onBatchComplete,
  selection,
}: BatchValidatePanelProps) {
  const t = useTranslations('inspection')
  const { toast } = useToast()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [validating, setValidating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressTotal, setProgressTotal] = useState(0)
  const abortRef = useRef(false)

  const {
    toggleAll,
    isAllSelected,
    clearSelection,
    selectedPayments,
    selectedCount,
    selectedTotal,
  } = selection

  // -----------------------------------------------------------------------
  // Open confirmation panel
  // -----------------------------------------------------------------------

  const handleOpenConfirm = useCallback(() => {
    if (selectedCount === 0) return
    setConfirmOpen(true)
  }, [selectedCount])

  const handleCancelConfirm = useCallback(() => {
    setConfirmOpen(false)
  }, [])

  // -----------------------------------------------------------------------
  // Batch validate execution
  // -----------------------------------------------------------------------

  const handleConfirmValidate = useCallback(async () => {
    const toValidate = [...selectedPayments]
    if (toValidate.length === 0) return

    setValidating(true)
    setProgress(0)
    setProgressTotal(toValidate.length)
    abortRef.current = false

    let successCount = 0

    for (let i = 0; i < toValidate.length; i++) {
      if (abortRef.current) break

      const payment = toValidate[i]
      try {
        await inspectionApi.validateFieldReconciliation(payment.id)
        onPaymentValidated(payment.id)
        successCount++
      } catch {
        toast({
          variant: 'destructive',
          title: `${payment.payment_reference}`,
          description: t('payments.validate') + ' — Error',
        })
      }
      setProgress(i + 1)
    }

    setValidating(false)
    setConfirmOpen(false)
    clearSelection()

    if (successCount > 0) {
      toast({
        title: `${successCount} ${t('payments.validated')}`,
        description: t('payments.routedDesc'),
      })
    }

    onBatchComplete()
  }, [
    selectedPayments,
    onPaymentValidated,
    onBatchComplete,
    clearSelection,
    t,
    toast,
  ])

  // -----------------------------------------------------------------------
  // Derived
  // -----------------------------------------------------------------------

  const previewItems = selectedPayments.slice(0, MAX_PREVIEW_ITEMS)
  const overflowCount = selectedPayments.length - MAX_PREVIEW_ITEMS
  const progressPct =
    progressTotal > 0 ? Math.round((progress / progressTotal) * 100) : 0

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <Collapsible open={confirmOpen} onOpenChange={setConfirmOpen}>
      {/* ---- Sticky header bar ---- */}
      <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
        {/* Select all checkbox */}
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={() => toggleAll()}
            disabled={validating || payments.length === 0}
          />
          <span className="text-xs text-muted-foreground">
            {isAllSelected
              ? t('payments.batchDeselectAll')
              : t('payments.batchSelectAll')}
          </span>
        </label>

        {/* Selected count badge */}
        {selectedCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedCount} {t('payments.batchSelected')}
          </Badge>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Validate selection button */}
        {validating ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              {t('payments.batchValidating')} {progress}/{progressTotal}
            </span>
          </div>
        ) : (
          <CollapsibleTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={selectedCount === 0}
              onClick={handleOpenConfirm}
            >
              <CheckSquare className="h-4 w-4" />
              {t('payments.batchValidate')}
            </Button>
          </CollapsibleTrigger>
        )}
      </div>

      {/* ---- Collapsible confirmation panel ---- */}
      <CollapsibleContent>
        <div className="mt-2 rounded-lg border bg-card p-4">
          {/* Progress bar during validation */}
          {validating && (
            <div className="mb-4">
              <Progress value={progressPct} className="h-2" />
              <p className="mt-1 text-center text-xs text-muted-foreground">
                {t('payments.batchValidating')} {progress}/{progressTotal}
              </p>
            </div>
          )}

          {!validating && (
            <>
              {/* Summary */}
              <div className="mb-3 flex items-start gap-2">
                <h4 className="text-sm font-semibold">
                  {t('payments.batchConfirmTitle')}
                </h4>
              </div>

              {/* Info box */}
              <div className="mb-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t('payments.batchConfirmDesc')
                    .replace('{count}', String(selectedCount))
                    .replace('{amount}', fmtXAF(selectedTotal))}
                </p>
              </div>

              {/* Preview list of selected items */}
              {previewItems.length > 0 && (
                <div className="mb-3 space-y-1">
                  {previewItems.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded px-2 py-1 text-xs odd:bg-muted/30"
                    >
                      <Check className="h-3 w-3 shrink-0 text-green-600" />
                      <span className="font-mono">
                        {p.payment_reference}
                      </span>
                      <span className="truncate text-muted-foreground">
                        {p.agent_name}
                      </span>
                      <span className="ml-auto shrink-0 font-medium">
                        {fmtXAF(p.total_amount)}
                      </span>
                    </div>
                  ))}
                  {overflowCount > 0 && (
                    <p className="px-2 text-xs text-muted-foreground">
                      +{overflowCount} ...
                    </p>
                  )}
                </div>
              )}

              <Separator className="my-3" />

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleCancelConfirm}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handleConfirmValidate}
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  {t('payments.validate')} ({selectedCount})
                </Button>
              </div>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
