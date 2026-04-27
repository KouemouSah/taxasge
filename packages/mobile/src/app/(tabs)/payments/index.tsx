/**
 * Payments History Screen — paginated infinite list of the user's payments.
 *
 * Reached from the profile entry "Mes paiements" or after a successful
 * wizard payment-result. Filter chips: All / Pending / Completed / Failed.
 */

import { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Chip, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@core/theme';
import { AuthGuard } from '@core/auth/auth-guard';
import { EmptyState } from '@components/ui/empty-state';
import {
  PaymentListItem,
  usePaymentsList,
  type Payment,
  type PaymentStatus,
} from '@modules/payments';

const FILTERS = ['all', 'pending', 'completed', 'failed'] as const;
type Filter = (typeof FILTERS)[number];

function PaymentsListContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing } = useAppTheme();
  const [filter, setFilter] = useState<Filter>('all');

  const status: PaymentStatus | undefined = filter === 'all' ? undefined : filter;

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = usePaymentsList({ status, page_size: 20 });

  const payments: Payment[] = useMemo(
    () => data?.pages.flatMap((page) => page.payments) ?? [],
    [data],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/(tabs)/payments/${id}` as never);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Payment }) => (
      <PaymentListItem item={item} onPress={() => handlePress(item.id)} />
    ),
    [handlePress],
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isFetchingNextPage, colors.primary]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    if (error) {
      const message = error instanceof Error ? error.message : t('errors.serverError');
      return (
        <EmptyState
          icon="alert-circle-outline"
          title={t('common.error')}
          description={message}
          actionLabel={t('common.retry')}
          onAction={() => refetch()}
        />
      );
    }
    return (
      <EmptyState
        icon="cash-multiple"
        title={t('payments.list.empty')}
        description={t('dashboard.startFirstRequest')}
      />
    );
  }, [isLoading, error, colors.primary, refetch, t]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={[styles.header, { padding: spacing.md }]}>
        <Text
          variant="headlineSmall"
          style={[styles.title, { color: colors.onBackground, marginBottom: spacing.md }]}
        >
          {t('payments.list.title')}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chipRow, { gap: spacing.xs }]}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f}
              selected={filter === f}
              onPress={() => setFilter(f)}
              mode={filter === f ? 'flat' : 'outlined'}
              style={
                filter === f ? { backgroundColor: colors.primaryContainer } : undefined
              }
              textStyle={
                filter === f
                  ? { color: colors.onPrimaryContainer }
                  : { color: colors.onSurfaceVariant }
              }
              compact
            >
              {t(`payments.list.filter.${f}`)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={payments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={Divider}
        contentContainerStyle={[
          styles.listContent,
          payments.length === 0 && styles.listEmpty,
          { paddingTop: spacing.sm, paddingBottom: 24 },
        ]}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  title: { fontWeight: '700' },
  chipRow: { flexDirection: 'row', paddingVertical: 4 },
  listContent: { flexGrow: 1 },
  listEmpty: { flex: 1 },
  footer: { paddingVertical: 16, alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default function PaymentsListScreen() {
  return (
    <AuthGuard>
      <PaymentsListContent />
    </AuthGuard>
  );
}
