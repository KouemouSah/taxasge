# 📱 GUIDE: Développement & Visualisation Mobile TaxasGE

**Date:** 2025-10-02
**Projet:** TaxasGE Mobile - React Native
**Cible:** Développeurs Frontend/Mobile
**Niveau:** Débutant à Intermédiaire

---

## 🎯 OBJECTIF

Guide complet pour **développer et visualiser** l'application mobile TaxasGE React Native avec plusieurs options selon votre setup.

---

## 🚀 OPTIONS DE VISUALISATION (3 SOLUTIONS)

### **Option 1: Expo Go** ⚡ RAPIDE (RECOMMANDÉ POUR DÉMARRAGE)

**Avantages:**
- ✅ Setup 5 minutes
- ✅ Pas besoin Android Studio/Xcode
- ✅ Hot reload ultra-rapide
- ✅ Scanner QR code et c'est parti

**Inconvénients:**
- ⚠️ Limité modules natifs (SQLite OK via expo-sqlite)
- ⚠️ Pas accès fonctionnalités natives custom

**Setup:**
```bash
# 1. Installer Expo Go sur smartphone
# Android: https://play.google.com/store/apps/details?id=host.exp.exponent
# iOS: https://apps.apple.com/app/expo-go/id982107779

# 2. Dans le projet
cd packages/mobile
npm install -g expo-cli  # Si pas déjà installé
npx expo start

# 3. Scanner QR code affiché dans terminal avec smartphone
```

**Verdict:** ✅ **PARFAIT pour débuter et tester UI rapidement**

---

### **Option 2: Émulateur Android/iOS** 🖥️ PROFESSIONNEL (RECOMMANDÉ PRODUCTION)

**Avantages:**
- ✅ Environnement identique production
- ✅ Tous modules natifs fonctionnent
- ✅ Debug complet (React DevTools, Flipper)
- ✅ Tests performances réalistes

**Inconvénients:**
- ⚠️ Setup 1-2 heures (première fois)
- ⚠️ Requiert PC puissant (8GB+ RAM)
- ⚠️ Xcode (macOS only pour iOS)

#### **Setup Android Emulator** (Windows/Mac/Linux)

```bash
# 1. Installer Android Studio
# Télécharger: https://developer.android.com/studio

# 2. Installer Android SDK via Android Studio
# - Ouvrir Android Studio
# - Tools > SDK Manager
# - Installer Android 13 (API 33) ou supérieur

# 3. Créer AVD (Android Virtual Device)
# - Tools > AVD Manager
# - Create Virtual Device
# - Choisir: Pixel 5 ou Pixel 6
# - System Image: Android 13 (API 33)
# - Finish

# 4. Configurer variables d'environnement
# Windows (PowerShell):
$env:ANDROID_HOME = "C:\Users\<USERNAME>\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator"

# Linux/Mac:
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# 5. Vérifier installation
adb version  # Devrait afficher version

# 6. Lancer émulateur
cd packages/mobile
npm run android  # Démarre émulateur + app
```

#### **Setup iOS Simulator** (macOS UNIQUEMENT)

```bash
# 1. Installer Xcode
# App Store > Xcode (gratuit, ~12GB)

# 2. Installer Command Line Tools
xcode-select --install

# 3. Installer CocoaPods
sudo gem install cocoapods

# 4. Installer dépendances iOS
cd packages/mobile/ios
pod install

# 5. Lancer simulator
cd ..
npm run ios  # Démarre simulator + app
```

**Verdict:** ✅ **MEILLEUR pour développement professionnel**

---

### **Option 3: Smartphone Physique via USB** 📱 RÉALISTE

**Avantages:**
- ✅ Performances réelles
- ✅ Tests GPS, caméra, capteurs
- ✅ Feedback UX authentique

**Inconvénients:**
- ⚠️ Requiert câble USB
- ⚠️ Activation mode développeur
- ⚠️ Rechargement moins rapide qu'émulateur

#### **Setup Android (USB)**

```bash
# 1. Activer mode développeur sur smartphone
# - Paramètres > À propos du téléphone
# - Taper 7x sur "Numéro de build"
# - Retour > Options développeur > USB debugging (activer)

# 2. Connecter smartphone via USB

# 3. Vérifier détection
adb devices
# Devrait afficher: <device-id>  device

# 4. Lancer app
cd packages/mobile
npm run android
```

#### **Setup iOS (USB - macOS UNIQUEMENT)**

```bash
# 1. Connecter iPhone via USB

# 2. Faire confiance à l'ordinateur sur iPhone

# 3. Ouvrir Xcode
open ios/TaxasGE.xcworkspace

# 4. Sélectionner votre iPhone dans devices

# 5. Build & Run (Cmd+R)
```

**Verdict:** ✅ **IDÉAL pour tests finaux et validation UX**

---

## 🛠️ CONFIGURATION DÉVELOPPEMENT RECOMMANDÉE

### **Stack Complète (Ma Recommandation)**

```
┌─────────────────────────────────────────┐
│         SETUP DÉVELOPPEMENT              │
├─────────────────────────────────────────┤
│                                          │
│  💻 IDE:                                 │
│     - VS Code (principal)                │
│     - Extensions:                        │
│       • React Native Tools              │
│       • ES7 React/Redux snippets        │
│       • Prettier                        │
│       • ESLint                          │
│                                          │
│  📱 Visualisation:                       │
│     - Émulateur Android (dev quotidien) │
│     - Expo Go (tests rapides UI)        │
│     - Smartphone physique (validation)  │
│                                          │
│  🔧 Debugging:                           │
│     - React DevTools                    │
│     - Flipper (network, logs, DB)       │
│     - Chrome DevTools (JS debugging)    │
│                                          │
│  📊 Monitoring:                          │
│     - Reactotron (state, API calls)     │
│     - SQLite DB Browser (DB inspection)│
│                                          │
└─────────────────────────────────────────┘
```

---

## ⚡ DÉMARRAGE RAPIDE (5 MINUTES)

### **Option A: Expo Go (Smartphone)**

```bash
# Terminal 1: Démarrer Metro
cd packages/mobile
npm start

# Sur smartphone:
# 1. Ouvrir Expo Go
# 2. Scanner QR code
# 3. App démarre !
```

### **Option B: Émulateur Android**

```bash
# Terminal 1: Lancer émulateur
emulator -avd Pixel_5_API_33

# Terminal 2: Démarrer app
cd packages/mobile
npm run android

# App s'installe et démarre automatiquement
```

### **Option C: iOS Simulator (macOS)**

```bash
cd packages/mobile
npm run ios

# Simulator démarre automatiquement
```

---

## 🔥 HOT RELOAD & DEBUGGING

### **Hot Reload (Modifications en temps réel)**

```bash
# Déjà activé par défaut
# Modifier un fichier .tsx
# Sauvegarder (Ctrl+S)
# → App recharge automatiquement en 1-2 secondes

# Forcer reload manuel:
# - Android émulateur: R+R (appuyer 2x sur R)
# - iOS simulator: Cmd+R
# - Expo Go: Secouer téléphone > Reload
```

### **Debug Menu**

```bash
# Android émulateur: Ctrl+M
# iOS simulator: Cmd+D
# Expo Go: Secouer téléphone

# Options:
# - Reload
# - Debug JS Remotely (ouvre Chrome DevTools)
# - Toggle Inspector (inspecter éléments)
# - Show Perf Monitor (FPS, RAM)
```

### **React DevTools**

```bash
# Terminal séparé
npx react-devtools

# Connect to React Native app
# → Inspecter component tree
# → Voir props/state en temps réel
```

### **Flipper (Debugging Professionnel)**

```bash
# 1. Télécharger Flipper
# https://fbflipper.com/

# 2. Lancer Flipper

# 3. Démarrer app React Native
npm run android  # ou ios

# 4. App apparaît dans Flipper
# → Network inspector
# → Database browser (SQLite)
# → Logs viewer
# → React DevTools intégré
```

---

## 🗄️ INSPECTER SQLite DATABASE

### **Option 1: Flipper Database Plugin**

```bash
# 1. Lancer Flipper
# 2. Ouvrir app TaxasGE
# 3. Plugins > Databases
# 4. Sélectionner taxasge.db
# → Voir toutes les tables
# → Exécuter requêtes SQL
# → Éditer données
```

### **Option 2: SQLite DB Browser (Desktop)**

```bash
# 1. Télécharger DB Browser for SQLite
# https://sqlitebrowser.org/

# 2. Extraire DB depuis émulateur
# Android:
adb exec-out run-as com.taxasge cat databases/taxasge.db > taxasge.db

# 3. Ouvrir dans DB Browser
# → Voir schema
# → Browse data
# → Execute SQL
```

### **Option 3: CLI adb (Terminal)**

```bash
# Accéder au shell Android
adb shell

# Naviguer vers DB
run-as com.taxasge
cd databases/

# Ouvrir SQLite
sqlite3 taxasge.db

# Requêtes
.tables  # Lister tables
SELECT * FROM fiscal_services LIMIT 10;
.schema fiscal_services  # Voir schema
.exit  # Quitter
```

---

## 🧪 TESTS MANUELS RAPIDES

### **Checklist Test Initial**

```bash
# 1. App démarre sans crash ✅
npm run android

# 2. DatabaseProvider initialise DB ✅
# → Voir "Initialisation de la base de données..." (1-2 sec)

# 3. Sync initial (si autoSync=true) ✅
# → Voir "Synchronisation des données..." (10-30 sec)

# 4. Home screen s'affiche ✅

# 5. Test mode offline ✅
# → Activer mode avion sur smartphone/émulateur
# → Naviguer dans l'app
# → Rechercher services (FTS5)
# → Voir favoris
# → Calculer montant
# → Tout fonctionne sans internet !

# 6. Test retour online ✅
# → Désactiver mode avion
# → Observer auto-sync queue offline
# → Favoris synchronisés
# → Calculs synchronisés
```

---

## 📊 MONITORING PERFORMANCES

### **React Native Performance Monitor**

```bash
# Dans app (Debug Menu > Show Perf Monitor)

# Métriques à surveiller:
# - RAM: < 150MB (OK), > 300MB (problème)
# - JS thread FPS: > 55 FPS (OK), < 30 FPS (lag)
# - UI thread FPS: > 55 FPS (OK), < 30 FPS (saccadé)
```

### **Flipper Performance**

```bash
# Flipper > Plugins > React DevTools > Profiler
# 1. Cliquer "Record"
# 2. Interagir avec app (30 sec)
# 3. Stop
# → Voir flame graph
# → Identifier composants lents
```

---

## 🚀 WORKFLOW DÉVELOPPEMENT RECOMMANDÉ

### **Jour 1-2: Setup Environnement**

```bash
# 1. Choisir option visualisation
# Recommandation: Émulateur Android (polyvalent)

# 2. Installer tools
# - Android Studio + SDK
# - React Native CLI
# - Flipper
# - DB Browser for SQLite

# 3. Premier lancement
cd packages/mobile
npm run android

# 4. Vérifier tout fonctionne
# - App démarre
# - Hot reload OK
# - Debug menu accessible
```

### **Jour 3+: Développement Features**

```bash
# Workflow quotidien:

# 1. Lancer émulateur (le matin)
emulator -avd Pixel_5_API_33

# 2. Démarrer Metro bundler
cd packages/mobile
npm start

# 3. Ouvrir Flipper (debugging)
# → Network tab (voir API calls)
# → Database tab (inspecter SQLite)

# 4. Coder dans VS Code
# → Modifier .tsx files
# → Sauvegarder (hot reload auto)
# → Tester dans émulateur

# 5. Debug si nécessaire
# → Chrome DevTools (Cmd+M > Debug JS Remotely)
# → React DevTools (component tree)
# → Flipper (network, DB, logs)

# 6. Tests manuels
# → Activer mode avion (test offline)
# → Naviguer app
# → Vérifier sync au retour online
```

---

## 🎨 RECOMMANDATION FINALE

### **Setup Optimal pour TaxasGE**

```yaml
Visualisation Principale:
  - Émulateur Android (Pixel 5, API 33)
  - Raison: Performances + debugging complet

Visualisation Tests Rapides:
  - Expo Go sur smartphone physique
  - Raison: Test UI rapides sans rebuild

Debugging:
  - Flipper (network, DB, logs)
  - React DevTools (components)
  - Chrome DevTools (JS debugging)

Base de Données:
  - Flipper Database Plugin (inspection temps réel)
  - SQLite DB Browser (requêtes complexes)

Monitoring:
  - Perf Monitor intégré (FPS, RAM)
  - Flipper Profiler (component performance)
```

---

## ⏱️ TEMPS SETUP ESTIMÉ

| Setup | Durée | Difficulté |
|-------|-------|------------|
| **Expo Go** | 5 min | ⭐ Facile |
| **Émulateur Android (Windows)** | 1-2h | ⭐⭐ Moyen |
| **Émulateur Android (Mac/Linux)** | 1h | ⭐⭐ Moyen |
| **iOS Simulator (macOS)** | 30 min | ⭐ Facile |
| **Smartphone USB** | 10 min | ⭐ Facile |
| **Flipper** | 10 min | ⭐ Facile |
| **Tools complets** | 2-3h | ⭐⭐⭐ Avancé |

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### **Pour Démarrer Aujourd'hui (30 min)**

```bash
# Option rapide: Expo Go
1. Installer Expo Go sur smartphone (2 min)
2. cd packages/mobile && npm start (1 min)
3. Scanner QR code (1 min)
4. Tester app (26 min)
```

### **Pour Setup Professionnel (2h)**

```bash
# Option complète: Émulateur + Flipper
1. Installer Android Studio (30 min)
2. Créer AVD Pixel 5 (15 min)
3. Configurer variables env (5 min)
4. Installer Flipper (10 min)
5. Premier lancement app (10 min)
6. Tests + familiarisation (50 min)
```

---

## 📞 SUPPORT

**En cas de problème:**

1. **Émulateur ne démarre pas:**
   ```bash
   # Vérifier ANDROID_HOME
   echo $ANDROID_HOME  # Linux/Mac
   echo $env:ANDROID_HOME  # Windows

   # Lister AVDs disponibles
   emulator -list-avds
   ```

2. **App ne build pas:**
   ```bash
   # Nettoyer cache
   cd packages/mobile
   npm run clean
   rm -rf node_modules
   npm install --legacy-peer-deps
   ```

3. **Hot reload ne fonctionne pas:**
   ```bash
   # Redémarrer Metro
   npm start --reset-cache
   ```

4. **Database ne sync pas:**
   ```bash
   # Vérifier logs Flipper
   # Tester manuellement:
   import {syncService} from './database';
   await syncService.syncReferenceData();
   ```

---

**Guide généré le:** 2025-10-02
**Version TaxasGE:** 1.0.0
**React Native:** 0.73.0
**Node.js:** v18.20.8 ✅

🤖 Generated with [Claude Code](https://claude.com/claude-code)
