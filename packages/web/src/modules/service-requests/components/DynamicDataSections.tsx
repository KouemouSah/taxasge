'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface DataSectionField {
  label: string
  value?: string | null
}

export interface DataSection {
  title: string
  fields: DataSectionField[]
}

interface DynamicDataSectionsProps {
  sections: DataSection[]
  photoUrl?: string | null
}

/**
 * Renders dynamic data sections from the backend (same data as PDF).
 *
 * Rules:
 * - First section (index 0, typically SELECTION) rendered as inline subtitle with "·" separator
 * - Section with "Datos Personales" or index 1 renders photo alongside
 * - Sections with <= 3 fields render inline (1 row)
 * - Sections with > 3 fields render in 2-column grid
 */
export function DynamicDataSections({ sections, photoUrl }: DynamicDataSectionsProps) {
  if (!sections.length) return null

  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        // First section: inline subtitle (SELECTION choices)
        if (index === 0 && section.fields.length > 0) {
          return (
            <div key={index} className="text-sm text-muted-foreground px-1">
              {section.fields
                .filter(f => f.value)
                .map(f => f.value)
                .join(' · ')}
            </div>
          )
        }

        const hasPhoto = photoUrl && (
          section.title.toLowerCase().includes('personales') ||
          section.title.toLowerCase().includes('personal') ||
          index === 1
        )
        const isInline = section.fields.length <= 3

        return (
          <Card key={index}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold text-center">
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {hasPhoto ? (
                // Photo + fields layout
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
                    <FieldsGrid fields={section.fields} inline={false} />
                  </div>
                </div>
              ) : isInline ? (
                // Inline layout for small sections
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  {section.fields.map((field, fi) => (
                    <div key={fi} className="flex items-baseline gap-1.5">
                      <span className="text-xs text-muted-foreground">{field.label}:</span>
                      <span className="text-sm font-medium">{field.value || '-'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                // Grid layout for larger sections
                <FieldsGrid fields={section.fields} inline={false} />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function FieldsGrid({ fields, inline }: { fields: DataSectionField[]; inline: boolean }) {
  if (inline) {
    return (
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {fields.map((field, fi) => (
          <div key={fi} className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground">{field.label}:</span>
            <span className="text-sm font-medium">{field.value || '-'}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {fields.map((field, fi) => (
        <div key={fi} className="p-2 bg-muted/50 rounded">
          <p className="text-xs text-muted-foreground">{field.label}</p>
          <p className="text-sm font-medium mt-0.5">{field.value || '-'}</p>
        </div>
      ))}
    </div>
  )
}
