/**
 * Dashboard Tab — Citizen Home Screen
 *
 * Connected to GET /service-requests/dashboard-summary.
 * Displays: stats, upcoming appointment, action required, quick actions,
 * recent requests, recent payments, and citizen notifications.
 *
 * Zero mock data — all from backend via React Query.
 */

import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Surface,
  Button,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import { useAuth } from '@core/hooks/use-auth';
import { getFullName } from '@core/config/types';
import { useDashboard } from '@modules/dashboard';
import { StatsGrid } from '@modules/dashboard/components/stats-grid';
import { RecentRequestsList } from '@modules/dashboard/components/recent-requests-list';
import { RecentPaymentsList } from '@modules/dashboard/components/recent-payments-list';
import { NotificationsList } from '@modules/dashboard/components/notifications-list';
import { AppointmentCard } from '@modules/dashboard/components/appointment-card';
import { ActionRequiredBanner } from '@modules/dashboard/components/action-required-banner';
import { QuickActions } from '@modules/dashboard/components/quick-actions';

type TabValue = 'requests' | 'payments' | 'notifications';

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing } = useAppTheme();
  const { user } = useAuth();

  const { data, isLoading, refetch, isRefetching } = useDashboard(!!user);
  const [activeTab, setActiveTab] = useState<TabValue>('requests');

  const firstName = user ? getFullName(user).split(' ')[0] : '';

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Empty state (no data or no user)
  if (!data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.emptyContainer, { padding: spacing.lg }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          <MaterialCommunityIcons name="file-document-outline" size={64} color={colors.outlineVariant} />
          <Text variant="titleMedium" style={{ color: colors.onSurfaceVariant, marginTop: spacing.md, fontWeight: '600' }}>
            {t('dashboard.noRequests')}
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.outline, textAlign: 'center', marginTop: spacing.xs }}>
            {t('dashboard.startFirstRequest')}
          </Text>
          <Button mode="contained" onPress={() => router.push('/(tabs)/services')} style={{ marginTop: spacing.lg }} icon="plus">
            {t('dashboard.quickActions.newRequest')}
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        {/* Greeting */}
        <View style={{ padding: spacing.md, paddingBottom: 0 }}>
          <Text variant="headlineSmall" style={{ color: colors.onBackground, fontWeight: '700' }}>
            {t('dashboard.greeting', { name: firstName })}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={{ padding: spacing.md }}>
          <StatsGrid stats={data.stats} />
        </View>

        {/* Upcoming Appointment */}
        {data.upcoming_appointment && (
          <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
            <AppointmentCard appointment={data.upcoming_appointment} />
          </View>
        )}

        {/* Action Required Banner */}
        {data.action_required.length > 0 && (
          <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
            <ActionRequiredBanner actions={data.action_required} />
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.lg }}>
          <QuickActions />
        </View>

        {/* Tabs: Requests / Payments / Notifications */}
        <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.sm }}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
            buttons={[
              { value: 'requests', label: t('dashboard.tabs.requests'), icon: 'file-document-outline' },
              { value: 'payments', label: t('dashboard.tabs.payments'), icon: 'cash' },
              {
                value: 'notifications',
                label: t('dashboard.tabs.notifications'),
                icon: 'bell-outline',
                showSelectedCheck: false,
              },
            ]}
            density="small"
          />
        </View>

        {/* Tab Content */}
        <Surface style={[styles.tabContent, { marginHorizontal: spacing.md, borderRadius: 12, backgroundColor: colors.surface }]} elevation={1}>
          {activeTab === 'requests' && (
            <RecentRequestsList requests={data.recent_requests} />
          )}
          {activeTab === 'payments' && (
            <RecentPaymentsList payments={data.recent_payments} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsList notifications={data.notifications} />
          )}
        </Surface>

        {/* See all link */}
        {activeTab === 'requests' && data.recent_requests.length > 0 && (
          <Button
            mode="text"
            onPress={() => router.push('/(tabs)/requests')}
            style={{ marginTop: spacing.sm }}
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
  tabContent: { overflow: 'hidden', padding: 8 },
});
