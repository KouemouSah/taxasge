# Prérequis pour le Build d'APK TaxasGE Mobile

## Vue d'ensemble

Ce document liste tous les prérequis nécessaires pour construire l'APK standalone de TaxasGE Mobile.

## 1. Environnement de Développement

### Node.js et npm

**Version requise** : Node.js >= 20.0.0, npm >= 10.0.0

```bash
# Vérifier les versions installées
node --version  # Doit afficher v20.x.x ou supérieur
npm --version   # Doit afficher 10.x.x ou supérieur

# Installer les dépendances du projet
cd packages/mobile
npm install
```

### Java Development Kit (JDK)

**Version requise** : JDK 17 ou 21 (recommandé pour React Native 0.80)

```bash
# Vérifier la version Java
java -version  # Doit afficher version 17 ou 21

# Sur Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# Sur macOS (via Homebrew)
brew install openjdk@17

# Sur Windows
# Télécharger depuis : https://adoptium.net/
```

## 2. Android Development Environment

### Android Studio

**Version recommandée** : Android Studio Hedgehog (2023.1.1) ou supérieur

1. Télécharger depuis : https://developer.android.com/studio
2. Installer Android Studio
3. Lancer Android Studio et installer les composants suivants via SDK Manager

### Android SDK

**Composants requis** :

- ✅ Android SDK Platform 35 (ou la version spécifiée dans `build.gradle`)
- ✅ Android SDK Build-Tools 35.0.0 (ou supérieur)
- ✅ Android SDK Platform-Tools
- ✅ Android SDK Tools
- ✅ Android Emulator (optionnel, pour test)

**Installation via SDK Manager** :

1. Ouvrir Android Studio
2. Aller dans **Settings/Preferences** > **Appearance & Behavior** > **System Settings** > **Android SDK**
3. Onglet **SDK Platforms** : Cocher **Android API 35**
4. Onglet **SDK Tools** : Cocher tous les outils nécessaires
5. Cliquer **Apply** pour installer

### Variables d'environnement

**Linux/macOS** : Ajouter à `~/.bashrc`, `~/.zshrc`, ou `~/.profile` :

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/build-tools/35.0.0
```

Puis recharger :
```bash
source ~/.bashrc  # ou ~/.zshrc selon votre shell
```

**Windows** : Ajouter via **Panneau de configuration** > **Système** > **Paramètres système avancés** > **Variables d'environnement** :

```
ANDROID_HOME = C:\Users\VOTRE_NOM\AppData\Local\Android\Sdk
PATH = %ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\build-tools\35.0.0
```

### Fichier local.properties

Créer `packages/mobile/android/local.properties` :

**Linux/macOS** :
```properties
sdk.dir=/home/VOTRE_NOM/Android/Sdk
# ou sur macOS : /Users/VOTRE_NOM/Library/Android/sdk
```

**Windows** :
```properties
sdk.dir=C:\\Users\\VOTRE_NOM\\AppData\\Local\\Android\\Sdk
```

## 3. Keystore de Signature

### Pour le Développement (Debug)

Un keystore de debug est automatiquement généré. Aucune action requise.

### Pour la Production (Release)

**Générer un keystore de release** :

```bash
cd packages/mobile/android/app

# Générer le keystore
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore taxasge-release.keystore \
  -alias taxasge \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass taxasge2025 \
  -keypass taxasge2025 \
  -dname "CN=TaxasGE, OU=Mobile, O=TaxasGE, L=Malabo, ST=Bioko Norte, C=GQ"
```

**Important** : Conservez précieusement ce keystore ! Il est nécessaire pour toute mise à jour future de l'application.

**Configuration dans gradle.properties** :

Le fichier `packages/mobile/android/gradle.properties` contient déjà :

```properties
TAXASGE_UPLOAD_STORE_FILE=taxasge-release.keystore
TAXASGE_UPLOAD_KEY_ALIAS=taxasge
TAXASGE_UPLOAD_STORE_PASSWORD=taxasge2025
TAXASGE_UPLOAD_KEY_PASSWORD=taxasge2025
```

**⚠️ Sécurité** : Pour la production réelle, utilisez des mots de passe forts et ne les commitez JAMAIS dans Git.

## 4. Vérification de l'Installation

### Script de vérification

```bash
#!/bin/bash

echo "=== Vérification de l'environnement TaxasGE Mobile ==="
echo ""

# Node.js
echo -n "Node.js: "
node --version && echo "✓" || echo "✗ MANQUANT"

# npm
echo -n "npm: "
npm --version && echo "✓" || echo "✗ MANQUANT"

# Java
echo -n "Java: "
java -version 2>&1 | head -n 1 && echo "✓" || echo "✗ MANQUANT"

# ANDROID_HOME
echo -n "ANDROID_HOME: "
if [ -n "$ANDROID_HOME" ] && [ -d "$ANDROID_HOME" ]; then
    echo "$ANDROID_HOME ✓"
else
    echo "✗ NON CONFIGURÉ"
fi

# Android SDK
echo -n "Android SDK: "
if [ -f "$ANDROID_HOME/platform-tools/adb" ]; then
    echo "✓"
else
    echo "✗ MANQUANT"
fi

# Gradle
echo -n "Gradle: "
if [ -f "packages/mobile/android/gradlew" ]; then
    echo "✓"
else
    echo "✗ MANQUANT"
fi

# Keystore
echo -n "Keystore: "
if [ -f "packages/mobile/android/app/taxasge-release.keystore" ]; then
    echo "✓"
else
    echo "⚠ OPTIONNEL (générer pour production)"
fi

echo ""
echo "=== Fin de la vérification ==="
```

### Test rapide

```bash
# Vérifier que Gradle fonctionne
cd packages/mobile/android
./gradlew --version

# Vérifier les dépendances npm
cd ..
npm list --depth=0

# Vérifier que react-native CLI fonctionne
npx react-native --version
```

## 5. Build de l'APK

Une fois tous les prérequis satisfaits :

```bash
cd packages/mobile

# Méthode 1 : Via npm (recommandé)
npm run build:android:standalone

# Méthode 2 : Script direct
./build-standalone-apk.sh

# Pour l'environnement offline
npm run build:android:standalone:offline
```

## 6. Dépannage

### Erreur : "ANDROID_HOME is not set"

Solution : Configurer les variables d'environnement (voir section 2)

### Erreur : "SDK location not found"

Solution : Créer le fichier `android/local.properties` (voir section 2)

### Erreur : "Failed to install the following Android SDK packages"

Solution :
```bash
# Installer via sdkmanager
sdkmanager "platforms;android-35" "build-tools;35.0.0"
```

### Erreur : "Execution failed for task ':app:validateSigningRelease'"

Solution : Vérifier que le keystore existe et que les credentials dans `gradle.properties` sont corrects

### Erreur : "Could not find com.android.tools.build:gradle:X.X.X"

Solution : Vérifier votre connexion Internet et les repositories dans `build.gradle`

### Erreur : "OutOfMemoryError: Java heap space"

Solution : Augmenter la mémoire dans `gradle.properties` :
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

## 7. Ressources Supplémentaires

- **React Native Docs** : https://reactnative.dev/docs/environment-setup
- **Android Developers** : https://developer.android.com/studio/build/building-cmdline
- **Gradle User Manual** : https://docs.gradle.org/current/userguide/userguide.html
- **Guide TaxasGE** : `STANDALONE_APK_BUILD.md`

## 8. Support

Pour toute question :
1. Consulter `STANDALONE_APK_BUILD.md` pour le guide de build
2. Vérifier les logs : `packages/mobile/android/build/outputs/logs/`
3. Consulter les issues GitHub du projet

---

**Note** : Ces prérequis sont nécessaires pour construire l'APK sur votre machine locale. L'environnement de conteneur peut ne pas avoir tous ces outils installés.
