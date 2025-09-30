'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface OfflineContextType {
  isOnline: boolean
  syncPending: boolean
  lastSync: Date | null
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [syncPending, setSyncPending] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    // Détecter le statut online/offline
    const handleOnline = () => {
      setIsOnline(true)
      // Déclencher la synchronisation
      setSyncPending(true)
      syncData()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // État initial
    setIsOnline(navigator.onLine)

    // Charger la dernière sync depuis localStorage
    const lastSyncStr = localStorage.getItem('taxasge-last-sync')
    if (lastSyncStr) {
      setLastSync(new Date(lastSyncStr))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncData = async () => {
    try {
      // TODO: Implémenter la synchronisation avec l'API
      // Pour l'instant, simuler
      await new Promise(resolve => setTimeout(resolve, 2000))

      const now = new Date()
      setLastSync(now)
      localStorage.setItem('taxasge-last-sync', now.toISOString())
      setSyncPending(false)
    } catch (error) {
      console.error('Sync failed:', error)
      setSyncPending(false)
    }
  }

  return (
    <OfflineContext.Provider value={{ isOnline, syncPending, lastSync }}>
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
}
