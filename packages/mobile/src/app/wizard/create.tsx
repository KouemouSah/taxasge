/**
 * Wizard Create — Entry point from service detail
 *
 * URL: /wizard/create?workflow_code=PASAPORTE&service_id=123
 * Shows step selection, creates wizard session, redirects to wizard/[session-id]
 */

import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, IconButton, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@core/theme';
import { useWizardSession } from '@modules/wizard';
import { StepSelection } from '@modules/wizard/components/step-selection';

export default function WizardCreateScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { workflow_code } = useLocalSearchParams<{ workflow_code: string; service_id?: string }>();

  const { createSession, isLoading, error } = useWizardSession();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(async (
    solicitudType: string,
    motivo?: string,
    isMinor?: boolean,
  ) => {
    if (!workflow_code) return;
    setIsCreating(true);
    try {
      const session = await createSession({
        workflow_code,
        solicitud_type: solicitudType,
        motivo,
        is_minor: isMinor,
      });
      router.replace(`/wizard/${session.session_id}` as never);
    } catch {
      // Error shown via useWizardSession error state
    } finally {
      setIsCreating(false);
    }
  }, [workflow_code, createSession, router]);

  if (!workflow_code) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text variant="bodyMedium" style={{ color: colors.error }}>{t('common.error')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600', flex: 1 }} numberOfLines={1}>
          {t('wizard.title')}
        </Text>
      </View>

      {/* Workflow info */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <Text variant="labelMedium" style={{ color: colors.outline }}>
          {workflow_code.replace(/_/g, ' ')}
        </Text>
      </View>

      {error && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text variant="bodySmall" style={{ color: colors.error }}>{error}</Text>
        </View>
      )}

      <StepSelection
        workflowCode={workflow_code}
        onCreateSession={handleCreate}
        isCreating={isCreating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
});
