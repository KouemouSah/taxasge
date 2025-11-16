/**
 * TaxasGE Mobile - Services List Screen
 * Displays all synced fiscal services for data validation
 * Date: 2025-10-17
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
  Animated,
  Share,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { FiscalService, getServiceName, getCategoryName, fiscalServicesService, SearchFilters } from '../database/services/FiscalServicesService';
import { favoritesService } from '../database/services/FavoritesService';
import { getUserId } from '../config/AppConfig';
import { useServices } from '../providers/ServicesProvider';

export interface ServicesListScreenProps {
  language: 'es' | 'fr' | 'en';
  initialPage?: number;
  onPageChange?: (page: number) => void;
  onBack?: () => void;
  onServicePress?: (service: FiscalService) => void;
}

const TEXTS = {
  es: {
    title: 'Servicios Fiscales',
    subtitle: 'servicios sincronizados',
    loading: 'Cargando servicios...',
    error: 'Error al cargar servicios',
    empty: 'No hay servicios disponibles',
    expedition: 'Expedición',
    renewal: 'Renovación',
    page: 'Página',
    of: 'de',
    search: 'Buscar servicios...',
    filters: 'Filtros',
    filterByMinistry: 'Filtrar por ministerio',
    filterByCategory: 'Filtrar por categoría',
    filterByType: 'Filtrar por tipo',
    filterByCalcMethod: 'Filtrar por método de cálculo',
    filterByPrice: 'Filtrar por precio',
    sortBy: 'Ordenar por',
    allMinistries: 'Todos los ministerios',
    allCategories: 'Todas las categorías',
    allTypes: 'Todos los tipos',
    allCalcMethods: 'Todos los métodos',
    minPrice: 'Precio mínimo',
    maxPrice: 'Precio máximo',
    sortNameAsc: 'Nombre (A-Z)',
    sortNameDesc: 'Nombre (Z-A)',
    sortPriceAsc: 'Precio (bajo-alto)',
    sortPriceDesc: 'Precio (alto-bajo)',
    sortPopularity: 'Más populares',
    clearFilters: 'Limpiar filtros',
    applyFilters: 'Aplicar',
    activeFilters: 'filtros activos',
    // Calculation methods
    calc_fixed_expedition: 'Precio fijo (expedición)',
    calc_fixed_renewal: 'Precio fijo (renovación)',
    calc_fixed_both: 'Precio fijo (ambos)',
    calc_percentage_based: 'Basado en porcentaje',
    calc_unit_based: 'Basado en unidades',
    calc_tiered_rates: 'Tarifas escalonadas',
    calc_formula_based: 'Basado en fórmula',
    calc_fixed_plus_unit: 'Fijo + unidades',
    actions: 'Acciones',
    copy: 'Copiar',
    share: 'Compartir',
    export: 'Exportar',
    exportAll: 'Exportar Todo',
    success: 'Éxito',
    copied: 'Información copiada al portapapeles',
    cancel: 'Cancelar',
  },
  fr: {
    title: 'Services Fiscaux',
    subtitle: 'services synchronisés',
    loading: 'Chargement des services...',
    error: 'Erreur lors du chargement',
    empty: 'Aucun service disponible',
    expedition: 'Expédition',
    renewal: 'Renouvellement',
    page: 'Page',
    of: 'sur',
    search: 'Rechercher des services...',
    filters: 'Filtres',
    filterByMinistry: 'Filtrer par ministère',
    filterByCategory: 'Filtrer par catégorie',
    filterByType: 'Filtrer par type',
    filterByCalcMethod: 'Filtrer par méthode de calcul',
    filterByPrice: 'Filtrer par prix',
    sortBy: 'Trier par',
    allMinistries: 'Tous les ministères',
    allCategories: 'Toutes les catégories',
    allTypes: 'Tous les types',
    allCalcMethods: 'Toutes les méthodes',
    minPrice: 'Prix minimum',
    maxPrice: 'Prix maximum',
    sortNameAsc: 'Nom (A-Z)',
    sortNameDesc: 'Nom (Z-A)',
    sortPriceAsc: 'Prix (bas-haut)',
    sortPriceDesc: 'Prix (haut-bas)',
    sortPopularity: 'Plus populaires',
    clearFilters: 'Effacer les filtres',
    applyFilters: 'Appliquer',
    activeFilters: 'filtres actifs',
    // Calculation methods
    calc_fixed_expedition: 'Prix fixe (expédition)',
    calc_fixed_renewal: 'Prix fixe (renouvellement)',
    calc_fixed_both: 'Prix fixe (les deux)',
    calc_percentage_based: 'Basé sur pourcentage',
    calc_unit_based: 'Basé sur unités',
    calc_tiered_rates: 'Tarifs échelonnés',
    calc_formula_based: 'Basé sur formule',
    calc_fixed_plus_unit: 'Fixe + unités',
    actions: 'Actions',
    copy: 'Copier',
    share: 'Partager',
    export: 'Exporter',
    exportAll: 'Tout exporter',
    success: 'Succès',
    copied: 'Informations copiées dans le presse-papiers',
    cancel: 'Annuler',
  },
  en: {
    title: 'Fiscal Services',
    subtitle: 'services synced',
    loading: 'Loading services...',
    error: 'Error loading services',
    empty: 'No services available',
    expedition: 'Expedition',
    renewal: 'Renewal',
    page: 'Page',
    of: 'of',
    search: 'Search services...',
    filters: 'Filters',
    filterByMinistry: 'Filter by ministry',
    filterByCategory: 'Filter by category',
    filterByType: 'Filter by type',
    filterByCalcMethod: 'Filter by calculation method',
    filterByPrice: 'Filter by price',
    sortBy: 'Sort by',
    allMinistries: 'All ministries',
    allCategories: 'All categories',
    allTypes: 'All types',
    allCalcMethods: 'All methods',
    minPrice: 'Minimum price',
    maxPrice: 'Maximum price',
    sortNameAsc: 'Name (A-Z)',
    sortNameDesc: 'Name (Z-A)',
    sortPriceAsc: 'Price (low-high)',
    sortPriceDesc: 'Price (high-low)',
    sortPopularity: 'Most popular',
    clearFilters: 'Clear filters',
    applyFilters: 'Apply',
    activeFilters: 'active filters',
    // Calculation methods
    calc_fixed_expedition: 'Fixed price (expedition)',
    calc_fixed_renewal: 'Fixed price (renewal)',
    calc_fixed_both: 'Fixed price (both)',
    calc_percentage_based: 'Percentage-based',
    calc_unit_based: 'Unit-based',
    calc_tiered_rates: 'Tiered rates',
    calc_formula_based: 'Formula-based',
    calc_fixed_plus_unit: 'Fixed + units',
    actions: 'Actions',
    copy: 'Copy',
    share: 'Share',
    export: 'Export',
    exportAll: 'Export All',
    success: 'Success',
    copied: 'Information copied to clipboard',
    cancel: 'Cancel',
  },
};

export const ServicesListScreen: React.FC<ServicesListScreenProps> = ({
  language,
  initialPage = 1,
  onPageChange,
  onBack,
  onServicePress,
}) => {
  const { services: allServices, isLoading, error, loadServices } = useServices();
  const [displayedServices, setDisplayedServices] = useState<FiscalService[]>([]);
  const [filteredServices, setFilteredServices] = useState<FiscalService[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedServiceType, setSelectedServiceType] = useState<string | undefined>(undefined);
  const [selectedCalculationMethod, setSelectedCalculationMethod] = useState<string | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'popularity' | undefined>(undefined);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  // Picker modals state
  const [showMinistryPicker, setShowMinistryPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCalcMethodPicker, setShowCalcMethodPicker] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);

  // Filter options
  const [ministries, setMinistries] = useState<Array<{ id: string; name: string; name_fr?: string; name_en?: string; code: string; count: number }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; name_fr?: string; name_en?: string; code: string; count: number }>>([]);
  const [serviceTypes, setServiceTypes] = useState<Array<{ type: string; count: number }>>([]);
  const [calculationMethods, setCalculationMethods] = useState<Array<{ method: string; count: number }>>([]);

  const ITEMS_PER_PAGE = 20;

  // Action Menu State
  const [selectedService, setSelectedService] = useState<FiscalService | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);

  // Favorites State
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const userId = getUserId();

  // Load favorites on mount
  useEffect(() => {
    const loadFavorites = async () => {
      if (userId) {
        try {
          const favorites = await favoritesService.getUserFavorites(userId);
          const ids = new Set(favorites.map(f => f.fiscal_service_code));
          setFavoriteIds(ids);
        } catch (error) {
          console.error('[ServicesListScreen] Load favorites error:', error);
        }
      }
    };
    loadFavorites();
  }, [userId]);

  // Format amount helper function
  const formatAmount = useCallback((amount: number): string => {
    return amount.toLocaleString('es-GQ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }, []);

  // Copy Service Info to Clipboard
  const copyServiceInfo = useCallback(async (service: FiscalService) => {
    const info = `${getServiceName(service, language)}
Code: ${service.service_code}
Prix expédition: ${formatAmount(service.tasa_expedicion)} XAF
${service.tasa_renovacion ? `Prix renouvellement: ${formatAmount(service.tasa_renovacion)} XAF` : ''}
${getCategoryName(service, language) ? `Catégorie: ${getCategoryName(service, language)}` : ''}`;

    Clipboard.setString(info);
    Alert.alert(
      TEXTS[language].success || 'Succès',
      TEXTS[language].copied || 'Informations copiées dans le presse-papiers'
    );
  }, [language, formatAmount]);

  // Share Service Info
  const shareServiceInfo = useCallback(async (service: FiscalService) => {
    try {
      const message = `${getServiceName(service, language)}

Code: ${service.service_code}
Prix expédition: ${formatAmount(service.tasa_expedicion)} XAF
${service.tasa_renovacion ? `Prix renouvellement: ${formatAmount(service.tasa_renovacion)} XAF\n` : ''}
${getCategoryName(service, language) ? `Catégorie: ${getCategoryName(service, language)}\n` : ''}
${service.description_es ? `Description: ${service.description_es}` : ''}

Via TaxasGE Mobile`;

      await Share.share({
        message,
        title: getServiceName(service, language),
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [language, formatAmount]);

  // Export Service to CSV format
  const exportServiceToCSV = useCallback(async (service: FiscalService) => {
    const csvData = `"Nom","Code","Prix Expédition","Prix Renouvellement","Catégorie"
"${getServiceName(service, language)}","${service.service_code}","${service.tasa_expedicion}","${service.tasa_renovacion || ''}","${getCategoryName(service, language) || ''}"`;

    Clipboard.setString(csvData);
    Alert.alert(
      TEXTS[language].success || 'Succès',
      'Données CSV copiées. Vous pouvez les coller dans Excel/Google Sheets.'
    );
  }, [language]);

  // Export All Services to CSV
  const exportAllServicesCSV = useCallback(async () => {
    let csvData = `"Nom","Code","Prix Expédition","Prix Renouvellement","Catégorie"\n`;

    filteredServices.slice(0, 100).forEach(service => {
      csvData += `"${getServiceName(service, language)}","${service.service_code}","${service.tasa_expedicion}","${service.tasa_renovacion || ''}","${getCategoryName(service, language) || ''}"\n`;
    });

    Clipboard.setString(csvData);
    Alert.alert(
      TEXTS[language].success || 'Succès',
      `${Math.min(filteredServices.length, 100)} services exportés en CSV (copiés dans le presse-papiers)`
    );
  }, [filteredServices, language]);

  // Toggle Favorite
  const handleToggleFavorite = useCallback(async (service: FiscalService) => {
    if (!userId) {
      console.warn('[ServicesListScreen] No userId available for favorites');
      return;
    }

    const isFavorite = favoriteIds.has(service.service_code);

    try {
      if (isFavorite) {
        await favoritesService.removeFavorite(userId, service.service_code);
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(service.service_code);
          return newSet;
        });
      } else {
        await favoritesService.addFavorite(userId, service.service_code);
        setFavoriteIds(prev => new Set(prev).add(service.service_code));
      }
    } catch (error) {
      console.error('[ServicesListScreen] Toggle favorite error:', error);
      Alert.alert(
        'Erreur',
        `Impossible de ${isFavorite ? 'retirer' : 'ajouter'} le favori`
      );
    }
  }, [userId, favoriteIds]);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [ministriesData, categoriesData, typesData] = await Promise.all([
          fiscalServicesService.getMinistries(),
          fiscalServicesService.getCategories(),
          fiscalServicesService.getServiceTypes(),
        ]);

        // Extract calculation methods from services
        const methodsMap: Record<string, number> = {};
        allServices.forEach(service => {
          if (service.calculation_method) {
            methodsMap[service.calculation_method] = (methodsMap[service.calculation_method] || 0) + 1;
          }
        });
        const methodsData = Object.entries(methodsMap).map(([method, count]) => ({
          method,
          count,
        }));

        console.log('[ServicesListScreen] Loaded filter options:', {
          ministries: ministriesData.length,
          categories: categoriesData.length,
          serviceTypes: typesData.length,
          calculationMethods: methodsData.length
        });
        setMinistries(ministriesData);
        setCategories(categoriesData);
        setServiceTypes(typesData);
        setCalculationMethods(methodsData);
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };
    loadFilterOptions();
  }, [allServices]);

  // Debug: Log when modal opens
  useEffect(() => {
    if (showFiltersModal) {
      console.log('[ServicesListScreen] Modal opened. Available options:', {
        ministries: ministries.length,
        categories: categories.length,
        serviceTypes: serviceTypes.length
      });
    }
  }, [showFiltersModal, ministries, categories, serviceTypes]);

  // Search Debouncing - Optimizes search performance
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      applyFilters();
    }, 500); // 500ms delay after user stops typing

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    // Load services (will use cache if already loaded)
    loadServices();
  }, [loadServices]);

  // Apply filters
  const applyFilters = useCallback(async () => {
    setIsFiltering(true);
    try {
      const hasFilters = searchQuery.trim() || selectedMinistryId || selectedCategoryId || selectedServiceType || selectedCalculationMethod || minPrice || maxPrice;

      let results: FiscalService[] = [];

      if (!hasFilters) {
        // No filters, use all services
        results = [...allServices];
      } else {
        // Apply filters
        const filters: SearchFilters = {
          searchQuery: searchQuery.trim() || undefined,
          ministryId: selectedMinistryId,
          categoryId: selectedCategoryId,
          serviceType: selectedServiceType,
          calculationMethod: selectedCalculationMethod,
          minAmount: minPrice ? parseFloat(minPrice) : undefined,
          maxAmount: maxPrice ? parseFloat(maxPrice) : undefined,
        };

        results = await fiscalServicesService.getFiltered(filters, 1000);
      }

      // Apply sorting
      if (sortBy) {
        results = [...results].sort((a, b) => {
          switch (sortBy) {
            case 'name_asc':
              return getServiceName(a, language).localeCompare(getServiceName(b, language));
            case 'name_desc':
              return getServiceName(b, language).localeCompare(getServiceName(a, language));
            case 'price_asc':
              return a.tasa_expedicion - b.tasa_expedicion;
            case 'price_desc':
              return b.tasa_expedicion - a.tasa_expedicion;
            case 'popularity':
              return (b.favorite_count || 0) - (a.favorite_count || 0) || (b.view_count || 0) - (a.view_count || 0);
            default:
              return 0;
          }
        });
      }

      setFilteredServices(results);

      // Reset to page 1 when filters change
      setCurrentPage(1);
    } catch (err) {
      console.error('Error applying filters:', err);
      setFilteredServices(allServices);
    } finally {
      setIsFiltering(false);
    }
  }, [searchQuery, selectedMinistryId, selectedCategoryId, selectedServiceType, selectedCalculationMethod, minPrice, maxPrice, sortBy, allServices, language]);

  // Apply filters when services load or filter values change
  useEffect(() => {
    if (allServices.length > 0) {
      applyFilters();
    }
  }, [allServices, applyFilters]);

  useEffect(() => {
    // Update displayed services when page changes or filtered services change
    if (filteredServices.length > 0) {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = currentPage * ITEMS_PER_PAGE;
      setDisplayedServices(filteredServices.slice(startIndex, endIndex));
    } else {
      setDisplayedServices([]);
    }
  }, [currentPage, filteredServices]);

  const goToNextPage = useCallback(() => {
    const maxPage = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
    if (currentPage < maxPage) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  }, [filteredServices.length, currentPage, onPageChange]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  }, [currentPage, onPageChange]);

  const totalPages = useMemo(() => Math.ceil(filteredServices.length / ITEMS_PER_PAGE), [filteredServices.length]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedMinistryId(undefined);
    setSelectedCategoryId(undefined);
    setSelectedServiceType(undefined);
    setSelectedCalculationMethod(undefined);
    setMinPrice('');
    setMaxPrice('');
    setSortBy(undefined);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedMinistryId) count++;
    if (selectedCategoryId) count++;
    if (selectedServiceType) count++;
    if (selectedCalculationMethod) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (sortBy) count++;
    return count;
  }, [searchQuery, selectedMinistryId, selectedCategoryId, selectedServiceType, selectedCalculationMethod, minPrice, maxPrice, sortBy]);

  const getMinistryName = useCallback((ministry: typeof ministries[0]) => {
    if (language === 'fr' && ministry.name_fr) return ministry.name_fr;
    if (language === 'en' && ministry.name_en) return ministry.name_en;
    return ministry.name;
  }, [language]);

  const getCategoryNameFromOption = useCallback((category: typeof categories[0]) => {
    if (language === 'fr' && category.name_fr) return category.name_fr;
    if (language === 'en' && category.name_en) return category.name_en;
    return category.name;
  }, [language]);

  const renderService = useCallback(({ item }: { item: FiscalService }) => {
    return (
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => onServicePress?.(item)}
        activeOpacity={0.7}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceHeaderLeft}>
            <Text style={styles.serviceName} numberOfLines={2}>{String(getServiceName(item, language) || '')}</Text>
            {item.ministry_color ? <View style={[styles.ministryDot, { backgroundColor: item.ministry_color }]} /> : null}
          </View>
          <View style={styles.serviceHeaderRight}>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleToggleFavorite(item);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.favoriteIcon}>
                {favoriteIds.has(item.service_code) ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedService(item);
                setShowActionsModal(true);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.actionButtonIcon}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>

        {getCategoryName(item, language) ? (
          <Text style={styles.categoryName} numberOfLines={1}>
            {String(getCategoryName(item, language))}
          </Text>
        ) : null}

        <View style={styles.pricesContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{String(TEXTS[language].expedition)}:</Text>
            <Text style={styles.priceValue}>{String(`${formatAmount(item.tasa_expedicion)} XAF`)}</Text>
          </View>
          {(item.tasa_renovacion && item.tasa_renovacion > 0) ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{String(TEXTS[language].renewal)}:</Text>
              <Text style={styles.priceValue}>{String(`${formatAmount(item.tasa_renovacion)} XAF`)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metadataRow}>
          <Text style={styles.metadataText}>ID: {String(item.id || 'N/A')}</Text>
          <Text style={styles.metadataText}>Code: {String(item.service_code || 'N/A')}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [formatAmount, language, onServicePress, favoriteIds, handleToggleFavorite]);

  // Skeleton Loader Component with Pulse Animation
  const SkeletonCard = () => {
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, [pulseAnim]);

    const opacity = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonHeader}>
          <Animated.View style={[styles.skeletonBox, styles.skeletonTitle, { opacity }]} />
          <Animated.View style={[styles.skeletonBox, styles.skeletonBadge, { opacity }]} />
        </View>
        <Animated.View style={[styles.skeletonBox, styles.skeletonSubtitle, { opacity }]} />
        <View style={styles.skeletonFooter}>
          <Animated.View style={[styles.skeletonBox, styles.skeletonPrice, { opacity }]} />
          <Animated.View style={[styles.skeletonBox, styles.skeletonButton, { opacity }]} />
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          )}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{TEXTS[language].title}</Text>
            <Text style={styles.headerSubtitle}>{TEXTS[language].loading}...</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Skeleton Loader */}
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <SkeletonCard key={item} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{TEXTS[language].error}</Text>
        <Text style={styles.errorDetails}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadServices()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{TEXTS[language].title}</Text>
          <Text style={styles.headerSubtitle}>
            {`${filteredServices.length} / ${allServices.length} ${TEXTS[language].subtitle}`}
          </Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={TEXTS[language].search}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[styles.filtersButton, activeFiltersCount > 0 && styles.filtersButtonActive]}
          onPress={() => setShowFiltersModal(true)}>
          <Text style={[styles.filtersButtonText, activeFiltersCount > 0 && styles.filtersButtonTextActive]}>
            {TEXTS[language].filters}
            {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {searchQuery.trim() && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText} numberOfLines={1}>
                  {searchQuery.trim()}
                </Text>
              </View>
            )}
            {selectedMinistryId && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText} numberOfLines={1}>
                  {getMinistryName(ministries.find(m => m.id === selectedMinistryId)!)}
                </Text>
              </View>
            )}
            {selectedCategoryId && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText} numberOfLines={1}>
                  {getCategoryNameFromOption(categories.find(c => c.id === selectedCategoryId)!)}
                </Text>
              </View>
            )}
            {selectedServiceType && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText} numberOfLines={1}>
                  {selectedServiceType}
                </Text>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersButtonText}>{TEXTS[language].clearFilters}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading indicator for filtering */}
      {isFiltering && (
        <View style={styles.filteringIndicator}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}

      {/* Services List */}
      <FlatList
        data={displayedServices}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
        onEndReached={goToNextPage}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{TEXTS[language].empty}</Text>
          </View>
        }
        ListFooterComponent={
          isFiltering ? (
            <View style={styles.listFooterLoader}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : null
        }
      />

      {/* Pagination Controls */}
      {allServices.length > 0 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={goToPreviousPage}
            disabled={currentPage === 1}>
            <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
              ←
            </Text>
          </TouchableOpacity>

          <View style={styles.paginationInfo}>
            <Text style={styles.paginationText}>
              {`${TEXTS[language].page} ${currentPage} ${TEXTS[language].of} ${totalPages}`}
            </Text>
            <Text style={styles.paginationSubtext}>
              {`(${displayedServices.length} ${language === 'fr' ? 'services' : language === 'es' ? 'servicios' : 'services'})`}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
            onPress={goToNextPage}
            disabled={currentPage === totalPages}>
            <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
              →
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFiltersModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{TEXTS[language].filters}</Text>
              <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Ministry Filter - Dropdown Style */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>{TEXTS[language].filterByMinistry}</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowMinistryPicker(true)}>
                  <Text style={styles.dropdownButtonText}>
                    {selectedMinistryId
                      ? getMinistryName(ministries.find(m => m.id === selectedMinistryId) || ministries[0])
                      : TEXTS[language].allMinistries}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Category Filter - Dropdown Style */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>{TEXTS[language].filterByCategory}</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowCategoryPicker(true)}>
                  <Text style={styles.dropdownButtonText}>
                    {selectedCategoryId
                      ? getCategoryNameFromOption(categories.find(c => c.id === selectedCategoryId) || categories[0])
                      : TEXTS[language].allCategories}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Service Type Filter - Dropdown Style */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>{TEXTS[language].filterByType}</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowTypePicker(true)}>
                  <Text style={styles.dropdownButtonText}>
                    {selectedServiceType || TEXTS[language].allTypes}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Calculation Method Filter - Dropdown Style */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>{TEXTS[language].filterByCalcMethod}</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowCalcMethodPicker(true)}>
                  <Text style={styles.dropdownButtonText}>
                    {selectedCalculationMethod
                      ? (TEXTS[language][`calc_${selectedCalculationMethod}` as keyof typeof TEXTS[typeof language]] || selectedCalculationMethod)
                      : TEXTS[language].allCalcMethods}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>{TEXTS[language].filterByPrice}</Text>
                <View style={styles.priceInputsContainer}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder={TEXTS[language].minPrice}
                    placeholderTextColor="#999"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                  />
                  <Text style={styles.priceSeparator}>-</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder={TEXTS[language].maxPrice}
                    placeholderTextColor="#999"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Sort By - Dropdown Style */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>{TEXTS[language].sortBy}</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowSortPicker(true)}>
                  <Text style={styles.dropdownButtonText}>
                    {sortBy === 'name_asc' ? TEXTS[language].sortNameAsc :
                     sortBy === 'name_desc' ? TEXTS[language].sortNameDesc :
                     sortBy === 'price_asc' ? TEXTS[language].sortPriceAsc :
                     sortBy === 'price_desc' ? TEXTS[language].sortPriceDesc :
                     sortBy === 'popularity' ? TEXTS[language].sortPopularity :
                     TEXTS[language].allTypes}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalClearButton} onPress={clearFilters}>
                <Text style={styles.modalClearButtonText}>{TEXTS[language].clearFilters}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalApplyButton} onPress={() => setShowFiltersModal(false)}>
                <Text style={styles.modalApplyButtonText}>{TEXTS[language].applyFilters}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ministry Picker Modal */}
      <Modal
        visible={showMinistryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMinistryPicker(false)}>
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{TEXTS[language].filterByMinistry}</Text>
              <TouchableOpacity onPress={() => setShowMinistryPicker(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerContent}>
              <TouchableOpacity
                style={[styles.pickerOption, !selectedMinistryId && styles.pickerOptionSelected]}
                onPress={() => {
                  setSelectedMinistryId(undefined);
                  setShowMinistryPicker(false);
                }}>
                <Text style={[styles.pickerOptionText, !selectedMinistryId && styles.pickerOptionTextSelected]}>
                  {TEXTS[language].allMinistries}
                </Text>
              </TouchableOpacity>
              {ministries.map((ministry) => (
                <TouchableOpacity
                  key={ministry.id}
                  style={[styles.pickerOption, selectedMinistryId === ministry.id && styles.pickerOptionSelected]}
                  onPress={() => {
                    setSelectedMinistryId(ministry.id);
                    setShowMinistryPicker(false);
                  }}>
                  <Text style={[styles.pickerOptionText, selectedMinistryId === ministry.id && styles.pickerOptionTextSelected]}>
                    {getMinistryName(ministry)} ({ministry.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryPicker(false)}>
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{TEXTS[language].filterByCategory}</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerContent}>
              <TouchableOpacity
                style={[styles.pickerOption, !selectedCategoryId && styles.pickerOptionSelected]}
                onPress={() => {
                  setSelectedCategoryId(undefined);
                  setShowCategoryPicker(false);
                }}>
                <Text style={[styles.pickerOptionText, !selectedCategoryId && styles.pickerOptionTextSelected]}>
                  {TEXTS[language].allCategories}
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.pickerOption, selectedCategoryId === category.id && styles.pickerOptionSelected]}
                  onPress={() => {
                    setSelectedCategoryId(category.id);
                    setShowCategoryPicker(false);
                  }}>
                  <Text style={[styles.pickerOptionText, selectedCategoryId === category.id && styles.pickerOptionTextSelected]}>
                    {getCategoryNameFromOption(category)} ({category.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTypePicker(false)}>
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{TEXTS[language].filterByType}</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerContent}>
              <TouchableOpacity
                style={[styles.pickerOption, !selectedServiceType && styles.pickerOptionSelected]}
                onPress={() => {
                  setSelectedServiceType(undefined);
                  setShowTypePicker(false);
                }}>
                <Text style={[styles.pickerOptionText, !selectedServiceType && styles.pickerOptionTextSelected]}>
                  {TEXTS[language].allTypes}
                </Text>
              </TouchableOpacity>
              {serviceTypes.map((type) => (
                <TouchableOpacity
                  key={type.type}
                  style={[styles.pickerOption, selectedServiceType === type.type && styles.pickerOptionSelected]}
                  onPress={() => {
                    setSelectedServiceType(type.type);
                    setShowTypePicker(false);
                  }}>
                  <Text style={[styles.pickerOptionText, selectedServiceType === type.type && styles.pickerOptionTextSelected]}>
                    {type.type} ({type.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Calculation Method Picker Modal */}
      <Modal
        visible={showCalcMethodPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalcMethodPicker(false)}>
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{TEXTS[language].filterByCalcMethod}</Text>
              <TouchableOpacity onPress={() => setShowCalcMethodPicker(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerContent}>
              <TouchableOpacity
                style={[styles.pickerOption, !selectedCalculationMethod && styles.pickerOptionSelected]}
                onPress={() => {
                  setSelectedCalculationMethod(undefined);
                  setShowCalcMethodPicker(false);
                }}>
                <Text style={[styles.pickerOptionText, !selectedCalculationMethod && styles.pickerOptionTextSelected]}>
                  {TEXTS[language].allCalcMethods}
                </Text>
              </TouchableOpacity>
              {calculationMethods.map((method) => (
                <TouchableOpacity
                  key={method.method}
                  style={[styles.pickerOption, selectedCalculationMethod === method.method && styles.pickerOptionSelected]}
                  onPress={() => {
                    setSelectedCalculationMethod(method.method);
                    setShowCalcMethodPicker(false);
                  }}>
                  <Text style={[styles.pickerOptionText, selectedCalculationMethod === method.method && styles.pickerOptionTextSelected]}>
                    {TEXTS[language][`calc_${method.method}` as keyof typeof TEXTS[typeof language]] || method.method} ({method.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sort Picker Modal */}
      <Modal
        visible={showSortPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSortPicker(false)}>
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{TEXTS[language].sortBy}</Text>
              <TouchableOpacity onPress={() => setShowSortPicker(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerContent}>
              <TouchableOpacity
                style={[styles.pickerOption, !sortBy && styles.pickerOptionSelected]}
                onPress={() => {
                  setSortBy(undefined);
                  setShowSortPicker(false);
                }}>
                <Text style={[styles.pickerOptionText, !sortBy && styles.pickerOptionTextSelected]}>
                  {TEXTS[language].allTypes}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerOption, sortBy === 'name_asc' && styles.pickerOptionSelected]}
                onPress={() => {
                  setSortBy('name_asc');
                  setShowSortPicker(false);
                }}>
                <Text style={[styles.pickerOptionText, sortBy === 'name_asc' && styles.pickerOptionTextSelected]}>
                  {TEXTS[language].sortNameAsc}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerOption, sortBy === 'name_desc' && styles.pickerOptionSelected]}
                onPress={() => {
                  setSortBy('name_desc');
                  setShowSortPicker(false);
                }}>
                <Text style={[styles.pickerOptionText, sortBy === 'name_desc' && styles.pickerOptionTextSelected]}>
                  {TEXTS[language].sortNameDesc}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerOption, sortBy === 'price_asc' && styles.pickerOptionSelected]}
                onPress={() => {
                  setSortBy('price_asc');
                  setShowSortPicker(false);
                }}>
                <Text style={[styles.pickerOptionText, sortBy === 'price_asc' && styles.pickerOptionTextSelected]}>
                  {TEXTS[language].sortPriceAsc}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerOption, sortBy === 'price_desc' && styles.pickerOptionSelected]}
                onPress={() => {
                  setSortBy('price_desc');
                  setShowSortPicker(false);
                }}>
                <Text style={[styles.pickerOptionText, sortBy === 'price_desc' && styles.pickerOptionTextSelected]}>
                  {TEXTS[language].sortPriceDesc}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerOption, sortBy === 'popularity' && styles.pickerOptionSelected]}
                onPress={() => {
                  setSortBy('popularity');
                  setShowSortPicker(false);
                }}>
                <Text style={[styles.pickerOptionText, sortBy === 'popularity' && styles.pickerOptionTextSelected]}>
                  {TEXTS[language].sortPopularity}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Actions Menu Modal */}
      <Modal
        visible={showActionsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowActionsModal(false)}>
        <View style={styles.pickerModalOverlay}>
          <View style={styles.actionsModalContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{TEXTS[language].actions}</Text>
              <TouchableOpacity onPress={() => setShowActionsModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedService && (
              <View style={styles.selectedServiceInfo}>
                <Text style={styles.selectedServiceName} numberOfLines={2}>
                  {String(getServiceName(selectedService, language) || '')}
                </Text>
                <Text style={styles.selectedServiceCode}>{String(selectedService.service_code || '')}</Text>
              </View>
            )}

            <View style={styles.actionsContent}>
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => {
                  if (selectedService) {
                    copyServiceInfo(selectedService);
                    setShowActionsModal(false);
                  }
                }}>
                <Text style={styles.actionMenuIcon}>📋</Text>
                <Text style={styles.actionMenuText}>{TEXTS[language].copy}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => {
                  if (selectedService) {
                    shareServiceInfo(selectedService);
                    setShowActionsModal(false);
                  }
                }}>
                <Text style={styles.actionMenuIcon}>📤</Text>
                <Text style={styles.actionMenuText}>{TEXTS[language].share}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => {
                  if (selectedService) {
                    exportServiceToCSV(selectedService);
                    setShowActionsModal(false);
                  }
                }}>
                <Text style={styles.actionMenuIcon}>📊</Text>
                <Text style={styles.actionMenuText}>{TEXTS[language].export}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => {
                  exportAllServicesCSV();
                  setShowActionsModal(false);
                }}>
                <Text style={styles.actionMenuIcon}>📁</Text>
                <Text style={styles.actionMenuText}>{TEXTS[language].exportAll}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionMenuItem, styles.actionMenuItemCancel]}
                onPress={() => setShowActionsModal(false)}>
                <Text style={styles.actionMenuTextCancel}>{TEXTS[language].cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    width: 40, // Balance the back button
  },

  // List
  listContent: {
    padding: 12,
  },
  listFooterLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },

  // Service Card
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 12,
  },
  ministryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  serviceHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  serviceHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 20,
    color: '#FFB300',
    lineHeight: 20,
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  actionButtonIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    lineHeight: 20,
  },
  categoryName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  pricesContainer: {
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  metadataText: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },

  // Pagination
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  paginationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paginationButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  paginationButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paginationButtonTextDisabled: {
    color: '#999',
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  paginationSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  // Filters
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    fontSize: 14,
    color: '#1A1A1A',
  },
  filtersButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
  },
  filtersButtonActive: {
    backgroundColor: '#007AFF',
  },
  filtersButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  filtersButtonTextActive: {
    color: '#FFFFFF',
  },
  filteringIndicator: {
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },

  // Active Filters
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  activeFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    marginRight: 8,
    maxWidth: 150,
  },
  activeFilterChipText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFiltersButtonText: {
    fontSize: 12,
    color: '#D32F2F',
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  filterOptionsContainer: {
    // Remove maxHeight to allow full display
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  filterOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  priceInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    fontSize: 14,
    color: '#1A1A1A',
  },
  priceSeparator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  modalClearButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalClearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
  },
  modalApplyButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalApplyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Dropdown Styles
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },

  // Picker Modal Styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  pickerContent: {
    maxHeight: 400,
  },
  pickerOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  pickerOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  pickerOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },

  // Actions Menu Modal Styles
  actionsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  selectedServiceInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  selectedServiceCode: {
    fontSize: 13,
    color: '#666',
  },
  actionsContent: {
    paddingTop: 8,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  actionMenuIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionMenuText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  actionMenuItemCancel: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    justifyContent: 'center',
  },
  actionMenuTextCancel: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Skeleton Loader Styles
  skeletonContainer: {
    padding: 12,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skeletonTitle: {
    width: '60%',
    height: 18,
  },
  skeletonBadge: {
    width: 60,
    height: 24,
    borderRadius: 12,
  },
  skeletonSubtitle: {
    width: '80%',
    height: 14,
    marginBottom: 16,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonPrice: {
    width: 100,
    height: 16,
  },
  skeletonButton: {
    width: 80,
    height: 32,
    borderRadius: 8,
  },
  skeletonBox: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    opacity: 0.6,
  },
});

export default ServicesListScreen;
