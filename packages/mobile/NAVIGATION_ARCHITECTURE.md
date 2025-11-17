# TaxasGE Mobile - Navigation & Architecture Guide

## 📱 Vue d'Ensemble

TaxasGE Mobile est une application React Native pour la gestion des services fiscaux de Guinée Équatoriale, avec support dual-version (Offline/Pro) et architecture offline-first.

## 🗺️ Flux de Navigation

### Architecture de Navigation

L'application utilise une navigation basée sur un système de state management simple dans `App.js`.

```
Home Screen (Menu Principal)
├── 💬 Chatbot
│   └── Retour → Home
├── 🔍 Search (Services List)
│   ├── Sélection Service → Service Detail
│   │   ├── Bouton Calculer → Calculator
│   │   └── Retour → Search
│   └── Retour → Home
├── 🧮 Calculator (redirects to Search)
│   └── Redirige vers Search pour sélectionner un service
└── ⭐ Favorites
    ├── Sélection Service → Service Detail
    │   ├── Bouton Calculer → Calculator
    │   └── Retour → Favorites
    ├── Action Calculer directe → Calculator
    │   └── Retour → Service Detail
    └── Retour → Home
```

## 📂 Structure des Écrans

### Écrans Actifs

| Écran | Fichier | Status | Description |
|-------|---------|--------|-------------|
| **Home** | `App.js` | ✅ Actif | Menu principal avec 4 options |
| **Chatbot** | `ChatbotScreen.tsx` | ✅ Actif | Assistant FAQ avec 60+ questions |
| **Search** | `ServiceListScreen.tsx` | ✅ Actif | Liste de 850 services avec filtres |
| **Service Detail** | `ServiceDetailScreen.tsx` | ✅ Actif | Détails complets d'un service |
| **Calculator** | `CalculatorScreen.tsx` | ✅ Actif | Calcul des coûts fiscaux |
| **Favorites** | `FavoritesScreen.tsx` | ✅ Actif | Gestion des favoris utilisateur |
| **Onboarding** | `OnboardingScreen.tsx` | ✅ Actif | Premier lancement avec sync |

### State Management

```javascript
// App.js - States principaux
const [currentScreen, setCurrentScreen] = useState('home');
const [selectedService, setSelectedService] = useState(null);
const [currentLanguage, setCurrentLanguage] = useState('es');
```

## 🔄 Workflows de Navigation

### 1. Recherche → Détail → Calculatrice

```javascript
// User flow
Search Screen
  → Click on service
  → Service Detail Screen
    → Click "Calcular"
    → Calculator Screen
      → Back → Service Detail

// Code flow
ServiceListScreen.onServicePress(service)
  → setSelectedService(service)
  → setCurrentScreen('serviceDetail')
    → ServiceDetailScreen.onCalculate(service)
      → setCurrentScreen('calculator')
```

### 2. Favoris → Calculatrice (Direct)

```javascript
// User flow
Favorites Screen
  → Click "Calculate" on favorite
  → Calculator Screen
    → Back → Service Detail

// Code flow
FavoritesScreen.onCalculate(service)
  → setSelectedService(service)
  → setCurrentScreen('calculator')
```

### 3. Menu → Calculatrice (Redirection)

```javascript
// User flow
Home Screen
  → Click "Calculadora"
  → Redirects to Search Screen
  → Select service first

// Code flow
Calculator button onClick
  → setCurrentScreen('search')
  → Log: "Redirecting to search to select service"
```

## 📋 Props des Écrans

### ServiceListScreen

```typescript
interface ServicesListScreenProps {
  language: 'es' | 'fr' | 'en';
  onBack?: () => void;
  onServicePress?: (service: FiscalService) => void;
}
```

### ServiceDetailScreen

```typescript
interface ServiceDetailScreenProps {
  service: FiscalService;
  language: 'es' | 'fr' | 'en';
  onBack?: () => void;
  onCalculate?: (service: FiscalService) => void;
}
```

### CalculatorScreen

```typescript
interface CalculatorScreenProps {
  service: FiscalService;
  language: 'es' | 'fr' | 'en';
  userId?: string;
  onBack?: () => void;
}
```

### FavoritesScreen

```typescript
interface FavoritesScreenProps {
  language: 'es' | 'fr' | 'en';
  userId: string;
  onBack: () => void;
  onServicePress?: (service: FavoriteService) => void;
  onCalculate?: (service: FavoriteService) => void;
}
```

## 🎨 Fonctionnalités par Écran

### 🏠 Home Screen

**Fonctionnalités** :
- Sélection de langue (ES/FR/EN)
- 4 boutons de navigation
- Affichage de la version (Offline/Pro)
- Footer avec informations MVP

**Navigation** :
- Chatbot → ChatbotScreen
- Buscar Servicios → ServiceListScreen
- Calculadora → ServiceListScreen (redirect)
- Favoritos → FavoritesScreen

### 💬 Chatbot Screen

**Fonctionnalités** :
- 60+ FAQ sur services fiscaux
- Recherche intelligente
- Support multilingue
- Mode streaming pour réponses

**Base de données** :
- Table : `chatbot_faq`
- ~60 entrées

### 🔍 Search Screen (ServiceListScreen)

**Fonctionnalités** :
- Affichage de 850 services fiscaux
- Recherche par nom
- Filtres :
  - Ministère (14 options)
  - Catégorie (98 options)
  - Type (expedition/renewal)
  - Méthode de calcul (8 types)
  - Prix (min/max)
- Tri :
  - Nom (A-Z, Z-A)
  - Prix (bas-haut, haut-bas)
  - Popularité
- Pagination
- Exportation (CSV, JSON, texte)
- Partage

**Base de données** :
- Table : `fiscal_services`
- 850 services

### 📄 Service Detail Screen

**Fonctionnalités** :
- Informations complètes du service
- Prix expedition/renewal
- Catégorie, secteur, ministère
- Documents requis
- Procédures avec étapes détaillées
- Bouton "Calculer" → Calculator
- Option "Ajouter aux favoris"

**Base de données** :
- Tables : `fiscal_services`, `document_templates`, `procedure_templates`, `procedure_template_steps`

### 🧮 Calculator Screen

**Fonctionnalités** :
- Formulaire dynamique basé sur la méthode de calcul
- Support de 8 méthodes :
  - Prix fixe (expedition/renewal/both)
  - Basé sur pourcentage
  - Basé sur unités
  - Tarifs escalonés
  - Basé sur formule
  - Fixe + unités
- Calcul en temps réel
- Sauvegarde de l'historique
- Exportation PDF/Image
- Partage des résultats

**Base de données** :
- Table : `calculation_history`
- Sauvegarde automatique si userId fourni

### ⭐ Favorites Screen

**Fonctionnalités** :
- Liste des services favoris
- Notes personnalisées par service
- Swipe actions (supprimer, éditer)
- Accès rapide au calcul
- Réorganisation (ordre personnalisé)
- Bouton "Tout effacer"

**Base de données** :
- Table : `user_favorites`
- Lié au userId

## 🗄️ Base de Données

### Tables Synchronisées (Offline Version)

```javascript
// 12 tables, ~15,200 records, ~1.5 MB
const SYNC_TABLES_OFFLINE = [
  'ministries',                    // 14 records
  'sectors',                       // 16 records
  'categories',                    // 98 records
  'fiscal_services',               // 850 records
  'service_keywords',              // 100 records (top)
  'procedure_templates',           // 703 records
  'procedure_template_steps',      // 2,077 records
  'document_templates',            // 792 records
  'service_procedure_assignments', // 850 records
  'service_document_assignments',  // 1,234 records
  'entity_translations',           // ~8,420 records
  'chatbot_faq',                   // ~60 records
];
```

### Tables Utilisateur (Pro Version Only)

```javascript
const USER_TABLES_PRO = [
  'user_favorites',      // Favoris
  'calculation_history', // Historique calculs
  'declarations',        // Déclarations fiscales
  'user_profiles',       // Profils utilisateur
];
```

## 🌐 Multilingue

### Langues Supportées

- **ES** (Espagnol) - Langue par défaut
- **FR** (Français)
- **EN** (Anglais)

### Détection Automatique

L'app détecte automatiquement la langue du système au démarrage :

```javascript
const systemLang = getSystemLanguage();
// Returns: 'es' | 'fr' | 'en'
```

### Sélection Manuelle

Sélecteur de langue disponible sur l'écran Home :
- Toggle ES / FR / EN
- Sauvegardé dans le state local
- Appliqué à tous les écrans

## 📱 Versions de l'Application

### Version Offline

```env
APP_VERSION=offline
REQUIRE_AUTH=false
ENABLE_DECLARATIONS=false
SYNC_MODE=monthly
```

**Caractéristiques** :
- ✅ Pas d'authentification
- ✅ 12 tables publiques
- ✅ Sync mensuelle (download only)
- ✅ User ID: `offline_user_local`
- ✅ Favoris locaux uniquement

### Version Pro

```env
APP_VERSION=pro
REQUIRE_AUTH=true
ENABLE_DECLARATIONS=true
SYNC_MODE=instant
```

**Caractéristiques** :
- ✅ Authentification requise
- ✅ 16 tables (12 publiques + 4 utilisateur)
- ✅ Sync instantanée bidirectionnelle
- ✅ User ID: Authenticated user
- ✅ Cloud sync des favoris et historique

## 🔧 Configuration

### AppConfig Auto-Log

La configuration est automatiquement loggée au démarrage :

```javascript
// AppConfig.js - Auto-log on module load
logConfiguration();
```

**Output Console** :
```
[AppConfig] ========================================
[AppConfig] TaxasGE Mobile Configuration
[AppConfig] ========================================
[AppConfig] Version: offline
[AppConfig] App Name: TaxasGE Offline
[AppConfig] Bundle ID: com.taxasge.offline
[AppConfig] ========================================
[AppConfig] Sync Mode: monthly
[AppConfig] Sync Tables: ["ministries", "sectors", ...]
[AppConfig] ========================================
```

## 🚀 Builds

### Build Local

```bash
# Offline standalone APK
npm run build:android:standalone:offline

# Pro standalone APK
ENVFILE=.env.pro npm run build:android:standalone
```

### Build CI/CD (GitHub Actions)

Configuration automatique via `debuggableVariants = []` dans `build.gradle`.

**Télécharger l'APK** :
1. GitHub Actions → Workflow run
2. Artifacts → `taxasge-android-{env}-{sha}.zip`
3. Extraire `app-debug.apk`

**Voir** : [GITHUB_ACTIONS_APK_VERIFICATION.md](./GITHUB_ACTIONS_APK_VERIFICATION.md)

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [STANDALONE_APK_BUILD.md](./STANDALONE_APK_BUILD.md) | Guide complet build APK standalone |
| [BUILD_REQUIREMENTS.md](./BUILD_REQUIREMENTS.md) | Prérequis environnement |
| [GITHUB_ACTIONS_APK_VERIFICATION.md](./GITHUB_ACTIONS_APK_VERIFICATION.md) | Vérification APK CI/CD |
| [DUAL_VERSION_SETUP.md](./DUAL_VERSION_SETUP.md) | Architecture dual-version |
| [SOLUTION_OFFLINE_APK.md](./SOLUTION_OFFLINE_APK.md) | Solution erreur "Unable to load script" |

## 🐛 Troubleshooting

### Navigation ne fonctionne pas

**Symptôme** : Écran ne change pas après clic

**Solution** :
```javascript
// Vérifier les logs console
console.log('[App] currentScreen:', currentScreen);
console.log('[App] selectedService:', selectedService);
```

### Calculator s'ouvre sans service

**Symptôme** : Warning "CalculatorScreen called without selected service"

**Cause** : Navigation directe vers calculator sans passer par selection

**Solution** : Toujours utiliser le workflow Search → Detail → Calculator

### Service detail affiche null

**Symptôme** : ServiceDetailScreen affiche écran vide

**Cause** : `selectedService` est null

**Solution** : Vérifier que `onServicePress` set correctement le service

## 🎯 Prochaines Améliorations

### Phase 2 (Future)

- [ ] React Navigation (pour stack navigation et deep linking)
- [ ] Redux/Context API (state management global)
- [ ] Offline queue pour actions utilisateur
- [ ] Push notifications
- [ ] Deep linking vers services spécifiques
- [ ] Historique de navigation (back button natif)

### Phase 3 (Future)

- [ ] Animations de transition
- [ ] Gestures (swipe back, etc.)
- [ ] Tab navigation
- [ ] Modal bottomsheet pour détails rapides
- [ ] Search bar persistante

---

**Version** : 1.0.0
**Date** : 2025-11-16
**React Native** : 0.80.0
**Author** : KOUEMOU SAH Jean Emac
