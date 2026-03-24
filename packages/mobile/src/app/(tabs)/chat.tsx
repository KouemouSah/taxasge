/**
 * Chat Tab — Placeholder
 *
 * AI assistant (chatbot) screen with:
 * - Message list with welcome message
 * - Suggestion chips for common questions
 * - Text input bar with send button
 *
 * TODO: Wire up to POST /chatbot/message
 */

import { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, IconButton, Surface, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const [inputText, setInputText] = useState('');
  const [messages] = useState<Message[]>([
    {
      id: '1',
      text: t('chat.welcome'),
      isBot: true,
      timestamp: new Date(),
    },
  ]);

  const suggestions = [
    t('chat.suggestions.services'),
    t('chat.suggestions.documents'),
    t('chat.suggestions.payment'),
    t('chat.suggestions.status'),
  ];

  const handleSend = () => {
    if (!inputText.trim()) return;
    // TODO: Send message to chatbot API
    setInputText('');
  };

  const handleSuggestion = (suggestion: string) => {
    setInputText(suggestion);
    // TODO: Auto-send suggestion
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
        <MaterialCommunityIcons
          name="robot-outline"
          size={28}
          color={colors.primary}
        />
        <Text
          variant="titleMedium"
          style={[styles.headerTitle, { color: colors.onSurface, marginLeft: spacing.sm }]}
        >
          {t('chat.title')}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.messagesContent, { padding: spacing.md }]}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.isBot
                  ? {
                      alignSelf: 'flex-start',
                      backgroundColor: colors.surfaceVariant,
                      borderRadius: borderRadius.md,
                      borderTopLeftRadius: borderRadius.sm / 2,
                    }
                  : {
                      alignSelf: 'flex-end',
                      backgroundColor: colors.primaryContainer,
                      borderRadius: borderRadius.md,
                      borderTopRightRadius: borderRadius.sm / 2,
                    },
                { padding: spacing.md, marginBottom: spacing.sm, maxWidth: '80%' },
              ]}
            >
              <Text
                variant="bodyMedium"
                style={{
                  color: msg.isBot
                    ? colors.onSurfaceVariant
                    : colors.onPrimaryContainer,
                }}
              >
                {msg.text}
              </Text>
            </View>
          ))}

          {/* Suggestions */}
          {messages.length === 1 && (
            <View style={[styles.suggestionsContainer, { gap: spacing.xs, marginTop: spacing.md }]}>
              {suggestions.map((suggestion) => (
                <Chip
                  key={suggestion}
                  onPress={() => handleSuggestion(suggestion)}
                  mode="outlined"
                  style={styles.suggestionChip}
                  textStyle={{ color: colors.primary, fontSize: 13 }}
                  icon="chevron-right"
                >
                  {suggestion}
                </Chip>
              ))}
            </View>
          )}
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
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('chat.placeholder')}
            mode="outlined"
            style={[styles.input, { backgroundColor: colors.surface }]}
            outlineStyle={{ borderRadius: borderRadius.xl }}
            dense
            right={
              <TextInput.Icon
                icon="send"
                onPress={handleSend}
                disabled={!inputText.trim()}
                color={inputText.trim() ? colors.primary : colors.outline}
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
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
  },
  messageBubble: {},
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionChip: {
    marginBottom: 4,
  },
  inputBar: {
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
  },
});
