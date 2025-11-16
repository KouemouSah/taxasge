# Guide de Build d'APK Standalone pour TaxasGE Mobile

## Problème Résolu

Ce guide résout l'erreur suivante lors de l'installation d'une APK sur une tablette :

```
Unable to load script. Make sure you're running Metro or that your bundle 'index.android.bundle' is packaged correctly for release.
```

## Cause du Problème

Cette erreur se produit lorsque :
1. L'APK est construit sans inclure le bundle JavaScript
2. L'application tente de se connecter au serveur Metro (mode développement)
3. Les assets JavaScript ne sont pas correctement empaquetés dans l'APK

## Solution

Nous avons créé un script de build automatisé qui :
1. ✅ Nettoie les builds précédents
2. ✅ Crée le répertoire assets nécessaire
3. ✅ Génère le bundle JavaScript avec tous les assets
4. ✅ Compile l'APK avec le bundle inclus
5. ✅ Vérifie que tout est correctement empaqueté

## Utilisation

### Méthode 1 : Via npm (Recommandé)

```bash
# Depuis le répertoire packages/mobile/

# Build APK standalone (utilise .env.offline par défaut)
npm run build:android:standalone

# Build APK standalone avec environnement offline explicite
npm run build:android:standalone:offline
```

### Méthode 2 : Script direct

```bash
# Depuis le répertoire packages/mobile/
./build-standalone-apk.sh

# Avec environnement spécifique
ENVFILE=.env.offline ./build-standalone-apk.sh
ENVFILE=.env.pro ./build-standalone-apk.sh
```

## Processus de Build

Le script effectue les étapes suivantes :

```
[1/5] Cleaning previous builds...
      ├─ Nettoie le cache Gradle
      └─ Supprime l'ancien répertoire assets

[2/5] Creating assets directory...
      └─ Crée android/app/src/main/assets/

[3/5] Generating JavaScript bundle...
      ├─ Bundle: index.android.bundle
      ├─ Source map: index.android.bundle.map
      └─ Assets: images, fonts, etc.

[4/5] Verifying bundle...
      └─ Vérifie que le bundle a été créé correctement

[5/5] Building release APK...
      └─ Compile l'APK avec Gradle
```

## Localisation de l'APK

Après un build réussi, l'APK se trouve à :

```
packages/mobile/android/app/build/outputs/apk/release/app-release.apk
```

## Installation sur Tablette

### Étape 1 : Transférer l'APK

Copiez l'APK sur votre tablette via :
- USB (MTP)
- Cloud (Google Drive, Dropbox, etc.)
- Email
- Serveur local

### Étape 2 : Activer les Sources Inconnues

1. Ouvrez **Paramètres** > **Sécurité**
2. Activez **Sources inconnues** ou **Installer des applications inconnues**
3. Autorisez l'application à installer des APK (ex: Gestionnaire de fichiers)

### Étape 3 : Installer l'APK

1. Ouvrez le **Gestionnaire de fichiers**
2. Naviguez vers l'emplacement de l'APK
3. Appuyez sur **app-release.apk**
4. Suivez les instructions d'installation

### Étape 4 : Lancer l'Application

L'application fonctionnera **complètement offline** sans avoir besoin du serveur Metro.

## Vérification du Bundle

Pour vérifier que le bundle est correctement inclus dans l'APK :

```bash
# Extraire et inspecter l'APK
cd packages/mobile/android/app/build/outputs/apk/release
unzip -l app-release.apk | grep "index.android.bundle"

# Vous devriez voir :
# assets/index.android.bundle
```

## Configuration Gradle

Le fichier `android/app/build.gradle` est configuré avec :

```gradle
react {
    // IMPORTANT: Empty list = bundle JS in ALL variants (including debug)
    // For standalone APK deployment without Metro server
    debuggableVariants = []

    autolinkLibrariesWithApp()
}
```

Cette configuration garantit que le bundle JavaScript est inclus dans **toutes** les variantes de build, y compris release.

## Configuration Hermes

Le projet utilise **Hermes** comme moteur JavaScript (voir `gradle.properties`) :

```properties
hermesEnabled=true
```

Hermes améliore :
- ✅ Performance de démarrage
- ✅ Utilisation mémoire réduite
- ✅ Taille de l'APK optimisée
- ✅ Compatibilité avec Supabase (via react-native-url-polyfill)

## Environnements

### Mode Offline (.env.offline)

Configuration pour utilisation 100% offline sans connexion backend :

```bash
ENVFILE=.env.offline ./build-standalone-apk.sh
```

### Mode Production (.env.pro)

Configuration avec connexion au backend Supabase :

```bash
ENVFILE=.env.pro ./build-standalone-apk.sh
```

## Dépannage

### Erreur : "Command not found: react-native"

```bash
# Installer les dépendances
npm install
```

### Erreur : "SDK location not found"

Créez `android/local.properties` :

```properties
sdk.dir=/home/YOUR_USERNAME/Android/Sdk
```

### Erreur : "Keystore not found"

Le build release nécessite un keystore. Vérifiez `gradle.properties` :

```properties
TAXASGE_UPLOAD_STORE_FILE=taxasge-release.keystore
TAXASGE_UPLOAD_KEY_ALIAS=taxasge
TAXASGE_UPLOAD_STORE_PASSWORD=taxasge2025
TAXASGE_UPLOAD_KEY_PASSWORD=taxasge2025
```

### APK installé mais écran blanc

Vérifiez les logs :

```bash
adb logcat | grep -i "ReactNative\|TaxasGE"
```

### Bundle trop volumineux

Pour réduire la taille :

1. Activer Proguard dans `build.gradle` :
   ```gradle
   def enableProguardInReleaseBuilds = true
   ```

2. Activer le mode release dans le bundle :
   ```bash
   # Le script utilise déjà --dev false
   ```

## Architecture Support

L'APK est compilé pour toutes les architectures (voir `gradle.properties`) :

```properties
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
```

Pour réduire la taille, créez des APK par architecture :

```bash
cd android
./gradlew bundleRelease  # Crée un Android App Bundle (.aab)
```

## Performance

L'APK standalone offre :
- ✅ Démarrage plus rapide (pas de connexion Metro)
- ✅ Fonctionnement offline complet
- ✅ Pas de dépendance au serveur de développement
- ✅ Prêt pour distribution production

## Sécurité

Pour la production :
1. Utilisez un keystore sécurisé (pas celui de debug)
2. Activez Proguard pour obfusquer le code
3. Testez l'APK sur différents appareils

## Support

Pour tout problème :
1. Vérifiez les logs du script de build
2. Consultez les logs Android : `adb logcat`
3. Vérifiez que le bundle existe : `ls -lh android/app/src/main/assets/`

---

**Note** : Ce script remplace l'ancienne méthode de build qui ne générait pas correctement le bundle JavaScript, causant l'erreur "Unable to load script".
