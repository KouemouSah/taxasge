# 🔐 GitHub Secrets Configuration Guide

**Date**: 2025-10-24
**Task**: TASK-P0-004 (CI/CD Pipeline)
**Repository**: KouemouSah/taxasge

---

## 📋 Required Secrets

Les secrets suivants doivent être configurés dans GitHub Actions pour que les workflows CI/CD fonctionnent correctement.

### Configuration via GitHub UI

1. Naviguez vers: https://github.com/KouemouSah/taxasge/settings/secrets/actions
2. Cliquez sur "New repository secret" pour chaque secret ci-dessous

### Configuration via GitHub CLI

```bash
# Installer GitHub CLI (si pas déjà fait)
winget install --id GitHub.cli

# Authentifier
gh auth login

# Configurer les secrets (exécuter chaque commande)
gh secret set DATABASE_URL --body "postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres" --repo KouemouSah/taxasge

gh secret set JWT_SECRET_KEY --body "JedTa/b3mCl7qekEajs+uuufhqpwj/VDZ/QiZodBauU=" --repo KouemouSah/taxasge

gh secret set SUPABASE_URL --body "https://bpdzfkymgydjxxwlctam.supabase.co" --repo KouemouSah/taxasge

gh secret set SUPABASE_ANON_KEY --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg" --repo KouemouSah/taxasge

gh secret set NEXT_PUBLIC_SUPABASE_URL --body "https://bpdzfkymgydjxxwlctam.supabase.co" --repo KouemouSah/taxasge

gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg" --repo KouemouSah/taxasge
```

---

## 🗂️ Liste Détaillée des Secrets

### 1. DATABASE_URL
**Description**: URL de connexion PostgreSQL Supabase
**Utilisé par**: Backend tests, API backend
**Valeur**:
```
postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres
```

### 2. JWT_SECRET_KEY
**Description**: Clé secrète pour signer les tokens JWT
**Utilisé par**: Backend authentication, API security
**Valeur**:
```
JedTa/b3mCl7qekEajs+uuufhqpwj/VDZ/QiZodBauU=
```

### 3. SUPABASE_URL
**Description**: URL du projet Supabase
**Utilisé par**: Backend Supabase client
**Valeur**:
```
https://bpdzfkymgydjxxwlctam.supabase.co
```

### 4. SUPABASE_ANON_KEY
**Description**: Clé anonyme Supabase pour accès API
**Utilisé par**: Backend Supabase client
**Valeur**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg
```

### 5. NEXT_PUBLIC_SUPABASE_URL
**Description**: URL Supabase pour le frontend (publique)
**Utilisé par**: Frontend build, client-side Supabase
**Valeur**:
```
https://bpdzfkymgydjxxwlctam.supabase.co
```

### 6. NEXT_PUBLIC_SUPABASE_ANON_KEY
**Description**: Clé Supabase anonyme pour frontend (publique)
**Utilisé par**: Frontend build, client-side Supabase
**Valeur**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg
```

---

## 🔍 Vérification

Après configuration, vérifiez que les secrets sont bien configurés:

```bash
# Via GitHub CLI
gh secret list --repo KouemouSah/taxasge

# Devrait afficher:
# DATABASE_URL                   Updated 2025-10-24
# JWT_SECRET_KEY                 Updated 2025-10-24
# NEXT_PUBLIC_SUPABASE_ANON_KEY Updated 2025-10-24
# NEXT_PUBLIC_SUPABASE_URL      Updated 2025-10-24
# SUPABASE_ANON_KEY             Updated 2025-10-24
# SUPABASE_URL                  Updated 2025-10-24
```

---

## 📝 Notes de Sécurité

- ⚠️ **IMPORTANT**: Ce fichier contient des valeurs sensibles et NE DOIT PAS être commité dans git public
- ✅ Les secrets GitHub Actions sont chiffrés et sécurisés
- ✅ Seules les valeurs `NEXT_PUBLIC_*` sont exposées côté client (par design Next.js)
- 🔒 Les secrets backend (DATABASE_URL, JWT_SECRET_KEY) restent privés

---

## 🚀 Workflows Affectés

Les workflows suivants utilisent ces secrets:

1. **`.github/workflows/ci.yml`**
   - Backend tests (DATABASE_URL, JWT_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY)
   - Frontend tests (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

2. **`.github/workflows/deploy-staging.yml`** (à créer)
   - Tous les secrets ci-dessus pour déploiement staging

---

## 📊 Status

- [x] Secrets identifiés
- [x] Valeurs récupérées depuis .env.local
- [x] Documentation créée
- [ ] Configuration dans GitHub (requiert accès web ou gh CLI authentifié)

**Action Requise**: Configurer manuellement via https://github.com/KouemouSah/taxasge/settings/secrets/actions ou via `gh CLI` comme indiqué ci-dessus.
