/**
 * TaxasGE Mobile - Ministerios Screen
 * Displays all ministries with grid/list toggle
 * Based on ministerio_icones.png and ministerio_liste.png designs
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { GradientHeader } from '../components/GradientHeader';
import { BottomTabBar, TabName } from '../components/BottomTabBar';
import { Icon } from '../components/Icon';
import { Ministry, fiscalServicesService } from '../database/services/FiscalServicesService';
import { Colors, Spacing, Shadows } from '../theme';
import { getSection } from '../i18n';
import { dataCacheService } from '../services/DataCacheService';

type ViewMode = 'grid' | 'list';

interface MinisteriosScreenProps {
  language: 'es' | 'fr' | 'en';
  onBack: () => void;
  onMinistryPress: (ministry: Ministry) => void;
  onTabPress: (tab: TabName) => void;
}

// Ministry gradient colors based on design
const MINISTRY_GRADIENTS = [
  ['#FFD700', '#FFC700'], // Yellow
  ['#40E0D0', '#20CED8'], // Cyan
  ['#FFB347', '#FFA500'], // Orange
  ['#87CEEB', '#6BB6FF'], // Blue
  ['#98D8C8', '#7BC8B8'], // Green
  ['#FFB6C1', '#FFA6B1'], // Pink
  ['#DDA0DD', '#D494D4'], // Plum
  ['#F0E68C', '#EAD96C'], // Khaki
];

export const MinisteriosScreen: React.FC<MinisteriosScreenProps> = ({
  language,
  onBack,
  onMinistryPress,
  onTabPress,
}) => {
  const t = getSection(language, 'ministeriosScreen');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [ministries, setMinistries] = useState<Array<Ministry & { service_count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMinistries();
  }, []);

  const loadMinistries = async () => {
    const startTime = Date.now();
    try {
      setIsLoading(true);

      let results: Array<Ministry & { service_count: number }> = [];

      try {
        // Try cache service first for instant loading
        results = await dataCacheService.getMinistries() as Array<Ministry & { service_count: number }>;
        console.log(`[MinisteriosScreen] ⚡ Loaded ${results.length} ministries in ${Date.now() - startTime}ms (using cache)`);
      } catch (cacheErr) {
        console.warn('[MinisteriosScreen] Cache failed, falling back to database:', cacheErr);

        // Fallback to direct database query using fiscalServicesService
        const ministriesData = await fiscalServicesService.getMinistries();

        results = ministriesData.map(ministry => ({
          id: ministry.id,
          code: ministry.code,
          name_es: ministry.name,
          name_fr: ministry.name_fr,
          name_en: ministry.name_en,
          service_count: ministry.count,
        })) as Array<Ministry & { service_count: number }>;

        console.log(`[MinisteriosScreen] ⚡ Loaded ${results.length} ministries in ${Date.now() - startTime}ms (using database)`);
      }

      setMinistries(results);
      setError(null);
    } catch (err) {
      console.error('[MinisteriosScreen] Error loading ministries:', err);
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMinistryName = (ministry: Ministry): string => {
    if (language === 'fr' && ministry.name_fr) return ministry.name_fr;
    if (language === 'en' && ministry.name_en) return ministry.name_en;
    return ministry.name_es;
  };

  const getMinistryGradient = (index: number): string[] => {
    return MINISTRY_GRADIENTS[index % MINISTRY_GRADIENTS.length];
  };

  const renderGridItem = (ministry: Ministry & { service_count: number }, index: number) => {
    const gradient = getMinistryGradient(index);

    return (
      <TouchableOpacity
        key={ministry.id}
        style={styles.gridItem}
        onPress={() => onMinistryPress(ministry)}
        activeOpacity={0.8}>
        <View style={[styles.gridCard, { backgroundColor: gradient[0] }]}>
          <View style={styles.gridIconContainer}>
            <Icon name="building" size={40} color="#FFFFFF" />
          </View>
          <View style={styles.gridContent}>
            <Text style={styles.gridTitle} numberOfLines={2}>
              {getMinistryName(ministry)}
            </Text>
            <Text style={styles.gridSubtitle}>
              {ministry.service_count || 0} {t.services}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListItem = (ministry: Ministry & { service_count: number }) => {
    return (
      <TouchableOpacity
        key={ministry.id}
        style={styles.listItem}
        onPress={() => onMinistryPress(ministry)}
        activeOpacity={0.7}>
        <View style={styles.listContent}>
          <Text style={styles.listTitle}>{getMinistryName(ministry)}</Text>
          <Text style={styles.listSubtitle}>
            {ministry.service_count || 0} {t.services}
          </Text>
        </View>
        <Text style={styles.listArrow}>→</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader
        title={t.title}
        onBack={onBack}
        rightComponent={
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'grid' && styles.toggleButtonActive]}
              onPress={() => setViewMode('grid')}
              activeOpacity={0.7}>
              <Text style={styles.toggleIcon}>▦</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.7}>
              <Text style={styles.toggleIcon}>☰</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadMinistries}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : viewMode === 'grid' ? (
          <View style={styles.gridContainer}>
            {ministries.map((ministry, index) => renderGridItem(ministry, index))}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {ministries.map((ministry) => renderListItem(ministry))}
          </View>
        )}
      </ScrollView>

      <BottomTabBar activeTab="search" onTabPress={onTabPress} language={language} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Toggle buttons
  toggleContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  toggleIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },

  // Grid view
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItem: {
    width: '48%',
    marginBottom: Spacing.sm,
  },
  gridCard: {
    borderRadius: 16,
    padding: Spacing.md,
    minHeight: 140,
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  gridIcon: {
    fontSize: 24,
  },
  gridContent: {
    flex: 1,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
  },

  // List view
  listContainer: {
    gap: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  listArrow: {
    fontSize: 20,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
});

export default MinisteriosScreen;
