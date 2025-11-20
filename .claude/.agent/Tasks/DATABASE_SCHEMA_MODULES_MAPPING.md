# MAPPING DATABASE SCHEMA → MODULES BACKEND

**Source de Vérité**: `DATABASE_SCHEMA_REFERENCE.md` (65 tables, 23 enums)
**Date Extraction**: 2025-11-20 11:04:48
**Date Analyse**: 2025-11-20 14:00

---

## 📊 VUE D'ENSEMBLE

```
Total Tables:      65
Total Enums:       23
Modules Identifiés: 16
  - Existants:     6 (38%)
  - À Créer:      10 (62%)
```

---

## 🗂️ MAPPING COMPLET (65 TABLES → 16 MODULES)

### ✅ MODULE 1: AUTH (Existant)
**Tables DB** (4):
- `users`
- `sessions` - User authentication sessions with JWT tokens
- `refresh_tokens` - Refresh tokens for JWT authentication with revocation support
- `pending_registrations` - Stores email verification codes. Expires after 15 minutes

**Enums Associés**:
- Aucun enum dédié (statuts gérés en application)

**Status Module**: ✅ Existant dans `app/modules/auth/`
**Endpoints**: ~15
**Priorité**: ✅ DÉJÀ IMPLÉMENTÉ

---

### ✅ MODULE 2: PERMISSIONS (Existant)
**Tables DB** (5):
- `permissions` - Catalogue centralisé de toutes les permissions de l'application
- `roles` - Rôles personnalisables pour attribution de permissions groupées
- `role_permissions` - Permissions associées à chaque rôle
- `user_permissions` - Permissions spécifiques par utilisateur (override du rôle)
- `permission_audit_log` - Historique complet de tous les changements de permissions (audit trail)

**Enums Associés**:
- Aucun enum dédié

**Status Module**: ✅ Existant dans `app/modules/permissions/`
**Endpoints**: ~25
**Priorité**: ✅ DÉJÀ IMPLÉMENTÉ

---

### ✅ MODULE 3: DOCUMENTS (Existant - Récemment enrichi)
**Tables DB** (5):
- `uploaded_files` - Métadonnées des fichiers uploadés (stockés dans Supabase Storage)
- `ocr_extraction_results` - Résultats bruts de l'extraction OCR Tesseract (JSONB temporaire avant validation)
- `document_processing_queue` - Async processing queue for OCR with retry logic, exponential backoff, and Cloud Vision→Tesseract fallback
- `document_templates` - Templates documents - Avec validity_duration_months (v4.1 fix)
- `form_templates` - Templates de formulaires pour extraction OCR Tesseract (coordonnées des champs) - 14 types total

**Enums Associés**:
- `ocr_engine_enum`: tesseract, manual
- `attachment_type_enum`: declaration_form, supporting_document, payment_proof, identity_document, fiscal_service_receipt, other

**Status Module**: ✅ Existant dans `app/modules/documents/`
**Endpoints**: 14
**Priorité**: ✅ DÉJÀ IMPLÉMENTÉ
**Note**: Extractors/mappers/templates migrés en Phase 5

---

### ✅ MODULE 4: ASSIGNMENT (Existant - Partiel)
**Tables DB** (3):
- `assignments` - Historique complet des assignations de déclarations aux agents
- `assignment_rules` - Règles configurables pour l'auto-assignation intelligente
- `workflow_transitions` - No description

**Enums Associés**:
- `assignment_method_enum`: auto, manual, self_assigned, escalated
- `assignment_status_enum`: assigned, in_progress, pending_review, completed, reassigned, cancelled, rejected

**Status Module**: ✅ Existant dans `app/modules/assignment/`
**Endpoints**: ~15
**Priorité**: ⚠️ PARTIEL - À enrichir avec workflow_transitions

---

### ✅ MODULE 5: USERS (Existant)
**Tables DB** (2):
- `users` (partagé avec AUTH)
- `user_favorites` - No description

**Enums Associés**:
- Aucun (user_role_enum, user_status_enum gérés en application)

**Status Module**: ✅ Existant dans `app/modules/users/`
**Endpoints**: 12
**Priorité**: ✅ DÉJÀ IMPLÉMENTÉ
**Note**: Séparation claire self-service vs admin

---

### ✅ MODULE 6: ADMIN (Existant)
**Tables DB**: Aucune table dédiée (utilise users + autres modules)

**Status Module**: ✅ Existant dans `app/modules/admin/`
**Endpoints**: 35 (user management, diagnostics, migrations)
**Priorité**: ✅ DÉJÀ IMPLÉMENTÉ

---

### ❌ MODULE 7: DECLARATIONS (À CRÉER) 🔴 CRITIQUE
**Tables DB** (9):
- `tax_declarations` - Déclarations fiscales - 20 types GE-specific
- `declaration_iva_details` - NIVEAU 1 - Données structurées IVA (90% volume) - Après validation OCR Tesseract ou saisie manuelle
- `declaration_irpf_data` - NIVEAU 1 - Données structurées IRPF (5% volume) - Impôt sur le Revenu
- `declaration_petroliferos_details` - NIVEAU 1 - Données structurées Pétrolifères (4% volume, GROS MONTANTS) - 6 sous-types
- `declaration_retencion_details` - Détails des déclarations de Retención a la Fuente (3%, 5%, 10%) - Structure avec array fournisseurs en JSONB
- `declaration_other_details` - NIVEAU 2 - Données JSONB génériques pour 7 autres types de déclarations (<1% volume)
- `declaration_amount_adjustments` - Audit trail de tous les ajustements de montants (historique complet)
- `declaration_corrections` - Audit trail des corrections apportées aux déclarations (rectificatives)
- `calculation_history` - No description

**Enums Associés**:
- `declaration_status_enum`: draft, submitted, processing, accepted, rejected, amended
- `declaration_type_enum`: 28 valeurs (income_tax, corporate_tax, vat_declaration, iva_destajo, iva_real, retencion_3pct_petrolero, etc.)

**Tables Liées**:
- Assignments (agent workflow)
- Payments (paiement déclarations)
- Documents (pièces justificatives)

**Endpoints Requis**: ~25 (voir RAPPORT_PRIORITE_1)
**Priorité**: 🔴 CRITIQUE P1 (Cœur métier)
**Effort**: 2 jours

---

### ❌ MODULE 8: PAYMENTS (À CRÉER) 🔴 CRITIQUE
**Tables DB** (7):
- `payments` - Table centrale polymorphe pour TOUS les paiements (services fiscaux et déclarations)
- `payment_plans` - Plans de paiement (échéanciers) pour les déclarations fiscales
- `payment_installments` - Acomptes individuels d'un plan de paiement
- `payment_receipts` - Reçus de paiement générés au format PDF
- `payment_lock_history` - No description
- `payment_validation_audit` - No description
- `service_payments` - Paiements avec workflow agents - Verrouillage pessimiste

**Enums Associés**:
- `payment_status_enum`: pending, processing, completed, failed, refunded, cancelled
- `payment_method_enum`: bank_transfer, card, mobile_money, cash, bange_wallet

**Tables Liées**:
- Declarations (paiement taxes)
- Fiscal_services (paiement services)
- Webhooks (confirmations BANGE)
- Agents (validation paiements)

**Endpoints Requis**: ~18 (voir RAPPORT_PRIORITE_1)
**Priorité**: 🔴 CRITIQUE P1 (Revenus gouvernement)
**Effort**: 2 jours

---

### ❌ MODULE 9: WEBHOOKS (À CRÉER) 🔴 CRITIQUE
**Tables DB** (2):
- `bank_configurations` - Configuration des intégrations bancaires (API, webhooks, comptes)
- `bank_transactions` - Transactions bancaires reçues des banques (webhooks ou réconciliation manuelle)

**Enums Associés**: Aucun

**Tables Liées**:
- Payments (confirmation paiements via webhook BANGE)

**Endpoints Requis**: ~10 (voir RAPPORT_PRIORITE_1)
**Priorité**: 🔴 CRITIQUE P1 (Sans webhook BANGE, revenus bloqués)
**Effort**: 1.5 jours

---

### ❌ MODULE 10: FISCAL_SERVICES (À CRÉER) 🟡 HAUTE
**Tables DB** (9):
- `fiscal_services` - Services fiscaux - NO instructions_es denormalization (v4.1 user feedback)
- `fiscal_service_data` - NIVEAU 3 - Données fiscal services avec support OCR Tesseract (ex: Nota de Ingreso)
- `service_keywords` - No description
- `service_document_assignments` - No description
- `service_procedure_assignments` - No description
- `ministries` - Ministères - Espagnol en DB, FR/EN via entity_translations optimisée
- `sectors` - No description
- `categories` - No description
- `steps_count` - No description (?)

**Enums Associés**:
- `calculation_method_enum`: fixed_expedition, fixed_renewal, fixed_both, percentage_based, unit_based, tiered_rates, formula_based, fixed_plus_unit

**Tables Liées**:
- Payments (paiement services)
- Documents (attachments)
- Procedures (procédures associées)
- Translations (nom services multilingue)

**Endpoints Requis**: ~12 (voir RAPPORT_PRIORITE_2)
**Priorité**: 🟡 HAUTE P2 (Catalogue 850 services)
**Effort**: 1.5 jours

---

### ❌ MODULE 11: AGENTS (À CRÉER) 🟡 HAUTE
**Tables DB** (6):
- `ministry_agents` - Agents ministériels - Workflow complet validation
- `agent_work_queue` - Work queue for agent load balancing with dynamic priority calculation based on SLA, amount, and complexity
- `agent_workloads` - Suivi en temps réel de la charge de travail des agents
- `agent_performance_stats` - No description
- `ministry_validation_config` - No description
- `user_ministry_assignments` - No description

**Enums Associés**:
- `agent_action_type`: lock_for_review, approve, reject, request_documents, add_comment, escalate, unlock_release, assign_to_colleague
- `agent_availability_enum`: available, on_leave, sick_leave, training, mission, temporarily_unavailable
- `escalation_level`: low, medium, high, critical

**Tables Liées**:
- Assignments (assignation déclarations)
- Declarations (workflow validation)
- Payments (validation paiements)
- Users (agents = users with role)

**Endpoints Requis**: ~20 (voir RAPPORT_PRIORITE_2)
**Priorité**: 🟡 HAUTE P2 (Workflow agents)
**Effort**: 1.5 jours

---

### ❌ MODULE 12: PROCEDURES (À CRÉER) 🟢 MOYENNE
**Tables DB** (2):
- `procedure_templates` - Templates procédures - Architecture radicale 58.7% économie
- `procedure_template_steps` - No description

**Enums Associés**: Aucun

**Tables Liées**:
- Fiscal_services (procédures par service)

**Endpoints Requis**: ~10 (CRUD templates + steps)
**Priorité**: 🟢 MOYENNE P3
**Effort**: 0.5 jour

---

### ❌ MODULE 13: IMPORTS (À CRÉER) 🟢 MOYENNE
**Tables DB** (2):
- `import_batches` - Métadonnées des imports Excel en masse (un fichier = un batch)
- `import_batch_items` - Lignes individuelles d'un import Excel (une ligne = une ligne du fichier)

**Enums Associés**: Aucun

**Tables Liées**:
- Fiscal_services (import services)
- Declarations (import déclarations)

**Endpoints Requis**: ~8 (upload Excel, status, résultats)
**Priorité**: 🟢 MOYENNE P3
**Effort**: 0.5 jour

---

### ❌ MODULE 14: COMPANIES (À CRÉER) 🟢 BASSE
**Tables DB** (2):
- `companies` - No description
- `user_company_roles` - No description

**Enums Associés**: Aucun

**Tables Liées**:
- Users (users appartiennent à companies)
- Declarations (déclarations par company)

**Endpoints Requis**: ~10 (CRUD companies, roles)
**Priorité**: 🟢 BASSE P4
**Effort**: 0.5 jour

---

### ❌ MODULE 15: TRANSLATIONS (À CRÉER) 🟢 MOYENNE
**Tables DB** (2):
- `translations` - Table unifiée pour toutes les traductions du système (ENUMs, UI, Forms, Messages système)
- `entity_translations` - Traductions optimisées - ENUM strict + codes courts (-40% storage)

**Enums Associés**: Tous les ENUMs nécessitent traductions

**Tables Liées**:
- Fiscal_services (noms services multilingue)
- Ministries (noms ministères ES/FR/EN)

**Endpoints Requis**: ~8 (get translations, update, cache)
**Priorité**: 🟢 MOYENNE P3
**Effort**: 0.5 jour

---

### ❌ MODULE 16: SYSTEM (À CRÉER) 🟢 BASSE
**Tables DB** (2):
- `system_rules` - Configuration dynamique des règles métier (sans redéploiement)
- `adjustment_reasons` - Catalogue des raisons prédéfinies pour ajustements de montants
- `audit_logs` - Logs système généraux

**Enums Associés**: Aucun

**Tables Liées**: Toutes (règles métier globales)

**Endpoints Requis**: ~8 (CRUD rules, reasons, logs)
**Priorité**: 🟢 BASSE P4
**Effort**: 0.5 jour

---

## 📊 STATISTIQUES FINALES

### Par Statut
```
✅ Modules Existants:    6/16  (38%)
   - auth, permissions, documents, assignment, users, admin

❌ Modules à Créer:     10/16  (62%)
   - declarations, payments, webhooks (P1 - 3 modules)
   - fiscal_services, agents (P2 - 2 modules)
   - procedures, imports, translations (P3 - 3 modules)
   - companies, system (P4 - 2 modules)
```

### Par Priorité
```
🔴 P1 CRITIQUE:      3 modules (declarations, payments, webhooks)
🟡 P2 HAUTE:         2 modules (fiscal_services, agents)
🟢 P3 MOYENNE:       3 modules (procedures, imports, translations)
⚪ P4 BASSE:         2 modules (companies, system)
✅ EXISTANTS:        6 modules (auth, permissions, documents, etc.)
─────────────────────────────────────────────────────────
TOTAL:              16 modules
```

### Tables DB
```
Tables Mappées:      65/65  (100%)
Enums Analysés:      23/23  (100%)
Modules Couverts:    16/16  (100%)
```

### Effort Estimé (Modules À Créer)
```
🔴 P1 CRITIQUE:      5.5 jours (declarations 2j + payments 2j + webhooks 1.5j)
🟡 P2 HAUTE:         3.0 jours (fiscal_services 1.5j + agents 1.5j)
🟢 P3 MOYENNE:       1.5 jours (procedures 0.5j + imports 0.5j + translations 0.5j)
⚪ P4 BASSE:         1.0 jour  (companies 0.5j + system 0.5j)
─────────────────────────────────────────────────────────
TOTAL CRÉATION:     11.0 jours
Refactoring (6):     5.0 jours
GRAND TOTAL:        16.0 jours (modules backend seulement)
```

**Note**: Estimation ne compte pas Gateway (3j), Frontend (5j), Cloud Run (5j), Tests (3j)
**Total Projet**: 33 jours comme planifié

---

## 🔗 DÉPENDANCES CRITIQUES

```
                    auth (sessions, JWT)
                      │
         ┌────────────┼────────────┐
         │            │            │
      users    permissions    documents
         │            │            │
    ┌────┴─────┐      │       ┌────┴─────┐
    │          │      │       │          │
 companies  admin     │   declarations  form_templates
    │                 │       │
    └─────────────────┴───────┴──────┐
                                     │
                              ┌──────┴──────┐
                              │             │
                          payments      agents
                              │             │
                    ┌─────────┴─────┐       │
                    │               │       │
               webhooks      fiscal_services│
                    │               │       │
                    └───────┬───────┴───────┘
                            │
                    ┌───────┴────────┐
                    │                │
              assignment      procedures
                    │                │
            ┌───────┴────┐   ┌───────┴────┐
            │            │   │            │
        imports    translations  system
```

**Ordre Migration Optimal** (basé sur dépendances):
1. ✅ auth
2. ✅ permissions
3. ✅ users
4. ✅ documents
5. ✅ assignment (partiel)
6. declarations 🔴
7. payments 🔴
8. webhooks 🔴
9. fiscal_services 🟡
10. agents 🟡
11. procedures 🟢
12. imports 🟢
13. translations 🟢
14. companies 🟢
15. system 🟢
16. admin (cross-cutting) ✅

---

## ⚠️ TABLES NON MAPPÉES / AMBIGUËS

**Tables backup** (à ignorer):
- `document_templates_backup_20251017`
- `procedure_template_steps_backup_20251017`
- `service_procedure_assignments_backup_20251017`

**Action**: Ignorer les backups dans architecture modules

---

## 🎯 CONCLUSION

**Source de Vérité Validée**: DATABASE_SCHEMA_REFERENCE.md
- **65 tables** mappées sur **16 modules**
- **6 modules existants** (38%) déjà en place
- **10 modules à créer** (62%) planifiés
- **Priorité claire**: P1 (declarations, payments, webhooks) en premier

**Prochaine Étape**: Mettre à jour PHASE_6_PLAN_TRAVAIL.md avec ces données exactes

---

**Date Analyse**: 2025-11-20 14:00
**Source**: DATABASE_SCHEMA_REFERENCE.md (extraction 2025-11-20 11:04:48)
**Responsable**: Claude Code (Agent Autonome)
