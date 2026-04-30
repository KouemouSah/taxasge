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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@core/theme';
import { AlertListItem } from '@modules/vault/components/alert-list-item';
import { DocumentEmptyState } from '@modules/vault/components/document-empty-state';
import {
  DocumentFilterChips,
  type VaultCategoryFilter,
  type VaultGenerationFilter,
} from '@modules/vault/components/document-filter-chips';
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
  VaultTabValue,
} from '@modules/vault';

// Maps the user-facing generation buckets to the backend `generation_type`
// values exposed by `GET /user-documents/generated`. (Backend enum:
// receipt, payment_receipt, certificate, attestation, summary,
// request_summary, confirmation.) The backend `?generation_type=` query
// accepts a single value, so we always fetch the full set and apply
// client-side multi-value filtering on the bucket below — keeps the chip
// "Recibos" inclusive of both `receipt` and `payment_receipt`, and
// "Resúmenes" inclusive of `summary` + `request_summary`.
const GENERATION_BUCKETS: Record<VaultGenerationFilter, string[]> = {
  all: [],
  receipts: ['receipt', 'payment_receipt'],
  certificates: ['certificate'],
  attestations: ['attestation'],
  summaries: ['summary', 'request_summary'],
  confirmations: ['confirmation'],
};

export default function VaultHomeScreen() {
  // Bottom safe-area inset — without it the FAB sits behind the Android nav
  // bar on most devices (see debug/tesoro/m1.jpg for the same bug on
  // /companies). Reused on the upload-tab FAB below.
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<VaultTabValue>('uploads');
  const [categoryFilter, setCategoryFilter] = useState<VaultCategoryFilter>('all');
  const [generationFilter, setGenerationFilter] = useState<VaultGenerationFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useVaultStats();

  const listParams = useMemo(
    () => (categoryFilter === 'all' ? {} : { category: categoryFilter }),
    [categoryFilter],
  );
  const list = useVaultList(listParams);
  // Always fetch all generated docs — bucket filtering happens client-side
  // (see GENERATION_BUCKETS rationale above).
  const generated = useVaultGenerated();
  const generatedFilteredPages = useMemo(() => {
    const pages = generated.data?.pages ?? [];
    if (generationFilter === 'all') return pages;
    const allowed = new Set(GENERATION_BUCKETS[generationFilter]);
    return pages.map((p) => p.filter((d) => allowed.has(d.generation_type)));
  }, [generated.data, generationFilter]);
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
  // Content container style — items stack from the top right under the
  // filter chips. We deliberately do NOT set flexGrow:1 here: combined with
  // FlatList's RefreshControl on Android, it pushed the rows to the bottom
  // of a stretched container instead of top-aligning them (see post-fix
  // captures 2-5.jpg from 2026-04-30). Top-alignment is now produced by the
  // natural column flexbox inside the contentContainer, while the FlatList
  // itself keeps `flex:1` so it always fills the available vertical space.
  // The empty state renders with its own paddingTop, so it still sits right
  // under the chips when the list is empty.
  const listContentStyle = useMemo(
    () => ({
      paddingTop: 8,
      paddingBottom: 96 + insets.bottom,
    }),
    [insets.bottom],
  );

  const renderUploadsBody = () => {
    const showSearch = searchTerm.trim().length >= 2;
    const data = showSearch
      ? search.data ?? []
      : (list.data?.pages ?? []).flatMap((p) => p.items);
    const refreshing = list.isRefetching && !list.isFetchingNextPage;

    return (
      <FlatList
        style={styles.flex1}
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
        contentContainerStyle={listContentStyle}
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
        // P8.3 — perf knobs.
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={10}
        removeClippedSubviews
      />
    );
  };

  const renderGeneratedBody = () => {
    const data = generatedFilteredPages.flat();
    return (
      <FlatList
        style={styles.flex1}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          // Adapt the GeneratedDocumentResponse shape to the generic
          // UserDocumentListItem the row renderer expects. `category` must be
          // one of the upload-category enum values (DocumentListItem only uses
          // it to pick an icon colour, with a 'default' fallback) — using
          // 'other' is the cheapest way to satisfy the type without losing
          // the dedicated icon path. `expiry_status: 'no_expiry'` matches the
          // semantics for platform-generated PDFs (receipts, certificates).
          const display: UserDocumentListItem = {
            id: item.id,
            document_type: item.generation_type,
            category: 'other',
            file_name: item.file_name,
            display_name: item.title,
            expiry_date: null,
            days_until_expiry: null,
            expiry_status: 'no_expiry',
            status: 'active',
            source: 'platform_generated',
            thumbnail_path: null,
            mime_type: 'application/pdf',
            file_size_bytes: 0,
            created_at: item.created_at,
            is_verified: true,
          };
          return (
            <DocumentListItem
              item={display}
              onPress={() => handleGeneratedPress(item)}
            />
          );
        }}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={<DocumentEmptyState variant="generated" />}
        contentContainerStyle={listContentStyle}
        refreshControl={
          <RefreshControl
            refreshing={generated.isRefetching}
            onRefresh={() => generated.refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={10}
        removeClippedSubviews
      />
    );
  };

  const renderAlertsBody = () => {
    const data = alerts.data ?? [];
    return (
      <FlatList
        style={styles.flex1}
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
        contentContainerStyle={listContentStyle}
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
            <DocumentFilterChips
              tab="uploads"
              value={categoryFilter}
              onChange={setCategoryFilter}
            />
          ) : null}
        </>
      ) : null}

      {tab === 'generated' ? (
        <DocumentFilterChips
          tab="generated"
          value={generationFilter}
          onChange={setGenerationFilter}
        />
      ) : null}

      {tab === 'uploads' ? renderUploadsBody() : null}
      {tab === 'generated' ? renderGeneratedBody() : null}
      {tab === 'alerts' ? renderAlertsBody() : null}

      {tab === 'uploads' ? (
        <FAB
          icon="plus"
          style={[
            styles.fab,
            { backgroundColor: colors.primary, bottom: 16 + insets.bottom },
          ]}
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
  // Top-aligned content for every list state (full / 1-item / empty) — see
  // listContentStyle in the component for the rationale.
  flex1: { flex: 1 },
  tabsRow: { paddingHorizontal: 16, paddingVertical: 8 },
  searchBar: { marginHorizontal: 16, marginTop: 4, marginBottom: 4 },
  fab: {
    position: 'absolute',
    right: 16,
    // bottom is computed at render time from useSafeAreaInsets().
  },
});
