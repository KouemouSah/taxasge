'use client'

/**
 * Backend Unavailable Alert Component
 * Displays a warning when backend API is not available
 *
 * @module components/admin
 * @author Claude Code
 * @date 2025-11-19
 */

import { Server } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function BackendUnavailableAlert() {
  return (
    <Alert variant="warning" className="mb-6">
      <Server className="h-4 w-4" />
      <AlertTitle>Backend API non disponible</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          L&apos;API backend n&apos;est pas accessible actuellement. Cela peut être dû à :
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Le module backend n&apos;est pas encore déployé sur Cloud Run</li>
          <li>Le serveur backend est temporairement indisponible</li>
          <li>Un problème de connexion réseau</li>
        </ul>
        <p className="mt-3 text-sm font-medium">
          Veuillez consulter le fichier <code className="bg-orange-100 px-1 rounded">BACKEND_DEPLOYMENT_REQUIRED.md</code> pour plus d&apos;informations sur le déploiement du backend.
        </p>
      </AlertDescription>
    </Alert>
  )
}
