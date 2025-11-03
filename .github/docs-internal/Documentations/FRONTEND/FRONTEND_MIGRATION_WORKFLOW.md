# 🔄 WORKFLOW MIGRATION FRONTEND - REACT ROUTER → NEXT.JS

**Version** : 1.0  
**Date** : 31 Octobre 2025  
**Statut** : 🟢 EN COURS - Phase 1 Active  
**Objectif** : Migration progressive templates React Router vers Next.js App Router


## ⚠️ DEUX MODES DE TRAVAIL

┌────────────────────────────────────────────────────────────────┐
│  📋 MODE 1 : MIGRATION                                         │
│  Page existe dans C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/src/pages/                                │
├────────────────────────────────────────────────────────────────┤
│  Action : Transformer template existant → Next.js              │
│                                                                 │
│  ✅ COPIER UI du template source (structure, styles, layout)   │
│  ✅ ADAPTER code technique (routing Next.js, API integration)  │
│  ✅ GARDER apparence identique (design, couleurs, espaces)     │
│  ❌ NE PAS modifier visuellement sauf en cas de précision utilisateur                              │
│                                                                 │
│  Exemple : Login (template C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/src/pages/Auth.tsx existe)       │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  🆕 MODE 2 : CRÉATION                                          │
│  Page n'existe PAS dans C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/                         │
├────────────────────────────────────────────────────────────────┤
│  Action : Créer nouvelle page en respectant design system      │
│                                                                 │
│  ✅ IDENTIFIER page référence similaire (voir tableau)         │
│  ✅ RÉUTILISER structure HTML + classes Tailwind référence     │
│  ✅ COPIER layout, composants, styles de la référence          │
│  ✅ ADAPTER contenu spécifique (textes, champs, endpoints)     │
│  ❌ NE PAS inventer nouveau design                             │
│                                                                 │
│  Exemple : Forgot Password (pas de template, réf: Auth.tsx)    │
└────────────────────────────────────────────────────────────────┘








---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Phase 1 : Authentification](#phase-1--authentification-priorité-critique)
3. [Phase 2 : Dashboard](#phase-2--dashboard-après-auth)
4. [Phase 3 : Pages Publiques](#phase-3--pages-publiques)
5. [Phase 4 : Pages Admin](#phase-4--pages-admin)
6. [Suivi Progression](#suivi-progression)

---

## 🎯 VUE D'ENSEMBLE

### Contexte

**Templates source** : React Router SPA dans `C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/`
- 14 pages React Router
- 4 composants layout
- 30+ composants shadcn/ui
- Design system complet

**Architecture cible** : Next.js 14 App Router
- Structure `app/` directory
- Server Components par défaut
- Client Components quand nécessaire
- Liaison API backend FastAPI

### Stratégie Migration

**Approche progressive** : Page par page, phase par phase
- ✅ Valider chaque page avant suivante
- ✅ Tester avec backend réel à chaque étape
- ✅ Maintenir qualité constante (Lighthouse >85)
- ✅ Documentation continue

### Ordre Phases

```
🔴 PHASE 1 : AUTHENTIFICATION (2 pages)      → 2-3 jours
    ↓ (Bloquant pour suite)
🟠 PHASE 2 : DASHBOARD (3 pages)             → 2-3 jours
    ↓
🟡 PHASE 3 : PAGES PUBLIQUES (6 pages)       → 3-4 jours
    ↓
🟢 PHASE 4 : PAGES ADMIN (4 pages)           → 2-3 jours

TOTAL : 9-13 jours
```

---

## 🔴 PHASE 1 : AUTHENTIFICATION (PRIORITÉ CRITIQUE)

**Statut** : 🟢 ACTIVE - À démarrer immédiatement  
**Durée estimée** : 2-3 jours  
**Bloquant pour** : Toutes autres phases (Dashboard, Admin nécessitent auth)

### Objectif Phase

Implémenter authentification complète :
- Login fonctionnel avec backend FastAPI
- Register fonctionnel avec backend FastAPI
- Gestion cookies/tokens
- Redirections après auth
- Protection routes

---

### TASK-MIGRATION-001 : Page Login

**Priorité** : 🔴 CRITIQUE  
**Effort estimé** : 4-6 heures

#### 📂 Références

**Template source** :
```
C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/template/src/pages/Auth.tsx
└─ Section Tabs → TabsContent value="login"
   ├─ Formulaire email + password
   ├─ Bouton "Se connecter"
   └─ Lien "Mot de passe oublié"
```

**Destination** :
```
packages/web/src/app/auth/login/page.tsx
```

**Backend API** :
```
POST /api/v1/auth/login
Body: { email: string, password: string }
Response: { access_token: string, user: {...} }
```

#### 📋 Spécifications

**Page à créer** :
```
app/auth/
├── layout.tsx                 # Layout auth (sans Header/Footer)
└── login/
    └── page.tsx               # Page login
```

**Composants à créer** :
```
components/auth/
└── LoginForm.tsx              # Formulaire login
```

**API à créer** :
```
lib/api/endpoints/
└── auth.ts                    # login(), register(), logout()
```

**Validations à créer** :
```
lib/validations/
└── auth.ts                    # loginSchema (Zod)
```

#### ✅ Checklist Implémentation

**Structure (30 min)** :
- [ ] update `app/auth/layout.tsx` (layout simple, centré)
- [ ] update `app/auth/login/page.tsx`
- [ ] update `components/auth/LoginForm.tsx` (client component)
- [ ] update `lib/api/endpoints/auth.ts`
- [ ] update `lib/validations/auth.ts`

**Formulaire (1h)** :
- [ ] Champs : email (type email) + password (type password)
- [ ] Validation Zod : email format + password min 8 chars
- [ ] Labels ARIA accessibilité
- [ ] Bouton submit avec loading state
- [ ] Lien "Mot de passe oublié" (href="/auth/forgot-password")
- [ ] Lien "Pas de compte ? S'inscrire" (href="/auth/register")

**Intégration API (1h)** :
- [ ] Fonction `login()` dans `lib/api/endpoints/auth.ts`
- [ ] Appel POST `/api/v1/auth/login`
- [ ] Gestion cookies (credentials: 'include')
- [ ] Stockage token si nécessaire
- [ ] Gestion erreurs (401, 500, network)

**UX (1h)** :
- [ ] Loading state pendant appel API (spinner sur bouton)
- [ ] Toast success "Connexion réussie"
- [ ] Toast error "Identifiants invalides" (si 401)
- [ ] Toast error "Erreur serveur" (si 500)
- [ ] Redirect `/dashboard` après success
- [ ] Désactiver bouton pendant loading

**Tests (1.5h)** :
- [ ] Test unitaire LoginForm.spec.tsx
  - Render formulaire
  - Validation email invalide
  - Validation password trop court
  - Appel API au submit
- [ ] Test E2E Playwright
  - Login avec credentials valides → Redirect dashboard
  - Login avec credentials invalides → Message erreur

**Validation (30 min)** :
- [ ] TypeScript compile sans erreurs
- [ ] ESLint passe
- [ ] Tests passent (Jest + Playwright)
- [ ] Lighthouse >85
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Accessibilité (ARIA labels, keyboard nav)
- [ ] Build réussit (`npm run build`)

#### 🎯 Critères de Succès

```bash
# Tests fonctionnels manuels
1. Ouvrir http://localhost:3000/auth/login
2. Entrer email valide + password valide
3. Cliquer "Se connecter"
   ✅ Toast "Connexion réussie"
   ✅ Redirect vers /dashboard
   ✅ Cookie auth présent

4. Se déconnecter
5. Ouvrir /auth/login
6. Entrer email invalide
   ✅ Message "Email invalide" sous champ

7. Entrer password trop court
   ✅ Message "Minimum 8 caractères" sous champ

8. Entrer credentials invalides
9. Cliquer "Se connecter"
   ✅ Toast "Identifiants invalides"
   ✅ Reste sur page login
```

#### 📊 Livrables

**Fichiers créés** :
```
✅ app/auth/layout.tsx                      # Layout auth
✅ app/auth/login/page.tsx                  # Page login
✅ components/auth/LoginForm.tsx            # Formulaire
✅ lib/api/endpoints/auth.ts                # API auth
✅ lib/validations/auth.ts                  # Schemas Zod
✅ components/auth/LoginForm.spec.tsx       # Tests unitaires
✅ e2e/auth/login.spec.ts                   # Tests E2E
```

**Métriques attendues** :
- Tests : 100% passants (Jest + Playwright)
- Coverage : >80%
- Lighthouse : >85
- Build : ✅ Succès

---

### TASK-MIGRATION-002 : Page Register

**Priorité** : 🔴 CRITIQUE  
**Effort estimé** : 4-6 heures  
**Dépend de** : TASK-MIGRATION-001 (réutilise API auth)

#### 📂 Références

**Template source** :
```
C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/template/src/pages/Auth.tsx
└─ Section Tabs → TabsContent value="signup"
   ├─ Formulaire firstName + lastName + email + password
   ├─ Bouton "S'inscrire"
   └─ Lien "Déjà un compte ? Se connecter"
```

**Destination** :
```
packages/web/src/app/auth/register/page.tsx
```

**Backend API** :
```
POST /api/v1/auth/register
Body: {
  email: string,
  password: string,
  first_name: string,
  last_name: string
}
Response: { access_token: string, user: {...} }
```

#### 📋 Spécifications

**Page à créer** :
```
app/auth/register/
└── page.tsx                   # Page register
```

**Composants à créer** :
```
components/auth/
└── RegisterForm.tsx           # Formulaire register
```

**Validations à ajouter** :
```
lib/validations/auth.ts
└── registerSchema             # Étendre loginSchema
```

#### ✅ Checklist Implémentation

**Structure (20 min)** :
- [ ] Créer `app/auth/register/page.tsx`
- [ ] Créer `components/auth/RegisterForm.tsx` (client component)
- [ ] Ajouter `registerSchema` dans `lib/validations/auth.ts`
- [ ] Ajouter fonction `register()` dans `lib/api/endpoints/auth.ts`

**Formulaire (1.5h)** :
- [ ] Champs : firstName, lastName, email, password, confirmPassword
- [ ] Validation Zod :
  - firstName min 2 chars
  - lastName min 2 chars
  - email format
  - password min 8 chars, 1 majuscule, 1 chiffre
  - confirmPassword === password
- [ ] Labels ARIA accessibilité
- [ ] Bouton submit avec loading state
- [ ] Lien "Déjà un compte ? Se connecter" (href="/auth/login")

**Intégration API (1h)** :
- [ ] Fonction `register()` dans `lib/api/endpoints/auth.ts`
- [ ] Appel POST `/api/v1/auth/register`
- [ ] Gestion cookies (credentials: 'include')
- [ ] Gestion erreurs (409 email exists, 500)

**UX (1h)** :
- [ ] Loading state pendant appel API
- [ ] Toast success "Compte créé avec succès"
- [ ] Toast error "Email déjà utilisé" (si 409)
- [ ] Toast error "Erreur serveur" (si 500)
- [ ] Redirect `/dashboard` après success
- [ ] Désactiver bouton pendant loading

**Tests (1.5h)** :
- [ ] Test unitaire RegisterForm.spec.tsx
  - Render formulaire
  - Validation champs requis
  - Validation password match
  - Appel API au submit
- [ ] Test E2E Playwright
  - Register avec données valides → Redirect dashboard
  - Register avec email existant → Message erreur

**Validation (30 min)** :
- [ ] TypeScript compile sans erreurs
- [ ] ESLint passe
- [ ] Tests passent (Jest + Playwright)
- [ ] Lighthouse >85
- [ ] Responsive
- [ ] Accessibilité
- [ ] Build réussit

#### 🎯 Critères de Succès

```bash
# Tests fonctionnels manuels
1. Ouvrir http://localhost:3000/auth/register
2. Remplir tous champs avec données valides
3. Cliquer "S'inscrire"
   ✅ Toast "Compte créé avec succès"
   ✅ Redirect vers /dashboard
   ✅ Cookie auth présent

4. Se déconnecter
5. Ouvrir /auth/register
6. Entrer email déjà utilisé
7. Cliquer "S'inscrire"
   ✅ Toast "Email déjà utilisé"
   ✅ Reste sur page register

8. Entrer password et confirmPassword différents
   ✅ Message "Les mots de passe ne correspondent pas"
```

#### 📊 Livrables

**Fichiers créés** :
```
✅ app/auth/register/page.tsx               # Page register
✅ components/auth/RegisterForm.tsx         # Formulaire
✅ lib/validations/auth.ts (updated)        # registerSchema
✅ lib/api/endpoints/auth.ts (updated)      # register()
✅ components/auth/RegisterForm.spec.tsx    # Tests unitaires
✅ e2e/auth/register.spec.ts                # Tests E2E
```

**Métriques attendues** :
- Tests : 100% passants
- Coverage : >80%
- Lighthouse : >85
- Build : ✅ Succès

---

### 🎯 CRITÈRES VALIDATION PHASE 1 (Avant Phase 2)

**Fonctionnels** :
- ✅ Login fonctionnel avec backend réel
- ✅ Register fonctionnel avec backend réel
- ✅ Cookies gérés correctement
- ✅ Redirections fonctionnelles (/dashboard)
- ✅ Toast notifications
- ✅ Validation formulaires Zod
- ✅ Gestion erreurs (401, 409, 500, network)

**Techniques** :
- ✅ TypeScript compile sans erreurs
- ✅ ESLint passe
- ✅ Tests Jest : 100% passants
- ✅ Tests E2E : 100% passants
- ✅ Coverage : >80%
- ✅ Lighthouse : >85
- ✅ Build : ✅ Succès
- ✅ Responsive : Mobile + Tablet + Desktop
- ✅ Accessibilité : ARIA labels, keyboard nav

**Documentation** :
- ✅ Rapport TASK-MIGRATION-001 complet
- ✅ Rapport TASK-MIGRATION-002 complet
- ✅ README API auth endpoints
- ✅ Captures écrans login + register

---

## 🟠 PHASE 2 : DASHBOARD (APRÈS AUTH)

**Statut** : ⏸️ EN ATTENTE - Phase 1 requis  
**Durée estimée** : 2-3 jours  
**Bloquant pour** : Pages Dashboard utilisateur

### Objectif Phase

Implémenter dashboard utilisateur :
- Layout dashboard avec sidebar
- Page home dashboard (stats + favoris)
- Navigation dashboard
- Protected routes (middleware)

---

### TASK-MIGRATION-003 : Dashboard Layout

**Priorité** : 🟠 HAUTE  
**Effort estimé** : 3-4 heures  
**Dépend de** : TASK-MIGRATION-001, TASK-MIGRATION-002 (auth fonctionnel)

#### 📂 Références

**Template source** :
```
C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/src/pages/Dashboard.tsx
└─ SidebarProvider + AppSidebar + Main content
```

**Destination** :
```
packages/web/src/app/dashboard/layout.tsx
```

#### 📋 Spécifications

**Layout à créer** :
```
app/dashboard/
├── layout.tsx                 # Dashboard layout avec sidebar
└── page.tsx                   # Dashboard home (TASK-004)
```

**Composants à adapter** :
```
C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/src/components/AppSidebar.tsx → components/layout/AppSidebar.tsx
└─ Adapter navigation (Link to → Link href)
```

**Middleware à créer** :
```
middleware.ts                  # Protected routes
└─ Vérifier auth cookie
└─ Redirect /auth/login si non authentifié
```

#### ✅ Checklist Implémentation

**Structure (1h)** :
- [ ] Créer `app/dashboard/layout.tsx`
- [ ] Adapter `components/layout/AppSidebar.tsx` (Link, useRouter)
- [ ] Créer `middleware.ts` (protection routes)
- [ ] Configurer matcher middleware (`/dashboard/*`)

**Layout Dashboard (1h)** :
- [ ] SidebarProvider Next.js
- [ ] AppSidebar navigation
- [ ] Header dashboard (SidebarTrigger + titre)
- [ ] Main content area
- [ ] Responsive (collapse sidebar mobile)

**Middleware Auth (1h)** :
- [ ] Vérifier présence cookie auth
- [ ] Redirect `/auth/login` si absent
- [ ] Permettre accès si présent
- [ ] Tester protection routes

**Tests (1h)** :
- [ ] Test E2E Playwright
  - Accès /dashboard sans auth → Redirect /auth/login
  - Login puis accès /dashboard → Page visible
  - Navigation sidebar fonctionnelle

**Validation (30 min)** :
- [ ] TypeScript compile
- [ ] Tests passent
- [ ] Lighthouse >85
- [ ] Responsive
- [ ] Build réussit

#### 📊 Livrables

```
✅ app/dashboard/layout.tsx                 # Layout dashboard
✅ components/layout/AppSidebar.tsx         # Sidebar adapté
✅ middleware.ts                            # Protection routes
✅ e2e/dashboard/layout.spec.ts             # Tests E2E
```

---

### TASK-MIGRATION-004 : Dashboard Home

**Priorité** : 🟠 HAUTE  
**Effort estimé** : 4-5 heures  
**Dépend de** : TASK-MIGRATION-003 (layout dashboard)

#### 📂 Références

**Template source** :
```
C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/src/pages/Dashboard.tsx (partie DashboardHome)
└─ Stats cards (4 colonnes)
└─ Services favoris (grid)
└─ Déclarations récentes (liste)
```

**Destination** :
```
packages/web/src/app/dashboard/page.tsx
```

**Backend API** :
```
GET /api/v1/users/me                 # Infos utilisateur
GET /api/v1/declarations/recent      # Déclarations récentes
GET /api/v1/services/favorites       # Services favoris
```

#### 📋 Spécifications

**Page à créer** :
```
app/dashboard/
└── page.tsx                   # Dashboard home
```

**Composants à créer** :
```
components/dashboard/
├── StatsCards.tsx             # 4 stats cards
├── FavoriteServices.tsx       # Grid services favoris
└── RecentDeclarations.tsx     # Liste déclarations
```

**API à créer** :
```
lib/api/endpoints/
├── users.ts                   # getCurrentUser()
├── declarations.ts            # getRecentDeclarations()
└── services.ts                # getFavoriteServices()
```

#### ✅ Checklist Implémentation

**Structure (30 min)** :
- [ ] Créer `app/dashboard/page.tsx` (Server Component)
- [ ] Créer `components/dashboard/StatsCards.tsx`
- [ ] Créer `components/dashboard/FavoriteServices.tsx`
- [ ] Créer `components/dashboard/RecentDeclarations.tsx`

**API Integration (2h)** :
- [ ] Créer `lib/api/endpoints/users.ts`
- [ ] Créer `lib/api/endpoints/declarations.ts`
- [ ] Créer `lib/api/endpoints/services.ts` (si inexistant)
- [ ] Appels API dans Server Component
- [ ] Gestion erreurs (try/catch)
- [ ] Loading states (Suspense)

**UI Components (1.5h)** :
- [ ] StatsCards : 4 cards (déclarations, paiements, documents, notifications)
- [ ] FavoriteServices : Grid responsive services favoris
- [ ] RecentDeclarations : Table déclarations récentes
- [ ] Boutons actions (Nouvelle déclaration, Voir tout...)

**Tests (1h)** :
- [ ] Test unitaire composants
- [ ] Test E2E Playwright
  - Dashboard home charge données
  - Stats cards affichées
  - Services favoris visibles
  - Navigation vers détail déclaration

**Validation (30 min)** :
- [ ] TypeScript compile
- [ ] Tests passent
- [ ] Lighthouse >85
- [ ] Responsive
- [ ] Build réussit

#### 📊 Livrables

```
✅ app/dashboard/page.tsx                      # Dashboard home
✅ components/dashboard/StatsCards.tsx         # Stats
✅ components/dashboard/FavoriteServices.tsx   # Favoris
✅ components/dashboard/RecentDeclarations.tsx # Déclarations
✅ lib/api/endpoints/users.ts                  # API users
✅ lib/api/endpoints/declarations.ts           # API declarations
✅ components/dashboard/*.spec.tsx             # Tests unitaires
✅ e2e/dashboard/home.spec.ts                  # Tests E2E
```

---

### TASK-MIGRATION-005 : Page Profile

**Priorité** : 🟡 MOYENNE  
**Effort estimé** : 3-4 heures  
**Dépend de** : TASK-MIGRATION-003, TASK-MIGRATION-004

#### 📂 Références

**Template source** :
```
C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/src/pages/Profile.tsx
└─ Formulaire édition profil utilisateur
```

**Destination** :
```
packages/web/src/app/dashboard/profile/page.tsx
```

**Backend API** :
```
GET /api/v1/users/me            # Infos utilisateur
PATCH /api/v1/users/me          # Modifier profil
```

#### 📋 Spécifications

**Page à créer** :
```
app/dashboard/profile/
└── page.tsx                   # Page profil
```

**Composants à créer** :
```
components/dashboard/
└── ProfileForm.tsx            # Formulaire édition profil
```

**Validations à créer** :
```
lib/validations/
└── profile.ts                 # profileSchema (Zod)
```

#### ✅ Checklist Implémentation

**Structure (30 min)** :
- [ ] Créer `app/dashboard/profile/page.tsx`
- [ ] Créer `components/dashboard/ProfileForm.tsx` (client)
- [ ] Créer `lib/validations/profile.ts`
- [ ] Ajouter `updateProfile()` dans `lib/api/endpoints/users.ts`

**Formulaire (1.5h)** :
- [ ] Champs : firstName, lastName, email (disabled), phone, address
- [ ] Validation Zod
- [ ] Labels ARIA
- [ ] Bouton submit avec loading state
- [ ] Préremplit avec données user

**Intégration API (1h)** :
- [ ] Fetch données user (GET /users/me)
- [ ] Update profil (PATCH /users/me)
- [ ] Gestion erreurs
- [ ] Toast success/error

**Tests (1h)** :
- [ ] Test unitaire ProfileForm
- [ ] Test E2E Playwright
  - Modifier profil → Success
  - Validation champs

**Validation (30 min)** :
- [ ] TypeScript compile
- [ ] Tests passent
- [ ] Lighthouse >85
- [ ] Build réussit

#### 📊 Livrables

```
✅ app/dashboard/profile/page.tsx          # Page profil
✅ components/dashboard/ProfileForm.tsx    # Formulaire
✅ lib/validations/profile.ts              # Schema Zod
✅ lib/api/endpoints/users.ts (updated)    # updateProfile()
✅ components/dashboard/ProfileForm.spec.tsx
✅ e2e/dashboard/profile.spec.ts
```

---

### 🎯 CRITÈRES VALIDATION PHASE 2

**Fonctionnels** :
- ✅ Dashboard layout fonctionnel (sidebar + main)
- ✅ Dashboard home affiche données backend
- ✅ Profile édition fonctionnelle
- ✅ Navigation sidebar fonctionnelle
- ✅ Protected routes (middleware)
- ✅ Redirect /auth/login si non authentifié

**Techniques** :
- ✅ TypeScript compile sans erreurs
- ✅ Tests : 100% passants
- ✅ Coverage : >80%
- ✅ Lighthouse : >85
- ✅ Build : ✅ Succès
- ✅ Responsive

**Documentation** :
- ✅ Rapports tâches 003, 004, 005 complets

---

## 🟡 PHASE 3 : PAGES PUBLIQUES

**Statut** : ⏸️ EN ATTENTE - Phase 2 requis  
**Durée estimée** : 3-4 jours  
**Pages** : Landing, Services, ServiceDetail, Calculator, Guide, Ministries, Search

### Tâches Phase 3

```
TASK-MIGRATION-006 : Landing Page (Index)       3-4h
TASK-MIGRATION-007 : Services Grid              3-4h
TASK-MIGRATION-008 : Service Detail (dynamic)   4-5h
TASK-MIGRATION-009 : Calculator                 3-4h
TASK-MIGRATION-010 : Guide                      3-4h
TASK-MIGRATION-011 : Ministries                 2-3h
TASK-MIGRATION-012 : Search                     2-3h
```

*Détails tâches Phase 3 à documenter après Phase 2*

---

## 🟢 PHASE 4 : PAGES ADMIN

**Statut** : ⏸️ EN ATTENTE - Phase 2 requis  
**Durée estimée** : 2-3 jours  
**Pages** : AdminDGI, UsersManagement, Analytics, ServiceManagement

### Tâches Phase 4

```
TASK-MIGRATION-013 : Admin Layout               2-3h
TASK-MIGRATION-014 : Admin Home (AdminDGI)      4-5h
TASK-MIGRATION-015 : Users Management           4-5h
TASK-MIGRATION-016 : Analytics                  4-5h
TASK-MIGRATION-017 : Service Management         3-4h
```

*Détails tâches Phase 4 à documenter après Phase 2*

---

## 📊 SUIVI PROGRESSION

### Tableau de Bord Migration

| Phase | Tâche | Page | Statut | Durée | Tests | Lighthouse | Notes |
|-------|-------|------|--------|-------|-------|------------|-------|
| **Phase 1** | TASK-001 | Login | ⏸️ À faire | - | - | - | Priorité critique |
| **Phase 1** | TASK-002 | Register | ⏸️ À faire | - | - | - | Après TASK-001 |
| **Phase 2** | TASK-003 | Dashboard Layout | 🔒 Bloqué | - | - | - | Nécessite Phase 1 |
| **Phase 2** | TASK-004 | Dashboard Home | 🔒 Bloqué | - | - | - | Nécessite TASK-003 |
| **Phase 2** | TASK-005 | Profile | 🔒 Bloqué | - | - | - | Nécessite TASK-004 |
| **Phase 3** | TASK-006 | Landing | 🔒 Bloqué | - | - | - | Nécessite Phase 2 |
| **Phase 3** | TASK-007 | Services | 🔒 Bloqué | - | - | - | - |
| **Phase 3** | TASK-008 | Service Detail | 🔒 Bloqué | - | - | - | - |
| **Phase 3** | TASK-009 | Calculator | 🔒 Bloqué | - | - | - | - |
| **Phase 3** | TASK-010 | Guide | 🔒 Bloqué | - | - | - | - |
| **Phase 3** | TASK-011 | Ministries | 🔒 Bloqué | - | - | - | - |
| **Phase 3** | TASK-012 | Search | 🔒 Bloqué | - | - | - | - |
| **Phase 4** | TASK-013 | Admin Layout | 🔒 Bloqué | - | - | - | Nécessite Phase 2 |
| **Phase 4** | TASK-014 | Admin Home | 🔒 Bloqué | - | - | - | - |
| **Phase 4** | TASK-015 | Users Mgmt | 🔒 Bloqué | - | - | - | - |
| **Phase 4** | TASK-016 | Analytics | 🔒 Bloqué | - | - | - | - |
| **Phase 4** | TASK-017 | Service Mgmt | 🔒 Bloqué | - | - | - | - |

**Légende statuts** :
- ⏸️ À faire : Prêt à démarrer
- 🟢 En cours : Assigné à agent
- ✅ Terminé : Validé et mergé
- 🔒 Bloqué : Dépendances non remplies
- ⚠️ Problème : Nécessite attention

---

## 🎯 INSTRUCTIONS AGENT FRONTEND

### Avant de commencer une tâche

1. **Lire ce document** (`FRONTEND_MIGRATION_WORKFLOW.md`)
   - Identifier phase en cours
   - Vérifier tâche assignée (ex: TASK-MIGRATION-001)
   - Confirmer dépendances satisfaites

2. **Consulter guide méthodologie** (`.github/docs-internal/Documentations/Frontend/FRONTEND_PAGE_TEMPLATE_GUIDE.md`)
   - Suivre 7 étapes
   - Utiliser patterns transformation
   - Respecter checklist

3. **Localiser template source** (`C:/taxasge/.github/docs-internal/Documentations/FRONTEND/template/src/pages//[PageName].tsx`)
   - Analyser structure
   - Identifier composants
   - Noter patterns routing

### Pendant la tâche

- ✅ Suivre checklist implémentation de la tâche
- ✅ Valider chaque étape avant suivante
- ✅ Tester au fur et à mesure
- ✅ Documenter problèmes rencontrés

### Après la tâche

- ✅ Valider tous critères de succès
- ✅ Générer rapport complet
- ✅ Mettre à jour tableau progression (ci-dessus)
- ✅ Notifier orchestrateur

---

## 📝 NOTES IMPORTANTES

### Dépendances Critiques

**Phase 1 (Auth) est BLOQUANTE** :
- ❌ Ne PAS commencer Phase 2 avant Phase 1 validée
- ❌ Ne PAS commencer Phase 3 avant Phase 2 validée
- ❌ Ne PAS commencer Phase 4 avant Phase 2 validée

**Backend doit être opérationnel** :
- Auth endpoints : `/api/v1/auth/login`, `/api/v1/auth/register`
- Users endpoints : `/api/v1/users/me`
- Autres endpoints selon phase

### Qualité Non Négociable

Chaque page doit respecter :
- ✅ Tests : 100% passants (Jest + Playwright)
- ✅ Coverage : >80%
- ✅ Lighthouse : >85
- ✅ TypeScript : Aucune erreur
- ✅ ESLint : Aucune erreur
- ✅ Responsive : Mobile + Tablet + Desktop
- ✅ Accessibilité : ARIA + Keyboard
- ✅ Build : Succès

### Rollback si Problème

Si problème bloquant sur une tâche :
1. Documenter problème (rapport)
2. Proposer solutions alternatives
3. Escalader à orchestrateur
4. Attendre décision avant continuer

---

**Document créé par** : Claude (Agent IA)  
**Date** : 31 Octobre 2025  
**Version** : 1.0  
**Statut** : 🟢 ACTIF - Phase 1 prête à démarrer
