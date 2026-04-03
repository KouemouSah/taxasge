/**
 * Recent Inspections List
 * Native Android: flat items 56dp, dots + dividers
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@core/theme';
import { formatDate } from '@core/utils/format';
import { StatusBadge } from '@components/ui/status-badge';
import type { InspectionListItem } from '@modules/inspections/types/inspection.types';

interface Props {
  items: InspectionListItem[];
  title?: string;
}

export function RecentInspections({ items, title }: Props) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
          {t('dashboard.noRecent')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && (
        <Text variant="labelLarge" style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
          {title}
        </Text>
      )}
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <Pressable
            onPress={() => router.push(`/inspection/${item.id}` as never)}
            style={({ pressed }) => [
              styles.item,
              pressed && { backgroundColor: colors.surfaceVariant },
            ]}
            android_ripple={{ color: colors.surfaceVariant }}
          >
            <View style={styles.itemLeft}>
              <Text variant="bodyMedium" style={{ color: colors.onSurface }} numberOfLines={1}>
                {item.company_name ?? item.company_nif ?? '-'}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {formatDate(item.inspection_date)} • {item.entity_code}
              </Text>
            </View>
            <View style={styles.itemRight}>
              <StatusBadge
                status={item.result ?? item.status}
                label={t(`${item.result ? 'result' : 'status'}.${item.result ?? item.status}`)}
              />
              {item.payment_collected && (
                <Text variant="labelSmall" style={{ color: colors.primary }}>$</Text>
              )}
            </View>
          </Pressable>
          {index < items.length - 1 && <Divider style={{ marginLeft: 16 }} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  sectionLabel: { paddingHorizontal: 16, paddingBottom: 8, fontWeight: '600' },
  empty: { padding: 32, alignItems: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  itemLeft: { flex: 1, marginRight: 12 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
