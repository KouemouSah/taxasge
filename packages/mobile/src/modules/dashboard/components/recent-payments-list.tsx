import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Divider, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { formatRelativeTime, formatCurrency } from '@core/utils/format';
import type { DashboardRecentPayment } from '../types/dashboard.types';

interface RecentPaymentsListProps {
  payments: DashboardRecentPayment[];
}

export function RecentPaymentsList({ payments }: RecentPaymentsListProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (payments.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>{t('dashboard.emptyPayments')}</Text>
      </View>
    );
  }

  return (
    <View>
      {payments.map((pmt, i) => (
        <React.Fragment key={pmt.id}>
          <View style={[styles.item, { paddingVertical: 12, paddingHorizontal: 4 }]}>
            <View style={styles.itemContent}>
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '600' }} numberOfLines={1}>
                {pmt.workflow_label}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                {pmt.request_reference} · {formatRelativeTime(pmt.created_at)}
              </Text>
            </View>
            <View style={styles.itemRight}>
              <Text variant="titleSmall" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                {formatCurrency(pmt.amount, pmt.currency)}
              </Text>
              <Chip compact style={{ height: 24 }} textStyle={{ fontSize: 10 }}>
                {pmt.payment_method ?? pmt.status}
              </Chip>
            </View>
          </View>
          {i < payments.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 24 },
  item: { flexDirection: 'row', alignItems: 'center' },
  itemContent: { flex: 1, gap: 2 },
  itemRight: { alignItems: 'flex-end', gap: 4 },
});
