/**
 * TaxasGE Mobile - Chat Input Component
 * Input pour envoyer des messages dans le chatbot
 * Date: 2025-10-13
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export interface ChatInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  placeholder = 'Escribe tu pregunta...',
  disabled = false,
}) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim().length === 0) return;

    onSend(text.trim());
    setText('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!disabled}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit={false}
          />

          <TouchableOpacity
            style={[styles.sendButton, text.trim().length === 0 && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={disabled || text.trim().length === 0}
            activeOpacity={0.7}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
