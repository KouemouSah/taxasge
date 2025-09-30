'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useOffline } from '@/components/providers/OfflineProvider'

interface FavoriteService {
  taxId: string
  addedAt: string
  notes?: string
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { isOnline } = useOffline()

  useEffect(() => {
    loadFavorites()
  }, [user])

  const loadFavorites = async () => {
    try {
      setLoading(true)

      if (user && isOnline) {
        // Charger favoris depuis l'API si connecté et en ligne
        const response = await fetch('/api/favorites', {
          // TODO: Add authorization when backend is ready
        })
        
        if (response.ok) {
          const data = await response.json()
          const favoriteIds = data.favorites.map((fav: FavoriteService) => fav.taxId)
          setFavorites(favoriteIds)
          
          // Synchroniser avec localStorage
          localStorage.setItem('taxasge-favorites', JSON.stringify(favoriteIds))
        }
      } else {
        // Charger favoris depuis localStorage
        const saved = localStorage.getItem('taxasge-favorites')
        if (saved) {
          try {
            const favoriteIds = JSON.parse(saved)
            setFavorites(favoriteIds)
          } catch (error) {
            console.error('Failed to parse favorites:', error)
            setFavorites([])
          }
        }
      }
    } catch (error) {
      console.error('Failed to load favorites:', error)
      
      // Fallback vers localStorage
      const saved = localStorage.getItem('taxasge-favorites')
      if (saved) {
        try {
          setFavorites(JSON.parse(saved))
        } catch {
          setFavorites([])
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const isFavorite = (taxId: string): boolean => {
    return favorites.includes(taxId)
  }

  const addFavorite = async (taxId: string, notes?: string) => {
    try {
      // Optimistic update
      const newFavorites = [...favorites, taxId]
      setFavorites(newFavorites)
      
      // Sauvegarder localement immédiatement
      localStorage.setItem('taxasge-favorites', JSON.stringify(newFavorites))

      if (user && isOnline) {
        // Synchroniser avec l'API
        await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}`, // TODO: Add when auth ready
          },
          body: JSON.stringify({ taxId, notes }),
        })
      } else if (!isOnline) {
        // Stocker pour sync ultérieure
        const offlineFavorites = getOfflineFavorites()
        offlineFavorites.push({ taxId, addedAt: new Date().toISOString(), notes })
        localStorage.setItem('taxasge-offline-favorites', JSON.stringify(offlineFavorites))
      }
    } catch (error) {
      console.error('Failed to add favorite:', error)
      
      // Rollback optimistic update
      setFavorites(favorites.filter(id => id !== taxId))
      localStorage.setItem('taxasge-favorites', JSON.stringify(favorites))
    }
  }

  const removeFavorite = async (taxId: string) => {
    try {
      // Optimistic update
      const newFavorites = favorites.filter(id => id !== taxId)
      setFavorites(newFavorites)
      
      // Sauvegarder localement immédiatement
      localStorage.setItem('taxasge-favorites', JSON.stringify(newFavorites))

      if (user && isOnline) {
        // Synchroniser avec l'API
        await fetch(`/api/favorites/${taxId}`, {
          method: 'DELETE',
          // TODO: Add authorization headers when backend is ready
        })
      } else if (!isOnline) {
        // Marquer pour suppression lors de la sync
        const offlineRemovals = getOfflineRemovals()
        offlineRemovals.push({ taxId, removedAt: new Date().toISOString() })
        localStorage.setItem('taxasge-offline-removals', JSON.stringify(offlineRemovals))
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error)
      
      // Rollback optimistic update
      setFavorites([...favorites, taxId])
      localStorage.setItem('taxasge-favorites', JSON.stringify([...favorites, taxId]))
    }
  }

  const toggleFavorite = async (taxId: string, notes?: string) => {
    if (isFavorite(taxId)) {
      await removeFavorite(taxId)
    } else {
      await addFavorite(taxId, notes)
    }
  }

  const getFavoriteCount = (): number => {
    return favorites.length
  }

  const clearAllFavorites = async () => {
    try {
      setFavorites([])
      localStorage.removeItem('taxasge-favorites')

      if (user && isOnline) {
        await fetch('/api/favorites/clear', {
          method: 'DELETE',
          // TODO: Add authorization headers when backend is ready
        })
      }
    } catch (error) {
      console.error('Failed to clear favorites:', error)
    }
  }

  return {
    favorites,
    loading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getFavoriteCount,
    clearAllFavorites,
    loadFavorites,
  }
}

// Helpers pour gestion offline
function getOfflineFavorites(): FavoriteService[] {
  try {
    const saved = localStorage.getItem('taxasge-offline-favorites')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function getOfflineRemovals(): Array<{ taxId: string; removedAt: string }> {
  try {
    const saved = localStorage.getItem('taxasge-offline-removals')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}