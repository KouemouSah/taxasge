# BUNDLE_WORKFLOW + GLOBAL DEBUG — MASTER PLAN

**Date** : 2026-04-13
**Branche** : develop
**Déclencheur** : Bug production `POST /api/v1/bundle-workflow/initiate-payment` → 500
**Statut** : 🔴 DRAFT — EN ATTENTE VALIDATION UTILISATEUR

---

## 0. CAUSE RACINE DU BUG BLOQUANT (error1.md + bundle.png)

### Erreur
```
asyncpg.exceptions.CheckViolationError:
service_request with workflow_code BUNDLE_PAYMENT must have commercial_license_id (bundle integrity)
```

**Flux** :
1. Frontend `/dashboard/bundle-payment?wizard_session=9f1d5374b20f3c62`
2. Utilisateur sélectionne 9 obligations (236 000 XAF) + Mobile Money BANGE
3. POST `/api/v1/bundle-workflow/initiate-payment`
4. `BundleWorkflowService.initiate_payment()` (bundle_workflow_service.py:931) appelle `sr_repo.create(...)`
5. `ServiceRequestRepository.create()` (service_request_repository.py:15) **n'accepte PAS** `commercial_license_id`, `fiscal_year`, `source`
6. INSERT → trigger `fn_enforce_bundle_sr_integrity` (migration 291) → **RAISE EXCEPTION**
7. Transaction rollback → 500 → frontend toast "Request failed with status code 500"

### Contrainte violée
Migration 291 (`fn_enforce_bundle_sr_integrity`) exige pour tout SR avec `workflow_code IN ('BUNDLE_PAYMENT','FIELD_INSPECTION')` :
- `commercial_license_id IS NOT NULL`
- `fiscal_year IS NOT NULL`
- `source IN ('citizen_wizard','field_inspection')`

### Preuve que le pattern existe déjà ailleurs
`collection_service.py:140-156` (module inspections) fait un INSERT **raw** avec les 3 champs — il satisfait le trigger. **Le bundle_workflow_service, lui, passe par `sr_repo.create()` qui n'a jamais été mis à jour post-migration 291**.

### Impact production
- **100 % des BUNDLE_PAYMENT échouent à l'étape paiement** (bloquant total pour licences commerciales).
- Logs Cloud Run : erreur répétée, latence 2.6 s (temps wasted en lock + transaction rollback).
- UX : message générique Axios, pas de traduction, pas d'action de récupération.

---

## 1. RAPPORT CRITIQUE ÉLARGI — RISQUES DÉTECTÉS

Au-delà du bug principal, analyse des risques liés :

### R1. `ServiceRequestRepository.create()` est une **API centrale non alignée** avec la BD
- Colonnes manquantes à l'INSERT : `commercial_license_id`, `fiscal_year`, `source`, `bundle_id`, `zone_id`.
- Tout consommateur qui voudrait créer un SR bundle via ce repo échoue silencieusement (ici de façon bruyante, mais dans d'autres flux ça pourrait être un path inactif).
- **Risque** : future régression si un autre module (ex : chatbot agent, retry cron) crée un SR bundle via ce repo.

### R2. `BundleWorkflowService.initiate_payment()` fait un UPDATE post-INSERT qui duplique l'écriture
Lignes 970-979 : après le `create()` il fait `UPDATE service_requests SET bundle_id=$3, zone_id=$4 ...`. Avec le fix R1, ces champs doivent être insérés en un seul INSERT (atomique + évite un round-trip SQL sur le chemin critique).

### R3. `commercial_licenses.fiscal_year` — vérification type/colonne nécessaire
Le trigger exige `NEW.fiscal_year IS NOT NULL` sur `service_requests`. Le bundle service a `license_row["bundle_id"]` et `license_row["zone_id"]`, mais il faut vérifier que `license_row` possède `fiscal_year` (ou qu'il faut le dériver du `bundle_id` ou de l'année courante). **À interroger en BD avant d'écrire le fix**.

### R4. Gestion d'erreur frontend — "Request failed with status code 500"
- Le frontend affiche un toast générique pour 500, sans mapper `CheckViolationError` vers un code métier.
- Le backend `initiate-payment` catch `ValueError` → HTTPException mappée, mais **ne catche pas `asyncpg.CheckViolationError`** → remonte en 500 brut.
- **Risque OWASP A09 (logging/monitoring)** : stack trace exposée potentiellement (à vérifier côté `global_exception_handler`).

### R5. Unique partial index `idx_sr_commercial_license_unique`
Migration 291 installe un unique partial index sur `commercial_license_id` (non nul). **Problème** : si le 1er `initiate_payment` d'un user crée un SR bundle OK, puis échec paiement BANGE, puis retry → `UniqueViolationError`. Le bundle service **ne gère pas ce cas** (collection_service.py le gère, lignes 157-167).

### R6. Lock ordering — conformité CLAUDE.md
CLAUDE.md impose l'ordre : `commercial_licenses FOR UPDATE` → `service_requests` (INSERT optimistic) → `license_obligations` (UPDATE) → `service_payments` (INSERT).
Le code actuel (lignes 857-860) utilise `FOR UPDATE NOWAIT` → bon. Mais il **manque** :
- `SET LOCAL lock_timeout = '3s'; SET LOCAL statement_timeout = '5s';` en début de transaction (exigence CLAUDE.md explicite).
- Recovery `UniqueViolationError` sur le INSERT service_requests (cf R5).

### R7. Absence de test d'intégration bundle E2E
Aucun test ne couvre `initiate_payment()` avec un vrai trigger BD. Le bug aurait été attrapé par un test pytest qui INSERT un SR bundle via `sr_repo.create()` et vérifie le trigger. Couverture à créer.

### R8. Frontend / Backend — alignement des codes d'erreur
`bundle_workflow_routes.py` expose un dictionnaire `_error_messages` avec codes i18n (es/fr/en). **Aucune entrée pour les erreurs DB** (`BUNDLE_INTEGRITY_ERROR`, `PAYMENT_RACE_CONDITION`, `DATABASE_CONSTRAINT`). Le frontend reçoit un 500 brut → pas de traduction.

### R9. Transaction imbriquée — `async with db.transaction()` + `initiate_payment()`
Le routes.py wrappe déjà `initiate_payment()` dans `db.transaction()`. Le service utilise `conn` directement. Si le service ouvre un sous-bloc `async with conn.transaction():`, c'est un savepoint — vérifier qu'il n'y a pas de double-commit / rollback confusion.

### R10. `source` column — default value
La colonne `source` doit valoir `'citizen_wizard'` pour un bundle payment. Si `DEFAULT 'citizen_wizard'` existe en BD, un INSERT sans `source` marche. **À vérifier en BD** — ne JAMAIS présumer d'un default.

---

## 2. PORTÉE DÉBOGAGE GLOBALE (extensions demandées par l'utilisateur)

L'utilisateur a demandé : "detecter tout types de bugs de l'application crash silencieux, erreur non gérées, alignement frontend - backend - db".

Scope étendu (audit systématique en plus du fix ciblé) :

### A. Bundle Workflow (critique — ce bug)
- Fix INSERT service_requests
- Test unitaire + intégration
- Guardrails (exception handling)
- Update i18n erreurs

### B. Audit FIELD_INSPECTION (risque miroir)
- `collection_service.py` est OK (INSERT raw)
- Vérifier qu'aucun **autre** call site ne crée de FIELD_INSPECTION via `sr_repo.create()`

### C. Audit global `ServiceRequestRepository.create()` callers
- Lister tous les consommateurs de ce repo
- Vérifier qu'aucun ne va casser le trigger bundle integrity
- Harmoniser le repo pour accepter TOUS les champs optionnels (fiscal_year, source, bundle_id, zone_id, commercial_license_id)

### D. Audit `global_exception_handler` + exposition stack trace
- Vérifier que `app.main:global_exception_handler:357` ne leak PAS la stack en production
- Ajouter mapping `asyncpg.exceptions.CheckViolationError` → 422/409 métier

### E. Audit frontend — toasts & récupération d'erreur
- `bundle-payment` page : gérer les codes métier (PAYMENT_ALREADY_IN_PROGRESS, LICENSE_NOT_PAYABLE, BUNDLE_INTEGRITY, etc.)
- Retry button + CTA support
- i18n complet (es/fr/en)

### F. Alignement BD — contraintes, triggers, index
- Lister toutes les CHECK contraintes / triggers enforcement sur tables core (service_requests, service_payments, commercial_licenses)
- Vérifier que tous les repos insèrent en cohérence

### G. Sécurité OWASP (Top 10, 2021)
- A01 Broken access control : bundle-payment doit vérifier que le user est owner de la company
- A03 Injection : paramétrisation (déjà OK asyncpg)
- A04 Insecure design : lock timeouts absents (R6)
- A05 Security misconfig : CORS, headers, CSP déjà OK (vu en code)
- A09 Security logging : pas de leak stack trace en prod
- A07 Identification/auth : JWT + 2FA en place

### H. Performance 1M+ users
- Indexes sur `service_requests.commercial_license_id` → déjà partial (migration 291) ✓
- Lock timeouts manquants (R6)
- Cache warmup sur licences actives (pas dans scope de cette session)

---

## 3. PLAN GÉNÉRAL PAR PHASES

Chaque phase est **atomique** : plan détaillé → implémentation → tests → critique → commit local. **Push uniquement après validation globale de toutes les phases** (règle mémoire #14).

### 🔴 PHASE 1 — FIX BUG BLOQUANT (PRIORITÉ MAXIMALE)
**Objectif** : Restaurer le flux bundle-payment en production.
**Temps** : ~2 h
**Plan détaillé** : à rédiger dans `BUNDLE_DEBUG_PHASE1_PLAN.md` AVANT implémentation

**Checklist** :
- [ ] Interroger BD : `commercial_licenses` colonnes (fiscal_year existe ?), `service_requests.source` default, unique index name
- [ ] Étendre `ServiceRequestRepository.create()` avec `commercial_license_id`, `fiscal_year`, `source`, `bundle_id`, `zone_id` (optional)
- [ ] Mettre à jour `bundle_workflow_service.initiate_payment()` pour passer ces champs
- [ ] Supprimer l'UPDATE redondant post-INSERT (lignes 970-979) pour `bundle_id`/`zone_id`
- [ ] Ajouter try/except `asyncpg.UniqueViolationError` + recovery déterministe (pattern collection_service.py)
- [ ] Ajouter `SET LOCAL lock_timeout` + `statement_timeout` en début de transaction
- [ ] Catch `asyncpg.CheckViolationError` → raise `ValueError("BUNDLE_INTEGRITY_ERROR")`
- [ ] Ajouter entrées i18n dans `_error_messages` (es/fr/en)
- [ ] Tester en local avec Odoo python + pytest

**Tests de validation** :
- [ ] Test unitaire repo : `create()` avec commercial_license_id → succès
- [ ] Test unitaire repo : `create()` BUNDLE_PAYMENT sans commercial_license_id → ValueError clair
- [ ] Test d'intégration bundle : flux complet sélection → initiate-payment → pending
- [ ] Test de race : 2 calls concurrents → 1 succès + 1 PAYMENT_ALREADY_IN_PROGRESS
- [ ] Lint mypy + flake8 + black clean

**Commit local** : `fix(bundle-workflow): INSERT commercial_license_id+fiscal_year+source (trigger 291)`

---

### 🟠 PHASE 2 — AUDIT CALL SITES sr_repo.create() + harmonisation
**Objectif** : Empêcher toute future régression du trigger 291.
**Temps** : ~2 h
**Plan détaillé** : `BUNDLE_DEBUG_PHASE2_PLAN.md`

**Checklist** :
- [ ] Grep exhaustif de tous les callers `ServiceRequestRepository.create()` ou INSERT raw dans service_requests
- [ ] Matrice : workflow_code × champs passés × conformité trigger
- [ ] Vérifier cohérence avec migration 291 (bundle/field vs non-bundle)
- [ ] Rajouter garde défensive dans `create()` : si workflow_code in {BUNDLE_PAYMENT, FIELD_INSPECTION} et commercial_license_id None → raise immédiat (fail fast, message clair, avant d'atteindre le trigger)
- [ ] Documenter le repo avec docstring explicite

**Tests** :
- [ ] Test paramétrisé de tous les workflow_codes
- [ ] Test fail fast garde défensive

**Commit local** : `refactor(service-requests): harmonize create() with bundle integrity trigger`

---

### 🟡 PHASE 3 — FRONTEND ALIGNMENT (bundle-payment page)
**Objectif** : UX intuitive, messages actionables, i18n complet.
**Temps** : ~2.5 h
**Plan détaillé** : `BUNDLE_DEBUG_PHASE3_PLAN.md`

**Checklist** :
- [ ] Mapper tous les codes d'erreur bundle → messages i18n (es/fr/en)
- [ ] Toasts actionables (retry, support, back)
- [ ] Loading states + disable bouton pendant requête
- [ ] Gérer le cas `PAYMENT_ALREADY_IN_PROGRESS` (polling ou lien vers SR existante)
- [ ] Gérer le cas `LICENSE_NOT_PAYABLE` (redirection vers statut licence)
- [ ] Retry automatique sur erreur réseau (pas sur erreurs métier)
- [ ] Test E2E Playwright du flux complet

**Tests** :
- [ ] E2E : flux nominal
- [ ] E2E : erreur serveur → toast + retry
- [ ] E2E : erreur métier → toast + CTA
- [ ] i18n en 3 langues

**Commit local** : `feat(bundle-payment-ui): error handling + i18n + retry UX`

---

### 🟡 PHASE 4 — GLOBAL EXCEPTION HANDLER + OBSERVABILITÉ
**Objectif** : Plus aucun 500 brut ; tous les CheckViolation/UniqueViolation mappés.
**Temps** : ~1.5 h
**Plan détaillé** : `BUNDLE_DEBUG_PHASE4_PLAN.md`

**Checklist** :
- [ ] Relire `app/main.py:global_exception_handler`
- [ ] Ajouter mapping asyncpg exceptions → HTTPException (409/422 selon cas)
- [ ] Vérifier que la stack trace N'EST PAS exposée au client en production
- [ ] Logger structuré avec correlation ID
- [ ] Ajouter metrics Prometheus sur erreurs DB (rate de CheckViolation par minute)

**Tests** :
- [ ] Test que global handler transforme CheckViolationError → 422 avec code métier
- [ ] Test que UniqueViolationError → 409
- [ ] Test qu'en prod le client ne voit pas la stack

**Commit local** : `feat(observability): map DB exceptions + structured errors`

---

### 🟢 PHASE 5 — AUDIT SÉCURITÉ + PERFORMANCE 1M+
**Objectif** : OWASP Top 10 + prépa montée en charge.
**Temps** : ~2 h
**Plan détaillé** : `BUNDLE_DEBUG_PHASE5_PLAN.md`

**Checklist** :
- [ ] Vérif `get_current_user` + autorisation company ownership sur chaque endpoint bundle
- [ ] Lock timeouts déployés partout dans le chemin bundle critique
- [ ] Rate limiting endpoint `initiate-payment` (prévenir DoS + duplicate requests)
- [ ] Indexes vérifiés (BD réelle, pas schema doc)
- [ ] Tests de charge lock contention (100 users concurrents)

**Tests** :
- [ ] pytest concurrent fake-load
- [ ] Audit logs auth

**Commit local** : `feat(security): rate limit + owner guard + lock timeouts (bundle)`

---

### 🔵 PHASE 6 — CRITIQUE GLOBALE + VALIDATION UTILISATEUR
**Objectif** : Revue croisée des 5 phases, auto-critique, corrections, puis push.
**Temps** : ~1 h
**Actions** :
- [ ] Relire tous les diffs des 5 commits
- [ ] Vérifier que chaque règle utilisateur a été respectée (pas de hardcode, pas de placeholder, BD réelle, etc.)
- [ ] Rapport final + screenshots des tests
- [ ] **Demander confirmation explicite utilisateur** (règle mémoire #13)
- [ ] `git push` vers `develop`
- [ ] Monitorer GitHub Actions jusqu'au vert

---

## 4. QUESTIONS OUVERTES À TRAITER AVANT PHASE 1

Ces points doivent être résolus par **interrogation BD directe** (règle utilisateur #12) avant d'écrire du code :

1. **commercial_licenses a-t-elle une colonne `fiscal_year` ?** Si non, d'où tire-t-on la valeur (bundles.fiscal_year ? année courante ?) ?
2. **service_requests.source a-t-elle un DEFAULT ?** Si oui lequel ?
3. **Le nom exact de l'index unique partial sur commercial_license_id** (pour UniqueViolationError recovery)
4. **Les autres colonnes NOT NULL sur service_requests** que `create()` ignore actuellement
5. **Y a-t-il d'autres triggers** sur service_requests (INSERT/UPDATE) qui pourraient empêcher l'INSERT ?

## 5. RÈGLES À RESPECTER (rappel)

- ✅ Pas de `cloud build` manuel → GitHub Actions
- ✅ Python Odoo : `C:\Program Files\Odoo 17\python\python.exe`
- ✅ Interroger BD directement (pas de schema doc)
- ✅ Pas de placeholders, pas de hardcode
- ✅ Challenger les suggestions
- ✅ Commits locaux par phase, push après validation globale
- ✅ Demander confirmation avant push
- ✅ Pensée 1M+ users, OWASP, UI intuitive

---

## 6. PROCHAINE ÉTAPE

⏳ **En attente validation utilisateur** de ce plan général.
Après validation → rédaction de `BUNDLE_DEBUG_PHASE1_PLAN.md` (plan détaillé Phase 1) AVANT implémentation.
