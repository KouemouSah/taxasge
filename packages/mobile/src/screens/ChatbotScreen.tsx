/**
 * TaxasGE Mobile - Chatbot Screen
 * Interface conversationnelle pour le chatbot FAQ (MVP1)
 * Date: 2025-10-13
 *
 * Features:
 * - UI conversationnelle (bulles user/bot)
 * - AsyncStorage temporaire (30 min) pour protéger contre fermeture accidentelle
 * - Suggestions de réponses rapides
 * - Typing indicator
 * - Support multilingue (ES/FR/EN)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

import { chatbotService } from '../services/ChatbotService';
import {
  ChatMessage,
  ChatbotLanguage,
  ChatbotAction,
} from '../types/chatbot.types';
import {
  MessageBubble,
  ChatInput,
  SuggestionChips,
  TypingIndicator,
} from '../components/chat';
import { GradientHeader } from '../components/GradientHeader';
import { Spacing } from '../theme';

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY = 'taxasge_last_chat_session';
const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface SavedSession {
  messages: ChatMessage[];
  timestamp: number;
  language: ChatbotLanguage;
}

// ============================================
// CHATBOT SCREEN COMPONENT
// ============================================

export interface ChatbotScreenProps {
  language: ChatbotLanguage;
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
}

export const ChatbotScreen: React.FC<ChatbotScreenProps> = ({ language, onBack, onNavigate }) => {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<ChatbotLanguage>(language);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // LIFECYCLE - Load saved session
  // ============================================

  useEffect(() => {
    loadSavedSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Update language when prop changes
    if (language !== currentLanguage) {
      setCurrentLanguage(language);
      // Regenerate welcome message and suggestions in new language
      showWelcomeMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    // Set language in service
    chatbotService.setLanguage(currentLanguage);
  }, [currentLanguage]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // ============================================
  // SAVE/LOAD SESSION (AsyncStorage)
  // ============================================

  const loadSavedSession = async () => {
    try {
      const savedJson = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedJson) {
        const saved: SavedSession = JSON.parse(savedJson);
        const now = Date.now();

        // Si session < 30 min, recharger
        if (now - saved.timestamp < SESSION_EXPIRY_MS) {
          // IMPORTANT: Check if language changed
          // If user changed language on home screen, start fresh
          if (saved.language !== language) {
            console.log(
              `[ChatbotScreen] Language changed from ${saved.language} to ${language}, starting fresh session`
            );
            await AsyncStorage.removeItem(STORAGE_KEY);
            showWelcomeMessage();
            return;
          }

          // Convert timestamp strings back to Date objects
          const restoredMessages = saved.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));

          setMessages(restoredMessages);
          setCurrentLanguage(language);
          setIsLoading(false);
          return;
        } else {
          // Session expirée, supprimer
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }

      // Pas de session ou expirée: afficher message bienvenue
      showWelcomeMessage();
    } catch (error) {
      console.error('[ChatbotScreen] Error loading saved session:', error);
      showWelcomeMessage();
    }
  };

  const saveSession = useCallback(
    async (messagesToSave: ChatMessage[]) => {
      try {
        // Sauvegarder les 10 derniers messages
        const recentMessages = messagesToSave.slice(-10);

        const session: SavedSession = {
          messages: recentMessages,
          timestamp: Date.now(),
          language: currentLanguage,
        };

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch (error) {
        console.error('[ChatbotScreen] Error saving session:', error);
      }
    },
    [currentLanguage]
  );

  // Sauvegarder à chaque changement de messages
  useEffect(() => {
    if (messages.length > 0) {
      saveSession(messages);
    }
  }, [messages, saveSession]);

  // ============================================
  // WELCOME MESSAGE
  // ============================================

  const showWelcomeMessage = () => {
    const welcomeMessages: Record<ChatbotLanguage, string> = {
      es: '¡Hola! Soy TaxasBot, tu asistente fiscal para Guinea Ecuatorial. 👋\n\nPuedo ayudarte con:\n• Consultar precios de servicios fiscales\n• Ver procedimientos paso a paso\n• Conocer documentos requeridos\n• Calcular montos exactos\n\n¿En qué puedo ayudarte hoy?',
      fr: "Bonjour ! Je suis TaxasBot, votre assistant fiscal pour la Guinée équatoriale. 👋\n\nJe peux vous aider avec :\n• Consulter les prix des services fiscaux\n• Voir les procédures étape par étape\n• Connaître les documents requis\n• Calculer les montants exacts\n\nComment puis-je vous aider aujourd'hui ?",
      en: "Hello! I'm TaxasBot, your tax assistant for Equatorial Guinea. 👋\n\nI can help you with:\n• Check fiscal service prices\n• View step-by-step procedures\n• Know required documents\n• Calculate exact amounts\n\nHow can I help you today?",
    };

    const welcomeMessage: ChatMessage = {
      id: 'welcome-msg',
      role: 'bot',
      content: welcomeMessages[currentLanguage],
      timestamp: new Date(),
      intent: 'greeting',
    };

    const initialSuggestions: Record<ChatbotLanguage, string[]> = {
      es: ['¿Cuánto cuesta un servicio?', '¿Qué documentos necesito?', 'Ver servicios populares'],
      fr: [
        'Combien coûte un service ?',
        'Quels documents ai-je besoin ?',
        'Voir services populaires',
      ],
      en: ['How much does a service cost?', 'What documents do I need?', 'View popular services'],
    };

    setMessages([welcomeMessage]);
    setSuggestions(initialSuggestions[currentLanguage]);
    setIsLoading(false);
  };

  // ============================================
  // MESSAGE HANDLING
  // ============================================

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // 1. Créer message user
    const userMessage = chatbotService.createUserMessage(text);
    setMessages((prev) => [...prev, userMessage]);
    setSuggestions([]);

    // 2. Scroll to bottom
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // 3. Show typing indicator
    setIsTyping(true);

    // 4. Simulate typing delay (500ms)
    await new Promise((resolve) => {
      typingTimeoutRef.current = setTimeout(resolve, 500);
    });

    try {
      // 5. Get bot response
      const response = await chatbotService.processMessage(text, currentLanguage);

      // 6. Add bot message
      setMessages((prev) => [...prev, response.message]);

      // 7. Update suggestions
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }

      // 8. Scroll to bottom
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('[ChatbotScreen] Error processing message:', error);

      // Error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'bot',
        content:
          currentLanguage === 'es'
            ? 'Disculpa, ocurrió un error. Por favor, intenta de nuevo.'
            : currentLanguage === 'fr'
            ? "Désolé, une erreur s'est produite. Veuillez réessayer."
            : 'Sorry, an error occurred. Please try again.',
        timestamp: new Date(),
        intent: 'unknown',
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleActionPress = (action: ChatbotAction) => {
    if (action.type === 'navigate' && action.screen) {
      if (onNavigate) {
        // Vraie navigation
        onNavigate(action.screen);
      } else {
        // Fallback: Alert pour debug
        Alert.alert(
          'Navegación',
          `Esta función abrirá la pantalla: ${action.screen}`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  // ============================================
  // CLEAR CHAT
  // ============================================

  const handleClearChat = () => {
    Alert.alert(
      currentLanguage === 'es'
        ? 'Limpiar conversación'
        : currentLanguage === 'fr'
        ? 'Effacer la conversation'
        : 'Clear conversation',
      currentLanguage === 'es'
        ? '¿Estás seguro de que quieres borrar todos los mensajes?'
        : currentLanguage === 'fr'
        ? 'Êtes-vous sûr de vouloir effacer tous les messages ?'
        : 'Are you sure you want to clear all messages?',
      [
        { text: currentLanguage === 'es' ? 'Cancelar' : 'Annuler', style: 'cancel' },
        {
          text: currentLanguage === 'es' ? 'Limpiar' : 'Effacer',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(STORAGE_KEY);
            showWelcomeMessage();
          },
        },
      ]
    );
  };

  // ============================================
  // RENDER
  // ============================================

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <MessageBubble message={item} onActionPress={handleActionPress} language={currentLanguage} />
  );

  const renderFooter = () => {
    if (!isTyping) return null;
    return <TypingIndicator language={currentLanguage} />;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando chatbot...</Text>
      </View>
    );
  }

  const getHeaderTitle = () => {
    switch (currentLanguage) {
      case 'fr':
        return 'Assistant';
      case 'en':
        return 'Assistant';
      default:
        return 'Asistente';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#004aad" />

      {/* Modern Header with Logo */}
      <GradientHeader
        title={getHeaderTitle()}
        onBack={onBack}
        rightComponent={
          <TouchableOpacity style={styles.clearButton} onPress={handleClearChat}>
            <Text style={styles.clearButtonIcon}>🗑️</Text>
          </TouchableOpacity>
        }
        leftComponent={
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>🤖</Text>
            </View>
          </View>
        }
      />

      {/* Green Background with Pattern Overlay */}
      <LinearGradient
        colors={['#40E0D0', '#20CED8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}>
        {/* Pattern Overlay (90% opacity gray) */}
        <View style={styles.patternOverlay}>
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            ListFooterComponent={renderFooter}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <SuggestionChips suggestions={suggestions} onSuggestionPress={handleSuggestionPress} />
          )}

          {/* Input */}
          <ChatInput
            onSend={handleSend}
            disabled={isTyping}
            placeholder={
              currentLanguage === 'es'
                ? 'Escribe tu mensaje...'
                : currentLanguage === 'fr'
                ? 'Écrire un message...'
                : 'Type your message...'
            }
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#40E0D0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#40E0D0',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Logo in Header
  logoContainer: {
    marginRight: Spacing.md,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 24,
  },

  // Clear button in header
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonIcon: {
    fontSize: 20,
  },

  // Background
  backgroundGradient: {
    flex: 1,
  },
  patternOverlay: {
    flex: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.05)', // 5% gray overlay for subtle pattern effect
  },

  // Messages list
  messagesList: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
    flexGrow: 1,
  },
});

export default ChatbotScreen;
