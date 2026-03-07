# Plan: Workflow Code Production Hardening

## Statut: Phase 1 COMPLÉTÉE, Phases 2-5 planifiées

---

## Phase 1: Résolution & Contraintes (COMPLÉTÉ)

### 1a. Auto-résolution dynamique ✅
- Base class `PredefinedWorkflow`: `get_all_workflow_codes()`, `get_workflow_code_for_subtype()`, `_subtype_code_aliases`
- Suffix/prefix matching automatique (95% des cas sans code)
- Aliases pour cas sémantiques (VENCIMIENTO→RENOVACION, SALIDA_VENCIDO, EXPEDICION)
- `resolve_workflow_code()` centralisé dans `workflow_engine.py`
- 49 tests (25 résolutions + 10 engine + 8 edge cases + 6 contrat base class)

### 1b. Contraintes Python (Pydantic) ✅
- `@field_validator("workflow_code")` sur `WizardSessionCreate`, `ServiceRequestCreate`, `BatchRequestCreate`
- Valide contre `workflow_engine.get_workflow_by_string()` au niveau Pydantic
- Normalise en UPPER automatiquement

### 1c. Cleanup hasattr ✅
- 8 occurrences → 0 dans 5 fichiers

### 1d. Traductions i18n ✅
- `workflowNames` réécrit dans es.json, en.json, fr.json (35 codes × 3 langues = 105 traductions)
- Codes legacy supprimés (PASAPORTE_ORDINARIO, CONTRATO_LABORAL, etc.)

### 1e. Migration 183 (À EXÉCUTER via Supabase SQL Editor)
- `app_migrations` — tracking des migrations
- `valid_workflow_codes` — table référence admin-manageable
- FK constraint `fk_sr_valid_workflow_code`
- Trigger `trg_resolve_workflow_code` — safety net DB
- Fichier: `packages/backend/database/migrations/183_workflow_code_production_hardening.sql`

---

## Phase 2: Admin UI pour `valid_workflow_codes` (P1)

### Objectif
Permettre aux admins d'ajouter/désactiver des workflow_codes depuis l'UI web sans SQL.

### Backend
- [ ] `GET /admin/workflow-codes` — Liste tous les codes avec base_code, resolution_key, is_active
- [ ] `POST /admin/workflow-codes` — Ajouter un nouveau code (validation: pas de doublon, base_code existe si spécifié)
- [ ] `PUT /admin/workflow-codes/{code}` — Modifier (is_active, resolution_key)
- [ ] `DELETE /admin/workflow-codes/{code}` — Soft-delete (is_active=false), interdit si des service_requests l'utilisent
- [ ] Permission: `admin.manage_workflow_codes`

### Frontend
- [ ] Page `/admin/workflow-codes` — Table avec colonnes: Code, Base Code, Resolution Key, Active, Actions
- [ ] Formulaire d'ajout/modification avec validation
- [ ] Badge count des service_requests par code
- [ ] Filtre: Actif/Inactif, par famille (PASAPORTE, CONDUCIR, etc.)

### Validation
- [ ] Test: ajouter un code, vérifier qu'il apparaît dans les filtres agent
- [ ] Test: désactiver un code, vérifier que la FK bloque les nouveaux inserts

---

## Phase 3: Workflow Names Dynamiques (P1)

### Objectif
Remplacer les traductions statiques `workflowNames` dans les fichiers JSON par des labels dynamiques servis par le backend.

### Backend
- [ ] Ajouter colonnes `name_es`, `name_fr`, `name_en` à `valid_workflow_codes`
- [ ] Seeder: remplir depuis les traductions actuelles (105 valeurs)
- [ ] `GET /api/v1/service-requests/workflow-labels?lang=es` — Retourne `{code: label}` pour tous les codes actifs
- [ ] Cache Redis 1h (invalidé sur modification admin)

### Frontend
- [ ] `WorkflowLabelsProvider` — Context React, fetch au login, expose `getWorkflowLabel(code)`
- [ ] Hook `useWorkflowLabel(code)` — Retourne le label traduit
- [ ] Migrer les 12 usages de `t('workflowNames.XXX')`:
  - [ ] `supervisor/team/agents/page.tsx` (2 usages)
  - [ ] `agent/treasury/validation/[paymentId]/page.tsx` (2 usages)
  - [ ] `agent/treasury/validation/page.tsx` (2 usages)
  - [ ] `supervisor/escalations/resolved/page.tsx` (2 usages)
  - [ ] `supervisor/escalations/pending/page.tsx` (2 usages)
  - [ ] `treasury/components/PaymentDetailPanel.tsx` (2 usages)
- [ ] Fallback: si le label dynamique n'est pas chargé, utiliser `formatWorkflowCode()` (title-case du code)
- [ ] Supprimer la section `workflowNames` des fichiers JSON (une fois tous les usages migrés)

### Admin UI
- [ ] Colonnes name_es/fr/en éditables dans la page Phase 2
- [ ] Preview: affichage inline du label dans chaque langue

---

## Phase 4: CRON Sanity Check (P2)

### Objectif
Détecter automatiquement les incohérences de données (orphelins, codes manquants).

### Backend
- [ ] `POST /cron/workflow-integrity-check` — Cloud Scheduler quotidien
- [ ] Checks:
  1. service_requests avec workflow_code absent de valid_workflow_codes
  2. service_requests avec workflow_code absent de entities.workflow_codes
  3. valid_workflow_codes sans display_config correspondant
  4. valid_workflow_codes sans workflow_menu_mapping correspondant
  5. Base codes non résolus (PASAPORTE_NUEVO avec motivo != null)
- [ ] Si anomalies: email consolidé aux admins + log dans audit_logs
- [ ] Dashboard widget: badge "X anomalies" dans admin overview

### Migration
- [ ] Migration 184: rien (endpoint only)

---

## Phase 5: Migration Framework (P3 — prochain trimestre)

### Objectif
Remplacer les 196 fichiers SQL manuels par un framework automatisé.

### Options évaluées
| Framework | Avantage | Inconvénient |
|-----------|----------|--------------|
| Alembic | Python natif, intégré FastAPI | Lourd pour SQL pur |
| Flyway | Standard entreprise, Java | Dépendance JVM |
| **Custom léger** | Adapté à notre stack | Maintenance interne |
| dbmate | Go binary, simple | Pas d'introspection Python |

### Architecture proposée (Custom léger)
- [ ] Table `app_migrations` (déjà créée en Phase 1)
- [ ] Script `migrate.py` avec:
  - Scan du dossier `database/migrations/`
  - Extraction du numéro de version depuis le nom de fichier
  - Vérification against `app_migrations`
  - Exécution séquentielle des migrations non appliquées
  - Transaction par migration (rollback automatique si erreur)
  - Logging dans `app_migrations` (checksum SHA-256, durée, applied_by)
- [ ] CLI: `python migrate.py --dry-run`, `python migrate.py --up`, `python migrate.py --status`
- [ ] Intégration CI: step dans GitHub Actions avant deploy backend
- [ ] Startup hook: option auto-migrate au démarrage de l'app

### Backfill
- [ ] Script one-shot pour enregistrer les 196 migrations existantes dans `app_migrations`

---

## Fichiers modifiés (Phase 1)

| Fichier | Modification |
|---------|-------------|
| `workflow_interface.py` | Base class defaults + auto-resolution + cleanup hasattr |
| `workflow_engine.py` | `resolve_workflow_code()` partagé + robustifié |
| `wizard_session_service.py` | Import + appel resolve |
| `batch_persist_service.py` | Import + appel resolve |
| `pasaporte_workflow_v2.py` | `_subtype_code_aliases` (VENCIMIENTO) |
| `conducir_workflow.py` | Supprimé override explicite |
| `contrato_workflow.py` | Supprimé override explicite |
| `tramites_visado_workflow.py` | `_subtype_code_aliases` (SALIDA_VENCIDO) |
| `residencia_workflow.py` | `_subtype_code_aliases` (EXPEDICION) |
| `service_request_repository.py` | Cleanup hasattr |
| `menu_config_service.py` | Cleanup hasattr |
| `display_config_repository.py` | Cleanup hasattr |
| `workflow_sync_service.py` | Cleanup hasattr + restructure |
| `wizard_session.py` | Pydantic `@field_validator` |
| `service_request.py` | Pydantic `@field_validator` |
| `batch_request.py` | Pydantic `@field_validator` |
| `RequestListItem.tsx` | Generic formatWorkflowLabel |
| `es.json` / `en.json` / `fr.json` | workflowNames 35 codes × 3 langues |
| `183_*.sql` | NOUVEAU — tracking + FK + trigger |
