/**
 * Calculator Screen — Placeholder
 *
 * Tax/fee calculator allowing users to estimate costs before
 * starting a service request.
 *
 * Shows:
 * - Service selector
 * - Calculate button
 * - Result breakdown
 *
 * TODO: Wire up to POST /fiscal-services/{id}/calculate
 */

import { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Surface, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';

export default function CalculatorScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();

  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = () => {
    // TODO: Call calculation API
    setIsCalculating(true);
    setTimeout(() => setIsCalculating(false), 1500);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
      >
        <Button
          mode="text"
          icon="arrow-left"
          onPress={() => router.back()}
          compact
        >
          {t('common.back')}
        </Button>
        <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
          {t('calculator.title')}
        </Text>
        <Button
          mode="text"
          onPress={() => router.push('/calculator/history')}
          compact
        >
          {t('calculator.history')}
        </Button>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
      >
        {/* Service selector placeholder */}
        <Surface
          style={[
            styles.section,
            {
              padding: spacing.lg,
              borderRadius: borderRadius.lg,
              backgroundColor: colors.surface,
              marginBottom: spacing.md,
            },
          ]}
          elevation={1}
        >
          <Text
            variant="titleSmall"
            style={{ color: colors.onSurface, fontWeight: '600', marginBottom: spacing.md }}
          >
            {t('calculator.selectService')}
          </Text>

          <TextInput
            label={t('calculator.selectService')}
            value=""
            mode="outlined"
            editable={false}
            right={<TextInput.Icon icon="chevron-down" />}
            left={<TextInput.Icon icon="magnify" />}
            onPress={() => {
              // TODO: Open service picker
            }}
            style={{ marginBottom: spacing.lg }}
          />

          <Button
            mode="contained"
            onPress={handleCalculate}
            loading={isCalculating}
            disabled={isCalculating}
            contentStyle={styles.buttonContent}
            style={{ borderRadius: borderRadius.sm }}
            icon="calculator"
          >
            {t('calculator.calculate')}
          </Button>
        </Surface>

        {/* Result placeholder */}
        <Surface
          style={[
            styles.resultCard,
            {
              padding: spacing.xl,
              borderRadius: borderRadius.lg,
              backgroundColor: colors.surface,
            },
          ]}
          elevation={0}
        >
          <MaterialCommunityIcons
            name="calculator-variant-outline"
            size={64}
            color={colors.outlineVariant}
          />
          <Text
            variant="titleMedium"
            style={[
              styles.resultTitle,
              { color: colors.onSurfaceVariant, marginTop: spacing.md },
            ]}
          >
            {t('calculator.result')}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: colors.outline, marginTop: spacing.xs, textAlign: 'center' }}
          >
            {t('calculator.selectService')}
          </Text>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {},
  buttonContent: {
    paddingVertical: 6,
  },
  resultCard: {
    alignItems: 'center',
  },
  resultTitle: {
    fontWeight: '600',
  },
});
