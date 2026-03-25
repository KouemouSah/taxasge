/**
 * Dashboard Tab — Citizen Home Screen (Native Android v2)
 *
 * - App header with logo (dashboard only)
 * - Compact horizontal stats strip
 * - Inline urgent notifications (not card)
 * - Quick actions
 * - Tabs: requests / payments / notifications
 */

import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Image } from 'react-native';
import {
  Text,
  Surface,
  Button,
  ActivityIndicator,
  SegmentedButtons,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import { useAuth } from '@core/hooks/use-auth';
import { getFullName } from '@core/config/types';
import { formatCurrency } from '@core/utils/format';
import { useDashboard } from '@modules/dashboard';
import type { DashboardStats, DashboardActionRequired } from '@modules/dashboard';
import { RecentRequestsList } from '@modules/dashboard/components/recent-requests-list';
import { RecentPaymentsList } from '@modules/dashboard/components/recent-payments-list';
import { NotificationsList } from '@modules/dashboard/components/notifications-list';
import { AppointmentCard } from '@modules/dashboard/components/appointment-card';
import { QuickActions } from '@modules/dashboard/components/quick-actions';

const APP_LOGO = require('../../../assets/images/logo.png');

type TabValue = 'requests' | 'payments' | 'notifications';

// ---------------------------------------------------------------------------
// Compact Stats Strip (replaces large 2x2 grid)
// ---------------------------------------------------------------------------

function CompactStats({ stats, colors, t }: {
  stats: DashboardStats;
  colors: ReturnType<typeof useAppTheme>['colors'];
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const items = [
    { value: stats.active, label: t('dashboard.stats.active'), color: '#FF9800' },
    { value: stats.completed, label: t('dashboard.stats.completed'), color: colors.primary },
    { value: stats.pending_action, label: t('dashboard.stats.pendingAction'), color: '#F44336' },
    { value: formatCurrency(stats.total_paid), label: t('dashboard.stats.totalPaid'), color: colors.primary },
  ];

  return (
    <View style={styles.statsStrip}>
      {items.map((item, i) => (
        <View key={item.label} style={[styles.statItem, i < items.length - 1 && styles.statItemBorder]}>
          <Text style={[styles.statValue, { color: item.color }]}>
            {typeof item.value === 'number' ? item.value : item.value}
          </Text>
          <Text style={[styles.statLabel, { color: colors.outline }]} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Inline Urgent Notifications (replaces ActionRequiredBanner card)
// ---------------------------------------------------------------------------

function UrgentNotifications({ actions, colors, router }: {
  actions: DashboardActionRequired[];
  colors: ReturnType<typeof useAppTheme>['colors'];
  router: ReturnType<typeof useRouter>;
}) {
  if (actions.length === 0) return null;

  return (
    <View>
      {actions.map((action) => (
        <View
          key={action.request_id}
          style={[styles.urgentItem, { borderLeftColor: '#F44336' }]}
        >
          <MaterialCommunityIcons name="alert-circle" size={16} color="#F44336" />
          <Text
            variant="bodySmall"
            style={{ color: colors.onSurface, flex: 1, marginLeft: 8 }}
            numberOfLines={2}
            onPress={() => router.push(`/(tabs)/requests/${action.request_id}`)}
          >
            <Text style={{ fontWeight: '600' }}>{action.reference}</Text>
            {' — '}{action.message}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={colors.outline}
          />
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing } = useAppTheme();
  const { user } = useAuth();

  const { data, isLoading, refetch, isRefetching } = useDashboard(!!user);
  const [activeTab, setActiveTab] = useState<TabValue>('requests');

  const firstName = user ? getFullName(user).split(' ')[0] : '';

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.emptyContainer, { padding: spacing.lg }]}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          <MaterialCommunityIcons name="file-document-outline" size={64} color={colors.outlineVariant} />
          <Text variant="titleMedium" style={{ color: colors.onSurfaceVariant, marginTop: spacing.md, fontWeight: '600' }}>
            {t('dashboard.noRequests')}
          </Text>
          <Button mode="contained" onPress={() => router.push('/wizard/select-workflow' as never)} style={{ marginTop: spacing.lg }} icon="plus">
            {t('dashboard.quickActions.newRequest')}
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* ═══ APP HEADER (dashboard only) ═══ */}
      <View style={[styles.appHeader, { backgroundColor: colors.surface }]}>
        <Image source={APP_LOGO} style={styles.headerLogo} resizeMode="contain" />
        <View style={[styles.headerLine, { backgroundColor: colors.primary }]} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        {/* Greeting */}
        <View style={{ paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: 8 }}>
          <Text variant="titleMedium" style={{ color: colors.onBackground, fontWeight: '700' }}>
            {t('dashboard.greeting', { name: firstName })}
          </Text>
        </View>

        {/* Compact Stats Strip */}
        <View style={{ paddingHorizontal: spacing.md, marginBottom: 8 }}>
          <CompactStats stats={data.stats} colors={colors} t={t} />
        </View>

        {/* Urgent Notifications (inline, not card) */}
        {data.action_required.length > 0 && (
          <View style={{ paddingHorizontal: spacing.md, marginBottom: 8 }}>
            <UrgentNotifications actions={data.action_required} colors={colors} router={router} />
          </View>
        )}

        {/* Upcoming Appointment */}
        {data.upcoming_appointment && (
          <View style={{ paddingHorizontal: spacing.md, marginBottom: 8 }}>
            <AppointmentCard appointment={data.upcoming_appointment} />
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: spacing.md, marginBottom: 12 }}>
          <QuickActions />
        </View>

        <Divider />

        {/* Tabs */}
        <View style={{ paddingHorizontal: spacing.md, paddingTop: 8, marginBottom: spacing.sm }}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
            buttons={[
              { value: 'requests', label: t('dashboard.tabs.requests'), icon: 'file-document-outline' },
              { value: 'payments', label: t('dashboard.tabs.payments'), icon: 'cash' },
              { value: 'notifications', label: t('dashboard.tabs.notifications'), icon: 'bell-outline', showSelectedCheck: false },
            ]}
            density="small"
          />
        </View>

        {/* Tab Content */}
        <View style={{ marginHorizontal: spacing.md }}>
          {activeTab === 'requests' && <RecentRequestsList requests={data.recent_requests} />}
          {activeTab === 'payments' && <RecentPaymentsList payments={data.recent_payments} />}
          {activeTab === 'notifications' && <NotificationsList notifications={data.notifications} />}
        </View>

        {activeTab === 'requests' && data.recent_requests.length > 0 && (
          <Button
            mode="text"
            onPress={() => router.push('/(tabs)/requests')}
            style={{ marginTop: 4 }}
            icon="arrow-right"
            contentStyle={{ flexDirection: 'row-reverse' }}
          >
            {t('common.seeAll')}
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },

  // App header
  appHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0 },
  headerLogo: { height: 28, width: 100, alignSelf: 'flex-start' },
  headerLine: { height: 1.5, marginTop: 8 },

  // Compact stats
  statsStrip: { flexDirection: 'row', backgroundColor: '#FAFAFA', borderRadius: 8, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  statItemBorder: { borderRightWidth: 1, borderRightColor: '#E0E0E0' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2, textAlign: 'center' },

  // Urgent notifications
  urgentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderLeftWidth: 3, backgroundColor: '#FFF3E0', borderRadius: 4, marginBottom: 4 },
});
