# 📋 CONTEXTE PROJET - TAXASGE (BACKEND + FRONTEND)

**Version :** 2.0
**Date :** 2025-10-23 (Mis à jour avec frontend + Phase 0)
**Criticité :** ⭐⭐⭐ FICHIER LE PLUS IMPORTANT À LIRE

---

## 🎯 QU'EST-CE QUE TAXASGE ?

### Vision Métier
**TaxasGE** (Tax Services Government Electronic) est une plateforme gouvernementale camerounaise permettant aux citoyens de :
- Rechercher parmi 850+ services fiscaux
- Déclarer leurs impôts/taxes en ligne
- Payer via Mobile Money (MTN/Movistar), Carte, Virement
- Suivre le traitement de leurs déclarations
- Télécharger leurs reçus officiels

### Acteurs Principaux
1. **Citoyens** : Déclare, paie, suit
2. **Agents Fiscaux** : Valide, rejette, demande documents
3. **Admin** : Dashboard, analytics, modération
4. **Système** : Traitement automatique, notifications, webhooks

---

## 🚨 RÈGLE 0 : HIÉRARCHIE DES SOURCES DE VÉRITÉ

> **PRIORITÉ ABSOLUE** : En cas de conflit d'information, suivre STRICTEMENT cet ordre

### 1. Schéma de Base de Données (SOURCE ABSOLUE)
**Fichier :** `database/schema_taxasge.sql`

**Utiliser pour :**
- ✅ Types de champs (UUID, VARCHAR, INTEGER, DECIMAL, etc.)
- ✅ Contraintes (NOT NULL, UNIQUE, CHECK, FOREIGN KEY)
- ✅ Relations entre tables
- ✅ Noms exacts des colonnes
- ✅ Valeurs par défaut

**Exemple :**
```sql
-- database/schema_taxasge.sql (ligne 42)
tax_id UUID NOT NULL UNIQUE
```

**Si use case dit `tax_id: string` → IGNORER**
**Toujours utiliser `tax_id: UUID` (schéma DB)**

---

### 2. Fichier .env Existant (CONFIGURATION RÉELLE)
**Fichier :** `packages/backend/.env` ⚠️ EXISTE DÉJÀ

**Utiliser pour :**
- ✅ Secrets (JWT_SECRET_KEY, DATABASE_URL, API keys)
- ✅ URLs services externes (BANGE_API_URL, SUPABASE_URL)
- ✅ Configuration environnement (DEBUG, LOG_LEVEL)

**⚠️ ATTENTION :**
- ❌ NE JAMAIS créer un nouveau .env
- ✅ Lire .env existant AVANT toute implémentation
- ✅ Générer .env.example à partir de .env (Phase 1)

**Vérification obligatoire :**
```bash
# Avant implémenter authentification
cat packages/backend/.env | grep JWT_SECRET_KEY

# Avant intégrer BANGE
cat packages/backend/.env | grep BANGE
```

---

### 3. Code Backend Existant (IMPLÉMENTATION ACTUELLE)
**Dossier :** `packages/backend/app/`

**Utiliser pour :**
- ✅ Patterns existants (architecture, naming)
- ✅ Logique métier déjà implémentée
- ✅ Services configurés (BANGE, Firebase, OCR)
- ✅ Comprendre statut réel (mock vs implémenté)

**Structure Officielle :**
```
packages/backend/app/
├── api/v1/              → Routes API (11 fichiers, 4,187 lignes)
├── services/            → Services métier (11 fichiers, 2,703 lignes)
├── database/
│   └── repositories/    → ✅ UTILISER CE DOSSIER
├── repositories/        → ❌ IGNORER (à supprimer Phase 1)
├── models/              → Models Pydantic
└── config.py            → Configuration app
```

**⚠️ DÉCISION CRITIQUE : Repositories**
```
✅ Toujours utiliser : app/database/repositories/
❌ Ignorer complètement : app/repositories/ (duplication, sera supprimé)
```

---

### 4. Use Cases (WORKFLOWS UNIQUEMENT)
**Dossier :** `use_cases/`

**Utiliser pour :**
- ✅ Workflows métier (draft → submitted → validated)
- ✅ Scénarios utilisateur (Given/When/Then)
- ✅ Cas d'erreur à gérer (400, 401, 403, 404, 500)
- ✅ Métriques attendues (latence P95, taux succès)

**❌ NE PAS utiliser pour :**
- ❌ Types de champs (vérifier DB)
- ❌ Noms exacts colonnes (vérifier DB)
- ❌ Contraintes validation (vérifier DB)
- ❌ Configuration secrets (vérifier .env)

**Exemple de biais documenté :**
```markdown
## Use Case dit :
user.role = "admin" | "user"  (string)

## Database dit :
role VARCHAR(20) CHECK (role IN ('admin', 'user', 'guest'))

## ✅ UTILISER :
role: str = Field(..., pattern="^(admin|user|guest)$")
```

---

### 5. Rapports (CONTEXTE GÉNÉRAL)
**Dossier :** `.github/docs-internal/Documentations/Backend/`

**Utiliser pour :**
- ✅ Contexte projet global
- ✅ Problèmes identifiés (duplication, fichiers vides)
- ✅ État d'avancement (~40% implémenté)
- ✅ Roadmap et phases

**❌ NE PAS utiliser pour :**
- ❌ Détails techniques d'implémentation
- ❌ Types de champs
- ❌ Valeurs de configuration

---

## 📊 ÉTAT ACTUEL DU PROJET

### Métriques Réelles (Source : Analyse Code)

| Métrique | Valeur | Détail |
|----------|--------|--------|
| **Endpoints implémentés** | ~20 | auth, fiscal_services, users, payments (partiel), declarations (partiel), documents |
| **Endpoints cible** | 224 | 14 modules (AUTH, USERS, DECL, PAY, DOC, FISC, ADMIN, AGENT, NOTIF, ANALY, AUDIT, ESCAL, REPORT, WEBHOOK) |
| **Endpoints documentés** | 68 | AUTH (15) + WEBHOOKS (10) + PAYMENTS (18) + DECLARATIONS (25) |
| **Services backend** | 11 fichiers | 6 implémentés, 5 vides (à supprimer Phase 1) |
| **Tests pytest** | 50+ | AUTH module complet |
| **Coverage** | 78% | Du code existant uniquement (pas 78% du projet total) |
| **Duplication code** | 2 dossiers | app/repositories/ vs app/database/repositories/ |

### Statuts Implémentation (Définitions Strictes)

**❌ NON IMPLÉMENTÉ** : 0% code
- Aucun fichier créé
- Aucune logique métier
- Exemple : UC-AUTH-001 (Register)

**⚠️ MOCK** : Code test/exemple seulement
- Données hardcodées
- Pas de vraie DB
- Exemple : UC-AUTH-002 (Login avec users mocké)

**⚠️ PARTIEL** : Implémentation incomplète
- Route existe mais manque validations
- Logique métier partielle
- Gestion erreurs manquante
- Exemple : UC-PAY-001 (Paiement sans webhooks)

**✅ IMPLÉMENTÉ** : Code complet + tests
- Route fonctionnelle
- Logique métier complète
- Gestion erreurs exhaustive
- Tests pytest écrits
- Exemple : UC-DOC-001 (Upload documents)

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack Backend
```
FastAPI (Python 3.11+)
├── Database : PostgreSQL via Supabase
├── Auth : JWT + Supabase Auth
├── Storage : Firebase Storage (documents/receipts)
├── Payments : BANGE API (Mobile Money Cameroun)
├── OCR : Tesseract + Google Vision API
├── AI : TensorFlow Lite (assistant fiscal)
├── Cache : Redis (optionnel Phase 2+)
└── Monitoring : Prometheus + Grafana (Phase 6)
```

### Stack Frontend
```
Next.js 14 (App Router)
├── Framework : React 18 + TypeScript
├── UI Components : shadcn/ui (Radix UI + Tailwind CSS)
├── State Management : React Query (server) + Zustand (client)
├── Forms : React Hook Form + Zod validation
├── Styling : Tailwind CSS + CSS Modules
├── Testing : Jest + Testing Library + Playwright
├── Build : Turbopack (dev) + Webpack (prod)
└── Deployment : Firebase Hosting (staging + prod)
```

### Architecture 4 Layers (Design)

**Layer 1 : Entities**
- Users, Agents, Admin
- Authentication, RBAC

**Layer 2 : Transactions**
- Declarations workflow
- Payments processing
- Webhooks

**Layer 3 : Assets**
- Documents upload
- OCR extraction
- Firebase Storage

**Layer 4 : Structured Data**
- Fiscal services catalog (850 services)
- Analytics dashboard
- Reports generation

---

## 📁 STRUCTURE PROJET

### Backend (packages/backend/)

```
packages/backend/
├── main.py (328 lignes)
│   └── Application FastAPI principale
│
├── app/
│   ├── config.py (389 lignes)
│   │   └── Configuration app (Pydantic Settings)
│   │
│   ├── api/v1/ (11 fichiers, 4,187 lignes)
│   │   ├── auth.py (140 lignes) ✅
│   │   ├── users.py (582 lignes) ✅
│   │   ├── fiscal_services.py (484 lignes) ✅
│   │   ├── fiscal_services_new.py (443 lignes) ⚠️ DUPLICATION
│   │   ├── taxes.py (600 lignes) ✅
│   │   ├── payments.py (194 lignes) ⚠️ PARTIEL
│   │   ├── declarations.py (415 lignes) ⚠️ PARTIEL
│   │   ├── documents.py (825 lignes) ✅
│   │   ├── ai_services.py (504 lignes) ✅
│   │   └── ai.py (0 lignes) ❌ VIDE
│   │
│   ├── services/ (11 fichiers, 2,703 lignes)
│   │   ├── bange_service.py (419 lignes) ✅
│   │   ├── firebase_storage_service.py (704 lignes) ✅
│   │   ├── ocr_service.py (543 lignes) ✅
│   │   ├── extraction_service.py (709 lignes) ✅
│   │   ├── translation_service.py (328 lignes) ✅
│   │   ├── ai_service.py (0 lignes) ❌ VIDE (supprimer)
│   │   ├── auth_service.py (0 lignes) ❌ VIDE (supprimer)
│   │   ├── payment_service.py (0 lignes) ❌ VIDE (supprimer)
│   │   ├── tax_service.py (0 lignes) ❌ VIDE (supprimer)
│   │   └── notification_service.py (0 lignes) ❌ VIDE (Phase 2)
│   │
│   ├── database/
│   │   └── repositories/ (5 fichiers) ✅ UTILISER
│   │       ├── user_repository.py
│   │       ├── tax_repository.py
│   │       ├── payment_repository.py
│   │       ├── declaration_repository.py
│   │       └── document_repository.py
│   │
│   ├── repositories/ (5 fichiers) ❌ SUPPRIMER Phase 1
│   │   └── Duplication de database/repositories/
│   │
│   └── models/ (6 fichiers)
│       ├── user.py ✅
│       ├── payment.py ✅
│       ├── declaration.py ✅
│       ├── tax.py ✅
│       ├── document.py ✅
│       └── response.py ✅
│
├── tests/
│   ├── conftest.py (72 lignes)
│   ├── use_cases/
│   │   └── test_uc_auth.py (650 lignes, 50+ tests) ✅
│   └── e2e/
│       └── test_scenarios_e2e.py (à créer)
│
└── .env ⚠️ EXISTE DÉJÀ
    └── Configuration secrets (ne pas recréer)
```

---

### Frontend (packages/web/)

```
packages/web/
├── src/
│   ├── app/                           → Pages Next.js App Router
│   │   ├── (auth)/                    → Groupe auth
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/               → Groupe dashboard
│   │   │   ├── page.tsx               → Dashboard principal
│   │   │   ├── declarations/          → Module déclarations
│   │   │   ├── documents/             → Module documents
│   │   │   └── layout.tsx
│   │   ├── (public)/                  → Pages publiques
│   │   │   ├── catalog/page.tsx       → Catalogue services
│   │   │   ├── contact/page.tsx
│   │   │   └── faq/page.tsx
│   │   ├── layout.tsx                 → Root layout
│   │   ├── globals.css
│   │   └── providers.tsx
│   │
│   ├── components/
│   │   ├── ui/                        → shadcn/ui components ⚠️ À INSTALLER
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── form.tsx
│   │   │   └── ...
│   │   ├── layout/                    → Layout components ⚠️ À CRÉER
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── auth/                      → Domaine auth ⚠️ À CRÉER
│   │   ├── declarations/              → Domaine déclarations ⚠️ À CRÉER
│   │   └── shared/                    → Composants partagés ⚠️ À CRÉER
│   │
│   ├── lib/
│   │   ├── api.ts                     → Client API backend ⚠️ À CRÉER
│   │   ├── utils.ts                   → Utilitaires
│   │   └── validations/               → Schemas Zod ⚠️ À CRÉER
│   │
│   ├── hooks/                         → Hooks custom ⚠️ À CRÉER
│   │   ├── useAuth.ts
│   │   └── useDeclarations.ts
│   │
│   └── types/                         → Types TypeScript ⚠️ À CRÉER
│       ├── api.ts
│       └── models.ts
│
├── public/
│   └── images/
│
├── tests/
│   ├── unit/                          → Tests Jest ⚠️ À CRÉER
│   └── e2e/                           → Tests Playwright ⚠️ À CRÉER
│
├── .env.local                         → Variables environnement ⚠️ À CRÉER
├── next.config.js                     ✅ EXISTE
├── tailwind.config.ts                 ✅ EXISTE
├── tsconfig.json                      ✅ EXISTE
└── package.json                       ✅ EXISTE (Next.js 14.2.5)
```

**État Frontend Actuel :**
- **Configuration :** ✅ Next.js 14, TypeScript, Tailwind configurés
- **Composants :** ⚠️ shadcn/ui à installer
- **Pages :** ⚠️ 0% implémenté (à créer Phase 0+)
- **Tests :** ⚠️ 0% (à implémenter avec modules)

---

### Use Cases (use_cases/)

```
use_cases/
├── README.md ✅
├── 00_METHODOLOGY.md (1,134 lignes) ✅
├── 01_AUTH.md (850 lignes, 15 endpoints) ✅
├── 03_DECLARATIONS.md (1,800 lignes, 25 endpoints) ✅
├── 04_PAYMENTS.md (1,600 lignes, 18 endpoints) ✅
├── 14_WEBHOOKS.md (1,400 lignes, 10 endpoints) ✅
├── 02_USERS.md 🚧 À GÉNÉRER
├── 05_DOCUMENTS.md 🚧 À GÉNÉRER
├── 06_FISCAL_SERVICES.md 🚧 À GÉNÉRER
├── 07_ADMIN.md 🚧 À GÉNÉRER
├── 08_AGENTS.md 🚧 À GÉNÉRER
├── 09_NOTIFICATIONS.md 🚧 À GÉNÉRER
├── 10_ANALYTICS.md 🚧 À GÉNÉRER
├── 11_AUDITS.md 🚧 À GÉNÉRER
├── 12_ESCALATIONS.md 🚧 À GÉNÉRER
├── 13_REPORTS.md 🚧 À GÉNÉRER
└── 99_E2E_SCENARIOS.md 🚧 À GÉNÉRER
```

---

## 🚨 PROBLÈMES CONNUS & SOLUTIONS

### Problème 1 : Biais Use Cases
**Description :**
Use cases peuvent contenir des erreurs sur types de champs, noms de colonnes, configurations.

**Solution :**
✅ **Toujours vérifier schéma database EN PREMIER**

**Exemple concret :**
```python
# ❌ Si use case dit :
tax_id: str

# ✅ Vérifier database/schema_taxasge.sql
# Si DB dit UUID → utiliser UUID
tax_id: UUID
```

---

### Problème 2 : Fichier .env Existant
**Description :**
.env existe déjà dans `packages/backend/.env`

**Solution :**
✅ **Lire .env existant** (ne jamais créer nouveau)
✅ **Générer .env.example** à partir de .env (Phase 1)

**Workflow correct :**
```bash
# 1. Lire .env existant
cat packages/backend/.env

# 2. Vérifier cohérence avec config.py
cat packages/backend/app/config.py

# 3. Générer .env.example (masquer secrets)
# SECRET_KEY=xxx → SECRET_KEY=your-secret-key-here
```

---

### Problème 3 : Duplication Repositories
**Description :**
2 dossiers repositories existent (confusion)

**Solution :**
✅ **Utiliser uniquement** `app/database/repositories/`
❌ **Ignorer complètement** `app/repositories/`

**Justification :**
- `app/database/repositories/` contient logique DB complète
- `app/repositories/` est ancien dossier (migration en cours)
- Phase 1 : Fusionner et supprimer duplication

---

### Problème 4 : Services Vides (5 Fichiers)
**Description :**
5 services avec 0 lignes de code

**Fichiers concernés :**
```
app/services/ai_service.py (0 lignes)
app/services/auth_service.py (0 lignes)
app/services/payment_service.py (0 lignes)
app/services/tax_service.py (0 lignes)
app/services/notification_service.py (0 lignes)
```

**Solution :**
```markdown
✅ Supprimer (Phase 1) :
- ai_service.py → logique dans api/v1/ai_services.py
- auth_service.py → logique dans api/v1/auth.py
- payment_service.py → logique dans services/bange_service.py
- tax_service.py → logique dans api/v1/taxes.py

⚠️ Garder (à implémenter Phase 4) :
- notification_service.py → service manquant (emails/SMS)
```

---

### Problème 5 : Configuration Firestore Obsolète
**Description :**
Décision validée : PostgreSQL (Supabase) UNIQUEMENT
Fichiers Firestore présents mais non utilisés → À supprimer

**Fichiers concernés :**
- `firestore.rules` (191 lignes)
- `firestore.indexes.json`
- Section firestore dans `firebase.json` (lignes 84-86)

**Solution :**
✅ **Phase 0 TASK-P0-001** : Supprimer toute configuration Firestore
- Supprimer `firestore.rules`
- Supprimer `firestore.indexes.json`
- Modifier `firebase.json` (retirer section firestore)
- Vérifier aucune référence Firestore dans code

**Justification :**
- Backend utilise PostgreSQL (asyncpg) → Pas de Firestore
- Schéma PostgreSQL développé (50+ tables, 1,038 lignes SQL)
- Décision formelle : DECISION_001_BASE_DONNEES_FINAL.md

---

### Problème 6 : Incohérences Statuts
**Description :**
Divergences entre sources sur statut endpoints

**Exemple :**
```
UC-AUTH-002 (Login) :
- use_cases/01_AUTH.md : "✅ IMPLÉMENTÉ (mock)"
- RAPPORT_ETAT_BACKEND : "✅ JWT + RBAC"
- README use_cases : "⚠️ 20% (mock)"
```

**Solution :**
✅ **Vérifier code réel** dans `app/api/v1/auth.py`
✅ **Utiliser définitions strictes** (NON IMPLÉMENTÉ, MOCK, PARTIEL, IMPLÉMENTÉ)

---

## 🎯 MODULES BACKEND (14 Modules)

| # | Module | Code | Endpoints | Priorité | Statut Impl | Phase |
|---|--------|------|-----------|----------|-------------|-------|
| 1 | **Authentication** | AUTH | 15 | CRITIQUE | ⚠️ 20% (mock) | Phase 2 |
| 2 | **Users** | USERS | 12 | HAUTE | ❌ 0% | Phase 2 |
| 3 | **Declarations** | DECL | 25 | CRITIQUE | ⚠️ 30% (routes) | Phase 2 |
| 4 | **Payments** | PAY | 18 | CRITIQUE | ⚠️ 40% (no webhooks) | Phase 2 |
| 5 | **Documents** | DOC | 20 | HAUTE | ✅ 90% (best) | Phase 2 |
| 6 | **Fiscal Services** | FISC | 12 | HAUTE | ✅ 100% (catalog) | Phase 2 |
| 7 | **Admin** | ADMIN | 35 | HAUTE | ❌ 0% | Phase 3 |
| 8 | **Agents** | AGENT | 20 | HAUTE | ❌ 0% | Phase 3 |
| 9 | **Notifications** | NOTIF | 10 | MOYENNE | ❌ 0% (service vide) | Phase 4 |
| 10 | **Analytics** | ANALY | 15 | MOYENNE | ❌ 0% | Phase 3 |
| 11 | **Audits** | AUDIT | 12 | MOYENNE | ❌ 0% | Phase 3 |
| 12 | **Escalations** | ESCAL | 8 | MOYENNE | ❌ 0% | Phase 3 |
| 13 | **Reports** | REPORT | 12 | BASSE | ❌ 0% | Phase 3 |
| 14 | **Webhooks** | WEBHOOK | 10 | HAUTE | ❌ 0% (BANGE critical) | Phase 4 |
| **TOTAL** | **14 modules** | - | **224** | - | **~40%** | **6 phases** |

---

## 📅 TIMELINE PROJET (18 SEMAINES)

**Dates :** 2025-10-23 → 2026-02-19
**Go-Live Production :** **2026-02-19**

###Phase 0 : Préparation (1 semaine)
**Dates :** 2025-10-23 → 2025-10-30
- ✅ Jour 1 : Décisions stratégiques TERMINÉ (2025-10-23)
- Jour 2 : Nettoyage Firestore + Baselines (backend, frontend, infra)
- Jour 3 : Setup environnement dev local (backend + frontend)
- Jour 4 : Configuration CI/CD GitHub Actions
- Jour 5 : Tests staging + Go/No-Go Phase 0

**Livrable :** Environnement dev + staging 100% fonctionnel

---

### MVP Phase 1 : Core Fonctionnel (8 semaines)
**Dates :** 2025-10-30 → 2025-12-25

#### Module 1 : Authentication (1 semaine)
- Backend : 15 endpoints AUTH
- Frontend : Login, Register, Profile, Reset Password
- Tests : Coverage >80%

#### Module 2 : Fiscal Services Catalog (0.5 semaine)
- Backend : 12 endpoints (déjà 100% fait) ✅
- Frontend : Catalogue, recherche, filtres, calcul
- Tests : E2E flow complet

#### Module 3 : Declarations (2 semaines)
- Backend : 25 endpoints (IVA, IRPF, Petroliferos)
- Frontend : Formulaires dynamiques, validation
- Tests : Workflows déclarations

#### Module 4 : Payments BANGE (1.5 semaines)
- Backend : 18 endpoints + webhooks confirmation
- Frontend : Paiement, suivi, reçu PDF
- Tests : Simulation paiements

#### Module 5 : Documents Upload + OCR (1.5 semaines)
- Backend : 20 endpoints (OCR hybride Tesseract/Vision)
- Frontend : Upload, preview, edit OCR
- Tests : Précision OCR >70%

#### Module 6 : Admin Dashboard (1.5 semaines)
- Backend : 35 endpoints (CRUD users, stats, revenus)
- Frontend : Dashboard admin, gestion users
- Tests : Permissions RBAC

**Livrable :** 🎄 **Milestone Noël 2025** - MVP Phase 1 validé

---

### MVP Phase 2 : Fonctionnalités Complémentaires (6 semaines)
**Dates :** 2025-12-25 → 2026-02-05

#### Module 7 : Agent Workflow (1.5 semaines)
- Backend : 20 endpoints (queue, assignment, validation)
- Frontend : Dashboard agents, workflow

#### Module 8 : Notifications (1 semaine)
- Backend : 10 endpoints (email, SMS, push)
- Frontend : Préférences notifications

#### Module 9 : Analytics (1 semaine)
- Backend : 15 endpoints (revenus, stats, exports)
- Frontend : Dashboards analytics

#### Module 10 : Audits (1 semaine)
- Backend : 12 endpoints (audit logs, compliance)
- Frontend : Historique actions

#### Module 11 : Escalations (0.5 semaine)
- Backend : 8 endpoints (escalations tier 2)
- Frontend : Interface escalations

#### Module 12 : Reports (0.5 semaine)
- Backend : 12 endpoints (rapports PDF, exports)
- Frontend : Générateur rapports

#### Module 13 : Webhooks (0.5 semaine)
- Backend : 10 endpoints (webhooks système)
- Frontend : Configuration webhooks

---

### Phase 3 : Consolidation & Production (2 semaines)
**Dates :** 2026-02-05 → 2026-02-19

#### Semaine 1 : Stabilisation (2026-02-05 → 2026-02-12)
- Correction bugs critiques
- Optimisation performance
- Security hardening
- Tests charge

#### Semaine 2 : Go-Live (2026-02-12 → 2026-02-19)
- Déploiement production
- Monitoring complet
- Documentation finale
- Formation utilisateurs (si nécessaire)

**Livrable :** 🚀 **GO-LIVE PRODUCTION - 2026-02-19**

---

**TOTAL : 18 semaines**
**GO-LIVE PRODUCTION : 2026-02-19**

**Métriques cibles Go-Live :**
- 224 endpoints implémentés ✅
- Tests coverage backend >80% ✅
- Tests coverage frontend >75% ✅
- Lighthouse score >85 ✅
- Security audit passé ✅
- Performance optimisée ✅

---

## ✅ CHECKLIST COMPRÉHENSION

**Avant commencer à travailler :**

- [ ] J'ai compris la RÈGLE 0 (hiérarchie sources)
- [ ] Je sais où trouver le schéma database
- [ ] Je sais que le fichier .env existe déjà
- [ ] Je sais utiliser `app/database/repositories/`
- [ ] Je sais ignorer `app/repositories/`
- [ ] Je comprends les statuts implémentation (NON IMPL, MOCK, PARTIEL, IMPL)
- [ ] Je sais que les use cases peuvent contenir des biais
- [ ] Je sais vérifier le code réel avant implémenter

**Si une case n'est pas cochée : RE-LIRE ce document**

---

**NEXT ACTION :** Lire `.agent/System/TECH_STACK.md` pour comprendre le stack technique détaillé
