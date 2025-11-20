# PHASE 3 - PLAN D'IMPLÉMENTATION DÉTAILLÉ

**Date**: 2025-11-20
**Statut**: 🔄 EN COURS
**Approche**: Implémentation complète par ordre de dépendances

---

## 📊 ORDRE D'IMPLÉMENTATION (PAR DÉPENDANCES)

### Niveau 0 - Aucune dépendance
- ✅ AUTH (complet)
- ✅ USERS (complet)
- ✅ PERMISSIONS (complet)
- ⏸️ TRANSLATIONS (à créer - Priorité P3)
- ⏸️ SYSTEM (à créer - Priorité P4)

### Niveau 1 - Dépend de USERS
- ⚠️ **ADMIN** (à compléter - endpoints admin manquants)
- ⏸️ **COMPANIES** (à créer - requis par DECLARATIONS)
- ⏸️ **FISCAL_SERVICES** (à créer - 850 services, requis par DECLARATIONS)

### Niveau 2 - Dépend de Niveau 1
- ✅ DOCUMENTS (complet)
- ⏳ **DECLARATIONS** (MVP créé - à compléter avec tables détails)
- ⏸️ **PROCEDURES** (à créer)

### Niveau 3 - Dépend de DECLARATIONS
- ⏸️ **PAYMENTS** (à créer - CRITIQUE P1)
- ✅ ASSIGNMENT (existe - à enrichir)

### Niveau 4 - Dépend de PAYMENTS
- ⏸️ **WEBHOOKS** (à créer - CRITIQUE P1, callbacks BANGE)

### Niveau 5 - Dépend de ASSIGNMENTS
- ⏸️ **AGENTS** (à créer - workflow validation)
- ⏸️ **IMPORTS** (à créer - imports Excel)

---

## 🎯 MODULES PAR PRIORITÉ

### 🔴 P1 CRITIQUE (Cœur métier)
1. **DECLARATIONS** (⏳ MVP créé, à compléter)
   - 9 tables DB
   - 25 endpoints total
   - État: 6/25 endpoints implémentés (MVP)
   - À faire: Tables détails (IVA, IRPF, Pétrolifères, Retenciones, Other)

2. **PAYMENTS** (⏸️ À créer)
   - 7 tables DB
   - 18 endpoints
   - Intégration BANGE (mobile money)
   - Dépend de: DECLARATIONS

3. **WEBHOOKS** (⏸️ À créer)
   - 2 tables DB
   - 10 endpoints
   - Callbacks BANGE (confirmation paiements)
   - Dépend de: PAYMENTS

### 🟡 P2 HAUTE (Catalogue + Workflow)
4. **FISCAL_SERVICES** (⏸️ À créer)
   - 9 tables DB (850 services fiscaux)
   - 12 endpoints
   - Search + Calculate
   - Requis par: DECLARATIONS

5. **AGENTS** (⏸️ À créer)
   - 6 tables DB
   - 20 endpoints
   - Workflow validation agents
   - Dépend de: ASSIGNMENTS

### 🟢 P3 MOYENNE
6. **PROCEDURES** (⏸️ À créer)
   - 2 tables
   - 10 endpoints
   - Templates procédures

7. **IMPORTS** (⏸️ À créer)
   - 2 tables
   - 8 endpoints
   - Import Excel masse

8. **TRANSLATIONS** (⏸️ À créer)
   - 2 tables
   - 8 endpoints
   - Multilingue (ES/FR/EN)

### ⚪ P4 BASSE
9. **COMPANIES** (⏸️ À créer)
   - 2 tables
   - 10 endpoints
   - Gestion entreprises
   - Requis par: DECLARATIONS (pour business users)

10. **SYSTEM** (⏸️ À créer)
    - 3 tables
    - 8 endpoints
    - Règles métier + Audit logs

---

## 🔧 MODULE ADMIN - CORRECTIONS NÉCESSAIRES

### Problème Identifié
Le fichier `app/modules/admin/api/user_management_routes.py` contient:
- ✅ Endpoints ADMIN (CRUD users)
- ❌ Endpoints USER self-service (GET/PUT /profile) - **DOUBLON avec USERS module**

### Correction Requise
**Supprimer de user_management_routes.py**:
```python
@router.get("/profile")  # ❌ DOUBLON - existe dans users/api/user_routes.py
@router.put("/profile")  # ❌ DOUBLON - existe dans users/api/user_routes.py
@router.post("/password") # ❌ DOUBLON - existe dans auth/api/auth_routes.py
```

**Garder uniquement**:
```python
GET    /api/v1/admin/users         # List all users (admin)
POST   /api/v1/admin/users         # Create user (admin)
GET    /api/v1/admin/users/{id}    # Get user by ID (admin)
PUT    /api/v1/admin/users/{id}    # Update user (admin)
DELETE /api/v1/admin/users/{id}    # Delete user (admin)
GET    /api/v1/admin/users/search  # Search users (admin)
GET    /api/v1/admin/users/stats   # User statistics (admin)
GET    /api/v1/admin/users/{id}/activities # User activity log (admin)
```

---

## 📋 PLAN D'IMPLÉMENTATION SÉQUENTIEL

### Étape 1: Corriger ADMIN (0.5 jour)
- [ ] Supprimer doublons endpoints self-service
- [ ] Vérifier permission checks (require_admin)
- [ ] Tests CRUD admin

### Étape 2: Créer COMPANIES (0.5 jour)
**Tables DB** (2):
- companies
- user_company_roles

**Endpoints** (10):
```python
GET    /api/v1/companies              # List user's companies
POST   /api/v1/companies              # Create company
GET    /api/v1/companies/{id}         # Get company
PUT    /api/v1/companies/{id}         # Update company
DELETE /api/v1/companies/{id}         # Delete company
POST   /api/v1/companies/{id}/members # Add member
GET    /api/v1/companies/{id}/members # List members
DELETE /api/v1/companies/{id}/members/{user_id} # Remove member
PUT    /api/v1/companies/{id}/members/{user_id}/role # Update role
GET    /api/v1/companies/{id}/declarations # Company declarations
```

**Models**:
- CompanyCreate, CompanyUpdate, CompanyResponse
- CompanyMember, CompanyRole

### Étape 3: Créer FISCAL_SERVICES (1.5 jours)
**Tables DB** (9):
- ministries
- sectors
- categories
- fiscal_services (850 services)
- fiscal_service_data
- service_keywords
- service_document_assignments
- service_procedure_assignments
- steps_count

**Endpoints** (12):
```python
GET    /api/v1/fiscal-services              # List services (public)
GET    /api/v1/fiscal-services/{id}         # Get service (public)
POST   /api/v1/fiscal-services/search       # Advanced search
GET    /api/v1/fiscal-services/popular      # Popular services
GET    /api/v1/fiscal-services/recent       # Recent services
POST   /api/v1/fiscal-services/{id}/calculate # Calculate montant
GET    /api/v1/ministries                   # List ministries
GET    /api/v1/sectors                      # List sectors
GET    /api/v1/categories                   # List categories
POST   /api/v1/admin/fiscal-services        # Create (admin)
PUT    /api/v1/admin/fiscal-services/{id}   # Update (admin)
DELETE /api/v1/admin/fiscal-services/{id}   # Delete (admin)
```

**Services**:
- SearchService (Elasticsearch-like)
- CalculationService (montants automatiques)

### Étape 4: Compléter DECLARATIONS (1 jour)
**À ajouter au MVP existant**:

**Repositories détails**:
- DeclarationIVARepository (table: declaration_iva_details)
- DeclarationIRPFRepository (table: declaration_irpf_data)
- DeclarationPetroliferosRepository (table: declaration_petroliferos_details)
- DeclarationRetencionRepository (table: declaration_retencion_details)
- DeclarationOtherRepository (table: declaration_other_details)

**Endpoints additionnels** (19):
```python
# Calculs et validations
POST   /api/v1/declarations/{id}/calculate       # Recalculate taxes
POST   /api/v1/declarations/{id}/validate        # Validate data

# Détails spécifiques
GET    /api/v1/declarations/{id}/iva-details     # IVA details
PUT    /api/v1/declarations/{id}/iva-details     # Update IVA
GET    /api/v1/declarations/{id}/irpf-data       # IRPF data
PUT    /api/v1/declarations/{id}/irpf-data       # Update IRPF
GET    /api/v1/declarations/{id}/petroliferos    # Pétrolifères
PUT    /api/v1/declarations/{id}/petroliferos    # Update Pétrolifères

# Corrections et ajustements
POST   /api/v1/declarations/{id}/amend           # Create amendment
GET    /api/v1/declarations/{id}/amendments      # List amendments
POST   /api/v1/declarations/{id}/adjustments     # Add adjustment
GET    /api/v1/declarations/{id}/adjustments     # List adjustments

# Historique et audit
GET    /api/v1/declarations/{id}/history         # Audit trail
GET    /api/v1/declarations/{id}/corrections     # Corrections log
GET    /api/v1/declarations/{id}/calculations    # Calculation history

# Statistiques
GET    /api/v1/declarations/stats                # User statistics
POST   /api/v1/declarations/export               # Export declarations
GET    /api/v1/declarations/summary              # Summary by period
```

### Étape 5: Créer PAYMENTS (2 jours)
**Tables DB** (7):
- payments
- payment_plans
- payment_installments
- payment_receipts
- payment_lock_history
- payment_validation_audit
- webhook_payment_events

**Endpoints** (18):
```python
# Paiements
POST   /api/v1/payments                          # Initiate payment
GET    /api/v1/payments                          # List payments
GET    /api/v1/payments/{id}                     # Get payment
PUT    /api/v1/payments/{id}/cancel              # Cancel payment
GET    /api/v1/payments/{id}/status              # Check status
GET    /api/v1/payments/{id}/receipt             # Download receipt

# Plans de paiement
POST   /api/v1/payment-plans                     # Create plan
GET    /api/v1/payment-plans                     # List plans
GET    /api/v1/payment-plans/{id}                # Get plan
PUT    /api/v1/payment-plans/{id}                # Update plan
DELETE /api/v1/payment-plans/{id}                # Cancel plan
GET    /api/v1/payment-plans/{id}/installments   # List installments

# Acomptes
GET    /api/v1/installments/{id}                 # Get installment
POST   /api/v1/installments/{id}/pay             # Pay installment

# Intégration BANGE
POST   /api/v1/payments/bange/initiate           # BANGE initiation
POST   /api/v1/payments/bange/confirm            # BANGE confirmation
GET    /api/v1/payments/bange/status             # BANGE status

# Stats et exports
GET    /api/v1/payments/stats                    # Payment statistics
```

**Services**:
- PaymentService (orchestration)
- BangeService (API BANGE mobile money)
- ReceiptService (génération PDF)
- PlanService (échéanciers)

### Étape 6: Créer WEBHOOKS (1.5 jours)
**Tables DB** (2):
- webhook_events
- webhook_deliveries

**Endpoints** (10):
```python
# Webhook receiver (BANGE callbacks)
POST   /api/v1/webhooks/bange/payment            # Payment webhook
POST   /api/v1/webhooks/bange/confirmation       # Confirmation webhook

# Webhook management (admin)
GET    /api/v1/admin/webhooks/events             # List events
GET    /api/v1/admin/webhooks/events/{id}        # Get event
POST   /api/v1/admin/webhooks/events/{id}/retry  # Retry delivery
GET    /api/v1/admin/webhooks/deliveries         # List deliveries
GET    /api/v1/admin/webhooks/deliveries/{id}    # Get delivery
GET    /api/v1/admin/webhooks/stats              # Webhook stats

# Testing (dev only)
POST   /api/v1/webhooks/test                     # Test webhook
POST   /api/v1/webhooks/simulate                 # Simulate event
```

**Services**:
- WebhookProcessor (validation HMAC)
- DeliveryService (retry logic)
- SecurityService (signature validation)

---

## 📊 RÉSUMÉ IMPLÉMENTATION

### Modules Existants (6)
- ✅ AUTH
- ✅ USERS
- ✅ ADMIN (⚠️ à corriger)
- ✅ DOCUMENTS
- ✅ PERMISSIONS
- ✅ ASSIGNMENT

### Modules En Cours (1)
- ⏳ DECLARATIONS (MVP 6/25 endpoints)

### Modules À Créer (9)
1. COMPANIES (0.5j)
2. FISCAL_SERVICES (1.5j)
3. PAYMENTS (2j)
4. WEBHOOKS (1.5j)
5. AGENTS (1.5j)
6. PROCEDURES (0.5j)
7. IMPORTS (0.5j)
8. TRANSLATIONS (0.5j)
9. SYSTEM (0.5j)

**Durée totale estimée**: 9 jours (modules à créer) + 1.5 jours (compléter existants) = **10.5 jours**

---

## 🎯 PROCHAINES ACTIONS IMMÉDIATES

1. ✅ Créer ce document de planification
2. ⏸️ Corriger module ADMIN (supprimer doublons)
3. ⏸️ Créer module COMPANIES (requis par DECLARATIONS)
4. ⏸️ Créer module FISCAL_SERVICES (requis par DECLARATIONS)
5. ⏸️ Compléter module DECLARATIONS (tables détails)
6. ⏸️ Créer module PAYMENTS (CRITIQUE)
7. ⏸️ Créer module WEBHOOKS (CRITIQUE)
8. ⏸️ Continuer avec modules P2/P3/P4

**Dernière mise à jour**: 2025-11-20 17:00
**Responsable**: Claude Code (Agent Autonome)
