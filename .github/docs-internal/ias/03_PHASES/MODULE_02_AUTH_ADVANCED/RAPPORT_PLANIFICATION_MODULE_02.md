# RAPPORT DE PLANIFICATION - MODULE 02 : AUTHENTICATION AVANCÉE + TESTS

**Module :** 02 - Authentication Avancée + Tests (Dette Technique MODULE_01)
**Date :** 2025-11-01
**Version :** 1.0
**Auteur :** Claude Code (TaxasGE Orchestrator)
**Validé par :** [En attente validation]
**Statut :** 🟡 DRAFT

---

## 🎯 OBJECTIFS MODULE

### Objectif Principal

**Compléter MODULE_01 Authentication** en implémentant les fonctionnalités avancées et tests automatisés reportés lors du GO CONDITIONNEL.

Ce module vise à **résorber 100% de la dette technique MODULE_01** pour atteindre le scope initial prévu.

### Objectifs Secondaires

1. **Implémenter features auth avancées** : 2FA, password reset, email verification, sessions management
2. **Créer suite tests complète** : Tests unitaires backend (>80% coverage) + Tests E2E frontend (Playwright)
3. **Compléter frontend auth** : Pages profile et reset-password
4. **Valider qualité production** : 0 bugs critiques, documentation complète, performance validée

---

## 📊 ÉTAT ACTUEL (Baseline MODULE_01)

### Backend (packages/backend/app/api/v1/auth.py)

**Endpoints Existants (6/15):**
- ✅ POST `/auth/register` - Inscription utilisateur
- ✅ POST `/auth/login` - Connexion utilisateur
- ✅ POST `/auth/logout` - Déconnexion
- ✅ POST `/auth/refresh` - Rafraîchissement token
- ✅ GET `/auth/profile` - Récupération profil
- ✅ POST `/auth/password/change` - Changement mot de passe

**Endpoints Manquants (9/15):**
- ❌ POST `/auth/password/reset/request` - Demande reset password
- ❌ POST `/auth/password/reset/confirm` - Confirmation reset
- ❌ POST `/auth/email/verify` - Vérification email
- ❌ POST `/auth/email/resend` - Renvoi code vérification
- ❌ POST `/auth/2fa/enable` - Activation 2FA
- ❌ POST `/auth/2fa/verify` - Vérification 2FA
- ❌ POST `/auth/2fa/disable` - Désactivation 2FA
- ❌ GET `/auth/sessions` - Liste sessions actives
- ❌ DELETE `/auth/sessions/{id}` - Révocation session

**Services Backend Existants:**
- ✅ `auth_service.py` - AuthService (login, register, logout, refresh)
- ✅ `user_service.py` - UserService (CRUD users)
- ✅ `password_service.py` - PasswordService (hash, verify)
- ❌ `email_service.py` - EmailService (SMTP) - NON IMPLÉMENTÉ
- ❌ `session_service.py` - SessionService - NON IMPLÉMENTÉ

**Repositories Backend Existants:**
- ✅ `user_repository.py` - UserRepository (CRUD + find_by_email_with_password)
- ❌ `password_reset_repository.py` - NON IMPLÉMENTÉ
- ❌ `verification_code_repository.py` - NON IMPLÉMENTÉ
- ❌ `session_repository.py` - NON IMPLÉMENTÉ

**Tests Backend:**
- ❌ 0% coverage (aucun test automatisé)
- Validation: 100% manuelle via DevTools + tests staging

### Frontend (packages/web/src/app/auth/)

**Pages Existantes (3/5):**
- ✅ `/auth` - Page auth unifiée (tabs login/register)
- ✅ `/auth/login` - Page login
- ✅ `/auth/register` - Page register

**Pages Manquantes (2/5):**
- ❌ `/profile` - Gestion profil utilisateur
- ❌ `/reset-password` - Reset mot de passe

**Composants Frontend:**
- ✅ LoginForm (intégré dans page)
- ✅ RegisterForm (intégré dans page)
- ❌ ProfileForm - NON CRÉÉ
- ❌ PasswordResetForm - NON CRÉÉ
- ❌ 2FASetup - NON CRÉÉ
- ❌ SessionsTable - NON CRÉÉ

**Tests Frontend:**
- ❌ 0% coverage (aucun test Jest)
- ❌ 0 tests E2E (aucun test Playwright)

**Complétude estimée :** **40% backend, 60% frontend, 0% tests**

---

## 🎯 SCOPE PRÉCIS MODULE_02

### Backend - Endpoints à Implémenter (9)

#### Groupe 1 : Password Reset (PRIORITÉ 1)
| Endpoint | Méthode | Priorité | Estimé (heures) | Dépendances |
|----------|---------|----------|-----------------|-------------|
| `/auth/password/reset/request` | POST | P1 | 3h | EmailService |
| `/auth/password/reset/confirm` | POST | P1 | 2h | PasswordResetRepository |

**Total Groupe 1:** 5 heures

#### Groupe 2 : Email Verification (PRIORITÉ 1)
| Endpoint | Méthode | Priorité | Estimé (heures) | Dépendances |
|----------|---------|----------|-----------------|-------------|
| `/auth/email/verify` | POST | P1 | 2h | VerificationCodeRepository |
| `/auth/email/resend` | POST | P1 | 1h | EmailService |

**Total Groupe 2:** 3 heures

#### Groupe 3 : 2FA (PRIORITÉ 2 - Nice-to-Have)
| Endpoint | Méthode | Priorité | Estimé (heures) | Dépendances |
|----------|---------|----------|-----------------|-------------|
| `/auth/2fa/enable` | POST | P2 | 4h | pyotp, qrcode libraries |
| `/auth/2fa/verify` | POST | P2 | 3h | TOTP validation |
| `/auth/2fa/disable` | POST | P2 | 2h | User model update |

**Total Groupe 3:** 9 heures (optionnel)

#### Groupe 4 : Sessions Management (PRIORITÉ 2 - Nice-to-Have)
| Endpoint | Méthode | Priorité | Estimé (heures) | Dépendances |
|----------|---------|----------|-----------------|-------------|
| `/auth/sessions` | GET | P2 | 2h | SessionRepository |
| `/auth/sessions/{id}` | DELETE | P2 | 1h | SessionService |

**Total Groupe 4:** 3 heures (optionnel)

**Total Backend Endpoints:** 8h (P1) + 12h (P2) = 20 heures

### Backend - Services à Créer/Modifier

#### EmailService (CRITIQUE - Priorité 1)
**Fichier:** `packages/backend/app/services/email_service.py`
**Fonctionnalités:**
- Envoi email vérification (code 6 chiffres)
- Envoi email reset password (lien + token expire 1h)
- Envoi welcome email
- Envoi security alerts (password changed, 2FA enabled/disabled)

**Configuration:**
- SMTP Gmail déjà configuré (SMTP_PASSWORD_GMAIL en Secret Manager)
- Quota: 500 emails/jour (suffisant MVP)

**Estimation:** 4 heures

#### SessionService (Priorité 2)
**Fichier:** `packages/backend/app/services/session_service.py`
**Fonctionnalités:**
- Création session (token hash + metadata)
- Liste sessions utilisateur
- Révocation session
- Nettoyage sessions expirées

**Estimation:** 3 heures

**Total Services:** 7 heures

### Backend - Repositories à Créer

#### PasswordResetRepository (Priorité 1)
**Fichier:** `packages/backend/app/database/repositories/password_reset_repository.py`
**Méthodes:**
- `create_reset_token(user_id, token, expires_at)`
- `get_by_token(token)`
- `mark_as_used(token)`
- `delete_expired()`

**Estimation:** 2 heures

#### VerificationCodeRepository (Priorité 1)
**Fichier:** `packages/backend/app/database/repositories/verification_code_repository.py`
**Méthodes:**
- `create_code(user_id, code, type, expires_at)`
- `get_by_user_and_code(user_id, code)`
- `mark_as_verified(code_id)`
- `delete_expired()`

**Estimation:** 2 heures

#### SessionRepository (Priorité 2)
**Fichier:** `packages/backend/app/database/repositories/session_repository.py`
**Méthodes:**
- `create_session(user_id, token_hash, metadata)`
- `get_user_sessions(user_id)`
- `delete_session(session_id)`
- `delete_expired()`

**Estimation:** 2 heures

**Total Repositories:** 6 heures

### Backend - Tests Unitaires (CRITIQUE - Priorité 1)

#### Tests Services
**Framework:** pytest
**Fichiers à créer:**
- `tests/services/test_auth_service.py` - 15 tests (login, register, logout, refresh, password_change)
- `tests/services/test_email_service.py` - 8 tests (envoi emails, templates, erreurs SMTP)
- `tests/services/test_session_service.py` - 6 tests (CRUD sessions)

**Total tests services:** 29 tests

#### Tests Repositories
**Fichiers à créer:**
- `tests/repositories/test_user_repository.py` - 10 tests (CRUD, find_by_email_with_password)
- `tests/repositories/test_password_reset_repository.py` - 6 tests
- `tests/repositories/test_verification_code_repository.py` - 6 tests
- `tests/repositories/test_session_repository.py` - 5 tests

**Total tests repositories:** 27 tests

#### Tests Endpoints
**Fichiers à créer:**
- `tests/api/test_auth_endpoints.py` - 15 tests (tous endpoints auth)

**Total tests endpoints:** 15 tests

**Total Tests Backend:** 71 tests
**Target Coverage:** >80% (actuellement 0%)
**Estimation:** 12 heures

### Frontend - Pages à Créer (2)

#### Page /profile
**Fichier:** `packages/web/src/app/profile/page.tsx`
**Composants:**
- ProfileForm (update first_name, last_name, phone)
- PasswordChangeForm (current_password + new_password)
- SessionsTable (liste sessions actives + revoke button)
- 2FASetup (enable/disable 2FA, QR code display)

**Estimation:** 5 heures

#### Page /reset-password
**Fichier:** `packages/web/src/app/reset-password/page.tsx`
**Composants:**
- ResetRequestForm (email input → send reset link)
- ResetConfirmForm (new_password + token from URL)

**Estimation:** 3 heures

**Total Frontend Pages:** 8 heures

### Frontend - Tests E2E (CRITIQUE - Priorité 1)

#### Playwright Tests
**Framework:** Playwright
**Fichiers à créer:**
- `tests/e2e/auth-flow.spec.ts` - 5 scénarios
  - Scénario 1: Register → Verify Email → Login
  - Scénario 2: Login → Logout
  - Scénario 3: Login → Change Password → Re-login
  - Scénario 4: Reset Password → Confirm → Login
  - Scénario 5: Login → View Profile → Update Profile

**Estimation:** 6 heures

#### Jest Tests (Unitaires)
**Framework:** Jest + React Testing Library
**Fichiers à créer:**
- `tests/components/LoginForm.test.tsx` - 8 tests
- `tests/components/RegisterForm.test.tsx` - 8 tests
- `tests/api/authApi.test.ts` - 6 tests

**Estimation:** 4 heures

**Total Tests Frontend:** 10 heures

---

## 🧪 STRATÉGIE TESTS

### Tests Backend (pytest)

**Configuration:**
```bash
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = --cov=app --cov-report=html --cov-report=term-missing --cov-fail-under=80
```

**Structure tests:**
```
tests/
├── conftest.py                    # Fixtures globales (db, client, auth headers)
├── api/
│   └── test_auth_endpoints.py    # Tests endpoints REST
├── services/
│   ├── test_auth_service.py
│   ├── test_email_service.py
│   └── test_session_service.py
└── repositories/
    ├── test_user_repository.py
    ├── test_password_reset_repository.py
    ├── test_verification_code_repository.py
    └── test_session_repository.py
```

**Target Coverage:** >80% (ligne 80% minimum)

### Tests Frontend (Jest + Playwright)

**Configuration Jest:**
```json
{
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
  "collectCoverageFrom": [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 75,
      "functions": 75,
      "lines": 75,
      "statements": 75
    }
  }
}
```

**Configuration Playwright:**
```typescript
// playwright.config.ts
export default {
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
}
```

**Target Coverage:** >75% (Jest unitaires)

---

## ⏱️ PLANNING DÉTAILLÉ (3-4 JOURS)

### Jour 1 (2025-11-04) : Backend Email + Password Reset + Tests Setup

**Matin (4h):**
- [ ] Créer `email_service.py` (SMTP Gmail, templates emails)
- [ ] Créer `password_reset_repository.py`
- [ ] Implémenter POST `/auth/password/reset/request`
- [ ] Implémenter POST `/auth/password/reset/confirm`

**Après-midi (4h):**
- [ ] Créer `verification_code_repository.py`
- [ ] Implémenter POST `/auth/email/verify`
- [ ] Implémenter POST `/auth/email/resend`
- [ ] Setup pytest configuration + conftest.py

**Livrables Jour 1:**
- ✅ 4 endpoints P1 implémentés (reset + email verification)
- ✅ 2 repositories créés
- ✅ EmailService opérationnel
- ✅ Pytest configuré

---

### Jour 2 (2025-11-05) : Backend Tests Unitaires (PRIORITÉ 1)

**Matin (4h):**
- [ ] Tests services: `test_auth_service.py` (15 tests)
- [ ] Tests services: `test_email_service.py` (8 tests)

**Après-midi (4h):**
- [ ] Tests repositories: `test_user_repository.py` (10 tests)
- [ ] Tests repositories: `test_password_reset_repository.py` (6 tests)
- [ ] Tests repositories: `test_verification_code_repository.py` (6 tests)

**Livrables Jour 2:**
- ✅ 45 tests backend écrits
- ✅ Coverage backend >80%
- ✅ CI/CD tests backend passent

---

### Jour 3 (2025-11-06) : Frontend Pages + Tests E2E (PRIORITÉ 1)

**Matin (4h):**
- [ ] Créer page `/profile` (ProfileForm + PasswordChangeForm)
- [ ] Créer page `/reset-password` (ResetRequestForm + ResetConfirmForm)

**Après-midi (4h):**
- [ ] Setup Playwright configuration
- [ ] Tests E2E: `auth-flow.spec.ts` (5 scénarios)
- [ ] Tests Jest: `LoginForm.test.tsx` + `RegisterForm.test.tsx`

**Livrables Jour 3:**
- ✅ 2 pages frontend créées
- ✅ 5 tests E2E Playwright
- ✅ Tests Jest composants principaux

---

### Jour 4 (2025-11-07) : Features Optionnelles + Validation (Si temps disponible)

**Optionnel - 2FA + Sessions (Priorité 2):**
- [ ] Implémenter POST `/auth/2fa/enable` (4h)
- [ ] Implémenter POST `/auth/2fa/verify` (3h)
- [ ] Implémenter GET `/auth/sessions` (2h)

**Validation Finale:**
- [ ] Exécuter toute suite tests (backend + frontend)
- [ ] Vérifier coverage >80% backend, >75% frontend
- [ ] Déploiement staging MODULE_02
- [ ] Smoke tests complets
- [ ] Go/No-Go MODULE_02

**Livrables Jour 4:**
- ✅ Features P2 (si temps) ou validation complète
- ✅ MODULE_02 prêt production

---

## 📏 CRITÈRES ACCEPTATION

### Backend
- [ ] 4/4 endpoints P1 implémentés (reset + email verification) ✅ OBLIGATOIRE
- [ ] 5/5 endpoints P2 implémentés (2FA + sessions) ⚪ OPTIONNEL
- [ ] Tests coverage >80% ✅ OBLIGATOIRE
- [ ] 0 erreurs pytest ✅ OBLIGATOIRE
- [ ] EmailService fonctionnel (envoi réel Gmail) ✅ OBLIGATOIRE

### Frontend
- [ ] 2/2 pages créées (profile, reset-password) ✅ OBLIGATOIRE
- [ ] 5 tests E2E Playwright passent ✅ OBLIGATOIRE
- [ ] Tests Jest coverage >75% ✅ OBLIGATOIRE
- [ ] 0 erreurs TypeScript ✅ OBLIGATOIRE

### Intégration
- [ ] Flow reset password fonctionne end-to-end ✅ OBLIGATOIRE
- [ ] Flow email verification fonctionne end-to-end ✅ OBLIGATOIRE
- [ ] CI/CD tests automatisés passent ✅ OBLIGATOIRE
- [ ] Déploiement staging validé ✅ OBLIGATOIRE

---

## 🚨 RISQUES IDENTIFIÉS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| SMTP Gmail bloqué/limité | Moyenne | Élevé | Créer mode dev skip email + mock EmailService tests |
| Coverage 80% difficile à atteindre | Moyenne | Élevé | Prioriser tests critiques, accepter 75% si nécessaire |
| Playwright instable en CI | Moyenne | Moyen | Tests E2E en local OK suffisant, CI optionnel |
| Temps insuffisant pour P2 (2FA) | Élevée | Faible | Accepter scope réduit, 2FA reporté MODULE_03 |

---

## 📊 MÉTRIQUES CIBLES

| Métrique | Baseline MODULE_01 | Cible MODULE_02 | Mesure |
|----------|-------------------|-----------------|--------|
| Endpoints backend | 6/15 (40%) | 10/15 (67%) min, 15/15 (100%) max | Swagger UI |
| Pages frontend | 3/5 (60%) | 5/5 (100%) | Manuel |
| Coverage Backend | 0% | >80% | pytest --cov |
| Coverage Frontend | 0% | >75% | jest --coverage |
| Tests E2E | 0 | 5 scénarios | Playwright |
| Build Time Backend | ~95s | <120s | CI logs |
| Build Time Frontend | ~145s | <180s | CI logs |

---

## ✅ VALIDATION

### Critères Go/No-Go MODULE_02

**Critères Critiques (Blocants):**
- [ ] 4/4 endpoints P1 implémentés et testés
- [ ] EmailService fonctionnel (test envoi réel)
- [ ] Tests backend coverage >80%
- [ ] 2/2 pages frontend fonctionnelles
- [ ] 5 tests E2E Playwright passent
- [ ] CI/CD tests automatisés passent
- [ ] 0 bugs critiques

**Critères Importants (Non-blocants):**
- [ ] 5/5 endpoints P2 implémentés (2FA + sessions)
- [ ] Tests frontend coverage >75%
- [ ] Documentation Swagger complète
- [ ] Performance <500ms P95

**Décision GO/NO-GO:**
- ✅ GO si 7/7 critères critiques validés
- ⚠️ GO CONDITIONNEL si 6/7 critères critiques (acceptable si EmailService problème externe)
- ❌ NO-GO si <6/7 critères critiques

### Signatures

- **Planifié par :** Claude Code (TaxasGE Orchestrator) | **Date :** 2025-11-01
- **Approuvé par :** [En attente validation utilisateur] | **Date :** ___________

---

## 🔗 RÉFÉRENCES

### Rapports Liés
- [RAPPORT_FINAL_MODULE_01.md](./MODULE_01_AUTH/RAPPORT_FINAL_MODULE_01.md) - Dette technique source
- [RAPPORT_ORCHESTRATION_01_11_2025_MODULE_01.md](../../RAPPORT_ORCHESTRATION_01_11_2025_MODULE_01.md) - Orchestration M01

### Documentation Technique
- [Use Case UC-01 AUTH](../../Backend/use_cases/01_AUTH.md) - Spécifications auth complètes
- [DECISION_MODULE01_001](../../01_DECISIONS/DECISION_MODULE01_001.md) - Bypass RLS pour auth
- [DECISION_MODULE01_002](../../01_DECISIONS/DECISION_MODULE01_002.md) - URL API construction

### Dépendances
- **MODULE_01 :** ✅ 100% validé GO CONDITIONNEL
- **Environnement dev :** ✅ Fonctionnel (Phase 0)
- **CI/CD :** ✅ Opérationnel (Phase 0)
- **SMTP Gmail :** ✅ Configuré Secret Manager (Phase 0)

---

**FIN RAPPORT PLANIFICATION MODULE_02**

**Prochaine étape :** Attendre validation utilisateur pour démarrage implémentation

**Généré par :** Claude Code (TaxasGE Orchestrator Skill)
**Conforme :** Orchestrator Skill Phase 1 (Planification Module)
**Date génération :** 2025-11-01 16:00 UTC
