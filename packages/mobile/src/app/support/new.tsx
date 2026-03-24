/**
 * New Support Ticket Screen — Placeholder
 *
 * Form to create a support ticket with:
 * - Category selector
 * - Subject input
 * - Description input
 * - Submit button
 *
 * TODO: Wire up to POST /support/tickets
 */

import { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@core/theme';

export default function NewSupportTicketScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    // TODO: POST /support/tickets
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      router.back();
    }, 1500);
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
          {t('support.newTicket')}
        </Text>
        <View style={{ width: 80 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
          keyboardShouldPersistTaps="handled"
        >
          <Surface
            style={[
              styles.formCard,
              {
                padding: spacing.lg,
                borderRadius: borderRadius.lg,
                backgroundColor: colors.surface,
              },
            ]}
            elevation={1}
          >
            <TextInput
              label={t('support.subject')}
              value={subject}
              onChangeText={setSubject}
              mode="outlined"
              left={<TextInput.Icon icon="text-short" />}
              style={{ marginBottom: spacing.md }}
            />

            <TextInput
              label={t('support.description')}
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={6}
              left={<TextInput.Icon icon="text-long" />}
              style={[styles.descriptionInput, { marginBottom: spacing.lg }]}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || !subject || !description}
              contentStyle={styles.buttonContent}
              style={{ borderRadius: borderRadius.sm }}
              icon="send"
            >
              {t('common.submit')}
            </Button>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formCard: {
    width: '100%',
  },
  descriptionInput: {
    minHeight: 120,
  },
  buttonContent: {
    paddingVertical: 6,
  },
});
