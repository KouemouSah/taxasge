# BASELINE INFRASTRUCTURE - 2025-10-23

**Date**: 2025-10-23 (Jour 2 - Phase 0)
**Version**: 1.0
**Agent**: DevOps

---

## ☁️ GOOGLE CLOUD PLATFORM (GCP)

### CLI Installés

| CLI | Version | Status | Localisation |
|-----|---------|--------|--------------|
| **gcloud** | - | ❌ Non installé | - |
| **firebase** | 14.11.1 | ✅ Installé | Global |

### Projets Firebase

**Total**: 3 projets

| Nom Projet | Project ID | Project Number | Location | Status |
|------------|------------|----------------|----------|--------|
| **PATRIMONIOS** | patrimonios-41a98 | 981471352870 | [Not specified] | ⚠️ Non utilisé |
| **taxasge-dev** | taxasge-dev | 392159428433 | [Not specified] | 🔵 Dev |
| **taxasge-prod** | taxasge-pro | 430718042574 | [Not specified] | 🟢 Production |

**Projet Actif**: ❌ **AUCUN**

```bash
firebase use
# Error: No active project
```

**Action requise**: Sélectionner projet actif.

```bash
firebase use taxasge-dev  # Pour développement
```

---

## 🔥 FIREBASE SERVICES

### Configuration (firebase.json)

**Fichier**: `firebase.json` (113 lignes)

**Services configurés**:

#### 1. Hosting

```json
{
  "hosting": {
    "public": "public",
    "rewrites": [
      { "source": "/api/**", "function": "main" },
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [
      {
        "source": "/api/**",
        "headers": [
          { "key": "Access-Control-Allow-Origin", "value": "*" },
          { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|css|js)",
        "headers": [
          { "key": "Cache-Control", "value": "max-age=31536000" }
        ]
      }
    ],
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "packages/**",
      "scripts/**",
      "config/**",
      "docs/**",
      "data/**"
    ],
    "cleanUrls": true,
    "trailingSlash": false
  }
}
```

**Status**: ✅ Configuré (Next.js static + API rewrites)

**URLs estimées**:
- **Dev**: https://taxasge-dev.web.app
- **Prod**: https://taxasge.emacsah.com (domaine custom probable)

#### 2. Cloud Functions

```json
{
  "functions": [
    {
      "source": "packages/backend",
      "codebase": "default",
      "runtime": "python311",
      "predeploy": [
        "cd packages/backend && pip install -r requirements.txt"
      ],
      "ignore": [
        "venv",
        "__pycache__",
        ".pytest_cache",
        "*.pyc",
        "tests/",
        "app/",
        "main_temp.py"
      ]
    }
  ]
}
```

**Runtime**: Python 3.11 ✅ (version validée)

**Source**: `packages/backend/`

**Entry point**: Probablement `main.py`

**Predeploy**: Installation requirements.txt

**⚠️ Problème**: `"ignore": ["app/"]` → Code source `app/` ignoré lors déploiement !

**Impact**: Déploiement échouerait (pas de code backend déployé).

**Correction requise**: Retirer `"app/"` de la liste ignore.

#### 3. Storage

```json
{
  "storage": {
    "rules": "storage.rules"
  }
}
```

**Status**: ✅ Configuré

**Fichier rules**: `storage.rules` (probablement existant)

**Usage**: Upload documents (déclarations fiscales, justificatifs)

#### 4. Emulators

```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "functions": { "port": 5001 },
    "firestore": { "port": 8080 },
    "hosting": { "port": 5000 },
    "storage": { "port": 9199 },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

**Status**: ✅ Configuré (excellente configuration dev)

**Ports utilisés**:
- **Auth**: http://localhost:9099
- **Functions**: http://localhost:5001
- **Firestore**: http://localhost:8080
- **Hosting**: http://localhost:5000
- **Storage**: http://localhost:9199
- **UI**: http://localhost:4000

**⚠️ Problème**: Firestore emulator configuré mais **Firestore supprimé** (décision PostgreSQL)

**Correction requise**: Retirer `"firestore": { "port": 8080 }` de emulators.

#### 5. Extensions

```json
{
  "extensions": {}
}
```

**Status**: Vide (aucune extension Firebase installée)

#### 6. Remote Config

```json
{
  "remoteconfig": {
    "template": "remoteconfig.template.json"
  }
}
```

**Status**: ✅ Configuré

**Fichier template**: `remoteconfig.template.json` (à créer si inexistant)

**Usage**: Configuration dynamique app (feature flags, paramètres)

---

## 🗄️ DATABASE

### PostgreSQL (Supabase)

**Décision validée**: PostgreSQL (Supabase) uniquement

**Status actuel**: ⚠️ **NON CONFIGURÉ**

**Actions requises**:

1. **Créer projet Supabase**:
   - Nom: `taxasge-dev` (dev)
   - Nom: `taxasge-prod` (production)
   - Région: Europe (eu-central-1) recommandée

2. **Récupérer credentials**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (PostgreSQL direct connection)

3. **Configurer backend**:
   - Fichier `.env` à créer
   - Connection string dans `app/database/connection.py`

### Firestore (SUPPRIMÉ)

**Status**: ✅ **ARCHIVÉ** (Phase 0 - TASK-P0-001)

**Fichiers archivés**:
- `firestore.rules` → `.github/docs-internal/delete_files/`
- `firestore.indexes.json` → `.github/docs-internal/delete_files/`

**Configuration retirée**: Section `firestore` supprimée de `firebase.json`

**Raison**: Migration vers PostgreSQL (Supabase) uniquement

---

## 🌐 ENVIRONNEMENTS

### Production

**Domaine custom**: `taxasge.gq` (à configurer dans Firebase Hosting)

**URLs estimées**:
- **Frontend**: https://taxasge.emacsah.com
- **Backend API**: https://admin.emacsah.com/api/v1
- **Cloud Functions**: https://us-central1-taxasge-pro.cloudfunctions.net/main

**Status**: ⚠️ **NON DÉPLOYÉ**

### Staging

**URLs estimées**:
- **Frontend**: https://taxasge-dev.web.app
- **Backend API**: https://taxasge-dev.web.app/api/v1

**Status**: ⚠️ **NON DÉPLOYÉ**

### Développement Local

**Backend**:
- URL: http://localhost:8000
- Framework: FastAPI (uvicorn)
- Status: ⚠️ Non démarré (dependencies non installées)

**Frontend**:
- URL: http://localhost:3000
- Framework: Next.js 14
- Status: ⚠️ Non démarré

**Emulators Firebase**:
- UI: http://localhost:4000
- Hosting: http://localhost:5000
- Functions: http://localhost:5001
- Auth: http://localhost:9099
- Storage: http://localhost:9199
- Status: ⚠️ Non démarrés

---

## 💰 BUDGET & COÛTS

### Firebase (Spark Plan - Gratuit)

**Limites actuelles** (plan gratuit):

| Service | Limite Gratuite | Dépassement |
|---------|-----------------|-------------|
| **Hosting** | 10 GB stockage, 360 MB/jour transfert | Facturé au-delà |
| **Cloud Functions** | 125K invocations/mois, 40K GB-s/mois | Facturé au-delà |
| **Storage** | 5 GB stockage, 1 GB/jour download | Facturé au-delà |
| **Authentication** | Illimité | Gratuit |

**Coût estimé actuel**: **$0/mois** (aucun déploiement actif)

### Supabase (Free Tier)

**Limites plan gratuit**:

| Service | Limite Gratuite | Dépassement |
|---------|-----------------|-------------|
| **Database** | 500 MB PostgreSQL | Upgrade requis |
| **Storage** | 1 GB | Upgrade requis |
| **Bandwidth** | 2 GB/mois | Upgrade requis |
| **API Requests** | Illimité | - |

**Coût estimé actuel**: **$0/mois** (non configuré)

**Coût estimé MVP** (budget validé): **$30-50/mois**

Décomposition probable:
- Firebase Blaze Plan (fonctions + hosting): $20-30/mois
- Supabase Pro: $25/mois
- **Total**: ~$45-55/mois

### GCP Additional Services

**Services potentiels**:
- Cloud Run (pour backend alternatif): $0 si non utilisé
- Cloud Storage: Inclus dans Firebase Storage
- Cloud Build (CI/CD): 120 builds/jour gratuits

**Coût estimé**: **$0/mois** (non utilisé)

---

## 🚨 PROBLÈMES IDENTIFIÉS

### Critiques (P0) - Blockers

#### 1. **Aucun Projet Firebase Actif**

**Impact**: Impossible déployer ou utiliser emulators.

**Correction requise**:
```bash
firebase use taxasge-dev
```

#### 2. **Cloud Functions Ignore "app/"**

**Fichier**: `firebase.json:79`

```json
"ignore": [
  "venv",
  "__pycache__",
  "tests/",
  "app/",  // ❌ PROBLÈME: Code source ignoré !
  "main_temp.py"
]
```

**Impact**: Déploiement Cloud Functions échouerait (pas de code backend).

**Correction requise**: Retirer `"app/"` de la liste.

```json
"ignore": [
  "venv",
  "__pycache__",
  ".pytest_cache",
  "*.pyc",
  "tests/",
  "main_temp.py"
]
```

#### 3. **PostgreSQL Supabase Non Configuré**

**Impact**: Backend ne peut pas se connecter à la base de données.

**Correction requise**:
1. Créer projets Supabase (dev + prod)
2. Configurer `.env` avec credentials
3. Tester connection

### Majeurs (P1) - À Corriger Rapidement

#### 4. **Firestore Emulator Configuré (Service Supprimé)**

**Fichier**: `firebase.json:94`

```json
"emulators": {
  "firestore": { "port": 8080 },  // ❌ Service supprimé
  ...
}
```

**Impact**: Confusion, emulator démarrerait service inutilisé.

**Correction requise**: Retirer ligne firestore.

#### 5. **gcloud CLI Non Installé**

**Impact**: Impossible gérer projets GCP, déployer Cloud Run, gérer IAM.

**Correction requise**: Installer gcloud SDK.

```bash
# Windows
# Télécharger: https://cloud.google.com/sdk/docs/install
```

#### 6. **Domaine Custom Non Configuré**

**Domaine**: `taxasge.gq` (package.json:22)

**Status**: ⚠️ Non configuré dans Firebase Hosting

**Correction requise**: Configurer domaine custom.

```bash
firebase hosting:channel:deploy production --project taxasge-pro
# Puis configurer DNS + SSL
```

### Mineurs (P2) - Améliorations

#### 7. **Remote Config Template Manquant**

**Fichier référencé**: `remoteconfig.template.json`

**Status**: Probablement inexistant.

**Correction requise**: Créer template si Remote Config utilisé.

#### 8. **Storage Rules Non Auditées**

**Fichier**: `storage.rules`

**Status**: Non lu durant baseline.

**Correction requise**: Auditer rules sécurité Storage.

---

## 📈 MÉTRIQUES BASELINE

| Métrique | Valeur | Cible Phase 0 | Cible MVP |
|----------|--------|---------------|-----------|
| **Projets Firebase** | 3 | 2 actifs (dev + prod) | 2 actifs |
| **Projet Actif** | 0 | 1 (dev) | 2 (dev + prod) |
| **Services Configurés** | 5 | 4 (hosting, functions, storage, auth) | 5+ |
| **Database PostgreSQL** | ❌ Non configuré | ✅ Configuré | ✅ Production |
| **Emulators Actifs** | 0 | 5 | 5 |
| **Déploiements Actifs** | 0 | 1 (staging) | 2 (staging + prod) |
| **gcloud CLI** | ❌ Non installé | ✅ Installé | ✅ Installé |
| **Domaine Custom** | ❌ Non configuré | - | ✅ Configuré |
| **Budget Mensuel** | $0 | $0 (free tier) | $30-50 |

---

## ✅ POINTS POSITIFS

1. ✅ **Firebase CLI Installé**: Version récente (14.11.1)
2. ✅ **3 Projets Créés**: Dev, Prod, Patrimonios (backup?)
3. ✅ **Configuration Complète**: Hosting, Functions, Storage, Emulators
4. ✅ **Python 3.11**: Runtime moderne pour Cloud Functions
5. ✅ **Emulators Configurés**: Excellent pour développement local
6. ✅ **CORS Configuré**: Headers API correctement définis
7. ✅ **Cache Strategy**: Static assets cachés 1 an, API no-cache
8. ✅ **Clean URLs**: URLs propres activées (sans .html)
9. ✅ **Firestore Retiré**: Migration PostgreSQL effectuée (Phase 0)

---

## 📋 ACTIONS REQUISES (Phase 0)

### Priorité CRITIQUE (Jour 2-3)

- [ ] **FIREBASE-001**: Sélectionner projet actif (`firebase use taxasge-dev`)
- [ ] **CONFIG-001**: Retirer `"app/"` de functions ignore (firebase.json)
- [ ] **CONFIG-002**: Retirer firestore de emulators (firebase.json)
- [ ] **DB-001**: Créer projet Supabase (dev)
- [ ] **DB-002**: Configurer `.env` avec Supabase credentials
- [ ] **DB-003**: Tester connection PostgreSQL backend

### Priorité HAUTE (Jour 3-4)

- [ ] **GCLOUD-001**: Installer gcloud CLI
- [ ] **GCLOUD-002**: Authentifier gcloud (`gcloud auth login`)
- [ ] **EMULATORS-001**: Démarrer Firebase emulators localement
- [ ] **DEPLOY-001**: Tester déploiement staging (`firebase deploy --only hosting --project taxasge-dev`)

### Priorité MOYENNE (Jour 4-5)

- [ ] **STORAGE-001**: Auditer `storage.rules` sécurité
- [ ] **DOMAIN-001**: Configurer domaine custom `taxasge.gq` (si disponible)
- [ ] **MONITORING-001**: Configurer Firebase Analytics (optionnel)
- [ ] **BUDGET-001**: Activer alertes budget GCP ($50 threshold)

---

## 🎯 CRITÈRES GO/NO-GO PHASE 0

**Pour valider Phase 0 et démarrer Module 1:**

✅ **OBLIGATOIRES** (NO-GO si non remplis):
- [ ] Projet Firebase actif sélectionné
- [ ] Configuration firebase.json corrigée (pas de "app/" ignoré)
- [ ] PostgreSQL Supabase créé et accessible
- [ ] Backend peut se connecter à PostgreSQL
- [ ] Emulators Firebase démarrables

⚠️ **IMPORTANTS** (GO CONDITIONNEL):
- [ ] gcloud CLI installé et authentifié
- [ ] Déploiement staging réussi (hosting)
- [ ] Storage rules auditées

📊 **MÉTRIQUES**:
- [ ] Budget GCP: $0/mois (free tier durant Phase 0)
- [ ] Latence backend local <100ms
- [ ] Emulators UI accessible (http://localhost:4000)

---

## 🔄 INFRASTRUCTURE vs CODE

| Aspect | Backend Code | Frontend Code | Infrastructure | Décision |
|--------|--------------|---------------|----------------|----------|
| **Maturité** | 55 fichiers | 28 fichiers | 3 projets Firebase | Code > Infra |
| **Production Ready** | ❌ Blockers sécurité | ⚠️ Partiel | ❌ Non configuré | Tous insuffisants |
| **Tests** | 8 tests (KO) | 0 tests | 0 tests infra | Égalité (tous KO) |
| **Dependencies** | Non installées | Installées | CLI partiels | Frontend > autres |
| **Database** | PostgreSQL code OK | - | ❌ Non configuré | Blocker infra |
| **Blockers P0** | 3 | 0 | 3 | Frontend meilleur |

**Conclusion**: Infrastructure nécessite travail Phase 0 équivalent au backend. Frontend plus mature.

---

## 📊 RÉSUMÉ 3 BASELINES

### Problèmes Critiques (P0) Totaux

| Domaine | P0 | Impact |
|---------|-----|--------|
| **Backend** | 3 | Sécurité (JWT, SMTP, hash) |
| **Frontend** | 3 | Config (ESLint, build, tests) |
| **Infrastructure** | 3 | Config (projet actif, functions ignore, DB) |
| **TOTAL** | **9** | **Phase 0 doit résoudre tous P0** |

### Métriques Comparées

| Métrique | Backend | Frontend | Infrastructure |
|----------|---------|----------|----------------|
| Fichiers | 55 | 28 | 3 projets |
| Tests | 8 (KO) | 0 | 0 |
| Coverage | ❌ | 0% | - |
| Lint | ❌ | ❌ | - |
| Type Check | ❌ | ✅ 0 err | - |
| Build | ❌ | ❌ Non validé | ❌ Non déployé |
| Security P0 | 3 | 0 | 0 |
| Config P0 | 0 | 3 | 3 |

### Effort Phase 0 Estimé

| Domaine | Effort (heures) | Priorité |
|---------|-----------------|----------|
| **Backend** | 8h (sécurité + setup) | CRITIQUE |
| **Frontend** | 6h (config + tests) | HAUTE |
| **Infrastructure** | 4h (DB + emulators) | CRITIQUE |
| **TOTAL** | **18h** | **3-4 jours** |

---

**Baseline créée par**: DevOps Agent
**Fichiers liés**:
- `BASELINE_BACKEND.md`
- `BASELINE_FRONTEND.md`
**Prochaine révision**: 2025-10-30 (fin Module 1)
