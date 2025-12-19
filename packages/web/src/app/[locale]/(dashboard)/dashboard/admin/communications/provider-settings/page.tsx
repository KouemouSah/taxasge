'use client'

import { SmsProviderSettings } from '@/modules/communications/components/SmsProviderSettings'
import { use } from 'react'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default function ProviderSettingsPage({ params }: PageProps) {
  const resolvedParams = use(params)
  return <SmsProviderSettings locale={resolvedParams.locale} />
}
