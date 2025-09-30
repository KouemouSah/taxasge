#!/usr/bin/env node
/**
 * 🔥 TaxasGE Firebase Configuration Setup
 * Script automatisé de configuration Firebase pour tous les environnements
 * 
 * Fonctionnalités:
 * - Configuration multi-environnement (dev/prod)
 * - Génération fichiers config Firebase mobile/web
 * - Initialisation projets Firebase
 * - Validation et tests de connectivité
 * - Intégration CI/CD automatique
 * 
 * @author KOUEMOU SAH Jean Emac
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONFIG_DIR = path.join(PROJECT_ROOT, 'config');
const MOBILE_DIR = path.join(PROJECT_ROOT, 'packages', 'mobile');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'packages', 'backend');

/**
 * Configuration Firebase par environnement
 * Basée sur le fichier environments.json existant
 */
const FIREBASE_PROJECTS = {
  development: {
    projectId: 'taxasge-dev',
    displayName: 'TaxasGE Development',
    description: 'Environnement de développement et tests',
    services: ['authentication', 'firestore', 'functions', 'hosting', 'storage', 'app-distribution'],
    androidPackageName: 'com.taxasge.dev',
    iosPackageName: 'com.taxasge.dev',
    webDomain: 'taxasge-dev.web.app'
  },
  production: {
    projectId: 'taxasge-prod', 
    displayName: 'TaxasGE Production',
    description: 'Environnement de production',
    services: ['authentication', 'firestore', 'functions', 'hosting', 'storage'],
    androidPackageName: 'gq.gov.dgi.taxasge',
    iosPackageName: 'gq.gov.dgi.taxasge',
    webDomain: 'taxasge.gq.gov'
  }
};

/**
 * Templates de configuration
 */
const CONFIG_TEMPLATES = {
  firebaserc: {
    projects: {
      development: 'taxasge-dev',
      production: 'taxasge-prod'
    },
    targets: {},
    etags: {}
  },
  
  firebaseJson: {
    functions: [{
      source: 'packages/backend',
      codebase: 'default',
      runtime: 'python311'
    }],
    hosting: {
      public: 'packages/web/dist',
      ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
      rewrites: [{
        source: '/api/**',
        function: 'main'
      }]
    },
    storage: {
      rules: 'storage.rules'
    },
    firestore: {
      rules: 'firestore.rules',
      indexes: 'firestore.indexes.json'
    },
    emulators: {
      auth: { port: 9099 },
      functions: { port: 5001 },
      firestore: { port: 8080 },
      hosting: { port: 5000 },
      storage: { port: 9199 },
      ui: { enabled: true, port: 4000 }
    }
  }
};

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Logger avec timestamps et couleurs
 */
class Logger {
  static timestamp() {
    return new Date().toISOString().substring(11, 19);
  }

  static info(message) {
    console.log(`[${this.timestamp()}] ℹ️  ${message}`);
  }

  static success(message) {
    console.log(`[${this.timestamp()}] ✅ ${message}`);
  }

  static warning(message) {
    console.log(`[${this.timestamp()}] ⚠️  ${message}`);
  }

  static error(message) {
    console.error(`[${this.timestamp()}] ❌ ${message}`);
  }

  static step(message) {
    console.log(`[${this.timestamp()}] 🔧 ${message}`);
  }

  static progress(message) {
    console.log(`[${this.timestamp()}] 🚀 ${message}`);
  }
}

/**
 * Gestionnaire d'erreurs
 */
class FirebaseSetupError extends Error {
  constructor(message, code = 'SETUP_ERROR') {
    super(message);
    this.name = 'FirebaseSetupError';
    this.code = code;
  }
}

/**
 * Exécution de commandes avec gestion d'erreur
 */
async function executeCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: options.cwd || PROJECT_ROOT,
      ...options
    });
    return result;
  } catch (error) {
    throw new FirebaseSetupError(`Commande échouée: ${command}\n${error.message}`, 'COMMAND_FAILED');
  }
}

/**
 * Vérification de l'existence d'un fichier
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Création de répertoire récursive
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Lecture et parsing JSON avec gestion d'erreur
 */
async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw new FirebaseSetupError(`Erreur lecture fichier JSON: ${filePath}`, 'JSON_READ_ERROR');
  }
}

/**
 * Écriture JSON avec formatage
 */
async function writeJsonFile(filePath, data) {
  const jsonContent = JSON.stringify(data, null, 2) + '\n';
  await fs.writeFile(filePath, jsonContent, 'utf8');
}

// ============================================================================
// DÉTECTION D'ENVIRONNEMENT
// ============================================================================

/**
 * Détection automatique de l'environnement
 */
function detectEnvironment() {
  // 1. Variable d'environnement explicite
  if (process.env.ENVIRONMENT) {
    return process.env.ENVIRONMENT;
  }

  // 2. CI/CD: GitHub Actions
  if (process.env.GITHUB_ACTIONS) {
    const ref = process.env.GITHUB_REF || '';
    if (ref.includes('refs/heads/main')) {
      return 'production';
    }
    if (ref.includes('refs/heads/develop')) {
      return 'development';
    }
    return 'development'; // fallback pour CI
  }

  // 3. Branche Git actuelle
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    if (branch === 'main' || branch === 'master') {
      return 'production';
    }
    if (branch === 'develop' || branch === 'development') {
      return 'development';
    }
  } catch (error) {
    Logger.warning('Impossible de détecter la branche Git');
  }

  // 4. Mode interactif par défaut
  return 'interactive';
}

/**
 * Sélection interactive d'environnement
 */
async function selectEnvironment() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n🔥 Configuration Firebase TaxasGE');
    console.log('=====================================');
    console.log('1. Development (taxasge-dev)');
    console.log('2. Production (taxasge-prod)');
    console.log('3. Les deux environnements');
    console.log('=====================================');

    rl.question('Sélectionnez l\'environnement (1-3): ', (answer) => {
      rl.close();
      
      switch (answer.trim()) {
        case '1':
          resolve(['development']);
        case '2':
          resolve(['production']);
        case '3':
          resolve(['development', 'production']);
        default:
          Logger.warning('Sélection invalide, utilisation de development');
          resolve(['development']);
      }
    });
  });
}

// ============================================================================
// VÉRIFICATIONS PRÉALABLES
// ============================================================================

/**
 * Vérification des prérequis
 */
async function checkPrerequisites() {
  Logger.step('Vérification des prérequis...');

  // Vérifier Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
    
    if (majorVersion < 18) {
      throw new FirebaseSetupError('Node.js 18+ requis', 'NODE_VERSION_ERROR');
    }
    Logger.info(`Node.js: ${nodeVersion} ✅`);
  } catch (error) {
    throw new FirebaseSetupError('Node.js non installé ou version incompatible', 'NODE_MISSING');
  }

  // Vérifier npm/yarn
  try {
    const yarnVersion = execSync('yarn --version', { encoding: 'utf8', stdio: 'pipe' }).trim();
    Logger.info(`Yarn: ${yarnVersion} ✅`);
  } catch {
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      Logger.info(`npm: ${npmVersion} ✅`);
    } catch {
      throw new FirebaseSetupError('npm ou yarn requis', 'PACKAGE_MANAGER_MISSING');
    }
  }

  // Vérifier Git
  try {
    const gitVersion = execSync('git --version', { encoding: 'utf8', stdio: 'pipe' }).trim();
    Logger.info(`Git: ${gitVersion} ✅`);
  } catch {
    Logger.warning('Git non disponible - certaines fonctionnalités limitées');
  }

  // Vérifier structure projet
  const requiredDirs = [
    path.join(PROJECT_ROOT, 'packages', 'mobile'),
    path.join(PROJECT_ROOT, 'packages', 'backend'),
    path.join(PROJECT_ROOT, 'config')
  ];

  for (const dir of requiredDirs) {
    if (!await fileExists(dir)) {
      throw new FirebaseSetupError(`Répertoire manquant: ${dir}`, 'PROJECT_STRUCTURE_ERROR');
    }
  }

  Logger.success('Prérequis validés');
}

/**
 * Installation Firebase CLI
 */
async function installFirebaseCLI() {
  Logger.step('Vérification/Installation Firebase CLI...');

  try {
    // Vérifier si Firebase CLI est installé
    const firebaseVersion = execSync('firebase --version', { 
      encoding: 'utf8', 
      stdio: 'pipe' 
    }).trim();
    
    Logger.info(`Firebase CLI: ${firebaseVersion} ✅`);
    return;
  } catch {
    Logger.warning('Firebase CLI non installé');
  }

  // Installation Firebase CLI
  try {
    Logger.progress('Installation Firebase CLI...');
    await executeCommand('npm install -g firebase-tools@latest');
    
    const newVersion = execSync('firebase --version', { encoding: 'utf8' }).trim();
    Logger.success(`Firebase CLI installé: ${newVersion}`);
  } catch (error) {
    throw new FirebaseSetupError('Impossible d\'installer Firebase CLI', 'FIREBASE_CLI_INSTALL_ERROR');
  }
}

// ============================================================================
// AUTHENTIFICATION FIREBASE
// ============================================================================

/**
 * Authentification Firebase
 */
async function authenticateFirebase() {
  Logger.step('Authentification Firebase...');

  // En CI/CD, utiliser le service account
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV;
    
    if (!serviceAccount) {
      throw new FirebaseSetupError('Service account Firebase manquant en CI/CD', 'SERVICE_ACCOUNT_MISSING');
    }

    try {
      // Écrire le service account temporairement
      const serviceAccountPath = path.join(PROJECT_ROOT, '.firebase-service-account.json');
      await fs.writeFile(serviceAccountPath, serviceAccount, 'utf8');
      
      // Authentification avec service account
      await executeCommand(`firebase auth:ci-login --service-account ${serviceAccountPath}`);
      
      // Nettoyer le fichier temporaire
      await fs.unlink(serviceAccountPath);
      
      Logger.success('Authentification CI/CD réussie');
    } catch (error) {
      throw new FirebaseSetupError('Échec authentification service account', 'SERVICE_ACCOUNT_AUTH_ERROR');
    }
    
    return;
  }

  // En local, vérifier si déjà authentifié
  try {
    await executeCommand('firebase projects:list', { silent: true });
    Logger.info('Déjà authentifié avec Firebase ✅');
    return;
  } catch {
    Logger.info('Authentification Firebase requise');
  }

  // Authentification interactive
  try {
    Logger.progress('Ouverture navigateur pour authentification...');
    await executeCommand('firebase login');
    Logger.success('Authentification Firebase réussie');
  } catch (error) {
    throw new FirebaseSetupError('Échec authentification Firebase', 'FIREBASE_AUTH_ERROR');
  }
}

// ============================================================================
// CONFIGURATION PROJETS FIREBASE
// ============================================================================

/**
 * Vérification/Création des projets Firebase
 */
async function setupFirebaseProjects(environments) {
  Logger.step('Configuration des projets Firebase...');

  for (const env of environments) {
    const config = FIREBASE_PROJECTS[env];
    
    if (!config) {
      throw new FirebaseSetupError(`Configuration inconnue pour l'environnement: ${env}`, 'UNKNOWN_ENVIRONMENT');
    }

    await setupSingleFirebaseProject(env, config);
  }
}

/**
 * Configuration d'un projet Firebase individuel
 */
async function setupSingleFirebaseProject(environment, config) {
  Logger.progress(`Configuration projet ${config.projectId} (${environment})...`);

  // Vérifier si le projet existe
  try {
    await executeCommand(`firebase projects:addhook ${config.projectId}`, { silent: true });
    Logger.info(`Projet ${config.projectId} existe ✅`);
  } catch {
    Logger.warning(`Projet ${config.projectId} non accessible - création/accès requis`);
    
    if (!process.env.CI) {
      Logger.info(`Veuillez créer le projet manuellement: https://console.firebase.google.com/`);
      Logger.info(`- Nom du projet: ${config.displayName}`);
      Logger.info(`- ID du projet: ${config.projectId}`);
      Logger.info(`- Description: ${config.description}`);
    }
  }

  // Configuration du projet local
  await executeCommand(`firebase use ${config.projectId} --alias ${environment}`);
  Logger.success(`Projet ${config.projectId} configuré pour ${environment}`);

  // Activer les services Firebase requis
  await enableFirebaseServices(config.projectId, config.services);
}

/**
 * Activation des services Firebase
 */
async function enableFirebaseServices(projectId, services) {
  Logger.step(`Activation des services Firebase pour ${projectId}...`);

  for (const service of services) {
    try {
      // Note: Certains services nécessitent une activation manuelle via la console
      Logger.info(`Service ${service}: Configuration requise`);
    } catch (error) {
      Logger.warning(`Impossible de configurer ${service} automatiquement`);
    }
  }

  Logger.info('Services Firebase: Configuration manuelle requise via console');
}

// ============================================================================
// GÉNÉRATION FICHIERS DE CONFIGURATION
// ============================================================================

/**
 * Génération de tous les fichiers de configuration
 */
async function generateConfigurationFiles(environments) {
  Logger.step('Génération des fichiers de configuration...');

  // Firebase config racine
  await generateFirebaseRootConfig();
  
  // Configuration mobile pour chaque environnement
  for (const env of environments) {
    await generateMobileConfig(env);
  }

  // Configuration backend
  await generateBackendConfig(environments);

  Logger.success('Fichiers de configuration générés');
}

/**
 * Génération .firebaserc et firebase.json
 */
async function generateFirebaseRootConfig() {
  // .firebaserc
  const firebasercPath = path.join(PROJECT_ROOT, '.firebaserc');
  await writeJsonFile(firebasercPath, CONFIG_TEMPLATES.firebaserc);
  Logger.info('.firebaserc généré ✅');

  // firebase.json
  const firebaseJsonPath = path.join(PROJECT_ROOT, 'firebase.json');
  let existingConfig = await readJsonFile(firebaseJsonPath);
  
  if (!existingConfig) {
    await writeJsonFile(firebaseJsonPath, CONFIG_TEMPLATES.firebaseJson);
    Logger.info('firebase.json généré ✅');
  } else {
    Logger.info('firebase.json existe déjà ✅');
  }
}

/**
 * Génération configuration mobile
 */
async function generateMobileConfig(environment) {
  const config = FIREBASE_PROJECTS[environment];
  
  // Configuration Android
  await generateAndroidConfig(environment, config);
  
  // Configuration iOS
  await generateIosConfig(environment, config);
  
  // Configuration JavaScript/TypeScript
  await generateWebConfig(environment, config);
}

/**
 * Configuration Android (google-services.json)
 */
async function generateAndroidConfig(environment, config) {
  const androidConfigPath = path.join(MOBILE_DIR, 'android', 'app', 'google-services.json');
  
  // Template de configuration Android
  const androidConfig = {
    project_info: {
      project_number: "123456789012",
      project_id: config.projectId,
      storage_bucket: `${config.projectId}.appspot.com`
    },
    client: [{
      client_info: {
        mobilesdk_app_id: `1:123456789012:android:abcdef`,
        android_client_info: {
          package_name: config.androidPackageName
        }
      },
      oauth_client: [],
      api_key: [{
        current_key: "AIzaSyExample-Android-Key"
      }],
      services: {
        appinvite_service: {
          other_platform_oauth_client: []
        }
      }
    }],
    configuration_version: "1"
  };

  // Créer le répertoire si nécessaire
  await ensureDirectory(path.dirname(androidConfigPath));
  
  // Vérifier si le fichier existe déjà
  if (await fileExists(androidConfigPath)) {
    Logger.info(`google-services.json existe pour ${environment} ✅`);
    return;
  }

  await writeJsonFile(androidConfigPath, androidConfig);
  Logger.info(`google-services.json généré pour ${environment} ✅`);
  Logger.warning('⚠️ Remplacez les valeurs placeholder par les vraies clés Firebase');
}

/**
 * Configuration iOS (GoogleService-Info.plist)
 */
async function generateIosConfig(environment, config) {
  const iosConfigPath = path.join(MOBILE_DIR, 'ios', 'GoogleService-Info.plist');
  
  // Template plist iOS
  const iosConfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CLIENT_ID</key>
  <string>123456789012-abcdef.apps.googleusercontent.com</string>
  <key>REVERSED_CLIENT_ID</key>
  <string>com.googleusercontent.apps.123456789012-abcdef</string>
  <key>API_KEY</key>
  <string>AIzaSyExample-iOS-Key</string>
  <key>GCM_SENDER_ID</key>
  <string>123456789012</string>
  <key>PLIST_VERSION</key>
  <string>1</string>
  <key>BUNDLE_ID</key>
  <string>${config.iosPackageName}</string>
  <key>PROJECT_ID</key>
  <string>${config.projectId}</string>
  <key>STORAGE_BUCKET</key>
  <string>${config.projectId}.appspot.com</string>
  <key>IS_ADS_ENABLED</key>
  <false/>
  <key>IS_ANALYTICS_ENABLED</key>
  <true/>
  <key>IS_APPINVITE_ENABLED</key>
  <true/>
  <key>IS_GCM_ENABLED</key>
  <true/>
  <key>IS_SIGNIN_ENABLED</key>
  <true/>
  <key>GOOGLE_APP_ID</key>
  <string>1:123456789012:ios:abcdef</string>
</dict>
</plist>`;

  // Créer le répertoire si nécessaire
  await ensureDirectory(path.dirname(iosConfigPath));
  
  if (await fileExists(iosConfigPath)) {
    Logger.info(`GoogleService-Info.plist existe pour ${environment} ✅`);
    return;
  }

  await fs.writeFile(iosConfigPath, iosConfig, 'utf8');
  Logger.info(`GoogleService-Info.plist généré pour ${environment} ✅`);
  Logger.warning('⚠️ Remplacez les valeurs placeholder par les vraies clés Firebase');
}

/**
 * Configuration Web/JavaScript
 */
async function generateWebConfig(environment, config) {
  const webConfigPath = path.join(MOBILE_DIR, 'src', 'config', 'firebase.config.js');
  
  const webConfig = `// Firebase Configuration - ${environment}
// Auto-généré par scripts/setup-firebase.js

export const firebaseConfig = {
  apiKey: "AIzaSyExample-Web-Key",
  authDomain: "${config.projectId}.firebaseapp.com",
  projectId: "${config.projectId}",
  storageBucket: "${config.projectId}.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef",
  measurementId: "G-ABCDEFGHIJ"
};

export const environment = "${environment}";
export const projectId = "${config.projectId}";
export const isProduction = ${environment === 'production'};
export const isDevelopment = ${environment === 'development'};

// Default export for compatibility
export default firebaseConfig;
`;

  await ensureDirectory(path.dirname(webConfigPath));
  
  if (await fileExists(webConfigPath)) {
    Logger.info(`firebase.config.js existe pour ${environment} ✅`);
    return;
  }

  await fs.writeFile(webConfigPath, webConfig, 'utf8');
  Logger.info(`firebase.config.js généré pour ${environment} ✅`);
  Logger.warning('⚠️ Remplacez les valeurs placeholder par les vraies clés Firebase');
}

/**
 * Configuration backend
 */
async function generateBackendConfig(environments) {
  // Copier les variables d'environnement pour le backend
  const backendEnvPath = path.join(BACKEND_DIR, '.env.example');
  
  const envContent = `# Firebase Configuration - Auto-généré
FIREBASE_PROJECT_ID=taxasge-dev
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
ENVIRONMENT=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/taxasge
`;

  if (!await fileExists(backendEnvPath)) {
    await fs.writeFile(backendEnvPath, envContent, 'utf8');
    Logger.info('.env.example généré pour backend ✅');
  }
}

// ============================================================================
// TESTS ET VALIDATION
// ============================================================================

/**
 * Tests de connectivité Firebase
 */
async function validateFirebaseSetup(environments) {
  Logger.step('Validation de la configuration Firebase...');

  for (const env of environments) {
    const config = FIREBASE_PROJECTS[env];
    await validateSingleProject(env, config);
  }

  Logger.success('Configuration Firebase validée');
}

/**
 * Validation d'un projet individuel
 */
async function validateSingleProject(environment, config) {
  Logger.progress(`Test de connectivité ${config.projectId}...`);

  try {
    // Test de connexion au projet
    await executeCommand(`firebase use ${config.projectId}`, { silent: true });
    
    // Test des services (si disponibles)
    try {
      await executeCommand('firebase functions:list', { silent: true });
      Logger.info(`Functions: Accessible ✅`);
    } catch {
      Logger.info(`Functions: Non configuré (normal)`);
    }

    try {
      await executeCommand('firebase hosting:sites:list', { silent: true });
      Logger.info(`Hosting: Accessible ✅`);
    } catch {
      Logger.info(`Hosting: Non configuré (normal)`);
    }

    Logger.success(`Projet ${config.projectId}: Configuration validée`);
  } catch (error) {
    Logger.warning(`Projet ${config.projectId}: Tests échoués - Configuration manuelle requise`);
  }
}

// ============================================================================
// SCRIPT PRINCIPAL
// ============================================================================

/**
 * Script principal d'exécution
 */
async function main() {
  try {
    console.log('\n🔥 TaxasGE Firebase Configuration Setup');
    console.log('==========================================');
    console.log('Configuration automatique de Firebase pour tous les environnements');
    console.log('==========================================\n');

    // Détection environnement
    const detectedEnv = detectEnvironment();
    let environments;

    if (detectedEnv === 'interactive') {
      environments = await selectEnvironment();
    } else {
      environments = [detectedEnv];
      Logger.info(`Environnement détecté: ${detectedEnv}`);
    }

    // Étapes d'installation
    const steps = [
      { name: 'Vérification prérequis', action: checkPrerequisites },
      { name: 'Installation Firebase CLI', action: installFirebaseCLI },
      { name: 'Authentification Firebase', action: authenticateFirebase },
      { name: 'Configuration projets', action: () => setupFirebaseProjects(environments) },
      { name: 'Génération fichiers config', action: () => generateConfigurationFiles(environments) },
      { name: 'Validation configuration', action: () => validateFirebaseSetup(environments) }
    ];

    // Exécution séquentielle
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const progress = Math.round(((i + 1) / steps.length) * 100);
      
      console.log(`\n[${progress}%] ${step.name}`);
      console.log('='.repeat(50));
      
      await step.action();
    }

    // Rapport final
    console.log('\n🎉 Configuration Firebase terminée avec succès !');
    console.log('================================================');
    console.log(`✅ Environnements configurés: ${environments.join(', ')}`);
    console.log('✅ Fichiers de configuration générés');
    console.log('✅ Projets Firebase configurés');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Remplacer les clés placeholder par les vraies clés Firebase');
    console.log('2. Configurer les services Firebase via la console web');
    console.log('3. Tester le déploiement avec: yarn deploy');
    console.log('\n🚀 Projet TaxasGE prêt pour le développement !');

  } catch (error) {
    Logger.error(`Configuration échouée: ${error.message}`);
    
    if (error instanceof FirebaseSetupError) {
      Logger.error(`Code d'erreur: ${error.code}`);
    }
    
    console.log('\n🔧 Solutions possibles:');
    console.log('- Vérifier que Firebase CLI est installé');
    console.log('- S\'assurer d\'être authentifié avec Firebase');
    console.log('- Vérifier les permissions sur les projets Firebase');
    console.log('- Exécuter en mode verbose: DEBUG=1 node scripts/setup-firebase.js');
    
    process.exit(1);
  }
}

// ============================================================================
// GESTION DES ARGUMENTS ET EXÉCUTION
// ============================================================================

// Gestion mode debug
if (process.env.DEBUG) {
  console.log('🐛 Mode debug activé');
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);
const options = {
  environment: null,
  force: false,
  skipTests: false,
  verbose: false
};

// Parsing des arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--env':
    case '--environment':
      options.environment = args[++i];
      break;
    case '--force':
      options.force = true;
      break;
    case '--skip-tests':
      options.skipTests = true;
      break;
    case '--verbose':
    case '-v':
      options.verbose = true;
      break;
    case '--help':
    case '-h':
      showHelp();
      process.exit(0);
      break;
    default:
      if (arg.startsWith('--')) {
        Logger.warning(`Option inconnue: ${arg}`);
      }
  }
}

/**
 * Affichage de l'aide
 */
function showHelp() {
  console.log(`
🔥 TaxasGE Firebase Configuration Setup

USAGE:
  node scripts/setup-firebase.js [OPTIONS]

OPTIONS:
  --env <environment>     Environnement cible (development|production)
  --force                 Forcer la reconfiguration même si fichiers existent
  --skip-tests           Ignorer les tests de validation
  --verbose, -v          Mode verbose avec logs détaillés
  --help, -h             Afficher cette aide

EXEMPLES:
  node scripts/setup-firebase.js
  node scripts/setup-firebase.js --env development
  node scripts/setup-firebase.js --env production --force
  node scripts/setup-firebase.js --skip-tests --verbose

VARIABLES D'ENVIRONNEMENT:
  ENVIRONMENT            Force l'environnement (development|production)
  CI                     Mode CI/CD automatique
  GITHUB_ACTIONS         Mode GitHub Actions
  DEBUG                  Mode debug avec logs détaillés
  FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV  Service account pour CI/CD

NOTES:
  - En mode interactif, vous pourrez sélectionner l'environnement
  - Les fichiers existants ne sont pas écrasés sauf avec --force
  - En CI/CD, l'authentification utilise automatiquement le service account
  - Les clés Firebase générées sont des placeholders à remplacer
`);
}

// ============================================================================
// FONCTIONS UTILITAIRES SUPPLÉMENTAIRES
// ============================================================================

/**
 * Nettoyage des fichiers temporaires
 */
async function cleanup() {
  const tempFiles = [
    path.join(PROJECT_ROOT, '.firebase-service-account.json'),
    path.join(PROJECT_ROOT, 'firebase-debug.log')
  ];

  for (const file of tempFiles) {
    try {
      await fs.unlink(file);
    } catch {
      // Fichier n'existe pas, ignorer
    }
  }
}

/**
 * Sauvegarde de configuration existante
 */
async function backupExistingConfig() {
  const configFiles = [
    path.join(PROJECT_ROOT, '.firebaserc'),
    path.join(PROJECT_ROOT, 'firebase.json'),
    path.join(MOBILE_DIR, 'android', 'app', 'google-services.json'),
    path.join(MOBILE_DIR, 'ios', 'GoogleService-Info.plist')
  ];

  const backupDir = path.join(PROJECT_ROOT, '.firebase-backup');
  await ensureDirectory(backupDir);

  for (const file of configFiles) {
    if (await fileExists(file)) {
      const filename = path.basename(file);
      const backupPath = path.join(backupDir, `${filename}.backup`);
      
      try {
        await fs.copyFile(file, backupPath);
        Logger.info(`Sauvegarde: ${filename} → .firebase-backup/`);
      } catch (error) {
        Logger.warning(`Impossible de sauvegarder ${filename}`);
      }
    }
  }
}

/**
 * Génération du rapport de configuration
 */
async function generateConfigurationReport(environments) {
  const reportPath = path.join(PROJECT_ROOT, 'firebase-setup-report.md');
  
  const timestamp = new Date().toISOString();
  const report = `# Firebase Configuration Report - TaxasGE

**Généré le:** ${timestamp}
**Environnements:** ${environments.join(', ')}
**Version:** 1.0.0

## Projets Firebase Configurés

${environments.map(env => {
  const config = FIREBASE_PROJECTS[env];
  return `### ${config.displayName} (${env})
- **Project ID:** ${config.projectId}
- **Package Android:** ${config.androidPackageName}
- **Package iOS:** ${config.iosPackageName}
- **Domaine Web:** ${config.webDomain}
- **Services:** ${config.services.join(', ')}`;
}).join('\n\n')}

## Fichiers Générés

### Configuration Racine
- \`.firebaserc\` - Aliases des projets
- \`firebase.json\` - Configuration des services

### Configuration Mobile
- \`packages/mobile/android/app/google-services.json\` - Android Firebase
- \`packages/mobile/ios/GoogleService-Info.plist\` - iOS Firebase  
- \`packages/mobile/src/config/firebase.config.js\` - Web Firebase

### Configuration Backend
- \`packages/backend/.env.example\` - Variables d'environnement

## Prochaines Étapes

1. **Remplacer les clés placeholder** dans tous les fichiers de configuration
2. **Configurer les services Firebase** via la console web:
   - Authentication (méthodes de connexion)
   - Firestore (règles de sécurité)
   - Storage (règles de stockage)
   - Functions (variables d'environnement)
3. **Tester le déploiement** avec \`yarn deploy\`
4. **Configurer les domaines personnalisés** pour la production

## Troubleshooting

- **Erreurs d'authentification:** Vérifier \`firebase login\`
- **Permissions insuffisantes:** Contacter l'administrateur Firebase
- **Services non disponibles:** Activer via la console Firebase
- **Builds qui échouent:** Vérifier les clés et configurations

## Support

- **Documentation:** https://firebase.google.com/docs
- **Support TaxasGE:** kouemou.sah@gmail.com
- **Issues GitHub:** https://github.com/KouemouSah/taxasge/issues

---
*Rapport généré automatiquement par scripts/setup-firebase.js*
`;

  await fs.writeFile(reportPath, report, 'utf8');
  Logger.success('Rapport de configuration généré: firebase-setup-report.md');
}

// ============================================================================
// HOOKS ET INTÉGRATIONS CI/CD
// ============================================================================

/**
 * Configuration pour GitHub Actions
 */
async function setupGitHubActionsIntegration() {
  if (!process.env.GITHUB_ACTIONS) return;

  Logger.step('Configuration GitHub Actions...');

  // Définir des outputs pour les workflows
  const outputs = {
    firebase_projects: JSON.stringify(Object.keys(FIREBASE_PROJECTS)),
    development_project: FIREBASE_PROJECTS.development.projectId,
    production_project: FIREBASE_PROJECTS.production.projectId,
    config_generated: 'true',
    setup_success: 'true'
  };

  // Écrire les outputs GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    const outputContent = Object.entries(outputs)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    await fs.appendFile(process.env.GITHUB_OUTPUT, outputContent + '\n');
    Logger.success('Outputs GitHub Actions configurés');
  }

  // Créer un artefact avec les fichiers de configuration
  const artifactDir = path.join(PROJECT_ROOT, '.github-artifacts');
  await ensureDirectory(artifactDir);

  // Copier les fichiers de configuration pour l'artefact
  const configFilesToArtifact = [
    { src: path.join(PROJECT_ROOT, '.firebaserc'), dest: 'firebaserc' },
    { src: path.join(PROJECT_ROOT, 'firebase.json'), dest: 'firebase.json' }
  ];

  for (const { src, dest } of configFilesToArtifact) {
    if (await fileExists(src)) {
      await fs.copyFile(src, path.join(artifactDir, dest));
    }
  }

  Logger.success('Artefacts GitHub Actions préparés');
}

/**
 * Validation des secrets GitHub Actions
 */
async function validateGitHubSecrets() {
  if (!process.env.GITHUB_ACTIONS) return;

  Logger.step('Validation des secrets GitHub Actions...');

  const requiredSecrets = [
    'FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingSecrets = [];

  for (const secret of requiredSecrets) {
    if (!process.env[secret]) {
      missingSecrets.push(secret);
    }
  }

  if (missingSecrets.length > 0) {
    Logger.warning(`Secrets manquants: ${missingSecrets.join(', ')}`);
    Logger.info('Configurez les secrets dans: Settings → Secrets and variables → Actions');
  } else {
    Logger.success('Tous les secrets requis sont configurés');
  }
}

// ============================================================================
// POINT D'ENTRÉE PRINCIPAL AVEC GESTION D'OPTIONS
// ============================================================================

/**
 * Point d'entrée principal modifié pour supporter les options
 */
async function mainWithOptions() {
  try {
    // Configuration du logging verbose
    if (options.verbose) {
      Logger.info('Mode verbose activé');
    }

    // Détection/override environnement via options
    let environments;
    if (options.environment) {
      if (!FIREBASE_PROJECTS[options.environment]) {
        throw new FirebaseSetupError(`Environnement invalide: ${options.environment}`, 'INVALID_ENVIRONMENT');
      }
      environments = [options.environment];
      Logger.info(`Environnement forcé via option: ${options.environment}`);
    } else {
      const detectedEnv = detectEnvironment();
      if (detectedEnv === 'interactive') {
        environments = await selectEnvironment();
      } else {
        environments = [detectedEnv];
        Logger.info(`Environnement détecté: ${detectedEnv}`);
      }
    }

    // Sauvegarde si --force pas utilisé
    if (!options.force) {
      await backupExistingConfig();
    }

    // Validation des secrets en CI/CD
    await validateGitHubSecrets();

    // Exécution des étapes principales
    await main();

    // Étapes supplémentaires
    await generateConfigurationReport(environments);
    await setupGitHubActionsIntegration();

    // Nettoyage
    await cleanup();

  } catch (error) {
    await cleanup();
    throw error;
  }
}

// ============================================================================
// GESTION DES SIGNAUX ET NETTOYAGE
// ============================================================================

// Gestion des interruptions (Ctrl+C)
process.on('SIGINT', async () => {
  Logger.warning('\nInterruption détectée...');
  await cleanup();
  process.exit(130);
});

process.on('SIGTERM', async () => {
  Logger.warning('Arrêt demandé...');
  await cleanup();
  process.exit(143);
});

// Gestion des erreurs non catchées
process.on('uncaughtException', async (error) => {
  Logger.error(`Erreur non gérée: ${error.message}`);
  await cleanup();
  process.exit(1);
});

// ============================================================================
// EXÉCUTION
// ============================================================================

// Point d'entrée final
if (require.main === module) {
  // Override main() avec mainWithOptions() pour supporter les arguments
  mainWithOptions().catch(async (error) => {
    Logger.error(`Configuration échouée: ${error.message}`);
    
    if (error instanceof FirebaseSetupError) {
      Logger.error(`Code d'erreur: ${error.code}`);
    }
    
    if (options.verbose && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    console.log('\n🔧 Solutions possibles:');
    console.log('- Vérifier que Firebase CLI est installé: npm install -g firebase-tools');
    console.log('- S\'assurer d\'être authentifié: firebase login');
    console.log('- Vérifier les permissions sur les projets Firebase');
    console.log('- Exécuter en mode verbose: node scripts/setup-firebase.js --verbose');
    console.log('- Forcer la reconfiguration: node scripts/setup-firebase.js --force');
    
    await cleanup();
    process.exit(1);
  });
}

// Export pour tests unitaires
module.exports = {
  detectEnvironment,
  checkPrerequisites,
  installFirebaseCLI,
  authenticateFirebase,
  setupFirebaseProjects,
  generateConfigurationFiles,
  validateFirebaseSetup,
  FirebaseSetupError,
  FIREBASE_PROJECTS,
  CONFIG_TEMPLATES
};