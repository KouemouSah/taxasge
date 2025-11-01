# BASELINE BACKEND - 2025-10-23

**Date**: 2025-10-23 (Jour 2 - Phase 0)
**Version**: 1.0
**Agent**: Dev

---

## 📊 MÉTRIQUES CODE

### Fichiers Source

| Type | Quantité | Localisation |
|------|----------|--------------|
| Fichiers Python | 55 | `packages/backend/app/` |
| Fichiers Tests | 8 | `packages/backend/tests/` |
| Lignes de code | Non mesuré (cloc non installé) | - |

### Structure Existante

```
packages/backend/app/
├── api/
│   ├── router.py
│   └── v1/
│       ├── auth.py (141 lignes)
│       ├── declarations.py (416 lignes)
│       ├── taxes.py
│       ├── users.py
│       ├── payments.py
│       ├── fiscal_services.py
│       ├── fiscal_services_new.py
│       ├── documents.py
│       ├── ai.py
│       └── ai_services.py
├── core/
│   ├── dependencies.py
│   ├── exceptions.py
│   ├── middleware.py
│   └── security.py
├── database/
│   ├── connection.py
│   ├── supabase_client.py
│   └── repositories/
│       ├── user_repository.py
│       ├── declaration_repository.py
│       ├── tax_repository.py
│       └── payment_repository.py
├── models/
│   ├── user.py
│   ├── declaration.py
│   ├── tax.py
│   ├── payment.py
│   └── response.py
├── services/
│   ├── auth_service.py
│   ├── tax_service.py
│   ├── payment_service.py
│   ├── notification_service.py
│   ├── bange_service.py
│   ├── ocr_service.py
│   ├── extraction_service.py
│   ├── translation_service.py
│   ├── ai_service.py
│   └── firebase_storage_service.py
├── repositories/ (duplicate structure)
│   ├── base.py
│   ├── user_repository.py
│   ├── declaration_repository.py
│   ├── tax_repository.py
│   └── fiscal_service_repository.py
└── utils/
    ├── logger.py
    ├── helpers.py
    └── validators.py
```

**⚠️ Problème identifié**: Duplication `app/repositories/` et `app/database/repositories/`

### Modules API Implémentés

| Module | Fichier | Endpoints Estimés | Status |
|--------|---------|-------------------|--------|
| Auth | `api/v1/auth.py` | 2+ (login, profile) | ✅ Implémenté |
| Declarations | `api/v1/declarations.py` | 8+ (CRUD + workflow) | ✅ Implémenté |
| Taxes | `api/v1/taxes.py` | ? | ⚠️ À auditer |
| Users | `api/v1/users.py` | ? | ⚠️ À auditer |
| Payments | `api/v1/payments.py` | ? | ⚠️ À auditer |
| Fiscal Services | `api/v1/fiscal_services.py` | ? | ⚠️ À auditer |
| Documents | `api/v1/documents.py` | ? | ⚠️ À auditer |
| AI Services | `api/v1/ai_services.py` | ? | ⚠️ À auditer |

---

## 🧪 TESTS & QUALITÉ

### Coverage

**Status**: ❌ **NON EXÉCUTABLE**

```bash
# Tentative exécution tests
pytest --cov=app --cov-report=term-missing
# Résultat: pytest: command not found
```

**Raison**: Dépendances non installées dans environnement actuel.

**Fichiers tests existants**: 8 fichiers dans `packages/backend/tests/`

### Lint (flake8)

**Status**: ❌ **NON EXÉCUTABLE**

```bash
# Tentative lint
flake8 app/ --count --statistics --max-line-length=120
# Résultat: flake8: command not found
```

**Raison**: flake8 non installé.

### Type Check (mypy)

**Status**: ❌ **NON EXÉCUTABLE**

```bash
# Tentative type check
mypy app/ --no-error-summary
# Résultat: mypy non installé, 0 erreurs rapportées (faux positif)
```

**Raison**: mypy non installé.

### Dépendances (requirements.txt)

**Status**: ✅ **FICHIER PRÉSENT**

Dépendances déclarées (version production 2.0):

**Core Framework:**
- `fastapi>=0.104.1`
- `uvicorn[standard]>=0.24.0`
- `pydantic[email]>=2.5.0`

**Database:**
- `asyncpg>=0.29.0`
- `databases[postgresql]>=0.8.0`
- `sqlalchemy>=2.0.23`
- `alembic>=1.13.0`

**Security:**
- `python-jose[cryptography]>=3.3.0`
- `passlib[bcrypt]>=1.7.4`

**Tests & Quality:**
- `pytest>=7.4.3`
- `pytest-asyncio>=0.21.1`
- `pytest-cov>=4.1.0`
- `black>=23.11.0`
- `isort>=5.12.0`
- `flake8>=6.1.0`
- `mypy>=1.7.1`

**ML/AI:**
- `tensorflow>=2.15.0,<2.16.0`
- `scikit-learn>=1.3.0`

**Intégrations:**
- `firebase-admin>=6.2.0`
- `twilio>=8.10.0`
- `sendgrid>=6.11.0`

**⚠️ Problème**: Dependencies listées mais non installées dans environnement actuel.

---

## 🚨 PROBLÈMES IDENTIFIÉS

### Critiques (P0) - Blockers

#### 1. **JWT Secret Hardcodé (SÉCURITÉ)**

**Fichier**: `packages/backend/app/api/v1/auth.py:23`

```python
# Configuration
JWT_SECRET_KEY = "taxasge-jwt-secret-change-in-production"  # ❌ HARDCODED
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
```

**Impact**: Vulnérabilité sécurité critique en production.

**Correction requise**: Utiliser variable d'environnement.

```python
import os
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-only")
```

#### 2. **SMTP Password Check dans Auth (SÉCURITÉ)**

**Fichier**: `packages/backend/app/api/v1/auth.py:76-81`

```python
def verify_password(password: str, hashed: str) -> bool:
    # For development: Use configured SMTP password directly
    smtp_password = os.getenv("SMTP_PASSWORD_GMAIL", os.getenv("SMTP_PASSWORD", ""))
    if smtp_password and password == smtp_password:  # ❌ BACKDOOR
        return True
    # Fallback to hash comparison
    return hash_password(password) == hashed
```

**Impact**: Backdoor permettant login avec SMTP password - vulnérabilité critique.

**Correction requise**: Supprimer cette logique.

#### 3. **Dependencies Non Installées**

**Impact**: Tests, lint, type check non exécutables.

**Correction requise**: Installation environnement virtuel Python + pip install requirements.txt

### Majeurs (P1) - À Corriger Rapidement

#### 4. **Duplication Repositories**

Deux structures de repositories identiques:
- `app/database/repositories/` (4 fichiers)
- `app/repositories/` (5 fichiers)

**Impact**: Confusion, maintenance difficile.

**Correction requise**: Consolider vers `app/database/repositories/` uniquement.

#### 5. **Fiscal Services Duplicated**

Deux fichiers fiscal services:
- `app/api/v1/fiscal_services.py`
- `app/api/v1/fiscal_services_new.py`

**Impact**: Code dupliqué, maintenance difficile.

**Correction requise**: Consolider vers une seule version.

### Mineurs (P2) - Améliorations

#### 6. **Mock Users Database**

**Fichier**: `packages/backend/app/api/v1/auth.py:56-69`

Mock users hardcodé dans code au lieu de DB.

**Impact**: Non production-ready.

**Correction requise**: Connecter à PostgreSQL users table.

#### 7. **Hash Password Faible**

**Fichier**: `packages/backend/app/api/v1/auth.py:72-73`

```python
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()  # ❌ SHA256 seul = faible
```

**Impact**: Hashing faible (pas de salt, pas de bcrypt).

**Correction requise**: Utiliser `passlib[bcrypt]` (déjà dans requirements.txt).

---

## 📈 MÉTRIQUES BASELINE

| Métrique | Valeur | Cible Phase 0 | Cible MVP |
|----------|--------|---------------|-----------|
| **Fichiers Python** | 55 | - | 150+ |
| **Fichiers Tests** | 8 | 20+ | 80+ |
| **Coverage Backend** | ❌ Non mesuré | >70% | >80% |
| **Lint Errors** | ❌ Non mesuré | 0 | 0 |
| **Type Errors** | ❌ Non mesuré | <5 | 0 |
| **Security Issues (P0)** | 3 | 0 | 0 |
| **Code Duplication** | 2 problèmes | 0 | 0 |
| **API Modules** | 9 modules | 9 validés | 13 modules |

---

## ✅ POINTS POSITIFS

1. ✅ **Structure Architecture Solide**: Séparation claire API/Models/Services/Repositories
2. ✅ **FastAPI Modern**: Utilisation Pydantic v2, type hints, async/await
3. ✅ **Requirements Complets**: Toutes dépendances production listées
4. ✅ **Modules Backend Avancés**: Declarations workflow complet (416 lignes)
5. ✅ **Logging**: Utilisation loguru pour logs structurés
6. ✅ **Database Ready**: Repositories pattern + asyncpg pour PostgreSQL

---

## 📋 ACTIONS REQUISES (Phase 0)

### Priorité CRITIQUE (Jour 2-3)

- [ ] **SEC-001**: Remplacer JWT_SECRET_KEY hardcodé par variable d'environnement
- [ ] **SEC-002**: Supprimer SMTP password backdoor dans `verify_password()`
- [ ] **SEC-003**: Remplacer SHA256 par bcrypt pour password hashing
- [ ] **DEV-001**: Installer dependencies backend (`pip install -r requirements.txt`)
- [ ] **DEV-002**: Configurer environnement virtuel Python 3.11

### Priorité HAUTE (Jour 3-4)

- [ ] **ARCH-001**: Consolider repositories (`app/database/repositories/` uniquement)
- [ ] **ARCH-002**: Fusionner `fiscal_services.py` et `fiscal_services_new.py`
- [ ] **TEST-001**: Exécuter tests existants + mesurer coverage réel
- [ ] **LINT-001**: Exécuter flake8 + corriger erreurs

### Priorité MOYENNE (Jour 4-5)

- [ ] **DATA-001**: Connecter auth à PostgreSQL users table (retirer mock users)
- [ ] **DOC-001**: Documenter endpoints API (OpenAPI auto-generated par FastAPI)
- [ ] **TEST-002**: Atteindre >70% coverage backend

---

## 🎯 CRITÈRES GO/NO-GO PHASE 0

**Pour valider Phase 0 et démarrer Module 1:**

✅ **OBLIGATOIRES** (NO-GO si non remplis):
- [ ] Tous problèmes P0 (SEC-001, SEC-002, SEC-003) corrigés
- [ ] Dependencies backend installées et tests exécutables
- [ ] Backend local démarrable (`uvicorn app.main:app --reload`)
- [ ] 0 erreurs sécurité critiques

⚠️ **IMPORTANTS** (GO CONDITIONNEL):
- [ ] Problèmes P1 corrigés (duplication repositories)
- [ ] Coverage backend >50%
- [ ] Lint errors <10

📊 **MÉTRIQUES**:
- [ ] PostgreSQL Supabase connecté et accessible
- [ ] Au moins 1 endpoint testé en local (ex: `/api/v1/auth/login`)

---

**Baseline créée par**: Dev Agent
**Prochaine baseline**: BASELINE_FRONTEND.md
**Prochaine révision**: 2025-10-30 (fin Module 1)
