# 🏁 PHASE 0 : PRÉPARATION & SETUP (1 SEMAINE)

**Durée estimée** : 1 semaine (5 jours ouvrés)
**Dates** : 2025-10-23 → 2025-10-30
**Objectif** : Préparer environnement complet et valider infrastructure avant démarrage MVP

---

## 🎯 OBJECTIFS PHASE 0

### Objectif Principal
Établir fondations solides (dev local + CI/CD + baselines) avant développement modules MVP.

### Objectifs Secondaires
1. ✅ Finaliser décisions stratégiques (TERMINÉ Jour 1)
2. Nettoyer architecture (supprimer Firestore)
3. Établir baselines qualité (backend, frontend, infra)
4. Configurer environnement dev local fonctionnel
5. Mettre en place CI/CD GitHub Actions
6. Premier déploiement staging validé
7. Go/No-Go Phase 0 formel

---

## 📅 PLANNING DÉTAILLÉ 5 JOURS

### Jour 1 : Décisions Stratégiques (2025-10-23) ✅ TERMINÉ

**Statut :** ✅ **COMPLÉTÉ**

**Tâches complétées :**
- [x] Validation décisions formelles (PostgreSQL, 224 endpoints, 18 semaines, budget)
- [x] Création documentation stratégique (12 documents)
- [x] Planning 18 semaines détaillé
- [x] Méthodologie agile + Go/No-Go validée

**Livrables :**
- ✅ 12 documents stratégiques (`.github/docs-internal/ias/`)
- ✅ Timeline 18 semaines (Go-Live : 2026-02-19)
- ✅ Toutes décisions enregistrées et validées

---

## TASK-P0-001 : Nettoyage Architecture Firestore

**Agent** : Dev
**Priorité** : CRITIQUE
**Effort** : 2 heures
**Deadline** : 2025-10-24 (Jour 2)

### Contexte
Décision validée : PostgreSQL (Supabase) UNIQUEMENT → Supprimer toute configuration Firestore.

### Fichiers Concernés

**À SUPPRIMER :**
1. `firestore.rules` (191 lignes)
2. `firestore.indexes.json`

**À MODIFIER :**
3. `firebase.json` (lignes 84-86) - Retirer section :
```json
"firestore": {
  "rules": "firestore.rules",
  "indexes": "firestore.indexes.json"
}
```

### Étapes
1. Backup fichiers avant suppression (git commit)
2. Supprimer `firestore.rules`
3. Supprimer `firestore.indexes.json`
4. Modifier `firebase.json` (retirer lignes 84-86)
5. Tester application démarre sans erreur
6. Vérifier aucune référence Firestore dans code (grep)

### Critères Validation
- ✅ Fichiers `firestore.rules` et `firestore.indexes.json` supprimés
- ✅ Section firestore retirée de `firebase.json`
- ✅ Aucune erreur import/référence Firestore
- ✅ Application backend démarre (http://localhost:8000)
- ✅ Application frontend démarre (http://localhost:3000)

### Références
- Décision : `.github/docs-internal/ias/01_DECISIONS/DECISION_001_BASE_DONNEES_FINAL.md`

---

## TASK-P0-002 : Créer Baselines Qualité

**Agent** : Dev + Doc
**Priorité** : HAUTE
**Effort** : 4 heures
**Deadline** : 2025-10-24 (Jour 2)

### Contexte
Établir état initial (baseline) code/infra pour mesurer progression qualité.

### Baselines à Créer

**1. BASELINE_BACKEND.md** (2 heures)

**Contenu :**
```markdown
# Baseline Backend - 2025-10-24

## Métriques Code
- Fichiers Python : {count}
- Lignes de code : {total}
- Endpoints implémentés : {count}/224

## Qualité
- Tests coverage : {%}
- Linter errors (flake8) : {count}
- Type errors (mypy) : {count}
- Fichiers vides : {count}
- Duplication code : {description}

## Structure
- Routes API : {count} fichiers
- Services : {count} fichiers
- Repositories : {count} fichiers
- Models : {count} fichiers

## Problèmes Identifiés
1. [Liste problèmes détectés]
2. [Duplication repositories]
3. [Fichiers vides à supprimer]
```

**Commandes à exécuter :**
```bash
# Coverage
pytest --cov=app --cov-report=term-missing

# Linter
flake8 packages/backend/app/

# Type checker
mypy packages/backend/app/

# Statistiques code
find packages/backend/app -name "*.py" | wc -l
cloc packages/backend/app/
```

**2. BASELINE_FRONTEND.md** (1.5 heure)

**Contenu :**
```markdown
# Baseline Frontend - 2025-10-24

## Métriques Code
- Fichiers TypeScript : {count}
- Lignes de code : {total}
- Pages : {count}
- Composants : {count}

## Qualité
- Tests coverage : {%}
- ESLint errors : {count}
- TypeScript errors : {count}
- Lighthouse score : {score}/100

## Structure
- Pages app/ : {count}
- Composants ui/ : {count}
- Hooks custom : {count}
- Tests : {count}

## État Actuel
- Frontend implémenté : {%}
- Pages manquantes : [liste]
```

**Commandes à exécuter :**
```bash
cd packages/web

# Tests coverage
npm run test -- --coverage

# Linter
npm run lint

# Type checker
npm run type-check

# Statistiques
find src -name "*.tsx" -o -name "*.ts" | wc -l
cloc src/
```

**3. BASELINE_INFRASTRUCTURE.md** (30 min)

**Contenu :**
```markdown
# Baseline Infrastructure - 2025-10-24

## Services GCP/Firebase Actifs
- Firebase Hosting : {status}
- Cloud Run : {status}
- Cloud Storage : {status}
- Supabase PostgreSQL : {status}

## Configuration
- Environnements : dev, staging, production
- CI/CD : {status}
- Secrets Manager : {count} secrets

## Budget Actuel
- Coût mensuel estimé : ${amount}
- Quotas utilisés : {details}
```

### Critères Validation
- ✅ 3 fichiers baselines créés (`.github/docs-internal/ias/02_BASELINES/`)
- ✅ Métriques complètes et mesurables
- ✅ Problèmes identifiés documentés
- ✅ Point de référence établi pour suivi progression

---

## TASK-P0-003 : Setup Environnement Dev Local

**Agent** : Dev
**Priorité** : CRITIQUE
**Effort** : 3 heures
**Deadline** : 2025-10-25 (Jour 3)

### Objectifs
1. Backend local fonctionnel (http://localhost:8000)
2. Frontend local fonctionnel (http://localhost:3000)
3. PostgreSQL Supabase connecté
4. Documentation setup complète

### Backend Setup

**Étapes :**
```bash
cd packages/backend

# 1. Environnement virtuel Python
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Installer dépendances
pip install -r requirements.txt

# 3. Vérifier .env existant
cat .env | grep DATABASE_URL
cat .env | grep SUPABASE_URL

# 4. Tester connexion PostgreSQL
python -c "import asyncpg; print('asyncpg OK')"

# 5. Lancer backend
uvicorn main:app --reload --port 8000

# 6. Tester endpoints
curl http://localhost:8000/health
curl http://localhost:8000/docs
```

**Critères validation backend :**
- ✅ Backend démarre sans erreur
- ✅ Swagger UI accessible (http://localhost:8000/docs)
- ✅ Health check OK (GET /health → 200)
- ✅ Connexion PostgreSQL validée

### Frontend Setup

**Étapes :**
```bash
cd packages/web

# 1. Installer dépendances Node.js
npm install

# 2. Vérifier .env.local
cat .env.local | grep NEXT_PUBLIC_API_URL

# 3. Lancer frontend
npm run dev

# 4. Tester
curl http://localhost:3000
```

**Critères validation frontend :**
- ✅ Frontend démarre sans erreur
- ✅ Page accueil charge (http://localhost:3000)
- ✅ Aucune erreur console
- ✅ Communication backend OK

### Database Validation

**Étapes :**
```bash
# Connexion Supabase
psql "${SUPABASE_DATABASE_URL}"

# Vérifier tables
\dt

# Query test
SELECT count(*) FROM users;
```

**Critères validation database :**
- ✅ Connexion Supabase réussie
- ✅ Schéma chargé (50+ tables)
- ✅ Query test OK

### Documentation

**Créer `README_DEV_SETUP.md` :**
```markdown
# Setup Environnement Développement

## Backend
1. Python 3.11+ requis
2. Créer venv : `python -m venv venv`
3. Activer : `source venv/bin/activate`
4. Installer : `pip install -r requirements.txt`
5. Lancer : `uvicorn main:app --reload --port 8000`
6. Tester : http://localhost:8000/docs

## Frontend
1. Node.js 20+ requis
2. Installer : `npm install`
3. Lancer : `npm run dev`
4. Tester : http://localhost:3000

## Database
1. Supabase URL dans .env
2. Tester connexion : `python test_db.py`
```

### Critères Validation
- ✅ Backend local fonctionne
- ✅ Frontend local fonctionne
- ✅ Database connectée
- ✅ README_DEV_SETUP.md créé

---

## TASK-P0-004 : Configuration CI/CD GitHub Actions

**Agent** : Dev
**Priorité** : CRITIQUE
**Effort** : 4 heures
**Deadline** : 2025-10-26 (Jour 4)

### Objectifs
1. CI/CD backend automatisé (lint, test, deploy Cloud Run)
2. CI/CD frontend automatisé (lint, test, deploy Firebase Hosting)
3. Secrets GitHub configurés
4. Premier déploiement staging validé

### Backend CI/CD

**Créer `.github/workflows/backend-ci.yml` :**
```yaml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'packages/backend/**'
  pull_request:
    branches: [main]

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python 3.11
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd packages/backend
          pip install -r requirements.txt

      - name: Lint (flake8)
        run: |
          cd packages/backend
          flake8 app/ --max-line-length=120

      - name: Type check (mypy)
        run: |
          cd packages/backend
          mypy app/

      - name: Run tests
        run: |
          cd packages/backend
          pytest --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./packages/backend/coverage.xml

  deploy-staging:
    needs: lint-test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Cloud Run (staging)
        uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: taxasge-backend-staging
          region: europe-west1
          source: ./packages/backend
          env_vars: |
            DATABASE_URL=${{ secrets.SUPABASE_DATABASE_URL }}
            JWT_SECRET_KEY=${{ secrets.JWT_SECRET_KEY }}
```

### Frontend CI/CD

**Créer `.github/workflows/frontend-ci.yml` :**
```yaml
name: Frontend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'packages/web/**'
  pull_request:
    branches: [main]

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd packages/web
          npm ci

      - name: Lint (ESLint)
        run: |
          cd packages/web
          npm run lint

      - name: Type check
        run: |
          cd packages/web
          npm run type-check

      - name: Run tests
        run: |
          cd packages/web
          npm run test -- --coverage

      - name: Build
        run: |
          cd packages/web
          npm run build

  deploy-staging:
    needs: lint-test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Firebase Hosting (staging)
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: staging
          projectId: taxasge-dev
```

### Secrets GitHub à Configurer

**Liste secrets requis :**
```
SUPABASE_DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET_KEY
GCP_PROJECT_ID
GCP_SA_KEY
FIREBASE_SERVICE_ACCOUNT
BANGE_API_KEY
```

### Critères Validation
- ✅ Workflows GitHub Actions créés (backend + frontend)
- ✅ Tous secrets configurés
- ✅ Tests CI passent sur commit
- ✅ Deploy staging automatique fonctionne
- ✅ URLs staging accessibles

---

## TASK-P0-005 : Go/No-Go Phase 0

**Agent** : Orchestrator
**Priorité** : CRITIQUE
**Effort** : 2 heures
**Deadline** : 2025-10-27 (Jour 5)

### Objectifs
1. Smoke tests staging
2. Validation complète Phase 0
3. Décision GO/NO-GO Module 1
4. Rapport final Phase 0

### Smoke Tests Staging

**Backend Staging :**
```bash
# Health check
curl https://taxasge-backend-staging.run.app/health

# API docs
curl https://taxasge-backend-staging.run.app/docs

# Latency test
time curl https://taxasge-backend-staging.run.app/api/v1/
```

**Frontend Staging :**
```bash
# Page accueil
curl https://staging.taxasge.com

# Lighthouse
lighthouse https://staging.taxasge.com --view
```

**Integration :**
```bash
# Frontend → Backend
# Vérifier CORS configuré
# Vérifier logs Cloud Logging
```

### Checklist Go/No-Go Phase 0

```markdown
## CHECKLIST GO/NO-GO PHASE 0

### Décisions ✅
- [x] Toutes décisions stratégiques validées

### Architecture
- [ ] Firestore supprimé (files + config)
- [ ] PostgreSQL uniquement configuré
- [ ] Aucune erreur architecture

### Environnement Local
- [ ] Backend local fonctionne (http://localhost:8000)
- [ ] Frontend local fonctionne (http://localhost:3000)
- [ ] Database connexion OK
- [ ] README_DEV_SETUP.md créé

### CI/CD
- [ ] GitHub Actions backend configuré
- [ ] GitHub Actions frontend configuré
- [ ] Tous secrets configurés
- [ ] Tests CI passent

### Staging
- [ ] Backend staging déployé (URL accessible)
- [ ] Frontend staging déployé (URL accessible)
- [ ] Health check OK
- [ ] Latency < 500ms

### Baselines
- [ ] BASELINE_BACKEND.md créé
- [ ] BASELINE_FRONTEND.md créé
- [ ] BASELINE_INFRASTRUCTURE.md créé
- [ ] Métriques complètes

### Tests
- [ ] Smoke tests staging passent
- [ ] Aucun bug bloquant (P0)
- [ ] Logs accessibles (Cloud Logging)

### Documentation
- [ ] RAPPORT_FINAL_PHASE_0.md créé
- [ ] README_DEV_SETUP.md à jour
- [ ] RAPPORT_GENERAL.md mis à jour

**SCORE GLOBAL : ___/20**

**DÉCISION : [ ] GO / [ ] NO-GO**

**Si GO :** Module 1 démarre immédiatement (Semaine 2)
**Si NO-GO :** Corrections + re-validation 24-48h
```

### Rapport Final Phase 0

**Créer `RAPPORT_FINAL_PHASE_0.md` :**
```markdown
# Rapport Final Phase 0 - Préparation

**Date :** 2025-10-27
**Statut :** [GO / NO-GO]
**Score :** [X]/20

## Accomplissements
- [Liste tâches complétées]

## Métriques
- Backend coverage : {%}
- Frontend coverage : {%}
- CI/CD pipeline : {temps}
- Staging uptime : {%}

## Blockers Résolus
- [Liste blockers rencontrés et solutions]

## Prochaines Étapes
- Module 1 : Authentication (Semaine 2)
- Timeline : 2025-10-30 → 2025-11-06
```

### Critères Validation
- ✅ Checklist Go/No-Go complétée
- ✅ Score ≥ 16/20 (80%) pour GO
- ✅ RAPPORT_FINAL_PHASE_0.md créé
- ✅ Décision GO validée
- ✅ RAPPORT_GENERAL.md mis à jour

---

## 📊 MÉTRIQUES CIBLES PHASE 0

| Métrique | Baseline | Cible Phase 0 | Mesure |
|----------|----------|---------------|--------|
| **Backend Coverage** | 40% | Baseline établi | pytest --cov |
| **Frontend Coverage** | 0% | Baseline établi | npm test --coverage |
| **Lint Errors** | ? | 0 critiques | flake8 + eslint |
| **Build Success** | ? | 100% | CI/CD |
| **Staging Uptime** | ? | >95% | Monitoring |
| **CI/CD Pipeline** | ❌ | ✅ <10 min | GitHub Actions |

---

## 🚨 RISQUES PHASE 0

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Secrets manquants | 50% | Élevé | Vérifier avec décideur Jour 2 |
| Build Docker échoue | 40% | Moyen | Tests locaux d'abord |
| Firebase token invalide | 30% | Moyen | Regénérer si nécessaire |
| Connexion Supabase | 20% | Élevé | Tester tôt Jour 3 |

---

## ✅ CRITÈRES ACCEPTATION PHASE 0

### Obligatoires (GO/NO-GO)
- [x] Toutes décisions validées ✅
- [ ] Architecture nettoyée (Firestore supprimé)
- [ ] Backend local fonctionne
- [ ] Frontend local fonctionne
- [ ] CI/CD configuré
- [ ] Staging déployé et accessible
- [ ] Baselines créés
- [ ] Aucun bug bloquant

### Optionnels (Nice-to-Have)
- [ ] Tests coverage >50%
- [ ] Documentation complète
- [ ] Charte graphique complétée (par designer externe)

---

## 🎯 VALIDATION FINALE PHASE 0

**Condition GO :**
- Score checklist ≥ 16/20 (80%)
- Aucun blocker critique non résolu
- Environnements dev + staging fonctionnels

**Si GO :**
- **Module 1 démarre** : 2025-10-30 (Semaine 2)
- **Focus** : Authentication (15 endpoints backend + 4 pages frontend)
- **Durée** : 1 semaine

**Si NO-GO :**
- Identifier blockers précis
- Plan correction (1-2 jours)
- Re-validation Go/No-Go
- Timeline ajustée

---

**Phase créée par :** Claude Code Expert IA
**Date :** 2025-10-23
**Statut :** ✅ VALIDÉ - Exécution en cours (Jour 1 terminé)
**Prochaine action :** TASK-P0-001 (Nettoyage Firestore) - Jour 2
