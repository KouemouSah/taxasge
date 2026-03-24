/**
 * Request List Item
 *
 * Pressable card used inside FlatList to display a single service request.
 * Shows workflow label, reference, status badge, amount, and relative time.
 */

import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import { formatRelativeTime, formatCurrency } from '@core/utils/format';
import type { ServiceRequestListItem } from '../types/requests.types';
import { RequestStatusBadge } from './request-status-badge';

/** Convert WORKFLOW_CODE to readable label: PASAPORTE_DETERIORO → Pasaporte Deterioro */
function humanizeWorkflowCode(code: string): string {
  return code
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestListItemProps {
  item: ServiceRequestListItem;
  onPress: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RequestListItem({ item, onPress }: RequestListItemProps) {
  const { colors, spacing, borderRadius } = useAppTheme();

  return (
    <Pressable onPress={onPress} android_ripple={{ color: colors.primaryContainer }}>
      <Surface
        style={[
          styles.card,
          {
            padding: spacing.md,
            borderRadius: borderRadius.md,
            backgroundColor: colors.surface,
            marginHorizontal: spacing.md,
            marginBottom: spacing.sm,
          },
        ]}
        elevation={1}
      >
        {/* Top row: workflow label + status badge */}
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text
              variant="titleSmall"
              style={[styles.title, { color: colors.onSurface }]}
              numberOfLines={1}
            >
              {item.workflow_label || humanizeWorkflowCode(item.workflow_code)}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: colors.outline }}
              numberOfLines={1}
            >
              {item.reference}
            </Text>
          </View>
          <RequestStatusBadge status={item.status} />
        </View>

        {/* Bottom row: amount + relative time + chevron */}
        <View style={[styles.bottomRow, { marginTop: spacing.sm }]}>
          <View style={styles.meta}>
            {item.total_amount != null && item.total_amount > 0 && (
              <Text
                variant="labelMedium"
                style={[styles.amount, { color: colors.onSurface }]}
              >
                {formatCurrency(item.total_amount)}
              </Text>
            )}
            <Text variant="bodySmall" style={{ color: colors.outline }}>
              {formatRelativeTime(item.updated_at || item.created_at)}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.outline}
          />
        </View>
      </Surface>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {},
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amount: {
    fontWeight: '600',
  },
});
