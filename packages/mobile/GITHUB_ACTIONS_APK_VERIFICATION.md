# Vérification APK GitHub Actions - Bundle JavaScript Inclus

## ✅ Configuration Actuelle

Votre workflow GitHub Actions est **déjà configuré correctement** pour générer des APK standalone avec le bundle JavaScript inclus.

### Configuration Gradle (android/app/build.gradle)

```gradle
react {
    // IMPORTANT: Empty list = bundle JS in ALL variants (including debug)
    // For standalone APK deployment without Metro server
    debuggableVariants = []

    autolinkLibrariesWithApp()
}
```

**Cette ligne est CRITIQUE** : `debuggableVariants = []`

- ✅ Par défaut, React Native ne bundle pas le JS dans les builds debug
- ✅ En définissant une liste vide, on force le bundling dans **TOUTES** les variantes
- ✅ Résultat : APK fonctionnelle sans Metro, même en debug

### Workflow GitHub Actions (.github/workflows/mobile-ci.yml)

```yaml
- name: 🏗️ Build Android APK
  run: |
    cd packages/mobile/android
    ./gradlew clean assembleDebug --no-daemon --stacktrace
```

- ✅ Build APK debug avec Gradle
- ✅ Grâce à `debuggableVariants = []`, le bundle JS est inclus automatiquement
- ✅ L'APK générée peut être installée et utilisée sans Metro

## 🔍 Comment Vérifier que le Bundle est Inclus

### Méthode 1 : Via GitHub Actions Artifacts

1. Allez sur votre workflow GitHub Actions qui a réussi
2. Téléchargez l'artifact APK : `taxasge-android-{environment}-{sha}`
3. Vérifiez que le bundle est inclus :

```bash
# Extraire l'APK
unzip -l app-debug.apk | grep "assets/index.android.bundle"

# Vous devriez voir :
# assets/index.android.bundle
```

### Méthode 2 : Via Logs du Workflow

Dans les logs GitHub Actions, cherchez :

```
> Task :app:createBundleDebugJsAndAssets
```

Si vous voyez cette tâche s'exécuter, cela signifie que le bundle est généré.

### Méthode 3 : Tester l'APK sur Tablette

1. Téléchargez l'APK depuis GitHub Actions artifacts
2. Installez sur votre tablette (en mode avion pour tester offline)
3. Lancez l'application
4. ✅ Si l'app démarre normalement = bundle inclus
5. ❌ Si erreur "Unable to load script" = bundle manquant

## 📊 Différence Debug vs Release

### APK Debug (actuel dans workflow)

```bash
./gradlew assembleDebug
```

**Avantages** :
- ✅ Build plus rapide
- ✅ Includes source maps pour debugging
- ✅ Logs détaillés
- ✅ Avec `debuggableVariants = []`, inclut le bundle JS

**Inconvénients** :
- ❌ APK plus volumineuse (~50-60 MB)
- ❌ Performance légèrement inférieure
- ❌ Pas de ProGuard/R8 (code non obfusqué)

### APK Release (recommandé pour production)

```bash
./gradlew assembleRelease
```

**Avantages** :
- ✅ APK optimisée (~30-40 MB)
- ✅ Meilleure performance
- ✅ Code obfusqué (avec ProGuard)
- ✅ Bundle JS minifié
- ✅ Production-ready

**Inconvénients** :
- ❌ Build plus lent
- ❌ Nécessite keystore de signature

## 🚀 Recommandations pour Production

### Option 1 : Utiliser le Script Standalone dans CI/CD

Modifiez le workflow pour utiliser le script de build standalone :

```yaml
- name: 🏗️ Build Standalone APK (Offline)
  run: |
    cd packages/mobile
    npm run build:android:standalone:offline
```

**Avantages** :
- ✅ Build optimisé automatiquement
- ✅ Vérifications intégrées
- ✅ Logs détaillés du processus
- ✅ APK release avec bundle vérifié

### Option 2 : Build Release via Gradle

```yaml
- name: 🏗️ Build Android Release APK
  run: |
    cd packages/mobile/android

    # Créer le répertoire assets
    mkdir -p app/src/main/assets

    # Générer le bundle JS
    cd ..
    npx react-native bundle \
      --platform android \
      --dev false \
      --entry-file index.js \
      --bundle-output android/app/src/main/assets/index.android.bundle \
      --assets-dest android/app/src/main/assets

    # Build l'APK release
    cd android
    ./gradlew assembleRelease --no-daemon --stacktrace
```

### Option 3 : Garder Debug mais Vérifier

Si vous préférez rester en debug pour le moment :

```yaml
- name: 🏗️ Build Android Debug APK
  run: |
    cd packages/mobile/android
    ./gradlew clean assembleDebug --no-daemon --stacktrace

- name: ✅ Verify Bundle Inclusion
  run: |
    cd packages/mobile/android
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"

    if unzip -l "$APK_PATH" | grep -q "assets/index.android.bundle"; then
      echo "✅ Bundle JavaScript trouvé dans l'APK"
      BUNDLE_SIZE=$(unzip -l "$APK_PATH" | grep "index.android.bundle" | awk '{print $1}')
      echo "📦 Taille du bundle: $BUNDLE_SIZE bytes"
    else
      echo "❌ ERREUR: Bundle JavaScript manquant dans l'APK!"
      exit 1
    fi
```

## 🎯 Configuration Actuelle : Verdict

### Pour Développement/Test

✅ **La configuration actuelle est PARFAITE** :
- Le workflow génère un APK debug
- Grâce à `debuggableVariants = []`, le bundle est inclus
- L'APK peut être installée et testée sans Metro
- Parfait pour validation rapide

### Pour Production

⚠️ **Recommandé : Passer à Release** :
- Modifier le workflow pour `assembleRelease`
- Ou utiliser `npm run build:android:standalone:offline`
- Générer une APK optimisée et signée
- Meilleure performance et taille réduite

## 🔐 Configuration Keystore pour Release

Si vous voulez builder en release, vous devez configurer le keystore dans GitHub Secrets :

### 1. Créer GitHub Secrets

```
ANDROID_KEYSTORE_BASE64  # Keystore encodé en base64
ANDROID_KEY_ALIAS        # taxasge
ANDROID_STORE_PASSWORD   # taxasge2025
ANDROID_KEY_PASSWORD     # taxasge2025
```

### 2. Encoder le Keystore

```bash
# Sur votre machine locale
cd packages/mobile/android/app
base64 -i taxasge-release.keystore | pbcopy  # macOS
base64 -i taxasge-release.keystore            # Linux
```

### 3. Ajouter au Workflow

```yaml
- name: 🔐 Setup Release Keystore
  run: |
    cd packages/mobile/android/app
    echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > taxasge-release.keystore

    # Vérifier que le keystore existe
    if [ -f "taxasge-release.keystore" ]; then
      echo "✅ Keystore décodé avec succès"
    else
      echo "❌ Erreur lors du décodage du keystore"
      exit 1
    fi

- name: 🏗️ Build Release APK
  env:
    TAXASGE_UPLOAD_STORE_PASSWORD: ${{ secrets.ANDROID_STORE_PASSWORD }}
    TAXASGE_UPLOAD_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
  run: |
    cd packages/mobile/android
    ./gradlew assembleRelease --no-daemon --stacktrace
```

## 📝 Résumé

| Configuration | Bundle Inclus ? | Metro Requis ? | Utilisation |
|--------------|-----------------|----------------|-------------|
| **Debug (actuel avec `debuggableVariants = []`)** | ✅ Oui | ❌ Non | ✅ Parfait pour dev/test |
| **Debug (par défaut RN)** | ❌ Non | ✅ Oui | ❌ Ne fonctionne pas offline |
| **Release** | ✅ Oui | ❌ Non | ✅ Production optimisée |
| **Standalone script** | ✅ Oui | ❌ Non | ✅ Best practice |

## ✅ Conclusion

**Votre configuration actuelle est CORRECTE** pour générer des APK fonctionnelles sans Metro !

La ligne `debuggableVariants = []` garantit que le bundle JavaScript est inclus dans toutes les variantes, y compris debug.

**Actions recommandées** :

1. ✅ **Aucune modification urgente nécessaire** - Le workflow actuel fonctionne
2. 📊 **Vérification** - Téléchargez l'APK artifact et testez sur tablette
3. 🚀 **Optimisation future** - Envisagez de passer à `assembleRelease` pour production
4. 📖 **Documentation** - Consultez `STANDALONE_APK_BUILD.md` pour builds locaux

---

**Créé le** : 2025-11-16
**Status** : ✅ Configuration validée
**Workflow** : `.github/workflows/mobile-ci.yml`
**Build Gradle** : `packages/mobile/android/app/build.gradle`
