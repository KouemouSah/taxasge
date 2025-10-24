/**
 * TaxasGE Mobile - Composant Principal Application
 * Application de Gestion Fiscale pour la Guinée Équatoriale
 *
 * @author KOUEMOU SAH Jean Emac
 * @version 1.0.0 (RN 0.80.0)
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  NativeModules,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from './providers/DatabaseProvider';
import { ChatbotScreen } from './screens/ChatbotScreen';

/**
 * Détecte la langue du système Android/iOS
 * Retourne 'es', 'fr', ou 'en'
 */
const getSystemLanguage = () => {
  let locale;

  try {
    if (Platform.OS === 'ios') {
      locale = NativeModules.SettingsManager?.settings?.AppleLocale ||
               NativeModules.SettingsManager?.settings?.AppleLanguages?.[0];
    } else {
      // Android: Try I18nManager first
      locale = NativeModules.I18nManager?.localeIdentifier;

      // If undefined, try using Intl API (available in modern RN)
      if (!locale && typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        const dtf = new Intl.DateTimeFormat();
        locale = dtf.resolvedOptions().locale;
      }
    }
  } catch (error) {
    console.warn('[App] Error detecting system language:', error);
  }

  console.log('[App] System locale detected:', locale);

  if (!locale) return 'es'; // Fallback

  const lang = locale.toLowerCase();
  if (lang.startsWith('fr')) return 'fr';
  if (lang.startsWith('en')) return 'en';
  return 'es'; // Default pour tout le reste (dont 'es')
};

/**
 * Textes multilingues pour toute l'application
 */
const TEXTS = {
  es: {
    title: 'TaxasGE Mobile',
    subtitle: 'Gestión Fiscal - Guinea Ecuatorial',
    menuTitle: 'Menú Principal',
    chatbotButton: 'Asistente Chatbot',
    chatbotSubtitle: 'Haz tus preguntas sobre servicios fiscales',
    searchButton: 'Buscar Servicios',
    calculatorButton: 'Calculadora',
    favoritesButton: 'Favoritos',
    comingSoon: 'Próximamente',
    footer1: 'Versión MVP1 - Chatbot FAQ',
    footer2: 'Base de datos: SQLite v3',
  },
  fr: {
    title: 'TaxasGE Mobile',
    subtitle: 'Gestion Fiscale - Guinée Équatoriale',
    menuTitle: 'Menu Principal',
    chatbotButton: 'Assistant Chatbot',
    chatbotSubtitle: 'Posez vos questions sur les services fiscaux',
    searchButton: 'Rechercher Services',
    calculatorButton: 'Calculatrice',
    favoritesButton: 'Favoris',
    comingSoon: 'Bientôt disponible',
    footer1: 'Version MVP1 - Chatbot FAQ',
    footer2: 'Base de données : SQLite v3',
  },
  en: {
    title: 'TaxasGE Mobile',
    subtitle: 'Tax Management - Equatorial Guinea',
    menuTitle: 'Main Menu',
    chatbotButton: 'Chatbot Assistant',
    chatbotSubtitle: 'Ask your questions about tax services',
    searchButton: 'Search Services',
    calculatorButton: 'Calculator',
    favoritesButton: 'Favorites',
    comingSoon: 'Coming soon',
    footer1: 'Version MVP1 - Chatbot FAQ',
    footer2: 'Database: SQLite v3',
  },
};

/**
 * Composant racine de l'application TaxasGE
 *
 * Phase actuelle: Intégration Chatbot FAQ (MVP1)
 */
const App = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentLanguage, setCurrentLanguage] = useState('es');

  // Détecter la langue système au démarrage
  useEffect(() => {
    const systemLang = getSystemLanguage();
    console.log('[App] Setting initial language to:', systemLang);
    setCurrentLanguage(systemLang);
  }, []);

  const renderHomeScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{TEXTS[currentLanguage].title}</Text>
          <Text style={styles.subtitle}>{TEXTS[currentLanguage].subtitle}</Text>
          <Text style={styles.version}>React Native 0.80.0</Text>
          <Text style={styles.status}>✅ Migration Phase 5 - Chatbot FAQ intégré</Text>

          {/* Language Selector */}
          <View style={styles.languageSelector}>
            <TouchableOpacity
              style={[styles.langButton, currentLanguage === 'es' && styles.langButtonActive]}
              onPress={() => setCurrentLanguage('es')}>
              <Text style={[styles.langText, currentLanguage === 'es' && styles.langTextActive]}>
                ES
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langButton, currentLanguage === 'fr' && styles.langButtonActive]}
              onPress={() => setCurrentLanguage('fr')}>
              <Text style={[styles.langText, currentLanguage === 'fr' && styles.langTextActive]}>
                FR
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langButton, currentLanguage === 'en' && styles.langButtonActive]}
              onPress={() => setCurrentLanguage('en')}>
              <Text style={[styles.langText, currentLanguage === 'en' && styles.langTextActive]}>
                EN
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>{TEXTS[currentLanguage].menuTitle}</Text>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setCurrentScreen('chatbot')}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>💬</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>{TEXTS[currentLanguage].chatbotButton}</Text>
                <Text style={styles.buttonSubtitle}>
                  {TEXTS[currentLanguage].chatbotSubtitle}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.disabledButton]}
            disabled={true}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>🔍</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.buttonTitle, styles.disabledText]}>
                  {TEXTS[currentLanguage].searchButton}
                </Text>
                <Text style={[styles.buttonSubtitle, styles.disabledText]}>
                  {TEXTS[currentLanguage].comingSoon}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.disabledButton]}
            disabled={true}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>🧮</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.buttonTitle, styles.disabledText]}>
                  {TEXTS[currentLanguage].calculatorButton}
                </Text>
                <Text style={[styles.buttonSubtitle, styles.disabledText]}>
                  {TEXTS[currentLanguage].comingSoon}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.disabledButton]}
            disabled={true}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>⭐</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.buttonTitle, styles.disabledText]}>
                  {TEXTS[currentLanguage].favoritesButton}
                </Text>
                <Text style={[styles.buttonSubtitle, styles.disabledText]}>
                  {TEXTS[currentLanguage].comingSoon}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{TEXTS[currentLanguage].footer1}</Text>
          <Text style={styles.footerText}>{TEXTS[currentLanguage].footer2}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderChatbotScreen = () => (
    <ChatbotScreen
      language={currentLanguage}
      onBack={() => setCurrentScreen('home')}
      onNavigate={(screen) => {
        // Pour l'instant, retourner à l'accueil avec un message
        // TODO: Implémenter les vrais écrans Services, Search, Calculator
        console.log(`[App] Navigation requested to: ${screen}`);
        setCurrentScreen('home');
      }}
    />
  );

  return (
    <SafeAreaProvider>
      <DatabaseProvider autoSync={false}>
        {currentScreen === 'home' ? renderHomeScreen() : renderChatbotScreen()}
      </DatabaseProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
    textAlign: 'center',
  },
  version: {
    fontSize: 14,
    color: '#999999',
    marginTop: 12,
  },
  status: {
    fontSize: 14,
    color: '#00AA00',
    marginTop: 8,
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  menuButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#FAFAFA',
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  disabledText: {
    color: '#999999',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  // Language Selector
  languageSelector: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 2,
    alignSelf: 'center',
  },
  langButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  langButtonActive: {
    backgroundColor: '#007AFF',
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  langTextActive: {
    color: '#FFFFFF',
  },
});

export default App;
