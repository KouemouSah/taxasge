/**
 * Support Tickets List — Placeholder
 *
 * Displays user's support tickets with status indicators.
 *
 * TODO: Wire up to GET /support/tickets
 */

import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, FAB, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';

export default function SupportListScreen() {
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
          {t('support.title')}
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
            name="headset"
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
            {t('support.title')}
          </Text>
          <Text
            variant="bodyMedium"
            style={[
              styles.emptyDescription,
              { color: colors.outline, marginTop: spacing.xs },
            ]}
          >
            {t('common.noResults')}
          </Text>
        </Surface>
      </ScrollView>

      {/* FAB to create new ticket */}
      <FAB
        icon="plus"
        label={t('support.newTicket')}
        onPress={() => router.push('/support/new')}
        style={[
          styles.fab,
          { backgroundColor: colors.primary, borderRadius: borderRadius.xl },
        ]}
        color={colors.onPrimary}
      />
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
  emptyDescription: {
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});
