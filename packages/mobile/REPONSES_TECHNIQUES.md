# 📱 TaxasGE Mobile - Réponses Techniques

## ❓ Questions Posées

### 1. Comment as-tu résolu le problème de `calculation_method` ?

**Problème identifié :**
```typescript
// ❌ AVANT - Interface FiscalService sans calculation_method
export interface FiscalService {
  id: string;
  code: string;
  name_es: string;
  // ... autres propriétés
  // ❌ calculation_method manquant !
}

// Mais utilisé partout dans le code :
const method = service.calculation_method; // ❌ TypeScript error
```

**Solution appliquée :**
```typescript
// ✅ APRÈS - Propriété ajoutée à l'interface
export interface FiscalService {
  id: string;
  code: string;
  name_es: string;
  name_fr?: string;
  name_en?: string;
  description_es?: string;
  description_fr?: string;      // ✅ Ajouté aussi
  description_en?: string;       // ✅ Ajouté aussi
  service_type?: string;
  calculation_method?: string;   // ✅ AJOUTÉ - Méthode de calcul
  expedition_amount: number;
  renewal_amount?: number;
  // ... autres propriétés
}
```

**Fichier modifié :** `packages/mobile/src/database/services/FiscalServicesService.ts`

**Valeurs possibles de `calculation_method` :**
D'après le schéma de la base de données (`schema.ts:150`), les valeurs valides sont :
- `'fixed_expedition'` - Montant fixe pour expédition
- `'fixed_renewal'` - Montant fixe pour renouvellement
- `'fixed_both'` - Montants fixes pour les deux
- `'percentage_based'` - Basé sur un pourcentage
- `'unit_based'` - Basé sur des unités
- `'tiered_rates'` - Taux par tranches
- `'formula_based'` - Basé sur une formule dynamique
- `'fixed_plus_unit'` - Fixe + unités

**Impact :**
- ✅ Plus d'erreur TypeScript "Property 'calculation_method' does not exist"
- ✅ Toutes les 48 utilisations de `calculation_method` dans le code sont maintenant valides
- ✅ Les tests unitaires (CalculatorEngine.test.ts) fonctionnent correctement
- ✅ CalculatorEngine, CalculationsService, CalculatorScreen peuvent tous accéder à cette propriété

**Fichiers impactés :**
- `services/CalculatorEngine.ts` (4 utilisations)
- `screens/CalculatorScreen.tsx` (2 utilisations)
- `screens/ServiceDetailScreen.tsx` (5 utilisations)
- `database/SyncService.ts` (2 utilisations)
- `database/services/CalculationHistoryService.ts` (10 utilisations)
- `database/services/CalculationsService.ts` (4 utilisations)
- `services/__tests__/CalculatorEngine.test.ts` (46 utilisations dans les tests)

---

### 2. La traduction est-elle gérée sur l'ensemble de l'application selon la langue du système avec fallback sur ES ?

**Réponse : OUI, mais partiellement**

#### ✅ Ce qui est géré (fonctionnel actuellement)

**1. Détection automatique de la langue système**

Fichier : `packages/mobile/src/App.js`

```javascript
const getSystemLanguage = () => {
  let locale;

  try {
    if (Platform.OS === 'ios') {
      locale = NativeModules.SettingsManager?.settings?.AppleLocale ||
               NativeModules.SettingsManager?.settings?.AppleLanguages?.[0];
    } else {
      // Android: Try I18nManager first
      locale = NativeModules.I18nManager?.localeIdentifier;

      // If undefined, try using Intl API
      if (!locale && typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        const dtf = new Intl.DateTimeFormat();
        locale = dtf.resolvedOptions().locale;
      }
    }
  } catch (error) {
    console.warn('[App] Error detecting system language:', error);
  }

  // Fallback logic
  if (!locale) return 'es'; // ✅ Fallback sur ES

  const lang = locale.toLowerCase();
  if (lang.startsWith('fr')) return 'fr';
  if (lang.startsWith('en')) return 'en';
  return 'es'; // ✅ Default = ES
};
```

**2. Écrans traduits dans App.js**

```javascript
const TEXTS = {
  es: {
    title: 'TaxasGE Mobile',
    subtitle: 'Gestión Fiscal - Guinea Ecuatorial',
    menuTitle: 'Menú Principal',
    chatbotButton: 'Asistente Chatbot',
    // ... etc
  },
  fr: {
    title: 'TaxasGE Mobile',
    subtitle: 'Gestion Fiscale - Guinée Équatoriale',
    menuTitle: 'Menu Principal',
    chatbotButton: 'Assistant Chatbot',
    // ... etc
  },
  en: {
    title: 'TaxasGE Mobile',
    subtitle: 'Tax Management - Equatorial Guinea',
    menuTitle: 'Main Menu',
    chatbotButton: 'Chatbot Assistant',
    // ... etc
  },
};

// Utilisation :
<Text>{TEXTS[currentLanguage].title}</Text>
```

**3. Fonctions utilitaires pour les services fiscaux**

Fichier : `packages/mobile/src/database/services/FiscalServicesService.ts`

```typescript
// ✅ Nom du service avec fallback
export function getServiceName(
  service: FiscalService,
  language: 'es' | 'fr' | 'en'
): string {
  switch (language) {
    case 'fr':
      return service.name_fr || service.name_es; // ✅ Fallback sur ES
    case 'en':
      return service.name_en || service.name_es; // ✅ Fallback sur ES
    default:
      return service.name_es; // ✅ ES par défaut
  }
}

// ✅ Description du service avec fallback
export function getServiceDescription(
  service: FiscalService,
  language: 'es' | 'fr' | 'en'
): string | undefined {
  switch (language) {
    case 'fr':
      return service.description_fr || service.description_es; // ✅ Fallback
    case 'en':
      return service.description_en || service.description_es; // ✅ Fallback
    default:
      return service.description_es; // ✅ ES par défaut
  }
}

// Autres fonctions helper :
export function getMinistryName(service: FiscalService): string | undefined
export function getCategoryName(service: FiscalService): string | undefined
export function getSectorName(service: FiscalService): string | undefined
```

**Utilisées dans :**
- `CalculatorScreen.tsx` (lignes 234, 337, 339-341)
- `ServiceDetailScreen.tsx` (lignes 427, 438-440)
- `ExportService.ts` (lignes 135, 165, 322, 373)

#### ⚠️ Ce qui N'EST PAS géré (à implémenter)

**1. Propagation de la langue dans tous les écrans**

Actuellement, la langue est détectée dans `App.js` mais:
- ❌ ChatbotScreen reçoit `language` en prop (OK ✅)
- ❌ Autres écrans (Calculator, ServiceDetail, etc.) ne reçoivent pas toujours la langue
- ❌ Pas de Context API pour partager la langue globalement

**Solution recommandée :**
```typescript
// Créer un LanguageContext
import React, { createContext, useContext } from 'react';

const LanguageContext = createContext<'es' | 'fr' | 'en'>('es');

export const useLanguage = () => useContext(LanguageContext);

// Dans App.js :
<LanguageContext.Provider value={currentLanguage}>
  {/* Tous les écrans ici */}
</LanguageContext.Provider>

// Dans n'importe quel composant :
const language = useLanguage();
const serviceName = getServiceName(service, language);
```

**2. Traductions manquantes dans la base de données**

Les services fiscaux ont des champs multilingues dans la DB :
- `name_es`, `name_fr`, `name_en` ✅
- `description_es`, `description_fr`, `description_en` ✅

Mais tous les services n'ont peut-être pas leurs traductions FR/EN complètes.

**3. Messages d'erreur et validations**

Dans CalculatorEngine et autres services, les messages d'erreur sont en anglais :
```typescript
throw new Error('Base amount is required for percentage-based calculation');
```

Devraient être traduits selon la langue.

#### 📊 Résumé

| Fonctionnalité | État | Fichier |
|----------------|------|---------|
| Détection langue système | ✅ Oui | App.js |
| Fallback sur ES | ✅ Oui | App.js, FiscalServicesService |
| UI App.js traduite | ✅ Oui | App.js (TEXTS) |
| Services fiscaux traduits | ✅ Oui | FiscalServicesService (helpers) |
| Propagation globale | ⚠️ Partielle | Seulement certains écrans |
| Messages d'erreur traduits | ❌ Non | CalculatorEngine, etc. |
| Context API pour langue | ❌ Non | À créer |

---

## 🔧 Solution au problème "Unable to load script"

**Problème :** Le bundle JavaScript n'était pas inclus dans l'APK malgré la configuration.

**Cause identifiée :** Le React Native Gradle Plugin nécessite `bundleInRelease = true` explicitement.

**Solution appliquée :**

```gradle
// android/app/build.gradle
react {
    root = file("../../")
    entryFile = file("../../index.js")
    bundleAssetName = "index.android.bundle"

    // ✅ CLÉS AJOUTÉES :
    bundleInDebug = false   // Pas de bundle en debug (utilise Metro)
    bundleInRelease = true  // ✅ Bundle OBLIGATOIRE en release

    autolinkLibrariesWithApp()
}
```

**Prochaine étape pour vous :**

```bash
cd packages/mobile/android
./gradlew clean
./gradlew assembleRelease
```

Le bundle sera automatiquement généré dans `android/app/build/generated/assets/createBundleReleaseJsAndAssets/`
et copié dans l'APK final.

---

## 🎯 Checklist de Vérification

Avant d'installer l'APK :

```bash
# 1. Vérifier que le bundle a été généré
ls -lh android/app/build/generated/assets/createBundleReleaseJsAndAssets/

# 2. Vérifier la taille de l'APK (doit être ~20-30 MB avec bundle)
ls -lh android/app/build/outputs/apk/release/app-release.apk

# 3. Vérifier les logs de build
# Devrait afficher : "Bundling index.android.bundle"
```

Si le bundle n'est toujours pas généré, générez-le manuellement AVANT le build :

```bash
cd packages/mobile
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

cd android
./gradlew assembleRelease
```
