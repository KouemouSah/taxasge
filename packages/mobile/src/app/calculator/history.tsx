/**
 * Calculator History Screen — Placeholder
 *
 * Shows saved calculation results for reference.
 *
 * TODO: Wire up to GET /calculations/history
 */

import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';

export default function CalculatorHistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();

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
          {t('calculator.history')}
        </Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Content — empty state */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
      >
        <Surface
          style={[
            styles.emptyState,
            {
              padding: spacing.xl,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              marginTop: spacing.xl,
            },
          ]}
          elevation={0}
        >
          <MaterialCommunityIcons
            name="history"
            size={64}
            color={colors.outlineVariant}
          />
          <Text
            variant="titleMedium"
            style={[
              styles.emptyTitle,
              { color: colors.onSurfaceVariant, marginTop: spacing.md },
            ]}
          >
            {t('calculator.history')}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: colors.outline, marginTop: spacing.xs, textAlign: 'center' }}
          >
            {t('common.noResults')}
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
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontWeight: '600',
  },
});
