/**
 * Vault home — citizen Document Vault list with filters, tabs and quota bar.
 *
 * Stack route reachable from the dashboard QuickActions. Kept off the bottom
 * tab bar (already at 5 tabs — adding a 6th breaks the native Android pattern,
 * memory rule #15).
 */

import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Appbar, Divider, FAB, SegmentedButtons, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@core/theme';
import { AlertListItem } from '@modules/vault/components/alert-list-item';
import { DocumentEmptyState } from '@modules/vault/components/document-empty-state';
import { DocumentFilterChips } from '@modules/vault/components/document-filter-chips';
import { DocumentListItem } from '@modules/vault/components/document-list-item';
import { DocumentQuotaBar } from '@modules/vault/components/document-quota-bar';
import {
  useDismissAlert,
  useMarkAlertRead,
  useVaultAlerts,
  useVaultGenerated,
  useVaultList,
  useVaultStats,
  useVaultSearch,
} from '@modules/vault';
import type {
  AlertResponse,
  GeneratedDocumentResponse,
  UserDocumentListItem,
  VaultFilterValue,
  VaultTabValue,
} from '@modules/vault';

const FILTER_TO_PARAMS: Record<
  VaultFilterValue,
  {
    source?: 'personal_upload' | 'wizard_upload' | 'platform_generated';
    expiry_status?: 'expiring_soon' | 'expired';
  }
> = {
  all: {},
  personal: { source: 'personal_upload' },
  wizard: { source: 'wizard_upload' },
  generated: { source: 'platform_generated' },
  expiring: { expiry_status: 'expiring_soon' },
  expired: { expiry_status: 'expired' },
};

export default function VaultHomeScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [tab, setTab] = useState<VaultTabValue>('uploads');
  const [filter, setFilter] = useState<VaultFilterValue>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useVaultStats();

  const params = useMemo(() => FILTER_TO_PARAMS[filter], [filter]);
  const list = useVaultList(params);
  const generated = useVaultGenerated();
  const alerts = useVaultAlerts();
  const search = useVaultSearch(searchTerm);

  const markAlertRead = useMarkAlertRead();
  const dismissAlert = useDismissAlert();

  const handleItemPress = useCallback((item: UserDocumentListItem) => {
    router.push(`/documents/${item.id}` as never);
  }, []);

  const handleGeneratedPress = useCallback((item: GeneratedDocumentResponse) => {
    router.push(`/documents/${item.id}` as never);
  }, []);

  const handleAlertPress = useCallback(
    (alert: AlertResponse) => {
      if (!alert.is_read) {
        markAlertRead.mutate(alert.id);
      }
      const params = (alert as unknown as { action_params?: Record<string, string> }).action_params;
      const docId = params?.document_id;
      const workflow = params?.workflow_code;
      if (docId) {
        router.push(`/documents/${docId}` as never);
      } else if (workflow) {
        router.push(`/documents/readiness/${workflow}` as never);
      }
    },
    [markAlertRead],
  );

  const handleAlertLongPress = useCallback(
    (alert: AlertResponse) => dismissAlert.mutate(alert.id),
    [dismissAlert],
  );

  // ----- Render bodies per tab ---------------------------------------------
  const renderUploadsBody = () => {
    const showSearch = searchTerm.trim().length >= 2;
    const data = showSearch
      ? search.data ?? []
      : (list.data?.pages ?? []).flatMap((p) => p.items);
    const refreshing = list.isRefetching && !list.isFetchingNextPage;

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DocumentListItem item={item} onPress={handleItemPress} />
        )}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={
          <DocumentEmptyState
            variant="uploads"
            onUpload={() => router.push('/documents/upload' as never)}
          />
        }
        contentContainerStyle={data.length === 0 ? styles.emptyContent : undefined}
        onEndReached={() => {
          if (!showSearch && list.hasNextPage && !list.isFetchingNextPage) {
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
      />
    );
  };

  const renderGeneratedBody = () => {
    const data = (generated.data?.pages ?? []).flat();
    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DocumentListItem
            item={
              {
                id: item.id,
                document_type: item.generation_type,
                category: 'generated',
                file_name: item.file_name,
                display_name: item.title,
                expiry_date: null,
                days_until_expiry: null,
                expiry_status: 'valid',
                status: 'active',
                source: 'platform_generated',
                thumbnail_path: null,
                mime_type: 'application/pdf',
                file_size_bytes: 0,
                created_at: item.created_at,
              } as unknown as UserDocumentListItem
            }
            onPress={() => handleGeneratedPress(item)}
          />
        )}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={<DocumentEmptyState variant="generated" />}
        contentContainerStyle={data.length === 0 ? styles.emptyContent : undefined}
        refreshControl={
          <RefreshControl
            refreshing={generated.isRefetching}
            onRefresh={() => generated.refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    );
  };

  const renderAlertsBody = () => {
    const data = alerts.data ?? [];
    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlertListItem
            alert={item}
            onPress={handleAlertPress}
            onLongPress={handleAlertLongPress}
          />
        )}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={<DocumentEmptyState variant="alerts" />}
        contentContainerStyle={data.length === 0 ? styles.emptyContent : undefined}
        refreshControl={
          <RefreshControl
            refreshing={alerts.isRefetching}
            onRefresh={() => alerts.refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('vault.title')} />
      </Appbar.Header>

      {stats.data ? (
        <DocumentQuotaBar
          usedBytes={stats.data.quota_used_bytes}
          maxBytes={stats.data.quota_max_bytes}
        />
      ) : null}

      <View style={styles.tabsRow}>
        <SegmentedButtons
          value={tab}
          onValueChange={(v) => setTab(v as VaultTabValue)}
          buttons={[
            { value: 'uploads', label: t('vault.tabs.uploads') },
            { value: 'generated', label: t('vault.tabs.generated') },
            { value: 'alerts', label: t('vault.tabs.alerts') },
          ]}
        />
      </View>

      {tab === 'uploads' ? (
        <>
          <Searchbar
            placeholder={t('vault.search.placeholder')}
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchBar}
          />
          {searchTerm.trim().length < 2 ? (
            <DocumentFilterChips value={filter} onChange={setFilter} />
          ) : null}
        </>
      ) : null}

      {tab === 'uploads' ? renderUploadsBody() : null}
      {tab === 'generated' ? renderGeneratedBody() : null}
      {tab === 'alerts' ? renderAlertsBody() : null}

      {tab === 'uploads' ? (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: colors.primary }]}
          color="white"
          onPress={() => router.push('/documents/upload' as never)}
          accessibilityLabel={t('vault.upload.title')}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabsRow: { paddingHorizontal: 16, paddingVertical: 8 },
  searchBar: { marginHorizontal: 16, marginTop: 4, marginBottom: 4 },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
});
