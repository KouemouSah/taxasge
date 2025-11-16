# Solution : APK Offline - "Unable to load script"

## 🎯 Problème Résolu

**Erreur rencontrée** :
```
Unable to load script. Make sure you're running Metro or that your bundle 'index.android.bundle' is packaged correctly for release.
```

## ✅ Solution Rapide

### Étape 1 : Installer les dépendances (si nécessaire)

```bash
cd packages/mobile
npm install
```

### Étape 2 : Build l'APK standalone

```bash
npm run build:android:standalone:offline
```

### Étape 3 : Récupérer l'APK

L'APK est générée à :
```
packages/mobile/android/app/build/outputs/apk/release/app-release.apk
```

### Étape 4 : Installer sur tablette

1. Copier l'APK sur votre tablette
2. Activer "Sources inconnues" dans Paramètres > Sécurité
3. Ouvrir et installer l'APK
4. ✅ L'application fonctionnera complètement offline !

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| **[STANDALONE_APK_BUILD.md](./STANDALONE_APK_BUILD.md)** | Guide complet du build standalone avec troubleshooting |
| **[BUILD_REQUIREMENTS.md](./BUILD_REQUIREMENTS.md)** | Prérequis et configuration de l'environnement |
| **[DUAL_VERSION_SETUP.md](./DUAL_VERSION_SETUP.md)** | Configuration des versions Offline et Pro |

## 🔧 Que Fait la Solution ?

Le script `build-standalone-apk.sh` automatise les étapes suivantes :

1. **Nettoyage** - Supprime les anciens builds et cache
2. **Création répertoire assets** - Crée `android/app/src/main/assets/`
3. **Génération bundle JavaScript** - Compile tout le code JS en un seul fichier
4. **Copie des assets** - Inclut images, fonts, etc.
5. **Build APK** - Compile l'APK avec le bundle inclus
6. **Vérification** - Confirme que tout est correctement empaqueté

## 🚀 Commandes Disponibles

```bash
# Build APK standalone offline (recommandé pour votre cas)
npm run build:android:standalone:offline

# Build APK standalone pro (avec connexion backend)
ENVFILE=.env.pro npm run build:android:standalone

# Script direct avec options
./build-standalone-apk.sh
ENVFILE=.env.pro ./build-standalone-apk.sh
```

## 🔍 Vérification du Build

Après le build, vous devriez voir :

```
============================================================================
Build Successful!
============================================================================

APK Location:
  /path/to/android/app/build/outputs/apk/release/app-release.apk
  Size: 45M

SHA256:
  a1b2c3d4e5f6... app-release.apk

Installation Instructions:
  1. Copy the APK to your tablet
  2. Enable 'Install from Unknown Sources' in Settings
  3. Open the APK file to install
  4. The app will run completely offline without Metro server

All done! Your standalone APK is ready for offline installation.
============================================================================
```

## ⚙️ Configuration Technique

### Gradle (android/app/build.gradle)

```gradle
react {
    // IMPORTANT: Bundle JS dans TOUTES les variantes (debug et release)
    debuggableVariants = []

    autolinkLibrariesWithApp()
}
```

### Hermes (gradle.properties)

```properties
hermesEnabled=true
```

Hermes est activé pour :
- ✅ Meilleure performance
- ✅ Taille APK réduite
- ✅ Démarrage plus rapide

## 📱 Test de l'APK

### Avant Installation
```bash
# Vérifier que le bundle est inclus
cd android/app/build/outputs/apk/release
unzip -l app-release.apk | grep "index.android.bundle"

# Vous devriez voir :
# assets/index.android.bundle
```

### Après Installation

Sur votre tablette, vérifier :
1. ✅ L'app démarre sans erreur
2. ✅ Pas de message "Unable to load script"
3. ✅ L'app fonctionne sans connexion Metro
4. ✅ Toutes les fonctionnalités sont accessibles

## 🐛 Dépannage Rapide

### L'APK ne se construit pas

**Problème** : Erreur lors du build

**Solutions** :
1. Vérifier que le SDK Android est installé
2. Vérifier `ANDROID_HOME` : `echo $ANDROID_HOME`
3. Créer `android/local.properties` si nécessaire
4. Voir [BUILD_REQUIREMENTS.md](./BUILD_REQUIREMENTS.md)

### Le bundle n'est pas généré

**Problème** : Erreur "react-native: command not found"

**Solution** :
```bash
npm install
```

### L'APK est trop volumineuse

**Solutions** :
1. Activer Proguard dans `build.gradle`
2. Build par architecture : `./gradlew bundleRelease`
3. Voir [STANDALONE_APK_BUILD.md](./STANDALONE_APK_BUILD.md)

## 💡 Pourquoi Ça Fonctionne ?

### Avant (❌ Ne fonctionnait pas)

```
Build APK sans bundle
   ↓
APK installée sur tablette
   ↓
App démarre
   ↓
Cherche Metro server (non disponible)
   ↓
❌ "Unable to load script"
```

### Après (✅ Fonctionne)

```
Build avec script standalone
   ↓
Génère index.android.bundle
   ↓
Inclut bundle dans APK
   ↓
APK installée sur tablette
   ↓
App démarre
   ↓
Charge bundle depuis APK
   ↓
✅ App fonctionne offline !
```

## 📦 Structure du Bundle

L'APK standalone contient :

```
app-release.apk
├── assets/
│   ├── index.android.bundle          # ← Code JavaScript compilé
│   ├── index.android.bundle.map      # ← Source map (debug)
│   └── [autres assets]               # Images, fonts, etc.
├── lib/
│   ├── arm64-v8a/
│   ├── armeabi-v7a/
│   ├── x86/
│   └── x86_64/
└── [autres fichiers APK]
```

## 🔐 Sécurité

Pour la production, n'oubliez pas :
1. ✅ Générer un keystore de release
2. ✅ Sécuriser les credentials
3. ✅ Activer Proguard
4. ✅ Tester sur plusieurs appareils

Voir [BUILD_REQUIREMENTS.md](./BUILD_REQUIREMENTS.md) section "Keystore de Signature"

## 📞 Support

Si vous rencontrez des problèmes :

1. **Consulter la documentation** :
   - [STANDALONE_APK_BUILD.md](./STANDALONE_APK_BUILD.md)
   - [BUILD_REQUIREMENTS.md](./BUILD_REQUIREMENTS.md)

2. **Vérifier les logs** :
   ```bash
   # Logs du build
   cd android && ./gradlew assembleRelease --stacktrace

   # Logs de l'app (si installée)
   adb logcat | grep -i "ReactNative\|TaxasGE"
   ```

3. **Vérifier les prérequis** :
   - Node.js >= 20.0.0
   - Android SDK installé
   - ANDROID_HOME configuré
   - Keystore de release (pour production)

---

## 🎉 Résumé

**Problème** : APK sans bundle JavaScript → Erreur "Unable to load script"

**Solution** : Script de build standalone qui génère et inclut le bundle

**Commande** : `npm run build:android:standalone:offline`

**Résultat** : APK fonctionnelle, installation offline, aucune dépendance Metro

**Status** : ✅ **RÉSOLU**

---

**Créé le** : 2025-11-16
**Version** : 1.0.0
**Testé sur** : React Native 0.80.0, Android SDK 35
