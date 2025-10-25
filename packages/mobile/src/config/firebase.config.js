/**
 * 🔥 Configuration Firebase TaxasGE - Multi-environnements
 * Architecture automatique par branches Git:
 * - develop → taxasge-dev (développement)
 * - main → taxasge-prod (production)
 *
 * @author KOUEMOU SAH Jean Emac
 * @version 1.0.0
 */

// ============================================================================
// CONFIGURATION TAXASGE-DEV (Development)
// ============================================================================
const firebaseConfigDev = {
  // 📝 COLLEZ ICI la configuration de taxasge-dev
  apiKey: 'AIzaSyB9xkD3Qv8_p-UV1N-SjaskIfFJDsgFJHg',
  authDomain: 'taxasge-dev.firebaseapp.com',
  projectId: 'taxasge-dev',
  storageBucket: 'taxasge-dev.firebasestorage.app',
  messagingSenderId: '392159428433',
  appId: '1:392159428433:web:c2f170a2a220a78eef1d70',
};

// ============================================================================
// CONFIGURATION TAXASGE-PROD (Production)
// ============================================================================
const firebaseConfigProd = {
  // 📝 COLLEZ ICI la configuration de taxasge-prod

  apiKey: 'AIzaSyB8gM9M7Z-NOpPIbC3YrzcV6BDCRP7sfNI',
  authDomain: 'taxasge-pro.firebaseapp.com',
  projectId: 'taxasge-pro',
  storageBucket: 'taxasge-pro.firebasestorage.app',
  messagingSenderId: '430718042574',
  appId: '1:430718042574:web:4afac31fb15bd5ac162b9f',
};

// ============================================================================
// DÉTECTION AUTOMATIQUE ENVIRONNEMENT
// ============================================================================

/**
 * Détecte l'environnement selon plusieurs critères
 */
const detectEnvironment = () => {
  // 1. React Native __DEV__ flag (priorité maximale)
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__ ? 'development' : 'production';
  }

  // 2. Variables d'environnement (CI/CD)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NODE_ENV === 'production') return 'production';
    if (process.env.ENVIRONMENT === 'production') return 'production';
  }

  // 3. Fallback développement
  return 'development';
};

// ============================================================================
// EXPORTS CONFIGURÉS
// ============================================================================

const currentEnvironment = detectEnvironment();

// Configuration active selon l'environnement
const firebaseConfig = currentEnvironment === 'production' ? firebaseConfigProd : firebaseConfigDev;

// Informations environnement
const environment = currentEnvironment;
const isProduction = currentEnvironment === 'production';
const isDevelopment = currentEnvironment === 'development';
const projectId = firebaseConfig.projectId;

// Configuration debug (seulement si __DEV__ existe)
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log(`🔥 Firebase Config - Environment: ${currentEnvironment}`);
  console.log(`📊 Project ID: ${firebaseConfig.projectId}`);
  console.log(`🌐 Auth Domain: ${firebaseConfig.authDomain}`);
}

// ============================================================================
// EXPORTS (Compatible CommonJS + ES Modules)
// ============================================================================

// Export par défaut
const config = {
  firebaseConfig,
  environment,
  isProduction,
  isDevelopment,
  projectId,
};

// CommonJS (pour Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
  module.exports.default = firebaseConfig;
  module.exports.firebaseConfig = firebaseConfig;
  module.exports.environment = environment;
  module.exports.isProduction = isProduction;
  module.exports.isDevelopment = isDevelopment;
  module.exports.projectId = projectId;
}

// ES Modules (pour React Native)
if (typeof exports !== 'undefined') {
  exports.firebaseConfig = firebaseConfig;
  exports.environment = environment;
  exports.isProduction = isProduction;
  exports.isDevelopment = isDevelopment;
  exports.projectId = projectId;
  exports.default = firebaseConfig;
}

// ============================================================================
// TYPES POUR TYPESCRIPT (Optionnel)
// ============================================================================

/**
 * @typedef {Object} FirebaseConfig
 * @property {string} apiKey - Clé API Firebase
 * @property {string} authDomain - Domaine d'authentification
 * @property {string} projectId - ID du projet Firebase
 * @property {string} storageBucket - Bucket de stockage
 * @property {string} messagingSenderId - ID de l'expéditeur de messages
 * @property {string} appId - ID de l'application
 */
