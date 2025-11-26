'use client'

/**
 * Admin Settings Page
 * Redirects to Security settings by default
 *
 * @module dashboard/admin/settings
 * @author Claude Code
 * @date 2025-11-19
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminSettingsPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/dashboard/admin/settings/security')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirection...</p>
    </div>
  )
}
