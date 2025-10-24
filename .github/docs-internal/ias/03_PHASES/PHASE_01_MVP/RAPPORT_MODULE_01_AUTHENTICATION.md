# RAPPORT MODULE 01 - AUTHENTICATION & USER MANAGEMENT

**Date :** 2025-10-24
**Statut :** 🔄 EN PLANIFICATION
**Durée estimée :** 5 jours ouvrés (au lieu de 7 - gain 2 jours grâce au template)
**Dates :** 2025-10-25 → 2025-10-29

---

## 📊 VUE D'ENSEMBLE

### Objectifs

**Backend (FastAPI) :**
- **15 endpoints REST** dont 2 partiellement implémentés
- **13 endpoints à implémenter** de toutes pièces
- **4 services métier** : AuthService, UserService, SessionService, EmailService
- **4 repositories DB** : UserRepository, SessionRepository, PasswordResetRepository, VerificationCodeRepository
- **Tests coverage** : > 80% (21 tests critiques + tests sécurité)

**Frontend (Next.js) :**
- **5 pages** : /login, /register, /profile, /reset-password, /verify-email
- **6 composants** : LoginForm, RegisterForm, ProfileForm, PasswordChangeForm, 2FASetup, SessionsTable
- **3 hooks custom** : useAuth, useSession, use2FA
- **2 validations Zod** : authSchema, profileSchema

**Refactoring Sécurité (CRITIQUE) :**
- Migrer `auth.py` (183 lignes) vers config.py + bcrypt
- Supprimer 3 vulnérabilités identifiées en Phase 0 :
  - SEC-001 : JWT secret hardcodé → Config
  - SEC-002 : Backdoor SMTP password → Suppression
  - SEC-003 : SHA256 faible → Bcrypt

### État Actuel vs Cible

| Composant | État Actuel | Cible | Écart |
|-----------|-------------|-------|-------|
| **Endpoints Backend** | 2/15 (13%) | 15/15 (100%) | +13 endpoints |
| **Sécurité Auth** | 3 vulnérabilités critiques | 0 vulnérabilité | Refactoring complet |
| **Services Métier** | 0 | 4 services | +4 services |
| **Repositories DB** | 0 | 4 repositories | +4 repositories |
| **Pages Frontend** | 0 | 5 pages | +5 pages |
| **Tests Backend** | 0 | 21 tests | +21 tests |
| **Tests E2E** | 0 | 3 workflows | +3 tests Playwright |

---

## 🎯 DÉCISIONS TECHNIQUES

### DEC-M01-001 : Architecture Services/Repositories

**Décision :** Adopter pattern Services + Repositories pour séparer logique métier et accès DB.

**Justification :**
- Testabilité : Services injectables via dépendances
- Réutilisabilité : Repositories partagés entre modules
- Maintenabilité : Séparation claire des responsabilités

**Structure :**
```
app/
├── api/v1/auth.py           # Routes FastAPI
├── services/
│   ├── auth_service.py      # Logique métier auth (login, register, 2FA)
│   ├── user_service.py      # Gestion utilisateurs
│   ├── session_service.py   # Gestion sessions
│   └── email_service.py     # Envoi emails (SMTP)
├── database/repositories/
│   ├── user_repository.py
│   ├── session_repository.py
│   ├── password_reset_repository.py
│   └── verification_code_repository.py
└── models/
    ├── user.py              # Pydantic models
    └── auth.py              # Request/Response models
```

### DEC-M01-002 : Gestion Tokens JWT

**Décision :** Dual tokens (access + refresh) avec blacklist Redis optionnel.

**Configuration :**
- **Access Token** : Expire 60 minutes, stocké en memory (JavaScript)
- **Refresh Token** : Expire 7 jours, httpOnly cookie
- **Blacklist** : Redis (production) ou DB table (fallback si Redis indisponible)
- **Secret** : Chargé via Secret Manager GCP (configuré Phase 0)

**Rotation :**
- Refresh token renouvelé à chaque utilisation
- Ancien refresh token blacklisté immédiatement

### DEC-M01-003 : Password Hashing

**Décision :** Bcrypt avec 12 rounds (déjà configuré en Phase 0).

**Migration nécessaire :**
```python
# AVANT (auth.py ligne 72-73) - VULNÉRABLE
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# APRÈS (utiliser core/crypto.py)
from app.core.crypto import hash_password_bcrypt, verify_password_bcrypt
```

### DEC-M01-004 : Email Service

**Décision :** SMTP Gmail configuré (SMTP_PASSWORD_GMAIL en Secret Manager).

**Blockers potentiels :**
- Quota Gmail : 500 emails/jour (suffisant pour MVP)
- Configuration 2-Step Verification Gmail requise
- SMTP credentials déjà en secrets (Phase 0)

**Fonctionnalités requises :**
- Email vérification (code 6 chiffres)
- Password reset (lien + token expire 1h)
- Welcome email
- Security alerts (password changed, 2FA enabled/disabled)

### DEC-M01-005 : 2FA Implementation

**Décision :** TOTP (Time-based One-Time Password) avec library `pyotp`.

**Flux :**
1. Enable 2FA : Générer secret TOTP, retourner QR code + backup codes
2. Verify 2FA : Vérifier code 6 chiffres (30s window)
3. Login avec 2FA : temp_token → code 2FA → access_token complet

**Library :** `pyotp` (déjà présent si pas présent, ajouter à requirements.txt)

### DEC-M01-006 : Utilisation Template Frontend Existant ⭐ DÉCOUVERTE MAJEURE

**Décision :** Utiliser le template Next.js complet existant dans `.github/docs-internal/templates/project/`

**Justification :**
Un template production-ready COMPLET a été découvert avec :
- ✅ **Store auth Zustand** (195 lignes) avec TOUTES les méthodes (login, register, logout, updateProfile, verifyEmail, resetPassword, updatePassword)
- ✅ **Layout complet** (Header + Footer) avec navigation + auth buttons
- ✅ **50+ composants UI shadcn** déjà installés
- ✅ **Charte graphique** définie (couleurs, fonts, logo gradient drapeau Guinée)
- ✅ **Dark mode + multilingue** (es/fr/en) déjà implémentés
- ✅ **Interface User** correspond EXACTEMENT au modèle backend (rôles: citizen, business, admin, dgi_agent)

**Impact Timeline :**
- **Ancienne estimation frontend** : 22 heures (Jours 5-7)
- **Nouvelle estimation** : 6 heures (avec réutilisation template)
- **Gain** : **~16 heures = 2 jours économisés**

**Migration requise (Jour 0 - 2h) :**
1. Copier store auth → `packages/web/lib/stores/`
2. Copier layout header/footer → `packages/web/components/layout/`
3. Copier logo `taxasge.png` → `packages/web/public/logo.png`
4. Copier globals.css + tailwind.config
5. Changer URL API (firebase.app → backend staging)

**Référence :** [DECISION_006_FRONTEND_TEMPLATE.md](../../01_DECISIONS/DECISION_006_FRONTEND_TEMPLATE.md)

---

## 🏗️ ARCHITECTURE DÉTAILLÉE

### Backend - Endpoints REST (15)

#### Groupe 1 : Core Authentication (CRITIQUE)
| Endpoint | Méthode | Statut Actuel | Priorité | Estimation |
|----------|---------|---------------|----------|------------|
| `/auth/register` | POST | ❌ NON IMPLÉMENTÉ | P0 | 4h |
| `/auth/login` | POST | ⚠️ PARTIEL (mock users) | P0 | 2h (refactor) |
| `/auth/logout` | POST | ❌ NON IMPLÉMENTÉ | P0 | 2h |
| `/auth/refresh` | POST | ❌ NON IMPLÉMENTÉ | P0 | 3h |

#### Groupe 2 : Gestion Profil (HAUTE)
| Endpoint | Méthode | Statut Actuel | Priorité | Estimation |
|----------|---------|---------------|----------|------------|
| `/auth/profile` | GET | ⚠️ PARTIEL (mock) | P1 | 1h |
| `/auth/profile` | PATCH | ❌ NON IMPLÉMENTÉ | P1 | 2h |
| `/auth/password/change` | POST | ❌ NON IMPLÉMENTÉ | P1 | 3h |

#### Groupe 3 : Password Reset (HAUTE)
| Endpoint | Méthode | Statut Actuel | Priorité | Estimation |
|----------|---------|---------------|----------|------------|
| `/auth/password/reset/request` | POST | ❌ NON IMPLÉMENTÉ | P1 | 3h |
| `/auth/password/reset/confirm` | POST | ❌ NON IMPLÉMENTÉ | P1 | 2h |

#### Groupe 4 : Email Verification (MOYENNE)
| Endpoint | Méthode | Statut Actuel | Priorité | Estimation |
|----------|---------|---------------|----------|------------|
| `/auth/email/verify` | POST | ❌ NON IMPLÉMENTÉ | P2 | 2h |
| `/auth/email/resend` | POST | ❌ NON IMPLÉMENTÉ | P2 | 1h |

#### Groupe 5 : 2FA (MOYENNE)
| Endpoint | Méthode | Statut Actuel | Priorité | Estimation |
|----------|---------|---------------|----------|------------|
| `/auth/2fa/enable` | POST | ❌ NON IMPLÉMENTÉ | P2 | 4h |
| `/auth/2fa/verify` | POST | ❌ NON IMPLÉMENTÉ | P2 | 3h |
| `/auth/2fa/disable` | POST | ❌ NON IMPLÉMENTÉ | P2 | 2h |

#### Groupe 6 : Sessions (BASSE)
| Endpoint | Méthode | Statut Actuel | Priorité | Estimation |
|----------|---------|---------------|----------|------------|
| `/auth/sessions` | GET | ❌ NON IMPLÉMENTÉ | P3 | 2h |

**Total Backend :** ~38 heures (5 jours avec parallélisation)

### Frontend - Pages & Composants

#### Pages (Next.js 14 App Router)

| Page | Route | Composants | Estimation |
|------|-------|------------|------------|
| **Login** | `/login` | LoginForm, 2FAVerifyForm | 3h |
| **Register** | `/register` | RegisterForm, EmailVerifyPrompt | 4h |
| **Profile** | `/profile` | ProfileForm, PasswordChangeForm, SessionsTable | 5h |
| **Reset Password** | `/reset-password` | ResetRequestForm, ResetConfirmForm | 3h |
| **Verify Email** | `/verify-email` | EmailVerifyForm | 2h |

#### Composants Réutilisables

```typescript
components/
├── auth/
│   ├── LoginForm.tsx          // Form login + validation Zod
│   ├── RegisterForm.tsx       // Form register + validation Zod
│   ├── ProfileForm.tsx        // Update profile (first_name, last_name, phone)
│   ├── PasswordChangeForm.tsx // Change password (current + new)
│   ├── 2FASetup.tsx          // QR code display + verification
│   └── SessionsTable.tsx      // Liste sessions actives + revoke
├── ui/ (shadcn)
│   ├── button.tsx             // ✅ Existe déjà
│   ├── form.tsx               // ✅ Existe déjà
│   ├── input.tsx              // ✅ Existe déjà
│   └── card.tsx               // ✅ Existe déjà
```

#### Hooks Custom

```typescript
hooks/
├── useAuth.ts                 // Login, logout, register, session management
├── useSession.ts              // Get/revoke sessions
└── use2FA.ts                  // Enable, verify, disable 2FA
```

**Total Frontend :** ~22 heures (3 jours)

### Database Schema

#### Tables Existantes (Supabase)
- `users` : ✅ Existe (51 tables total détectées Phase 0)

#### Tables à Créer/Vérifier

```sql
-- Sessions actives
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL, -- SHA256(access_token)
  device VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE, -- reset_xxx
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

-- Email verification codes
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL, -- 123456
  type VARCHAR(20) NOT NULL, -- 'email_verify' | '2fa'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ
);

-- Indexes pour performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_verification_codes_user_code ON verification_codes(user_id, code);
```

---

## 📅 TIMELINE DÉTAILLÉE (5 JOURS) ⭐ OPTIMISÉE

**Gain grâce au template frontend : 2 jours** (7 jours → 5 jours)

### Jour 0 (2025-10-24 après-midi) : Migration Template Frontend 🆕

**Objectif :** Préparer le frontend en migrant le template existant.

**Tâches (2 heures) :**
- [ ] **TASK-M01-000** : Migration template (2h)
  - Copier `lib/stores/auth-store.ts` → `packages/web/lib/stores/`
  - Copier `components/layout/header.tsx` + `footer.tsx` → `packages/web/components/layout/`
  - Copier logo `taxasge.png` → `packages/web/public/logo.png`
  - Copier `app/globals.css` + `tailwind.config.ts`
  - Changer URL API : `firebase.app` → `NEXT_PUBLIC_API_URL` (backend staging)
  - Tester compilation `npm run dev`

**Livrables Jour 0 :**
- ✅ Template migré vers packages/web/
- ✅ Logo taxasge.png intégré au Header
- ✅ Store auth Zustand fonctionnel
- ✅ Compilation Next.js sans erreurs

---

### Jour 1 (2025-10-25) : Backend Core + Refactoring Sécurité

**Objectif :** Éliminer vulnérabilités SEC-001/002/003, implémenter 4 endpoints critiques.

**Tâches :**
- [ ] **TASK-M01-001** : Créer branch `feature/module-1-auth` (15min)
- [ ] **TASK-M01-002** : Refactoring sécurité auth.py (2h)
  - Migrer JWT_SECRET_KEY vers config.py
  - Remplacer SHA256 par bcrypt (utiliser `core/crypto.py`)
  - Supprimer backdoor SMTP password (lignes 76-81)
- [ ] **TASK-M01-003** : Créer `services/auth_service.py` (3h)
  - register(), login(), logout(), refresh_token()
- [ ] **TASK-M01-004** : Créer `repositories/user_repository.py` (2h)
  - create_user(), get_user_by_email(), update_user()

**Livrables Jour 1 :**
- ✅ auth.py sécurisé (0 vulnérabilité)
- ✅ 4 endpoints : register, login (refactoré), logout, refresh
- ✅ Tests unitaires AuthService (4 tests)

---

### Jour 2 (2025-10-26) : Backend Gestion Profil + Password Management

**Objectif :** Compléter gestion profil et reset password.

**Tâches :**
- [ ] **TASK-M01-005** : Implémenter endpoints profil (3h)
  - GET /profile (refactor mock → DB)
  - PATCH /profile
  - POST /password/change
- [ ] **TASK-M01-006** : Implémenter password reset (5h)
  - POST /password/reset/request (génération token + email)
  - POST /password/reset/confirm
  - Créer `services/email_service.py` (SMTP)
  - Créer `repositories/password_reset_repository.py`

**Livrables Jour 2 :**
- ✅ 3 endpoints profil fonctionnels
- ✅ 2 endpoints password reset fonctionnels
- ✅ EmailService opérationnel (SMTP configuré)
- ✅ Tests unitaires (6 tests)

---

### Jour 3 (2025-10-27) : Backend Email Verification + Sessions

**Objectif :** Compléter verification email et gestion sessions.

**Tâches :**
- [ ] **TASK-M01-007** : Email verification (3h)
  - POST /email/verify
  - POST /email/resend
  - Créer `repositories/verification_code_repository.py`
- [ ] **TASK-M01-008** : Sessions management (3h)
  - GET /sessions
  - Créer `services/session_service.py`
  - Créer `repositories/session_repository.py`
- [ ] **TASK-M01-009** : Tests intégration backend (2h)
  - Tests E2E workflow register → verify email → login

**Livrables Jour 3 :**
- ✅ 3 endpoints email + sessions fonctionnels
- ✅ 10/15 endpoints backend complétés (67%)
- ✅ Tests intégration (3 workflows E2E)

---

### Jour 4 (2025-10-28) : Backend 2FA Implementation

**Objectif :** Implémenter 2FA TOTP complet (enable/verify/disable).

**Tâches :**
- [ ] **TASK-M01-010** : Installation library 2FA (30min)
  - Ajouter `pyotp==2.9.0` à requirements.txt
  - Ajouter `qrcode==7.4.2` pour QR code generation
- [ ] **TASK-M01-011** : Implémenter 2FA endpoints (5h)
  - POST /2fa/enable (génération secret TOTP + QR code)
  - POST /2fa/verify (vérification code)
  - POST /2fa/disable
  - Modifier login pour supporter 2FA (temp_token)
- [ ] **TASK-M01-012** : Tests 2FA (2h)
  - Test workflow complet enable → verify → login avec 2FA

**Livrables Jour 4 :**
- ✅ 3 endpoints 2FA fonctionnels
- ✅ 15/15 endpoints backend complétés (100%)
- ✅ Tests 2FA (4 tests)
- ✅ Backend Module 1 100% terminé

---

### Jour 5 (2025-10-29) : Frontend Pages (Login + Register) - SIMPLIFIÉ ⭐

**Objectif :** Implémenter 2 pages auth principales (store Zustand déjà fait!).

**Tâches (2 heures) :**
- [ ] **TASK-M01-013** : Page /login (1h)
  - Créer page simple utilisant `useAuthStore().login()`
  - Form avec email + password (validation Zod)
  - Gestion erreurs UI (toast notifications)
- [ ] **TASK-M01-014** : Page /register (1h)
  - Créer page simple utilisant `useAuthStore().register()`
  - Form avec email + password + name + role
  - Redirect vers /verify-email après succès

**Livrables Jour 5 :**
- ✅ 2 pages (/login, /register) fonctionnelles
- ✅ Store auth intégré (méthodes déjà codées)
- ✅ Navigation Header fonctionnelle

**Note :** Hooks useAuth déjà dans store Zustand, pas besoin de recréer!

---

### Jour 6 (2025-10-29 après-midi) : Frontend Profil + Password Reset - SIMPLIFIÉ ⭐

**Objectif :** Compléter 3 pages restantes (store gère la logique).

**Tâches (2 heures) :**
- [ ] **TASK-M01-015** : Page /profile (45min)
  - Affichage user via `useAuthStore().user`
  - Form update profil utilisant `updateProfile()`
  - Form change password utilisant `updatePassword()`
- [ ] **TASK-M01-016** : Page /reset-password (45min)
  - Form request reset utilisant `resetPassword(email)`
  - Page confirm reset (token param URL)
- [ ] **TASK-M01-017** : Page /verify-email (30min)
  - Form code 6 chiffres utilisant `verifyEmail(token)`

**Livrables Jour 6 :**
- ✅ 3 pages (/profile, /reset-password, /verify-email) fonctionnelles
- ✅ 5/5 pages frontend complétées (100%)
- ✅ Toutes méthodes store testées

**Total Frontend : 4 heures** (au lieu de 22h!)

---

### Jour 7 (2025-10-29 fin de journée) : 2FA + Tests + Go/No-Go - OPTIMISÉ ⭐

**Objectif :** 2FA frontend + tests E2E + validation finale.

**Tâches (2 heures) :**
- [ ] **TASK-M01-018** : Composant 2FA (1h)
  - Composant simple affichage QR code (endpoint backend retourne data URI)
  - Form verification code 6 chiffres
  - Intégrer dans page /profile (enable/disable 2FA)
- [ ] **TASK-M01-019** : Tests E2E essentiels (30min)
  - Test workflow register → verify email → login (manuel ou Playwright basique)
  - Test login + navigation vers profile
- [ ] **TASK-M01-020** : Validation Go/No-Go (30min)
  - Exécuter checklist 12 critères
  - Tester manuellement tous les endpoints
  - Décision GO/NO-GO

**Livrables Jour 7 :**
- ✅ 2FA frontend basique fonctionnel
- ✅ Tests E2E workflow principal
- ✅ Décision GO/NO-GO documentée

**Module 1 terminé en 5 jours !** (au lieu de 7)

---

## ⚠️ RISQUES & MITIGATIONS

### Risque #1 : SMTP Configuration Incomplète (Impact: HAUTE, Probabilité: MOYENNE)

**Description :** Email verification et password reset nécessitent SMTP Gmail opérationnel.

**Impact :**
- Blocage register (email verification obligatoire)
- Blocage password reset (email requis)

**Mitigation :**
- **Plan A** : Utiliser SMTP_PASSWORD_GMAIL déjà en Secret Manager (Phase 0)
- **Plan B** : Si SMTP bloqué, créer mode "dev" avec skip email verification
- **Plan C** : Utiliser SendGrid API (gratuit 100 emails/jour)

**Actions préventives :**
- Tester SMTP dès Jour 2 (TASK-M01-006)
- Documenter configuration Gmail 2-Step Verification

---

### Risque #2 : Redis Indisponible en Staging (Impact: MOYENNE, Probabilité: HAUTE)

**Description :** Token blacklist optimal avec Redis, mais Redis désactivé en staging (Phase 0).

**Impact :**
- Logout et refresh_token moins performants (DB queries au lieu de Redis)
- Latence P95 logout : 200ms → 400ms

**Mitigation :**
- **Plan A** : Utiliser DB table `token_blacklist` comme fallback
- **Plan B** : Activer Redis Cloud (gratuit 30MB, suffisant pour MVP)

**Décision :** Accepter performance dégradée en staging, Redis pour production uniquement.

---

### Risque #3 : 2FA Complexity (Impact: MOYENNE, Probabilité: MOYENNE)

**Description :** 2FA TOTP requiert QR code generation + secret storage chiffré.

**Impact :**
- Estimation Jour 4 sous-estimée (5h → 7h possible)
- Complexité tests (simulate TOTP codes)

**Mitigation :**
- Utiliser libraries éprouvées : `pyotp` (backend) + `otpauth` (frontend)
- Mock TOTP codes en tests (pas de vraie génération)
- Rendre 2FA optionnel (P2) : peut être décalé si blocage

---

### Risque #4 : Frontend State Management (Impact: BASSE, Probabilité: BASSE)

**Description :** Gestion session utilisateur côté client (access_token, user info).

**Impact :**
- Risque XSS si access_token en localStorage
- Gestion refresh token complexe

**Mitigation :**
- Stocker access_token en memory (React state, pas localStorage)
- Refresh_token en httpOnly cookie (géré backend)
- Utiliser Context API React pour state global auth

---

## ✅ CRITÈRES GO/NO-GO MODULE 1

### Critères Critiques (Blocants)

| ID | Critère | Validation | Statut |
|----|---------|------------|--------|
| **M01-C01** | 15/15 endpoints backend implémentés et fonctionnels | Tests unitaires + Swagger UI | ⚪ PENDING |
| **M01-C02** | Vulnérabilités sécurité SEC-001/002/003 résolues | Audit code auth.py | ⚪ PENDING |
| **M01-C03** | Tests coverage backend > 80% | pytest --cov | ⚪ PENDING |
| **M01-C04** | 5/5 pages frontend fonctionnelles (login, register, profile, reset, verify) | Tests manuels | ⚪ PENDING |
| **M01-C05** | Workflow complet register → verify email → login OK | Test E2E Playwright | ⚪ PENDING |

### Critères Importants (Non-blocants)

| ID | Critère | Validation | Statut |
|----|---------|------------|--------|
| **M01-I01** | 2FA TOTP enable → verify → login fonctionnel | Test E2E Playwright | ⚪ PENDING |
| **M01-I02** | EmailService opérationnel (verification + password reset) | Envoi email réel | ⚪ PENDING |
| **M01-I03** | Latence P95 login < 300ms | Tests charge (k6 ou locust) | ⚪ PENDING |
| **M01-I04** | Rate limiting login configuré (5 tentatives / 15min) | Tests abuse | ⚪ PENDING |
| **M01-I05** | Documentation Swagger UI complète (15 endpoints) | Review Swagger | ⚪ PENDING |

### Critères Optionnels (Nice-to-Have)

| ID | Critère | Validation | Statut |
|----|---------|------------|--------|
| **M01-O01** | Sessions management UI fonctionnel | Test manuel | ⚪ PENDING |
| **M01-O02** | Tests E2E couvrent 3 workflows principaux | 3 tests Playwright | ⚪ PENDING |
| **M01-O03** | Password policy frontend (validation temps réel) | Test UX | ⚪ PENDING |

### Décision GO/NO-GO

**GO si :**
- ✅ 5/5 critères critiques validés
- ✅ 4/5 critères importants validés
- ✅ Backend déployé staging sans erreurs 5xx
- ✅ Frontend déployé staging accessible

**NO-GO si :**
- ❌ 1+ critère critique échoue
- ❌ 3+ critères importants échouent
- ❌ Vulnérabilité sécurité non résolue

**Actions NO-GO :**
- Identifier cause racine des échecs
- Créer plan correctif (1-2 jours supplémentaires)
- Re-tester critères bloquants
- Nouvelle décision GO/NO-GO

---

## 📊 MÉTRIQUES DE SUCCÈS

### KPIs Techniques

| Métrique | Valeur Cible | Mesure |
|----------|--------------|--------|
| **Endpoints Backend** | 15/15 (100%) | Swagger UI |
| **Tests Coverage Backend** | > 80% | pytest --cov |
| **Pages Frontend** | 5/5 (100%) | Manual test |
| **Latence P95 Login** | < 300ms | Tests charge |
| **Taux Succès Login** | > 98% | Métriques staging |
| **Vulnérabilités Sécurité** | 0 | Audit code |

### KPIs Métier (Staging)

| KPI | Formule | Cible |
|-----|---------|-------|
| **Taux Conversion Inscription** | (Email Verified / Registered) × 100 | > 70% |
| **Taux Échec Login** | (Failed Logins / Total Attempts) × 100 | < 5% |
| **Temps Moyen Inscription** | AVG(email_verified_at - created_at) | < 30 minutes |
| **Adoption 2FA** | (Users 2FA Enabled / Active Users) × 100 | > 10% (optionnel) |

### Métriques de Livraison

| Métrique | Valeur |
|----------|--------|
| **Durée Planifiée** | 7 jours |
| **Effort Backend** | ~38 heures (5 jours) |
| **Effort Frontend** | ~22 heures (3 jours) |
| **Total Story Points** | 21 SP |
| **Vélocité Cible** | 3 SP/jour |

---

## 📚 RÉFÉRENCES

### Documentation Projet

- **Use Case Source** : `.github/docs-internal/Documentations/Backend/use_cases/01_AUTH.md`
- **Baseline Backend** : `.github/docs-internal/ias/02_BASELINES/BASELINE_BACKEND_2025-10-24.md`
- **Décisions Sécurité** : `.github/docs-internal/ias/01_DECISIONS/DECISION_003_SECURITY_HARDENING.md`

### Fichiers Code Principaux

**Backend :**
- `packages/backend/app/api/v1/auth.py` (lignes 1-183) - À refactorer
- `packages/backend/app/config.py` (lignes 52-62) - JWT config OK
- `packages/backend/app/core/secrets.py` - Secret Manager GCP
- `packages/backend/app/core/crypto.py` - Bcrypt utilities (Phase 0)

**Frontend :**
- `packages/web/app/(auth)/login/page.tsx` - Page login existante (partielle)
- `packages/web/components/ui/` - shadcn components (20 existants)

### Dépendances Externes

**Backend Python :**
- `fastapi>=0.104.0`
- `pydantic>=2.4.0`
- `python-jose[cryptography]` (JWT)
- `bcrypt>=4.1.0` (Phase 0)
- `pyotp==2.9.0` (2FA - à ajouter)
- `qrcode==7.4.2` (QR codes - à ajouter)

**Frontend TypeScript :**
- `next@14.0.0`
- `react@18.2.0`
- `zod@3.22.0` (validations)
- `@radix-ui/react-*` (shadcn UI)
- `otpauth` (2FA frontend - à ajouter)

---

## 🎯 PROCHAINES ÉTAPES IMMÉDIATES

### Actions Pré-Démarrage (2025-10-25 matin)

1. **Créer branch feature** : `git checkout -b feature/module-1-auth`
2. **Vérifier dépendances** :
   - PostgreSQL connecté (✅ validé Phase 0)
   - SMTP credentials configurés (✅ Phase 0)
   - JWT_SECRET_KEY en Secret Manager (✅ Phase 0)
3. **Setup environnement dev** :
   - Backend : `cd packages/backend && source venv/bin/activate`
   - Frontend : `cd packages/web && npm install`
4. **Lire use case** : `.github/docs-internal/Documentations/Backend/use_cases/01_AUTH.md`

### Démarrage Jour 1 (2025-10-25)

**9h00 :** Kickoff Module 1
- Review plan développement (ce rapport)
- Clarifications questions techniques
- Assignment tâches backend/frontend

**9h30 :** Start TASK-M01-002 (Refactoring sécurité)
- Objectif : Éliminer SEC-001/002/003 avant nouveaux endpoints
- Temps estimé : 2h

**17h00 :** Revue Jour 1
- 4 endpoints core opérationnels (register, login, logout, refresh)
- auth.py sécurisé (0 vulnérabilité)
- Commit + push vers feature/module-1-auth

---

**FIN RAPPORT MODULE 01 - AUTHENTICATION**

**Prochaine mise à jour :** 2025-10-25 18:00 UTC (fin Jour 1)

**Généré par :** Claude Code Expert IA via taxasge-orchestrator skill
**Validé par :** ⏳ EN ATTENTE VALIDATION

---

*Ce rapport sera mis à jour quotidiennement avec progression réelle vs planifiée.*
