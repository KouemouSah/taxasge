/**
 * Services Tab — Native Android v2
 *
 * - Compact popular services (horizontal chips)
 * - Ministries as flat list with dividers (not grid cards)
 * - Filter out inactive ministries
 * - Search with debounce
 */

import { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  ScrollView,
  type ListRenderItemInfo,
} from 'react-native';
import { Text, Searchbar, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import { formatCurrency } from '@core/utils/format';
import {
  useMinistries,
  usePopularServices,
  useServiceSearch,
} from '@modules/fiscal-services';
import type { MinistryItem, FiscalServiceItem } from '@modules/fiscal-services';
import { EmptyState } from '@components/ui/empty-state';

// ---------------------------------------------------------------------------
// Ministry icon mapping (by keyword in name)
// ---------------------------------------------------------------------------

const MINISTRY_ICONS: Array<{ keyword: string; icon: string }> = [
  { keyword: 'TRANSPORTE', icon: 'car' },
  { keyword: 'SEGURIDAD', icon: 'shield-account' },
  { keyword: 'HACIENDA', icon: 'cash-register' },
  { keyword: 'DEFENSA', icon: 'shield-outline' },
  { keyword: 'EDUCACION', icon: 'school' },
  { keyword: 'COMERCIO', icon: 'store' },
  { keyword: 'HIDROCARBUROS', icon: 'oil' },
  { keyword: 'OBRAS PUBLICAS', icon: 'office-building' },
  { keyword: 'ASUNTOS EXTERIORES', icon: 'earth' },
  { keyword: 'AVIACION', icon: 'airplane' },
  { keyword: 'INFORMACION', icon: 'newspaper' },
  { keyword: 'INTERIOR', icon: 'home-city' },
  { keyword: 'IGUALDAD', icon: 'account-group' },
  { keyword: 'TURISMO', icon: 'palm-tree' },
  { keyword: 'AGRICULTURA', icon: 'sprout' },
  { keyword: 'ELECTRICIDAD', icon: 'lightning-bolt' },
  { keyword: 'FUNCION PUBLICA', icon: 'badge-account' },
  { keyword: 'PRESIDENCIA', icon: 'bank' },
  { keyword: 'AYUNTAMIENTO', icon: 'city-variant' },
  { keyword: 'CAMARA', icon: 'domain' },
];

function getMinistryIcon(name: string): string {
  const upper = (name ?? '').toUpperCase();
  for (const { keyword, icon } of MINISTRY_ICONS) {
    if (upper.includes(keyword)) return icon;
  }
  return 'office-building';
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ServicesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing } = useAppTheme();

  const { data: ministries, isLoading: ministriesLoading } = useMinistries('es');
  const { data: popularServices } = usePopularServices(10);
  const { search, results, isSearching } = useServiceSearch(300);

  const [searchText, setSearchText] = useState('');
  const isSearchMode = searchText.length > 0 || results != null;

  // Filter out inactive ministries and test data
  const activeMinistries = useMemo(
    () => (ministries ?? []).filter((m) => m.is_active !== false),
    [ministries],
  );

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    search(text);
  }, [search]);

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    search('');
  }, [search]);

  const handleMinistryPress = useCallback((ministry: MinistryItem) => {
    setSearchText(ministry.name_es);
    search(ministry.name_es, { ministry_id: ministry.id });
  }, [search]);

  const handleServicePress = useCallback((id: number) => {
    router.push(`/service/${id}`);
  }, [router]);

  // ---------------------------------------------------------------------------
  // Render: Popular service chip (compact horizontal)
  // ---------------------------------------------------------------------------

  const renderPopularChip = useCallback(
    ({ item }: ListRenderItemInfo<FiscalServiceItem>) => (
      <Pressable
        style={[styles.popularChip, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
        onPress={() => handleServicePress(item.id)}
        android_ripple={{ color: colors.primaryContainer }}
      >
        <Text variant="bodySmall" style={{ color: colors.onSurface, fontWeight: '600' }} numberOfLines={1}>
          {item.name_es}
        </Text>
        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
          {(item.tasa_expedicion ?? 0) === 0 ? t('services.freeService') : formatCurrency(item.tasa_expedicion ?? 0)}
        </Text>
      </Pressable>
    ),
    [colors, handleServicePress, t],
  );

  // ---------------------------------------------------------------------------
  // Render: Ministry flat list item
  // ---------------------------------------------------------------------------

  const renderMinistryItem = useCallback(
    (ministry: MinistryItem, index: number) => (
      <View key={ministry.id}>
        {index > 0 && <Divider />}
        <Pressable
          style={styles.ministryRow}
          onPress={() => handleMinistryPress(ministry)}
          android_ripple={{ color: colors.primaryContainer }}
        >
          <View style={[styles.ministryIcon, { backgroundColor: ministry.color ? `${ministry.color}20` : colors.primaryContainer }]}>
            <MaterialCommunityIcons
              name={getMinistryIcon(ministry.name_es) as keyof typeof MaterialCommunityIcons.glyphMap}
              size={20}
              color={ministry.color ?? colors.primary}
            />
          </View>
          <Text variant="bodyMedium" style={{ color: colors.onSurface, flex: 1 }} numberOfLines={2}>
            {ministry.name_es}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.outline} />
        </Pressable>
      </View>
    ),
    [colors, handleMinistryPress],
  );

  // ---------------------------------------------------------------------------
  // Render: Search result item
  // ---------------------------------------------------------------------------

  const renderSearchItem = useCallback(
    ({ item }: ListRenderItemInfo<FiscalServiceItem>) => (
      <>
        <Pressable
          style={styles.searchItem}
          onPress={() => handleServicePress(item.id)}
          android_ripple={{ color: colors.primaryContainer }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }} numberOfLines={2}>
              {item.name_es}
            </Text>
            {item.ministry_name && (
              <Text variant="bodySmall" style={{ color: colors.outline }} numberOfLines={1}>
                {item.ministry_name}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
              {(item.tasa_expedicion ?? 0) === 0 ? t('services.freeService') : formatCurrency(item.tasa_expedicion ?? 0)}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.outline} />
          </View>
        </Pressable>
        <Divider />
      </>
    ),
    [colors, handleServicePress, t],
  );

  // ---------------------------------------------------------------------------
  // Search mode content
  // ---------------------------------------------------------------------------

  const renderSearchContent = () => {
    if (isSearching) {
      return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }
    if (results && results.services.length > 0) {
      return (
        <FlatList
          data={results.services}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSearchItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={
            <Text variant="labelMedium" style={{ color: colors.outline, paddingHorizontal: 16, paddingVertical: 8 }}>
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
          title={t('common.noResults')}
          actionLabel={t('common.retry')}
          onAction={handleClearSearch}
        />
      );
    }
    return null;
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header + Search */}
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
        <Text variant="headlineSmall" style={{ color: colors.onBackground, fontWeight: '700', marginBottom: 8 }}>
          {t('services.title')}
        </Text>
        <Searchbar
          placeholder={t('services.searchPlaceholder')}
          onChangeText={handleSearchChange}
          value={searchText}
          style={[styles.searchBar, { backgroundColor: colors.surfaceVariant }]}
          inputStyle={{ color: colors.onSurface }}
          iconColor={colors.onSurfaceVariant}
        />
      </View>

      {isSearchMode ? (
        renderSearchContent()
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {/* Popular services (horizontal compact chips) */}
          {popularServices && popularServices.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text variant="titleSmall" style={{ color: colors.onBackground, fontWeight: '600', marginBottom: 8, paddingHorizontal: spacing.md }}>
                {t('services.popular')}
              </Text>
              <FlatList
                data={popularServices}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderPopularChip}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 8 }}
              />
            </View>
          )}

          {/* Ministries flat list */}
          <View style={{ marginTop: 16, paddingHorizontal: spacing.md }}>
            <Text variant="titleSmall" style={{ color: colors.onBackground, fontWeight: '600', marginBottom: 8 }}>
              {t('services.allMinistries')} ({activeMinistries.length})
            </Text>

            {ministriesLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: 24 }} />
            ) : (
              activeMinistries.map((m, i) => renderMinistryItem(m, i))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { elevation: 0, borderRadius: 8, marginBottom: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Popular chips
  popularChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 130,
    maxWidth: 180,
  },

  // Ministry flat list
  ministryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  ministryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search results
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  // Legacy (unused but kept for grid reference)
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '50%' },
  sectionTitle: { fontWeight: '600' },
});
