import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Checkbox, Divider, Text } from 'react-native-paper';
import { useAppTheme } from '@core/theme';
import { formatCurrency, formatDate } from '@core/utils/format';
import type { LicenseObligation } from '@modules/inspections/types/inspection.types';

interface Props {
  obligations: LicenseObligation[];
  selectable?: boolean;
  selected?: Set<string>;
  onToggle?: (id: string) => void;
}

export function ObligationList({ obligations, selectable = false, selected, onToggle }: Props) {
  const { colors, custom } = useAppTheme();

  if (obligations.length === 0) {
    return (
      <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, padding: 16 }}>
        Sin obligaciones pendientes
      </Text>
    );
  }

  return (
    <View>
      {obligations.map((ob, i) => {
        const isPaid = ob.status === 'paid';
        const dotColor = isPaid ? custom.status.conforme : custom.status.nonConforme;
        const isChecked = selected?.has(ob.id) ?? false;

        return (
          <React.Fragment key={ob.id}>
            <View style={styles.item}>
              {selectable && (
                <Checkbox
                  status={isChecked ? 'checked' : 'unchecked'}
                  onPress={() => onToggle?.(ob.id)}
                  color={colors.primary}
                />
              )}
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
              <View style={styles.body}>
                <Text variant="bodyMedium" style={{ color: colors.onSurface }} numberOfLines={1}>
                  {ob.service_name ?? ob.fee_type}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  {ob.ministry_name ? `${ob.ministry_name} • ` : ''}Vence: {formatDate(ob.due_date)}
                </Text>
              </View>
              <View style={styles.amount}>
                <Text variant="titleSmall" style={{ color: dotColor, fontWeight: '700' }}>
                  {formatCurrency(ob.amount + (ob.penalty_amount ?? 0))}
                </Text>
                <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
                  {ob.status}
                </Text>
              </View>
            </View>
            {i < obligations.length - 1 && <Divider style={{ marginLeft: selectable ? 56 : 32 }} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 16, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  body: { flex: 1 },
  amount: { alignItems: 'flex-end', marginLeft: 8 },
});
