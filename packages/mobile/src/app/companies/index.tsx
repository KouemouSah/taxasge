/**
 * Companies list — "Mis Empresas" stack screen.
 * Reachable from the dashboard QuickAction.
 */

import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Divider, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@core/theme';
import { SkeletonListItem } from '@components/ui/skeleton';
import { CompanyCard } from '@modules/companies/components/company-card';
import { CompanyEmptyState } from '@modules/companies/components/company-empty-state';
import { useCompaniesList } from '@modules/companies';
import type { CompanyResponse } from '@modules/companies';

export default function CompaniesIndexScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const list = useCompaniesList();

  const data = (list.data?.pages ?? []).flatMap((p) => p.companies);
  const refreshing = list.isRefetching && !list.isFetchingNextPage;

  const handleItemPress = useCallback((company: CompanyResponse) => {
    router.push(`/companies/${company.id}` as never);
  }, []);

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('companies.title')} />
      </Appbar.Header>

      {list.isLoading ? (
        <View>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonListItem key={`sk-${i}`} />
          ))}
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CompanyCard company={item} onPress={handleItemPress} />}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            <CompanyEmptyState onCreate={() => router.push('/companies/new' as never)} />
          }
          contentContainerStyle={data.length === 0 ? styles.emptyContent : undefined}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) {
              list.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => list.refetch()}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          // P8.3 — perf knobs (CompanyCard variable height ⇒ no getItemLayout).
          initialNumToRender={10}
          maxToRenderPerBatch={15}
          windowSize={10}
          removeClippedSubviews
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        color="white"
        onPress={() => router.push('/companies/new' as never)}
        accessibilityLabel={t('companies.create.title')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
});
