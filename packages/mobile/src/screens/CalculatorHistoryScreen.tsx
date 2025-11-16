/**
 * TaxasGE Mobile - Calculation History Screen
 * Displays calculation history with filters and actions
 * Date: 2025-10-22
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ScrollView,
} from 'react-native';
import { calculationHistoryService, CalculationHistoryRecord } from '../database/services/CalculationHistoryService';
import { HistoryCard } from '../components/HistoryCard';
import { SwipeActions, SwipeAction } from '../components/SwipeActions';

export interface HistoryScreenProps {
  language: 'es' | 'fr' | 'en';
  userId: string;
  onBack: () => void;
  onRecalculate?: (record: CalculationHistoryRecord) => void;
}

const TEXTS = {
  es: {
    title: 'Historial de Cálculos',
    loading: 'Cargando historial...',
    empty: 'No hay cálculos en el historial',
    emptyFiltered: 'No hay resultados para los filtros seleccionados',
    filters: 'Filtros',
    clearFilters: 'Limpiar',
    applyFilters: 'Aplicar',
    filterByService: 'Filtrar por servicio',
    filterByDateRange: 'Filtrar por fecha',
    filterByType: 'Filtrar por tipo',
    allServices: 'Todos los servicios',
    allTypes: 'Todos los tipos',
    expedition: 'Expedición',
    renewal: 'Renovación',
    dateFrom: 'Fecha desde',
    dateTo: 'Fecha hasta',
    export: 'Exportar',
    exportAll: 'Exportar Todo',
    clearHistory: 'Borrar Historial',
    confirmClearTitle: '¿Borrar todo el historial?',
    confirmClearMessage: 'Esta acción no se puede deshacer.',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    deleteSuccess: 'Cálculo eliminado',
    exportSuccess: 'Historial exportado',
    clearSuccess: 'Historial borrado',
    delete: 'Eliminar',
    records: 'registros',
  },
  fr: {
    title: 'Historique des Calculs',
    loading: 'Chargement de l\'historique...',
    empty: 'Aucun calcul dans l\'historique',
    emptyFiltered: 'Aucun résultat pour les filtres sélectionnés',
    filters: 'Filtres',
    clearFilters: 'Effacer',
    applyFilters: 'Appliquer',
    filterByService: 'Filtrer par service',
    filterByDateRange: 'Filtrer par date',
    filterByType: 'Filtrer par type',
    allServices: 'Tous les services',
    allTypes: 'Tous les types',
    expedition: 'Expédition',
    renewal: 'Renouvellement',
    dateFrom: 'Date de',
    dateTo: 'Date à',
    export: 'Exporter',
    exportAll: 'Tout Exporter',
    clearHistory: 'Effacer l\'Historique',
    confirmClearTitle: 'Effacer tout l\'historique ?',
    confirmClearMessage: 'Cette action est irréversible.',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    deleteSuccess: 'Calcul supprimé',
    exportSuccess: 'Historique exporté',
    clearSuccess: 'Historique effacé',
    delete: 'Supprimer',
    records: 'enregistrements',
  },
  en: {
    title: 'Calculation History',
    loading: 'Loading history...',
    empty: 'No calculations in history',
    emptyFiltered: 'No results for selected filters',
    filters: 'Filters',
    clearFilters: 'Clear',
    applyFilters: 'Apply',
    filterByService: 'Filter by service',
    filterByDateRange: 'Filter by date',
    filterByType: 'Filter by type',
    allServices: 'All services',
    allTypes: 'All types',
    expedition: 'Expedition',
    renewal: 'Renewal',
    dateFrom: 'Date from',
    dateTo: 'Date to',
    export: 'Export',
    exportAll: 'Export All',
    clearHistory: 'Clear History',
    confirmClearTitle: 'Clear entire history?',
    confirmClearMessage: 'This action cannot be undone.',
    confirm: 'Confirm',
    cancel: 'Cancel',
    deleteSuccess: 'Calculation deleted',
    exportSuccess: 'History exported',
    clearSuccess: 'History cleared',
    delete: 'Delete',
    records: 'records',
  },
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  language,
  userId,
  onBack,
  onRecalculate,
}) => {
  const [history, setHistory] = useState<CalculationHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'expedition' | 'renewal' | ''>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const texts = TEXTS[language];

  /**
   * Load history from database
   */
  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const records = await calculationHistoryService.getHistory(userId, 100);
      setHistory(records);
    } catch (error) {
      console.error('[HistoryScreen] Load history error:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /**
   * Get unique services from history
   */
  const uniqueServices = useMemo(() => {
    const services = new Set<string>();
    history.forEach(record => {
      if (record.fiscal_service_code) {
        services.add(record.fiscal_service_code);
      }
    });
    return Array.from(services).sort();
  }, [history]);

  /**
   * Filter history based on selected filters
   */
  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    // Filter by service
    if (selectedService) {
      filtered = filtered.filter(
        record => record.fiscal_service_code === selectedService
      );
    }

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter(
        record => record.calculation_type === selectedType
      );
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.created_at);
        return recordDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.created_at);
        return recordDate <= toDate;
      });
    }

    return filtered;
  }, [history, selectedService, selectedType, dateFrom, dateTo]);

  /**
   * Handle delete calculation
   */
  const handleDelete = useCallback(async (record: CalculationHistoryRecord) => {
    if (!record.id) return;

    try {
      const success = await calculationHistoryService.deleteCalculation(userId, record.id);
      if (success) {
        Alert.alert(texts.deleteSuccess);
        loadHistory();
      }
    } catch (error) {
      console.error('[HistoryScreen] Delete error:', error);
    }
  }, [userId, loadHistory, texts.deleteSuccess]);

  /**
   * Handle recalculate
   */
  const handleRecalculate = useCallback((record: CalculationHistoryRecord) => {
    if (onRecalculate) {
      onRecalculate(record);
    }
  }, [onRecalculate]);

  /**
   * Handle export history
   */
  const handleExport = useCallback(() => {
    try {
      // Format data as CSV
      const csvHeader = 'Date,Service,Type,Amount\n';
      const csvRows = filteredHistory.map(record => {
        const date = new Date(record.created_at).toLocaleDateString();
        const service = record.fiscal_service_code;
        const type = record.calculation_type;
        const amount = record.calculated_amount;
        return `${date},${service},${type},${amount}`;
      }).join('\n');

      const csv = csvHeader + csvRows;
      console.log('[HistoryScreen] Export CSV:', csv);

      Alert.alert(texts.exportSuccess, `${filteredHistory.length} ${texts.records}`);
    } catch (error) {
      console.error('[HistoryScreen] Export error:', error);
    }
  }, [filteredHistory, texts]);

  /**
   * Handle clear history
   */
  const handleClearHistory = useCallback(() => {
    Alert.alert(
      texts.confirmClearTitle,
      texts.confirmClearMessage,
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
              const success = await calculationHistoryService.clearHistory(userId);
              if (success) {
                Alert.alert(texts.clearSuccess);
                loadHistory();
              }
            } catch (error) {
              console.error('[HistoryScreen] Clear history error:', error);
            }
          },
        },
      ]
    );
  }, [userId, loadHistory, texts]);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setSelectedService('');
    setSelectedType('');
    setDateFrom('');
    setDateTo('');
  }, []);

  /**
   * Check if filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return !!(selectedService || selectedType || dateFrom || dateTo);
  }, [selectedService, selectedType, dateFrom, dateTo]);

  /**
   * Render history card with swipe actions
   */
  const renderHistoryCard = useCallback(({ item }: { item: CalculationHistoryRecord }) => {
    const swipeActions: SwipeAction[] = [
      {
        text: texts.delete,
        color: '#FF3B30',
        textColor: '#FFFFFF',
        onPress: () => handleDelete(item),
      },
    ];

    return (
      <SwipeActions rightActions={swipeActions}>
        <HistoryCard
          record={item}
          language={language}
          onRecalculate={() => handleRecalculate(item)}
          onDelete={() => handleDelete(item)}
        />
      </SwipeActions>
    );
  }, [language, handleDelete, handleRecalculate, texts.delete]);

  /**
   * Render filters modal
   */
  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{texts.filters}</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filtersList}>
            {/* Service Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>{texts.filterByService}</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !selectedService && styles.filterOptionActive
                  ]}
                  onPress={() => setSelectedService('')}>
                  <Text style={[
                    styles.filterOptionText,
                    !selectedService && styles.filterOptionTextActive
                  ]}>
                    {texts.allServices}
                  </Text>
                </TouchableOpacity>
                {uniqueServices.map(service => (
                  <TouchableOpacity
                    key={service}
                    style={[
                      styles.filterOption,
                      selectedService === service && styles.filterOptionActive
                    ]}
                    onPress={() => setSelectedService(service)}>
                    <Text style={[
                      styles.filterOptionText,
                      selectedService === service && styles.filterOptionTextActive
                    ]}>
                      {String(service)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>{texts.filterByType}</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !selectedType && styles.filterOptionActive
                  ]}
                  onPress={() => setSelectedType('')}>
                  <Text style={[
                    styles.filterOptionText,
                    !selectedType && styles.filterOptionTextActive
                  ]}>
                    {texts.allTypes}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    selectedType === 'expedition' && styles.filterOptionActive
                  ]}
                  onPress={() => setSelectedType('expedition')}>
                  <Text style={[
                    styles.filterOptionText,
                    selectedType === 'expedition' && styles.filterOptionTextActive
                  ]}>
                    {texts.expedition}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    selectedType === 'renewal' && styles.filterOptionActive
                  ]}
                  onPress={() => setSelectedType('renewal')}>
                  <Text style={[
                    styles.filterOptionText,
                    selectedType === 'renewal' && styles.filterOptionTextActive
                  ]}>
                    {texts.renewal}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>{texts.filterByDateRange}</Text>
              <View style={styles.dateInputs}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>{texts.dateFrom}</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={dateFrom}
                    onChangeText={setDateFrom}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>{texts.dateTo}</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={dateTo}
                    onChangeText={setDateTo}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.clearButton]}
              onPress={clearFilters}>
              <Text style={styles.clearButtonText}>{texts.clearFilters}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.applyButton]}
              onPress={() => setShowFilters(false)}>
              <Text style={styles.applyButtonText}>{texts.applyFilters}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← </Text>
        </TouchableOpacity>
        <Text style={styles.title}>{texts.title}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowFilters(true)}>
            <Text style={styles.iconButtonText}>🔍</Text>
            {hasActiveFilters && <View style={styles.filterBadge} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleExport}>
            <Text style={styles.iconButtonText}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {filteredHistory.length} {texts.records}
        </Text>
        {filteredHistory.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Text style={styles.clearHistoryButton}>{texts.clearHistory}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{texts.loading}</Text>
        </View>
      ) : filteredHistory.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {hasActiveFilters ? texts.emptyFiltered : texts.empty}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          renderItem={renderHistoryCard}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Filters Modal */}
      {renderFiltersModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  iconButtonText: {
    fontSize: 20,
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
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
  clearHistoryButton: {
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
  emptyText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  filtersList: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666666',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateInputs: {
    gap: 12,
  },
  dateInputContainer: {
    gap: 6,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666666',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
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
  clearButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
