# PHASE 6 - MIGRATION ARCHITECTURALE PROFESSIONNELLE

**Date Début**: 2025-11-20
**Statut Global**: 🔄 EN COURS
**Approche**: Migration incrémentale sécurisée avec rollback

---

## 📋 VUE D'ENSEMBLE

### Objectif Principal
Migrer vers une architecture backend modulaire complète et professionnelle sans interruption de service, avec déploiement Cloud Run optimisé.

### Principes Directeurs
- ✅ **Zéro Downtime**: Migration progressive sans interruption
- ✅ **Rollback Immédiat**: Chaque phase peut être annulée
- ✅ **Tests Systématiques**: Couverture tests avant migration
- ✅ **Documentation Continue**: Mise à jour au fur et à mesure
- ✅ **Validation Métier**: Tests fonctionnels à chaque étape

### Stratégie de Migration
```
Phase 1: Audit & Inventaire (2 jours)
    ↓
Phase 2: Refactoring Routes Existantes (5 jours)
    ↓
Phase 3: Modules Manquants (10 jours)
    ↓
Phase 4: API Gateway (3 jours)
    ↓
Phase 5: Frontend Alignment (5 jours)
    ↓
Phase 6: Cloud Run Migration (5 jours)
    ↓
Phase 7: Validation & Production (3 jours)
```

**Durée Totale Estimée**: 33 jours ouvrés (~6.5 semaines)

---

## 🎯 PHASE 1: AUDIT & INVENTAIRE COMPLET

**Durée**: 2 jours
**Statut**: 🔄 EN COURS

### Objectifs
- [x] Analyser architecture backend actuelle
- [ ] Inventorier tous les modules existants
- [ ] Identifier modules manquants basés sur DATABASE_SCHEMA
- [ ] Mapper routes actuelles vs routes optimales
- [ ] Identifier incohérences et duplications
- [ ] Établir matrice de dépendances

### Tâches Détaillées

#### T1.1: Inventaire Modules Backend Existants ⏳
**Fichiers à analyser**:
- [x] `app/modules/auth/` - Module authentification
- [x] `app/modules/users/` - Module gestion utilisateurs
- [x] `app/modules/admin/` - Module administration
- [x] `app/modules/documents/` - Module documents + OCR
- [x] `app/modules/permissions/` - Module permissions/rôles
- [x] `app/modules/assignment/` - Module assignations

**Résultat Inventaire**:
```
Modules Existants (6):
✅ auth          - Authentification (JWT, 2FA, sessions)
✅ users         - Profil utilisateur self-service
✅ admin         - Administration système
✅ documents     - Documents + OCR + extractors
✅ permissions   - Permissions & rôles RBAC
✅ assignment    - Assignations déclarations agents
```

#### T1.2: Inventaire Routes Legacy (api/v1/) ⏳
**Fichiers legacy**:
- [ ] `api/v1/auth.py` - ⚠️ Doublon avec modules/auth
- [ ] `api/v1/users.py` - ⚠️ Doublon avec modules/users
- [ ] `api/v1/admin.py` - ⚠️ Doublon avec modules/admin
- [ ] `api/v1/documents.py` - ⚠️ Doublon avec modules/documents
- [ ] `api/v1/declarations.py` - ❌ Pas de module équivalent
- [ ] `api/v1/payments.py` - ❌ Pas de module équivalent
- [ ] `api/v1/fiscal_services.py` - ❌ Pas de module équivalent
- [ ] `api/v1/taxes.py` - ❌ Pas de module équivalent
- [ ] `api/v1/files.py` - ❌ Pas de module équivalent
- [ ] `api/v1/homepage.py` - ❌ Pas de module équivalent
- [ ] `api/v1/two_factor.py` - ⚠️ Intégré dans auth module
- [ ] `api/v1/ai.py` - ❌ Pas de module équivalent
- [ ] `api/v1/ai_services.py` - ❌ Pas de module équivalent

**Actions Requises**:
- ⚠️ **Doublons**: Supprimer après migration complète vers modules
- ❌ **Manquants**: Créer modules équivalents

#### T1.3: Analyse Database Schema (65 tables) 📊
**Basé sur**: `.github/docs-internal/database/DATABASE_SCHEMA_REFERENCE.md`

**Modules à Créer** (identifiés depuis DB):
1. **declarations** - tax_declarations, declaration_*_details
2. **payments** - payments, payment_plans, payment_installments
3. **fiscal_services** - fiscal_services, fiscal_service_data
4. **webhooks** - bank_configurations, bank_transactions
5. **agents** - ministry_agents, agent_work_queue, agent_workloads
6. **notifications** - (table absente, mais logique métier nécessaire)
7. **analytics** - (table absente, mais logique métier nécessaire)
8. **audits** - audit_logs, permission_audit_log
9. **translations** - translations, entity_translations
10. **procedures** - procedure_templates, procedure_template_steps
11. **companies** - companies, user_company_roles

#### T1.4: Analyse Documentation Rapports ✅
**Fichiers analysés**:
- [x] RAPPORT_PRIORITE_1_COMPLETE.md (Webhooks, Payments, Declarations)
- [x] RAPPORT_PRIORITE_2_COMPLETE.md (Documents, Agents, Admin, Users, Fiscal Services)
- [x] RAPPORT_PRIORITE_3_COMPLETE.md (Notifications, Analytics, Audits)

**Endpoints Documentés**:
- Priorité 1: 53 endpoints (CRITIQUE)
- Priorité 2: 99 endpoints (HAUTE)
- Priorité 3: 42 endpoints (MOYENNE)
- **Total**: 194 endpoints à implémenter/vérifier

#### T1.5: Matrice de Dépendances 🔗
```
auth
  ↓
users → permissions
  ↓         ↓
documents   admin
  ↓         ↓
declarations → payments → webhooks
  ↓              ↓
agents      fiscal_services
  ↓
analytics → audits
```

**Dépendances Critiques**:
- `auth` requis par TOUS les modules
- `permissions` requis par admin, agents, declarations
- `payments` requis par declarations, fiscal_services
- `webhooks` requis par payments

### Livrables Phase 1
- [x] Inventaire complet modules existants
- [ ] Liste modules à créer (11 modules identifiés)
- [ ] Matrice routes actuelles vs optimales
- [ ] Liste doublons à supprimer
- [ ] Ordre de migration recommandé

---

## 🎯 PHASE 2: REFACTORING ROUTES EXISTANTES

**Durée**: 5 jours
**Statut**: ⏸️ EN ATTENTE

### Objectifs
- [ ] Standardiser toutes les routes modules existants
- [ ] Corriger incohérences de nommage
- [ ] Aligner avec conventions REST professionnelles
- [ ] Mettre à jour endpoints.ts
- [ ] Tests de non-régression

### Modules à Refactorer

#### M2.1: Module AUTH (1 jour)
**Routes Actuelles**:
- [ ] `/api/v1/auth/login` → ✅ OK
- [ ] `/api/v1/auth/register` → ✅ OK
- [ ] `/api/v1/auth/2fa/*` → ⚠️ Restructurer

**Routes Optimisées**:
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/request-verification-code
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/{id}
POST   /api/v1/auth/2fa/setup
POST   /api/v1/auth/2fa/enable
POST   /api/v1/auth/2fa/verify
POST   /api/v1/auth/2fa/disable
```

**Checklist**:
- [ ] Créer tests unitaires routes auth
- [ ] Refactorer routes 2FA dans auth module
- [ ] Supprimer `api/v1/two_factor.py` legacy
- [ ] Mettre à jour `shared/constants/endpoints.ts`
- [ ] Tests d'intégration auth complet
- [ ] Documentation OpenAPI/Swagger

#### M2.2: Module USERS (1 jour)
**Routes Actuelles**:
- [ ] `/api/v1/users/profile` → ✅ OK (self-service)
- [ ] `/api/v1/admin/users/*` → ✅ OK (admin CRUD)

**Vérifications**:
- [ ] Séparation claire users vs admin
- [ ] Permissions correctes (self-service vs admin)
- [ ] Tests endpoints users
- [ ] Mise à jour endpoints.ts

#### M2.3: Module ADMIN (0.5 jour)
**Routes Actuelles**:
- [ ] `/api/v1/admin/users/*` → ✅ OK
- [ ] `/api/v1/admin/diagnostic/*` → ✅ OK
- [ ] `/api/v1/admin/migrate/*` → ✅ OK

**Vérifications**:
- [ ] Tous endpoints protégés par @require_admin
- [ ] Tests permissions admin
- [ ] Documentation admin API

#### M2.4: Module DOCUMENTS (1 jour)
**Routes Actuelles**: (14 endpoints déjà migrés)
- [ ] `/api/v1/documents/*` → ✅ Déjà modulaire

**Optimisations**:
- [ ] Vérifier extractors/mappers/templates intégrés
- [ ] Tests OCR pipeline complet
- [ ] Tests extraction templates
- [ ] Performance tests (upload bulk)

#### M2.5: Module PERMISSIONS (0.5 jour)
**Routes Actuelles**:
- [ ] `/api/v1/permissions/*` → ✅ OK
- [ ] `/api/v1/roles/*` → ✅ OK
- [ ] `/api/v1/user-permissions/*` → ✅ OK

**Vérifications**:
- [ ] Tests RBAC complet
- [ ] Audit trail permissions
- [ ] Documentation modèle permissions

#### M2.6: Module ASSIGNMENT (1 jour)
**Routes Actuelles**:
- [ ] Routes assignment → ⚠️ À vérifier

**À Implémenter**:
- [ ] `/api/v1/assignments/*`
- [ ] `/api/v1/supervisors/*`
- [ ] Tests workflow assignation
- [ ] Documentation processus

### Livrables Phase 2
- [ ] 6 modules existants refactorés
- [ ] Tests unitaires/intégration complets
- [ ] Documentation API mise à jour
- [ ] Endpoints.ts synchronisé
- [ ] Rapport non-régression

---

## 🎯 PHASE 3: CRÉATION MODULES MANQUANTS

**Durée**: 10 jours
**Statut**: ⏸️ EN ATTENTE

### Modules à Créer (par ordre de priorité)

#### M3.1: Module DECLARATIONS (2 jours) 🔴 CRITIQUE
**Basé sur**: RAPPORT_PRIORITE_1, tax_declarations table

**Structure**:
```
app/modules/declarations/
├── api/
│   └── declaration_routes.py (25 endpoints)
├── models/
│   ├── declaration.py
│   ├── declaration_iva.py
│   ├── declaration_irpf.py
│   └── declaration_petroliferos.py
├── repositories/
│   └── declaration_repository.py
└── services/
    └── declaration_service.py
```

**Endpoints Principaux** (25):
```
POST   /api/v1/declarations/create
POST   /api/v1/declarations/{id}/submit
GET    /api/v1/declarations/{id}
GET    /api/v1/declarations/list
PUT    /api/v1/declarations/{id}
DELETE /api/v1/declarations/{id}
POST   /api/v1/declarations/{id}/validate
POST   /api/v1/declarations/{id}/correct
POST   /api/v1/declarations/{id}/cancel
GET    /api/v1/declarations/{id}/history
POST   /api/v1/declarations/{id}/documents
GET    /api/v1/declarations/stats
POST   /api/v1/declarations/search
POST   /api/v1/declarations/bulk-import
GET    /api/v1/declarations/templates
... (10 endpoints additionnels)
```

**Checklist**:
- [ ] Créer structure module
- [ ] Migrer `api/v1/declarations.py` vers module
- [ ] Implémenter models Pydantic (5 types déclarations)
- [ ] Repository avec support 5 tables détails
- [ ] Services métier (validation, calculs)
- [ ] Tests unitaires
- [ ] Tests intégration
- [ ] Documentation OpenAPI

#### M3.2: Module PAYMENTS (2 jours) 🔴 CRITIQUE
**Basé sur**: RAPPORT_PRIORITE_1, payments table

**Structure**:
```
app/modules/payments/
├── api/
│   └── payment_routes.py (18 endpoints)
├── models/
│   ├── payment.py
│   ├── payment_plan.py
│   └── payment_installment.py
├── repositories/
│   └── payment_repository.py
└── services/
    ├── payment_service.py
    └── bange_integration.py
```

**Endpoints Principaux** (18):
```
POST   /api/v1/payments/create
POST   /api/v1/payments/{id}/process
GET    /api/v1/payments/{id}
GET    /api/v1/payments/list
GET    /api/v1/payments/{id}/receipt
POST   /api/v1/payments/{id}/verify
POST   /api/v1/payments/{id}/cancel
POST   /api/v1/payments/{id}/refund
GET    /api/v1/payments/methods
GET    /api/v1/payments/stats
POST   /api/v1/payments/search
GET    /api/v1/payments/reconciliation
POST   /api/v1/payments/reconciliation/generate
... (5 endpoints additionnels)
```

**Checklist**:
- [ ] Créer structure module
- [ ] Migrer `api/v1/payments.py` vers module
- [ ] Implémenter integration BANGE API
- [ ] Models payment + plans + installments
- [ ] Repository avec polymorphisme
- [ ] Service réconciliation comptable
- [ ] Tests unitaires
- [ ] Tests intégration BANGE (mocked)
- [ ] Documentation OpenAPI

#### M3.3: Module WEBHOOKS (1.5 jours) 🔴 CRITIQUE
**Basé sur**: RAPPORT_PRIORITE_1

**Structure**:
```
app/modules/webhooks/
├── api/
│   └── webhook_routes.py (10 endpoints)
├── models/
│   └── webhook_event.py
├── repositories/
│   └── webhook_repository.py
└── services/
    ├── webhook_processor.py
    └── signature_validator.py
```

**Endpoints Principaux** (10):
```
POST   /webhooks/bange (signature HMAC-SHA256)
POST   /webhooks/bange/verify
POST   /webhooks/supabase
GET    /webhooks/events
GET    /webhooks/events/{id}
POST   /webhooks/events/{id}/retry
POST   /webhooks/subscriptions
GET    /webhooks/subscriptions
DELETE /webhooks/subscriptions/{id}
```

**Checklist**:
- [ ] Créer structure module
- [ ] Implémenter vérification signature HMAC
- [ ] Idempotence (retry handling)
- [ ] Queue async processing
- [ ] Integration payments module
- [ ] Tests signature validation
- [ ] Tests idempotence
- [ ] Documentation webhooks BANGE

#### M3.4: Module FISCAL_SERVICES (1.5 jours) 🟡 HAUTE
**Basé on**: RAPPORT_PRIORITE_2, fiscal_services table

**Structure**:
```
app/modules/fiscal_services/
├── api/
│   └── fiscal_service_routes.py (12 endpoints)
├── models/
│   └── fiscal_service.py
├── repositories/
│   └── fiscal_service_repository.py
└── services/
    └── search_service.py
```

**Endpoints Principaux** (12):
```
GET    /api/v1/fiscal-services
GET    /api/v1/fiscal-services/{id}
POST   /api/v1/fiscal-services/search
GET    /api/v1/fiscal-services/popular
GET    /api/v1/fiscal-services/recent
GET    /api/v1/fiscal-services/{id}/calculate
POST   /api/v1/admin/fiscal-services
PUT    /api/v1/admin/fiscal-services/{id}
DELETE /api/v1/admin/fiscal-services/{id}
... (3 endpoints additionnels)
```

**Checklist**:
- [ ] Créer structure module
- [ ] Migrer `api/v1/fiscal_services.py`
- [ ] Search service (850 services)
- [ ] Calcul automatique montants
- [ ] Templates extraction OCR
- [ ] Tests unitaires
- [ ] Documentation OpenAPI

#### M3.5: Module AGENTS (1.5 jours) 🟡 HAUTE
**Basé sur**: RAPPORT_PRIORITE_2, ministry_agents table

**Structure**:
```
app/modules/agents/
├── api/
│   └── agent_routes.py (20 endpoints)
├── models/
│   ├── agent.py
│   └── work_queue.py
├── repositories/
│   └── agent_repository.py
└── services/
    ├── assignment_service.py
    └── queue_service.py
```

**Endpoints Principaux** (20):
```
GET    /api/v1/agents/queue
POST   /api/v1/agents/queue/{id}/claim
POST   /api/v1/agents/{id}/action
GET    /api/v1/agents/workload
GET    /api/v1/agents/performance
... (15 endpoints additionnels)
```

**Checklist**:
- [ ] Créer structure module
- [ ] Work queue avec priorités
- [ ] Load balancing automatique
- [ ] SLA tracking
- [ ] Performance metrics
- [ ] Tests workflow complet
- [ ] Documentation processus agent

#### M3.6: Module NOTIFICATIONS (1 jour) 🟢 MOYENNE
**Basé sur**: RAPPORT_PRIORITE_3

**Structure**:
```
app/modules/notifications/
├── api/
│   └── notification_routes.py (15 endpoints)
├── models/
│   └── notification.py
├── repositories/
│   └── notification_repository.py
└── services/
    ├── notification_service.py
    └── channel_providers.py (Email, SMS, Push)
```

**Endpoints Principaux** (15):
```
POST   /api/v1/notifications/send
GET    /api/v1/notifications
PATCH  /api/v1/notifications/{id}/read
PATCH  /api/v1/notifications/preferences
POST   /api/v1/admin/notifications/broadcast
... (10 endpoints additionnels)
```

**Checklist**:
- [ ] Créer structure module
- [ ] Multi-canal (Email, SMS, Push, In-App)
- [ ] Templates Jinja2
- [ ] Preferences utilisateur
- [ ] Retry logic
- [ ] Tests delivery
- [ ] Documentation canaux

#### M3.7: Module ANALYTICS (0.5 jour) 🟢 MOYENNE
**Basé sur**: RAPPORT_PRIORITE_3

**Structure**:
```
app/modules/analytics/
├── api/
│   └── analytics_routes.py (15 endpoints)
└── services/
    └── analytics_service.py
```

**Endpoints Principaux** (15):
```
GET    /api/v1/analytics/dashboard
GET    /api/v1/analytics/revenue
GET    /api/v1/analytics/declarations
GET    /api/v1/analytics/users
POST   /api/v1/analytics/custom-query
... (10 endpoints additionnels)
```

**Checklist**:
- [ ] Créer structure module
- [ ] Agrégations temps réel
- [ ] Exports CSV/Excel
- [ ] Custom queries
- [ ] Tests performance
- [ ] Documentation KPIs

#### M3.8: Module AUDITS (0.5 jour) 🟢 MOYENNE
**Basé sur**: RAPPORT_PRIORITE_3, audit_logs table

**Structure**:
```
app/modules/audits/
├── api/
│   └── audit_routes.py (12 endpoints)
├── models/
│   └── audit_log.py
└── repositories/
    └── audit_repository.py
```

**Endpoints Principaux** (12):
```
GET    /api/v1/audits/logs
GET    /api/v1/audits/logs/{id}
POST   /api/v1/audits/search
GET    /api/v1/audits/stats
GET    /api/v1/audits/compliance-report
... (7 endpoints additionnels)
```

**Checklist**:
- [ ] Créer structure module
- [ ] Logging automatique actions critiques
- [ ] Compliance GDPR
- [ ] Retention policies
- [ ] Tests audit trail
- [ ] Documentation compliance

### Livrables Phase 3
- [ ] 8 nouveaux modules créés
- [ ] ~120 nouveaux endpoints implémentés
- [ ] Tests complets (unitaires + intégration)
- [ ] Documentation OpenAPI complète
- [ ] Endpoints.ts mis à jour

---

## 🎯 PHASE 4: API GATEWAY CENTRALISÉ

**Durée**: 3 jours
**Statut**: ⏸️ EN ATTENTE

### Objectif
Créer un API Gateway professionnel pour routing centralisé, rate limiting, monitoring.

### Architecture Gateway

```
app/gateway/
├── __init__.py
├── router.py           # Router centralisé
├── middleware/
│   ├── rate_limiter.py
│   ├── auth_validator.py
│   └── request_logger.py
├── versioning.py       # API versioning
└── monitoring.py       # Metrics & health
```

### Fonctionnalités

#### G4.1: Router Centralisé (1 jour)
**Features**:
- [ ] Registration automatique modules
- [ ] Versioning API (v1, v2)
- [ ] Route prefixing standardisé
- [ ] OpenAPI/Swagger auto-generation

**Implémentation**:
```python
# app/gateway/router.py
from fastapi import APIRouter

class GatewayRouter:
    def __init__(self):
        self.router = APIRouter()
        self.modules = {}

    def register_module(self, name, router, prefix, version="v1"):
        self.modules[name] = {
            "router": router,
            "prefix": f"/api/{version}/{prefix}",
            "version": version
        }
```

**Checklist**:
- [ ] Créer GatewayRouter class
- [ ] Auto-discovery modules
- [ ] Version management
- [ ] Tests routing

#### G4.2: Rate Limiting & Security (1 jour)
**Features**:
- [ ] Rate limiting par endpoint
- [ ] Rate limiting par user/IP
- [ ] CORS configuration
- [ ] Security headers

**Implémentation**:
- [ ] Redis-based rate limiter
- [ ] Configurable limits per endpoint
- [ ] Burst allowance
- [ ] Tests rate limiting

#### G4.3: Monitoring & Observability (1 jour)
**Features**:
- [ ] Prometheus metrics
- [ ] Request/Response logging
- [ ] Performance metrics
- [ ] Health checks

**Checklist**:
- [ ] Metrics collection
- [ ] Logging middleware
- [ ] Health check endpoints
- [ ] Grafana dashboards

### Livrables Phase 4
- [ ] API Gateway complet
- [ ] Rate limiting fonctionnel
- [ ] Monitoring en place
- [ ] Documentation gateway

---

## 🎯 PHASE 5: FRONTEND ALIGNMENT

**Durée**: 5 jours
**Statut**: ⏸️ EN ATTENTE

### Objectifs
- [ ] Créer clients API TypeScript pour tous modules
- [ ] Synchroniser endpoints.ts
- [ ] Implémenter types TypeScript
- [ ] Tests frontend-backend integration

### Tâches

#### F5.1: Création API Clients (3 jours)
**Fichiers à créer** (dans `packages/web/lib/api/`):
- [ ] `declarationsApi.ts` (25 methods)
- [ ] `paymentsApi.ts` (18 methods)
- [ ] `webhooksApi.ts` (admin only)
- [ ] `fiscalServicesApi.ts` (12 methods)
- [ ] `agentsApi.ts` (20 methods)
- [ ] `notificationsApi.ts` (15 methods)
- [ ] `analyticsApi.ts` (15 methods)
- [ ] `auditsApi.ts` (12 methods)

**Pattern**:
```typescript
// declarationsApi.ts
export const declarationsApi = {
  create: async (data: DeclarationCreate) => {
    return client.post(ENDPOINTS.DECLARATIONS.CREATE, data);
  },
  // ... autres méthodes
};
```

**Checklist**:
- [ ] Créer 8 API clients
- [ ] Intercepteurs auth
- [ ] Error handling
- [ ] Types TypeScript
- [ ] Tests unitaires

#### F5.2: Mise à jour endpoints.ts (1 jour)
**Fichier**: `packages/shared/constants/endpoints.ts`

**Sections à ajouter**:
- [ ] DECLARATIONS (25 endpoints)
- [ ] PAYMENTS (18 endpoints)
- [ ] WEBHOOKS (10 endpoints)
- [ ] FISCAL_SERVICES (12 endpoints)
- [ ] AGENTS (20 endpoints)
- [ ] NOTIFICATIONS (15 endpoints)
- [ ] ANALYTICS (15 endpoints)
- [ ] AUDITS (12 endpoints)

**Checklist**:
- [ ] Ajouter ~130 nouveaux endpoints
- [ ] Vérifier cohérence naming
- [ ] Helper functions
- [ ] Documentation

#### F5.3: Types TypeScript (1 jour)
**Fichier**: `packages/shared/types/api.ts`

**Types à créer**:
```typescript
// Declarations
export interface Declaration { ... }
export interface DeclarationCreate { ... }
export interface DeclarationIVA { ... }

// Payments
export interface Payment { ... }
export interface PaymentPlan { ... }

// ... ~50 interfaces
```

**Checklist**:
- [ ] Créer ~50 interfaces
- [ ] Sync avec backend Pydantic models
- [ ] Exports centralisés
- [ ] Documentation

### Livrables Phase 5
- [ ] 8 API clients TypeScript
- [ ] endpoints.ts complet (~250 endpoints)
- [ ] Types TypeScript complets
- [ ] Tests frontend-backend

---

## 🎯 PHASE 6: CLOUD RUN MIGRATION

**Durée**: 5 jours
**Statut**: ⏸️ EN ATTENTE

### Architecture Cible

```
┌─────────────────────────────────────────┐
│   Cloud Load Balancer                    │
│   taxasge.emacsah.com                   │
└──────────┬───────────────┬──────────────┘
           │               │
    ┌──────▼──────┐ ┌─────▼──────┐
    │  Backend     │ │  Frontend   │
    │ Cloud Run    │ │ Cloud Run   │
    │  Service     │ │  Service    │
    └──────────────┘ └─────────────┘
```

### Tâches

#### CR6.1: Backend Cloud Run (2 jours)
**Fichiers à créer**:
- [ ] `Dockerfile.backend`
- [ ] `.dockerignore`
- [ ] `cloudbuild.backend.yaml`
- [ ] `cloudrun.backend.yaml`

**Configuration**:
```yaml
# cloudrun.backend.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: taxasge-backend
spec:
  template:
    spec:
      containers:
      - image: gcr.io/PROJECT_ID/taxasge-backend
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-url
        resources:
          limits:
            memory: 2Gi
            cpu: 2
```

**Checklist**:
- [ ] Dockerfile optimisé (multi-stage)
- [ ] Health check endpoint
- [ ] Secrets management
- [ ] Auto-scaling config
- [ ] Tests local Docker
- [ ] Déploiement staging
- [ ] Validation production

#### CR6.2: Frontend Cloud Run (2 jours)
**Fichiers à créer**:
- [ ] `Dockerfile.frontend`
- [ ] `cloudbuild.frontend.yaml`
- [ ] `cloudrun.frontend.yaml`
- [ ] `nginx.conf` (pour serving statique)

**Configuration Next.js**:
- [ ] Build optimisé (standalone)
- [ ] Environment variables
- [ ] CDN configuration
- [ ] Cache headers

**Checklist**:
- [ ] Dockerfile Next.js
- [ ] Static export config
- [ ] CDN setup
- [ ] Tests local Docker
- [ ] Déploiement staging
- [ ] Validation production

#### CR6.3: Load Balancer & DNS (1 jour)
**GCP Resources**:
- [ ] Load Balancer configuration
- [ ] Backend service (Cloud Run backend)
- [ ] Frontend service (Cloud Run frontend)
- [ ] SSL certificate
- [ ] DNS mapping (taxasge.emacsah.com)

**Routing Rules**:
```
taxasge.emacsah.com/api/*  → Backend Cloud Run
taxasge.emacsah.com/*      → Frontend Cloud Run
```

**Checklist**:
- [ ] Créer Load Balancer
- [ ] SSL certificate auto-renew
- [ ] DNS A record
- [ ] Health checks
- [ ] Tests routing

### Livrables Phase 6
- [ ] Backend Cloud Run opérationnel
- [ ] Frontend Cloud Run opérationnel
- [ ] Load Balancer configuré
- [ ] DNS mapping complet
- [ ] SSL/HTTPS fonctionnel

---

## 🎯 PHASE 7: VALIDATION & PRODUCTION

**Durée**: 3 jours
**Statut**: ⏸️ EN ATTENTE

### Objectifs
- [ ] Tests end-to-end complets
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation finale
- [ ] Formation équipe
- [ ] Go-Live

### Tâches

#### V7.1: Tests E2E (1 jour)
**Scénarios critiques**:
- [ ] Auth flow complet (login, 2FA, logout)
- [ ] Declaration creation → payment → webhook
- [ ] Document upload → OCR → extraction
- [ ] Agent workflow complet
- [ ] Analytics queries
- [ ] Notification delivery

**Tools**:
- [ ] Playwright/Cypress
- [ ] API tests (Postman/Newman)
- [ ] Performance tests (Locust)

#### V7.2: Load Testing (1 jour)
**Scénarios**:
- [ ] 1000 users simultanés
- [ ] 100 declarations/min
- [ ] 50 uploads/min
- [ ] 500 API calls/sec

**Métriques cibles**:
- Latency P95 < 500ms
- Error rate < 0.1%
- Throughput > 1000 req/s

#### V7.3: Security Audit (0.5 jour)
**Vérifications**:
- [ ] OWASP Top 10
- [ ] SQL Injection
- [ ] XSS
- [ ] CSRF
- [ ] Authentication bypass
- [ ] Authorization bypass
- [ ] Secrets exposure

#### V7.4: Documentation Finale (0.5 jour)
**Documents**:
- [ ] Architecture diagram
- [ ] API documentation (OpenAPI)
- [ ] Deployment guide
- [ ] Runbook opérationnel
- [ ] Incident response plan
- [ ] Rollback procedures

### Livrables Phase 7
- [ ] Tests E2E passés
- [ ] Load tests validés
- [ ] Security audit complet
- [ ] Documentation complète
- [ ] Go-Live approval

---

## 📊 MÉTRIQUES GLOBALES

### Progression
```
Phase 1: Audit          [████░░] 80% (en cours)
Phase 2: Refactoring    [░░░░░░]  0%
Phase 3: Modules        [░░░░░░]  0%
Phase 4: Gateway        [░░░░░░]  0%
Phase 5: Frontend       [░░░░░░]  0%
Phase 6: Cloud Run      [░░░░░░]  0%
Phase 7: Validation     [░░░░░░]  0%
────────────────────────────────────
GLOBAL:                 [█░░░░░] 11%
```

### Modules Status
```
✅ Existants Refactorés:  0/6  (0%)
🆕 Nouveaux Créés:        0/8  (0%)
🔗 API Clients Frontend:  0/8  (0%)
📋 Endpoints Documentés:  0/250 (0%)
```

### Tests Coverage
```
Unitaires:     0%
Intégration:   0%
E2E:           0%
Performance:   0%
```

---

## 🎯 PROCHAINES ACTIONS

### Immédiat (Aujourd'hui)
1. ✅ Terminer inventaire complet modules
2. ⏳ Analyser routes legacy vs optimales
3. ⏳ Créer matrice dépendances
4. ⏳ Définir ordre migration optimal

### Cette Semaine
1. Commencer Phase 2: Refactoring AUTH
2. Tests unitaires AUTH
3. Refactoring USERS
4. Documentation progress

### Semaine Prochaine
1. Terminer Phase 2 (refactoring)
2. Démarrer Phase 3: Module DECLARATIONS
3. Module PAYMENTS
4. Module WEBHOOKS

---

## 📝 NOTES IMPORTANTES

### Décisions Architecturales
1. **Migration incrémentale** : Pas de big bang, module par module
2. **Rollback possible** : Chaque phase peut être annulée
3. **Tests systématiques** : Pas de merge sans tests
4. **Documentation continue** : Mise à jour au fur et à mesure

### Risques Identifiés
1. ⚠️ **Complexité migration** : 14 modules, ~250 endpoints
2. ⚠️ **Dépendances croisées** : Auth requis partout
3. ⚠️ **Tests insuffisants** : Coverage actuel faible
4. ⚠️ **Cloud Run migration** : Nouveau pour l'équipe

### Mitigations
1. ✅ Plan détaillé avec checkpoints
2. ✅ Tests automatisés obligatoires
3. ✅ Staging environment pour validation
4. ✅ Rollback procedures documentées

---

**Dernière mise à jour**: 2025-11-20 12:00
**Prochain checkpoint**: Phase 1 - T1.2 (Inventaire routes legacy)
