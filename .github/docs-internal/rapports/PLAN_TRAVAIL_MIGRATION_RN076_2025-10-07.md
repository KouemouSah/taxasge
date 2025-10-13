# 📋 PLAN DÉTAILLÉ - MIGRATION REACT NATIVE 0.73.9 → 0.80.0
## TaxasGE Mobile - Initialisation Complète avec Validation Émulateurs & Workflows

---

## 🔍 ANALYSE ÉTAT ACTUEL (CRITIQUE)

### Configuration Existante
| Composant | Version Actuelle | Version Cible | Criticité |
|-----------|------------------|---------------|--------------|
| **React Native** | 0.73.9 | 0.80.0 | 🔴 MAJEURE |
| **React** | 18.3.1 | 18.3.1 | ✅ OK |
| **Node.js** | 18.20.8 | ≥20.0.0 (requis) | 🔴 CRITIQUE |
| **npm** | 10.8.2 | ≥10.0.0 | ✅ OK |
| **Android compileSdk** | 36 | 35 (RN 0.80) | ⚠️ AJUSTER |
| **Android minSdk** | 24 | 24 | ✅ OK |
| **Android targetSdk** | 36 | 35 | ⚠️ AJUSTER |
| **Android buildTools** | 36.0.0 | 35.0.0 | ⚠️ AJUSTER |

### ⚠️ PROBLÈMES CRITIQUES IDENTIFIÉS

1. **Node.js 18.x vs 20.x Required** 🔴
   - package.json exige `node >= 20.0.0`
   - Système actuel: Node 18.20.8
   - **Incompatibilité majeure**

2. **React Native 0.73.9 → 0.80.0 Breaking Changes** 🔴
   - **7 versions de différence** (0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.80)
   - Changements architecture New Architecture (Turbo Modules, Fabric)
   - Metro bundler updates
   - Gradle plugin changes
   - CocoaPods dependencies

3. **Android SDK Versions Mismatch** ⚠️
   - Actuellement: compileSdk 36, targetSdk 36, buildTools 36.0.0
   - RN 0.80 recommande: compileSdk 35, targetSdk 35, buildTools 35.0.0
   - Risque: Incompatibilité avec templates RN 0.80

4. **Source Code Structure** ✅
   - ✅ Code source existe: `src/` avec App.js, database/, services/, etc.
   - ✅ Android/iOS configs présents
   - ✅ node_modules installés
   - ⚠️ Potentiel: Code obsolète nécessitant refactoring

---

## 🎯 STRATÉGIE DE MIGRATION (DÉCISION CRITIQUE)

### Option A: Upgrade Progressif (NON RECOMMANDÉ) ❌
- Passer 0.73.9 → 0.74 → 0.75 → ... → 0.80
- **Durée estimée**: 3-5 jours
- **Risque**: Très élevé (accumulation bugs chaque version)
- **Complexité**: 10/10

### Option B: Clean Install RN 0.80 + Migration Code (RECOMMANDÉ) ✅
- Initialiser projet fresh RN 0.80
- Migrer code source sélectivement
- **Durée estimée**: 1-2 jours
- **Risque**: Modéré (contrôle total)
- **Complexité**: 6/10

### ✅ DÉCISION: Option B (Clean Install)

**Justification critique:**
1. **7 versions = trop de breaking changes** cumulés
2. **Node.js incompatibilité** nécessite refonte anyway
3. **Templates RN 0.80** garantissent config optimale
4. **Code source** déjà bien structuré → migration facile
5. **Tests workflows** plus fiables avec setup propre

---

## 📊 PLAN D'EXÉCUTION DÉTAILLÉ

### 🔵 PHASE 0: PRÉPARATION & BACKUP (30 min)
**Objectif**: Sauvegarder état actuel, installer prérequis

#### Tâches
1. ✅ **Backup complet packages/mobile/**
   - Créer archive `mobile-backup-0.73.9-[timestamp].tar.gz`
   - Sauvegarder dans `.backups/`

2. ✅ **Installer Node.js 20.x LTS**
   - Vérifier version: `node --version` → v20.x.x
   - Vérifier npm: `npm --version` → 10.x.x

3. ✅ **Vérifier environnement Android/iOS**
   - Android SDK installé (SDK 35)
   - Émulateur Android configuré
   - Xcode installé (si macOS)

#### KPIs Validation Phase 0
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| **Backup créé** | Archive existe | `ls .backups/mobile-backup-*.tar.gz` | 1 fichier |
| **Node.js version** | ≥ 20.0.0 | `node --version` | v20.x.x |
| **npm version** | ≥ 10.0.0 | `npm --version` | 10.x.x |
| **Android SDK** | SDK 35 installé | `sdkmanager --list \| grep "platforms;android-35"` | installed |
| **Java JDK** | JDK 17 ou 21 | `java -version` | 17.x ou 21.x |

**Blocage**: Si Node.js < 20.0.0 → STOP, installer d'abord

---

### 🟢 PHASE 1: INITIALISATION RN 0.80.0 CLEAN (45 min)
**Objectif**: Créer projet RN 0.80.0 propre avec structure validée

#### Tâches
1. ✅ **Créer dossier temporaire**
   ```bash
   mkdir -p ../../tmp-mobile-0.80
   cd ../../tmp-mobile-0.80
   ```

2. ✅ **Initialiser RN 0.80.0**
   ```bash
   npx @react-native-community/cli@latest init TaxasGEMobile --version 0.80.0
   ```

3. ✅ **Vérifier template généré**
   - Valider structure: android/, ios/, src/, package.json
   - Vérifier RN version: `grep "react-native" package.json`

4. ✅ **Premier build test (Android)**
   ```bash
   cd TaxasGEMobile
   npm install
   npx react-native run-android
   ```

5. ✅ **Premier build test (iOS - si macOS)**
   ```bash
   cd ios && pod install && cd ..
   npx react-native run-ios
   ```

#### KPIs Validation Phase 1
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| **Template créé** | Projet initialisé | `ls TaxasGEMobile/package.json` | existe |
| **RN version** | 0.80.0 | `cat package.json \| grep "react-native"` | "0.80.0" |
| **Dependencies installées** | node_modules/ | `ls node_modules/react-native` | existe |
| **Android build** | APK généré | `npx react-native run-android` | SUCCESS |
| **iOS build** | App lancée | `npx react-native run-ios` (si macOS) | SUCCESS |
| **Metro bundler** | Démarrage sans erreur | `npm start` | Port 8081 actif |

**Blocage**: Si `run-android` échoue → Vérifier Android SDK 35, émulateur running

---

### 🟡 PHASE 2: MIGRATION CONFIGURATION (60 min)
**Objectif**: Copier configs TaxasGE vers nouveau projet

#### Tâches
1. ✅ **Migrer package.json scripts & deps**
   - Copier dependencies (Supabase, Redux, SQLite, etc.)
   - Copier devDependencies (TypeScript, ESLint, etc.)
   - Adapter scripts (`android`, `ios`, `test`, etc.)
   - **Validation**: `npm install` sans erreurs

2. ✅ **Migrer config Android**
   - `android/app/build.gradle`: package name, signing, firebase
   - `android/build.gradle`: SDK versions
   - `android/gradle.properties`: custom props
   - `android/app/src/main/AndroidManifest.xml`: permissions
   - **Validation**: `cd android && ./gradlew assembleDebug`

3. ✅ **Migrer config iOS**
   - `ios/Podfile`: custom pods
   - `ios/TaxasGE/Info.plist`: permissions, URL schemes
   - **Validation**: `cd ios && pod install`

4. ✅ **Migrer configs tools**
   - `.eslintrc.js` ou `eslint.config.js`
   - `.prettierrc`
   - `tsconfig.json`
   - `babel.config.js`
   - `jest.config.js`

5. ✅ **Migrer Firebase configs**
   - `config/google-services.dev.json`
   - `config/google-services.prod.json`
   - `config/GoogleService-Info.dev.plist`
   - `config/GoogleService-Info.pro.plist`
   - `config/firebase-config.json`

#### KPIs Validation Phase 2
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| **Dependencies OK** | Installation propre | `npm install` | 0 errors, 0 warnings |
| **Android build** | Gradle compile | `cd android && ./gradlew assembleDebug` | BUILD SUCCESSFUL |
| **iOS build** | CocoaPods install | `cd ios && pod install` | Pod installation complete |
| **ESLint** | Pas d'erreurs config | `npm run lint:check` | 0 errors (warnings OK) |
| **TypeScript** | Compilation OK | `npx tsc --noEmit` | 0 errors |
| **Firebase** | Configs valides | Fichiers copiés + validation JSON | 4 fichiers OK |

**Blocage**: Si Gradle échoue → Vérifier package name, SDK versions
**Blocage**: Si pod install échoue → Vérifier Xcode installé, CocoaPods version

---

### 🔵 PHASE 3: MIGRATION CODE SOURCE (90 min)
**Objectif**: Migrer code métier TaxasGE avec refactoring si nécessaire

#### Tâches
1. ✅ **Copier structure src/**
   ```bash
   cp -r ../packages/mobile/src/{assets,config,context,database,hooks,i18n,navigation,providers,services,styles,utils} src/
   ```

2. ✅ **Migrer App.js → App.tsx**
   - Convertir en TypeScript (ou garder .js selon stratégie)
   - Adapter imports pour RN 0.80
   - Valider syntax avec ESLint

3. ✅ **Adapter code obsolète**
   - Remplacer APIs dépréciées RN 0.73 → 0.80
   - Mettre à jour imports React Native
   - Vérifier compatibilité libraries (Supabase, Redux, etc.)

4. ✅ **Migrer database/ (SQLite)**
   - Copier `database/` complet
   - Tester init: `import {initDatabase} from './src/database'`
   - Valider schema création

5. ✅ **Migrer services/**
   - API services (Supabase)
   - Sync services
   - Offline queue
   - Validation: Pas d'erreurs import

6. ✅ **Migrer navigation/**
   - React Navigation configs
   - Screens mapping
   - Deep linking
   - Validation: Navigation fonctionne

#### KPIs Validation Phase 3
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| **Structure src/** | Dossiers copiés | `ls src/` | 12 dossiers présents |
| **App.tsx** | Fichier valide | `npm run lint src/App.tsx` | 0 errors |
| **Imports valides** | Pas d'erreurs | `npx tsc --noEmit` | 0 errors |
| **Database init** | Schema créé | Test manuel `initDatabase()` | Succès |
| **Services import** | Pas d'erreurs | `npm start` | Metro démarre |
| **Navigation** | Écrans chargent | Test app: ouvrir 3 écrans | Pas de crash |

**Blocage**: Si TypeScript errors → Adapter types RN 0.80
**Blocage**: Si Database init fail → Vérifier SQLite library version

---

### 🟢 PHASE 4: TESTS & VALIDATION LOCALE (60 min)
**Objectif**: Valider app fonctionne avant émulateurs

#### Tâches
1. ✅ **Tests unitaires**
   ```bash
   npm test
   ```
   - Adapter tests si nécessaire
   - Vérifier coverage ≥ 70%

2. ✅ **Linter & Formatter**
   ```bash
   npm run lint
   npm run format
   ```

3. ✅ **Build Android Debug**
   ```bash
   npm run android
   ```
   - Vérifier app lance sur émulateur
   - Pas de crash au démarrage

4. ✅ **Build iOS Debug** (si macOS)
   ```bash
   npm run ios
   ```

5. ✅ **Tests manuels**
   - ✅ Écran d'accueil charge
   - ✅ Navigation fonctionne
   - ✅ Database init (check logs)
   - ✅ API calls (si backend dispo)
   - ✅ Offline mode (désactiver réseau)

#### KPIs Validation Phase 4
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| **Tests unitaires** | Coverage OK | `npm test -- --coverage` | ≥70% branches/functions/lines |
| **Linter** | Pas d'erreurs | `npm run lint:check` | 0 errors |
| **Android Debug** | App lance | `npm run android` | App ouverte sur émulateur |
| **iOS Debug** | App lance | `npm run ios` (si macOS) | App ouverte sur simulateur |
| **Navigation** | 5 écrans testés | Tests manuels | 5/5 écrans OK |
| **Database** | Init + query | Logs Metro | "Database initialized" |
| **API calls** | Supabase connect | Test appel API | Response 200 ou données |

**Blocage**: Si tests < 70% → Adapter tests pour RN 0.80
**Blocage**: Si app crash → Debug avec `npx react-native log-android`

---

### 🟡 PHASE 5: ÉMULATEURS & DEVICES PHYSIQUES (90 min)
**Objectif**: Valider sur tous types devices

#### Tâches

**A. Émulateur Android**
1. ✅ **Créer AVD (Android Virtual Device)**
   ```bash
   avdmanager create avd -n Pixel_8_API_35 -k "system-images;android-35;google_apis;x86_64"
   ```

2. ✅ **Lancer émulateur**
   ```bash
   emulator -avd Pixel_8_API_35
   ```

3. ✅ **Installer & tester app**
   ```bash
   npm run android
   ```

4. ✅ **Tests critiques**
   - Cold start (app fermée → ouverte)
   - Hot reload (modifier code → refresh)
   - Rotation écran
   - Background → Foreground

**B. Device Android Physique**
1. ✅ **Activer USB Debugging**
   - Paramètres → Options développeur → USB debugging

2. ✅ **Connecter device**
   ```bash
   adb devices  # Vérifier device détecté
   ```

3. ✅ **Installer app**
   ```bash
   npm run android
   ```

4. ✅ **Tests critiques**
   - Performance réelle (60 FPS)
   - GPS (si app utilise)
   - Caméra (si app utilise)
   - Notifications push

**C. Simulateur iOS** (si macOS)
1. ✅ **Lancer simulateur**
   ```bash
   open -a Simulator
   ```

2. ✅ **Installer & tester app**
   ```bash
   npm run ios
   ```

**D. Device iOS Physique** (si macOS + iPhone)
1. ✅ **Configurer signing Xcode**
   - Ouvrir `ios/TaxasGE.xcworkspace`
   - Signing & Capabilities → Team

2. ✅ **Installer app**
   ```bash
   npx react-native run-ios --device
   ```

#### KPIs Validation Phase 5
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| **Émulateur Android** | App installée | `adb shell pm list packages \| grep taxasge` | Package trouvé |
| **App démarre (AVD)** | Écran accueil | Ouvrir app | < 3 secondes |
| **Hot reload** | Code refresh | Modifier texte → save | Visible en <2s |
| **Rotation écran** | Layout adapte | Rotation 90° | Pas de crash, UI OK |
| **Device physique** | App installée | `adb devices` → install | Package installé |
| **Performance** | FPS stable | Monitorer avec Flipper | ≥ 55 FPS |
| **Simulateur iOS** | App lance | `npm run ios` | App ouverte |
| **Device iOS** | App signée | Install sur iPhone | Succès |

**Blocage**: Si émulateur ne démarre pas → Vérifier Intel HAXM (Windows) ou KVM (Linux)
**Blocage**: Si device non détecté → Vérifier drivers USB, autoriser debugging sur device

---

### 🔵 PHASE 6: BUILD PRODUCTION (60 min)
**Objectif**: Créer builds release signés

#### Tâches

**A. Android Release**
1. ✅ **Générer keystore**
   ```bash
   keytool -genkeypair -v -keystore taxasge-release.keystore -alias taxasge -keyalg RSA -keysize 2048 -validity 10000
   ```

2. ✅ **Configurer signing**
   - `android/gradle.properties`: keystore path, password
   - `android/app/build.gradle`: signingConfigs

3. ✅ **Build APK release**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. ✅ **Build AAB (Google Play)**
   ```bash
   ./gradlew bundleRelease
   ```

5. ✅ **Tester APK**
   ```bash
   adb install app/build/outputs/apk/release/app-release.apk
   ```

**B. iOS Release** (si macOS)
1. ✅ **Configurer provisioning profile**
   - Apple Developer Account
   - Certificates + Profiles

2. ✅ **Build Archive**
   ```bash
   xcodebuild -workspace ios/TaxasGE.xcworkspace -scheme TaxasGE -configuration Release archive
   ```

#### KPIs Validation Phase 6
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| **Keystore généré** | Fichier existe | `ls taxasge-release.keystore` | Existe |
| **APK Release** | Fichier généré | `ls android/app/build/outputs/apk/release/*.apk` | 1 fichier |
| **AAB Bundle** | Fichier généré | `ls android/app/build/outputs/bundle/release/*.aab` | 1 fichier |
| **APK installable** | Install succès | `adb install -r app-release.apk` | Success |
| **App signée** | Signature valide | `jarsigner -verify -verbose app-release.apk` | jar verified |
| **iOS Archive** | Archive créé | Xcode Organizer | Archive présent |

**Blocage**: Si signing échoue → Vérifier keystore password
**Blocage**: Si AAB > 150MB → Activer enableSeparateBuildPerCPUArchitecture

---

### 🟢 PHASE 7: WORKFLOWS CI/CD (75 min)
**Objectif**: Valider workflows GitHub Actions

#### Tâches

1. ✅ **Copier nouveau projet vers packages/mobile/**
   ```bash
   cd ../..
   rm -rf packages/mobile-old
   mv packages/mobile packages/mobile-old
   cp -r tmp-mobile-0.80/TaxasGEMobile packages/mobile
   ```

2. ✅ **Commit & push**
   ```bash
   git add packages/mobile
   git commit -m "feat: Upgrade React Native 0.73.9 → 0.80.0

   - Clean install RN 0.80.0 template
   - Migrate all TaxasGE code (database, services, navigation)
   - Update Android SDK configs (compileSdk 35, targetSdk 35)
   - Test on Android emulator + physical device
   - Build release APK + AAB validated
   
   Closes #XXX"
   git push origin mobile
   ```

3. ✅ **Vérifier workflows déclenchés**
   - `.github/workflows/mobile-ci.yml`
   - `.github/workflows/distribute-mobile.yml`

4. ✅ **Monitorer exécution**
   - Logs workflows
   - Tests passent
   - Build succès

#### KPIs Validation Phase 7
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| **mobile-ci.yml** | Workflow passe | GitHub Actions | ✅ SUCCESS |
| **Tests CI** | Coverage OK | Workflow logs | ≥70% coverage |
| **Android CI Build** | APK généré | Artifact uploadé | APK présent |
| **distribute-mobile.yml** | Distribution OK | Workflow passe | ✅ SUCCESS |
| **Firebase configs** | Copiés correctement | Workflow step | Fichiers présents |
| **No breaking changes** | Code compile | CI compile | 0 errors |

**Blocage**: Si workflow échoue → Check logs détaillés, adapter workflow si nécessaire

---

### 🟡 PHASE 8: DOCUMENTATION & CLEANUP (45 min)
**Objectif**: Documenter migration, nettoyer fichiers temporaires

#### Tâches

1. ✅ **Créer rapport migration**
   - `.github/docs-internal/rapports/RAPPORT_MIGRATION_RN_080_2025-10-07.md`
   - Documenter chaque phase
   - Screenshots émulateurs
   - Métriques avant/après
   - Tableau des ereurs rencontrés et solutions adoptés
   - liste des éléments sautés, supprimés qui doivent êtres installés en cas de besoin pour la suite

2. ✅ **Mettre à jour README**
   - `packages/mobile/README.md`
   - Nouveaux prérequis (Node 20.x, RN 0.80)
   - Commandes setup

3. ✅ **Cleanup**
   ```bash
   rm -rf tmp-mobile-0.80
   rm -rf packages/mobile-old  # Après validation 100%
   ```

4. ✅ **Créer guide troubleshooting**
   - Erreurs communes RN 0.80
   - Solutions Android/iOS

#### KPIs Validation Phase 8
| KPI | Critère Succès | Test | Seuil |
|-----|----------------|------|-------|
| **Rapport créé** | Fichier existe | `ls .github/docs-internal/rapports/RAPPORT_MIGRATION_RN*.md` | 1 fichier |
| **README updated** | Prérequis à jour | `grep "Node 20" packages/mobile/README.md` | Trouvé |
| **Cleanup done** | Fichiers temp supprimés | `ls tmp-mobile-0.80` | Not found |
| **Guide troubleshooting** | Doc complète | Nombre de solutions | ≥ 10 solutions |

---

## 📊 KPIS GLOBAUX DE VALIDATION

### KPIs Critiques (Blocage si échec)
| KPI | Description | Mesure | Seuil Succès | Seuil Blocage |
|-----|-------------|---------|--------------|---------------|
| **RN Version** | React Native installé | `package.json` | 0.80.0 | < 0.80.0 |
| **Node Version** | Node.js compatible | `node --version` | ≥ 20.0.0 | < 20.0.0 |
| **Android Build** | APK compilé | `gradle assembleDebug` | BUILD SUCCESSFUL | BUILD FAILED |
| **iOS Build** | App compilée | `xcodebuild` (macOS) | SUCCESS | FAILED |
| **Tests Coverage** | Qualité code | `npm test --coverage` | ≥ 70% | < 60% |
| **App Démarre** | Launch succès | Test émulateur | < 3s | Crash |
| **Workflows CI** | GitHub Actions | mobile-ci.yml | ✅ SUCCESS | ❌ FAILED |

### KPIs Performance
| KPI | Description | Mesure | Seuil Succès |
|-----|-------------|---------|--------------|
| **Cold Start Time** | Temps lancement app | Stopwatch | < 3 secondes |
| **Hot Reload** | Temps refresh code | Metro logs | < 2 secondes |
| **FPS** | Fluidité UI | Flipper monitoring | ≥ 55 FPS |
| **Bundle Size** | Taille APK | `ls -lh *.apk` | < 50 MB |
| **RAM Usage** | Mémoire utilisée | Android Studio Profiler | < 200 MB |

### KPIs Qualité Code
| KPI | Description | Mesure | Seuil Succès |
|-----|-------------|---------|--------------|
| **ESLint Errors** | Erreurs syntaxe | `npm run lint` | 0 errors |
| **TypeScript Errors** | Erreurs types | `npx tsc --noEmit` | 0 errors |
| **Test Failures** | Tests échoués | `npm test` | 0 failures |
| **Security Vulnerabilities** | Vulnérabilités npm | `npm audit` | 0 high/critical |

---

## ⚠️ RISQUES & MITIGATIONS

### Risques Critiques 🔴

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|---------|------------|
| **Node.js incompatibilité** | 90% | 🔴 Bloquant | Installer Node 20.x AVANT migration |
| **Breaking changes RN 0.80** | 70% | 🔴 Majeur | Clean install au lieu upgrade progressif |
| **Android SDK mismatch** | 50% | 🟠 Modéré | Downgrade SDK 36 → 35 avant build |
| **Database migration fail** | 40% | 🔴 Majeur | Backup DB, tester init sur projet test |
| **Workflows CI échec** | 60% | 🟠 Modéré | Adapter workflows pour RN 0.80 dépendances |

### Risques Modérés 🟠

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|---------|------------|
| **Libraries incompatibles** | 50% | 🟠 Modéré | Vérifier compatibility RN 0.80 avant migration |
| **iOS build fail** (sans macOS) | 100% | 🟡 Mineur | Accepter, focus Android prioritaire |
| **Performance dégradée** | 30% | 🟠 Modéré | Profiler avec Flipper, optimiser si nécessaire |
| **Tests coverage < 70%** | 40% | 🟡 Mineur | Adapter tests, ajouter si nécessaire |

---

## ⏱️ ESTIMATION TEMPS TOTAL

| Phase | Durée Estimée | Durée Pessimiste | Criticité |
|-------|---------------|------------------|-----------|
| Phase 0: Préparation | 30 min | 60 min | 🟢 |
| Phase 1: Init RN 0.80 | 45 min | 90 min | 🔴 |
| Phase 2: Config Migration | 60 min | 120 min | 🔴 |
| Phase 3: Code Migration | 90 min | 180 min | 🔴 |
| Phase 4: Tests Locale | 60 min | 90 min | 🟠 |
| Phase 5: Émulateurs | 90 min | 120 min | 🔴 |
| Phase 6: Build Prod | 60 min | 90 min | 🟠 |
| Phase 7: Workflows CI | 75 min | 120 min | 🔴 |
| Phase 8: Documentation | 45 min | 60 min | 🟢 |
| **TOTAL OPTIMISTE** | **8.25 heures** | - | - |
| **TOTAL RÉALISTE** | **12 heures** | - | - |
| **TOTAL PESSIMISTE** | - | **16.5 heures** | - |

**Recommandation**: Prévoir **2 jours pleins** (2 × 8h = 16h) pour exécution + imprévus

---

## ✅ CHECKLIST VALIDATION FINALE

Avant de considérer la migration **TERMINÉE**, valider:

- [ ] **RN 0.80.0** installé et confirmé dans package.json
- [ ] **Node.js ≥ 20.0.0** version système
- [ ] **Android Debug APK** build et installé sur émulateur
- [ ] **Android Release APK** build et testé
- [ ] **Android AAB** généré pour Play Store
- [ ] **iOS Debug** build et testé (si macOS disponible)
- [ ] **Device physique Android** app installée et testée
- [ ] **Device physique iOS** app installée (si disponible)
- [ ] **Tests unitaires** ≥ 70% coverage, 0 failures
- [ ] **ESLint** 0 errors
- [ ] **TypeScript** 0 errors
- [ ] **Database init** testé avec succès
- [ ] **API calls** Supabase fonctionnent
- [ ] **Navigation** 5+ écrans testés sans crash
- [ ] **Offline mode** testé (désactiver réseau)
- [ ] **Hot reload** fonctionne (< 2s)
- [ ] **Cold start** < 3 secondes
- [ ] **FPS** ≥ 55 sur device physique
- [ ] **Workflows CI** mobile-ci.yml passe ✅
- [ ] **Workflows CI** distribute-mobile.yml passe ✅
- [ ] **Rapport migration** rédigé et committé
- [ ] **README** mis à jour avec prérequis RN 0.80
- [ ] **Cleanup** fichiers temporaires supprimés

**Score minimum acceptable: 20/22 (91%)** ✅

---

## 🚨 POINTS CRITIQUES D'ATTENTION

### ⚠️ AVANT DE COMMENCER
1. **Node.js 18 → 20 migration OBLIGATOIRE** (sinon échec garanti)
2. **Backup complet** avant toute modification
3. **Émulateur Android** doit être configuré et fonctionnel

### ⚠️ PENDANT MIGRATION
1. **NE PAS** upgrade progressif 0.73 → 0.74 → ... (perte de temps)
2. **Tester CHAQUE phase** avant passer à suivante
3. **Si blocage Phase 1-3** → Impossible continuer, debug requis

### ⚠️ VALIDATION CRITIQUE
1. **App doit démarrer** sur émulateur AVANT commit
2. **Tests doivent passer** ≥ 70% coverage
3. **Workflows CI** doivent être adaptés pour RN 0.80 dependencies

---
