'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface OfflineContextType {
  isOnline: boolean
  isOfflineReady: boolean
  syncPending: boolean
  lastSync: Date | null
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function useOffline() {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
}

interface OfflineProviderProps {
  children: ReactNode
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isOfflineReady, setIsOfflineReady] = useState(false)
  const [syncPending, setSyncPending] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    // Détecter statut réseau
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Listeners événements réseau
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // État initial
    updateOnlineStatus()

    // Vérifier si données offline disponibles
    const checkOfflineReady = async () => {
      try {
        // Vérifier si IndexedDB contient les données taxes
        const hasOfflineData = await checkOfflineDataAvailable()
        setIsOfflineReady(hasOfflineData)
      } catch (error) {
        console.error('Offline check failed:', error)
        setIsOfflineReady(false)
      }
    }

    checkOfflineReady()

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  useEffect(() => {
    // Synchroniser quand revient online
    if (isOnline && syncPending) {
      syncOfflineData()
    }
  }, [isOnline, syncPending])

  const syncOfflineData = async () => {
    try {
      setSyncPending(true)
      
      // Synchroniser calculs offline
      await syncCalculations()
      
      // Synchroniser favoris offline
      await syncFavorites()
      
      // Mettre à jour timestamp dernière sync
      setLastSync(new Date())
      setSyncPending(false)
      
      console.log('✅ Offline data synced successfully')
    } catch (error) {
      console.error('❌ Offline sync failed:', error)
      setSyncPending(false)
    }
  }

  const value = {
    isOnline,
    isOfflineReady,
    syncPending,
    lastSync,
  }

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  )
}

// Helper functions (implémentation simplifiée)
async function checkOfflineDataAvailable(): Promise<boolean> {
  try {
    // Vérifier si IndexedDB contient les données
    if (!('indexedDB' in window)) return false
    
    // Ouvrir base de données locale
    return new Promise((resolve) => {
      const request = indexedDB.open('taxasge-db', 1)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['taxes'], 'readonly')
        const store = transaction.objectStore('taxes')
        const countRequest = store.count()
        
        countRequest.onsuccess = () => {
          resolve(countRequest.result > 0)
        }
        
        countRequest.onerror = () => {
          resolve(false)
        }
      }
      
      request.onerror = () => {
        resolve(false)
      }
    })
  } catch (error) {
    return false
  }
}

async function syncCalculations() {
  // Synchroniser calculs stockés offline
  const offlineCalculations = getOfflineCalculations()
  
  for (const calc of offlineCalculations) {
    try {
      await fetch('/api/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calc)
      })
      
      // Supprimer après sync réussie
      removeOfflineCalculation(calc.id)
    } catch (error) {
      console.error('Calculation sync failed:', error)
    }
  }
}

async function syncFavorites() {
  // Synchroniser favoris stockés offline
  const offlineFavorites = getOfflineFavorites()
  
  if (offlineFavorites.length > 0) {
    try {
      await fetch('/api/favorites/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: offlineFavorites })
      })
      
      clearOfflineFavorites()
    } catch (error) {
      console.error('Favorites sync failed:', error)
    }
  }
}

// Helpers IndexedDB (implémentation basique)
function getOfflineCalculations() {
  // Récupérer calculs depuis IndexedDB
  return []
}

function removeOfflineCalculation(id: string) {
  // Supprimer calcul de IndexedDB
}

function getOfflineFavorites() {
  // Récupérer favoris depuis localStorage
  try {
    const favorites = localStorage.getItem('taxasge-offline-favorites')
    return favorites ? JSON.parse(favorites) : []
  } catch {
    return []
  }
}

function clearOfflineFavorites() {
  // Nettoyer favoris offline après sync
  localStorage.removeItem('taxasge-offline-favorites')
}