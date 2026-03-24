/**
 * ServicePricing — Pricing display card for a fiscal service.
 *
 * Shows expedition price (large), renewal price (if different),
 * calculation method label, processing time, and currency badge.
 */

import { StyleSheet, View } from 'react-native';
import { Surface, Text, Chip, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import { formatCurrency } from '@core/utils/format';
import type { PricingInfo } from '../types/services.types';

/** Human-readable labels for calculation methods. */
const METHOD_LABELS: Record<string, string> = {
  fixed_expedition: 'Tasa fija',
  fixed_renewal: 'Tasa fija (renovacion)',
  percentage_based: 'Porcentaje',
  unit_based: 'Por unidad',
  tiered_rates: 'Escalonado',
  formula_based: 'Formula',
  fixed_plus_unit: 'Fija + por unidad',
};

interface ServicePricingProps {
  pricing: PricingInfo;
  processing_time_days?: number;
}

export function ServicePricing({ pricing, processing_time_days }: ServicePricingProps) {
  const { colors, spacing, borderRadius } = useAppTheme();

  const isFree = pricing.expedition_price === 0 && pricing.renewal_price === 0;
  const hasRenewal = pricing.renewal_price > 0 && pricing.renewal_price !== pricing.expedition_price;
  const methodLabel = METHOD_LABELS[pricing.calculation_method] ?? pricing.calculation_method;

  return (
    <Surface
      style={[
        styles.container,
        {
          padding: spacing.md,
          borderRadius: borderRadius.md,
          backgroundColor: colors.surface,
        },
      ]}
      elevation={1}
    >
      {/* Section header */}
      <View style={[styles.header, { marginBottom: spacing.sm }]}>
        <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.primary} />
        <Text
          variant="titleSmall"
          style={[styles.headerText, { color: colors.onSurface, marginLeft: spacing.sm }]}
        >
          Tarifas
        </Text>
      </View>

      <Divider style={{ marginBottom: spacing.md }} />

      {isFree ? (
        /* Free service */
        <View style={styles.freeContainer}>
          <MaterialCommunityIcons name="gift-outline" size={32} color={colors.primary} />
          <Text
            variant="headlineSmall"
            style={[styles.freeLabel, { color: colors.primary, marginTop: spacing.sm }]}
          >
            Gratuito
          </Text>
        </View>
      ) : (
        <>
          {/* Expedition price */}
          <View style={[styles.priceRow, { marginBottom: spacing.sm }]}>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, flex: 1 }}>
              Expedicion
            </Text>
            <Text
              variant="headlineMedium"
              style={[styles.priceValue, { color: colors.primary }]}
            >
              {formatCurrency(pricing.expedition_price)}
            </Text>
          </View>

          {/* Renewal price (if different and > 0) */}
          {hasRenewal && (
            <View style={[styles.priceRow, { marginBottom: spacing.sm }]}>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, flex: 1 }}>
                Renovacion
              </Text>
              <Text
                variant="titleMedium"
                style={{ color: colors.onSurface, fontWeight: '600' }}
              >
                {formatCurrency(pricing.renewal_price)}
              </Text>
            </View>
          )}

          {/* Percentage rate (if applicable) */}
          {pricing.percentage_rate != null && pricing.percentage_rate > 0 && (
            <View style={[styles.priceRow, { marginBottom: spacing.sm }]}>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, flex: 1 }}>
                Tasa aplicable
              </Text>
              <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '600' }}>
                {pricing.percentage_rate}%
              </Text>
            </View>
          )}
        </>
      )}

      <Divider style={{ marginVertical: spacing.sm }} />

      {/* Metadata row: method + processing time + currency */}
      <View style={[styles.metaRow, { gap: spacing.sm }]}>
        {/* Calculation method */}
        <Chip
          compact
          mode="flat"
          style={{ backgroundColor: colors.surfaceVariant }}
          textStyle={{ fontSize: 11, color: colors.onSurfaceVariant }}
          icon={() => (
            <MaterialCommunityIcons name="calculator-variant" size={12} color={colors.onSurfaceVariant} />
          )}
        >
          {methodLabel}
        </Chip>

        {/* Processing time */}
        {processing_time_days != null && processing_time_days > 0 && (
          <Chip
            compact
            mode="flat"
            style={{ backgroundColor: colors.surfaceVariant }}
            textStyle={{ fontSize: 11, color: colors.onSurfaceVariant }}
            icon={() => (
              <MaterialCommunityIcons name="clock-outline" size={12} color={colors.onSurfaceVariant} />
            )}
          >
            {processing_time_days} dia{processing_time_days !== 1 ? 's' : ''}
          </Chip>
        )}

        {/* Currency badge */}
        <Chip
          compact
          mode="flat"
          style={{ backgroundColor: colors.tertiaryContainer }}
          textStyle={{ fontSize: 11, color: colors.onTertiaryContainer }}
        >
          {pricing.currency}
        </Chip>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: '600',
  },
  freeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  freeLabel: {
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  priceValue: {
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});
