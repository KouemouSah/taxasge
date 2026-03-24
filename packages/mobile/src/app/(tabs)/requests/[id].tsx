/**
 * Request Detail Screen — Placeholder
 *
 * Shows details for a specific service request identified by route param [id].
 * Displays placeholder sections for:
 * - Status & progress stepper
 * - Request data sections
 * - Payment info
 * - Appointment info
 * - Notifications timeline
 *
 * TODO: Wire up to GET /service-requests/{id}/detail-view
 */

import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Surface, Divider, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';

export default function RequestDetailScreen() {
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
        <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
          {t('requests.detail')}
        </Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
      >
        {/* Reference */}
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
          <View style={styles.row}>
            <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
              ID
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
              {id}
            </Text>
          </View>
          <Divider style={{ marginVertical: spacing.sm }} />
          <View style={styles.row}>
            <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
              {t('requests.status.submitted')}
            </Text>
            <Chip
              mode="flat"
              compact
              style={{ backgroundColor: colors.primaryContainer }}
              textStyle={{ color: colors.onPrimaryContainer, fontSize: 12 }}
            >
              {t('requests.status.processing')}
            </Chip>
          </View>
        </Surface>

        {/* Progress placeholder */}
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
            {t('requests.wizard.selection')}
          </Text>
          <View style={[styles.progressRow, { gap: spacing.xs }]}>
            {[
              t('requests.wizard.documents'),
              t('requests.wizard.form'),
              t('requests.wizard.payment'),
              t('requests.wizard.confirmation'),
            ].map((label, index) => (
              <View key={label} style={styles.progressStep}>
                <View
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor:
                        index < 2 ? colors.primary : colors.outlineVariant,
                      borderRadius: borderRadius.full,
                    },
                  ]}
                >
                  {index < 2 && (
                    <MaterialCommunityIcons
                      name="check"
                      size={12}
                      color={colors.onPrimary}
                    />
                  )}
                </View>
                <Text
                  variant="labelSmall"
                  style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </Surface>

        {/* Data placeholder */}
        <Surface
          style={[
            styles.section,
            {
              padding: spacing.lg,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              alignItems: 'center',
            },
          ]}
          elevation={0}
        >
          <MaterialCommunityIcons
            name="file-document-check-outline"
            size={48}
            color={colors.outlineVariant}
          />
          <Text
            variant="bodyMedium"
            style={{ color: colors.onSurfaceVariant, marginTop: spacing.sm, textAlign: 'center' }}
          >
            {t('common.loading')}
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
});
