/**
 * Wizard Session Screen — Placeholder
 *
 * Displays the multi-step wizard for a service request session.
 * The session ID is used to resume cache-first wizard sessions.
 *
 * TODO: Wire up to GET /wizard-sessions/{sessionId}
 */

import { StyleSheet, View, Platform } from 'react-native';
import { Text, Button, ProgressBar, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';

export default function WizardSessionScreen() {
  const { 'session-id': sessionId } = useLocalSearchParams<{ 'session-id': string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Wizard header */}
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
          icon="close"
          onPress={() => router.back()}
          compact
        >
          {t('common.close')}
        </Button>
        <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
          {t('requests.wizard.selection')}
        </Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Progress */}
      <ProgressBar
        progress={0.2}
        color={colors.primary}
        style={{ height: 3 }}
      />

      {/* Content placeholder */}
      <View style={[styles.content, { padding: spacing.lg }]}>
        <Surface
          style={[
            styles.placeholder,
            {
              padding: spacing.xl,
              borderRadius: borderRadius.lg,
              backgroundColor: colors.surface,
            },
          ]}
          elevation={0}
        >
          <MaterialCommunityIcons
            name="file-document-edit-outline"
            size={64}
            color={colors.primary}
          />
          <Text
            variant="titleMedium"
            style={[
              styles.placeholderTitle,
              { color: colors.onSurface, marginTop: spacing.md },
            ]}
          >
            {t('requests.wizard.selection')}
          </Text>
          <Text
            variant="bodySmall"
            style={[
              styles.sessionLabel,
              { color: colors.outline, marginTop: spacing.sm },
            ]}
          >
            Session: {sessionId}
          </Text>
        </Surface>
      </View>

      {/* Bottom actions */}
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
          mode="outlined"
          onPress={() => router.back()}
          style={{ flex: 1, marginRight: spacing.sm }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          mode="contained"
          onPress={() => {
            // TODO: Advance to next step
          }}
          style={{ flex: 1 }}
        >
          {t('common.next')}
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    alignItems: 'center',
    width: '100%',
  },
  placeholderTitle: {
    fontWeight: '600',
  },
  sessionLabel: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
});
