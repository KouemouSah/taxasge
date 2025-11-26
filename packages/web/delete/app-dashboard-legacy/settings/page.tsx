'use client'

/**
 * Settings Page
 * Redirects to Security settings by default
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/dashboard/settings/security')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirection...</p>
    </div>
  )
}
