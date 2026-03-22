'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Public Page Error]', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-semibold">Error al cargar la pagina</h2>
        <p className="text-sm text-muted-foreground">
          Se produjo un error. Por favor intente de nuevo.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
