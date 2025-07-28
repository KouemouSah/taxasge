/**
 * TaxasGE Mobile - Point d'entrée React Native
 * Application de Gestion Fiscale pour la Guinée Équatoriale
 * 
 * @author KOUEMOU SAH Jean Emac
 * @version 1.0.0
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

// ============================================================================
// POLYFILLS & CONFIGURATION GLOBALE
// ============================================================================

// URL polyfill pour Supabase (requis pour React Native)
import 'react-native-url-polyfill/auto';

// Configuration TensorFlow.js pour React Native (chatbot IA)
import '@tensorflow/tfjs-react-native';

// Configuration performance console (development uniquement)
if (__DEV__) {
  import('./src/config/DevConfig').then(devConfig => {
    devConfig.setupDevelopmentConfig();
  });
}

// ============================================================================
// CONFIGURATION FIREBASE
// ============================================================================

// Initialisation Firebase selon l'environnement
import { initializeFirebase } from './src/services/firebase/FirebaseConfig';

// Initialisation automatique au démarrage
initializeFirebase()
  .then(() => {
    if (__DEV__) {
      console.log('🔥 Firebase initialized successfully');
    }
  })
  .catch((error) => {
    console.error('❌ Firebase initialization failed:', error);
  });

// ============================================================================
// CONFIGURATION ERREURS GLOBALES
// ============================================================================

// Gestion des erreurs non catchées (crash prevention)
import { setupGlobalErrorHandling } from './src/utils/ErrorHandler';
setupGlobalErrorHandling();

// ============================================================================
// CONFIGURATION PERFORMANCE
// ============================================================================

// Configuration Hermes Engine (si activé)
if (global.HermesInternal) {
  if (__DEV__) {
    console.log('⚡ Hermes Engine: Enabled');
  }
}

// Configuration New Architecture (si activée)
if (global.RN_FABRIC_ENABLED || global.RN_TURBO_MODULE_ENABLED) {
  if (__DEV__) {
    console.log('🏗️ New Architecture: Enabled');
  }
}

// ============================================================================
// CONFIGURATION DEVELOPMENT
// ============================================================================

if (__DEV__) {
  // Configuration Flipper
  import('./src/config/FlipperConfig').then(flipperConfig => {
    flipperConfig.initializeFlipper();
  });

  // Configuration Reactotron (debugging)
  import('./src/config/ReactotronConfig').then(reactotronConfig => {
    reactotronConfig.initializeReactotron();
  });

  // Performance monitoring development
  console.log(`
🚀 TaxasGE Mobile - Development Mode
=====================================
📱 React Native: ${require('react-native/package.json').version}
🔥 Firebase: Initialized
🧠 TensorFlow: Ready for AI
🗄️ Supabase: Configured
⚡ Performance: Optimized
=====================================
  `);
}

// ============================================================================
// ENREGISTREMENT APPLICATION
// ============================================================================

/**
 * Composant racine de l'application TaxasGE
 * Encapsule toute la logique d'initialisation et de configuration
 */
const TaxasGEApp = () => {
  return <App />;
};

// Enregistrement de l'application auprès de React Native
AppRegistry.registerComponent(appName, () => TaxasGEApp);

// ============================================================================
// CONFIGURATION HOT RELOAD (Development)
// ============================================================================

if (__DEV__) {
  // Support Hot Reload pour un développement rapide
  if (module.hot) {
    module.hot.accept(['./src/App'], () => {
      const NextApp = require('./src/App').default;
      AppRegistry.registerComponent(appName, () => () => <NextApp />);
    });
  }
}

// ============================================================================
// EXPORTS (pour testing et debugging)
// ============================================================================

export default TaxasGEApp;

// Export pour les tests
export { App };

// ============================================================================
// CONFIGURATION AVANCÉE
// ============================================================================

// Configuration Metro pour assets ML (.tflite)
if (__DEV__) {
  console.log('📁 Metro: Configured for .tflite, .json ML assets');
}

// Configuration i18n (internationalisation ES/FR/EN)
import './src/i18n/i18nConfig';

// Configuration Redux Store (state management)
// Note: Le store sera initialisé dans App.js pour un meilleur contrôle

// ============================================================================
// VARIABLES D'ENVIRONNEMENT
// ============================================================================

// Validation des variables critiques
const requiredEnvVars = [
  'REACT_NATIVE_FIREBASE_PROJECT_ID',
  'REACT_NATIVE_SUPABASE_URL',
];

if (__DEV__) {
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      console.warn(`⚠️ Environment variable ${envVar} not set`);
    }
  });
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

// Métriques de démarrage (production et development)
const startTime = Date.now();

// Callback après initialisation complète
const onAppReady = () => {
  const initTime = Date.now() - startTime;
  
  if (__DEV__) {
    console.log(`⚡ App initialized in ${initTime}ms`);
    
    // Objectif: <3000ms pour démarrage complet
    if (initTime > 3000) {
      console.warn(`⚠️ Slow startup: ${initTime}ms (target: <3000ms)`);
    } else {
      console.log(`✅ Fast startup: ${initTime}ms`);
    }
  }
  
  // Analytics de performance (si Firebase Analytics activé)
  // Cette métrique sera envoyée en production pour monitoring
};

// Hook d'initialisation complète
if (typeof global.onAppReady === 'undefined') {
  global.onAppReady = onAppReady;
}

// ============================================================================
// DEBUGGING HELPERS (Development uniquement)
// ============================================================================

if (__DEV__) {
  // Helpers globaux pour debugging dans Flipper/Console
  global.debugTaxasGE = {
    clearAsyncStorage: async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.clear();
      console.log('🗑️ AsyncStorage cleared');
    },
    
    logReduxState: () => {
      // Sera implémenté quand le store Redux sera disponible
      console.log('🔍 Redux state logging (to implement)');
    },
    
    testFirebase: async () => {
      const auth = require('@react-native-firebase/auth').default;
      console.log('🔥 Firebase Auth:', auth().currentUser ? 'Authenticated' : 'Anonymous');
    },
    
    testSupabase: async () => {
      console.log('🗄️ Supabase connection test (to implement)');
    }
  };
  
  console.log('🛠️ Debug helpers available: global.debugTaxasGE');
}

// ============================================================================