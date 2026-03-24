/**
 * Services Tab — Fiscal Services Catalog
 *
 * Browse mode (default): horizontal popular services list + ministry grid.
 * Search mode (activated by typing): debounced search results with facets.
 *
 * Press ministry -> filter search by ministry_id.
 * Press service -> navigate to /service/{id}.
 */

import { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  type ListRenderItemInfo,
} from 'react-native';
import { Text, Searchbar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@core/theme';
import {
  useMinistries,
  usePopularServices,
  useServiceSearch,
} from '@modules/fiscal-services';
import type {
  MinistryItem,
  FiscalServiceItem,
} from '@modules/fiscal-services';

import { ServiceCard, type ServiceCardItem } from '@modules/fiscal-services/components/service-card';
import { MinistryCard } from '@modules/fiscal-services/components/ministry-card';
import { EmptyState } from '@components/ui/empty-state';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a FiscalServiceItem (from popular endpoint) into ServiceCardItem shape. */
function toServiceCardItem(s: FiscalServiceItem): ServiceCardItem {
  return {
    id: s.id,
    name: s.name_es,
    description: s.description_es,
    expedition_price: s.tasa_expedicion ?? 0,
    renewal_price: s.tasa_renovacion ?? 0,
    ministry: s.ministry_name,
    category: s.category_name,
    service_type: s.service_type,
  };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ServicesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();

  // Data hooks
  const { data: ministries, isLoading: ministriesLoading } = useMinistries('es');
  const { data: popularServices, isLoading: popularLoading } = usePopularServices(10);
  const { query, search, results, isSearching } = useServiceSearch(300);

  // Track whether user is in search mode
  const [searchText, setSearchText] = useState('');
  const searchBarRef = useRef<{ blur: () => void }>(null);

  const isSearchMode = searchText.length > 0 || results != null;

  // Handlers
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      search(text);
    },
    [search],
  );

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    search('');
  }, [search]);

  const handleMinistryPress = useCallback(
    (ministry: MinistryItem) => {
      // Enter search mode filtered by this ministry
      setSearchText(ministry.name_es);
      search(ministry.name_es, { ministry_id: ministry.id });
    },
    [search],
  );

  const handleServicePress = useCallback(
    (id: number) => {
      router.push(`/service/${id}`);
    },
    [router],
  );

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderPopularItem = useCallback(
    ({ item }: ListRenderItemInfo<FiscalServiceItem>) => (
      <View style={{ marginRight: spacing.sm }}>
        <ServiceCard
          service={toServiceCardItem(item)}
          onPress={() => handleServicePress(item.id)}
        />
      </View>
    ),
    [spacing.sm, handleServicePress],
  );

  const renderSearchItem = useCallback(
    ({ item }: ListRenderItemInfo<FiscalServiceItem>) => (
      <View style={{ marginBottom: spacing.sm, marginHorizontal: spacing.md }}>
        <ServiceCard
          service={toServiceCardItem(item)}
          onPress={() => handleServicePress(item.id)}
        />
      </View>
    ),
    [spacing.sm, spacing.md, handleServicePress],
  );

  // ---------------------------------------------------------------------------
  // Browse mode content (popular + ministries)
  // ---------------------------------------------------------------------------

  const renderBrowseContent = () => (
    <FlatList
      data={[]}
      renderItem={null}
      ListHeaderComponent={
        <>
          {/* Popular services section */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: colors.onBackground, marginBottom: spacing.sm, marginHorizontal: spacing.md }]}
            >
              {t('services.popular', { defaultValue: 'Servicios populares' })}
            </Text>

            {popularLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: spacing.lg }} />
            ) : popularServices && popularServices.length > 0 ? (
              <FlatList
                data={popularServices}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderPopularItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.md }}
              />
            ) : (
              <Text
                variant="bodySmall"
                style={{ color: colors.outline, textAlign: 'center', paddingVertical: spacing.md }}
              >
                {t('services.noPopular', { defaultValue: 'No hay servicios populares' })}
              </Text>
            )}
          </View>

          {/* Ministries section header */}
          <Text
            variant="titleMedium"
            style={[
              styles.sectionTitle,
              { color: colors.onBackground, marginBottom: spacing.sm, marginHorizontal: spacing.md },
            ]}
          >
            {t('services.allMinistries', { defaultValue: 'Ministerios' })}
          </Text>

          {/* Ministry grid */}
          {ministriesLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: spacing.lg }} />
          ) : ministries && ministries.length > 0 ? (
            <View style={[styles.grid, { gap: spacing.sm, paddingHorizontal: spacing.md }]}>
              {ministries.map((ministry) => (
                <View key={ministry.id} style={styles.gridItem}>
                  <MinistryCard
                    ministry={ministry}
                    onPress={() => handleMinistryPress(ministry)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <Text
              variant="bodySmall"
              style={{ color: colors.outline, textAlign: 'center', paddingVertical: spacing.md }}
            >
              {t('services.noMinistries', { defaultValue: 'No hay ministerios disponibles' })}
            </Text>
          )}
        </>
      }
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
    />
  );

  // ---------------------------------------------------------------------------
  // Search mode content
  // ---------------------------------------------------------------------------

  const renderSearchContent = () => {
    if (isSearching) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (results && results.services.length > 0) {
      return (
        <FlatList
          data={results.services}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSearchItem}
          contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing.xxl }}
          ListHeaderComponent={
            <Text
              variant="labelMedium"
              style={{ color: colors.onSurfaceVariant, marginHorizontal: spacing.md, marginBottom: spacing.sm }}
            >
              {t('services.results', { count: results.total })}
            </Text>
          }
        />
      );
    }

    if (results && results.services.length === 0) {
      return (
        <EmptyState
          icon="magnify-close"
          title={t('services.noResults', { defaultValue: 'Sin resultados' })}
          description={t('services.noResultsDesc', {
            defaultValue: 'No se encontraron servicios para tu busqueda. Intenta con otros terminos.',
          })}
          actionLabel={t('common.clear', { defaultValue: 'Limpiar' })}
          onAction={handleClearSearch}
        />
      );
    }

    // Search mode but no results yet (user just started typing)
    return null;
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
        <Text
          variant="headlineSmall"
          style={[styles.title, { color: colors.onBackground, marginBottom: spacing.md }]}
        >
          {t('services.title', { defaultValue: 'Servicios' })}
        </Text>

        {/* Search bar */}
        <Searchbar
          placeholder={t('services.searchPlaceholder', { defaultValue: 'Buscar servicios...' })}
          onChangeText={handleSearchChange}
          value={searchText}
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surfaceVariant,
              borderRadius: borderRadius.md,
              marginBottom: spacing.md,
            },
          ]}
          inputStyle={{ color: colors.onSurface }}
          iconColor={colors.onSurfaceVariant}
          placeholderTextColor={colors.outline}
          onClearIconPress={handleClearSearch}
        />
      </View>

      {/* Content: browse or search */}
      {isSearchMode ? renderSearchContent() : renderBrowseContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  searchBar: {
    elevation: 0,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '48%',
    minWidth: 140,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
