'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useOffline } from '@/components/providers/OfflineProvider'

export function OfflineIndicator() {
  const { isOnline, isOfflineReady, syncPending, lastSync } = useOffline()
  const [showDetails, setShowDetails] = useState(false)

  // Ne pas afficher si en ligne et pas de sync en cours
  if (isOnline && !syncPending) {
    return null
  }

  return (
    <div className="fixed top-16 left-4 right-4 z-40 sm:left-auto sm:right-4 sm:max-w-sm">
      <Card className={`border-2 shadow-lg transition-all duration-300 ${
        isOnline 
          ? 'border-blue-200 bg-blue-50/95' 
          : 'border-orange-200 bg-orange-50/95'
      } backdrop-blur-sm`}>
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isOnline ? 'bg-blue-100' : 'bg-orange-100'
            }`}>
              {syncPending ? (
                <RefreshCw className={`h-4 w-4 animate-spin ${
                  isOnline ? 'text-blue-600' : 'text-orange-600'
                }`} />
              ) : isOnline ? (
                <Wifi className="h-4 w-4 text-blue-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-600" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-foreground">
                  {syncPending ? 'Synchronisation...' : 
                   isOnline ? 'Connexion rétablie' : 'Mode hors ligne'}
                </span>
                
                {isOfflineReady && (
                  <Badge variant="secondary" className="text-xs">
                    Données locales
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {syncPending ? 'Synchronisation des données en cours...' :
                 isOnline ? 'Toutes les fonctionnalités sont disponibles' :
                 isOfflineReady ? 'Recherche et calculs disponibles hors ligne' :
                 'Fonctionnalités limitées sans connexion'}
              </p>
              
              {lastSync && (
                <p className="text-xs text-muted-foreground mt-1">
                  Dernière sync : {new Date(lastSync).toLocaleTimeString()}
                </p>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="p-1"
            >
              <AlertCircle className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Détails étendus */}
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span>Statut réseau :</span>
                  <span className={`font-medium ${
                    isOnline ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {isOnline ? 'En ligne' : 'Hors ligne'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Données locales :</span>
                  <span className={`font-medium ${
                    isOfflineReady ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {isOfflineReady ? 'Disponibles' : 'Non disponibles'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Synchronisation :</span>
                  <span className={`font-medium ${
                    syncPending ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {syncPending ? 'En cours' : 'À jour'}
                  </span>
                </div>
              </div>
              
              {!isOnline && (
                <div className="bg-orange-100 border border-orange-200 rounded-lg p-2 mt-2">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div className="text-xs text-orange-800">
                      <p className="font-medium mb-1">Mode hors ligne actif</p>
                      <p>
                        Vous pouvez continuer à utiliser TaxasGE. 
                        Les données seront synchronisées dès le retour de la connexion.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}