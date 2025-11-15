# TaxasGE Mobile - Build APK Offline

## ✅ Configuration Automatique Activée

Le fichier `android/app/build.gradle` est maintenant configuré pour **générer automatiquement** le bundle JavaScript lors du build de l'APK release.

## 🚀 Build en 2 Étapes

### Étape 1: Installer les dépendances (une seule fois)

```bash
cd packages/mobile
npm install
```

### Étape 2: Build l'APK

```bash
cd android
./gradlew assembleRelease
```

**C'est tout !** Le bundle JavaScript sera généré automatiquement pendant le build.

## 📱 Installer l'APK

L'APK sera dans:
```
packages/mobile/android/app/build/outputs/apk/release/app-release.apk
```

Installer via:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

## 🔧 Ce qui a été configuré

### 1. Configuration React Native (build.gradle)
```gradle
react {
    root = file("../../")
    entryFile = file("../../index.js")
    bundleAssetName = "index.android.bundle"
}
```

### 2. Task Gradle automatique
Un task `bundleReleaseJsAndAssets` a été ajouté qui:
- Crée automatiquement le dossier `assets`
- Génère le bundle JavaScript
- L'inclut dans l'APK
- S'exécute automatiquement avant `assembleRelease`

## ✅ Vérification

Pendant le build, vous verrez:
```
📦 TaxasGE: Generating JavaScript bundle...
✅ TaxasGE: Bundle generated at .../index.android.bundle
```

## ⚠️ Troubleshooting

### Si "npm install" échoue

Vérifier Node.js version:
```bash
node --version  # Doit être >= 20.0.0
npm --version   # Doit être >= 10.0.0
```

### Si le build échoue

1. Clean puis rebuild:
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

2. Vérifier que npx fonctionne:
```bash
npx --version
```

### Si l'erreur persiste

Générer le bundle manuellement:
```bash
cd packages/mobile
mkdir -p android/app/src/main/assets
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res
```

Puis rebuild:
```bash
cd android
./gradlew assembleRelease
```

## 📊 Build Logs

Pour voir les logs détaillés:
```bash
cd android
./gradlew assembleRelease --info
```

## 🎉 Succès du Build

Un build réussi affiche:
```
BUILD SUCCESSFUL in Xs
```

Et l'APK est créé avec le bundle JS inclus. Plus d'erreur "Unable to load script" ! 🎉
