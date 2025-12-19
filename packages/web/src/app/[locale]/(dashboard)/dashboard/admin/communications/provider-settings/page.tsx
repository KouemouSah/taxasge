'use client'

import { ProviderSettingsList } from '@/modules/communications/components/ProviderSettingsList'

interface PageProps {
  params: { locale: string }
}

export default function ProviderSettingsPage({ params }: PageProps) {
  return <ProviderSettingsList locale={params.locale} />
}
