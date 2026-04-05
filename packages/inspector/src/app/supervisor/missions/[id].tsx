/**
 * Mission Detail — View mission info, agents, complete mission
 */

import React, { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '@core/theme';
import { formatDate } from '@core/utils/format';
import { extractApiError } from '@core/api/errors';
import { LoadingScreen } from '@components/ui/loading-screen';
import { supervisorApi } from '@modules/supervisor/services/supervisor-api';
import { useCompleteMission } from '@modules/supervisor/services/supervisor-hooks';

export default function MissionDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: mission, isLoading } = useQuery({
    queryKey: ['supervisor', 'mission', id],
    queryFn: () => supervisorApi.getMission(id ?? ''),
    enabled: !!id,
  });

  const completeMutation = useCompleteMission();

  const handleComplete = useCallback(() => {
    if (!id) return;
    Alert.alert(
      t('common.confirm'),
      t('supervisor.completeMission', { defaultValue: 'Complete this mission?' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              await completeMutation.mutateAsync({ id });
              router.back();
            } catch (err) {
              Alert.alert(t('common.error'), extractApiError(err).message);
            }
          },
        },
      ],
    );
  }, [id, completeMutation, t]);

  if (isLoading || !mission) return <LoadingScreen />;

  const canComplete = mission.status === 'planned' || mission.status === 'in_progress';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerRow}>
          <Button icon="arrow-left" onPress={() => router.back()} textColor={colors.primary} compact>
            {t('inspection.back')}
          </Button>
          <Text variant="titleMedium" style={{ color: colors.onBackground, fontWeight: '700' }}>
            {t('supervisor.features.missionPlanning')}
          </Text>
          <View style={{ width: 60 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Mission info */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '700' }}>
            {mission.title ?? formatDate(mission.mission_date)}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
            {formatDate(mission.mission_date)} • {mission.status}
          </Text>
          {mission.notes && (
            <Text variant="bodyMedium" style={{ color: colors.onSurface, marginTop: 8 }}>
              {mission.notes}
            </Text>
          )}
        </View>
        <Divider />

        {/* Agents */}
        <View style={styles.section}>
          <Text variant="labelLarge" style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
            {t('supervisor.agentStatus')} ({mission.agents?.length ?? 0})
          </Text>
          {(mission.agents ?? []).length === 0 ? (
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
              {t('supervisor.noAgents', { defaultValue: 'No agents assigned' })}
            </Text>
          ) : (
            mission.agents.map((agent) => (
              <View key={agent.agent_id} style={styles.agentRow}>
                <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text variant="bodyMedium" style={{ color: colors.onSurface }}>
                    {agent.agent_name}
                  </Text>
                  {agent.assigned_zones && agent.assigned_zones.length > 0 && (
                    <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                      Zones: {agent.assigned_zones.join(', ')}
                    </Text>
                  )}
                </View>
                {agent.target_inspections != null && (
                  <Text variant="labelSmall" style={{ color: colors.primary }}>
                    {agent.target_inspections} insp.
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
        <Divider />

        {/* Actions */}
        {canComplete && (
          <View style={styles.section}>
            <Button
              mode="contained"
              icon="check-circle"
              onPress={handleComplete}
              loading={completeMutation.isPending}
              disabled={completeMutation.isPending}
              style={styles.completeButton}
            >
              {t('inspection.complete')}
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 8, paddingBottom: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scrollContent: { paddingBottom: 32 },
  section: { paddingHorizontal: 16, paddingVertical: 12 },
  sectionTitle: { fontWeight: '600', marginBottom: 8 },
  agentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  completeButton: { borderRadius: 8 },
});
