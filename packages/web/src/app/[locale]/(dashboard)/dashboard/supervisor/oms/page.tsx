'use client'

/**
 * /supervisor/oms → redirect to /supervisor (main supervisor dashboard)
 *
 * OMS supervisor menu links resolve to /supervisor/oms/... which don't exist
 * as standalone pages. The main supervisor dashboard at /supervisor handles
 * all OMS supervisor functionality via tabs.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Loader2 } from 'lucide-react'

export default function SupervisorOmsRedirect() {
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    router.replace(`/${locale}/dashboard/supervisor`)
  }, [router, locale])

  return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}
