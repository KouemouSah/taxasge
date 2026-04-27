/**
 * Payment Status Badge — coloured pill for payment_status_enum values.
 */

import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useAppTheme, type AppTheme } from '@core/theme';
import type { PaymentStatus } from '../types/payments.types';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  compact?: boolean;
}

type BadgeColors = { bg: string; text: string };

function getColors(status: PaymentStatus, colors: AppTheme['colors']): BadgeColors {
  switch (status) {
    case 'pending':
      return { bg: '#FFF8E1', text: '#F57F17' }; // amber
    case 'processing':
      return { bg: '#FFF3E0', text: '#E65100' }; // orange
    case 'completed':
      return { bg: '#E8F5E9', text: '#1B5E20' }; // green dark
    case 'failed':
      return { bg: '#FFEBEE', text: '#C62828' }; // red
    case 'cancelled':
      return { bg: colors.surfaceVariant, text: colors.outline };
    case 'refunded':
      return { bg: '#E3F2FD', text: '#1565C0' }; // blue
    default:
      return { bg: colors.surfaceVariant, text: colors.onSurfaceVariant };
  }
}

export function PaymentStatusBadge({ status, compact }: PaymentStatusBadgeProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const badge = getColors(status, colors);
  const label = t(`payments.status.${status}`, {
    defaultValue: status.charAt(0).toUpperCase() + status.slice(1),
  });

  return (
    <View
      style={[
        styles.badge,
        compact ? styles.compact : styles.normal,
        { backgroundColor: badge.bg },
      ]}
    >
      <Text
        style={[compact ? styles.textCompact : styles.textNormal, { color: badge.text }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 20 },
  normal: { paddingHorizontal: 12, paddingVertical: 5 },
  compact: { paddingHorizontal: 8, paddingVertical: 3 },
  textNormal: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  textCompact: { fontSize: 10, fontWeight: '600', lineHeight: 14 },
});
