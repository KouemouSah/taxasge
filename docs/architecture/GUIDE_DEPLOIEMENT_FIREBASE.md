# GUIDE DEPLOIEMENT FIREBASE - TAXASGE
## Configuration Complete et Analyse Critique

**Version**: 1.0
**Date**: 30 septembre 2025
**Auteur**: Equipe TaxasGE
**Scope**: Guide complet de deploiement Firebase pour architecture multi-services

---

## TABLE DES MATIERES

1. [Architecture Firebase](#1-architecture-firebase)
2. [Configuration Firebase](#2-configuration-firebase)
3. [Services Firebase Utilises](#3-services-firebase-utilises)
4. [Deploiement Multi-Environnements](#4-deploiement-multi-environnements)
5. [CI/CD Workflows](#5-cicd-workflows)
6. [Monitoring et Couts](#6-monitoring-et-couts)
7. [Troubleshooting](#7-troubleshooting)
8. [Commandes Essentielles](#8-commandes-essentielles)

---

## 1. ARCHITECTURE FIREBASE

### 1.1 Question Critique : Ports vs Domaines

**Question posee** : "Sur Firebase Hosting est-ce qu'il va pouvoir creer deux domaines differents pour le frontend et le backend ou alors configurer deux ports distincts comme sur le localhost?"

### 1.2 Reponse Technique Directe

#### PORTS DISTINCTS = IMPOSSIBLE

Firebase Hosting **NE SUPPORTE QUE LE PORT 443** (HTTPS standard). L'idee de ports distincts (comme localhost:3000 et localhost:8000) est **techniquement impossible** sur Firebase.

#### DOMAINES SEPARES = SOLUTION RECOMMANDEE

Firebase permet facilement la gestion de **domaines/sous-domaines multiples** pour separer frontend et backend.

### 1.3 Options d'Architecture Analysees

#### Option 1: Architecture Domaines Separes (RECOMMANDE)

```
Frontend Public:  https://taxasge-dev.web.app          (Firebase Hosting)
Backend API:      https://taxasge-dev.firebase.com     (Firebase Functions)
Admin Dashboard:  https://taxasge-dev.firebase.com     (Firebase Functions)
```

**Avantages Critiques:**
- Securite maximale : Admin completement isole
- SEO optimise : Frontend sur domaine principal
- Caching strategique : Differents par service
- Monitoring granulaire : Metriques separees
- Scalabilite independante : Ressources par besoin
- DNS professionnel : Structure claire et logique

**Inconvenients Mineurs:**
- 3 domaines a configurer (DNS records)
- 3 certificats SSL (automatiques Firebase)
- Configuration legerement plus complexe

#### Option 2: Migration vers Domaines Personnalises (Production)

```
Frontend:  https://taxasge.gq              (Custom domain → taxasge-prod.web.app)
Backend:   https://api.taxasge.gq          (Custom domain → taxasge-prod.firebase.com)
Admin:     https://admin.taxasge.gq        (Custom domain → taxasge-prod.firebase.com)
```

**Etapes de migration**: Development → Production → Domaines personnalises

#### Option 3: Paths Unifies (NON RECOMMANDE)

```
Frontend:  https://taxasge-dev.web.app/
Backend:   https://taxasge-dev.firebase.com/api/
Admin:     https://taxasge-dev.firebase.com/admin/
```

**Problemes Majeurs:**
- Routing complexe : Conflits entre Next.js et FastAPI
- Cache headers conflicts : Frontend vs API besoins differents
- SEO compromise : Admin crawlable par robots
- Security risks : Admin sur meme domaine que public
- Build/deploy coupling : Un echec = tout down

### 1.4 Roadmap de Deploiement

#### Phase 1: Development (ACTUEL)
```
Frontend:  https://taxasge-dev.web.app          (Firebase Hosting)
Backend:   https://taxasge-dev.firebase.com     (Firebase Functions)
Admin:     https://taxasge-dev.firebase.com     (Firebase Functions)
```

#### Phase 2: Production (FUTUR)
```
Frontend:  https://taxasge-prod.web.app         (Firebase Hosting)
Backend:   https://taxasge-prod.firebase.com    (Firebase Functions)
Admin:     https://taxasge-prod.firebase.com    (Firebase Functions)
```

#### Phase 3: Domaines Personnalises (OPTIONNEL)
```
Frontend:  https://taxasge.gq                   (Custom domain)
Backend:   https://api.taxasge.gq               (Custom domain)
Admin:     https://admin.taxasge.gq             (Custom domain)
```

---

## 2. CONFIGURATION FIREBASE

### 2.1 Projets Firebase Configures

#### TaxasGE Development (development)
- **Project ID:** taxasge-dev
- **Package Android:** com.taxasge.dev
- **Package iOS:** com.taxasge.dev
- **Domaine Web:** taxasge-dev.web.app
- **Services:** authentication, firestore, functions, hosting, storage, app-distribution

#### TaxasGE Production (production) - A configurer
- **Project ID:** taxasge-prod
- **Package Android:** com.taxasge.app
- **Package iOS:** com.taxasge.app
- **Domaine Web:** taxasge-prod.web.app
- **Services:** authentication, firestore, functions, hosting, storage

### 2.2 Structure Projet Firebase

#### .firebaserc - Aliases des Projets

```json
{
  "projects": {
    "default": "taxasge-dev",
    "development": "taxasge-dev",
    "production": "taxasge-prod",
    "staging": "taxasge-staging"
  },
  "targets": {
    "taxasge-prod": {
      "hosting": {
        "frontend": ["taxasge-prod-frontend"],
        "admin": ["taxasge-prod-admin"]
      }
    },
    "taxasge-dev": {
      "hosting": {
        "frontend": ["taxasge-dev-frontend"],
        "admin": ["taxasge-dev-admin"]
      }
    }
  }
}
```

### 2.3 firebase.json - Configuration Complete

```json
{
  "hosting": [
    {
      "target": "frontend",
      "site": "taxasge-frontend",
      "public": "packages/web/out",
      "cleanUrls": true,
      "trailingSlash": false,
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "headers": [
        {
          "source": "/sw.js",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache, no-store, must-revalidate"
            },
            {
              "key": "Service-Worker-Allowed",
              "value": "/"
            }
          ]
        },
        {
          "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            }
          ]
        },
        {
          "source": "**/*.@(js|css)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            }
          ]
        },
        {
          "source": "**/*.@(html|json)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache, no-store, must-revalidate"
            }
          ]
        }
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    },
    {
      "target": "admin",
      "site": "taxasge-admin",
      "public": "packages/admin/out",
      "cleanUrls": true,
      "trailingSlash": false,
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "headers": [
        {
          "source": "**",
          "headers": [
            {
              "key": "X-Frame-Options",
              "value": "DENY"
            },
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            },
            {
              "key": "Referrer-Policy",
              "value": "strict-origin-when-cross-origin"
            }
          ]
        }
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  ],
  "functions": [
    {
      "source": "packages/backend",
      "runtime": "python311",
      "memory": "1GB",
      "timeout": "540s",
      "env": {
        "ENVIRONMENT": "production",
        "CORS_ORIGINS": "https://taxasge.gq,https://admin.taxasge.gq",
        "PYTHON_VERSION": "3.11"
      },
      "predeploy": [
        "pip install -r requirements.txt",
        "python -m pytest tests/"
      ]
    }
  ],
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### 2.4 Configuration DNS

```dns
# Enregistrements DNS requis pour domaines personnalises

# Frontend public
taxasge.gq         A     151.101.1.195  (Firebase Hosting IP)
www.taxasge.gq     CNAME taxasge.gq

# Backend API
api.taxasge.gq     CNAME us-central1-taxasge-prod.cloudfunctions.net

# Admin Dashboard
admin.taxasge.gq   CNAME us-central1-taxasge-prod.cloudfunctions.net

# Verification TXT pour domaines personnalises
_firebase-hosting-api.taxasge.gq      TXT "firebase=taxasge-prod"
_firebase-hosting-admin.taxasge.gq    TXT "firebase=taxasge-prod"
```

### 2.5 Fichiers de Configuration Generes

#### Configuration Racine
- `.firebaserc` - Aliases des projets
- `firebase.json` - Configuration des services
- `firestore.rules` - Regles de securite Firestore
- `firestore.indexes.json` - Index Firestore
- `storage.rules` - Regles de securite Storage

#### Configuration Mobile
- `packages/mobile/android/app/google-services.json` - Android Firebase
- `packages/mobile/ios/GoogleService-Info.plist` - iOS Firebase
- `packages/mobile/src/config/firebase.config.js` - Web Firebase

#### Configuration Backend
- `packages/backend/.env.example` - Variables d'environnement
- `packages/backend/.env.development` - Environnement development
- `packages/backend/.env.production` - Environnement production

---

## 3. SERVICES FIREBASE UTILISES

### 3.1 Firebase Hosting (Frontend)

**Usage**: Hebergement application web Next.js PWA

**Configuration**:
- Static export Next.js vers `/out`
- Service Worker pour PWA
- Cache strategies optimisees
- Redirections SEO-friendly
- HTTPS automatique

**Limites**:
- 10GB stockage gratuit
- 360MB/jour transfert gratuit
- Port 443 uniquement (HTTPS)

### 3.2 Firebase Functions (Backend)

**Usage**: API Backend FastAPI + Admin Dashboard

**Configuration**:
- Runtime Python 3.11
- Memory 1GB
- Timeout 540s (9 minutes max)
- CORS multi-domaines
- Environment variables

**Limites**:
- 2M invocations/mois gratuites
- 400k GB-sec gratuites
- Cold start ~1-2 secondes

### 3.3 Firebase Authentication

**Usage**: Authentification utilisateurs (Admin, Public, Mobile)

**Methodes supportees**:
- Email/Password
- Google OAuth
- Phone (SMS)
- Anonymous (guest)

**Features**:
- JWT tokens automatiques
- Session management
- Multi-device support
- Admin SDK pour gestion utilisateurs

### 3.4 Cloud Firestore

**Usage**: Base de donnees NoSQL principale

**Collections principales**:
- `services` - 547 services administratifs
- `users` - Utilisateurs system
- `ministries` - Ministeres (M-001 a M-024)
- `transactions` - Historique operations
- `analytics` - Metriques usage

**Features**:
- Real-time listeners
- Offline persistence
- Indexes automatiques
- Transactions ACID
- Security rules

### 3.5 Cloud Storage

**Usage**: Stockage fichiers (documents, images, exports)

**Buckets**:
- `documents/` - Documents officiels
- `exports/` - Exports CSV/PDF
- `uploads/` - Fichiers utilisateurs
- `backups/` - Sauvegardes automatiques

**Features**:
- Upload resume
- Compression images
- CDN integration
- Access control rules

### 3.6 Firebase Analytics

**Usage**: Tracking utilisateurs et performance

**Metriques trackees**:
- Page views
- User engagement
- Service searches
- Conversion funnels
- Error rates

### 3.7 App Distribution (Mobile)

**Usage**: Distribution beta testing apps iOS/Android

**Features**:
- Testers management
- Release notes
- Crash reporting
- Version tracking

---

## 4. DEPLOIEMENT MULTI-ENVIRONNEMENTS

### 4.1 Environnements Configures

#### Development
- **Project ID**: taxasge-dev
- **URL Frontend**: https://taxasge-dev.web.app
- **URL Backend**: https://taxasge-dev.firebase.com
- **Firestore**: Mode test
- **Auth**: Email/Password uniquement

#### Staging (A configurer)
- **Project ID**: taxasge-staging
- **URL Frontend**: https://taxasge-staging.web.app
- **URL Backend**: https://taxasge-staging.firebase.com
- **Firestore**: Donnees test realistes
- **Auth**: Toutes methodes activees

#### Production
- **Project ID**: taxasge-prod
- **URL Frontend**: https://taxasge-prod.web.app → https://taxasge.gq
- **URL Backend**: https://taxasge-prod.firebase.com → https://api.taxasge.gq
- **Firestore**: Donnees production
- **Auth**: Toutes methodes + 2FA

### 4.2 Variables d'Environnement

#### Backend (.env)

```bash
# Environment
ENVIRONMENT=production
NODE_ENV=production
PYTHON_VERSION=3.11

# Firebase
FIREBASE_PROJECT_ID=taxasge-prod
FIREBASE_STORAGE_BUCKET=taxasge-prod.appspot.com
FIREBASE_API_KEY=<FIREBASE_API_KEY>

# CORS
CORS_ORIGINS=https://taxasge.gq,https://admin.taxasge.gq
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_CREDENTIALS=true

# API
API_BASE_URL=https://api.taxasge.gq
API_VERSION=v1
API_TIMEOUT=30

# Security
JWT_SECRET=<JWT_SECRET>
JWT_ALGORITHM=HS256
JWT_EXPIRY=3600
ADMIN_JWT_EXPIRY=7200

# Database
FIRESTORE_DATABASE=(default)
FIRESTORE_COLLECTION_PREFIX=prod_

# Storage
STORAGE_MAX_FILE_SIZE=10485760
STORAGE_ALLOWED_TYPES=pdf,jpg,png,csv

# Monitoring
SENTRY_DSN=<SENTRY_DSN>
LOG_LEVEL=info
```

#### Frontend (.env.local)

```bash
# Next.js
NEXT_PUBLIC_API_URL=https://api.taxasge.gq
NEXT_PUBLIC_SITE_URL=https://taxasge.gq

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=<API_KEY>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=taxasge-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=taxasge-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=taxasge-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<SENDER_ID>
NEXT_PUBLIC_FIREBASE_APP_ID=<APP_ID>
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<MEASUREMENT_ID>

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=<GA_ID>

# Features
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### 4.3 Configuration Initiale par Environnement

#### Setup Development

```bash
# 1. Selectionner projet development
firebase use development

# 2. Configurer targets hosting
firebase target:apply hosting frontend taxasge-dev-frontend
firebase target:apply hosting admin taxasge-dev-admin

# 3. Creer sites hosting
firebase hosting:sites:create taxasge-dev-frontend
firebase hosting:sites:create taxasge-dev-admin

# 4. Deployer
firebase deploy --only hosting:frontend,functions
```

#### Setup Production

```bash
# 1. Selectionner projet production
firebase use production

# 2. Configurer targets hosting
firebase target:apply hosting frontend taxasge-prod-frontend
firebase target:apply hosting admin taxasge-prod-admin

# 3. Creer sites hosting
firebase hosting:sites:create taxasge-prod-frontend
firebase hosting:sites:create taxasge-prod-admin

# 4. Ajouter domaines personnalises
firebase hosting:sites:domain:add taxasge.gq --site taxasge-prod-frontend
firebase hosting:sites:domain:add admin.taxasge.gq --site taxasge-prod-admin

# 5. Configurer DNS (voir section 2.4)

# 6. Deployer
firebase deploy --only hosting:frontend,functions
```

---

## 5. CI/CD WORKFLOWS

### 5.1 GitHub Actions - Deploiement Automatique

#### .github/workflows/deploy-firebase.yml

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main          # Production
      - develop       # Development
      - staging       # Staging
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        environment:
          - development
          - production

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          yarn install --frozen-lockfile
          pip install -r packages/backend/requirements.txt

      - name: Build Frontend
        run: |
          cd packages/web
          yarn build
        env:
          NEXT_PUBLIC_API_URL: {% raw %}${{ secrets[format('API_URL_{0}', matrix.environment)] }}{% endraw %}

      - name: Run Tests
        run: |
          yarn test
          pytest packages/backend/tests/

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: {% raw %}'${{ secrets.GITHUB_TOKEN }}'{% endraw %}
          firebaseServiceAccount: {% raw %}'${{ secrets[format('FIREBASE_SERVICE_ACCOUNT_{0}', matrix.environment)] }}'{% endraw %}
          channelId: live
          projectId: {% raw %}taxasge-${{ matrix.environment }}{% endraw %}
          target: frontend

      - name: Deploy Functions
        run: |
          firebase use ${{ matrix.environment }}
          firebase deploy --only functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}

      - name: Notify Deployment
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "Deployment to ${{ matrix.environment }} successful!"
            }
```

### 5.2 Scripts de Deploiement

#### package.json - Scripts

```json
{
  "scripts": {
    "deploy": "yarn deploy:check && firebase deploy",
    "deploy:dev": "firebase use development && firebase deploy",
    "deploy:prod": "firebase use production && firebase deploy",
    "deploy:frontend": "firebase deploy --only hosting:frontend",
    "deploy:backend": "firebase deploy --only functions",
    "deploy:admin": "firebase deploy --only hosting:admin",
    "deploy:check": "yarn build && yarn test && yarn lint",
    "deploy:preview": "firebase hosting:channel:deploy preview",
    "rollback:frontend": "firebase hosting:rollback --site taxasge-frontend",
    "rollback:functions": "firebase functions:delete <function_name>",
    "emulators": "firebase emulators:start",
    "emulators:export": "firebase emulators:export ./firebase-data",
    "emulators:import": "firebase emulators:start --import=./firebase-data"
  }
}
```

### 5.3 Preview Channels (Pull Requests)

```bash
# Creer channel preview pour PR
firebase hosting:channel:deploy pr-123 --only frontend

# URL generee automatiquement:
# https://taxasge-dev--pr-123-<hash>.web.app

# Supprimer channel apres merge
firebase hosting:channel:delete pr-123
```

### 5.4 Rollback Strategies

#### Rollback Hosting

```bash
# Lister deployments recents
firebase hosting:deployments:list

# Rollback vers version precedente
firebase hosting:rollback --site taxasge-frontend

# Rollback vers version specifique
firebase hosting:rollback <deployment_id> --site taxasge-frontend
```

#### Rollback Functions

```bash
# Lister versions functions
gcloud functions list --project taxasge-prod

# Deployer version precedente
gcloud functions deploy <function_name> --source=<previous_version>

# Ou supprimer et redeployer
firebase functions:delete <function_name>
firebase deploy --only functions:<function_name>
```

---

## 6. MONITORING ET COUTS

### 6.1 Couts Firebase Estimes

#### Hosting (Frontend)
- **Gratuit**: 10GB stockage + 360MB/jour transfert
- **Payant**: $0.026/GB stockage + $0.15/GB transfert
- **Estimation mensuelle**: ~$5-15/mois
- **Trafic estime**: 50k pages vues/mois

#### Functions (Backend + Admin)
- **Gratuit**: 2M invocations/mois + 400k GB-sec
- **Payant**: $0.40/M invocations + $0.0025/GB-sec
- **Estimation mensuelle**: ~$20-50/mois (selon trafic)
- **Invocations estimees**: 500k-1M/mois

#### Firestore
- **Gratuit**: 50k reads + 20k writes/jour
- **Payant**: $0.18/100k reads + $0.36/100k writes
- **Estimation mensuelle**: ~$10-30/mois
- **Operations estimees**: 1M reads + 200k writes/mois

#### Storage
- **Gratuit**: 5GB stockage + 1GB/jour transfert
- **Payant**: $0.026/GB stockage + $0.12/GB transfert
- **Estimation mensuelle**: ~$5-10/mois
- **Stockage estime**: 20-50GB

#### Authentication
- **Gratuit**: Illimite Email/Password + Google
- **SMS**: $0.06 par verification
- **Estimation mensuelle**: ~$5-10/mois (si SMS active)

#### TOTAL ESTIME: $45-115/mois
**Note**: Tres raisonnable pour 547 services et architecture professionnelle

### 6.2 Monitoring Multi-Sites

#### Firebase Analytics Separees

**Frontend (Google Analytics)**:
```javascript
// packages/web/src/lib/analytics.js
import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics(app);

// Track service search
logEvent(analytics, 'service_search', {
  search_term: 'passeport',
  ministry_id: 'M-001',
  results_count: 12
});

// Track service view
logEvent(analytics, 'service_view', {
  service_id: 'SRV-001',
  service_name: 'Demande passeport',
  ministry: 'Affaires Etrangeres'
});
```

**Admin (Firebase Analytics)**:
```javascript
// packages/admin/src/lib/analytics.js
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics(app);

// Track admin actions
logEvent(analytics, 'admin_action', {
  action_type: 'service_edit',
  user_role: 'admin',
  ministry: 'M-001',
  service_id: 'SRV-001'
});
```

#### Performance Monitoring

**Backend (Python)**:
```python
# packages/backend/monitoring.py
from prometheus_client import Histogram, Counter
import time

# Metriques par domaine
frontend_latency = Histogram(
    'frontend_response_time',
    'Frontend response time in seconds',
    ['endpoint', 'method']
)

api_latency = Histogram(
    'api_response_time',
    'API response time in seconds',
    ['endpoint', 'method', 'status']
)

admin_latency = Histogram(
    'admin_response_time',
    'Admin response time in seconds',
    ['action', 'user_role']
)

# Compteurs
api_requests = Counter(
    'api_requests_total',
    'Total API requests',
    ['endpoint', 'method', 'status']
)

errors_total = Counter(
    'errors_total',
    'Total errors',
    ['endpoint', 'error_type']
)

# Decorator pour tracking
def track_performance(metric):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = await func(*args, **kwargs)
                metric.observe(time.time() - start)
                return result
            except Exception as e:
                errors_total.labels(
                    endpoint=func.__name__,
                    error_type=type(e).__name__
                ).inc()
                raise
        return wrapper
    return decorator
```

### 6.3 Alertes et Notifications

#### Firebase Performance Monitoring

```javascript
// packages/web/src/lib/performance.js
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);

// Trace custom
const trace = perf.trace('load_services_page');
trace.start();
// ... load services
trace.stop();

// Metriques HTTP automatiques
// Firebase trace automatiquement:
// - Page load times
// - HTTP requests
// - Custom traces
```

#### Cloud Monitoring Alerts

```bash
# Configurer alertes via gcloud
gcloud alpha monitoring policies create \
  --notification-channels=<CHANNEL_ID> \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=300s
```

### 6.4 Dashboards

#### Firebase Console Dashboards
- **Usage**: Hosting bandwidth, Functions invocations
- **Performance**: Page load times, API latency
- **Quality**: Crash reports, error logs
- **Engagement**: Active users, retention

#### Custom Grafana Dashboard (Optionnel)

```yaml
# docker-compose.yml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
```

---

## 7. TROUBLESHOOTING

### 7.1 Problemes Courants

#### Erreur: "Firebase CLI not authenticated"

**Symptome**:
```
Error: Failed to authenticate with Firebase
```

**Solution**:
```bash
# Re-login
firebase logout
firebase login

# Ou utiliser token CI
firebase login:ci
export FIREBASE_TOKEN=<token>
```

#### Erreur: "Insufficient permissions"

**Symptome**:
```
Error: HTTP Error: 403, The caller does not have permission
```

**Solution**:
```bash
# Verifier roles IAM dans console Firebase
# Ajouter roles necessaires:
# - Firebase Admin
# - Cloud Functions Developer
# - Hosting Admin

# Via gcloud
gcloud projects add-iam-policy-binding taxasge-prod \
  --member="user:email@example.com" \
  --role="roles/firebase.admin"
```

#### Erreur: "Functions deployment timeout"

**Symptome**:
```
Error: Timed out after 540s
```

**Solution**:
```bash
# Augmenter timeout dans firebase.json
{
  "functions": {
    "timeout": "540s"  # Max 540s (9 minutes)
  }
}

# Optimiser cold start
# - Reduire taille dependencies
# - Utiliser requirements.txt minimal
# - Activer "min instances" pour functions critiques
```

#### Erreur: "Next.js build failed"

**Symptome**:
```
Error: Build optimization failed
```

**Solution**:
```bash
# Verifier variables environnement
cat packages/web/.env.local

# Nettoyer cache
rm -rf packages/web/.next
rm -rf packages/web/out

# Rebuild
cd packages/web
yarn build

# Verifier export statique
cat next.config.js
# Doit contenir: output: 'export'
```

#### Erreur: "CORS blocked"

**Symptome**:
```
Access to fetch at 'https://api.taxasge.gq' from origin 'https://taxasge.gq'
has been blocked by CORS policy
```

**Solution**:
```python
# Backend CORS configuration
from fastapi.middleware.cors import CORSMiddleware

CORS_ORIGINS = [
    "https://taxasge.gq",
    "https://www.taxasge.gq",
    "https://admin.taxasge.gq",
    "https://taxasge-dev.web.app",  # Development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 7.2 Debugging

#### Logs Functions

```bash
# Stream logs en temps reel
firebase functions:log --only <function_name>

# Logs recents
gcloud functions logs read <function_name> --limit 50

# Filtrer par severity
gcloud functions logs read <function_name> --filter "severity=ERROR"
```

#### Logs Hosting

```bash
# Logs access hosting
gcloud logging read "resource.type=firebase_domain" --limit 50

# Filtrer par status code
gcloud logging read "resource.type=firebase_domain AND httpRequest.status=404"
```

#### Emulators pour Tests Locaux

```bash
# Demarrer tous emulators
firebase emulators:start

# Emulators specifiques
firebase emulators:start --only functions,firestore,hosting

# Avec import donnees
firebase emulators:start --import=./firebase-data

# Export donnees apres tests
firebase emulators:export ./firebase-data
```

### 7.3 Performance Issues

#### Hosting Lent

**Diagnostic**:
```bash
# Tester performance
curl -w "@curl-format.txt" -o /dev/null -s https://taxasge.gq

# Analyser headers cache
curl -I https://taxasge.gq
```

**Solution**:
```json
// Optimiser headers cache dans firebase.json
{
  "headers": [
    {
      "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
      "headers": [{
        "key": "Cache-Control",
        "value": "public, max-age=31536000, immutable"
      }]
    }
  ]
}
```

#### Functions Slow

**Diagnostic**:
```python
# Ajouter timing logs
import time

start = time.time()
# ... code
print(f"Execution time: {time.time() - start}s")
```

**Solution**:
```bash
# Augmenter memory (ameliore CPU)
# firebase.json
{
  "functions": {
    "memory": "2GB"  # Default 256MB
  }
}

# Activer min instances (evite cold start)
gcloud functions deploy <function_name> \
  --min-instances=1 \
  --max-instances=10
```

### 7.4 Securite

#### Regles Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Services publics (read only)
    match /services/{serviceId} {
      allow read: if true;
      allow write: if request.auth != null &&
                      request.auth.token.admin == true;
    }

    // Users (authenticated only)
    match /users/{userId} {
      allow read, write: if request.auth != null &&
                            request.auth.uid == userId;
    }

    // Admin only
    match /ministries/{ministryId} {
      allow read: if true;
      allow write: if request.auth != null &&
                      request.auth.token.admin == true;
    }
  }
}
```

#### Regles Storage

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Documents publics (read only)
    match /documents/{document} {
      allow read: if true;
      allow write: if request.auth != null &&
                      request.auth.token.admin == true;
    }

    // Uploads utilisateurs (authenticated)
    match /uploads/{userId}/{fileName} {
      allow read, write: if request.auth != null &&
                            request.auth.uid == userId;
      allow read: if request.auth.token.admin == true;
    }

    // Validation taille et type
    match /uploads/{userId}/{fileName} {
      allow write: if request.resource.size < 10 * 1024 * 1024 && // 10MB max
                      request.resource.contentType.matches('image/.*|application/pdf');
    }
  }
}
```

---

## 8. COMMANDES ESSENTIELLES

### 8.1 Configuration

```bash
# Login Firebase
firebase login

# Logout
firebase logout

# Login CI/CD (genere token)
firebase login:ci

# Init projet
firebase init

# Lister projets
firebase projects:list

# Selectionner projet
firebase use <project_id>

# Ajouter alias
firebase use --add

# Config courante
firebase projects:list
```

### 8.2 Deploiement

```bash
# Deploiement complet
firebase deploy

# Services specifiques
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# Targets specifiques
firebase deploy --only hosting:frontend
firebase deploy --only hosting:admin

# Avec message
firebase deploy -m "Deploy message here"

# Preview avant deploy
firebase deploy --preview

# Dry run (test sans deployer)
firebase deploy --debug --dry-run
```

### 8.3 Hosting

```bash
# Lister sites
firebase hosting:sites:list

# Creer site
firebase hosting:sites:create <site_name>

# Supprimer site
firebase hosting:sites:delete <site_name>

# Ajouter domaine personnalise
firebase hosting:sites:domain:add <domain> --site <site_name>

# Lister domaines
firebase hosting:sites:domain:list --site <site_name>

# Lister deployments
firebase hosting:deployments:list

# Rollback
firebase hosting:rollback --site <site_name>

# Preview channels
firebase hosting:channel:deploy <channel_id>
firebase hosting:channel:delete <channel_id>
firebase hosting:channel:list
```

### 8.4 Functions

```bash
# Lister functions
firebase functions:list

# Logs en temps reel
firebase functions:log

# Logs function specifique
firebase functions:log --only <function_name>

# Supprimer function
firebase functions:delete <function_name>

# Config environment
firebase functions:config:set someservice.key="THE API KEY"
firebase functions:config:get
firebase functions:config:unset someservice.key
```

### 8.5 Firestore

```bash
# Exporter donnees
gcloud firestore export gs://taxasge-prod-backup/$(date +%Y%m%d)

# Importer donnees
gcloud firestore import gs://taxasge-prod-backup/20250930

# Supprimer collection
firebase firestore:delete <collection_path> --recursive

# Lister indexes
firebase firestore:indexes

# Deployer rules
firebase deploy --only firestore:rules

# Deployer indexes
firebase deploy --only firestore:indexes
```

### 8.6 Emulators

```bash
# Demarrer tous emulators
firebase emulators:start

# Emulators specifiques
firebase emulators:start --only functions,firestore,hosting

# Avec import donnees
firebase emulators:start --import=./firebase-data

# Export donnees
firebase emulators:export ./firebase-data

# UI emulators
# Ouvre automatiquement http://localhost:4000
```

### 8.7 Debugging

```bash
# Deploy avec debug
firebase deploy --debug

# Logs detailles
firebase functions:log --lines 100

# Shell functions (test local)
firebase functions:shell

# Test function specifique
firebase experimental:functions:shell
# Puis dans shell:
# myFunction({data: 'test'})

# Monitoring
gcloud logging read "resource.type=cloud_function" --limit 50
```

### 8.8 Gcloud (Advanced)

```bash
# List functions
gcloud functions list --project taxasge-prod

# Describe function
gcloud functions describe <function_name>

# Call function (test)
gcloud functions call <function_name> --data '{"key":"value"}'

# Update function
gcloud functions deploy <function_name> \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated

# Delete function
gcloud functions delete <function_name>

# Logs
gcloud functions logs read <function_name> --limit 50

# Metrics
gcloud monitoring time-series list \
  --filter='metric.type="cloudfunctions.googleapis.com/function/execution_count"'
```

---

## CONCLUSION

Ce guide couvre tous les aspects du deploiement Firebase pour TaxasGE, de la configuration initiale a la production en passant par le monitoring et le troubleshooting.

### Points Cles a Retenir

1. **Architecture Multi-Domaines**: Solution recommandee pour securite et scalabilite maximales
2. **Pas de Ports Distincts**: Firebase Hosting supporte uniquement port 443 (HTTPS)
3. **Environments Separes**: Development, Staging, Production avec configs distinctes
4. **CI/CD Integration**: GitHub Actions pour deployments automatiques
5. **Monitoring Complet**: Analytics, Performance, Logs centralises
6. **Couts Maitises**: ~$45-115/mois pour architecture professionnelle complete
7. **Securite Renforcee**: CORS, regles Firestore/Storage, JWT tokens
8. **Rollback Facile**: Retour version precedente en une commande

### Prochaines Etapes

1. **Remplacer les cles placeholder** dans tous les fichiers de configuration
2. **Configurer les services Firebase** via la console web:
   - Authentication (methodes de connexion)
   - Firestore (regles de securite)
   - Storage (regles de stockage)
   - Functions (variables d'environnement)
3. **Tester le deploiement** avec `yarn deploy`
4. **Configurer les domaines personnalises** pour la production
5. **Activer monitoring et alertes**
6. **Former l'equipe** aux procedures de deploiement

### Support et Ressources

- **Documentation Firebase**: https://firebase.google.com/docs
- **Support TaxasGE**: kouemou.sah@gmail.com
- **Issues GitHub**: https://github.com/KouemouSah/taxasge/issues
- **Console Firebase**: https://console.firebase.google.com

---

**Document genere le**: 30 septembre 2025
**Version**: 1.0
**Derniere mise a jour**: 30 septembre 2025