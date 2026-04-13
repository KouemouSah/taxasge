# PHASE 1 — FIX BUG BLOQUANT BUNDLE-PAYMENT

**Master plan** : `BUNDLE_DEBUG_MASTER_PLAN_2026_04_13.md`
**Date** : 2026-04-13
**Priorité** : 🔴 CRITIQUE — bloquant production
**Temps estimé** : ~2 h
**Statut** : 🔵 EN COURS — implémentation

---

## 1. DONNÉES BD CONFIRMÉES (script `scripts/debug_bundle_p1_db_probe.py`)

### commercial_licenses
```
id, company_id, service_request_id, bundle_id, zone_id, city_id,
fiscal_year (INT NOT NULL),  ← confirmé présent
processing_mode, total_amount, ..., status
```

### service_requests — colonnes cibles
| Colonne | Nullable | Default | Action repo actuelle |
|---|---|---|---|
| `commercial_license_id` | YES | — | ❌ non passé |
| `fiscal_year` | YES | — | ❌ non passé |
| `source` | NO | `'citizen_wizard'` | ✅ default OK |
| `bundle_id` | YES | — | ❌ non passé (UPDATE post-INSERT actuel) |
| `zone_id` | YES | — | ❌ non passé (UPDATE post-INSERT actuel) |
| `reference` | NO | — (trigger) | ✅ `trg_sr_auto_reference` gère |

### Triggers sur service_requests (7)
1. `trg_sr_auto_reference` (BEFORE INSERT) — auto-génère reference
2. `trg_resolve_workflow_code` (BEFORE INSERT) — résout workflow_code
3. `trg_enforce_bundle_sr_integrity` (BEFORE INSERT/UPDATE) — **notre blocker**
4. `trg_sync_license_sr_id` (AFTER INSERT/UPDATE) — 🔥 **met déjà à jour commercial_licenses.service_request_id** → UPDATE manuel redondant lignes 962-968
5. `trg_sr_updated_at`, `trg_auto_submitted_at` (UPDATE) — horodatage

### Trigger bundle integrity (corps exact)
```sql
IF NEW.workflow_code IN ('BUNDLE_PAYMENT','FIELD_INSPECTION') THEN
    IF NEW.commercial_license_id IS NULL THEN RAISE 'must have commercial_license_id';
    IF NEW.fiscal_year IS NULL THEN RAISE 'must have fiscal_year';
    IF NEW.source NOT IN ('citizen_wizard','field_inspection') THEN RAISE 'source must be ...';
END IF;
```

### État production
- **0 row** dans `service_requests WHERE workflow_code IN ('BUNDLE_PAYMENT','FIELD_INSPECTION')` → aucun bundle n'a jamais abouti.
- Impact confirmé : **100 % bloquant**.

---

## 2. DESIGN DE LA SOLUTION

### 2.1. Principe
- Étendre `ServiceRequestRepository.create()` pour accepter 4 nouveaux paramètres optionnels :
  `commercial_license_id`, `fiscal_year`, `bundle_id`, `zone_id`.
- `source` garde son default BD (pas besoin de le passer pour BUNDLE_PAYMENT côté citoyen).
- `BundleWorkflowService.initiate_payment()` passe ces 4 valeurs depuis `license_row`.
- Supprimer l'UPDATE manuel `commercial_licenses SET service_request_id` (redondant : le trigger `trg_sync_license_sr_id` s'en charge).
- Supprimer l'UPDATE redondant `service_requests SET bundle_id, zone_id` (maintenant insérés en un coup).
- Conserver l'UPDATE `service_requests SET total_amount, base_amount, status='SUBMITTED', submitted_at`.
- Ajouter recovery `asyncpg.UniqueViolationError` sur l'INSERT (retry détérministe : si une SR existe déjà pour cette license, la réutiliser OU raise PAYMENT_ALREADY_IN_PROGRESS).
- Ajouter `SET LOCAL lock_timeout = '3s'; SET LOCAL statement_timeout = '5s';` au début de la transaction (exigence CLAUDE.md).
- Ajouter mapping `asyncpg.CheckViolationError` → `ValueError("BUNDLE_INTEGRITY_ERROR")` (garde défensive).

### 2.2. Diff cible

**`service_request_repository.py`**
- `create()` : +4 params optionnels, INSERT étendu (12 colonnes explicites au lieu de 11).
- Validation fail-fast : si `workflow_code IN (BUNDLE_PAYMENT, FIELD_INSPECTION)` et `commercial_license_id is None` → raise `ValueError("BUNDLE_SR_MISSING_LICENSE_ID")`.
- Validation : si `workflow_code IN (...)` et `fiscal_year is None` → raise `ValueError("BUNDLE_SR_MISSING_FISCAL_YEAR")`.

**`bundle_workflow_service.py`**
- `initiate_payment()` :
  - Début transaction : `SET LOCAL lock_timeout ... statement_timeout ...`
  - `sr_repo.create()` : ajouter `commercial_license_id=license_id, fiscal_year=license_row["fiscal_year"], bundle_id=license_row["bundle_id"], zone_id=license_row["zone_id"]`
  - Supprimer UPDATE `commercial_licenses SET service_request_id` (lignes 962-968) — redondant avec trigger
  - Modifier UPDATE `service_requests SET total_amount, base_amount, status='SUBMITTED', submitted_at` — retirer `bundle_id`, `zone_id` (déjà insérés)
  - Wrap try/except `asyncpg.UniqueViolationError` + `CheckViolationError` → ValueError métier

**`bundle_workflow_routes.py`**
- Dict `_error_messages` : ajouter `BUNDLE_SR_MISSING_LICENSE_ID`, `BUNDLE_SR_MISSING_FISCAL_YEAR`, `BUNDLE_INTEGRITY_ERROR`, `DATABASE_CONSTRAINT_VIOLATION` (es/fr/en).
- Fonction `_error_status()` : mapping codes → 422/409.

### 2.3. Ce qu'on NE touche PAS (rester minimal)
- Pas de refactor du flux obligations (Phase 2+)
- Pas de refactor des service_payments (Phase 2+)
- Pas de refactor frontend (Phase 3)
- Pas de refactor global exception handler (Phase 4)

---

## 3. CHECKLIST D'IMPLÉMENTATION

### 3.1 — Code backend
- [ ] Étendre `ServiceRequestRepository.create()` signature (+4 params)
- [ ] Étendre INSERT SQL (+4 colonnes explicites)
- [ ] Ajouter garde fail-fast bundle integrity
- [ ] Docstring mise à jour
- [ ] `BundleWorkflowService.initiate_payment()` — passer les 4 nouveaux params
- [ ] `BundleWorkflowService.initiate_payment()` — ajouter lock_timeout/statement_timeout
- [ ] `BundleWorkflowService.initiate_payment()` — supprimer UPDATE redondant commercial_licenses
- [ ] `BundleWorkflowService.initiate_payment()` — simplifier UPDATE service_requests (retirer bundle_id/zone_id)
- [ ] `BundleWorkflowService.initiate_payment()` — try/except UniqueViolationError / CheckViolationError
- [ ] `bundle_workflow_routes.py` — ajouter codes i18n (es/fr/en)
- [ ] `bundle_workflow_routes.py` — `_error_status()` mapping

### 3.2 — Tests
- [ ] Test unitaire repo `create()` avec les 4 nouveaux params → succès
- [ ] Test unitaire repo `create()` BUNDLE_PAYMENT sans license_id → `ValueError("BUNDLE_SR_MISSING_LICENSE_ID")`
- [ ] Test unitaire repo `create()` BUNDLE_PAYMENT sans fiscal_year → `ValueError("BUNDLE_SR_MISSING_FISCAL_YEAR")`
- [ ] Test unitaire repo `create()` non-bundle (RESIDENCIA) sans license_id → succès (pas de garde)
- [ ] Test d'intégration `bundle_workflow_service.initiate_payment()` — happy path mobile_money
- [ ] Test d'intégration — double call concurrent → 1 succès + 1 `PAYMENT_ALREADY_IN_PROGRESS` ou équivalent
- [ ] Test d'intégration — lock_timeout dépassé → ValueError clair

### 3.3 — Lint + type check
- [ ] `black app/modules/service_requests/repositories/service_request_repository.py`
- [ ] `black app/modules/fiscal_services/services/bundle_workflow_service.py`
- [ ] `black app/modules/fiscal_services/api/bundle_workflow_routes.py`
- [ ] `isort` sur les 3 fichiers
- [ ] `flake8 --max-line-length=100` sur les 3 fichiers
- [ ] `mypy app/modules/fiscal_services/services/bundle_workflow_service.py --strict`

### 3.4 — Auto-critique
- [ ] Relire le diff complet
- [ ] Vérifier qu'aucun autre call site de `sr_repo.create()` n'est cassé (signature rétrocompatible)
- [ ] Vérifier que la suppression de l'UPDATE `commercial_licenses` ne casse pas un autre test
- [ ] Vérifier qu'aucun hardcode n'a été introduit
- [ ] Vérifier que la gestion d'erreur Pydantic-v2 est respectée

### 3.5 — Commit local
- [ ] `git status` + `git diff` review
- [ ] Commit message : `fix(bundle-workflow): INSERT commercial_license_id+fiscal_year (trigger 291) + lock timeouts + error mapping`

---

## 4. CRITÈRES DE VALIDATION PHASE 1

La phase est validée si :
1. ✅ Les 6 tests unitaires/intégration passent
2. ✅ Lint + mypy clean
3. ✅ Aucun call site existant de `sr_repo.create()` cassé (rétrocompat)
4. ✅ L'UPDATE redondant commercial_licenses est supprimé (vérifié par trigger test)
5. ✅ Une exécution manuelle du script `scripts/debug_bundle_p1_db_probe.py` post-fix montre que le flux peut être répété

---

## 5. RISQUES IDENTIFIÉS POUR PHASE 1

### R-P1-1 : Signature backward compat
Les 4 nouveaux params sont `Optional` avec default `None`. **Risque** : un appelant existant qui appelle `create()` en kwargs ne voit rien changer. **Mitigation** : tous les nouveaux params en keyword-only.

### R-P1-2 : Test DB state pollution
Les tests d'intégration vont écrire en BD. **Mitigation** : wrapper chaque test dans une transaction rollback (fixture pytest standard).

### R-P1-3 : Trigger `trg_sync_license_sr_id` race avec UPDATE manuel supprimé
Le trigger AFTER INSERT met à jour `commercial_licenses.service_request_id`. **Avant** : l'UPDATE manuel faisait la même chose + `processing_mode + updated_at`. **Après fix** : le trigger ne met à jour QUE `service_request_id + updated_at`. **processing_mode n'est pas mis à jour** ! → il faut conserver l'UPDATE **partiel** pour `processing_mode` OU retirer `processing_mode` de l'UPDATE entièrement (a-t-il une autre source ?).

**Action** : Vérifier le flux — `processing_mode` doit-il être sur `commercial_licenses` ou sur `service_requests` ?
**Hypothèse** : la licence a déjà `processing_mode` avec default `'per_line'` et il peut être mis à jour ici pour refléter le choix utilisateur (`all_at_once` vs `per_line`). Donc **conserver un UPDATE partiel** limité à `processing_mode + updated_at`.

### R-P1-4 : Test sans BD locale
Je n'ai pas confirmé qu'un environnement de test local existe. **Mitigation** : exécuter les tests via le connection string staging (.env) en mode transactionnel rollback uniquement.

---

## 6. ORDRE D'EXÉCUTION

1. **Étape 1** — Lire tous les call sites de `sr_repo.create()` pour confirmer rétrocompat
2. **Étape 2** — Modifier `service_request_repository.py` (+ tests unitaires)
3. **Étape 3** — Modifier `bundle_workflow_service.py`
4. **Étape 4** — Modifier `bundle_workflow_routes.py` (error messages)
5. **Étape 5** — Tests d'intégration
6. **Étape 6** — Lint + mypy + auto-critique
7. **Étape 7** — Commit local (pas de push)
8. **Étape 8** — Passer à Phase 2

---

## 7. PROCHAINE ÉTAPE

Exécution immédiate de l'Étape 1 (grep call sites) pour valider la rétrocompat, puis implémentation.
