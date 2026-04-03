import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '@core/theme';

const FEATURES = [
  { icon: 'shield-check', key: 'sealManagement' },
  { icon: 'cash-register', key: 'cashReconciliation' },
  { icon: 'account-group', key: 'liveAgentStatus' },
  { icon: 'chart-line', key: 'analytics' },
  { icon: 'map-marker-path', key: 'missionPlanning' },
] as const;

export default function SupervisorComingSoon() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MaterialCommunityIcons
        name="shield-account-outline"
        size={72}
        color={colors.primary}
        style={{ marginBottom: 16 }}
      />
      <Text variant="headlineSmall" style={{ color: colors.primary, fontWeight: '700', marginBottom: 8 }}>
        {t('supervisor.comingSoon')}
      </Text>
      <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: 24 }}>
        {t('supervisor.comingSoonDescription')}
      </Text>

      <View style={styles.featureList}>
        {FEATURES.map((f) => (
          <View key={f.key} style={styles.featureRow}>
            <MaterialCommunityIcons name={f.icon} size={20} color={colors.primary} />
            <Text variant="bodyMedium" style={{ color: colors.onSurface, marginLeft: 12 }}>
              {t(`supervisor.features.${f.key}`)}
            </Text>
          </View>
        ))}
      </View>

      <Button mode="text" onPress={() => router.back()} style={{ marginTop: 24 }}>
        {t('inspection.back')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  featureList: { alignSelf: 'stretch', gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
});
