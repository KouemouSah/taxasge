/**
 * Support Ticket Detail Screen — Placeholder
 *
 * Shows a support ticket conversation with:
 * - Ticket subject and status
 * - Message history
 * - Input to send new messages
 *
 * TODO: Wire up to GET /support/tickets/{id} and POST /support/tickets/{id}/messages
 */

import { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Button, TextInput, Surface, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';

export default function SupportTicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messageText, setMessageText] = useState('');

  const handleSend = () => {
    if (!messageText.trim()) return;
    // TODO: POST /support/tickets/{id}/messages
    setMessageText('');
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
        <View style={styles.headerCenter}>
          <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '600' }}>
            Ticket #{id}
          </Text>
          <Chip
            mode="flat"
            compact
            style={{ backgroundColor: colors.primaryContainer }}
            textStyle={{ color: colors.onPrimaryContainer, fontSize: 10 }}
          >
            {t('support.status.open')}
          </Chip>
        </View>
        <View style={{ width: 80 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Messages placeholder */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.messagesContent, { padding: spacing.md }]}
        >
          <Surface
            style={[
              styles.emptyState,
              {
                padding: spacing.xl,
                borderRadius: borderRadius.md,
                backgroundColor: colors.surface,
              },
            ]}
            elevation={0}
          >
            <MaterialCommunityIcons
              name="message-text-outline"
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

        {/* Input bar */}
        <Surface
          style={[
            styles.inputBar,
            {
              padding: spacing.sm,
              backgroundColor: colors.surface,
              borderTopColor: colors.outlineVariant,
            },
          ]}
          elevation={2}
        >
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder={t('support.sendMessage')}
            mode="outlined"
            style={[styles.input, { backgroundColor: colors.surface }]}
            outlineStyle={{ borderRadius: borderRadius.xl }}
            dense
            right={
              <TextInput.Icon
                icon="send"
                onPress={handleSend}
                disabled={!messageText.trim()}
                color={messageText.trim() ? colors.primary : colors.outline}
              />
            }
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
        </Surface>
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
  headerCenter: {
    alignItems: 'center',
    gap: 4,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
  },
  inputBar: {
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
  },
});
