/**
 * TaxasGE Mobile - Composant Principal Application
 * Application de Gestion Fiscale pour la Guinée Équatoriale
 *
 * @author KOUEMOU SAH Jean Emac
 * @version 1.0.0 (RN 0.80.0)
 * @format
 *
 * DUAL-VERSION ARCHITECTURE:
 * - Offline: No auth, monthly sync, 4 tables
 * - Pro: Auth required, instant sync, 8+ tables
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseProvider } from './providers/DatabaseProvider';
import { ChatbotScreen } from './screens/ChatbotScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { APP_CONFIG, logConfiguration } from './config/AppConfig';

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
 * Storage keys for app state
 */
const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: '@taxasge_onboarding_completed',
};

/**
 * Composant racine de l'application TaxasGE
 *
 * Phase actuelle: Intégration Chatbot FAQ (MVP1)
 * NEW: Progressive sync during onboarding (Phase 1-3)
 */
const App = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentLanguage, setCurrentLanguage] = useState('es');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [syncPhase, setSyncPhase] = useState(0);

  // Détecter la langue système et vérifier si onboarding déjà complété
  useEffect(() => {
    // Log app configuration (version, features, sync strategy)
    logConfiguration();

    // Detect system language
    const systemLang = getSystemLanguage();
    console.log('[App] Setting initial language to:', systemLang);
    setCurrentLanguage(systemLang);

    // Log active version info
    console.log('[App] ========================================');
    console.log('[App] Active Version:', APP_CONFIG.version.toUpperCase());
    console.log('[App] App Name:', APP_CONFIG.appName);
    console.log('[App] Require Auth:', APP_CONFIG.requireAuth);
    console.log('[App] Enable Declarations:', APP_CONFIG.enableDeclarations);
    console.log('[App] ========================================');

    // Check if onboarding already completed
    checkOnboardingStatus();
  }, []);

  /**
   * Check if user has already completed onboarding
   */
  const checkOnboardingStatus = async () => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      console.log('[App] Onboarding completed:', onboardingCompleted);

      if (onboardingCompleted === 'true') {
        setShowOnboarding(false);
      }
    } catch (error) {
      console.error('[App] Error checking onboarding status:', error);
      // On error, show onboarding to be safe
      setShowOnboarding(true);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  /**
   * Handle onboarding completion
   */
  const handleOnboardingComplete = async () => {
    try {
      console.log('[App] Onboarding completed by user');
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('[App] Error saving onboarding status:', error);
      // Still proceed even if save fails
      setShowOnboarding(false);
    }
  };

  /**
   * DatabaseProvider callbacks
   */
  const handleDatabaseInitialized = () => {
    console.log('[App] Database initialized successfully');
  };

  const handleSyncPhaseComplete = (phase) => {
    console.log(`[App] ✅ Sync Phase ${phase} completed`);
    setSyncPhase(phase);
  };

  const handleSyncComplete = () => {
    console.log('[App] 🎉 All sync phases complete!');
    setSyncPhase(3);
  };

  const handleSyncError = (error) => {
    console.error('[App] ❌ Sync error:', error);
  };

  const renderHomeScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{APP_CONFIG.appName}</Text>
          <Text style={styles.subtitle}>{TEXTS[currentLanguage].subtitle}</Text>
          <Text style={styles.version}>React Native 0.80.0</Text>
          <Text style={styles.status}>
            {APP_CONFIG.version === 'offline' ? '📱 Offline Version' : '🌐 Pro Version'}
            {' | '}
            {APP_CONFIG.requireAuth ? '🔒 Auth Required' : '🔓 No Auth'}
          </Text>

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
            style={styles.menuButton}
            onPress={() => setCurrentScreen('search')}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>🔍</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>
                  {TEXTS[currentLanguage].searchButton}
                </Text>
                <Text style={styles.buttonSubtitle}>
                  {TEXTS[currentLanguage].comingSoon}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setCurrentScreen('calculator')}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>🧮</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>
                  {TEXTS[currentLanguage].calculatorButton}
                </Text>
                <Text style={styles.buttonSubtitle}>
                  {TEXTS[currentLanguage].comingSoon}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setCurrentScreen('favorites')}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonIcon}>⭐</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>
                  {TEXTS[currentLanguage].favoritesButton}
                </Text>
                <Text style={styles.buttonSubtitle}>
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
        // Navigation vers les écrans disponibles
        console.log(`[App] Navigation requested to: ${screen}`);
        if (['search', 'calculator', 'favorites'].includes(screen)) {
          setCurrentScreen(screen);
        } else {
          setCurrentScreen('home');
        }
      }}
    />
  );

  const renderSearchScreen = () => {
    const translations = {
      es: {
        title: 'Buscar Servicios',
        subtitle: 'Encuentra servicios fiscales rápidamente',
        back: 'Volver',
        comingSoon: 'Próximamente',
        features: [
          'Búsqueda por nombre de servicio',
          'Filtros por categoría y ministerio',
          'Ver detalles completos del servicio',
          'Guardar servicios en favoritos',
        ],
      },
      fr: {
        title: 'Rechercher Services',
        subtitle: 'Trouvez des services fiscaux rapidement',
        back: 'Retour',
        comingSoon: 'Bientôt disponible',
        features: [
          'Recherche par nom de service',
          'Filtres par catégorie et ministère',
          'Voir les détails complets du service',
          'Enregistrer les services en favoris',
        ],
      },
      en: {
        title: 'Search Services',
        subtitle: 'Find tax services quickly',
        back: 'Back',
        comingSoon: 'Coming soon',
        features: [
          'Search by service name',
          'Filter by category and ministry',
          'View complete service details',
          'Save services to favorites',
        ],
      },
    };

    const t = translations[currentLanguage];

    return (
      <PlaceholderScreen
        title={t.title}
        subtitle={t.subtitle}
        icon="🔍"
        comingSoonText={t.comingSoon}
        backButtonText={t.back}
        onBack={() => setCurrentScreen('home')}
        features={t.features}
      />
    );
  };

  const renderCalculatorScreen = () => {
    const translations = {
      es: {
        title: 'Calculadora Fiscal',
        subtitle: 'Calcula el costo exacto de tus trámites',
        back: 'Volver',
        comingSoon: 'Próximamente',
        features: [
          'Calcular tasas de expedición y renovación',
          'Aplicar urgencias automáticamente',
          'Guardar cálculos en historial',
          'Exportar resultados',
        ],
      },
      fr: {
        title: 'Calculatrice Fiscale',
        subtitle: 'Calculez le coût exact de vos démarches',
        back: 'Retour',
        comingSoon: 'Bientôt disponible',
        features: [
          'Calculer les frais d\'expédition et de renouvellement',
          'Appliquer les urgences automatiquement',
          'Enregistrer les calculs dans l\'historique',
          'Exporter les résultats',
        ],
      },
      en: {
        title: 'Tax Calculator',
        subtitle: 'Calculate the exact cost of your procedures',
        back: 'Back',
        comingSoon: 'Coming soon',
        features: [
          'Calculate expedition and renewal fees',
          'Apply urgencies automatically',
          'Save calculations to history',
          'Export results',
        ],
      },
    };

    const t = translations[currentLanguage];

    return (
      <PlaceholderScreen
        title={t.title}
        subtitle={t.subtitle}
        icon="🧮"
        comingSoonText={t.comingSoon}
        backButtonText={t.back}
        onBack={() => setCurrentScreen('home')}
        features={t.features}
      />
    );
  };

  const renderFavoritesScreen = () => {
    const translations = {
      es: {
        title: 'Favoritos',
        subtitle: 'Tus servicios guardados',
        back: 'Volver',
        comingSoon: 'Próximamente',
        features: [
          'Guardar servicios frecuentes',
          'Acceso rápido a tus servicios',
          'Organizar por carpetas',
          'Sincronización en la nube (versión Pro)',
        ],
      },
      fr: {
        title: 'Favoris',
        subtitle: 'Vos services enregistrés',
        back: 'Retour',
        comingSoon: 'Bientôt disponible',
        features: [
          'Enregistrer les services fréquents',
          'Accès rapide à vos services',
          'Organiser par dossiers',
          'Synchronisation cloud (version Pro)',
        ],
      },
      en: {
        title: 'Favorites',
        subtitle: 'Your saved services',
        back: 'Back',
        comingSoon: 'Coming soon',
        features: [
          'Save frequent services',
          'Quick access to your services',
          'Organize by folders',
          'Cloud sync (Pro version)',
        ],
      },
    };

    const t = translations[currentLanguage];

    return (
      <PlaceholderScreen
        title={t.title}
        subtitle={t.subtitle}
        icon="⭐"
        comingSoonText={t.comingSoon}
        backButtonText={t.back}
        onBack={() => setCurrentScreen('home')}
        features={t.features}
      />
    );
  };

  // Show loading while checking onboarding status
  if (checkingOnboarding) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004aad" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Show onboarding on first launch
  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <DatabaseProvider
          autoSync={true}
          progressive={true}
          userId={APP_CONFIG.defaultUserId}
          onInitialized={handleDatabaseInitialized}
          onSyncPhaseComplete={handleSyncPhaseComplete}
          onSyncComplete={handleSyncComplete}
          onError={handleSyncError}
        >
          <OnboardingScreen
            language={currentLanguage}
            onComplete={handleOnboardingComplete}
          />
        </DatabaseProvider>
      </SafeAreaProvider>
    );
  }

  // Render current screen based on state
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return renderHomeScreen();
      case 'chatbot':
        return renderChatbotScreen();
      case 'search':
        return renderSearchScreen();
      case 'calculator':
        return renderCalculatorScreen();
      case 'favorites':
        return renderFavoritesScreen();
      default:
        return renderHomeScreen();
    }
  };

  // Show main app screens
  return (
    <SafeAreaProvider>
      <DatabaseProvider
        autoSync={true}
        progressive={true}
        userId={APP_CONFIG.defaultUserId}
        onInitialized={handleDatabaseInitialized}
        onSyncPhaseComplete={handleSyncPhaseComplete}
        onSyncComplete={handleSyncComplete}
        onError={handleSyncError}
      >
        {renderCurrentScreen()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
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
