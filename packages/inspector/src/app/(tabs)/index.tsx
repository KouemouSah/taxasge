/**
 * Dashboard Screen - Facil Inspeccion
 *
 * Auto-detects agent vs supervisor.
 * Agent: today stats + quick actions + recent inspections
 * Supervisor: live counters + today/week stats + alerts + recent inspections
 */

import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@core/hooks/use-auth';
import { useAppTheme } from '@core/theme';
import { getFullName } from '@core/config/types';
import {
  useAgentStats,
  useRecentInspections,
  useSupervisorDashboard,
  useLiveStatus,
} from '@modules/dashboard/services/dashboard-hooks';
import { StatsGrid } from '@modules/dashboard/components/stats-grid';
import { RecentInspections } from '@modules/dashboard/components/recent-inspections';
import { QuickActions } from '@modules/dashboard/components/quick-actions';
import { SupervisorAlerts } from '@modules/dashboard/components/supervisor-alerts';
import { LiveCounters } from '@modules/dashboard/components/live-counters';
import { usePushNotifications } from '@modules/notifications/services/use-push-notifications';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user, isSupervisor } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Register push notifications on dashboard mount (main entry point)
  usePushNotifications();
  const queryClient = useQueryClient();

  // Agent data
  const agentStats = useAgentStats();
  const recentInspections = useRecentInspections();

  // Supervisor data (only fetched if supervisor)
  const supervisorDashboard = useSupervisorDashboard(isSupervisor);
  const liveStatus = useLiveStatus(isSupervisor);

  const isRefreshing =
    agentStats.isFetching || recentInspections.isFetching ||
    (isSupervisor && (supervisorDashboard.isFetching || liveStatus.isFetching));

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  const userName = user ? getFullName(user) : '';
  const entityName = user?.entity_name ?? '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text variant="headlineSmall" style={{ color: colors.primary, fontWeight: '700' }}>
          {t('app.name')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={!!isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text variant="titleLarge" style={{ color: colors.onBackground }}>
            {t('dashboard.greeting', { name: userName })}
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            {entityName} {isSupervisor ? '(Supervisor)' : ''}
          </Text>
        </View>

        {/* Quick Actions */}
        <QuickActions />

        {/* Supervisor: Live Counters */}
        {isSupervisor && liveStatus.data && (
          <LiveCounters counters={liveStatus.data.counters} />
        )}

        {/* Supervisor: Alerts */}
        {isSupervisor && supervisorDashboard.data && (
          <SupervisorAlerts
            pendingSeals={supervisorDashboard.data.pending_seals.length}
            overdueMed={supervisorDashboard.data.overdue_med}
            unreconciledCash={supervisorDashboard.data.unreconciled_cash_amount}
            unreconciledCount={supervisorDashboard.data.unreconciled_cash_count}
          />
        )}

        {/* Stats Grid */}
        {isSupervisor && supervisorDashboard.data ? (
          <>
            <StatsGrid stats={supervisorDashboard.data.today} label={t('dashboard.todayStats')} />
            <StatsGrid stats={supervisorDashboard.data.week} label={t('dashboard.weekStats')} />
          </>
        ) : agentStats.data ? (
          <StatsGrid stats={agentStats.data} label={t('dashboard.todayStats')} />
        ) : null}

        {/* Recent Inspections */}
        <RecentInspections
          items={
            isSupervisor && supervisorDashboard.data
              ? supervisorDashboard.data.recent_inspections
              : recentInspections.data?.items ?? []
          }
          title={t('dashboard.recent')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  scrollContent: { paddingBottom: 24 },
  greeting: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
