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
import { Text, Searchbar, ActivityIndicator, Divider, TextInput } from 'react-native-paper';
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
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [sortAlpha, setSortAlpha] = useState(false);
  const [isMinistryFilter, setIsMinistryFilter] = useState(false);
  const [currentMinistryId, setCurrentMinistryId] = useState<number | null>(null);
  const [innerSearch, setInnerSearch] = useState('');
  const [resultSort, setResultSort] = useState<'default' | 'alpha' | 'price_asc' | 'price_desc'>('default');
  const isSearchMode = searchText.length > 0 || results != null;

  // Filter inactive + sort
  const activeMinistries = useMemo(() => {
    const filtered = (ministries ?? []).filter((m) => m.is_active !== false);
    if (sortAlpha) {
      return [...filtered].sort((a, b) => a.name_es.localeCompare(b.name_es));
    }
    return filtered;
  }, [ministries, sortAlpha]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    setIsMinistryFilter(false);
    setCurrentMinistryId(null);
    setInnerSearch('');
    setResultSort('default');
    search(text, { ministry_id: undefined });
  }, [search]);

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    setIsMinistryFilter(false);
    setCurrentMinistryId(null);
    setInnerSearch('');
    setResultSort('default');
    search('');
  }, [search]);

  const handleMinistryPress = useCallback((ministry: MinistryItem) => {
    setSearchText(ministry.name_es);
    setIsMinistryFilter(true);
    setCurrentMinistryId(ministry.id);
    setInnerSearch('');
    setResultSort('default');
    search('', { ministry_id: ministry.id });
  }, [search]);

  /** Search within current ministry */
  const handleInnerSearch = useCallback((text: string) => {
    setInnerSearch(text);
    if (currentMinistryId) {
      search(text, { ministry_id: currentMinistryId });
    }
  }, [search, currentMinistryId]);

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
    ({ item, index }: ListRenderItemInfo<FiscalServiceItem>) => {
      const isEven = index % 2 === 0;
      return (
        <Pressable
          style={[
            styles.searchItem,
            { backgroundColor: isEven ? colors.background : `${colors.primary}08` },
          ]}
          onPress={() => handleServicePress(item.id)}
          android_ripple={{ color: colors.primaryContainer }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '500' }} numberOfLines={2}>
              {item.name_es}
            </Text>
            {!isMinistryFilter && item.ministry_name && (
              <Text variant="labelSmall" style={{ color: colors.outline }} numberOfLines={1}>
                {item.ministry_name}
              </Text>
            )}
          </View>
          <View style={styles.searchItemRight}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
              {(item.tasa_expedicion ?? 0) === 0 ? t('services.freeService') : formatCurrency(item.tasa_expedicion ?? 0)}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.outline} />
          </View>
        </Pressable>
      );
    },
    [colors, handleServicePress, isMinistryFilter, t],
  );

  // ---------------------------------------------------------------------------
  // Search mode content
  // ---------------------------------------------------------------------------

  /** Sort results locally */
  const sortedResults = useMemo(() => {
    if (!results?.services) return [];
    const list = [...results.services];
    // Filter by inner search text
    const filtered = innerSearch
      ? list.filter((s) => s.name_es.toLowerCase().includes(innerSearch.toLowerCase()))
      : list;
    // Sort
    switch (resultSort) {
      case 'alpha': return filtered.sort((a, b) => a.name_es.localeCompare(b.name_es));
      case 'price_asc': return filtered.sort((a, b) => (a.tasa_expedicion ?? 0) - (b.tasa_expedicion ?? 0));
      case 'price_desc': return filtered.sort((a, b) => (b.tasa_expedicion ?? 0) - (a.tasa_expedicion ?? 0));
      default: return filtered;
    }
  }, [results, innerSearch, resultSort]);

  const renderSearchContent = () => {
    if (isSearching) {
      return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }
    if (results && results.services.length > 0) {
      return (
        <FlatList
          data={sortedResults}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSearchItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
              {/* Ministry name bar with back arrow */}
              {isMinistryFilter && (
                <Pressable onPress={handleClearSearch} style={styles.ministryBar}>
                  <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
                  <Text style={styles.ministryBarText} numberOfLines={1}>
                    {searchText}
                  </Text>
                </Pressable>
              )}

              {/* Non-ministry: simple back + count */}
              {!isMinistryFilter && (
                <Pressable onPress={handleClearSearch} style={styles.ministryBar}>
                  <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
                  <Text variant="labelMedium" style={{ color: colors.outline, flex: 1 }}>
                    {t('services.results', { count: results.total })}
                  </Text>
                </Pressable>
              )}

              {/* Inner search + sort */}
              {isMinistryFilter && (
                <View style={[styles.innerControls, { marginTop: 6 }]}>
                  <TextInput
                    placeholder={`${results.total} services — ${t('services.searchWithin')}`}
                    value={innerSearch}
                    onChangeText={handleInnerSearch}
                    mode="outlined"
                    dense
                    style={styles.innerSearchInput}
                    outlineStyle={{ borderRadius: 8, borderColor: '#E0E0E0' }}
                    left={<TextInput.Icon icon="magnify" size={16} />}
                    right={innerSearch ? <TextInput.Icon icon="close" size={14} onPress={() => handleInnerSearch('')} /> : undefined}
                  />
                  <View style={styles.sortBtns}>
                    <Pressable
                      onPress={() => setResultSort(resultSort === 'alpha' ? 'default' : 'alpha')}
                      style={[styles.sortBtn, resultSort === 'alpha' && { backgroundColor: colors.primaryContainer }]}
                    >
                      <MaterialCommunityIcons name="sort-alphabetical-ascending" size={16} color={resultSort === 'alpha' ? colors.primary : colors.outline} />
                    </Pressable>
                    <Pressable
                      onPress={() => setResultSort(resultSort === 'price_asc' ? 'price_desc' : 'price_asc')}
                      style={[styles.sortBtn, (resultSort === 'price_asc' || resultSort === 'price_desc') && { backgroundColor: colors.primaryContainer }]}
                    >
                      <MaterialCommunityIcons
                        name={resultSort === 'price_desc' ? 'sort-numeric-descending' : 'sort-numeric-ascending'}
                        size={16}
                        color={(resultSort === 'price_asc' || resultSort === 'price_desc') ? colors.primary : colors.outline}
                      />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
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

          {/* Organizations header with view toggle */}
          <View style={{ marginTop: 16, paddingHorizontal: spacing.md }}>
            <View style={styles.orgHeader}>
              <Text variant="titleSmall" style={{ color: colors.onBackground, fontWeight: '600' }}>
                {t('services.organizations')} ({activeMinistries.length})
              </Text>
              <View style={styles.viewToggle}>
                <Pressable
                  onPress={() => setSortAlpha(!sortAlpha)}
                  style={[styles.toggleBtn, sortAlpha && { backgroundColor: colors.primaryContainer }]}
                >
                  <MaterialCommunityIcons name="sort-alphabetical-ascending" size={18} color={sortAlpha ? colors.primary : colors.outline} />
                </Pressable>
                <Pressable
                  onPress={() => setViewMode('list')}
                  style={[styles.toggleBtn, viewMode === 'list' && { backgroundColor: colors.primaryContainer }]}
                >
                  <MaterialCommunityIcons name="format-list-bulleted" size={18} color={viewMode === 'list' ? colors.primary : colors.outline} />
                </Pressable>
                <Pressable
                  onPress={() => setViewMode('kanban')}
                  style={[styles.toggleBtn, viewMode === 'kanban' && { backgroundColor: colors.primaryContainer }]}
                >
                  <MaterialCommunityIcons name="view-grid-outline" size={18} color={viewMode === 'kanban' ? colors.primary : colors.outline} />
                </Pressable>
              </View>
            </View>

            {ministriesLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: 24 }} />
            ) : viewMode === 'list' ? (
              activeMinistries.map((m, i) => renderMinistryItem(m, i))
            ) : (
              /* Kanban grid view */
              <View style={styles.kanbanGrid}>
                {activeMinistries.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[styles.kanbanCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
                    onPress={() => handleMinistryPress(m)}
                    android_ripple={{ color: colors.primaryContainer }}
                  >
                    <View style={[styles.kanbanIcon, { backgroundColor: m.color ? `${m.color}20` : colors.primaryContainer }]}>
                      <MaterialCommunityIcons
                        name={getMinistryIcon(m.name_es) as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={22}
                        color={m.color ?? colors.primary}
                      />
                    </View>
                    <Text
                      style={[styles.kanbanName, { color: colors.onSurface }]}
                      numberOfLines={3}
                    >
                      {m.name_es}
                    </Text>
                  </Pressable>
                ))}
              </View>
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
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  searchItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },

  // Header with toggle
  orgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  viewToggle: { flexDirection: 'row', gap: 4 },
  toggleBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  // Ministry bar (back + name)
  ministryBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  ministryBarText: { fontSize: 12, fontWeight: '600', color: '#616161', flex: 1 },
  innerControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  innerSearchInput: { flex: 1, backgroundColor: '#F5F5F5', fontSize: 13, height: 36 },
  sortBtns: { flexDirection: 'row', gap: 4 },
  sortBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  // Kanban grid
  kanbanGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kanbanCard: { width: '47.5%', borderRadius: 8, borderWidth: 1, padding: 10, alignItems: 'center', minHeight: 80, justifyContent: 'center' },
  kanbanIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  kanbanName: { fontSize: 10, fontWeight: '600', textAlign: 'center', lineHeight: 13 },
});
