# PLAN D'ALIGNEMENT DASHBOARD TREASURY (TESORO)

**Date:** 2026-01-18
**Statut:** En cours d'analyse
**Criticité:** HAUTE (sécurité + intégrité financière)

---

## 📋 INVENTAIRE COMPLET

### 1. FRONTEND - Module Treasury

#### 1.1 Pages (13 fichiers)
| Page | Chemin | Statut |
|------|--------|--------|
| Dashboard principal | `/dashboard/agent/treasury/page.tsx` | ⚠️ Texte ES hardcodé |
| Validation paiements | `/dashboard/agent/treasury/validation/page.tsx` | ✅ Fonctionnel |
| Réconciliation | `/dashboard/agent/treasury/reconciliation/page.tsx` | ✅ Fonctionnel |
| Transactions | `/dashboard/agent/treasury/transactions/page.tsx` | ✅ Fonctionnel |
| Anomalies | `/dashboard/agent/treasury/anomalies/page.tsx` | ✅ Fonctionnel |
| Audit | `/dashboard/agent/treasury/audit/page.tsx` | ✅ Fonctionnel |
| Analytics | `/dashboard/agent/treasury/analytics/page.tsx` | ✅ Fonctionnel |
| Exports | `/dashboard/agent/treasury/exports/page.tsx` | ✅ Fonctionnel |
| Stats | `/dashboard/agent/treasury/stats/page.tsx` | ✅ Fonctionnel |
| SLA Stats | `/dashboard/agent/treasury/stats/sla/page.tsx` | ✅ Fonctionnel |
| Agent Stats | `/dashboard/agent/treasury/stats/agents/page.tsx` | ✅ Fonctionnel |
| Settings Banks | `/dashboard/agent/treasury/settings/banks/page.tsx` | ⚠️ Pas de contrôle permission |
| Settings Payment Methods | `/dashboard/agent/treasury/settings/payment-methods/page.tsx` | ⚠️ Pas de contrôle permission |

#### 1.2 Hooks (18 hooks)
```
usePendingPayments        usePaymentActions         useUnreconciledTransactions
useBankConfigurations     useTreasuryStats          usePaymentMethodConfigs
useAudit                  useSLAStats               useAnomalies
useExports                useKPIs                   useAnalytics
usePaymentAuditHistory    useCreateAnomaly          useUpdateAnomalyStatus
useAddAnomalyComment      useRunAnomalyDetection    useExploreAnalytics
```

#### 1.3 Composants (4 composants)
```
PaymentRejectionDialog.tsx    PaymentStatusBadge.tsx
PaymentValidationDialog.tsx   SLABadge.tsx
```

#### 1.4 Services API (~1060 lignes, 50+ endpoints)
- `packages/web/src/modules/treasury/services/api.ts`

---

### 2. BACKEND - Routes Treasury

#### 2.1 Endpoints dans `admin_routes.py`
| Endpoint | Méthode | Permission Backend | Permission Frontend |
|----------|---------|-------------------|---------------------|
| `/treasury/payments/pending` | GET | `treasury.validate_payment` | `payments.validate` |
| `/treasury/payments/{id}` | GET | `treasury.validate_payment` | `payments.validate` |
| `/treasury/payments/{id}/lock` | POST | `treasury.validate_payment` | `payments.validate` |
| `/treasury/payments/{id}/validate` | POST | `treasury.validate_payment` | `payments.validate` |
| `/treasury/payments/{id}/reject` | POST | `treasury.validate_payment` | `payments.validate` |
| `/treasury/payments/{id}/unlock` | POST | `treasury.validate_payment` | `payments.validate` |
| `/treasury/audit` | GET | `treasury_audit.view` | `audit.read` |
| `/treasury/payments/{id}/audit` | GET | `treasury_audit.view` | `audit.read` |
| `/treasury/stats/sla` | GET | `treasury_stat.view` | `reports.read` |
| `/treasury/stats/kpis` | GET | `treasury_stat.view` | `reports.read` |
| `/treasury/stats/agents` | GET | `treasury_stat.view` | `reports.read` |
| `/treasury/anomalies` | GET | `treasury_anomaly.view` | `anomalies.read` |
| `/treasury/anomalies/{id}` | GET | `treasury_anomaly.view` | `anomalies.read` |
| `/treasury/anomalies` | POST | `treasury_anomaly.create` | `anomalies.read` |
| `/treasury/anomalies/{id}/status` | PATCH | `treasury_anomaly.update` | `anomalies.read` |
| `/treasury/anomalies/detect` | POST | `treasury_anomaly.create` | `anomalies.read` |
| `/treasury/exports` | GET | `treasury_export.view` | `exports.create` |
| `/treasury/exports/templates` | GET | `treasury_export.view` | `exports.create` |
| `/treasury/exports/generate` | POST | `treasury_export.create` | `exports.create` |
| `/treasury/exports/{id}` | GET | `treasury_export.view` | `exports.create` |
| `/treasury/exports/{id}/download` | GET | `treasury_export.download` | `exports.create` |
| `/treasury/analytics/*` | GET | `treasury_stat.view` | `reports.read` |

#### 2.2 Services Backend
```
treasury_export_service.py      (1253 lignes) - Génération CSV/XLSX/PDF/XML
treasury_anomaly_service.py     (834 lignes)  - Détection 7 types d'anomalies
treasury_analytics.py           (943 lignes)  - Analytics pandas/scipy/sklearn
```

---

### 3. BASE DE DONNÉES

#### 3.1 Tables principales
| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `service_payments` | Paiements avec workflow agents | `payment_reference`, `total_amount`, `workflow_status`, `locked_by_agent_profile_id` |
| `bank_transactions` | Transactions bancaires (webhooks) | `bank_reference`, `amount`, `status`, `reconciled_at` |
| `bank_configurations` | Configuration intégrations bancaires | `bank_code`, `api_endpoint`, `treasury_account_number` |
| `payment_method_configurations` | Méthodes de paiement | `code`, `label_key`, `is_active`, `display_order` |
| `payment_anomalies` | Anomalies détectées | `anomaly_type`, `severity`, `status`, `affected_amount` |
| `treasury_exports` | Journal des exports | `export_type`, `file_path`, `status`, `total_amount` |
| `payment_validation_audit` | Audit trail validations | `action`, `from_status`, `to_status`, `agent_id` |
| `payment_lock_history` | Historique verrouillages | `payment_id`, `locked_by`, `locked_at` |

#### 3.2 Enums critiques
```sql
payment_workflow_status: submitted, auto_processing, auto_approved, pending_agent_review,
  locked_by_agent, agent_reviewing, requires_documents, docs_resubmitted, approved_by_agent,
  rejected_by_agent, escalated_supervisor, supervisor_reviewing, completed, cancelled_*, expired

anomaly_type_enum: amount_mismatch, duplicate_suspected, reconciliation_failed,
  validated_not_received, sla_breached, high_amount, suspicious_pattern, manual_flag,
  duplicate_payment, late_validation, orphan_transaction, reference_missing

anomaly_severity_enum: low, medium, high, critical
anomaly_status_enum: open, investigating, resolved, false_positive, escalated
```

---

### 4. PERMISSIONS - Analyse comparative

#### 4.1 Permissions Backend (treasury_permissions.py - 17 permissions)
```python
# Validation
treasury.validate_payment    treasury.reject_payment    treasury.view_payment    treasury.process_payment

# Audit
treasury_audit.view    treasury_audit.export

# Statistics
treasury_stat.view    treasury_stat.export

# Anomalies
treasury_anomaly.view    treasury_anomaly.create    treasury_anomaly.update    treasury_anomaly.resolve

# Exports
treasury_export.view    treasury_export.create    treasury_export.download

# Reconciliation
treasury.reconcile    treasury.view_reconciliation
```

#### 4.2 Permissions Frontend (entity-menus.ts)
```typescript
// TESORO_CONFIG
payments.validate      // ❌ MISMATCH → treasury.validate_payment
payments.reconcile     // ❌ MISMATCH → treasury.reconcile
payments.read          // ❌ MISMATCH → treasury.view_payment
reports.read           // ⚠️ GENERIC → treasury_stat.view
audit.read             // ❌ MISMATCH → treasury_audit.view
anomalies.read         // ❌ MISMATCH → treasury_anomaly.view
exports.create         // ❌ MISMATCH → treasury_export.create
banks.manage           // ❌ N'EXISTE PAS
payment_methods.manage // ❌ N'EXISTE PAS
settings.manage        // ❌ N'EXISTE PAS
```

---

## ⚠️ PROBLÈMES CRITIQUES IDENTIFIÉS

### P1. Désalignement Permissions (CRITIQUE - Sécurité)
- **Impact:** Les permissions frontend ne correspondent pas au backend
- **Risque:** Un agent pourrait voir des menus sans avoir les droits réels
- **Exemple:** `payments.validate` ≠ `treasury.validate_payment`

### P2. Absence de vérification d'entité (CRITIQUE - Sécurité)
- **Impact:** Tout agent authentifié peut accéder au dashboard treasury
- **Risque:** Fuite d'informations financières sensibles
- **Solution:** Vérifier `agent_profiles.ministry_id` → `ministries.code = 'TESORO'`

### P3. Texte espagnol hardcodé (MOYEN - UX)
- **Impact:** Interface non traduite sur page principale
- **Localisation:** `treasury/page.tsx` ligne ~150
- **Exemple:** "Pagos en espera de revision" au lieu de `t('stats.pendingDescription')`

### P4. Menu Settings visible à tous (MOYEN - Sécurité)
- **Impact:** Tous les agents voient le menu de configuration
- **Risque:** Tentatives d'accès non autorisées
- **Solution:** Permission `treasury.manage_settings` pour superviseurs

### P5. Stats retournent 0 (BAS - Fonctionnalité)
- **Impact:** `todayValidatedCount` et `todayValidatedAmount` toujours à 0
- **Cause:** Endpoint backend manquant
- **Solution:** Créer endpoint `/treasury/stats/today`

---

## 🏗️ ARCHITECTURE VISUELLE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DASHBOARD AGENT ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        ENTITY CONFIGS                                 │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │  │
│  │  │ WORKFLOW-BASED  │  │  MODULE-BASED   │  │    HYBRID       │      │  │
│  │  │ ─────────────── │  │ ─────────────── │  │ ─────────────── │      │  │
│  │  │ • CNEDOGE       │  │ • TESORO        │  │ • DGI (futur)   │      │  │
│  │  │ • DGT           │  │   workflows: [] │  │                 │      │  │
│  │  │ • ONRC          │  │   dataSource:   │  │                 │      │  │
│  │  │ • MINFP         │  │   service_      │  │                 │      │  │
│  │  │ • OFIVE         │  │   payments      │  │                 │      │  │
│  │  │ • EXTRANJERIA   │  │   module:       │  │                 │      │  │
│  │  │                 │  │   treasury      │  │                 │      │  │
│  │  │ dataSource:     │  │                 │  │                 │      │  │
│  │  │ service_        │  │                 │  │                 │      │  │
│  │  │ requests        │  │                 │  │                 │      │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│                                     ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     ENTITY DASHBOARD CONFIG                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │ interface EntityDashboardConfig {                               │ │  │
│  │  │   entityCode: EntityCode;                                       │ │  │
│  │  │   titleKey: string;                                             │ │  │
│  │  │   icon: LucideIcon;                                             │ │  │
│  │  │   basePath: string;                                             │ │  │
│  │  │   menuItems: MenuItem[];                                        │ │  │
│  │  │   workflows: WorkflowCode[];                                    │ │  │
│  │  │   // NEW FIELDS                                                 │ │  │
│  │  │   menuSource: 'workflow' | 'module';      ◄── NOUVEAU           │ │  │
│  │  │   modulePermissionPrefix?: string;         ◄── 'treasury'       │ │  │
│  │  │   dataSource?: 'service_requests' | 'service_payments' | ...;   │ │  │
│  │  │ }                                                               │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│                                     ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    PERMISSION MAPPING                                 │  │
│  │                                                                       │  │
│  │   Frontend MenuItem     →    Backend Permission                       │  │
│  │   ─────────────────────────────────────────────                      │  │
│  │   validation              →    treasury.validate_payment              │  │
│  │   reconciliation          →    treasury.reconcile                     │  │
│  │   transactions            →    treasury.view_payment                  │  │
│  │   audit                   →    treasury_audit.view                    │  │
│  │   anomalies               →    treasury_anomaly.view                  │  │
│  │   exports                 →    treasury_export.view                   │  │
│  │   stats/sla/analytics     →    treasury_stat.view                     │  │
│  │   settings/*              →    treasury.manage_settings (NEW)         │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│                                     ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    SECURITY LAYER                                     │  │
│  │                                                                       │  │
│  │   ┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐   │  │
│  │   │ Entity Check    │────▶│ Permission Check│────▶│ Menu Filter  │   │  │
│  │   │                 │     │                 │     │              │   │  │
│  │   │ agent_profile   │     │ user_permissions│     │ Visible      │   │  │
│  │   │ .ministry_id    │     │ role_permissions│     │ menu items   │   │  │
│  │   │ = TESORO        │     │                 │     │              │   │  │
│  │   └─────────────────┘     └─────────────────┘     └──────────────┘   │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📌 PLAN D'IMPLÉMENTATION DÉTAILLÉ

### PHASE 1: Alignement Permissions (Priorité: CRITIQUE)

#### 1.1 Mise à jour entity-menus.ts
- [ ] Remplacer `payments.validate` → `treasury.validate_payment`
- [ ] Remplacer `payments.reconcile` → `treasury.reconcile`
- [ ] Remplacer `payments.read` → `treasury.view_payment`
- [ ] Remplacer `audit.read` → `treasury_audit.view`
- [ ] Remplacer `anomalies.read` → `treasury_anomaly.view`
- [ ] Remplacer `exports.create` → `treasury_export.view`
- [ ] Remplacer `reports.read` → `treasury_stat.view`

#### 1.2 Ajouter permissions manquantes dans treasury_permissions.py
- [ ] Ajouter `treasury.manage_settings` pour Settings
- [ ] Ajouter dans ROLE_PERMISSIONS pour supervisor

#### 1.3 Mise à jour TESORO_CONFIG
```typescript
export const TESORO_CONFIG: EntityDashboardConfig = {
  entityCode: 'TESORO',
  menuSource: 'module',                    // NOUVEAU
  modulePermissionPrefix: 'treasury',       // NOUVEAU
  dataSource: 'service_payments',           // NOUVEAU
  // ... reste inchangé
};
```

---

### PHASE 2: Vérification Entité (Priorité: CRITIQUE)

#### 2.1 Middleware de vérification
- [ ] Créer hook `useEntityAccess(entityCode)`
- [ ] Vérifier dans GenericEntityDashboard
- [ ] Rediriger si non autorisé

#### 2.2 Backend - Route protection
- [ ] Ajouter vérification agent_profile dans routes treasury
- [ ] Vérifier ministry_id correspond à TESORO

---

### PHASE 3: Corrections Frontend (Priorité: MOYENNE)

#### 3.1 Traductions page principale
- [ ] Migrer tous les textes ES vers clés i18n
- [ ] Ajouter clés dans fr.json, en.json, es.json
- [ ] Vérifier utilisation de `t()` partout

#### 3.2 Menu Settings conditionnel
- [ ] Ajouter permission `treasury.manage_settings`
- [ ] Masquer si agent n'est pas supervisor
- [ ] Ajouter indicateur visuel "Supervisor only"

---

### PHASE 4: Endpoint Stats Today (Priorité: BASSE)

#### 4.1 Backend
- [ ] Créer endpoint GET `/treasury/stats/today`
- [ ] Retourner count et amount validés aujourd'hui
- [ ] Ajouter permission `treasury_stat.view`

#### 4.2 Frontend
- [ ] Modifier `getDashboardStats()` pour appeler nouvel endpoint
- [ ] Afficher vraies valeurs dans dashboard

---

### PHASE 5: Extension Type EntityDashboardConfig (Priorité: BASSE)

#### 5.1 Mise à jour types
```typescript
// types/index.ts
export interface EntityDashboardConfig {
  entityCode: EntityCode;
  titleKey: string;
  icon: LucideIcon;
  basePath: string;
  menuItems: MenuItem[];
  workflows: WorkflowCode[];
  description?: string;
  // NOUVEAUX CHAMPS
  menuSource?: 'workflow' | 'module';
  modulePermissionPrefix?: string;
  dataSource?: 'service_requests' | 'service_payments' | 'tax_declarations';
}
```

#### 5.2 Mise à jour logique sidebar
- [ ] Si `menuSource === 'module'`, utiliser `modulePermissionPrefix`
- [ ] Sinon, utiliser logique workflow actuelle

---

## ✅ CHECKLIST DE VALIDATION

### Sécurité
- [ ] Permissions frontend alignées avec backend
- [ ] Vérification entité agent implémentée
- [ ] Menu settings restreint aux supervisors
- [ ] Aucune route accessible sans permission

### Fonctionnalité
- [ ] Dashboard affiche vraies statistiques
- [ ] Tous les endpoints fonctionnels
- [ ] Navigation cohérente

### UX/i18n
- [ ] Zéro texte hardcodé
- [ ] Traductions ES/FR/EN complètes
- [ ] Messages d'erreur traduits

### Tests
- [ ] Tests unitaires permissions
- [ ] Tests E2E navigation
- [ ] Tests accès non autorisé

---

## 📊 ESTIMATION EFFORT

| Phase | Complexité | Fichiers impactés | Risque |
|-------|-----------|-------------------|--------|
| Phase 1 | Faible | 2-3 | Bas |
| Phase 2 | Moyenne | 4-5 | Moyen |
| Phase 3 | Faible | 4 | Bas |
| Phase 4 | Moyenne | 3 | Bas |
| Phase 5 | Faible | 2 | Bas |

**Total estimé:** ~15 fichiers, phases 1-2 prioritaires

---

## 🔗 FICHIERS CONCERNÉS

### Frontend
```
packages/web/src/modules/agent-dashboard/
├── config/entity-menus.ts          ◄── Permissions à aligner
├── types/index.ts                  ◄── Nouveaux champs
└── components/GenericEntityDashboard.tsx  ◄── Vérification entité

packages/web/src/app/[locale]/(dashboard)/dashboard/agent/treasury/
├── page.tsx                        ◄── Traductions
├── settings/banks/page.tsx         ◄── Permission check
└── settings/payment-methods/page.tsx ◄── Permission check

packages/web/src/modules/treasury/
├── services/api.ts                 ◄── Endpoint stats/today
└── hooks/useTreasuryStats.ts       ◄── Utiliser nouveau endpoint

packages/web/messages/
├── es.json                         ◄── Nouvelles clés
├── fr.json                         ◄── Nouvelles clés
└── en.json                         ◄── Nouvelles clés
```

### Backend
```
packages/backend/app/modules/
├── permissions/module_permissions/treasury_permissions.py ◄── Nouvelle permission
└── service_requests/api/admin_routes.py                   ◄── Nouveau endpoint
```

---

*Document généré par Claude Code - 2026-01-18*
