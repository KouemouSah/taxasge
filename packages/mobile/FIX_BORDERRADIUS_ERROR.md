# Fix: BorderRadius Runtime Error

## Problème
Erreur au lancement de l'application: `ReferenceError: property 'borderradius' doesn't exist`

## Cause
Le cache du Metro bundler n'a pas détecté les changements d'imports de BorderRadius. Les modifications du code ne sont pas reflétées dans le build de l'application.

## Solution

### Étape 1: Arrêter tous les processus
```bash
# Arrêter Metro bundler
pkill -f "react-native" || true
pkill -f "metro" || true
```

### Étape 2: Nettoyer les caches

#### Sur macOS/Linux:
```bash
cd packages/mobile

# Clear Metro cache
rm -rf $TMPDIR/react-* 2>/dev/null
rm -rf $TMPDIR/metro-* 2>/dev/null
rm -rf $TMPDIR/haste-* 2>/dev/null

# Clear watchman (si installé)
watchman watch-del-all

# Clear node modules cache
rm -rf node_modules/.cache

# Clear Android cache
rm -rf android/app/build
rm -rf android/.gradle

# Clear iOS cache (si applicable)
rm -rf ios/build
rm -rf ios/Pods
```

#### Sur Windows:
```bash
cd packages\mobile

# Clear Metro cache
rmdir /s /q %TEMP%\react-*
rmdir /s /q %TEMP%\metro-*
rmdir /s /q %TEMP%\haste-*

# Clear node modules cache
rmdir /s /q node_modules\.cache

# Clear Android cache
rmdir /s /q android\app\build
rmdir /s /q android\.gradle
```

### Étape 3: Nettoyer et rebuilder

#### Pour Android:
```bash
cd packages/mobile

# Nettoyer le projet Android
cd android && ./gradlew clean && cd ..

# Démarrer Metro avec reset-cache
npx react-native start --reset-cache
```

Dans un autre terminal:
```bash
cd packages/mobile
npx react-native run-android
```

#### Pour iOS:
```bash
cd packages/mobile

# Réinstaller les pods
cd ios && pod deintegrate && pod install && cd ..

# Démarrer Metro avec reset-cache
npx react-native start --reset-cache
```

Dans un autre terminal:
```bash
cd packages/mobile
npx react-native run-ios
```

### Étape 4: Vérifier les changements

Les modifications suivantes ont été apportées:
- ✅ Ajout de l'import `BorderRadius` dans HomeScreen.tsx
- ✅ `BorderRadius` est correctement exporté depuis `theme/index.ts`
- ✅ Toutes les références à `BorderRadius.*` ont les imports nécessaires

## Alternative rapide

Si vous préférez une commande rapide:

```bash
cd packages/mobile
npx react-native start --reset-cache &
sleep 3
npx react-native run-android  # ou run-ios pour iOS
```

## Note importante
Cette erreur se produit uniquement au runtime car le Metro bundler a mis en cache une version du code où `BorderRadius` n'était pas encore importé. Après le nettoyage du cache et le rebuild, l'erreur devrait disparaître.
