# TaxasGE Mobile

Application mobile de gestion fiscale pour la Guinée Équatoriale, développée avec React Native.

![React Native](https://img.shields.io/badge/React%20Native-0.80.0-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-lightgrey.svg)

## 📋 Description

TaxasGE Mobile est une application React Native permettant la gestion et le calcul des taxes en Guinée Équatoriale. L'application fonctionne en mode offline-first avec synchronisation Supabase.

**Fonctionnalités principales:**
- 📊 Calcul de taxes (TVA, Impôts, Taxes douanières)
- 🌍 Support multilingue (Espagnol, Français, Anglais)
- 📱 Mode offline avec SQLite
- 🔄 Synchronisation automatique avec Supabase
- 🔐 Authentification sécurisée
- 📈 Historique des calculs

## 🚀 Prérequis

Avant de commencer, assurez-vous d'avoir installé:

### Versions Requises

| Outil | Version Minimale | Version Recommandée |
|-------|------------------|---------------------|
| **Node.js** | 20.0.0 | 20.19.5 LTS |
| **npm** | 10.0.0 | 10.8.2 |
| **Java JDK** | 17 | 17.0.12 LTS |
| **Android SDK** | API 35 | API 35 |
| **Xcode** (macOS) | 15.0 | 15.0+ |
| **CocoaPods** (macOS) | 1.12 | Latest |

### Configuration Environnement

#### Windows

```bash
# Vérifier versions
node --version  # doit être ≥ 20.0.0
npm --version   # doit être ≥ 10.0.0
java -version   # doit être 17

# Configurer ANDROID_HOME
setx ANDROID_HOME "C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools"
```

#### macOS/Linux

```bash
# Vérifier versions
node --version  # doit être ≥ 20.0.0
npm --version   # doit être ≥ 10.0.0
java -version   # doit être 17

# Configurer ANDROID_HOME (ajouter à ~/.bashrc ou ~/.zshrc)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
```

### Installation Android SDK

1. Télécharger [Android Studio](https://developer.android.com/studio)
2. Ouvrir Android Studio → Settings → Android SDK
3. Installer:
   - ✅ Android SDK Platform 35
   - ✅ Android SDK Build-Tools 35.0.0
   - ✅ Android SDK Platform-Tools
   - ✅ Android Emulator

### Installation Xcode (macOS uniquement)

```bash
# Installer Xcode depuis App Store
xcode-select --install

# Installer CocoaPods
sudo gem install cocoapods
```

## 📦 Installation

### 1. Cloner le Repository

```bash
git clone https://github.com/KouemouSah/taxasge.git
cd taxasge/packages/mobile
```

### 2. Installer les Dépendances

```bash
# Installation npm
npm install

# iOS uniquement (macOS)
cd ios
pod install
cd ..
```

### 3. Configuration Environnement

Créer un fichier `.env` à la racine du projet mobile:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Firebase Configuration (optionnel)
FIREBASE_API_KEY=your-api-key
FIREBASE_PROJECT_ID=your-project-id

# Environment
NODE_ENV=development
```

## 🏃 Démarrage Rapide

### Étape 1: Démarrer Metro Bundler

```bash
npm start
```

### Étape 2: Lancer l'Application

#### Android

```bash
# Lancer sur émulateur Android
npm run android

# Ou build debug manuel
cd android
./gradlew assembleDebug
cd ..
```

#### iOS (macOS uniquement)

```bash
# Lancer sur simulateur iOS
npm run ios

# Ou build debug manuel avec Xcode
open ios/TaxasGE.xcworkspace
```

## 🛠️ Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm start` | Démarre Metro bundler |
| `npm run android` | Lance l'app sur Android |
| `npm run ios` | Lance l'app sur iOS (macOS) |
| `npm run lint` | Exécute ESLint avec auto-fix |
| `npm run lint:check` | Vérifie ESLint sans fix |
| `npm run format` | Formate le code avec Prettier |
| `npm run test` | Exécute les tests Jest |
| `npm run test:watch` | Tests en mode watch |
| `npm run test:coverage` | Génère rapport coverage |
| `npm run build:android` | Build APK release Android |
| `npm run build:ios` | Build release iOS |

## 🏗️ Structure du Projet

```
packages/mobile/
├── android/              # Configuration Android native
├── ios/                  # Configuration iOS native
├── src/
│   ├── App.js           # Point d'entrée application
│   ├── assets/          # Images, ML models, i18n
│   │   ├── images/      # Ressources visuelles
│   │   ├── ml/          # Modèles TensorFlow Lite
│   │   └── i18n/        # Fichiers traductions
│   ├── config/          # Configuration app
│   ├── context/         # React Context (état global)
│   ├── database/        # SQLite (stockage local)
│   ├── hooks/           # Custom React Hooks
│   ├── i18n/            # Internationalisation
│   │   ├── es.json      # Espagnol
│   │   ├── fr.json      # Français
│   │   └── en.json      # Anglais
│   ├── navigation/      # React Navigation
│   ├── providers/       # Context Providers
│   ├── services/        # API, Supabase, Firebase
│   ├── styles/          # Styles globaux
│   └── utils/           # Utilitaires
├── package.json         # Dependencies npm
├── tsconfig.json        # Configuration TypeScript
├── babel.config.js      # Configuration Babel
├── metro.config.js      # Configuration Metro bundler
└── README.md            # Ce fichier
```

## 🧪 Tests

### Exécuter Tests Unitaires

```bash
# Tous les tests
npm test

# Mode watch
npm run test:watch

# Avec coverage
npm run test:coverage
```

### Exécuter Tests E2E (si configurés)

```bash
# Android
npm run test:e2e:android

# iOS
npm run test:e2e:ios
```

## 📱 Build Production

### Android APK

```bash
# Générer APK release
cd android
./gradlew assembleRelease

# APK disponible dans:
# android/app/build/outputs/apk/release/app-release.apk
```

### Android AAB (Google Play)

```bash
# Générer Android App Bundle
cd android
./gradlew bundleRelease

# AAB disponible dans:
# android/app/build/outputs/bundle/release/app-release.aab
```

### iOS IPA (macOS uniquement)

```bash
# Via Xcode
open ios/TaxasGE.xcworkspace

# Product → Archive → Export
```

## 🔧 Troubleshooting

### Erreur: "Unable to load script"

```bash
# Nettoyer cache Metro
npm start -- --reset-cache

# Nettoyer build Android
cd android && ./gradlew clean && cd ..

# Réinstaller dependencies
rm -rf node_modules package-lock.json
npm install
```

### Erreur: "SDK location not found"

```bash
# Créer android/local.properties
echo "sdk.dir=C:\\Users\\User\\AppData\\Local\\Android\\Sdk" > android/local.properties

# Ou définir ANDROID_HOME (voir Configuration Environnement)
```

### Erreur: "CocoaPods install fails" (iOS)

```bash
# Nettoyer pods
cd ios
rm -rf Pods Podfile.lock
pod deintegrate
pod install --repo-update
cd ..
```

### Erreur: "Port 8081 already in use"

```bash
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8081 | xargs kill -9

# Ou utiliser port différent
npm start -- --port 8082
```

### Erreur: "Husky .git not found"

```bash
# Déjà géré automatiquement en CI
# Pour environnement local, vérifier .git au root monorepo
```

Pour plus de solutions, voir [Guide Troubleshooting Complet](.github/docs-internal/rapports/RAPPORT_MIGRATION_RN_080_2025-10-07.md#-guide-troubleshooting)

## 📚 Documentation

- [Rapport Migration RN 0.80.0](.github/docs-internal/rapports/RAPPORT_MIGRATION_RN_080_2025-10-07.md)
- [Analyse Environnement Mobile](.github/docs-internal/rapports/RAPPORT_ANALYSE_ENVIRONNEMENT_MOBILE_RN080_2025-10-07.md)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Supabase Docs](https://supabase.com/docs)

## 🤝 Contribution

Les contributions sont bienvenues! Veuillez suivre ces étapes:

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de Code

```bash
# Avant commit, exécuter:
npm run lint        # Vérifier ESLint
npm run format      # Formatter avec Prettier
npm test           # Exécuter tests
```

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](../../LICENSE) pour plus de détails.

## 👥 Auteurs

- **KOUEMOU SAH Jean Emac** - *Lead Developer* - [kouemou.sah@gmail.com](mailto:kouemou.sah@gmail.com)

## 🙏 Remerciements

- [React Native Community](https://github.com/react-native-community)
- [Supabase](https://supabase.com)
- [Redux Toolkit](https://redux-toolkit.js.org)

## 📞 Support

Pour toute question ou problème:
- Ouvrir une [Issue](https://github.com/KouemouSah/taxasge/issues)
- Email: kouemou.sah@gmail.com

---

**Version:** 1.0.0
**React Native:** 0.80.0
**Dernière mise à jour:** 2025-10-08

Made with ❤️ for Equatorial Guinea
