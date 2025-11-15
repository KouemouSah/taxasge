# 🔧 Fix "Unable to load script" Error

## ❌ Problème
```
Unable to load script
Make sure you're running Metro or that bundle 'index.android.bundle' is packaged correctly for release.
```

## ✅ Solution Rapide (3 étapes)

### Étape 1: Créer le dossier assets

```bash
cd packages/mobile
mkdir -p android/app/src/main/assets
```

### Étape 2: Générer le bundle JavaScript

```bash
# Arrêter Metro s'il tourne
pkill -f "react-native start"

# Générer le bundle pour OFFLINE
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res \
  --reset-cache
```

### Étape 3: Rebuild l'APK

```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

## 📱 Installer l'APK

L'APK sera dans:
```
packages/mobile/android/app/build/outputs/apk/release/app-release.apk
```

Installer via:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

## 🎯 Script Automatique

Pour faciliter le build, utilisez le script automatisé:

```bash
cd packages/mobile
chmod +x build-offline-apk.sh
./build-offline-apk.sh
```

## ⚠️ Résolution des Problèmes Courants

### 1. Erreur "Metro is still running"
```bash
pkill -f "react-native start"
pkill -f metro
```

### 2. Erreur "Gradle build failed"
```bash
cd android
./gradlew clean
rm -rf build
rm -rf app/build
cd ..
```

### 3. Erreur "Bundle is too large"
Ceci est normal pour un APK offline avec base de données SQLite incluse.

### 4. Vérifier que le bundle est inclus
```bash
ls -lh android/app/src/main/assets/index.android.bundle
```

Si le fichier existe et fait > 1MB, le bundle est OK.

## 📋 Checklist Complète

- [ ] Dossier `assets` créé
- [ ] Metro arrêté
- [ ] Bundle JavaScript généré (> 1MB)
- [ ] Gradle clean exécuté
- [ ] APK rebuild avec `assembleRelease`
- [ ] APK existe dans `android/app/build/outputs/apk/release/`
- [ ] APK installé sur l'appareil

## 🔍 Logs de Debug

Pour voir les logs de l'app après installation:
```bash
adb logcat | grep -E "ReactNative|TaxasGE"
```

## ✅ Validation du Build

Un build réussi affiche:
```
BUILD SUCCESSFUL in Xs
```

Et l'APK pèse environ 15-25MB (selon les assets inclus).
