# Guide de Build APK - TaxasGE Mobile

## Construction d'un APK Release (Installation Offline)

### Prérequis
- Node.js >= 20.0.0
- npm >= 10.0.0
- Android SDK configuré
- Java JDK 17 ou supérieur

### Scripts disponibles

#### 1. Build complet (recommandé)
```bash
npm run build:android
```
Cette commande :
- Génère automatiquement le bundle JavaScript (`index.android.bundle`)
- Place le bundle dans `android/app/src/main/assets/`
- Compile l'APK avec Gradle
- Produit un APK standalone fonctionnant **sans Metro** et **totalement offline**

#### 2. Build propre (si vous rencontrez des problèmes)
```bash
npm run build:android:clean
```
Cette commande :
- Nettoie les bundles précédents
- Nettoie le cache Gradle
- Reconstruit tout depuis zéro

#### 3. Génération du bundle uniquement
```bash
npm run bundle:android
```
Génère uniquement le bundle JavaScript sans compiler l'APK.

#### 4. Nettoyage du bundle
```bash
npm run bundle:android:clean
```
Supprime les bundles et assets générés.

### Localisation de l'APK généré

Après le build, l'APK se trouve ici :
```
android/app/build/outputs/apk/release/app-release.apk
```

### Installation sur tablette

#### Via ADB (câble USB)
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

#### Transfert manuel
1. Copiez le fichier `app-release.apk` sur votre tablette
2. Ouvrez le fichier depuis le gestionnaire de fichiers
3. Autorisez l'installation depuis sources inconnues si demandé
4. Installez l'application

### Signature de l'APK (Production)

Pour signer l'APK en production, créez un fichier `gradle.properties` dans `android/` :

```properties
TAXASGE_UPLOAD_STORE_FILE=../my-release-key.keystore
TAXASGE_UPLOAD_STORE_PASSWORD=*****
TAXASGE_UPLOAD_KEY_ALIAS=my-key-alias
TAXASGE_UPLOAD_KEY_PASSWORD=*****
```

Puis générez votre keystore :
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Résolution des problèmes courants

#### Erreur "unable to load script"
✅ **Solution** : Utilisez `npm run build:android` au lieu de `cd android && ./gradlew assembleRelease`

Cette erreur se produit quand le bundle JavaScript n'est pas inclus dans l'APK. Notre script `build:android` génère automatiquement le bundle avant la compilation.

#### APK trop volumineux
- Activez ProGuard en modifiant `enableProguardInReleaseBuilds = true` dans `build.gradle`
- Utilisez les splits APK par architecture (ARM, x86)

#### Problèmes de cache
```bash
npm run clean
npm run build:android:clean
```

### Mode de fonctionnement

L'application construite avec `npm run build:android` :
- ✅ Fonctionne **totalement offline**
- ✅ N'a **pas besoin de Metro** pour fonctionner
- ✅ Inclut tout le code JavaScript dans l'APK
- ✅ Peut être installée sur n'importe quelle tablette Android
- ✅ Fonctionne sans connexion internet ni serveur de développement

### Configuration technique

Le bundle JavaScript est généré avec ces paramètres :
- **Plateforme** : android
- **Mode** : production (dev=false)
- **Fichier d'entrée** : index.js
- **Sortie** : android/app/src/main/assets/index.android.bundle
- **Assets** : android/app/src/main/res

Cette configuration est définie dans :
- `package.json` : scripts npm
- `android/app/build.gradle` : configuration React Native (lignes 37-40)
