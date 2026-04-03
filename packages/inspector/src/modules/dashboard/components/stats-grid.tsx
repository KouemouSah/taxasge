/**
 * Stats Grid - Today's inspection KPIs
 * Native Android design: compact, no elevation
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@core/theme';
import { formatCurrency } from '@core/utils/format';
import type { InspectionStats } from '@modules/inspections/types/inspection.types';

interface Props {
  stats: InspectionStats;
  label: string;
}

export function StatsGrid({ stats, label }: Props) {
  const { t } = useTranslation();
  const { colors, custom } = useAppTheme();

  const items = [
    { value: stats.total, label: t('dashboard.total'), color: colors.primary },
    { value: stats.conforme, label: t('dashboard.conforme'), color: custom.status.conforme },
    { value: stats.non_conforme, label: t('dashboard.nonConforme'), color: custom.status.nonConforme },
    { value: formatCurrency(stats.total_collected_amount), label: t('dashboard.collected'), color: custom.tertiary.main },
  ];

  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
        {label}
      </Text>
      <View style={styles.grid}>
        {items.map((item, i) => (
          <View key={i} style={[styles.statItem, { backgroundColor: colors.surface }]}>
            <Text variant="headlineMedium" style={[styles.value, { color: item.color }]}>
              {typeof item.value === 'number' ? item.value : item.value}
            </Text>
            <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  sectionLabel: { paddingHorizontal: 16, paddingBottom: 8, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  statItem: {
    width: '50%' as unknown as number,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  value: { fontWeight: '700', fontSize: 28 },
});
