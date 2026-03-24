/**
 * Service Detail Screen — Placeholder
 *
 * Shows details for a specific fiscal service identified by route param [id].
 * Displays:
 * - Service name and ministry
 * - Description
 * - Required documents
 * - Tariff info
 * - "Start request" button
 *
 * TODO: Wire up to GET /fiscal-services/{id}
 */

import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Surface, Divider, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
        <Text
          variant="titleMedium"
          style={{ color: colors.onSurface, fontWeight: '600', flex: 1, textAlign: 'center' }}
          numberOfLines={1}
        >
          {t('services.title')}
        </Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
      >
        {/* Service name placeholder */}
        <Surface
          style={[
            styles.section,
            {
              padding: spacing.lg,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              marginBottom: spacing.md,
            },
          ]}
          elevation={1}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.primaryContainer,
                borderRadius: borderRadius.full,
                width: 56,
                height: 56,
                marginBottom: spacing.md,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              size={28}
              color={colors.primary}
            />
          </View>
          <Text
            variant="headlineSmall"
            style={{ color: colors.onSurface, fontWeight: '700' }}
          >
            {t('services.title')} #{id}
          </Text>
          <Chip
            mode="flat"
            compact
            style={{ backgroundColor: colors.secondaryContainer, marginTop: spacing.sm }}
            textStyle={{ color: colors.onSecondaryContainer }}
          >
            {t('services.categories')}
          </Chip>
        </Surface>

        {/* Required documents */}
        <Surface
          style={[
            styles.section,
            {
              padding: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              marginBottom: spacing.md,
            },
          ]}
          elevation={1}
        >
          <Text
            variant="titleSmall"
            style={{ color: colors.onSurface, fontWeight: '600', marginBottom: spacing.sm }}
          >
            {t('services.documents')}
          </Text>
          <Divider style={{ marginBottom: spacing.sm }} />
          <View style={[styles.docRow, { gap: spacing.xs }]}>
            <MaterialCommunityIcons
              name="checkbox-blank-circle-outline"
              size={16}
              color={colors.outline}
            />
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, flex: 1 }}>
              {t('common.loading')}
            </Text>
          </View>
        </Surface>

        {/* Tariff */}
        <Surface
          style={[
            styles.section,
            {
              padding: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              marginBottom: spacing.md,
            },
          ]}
          elevation={1}
        >
          <Text
            variant="titleSmall"
            style={{ color: colors.onSurface, fontWeight: '600', marginBottom: spacing.sm }}
          >
            {t('services.tariff')}
          </Text>
          <Divider style={{ marginBottom: spacing.sm }} />
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            {t('common.loading')}
          </Text>
        </Surface>

        {/* Procedures */}
        <Surface
          style={[
            styles.section,
            {
              padding: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              marginBottom: spacing.lg,
            },
          ]}
          elevation={1}
        >
          <Text
            variant="titleSmall"
            style={{ color: colors.onSurface, fontWeight: '600', marginBottom: spacing.sm }}
          >
            {t('services.procedures')}
          </Text>
          <Divider style={{ marginBottom: spacing.sm }} />
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            {t('common.loading')}
          </Text>
        </Surface>
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={[
          styles.bottomBar,
          {
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderTopColor: colors.outlineVariant,
          },
        ]}
      >
        <Button
          mode="contained"
          onPress={() => {
            // TODO: Create wizard session and navigate
            router.push('/wizard/new-session');
          }}
          contentStyle={styles.ctaContent}
          style={{ borderRadius: borderRadius.sm }}
          icon="arrow-right"
        >
          {t('services.startRequest')}
        </Button>
      </View>
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
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomBar: {
    borderTopWidth: 1,
  },
  ctaContent: {
    paddingVertical: 6,
  },
});
