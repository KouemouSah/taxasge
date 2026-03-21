import type { InspectionStatus, InspectionResult, SealReason } from '../types'

export const INSPECTION_STATUS_CONFIG: Record<
  InspectionStatus,
  { label: string; color: string; bgColor: string }
> = {
  in_progress: { label: 'En curso', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  completed: { label: 'Completada', color: 'text-green-700', bgColor: 'bg-green-100' },
  mise_en_demeure: { label: 'Mise en demeure', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  seal_proposed: { label: 'Scellé propuesto', color: 'text-red-700', bgColor: 'bg-red-100' },
  seal_approved: { label: 'Sellada', color: 'text-red-900', bgColor: 'bg-red-200' },
  seal_rejected: { label: 'Scellé rechazado', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  cancelled: { label: 'Cancelada', color: 'text-gray-500', bgColor: 'bg-gray-50' },
}

export const RESULT_CONFIG: Record<
  InspectionResult,
  { label: string; color: string; icon: string }
> = {
  conforme: { label: 'Conforme', color: 'text-green-600', icon: 'CheckCircle2' },
  non_conforme: { label: 'No conforme', color: 'text-red-600', icon: 'XCircle' },
  pending: { label: 'Pendiente', color: 'text-yellow-600', icon: 'Clock' },
}

export const SEAL_REASON_LABELS: Record<SealReason, string> = {
  non_paiement_apres_med: 'Impago tras mise en demeure',
  activite_non_autorisee: 'Actividad no autorizada',
  fraude_fiscale: 'Fraude fiscal',
  faux_documents: 'Documentos falsificados',
  refus_controle: 'Rechazo de inspección',
  non_conformite_grave: 'No conformidad grave',
  decision_judiciaire: 'Decisión judicial',
  ordre_ministeriel: 'Orden ministerial',
}

export function fmtXAF(amount: number | undefined | null, locale = 'es'): string {
  if (amount == null) return '0 XAF'
  return new Intl.NumberFormat(locale === 'en' ? 'en-GQ' : locale === 'fr' ? 'fr-GQ' : 'es-GQ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' XAF'
}
