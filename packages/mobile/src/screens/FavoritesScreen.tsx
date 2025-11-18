/**
 * TaxasGE Mobile - Favorites Screen
 * Displays user's favorite services with actions
 * Date: 2025-10-22
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { favoritesService } from '../database/services/FavoritesService';
import { FavoriteCard, FavoriteService } from '../components/FavoriteCard';
import { SwipeActions, SwipeAction } from '../components/SwipeActions';
import { GradientHeader } from '../components/GradientHeader';

export interface FavoritesScreenProps {
  language: 'es' | 'fr' | 'en';
  userId: string;
  onBack: () => void;
  onServicePress?: (service: FavoriteService) => void;
  onCalculate?: (service: FavoriteService) => void;
}

const TEXTS = {
  es: {
    title: 'Favoritos',
    loading: 'Cargando favoritos...',
    empty: 'No tienes servicios favoritos',
    emptySubtitle: 'Marca servicios como favoritos para acceder rápidamente',
    remove: 'Quitar',
    editNotes: 'Editar Notas',
    save: 'Guardar',
    cancel: 'Cancelar',
    notes: 'Notas',
    notesPlaceholder: 'Añade notas sobre este servicio...',
    confirmRemoveTitle: '¿Quitar de favoritos?',
    confirmRemoveMessage: 'Este servicio se quitará de tus favoritos.',
    confirm: 'Confirmar',
    removeSuccess: 'Servicio quitado de favoritos',
    updateSuccess: 'Notas actualizadas',
    clearAllTitle: '¿Borrar todos los favoritos?',
    clearAllMessage: 'Esta acción no se puede deshacer.',
    clearAll: 'Borrar Todo',
    clearSuccess: 'Favoritos borrados',
    reorder: 'Reordenar',
    moveUp: 'Subir',
    moveDown: 'Bajar',
    favorites: 'favoritos',
  },
  fr: {
    title: 'Favoris',
    loading: 'Chargement des favoris...',
    empty: 'Aucun service favori',
    emptySubtitle: 'Marquez des services comme favoris pour y accéder rapidement',
    remove: 'Retirer',
    editNotes: 'Modifier Notes',
    save: 'Enregistrer',
    cancel: 'Annuler',
    notes: 'Notes',
    notesPlaceholder: 'Ajoutez des notes sur ce service...',
    confirmRemoveTitle: 'Retirer des favoris ?',
    confirmRemoveMessage: 'Ce service sera retiré de vos favoris.',
    confirm: 'Confirmer',
    removeSuccess: 'Service retiré des favoris',
    updateSuccess: 'Notes mises à jour',
    clearAllTitle: 'Effacer tous les favoris ?',
    clearAllMessage: 'Cette action est irréversible.',
    clearAll: 'Tout Effacer',
    clearSuccess: 'Favoris effacés',
    reorder: 'Réorganiser',
    moveUp: 'Monter',
    moveDown: 'Descendre',
    favorites: 'favoris',
  },
  en: {
    title: 'Favorites',
    loading: 'Loading favorites...',
    empty: 'No favorite services',
    emptySubtitle: 'Mark services as favorites for quick access',
    remove: 'Remove',
    editNotes: 'Edit Notes',
    save: 'Save',
    cancel: 'Cancel',
    notes: 'Notes',
    notesPlaceholder: 'Add notes about this service...',
    confirmRemoveTitle: 'Remove from favorites?',
    confirmRemoveMessage: 'This service will be removed from your favorites.',
    confirm: 'Confirm',
    removeSuccess: 'Service removed from favorites',
    updateSuccess: 'Notes updated',
    clearAllTitle: 'Clear all favorites?',
    clearAllMessage: 'This action cannot be undone.',
    clearAll: 'Clear All',
    clearSuccess: 'Favorites cleared',
    reorder: 'Reorder',
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    favorites: 'favorites',
  },
};

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  language,
  userId,
  onBack,
  onServicePress,
  onCalculate,
}) => {
  const [favorites, setFavorites] = useState<FavoriteService[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderMode, setReorderMode] = useState(false);
  const [editingNotes, setEditingNotes] = useState<FavoriteService | null>(null);
  const [notesText, setNotesText] = useState('');

  const texts = TEXTS[language];

  /**
   * Load favorites from database
   */
  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const results = await favoritesService.getUserFavorites(userId);
      setFavorites(results);
    } catch (error) {
      console.error('[FavoritesScreen] Load favorites error:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  /**
   * Handle remove favorite
   */
  const handleRemove = useCallback((favorite: FavoriteService) => {
    Alert.alert(
      texts.confirmRemoveTitle,
      texts.confirmRemoveMessage,
      [
        {
          text: texts.cancel,
          style: 'cancel',
        },
        {
          text: texts.confirm,
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await favoritesService.removeFavorite(
                userId,
                favorite.fiscal_service_code
              );
              if (success) {
                Alert.alert(texts.removeSuccess);
                loadFavorites();
              }
            } catch (error) {
              console.error('[FavoritesScreen] Remove error:', error);
            }
          },
        },
      ]
    );
  }, [userId, loadFavorites, texts]);

  /**
   * Handle calculate
   */
  const handleCalculate = useCallback((favorite: FavoriteService) => {
    if (onCalculate) {
      onCalculate(favorite);
    }
  }, [onCalculate]);

  /**
   * Handle service press (view details)
   */
  const handleServicePress = useCallback((favorite: FavoriteService) => {
    if (onServicePress) {
      onServicePress(favorite);
    }
  }, [onServicePress]);

  /**
   * Handle edit notes
   */
  const handleEditNotes = useCallback((favorite: FavoriteService) => {
    setEditingNotes(favorite);
    setNotesText(favorite.notes || '');
  }, []);

  /**
   * Save notes
   */
  const handleSaveNotes = useCallback(async () => {
    if (!editingNotes) return;

    try {
      const success = await favoritesService.updateNotes(
        userId,
        editingNotes.fiscal_service_code,
        notesText
      );

      if (success) {
        Alert.alert(texts.updateSuccess);
        setEditingNotes(null);
        setNotesText('');
        loadFavorites();
      }
    } catch (error) {
      console.error('[FavoritesScreen] Save notes error:', error);
    }
  }, [userId, editingNotes, notesText, loadFavorites, texts]);

  /**
   * Handle clear all favorites
   */
  const handleClearAll = useCallback(() => {
    Alert.alert(
      texts.clearAllTitle,
      texts.clearAllMessage,
      [
        {
          text: texts.cancel,
          style: 'cancel',
        },
        {
          text: texts.confirm,
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await favoritesService.clearAll(userId);
              if (success) {
                Alert.alert(texts.clearSuccess);
                loadFavorites();
              }
            } catch (error) {
              console.error('[FavoritesScreen] Clear all error:', error);
            }
          },
        },
      ]
    );
  }, [userId, loadFavorites, texts]);

  /**
   * Move item up in list
   */
  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;

    setFavorites(prev => {
      const newFavorites = [...prev];
      [newFavorites[index - 1], newFavorites[index]] =
        [newFavorites[index], newFavorites[index - 1]];
      return newFavorites;
    });
  }, []);

  /**
   * Move item down in list
   */
  const handleMoveDown = useCallback((index: number) => {
    if (index === favorites.length - 1) return;

    setFavorites(prev => {
      const newFavorites = [...prev];
      [newFavorites[index], newFavorites[index + 1]] =
        [newFavorites[index + 1], newFavorites[index]];
      return newFavorites;
    });
  }, [favorites.length]);

  /**
   * Render favorite card with actions
   */
  const renderFavoriteCard = useCallback(({ item, index }: { item: FavoriteService; index: number }) => {
    const swipeActions: SwipeAction[] = [
      {
        text: texts.remove,
        color: '#FF3B30',
        textColor: '#FFFFFF',
        onPress: () => handleRemove(item),
      },
    ];

    return (
      <View>
        <SwipeActions rightActions={swipeActions}>
          <FavoriteCard
            favorite={item}
            language={language}
            onPress={() => handleServicePress(item)}
            onCalculate={() => handleCalculate(item)}
            onRemove={() => handleRemove(item)}
          />
        </SwipeActions>

        {/* Reorder controls */}
        {reorderMode && (
          <View style={styles.reorderControls}>
            <TouchableOpacity
              style={[
                styles.reorderButton,
                index === 0 && styles.reorderButtonDisabled
              ]}
              onPress={() => handleMoveUp(index)}
              disabled={index === 0}>
              <Text style={styles.reorderButtonText}>↑ {texts.moveUp}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.reorderButton,
                index === favorites.length - 1 && styles.reorderButtonDisabled
              ]}
              onPress={() => handleMoveDown(index)}
              disabled={index === favorites.length - 1}>
              <Text style={styles.reorderButtonText}>↓ {texts.moveDown}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editNotesButton}
              onPress={() => handleEditNotes(item)}>
              <Text style={styles.editNotesButtonText}>📝 {texts.editNotes}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [
    language,
    reorderMode,
    favorites.length,
    texts,
    handleRemove,
    handleCalculate,
    handleServicePress,
    handleMoveUp,
    handleMoveDown,
    handleEditNotes,
  ]);

  /**
   * Render edit notes modal
   */
  const renderEditNotesModal = () => (
    <Modal
      visible={editingNotes !== null}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setEditingNotes(null)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{texts.notes}</Text>
            <TouchableOpacity onPress={() => setEditingNotes(null)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {editingNotes && (
            <View style={styles.modalBody}>
              <Text style={styles.serviceCode}>
                {String(editingNotes.fiscal_service_code)}
              </Text>
              <TextInput
                style={styles.notesInput}
                value={notesText}
                onChangeText={setNotesText}
                placeholder={texts.notesPlaceholder}
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setEditingNotes(null)}>
              <Text style={styles.cancelButtonText}>{texts.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveNotes}>
              <Text style={styles.saveButtonText}>{texts.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#004aad" />

      {/* Modern Header */}
      <GradientHeader
        title={texts.title}
        onBack={onBack}
        rightComponent={
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setReorderMode(!reorderMode)}>
            <Text style={styles.headerIconText}>
              {reorderMode ? '✓' : '☰'}
            </Text>
          </TouchableOpacity>
        }
      />

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {favorites.length} {texts.favorites}
        </Text>
        {favorites.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearAllButton}>{texts.clearAll}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{texts.loading}</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyText}>{texts.empty}</Text>
          <Text style={styles.emptySubtitle}>{texts.emptySubtitle}</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteCard}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          extraData={reorderMode}
        />
      )}

      {/* Edit Notes Modal */}
      {renderEditNotesModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 18,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statsText: {
    fontSize: 14,
    color: '#666666',
  },
  clearAllButton: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    maxWidth: 280,
  },
  listContent: {
    padding: 16,
  },
  reorderControls: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 8,
    gap: 8,
    marginTop: -12,
    marginBottom: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  reorderButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  reorderButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.5,
  },
  reorderButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editNotesButton: {
    flex: 1,
    backgroundColor: '#34C759',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  editNotesButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    fontSize: 24,
    color: '#666666',
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  serviceCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

// Export default for convenience
export default FavoritesScreen;
