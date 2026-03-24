/**
 * Requests List Screen — Placeholder
 *
 * Displays the user's service requests with:
 * - Status filter chips
 * - Search bar
 * - Request list (empty state for now)
 * - FAB to create a new request
 *
 * TODO: Wire up to GET /service-requests/?page=1&page_size=20&status=...
 */

import { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Searchbar, Chip, FAB, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';

const STATUS_FILTERS = [
  'all',
  'submitted',
  'processing',
  'under_review',
  'approved',
  'completed',
  'rejected',
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function RequestsListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');

  const getStatusLabel = (status: StatusFilter): string => {
    if (status === 'all') return t('common.seeAll');
    return t(`requests.status.${status}` as const);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={[styles.header, { padding: spacing.md }]}>
        {/* Title */}
        <Text
          variant="headlineSmall"
          style={[styles.title, { color: colors.onBackground, marginBottom: spacing.md }]}
        >
          {t('requests.title')}
        </Text>

        {/* Search */}
        <Searchbar
          placeholder={t('common.search')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surfaceVariant,
              borderRadius: borderRadius.md,
              marginBottom: spacing.sm,
            },
          ]}
          inputStyle={{ color: colors.onSurface }}
          iconColor={colors.onSurfaceVariant}
          placeholderTextColor={colors.outline}
        />

        {/* Status filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chipRow, { gap: spacing.xs }]}
        >
          {STATUS_FILTERS.map((status) => (
            <Chip
              key={status}
              selected={selectedStatus === status}
              onPress={() => setSelectedStatus(status)}
              mode={selectedStatus === status ? 'flat' : 'outlined'}
              style={
                selectedStatus === status
                  ? { backgroundColor: colors.primaryContainer }
                  : undefined
              }
              textStyle={
                selectedStatus === status
                  ? { color: colors.onPrimaryContainer }
                  : { color: colors.onSurfaceVariant }
              }
              compact
            >
              {getStatusLabel(status)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Content — empty state */}
      <View style={styles.content}>
        <Surface
          style={[
            styles.emptyState,
            {
              padding: spacing.xl,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              marginHorizontal: spacing.md,
            },
          ]}
          elevation={0}
        >
          <MaterialCommunityIcons
            name="file-document-outline"
            size={64}
            color={colors.outlineVariant}
          />
          <Text
            variant="titleMedium"
            style={[
              styles.emptyTitle,
              { color: colors.onSurfaceVariant, marginTop: spacing.md },
            ]}
          >
            {t('dashboard.noRequests')}
          </Text>
          <Text
            variant="bodyMedium"
            style={[
              styles.emptyDescription,
              { color: colors.outline, marginTop: spacing.xs },
            ]}
          >
            {t('dashboard.startFirstRequest')}
          </Text>
        </Surface>
      </View>

      {/* FAB */}
      <FAB
        icon="plus"
        label={t('requests.new')}
        onPress={() => router.push('/(tabs)/services')}
        style={[
          styles.fab,
          { backgroundColor: colors.primary, borderRadius: borderRadius.xl },
        ]}
        color={colors.onPrimary}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    // Non-scrollable header with search + filters
  },
  title: {
    fontWeight: '700',
  },
  searchBar: {
    elevation: 0,
  },
  chipRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontWeight: '600',
  },
  emptyDescription: {
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});
