# PHASE 5 - PLAN D'EXÉCUTION DÉTAILLÉ
**Date**: 2025-11-19 21:00
**Auteur**: Claude Code Expert
**Approche**: Méthodique, rigoureuse, aucune erreur tolérée

---

## 🎯 OBJECTIFS GLOBAUX

1. **TÂCHE 1**: Audit complet authentification - Identifier et archiver redondances
2. **TÂCHE 2**: Refactoriser auth module + Tests curl (libressai@gmail.com, user@odoolab.site avec 2FA)
3. **TÂCHE 3**: Corriger dashboard admin (permissions, rôles, utilisateurs + page création)
4. **TÂCHE 4**: Extraire schéma DB + Créer dashboards par rôle (DGI, Ministry, Accountant, Supervisors)

---

## 📋 TÂCHE 1 - AUDIT AUTHENTIFICATION

### 1.1 Inventaire des fichiers auth
**Objectif**: Recenser TOUS les fichiers liés à l'authentification

**Actions**:
- [ ] 1.1.1 Lister tous les fichiers contenant "auth" dans packages/backend/
- [ ] 1.1.2 Lister tous les fichiers important get_current_user
- [ ] 1.1.3 Identifier les duplications/redondances
- [ ] 1.1.4 Créer matrice de dépendances

**Fichiers attendus**:
- `app/api/v1/auth.py` (44 KB) - API principale
- `app/core/auth.py` (nouveau) - get_current_user
- `app/services/auth_service.py` (34 KB)
- `app/services/jwt_service.py` (10 KB)
- `app/services/session_service.py` (11 KB)
- `app/services/password_service.py` (8 KB)
- `app/middleware/*` (si auth middleware)

**Critères de validation**:
✅ Liste complète avec tailles fichiers
✅ Diagramme de dépendances clair
✅ Identification redondances précise

### 1.2 Analyse fonctionnelle
**Objectif**: Comprendre le flux auth actuel

**Actions**:
- [ ] 1.2.1 Documenter flow registration (2-step avec email verification)
- [ ] 1.2.2 Documenter flow login (avec/sans 2FA)
- [ ] 1.2.3 Documenter flow refresh token
- [ ] 1.2.4 Documenter flow logout
- [ ] 1.2.5 Identifier endpoints utilisés vs non-utilisés

**Livrables**:
- Diagramme de séquence pour chaque flow
- Liste endpoints actifs/inactifs
- Rapport utilisations réelles

### 1.3 Archivage redondances
**Objectif**: Nettoyer le code sans casser l'existant

**Actions**:
- [ ] 1.3.1 Créer dossier `archive/auth_old/`
- [ ] 1.3.2 Déplacer fichiers dupliqués
- [ ] 1.3.3 Mettre à jour imports
- [ ] 1.3.4 Vérifier que tests passent

**Règles**:
- ⚠️ NE PAS supprimer, ARCHIVER
- ⚠️ Garder historique git
- ⚠️ Documenter raisons archivage

---

## 📋 TÂCHE 2 - REFACTORISATION AUTH + TESTS

### 2.1 Refactoriser module auth
**Objectif**: Structure modulaire propre

**Structure cible**:
```
app/modules/auth/
├── __init__.py
├── api/
│   ├── __init__.py
│   ├── auth_routes.py (login, register, logout, refresh)
│   ├── two_factor_routes.py (2FA setup, verify)
│   └── session_routes.py (list sessions, revoke)
├── models/
│   ├── __init__.py
│   ├── auth_models.py
│   └── session_models.py
├── services/
│   ├── __init__.py
│   ├── auth_service.py
│   ├── jwt_service.py
│   ├── session_service.py
│   ├── password_service.py
│   └── two_factor_service.py
└── middleware/
    ├── __init__.py
    └── auth_middleware.py (get_current_user, require_auth, etc.)
```

**Actions**:
- [ ] 2.1.1 Créer structure dossiers
- [ ] 2.1.2 Migrer fichiers existants
- [ ] 2.1.3 Mettre à jour imports dans tout le projet
- [ ] 2.1.4 Mettre à jour main.py router registration
- [ ] 2.1.5 Vérifier aucun import cassé

**Validation**:
```bash
# Backend doit démarrer sans erreur
cd packages/backend && python -m uvicorn app.main:app --reload
```

### 2.2 Tests curl - Utilisateur Standard (libressai@gmail.com)
**Objectif**: Valider auth sans 2FA

**Prérequis**:
- Backend déployé et accessible
- Utilisateur existe: libressai@gmail.com / Taxasge@25

**Tests à exécuter**:
```bash
# Test 1: Login
curl -X POST https://taxasge-backend-XXX.run.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"libressai@gmail.com","password":"Taxasge@25"}'

# Résultat attendu:
# {
#   "access_token": "eyJ...",
#   "refresh_token": "eyJ...",
#   "token_type": "Bearer",
#   "expires_in": 3600,
#   "user": { "id": "...", "email": "libressai@gmail.com", ... }
# }

# Test 2: Accès ressource protégée
curl -X GET https://taxasge-backend-XXX.run.app/api/v1/users/profile \
  -H "Authorization: Bearer <access_token>"

# Test 3: Refresh token
curl -X POST https://taxasge-backend-XXX.run.app/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh_token>"}'

# Test 4: Logout
curl -X POST https://taxasge-backend-XXX.run.app/api/v1/auth/logout \
  -H "Authorization: Bearer <access_token>"
```

**Critères succès**:
- [ ] 2.2.1 Login retourne token valide
- [ ] 2.2.2 Token permet accès ressources protégées
- [ ] 2.2.3 Refresh génère nouveau token
- [ ] 2.2.4 Logout révoque token

### 2.3 Tests curl - Utilisateur 2FA (user@odoolab.site)
**Objectif**: Valider auth avec 2FA

**Prérequis**:
- Utilisateur existe: user@odoolab.site / Taxasge@26
- 2FA activé sur ce compte

**Tests à exécuter**:
```bash
# Test 1: Login (doit retourner temp_token)
curl -X POST https://taxasge-backend-XXX.run.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@odoolab.site","password":"Taxasge@26"}'

# Résultat attendu:
# {
#   "requires_2fa": true,
#   "temp_token": "temp_XXX",
#   "message": "2FA verification required"
# }

# Test 2: Vérifier 2FA (utiliser app authenticator)
curl -X POST https://taxasge-backend-XXX.run.app/api/v1/auth/login/2fa-verify \
  -H "Content-Type: application/json" \
  -d '{"temp_token":"temp_XXX","totp_code":"123456"}'

# Résultat attendu:
# {
#   "access_token": "eyJ...",
#   "refresh_token": "eyJ...",
#   ...
# }

# Test 3: Accès ressource protégée
curl -X GET https://taxasge-backend-XXX.run.app/api/v1/users/profile \
  -H "Authorization: Bearer <access_token>"
```

**Critères succès**:
- [ ] 2.3.1 Login sans 2FA retourne temp_token
- [ ] 2.3.2 Vérification 2FA avec code valide retourne access_token
- [ ] 2.3.3 Code invalide retourne erreur 401
- [ ] 2.3.4 temp_token expire après 5 minutes

### 2.4 Lien Backend-Frontend
**Objectif**: S'assurer que frontend utilise auth correctement

**Actions**:
- [ ] 2.4.1 Vérifier services/auth.ts dans frontend
- [ ] 2.4.2 Confirmer format tokens compatible
- [ ] 2.4.3 Vérifier gestion refresh automatique
- [ ] 2.4.4 Tester login/logout depuis UI

---

## 📋 TÂCHE 3 - CORRIGER DASHBOARD ADMIN

### 3.1 Diagnostic erreurs actuelles
**Objectif**: Identifier causes exactes

**Erreurs à investiguer**:
1. **Permissions**: "Erreur lors du chargement des permissions"
2. **Rôles**: "Erreur lors du chargement des rôles"
3. **Utilisateurs**: "Not authenticated"

**Actions**:
- [ ] 3.1.1 Tester GET /api/v1/permissions avec token valide
- [ ] 3.1.2 Tester GET /api/v1/roles avec token valide
- [ ] 3.1.3 Tester GET /api/v1/users avec token valide
- [ ] 3.1.4 Analyser logs backend pour erreurs
- [ ] 3.1.5 Analyser console frontend pour erreurs

**Tests curl**:
```bash
# Obtenir token admin
TOKEN=$(curl -X POST .../auth/login -d '...' | jq -r .access_token)

# Test permissions
curl -X GET .../api/v1/permissions \
  -H "Authorization: Bearer $TOKEN"

# Test rôles
curl -X GET .../api/v1/roles \
  -H "Authorization: Bearer $TOKEN"

# Test utilisateurs
curl -X GET .../api/v1/users \
  -H "Authorization: Bearer $TOKEN"
```

### 3.2 Corrections backend
**Objectif**: Résoudre problèmes API

**Actions possibles** (selon diagnostic):
- [ ] 3.2.1 Corriger imports manquants
- [ ] 3.2.2 Ajouter permissions manquantes au rôle admin
- [ ] 3.2.3 Corriger middleware auth
- [ ] 3.2.4 Ajuster format réponses (pagination)
- [ ] 3.2.5 Corriger CORS si nécessaire

### 3.3 Corrections frontend
**Objectif**: Résoudre problèmes UI

**Fichiers à vérifier**:
- `packages/web/src/app/admin/(dashboard)/permissions/page.tsx`
- `packages/web/src/app/admin/(dashboard)/roles/page.tsx`
- `packages/web/src/app/admin/(dashboard)/users/page.tsx`
- `packages/web/src/services/api/permissions.ts`
- `packages/web/src/services/api/roles.ts`
- `packages/web/src/services/api/users.ts`

**Actions**:
- [ ] 3.3.1 Vérifier gestion token dans API calls
- [ ] 3.3.2 Vérifier parsing réponses backend
- [ ] 3.3.3 Améliorer gestion erreurs
- [ ] 3.3.4 Ajouter retry logic si timeout

### 3.4 Page création utilisateur
**Objectif**: Interface complète pour créer users

**Champs requis** (selon schema_taxage.sql):
- **Basique**: email, password, first_name, last_name
- **Contact**: phone_number, address, city
- **Profil**: role, status, preferred_language
- **Citizen (si role=citizen)**: national_id, birth_date, gender, marital_status, occupation
- **Business (si role=business)**: business_name, business_type, tax_id, registration_number

**Actions**:
- [ ] 3.4.1 Créer CreateUserDialog.tsx
- [ ] 3.4.2 Form avec validation Zod
- [ ] 3.4.3 Champs conditionnels selon rôle
- [ ] 3.4.4 Appel API POST /users
- [ ] 3.4.5 Gestion succès/erreur
- [ ] 3.4.6 Intégrer dans users/page.tsx

---

## 📋 TÂCHE 4 - SCHÉMA DB + DASHBOARDS RÔLES

### 4.1 Extraction schéma database
**Objectif**: Documentation à jour

**Script existant**:
```bash
# Localiser script extraction
find . -name "*extract*schema*" -o -name "*dump*schema*"
```

**Actions**:
- [ ] 4.1.1 Localiser script d'extraction
- [ ] 4.1.2 Exécuter extraction
- [ ] 4.1.3 Mettre à jour DATABASE_SCHEMA_REFERENCE.md
- [ ] 4.1.4 Commit changements

### 4.2 Analyse champs par rôle
**Objectif**: Identifier champs spécifiques

**Rôles à analyser**:
1. **admin** - Quels champs/tables accessibles?
2. **dgi_agent** - Champs spécifiques? (matricule, department, etc.)
3. **ministry_agent** - Différences avec dgi_agent?
4. **accountant** - Accès comptabilité uniquement?
5. **supervisor_junior_dgi** - Niveau accès?
6. **supervisor_readonly** - Read-only sur quoi?
7. **supervisor_senior** - Plus de privilèges?
8. **supervisor_dgi** - Top niveau DGI?

**Actions**:
- [ ] 4.2.1 Analyser table users pour champs rôles
- [ ] 4.2.2 Analyser tables liées (agents, supervisors, etc.)
- [ ] 4.2.3 Documenter permissions par rôle
- [ ] 4.2.4 Créer matrice rôles × permissions

### 4.3 Dashboards par rôle
**Objectif**: UI adaptée à chaque profil

**Pour chaque rôle, créer**:
1. Dashboard layout
2. Menu sidebar adapté
3. Widgets/stats pertinents
4. Actions autorisées

**Actions**:
- [ ] 4.3.1 Dashboard DGI Agent
- [ ] 4.3.2 Dashboard Ministry Agent
- [ ] 4.3.3 Dashboard Accountant
- [ ] 4.3.4 Dashboard Supervisors (junior, readonly, senior, dgi)
- [ ] 4.3.5 Routing conditionnel selon rôle

**Structure frontend**:
```
packages/web/src/app/admin/(dashboard)/
├── dgi-agent/
│   ├── page.tsx
│   └── layout.tsx
├── ministry-agent/
│   ├── page.tsx
│   └── layout.tsx
├── accountant/
│   ├── page.tsx
│   └── layout.tsx
└── supervisor/
    ├── page.tsx
    └── layout.tsx
```

---

## 📊 LIVRABLES & RAPPORTS

### Rapports à générer

**1. RAPPORT_PHASE_05_REFACTORING.md**
Sections à ajouter:
- ✅ TÂCHE 1 - Audit Authentification
- ✅ TÂCHE 2 - Refactorisation Auth + Tests
- ✅ TÂCHE 3 - Corrections Dashboard Admin
- ✅ TÂCHE 4 - Schéma DB + Dashboards Rôles
- 📊 Métriques (temps, lignes code, bugs fixés)
- 🧪 Résultats tests
- 📸 Screenshots before/after

**2. PHASE_5_BACKEND_REFACTORING.md**
Checklist à mettre à jour:
- [x] PHASE 1 - Users API
- [ ] TÂCHE 1 - Audit Auth
- [ ] TÂCHE 2 - Refacto Auth
- [ ] TÂCHE 3 - Dashboard Admin
- [ ] TÂCHE 4 - Dashboards Rôles

---

## ⚠️ RÈGLES CRITIQUES

1. **Aucune invention**: Seulement analyser/utiliser l'existant
2. **Vérification systématique**: Tester après chaque changement
3. **Cohérence**: Aligner backend/frontend
4. **Archivage**: Ne jamais supprimer, archiver
5. **Documentation**: Expliquer chaque décision
6. **Tests**: curl pour backend, manuel pour frontend
7. **Commits atomiques**: 1 commit = 1 fonctionnalité
8. **Revue critique**: Challenger chaque choix

---

## 🚀 ORDRE D'EXÉCUTION

1. ✅ Créer ce plan (FAIT)
2. ⏭️ TÂCHE 1.1 - Inventaire auth
3. ⏭️ TÂCHE 1.2 - Analyse fonctionnelle
4. ⏭️ TÂCHE 1.3 - Archivage
5. ⏭️ TÂCHE 2.1 - Refactorisation
6. ⏭️ TÂCHE 2.2 - Tests curl standard
7. ⏭️ TÂCHE 2.3 - Tests curl 2FA
8. ⏭️ TÂCHE 2.4 - Lien frontend
9. ⏭️ TÂCHE 3.1 - Diagnostic dashboard
10. ⏭️ TÂCHE 3.2 - Corrections backend
11. ⏭️ TÂCHE 3.3 - Corrections frontend
12. ⏭️ TÂCHE 3.4 - Page création user
13. ⏭️ TÂCHE 4.1 - Extraction schéma
14. ⏭️ TÂCHE 4.2 - Analyse rôles
15. ⏭️ TÂCHE 4.3 - Dashboards rôles
16. ⏭️ Génération rapports finaux
17. ⏭️ Revue et validation

**Temps estimé total**: 8-10 heures de travail rigoureux
