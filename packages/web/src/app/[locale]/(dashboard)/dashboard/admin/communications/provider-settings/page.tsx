'use client'

import { SmsProviderSettings } from '@/modules/communications/components/SmsProviderSettings'
import { useParams } from 'next/navigation'

export default function ProviderSettingsPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'es'
  return <SmsProviderSettings locale={locale} />
}
