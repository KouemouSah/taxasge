/**
 * Payment List Item — Native Android style flat list row.
 *
 * Mirrors the visual language of `RequestListItem`:
 * Line 1: Status dot + Title (method/workflow) ........... Status label
 * Line 2: Reference · Date relative ........................ Amount
 */

import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@core/theme';
import { formatRelativeTime, formatCurrency } from '@core/utils/format';
import type { Payment, PaymentStatus } from '../types/payments.types';

interface PaymentListItemProps {
  item: Payment;
  onPress: () => void;
}

function getStatusDotColor(status: PaymentStatus): string {
  switch (status) {
    case 'pending':
      return '#FFC107';
    case 'processing':
      return '#FF9800';
    case 'completed':
      return '#1B5E20';
    case 'failed':
      return '#F44336';
    case 'cancelled':
      return '#9E9E9E';
    case 'refunded':
      return '#1565C0';
    default:
      return '#9E9E9E';
  }
}

function getStatusTextColor(status: PaymentStatus): string {
  switch (status) {
    case 'pending':
      return '#F57F17';
    case 'processing':
      return '#E65100';
    case 'completed':
      return '#1B5E20';
    case 'failed':
      return '#C62828';
    case 'cancelled':
      return '#757575';
    case 'refunded':
      return '#1565C0';
    default:
      return '#757575';
  }
}

export function PaymentListItem({ item, onPress }: PaymentListItemProps) {
  const { colors, spacing } = useAppTheme();
  const { t } = useTranslation();

  const dotColor = getStatusDotColor(item.status);
  const statusColor = getStatusTextColor(item.status);
  const statusLabel = t(`payments.status.${item.status}`, {
    defaultValue: item.status,
  });
  const methodLabel = t(`payments.method.${item.payment_method}`, {
    defaultValue: item.payment_method.replace(/_/g, ' '),
  });
  const title = item.fiscal_service_name || methodLabel;
  const reference = item.bank_reference || item.id.slice(0, 8);
  const timeAgo = formatRelativeTime(item.paid_at || item.created_at);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.primaryContainer }}
      style={[
        styles.container,
        { paddingHorizontal: spacing.md, paddingVertical: 12 },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]} />

      <View style={styles.content}>
        <View style={styles.line1}>
          <Text
            variant="bodyLarge"
            style={[styles.title, { color: colors.onSurface }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1}>
            {statusLabel}
          </Text>
        </View>

        <View style={styles.line2}>
          <Text
            variant="bodySmall"
            style={{ color: colors.outline, flex: 1 }}
            numberOfLines={1}
          >
            {reference} · {timeAgo}
          </Text>
          <Text style={[styles.amount, { color: colors.onSurface }]}>
            {formatCurrency(item.amount, item.currency)}
          </Text>
        </View>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.outline}
        style={{ marginLeft: 4 }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  content: { flex: 1, gap: 2 },
  line1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: { fontWeight: '600', flex: 1, fontSize: 15 },
  statusText: { fontSize: 12, fontWeight: '600' },
  line2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: { fontSize: 13, fontWeight: '600', marginLeft: 8 },
});
