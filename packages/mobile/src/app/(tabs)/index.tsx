/**
 * Dashboard Tab — Placeholder
 *
 * Citizen home screen showing:
 * - Personalized greeting
 * - 4 stat cards (active, completed, pending, total paid)
 * - Quick actions (New Request, My Requests, Support)
 * - Recent requests section (empty state)
 *
 * TODO: Wire up to GET /service-requests/dashboard-summary
 */

import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Text, Card, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import { useAuth } from '@core/hooks/use-auth';

/** Placeholder stats for UI structure */
const MOCK_STATS = {
  active: 0,
  completed: 0,
  pendingAction: 0,
  totalPaid: 0,
};

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: Refetch dashboard summary
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const stats = MOCK_STATS;
  const firstName = user?.first_name ?? 'Facil';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Greeting */}
        <Text
          variant="headlineSmall"
          style={[styles.greeting, { color: colors.onBackground, marginBottom: spacing.lg }]}
        >
          {t('dashboard.greeting', { name: firstName })}
        </Text>

        {/* Stat cards */}
        <View style={[styles.statsGrid, { gap: spacing.sm, marginBottom: spacing.lg }]}>
          <StatCard
            label={t('dashboard.stats.active')}
            value={stats.active}
            icon="file-clock-outline"
            color={colors.processing}
          />
          <StatCard
            label={t('dashboard.stats.completed')}
            value={stats.completed}
            icon="check-circle-outline"
            color={colors.success}
          />
          <StatCard
            label={t('dashboard.stats.pendingAction')}
            value={stats.pendingAction}
            icon="alert-circle-outline"
            color={colors.warning}
          />
          <StatCard
            label={t('dashboard.stats.totalPaid')}
            value={`${stats.totalPaid} XAF`}
            icon="cash-multiple"
            color={colors.primary}
          />
        </View>

        {/* Quick actions */}
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: colors.onBackground, marginBottom: spacing.sm }]}
        >
          {t('dashboard.quickActions.newRequest')}
        </Text>
        <View style={[styles.actionsRow, { gap: spacing.sm, marginBottom: spacing.lg }]}>
          <QuickAction
            icon="plus-circle-outline"
            label={t('dashboard.quickActions.newRequest')}
            onPress={() => router.push('/(tabs)/services')}
          />
          <QuickAction
            icon="file-document-multiple-outline"
            label={t('dashboard.quickActions.myRequests')}
            onPress={() => router.push('/(tabs)/requests')}
          />
          <QuickAction
            icon="headset"
            label={t('dashboard.quickActions.support')}
            onPress={() => router.push('/support')}
          />
        </View>

        {/* Recent requests */}
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: colors.onBackground, marginBottom: spacing.sm }]}
        >
          {t('dashboard.recentRequests')}
        </Text>
        <Surface
          style={[
            styles.emptyState,
            {
              padding: spacing.xl,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
            },
          ]}
          elevation={0}
        >
          <MaterialCommunityIcons
            name="file-document-outline"
            size={48}
            color={colors.outlineVariant}
          />
          <Text
            variant="bodyLarge"
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
          <Button
            mode="contained"
            onPress={() => router.push('/(tabs)/services')}
            style={{ marginTop: spacing.md }}
            icon="plus"
          >
            {t('dashboard.quickActions.newRequest')}
          </Button>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const { colors, spacing, borderRadius } = useAppTheme();

  return (
    <Card
      style={[
        styles.statCard,
        { borderRadius: borderRadius.md, backgroundColor: colors.surface },
      ]}
    >
      <Card.Content style={[styles.statContent, { padding: spacing.md }]}>
        <MaterialCommunityIcons
          name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={24}
          color={color}
        />
        <Text
          variant="titleLarge"
          style={[styles.statValue, { color: colors.onSurface, marginTop: spacing.xs }]}
        >
          {value}
        </Text>
        <Text
          variant="labelSmall"
          style={{ color: colors.onSurfaceVariant }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Card.Content>
    </Card>
  );
}

interface QuickActionProps {
  icon: string;
  label: string;
  onPress: () => void;
}

function QuickAction({ icon, label, onPress }: QuickActionProps) {
  const { colors, spacing, borderRadius } = useAppTheme();

  return (
    <Surface
      style={[
        styles.actionButton,
        {
          padding: spacing.md,
          borderRadius: borderRadius.md,
          backgroundColor: colors.primaryContainer,
        },
      ]}
      elevation={0}
    >
      <Button
        mode="text"
        onPress={onPress}
        contentStyle={styles.actionContent}
        labelStyle={{ color: colors.onPrimaryContainer, fontSize: 12 }}
        icon={({ size }) => (
          <MaterialCommunityIcons
            name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={size}
            color={colors.onPrimaryContainer}
          />
        )}
      >
        {label}
      </Button>
    </Surface>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  greeting: {
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontWeight: '700',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionContent: {
    flexDirection: 'column',
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
});
