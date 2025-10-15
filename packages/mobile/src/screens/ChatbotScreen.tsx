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

import { chatbotService } from '../services/ChatbotService';
import {
  ChatMessage,
  ChatbotLanguage,
  ChatbotAction,
  DEFAULT_CHATBOT_CONFIG,
} from '../types/chatbot.types';
import {
  MessageBubble,
  ChatInput,
  SuggestionChips,
  TypingIndicator,
} from '../components/chat';

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
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
}

export const ChatbotScreen: React.FC<ChatbotScreenProps> = ({ onBack, onNavigate }) => {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<ChatbotLanguage>('es');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refs
  const flatListRef = useRef<FlatList>(null);

  // ============================================
  // LIFECYCLE - Load saved session
  // ============================================

  useEffect(() => {
    loadSavedSession();
  }, []);

  useEffect(() => {
    // Set language in service
    chatbotService.setLanguage(currentLanguage);
  }, [currentLanguage]);

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
          // Convert timestamp strings back to Date objects
          const restoredMessages = saved.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));

          setMessages(restoredMessages);
          setCurrentLanguage(saved.language);
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
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // 3. Show typing indicator
    setIsTyping(true);

    // 4. Simulate typing delay (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));

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
      setTimeout(() => {
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
    <MessageBubble message={item} onActionPress={handleActionPress} />
  );

  const renderFooter = () => {
    if (!isTyping) return null;
    return <TypingIndicator />;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando chatbot...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}

        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🤖 TaxasBot</Text>
          <Text style={styles.headerSubtitle}>
            {currentLanguage === 'es' ? 'Asistente Fiscal' : currentLanguage === 'fr' ? 'Assistant Fiscal' : 'Tax Assistant'}
          </Text>
        </View>

        {/* Language Selector */}
        <View style={styles.languageSelector}>
          <TouchableOpacity
            style={[styles.langButton, currentLanguage === 'es' && styles.langButtonActive]}
            onPress={() => setCurrentLanguage('es')}>
            <Text style={[styles.langText, currentLanguage === 'es' && styles.langTextActive]}>ES</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langButton, currentLanguage === 'fr' && styles.langButtonActive]}
            onPress={() => setCurrentLanguage('fr')}>
            <Text style={[styles.langText, currentLanguage === 'fr' && styles.langTextActive]}>FR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langButton, currentLanguage === 'en' && styles.langButtonActive]}
            onPress={() => setCurrentLanguage('en')}>
            <Text style={[styles.langText, currentLanguage === 'en' && styles.langTextActive]}>EN</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={handleClearChat}>
          <Text style={styles.clearButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        ListFooterComponent={renderFooter}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <SuggestionChips suggestions={suggestions} onSuggestionPress={handleSuggestionPress} />
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 20,
  },

  // Language Selector
  languageSelector: {
    flexDirection: 'row',
    marginHorizontal: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 2,
  },
  langButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langButtonActive: {
    backgroundColor: '#007AFF',
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  langTextActive: {
    color: '#FFFFFF',
  },

  // Messages list
  messagesList: {
    paddingVertical: 12,
    flexGrow: 1,
  },
});

export default ChatbotScreen;
