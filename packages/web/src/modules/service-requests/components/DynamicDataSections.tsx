'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Calendar, FileText } from 'lucide-react'

export interface DataSectionField {
  label: string
  value?: string | null
}

export interface DataSection {
  title: string
  fields: DataSectionField[]
}

interface HighlightBlockData {
  paymentStatus?: string | null
  paymentReference?: string | null
  receiptNumber?: string | null
  tariff?: Record<string, unknown> | null
  appointment?: {
    date?: string | null
    time?: string | null
    location?: string | null
  } | null
}

interface DynamicDataSectionsProps {
  sections: DataSection[]
  photoUrl?: string | null
  highlight?: HighlightBlockData
  locale?: string
}

// Payment status color mapping
const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  pending_agent_review: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  failed: { bg: 'bg-red-100', text: 'text-red-800' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
}

const PAYMENT_STATUS_LABELS: Record<string, Record<string, string>> = {
  pending: { es: 'Pendiente', fr: 'En attente', en: 'Pending' },
  pending_agent_review: { es: 'Revisión agente', fr: "Révision agent", en: 'Agent review' },
  processing: { es: 'Procesando', fr: 'En cours', en: 'Processing' },
  approved: { es: 'Aprobado', fr: 'Approuvé', en: 'Approved' },
  completed: { es: 'Completado', fr: 'Complété', en: 'Completed' },
  rejected: { es: 'Rechazado', fr: 'Rejeté', en: 'Rejected' },
  failed: { es: 'Fallido', fr: 'Échoué', en: 'Failed' },
  cancelled: { es: 'Cancelado', fr: 'Annulé', en: 'Cancelled' },
}

/**
 * Renders dynamic data sections from the backend (same data as PDF).
 *
 * Layout rules:
 * - First section with <= 2 fields rendered as inline subtitle
 * - Photo placed on the first section with > 5 fields (personal data)
 * - Value-length heuristic: <= 12 chars → 25% (col-span-1), > 12 → 50% (col-span-2)
 * - Adjacent small sections (<=3 fields each) rendered side-by-side
 * - Sections with "Anterior" in title extracted as highlight block
 * - 3 essential highlight blocks (Pago/Cita/Anterior) with colored backgrounds
 */
export function DynamicDataSections({
  sections,
  photoUrl,
  highlight,
  locale = 'es',
}: DynamicDataSectionsProps) {
  if (!sections.length) return null

  // Find "Anterior" section (Pasaporte Anterior, Permiso Anterior, etc.)
  const anteriorIndex = sections.findIndex(s =>
    s.title.toLowerCase().includes('anterior')
  )
  const anteriorSection = anteriorIndex >= 0 ? sections[anteriorIndex] : null

  // Build highlight blocks
  const highlightBlocks: React.ReactNode[] = []

  // Payment block
  if (highlight?.paymentStatus || highlight?.tariff) {
    const status = highlight.paymentStatus || 'pending'
    const statusColors = PAYMENT_STATUS_COLORS[status] || PAYMENT_STATUS_COLORS.pending
    const statusLabel = PAYMENT_STATUS_LABELS[status]?.[locale] || status
    const amount = highlight.tariff?.total_amount as number | undefined
    const currency = (highlight.tariff?.currency as string) || 'XAF'

    highlightBlocks.push(
      <div key="payment" className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-800">
            {locale === 'fr' ? 'Paiement' : locale === 'en' ? 'Payment' : 'Pago'}
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge className={`${statusColors.bg} ${statusColors.text} text-xs`}>
              {statusLabel}
            </Badge>
          </div>
          {amount != null && (
            <p className="text-sm font-medium text-emerald-900">
              {amount.toLocaleString()} {currency}
            </p>
          )}
          {highlight.paymentReference && (
            <p className="text-xs text-emerald-700">
              Ref: {highlight.paymentReference}
            </p>
          )}
          {highlight.receiptNumber && (
            <p className="text-xs text-emerald-700">
              {locale === 'fr' ? 'Reçu' : locale === 'en' ? 'Receipt' : 'Recibo'}: {highlight.receiptNumber}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Appointment block
  if (highlight?.appointment?.date) {
    highlightBlocks.push(
      <div key="appointment" className="rounded-lg border border-sky-200 bg-sky-50/70 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-sky-600" />
          <span className="text-sm font-semibold text-sky-800">
            {locale === 'fr' ? 'Rendez-vous' : locale === 'en' ? 'Appointment' : 'Cita Programada'}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-sky-900">
            {highlight.appointment.date}
            {highlight.appointment.time && ` - ${highlight.appointment.time}`}
          </p>
          {highlight.appointment.location && (
            <p className="text-xs text-sky-700">{highlight.appointment.location}</p>
          )}
        </div>
      </div>
    )
  }

  // Anterior section block
  if (anteriorSection && anteriorSection.fields.length > 0) {
    highlightBlocks.push(
      <div key="anterior" className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">
            {anteriorSection.title}
          </span>
        </div>
        <div className="space-y-1">
          {anteriorSection.fields.map((f, i) => (
            <div key={i} className="flex items-baseline gap-1.5">
              <span className="text-xs text-amber-700">{f.label}:</span>
              <span className="text-sm font-medium text-amber-900">{f.value || '-'}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Filter sections to render (skip "Anterior" since it's in highlight blocks)
  const renderSections = sections.filter((_, idx) => idx !== anteriorIndex)

  // Determine grid cols for highlight blocks
  const highlightGridCols =
    highlightBlocks.length === 3 ? 'md:grid-cols-3' :
    highlightBlocks.length === 2 ? 'md:grid-cols-2' : ''

  // Find the first section with > 5 fields (personal data section) for photo placement
  const photoSectionIndex = photoUrl
    ? renderSections.findIndex(s => s.fields.length > 5)
    : -1

  return (
    <div className="space-y-4">
      {/* Highlight blocks */}
      {highlightBlocks.length > 0 && (
        <div className={`grid grid-cols-1 ${highlightGridCols} gap-3`}>
          {highlightBlocks}
        </div>
      )}

      {/* Data sections */}
      {renderSections.map((section, index) => {
        // First section with <= 2 fields: inline subtitle
        if (index === 0 && section.fields.length <= 2 && section.fields.length > 0) {
          return (
            <div key={`s-${index}`} className="text-sm text-muted-foreground px-1">
              {section.fields
                .filter(f => f.value)
                .map(f => f.value)
                .join(' · ')}
            </div>
          )
        }

        const hasPhoto = photoSectionIndex === index && !!photoUrl
        const isSmall = section.fields.length <= 3

        // Check if this + next section are both small → render side-by-side
        const nextSection = renderSections[index + 1]
        const nextIsSmall = nextSection && nextSection.fields.length <= 3
        // Only pair if current is small, next is small, and we're not the subtitle section
        const shouldPairWithNext = isSmall && nextIsSmall && !(index === 0 && section.fields.length <= 2)

        if (shouldPairWithNext) {
          // Render paired side-by-side sections
          return (
            <div key={`s-${index}`} className="flex flex-col md:flex-row md:gap-4">
              <div className="md:w-1/2">
                <SectionCard section={section} hasPhoto={false} photoUrl={null} />
              </div>
              <div className="md:w-1/2 mt-4 md:mt-0">
                <SectionCard section={nextSection} hasPhoto={false} photoUrl={null} />
              </div>
            </div>
          )
        }

        // Skip if this section was already rendered as part of a pair
        const prevSection = index > 0 ? renderSections[index - 1] : null
        const prevIsSmall = prevSection && prevSection.fields.length <= 3
        const wasPairedWithPrev = prevIsSmall && isSmall && !(index - 1 === 0 && (prevSection?.fields.length ?? 0) <= 2)
        if (wasPairedWithPrev) return null

        return (
          <SectionCard
            key={`s-${index}`}
            section={section}
            hasPhoto={hasPhoto}
            photoUrl={hasPhoto ? photoUrl : null}
          />
        )
      })}
    </div>
  )
}

function SectionCard({
  section,
  hasPhoto,
  photoUrl,
}: {
  section: DataSection
  hasPhoto: boolean
  photoUrl?: string | null
}) {
  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-semibold text-center">
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {hasPhoto && photoUrl ? (
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-24 h-28 rounded-lg overflow-hidden border bg-muted">
                <Image
                  src={photoUrl}
                  alt="Photo"
                  width={96}
                  height={112}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              </div>
            </div>
            <div className="flex-1">
              <SmartFieldsGrid fields={section.fields} />
            </div>
          </div>
        ) : section.fields.length <= 3 ? (
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {section.fields.map((field, fi) => (
              <div key={fi} className="flex items-baseline gap-1.5">
                <span className="text-xs text-muted-foreground">{field.label}:</span>
                <span className="text-sm font-medium">{field.value || '-'}</span>
              </div>
            ))}
          </div>
        ) : (
          <SmartFieldsGrid fields={section.fields} />
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Smart grid with value-length heuristic:
 * - value <= 12 chars → col-span-1 (25%)
 * - value > 12 chars → col-span-2 (50%)
 * Uses 4-column grid.
 */
function SmartFieldsGrid({ fields }: { fields: DataSectionField[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {fields.map((field, fi) => {
        const valueLen = (field.value || '').length
        const colSpan = valueLen <= 12 ? 'col-span-1' : 'sm:col-span-2 col-span-2'

        return (
          <div key={fi} className={`p-2 bg-muted/50 rounded ${colSpan}`}>
            <p className="text-xs text-muted-foreground">{field.label}</p>
            <p className="text-sm font-medium mt-0.5">{field.value || '-'}</p>
          </div>
        )
      })}
    </div>
  )
}
