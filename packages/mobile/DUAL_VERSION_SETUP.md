# TaxasGE Mobile - Dual-Version Architecture Setup

## Vue d'Ensemble

TaxasGE Mobile supporte deux versions de l'application construites à partir de la **même base de code** :

| Version | Description | Auth | Sync | Tables | Use Case |
|---------|-------------|------|------|--------|----------|
| **Offline** | Version légère sans authentification | ❌ Non | Mensuelle (download only) | 4 tables publiques | Consultation services, calculs rapides |
| **Pro** | Version complète avec authentification | ✅ Requis | Instantanée (bidirectionnelle) | 8+ tables (user data) | Déclarations, paiements, profils |

## Architecture

### Configuration Build-Time

La version est déterminée au **moment du build** via des variables d'environnement:

```
Build Offline → .env.offline → APP_VERSION=offline
Build Pro     → .env.pro     → APP_VERSION=pro
```

### Fichiers de Configuration

#### 1. Fichiers `.env`

**`.env.offline`**
```env
APP_VERSION=offline
APP_NAME=TaxasGE Offline
BUNDLE_ID=com.taxasge.offline

SYNC_MODE=monthly
SYNC_INTERVAL=2592000000
ENABLE_CLOUD_SYNC=false
ENABLE_REALTIME_SYNC=false

ENABLE_DECLARATIONS=false
ENABLE_USER_PROFILES=false
REQUIRE_AUTH=false

SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

DEFAULT_USER_ID=offline_user_local
```

**`.env.pro`**
```env
APP_VERSION=pro
APP_NAME=TaxasGE Pro
BUNDLE_ID=com.taxasge.pro

SYNC_MODE=instant
SYNC_INTERVAL=0
ENABLE_CLOUD_SYNC=true
ENABLE_REALTIME_SYNC=true

ENABLE_DECLARATIONS=true
ENABLE_USER_PROFILES=true
REQUIRE_AUTH=true

SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

DEFAULT_USER_ID=
```

#### 2. Configuration Centralisée

**`src/config/AppConfig.js`**

Module central qui:
- Lit les variables d'environnement via `@env`
- Exporte `APP_CONFIG` object avec toute la configuration
- Fournit des fonctions helpers:
  - `getSyncTables()` - Retourne les tables à synchroniser
  - `getUserId(authenticatedUserId)` - Gère les user IDs
  - `getSyncStrategy()` - Retourne la stratégie de sync
  - `isFeatureEnabled(featureName)` - Check feature flags
  - `logConfiguration()` - Debug logging

**Type-safe avec TypeScript** (`src/config/AppConfig.d.ts`)

## Tables Synchronisées

### Version Offline (4 tables)

```typescript
[
  'fiscal_services',       // 7,561 services fiscaux
  'entity_translations',   // 9,445 traductions (ES→FR/EN)
  'ministries',            // 14 ministères
  'categories',            // 105 catégories
]
```

**Caractéristiques**:
- Données publiques read-only
- Sync download-only (Supabase → SQLite)
- Pas de données utilisateur
- User ID: `offline_user_local`

### Version Pro (8+ tables)

```typescript
[
  // Public reference (same as offline)
  'fiscal_services',
  'entity_translations',
  'ministries',
  'categories',

  // User-specific data (Pro only)
  'user_favorites',        // Favoris utilisateur
  'calculation_history',   // Historique calculs
  'declarations',          // Déclarations fiscales
  'user_profiles',         // Profils utilisateur
]
```

**Caractéristiques**:
- Sync bidirectionnelle (SQLite ↔ Supabase)
- Données utilisateur avec auth
- User ID: authenticated user ID
- Queue offline pour actions user

## Scripts NPM

### Développement

```bash
# Offline version
npm run android:offline   # Android emulator
npm run ios:offline       # iOS simulator

# Pro version
npm run android:pro       # Android emulator
npm run ios:pro           # iOS simulator
```

### Production Build

```bash
# Offline version
npm run build:android:offline  # APK/AAB offline
npm run build:ios:offline      # IPA offline

# Pro version
npm run build:android:pro      # APK/AAB pro
npm run build:ios:pro          # IPA pro
```

### Metro Bundler

```bash
# Offline version
npm run start:offline

# Pro version
npm run start:pro
```

## Workflow Développement

### 1. Développer Offline Version

```bash
# Terminal 1: Start Metro with .env.offline
npm run start:offline

# Terminal 2: Run Android
npm run android:offline
```

**Comportement attendu**:
- App name: "TaxasGE Offline"
- Status: "📱 Offline Version | 🔓 No Auth"
- Console logs: `[AppConfig] Version: offline`
- Sync: Only 4 tables
- User ID: `offline_user_local`

### 2. Développer Pro Version

```bash
# Terminal 1: Start Metro with .env.pro
npm run start:pro

# Terminal 2: Run Android
npm run android:pro
```

**Comportement attendu**:
- App name: "TaxasGE Pro"
- Status: "🌐 Pro Version | 🔒 Auth Required"
- Console logs: `[AppConfig] Version: pro`
- Sync: 8+ tables
- User ID: authenticated (or null if not logged in)

### 3. Tester la Synchronisation

**Offline Version**:
```typescript
// Console logs attendus
[AppConfig] Version: offline
[AppConfig] Sync Mode: monthly
[Sync] Tables to sync: ["fiscal_services", "entity_translations", "ministries", "categories"]
[Sync] Direction: download
```

**Pro Version**:
```typescript
// Console logs attendus
[AppConfig] Version: pro
[AppConfig] Sync Mode: instant
[Sync] Tables to sync: ["fiscal_services", ..., "user_favorites", "calculation_history"]
[Sync] Direction: bidirectional
```

## Gestion User ID

### Offline Version

```javascript
import { getUserId } from './config/AppConfig';

const userId = getUserId();
// Retourne toujours: "offline_user_local"

// Usage dans les requêtes
const favorites = await db.query(
  'SELECT * FROM user_favorites WHERE user_id = ?',
  [userId]
);
```

### Pro Version

```javascript
import { getUserId } from './config/AppConfig';

// Sans authentification
const userId = getUserId();
// Retourne: null

// Avec authentification
const authenticatedUserId = '123e4567-e89b-12d3-a456-426614174000'; // from auth system
const userId = getUserId(authenticatedUserId);
// Retourne: "123e4567-e89b-12d3-a456-426614174000"

// Usage conditionnel
if (APP_CONFIG.requireAuth && !userId) {
  // Redirect to login
  navigation.navigate('Login');
}
```

## Feature Flags

Check feature availability dynamically:

```javascript
import { isFeatureEnabled } from './config/AppConfig';

// Check if declarations are enabled
if (isFeatureEnabled('declarations')) {
  // Show "Declarations" menu
}

// Check if auth is required
if (isFeatureEnabled('auth')) {
  // Show login/logout buttons
}
```

## Debugging

### Console Logging

La configuration est automatiquement loggée au démarrage de l'app:

```javascript
[AppConfig] ========================================
[AppConfig] TaxasGE Mobile Configuration
[AppConfig] ========================================
[AppConfig] Version: offline
[AppConfig] App Name: TaxasGE Offline
[AppConfig] Bundle ID: com.taxasge.offline
[AppConfig] ========================================
[AppConfig] Sync Mode: monthly
[AppConfig] Sync Interval: 2592000000 ms
[AppConfig] Cloud Sync: false
[AppConfig] Realtime Sync: false
[AppConfig] ========================================
[AppConfig] Require Auth: false
[AppConfig] Declarations: false
[AppConfig] User Profiles: false
[AppConfig] ========================================
[AppConfig] Default User ID: offline_user_local
[AppConfig] Sync Tables: ["fiscal_services", "entity_translations", ...]
[AppConfig] ========================================
```

### Forcer un Reload

Si les changements de `.env` ne sont pas pris en compte:

```bash
# Clear Metro cache
npm start -- --reset-cache

# Clear Android build
cd android && ./gradlew clean && cd ..

# Clear iOS build (macOS only)
cd ios && rm -rf Pods && pod install && cd ..
```

## Production Deployment

### Android

1. **Build Offline APK**
```bash
ENVFILE=.env.offline cd android && ./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

2. **Build Pro APK**
```bash
ENVFILE=.env.pro cd android && ./gradlew assembleRelease
```

3. **Renommer les APKs**
```bash
mv app-release.apk taxasge-offline-v1.0.0.apk
mv app-release.apk taxasge-pro-v1.0.0.apk
```

4. **Upload to Google Play**
- Offline version: Bundle ID `com.taxasge.offline`
- Pro version: Bundle ID `com.taxasge.pro`

### iOS

1. **Build Offline IPA**
```bash
ENVFILE=.env.offline cd ios && xcodebuild archive
```

2. **Build Pro IPA**
```bash
ENVFILE=.env.pro cd ios && xcodebuild archive
```

3. **Upload to App Store**
- Offline version: Bundle ID `com.taxasge.offline`
- Pro version: Bundle ID `com.taxasge.pro`

## Troubleshooting

### Problème: .env variables non chargées

**Symptômes**: App utilise toujours la même config malgré changement de `.env`

**Solutions**:
1. Clear Metro cache: `npm start -- --reset-cache`
2. Vérifier `babel.config.js` contient le plugin `module:react-native-dotenv`
3. Redémarrer Metro complètement (kill process)

### Problème: Mauvaises tables synchronisées

**Symptômes**: Version Offline sync trop de tables

**Solutions**:
1. Vérifier console logs: `[Sync] Tables to sync: [...]`
2. Vérifier `.env.offline` est bien utilisé: `ENVFILE=.env.offline`
3. Vérifier `AppConfig.js` retourne les bonnes tables pour la version

### Problème: User ID toujours "offline_user_local" en Pro

**Symptômes**: Pro version utilise user ID offline

**Solutions**:
1. Vérifier `.env.pro` a `APP_VERSION=pro`
2. Vérifier console logs: `[AppConfig] Version: pro`
3. Vérifier `getUserId()` reçoit bien l'authenticated user ID

## Best Practices

### 1. Ne Jamais Hardcoder la Configuration

❌ **Mauvais**:
```javascript
if (version === 'offline') {
  syncTables = ['fiscal_services', 'ministries'];
}
```

✅ **Bon**:
```javascript
import { getSyncTables } from './config/AppConfig';
const syncTables = getSyncTables();
```

### 2. Toujours Utiliser getUserId()

❌ **Mauvais**:
```javascript
const userId = 'offline_user_local';
```

✅ **Bon**:
```javascript
import { getUserId } from './config/AppConfig';
const userId = getUserId(authenticatedUserId);
```

### 3. Checker Feature Flags

❌ **Mauvais**:
```javascript
// Show declarations menu for everyone
<MenuItem title="Declarations" />
```

✅ **Bon**:
```javascript
import { isFeatureEnabled } from './config/AppConfig';

{isFeatureEnabled('declarations') && (
  <MenuItem title="Declarations" />
)}
```

### 4. Tester les Deux Versions

Avant chaque release:
1. Tester version Offline: `npm run android:offline`
2. Tester version Pro: `npm run android:pro`
3. Vérifier console logs configuration
4. Vérifier tables synchronisées
5. Vérifier user ID

## Migration Guide

Si vous avez du code existant utilisant configuration hardcodée:

### Avant

```javascript
// hardcoded
const userId = 'default_user';
const syncTables = ['fiscal_services', 'ministries'];
```

### Après

```javascript
import { getUserId, getSyncTables } from './config/AppConfig';

const userId = getUserId();
const syncTables = getSyncTables();
```

## Support & Documentation

- **Configuration**: `src/config/AppConfig.js`
- **Types**: `src/config/AppConfig.d.ts`
- **Environment**: `src/types/env.d.ts`
- **Babel**: `babel.config.js`
- **Scripts**: `package.json`

---

**Version**: 1.0.0
**Date**: 2025-11-06
**Author**: TaxasGE Development Team
