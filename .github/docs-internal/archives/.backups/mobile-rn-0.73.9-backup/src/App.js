/**
 * TaxasGE Mobile - Composant Principal Application
 * Application de Gestion Fiscale pour la Guinée Équatoriale
 * 
 * @author KOUEMOU SAH Jean Emac
 * @version 1.0.0
 * @format
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StatusBar,
  Alert,
  Platform,
  AppState,
  Linking,
  BackHandler,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import NetInfo from '@react-native-community/netinfo';
import BootSplash from 'react-native-bootsplash';
import DeviceInfo from 'react-native-device-info';

// ============================================================================
// IMPORTS SERVICES & CONFIGURATION
// ============================================================================

// Configuration Redux Store
import { store, persistor } from './store/store';

// Services Firebase & Supabase  
import FirebaseService from './services/firebase/FirebaseService';
import SupabaseService from './services/supabase/SupabaseService';
import AuthService from './services/auth/AuthService';

// Services IA & Data
import AIService from './services/ai/AIService';
import SyncService from './services/sync/SyncService';
import CacheService from './services/cache/CacheService';

// Navigation & Context
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './contexts/AuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Composants UI
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';
import NetworkStatusBar from './components/common/NetworkStatusBar';
import UpdateModal from './components/common/UpdateModal';

// Configuration & Constants
import { 
  APP_CONFIG, 
  FIREBASE_CONFIG, 
  SUPABASE_CONFIG 
} from './config/constants';
import { Colors, Themes } from './styles/themes';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * États de l'application pendant l'initialisation
 */
const APP_STATES = {
  LOADING: 'loading',
  INITIALIZING: 'initializing',
  READY: 'ready',
  ERROR: 'error',
  MAINTENANCE: 'maintenance'
};

/**
 * Configuration de l'initialisation
 */
const INITIALIZATION_CONFIG = {
  TIMEOUT: 10000, // 10 secondes max pour l'init
  RETRY_ATTEMPTS: 3,
  REQUIRED_SERVICES: [
    'firebase',
    'supabase', 
    'auth',
    'ai',
    'database'
  ]
};

// ============================================================================
// COMPOSANT PRINCIPAL APPLICATION
// ============================================================================

const App = () => {
  // États de l'application
  const [appState, setAppState] = useState(APP_STATES.LOADING);
  const [initProgress, setInitProgress] = useState(0);
  const [isNetworkConnected, setIsNetworkConnected] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [appUpdateAvailable, setAppUpdateAvailable] = useState(false);
  const [initError, setInitError] = useState(null);

  // ============================================================================
  // GESTION CYCLE DE VIE APPLICATION
  // ============================================================================

  /**
   * Gestion des changements d'état de l'application
   */
  const handleAppStateChange = useCallback((nextAppState) => {
    if (__DEV__) {
      console.log('📱 App State Changed:', nextAppState);
    }

    switch (nextAppState) {
      case 'active':
        // App au premier plan - relancer sync si nécessaire
        if (isNetworkConnected && currentUser) {
          SyncService.resumeSync();
        }
        break;
        
      case 'background':
        // App en arrière-plan - sauvegarder état
        SyncService.pauseSync();
        CacheService.persistPendingData();
        break;
        
      case 'inactive':
        // App inactive - pause services non critiques
        break;
    }
  }, [isNetworkConnected, currentUser]);

  /**
   * Gestion du bouton retour Android
   */
  const handleBackPress = useCallback(() => {
    // Gestion personnalisée du bouton retour
    // Sera implémentée avec la navigation
    return false;
  }, []);

  // ============================================================================
  // INITIALISATION SERVICES
  // ============================================================================

  /**
   * Initialisation progressive des services avec gestion d'erreur
   */
  const initializeServices = useCallback(async () => {
    try {
      setAppState(APP_STATES.INITIALIZING);
      setInitProgress(0);

      const initSteps = [
        { name: 'Vérification dispositif', action: initializeDevice },
        { name: 'Configuration Firebase', action: initializeFirebase },
        { name: 'Configuration Supabase', action: initializeSupabase },
        { name: 'Service authentification', action: initializeAuth },
        { name: 'Intelligence artificielle', action: initializeAI },
        { name: 'Base de données locale', action: initializeLocalDB },
        { name: 'Service synchronisation', action: initializeSync },
        { name: 'Finalisation', action: finalizeInitialization }
      ];

      for (let i = 0; i < initSteps.length; i++) {
        const step = initSteps[i];
        
        if (__DEV__) {
          console.log(`🚀 Initialisation: ${step.name}...`);
        }

        await step.action();
        setInitProgress(((i + 1) / initSteps.length) * 100);
        
        // Délai pour permettre l'affichage du progrès
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Initialisation réussie
      setAppState(APP_STATES.READY);
      
      // Masquer le splash screen
      await BootSplash.hide({ fade: true });
      
      // Notifier l'index.js que l'app est prête
      if (global.onAppReady) {
        global.onAppReady();
      }

    } catch (error) {
      console.error('❌ Échec initialisation:', error);
      setInitError(error);
      setAppState(APP_STATES.ERROR);
      
      // Masquer le splash screen même en cas d'erreur
      await BootSplash.hide({ fade: true });
    }
  }, []);

  /**
   * Étapes d'initialisation individuelles
   */
  const initializeDevice = async () => {
    const deviceInfo = {
      uniqueId: await DeviceInfo.getUniqueId(),
      systemName: DeviceInfo.getSystemName(),
      systemVersion: DeviceInfo.getSystemVersion(),
      appVersion: DeviceInfo.getVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      isEmulator: await DeviceInfo.isEmulator(),
    };

    if (__DEV__) {
      console.log('📱 Device Info:', deviceInfo);
    }

    // Vérifier la compatibilité
    if (Platform.OS === 'android' && parseInt(deviceInfo.systemVersion) < 21) {
      throw new Error('Version Android non supportée (minimum: 5.0)');
    }
    
    if (Platform.OS === 'ios' && parseFloat(deviceInfo.systemVersion) < 12.0) {
      throw new Error('Version iOS non supportée (minimum: 12.0)');
    }
  };

  const initializeFirebase = async () => {
    try {
      await FirebaseService.initialize(FIREBASE_CONFIG);
      
      // Initialiser Analytics et Crashlytics
      await FirebaseService.initializeAnalytics();
      await FirebaseService.initializeCrashlytics();
      
      if (__DEV__) {
        console.log('🔥 Firebase initialisé avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur Firebase:', error);
      throw new Error(`Firebase: ${error.message}`);
    }
  };

  const initializeSupabase = async () => {
    try {
      await SupabaseService.initialize(SUPABASE_CONFIG);
      
      if (__DEV__) {
        console.log('🗄️ Supabase initialisé avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur Supabase:', error);
      throw new Error(`Supabase: ${error.message}`);
    }
  };

  const initializeAuth = async () => {
    try {
      await AuthService.initialize();
      
      // Vérifier s'il y a un utilisateur connecté
      const user = await AuthService.getCurrentUser();
      setCurrentUser(user);
      
      if (__DEV__) {
        console.log('🔐 Auth initialisé - Utilisateur:', user ? 'Connecté' : 'Anonyme');
      }
    } catch (error) {
      console.error('❌ Erreur Auth:', error);
      // L'auth n'est pas critique - continuer sans utilisateur
      setCurrentUser(null);
    }
  };

  const initializeAI = async () => {
    try {
      await AIService.initialize();
      await AIService.loadModel();
      
      if (__DEV__) {
        console.log('🤖 IA initialisée avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur IA:', error);
      // L'IA peut fonctionner en mode dégradé
      if (__DEV__) {
        console.warn('⚠️ IA en mode dégradé');
      }
    }
  };

  const initializeLocalDB = async () => {
    try {
      await CacheService.initialize();
      await CacheService.setupDatabase();
      
      if (__DEV__) {
        console.log('💾 Base de données locale initialisée');
      }
    } catch (error) {
      console.error('❌ Erreur DB locale:', error);
      throw new Error(`Base de données: ${error.message}`);
    }
  };

  const initializeSync = async () => {
    try {
      await SyncService.initialize();
      
      // Si connecté et en ligne, démarrer la sync
      if (currentUser && isNetworkConnected) {
        SyncService.startBackgroundSync();
      }
      
      if (__DEV__) {
        console.log('🔄 Synchronisation initialisée');
      }
    } catch (error) {
      console.error('❌ Erreur Sync:', error);
      // La sync n'est pas critique - continuer en mode hors ligne
      if (__DEV__) {
        console.warn('⚠️ Mode hors ligne uniquement');
      }
    }
  };

  const finalizeInitialization = async () => {
    // Vérifier les mises à jour disponibles
    try {
      const updateInfo = await checkForUpdates();
      if (updateInfo.available) {
        setAppUpdateAvailable(true);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('⚠️ Vérification mise à jour échouée:', error);
      }
    }

    // Configuration finale
    if (__DEV__) {
      console.log('✅ Initialisation complète réussie');
    }
  };

  /**
   * Vérification des mises à jour
   */
  const checkForUpdates = async () => {
    // Implémentation de la vérification des mises à jour
    // Retourne { available: boolean, version: string, critical: boolean }
    return { available: false };
  };

  // ============================================================================
  // GESTION RÉSEAU
  // ============================================================================

  /**
   * Gestion des changements de connectivité réseau
   */
  const handleNetworkChange = useCallback((state) => {
    const wasConnected = isNetworkConnected;
    const isConnected = state.isConnected && state.isInternetReachable;
    
    setIsNetworkConnected(isConnected);

    if (__DEV__) {
      console.log('🌐 Network Status:', {
        connected: isConnected,
        type: state.type,
        cellular: state.details?.isConnectionExpensive
      });
    }

    // Reprendre la sync si reconnexion
    if (!wasConnected && isConnected && currentUser) {
      SyncService.resumeSync();
    }
    
    // Arrêter la sync si déconnexion
    if (wasConnected && !isConnected) {
      SyncService.pauseSync();
    }
  }, [isNetworkConnected, currentUser]);

  // ============================================================================
  // GESTION DEEP LINKS
  // ============================================================================

  /**
   * Gestion des liens profonds (deep links)
   */
  const handleDeepLink = useCallback((url) => {
    if (__DEV__) {
      console.log('🔗 Deep Link:', url);
    }

    // Parsing et navigation vers le contenu approprié
    // Format attendu: taxasge://tax/[id] ou taxasge://chat/[query]
    try {
      const parsedUrl = new URL(url);
      // Navigation sera implémentée avec React Navigation
    } catch (error) {
      console.error('❌ Deep Link invalide:', error);
    }
  }, []);

  // ============================================================================
  // EFFECTS & LISTENERS
  // ============================================================================

  useEffect(() => {
    // Initialisation au montage
    initializeServices();

    // Listeners cycle de vie
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    // Listener réseau
    const networkUnsubscribe = NetInfo.addEventListener(handleNetworkChange);
    
    // Listener deep links
    const linkingListener = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    // Nettoyage au démontage
    return () => {
      appStateSubscription?.remove();
      backHandler.remove();
      networkUnsubscribe();
      linkingListener.remove();
    };
  }, [initializeServices, handleAppStateChange, handleBackPress, handleNetworkChange, handleDeepLink]);

  // ============================================================================
  // GESTION ERREURS
  // ============================================================================

  /**
   * Gestion des erreurs avec retry
   */
  const handleRetryInitialization = useCallback(() => {
    setInitError(null);
    setAppState(APP_STATES.LOADING);
    initializeServices();
  }, [initializeServices]);

  /**
   * Gestion erreur critique - réinitialisation complète
   */
  const handleCriticalError = useCallback(() => {
    Alert.alert(
      'Erreur Critique',
      'L\'application a rencontré une erreur critique. Redémarrage nécessaire.',
      [
        {
          text: 'Redémarrer',
          onPress: () => {
            // Force restart de l'application
            if (Platform.OS === 'android') {
              BackHandler.exitApp();
            }
          }
        }
      ],
      { cancelable: false }
    );
  }, []);

  // ============================================================================
  // RENDU CONDITIONNEL SELON L'ÉTAT
  // ============================================================================

  /**
   * Écran de chargement pendant l'initialisation
   */
  if (appState === APP_STATES.LOADING || appState === APP_STATES.INITIALIZING) {
    return (
      <SafeAreaProvider>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={Colors.primary.main} 
          translucent={true}
        />
        <LoadingScreen 
          progress={initProgress}
          message={`Initialisation en cours... ${Math.round(initProgress)}%`}
          showProgress={appState === APP_STATES.INITIALIZING}
        />
      </SafeAreaProvider>
    );
  }

  /**
   * Écran d'erreur avec possibilité de retry
   */
  if (appState === APP_STATES.ERROR) {
    return (
      <SafeAreaProvider>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor={Colors.error.light} 
          translucent={true}
        />
        <LoadingScreen 
          error={initError}
          onRetry={handleRetryInitialization}
          onCriticalError={handleCriticalError}
        />
      </SafeAreaProvider>
    );
  }

  /**
   * Application prête - Rendu principal avec tous les providers
   */
  return (
    <ErrorBoundary onError={handleCriticalError}>
      <ReduxProvider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <SafeAreaProvider>
            <AuthProvider initialUser={currentUser}>
              <NetworkProvider isConnected={isNetworkConnected}>
                <SettingsProvider>
                  <NavigationContainer
                    linking={{
                      prefixes: ['taxasge://', 'https://taxasge.gq.gov'],
                      config: {
                        screens: {
                          Home: 'home',
                          Search: 'search',
                          TaxDetail: 'tax/:id',
                          Chat: 'chat/:query?',
                          Profile: 'profile',
                        },
                      },
                    }}
                    onReady={() => {
                      if (__DEV__) {
                        console.log('🧭 Navigation prête');
                      }
                    }}
                  >
                    <StatusBar 
                      barStyle="dark-content" 
                      backgroundColor="transparent" 
                      translucent={true}
                    />
                    
                    {/* Barre de statut réseau */}
                    <NetworkStatusBar isConnected={isNetworkConnected} />
                    
                    {/* Navigation principale */}
                    <AppNavigator />
                    
                    {/* Modal de mise à jour si disponible */}
                    {appUpdateAvailable && (
                      <UpdateModal 
                        onUpdate={() => setAppUpdateAvailable(false)}
                        onDismiss={() => setAppUpdateAvailable(false)}
                      />
                    )}
                  </NavigationContainer>
                </SettingsProvider>
              </NetworkProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </PersistGate>
      </ReduxProvider>
    </ErrorBoundary>
  );
};

// ============================================================================
// EXPORT & PERFORMANCE
// ============================================================================

// Optimisation avec React.memo pour éviter les re-renders inutiles
export default React.memo(App);

// ============================================================================
// DEV TOOLS & DEBUG INFO
// ============================================================================

if (__DEV__) {
  // Performance monitoring
  App.displayName = 'TaxasGE';
  
  // Debug info accessible globalement
  global.debugTaxasGE = {
    ...global.debugTaxasGE,
    
    getAppInfo: () => ({
      version: APP_CONFIG.VERSION,
      buildNumber: APP_CONFIG.BUILD_NUMBER,
      environment: APP_CONFIG.ENVIRONMENT,
      features: APP_CONFIG.FEATURES
    }),
    
    testServices: async () => {
      console.log('🧪 Test des services...');
      
      try {
        await FirebaseService.testConnection();
        console.log('✅ Firebase: OK');
      } catch (e) {
        console.log('❌ Firebase:', e.message);
      }
      
      try {
        await SupabaseService.testConnection();
        console.log('✅ Supabase: OK');
      } catch (e) {
        console.log('❌ Supabase:', e.message);
      }
      
      try {
        await AIService.testModel();
        console.log('✅ IA: OK');
      } catch (e) {
        console.log('❌ IA:', e.message);
      }
    }
  };
}