# Plan Complet - Initialisation React Native 0.80.0
## Migration 0.73.9 → 0.80.0 avec Validation Émulateurs & Workflows

**Date de création**: 2025-10-07
**Version source**: React Native 0.73.9
**Version cible**: React Native 0.80.0
**Durée estimée totale**: 3h30

---

## ✅ Phase 0 : Préparation & Backup (30 min) - COMPLÉTÉE

### Objectif
Sauvegarder état actuel, installer prérequis

### Tâches Complétées
- ✅ Backup complet `packages/mobile/` (77M + 5.0M)
- ✅ Node.js 20.19.5 installé
- ✅ npm 10.8.2 validé
- ✅ Java JDK 17.0.12 LTS configuré
- ✅ Android SDK 35 + Build Tools 35.0.0 installés
- ✅ Variables d'environnement configurées

### KPIs Validés (6/6)
| KPI | Critère | Résultat | Statut |
|-----|---------|----------|--------|
| Backup | Archive existe | 2 backups créés | ✅ PASS |
| Node.js | ≥20.0.0 | v20.19.5 | ✅ PASS |
| npm | ≥10.0.0 | 10.8.2 | ✅ PASS |
| Java JDK | 17 ou 21 | 17.0.12 LTS | ✅ PASS |
| Android SDK 35 | Installé | android-35 présent | ✅ PASS |
| Build Tools 35.0.0 | Installé | 35.0.0 disponible | ✅ PASS |

**Statut**: ✅ **COMPLÉTÉE** - Prêt pour Phase 1

---

## 🔄 Phase 1 : Nettoyage & Migration Dependencies (45 min)

### Objectif
Nettoyer environnement et migrer vers RN 0.80.0

### Tâches
1. **Nettoyer caches et modules**
   ```bash
   cd packages/mobile
   rm -rf node_modules
   rm -rf android/.gradle
   rm -rf android/app/build
   rm -rf ios/build
   rm -rf ios/Pods
   npm cache clean --force
   ```

2. **Mettre à jour package.json**
   ```json
   {
     "dependencies": {
       "react": "18.3.1",
       "react-native": "0.80.0"
     },
     "devDependencies": {
       "@react-native/babel-preset": "0.80.0",
       "@react-native/eslint-config": "0.80.0",
       "@react-native/metro-config": "0.80.0",
       "@react-native/typescript-config": "0.80.0"
     }
   }
   ```

3. **Installer nouvelles dépendances**
   ```bash
   npm install
   ```

4. **Vérifier compatibilité packages tiers**
   - @react-native-community/netinfo
   - @reduxjs/toolkit
   - @supabase/supabase-js
   - react-native-sqlite-storage
   - Autres packages critiques

### KPIs de Validation Phase 1
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| Nettoyage complet | Dossiers supprimés | `ls node_modules` → erreur | 0 fichiers |
| React Native version | 0.80.0 installé | `npm list react-native` | 0.80.0 |
| React version | 18.3.1 | `npm list react` | 18.3.1 |
| Dépendances installées | Pas d'erreurs npm | `npm install` exit code | 0 |
| Packages compatibles | Pas de peer dependency warnings | Logs npm | 0 warnings critiques |
| Metro config | Nouvelle version | Fichier existe | 0.80.0 |

**Critère de Blocage**: Si npm install échoue avec erreurs critiques → STOP, résoudre conflicts

---

## 🔄 Phase 2 : Configuration Android (40 min)

### Objectif
Adapter configuration Android pour RN 0.80.0

### Tâches

1. **Mettre à jour android/build.gradle**
   ```gradle
   buildscript {
       ext {
           buildToolsVersion = "35.0.0"
           minSdkVersion = 24
           compileSdkVersion = 35
           targetSdkVersion = 35
           ndkVersion = "26.1.10909125"
           kotlinVersion = "1.9.22"
       }
       dependencies {
           classpath("com.android.tools.build:gradle:8.3.0")
           classpath("com.facebook.react:react-native-gradle-plugin")
           classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
       }
   }
   ```

2. **Mettre à jour android/gradle/wrapper/gradle-wrapper.properties**
   ```properties
   distributionUrl=https\://services.gradle.org/distributions/gradle-8.6-all.zip
   ```

3. **Mettre à jour android/app/build.gradle**
   ```gradle
   android {
       compileSdkVersion 35
       buildToolsVersion "35.0.0"

       defaultConfig {
           minSdkVersion 24
           targetSdkVersion 35
       }
   }
   ```

4. **Activer New Architecture (optionnel mais recommandé pour RN 0.80)**
   ```properties
   # android/gradle.properties
   newArchEnabled=true
   ```

5. **Nettoyer et synchroniser Gradle**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew --stop
   ```

### KPIs de Validation Phase 2
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| Gradle version | 8.6 | `./gradlew --version` | 8.6 |
| Build Tools | 35.0.0 | build.gradle | 35.0.0 |
| compileSdk | 35 | app/build.gradle | 35 |
| targetSdk | 35 | app/build.gradle | 35 |
| Gradle sync | Succès | `./gradlew tasks` exit code | 0 |
| New Architecture | Activée | gradle.properties | true |

**Critère de Blocage**: Si Gradle sync échoue → STOP, résoudre configuration

---

## 🔄 Phase 3 : Configuration iOS (30 min - si macOS)

### Objectif
Adapter configuration iOS pour RN 0.80.0

### Tâches

1. **Mettre à jour ios/Podfile**
   ```ruby
   platform :ios, '13.4'

   use_react_native!(
     :path => config[:reactNativePath],
     :hermes_enabled => true,
     :fabric_enabled => true,
     :new_arch_enabled => true
   )
   ```

2. **Installer pods**
   ```bash
   cd ios
   pod deintegrate
   pod install
   ```

3. **Mettre à jour Xcode project settings**
   - iOS Deployment Target: 13.4
   - Build Active Architecture Only: No (Release)

### KPIs de Validation Phase 3
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| CocoaPods version | ≥1.13.0 | `pod --version` | 1.13.0+ |
| Pod install | Succès | Exit code | 0 |
| Hermes activé | true | Podfile | enabled |
| New Architecture | true | Podfile | enabled |
| iOS min version | 13.4 | Podfile | 13.4 |

**Note**: Phase 3 SKIP si environnement Windows (pas de macOS/Xcode)

---

## 🔄 Phase 4 : Migration du Code Source (45 min)

### Objectif
Adapter code source aux breaking changes RN 0.80.0

### Tâches

1. **Mettre à jour imports deprecated**
   - Remplacer `PropTypes` par TypeScript types
   - Mettre à jour imports React Native components
   - Adapter navigateurs (React Navigation)

2. **Vérifier TypeScript configuration**
   ```json
   // tsconfig.json - Étendre @react-native/typescript-config
   {
     "extends": "@react-native/typescript-config/tsconfig.json",
     "compilerOptions": {
       "strict": true
     }
   }
   ```

3. **Mettre à jour babel.config.js**
   ```js
   module.exports = {
     presets: ['module:@react-native/babel-preset'],
   };
   ```

4. **Mettre à jour metro.config.js**
   ```js
   const {getDefaultConfig} = require('@react-native/metro-config');
   const config = getDefaultConfig(__dirname);
   module.exports = config;
   ```

5. **Tester compilation TypeScript**
   ```bash
   npx tsc --noEmit
   ```

### KPIs de Validation Phase 4
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| TypeScript compile | Pas d'erreurs | `npx tsc --noEmit` | 0 erreurs |
| ESLint | Pas d'erreurs critiques | `npm run lint:check` | 0 erreurs |
| Imports valides | Pas de deprecated warnings | Logs compilation | 0 warnings |
| Metro bundler | Démarre sans erreur | `npm start` | Succès |

**Critère de Blocage**: Si TypeScript errors > 10 → STOP, refactoring nécessaire

---

## 🔄 Phase 5 : Lancement Émulateur Android (30 min)

### Objectif
Lancer app sur émulateur Android et valider fonctionnement

### Tâches

1. **Créer/Démarrer AVD (Android Virtual Device)**
   ```bash
   # Lister AVDs disponibles
   emulator -list-avds

   # Créer nouveau AVD si nécessaire
   avdmanager create avd -n RN080_Test -k "system-images;android-35;google_apis;x86_64"

   # Démarrer émulateur
   emulator -avd RN080_Test &
   ```

2. **Vérifier émulateur connecté**
   ```bash
   adb devices
   # Résultat attendu: emulator-5554 device
   ```

3. **Build et installer app**
   ```bash
   cd packages/mobile
   npm run android
   ```

4. **Vérifier logs Metro**
   ```bash
   npm start
   # Observer logs sans erreurs
   ```

5. **Tests fonctionnels manuels**
   - App démarre sans crash
   - Écran d'accueil s'affiche
   - Navigation fonctionne
   - Hot reload fonctionne (Ctrl+M → Reload)

### KPIs de Validation Phase 5
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| AVD créé | Émulateur existe | `emulator -list-avds` | ≥1 AVD |
| Émulateur démarré | Device connecté | `adb devices` | 1 device |
| Build Android | Succès | `npm run android` exit code | 0 |
| App installée | APK présent | `adb shell pm list packages` | com.taxasge.mobile |
| App démarre | Pas de crash | Observation visuelle | Écran visible |
| Metro bundler | Actif | `curl http://localhost:8081/status` | "packager-status":"running" |
| Hot reload | Fonctionne | Modifier fichier + reload | Changement visible |

**Critère de Blocage**: Si app crash au démarrage → STOP, analyser logcat

---

## 🔄 Phase 6 : Lancement Device Physique Android (20 min)

### Objectif
Lancer app sur device Android physique

### Tâches

1. **Activer mode développeur sur device**
   - Paramètres → À propos → Taper 7x sur "Numéro de build"
   - Activer "Débogage USB"

2. **Connecter device en USB**
   ```bash
   adb devices
   # Résultat: [serial_number] device
   ```

3. **Installer app sur device**
   ```bash
   npm run android
   # Sélectionner device physique si plusieurs devices
   ```

4. **Tests fonctionnels**
   - App démarre
   - Performance fluide
   - Fonctionnalités offline testées

### KPIs de Validation Phase 6
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| Device connecté | USB debugging activé | `adb devices` | 1 device physique |
| App installée | APK déployé | Installation visuelle | Succès |
| App démarre | Pas de crash | Lancement | Écran visible |
| Performance | FPS stable | Observation | ≥50 FPS |
| Offline mode | DB locale fonctionne | Test hors ligne | Données accessibles |

**Critère de Blocage**: Si device non reconnu → Vérifier drivers USB

---

## 🔄 Phase 7 : Tests & Validation Workflows (30 min)

### Objectif
Exécuter tests automatisés et valider qualité

### Tâches

1. **Exécuter tests unitaires**
   ```bash
   npm test
   ```

2. **Exécuter tests avec coverage**
   ```bash
   npm run test:coverage
   ```

3. **Linter code**
   ```bash
   npm run lint:check
   npm run format:check
   ```

4. **Build production Android**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

5. **Vérifier APK généré**
   ```bash
   ls -lh android/app/build/outputs/apk/release/
   # Vérifier taille APK raisonnable
   ```

### KPIs de Validation Phase 7
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| Tests unitaires | Tous passent | `npm test` | 100% pass |
| Code coverage | ≥70% | `npm run test:coverage` | 70% |
| ESLint | 0 erreurs | `npm run lint:check` | 0 errors |
| Prettier | Formaté | `npm run format:check` | 0 warnings |
| Build release | Succès | `./gradlew assembleRelease` | 0 errors |
| APK taille | Raisonnable | Taille fichier | <50MB |
| APK signé | Release valide | Vérification signature | Valide |

**Critère de Blocage**: Si tests coverage < 70% → WARNING (non-bloquant mais à améliorer)

---

## 🔄 Phase 8 : Documentation & Finalisation (20 min)

### Objectif
Documenter migration et créer rapport final

### Tâches

1. **Créer rapport de migration**
   - Documenter changements effectués
   - Lister breaking changes résolus
   - Notes de version

2. **Mettre à jour README.md**
   ```markdown
   ## Version
   React Native: 0.80.0
   React: 18.3.1
   Node.js: ≥20.0.0

   ## Installation
   npm install
   npm run android / npm run ios
   ```

3. **Mettre à jour CHANGELOG.md**
   ```markdown
   ## [1.0.0] - 2025-10-07
   ### Changed
   - Migré React Native 0.73.9 → 0.80.0
   - Activé New Architecture
   - Mis à jour Android SDK 35
   ```

4. **Créer guide de rollback**
   ```bash
   # Si problèmes, restaurer backup:
   cd packages/mobile
   tar -xzf ../../.backups/mobile-backup-0.73.9-[timestamp].tar.gz
   ```

### KPIs de Validation Phase 8
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| Rapport migration | Créé | Fichier existe | 1 fichier |
| README.md | Mis à jour | Version mentionnée | 0.80.0 |
| CHANGELOG.md | Complété | Entrée migration | 1 entrée |
| Guide rollback | Documenté | Instructions claires | Complet |

---

## 📊 Résumé Global - KPIs Finaux

### Validation Technique
| Catégorie | KPI | Seuil | Priorité |
|-----------|-----|-------|----------|
| **Build** | Android build success | 100% | CRITIQUE |
| **Tests** | Unit tests pass rate | 100% | CRITIQUE |
| **Coverage** | Code coverage | ≥70% | HAUTE |
| **Linting** | ESLint errors | 0 | HAUTE |
| **Performance** | App startup time | <3s | MOYENNE |
| **Taille APK** | Release APK size | <50MB | MOYENNE |

### Validation Fonctionnelle
| Fonctionnalité | Test | Statut Attendu |
|----------------|------|----------------|
| Démarrage app | Lancement émulateur | ✅ Écran visible |
| Navigation | Parcourir écrans | ✅ Transitions fluides |
| Offline mode | Désactiver réseau | ✅ Données locales OK |
| Hot reload | Modifier code | ✅ Reload auto |
| Database locale | SQLite queries | ✅ Données persistées |
| Authentification | Login flow | ✅ JWT valide |

---

## 🚨 Points de Blocage Critiques

### STOP Conditions
1. **Node.js < 20.0.0** → Installer Node 20 LTS
2. **npm install fails** → Résoudre dependency conflicts
3. **Gradle sync fails** → Vérifier configuration Android
4. **TypeScript errors > 10** → Refactoring code requis
5. **App crash on launch** → Analyser logs, rollback si nécessaire

### Rollback Procedure
```bash
# En cas d'échec critique:
cd packages/mobile
rm -rf *
tar -xzf ../../.backups/mobile-backup-0.73.9-[timestamp].tar.gz
npm install
npm start
```

---

## 📈 Timeline Estimée

| Phase | Durée | Statut |
|-------|-------|--------|
| Phase 0: Préparation | 30 min | ✅ COMPLÉTÉE |
| Phase 1: Nettoyage & Dependencies | 45 min | 🔄 PROCHAINE |
| Phase 2: Configuration Android | 40 min | ⏳ En attente |
| Phase 3: Configuration iOS | 30 min | ⏸️ Skip (Windows) |
| Phase 4: Migration Code | 45 min | ⏳ En attente |
| Phase 5: Émulateur Android | 30 min | ⏳ En attente |
| Phase 6: Device Physique | 20 min | ⏳ En attente |
| Phase 7: Tests & Workflows | 30 min | ⏳ En attente |
| Phase 8: Documentation | 20 min | ⏳ En attente |
| **TOTAL** | **3h30** | **20% complété** |

---

## ✅ Checklist Finale de Validation

Avant de considérer la migration terminée, valider:

- [ ] Node.js 20.x installé
- [ ] React Native 0.80.0 installé
- [ ] Android SDK 35 + Build Tools 35.0.0
- [ ] Gradle 8.6 configuré
- [ ] New Architecture activée
- [ ] TypeScript compile sans erreurs
- [ ] ESLint 0 erreurs
- [ ] Tests unitaires 100% pass
- [ ] Code coverage ≥70%
- [ ] Build Android release réussi
- [ ] APK < 50MB
- [ ] App démarre sur émulateur
- [ ] App démarre sur device physique
- [ ] Hot reload fonctionne
- [ ] Offline mode fonctionne
- [ ] Navigation fluide
- [ ] Database locale opérationnelle
- [ ] Metro bundler stable
- [ ] Documentation mise à jour

---

**Statut Actuel**: ✅ Phase 0 COMPLÉTÉE - Prêt pour Phase 1

**Prochaine Action**: Démarrer Phase 1 - Nettoyage & Migration Dependencies
