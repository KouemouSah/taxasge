/**
 * TaxasGE Mobile - Message Bubble Component
 * Affiche un message dans le style chat (user ou bot)
 * Date: 2025-10-13
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChatMessage } from '../../types/chatbot.types';

export interface MessageBubbleProps {
  message: ChatMessage;
  onActionPress?: (action: any) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onActionPress }) => {
  const isBot = message.role === 'bot';
  const isSystem = message.role === 'system';

  // Format timestamp
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Si message système (info, warnings)
  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isBot ? styles.botContainer : styles.userContainer]}>
      {/* Avatar Bot */}
      {isBot && (
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>🤖</Text>
        </View>
      )}

      {/* Message Bubble */}
      <View style={styles.bubbleWrapper}>
        <View style={[styles.bubble, isBot ? styles.botBubble : styles.userBubble]}>
          {/* Nom (seulement bot) */}
          {isBot && <Text style={styles.botName}>TaxasBot</Text>}

          {/* Contenu message */}
          <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
            {message.content}
          </Text>

          {/* Timestamp */}
          <Text style={[styles.timestamp, isBot ? styles.botTimestamp : styles.userTimestamp]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>

        {/* Action buttons (si présents) */}
        {isBot && message.actions && message.actions.type === 'navigate' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onActionPress?.(message.actions)}
          >
            <Text style={styles.actionButtonText}>
              {message.actions.screen === 'Search' ? '🔍 Buscar servicios' : '➡️ Ver más'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Avatar User */}
      {!isBot && (
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Container principal
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  botContainer: {
    justifyContent: 'flex-start',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },

  // Avatar
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  avatarEmoji: {
    fontSize: 18,
  },

  // Bubble wrapper
  bubbleWrapper: {
    maxWidth: '75%',
  },

  // Bubble
  bubble: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderTopRightRadius: 4,
  },

  // Bot name
  botName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },

  // Message text
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  botText: {
    color: '#000000',
  },
  userText: {
    color: '#FFFFFF',
  },

  // Timestamp
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  botTimestamp: {
    color: '#999',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Action button
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // System message
  systemContainer: {
    alignSelf: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  systemText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
