/**
 * TaxasGE Mobile - useFavorites Hook
 * Hook pour gérer les favoris utilisateur
 */

import { useState, useCallback, useEffect } from 'react';
import { favoritesService, Favorite } from '../database/services/FavoritesService';

export interface FavoritesState {
  favorites: Favorite[];
  loading: boolean;
  error: string | null;
  count: number;
}

export function useFavorites(userId?: string) {
  const [state, setState] = useState<FavoritesState>({
    favorites: [],
    loading: false,
    error: null,
    count: 0,
  });

  /**
   * Load user favorites
   */
  const loadFavorites = useCallback(
    async (uid?: string) => {
      const targetUserId = uid || userId;
      if (!targetUserId) {
        console.warn('[useFavorites] No user ID provided');
        return [];
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const results = await favoritesService.getUserFavorites(targetUserId);
        const totalCount = await favoritesService.getCount(targetUserId);

        setState(prev => ({
          ...prev,
          favorites: results,
          loading: false,
          count: totalCount,
          error: null,
        }));

        return results;
      } catch (error) {
        console.error('[useFavorites] Load favorites failed:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Load failed',
        }));
        return [];
      }
    },
    [userId]
  );

  /**
   * Check if service is favorited
   */
  const isFavorite = useCallback(
    async (serviceId: string, uid?: string) => {
      const targetUserId = uid || userId;
      if (!targetUserId) return false;

      try {
        return await favoritesService.isFavorite(targetUserId, serviceId);
      } catch (error) {
        console.error('[useFavorites] Check favorite failed:', error);
        return false;
      }
    },
    [userId]
  );

  /**
   * Add service to favorites
   */
  const addFavorite = useCallback(
    async (serviceId: string, notes?: string, tags?: string[], uid?: string) => {
      const targetUserId = uid || userId;
      if (!targetUserId) {
        throw new Error('User ID required to add favorite');
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const insertId = await favoritesService.addFavorite(targetUserId, serviceId, notes, tags);

        // Reload favorites
        await loadFavorites(targetUserId);

        console.log('[useFavorites] Favorite added:', insertId);
        return insertId;
      } catch (error) {
        console.error('[useFavorites] Add favorite failed:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Add failed',
        }));
        throw error;
      }
    },
    [userId, loadFavorites]
  );

  /**
   * Remove service from favorites
   */
  const removeFavorite = useCallback(
    async (serviceId: string, uid?: string) => {
      const targetUserId = uid || userId;
      if (!targetUserId) {
        throw new Error('User ID required to remove favorite');
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const success = await favoritesService.removeFavorite(targetUserId, serviceId);

        if (success) {
          // Reload favorites
          await loadFavorites(targetUserId);
          console.log('[useFavorites] Favorite removed');
        }

        return success;
      } catch (error) {
        console.error('[useFavorites] Remove favorite failed:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Remove failed',
        }));
        throw error;
      }
    },
    [userId, loadFavorites]
  );

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(
    async (serviceId: string, uid?: string) => {
      const targetUserId = uid || userId;
      if (!targetUserId) {
        throw new Error('User ID required to toggle favorite');
      }

      const isCurrentlyFavorite = await isFavorite(serviceId, targetUserId);

      if (isCurrentlyFavorite) {
        return await removeFavorite(serviceId, targetUserId);
      } else {
        return await addFavorite(serviceId, undefined, undefined, targetUserId);
      }
    },
    [userId, isFavorite, addFavorite, removeFavorite]
  );

  /**
   * Update favorite notes
   */
  const updateNotes = useCallback(
    async (serviceId: string, notes: string, uid?: string) => {
      const targetUserId = uid || userId;
      if (!targetUserId) {
        throw new Error('User ID required to update notes');
      }

      try {
        const success = await favoritesService.updateNotes(targetUserId, serviceId, notes);

        if (success) {
          // Reload favorites
          await loadFavorites(targetUserId);
          console.log('[useFavorites] Notes updated');
        }

        return success;
      } catch (error) {
        console.error('[useFavorites] Update notes failed:', error);
        throw error;
      }
    },
    [userId, loadFavorites]
  );

  /**
   * Clear all favorites
   */
  const clearAll = useCallback(
    async (uid?: string) => {
      const targetUserId = uid || userId;
      if (!targetUserId) {
        throw new Error('User ID required to clear favorites');
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const success = await favoritesService.clearAll(targetUserId);

        if (success) {
          setState(prev => ({
            ...prev,
            favorites: [],
            loading: false,
            count: 0,
            error: null,
          }));

          console.log('[useFavorites] All favorites cleared');
        }

        return success;
      } catch (error) {
        console.error('[useFavorites] Clear all failed:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Clear failed',
        }));
        throw error;
      }
    },
    [userId]
  );

  /**
   * Load favorites on mount if userId provided
   */
  useEffect(() => {
    if (userId) {
      loadFavorites(userId);
    }
  }, [userId, loadFavorites]);

  return {
    // State
    favorites: state.favorites,
    loading: state.loading,
    error: state.error,
    count: state.count,

    // Actions
    loadFavorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    updateNotes,
    clearAll,
  };
}
